'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { InputMethod } from '@/types/api';
import { useImageAnalysis } from '@/hooks/useImageAnalysis';
import { ImageCanvas } from '@/components/ImageCanvas';
import { ObjectDetectionSummary } from '@/components/ObjectDetectionSummary';
import { ImageInputCard } from '@/components/ImageInputCard';

const EXAMPLE_IMAGE_URL = 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg';

/**
 * Main application component for AI image analysis
 * Provides file upload, URL input, and object detection capabilities
 */
export default function Home(): React.JSX.Element {
  // State management
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enableBoundingBoxes, setEnableBoundingBoxes] = useState(true);
  const [currentImage, setCurrentImage] = useState<string>('');
  const [inputMethod, setInputMethod] = useState<InputMethod>('file');

  // Hooks
  const { description, boxes, usage, loading, error, analyzeImage, clearResults } = useImageAnalysis();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Event handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCurrentImage(previewUrl);
    clearResults();
  };

  const handleImageUrlChange = (url: string): void => {
    setImageUrl(url);
    if (url.trim()) {
      setCurrentImage(url.trim());
      setSelectedFile(null);
      clearResults();
    }
  };

  const handleAnalyze = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await analyzeImage(selectedFile, imageUrl, enableBoundingBoxes);
  };

  const handleExampleImage = (): void => {
    setImageUrl(EXAMPLE_IMAGE_URL);
    setCurrentImage(EXAMPLE_IMAGE_URL);
    setSelectedFile(null);
    setInputMethod('url');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearImage = (): void => {
    setImageUrl('');
    setSelectedFile(null);
    setCurrentImage('');
    clearResults();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header />
        <ApiUsageBanner usage={usage} />
        
        <div className="grid lg:grid-cols-2 gap-8">
          <InputSection
            inputMethod={inputMethod}
            setInputMethod={setInputMethod}
            imageUrl={imageUrl}
            selectedFile={selectedFile}
            enableBoundingBoxes={enableBoundingBoxes}
            loading={loading}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onImageUrlChange={handleImageUrlChange}
            onEnableBoundingBoxesChange={setEnableBoundingBoxes}
            onAnalyze={handleAnalyze}
            onExampleImage={handleExampleImage}
            onClearImage={clearImage}
          />
          
          <DisplaySection
            currentImage={currentImage}
            boxes={boxes}
            enableBoundingBoxes={enableBoundingBoxes}
            loading={loading}
            error={error}
            description={description}
            usage={usage}
          />
        </div>
        
        <InstructionsSection />
      </div>
    </div>
  );
}

/**
 * Application header component
 */
const Header: React.FC = () => (
  <div className="text-center mb-12">
    <div className="inline-flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
        AI Image Analyzer
      </h1>
    </div>
    <p className="text-lg text-gray-600 mb-4">
      Powered by Alibaba Cloud Qwen-VL-Max (Multi-modal Vision Model)
    </p>
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      <span className="text-sm font-medium text-emerald-700">AI Ready</span>
    </div>
  </div>
);

/**
 * Input section props interface
 */
interface InputSectionProps {
  inputMethod: InputMethod;
  setInputMethod: (method: InputMethod) => void;
  imageUrl: string;
  selectedFile: File | null;
  enableBoundingBoxes: boolean;
  loading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUrlChange: (url: string) => void;
  onEnableBoundingBoxesChange: (enabled: boolean) => void;
  onAnalyze: (e: React.FormEvent) => void;
  onExampleImage: () => void;
  onClearImage: () => void;
}

/**
 * Input section component for file uploads and settings
 */
