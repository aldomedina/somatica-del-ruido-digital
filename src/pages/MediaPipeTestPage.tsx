import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useControls, Leva } from "leva";
import MediaPipeTestScene from "../three/scenes/MediaPipeTestScene";

function MediaPipeTestPage() {
  const { collapse } = useControls({
    collapse: {
      value: 0.5,
      min: 0.06,
      max: 1,
      step: 0.01,
      label: "Collapse Amount",
    },
  });

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <Leva />
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <OrbitControls />
        <MediaPipeTestScene collapse={collapse} />
      </Canvas>
    </div>
  );
}

export default MediaPipeTestPage;
