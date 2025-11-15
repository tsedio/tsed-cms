import { s } from "@tsed/schema";

const ApiSymbolTypeSchema = s.object({
  value: s.string().enum("decorator", "class", "enum", "function", "interface", "const", "service", "type").required(),
  label: s.string().required(),
  code: s.string().required()
});

const ApiSymbolSchema = s.object({
  id: s.string().required(),
  path: s.string().required(),
  module: s.string().required(),
  symbolName: s.string().required(),
  symbolType: s.string().required(),
  symbolCode: s.string().required(),
  status: s.array(s.string()).required()
});

export const ApiPayloadSchema = s.object({
  version: s.string().required(),
  scope: s.string().required(),
  symbolTypes: s.array(ApiSymbolTypeSchema).required(),
  symbolStatus: s.array(
    s.object({
      label: s.string().required(),
      value: s.string().required()
    })
  ),
  modules: s.record(
    s.object({
      name: s.string().required(),
      symbols: s.array(ApiSymbolSchema).required()
    })
  )
});

export type ApiPayload = s.infer<typeof ApiPayloadSchema>;
export type ApiSymbol = s.infer<typeof ApiSymbolSchema>;