const InputSection: React.FC<InputSectionProps> = ({
  inputMethod,
  setInputMethod,
  imageUrl,
  selectedFile,
  enableBoundingBoxes,
  loading,
  fileInputRef,
  onFileSelect,
  onImageUrlChange,
  onEnableBoundingBoxesChange,
  onAnalyze,
  onExampleImage,
  onClearImage,
}) => (
  <div className="space-y-6">
    <ImageInputCard
      inputMethod={inputMethod}
      setInputMethod={setInputMethod}
      imageUrl={imageUrl}
      selectedFile={selectedFile}
      fileInputRef={fileInputRef}
      onFileSelect={onFileSelect}
      onImageUrlChange={onImageUrlChange}
      onExampleImage={onExampleImage}
    />
    
    <OptionsCard
      enableBoundingBoxes={enableBoundingBoxes}
      onEnableBoundingBoxesChange={onEnableBoundingBoxesChange}
    />
    
    <ActionButtons
      loading={loading}
      hasInput={!!(selectedFile || imageUrl)}
      enableBoundingBoxes={enableBoundingBoxes}
      onAnalyze={onAnalyze}
      onClearImage={onClearImage}
    />
  </div>
);

/**
 * Display section props interface
 */
interface DisplaySectionProps {
  currentImage: string;
  boxes: Array<{ label: string; x: number; y: number; width: number; height: number; confidence?: number }>;
  enableBoundingBoxes: boolean;
  loading: boolean;
  error: string;
  description: string;
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
}

/**
 * Display section for results and canvas
 */
const DisplaySection: React.FC<DisplaySectionProps> = ({
  currentImage,
  boxes,
  enableBoundingBoxes,
  loading,
  error,
  description,
  usage,
}) => (
  <div className="space-y-6">
    {currentImage && (
      <ImageDisplayCard currentImage={currentImage} boxes={boxes} enableBoundingBoxes={enableBoundingBoxes} />
    )}
    
    {loading && <LoadingCard />}
    {error && <ErrorCard error={error} />}
    {description && <AnalysisResultsCard description={description} usage={usage} />}
  </div>
);

/**
 * API Usage Banner Component
 */
const ApiUsageBanner: React.FC<{ usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null }> = ({ usage }) => {
  const totalTokens = usage?.total_tokens ?? 0;
  const requestsLeft = Math.max(0, 10 - Math.floor(totalTokens / 1000)); // Example calculation
  
  return (
    <div className="bg-green-600 text-white px-4 py-2 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="font-medium">API Usage: {totalTokens > 0 ? `${totalTokens} tokens` : 'No usage yet'}</span>
          <div className="bg-white/20 px-2 py-1 rounded text-sm">
            ℹ️
          </div>
        </div>
        <div className="text-sm">
          <span>{requestsLeft} Requests Left</span>
          <span className="ml-4">Reset in 24h 0m</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Remaining component implementations would follow similar patterns...
 * Due to length constraints, I'll create the essential smaller components
 */

// Additional component implementations would be extracted similarly
// following the same patterns for maintainability and readability



const OptionsCard: React.FC<{ 
  enableBoundingBoxes: boolean; 
  onEnableBoundingBoxesChange: (enabled: boolean) => void; 
}> = ({ enableBoundingBoxes, onEnableBoundingBoxesChange }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Options</h3>
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={enableBoundingBoxes}
        onChange={(e) => onEnableBoundingBoxesChange(e.target.checked)}
        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
      />
      <div>
        <span className="font-medium text-gray-700">Object Detection</span>
        <p className="text-sm text-gray-500">Request detailed object descriptions with coordinates</p>
        <p className="text-xs text-amber-600">Note: Visual bounding boxes depend on model response format</p>
      </div>
    </label>
  </div>
);

const ActionButtons: React.FC<{
  loading: boolean;
  hasInput: boolean;
  enableBoundingBoxes: boolean;
  onAnalyze: (e: React.FormEvent) => void;
  onClearImage: () => void;
}> = ({ loading, hasInput, enableBoundingBoxes, onAnalyze, onClearImage }) => (
  <div className="flex gap-3">
    <button
      onClick={onAnalyze}
      disabled={loading || !hasInput}
      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Analyzing...
        </span>
      ) : (
        `🔍 Analyze Image${enableBoundingBoxes ? ' + Objects' : ''}`
      )}
    </button>
    
    {hasInput && (
      <button
        onClick={onClearImage}
        className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
      >
        ✕
      </button>
    )}
  </div>
);

