/**
 * The DrawManager runs in the background running draws in the scheduled times
 */

import schedule from "node-schedule";
import _ from "underscore";

import { Inject, Service } from "typedi";
import { BichoManager } from "./BichoManager";
import { Logger } from "tslog";

@Service()
export class DrawManager {
  @Inject()
  private readonly bichoManager: BichoManager;

  @Inject()
  private readonly logger: Logger;

  async setup(): Promise<void> {
    // Jogo do bicho
    schedule.scheduleJob("bicho draw", "0 0 0 * * *", async () => {
      try {
        await this.bichoDraw();
      } catch (err) {
        this.logger.error("error drawing numbers", err);
      }
    });

    this.logger.info("Scheduled jobs", { jobs: Object.keys(schedule.scheduledJobs) });
  }

  async bichoDraw(): Promise<void> {
    const pool = _.range(100);
    const draw = _.sample(pool, 10);

    const dezenas = draw.filter((_, i) => i % 2 == 1);
    const milhares = _.range(0, 10, 2).map((v) => draw[v] * 100 + draw[v + 1]);
    const centenas = milhares.map((v) => v % 1000);

    await this.bichoManager.processDraw(draw, dezenas, centenas, milhares);
  }
}
