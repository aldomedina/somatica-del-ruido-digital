import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import Scene3D from "../three/Scene3D";
import HandTracker from "../components/HandTracker/HandTracker";

function ScenePage() {
  const [pinchDistance, setPinchDistance] = useState<number>(0);
  // const { collapse } = useControls({
  //   collapse: {
  //     value: 0.5,
  //     min: 0.06,
  //     max: 1,
  //     step: 0.01,
  //     label: "Collapse Amount",
  //   },
  // });

  return (
    <div style={{ height: "100%", display: "flex", gap: "10px" }}>
      <HandTracker
        pinchDistance={pinchDistance}
        setPinchDistance={setPinchDistance}
      />
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <OrbitControls />
        <Scene3D collapse={pinchDistance * 0.2} />
      </Canvas>
    </div>
  );
}

export default ScenePage;
