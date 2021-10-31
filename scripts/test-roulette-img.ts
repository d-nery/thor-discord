import * as fs from "fs";
import { createCanvas, loadImage } from "canvas";
import {
  ChipPositions,
  RouletteBet,
  RouletteBetType,
  RoulettePossibleBetFriendlyNameMap,
  RoulettePossibleBetMap,
} from "../src/model/casino/roulette";
import { emojis } from "../src/utils/entities";
import { Frame } from "../src/utils/frame";

const testf = async () => {
  const canvas = createCanvas(1400, 568);
  const ctx = canvas.getContext("2d");

  const table = await loadImage("./static/img/roulette_table.png");

  const bets: {
    [playerId: string]: {
      color: string;
      bets: RouletteBet[];
    };
  } = {};

  Object.values(RouletteBetType).map((r, i) => {
    bets[r] = {
      color: Object.keys(emojis.Chips)[i],
      bets: RoulettePossibleBetMap[r].map((_, i) => ({
        value: 10,
        type: r,
        bet: i,
      })),
    };
  });

  ctx.drawImage(table, 0, 0, canvas.width, canvas.height);

  for (const p of Object.values(bets)) {
    const chip = emojis.Chips[p.color];
    const image = await loadImage(`./static/img/chips/${chip.name}.png`);

    for (const b of p.bets) {
      const frame: Frame = ChipPositions[b.type][b.bet];

      frame.putInsideRandom(ctx, image);
    }
  }

  const out = fs.createWriteStream("test.png");
  const stream = canvas.createPNGStream();

  stream.pipe(out);
  out.on("finish", () => console.log("The PNG file was created."));
};

console.log(RoulettePossibleBetFriendlyNameMap);
console.log(ChipPositions);

testf().catch(console.error);
