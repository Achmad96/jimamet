import { useReducer, useRef, useCallback, useEffect } from "react";
import { DetectionBox, VideoReport, drawDetections } from "@/lib/food-detection";
import { apiDetectFrame, apiDetectVideo } from "@/lib/api";

interface VideoAnalysisState {
  videoSrc: string | null;
  videoFile: File | null;
  isVideoPlaying: boolean;
  videoCurrentTime: number;
  videoDuration: number;
  videoDetections: DetectionBox[];
  videoReport: VideoReport | null;
  isScanningVideo: boolean;
}

type VideoAction =
  | { type: "LOAD_FILE"; file: File; src: string }
  | { type: "SET_PLAYING"; isPlaying: boolean }
  | { type: "UPDATE_TIME"; currentTime: number; duration?: number }
  | { type: "SET_DETECTIONS"; detections: DetectionBox[] }
  | { type: "SET_SCANNING"; isScanning: boolean }
  | { type: "SET_REPORT"; report: VideoReport | null }
  | { type: "RESET" };

function videoReducer(state: VideoAnalysisState, action: VideoAction): VideoAnalysisState {
  switch (action.type) {
    case "LOAD_FILE":
      return {
        ...state,
        videoFile: action.file,
        videoSrc: action.src,
        isVideoPlaying: false,
        videoCurrentTime: 0,
        videoDetections: [],
        videoReport: null,
      };
    case "SET_PLAYING":
      return { ...state, isVideoPlaying: action.isPlaying };
    case "UPDATE_TIME":
      return {
        ...state,
        videoCurrentTime: action.currentTime,
        videoDuration: action.duration !== undefined ? action.duration : state.videoDuration,
      };
    case "SET_DETECTIONS":
      return { ...state, videoDetections: action.detections };
    case "SET_SCANNING":
      return { ...state, isScanningVideo: action.isScanning };
    case "SET_REPORT":
      return { ...state, videoReport: action.report };
    case "RESET":
      return {
        videoSrc: null,
        videoFile: null,
        isVideoPlaying: false,
        videoCurrentTime: 0,
        videoDuration: 0,
        videoDetections: [],
        videoReport: null,
        isScanningVideo: false,
      };
    default:
      return state;
  }
}

export function useVideoAnalysis() {
  const [state, dispatch] = useReducer(videoReducer, {
    videoSrc: null,
    videoFile: null,
    isVideoPlaying: false,
    videoCurrentTime: 0,
    videoDuration: 0,
    videoDetections: [],
    videoReport: null,
    isScanningVideo: false,
  });

  const videoElementRef = useRef<HTMLVideoElement>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoInFlightRef = useRef<boolean>(false);

  const resetVideo = useCallback(() => {
    if (state.videoSrc) {
      URL.revokeObjectURL(state.videoSrc);
    }
    dispatch({ type: "RESET" });
    if (videoCanvasRef.current) {
      const ctx = videoCanvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, videoCanvasRef.current.width, videoCanvasRef.current.height);
    }
  }, [state.videoSrc]);

  const handleVideoFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("video/")) {
        alert("Pilih file video yang valid (.mp4, .webm, .mov).");
        return;
      }
      resetVideo();
      const url = URL.createObjectURL(file);
      dispatch({ type: "LOAD_FILE", file, src: url });
    },
    [resetVideo]
  );

  const toggleVideoPlay = useCallback(() => {
    if (!videoElementRef.current) return;
    if (state.isVideoPlaying) {
      videoElementRef.current.pause();
      dispatch({ type: "SET_PLAYING", isPlaying: false });
    } else {
      videoElementRef.current.play();
      dispatch({ type: "SET_PLAYING", isPlaying: true });
    }
  }, [state.isVideoPlaying]);

  // Video processing frame loop via requestAnimationFrame
  useEffect(() => {
    let animId: number;
    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });

    const processVideoFrame = async () => {
      if (
        state.isVideoPlaying &&
        videoElementRef.current &&
        !videoElementRef.current.paused &&
        !videoElementRef.current.ended
      ) {
        const v = videoElementRef.current;
        dispatch({
          type: "UPDATE_TIME",
          currentTime: v.currentTime,
          duration: v.duration || 0,
        });

        if (!videoInFlightRef.current && v.readyState >= 2) {
          videoInFlightRef.current = true;
          const targetW = 384;
          const aspect = (v.videoHeight || 360) / (v.videoWidth || 480);
          offscreen.width = targetW;
          offscreen.height = Math.round(targetW * aspect);
          offCtx?.drawImage(v, 0, 0, offscreen.width, offscreen.height);

          const frameData = offscreen.toDataURL("image/jpeg", 0.6);

          try {
            const { ok, data } = await apiDetectFrame({
              frame: frameData,
              conf: 0.35,
              imgsz: 384,
              fast: true,
            });

            if (ok && data.status === "success") {
              const dets: DetectionBox[] = data.detections || [];
              dispatch({ type: "SET_DETECTIONS", detections: dets });

              if (videoCanvasRef.current) {
                videoCanvasRef.current.width = v.videoWidth || 640;
                videoCanvasRef.current.height = v.videoHeight || 480;
                drawDetections(videoCanvasRef.current, dets);
              }
            }
          } catch (e) {
            console.error("Video frame detection error:", e);
          } finally {
            videoInFlightRef.current = false;
          }
        }
      }

      if (state.isVideoPlaying) {
        animId = requestAnimationFrame(processVideoFrame);
      }
    };

    if (state.isVideoPlaying) {
      animId = requestAnimationFrame(processVideoFrame);
    }

    return () => cancelAnimationFrame(animId);
  }, [state.isVideoPlaying]);

  const captureVideoFrame = useCallback(() => {
    if (!videoElementRef.current) return null;
    const v = videoElementRef.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext("2d");
    ctx?.drawImage(v, 0, 0, c.width, c.height);

    const snapshotUrl = c.toDataURL("image/jpeg", 0.9);
    const detections = [...state.videoDetections];
    const top =
      detections.length > 0
        ? [...detections].sort((a, b) => b.confidence - a.confidence)[0]
        : null;

    return {
      snapshotUrl,
      width: c.width,
      height: c.height,
      detections,
      topDetection: top,
    };
  }, [state.videoDetections]);

  const scanEntireVideo = useCallback(async (): Promise<VideoReport | null> => {
    if (!state.videoFile) return null;
    dispatch({ type: "SET_SCANNING", isScanning: true });
    dispatch({ type: "SET_REPORT", report: null });

    try {
      const formData = new FormData();
      formData.append("video", state.videoFile);
      formData.append("sample_fps", "2.0");
      formData.append("conf", "0.35");

      const { ok, data } = await apiDetectVideo(formData);
      if (ok && data.status === "success") {
        dispatch({ type: "SET_REPORT", report: data });
        return data as VideoReport;
      } else {
        alert("Gagal memproses video: " + (data?.message || "Format video tidak didukung."));
        return null;
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menghubungi server analisis video.");
      return null;
    } finally {
      dispatch({ type: "SET_SCANNING", isScanning: false });
    }
  }, [state.videoFile]);

  return {
    state,
    videoElementRef,
    videoCanvasRef,
    handleVideoFile,
    toggleVideoPlay,
    captureVideoFrame,
    scanEntireVideo,
    resetVideo,
  };
}
