import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import SuperPixelWall from "../three/scenes/SuperPixelWall";

function SuperPixelPage() {
  return (
    <div style={{ height: "100%", position: "relative" }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <OrbitControls enableRotate={false} />
        <SuperPixelWall
          imageSrc="/test.png"
          numImages={100}
          tileSize={32}
        />
      </Canvas>
    </div>
  );
}

export default SuperPixelPage;
