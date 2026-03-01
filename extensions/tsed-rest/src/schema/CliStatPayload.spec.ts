import { catchAsyncError } from "@tsed/core";
import { validate } from "@tsed-cms/infra/validators/validate.js";

import { CliStatPayload } from "./CliStatPayload.js";

describe("CliStatPayload", () => {
  it("should validate payload", async () => {
    const payload = {
      tsed_version: "1.0.0",
      platform: "express",
      convention: "tsed",
      style: "tsed",
      package_manager: "npm",
      runtime: "node",
      features: [],
      channel: "cli",
      cli_version: "1.0.0",
      os: "darwin",
      is_success: true,
      error_name: "",
      error_message: ""
    };

    expect(await validate(payload, CliStatPayload)).toBeTruthy();
  });

  it("should validate payload (2)", async () => {
    const payload = {
      tsed_version: "1.0.0",
      platform: "express",
      convention: "tsed",
      style: "tsed",
      package_manager: "npm",
      runtime: "node",
      features: [],
      channel: "cli",
      cli_version: "1.0.0",
      os: "darwin",
      is_success: true,
      error_name: undefined,
      error_message: undefined
    };

    expect(await validate(payload, CliStatPayload)).toBeTruthy();
  });

  it("should not validate payload", async () => {
    const payload = {
      tsed_version: "1.0.0",
      platform: "express",
      convention: "tsed",
      style: "tsed",
      package_manager: "",
      runtime: "node",
      features: [],
      channel: "cli",
      cli_version: "1.0.0",
      os: "darwin",
      is_success: true,
      error_name: undefined,
      error_message: undefined
    };

    const error = await catchAsyncError(() => validate(payload, CliStatPayload));
    expect(error?.message).toEqual('Value.package_manager must NOT have fewer than 1 characters. Given value: ""');
  });
});
