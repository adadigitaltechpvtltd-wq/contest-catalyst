import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  X, 
  RotateCcw, 
  SwitchCamera, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { useCameraCapture } from '@/hooks/useCameraCapture';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraCapture = ({ isOpen, onClose, onCapture }: CameraCaptureProps) => {
  const {
    state,
    videoRef,
    openCamera,
    capturePhoto,
    closeCamera,
    switchCamera,
    facingMode,
  } = useCameraCapture();

  const containerRef = useRef<HTMLDivElement>(null);

  // Open camera when component mounts/opens
  useEffect(() => {
    if (isOpen && !state.isOpen && !state.isLoading) {
      openCamera();
    }
  }, [isOpen, state.isOpen, state.isLoading, openCamera]);

  // Close camera when component closes
  useEffect(() => {
    if (!isOpen && state.isOpen) {
      closeCamera();
    }
  }, [isOpen, state.isOpen, closeCamera]);

  const handleCapture = () => {
    const file = capturePhoto();
    if (file) {
      closeCamera();
      onCapture(file);
    }
  };

  const handleClose = () => {
    closeCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
        <span className="text-white font-medium">Take Photo</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={switchCamera}
          disabled={state.isLoading}
          className="text-white hover:bg-white/20"
        >
          <SwitchCamera className="h-6 w-6" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {state.isLoading && (
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 className="h-10 w-10 animate-spin" />
            <span>Starting camera...</span>
          </div>
        )}

        {state.error && (
          <div className="flex flex-col items-center gap-3 text-white p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <span className="text-lg font-medium">Camera Error</span>
            <p className="text-sm text-white/70 max-w-xs">{state.error}</p>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={openCamera}
                className="border-white/30 text-white hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-white hover:bg-white/20"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${state.isOpen ? 'block' : 'hidden'}`}
          style={{ 
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' 
          }}
        />
      </div>

      {/* Capture Controls */}
      {state.isOpen && !state.error && (
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-safe flex items-center justify-center bg-gradient-to-t from-black/50 to-transparent">
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-white/30 shadow-lg active:scale-95 transition-transform"
            aria-label="Capture photo"
          >
            <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200" />
          </button>
        </div>
      )}

      {/* Camera mode indicator */}
      {state.isOpen && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2">
          <span className="text-white/70 text-sm bg-black/30 px-3 py-1 rounded-full">
            {facingMode === 'user' ? 'Front Camera' : 'Rear Camera'}
          </span>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
