// src/utils/scaleUtils.js

/**
 * Maximum dimensions for the preview container
 */
export const PREVIEW_MAX_WIDTH = 400;
export const PREVIEW_MAX_HEIGHT = 400;

/**
 * computeScale
 * Calculates the scale factor and display dimensions based on real image size.
 * Ensures the preview container does not exceed PREVIEW_MAX_WIDTH and PREVIEW_MAX_HEIGHT.
 */
export function computeScale(realW, realH) {
  if (!realW || !realH) {
    return { scale: 1, dispW: PREVIEW_MAX_WIDTH, dispH: PREVIEW_MAX_HEIGHT };
  }
  let scale = 1;
  if (realW > PREVIEW_MAX_WIDTH || realH > PREVIEW_MAX_HEIGHT) {
    scale = Math.min(PREVIEW_MAX_WIDTH / realW, PREVIEW_MAX_HEIGHT / realH);
  }
  const dispW = realW * scale;
  const dispH = realH * scale;
  return { scale, dispW, dispH };
}

/**
 * realToDisplay
 * Converts overlay coordinates from real (full-size) to display (scaled) coordinates.
 */
export function realToDisplay(ov, scale) {
  return {
    ...ov,
    x: ov.x * scale,
    y: ov.y * scale,
    width: ov.width * scale,
    height: ov.height * scale,
    fontSize: ov.fontSize * scale,
  };
}

/**
 * displayToReal
 * Converts overlay coordinates from display (scaled) to real (full-size) coordinates.
 */
export function displayToReal(ov, scale) {
  return {
    ...ov,
    x: ov.x / scale,
    y: ov.y / scale,
    width: ov.width / scale,
    height: ov.height / scale,
    fontSize: ov.fontSize / scale,
  };
}