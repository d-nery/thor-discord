import { NodeCanvasRenderingContext2D, Image } from "canvas";

export type Frame = { x: number; y: number; w: number; h: number };

export function fitCover(ctx: NodeCanvasRenderingContext2D, frame: Frame, image: Image): void {
  const h_ratio = image.height / frame.h;
  const sw = frame.w * h_ratio;
  const sh = frame.h * h_ratio;
  const sx = image.width / 2 - sw / 2;
  const sy = image.height / 2 - sh / 2;

  ctx.drawImage(image, sx, sy, sw, sh, frame.x, frame.y, frame.w, frame.h);
}

export function fitHeight(ctx: NodeCanvasRenderingContext2D, frame: Frame, image: Image): void {
  const h_ratio = image.height / frame.h;
  const dw = image.width / h_ratio;
  const dx = frame.x + frame.w / 2 - dw / 2;

  ctx.drawImage(image, 0, 0, image.width, image.height, dx, frame.y, dw, frame.h);
}
