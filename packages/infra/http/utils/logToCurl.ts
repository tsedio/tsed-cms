import parse from "url-parse";

import type { HttpRequestConfig, HttpRequestErrorConfig } from "../HttpClientOptions.js";

export function logToCurl(opts: HttpRequestConfig | HttpRequestErrorConfig) {
  const { params, method, data } = opts;
  const url = `${opts.response?.config?.baseURL || ""}${opts.url}`;
  const headers = {
    ...(opts.response?.config?.headers || {}),
    ...(opts.headers || {})
  };

  const request = parse(url, true);

  if (params) {
    request.set("query", params);
  }

  let curl = `curl -X ${(method || "POST").toUpperCase()} '${request.toString()}'`;

  if (data) {
    if (headers["Content-Type"] === "multipart/form-data") {
      Object.entries(data).forEach(([key, value]) => {
        curl += ` -F '${key}=${value}'`;
      });
    } else {
      curl += ` -d '${JSON.stringify(data)}'`;
    }
  }

  curl += Object.entries(headers).reduce((curlHeaders, [key, value]) => `${curlHeaders} -H '${key}: ${value}'`, "");

  return curl;
}
