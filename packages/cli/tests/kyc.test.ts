import { setPrice } from "../src/price";

jest.setTimeout(40000);

describe("check KYC setPrice", () => {
  it("should return 1700", async () => {
    const price:number = await setPrice(1700);
    expect(price).toBe(1700);
  });
});
