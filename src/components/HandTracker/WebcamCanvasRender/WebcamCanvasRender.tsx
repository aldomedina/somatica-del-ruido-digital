/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, type RefObject } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Hands, type Handedness } from "@mediapipe/hands";

type WebcamCanvasRenderType = {
  webcamRef: RefObject<any>;
  canvasRef: RefObject<any>;
  mediapipeCamRef: RefObject<any>;
  setPinchDistance: (state: number) => void;
  setPointerPosition: (pos: { x: number; y: number }) => void;
};

function WebcamCanvasRender({
  webcamRef,
  canvasRef,
  mediapipeCamRef,
  setPinchDistance,
  setPointerPosition,
}: WebcamCanvasRenderType) {
  const onResults = (results: any) => {
    if (!webcamRef.current?.video || !canvasRef.current) return;
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    if (canvasCtx == null) throw new Error("Could not get context");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Only overwrite existing pixels.
    canvasCtx.globalCompositeOperation = "source-in";
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = "destination-atop";
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    canvasCtx.globalCompositeOperation = "source-over";
    if (results.multiHandLandmarks && results.multiHandLandmarks.length) {
      const leftHandIndex = results.multiHandedness.find(
        (x: Handedness) => x.label === "Left"
      );
      if (leftHandIndex) {
        const leftHand =
          results.multiHandLandmarks[
            results.multiHandLandmarks.length === 1 ? 0 : leftHandIndex.index
          ];
        const thumbPoint = leftHand[4];
        const pointerPoint = leftHand[8];

        const pinchPoints = [thumbPoint, pointerPoint];
        const pinchConnection: [number, number][] = [[0, 1]];

        // Send the data of pinch distance
        const pinchDistance = Math.round(
          Math.hypot(
            thumbPoint.x - pointerPoint.x,
            thumbPoint.y - pointerPoint.y
          ) * 10
        );

        drawLandmarks(canvasCtx, [pointerPoint], {
          color: "#FF0000",
          lineWidth: 2,
        });
        if (pinchDistance > 0) {
          drawConnectors(canvasCtx, pinchPoints, pinchConnection, {
            color: "#00FF00",
            lineWidth: 5,
          });
        }

        setPinchDistance(pinchDistance);
        setPointerPosition({
          x: Math.round(pointerPoint.x * 100),
          y: Math.round(pointerPoint.y * 100),
        });
      }
      // const rightHandIndex = results.multiHandedness.find(
      //   (x: Handedness) => x.label === "Right"
      // );
      // if (rightHandIndex) {
      //   const rightHand =
      //     results.multiHandLandmarks[
      //       results.multiHandLandmarks.length === 1 ? 0 : rightHandIndex.index
      //     ];
      //   const pointerPoint = rightHand[8];
      //   const fingerPoints = [pointerPoint];
      //   drawLandmarks(canvasCtx, fingerPoints, {
      //     color: "#941db5ff",
      //     lineWidth: 2,
      //   });

      //   setPointerPosition({
      //     x: Math.round(pointerPoint.x * 100),
      //     y: Math.round(pointerPoint.y * 100),
      //   });
      // }
    }
    canvasCtx.restore();
  };

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });
    hands.setOptions({
      selfieMode: true,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      maxNumHands: 2,
    });
    hands.onResults(onResults);

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      if (!webcamRef.current?.video) return;
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (!webcamRef.current?.video) return;
          await hands.send({ image: webcamRef.current.video });
        },
      });
      camera.start();
      mediapipeCamRef.current = camera;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} />;
}

export default WebcamCanvasRender;
