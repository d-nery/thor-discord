import _ from "underscore";
import { Frame } from "../../utils/frame";

export enum RouletteBetType {
  SINGLE = "single",
  SPLIT = "split",
  STREET = "street",
  CORNER = "corner",
  DSTREET = "dstreet",
  TRIO = "trio",
  FFOUR = "ffour",
  HALF = "half",
  DOZEN = "dozen",
  COLUMN = "column",
}

const allNumbers = _.range(37);
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const blackNumbers = allNumbers.filter((n) => !redNumbers.includes(n));

export const RoulettePossibleBetMap = {
  [RouletteBetType.SINGLE]: allNumbers.map((c) => [c]),

  [RouletteBetType.SPLIT]: _.range(1, 34).reduce((acc: number[][], v) => {
    acc.push([v, v + 3]);
    if (v % 3 != 0) {
      acc.push([v, v + 1]);
    }
    return acc;
  }, []),

  [RouletteBetType.STREET]: _.range(1, 35, 3).map((v) => [v, v + 1, v + 2]),
  [RouletteBetType.CORNER]: _.range(2, 33, 3).reduce((acc: number[][], v) => {
    acc.push([v - 1, v, v + 2, v + 3]);
    acc.push([v, v + 1, v + 3, v + 4]);
    return acc;
  }, []),

  [RouletteBetType.DSTREET]: _.range(1, 32, 3).map((v) => [v, v + 1, v + 2, v + 3, v + 4, v + 5]),
  [RouletteBetType.TRIO]: [
    [0, 1, 2],
    [0, 2, 3],
  ],
  [RouletteBetType.FFOUR]: [[0, 1, 2, 4]],
  [RouletteBetType.HALF]: [
    _.range(1, 19),
    _.range(2, 37, 2),
    blackNumbers,
    redNumbers,
    _.range(1, 37, 2),
    _.range(19, 37),
  ],
  [RouletteBetType.DOZEN]: [_.range(1, 13), _.range(13, 25), _.range(25, 37)],
  [RouletteBetType.COLUMN]: [_.range(1, 35, 3), _.range(2, 36, 3), _.range(3, 37, 3)],
};

export const RoulettePossibleBetFriendlyNameMap = {
  [RouletteBetType.SINGLE]: RoulettePossibleBetMap[RouletteBetType.SINGLE].map((c) => c.join(", ")),
  [RouletteBetType.SPLIT]: RoulettePossibleBetMap[RouletteBetType.SPLIT].map((c) => c.join(", ")),
  [RouletteBetType.STREET]: RoulettePossibleBetMap[RouletteBetType.STREET].map((c) => c.join(", ")),
  [RouletteBetType.CORNER]: RoulettePossibleBetMap[RouletteBetType.CORNER].map((c) => c.join(", ")),
  [RouletteBetType.DSTREET]: RoulettePossibleBetMap[RouletteBetType.DSTREET].map((c) => c.join(", ")),
  [RouletteBetType.TRIO]: RoulettePossibleBetMap[RouletteBetType.TRIO].map((c) => c.join(", ")),
  [RouletteBetType.FFOUR]: RoulettePossibleBetMap[RouletteBetType.FFOUR].map((c) => c.join(", ")),
  [RouletteBetType.HALF]: ["1-18", "Par", "Pretos", "Vermelhos", "Ímpar", "19-36"],
  [RouletteBetType.DOZEN]: ["1a dúzia", "2a dúzia", "3a dúzia"],
  [RouletteBetType.COLUMN]: ["L1", "L2", "L3"],
};

export const ChipPositions = {
  [RouletteBetType.SINGLE]: RoulettePossibleBetMap[RouletteBetType.SPLIT].map((_, i) => {
    if (i == 0) {
      return new Frame({ x: 20, y: 61 }, 88, 290);
    }

    const x = 132 + Math.floor((i - 1) / 3) * 101.5;
    const y = 272 - ((i - 1) % 3) * 101.5;

    return new Frame({ x, y }, 68, 68);
  }),

  [RouletteBetType.SPLIT]: RoulettePossibleBetMap[RouletteBetType.SPLIT].map((_, i) => {
    const line = Math.floor(i / 5);
    const column = i % 5;

    if (column % 2 == 0) {
      const idx = line * 3 + Math.floor(column / 2);

      const x = 196 + Math.floor(idx / 3) * 101.5;
      const y = 276 - (idx % 3) * 101.5;

      return new Frame({ x, y }, 40, 62);
    }

    const idx = line * 3 + Math.floor(column / 2);

    const x = 135 + Math.floor(idx / 3) * 101.5;
    const y = 236 - (idx % 3) * 101.5;

    return new Frame({ x, y }, 62, 40);
  }),

  [RouletteBetType.STREET]: RoulettePossibleBetMap[RouletteBetType.STREET].map((_, i) => {
    const x = 136 + i * 101.5;
    const y = 25;

    return new Frame({ x, y }, 62, 40);
  }),

  [RouletteBetType.CORNER]: RoulettePossibleBetMap[RouletteBetType.CORNER].map((_, i) => {
    const x = 191 + Math.floor(i / 2) * 101.5;
    const y = 231 - (i % 2) * 101.5;

    return new Frame({ x, y }, 50, 50);
  }),

  [RouletteBetType.DSTREET]: RoulettePossibleBetMap[RouletteBetType.DSTREET].map((_, i) => {
    const x = 191 + i * 101.5;
    const y = 25;

    return new Frame({ x, y }, 50, 40);
  }),

  [RouletteBetType.TRIO]: RoulettePossibleBetMap[RouletteBetType.TRIO].map((_, i) => {
    const x = 90;
    const y = 231 - i * 101.5;

    return new Frame({ x, y }, 50, 50);
  }),

  [RouletteBetType.FFOUR]: [new Frame({ x: 90, y: 25 }, 50, 50)],

  [RouletteBetType.HALF]: RoulettePossibleBetMap[RouletteBetType.HALF].map((_, i) => {
    const x = 125 + i * 203;
    const y = 470;

    return new Frame({ x, y }, 183, 77);
  }),

  [RouletteBetType.DOZEN]: RoulettePossibleBetMap[RouletteBetType.DOZEN].map((_, i) => {
    const x = 125 + i * 406;
    const y = 369;

    return new Frame({ x, y }, 386, 77);
  }),

  [RouletteBetType.COLUMN]: RoulettePossibleBetMap[RouletteBetType.COLUMN].map((_, i) => {
    const x = 1338;
    const y = 263 - i * 101.5;

    return new Frame({ x, y }, 42, 86);
  }),
};

export type RouletteBet = {
  value: number;
  type: RouletteBetType;
  bet: number;
};
