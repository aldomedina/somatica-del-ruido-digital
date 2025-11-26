import { useLoader } from "@react-three/fiber";
import { Suspense } from "react";
import { TextureLoader } from "three";
import LaitecScene from "./components/LaitecScene";

function Laitec() {
  const texture = useLoader(TextureLoader, "/test.png");

  return (
    <div style={{ height: "100%", position: "relative" }}>
      {/* Suspense para la carga de textura */}
      <Suspense fallback={<div>Loading texture...</div>}>
        <LaitecScene texture={texture} />
      </Suspense>
    </div>
  );
}

export default Laitec;
