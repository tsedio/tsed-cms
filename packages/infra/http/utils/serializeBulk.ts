import { isString } from "@tsed/core";

export function serializeBulk(array: Array<Record<string, any> | string>): string {
  return array.reduce<string>((ndjson, obj) => {
    const str = isString(obj) ? obj : JSON.stringify(obj);

    return ndjson + str + "\n";
  }, "");
}
