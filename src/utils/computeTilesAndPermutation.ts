import * as THREE from "three";

export function computeTilesAndPermutation(
  img: HTMLImageElement,
  tileSize: number
) {
  const w = img.width;
  const h = img.height;
  const cols = Math.floor(w / tileSize);
  const rows = Math.floor(h / tileSize);
  const cells = cols * rows;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const cx = canvas.getContext("2d", { willReadFrequently: true })!;
  cx.drawImage(img, 0, 0, w, h);

  const tiles = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const data = cx.getImageData(
        x * tileSize,
        y * tileSize,
        tileSize,
        tileSize
      ).data;
      let sum = 0,
        sumSq = 0;
      const n = tileSize * tileSize;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        sum += L;
        sumSq += L * L;
      }
      const mean = sum / n;
      const variance = sumSq / n - mean * mean;
      tiles.push({ x, y, idx: y * cols + x, complexity: variance });
    }
  }

  const sortedByComplexity = tiles
    .slice()
    .sort((a, b) => a.complexity - b.complexity);

  const centerX = (cols - 1) / 2;
  const centerY = (rows - 1) / 2;
  const orderedByCenter = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const d = Math.hypot(x - centerX, y - centerY);
      orderedByCenter.push({ x, y, idx: y * cols + x, dist: d });
    }
  }
  orderedByCenter.sort((a, b) => a.dist - b.dist);

  const perm = new Float32Array(cols * rows * 4);
  for (let i = 0; i < cells; i++) {
    const target = orderedByCenter[i];
    const source = sortedByComplexity[i];
    const tidx = target.idx;
    const su = source.x / cols;
    const sv = source.y / rows;
    perm[tidx * 4 + 0] = su;
    perm[tidx * 4 + 1] = sv;
    perm[tidx * 4 + 2] = 0;
    perm[tidx * 4 + 3] = 1;
  }

  const permTex = new THREE.DataTexture(
    perm,
    cols,
    rows,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  permTex.needsUpdate = true;
  permTex.magFilter = THREE.NearestFilter;
  permTex.minFilter = THREE.NearestFilter;
  permTex.wrapS = THREE.ClampToEdgeWrapping;
  permTex.wrapT = THREE.ClampToEdgeWrapping;

  return { cols, rows, permTex, width: w, height: h };
}
