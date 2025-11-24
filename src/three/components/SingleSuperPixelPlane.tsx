import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { vertexShader } from "../shaders/superpixelBeta/vertex";
import { fragmentShader } from "../shaders/superpixelBeta/fragment";

interface SingleSuperPixelPlaneProps {
  imageTexture: THREE.Texture;
  permTexture: THREE.DataTexture;
  cols: number;
  rows: number;
  tileSize: number;
  texSize: number[];
  threshold: number;
  progress: number;
}

export default function SingleSuperPixelPlane({
  imageTexture,
  permTexture,
  cols,
  rows,
  tileSize,
  texSize,
  threshold,
  progress,
}: SingleSuperPixelPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const [uniforms] = useState(() => ({
    uImage: { value: imageTexture },
    uPerm: { value: permTexture },
    uTileSize: { value: tileSize },
    uGrid: { value: new THREE.Vector2(cols, rows) },
    uThreshold: { value: threshold },
    uProgress: { value: progress },
    uTexSize: { value: new THREE.Vector2(texSize[0], texSize[1]) },
  }));

  useFrame(() => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      if (material && material.uniforms) {
        material.uniforms.uThreshold.value = threshold;
        material.uniforms.uProgress.value = progress;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[texSize[0] / 100, texSize[1] / 100, 1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}
