import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useControls, Leva } from "leva";
import Scene3D from "../three/Scene3D";

function ScenePage() {
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
        <Scene3D collapse={collapse} />
      </Canvas>
    </div>
  );
}

export default ScenePage;
