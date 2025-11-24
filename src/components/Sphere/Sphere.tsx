import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
export default function Sphere({
  x = 0,
  y = 0,
  z = 0,
  radius = 1,
  color = "hotpink",
}) {
  const { viewport } = useThree();
  // ancho y alto del viewport en coordenadas del mundo 3D

  // posición como vector
  const position = useMemo(() => {
    console.log(x, y, z);
    const { width, height } = viewport;
    // límites visibles en el plano donde z = 0

    const map = (
      value: number,
      inMin: number,
      inMax: number,
      outMin: number,
      outMax: number
    ) => {
      return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
    };

    const worldX = map(x, 0, 100, -width / 2, width / 2);
    const worldY = map(y, 0, 100, -height / 2, height / 2);

    return [worldX, -worldY, z];
  }, [x, y, z, viewport]);

  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