const ImageDisplayCard: React.FC<{
  currentImage: string;
  boxes: Array<{ label: string; x: number; y: number; width: number; height: number; confidence?: number }>;
  enableBoundingBoxes: boolean;
}> = ({ currentImage, boxes, enableBoundingBoxes }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">
      Image {enableBoundingBoxes && boxes.length > 0 && '+ Object Detection'}
    </h3>
    <div className="flex justify-center">
      <ImageCanvas imageUrl={currentImage} boxes={boxes} />
    </div>
    <ObjectDetectionSummary boxes={boxes} />
  </div>
);

const LoadingCard: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <div className="flex items-center justify-center space-x-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span className="text-lg text-gray-600">Analyzing image(s)...</span>
    </div>
  </div>
);

const ErrorCard: React.FC<{ error: string }> = ({ error }) => (
  <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h3 className="font-semibold text-red-800">Analysis Failed</h3>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    </div>
  </div>
);

const AnalysisResultsCard: React.FC<{
  description: string;
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
}> = ({ description, usage }) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a9 9 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 21H9.154a3.374 3.374 0 00-2.53-1.098l-.548-.549z" />
        </svg>
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-800">AI Analysis</h3>
        <p className="text-sm text-gray-600">Detailed object detection and description</p>
      </div>
    </div>
    
    <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed">
      <ReactMarkdown 
        components={{
          h3: ({children}) => <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>{children}</h3>,
          h4: ({children}) => <h4 className="text-base font-medium text-gray-700 mt-4 mb-2">{children}</h4>,
          ul: ({children}) => <ul className="list-disc list-inside space-y-1 ml-4">{children}</ul>,
          li: ({children}) => <li className="text-gray-600">{children}</li>,
          code: ({children}) => <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-mono border">{children}</code>,
          strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
          p: ({children}) => <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>
        }}
      >
        {description}
      </ReactMarkdown>
    </div>
    
    {usage && (
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-600 mb-3">API Usage</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-800">{usage.prompt_tokens ?? 0}</div>
            <div className="text-xs text-gray-500">Prompt</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-800">{usage.completion_tokens ?? 0}</div>
            <div className="text-xs text-gray-500">Response</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{usage.total_tokens ?? 0}</div>
            <div className="text-xs text-blue-500">Total</div>
          </div>
        </div>
      </div>
    )}
  </div>
);

const InstructionsSection: React.FC = () => (
  <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
    <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Use</h3>
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-medium text-gray-700 mb-2">📁 File Upload</h4>
        <ul className="space-y-1 text-gray-600 text-sm">
          <li>• Upload images directly from your device</li>
          <li>• Supports JPEG, PNG, WebP, GIF (up to 10MB)</li>
          <li>• Drag & drop or click to browse</li>
        </ul>
      </div>
      <div>
        <h4 className="font-medium text-gray-700 mb-2">🔗 URL Input</h4>
        <ul className="space-y-1 text-gray-600 text-sm">
          <li>• Enter any publicly accessible image URL</li>
          <li>• Use the example image for testing</li>
          <li>• Perfect for online images</li>
        </ul>
      </div>
      <div>
        <h4 className="font-medium text-gray-700 mb-2">🎯 Object Detection</h4>
        <ul className="space-y-1 text-gray-600 text-sm">
          <li>• Enable to detect and locate objects</li>
          <li>• Shows bounding boxes with labels</li>
          <li>• Color-coded for easy identification</li>
        </ul>
      </div>
      <div>
        <h4 className="font-medium text-gray-700 mb-2">📊 Analysis</h4>
        <ul className="space-y-1 text-gray-600 text-sm">
          <li>• Detailed AI description of images</li>
          <li>• Token usage tracking</li>
          <li>• Comprehensive error handling</li>
        </ul>
      </div>
    </div>
  </div>
);
