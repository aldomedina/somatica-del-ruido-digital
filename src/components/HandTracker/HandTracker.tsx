import { useState, useRef } from "react";

import css from "./HandTracker.module.css";
import WebcamViewer from "./WebcamViewer/WebcamViewer";
import CanvasRender from "./WebcamCanvasRender/WebcamCanvasRender";

type pointerPositionType = {
  x: number;
  y: number;
};

type handTrackerType = {
  pinchDistance: number;
  setPinchDistance: (value: number) => void;
};

function HandTracker({ pinchDistance, setPinchDistance }: handTrackerType) {
  const [webcamOn, setWebcamOn] = useState<boolean>(false);
  const [pointerPosition, setPointerPosition] = useState<pointerPositionType>({
    x: 0,
    y: 0,
  });
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const mediapipeCamRef = useRef(null);

  return (
    <div className={css.container}>
      <WebcamViewer
        webcamOn={webcamOn}
        setWebcamOn={setWebcamOn}
        webcamRef={webcamRef}
        mediapipeCamRef={mediapipeCamRef}
      />
      {webcamOn && (
        <CanvasRender
          webcamRef={webcamRef}
          canvasRef={canvasRef}
          mediapipeCamRef={mediapipeCamRef}
          setPinchDistance={setPinchDistance}
          setPointerPosition={setPointerPosition}
        />
      )}
      <div>Pinch Level: {pinchDistance}</div>
      <div>
        Pointer Position: ({pointerPosition.x}, {pointerPosition.y})
      </div>
    </div>
  );
}

export default HandTracker;
