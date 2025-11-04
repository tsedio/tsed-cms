import { DITest, inject } from "@tsed/di";

import { EnvInfoService } from "./EnvInfoService.js";

describe("VersionController", () => {
  beforeEach(() =>
    DITest.create({
      pkg: {
        version: "1.0.0"
      },
      branch: "main",
      envs: {
        AUTH_PROVIDERS: "",
        AUTH_CLUBMED_DRIVER: "",
        AUTH_CLUBMED_ISSUER_URL: "",
        AUTH_CLUBMED_ALLOW_PUBLIC_REGISTRATION: false,
        AUTH_CLUBMED_TOKEN_ENDPOINT_AUTH_METHOD: "",
        AUTH_CLUBMED_IDENTIFIER_KEY: "",
        CACHE_ENABLE: false,
        CACHE_STORE: "unknown",
        CACHE_AUTO_PURGE: false,
        CACHE_STATUS_HEADER: "",
        STORAGE_LOCATIONS: "",
        STORAGE_LOCAL_ROOT: "",
        STORAGE_S3_DRIVER: "",
        STORAGE_S3_BUCKET: "",
        STORAGE_S3_REGION: "",
        STORAGE_S3_ENDPOINT: "",
        STORAGE_S3_FORCE_PATH_STYLE: "",
        STORAGE_S3_PUBLIC_URL: ""
      }
    })
  );
  afterEach(() => DITest.reset());

  describe("get()", () => {
    it("should return version information", () => {
      const service = inject(EnvInfoService);

      const result = service.get();

      expect(result).toEqual({
        version: "1.0.0",
        branch: "main",
        env: undefined
      });
    });
    it("should return version information + env variables", () => {
      const service = inject(EnvInfoService);

      const result = service.get(true);

      expect(result).toEqual({
        version: "1.0.0",
        branch: "main",
        env: {
          auth_providers: "",
          auth_clubmed_driver: "",
          auth_clubmed_issuer_url: "",
          auth_clubmed_allow_public_registration: false,
          auth_clubmed_token_endpoint_auth_method: "",
          auth_clubmed_identifier_key: "",
          cache_enable: false,
          cache_store: "unknown",
          cache_auto_purge: false,
          cache_status_header: "",
          storage_locations: "",
          storage_local_root: "",
          storage_s3_driver: "",
          storage_s3_bucket: "",
          storage_s3_region: "",
          storage_s3_endpoint: "",
          storage_s3_force_path_style: "",
          storage_s3_public_url: "",
          db_url: "",
          jira_url: ""
        }
      });
    });
  });
});
