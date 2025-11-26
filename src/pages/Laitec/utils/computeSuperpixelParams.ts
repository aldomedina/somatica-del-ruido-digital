// utils/computeSuperpixelParams.ts
import * as THREE from "three";

export type SuperpixelParams = {
  cols: number;
  rows: number;
  width: number;
  height: number;
  aspect: number;
  pixelUv: { x: number; y: number }; // 1/cols, 1/rows
};

export default function computeSuperpixelParams(
  texture: THREE.Texture,
  size: number
): SuperpixelParams {
  // texture.image puede ser HTMLImageElement o HTMLCanvasElement
  const img = texture.image as HTMLImageElement | HTMLCanvasElement | undefined;

  // Fallback a 1:1 si no hay imagen aún
  const width = img && (img.width as number) ? (img.width as number) : 1;
  const height = img && (img.height as number) ? (img.height as number) : 1;

  // Aseguramos size >= 1
  const sp = Math.max(1, Math.floor(size));

  // cols / rows cuantizados como enteros
  const cols = Math.max(1, Math.round(width / sp));
  const rows = Math.max(1, Math.round(height / sp));

  const aspect = width / height;

  const pixelUv = { x: 1 / cols, y: 1 / rows };

  return {
    cols,
    rows,
    width,
    height,
    aspect,
    pixelUv,
  };
}
