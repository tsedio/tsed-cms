import { stringify } from "querystring";

import { cleanObject } from "@tsed/core";

export function getParamsSerializer(params: Record<string, unknown>) {
  return stringify(cleanObject(params));
}
