import type { OperationApiConfig } from "@directus/extensions";

// @tsed/directus-sdk 8.41 publishes a non-generic `defineOperationApi` signature.
// Restore the generic overload so `defineOperationApi<Options>()` keeps typed options.
declare module "@tsed/directus-sdk" {
  export function defineOperationApi<Options = Record<string, unknown>>(config: OperationApiConfig<Options>): OperationApiConfig<Options>;
}
