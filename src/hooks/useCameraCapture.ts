import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Detects if camera capture is available and appropriate for the device
 * Shows camera option only on mobile/tablet devices, not desktop
 */
export function useIsCameraAvailable() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const checkCameraAvailability = () => {
      // Check if we're on a mobile/tablet device using user agent
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
      
      // Also check screen size as a fallback (tablets, etc.)
      const isSmallScreen = window.innerWidth <= 1024;
      
      // Check if mediaDevices API is available (required for camera)
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      // Camera option should only show on mobile/tablet devices
      const shouldShow = (isMobileDevice || isSmallScreen) && hasMediaDevices;
      
      setIsAvailable(shouldShow);
    };

    checkCameraAvailability();
    
    // Re-check on resize (for responsive testing)
    window.addEventListener('resize', checkCameraAvailability);
    return () => window.removeEventListener('resize', checkCameraAvailability);
  }, []);

  return isAvailable;
}

interface CameraState {
  isOpen: boolean;
  stream: MediaStream | null;
  error: string | null;
  isLoading: boolean;
  torchSupported: boolean;
  torchEnabled: boolean;
}

interface UseCameraCaptureReturn {
  state: CameraState;
  videoRef: React.RefObject<HTMLVideoElement>;
  openCamera: () => Promise<void>;
  capturePhoto: () => File | null;
  closeCamera: () => void;
  switchCamera: () => Promise<void>;
  toggleTorch: () => Promise<void>;
  facingMode: 'user' | 'environment';
}

/**
 * Hook to manage camera capture functionality
 * Prefers rear camera on mobile devices
 */
export function useCameraCapture(): UseCameraCaptureReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [state, setState] = useState<CameraState>({
    isOpen: false,
    stream: null,
    error: null,
    isLoading: false,
    torchSupported: false,
    torchEnabled: false,
  });

  const stopStream = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
  }, [state.stream]);

  const openCamera = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request camera with rear-facing preference
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if torch is supported
      const videoTrack = stream.getVideoTracks()[0];
      let torchSupported = false;
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
        torchSupported = !!capabilities?.torch;
      }

      setState({
        isOpen: true,
        stream,
        error: null,
        isLoading: false,
        torchSupported,
        torchEnabled: false,
      });
    } catch (err) {
      let errorMessage = 'Failed to access camera';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Camera is in use by another application.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera does not support the requested settings.';
        }
      }

      setState({
        isOpen: false,
        stream: null,
        error: errorMessage,
        isLoading: false,
        torchSupported: false,
        torchEnabled: false,
      });
    }
  }, [facingMode]);

  const closeCamera = useCallback(() => {
    stopStream();
    setState({
      isOpen: false,
      stream: null,
      error: null,
      isLoading: false,
      torchSupported: false,
      torchEnabled: false,
    });
  }, [stopStream]);

  const toggleTorch = useCallback(async () => {
    if (!state.stream || !state.torchSupported) return;

    const videoTrack = state.stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const newTorchState = !state.torchEnabled;

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: newTorchState } as MediaTrackConstraintSet & { torch: boolean }]
      });
      setState(prev => ({ ...prev, torchEnabled: newTorchState }));
    } catch (err) {
      console.warn('Failed to toggle torch:', err);
    }
  }, [state.stream, state.torchSupported, state.torchEnabled]);

  const switchCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    
    // Close current stream and reopen with new facing mode
    stopStream();
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: newMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if torch is supported
      const videoTrack = stream.getVideoTracks()[0];
      let torchSupported = false;
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
        torchSupported = !!capabilities?.torch;
      }

      setState({
        isOpen: true,
        stream,
        error: null,
        isLoading: false,
        torchSupported,
        torchEnabled: false,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to switch camera',
        isLoading: false,
      }));
    }
  }, [facingMode, stopStream]);

  const capturePhoto = useCallback((): File | null => {
    if (!videoRef.current || !state.stream) return null;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    
    // Use actual video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw the current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    let file: File | null = null;
    canvas.toBlob(
      (blob) => {
        if (blob) {
          file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
        }
      },
      'image/jpeg',
      0.92
    );

    // Synchronous version for immediate return
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], `camera-capture-${Date.now()}.jpg`, { type: mime });
  }, [state.stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [state.stream]);

  return {
    state,
    videoRef,
    openCamera,
    capturePhoto,
    closeCamera,
    switchCamera,
    toggleTorch,
    facingMode,
  };
}
