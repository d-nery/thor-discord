import "../../src/extensions/array";
import "mocha";

import { expect } from "chai";

describe("array extensions", () => {
  it("range should return correct range", () => {
    const range = Array.range(0, 5);
    expect(range.length).to.eq(5);
    expect(range).to.deep.eq([0, 1, 2, 3, 4]);
  });
});
