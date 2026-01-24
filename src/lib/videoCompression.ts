/**
 * Video Compression Utility
 * Uses browser's MediaRecorder API to re-encode videos at lower bitrates
 */

export interface CompressionOptions {
  maxSizeMB?: number;
  targetBitrate?: number; // in bits per second
  maxWidth?: number;
  maxHeight?: number;
  onProgress?: (progress: number) => void;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  duration: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 20,
  targetBitrate: 2_000_000, // 2 Mbps
  maxWidth: 1920,
  maxHeight: 1080,
};

/**
 * Check if video compression is supported in the browser
 */
export const isCompressionSupported = (): boolean => {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ||
    MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ||
    MediaRecorder.isTypeSupported('video/mp4')
  );
};

/**
 * Get the best supported video codec
 */
const getSupportedMimeType = (): string => {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return 'video/webm';
};

/**
 * Calculate target dimensions while maintaining aspect ratio
 */
const calculateTargetDimensions = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let targetWidth = width;
  let targetHeight = height;
  
  // Scale down if larger than max dimensions
  if (width > maxWidth || height > maxHeight) {
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);
    
    targetWidth = Math.floor(width * ratio);
    targetHeight = Math.floor(height * ratio);
  }
  
  // Ensure dimensions are even (required for some codecs)
  targetWidth = targetWidth - (targetWidth % 2);
  targetHeight = targetHeight - (targetHeight % 2);
  
  return { width: targetWidth, height: targetHeight };
};

/**
 * Compress a video file
 */
export const compressVideo = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;
    
    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration;
        const { width, height } = calculateTargetDimensions(
          video.videoWidth,
          video.videoHeight,
          opts.maxWidth!,
          opts.maxHeight!
        );
        
        // Create canvas for frame capture
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Get canvas stream
        const stream = canvas.captureStream(30); // 30 fps
        
        // Try to get audio from the video
        try {
          const audioContext = new AudioContext();
          const source = audioContext.createMediaElementSource(video);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);
          source.connect(audioContext.destination);
          
          // Add audio tracks to stream
          destination.stream.getAudioTracks().forEach(track => {
            stream.addTrack(track);
          });
        } catch (e) {
          // Video might not have audio, continue without it
          console.log('No audio track or audio not supported');
        }
        
        // Create MediaRecorder
        const mimeType = getSupportedMimeType();
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: opts.targetBitrate,
        });
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          URL.revokeObjectURL(videoUrl);
          
          const blob = new Blob(chunks, { type: mimeType });
          const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, `.${extension}`),
            { type: mimeType }
          );
          
          const compressedSize = compressedFile.size;
          const compressionRatio = originalSize / compressedSize;
          
          resolve({
            compressedFile,
            originalSize,
            compressedSize,
            compressionRatio,
            duration,
          });
        };
        
        mediaRecorder.onerror = (e) => {
          URL.revokeObjectURL(videoUrl);
          reject(new Error('MediaRecorder error: ' + e));
        };
        
        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        
        // Play video and draw frames to canvas
        video.currentTime = 0;
        
        const drawFrame = () => {
          if (video.ended || video.paused) {
            mediaRecorder.stop();
            return;
          }
          
          ctx.drawImage(video, 0, 0, width, height);
          
          // Report progress
          if (opts.onProgress) {
            const progress = Math.min((video.currentTime / duration) * 100, 100);
            opts.onProgress(progress);
          }
          
          requestAnimationFrame(drawFrame);
        };
        
        video.onended = () => {
          mediaRecorder.stop();
        };
        
        video.onplay = () => {
          drawFrame();
        };
        
        // Start playback
        video.play().catch(reject);
        
      } catch (error) {
        URL.revokeObjectURL(videoUrl);
        reject(error);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Failed to load video'));
    };
  });
};

/**
 * Check if a video file needs compression
 */
export const needsCompression = (file: File, maxSizeMB: number = 20): boolean => {
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB > maxSizeMB;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
