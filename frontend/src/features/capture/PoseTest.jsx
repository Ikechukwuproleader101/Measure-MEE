// TEMP TEST - REMOVE
import { useEffect, useRef, useState } from "react";
import {
  DrawingUtils,
  FilesetResolver,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

export default function PoseTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [delegate, setDelegate] = useState("CPU");
  const [dims, setDims] = useState({ w: 4, h: 3 });
  const [info, setInfo] = useState({
    status: "Loading...",
    fps: 0,
    points: 0,
    nose: "-",
    video: "-",
  });

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let stream = null;
    let landmarker = null;

    (async () => {
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/pose_landmarker_lite.task",
          delegate,
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      if (cancelled) return;

      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (cancelled) return;

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      if (cancelled) return;

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      setDims({ w: video.videoWidth, h: video.videoHeight });
      const ctx = canvas.getContext("2d");
      const drawing = new DrawingUtils(ctx);

      let lastVideoTime = -1;
      let frames = 0;
      let lastReport = performance.now();
      let lastLm = null;
      let loggedFirst = false;

      const loop = () => {
        if (cancelled) return;
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const result = landmarker.detectForVideo(video, performance.now());
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          lastLm = result.landmarks && result.landmarks[0];
          if (lastLm) {
            drawing.drawConnectors(lastLm, PoseLandmarker.POSE_CONNECTIONS);
            drawing.drawLandmarks(lastLm, { radius: 3 });
          }
          if (!loggedFirst) {
            console.log("first detection result", result);
            loggedFirst = true;
          }
          frames++;
        }
        const now = performance.now();
        if (now - lastReport >= 1000) {
          setInfo({
            status: lastLm ? "Person detected" : "No person detected",
            fps: frames,
            points: lastLm ? lastLm.length : 0,
            nose: lastLm
              ? `${lastLm[0].x.toFixed(2)}, ${lastLm[0].y.toFixed(2)}`
              : "-",
            video: `${video.videoWidth}x${video.videoHeight}`,
          });
          frames = 0;
          lastReport = now;
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
    })().catch((e) => {
      console.error("PoseTest error", e);
      setInfo((i) => ({ ...i, status: "Error: " + e.message }));
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (landmarker) landmarker.close();
    };
  }, [delegate]);

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: '0 auto', color: '#fff', background: '#111', borderRadius: 12 }}>
      <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
        Delegate:{" "}
        <select value={delegate} onChange={(e) => setDelegate(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, background: '#222', color: '#fff', border: '1px solid #444' }}>
          <option value="CPU">CPU</option>
          <option value="GPU">GPU</option>
        </select>
      </label>
      <pre style={{ fontSize: 13, background: '#1a1a1a', padding: 10, borderRadius: 8, border: '1px solid #333' }}>
        {`status:  ${info.status}
delegate: ${delegate}
fps:     ${info.fps}
points:  ${info.points}
nose xy: ${info.nose}
video:   ${info.video}`}
      </pre>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: `${dims.w} / ${dims.h}`,
          transform: "scaleX(-1)",
          background: "#000",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </div>
  );
}
