import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileVideo, CheckCircle, AlertCircle, Zap, RefreshCw } from 'lucide-react';
import { 
  compressVideo, 
  formatFileSize, 
  isCompressionSupported,
  needsFormatConversion,
  getVideoFormat,
  CompressionResult 
} from '@/lib/videoCompression';

interface VideoCompressionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoFile: File;
  onCompressionComplete: (compressedFile: File, result: CompressionResult) => void;
  onSkip: () => void;
}

type CompressionState = 'idle' | 'compressing' | 'complete' | 'error';

const VideoCompressionDialog = ({
  isOpen,
  onClose,
  videoFile,
  onCompressionComplete,
  onSkip,
}: VideoCompressionDialogProps) => {
  const [state, setState] = useState<CompressionState>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const originalSizeMB = videoFile.size / (1024 * 1024);
  const isSupported = isCompressionSupported();
  const requiresConversion = needsFormatConversion(videoFile);
  const originalFormat = getVideoFormat(videoFile);

  useEffect(() => {
    if (isOpen) {
      setState('idle');
      setProgress(0);
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  const handleCompress = async () => {
    setState('compressing');
    setProgress(0);
    setError(null);

    try {
      const compressionResult = await compressVideo(videoFile, {
        maxSizeMB: 20,
        targetBitrate: originalSizeMB > 40 ? 1_500_000 : 2_500_000, // Lower bitrate for larger files
        maxWidth: 1920,
        maxHeight: 1080,
        onProgress: setProgress,
      });

      setResult(compressionResult);
      setState('complete');
    } catch (err) {
      console.error('Compression failed:', err);
      setError(err instanceof Error ? err.message : 'Compression failed');
      setState('error');
    }
  };

  const handleUseCompressed = () => {
    if (result) {
      onCompressionComplete(result.compressedFile, result);
      onClose();
    }
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {requiresConversion ? (
              <RefreshCw className="h-5 w-5 text-primary" />
            ) : (
              <Zap className="h-5 w-5 text-primary" />
            )}
            {requiresConversion ? 'Convert & Optimize Video' : 'Optimize Video'}
          </DialogTitle>
          <DialogDescription>
            {requiresConversion 
              ? `Your ${originalFormat} video will be converted to WebM format for better web compatibility and optimized for faster uploads.`
              : 'Compress your video to reduce upload time and file size while maintaining quality.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <FileVideo className="h-10 w-10 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{videoFile.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Size: {formatFileSize(videoFile.size)}</span>
                <span>•</span>
                <span>Format: {originalFormat}</span>
                {requiresConversion && (
                  <>
                    <span>•</span>
                    <span className="text-amber-500">Needs conversion</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* State-specific content */}
          {state === 'idle' && (
            <div className="space-y-4">
              {!isSupported ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-500">
                      {requiresConversion ? 'Conversion not supported' : 'Compression not supported'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your browser doesn't support video {requiresConversion ? 'conversion' : 'compression'}. 
                      {requiresConversion 
                        ? ' Please convert your video to MP4 or WebM format before uploading.'
                        : ' You can still upload the original file.'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <p>{requiresConversion ? 'Converting and compressing your video will:' : 'Compressing your video can:'}</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {requiresConversion && (
                      <li>Convert {originalFormat} to WebM for better browser support</li>
                    )}
                    <li>Reduce file size by up to 60%</li>
                    <li>Speed up upload time significantly</li>
                    <li>Maintain good visual quality</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {state === 'compressing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{requiresConversion ? 'Converting & compressing...' : 'Compressing video...'}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                This may take a moment. Please don't close this dialog.
              </p>
            </div>
          )}

          {state === 'complete' && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
              
              {result.formatConverted && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-muted-foreground">{result.originalFormat}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium text-success">{result.outputFormat}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-secondary/50">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Original</p>
                  <p className="font-medium">{formatFileSize(result.originalSize)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Optimized</p>
                  <p className="font-medium text-success">{formatFileSize(result.compressedSize)}</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm">
                  Reduced by{' '}
                  <span className="font-medium text-success">
                    {Math.round((1 - result.compressedSize / result.originalSize) * 100)}%
                  </span>
                  {result.formatConverted && (
                    <span className="text-muted-foreground"> • Converted to {result.outputFormat}</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {error || 'Compression failed. You can try again or skip compression.'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          {state === 'idle' && (
            <>
              <Button variant="ghost" onClick={handleSkip} disabled={requiresConversion && isSupported}>
                {requiresConversion ? 'Cancel' : 'Skip'}
              </Button>
              <Button onClick={handleCompress} disabled={!isSupported}>
                {requiresConversion ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Convert & Optimize
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Compress Video
                  </>
                )}
              </Button>
            </>
          )}

          {state === 'compressing' && (
            <Button variant="ghost" onClick={handleSkip} disabled>
              Compressing...
            </Button>
          )}

          {state === 'complete' && (
            <>
              <Button variant="ghost" onClick={handleSkip}>
                Use Original
              </Button>
              <Button onClick={handleUseCompressed}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Use Compressed
              </Button>
            </>
          )}

          {state === 'error' && (
            <>
              <Button variant="ghost" onClick={handleSkip}>
                Use Original
              </Button>
              <Button onClick={handleCompress}>
                Try Again
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCompressionDialog;
