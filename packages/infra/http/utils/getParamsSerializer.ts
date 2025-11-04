import { cleanObject } from "@tsed/core";
import { stringify } from "querystring";

export function getParamsSerializer(params: Record<string, unknown>) {
  return stringify(cleanObject(params));
}
