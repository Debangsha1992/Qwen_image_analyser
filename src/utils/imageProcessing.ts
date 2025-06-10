import { BoundingBox, ImageProcessingConfig } from '@/types/api';

// Configuration constants
export const IMAGE_CONFIG: ImageProcessingConfig = {
  maxWidth: 800,
  maxHeight: 600,
  supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

// Color palette for object detection visualization
export const DETECTION_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
] as const;

/**
 * Validates if a file is a supported image format
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  if (!IMAGE_CONFIG.supportedFormats.includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file format. Please use: ${IMAGE_CONFIG.supportedFormats.join(', ')}`
    };
  }

  if (file.size > IMAGE_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds ${IMAGE_CONFIG.maxFileSize / (1024 * 1024)}MB limit`
    };
  }

  return { isValid: true };
};

/**
 * Converts a file to base64 data URL
 */
export const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Calculates optimal canvas dimensions maintaining aspect ratio
 */
export const calculateCanvasDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number = IMAGE_CONFIG.maxWidth,
  maxHeight: number = IMAGE_CONFIG.maxHeight
): { width: number; height: number; scale: number } => {
  let { width, height } = { width: originalWidth, height: originalHeight };

  if (width > maxWidth || height > maxHeight) {
    const scale = Math.min(maxWidth / width, maxHeight / height);
    width *= scale;
    height *= scale;
    return { width, height, scale };
  }

  return { width, height, scale: 1 };
};

/**
 * Draws bounding boxes on canvas with labels
 */
export const drawBoundingBoxes = (
  ctx: CanvasRenderingContext2D,
  boxes: BoundingBox[],
  scale: number
): void => {
  boxes.forEach((box, index) => {
    const color = DETECTION_COLORS[index % DETECTION_COLORS.length];

    // Calculate scaled coordinates
    const x = box.x * scale;
    const y = box.y * scale;
    const width = box.width * scale;
    const height = box.height * scale;

    // Draw bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Draw label background and text
    const labelText = box.confidence 
      ? `${box.label} (${(box.confidence * 100).toFixed(1)}%)`
      : box.label;
    
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    const textMetrics = ctx.measureText(labelText);
    const labelWidth = textMetrics.width + 8;
    const labelHeight = 20;

    // Label background
    ctx.fillStyle = color;
    ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight);

    // Label text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(labelText, x + 4, y - labelHeight + 3);
  });
};

/**
 * Validates URL format
 */
export const isValidImageUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}; 