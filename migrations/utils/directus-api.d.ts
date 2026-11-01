// @directus/api does not ship type declarations.
declare module "@directus/api/logger/index" {
  import type { Logger } from "pino";

  export function useLogger(): Logger;
}
