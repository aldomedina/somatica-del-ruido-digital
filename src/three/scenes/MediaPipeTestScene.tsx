import { useEffect, useState } from "react";
import * as THREE from "three";
import { computeTilesAndPermutation } from "../../utils/computeTilesAndPermutation";
import SingleSuperPixelPlane from "../components/SingleSuperPixelPlane";

interface SceneState {
  ready: boolean;
  imageTexture: THREE.Texture | null;
  permTexture: THREE.DataTexture | null;
  cols: number;
  rows: number;
  width: number;
  height: number;
}

interface MediaPipeTestSceneProps {
  collapse: number;
}

function MediaPipeTestScene({ collapse }: MediaPipeTestSceneProps) {
  const [state, setState] = useState<SceneState>({
    ready: false,
    imageTexture: null,
    permTexture: null,
    cols: 0,
    rows: 0,
    width: 0,
    height: 0,
  });

  const tileSize = 16;
  const src = "/test.png";

  const threshold = collapse;
  const progress = 1.0 - collapse;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const snapW = Math.round(img.width / tileSize) * tileSize;
      const snapH = Math.round(img.height / tileSize) * tileSize;

      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = snapW;
      tmpCanvas.height = snapH;
      const tx = tmpCanvas.getContext("2d")!;
      tx.drawImage(img, 0, 0, snapW, snapH);

      const imgEl = new Image();
      imgEl.src = tmpCanvas.toDataURL();
      imgEl.onload = () => {
        const tex = new THREE.Texture(imgEl);
        tex.needsUpdate = true;
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearMipMapLinearFilter;

        const { cols, rows, permTex, width, height } =
          computeTilesAndPermutation(imgEl, tileSize);

        setState({
          ready: true,
          imageTexture: tex,
          permTexture: permTex,
          cols,
          rows,
          width,
          height,
        });
      };
    };
    img.src = src;
  }, [src]);

  if (!state.ready || !state.imageTexture || !state.permTexture) {
    return null;
  }

  return (
    <>
      <ambientLight />
      <SingleSuperPixelPlane
        imageTexture={state.imageTexture}
        permTexture={state.permTexture}
        cols={state.cols}
        rows={state.rows}
        tileSize={tileSize}
        texSize={[state.width, state.height]}
        threshold={threshold}
        progress={progress}
      />
    </>
  );
}

export default MediaPipeTestScene;
