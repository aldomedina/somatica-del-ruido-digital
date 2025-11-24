import { useEffect, useState, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getTilesAndAtlas, type TileData } from "../../utils/getTilesAndAtlas";
import SuperPixelPlane from "../components/SuperPixelPlane";

interface ImageData {
  tiles: TileData[];
  atlas: HTMLCanvasElement;
  cols: number;
  rows: number;
  position: [number, number, number];
  scale: number;
}

interface SuperPixelWallProps {
  imagePaths: string[];
  numImages?: number;
  tileSize?: number;
}

export default function SuperPixelWall({
  imagePaths,
  numImages,
  tileSize = 32,
}: SuperPixelWallProps) {
  // Si no se especifica numImages, usar todas las imágenes del array
  const totalImages = numImages || imagePaths.length;
  const [imagesData, setImagesData] = useState<ImageData[]>([]);
  const collapseTargets = useRef<number[]>([]);
  const hoverIndex = useRef<number>(-1);
  const { viewport } = useThree();

  // Inicializar collapse states directamente
  const [collapseStates, setCollapseStates] = useState<number[]>(() =>
    new Array(totalImages).fill(0.06)
  );

  // Inicializar targets
  useEffect(() => {
    collapseTargets.current = new Array(totalImages).fill(0.06);
  }, [totalImages]);

  // Cargar todas las imágenes (en paralelo, con límite)
  useEffect(() => {
    let cancelled = false;

    async function loadImages() {
      console.log(
        `[LOAD] Starting to load ${totalImages} images (${imagePaths.length} available)...`
      );

      // Usar las imágenes del array proporcionado
      const selectedPaths = imagePaths.slice(0, totalImages);

      // Generar posiciones aleatorias
      const positions = generateRandomPositions(totalImages, viewport);

      // Cargar imágenes en lotes para no saturar el navegador
      const BATCH_SIZE = 50;
      const data: ImageData[] = [];

      for (let i = 0; i < selectedPaths.length; i += BATCH_SIZE) {
        if (cancelled) break;

        const batch = selectedPaths.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(
          async (imgPath: string, batchIndex: number) => {
            const globalIndex = i + batchIndex;

            try {
              const img = new Image();

              // Usar una Promise para manejar la carga correctamente
              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = (e) => reject(new Error(`Failed to load: ${e}`));
                img.src = imgPath;
              });

              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d")!;
              ctx.drawImage(img, 0, 0);

              const { tiles, atlas } = await getTilesAndAtlas(canvas, tileSize);
              const cols = img.width / tileSize;
              const rows = img.height / tileSize;

              return {
                tiles,
                atlas,
                cols,
                rows,
                position: positions[globalIndex].position,
                scale: positions[globalIndex].scale,
              };
            } catch (error) {
              console.error(
                `[ERROR] Failed to load image ${imgPath}:`,
                error instanceof Error ? error.message : error
              );
              return null;
            }
          }
        );

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(
          (r: ImageData | null): r is ImageData => r !== null
        );
        data.push(...validResults);

        console.log(
          `[LOAD] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(selectedPaths.length / BATCH_SIZE)} completed (${data.length} images loaded)`
        );

        if (!cancelled) {
          setImagesData([...data]);
        }
      }

      if (!cancelled) {
        console.log(`[LOAD] Finished loading ${data.length} images`);
      }
    }

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [imagePaths, totalImages, tileSize, viewport]);

  // Animación y hover detection centralizada
  useFrame((state, delta) => {
    if (imagesData.length === 0) return;

    // 1. Hover detection centralizada con un solo raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(state.pointer, state.camera);

    let newHoverIndex = -1;

    // Verificar cada plano
    for (let i = 0; i < imagesData.length; i++) {
      const img = imagesData[i];
      const [x, y, z] = img.position;
      const scale = img.scale;

      // Tamaño del plano en world space
      const planeWidth = img.cols * tileSize * scale * 0.01;
      const planeHeight = img.rows * tileSize * scale * 0.01;

      // Bounding box
      const minX = x;
      const maxX = x + planeWidth;
      const minY = y;
      const maxY = y + planeHeight;

      // Intersección con plano Z
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, -1), -z);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeZ, intersectPoint);

      if (
        intersectPoint &&
        intersectPoint.x >= minX &&
        intersectPoint.x <= maxX &&
        intersectPoint.y >= minY &&
        intersectPoint.y <= maxY
      ) {
        newHoverIndex = i;
        break; // Solo un plano puede estar en hover a la vez
      }
    }

    // Actualizar targets basado en hover
    if (newHoverIndex !== hoverIndex.current) {
      // Desactivar el anterior
      if (hoverIndex.current !== -1) {
        collapseTargets.current[hoverIndex.current] = 0.06;
      }

      // Activar el nuevo
      if (newHoverIndex !== -1) {
        collapseTargets.current[newHoverIndex] = 1.0;
      }

      hoverIndex.current = newHoverIndex;
    }

    // 2. Animar collapse hacia target
    const speed = 3.0;
    const newCollapseStates = [...collapseStates];
    let hasChanges = false;

    for (let i = 0; i < numImages; i++) {
      const target = collapseTargets.current[i];
      const current = collapseStates[i];
      const diff = target - current;

      if (Math.abs(diff) > 0.001) {
        newCollapseStates[i] = current + diff * speed * delta;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setCollapseStates(newCollapseStates);
    }
  });

  if (imagesData.length === 0) return null;

  return (
    <>
      {imagesData.map((img, i) => {
        const collapse = collapseStates[i] || 0.06;
        const threshold = collapse;
        const progress = 1.0 - collapse;

        return (
          <SuperPixelPlane
            key={i}
            tiles={img.tiles}
            atlas={img.atlas}
            tileSize={tileSize}
            cols={img.cols}
            rows={img.rows}
            progress={progress}
            threshold={threshold}
            position={img.position}
            scale={img.scale}
            planeIndex={i}
          />
        );
      })}
    </>
  );
}

/**
 * Genera posiciones aleatorias distribuidas en el viewport
 */
function generateRandomPositions(
  count: number,
  viewport: { width: number; height: number }
): Array<{ position: [number, number, number]; scale: number }> {
  const positions: Array<{
    position: [number, number, number];
    scale: number;
  }> = [];

  // Grid aproximado para distribución inicial
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const cellWidth = viewport.width / cols;
  const cellHeight = viewport.height / rows;

  // Escala base proporcional al espacio disponible
  const baseScale = Math.min(cellWidth, cellHeight) * 0.6;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Posición base en grid
    const baseX = (col - cols / 2) * cellWidth;
    const baseY = (row - rows / 2) * cellHeight;

    // Jitter aleatorio dentro de la celda
    const jitterX = (Math.random() - 0.5) * cellWidth * 0.5;
    const jitterY = (Math.random() - 0.5) * cellHeight * 0.5;
    const jitterZ = (Math.random() - 0.5) * 2; // Variación en profundidad

    // Variación de escala
    const scaleVariation = 0.8 + Math.random() * 0.4; // 0.8x a 1.2x

    positions.push({
      position: [baseX + jitterX, baseY + jitterY, jitterZ],
      scale: baseScale * scaleVariation,
    });
  }

  return positions;
}
