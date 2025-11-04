import { DITest, inject } from "@tsed/di";

import { OpenCollectiveClient } from "./OpenCollectiveClient.js";

describe("OpenCollectiveClient", () => {
  beforeEach(() => DITest.create());
  afterEach(() => DITest.reset());
  it("should get all members", async () => {
    const service = inject(OpenCollectiveClient);
    const data = [
      {
        MemberId: 13382,
        createdAt: "2018-03-01 22:31",
        type: "USER",
        role: "ADMIN",
        isActive: true,
        totalAmountDonated: 0,
        currency: "USD",
        lastTransactionAt: "2020-07-02 22:41",
        lastTransactionAmount: -200,
        profile: "https://opencollective.com/romlenzotti",
        name: "Romain Lenzotti"
      }
    ];

    vi.spyOn(service, "get").mockResolvedValue(data as any);

    const result = await service.getMembers("tsed");

    expect(result).toEqual(data);
  });
});
