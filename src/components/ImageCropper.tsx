import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, RotateCw, ZoomIn, Crop as CropIcon } from 'lucide-react';

interface ImageCropperProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  aspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ImageCropper = ({
  file,
  isOpen,
  onClose,
  onCropComplete,
  aspectRatio,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.85,
}: ImageCropperProps) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Load image when file changes
  useState(() => {
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(file);
    }
  });

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const aspect = aspectRatio || undefined;
      if (aspect) {
        setCrop(centerAspectCrop(width, height, aspect));
      } else {
        setCrop({
          unit: '%',
          x: 5,
          y: 5,
          width: 90,
          height: 90,
        });
      }
    },
    [aspectRatio]
  );

  const getCroppedImg = useCallback(async (): Promise<File> => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      throw new Error('Crop data not available');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calculate actual crop dimensions
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Apply max dimensions while maintaining aspect ratio
    let outputWidth = cropWidth;
    let outputHeight = cropHeight;

    if (outputWidth > maxWidth) {
      outputHeight = (maxWidth / outputWidth) * outputHeight;
      outputWidth = maxWidth;
    }
    if (outputHeight > maxHeight) {
      outputWidth = (maxHeight / outputHeight) * outputWidth;
      outputHeight = maxHeight;
    }

    // Handle rotation
    const rotateRads = (rotate * Math.PI) / 180;
    const cos = Math.cos(rotateRads);
    const sin = Math.sin(rotateRads);

    if (rotate === 0) {
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );
    } else {
      // Create a temporary canvas for rotation
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('No temp context');

      // Calculate the size needed to fit the rotated image
      const rotatedWidth = Math.abs(outputWidth * cos) + Math.abs(outputHeight * sin);
      const rotatedHeight = Math.abs(outputWidth * sin) + Math.abs(outputHeight * cos);

      canvas.width = rotatedWidth;
      canvas.height = rotatedHeight;

      ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
      ctx.rotate(rotateRads);
      ctx.translate(-outputWidth / 2, -outputHeight / 2);

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );
    }

    // Apply scale if not 1
    if (scale !== 1) {
      const scaledCanvas = document.createElement('canvas');
      const scaledCtx = scaledCanvas.getContext('2d');
      if (!scaledCtx) throw new Error('No scaled context');

      scaledCanvas.width = canvas.width * scale;
      scaledCanvas.height = canvas.height * scale;
      scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

      // Copy back
      canvas.width = scaledCanvas.width;
      canvas.height = scaledCanvas.height;
      ctx.drawImage(scaledCanvas, 0, 0);
    }

    // Convert to blob with compression
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const croppedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        },
        'image/jpeg',
        quality
      );
    });
  }, [completedCrop, rotate, scale, file.name, maxWidth, maxHeight, quality]);

  const handleApplyCrop = async () => {
    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg();
      onCropComplete(croppedFile);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    }
    setIsProcessing(false);
  };

  const handleRotate = () => {
    setRotate((prev) => (prev + 90) % 360);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-5 w-5" />
            Crop & Optimize Image
          </DialogTitle>
          <DialogDescription>
            Adjust the crop area, rotation, and zoom. The image will be compressed for optimal upload.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Cropper */}
          <div className="flex justify-center bg-secondary/30 rounded-lg p-4 max-h-[400px] overflow-auto">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imgSrc}
                  style={{
                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                    maxHeight: '350px',
                    maxWidth: '100%',
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            )}
          </div>

          {/* Controls */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom: {Math.round(scale * 100)}%
              </Label>
              <Slider
                value={[scale]}
                onValueChange={([value]) => setScale(value)}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={handleRotate} className="w-full">
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate 90°
              </Button>
            </div>
          </div>

          {/* File info */}
          <div className="text-xs text-muted-foreground p-3 bg-secondary/30 rounded-lg">
            <p>Original: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
            <p>Output: JPEG with {Math.round(quality * 100)}% quality, max {maxWidth}x{maxHeight}px</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApplyCrop} disabled={isProcessing || !completedCrop}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Apply & Continue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
