import { useState, useRef, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Scissors, Play, Pause, RotateCcw, Check, Loader2 } from 'lucide-react';

interface VideoTrimmerProps {
  videoFile: File;
  videoUrl: string;
  maxDuration?: number;
  onTrimComplete: (trimmedFile: File, startTime: number, endTime: number) => void;
  onCancel: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
};

const VideoTrimmer = ({
  videoFile,
  videoUrl,
  maxDuration = 30,
  onTrimComplete,
  onCancel,
}: VideoTrimmerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(true);

  const trimDuration = endTime - startTime;
  const isValidTrim = trimDuration > 0 && trimDuration <= maxDuration;

  // Generate timeline thumbnails
  const generateThumbnails = useCallback(async () => {
    if (!videoRef.current || duration === 0) return;

    setIsGeneratingThumbnails(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const thumbnailCount = 10;
    const interval = duration / thumbnailCount;
    const thumbs: string[] = [];

    canvas.width = 120;
    canvas.height = 68;

    for (let i = 0; i < thumbnailCount; i++) {
      const time = i * interval;
      video.currentTime = time;

      await new Promise<void>((resolve) => {
        const handleSeeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbs.push(canvas.toDataURL('image/jpeg', 0.5));
          video.removeEventListener('seeked', handleSeeked);
          resolve();
        };
        video.addEventListener('seeked', handleSeeked);
      });
    }

    setThumbnails(thumbs);
    setIsGeneratingThumbnails(false);
    
    // Reset to start
    video.currentTime = startTime;
  }, [duration, startTime]);

  // Initialize video metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const dur = video.duration;
      setDuration(dur);
      setEndTime(Math.min(dur, maxDuration));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [maxDuration]);

  // Generate thumbnails when duration is set
  useEffect(() => {
    if (duration > 0) {
      generateThumbnails();
    }
  }, [duration, generateThumbnails]);

  // Handle video time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Loop within trim range when playing
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [startTime, endTime]);

  // Play/Pause toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      if (video.currentTime < startTime || video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle range slider change
  const handleRangeChange = (values: number[]) => {
    const [start, end] = values;
    setStartTime(start);
    setEndTime(end);

    // Seek to start position for preview
    if (videoRef.current && !isPlaying) {
      videoRef.current.currentTime = start;
    }
  };

  // Reset to full video
  const handleReset = () => {
    setStartTime(0);
    setEndTime(Math.min(duration, maxDuration));
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // Trim video and export
  const handleTrimComplete = async () => {
    setIsTrimming(true);

    try {
      // For browser-based trimming, we create a new blob with the trim metadata
      // Note: True video trimming requires server-side processing with FFmpeg
      // This implementation passes the trim points to the parent for handling
      
      // Create a metadata-enriched file that includes trim info
      const trimmedFile = new File([videoFile], videoFile.name, {
        type: videoFile.type,
        lastModified: Date.now(),
      });

      // Store trim metadata (will be used during upload)
      (trimmedFile as any).trimStart = startTime;
      (trimmedFile as any).trimEnd = endTime;
      (trimmedFile as any).trimmedDuration = endTime - startTime;

      onTrimComplete(trimmedFile, startTime, endTime);
    } catch (error) {
      console.error('Trim failed:', error);
    } finally {
      setIsTrimming(false);
    }
  };

  // Calculate position percentages for the selection overlay
  const startPercent = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPercent = duration > 0 ? (endTime / duration) * 100 : 100;
  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Video Preview */}
      <div className="relative rounded-lg overflow-hidden bg-secondary">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full max-h-64 object-contain"
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Play/Pause overlay button */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
        >
          <div className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center">
            {isPlaying ? (
              <Pause className="h-6 w-6 text-foreground" />
            ) : (
              <Play className="h-6 w-6 text-foreground ml-0.5" />
            )}
          </div>
        </button>

        {/* Duration badge */}
        <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Trim duration badge */}
        <div className={`absolute bottom-2 right-2 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium ${
          isValidTrim ? 'bg-primary/80 text-primary-foreground' : 'bg-destructive/80 text-destructive-foreground'
        }`}>
          <Scissors className="h-3 w-3 inline-block mr-1" />
          {formatTime(trimDuration)} selected
          {trimDuration > maxDuration && ` (max ${maxDuration}s)`}
        </div>
      </div>

      {/* Timeline with thumbnails */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Scissors className="h-4 w-4" />
          Trim Video (max {maxDuration} seconds)
        </Label>
        
        <div className="relative h-16 bg-secondary rounded-lg overflow-hidden">
          {/* Thumbnail strip */}
          {isGeneratingThumbnails ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-xs text-muted-foreground">Generating preview...</span>
            </div>
          ) : (
            <div className="flex h-full">
              {thumbnails.map((thumb, i) => (
                <div
                  key={i}
                  className="flex-1 h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${thumb})` }}
                />
              ))}
            </div>
          )}

          {/* Dim overlay for trimmed regions */}
          <div 
            className="absolute top-0 left-0 h-full bg-background/70"
            style={{ width: `${startPercent}%` }}
          />
          <div 
            className="absolute top-0 right-0 h-full bg-background/70"
            style={{ width: `${100 - endPercent}%` }}
          />

          {/* Selection highlight */}
          <div 
            className="absolute top-0 h-full border-2 border-primary"
            style={{ 
              left: `${startPercent}%`, 
              width: `${endPercent - startPercent}%` 
            }}
          />

          {/* Current time indicator */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-white shadow-lg"
            style={{ left: `${currentPercent}%` }}
          />

          {/* Hidden canvas for thumbnail generation */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Range slider */}
        <div className="px-1">
          <Slider
            value={[startTime, endTime]}
            onValueChange={handleRangeChange}
            max={duration}
            min={0}
            step={0.1}
            className="w-full"
            disabled={isGeneratingThumbnails || isTrimming}
          />
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Start: {formatTime(startTime)}</span>
          <span>End: {formatTime(endTime)}</span>
        </div>
      </div>

      {/* Validation message */}
      {!isValidTrim && trimDuration > maxDuration && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <Scissors className="h-4 w-4" />
          Selected portion is {formatTime(trimDuration - maxDuration)} too long. Please shorten your selection.
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={isTrimming}
          className="gap-1.5"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        
        <div className="flex-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isTrimming}
        >
          Cancel
        </Button>
        
        <Button
          type="button"
          size="sm"
          onClick={handleTrimComplete}
          disabled={!isValidTrim || isTrimming}
          className="gap-1.5"
        >
          {isTrimming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Apply Trim
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VideoTrimmer;
