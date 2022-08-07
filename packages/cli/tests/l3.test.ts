import { L3, formatWinstonTime } from "../src/l3";

jest.setTimeout(40000);

describe("check L3", () => {
  it("should return 100", async () => {
    const percent:number = await L3();
    expect(percent).toBe(100);
  });
});

describe("check formatWinstonTime", () => {
  it("should return formatted time", () => {
    const msg:string = formatWinstonTime(2500);
    expect(msg).toBe("2 sec");
  });
});