export type LegacyGetUserMedia = (
  constraints: MediaStreamConstraints,
  onSuccess: (stream: MediaStream) => void,
  onError: (err: unknown) => void
) => void;

export interface CameraErrorInfo {
  title: string;
  message: string;
  showNativeCapture?: boolean;
}

/**
 * Check if the current browser environment supports camera access
 */
export function hasUserMediaSupport(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.mediaDevices?.getUserMedia === "function") return true;

  const legacyNav = navigator as Navigator & {
    getUserMedia?: LegacyGetUserMedia;
    webkitGetUserMedia?: LegacyGetUserMedia;
    mozGetUserMedia?: LegacyGetUserMedia;
  };
  return Boolean(
    legacyNav.getUserMedia ||
    legacyNav.webkitGetUserMedia ||
    legacyNav.mozGetUserMedia
  );
}

/**
 * Request camera media stream supporting modern and legacy web APIs
 */
export async function requestCameraStream(
  constraints: MediaStreamConstraints
): Promise<MediaStream> {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  ) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  if (typeof navigator !== "undefined") {
    const legacyNav = navigator as Navigator & {
      getUserMedia?: LegacyGetUserMedia;
      webkitGetUserMedia?: LegacyGetUserMedia;
      mozGetUserMedia?: LegacyGetUserMedia;
    };
    const legacyFn =
      legacyNav.getUserMedia ||
      legacyNav.webkitGetUserMedia ||
      legacyNav.mozGetUserMedia;

    if (legacyFn) {
      return new Promise<MediaStream>((resolve, reject) => {
        legacyFn.call(navigator, constraints, resolve, reject);
      });
    }
  }

  const isInsecure = typeof window !== "undefined" && window.isSecureContext === false;
  const error = new Error(
    isInsecure
      ? "Browser memblokir streaming kamera pada koneksi HTTP jaringan lokal. Gunakan HTTPS atau localhost."
      : "Browser pada perangkat ini tidak mendukung akses kamera real-time."
  );
  error.name = isInsecure ? "InsecureContextError" : "MediaDevicesUnavailableError";
  throw error;
}

/**
 * Formats camera error into user-friendly title, message, and fallback action
 */
export function formatCameraError(err: unknown): CameraErrorInfo {
  const errName = err instanceof Error ? err.name : "";
  const errMsg = err instanceof Error ? err.message : String(err);

  if (errName === "InsecureContextError") {
    return {
      title: "Koneksi Tidak Aman (HTTP)",
      message: "Browser mewajibkan HTTPS atau localhost untuk mengaktifkan kamera. Anda masih dapat menggunakan tombol unggah foto atau tangkap foto bawaan perangkat di bawah.",
      showNativeCapture: true,
    };
  }

  if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
    return {
      title: "Izin Kamera Ditolak",
      message: "Mohon izinkan akses kamera pada pengaturan browser Anda, lalu klik 'Coba Lagi'.",
      showNativeCapture: true,
    };
  }

  if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
    return {
      title: "Kamera Tidak Ditemukan",
      message: "Tidak ada sensor kamera yang terdeteksi pada perangkat Anda. Silakan unggah foto makanan dari galeri.",
      showNativeCapture: true,
    };
  }

  if (errName === "NotReadableError" || errName === "TrackStartError") {
    return {
      title: "Kamera Sedang Digunakan",
      message: "Kamera sedang diakses oleh aplikasi atau tab lain. Tutup aplikasi tersebut dan coba lagi.",
      showNativeCapture: true,
    };
  }

  return {
    title: "Gagal Mengakses Kamera",
    message: errMsg || "Terjadi kesalahan saat menginisialisasi kamera. Gunakan tombol unggah foto di bawah.",
    showNativeCapture: true,
  };
}
