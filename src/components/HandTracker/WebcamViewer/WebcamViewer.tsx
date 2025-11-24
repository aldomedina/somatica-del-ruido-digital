/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RefObject } from "react";
import Webcam from "react-webcam";

import css from "./WebcamViewer.module.css";

type WebcamViewerType = {
  webcamOn: boolean;
  setWebcamOn: (state: boolean) => void;
  webcamRef: RefObject<any>;
  mediapipeCamRef: RefObject<any>;
};

function WebcamViewer({
  webcamOn,
  setWebcamOn,
  webcamRef,
  mediapipeCamRef,
}: WebcamViewerType) {
  return (
    <div className={css.container}>
      <button
        className={css.webcamButton}
        onClick={() => {
          if (webcamOn) {
            mediapipeCamRef.current?.stop();
          } else {
            mediapipeCamRef.current?.start();
          }
          setWebcamOn(!webcamOn);
        }}
      >
        Toggle Webcam
      </button>
      {webcamOn && <Webcam ref={webcamRef} className={css.webcam} mirrored />}
    </div>
  );
}

export default WebcamViewer;
