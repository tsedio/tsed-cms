import { AjvService, type AjvValidateOptions } from "@tsed/ajv";
import { inject } from "@tsed/di";
import { JsonSchema } from "@tsed/schema";

export function validate<T = any>(data: any, opts: JsonSchema<T> | AjvValidateOptions): Promise<T> {
  const ajvService = inject(AjvService);

  return ajvService.validate(data, opts);
}
