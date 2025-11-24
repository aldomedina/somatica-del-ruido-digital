import { useEffect, useState } from "react";
import { getTilesAndAtlas, type TileData } from "../../utils/getTilesAndAtlas";
import SuperPixelPlane from "../components/SuperPixelPlane";
import { useFrame } from "@react-three/fiber";

interface SuperPixelSceneProps {
  imageSrc: string;
  isActive: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

export default function SuperPixelScene({
  imageSrc,
  isActive,
}: SuperPixelSceneProps) {
  const [data, setData] = useState<{
    tiles: TileData[];
    atlas: HTMLCanvasElement;
    cols: number;
    rows: number;
  } | null>(null);

  const [collapse, setCollapse] = useState(0.06);

  // Animar collapse entre 0.06 (idle) y 1.0 (active)
  useFrame((_, delta) => {
    const target = isActive ? 1.0 : 0.06;
    const speed = 3.0; // Velocidad de la animación
    const diff = target - collapse;

    if (Math.abs(diff) > 0.001) {
      setCollapse((prev) => prev + diff * speed * delta);
    }
  });

  const threshold = collapse;
  const progress = 1.0 - collapse;

  useEffect(() => {
    async function load() {
      const img = new Image();
      img.src = imageSrc;
      await img.decode();

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const { tiles, atlas } = await getTilesAndAtlas(canvas, 32);
      console.log({ tiles, atlas });
      setData({
        tiles,
        atlas,
        cols: img.width / 32,
        rows: img.height / 32,
      });
    }

    load();
  }, [imageSrc]);

  if (!data) return null;

  return (
    <SuperPixelPlane
      tiles={data.tiles}
      atlas={data.atlas}
      tileSize={32}
      cols={data.cols}
      rows={data.rows}
      progress={progress}
      threshold={threshold}
      position={[-2, -3, 0]}
      scale={100}
      planeIndex={0}
    />
  );
}
