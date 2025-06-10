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
  usage?: ApiUsage;
  model?: string;
  boundingBoxesEnabled?: boolean;
}

export interface ImageProcessingConfig {
  maxWidth: number;
  maxHeight: number;
  supportedFormats: string[];
  maxFileSize: number;
}

export type InputMethod = 'url' | 'file'; 