import { useReducer, useRef, useCallback, useEffect } from "react";
import {
  hasUserMediaSupport,
  requestCameraStream,
  CameraErrorInfo,
} from "@/lib/camera";
import { DetectionBox, drawDetections } from "@/lib/food-detection";
import { apiDetectFrame, getWsDetectUrl, isDetectWsSupported } from "@/lib/api";

interface CameraState {
  cameraActive: boolean;
  cameraError: CameraErrorInfo | null;
  cameraFacing: "environment" | "user";
  isFlipping: boolean;
  videoDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  resolutionPreset: 320 | 480 | 640;
  cameraFps: number;
  cameraLatency: number;
  cameraDetections: DetectionBox[];
  cameraPersonDetected: boolean;
}

type CameraAction =
  | { type: "START_SUCCESS"; stream: MediaStream }
  | { type: "STOP" }
  | { type: "SET_ERROR"; error: CameraErrorInfo | null }
  | { type: "SET_FACING"; facing: "environment" | "user" }
  | { type: "SET_FLIPPING"; flipping: boolean }
  | { type: "SET_DEVICES"; devices: MediaDeviceInfo[] }
  | { type: "SET_DEVICE_ID"; deviceId: string }
  | { type: "SET_RESOLUTION"; preset: 320 | 480 | 640 }
  | { type: "UPDATE_METRICS"; fps: number; latency: number }
  | { type: "SET_DETECTIONS"; detections: DetectionBox[]; personDetected: boolean };

function cameraReducer(state: CameraState, action: CameraAction): CameraState {
  switch (action.type) {
    case "START_SUCCESS":
      return {
        ...state,
        cameraActive: true,
        cameraError: null,
      };
    case "STOP":
      return {
        ...state,
        cameraActive: false,
        cameraFps: 0,
        cameraLatency: 0,
        cameraDetections: [],
        cameraPersonDetected: false,
      };
    case "SET_ERROR":
      return { ...state, cameraError: action.error };
    case "SET_FACING":
      return { ...state, cameraFacing: action.facing };
    case "SET_FLIPPING":
      return { ...state, isFlipping: action.flipping };
    case "SET_DEVICES":
      return { ...state, videoDevices: action.devices };
    case "SET_DEVICE_ID":
      return { ...state, selectedDeviceId: action.deviceId };
    case "SET_RESOLUTION":
      return { ...state, resolutionPreset: action.preset };
    case "UPDATE_METRICS":
      return { ...state, cameraFps: action.fps, cameraLatency: action.latency };
    case "SET_DETECTIONS":
      return {
        ...state,
        cameraDetections: action.detections,
        cameraPersonDetected: action.personDetected,
      };
    default:
      return state;
  }
}

