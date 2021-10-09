import "../../src/extensions/number";
import "mocha";

import { expect } from "chai";

describe("number extensions", () => {
  it("toTime should return correct date formatting", () => {
    expect((0).toTime()).to.eq("0:00:00");
    expect((60 * 1000).toTime()).to.eq("0:01:00");
    expect((60 * 60 * 1000).toTime()).to.eq("1:00:00");
    expect((24 * 60 * 60 * 1000).toTime()).to.eq("1D 0:00:00");
    expect((36 * 60 * 60 + 23 * 60 + 10).toTime(true)).to.eq("1D 12:23:10");
  });
});
