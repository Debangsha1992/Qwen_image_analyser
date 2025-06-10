import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { BoundingBox } from '@/types/api';
import { parseBoundingBoxes, validateBoundingBox } from '@/utils/boundingBoxParser';

// Configuration constants
const API_CONFIG = {
  model: 'qwen-vl-max',
  maxTokens: 1000,
  temperature: 0.7,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

// Initialize OpenAI client with Alibaba Cloud DashScope configuration
const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
});

/**
 * Validates and processes file uploads
 */
const processFileUpload = async (file: File): Promise<string> => {
  // Validate file type
  if (!API_CONFIG.supportedMimeTypes.includes(file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif')) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // Validate file size
  if (file.size > API_CONFIG.maxFileSize) {
    throw new Error(`File size exceeds ${API_CONFIG.maxFileSize / (1024 * 1024)}MB limit`);
  }

  // Convert to base64
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString('base64');
  const mimeType = file.type || 'image/jpeg';
  
  return `data:${mimeType};base64,${base64}`;
};

/**
 * Validates URL format and accessibility
 */
const validateImageUrl = (url: string): void => {
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('URL must use HTTP or HTTPS protocol');
    }
  } catch {
    throw new Error('Invalid URL format');
  }
};

/**
 * Generates appropriate prompt based on analysis type
 */
const generatePrompt = (enableBoundingBoxes: boolean): string => {
  return enableBoundingBoxes
    ? 'Please analyze this image and provide detailed descriptions of all objects you can see. For each object, please specify its location using coordinates in the format [x, y, width, height] where x,y is the top-left corner. List each object with its bounding box coordinates.'
    : 'Describe what\'s in this image in detail.';
};

/**
 * Processes bounding boxes and validates results
 */
const processBoundingBoxes = (description: string, enableBoundingBoxes: boolean): BoundingBox[] => {
  if (!enableBoundingBoxes || !description) {
    return [];
  }

  const boxes = parseBoundingBoxes(description);
  const validBoxes = boxes.filter(validateBoundingBox);

  if (boxes.length > validBoxes.length) {
    console.warn(`Filtered out ${boxes.length - validBoxes.length} invalid bounding boxes`);
  }

  console.log(`Processed ${validBoxes.length} valid bounding boxes from response`);
  return validBoxes;
};

/**
 * Main POST handler for image analysis
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse form data
    const formData = await request.formData();
    const body = Object.fromEntries(formData.entries());

    // Extract and validate inputs
    const file = formData.get('file') as File | null;
    const urlInput = body.imageUrl as string;
    const base64Input = body.imageBase64 as string;
    const enableBoundingBoxes = body.enableBoundingBoxes === 'true';

    // Determine image source and validate
    let imageUrl = '';
    if (file) {
      imageUrl = await processFileUpload(file);
    } else if (base64Input) {
      imageUrl = base64Input;
    } else if (urlInput) {
      const trimmedUrl = urlInput.trim();
      validateImageUrl(trimmedUrl);
      imageUrl = trimmedUrl;
    } else {
      return NextResponse.json(
        { error: 'Either file, imageUrl, or imageBase64 must be provided' },
        { status: 400 }
      );
    }

    // Prepare API request
    const prompt = generatePrompt(enableBoundingBoxes);
    const messageContent = [
      {
        type: 'image_url' as const,
        image_url: { url: imageUrl },
      },
      {
        type: 'text' as const,
        text: prompt,
      },
    ];

    const apiOptions = {
      model: API_CONFIG.model,
      messages: [
        {
          role: 'user' as const,
          content: messageContent,
        },
      ],
      max_tokens: API_CONFIG.maxTokens,
      temperature: API_CONFIG.temperature,
    };

    // Make API call
    const completion = await client.chat.completions.create(apiOptions);
    const description = completion.choices[0]?.message?.content || 'No description available';

    // Process results
    const boxes = processBoundingBoxes(description, enableBoundingBoxes);

    return NextResponse.json({
      description,
      boxes,
      usage: completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      model: API_CONFIG.model,
      boundingBoxesEnabled: enableBoundingBoxes,
    });
  } catch (error) {
    console.error('Error in image analysis API:', error);

    // Return appropriate error response
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze image';
    const statusCode = error instanceof Error && error.message.includes('Unsupported') ? 400 : 500;

    return NextResponse.json(
      { error: `Failed to analyze image: ${errorMessage}` },
      { status: statusCode }
    );
  }
} 