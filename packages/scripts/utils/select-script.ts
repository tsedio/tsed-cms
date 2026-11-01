import path from "node:path";

import { logger } from "@tsed/di";
// @ts-ignore
import inquirer from "inquirer";

export type ScriptChoice = {
  name: string;
  value: string;
  /** Group title displayed as a separator before the first choice of the group. */
  group?: string;
};

/**
 * Returns the script matching the first CLI argument (file name with or without `.ts`, or display name),
 * otherwise prompts the user to pick one.
 */
export async function selectScript(choices: ScriptChoice[], message: string, scriptName = process.argv[2]): Promise<string> {
  if (scriptName) {
    const match = choices.find((choice) => {
      const fileName = path.basename(choice.value);
      return [fileName, fileName.replace(/\.ts$/, ""), choice.name.split(" ")[0]].includes(scriptName);
    });

    if (!match) {
      throw new Error(`Unknown script "${scriptName}". Available: ${choices.map((choice) => path.basename(choice.value)).join(", ")}`);
    }

    return match.value;
  }

  const promptChoices = choices.flatMap((choice, index) => {
    const separator = choice.group && choice.group !== choices[index - 1]?.group ? [new inquirer.Separator(`── ${choice.group} ──`)] : [];
    return [...separator, { name: choice.name, value: choice.value }];
  });

  const { selectedScript } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedScript",
      message,
      choices: promptChoices,
      pageSize: 20
    }
  ]);

  return selectedScript;
}

export async function runScript(file: string, ...args: unknown[]) {
  logger().info(`Starting script: ${file}`);

  const module = await import(file);

  if (!module.default || typeof module.default !== "function") {
    throw new Error(`No default export found in ${file}`);
  }

  await module.default(...args);
  logger().info(`Successfully executed ${file}`);
}
