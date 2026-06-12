import sharp from "sharp";
import { renderStatsCard } from "./cards.js";

export function statusGifAnimationProgress(frameCount) {
  const animationProgress = Array.from({ length: frameCount }, (_, index) => {
    return index / Math.max(1, frameCount - 1);
  });

  return [1, ...animationProgress];
}

export async function renderAnimatedStatusGif(stats, options = {}) {
  const frameCount = options.frameCount ?? 24;
  const delay = options.delay ?? 70;
  const finalDelay = options.finalDelay ?? 1200;

  const frames = statusGifAnimationProgress(frameCount).map((progress) => {
    return Buffer.from(renderStatsCard(stats, { animationProgress: progress }), "utf8");
  });

  const delays = frames.map((_, index) => (index === frames.length - 1 ? finalDelay : delay));

  const { data } = await sharp(frames, { join: { animated: true } })
    .gif({
      delay: delays,
      loop: 0,
      colours: 128,
      dither: 0.75,
      effort: 10,
      interFrameMaxError: 4,
    })
    .toBuffer({ resolveWithObject: true });

  return data;
}
