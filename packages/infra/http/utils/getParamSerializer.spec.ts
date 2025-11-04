import { serialize } from "@tsed/json-mapper";
import { Minimum, Name, Required } from "@tsed/schema";

import { getParamsSerializer } from "./getParamsSerializer.js";

class CustomParameters {
  @Required()
  @Minimum(1)
  duration: number;

  @Required()
  @Name("first_date")
  firstDate: Date;

  @Required()
  @Name("last_date")
  lastDate: Date;
}

describe("getParamsSerializer()", () => {
  it("should serialize data and model", () => {
    const params = new CustomParameters();
    params.firstDate = new Date("2020-05-05");
    params.lastDate = new Date("2020-05-10");
    params.duration = 5;

    expect(getParamsSerializer(serialize(params))).toEqual(
      "duration=5&first_date=2020-05-05T00%3A00%3A00.000Z&last_date=2020-05-10T00%3A00%3A00.000Z"
    );
  });
});
