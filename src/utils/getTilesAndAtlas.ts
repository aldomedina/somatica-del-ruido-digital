import _ from "lodash";

export interface TileData {
  origPos: [number, number];
  targetPos: [number, number];
  rank: number;
  uvOffset: [number, number];
}

export async function getTilesAndAtlas(
  img: HTMLCanvasElement,
  tileSize: number
): Promise<{ tiles: TileData[]; atlas: HTMLCanvasElement }> {
  const w = img.width;
  const h = img.height;

  // Usar Math.floor para asegurar que cols y rows sean enteros
  // Esto procesa solo los tiles completos que caben en la imagen
  const cols = Math.floor(w / tileSize);
  const rows = Math.floor(h / tileSize);
  const cells = cols * rows;

  // 1. Cortar tiles + complejidad
  const tilesRaw: {
    c: number;
    x: number;
    y: number;
    canvas: HTMLCanvasElement;
  }[] = [];

  for (let i = 0; i < cells; i++) {
    const x = i % cols;
    const y = Math.floor(i / cols);

    const t = document.createElement("canvas");
    t.width = tileSize;
    t.height = tileSize;
    const tx = t.getContext("2d")!;
    tx.drawImage(
      img,
      x * tileSize,
      y * tileSize,
      tileSize,
      tileSize,
      0,
      0,
      tileSize,
      tileSize
    );

    const complexity = t.toDataURL().length / (tileSize * tileSize);
    tilesRaw.push({ c: complexity, x, y, canvas: t });
  }

  // 2. Rank por complejidad
  const sorted = _.sortBy(tilesRaw, "c");

  // 3. Campo de distancias
  const centerX = cols / 2;
  const centerY = rows / 2;

  const dist = (x: number, y: number) =>
    Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

  // 4. Posición final
  const ordered = _.sortBy(
    [...Array(cells).keys()].map((i) => {
      const x = i % cols;
      const y = Math.floor(i / cols);
      return { x, y, d: dist(x, y) };
    }),
    "d"
  );

  // Mapeo: tile rank N → posición spiral N
  const tiles: TileData[] = sorted.map((t, i) => {
    const target = ordered[i]; // posición colapsada
    return {
      origPos: [t.x, t.y],
      targetPos: [target.x, target.y],
      rank: i,
      uvOffset: [0, 0], // luego se llena con atlas packing
    };
  });

  // 5. Packing del atlas
  const atlas = document.createElement("canvas");
  atlas.width = cols * tileSize;
  atlas.height = rows * tileSize;
  const ax = atlas.getContext("2d")!;

  tiles.forEach((tile, i) => {
    const t = sorted[i].canvas;
    const axPosX = tile.origPos[0] * tileSize;
    const axPosY = tile.origPos[1] * tileSize;

    ax.drawImage(t, axPosX, axPosY);

    tile.uvOffset = [axPosX / atlas.width, axPosY / atlas.height];
  });

  return { tiles, atlas };
}