export function useCameraStream() {
  const [state, dispatch] = useReducer(cameraReducer, {
    cameraActive: false,
    cameraError: null,
    cameraFacing: "environment",
    isFlipping: false,
    videoDevices: [],
    selectedDeviceId: "",
    resolutionPreset: 480,
    cameraFps: 0,
    cameraLatency: 0,
    cameraDetections: [],
    cameraPersonDetected: false,
  });

  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraWsRef = useRef<WebSocket | null>(null);
  const cameraInFlightRef = useRef<boolean>(false);
  const cameraIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fpsHistoryRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);

  const stopCameraStream = useCallback(() => {
    if (typeof window !== "undefined") {
      document.body.style.overflow = "";
    }
    if (cameraIntervalRef.current) {
      clearInterval(cameraIntervalRef.current);
      cameraIntervalRef.current = null;
    }
    if (cameraWsRef.current) {
      try {
        cameraWsRef.current.close();
      } catch {}
      cameraWsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
      const stream = cameraVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      cameraVideoRef.current.srcObject = null;
    }
    cameraInFlightRef.current = false;
    dispatch({ type: "STOP" });

    if (cameraCanvasRef.current) {
      const ctx = cameraCanvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, cameraCanvasRef.current.width, cameraCanvasRef.current.height);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Close camera on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.cameraActive) {
        stopCameraStream();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.cameraActive, stopCameraStream]);

  // Load available camera devices
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoDevs = devices.filter((d) => d.kind === "videoinput");
          dispatch({ type: "SET_DEVICES", devices: videoDevs });
          if (videoDevs.length > 0 && !state.selectedDeviceId) {
            dispatch({ type: "SET_DEVICE_ID", deviceId: videoDevs[0].deviceId });
          }
        })
        .catch(() => {});
    }
  }, [state.selectedDeviceId]);

  // Ensure camera stream is attached and playing when video element is ready
  useEffect(() => {
    if (state.cameraActive && cameraVideoRef.current && streamRef.current) {
      if (cameraVideoRef.current.srcObject !== streamRef.current) {
        cameraVideoRef.current.srcObject = streamRef.current;
        cameraVideoRef.current.play().catch((err) => {
          console.warn("Camera video play on mount error:", err);
        });
      }
    }
  }, [state.cameraActive]);

  const startCamera = useCallback(
    async (facing: "environment" | "user" = state.cameraFacing, deviceId?: string) => {
      dispatch({ type: "SET_ERROR", error: null });

      if (!hasUserMediaSupport()) {
        const isInsecure = typeof window !== "undefined" && window.isSecureContext === false;
        const httpsUrl =
          typeof window !== "undefined"
            ? `https://${window.location.host}${window.location.pathname}`
            : "";
        dispatch({
          type: "SET_ERROR",
          error: {
            title: isInsecure
              ? "Kamera Real-Time Membutuhkan Koneksi Aman (HTTPS)"
              : "Kamera Real-Time Tidak Tersedia di Browser Ini",
            message: isInsecure
              ? `Browser memblokir streaming kamera langsung pada alamat HTTP jaringan lokal (${window.location.origin}). Jalankan server mode HTTPS lalu buka ${httpsUrl}, atau ambil foto langsung memakai kamera perangkat.`
              : "Browser atau perangkat ini tidak menyediakan akses streaming kamera. Anda tetap dapat memotret makanan menggunakan kamera perangkat.",
            showNativeCapture: true,
          },
        });
        return;
      }

      try {
        stopCameraStream();

        if (typeof window !== "undefined" && window.innerWidth <= 768) {
          document.body.style.overflow = "hidden";
        }

        const targetDeviceId = deviceId !== undefined ? deviceId : state.selectedDeviceId;
        let stream: MediaStream;

        try {
          const constraints: MediaStreamConstraints = {
            video: targetDeviceId
              ? {
                  deviceId: { exact: targetDeviceId },
                  width: { ideal: state.resolutionPreset === 640 ? 1280 : 854 },
                  height: { ideal: state.resolutionPreset === 640 ? 720 : 480 },
                }
              : {
                  facingMode: { ideal: facing },
                  width: { ideal: state.resolutionPreset === 640 ? 1280 : 854 },
                  height: { ideal: state.resolutionPreset === 640 ? 720 : 480 },
                },
            audio: false,
          };
          stream = await requestCameraStream(constraints);
        } catch (err) {
          const errName = (err as { name?: string })?.name;
          if (
            errName === "NotAllowedError" ||
            errName === "PermissionDeniedError" ||
            errName === "SecurityError" ||
            errName === "InsecureContextError" ||
            errName === "MediaDevicesUnavailableError"
          ) {
            throw err;
          }
          try {
            stream = await requestCameraStream({
              video: { facingMode: facing },
              audio: false,
            });
          } catch (fallbackErr) {
            const fbName = (fallbackErr as { name?: string })?.name;
            if (fbName === "NotAllowedError" || fbName === "PermissionDeniedError") {
              throw fallbackErr;
            }
            stream = await requestCameraStream({ video: true, audio: false });
          }
        }

        streamRef.current = stream;
        dispatch({ type: "START_SUCCESS", stream });

        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          try {
            await cameraVideoRef.current.play();
          } catch (playErr) {
            console.warn("Camera video play warning:", playErr);
          }
        }

        let ws: WebSocket | null = null;
        let useFallback = !isDetectWsSupported();

        if (!useFallback) {
          try {
            const wsUrl = getWsDetectUrl();
            ws = new WebSocket(wsUrl);
            cameraWsRef.current = ws;

            ws.onerror = () => {
              useFallback = true;
            };

            ws.onclose = () => {
              useFallback = true;
            };

            ws.onmessage = (event) => {
              try {
                const res = JSON.parse(event.data);
                if (res.status === "success") {
                  const dets: DetectionBox[] = res.detections || [];
                  dispatch({
                    type: "SET_DETECTIONS",
                    detections: dets,
                    personDetected: Boolean(res.person_detected),
                  });

                  if (res.ts) {
                    const rtt = Date.now() - res.ts;
                    const avgFps =
                      fpsHistoryRef.current.length > 0
                        ? Math.round(
                            (fpsHistoryRef.current.reduce((a, b) => a + b, 0) /
                              fpsHistoryRef.current.length) *
                              10
                          ) / 10
                        : 0;
                    dispatch({ type: "UPDATE_METRICS", fps: avgFps, latency: rtt });
                  }

                  if (cameraCanvasRef.current && cameraVideoRef.current) {
                    const v = cameraVideoRef.current;
                    cameraCanvasRef.current.width = v.videoWidth || 640;
                    cameraCanvasRef.current.height = v.videoHeight || 480;
                    drawDetections(cameraCanvasRef.current, dets, null, facing === "user");
                  }
                }
              } catch (e) {
                console.error("WS parse error:", e);
              } finally {
                cameraInFlightRef.current = false;
              }
            };
          } catch {
            useFallback = true;
          }
        }

        const offscreen = document.createElement("canvas");
        const offCtx = offscreen.getContext("2d", { willReadFrequently: true });

        cameraIntervalRef.current = setInterval(async () => {
          if (!cameraVideoRef.current || cameraVideoRef.current.readyState < 2) return;
          if (cameraInFlightRef.current) return;

          const video = cameraVideoRef.current;
          const targetW = state.resolutionPreset;
          const aspect = (video.videoHeight || 360) / (video.videoWidth || 480);
          const targetH = Math.round(targetW * aspect);

          offscreen.width = targetW;
          offscreen.height = targetH;
          offCtx?.drawImage(video, 0, 0, targetW, targetH);

          const frameData = offscreen.toDataURL("image/jpeg", 0.65);
          const sendTs = Date.now();

          const now = Date.now();
          const prev = lastFrameTimeRef.current;
          lastFrameTimeRef.current = now;
          if (prev > 0 && now > prev) {
            fpsHistoryRef.current.push(1000 / (now - prev));
            if (fpsHistoryRef.current.length > 10) fpsHistoryRef.current.shift();
          }

          cameraInFlightRef.current = true;

          if (ws && ws.readyState === WebSocket.OPEN && !useFallback) {
            ws.send(
              JSON.stringify({
                frame: frameData,
                ts: sendTs,
                conf: 0.35,
                imgsz: state.resolutionPreset,
                fast: true,
              })
            );
          } else {
            try {
              const { ok, data } = await apiDetectFrame({
                frame: frameData,
                conf: 0.35,
                imgsz: state.resolutionPreset,
                fast: true,
              });
              if (ok && data.status === "success") {
                const dets: DetectionBox[] = data.detections || [];
                const avgFps =
                  fpsHistoryRef.current.length > 0
                    ? Math.round(
                        (fpsHistoryRef.current.reduce((a, b) => a + b, 0) /
                          fpsHistoryRef.current.length) *
                          10
                      ) / 10
                    : 0;
                dispatch({
                  type: "SET_DETECTIONS",
                  detections: dets,
                  personDetected: Boolean(data.person_detected),
                });
                dispatch({
                  type: "UPDATE_METRICS",
                  fps: avgFps,
                  latency: Date.now() - sendTs,
                });

                if (cameraCanvasRef.current && cameraVideoRef.current) {
                  const v = cameraVideoRef.current;
                  cameraCanvasRef.current.width = v.videoWidth || 640;
                  cameraCanvasRef.current.height = v.videoHeight || 480;
                  drawDetections(cameraCanvasRef.current, dets, null, facing === "user");
                }
              }
            } catch (e) {
              console.error("HTTP frame fallback error:", e);
            } finally {
              cameraInFlightRef.current = false;
            }
          }
        }, 70);
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string };
        stopCameraStream();
        if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
          dispatch({
            type: "SET_ERROR",
            error: {
              title: "Izin Kamera Ditolak",
              message:
                "Izin akses kamera ditolak oleh browser. Aktifkan izin kamera pada pengaturan browser, atau ambil foto langsung dari kamera perangkat.",
              showNativeCapture: true,
            },
          });
        } else if (e?.name === "NotFoundError" || e?.name === "DevicesNotFoundError") {
          dispatch({
            type: "SET_ERROR",
            error: {
              title: "Kamera Tidak Ditemukan",
              message:
                "Tidak ada perangkat kamera yang terdeteksi. Pastikan kamera terhubung atau unggah foto makanan dari galeri.",
              showNativeCapture: false,
            },
          });
        } else if (e?.name === "NotReadableError" || e?.name === "TrackStartError") {
          dispatch({
            type: "SET_ERROR",
            error: {
              title: "Kamera Sedang Digunakan",
              message:
                "Kamera sedang dipakai oleh aplikasi atau tab lain. Tutup aplikasi lain yang menggunakan kamera lalu coba lagi.",
              showNativeCapture: true,
            },
          });
        } else {
          dispatch({
            type: "SET_ERROR",
            error: {
              title: "Tidak Dapat Mengakses Kamera",
              message: e?.message || "Pastikan izin kamera telah diberikan pada pengaturan browser.",
              showNativeCapture: true,
            },
          });
        }
      }
    },
    [state.cameraFacing, state.selectedDeviceId, state.resolutionPreset, stopCameraStream]
  );

  const toggleCameraFacing = useCallback(async () => {
    dispatch({ type: "SET_FLIPPING", flipping: true });
    setTimeout(() => dispatch({ type: "SET_FLIPPING", flipping: false }), 500);

    const nextFacing = state.cameraFacing === "environment" ? "user" : "environment";
    dispatch({ type: "SET_FACING", facing: nextFacing });

    let nextDeviceId: string | undefined = undefined;
    if (state.videoDevices.length > 1) {
      const currIdx = state.videoDevices.findIndex((d) => d.deviceId === state.selectedDeviceId);
      const nextIdx = (currIdx + 1) % state.videoDevices.length;
      nextDeviceId = state.videoDevices[nextIdx]?.deviceId;
      if (nextDeviceId) dispatch({ type: "SET_DEVICE_ID", deviceId: nextDeviceId });
    }

    await startCamera(nextFacing, nextDeviceId);
  }, [state.cameraFacing, state.videoDevices, state.selectedDeviceId, startCamera]);

  const captureCameraSnapshot = useCallback(() => {
    if (!cameraVideoRef.current) return null;
    const video = cameraVideoRef.current;
    const c = document.createElement("canvas");
    c.width = video.videoWidth || 640;
    c.height = video.videoHeight || 480;
    const ctx = c.getContext("2d");
    if (!ctx) return null;

    if (state.cameraFacing === "user") {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, c.width, c.height);

    const snapshotUrl = c.toDataURL("image/jpeg", 0.9);
    const detections = [...state.cameraDetections];
    const top =
      detections.length > 0
        ? [...detections].sort((a, b) => b.confidence - a.confidence)[0]
        : null;

    stopCameraStream();

    return {
      snapshotUrl,
      width: c.width,
      height: c.height,
      detections,
      topDetection: top,
      personDetected: state.cameraPersonDetected,
    };
  }, [state.cameraFacing, state.cameraDetections, state.cameraPersonDetected, stopCameraStream]);

  const setSelectedDeviceId = useCallback((deviceId: string) => {
    dispatch({ type: "SET_DEVICE_ID", deviceId });
  }, []);

  const setResolutionPreset = useCallback((preset: 320 | 480 | 640) => {
    dispatch({ type: "SET_RESOLUTION", preset });
  }, []);

  const setCameraError = useCallback((error: CameraErrorInfo | null) => {
    dispatch({ type: "SET_ERROR", error });
  }, []);

  return {
    state,
    cameraVideoRef,
    cameraCanvasRef,
    startCamera,
    stopCameraStream,
    toggleCameraFacing,
    setSelectedDeviceId,
    setResolutionPreset,
    setCameraError,
    captureCameraSnapshot,
  };
}
