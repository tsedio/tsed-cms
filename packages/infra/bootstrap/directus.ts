import "@tsed/logger-connect";

import { useLogger } from "@directus/api/logger/index";
import type { EndpointExtensionContext, OperationContext } from "@directus/types";
import { withOptions } from "@tsed/config";
import { EnvsConfigSource } from "@tsed/config/envs";
import { attachLogger, configuration, DIContext, injector, runInContext } from "@tsed/di";
import { inject } from "@tsed/di";
import { $log } from "@tsed/logger";
import { DirectusContextService } from "@tsed-cms/infra/directus/DirectusContextService.js";
import type { Router } from "express";
import { nanoid } from "nanoid";

const cmsLogger = useLogger();

function print(o: any) {
  if (o?.data?.length && typeof o?.data[0] === "string") {
    return o?.data[0];
  }

  return JSON.stringify(o, null, 2);
}

$log.appenders.clear();
$log.appenders.set("stdout", {
  type: "connect",
  options: {
    logger: {
      info: (o: any) => (cmsLogger.info as any)(print(o)),
      warn: (o: any) => (cmsLogger.warn as any)(print(o)),
      debug: (o: any) => (cmsLogger.debug as any)(print(o)),
      trace: (o: any) => (cmsLogger.trace as any)(print(o)),
      error: (o: any) => (cmsLogger.error as any)(print(o))
    }
  }
});

attachLogger($log);

configuration().set({
  extends: [
    withOptions(EnvsConfigSource, {
      name: "envs"
    })
  ]
});

const VERBS = ["get", "put", "post", "delete", "head", "use", "all", "options"];

export function wrapEndpoint(callback: (router: Router, context: EndpointExtensionContext) => void) {
  return (router: Router, context: EndpointExtensionContext) => {
    attachLogger(context.logger);

    VERBS.forEach((verb) => {
      const r: any = router;
      if (r[verb] && !r["__" + verb]) {
        r["__" + verb] = r[verb];

        r[verb] = (path: string, handler: any) => {
          const wrapped = async (req: any, res: any) => {
            await injector().load();

            const $ctx = new DIContext({
              id: nanoid(),
              platform: "DIRECTUS_ENDPOINT",
              maxStackSize: 0
            });

            return runInContext($ctx, async () => {
              inject(DirectusContextService).set(context);

              try {
                return await handler(req, res);
              } catch (error: any) {
                res.status(error.status || 500).send(error.message || "Internal Server Error");

                $ctx.logger.error({
                  error_name: error.name,
                  error_message: error.message,
                  error_description: error.description,
                  error_stack: error.stack
                });
              } finally {
                $ctx.logger.flush();
              }
            });
          };

          r["__" + verb](path, wrapped);
        };
      }
    });

    callback(router, context);
  };
}

export function wrapOperation<Options = Record<string, unknown>>(
  callback: (options: Options, context: OperationContext) => unknown | Promise<unknown> | void
) {
  return async (options: Options, context: OperationContext) => {
    await injector().load();

    const $ctx = new DIContext({
      id: nanoid(),
      platform: "DIRECTUS_OPERATION",
      maxStackSize: 0
    });

    return runInContext($ctx, async () => {
      try {
        inject(DirectusContextService).set(context);

        return await callback(options, context);
      } catch (error: any) {
        $ctx.logger.error({
          error_name: error.name,
          error_message: error.message,
          error_description: error.description,
          error_stack: error.stack
        });
      } finally {
        $ctx.logger.flush();
      }
    });
  };
}
