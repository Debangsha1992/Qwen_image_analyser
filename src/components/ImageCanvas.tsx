import { useEffect, useRef } from 'react';
import { BoundingBox } from '@/types/api';
import { calculateCanvasDimensions, drawBoundingBoxes } from '@/utils/imageProcessing';

interface ImageCanvasProps {
  imageUrl: string;
  boxes: BoundingBox[];
  className?: string;
}

/**
 * Canvas component for displaying images with bounding box overlays
 * Handles image rendering and object detection visualization
 */
export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  imageUrl,
  boxes,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Calculate optimal canvas dimensions
      const { width, height, scale } = calculateCanvasDimensions(
        img.naturalWidth,
        img.naturalHeight
      );

      canvas.width = width;
      canvas.height = height;

      // Clear and draw image
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Draw bounding boxes if available
      if (boxes.length > 0) {
        drawBoundingBoxes(ctx, boxes, scale);
      }
    };

    img.onerror = () => {
      console.error('Failed to load image:', imageUrl);
    };

    img.src = imageUrl;
  }, [imageUrl, boxes]);

  return (
    <canvas
      ref={canvasRef}
      className={`max-w-full h-auto rounded-lg shadow-md border border-gray-200 ${className}`}
      aria-label="Image analysis canvas with object detection overlays"
    />
  );
}; 