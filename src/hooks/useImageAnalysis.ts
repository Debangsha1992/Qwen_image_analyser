import { useState, useCallback } from 'react';
import axios from 'axios';
import { AnalysisResponse, ErrorResponse, BoundingBox, ApiUsage } from '@/types/api';
import { validateImageFile, isValidImageUrl } from '@/utils/imageProcessing';

interface UseImageAnalysisReturn {
  description: string;
  boxes: BoundingBox[];
  usage: ApiUsage | null;
  loading: boolean;
  error: string;
  analyzeImage: (
    file: File | null,
    imageUrl: string,
    enableBoundingBoxes: boolean
  ) => Promise<void>;
  clearResults: () => void;
}

/**
 * Custom hook for image analysis functionality
 * Handles API calls and state management for image analysis
 */
export const useImageAnalysis = (): UseImageAnalysisReturn => {
  const [description, setDescription] = useState('');
  const [boxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [usage, setUsage] = useState<ApiUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clearResults = useCallback(() => {
    setDescription('');
    setBoundingBoxes([]);
    setUsage(null);
    setError('');
  }, []);

  const analyzeImage = useCallback(async (
    file: File | null,
    imageUrl: string,
    enableBoundingBoxes: boolean
  ): Promise<void> => {
    // Input validation
    if (!file && !imageUrl.trim()) {
      setError('Please select an image file or enter an image URL');
      return;
    }

    if (file) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return;
      }
    } else if (imageUrl.trim() && !isValidImageUrl(imageUrl.trim())) {
      setError('Please enter a valid image URL');
      return;
    }

    setLoading(true);
    setError('');
    setDescription('');
    setBoundingBoxes([]);
    setUsage(null);

    try {
      const formData = new FormData();

      if (file) {
        formData.append('file', file);
      } else {
        formData.append('imageUrl', imageUrl.trim());
      }

      formData.append('enableBoundingBoxes', enableBoundingBoxes.toString());

      const response = await axios.post<AnalysisResponse>('/api/describe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for image processing
      });

      const data = response.data;
      setDescription(data.description);
      setBoundingBoxes(data.boxes ?? []);
      setUsage(data.usage ?? null);
    } catch (err: unknown) {
      const errorResponse = err as ErrorResponse;
      const errorMessage = errorResponse.response?.data?.error || 'Failed to analyze image';
      setError(errorMessage);
      console.error('Image analysis error:', errorResponse);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    description,
    boxes,
    usage,
    loading,
    error,
    analyzeImage,
    clearResults,
  };
}; 