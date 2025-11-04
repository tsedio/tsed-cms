import { constant, context, ContextLogger, contextLogger } from "@tsed/di";
import type { AxiosResponse } from "axios";
import get from "lodash/get.js";
import { stringify } from "querystring";

import type { HttpRequestConfig, HttpRequestErrorConfig } from "./HttpClientOptions.js";
import { logToCurl } from "./utils/logToCurl.js";

const jsonStringify = (display: boolean, body: object) => (body && display ? JSON.stringify(body) : "");

export class HttpLogClient {
  callee: string = "http";
  protected level = constant<string>("logger.httpLevel", "");

  get logger(): ContextLogger {
    return contextLogger();
  }

  protected onSuccess(options: HttpRequestConfig) {
    return (
      !options.disableLog &&
      this.logger.info({
        ...this.formatLog(options, false),
        state: "OK"
      })
    );
  }

  protected onError(options: HttpRequestErrorConfig) {
    !options.disableLog &&
      this.logger.warn({
        ...this.formatLog(options, true),
        state: "KO",
        callee_error: options.error.message
      });
  }

  protected formatLog(options: HttpRequestConfig | HttpRequestErrorConfig, verbose: boolean) {
    const { startTime, url, method } = options;
    const { callee } = this;
    const full = this.level === "debug" || verbose;
    const { status, headers, data } = options.response || {};
    const xRequestId = this.getXRequestId(options);

    return {
      callee: get(options, "response.config.callee", callee),
      url,
      method,
      x_request_id: xRequestId,
      callee_request_qs: options.params ? stringify(options.params) : "",
      callee_request_headers: options.headers ? jsonStringify(full, options.headers) : "",
      callee_request_body: options.data ? jsonStringify(full, options.data) : undefined,
      callee_response_x_request_id: xRequestId,
      callee_response_code: status,
      callee_response_headers: headers ? jsonStringify(full, headers) : undefined,
      callee_response_body: full && data != undefined ? jsonStringify(full, data) : undefined,
      request_id: context().id,
      duration: new Date().getTime() - startTime,
      curl: full ? logToCurl(options) : undefined
    };
  }

  protected getXRequestId(obj: { response: AxiosResponse } & any) {
    return get(obj, "response.headers.x-request-id", get(obj, "headers.x-request-id"));
  }
}
