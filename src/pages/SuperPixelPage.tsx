import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SuperPixelWall from "../three/scenes/SuperPixelWall";
import imagePaths from "../data/imagePaths";

function SuperPixelPage() {
  // Empezar con 10 imágenes para probar
  const imgPaths = imagePaths.slice(0, 10);
  return (
    <div style={{ height: "100%", position: "relative" }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <OrbitControls enableRotate={false} />
        <SuperPixelWall imagePaths={imgPaths} tileSize={32} />
      </Canvas>
    </div>
  );
}

export default SuperPixelPage;
