import { constant, injectable } from "@tsed/di";

export class EnvInfoService {
  get(isAdmin?: boolean) {
    return {
      version: constant<string>("pkg.version", "unknown"),
      branch: constant<string>("branch", "master"),
      env: isAdmin
        ? {
            auth_providers: constant<string>("envs.AUTH_PROVIDERS", ""),
            auth_clubmed_driver: constant<string>("envs.AUTH_CLUBMED_DRIVER", ""),
            auth_clubmed_issuer_url: constant<string>("envs.AUTH_CLUBMED_ISSUER_URL", ""),
            auth_clubmed_allow_public_registration: constant<boolean>("envs.AUTH_CLUBMED_ALLOW_PUBLIC_REGISTRATION", false),
            auth_clubmed_token_endpoint_auth_method: constant<string>("envs.AUTH_CLUBMED_TOKEN_ENDPOINT_AUTH_METHOD", ""),
            auth_clubmed_identifier_key: constant<string>("envs.AUTH_CLUBMED_IDENTIFIER_KEY", ""),
            cache_enable: constant<boolean>("envs.CACHE_ENABLE", false),
            cache_store: constant<string>("envs.CACHE_STORE", "unknown"),
            cache_auto_purge: constant<boolean>("envs.CACHE_AUTO_PURGE", false),
            cache_status_header: constant<string>("envs.CACHE_STATUS_HEADER", ""),
            storage_locations: constant<string>("envs.STORAGE_LOCATIONS", ""),
            storage_local_root: constant<string>("envs.STORAGE_LOCAL_ROOT", ""),
            storage_s3_driver: constant<string>("envs.STORAGE_S3_DRIVER", ""),
            storage_s3_bucket: constant<string>("envs.STORAGE_S3_BUCKET", ""),
            storage_s3_region: constant<string>("envs.STORAGE_S3_REGION", ""),
            storage_s3_endpoint: constant<string>("envs.STORAGE_S3_ENDPOINT", ""),
            storage_s3_force_path_style: constant<string>("envs.STORAGE_S3_FORCE_PATH_STYLE", ""),
            storage_s3_public_url: constant<string>("envs.STORAGE_S3_PUBLIC_URL", ""),
            db_url: constant<string>("envs.DB_URL", ""),
            jira_url: constant<string>("envs.JIRA_URL", "")
          }
        : undefined
    };
  }
}

injectable(EnvInfoService);
