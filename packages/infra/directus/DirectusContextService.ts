import type { EndpointExtensionContext, Item, OperationContext } from "@directus/types";
import { context, injectable } from "@tsed/di";

export class DirectusContextService {
  set(ctx: EndpointExtensionContext | OperationContext) {
    context().set("DIRECTUS_CONTEXT", ctx);
  }

  get(): EndpointExtensionContext | OperationContext {
    return context().get("DIRECTUS_CONTEXT");
  }

  async getItemsService<T extends Item = Item, Collection extends string = string>(collection: Collection, options: any = {}) {
    const context = this.get();

    if (context) {
      const schema = await context.getSchema();

      return new context.services.ItemsService<T, Collection>(collection, {
        ...options,
        schema
      });
    }

    throw new Error("No directus context available");
  }
}

injectable(DirectusContextService);
