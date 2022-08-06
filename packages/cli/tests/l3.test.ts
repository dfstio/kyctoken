import { L3 } from "../src/l3";

describe("check L3", () => {
  it("should return 100", async () => {
    const percent:number = await L3();
    expect(percent).toBe(100);
  });
});