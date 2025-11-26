// utils/precomputeTiles.ts
import * as THREE from "three";

export type PrecomputeResult = {
  gridX: number;
  gridY: number;
  tileSize: number; // pixels (assume square tiles)
  texWidth: number;
  texHeight: number;
  permTexture: THREE.DataTexture; // float RGBA where .xy is src tile UV (0..1)
  rankArray: Float32Array; // normalized distance-from-center per dest cell (0..1)
};

function luminance(r: number, g: number, b: number) {
  // standard luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function precomputeTiles(
  image: HTMLImageElement | HTMLCanvasElement,
  sizePx: number
): PrecomputeResult {
  // ensure integer size
  const tileSize = Math.max(1, Math.floor(sizePx));

  // use image dimensions
  const texWidth = image.width;
  const texHeight = image.height;

  // compute grid
  const gridX = Math.max(1, Math.round(texWidth / tileSize));
  const gridY = Math.max(1, Math.round(texHeight / tileSize));
  const cells = gridX * gridY;

  // draw image into offscreen canvas at original size
  const canvas = document.createElement("canvas");
  canvas.width = texWidth;
  canvas.height = texHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, texWidth, texHeight);

  // get raw pixel data once
  const imgData = ctx.getImageData(0, 0, texWidth, texHeight).data;

  // compute avg luminance per source tile and store source tile coords
  type TileInfo = { sx: number; sy: number; lum: number };
  const tiles: TileInfo[] = [];

  for (let ty = 0; ty < gridY; ty++) {
    for (let tx = 0; tx < gridX; tx++) {
      const x0 = Math.floor((tx * texWidth) / gridX);
      const y0 = Math.floor((ty * texHeight) / gridY);
      const x1 = Math.floor(((tx + 1) * texWidth) / gridX);
      const y1 = Math.floor(((ty + 1) * texHeight) / gridY);
      let sum = 0;
      let count = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = (y * texWidth + x) * 4;
          const r = imgData[idx] / 255;
          const g = imgData[idx + 1] / 255;
          const b = imgData[idx + 2] / 255;
          sum += luminance(r, g, b);
          count++;
        }
      }
      const avgLum = count > 0 ? sum / count : 0;
      tiles.push({ sx: tx, sy: ty, lum: avgLum });
    }
  }

  // sort source tiles by luminance ascending (dark -> light)
  const sortedSources = tiles.slice().sort((a, b) => a.lum - b.lum);

  // compute destination order by distance to center (center-first)
  const cx = (gridX - 1) * 0.5;
  const cy = (gridY - 1) * 0.5;
  const maxd = Math.hypot(cx, cy);

  const destPositions: {
    dx: number;
    dy: number;
    dnorm: number;
    index: number;
  }[] = [];
  let di = 0;
  for (let y = 0; y < gridY; y++) {
    for (let x = 0; x < gridX; x++) {
      const d = Math.hypot(x - cx, y - cy);
      destPositions.push({ dx: x, dy: y, dnorm: d / maxd, index: di });
      di++;
    }
  }

  // sort dest positions by dnorm ascending (center first)
  destPositions.sort((a, b) => a.dnorm - b.dnorm);

  // Now assign: for each position in destPositions[i], assign source = sortedSources[i]
  // Create perm data where for each dest cell (in normal index order y*gridX + x)
  // we store the src tile uv as (srcX/gridX, srcY/gridY)
  const permData = new Float32Array(cells * 4);
  // prepare rankArray = distance normalized for each dest in normal order
  const rankArray = new Float32Array(cells);

  // mapping: destPositions[i] -> source sortedSources[i]
  for (let i = 0; i < destPositions.length; i++) {
    const dest = destPositions[i];
    const src = sortedSources[i % sortedSources.length]; // safe
    // compute dest index in normal order
    const destIndex = dest.dy * gridX + dest.dx;

    const u = src.sx / gridX; // normalized origin uv (0..1)
    const v = src.sy / gridY;

    permData[destIndex * 4 + 0] = u;
    permData[destIndex * 4 + 1] = v;
    permData[destIndex * 4 + 2] = 0.0;
    permData[destIndex * 4 + 3] = 1.0;

    rankArray[destIndex] = dest.dnorm;
  }

  // create DataTexture (float)
  const permTexture = new THREE.DataTexture(
    permData,
    gridX,
    gridY,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  permTexture.needsUpdate = true;
  permTexture.magFilter = THREE.NearestFilter;
  permTexture.minFilter = THREE.NearestFilter;
  permTexture.wrapS = THREE.ClampToEdgeWrapping;
  permTexture.wrapT = THREE.ClampToEdgeWrapping;

  return {
    gridX,
    gridY,
    tileSize,
    texWidth,
    texHeight,
    permTexture,
    rankArray,
  };
}
