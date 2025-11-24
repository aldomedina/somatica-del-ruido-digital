import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ✅ CORREGIDO: Interface coincide EXACTAMENTE con TileData de getTilesAndAtlas.ts
interface TileData {
  origPos: [number, number];
  targetPos: [number, number];
  rank: number;
  uvOffset: [number, number];
}

interface SuperPixelPlaneProps {
  tiles: TileData[];
  atlas: HTMLCanvasElement;
  tileSize: number;
  cols: number;
  rows: number;
  progress: number;
  threshold: number;
  position: [number, number, number];
  scale: number;
  planeIndex: number;
}

export default function SuperPixelPlane({
  tiles,
  atlas,
  tileSize,
  cols,
  rows,
  progress,
  threshold,
  position,
  scale,
}: SuperPixelPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  /** -----------------------------------------
   * 1) Crear THREE.Texture del atlas
   * ----------------------------------------- */
  const atlasTexture = useMemo(() => {
    const texture = new THREE.CanvasTexture(atlas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, [atlas]);

  /** -----------------------------------------
   * 2) Quad base (vec2) – NO usa attribute "position"
   * ----------------------------------------- */
  const baseGeometry = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry();

    // Quad Vertices (centered on 0,0) en espacio unitario
    const quadVerts = new Float32Array([
      -0.5,
      -0.5, // bottom-left
      0.5,
      -0.5, // bottom-right
      0.5,
      0.5, // top-right
      -0.5,
      0.5, // top-left
    ]);

    const quadIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    g.setIndex(new THREE.BufferAttribute(quadIndices, 1));
    g.setAttribute("a_quadPos", new THREE.Float32BufferAttribute(quadVerts, 2));

    g.instanceCount = tiles.length;
    return g;
  }, [tiles.length]);

  /** -----------------------------------------
   * 3) Instanced attributes
   * ----------------------------------------- */
  useMemo(() => {
    const N = tiles.length;

    const orig = new Float32Array(N * 2);
    const target = new Float32Array(N * 2);
    const uvOffset = new Float32Array(N * 2);
    const rank = new Float32Array(N);

    tiles.forEach((t, i) => {
      // ✅ CORREGIDO: usar arrays [x, y] en vez de propiedades individuales
      orig[i * 2 + 0] = t.origPos[0];
      orig[i * 2 + 1] = t.origPos[1];

      target[i * 2 + 0] = t.targetPos[0];
      target[i * 2 + 1] = t.targetPos[1];

      // ✅ CORREGIDO: uvOffset es [u, v] ya normalizado (0-1)
      uvOffset[i * 2 + 0] = t.uvOffset[0];
      uvOffset[i * 2 + 1] = t.uvOffset[1];

      rank[i] = t.rank;
    });

    baseGeometry.setAttribute(
      "a_origPos",
      new THREE.InstancedBufferAttribute(orig, 2)
    );
    baseGeometry.setAttribute(
      "a_targetPos",
      new THREE.InstancedBufferAttribute(target, 2)
    );
    baseGeometry.setAttribute(
      "a_uvOffset",
      new THREE.InstancedBufferAttribute(uvOffset, 2)
    );
    baseGeometry.setAttribute(
      "a_rank",
      new THREE.InstancedBufferAttribute(rank, 1)
    );

    return baseGeometry;
  }, [tiles, baseGeometry]);

  /** -----------------------------------------
   * 4) Uniforms - ✅ CORREGIDO: crear UNA vez, actualizar en useFrame
   * ----------------------------------------- */
  const [uniforms] = useState(() => ({
    u_progress: { value: progress },
    u_threshold: { value: threshold },
    u_atlas: { value: atlasTexture },
    u_cols: { value: cols },
    u_rows: { value: rows },
    u_tileSize: { value: tileSize },
    u_totalTiles: { value: tiles.length },
  }));

  // ✅ Actualizar uniforms dinámicos cada frame
  useFrame(() => {
    if (!meshRef.current) return;

    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.u_progress.value = progress;
    mat.uniforms.u_threshold.value = threshold;
  });

  /** -----------------------------------------
   * 5) Shader - ✅ CORREGIDO: UV calculation y tileSize
   * ----------------------------------------- */
  const vertexShader = /* glsl */ `
    attribute vec2 a_quadPos;
    attribute vec2 a_origPos;
    attribute vec2 a_targetPos;
    attribute vec2 a_uvOffset;
    attribute float a_rank;

    uniform float u_progress;
    uniform float u_tileSize;
    uniform float u_cols;
    uniform float u_rows;

    varying vec2 vUv;
    varying float vRank;
    varying float vNormDist;

    void main() {
      // Calcular campo de distancia desde el centro
      vec2 center = vec2(u_cols - 1.0, u_rows - 1.0) * 0.5;
      float distToCenter = distance(a_origPos, center);
      float maxDist = distance(vec2(0.0), center);
      vNormDist = distToCenter / maxDist;

      // Interpolación de posición en grid coords
      vec2 gridPos = mix(a_origPos, a_targetPos, u_progress);

      // ✅ CORREGIDO: Escalar quad por tileSize
      vec2 scaledQuad = a_quadPos * u_tileSize;

      // Posición final en espacio world (grid coords * tileSize)
      vec3 finalPos = vec3(gridPos * u_tileSize + scaledQuad, 0.0);

      // ✅ CORREGIDO: Cálculo correcto de UV
      // a_quadPos va de -0.5 a 0.5, lo convertimos a 0-1
      vec2 localUV = a_quadPos + 0.5;

      // Normalizar por el tamaño de un tile en el atlas
      vec2 tileSizeUV = vec2(1.0 / u_cols, 1.0 / u_rows);

      // UV final = offset del tile + UV local escalado al tamaño del tile
      vUv = a_uvOffset + localUV * tileSizeUV;

      vRank = a_rank;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform sampler2D u_atlas;
    uniform float u_threshold;
    uniform float u_progress;
    uniform float u_totalTiles;

    varying vec2 vUv;
    varying float vRank;
    varying float vNormDist;

    void main() {
      // Combinar distancia normalizada con rank para el fade-in
      // vNormDist: 0 en el centro, 1 en los bordes
      // threshold: 0.06 = muestra solo centro, 1.0 = muestra todo

      // Usar distancia como criterio principal (igual que SingleSuperPixelPlane)
      bool isActive = vNormDist < u_threshold;

      if (!isActive) discard;

      vec4 color = texture2D(u_atlas, vUv);

      // Discard transparentes
      if (color.a < 0.001) discard;

      gl_FragColor = color;
    }
  `;

  return (
    <mesh
      ref={meshRef}
      geometry={baseGeometry}
      scale={[scale * 0.01, scale * 0.01, 1]}
      position={position}
    >
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
