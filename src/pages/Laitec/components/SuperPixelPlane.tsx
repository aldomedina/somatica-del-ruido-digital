import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";

import fragmentShader from "./fragmentShader";
import vertexShader from "./vertexShader";
import precomputeTiles from "../utils/precomputeTiles";

import type { Texture } from "three";

type Props = { texture: Texture };

const PIXEL_SIZE = 16;

export default function SuperPixelPlane({ texture }: Props) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const [perm, setPerm] = useState<{
    permTexture: THREE.DataTexture;
    gridX: number;
    gridY: number;
    tileSize: number;
    texWidth: number;
    texHeight: number;
  } | null>(null);

  const controls = useControls({
    reveal: { value: 0.08, min: 0.08, max: 1, step: 0.01 },
  });

  useEffect(() => {
    if (!texture || !texture.image) return;
    const img = texture.image as HTMLImageElement | HTMLCanvasElement;

    const res = precomputeTiles(img, PIXEL_SIZE);
    res.permTexture.needsUpdate = true;

    setPerm({
      permTexture: res.permTexture,
      gridX: res.gridX,
      gridY: res.gridY,
      tileSize: res.tileSize,
      texWidth: res.texWidth,
      texHeight: res.texHeight,
    });
  }, [texture, PIXEL_SIZE]);

  // Create uniforms, update when perm or texture change
  const uniforms = useMemo(() => {
    return {
      uImage: { value: texture },
      uPerm: { value: perm ? perm.permTexture : null },
      uTileSize: { value: perm ? perm.tileSize : 16.0 },
      uGrid: {
        value: perm
          ? new THREE.Vector2(perm.gridX, perm.gridY)
          : new THREE.Vector2(1, 1),
      },
      uThreshold: { value: controls.reveal },
      uProgress: { value: controls.reveal },
      uTexSize: {
        value: perm
          ? new THREE.Vector2(perm.texWidth, perm.texHeight)
          : new THREE.Vector2(1, 1),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture, perm]);

  useFrame(() => {
    if (!matRef.current) return;
    const mat = matRef.current as THREE.ShaderMaterial;

    mat.uniforms.uPerm.value = perm?.permTexture ?? null;
    mat.uniforms.uImage.value = texture;

    mat.uniforms.uTileSize.value = perm ? perm.tileSize : PIXEL_SIZE;
    mat.uniforms.uGrid.value = new THREE.Vector2(
      perm?.gridX ?? 1,
      perm?.gridY ?? 1
    );
    mat.uniforms.uTexSize.value = new THREE.Vector2(
      perm?.texWidth ?? 1,
      perm?.texHeight ?? 1
    );

    mat.uniforms.uThreshold.value = controls.reveal;
    mat.uniforms.uProgress.value = controls.reveal;

    console.log(matRef);
  });

  const aspect =
    texture && texture.image
      ? (texture.image as HTMLImageElement).width /
        (texture.image as HTMLImageElement).height
      : 1;

  return (
    <mesh scale={[aspect, 1, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}
