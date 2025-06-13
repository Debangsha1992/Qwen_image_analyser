export interface ApiUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface BoundingBox {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

export interface SegmentationPolygon {
  label: string;
  points: Array<{ x: number; y: number }>;
  confidence?: number;
  pixelCoverage?: number; // Percentage of image covered by this segment
}

export interface ErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export interface AnalysisResponse {
  description: string;
  boxes?: BoundingBox[];
  segments?: SegmentationPolygon[];
  usage?: ApiUsage;
  model?: string;
  boundingBoxesEnabled?: boolean;
  segmentationEnabled?: boolean;
}

export interface ImageProcessingConfig {
  maxWidth: number;
  maxHeight: number;
  supportedFormats: string[];
  maxFileSize: number;
}

export type InputMethod = 'url' | 'file';
export type AnalysisMode = 'detection' | 'segmentation';
export type ModelType = 'qwen-vl-max' | 'qwen-vl-plus' | 'qwen-vl-max-2025-04-08'; 