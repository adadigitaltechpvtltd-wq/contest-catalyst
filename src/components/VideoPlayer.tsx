import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  className?: string;
  showOverlayControls?: boolean;
  autoHideControls?: boolean;
  trimStart?: number;
  trimEnd?: number;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VideoPlayer = ({ 
  src, 
  className,
  showOverlayControls = true,
  autoHideControls = true,
  trimStart = 0,
  trimEnd,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveDuration = trimEnd && trimEnd > 0 ? trimEnd - trimStart : duration;
  const effectiveCurrentTime = Math.max(0, currentTime - trimStart);

  // Handle control visibility
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (autoHideControls && isPlaying && !isHovering) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [autoHideControls, isPlaying, isHovering]);

  useEffect(() => {
    if (!isPlaying || isHovering) {
      setShowControls(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    } else if (autoHideControls) {
      showControlsTemporarily();
    }
  }, [isPlaying, isHovering, autoHideControls, showControlsTemporarily]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (trimStart > 0) {
        video.currentTime = trimStart;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Stop at trim end
      if (trimEnd && video.currentTime >= trimEnd) {
        video.pause();
        video.currentTime = trimStart;
        setIsPlaying(false);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      video.currentTime = trimStart;
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [trimStart, trimEnd]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      // Reset to trim start if at the end
      if (trimEnd && video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
      video.play();
    }
  }, [isPlaying, trimStart, trimEnd]);

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const seekTime = trimStart + (value[0] / 100) * effectiveDuration;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  }, [trimStart, effectiveDuration]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = value[0] / 100;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, [isFullscreen]);

  const restart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = trimStart;
    video.play();
  }, [trimStart]);

  const progressPercent = effectiveDuration > 0 
    ? (effectiveCurrentTime / effectiveDuration) * 100 
    : 0;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative group rounded-lg overflow-hidden bg-secondary",
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={showControlsTemporarily}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {/* Center play/pause overlay */}
      {showOverlayControls && (
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={togglePlay}
        >
          {!isPlaying && (
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transform transition-transform hover:scale-110">
              <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          )}
        </div>
      )}

      {/* Bottom controls bar */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Progress bar */}
        <div className="mb-2">
          <Slider
            value={[progressPercent]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="h-1 cursor-pointer [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-primary [&>span:first-child_span]:bg-primary"
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2">
          {/* Play/Pause button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" fill="currentColor" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
            )}
          </Button>

          {/* Restart button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={restart}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Time display */}
          <span className="text-xs text-white font-mono min-w-[70px]">
            {formatTime(effectiveCurrentTime)} / {formatTime(effectiveDuration)}
          </span>

          <div className="flex-1" />

          {/* Volume controls */}
          <div className="flex items-center gap-1 group/volume">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-200">
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="h-1 [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-white [&>span:first-child_span]:bg-white"
              />
            </div>
          </div>

          {/* Fullscreen button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
