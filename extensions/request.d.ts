import { Accountability } from "@directus/types";

// See: https://github.com/directus/directus/discussions/20670
//      https://github.com/directus/directus/discussions/15098

declare global {
  namespace Express {
    interface Request {
      accountability?: Accountability;
    }
  }
}
