#!/usr/bin/env node
/**
 * Lint + type-check hook shared by Claude Code (.claude/settings.json) and Codex (.codex/hooks.json).
 *
 * Usage: node .agents/hooks/quality-gate.mjs <post-edit|stop>
 *
 * - post-edit: runs `oxlint --fix` and `oxfmt` on the files the agent just edited,
 *   then reports remaining lint errors back to the agent.
 * - stop: when source files changed, runs `oxlint` and `tsc` on the whole project
 *   and asks the agent to fix the errors before finishing.
 *
 * Both tools read the hook payload as JSON on stdin and accept
 * `{"decision": "block", "reason": "..."}` as JSON on stdout.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const BIN = resolve(ROOT, "node_modules/.bin");
const LINTABLE = /\.(?:[cm]?[jt]sx?)$/;
const FORMATTABLE = /\.(?:[cm]?[jt]sx?|json|ya?ml|md|vue)$/;
const MAX_OUTPUT = 6000;

function readPayload() {
  try {
    const raw = readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function respond(output = {}) {
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

function block(reason) {
  respond({ decision: "block", reason });
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" } });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();

  return { ok: result.status === 0, output: output.length > MAX_OUTPUT ? `${output.slice(0, MAX_OUTPUT)}\n… (truncated)` : output };
}

function toProjectFile(file) {
  const abs = isAbsolute(file) ? file : resolve(ROOT, file);
  const rel = relative(ROOT, abs);

  if (rel.startsWith("..") || rel.split(/[\\/]/).includes("node_modules") || !existsSync(abs)) {
    return null;
  }

  return rel;
}

/**
 * Claude Code: tool_input.file_path (Edit, Write, MultiEdit).
 * Codex: apply_patch sends the patch text in tool_input.command.
 */
function editedFiles(payload) {
  const input = payload.tool_input || {};
  const files = new Set();

  if (typeof input.file_path === "string") {
    files.add(input.file_path);
  }

  const patch = [input.command, input.patch, input.input].find((value) => typeof value === "string") || "";

  for (const match of patch.matchAll(/^\*\*\* (?:Add|Update) File: (.+)$|^\*\*\* Move to: (.+)$/gm)) {
    files.add((match[1] || match[2]).trim());
  }

  return [...files].map(toProjectFile).filter(Boolean);
}

function changedSourceFiles() {
  const { ok, output } = run("git", ["status", "--porcelain", "--untracked-files=all"]);

  if (!ok) {
    return true;
  }

  return output.split("\n").some((line) => FORMATTABLE.test(line.slice(3).trim()) || /tsconfig.*\.json$/.test(line));
}

function postEdit(payload) {
  const files = editedFiles(payload);
  const lintable = files.filter((file) => LINTABLE.test(file));
  const formattable = files.filter((file) => FORMATTABLE.test(file));

  if (lintable.length) {
    run(resolve(BIN, "oxlint"), ["--fix", ...lintable]);
  }

  if (formattable.length) {
    run(resolve(BIN, "oxfmt"), ["--no-error-on-unmatched-pattern", ...formattable]);
  }

  if (lintable.length) {
    const lint = run(resolve(BIN, "oxlint"), lintable);

    if (!lint.ok) {
      block(`oxlint found errors that could not be auto-fixed in the files you edited:\n\n${lint.output}`);
    }
  }

  respond();
}

function stop(payload) {
  // Avoid infinite loops: when the agent was already sent back once, let it stop.
  if (payload.stop_hook_active || !changedSourceFiles()) {
    respond();
  }

  const failures = [];
  const lint = run(resolve(BIN, "oxlint"), []);
  const typecheck = run("yarn", ["typecheck"]);

  if (!lint.ok) {
    failures.push(`## oxlint (\`yarn lint\`)\n\n${lint.output}`);
  }

  if (!typecheck.ok) {
    failures.push(`## TypeScript (\`yarn typecheck\`)\n\n${typecheck.output}`);
  }

  if (failures.length) {
    block(`The quality gate failed. Fix these errors before finishing:\n\n${failures.join("\n\n")}`);
  }

  respond();
}

const payload = readPayload();
const mode = process.argv[2];

if (mode === "post-edit") {
  postEdit(payload);
} else if (mode === "stop") {
  stop(payload);
} else {
  process.stderr.write(`Unknown mode "${mode}". Use "post-edit" or "stop".\n`);
  respond();
}
