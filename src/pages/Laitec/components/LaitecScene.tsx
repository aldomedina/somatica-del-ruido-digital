import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Texture } from "three";
import SuperpixelPlane from "./SuperPixelPlane";

type Props = {
  texture: Texture;
};

export default function LaitecScene({ texture }: Props) {
  return (
    <Canvas
      orthographic={false}
      camera={{ position: [0, 0, 2], fov: 50 }}
      gl={{ preserveDrawingBuffer: false }}
    >
      <OrbitControls enablePan={false} enableZoom={true} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />

      <SuperpixelPlane texture={texture} />
    </Canvas>
  );
}
