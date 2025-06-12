import { useEffect, useRef } from 'react';
import { BoundingBox, SegmentationPolygon } from '@/types/api';
import { calculateCanvasDimensions, drawBoundingBoxes, drawSegmentationPolygons } from '@/utils/imageProcessing';

interface ImageCanvasProps {
  imageUrl: string;
  boxes?: BoundingBox[];
  segments?: SegmentationPolygon[];
  className?: string;
}

/**
 * Canvas component for displaying images with bounding box or segmentation overlays
 * Handles image rendering and object detection/segmentation visualization
 */
export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  imageUrl,
  boxes = [],
  segments = [],
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

      // Draw overlays based on what data is available
      if (segments.length > 0) {
        // Draw segmentation polygons
        drawSegmentationPolygons(ctx, segments, scale);
      } else if (boxes.length > 0) {
        // Draw bounding boxes
        drawBoundingBoxes(ctx, boxes, scale);
      }
    };

    img.onerror = () => {
      console.error('Failed to load image:', imageUrl);
    };

    img.src = imageUrl;
  }, [imageUrl, boxes, segments]);

  return (
    <canvas
      ref={canvasRef}
      className={`max-w-full h-auto rounded-lg shadow-md border border-gray-200 ${className}`}
      aria-label={`Image analysis canvas with ${segments.length > 0 ? 'segmentation' : 'object detection'} overlays`}
    />
  );
}; 