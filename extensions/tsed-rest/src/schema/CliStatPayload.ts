import { s } from "@tsed/schema";

export const CliStatPayload = s.object({
  tsed_version: s.string().required(),
  platform: s.string().required(),
  convention: s.string().required(),
  style: s.string().optional(),
  package_manager: s.string().required(),
  runtime: s.string().required(),
  features: s.array(s.string()),
  channel: s.string().enum("cli", "mcp").required(),
  cli_version: s.string().required(),
  os: s.string().required(),
  is_success: s.boolean().required(),
  error_name: s.string(),
  error_message: s.string()
});
