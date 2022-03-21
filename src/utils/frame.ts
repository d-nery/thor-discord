import { NodeCanvasRenderingContext2D, Image } from "canvas";
import _ from "underscore";

export type Point = {
  x: number;
  y: number;
};

export class Frame {
  constructor(readonly upper_left_corner: Point, readonly width: number, readonly height: number) {}

  get top(): number {
    return this.upper_left_corner.y;
  }

  get left(): number {
    return this.upper_left_corner.x;
  }

  get bottom(): number {
    return this.top + this.height;
  }

  get right(): number {
    return this.left + this.width;
  }

  get top_left(): Point {
    return this.upper_left_corner;
  }

  get top_right(): Point {
    return { x: this.right, y: this.top };
  }

  get bottom_right(): Point {
    return { x: this.right, y: this.bottom };
  }

  get bottom_left(): Point {
    return { x: this.left, y: this.bottom };
  }

  fitHeight(ctx: NodeCanvasRenderingContext2D, image: Image): void {
    const h_ratio = image.height / this.height;
    const dw = image.width / h_ratio;
    const dx = this.left + this.width / 2 - dw / 2;

    ctx.drawImage(image, 0, 0, image.width, image.height, dx, this.top, dw, this.height);
  }

  fitCover(ctx: NodeCanvasRenderingContext2D, image: Image): void {
    const h_ratio = image.height / this.height;
    const sw = this.width * h_ratio;
    const sh = this.height * h_ratio;
    const sx = image.width / 2 - sw / 2;
    const sy = image.height / 2 - sh / 2;

    ctx.drawImage(image, sx, sy, sw, sh, this.left, this.top, this.width, this.height);
  }

  putInsideRandom(ctx: NodeCanvasRenderingContext2D, image: Image): void {
    const min_x = this.left;
    const max_x = this.right - image.width;

    const min_y = this.top;
    const max_y = this.bottom - image.height;

    const x = _.random(min_x, max_x);
    const y = _.random(min_y, max_y);

    ctx.drawImage(image, x, y, image.width, image.height);
  }
}
