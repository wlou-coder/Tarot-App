"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  LandmarkSmoother,
  isOpenPalm,
  isGrasp,
  isHandInCenter,
  getPalmCenter,
  type Landmark,
} from "@/lib/gestureUtils";

export type AppState = "idle" | "question" | "reading" | "revealed";

export interface GestureData {
  handDetected: boolean;
  handInCenter: boolean;
  palmOpen: boolean;    // spread hand → deck spins
  isGrasping: boolean;  // closing hand → grab card
  handPosition: { x: number; y: number } | null;
  inCooldown: boolean;
  cameraReady: boolean;
  error: string | null;
}

const COOLDOWN_MS   = 2600;
const GRASP_HOLD_MS = 180;  // ms fist must be held to confirm grab

export function useHandGesture(appState: AppState, onCardDraw: () => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlRef    = useRef<any>(null);
  const rafRef   = useRef<number>(0);

  const smootherRef    = useRef(new LandmarkSmoother(0.22));
  const cooldownEndRef = useRef<number>(0);
  const graspStartRef  = useRef<number | null>(null);

  const appStateRef   = useRef(appState);
  const onCardDrawRef = useRef(onCardDraw);
  appStateRef.current   = appState;
  onCardDrawRef.current = onCardDraw;

  const [gestureData, setGestureData] = useState<GestureData>({
    handDetected: false,
    handInCenter: false,
    palmOpen: false,
    isGrasping: false,
    handPosition: null,
    inCooldown: false,
    cameraReady: false,
    error: null,
  });

  useEffect(() => {
    if (appState !== "reading") {
      smootherRef.current.reset();
      graspStartRef.current = null;
    }
  }, [appState]);

  const initMediaPipe = useCallback(async () => {
    try {
      const { HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      hlRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });
      return true;
    } catch {
      setGestureData((d) => ({ ...d, error: "Failed to load gesture model." }));
      return false;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setGestureData((d) => ({ ...d, cameraReady: true }));
      }
      return true;
    } catch {
      setGestureData((d) => ({ ...d, error: "Camera permission denied." }));
      return false;
    }
  }, []);

  const loop = useCallback(() => {
    const video = videoRef.current;
    if (!video || !hlRef.current || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const now = performance.now();
    const inCooldown = now < cooldownEndRef.current;

    let result: any;
    try { result = hlRef.current.detectForVideo(video, now); }
    catch { rafRef.current = requestAnimationFrame(loop); return; }

    const raw: Landmark[][] = result.landmarks;

    if (raw.length === 0) {
      smootherRef.current.reset();
      graspStartRef.current = null;
      setGestureData((d) => ({
        ...d,
        handDetected: false, handInCenter: false,
        palmOpen: false, isGrasping: false,
        handPosition: null, inCooldown,
      }));
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const lm       = smootherRef.current.smooth(raw[0]);
    const palm     = getPalmCenter(lm);
    const inCenter = isHandInCenter(lm);
    const palming  = isOpenPalm(lm);
    const grasping = isGrasp(lm);
    const mx       = 1 - palm.x;

    // Grasp-to-draw: fist held in center for GRASP_HOLD_MS → draw card
    if (appStateRef.current === "reading" && inCenter && !inCooldown && grasping) {
      if (graspStartRef.current === null) graspStartRef.current = now;

      if (now - graspStartRef.current >= GRASP_HOLD_MS) {
        graspStartRef.current  = null;
        cooldownEndRef.current = now + COOLDOWN_MS;
        onCardDrawRef.current();
      }
    } else if (!grasping) {
      graspStartRef.current = null;
    }

    setGestureData((d) => ({
      ...d,
      handDetected: true,
      handInCenter: inCenter,
      palmOpen: palming,
      isGrasping: grasping && inCenter && !inCooldown,
      handPosition: { x: mx, y: palm.y },
      inCooldown: now < cooldownEndRef.current,
    }));

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ok = await initMediaPipe();
      if (!alive || !ok) return;
      const ok2 = await startCamera();
      if (!alive || !ok2) return;
      rafRef.current = requestAnimationFrame(loop);
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
      const v = videoRef.current;
      if (v?.srcObject) (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    };
  }, [initMediaPipe, startCamera, loop]);

  return { videoRef, gestureData };
}
