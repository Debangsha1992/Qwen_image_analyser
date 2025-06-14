'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { InputMethod, AnalysisMode, ModelType, SAM2Mode, SAM2Mask } from '@/types/api';
import { useImageAnalysis } from '@/hooks/useImageAnalysis';
import { useSAM2Segmentation } from '@/hooks/useSAM2Segmentation';
import { ImageCanvas } from '@/components/ImageCanvas';
import { ObjectDetectionSummary } from '@/components/ObjectDetectionSummary';
import { ImageInputCard } from '@/components/ImageInputCard';
import { RateLimitCounter } from '@/components/RateLimitCounter';
import { ModelSelector } from '@/components/ModelSelector';
import { SAM2ModeSelector } from '@/components/SAM2ModeSelector';
import { BoxSelectionProvider } from '@/context/BoxSelectionContext';

const EXAMPLE_IMAGE_URL = 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg';

/**
 * Main application component for AI image analysis
 * Provides file upload, URL input, object detection, segmentation, and SAM 2 capabilities
 */
export default function Home(): React.JSX.Element {
  // State management
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('detection');
  const [selectedModel, setSelectedModel] = useState<ModelType>('qwen-vl-max');
  const [sam2Mode, setSam2Mode] = useState<SAM2Mode>('everything');
  const [currentImage, setCurrentImage] = useState<string>('');
  const [inputMethod, setInputMethod] = useState<InputMethod>('file');
  const [selectedBoxIndices, setSelectedBoxIndices] = useState<Set<number>>(new Set());

  // Hooks
  const { description, boxes, segments, usage, loading, error, rateLimitInfo, analyzeImage, clearResults } = useImageAnalysis();
  const { 
    masks: sam2Masks, 
    loading: sam2Loading, 
    error: sam2Error, 
    segmentImage: sam2SegmentImage, 
    clearResults: clearSam2Results,
    isServiceAvailable: sam2ServiceAvailable,
    checkServiceHealth: checkSam2Health
  } = useSAM2Segmentation();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Event handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCurrentImage(previewUrl);
    clearResults();
    clearSam2Results();
  };

  const handleImageUrlChange = (url: string): void => {
    setImageUrl(url);
    if (url.trim()) {
      setCurrentImage(url.trim());
      setSelectedFile(null);
      clearResults();
      clearSam2Results();
    }
  };

  const handleAnalyze = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (analysisMode === 'sam2') {
      // Use SAM 2 for segmentation
      await sam2SegmentImage(selectedFile, imageUrl, sam2Mode);
    } else {
      // Use existing Qwen-VL analysis
      await analyzeImage(selectedFile, imageUrl, analysisMode, selectedModel);
    }
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
    clearSam2Results();
    setSelectedBoxIndices(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleBoxSelection = (index: number): void => {
    setSelectedBoxIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.clear(); // Only show one box at a time
        newSet.add(index);
      }
      return newSet;
    });
  };

  const clearBoxSelection = (): void => {
    setSelectedBoxIndices(new Set());
  };

  // Determine current loading state and error
  const isLoading = loading || sam2Loading;
  const currentError = error || sam2Error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-2 py-4 max-w-[95vw]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Header />
        </motion.div>
        
        {/* Top Section - Input, Options, API Usage, and Analyze Button */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid xl:grid-cols-3 gap-4">
            <div className="xl:col-span-1">
              <ImageInputCard
                inputMethod={inputMethod}
                setInputMethod={setInputMethod}
                imageUrl={imageUrl}
                selectedFile={selectedFile}
                fileInputRef={fileInputRef}
                onFileSelect={handleFileSelect}
                onImageUrlChange={handleImageUrlChange}
                onExampleImage={handleExampleImage}
              />
            </div>
            
            <div className="xl:col-span-1">
              <OptionsCard
                analysisMode={analysisMode}
                selectedModel={selectedModel}
                sam2Mode={sam2Mode}
                sam2ServiceAvailable={sam2ServiceAvailable}
                onAnalysisModeChange={setAnalysisMode}
                onModelChange={setSelectedModel}
                onSam2ModeChange={setSam2Mode}
                onCheckSam2Health={checkSam2Health}
              />
            </div>
            
            <div className="xl:col-span-1 space-y-4">
              <RateLimitCounter
                remaining={rateLimitInfo?.remaining}
                total={10}
                resetTime={rateLimitInfo ? new Date(rateLimitInfo.resetTime).getTime() : undefined}
              />
              <ActionButtons
                loading={isLoading}
                hasInput={!!(selectedFile || imageUrl)}
                analysisMode={analysisMode}
                onAnalyze={handleAnalyze}
                onClearImage={clearImage}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Main Content Section */}
        <BoxSelectionProvider
          boxes={analysisMode === 'detection' ? boxes : []}
          selectedBoxIndices={selectedBoxIndices}
          onToggleBox={toggleBoxSelection}
        >
          <motion.div 
            className="grid xl:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Sticky Image Section - Spans Two Columns */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="xl:col-span-2"
            >
              <div className="sticky top-4">
                <ImageDisplayCard
                  currentImage={currentImage}
                  boxes={analysisMode === 'detection' ? boxes : []}
                  segments={analysisMode === 'segmentation' ? segments : []}
                  sam2Masks={analysisMode === 'sam2' ? sam2Masks : []}
                  analysisMode={analysisMode}
                  selectedBoxIndices={selectedBoxIndices}
                  onToggleBox={toggleBoxSelection}
                  onClearSelection={clearBoxSelection}
                />
              </div>
            </motion.div>
            
            {/* Scrollable Analysis Section - Right Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="xl:col-span-1"
            >
              <AnalysisSection
                loading={isLoading}
                error={currentError}
                description={description}
                usage={usage}
                boxes={analysisMode === 'detection' ? boxes : []}
                segments={analysisMode === 'segmentation' ? segments : []}
                sam2Masks={analysisMode === 'sam2' ? sam2Masks : []}
                selectedBoxIndices={selectedBoxIndices}
              />
            </motion.div>
          </motion.div>
        </BoxSelectionProvider>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <InstructionsSection />
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Application header component
 */
const Header: React.FC = () => (
  <div className="text-center mb-6">
    <div className="inline-flex items-center gap-3 mb-3">
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
      Powered by Alibaba Cloud Qwen-VL-Max with Object Detection & Segmentation
    </p>
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      <span className="text-sm font-medium text-emerald-700">AI Ready</span>
    </div>
  </div>
);

/**
 * Analysis section props interface
 */
interface AnalysisSectionProps {
  loading: boolean;
  error: string;
  description: string;
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  boxes: Array<{ label: string; x: number; y: number; width: number; height: number; confidence?: number }>;
  segments: Array<{ label: string; points: Array<{ x: number; y: number }>; confidence?: number; pixelCoverage?: number }>;
  sam2Masks: SAM2Mask[];
  selectedBoxIndices: Set<number>;
}

/**
 * Analysis section for scrollable content
 */
const AnalysisSection: React.FC<AnalysisSectionProps> = ({
  loading,
  error,
  description,
  usage,
  boxes,
  segments,
  sam2Masks,
  selectedBoxIndices,
}) => (
  <div className="space-y-6">
    {loading && <LoadingCard />}
    {error && <ErrorCard error={error} />}
    {description && <AnalysisResultsCard description={description} usage={usage} boxes={boxes} segments={segments} sam2Masks={sam2Masks} selectedBoxIndices={selectedBoxIndices} />}
  </div>
);

const OptionsCard: React.FC<{ 
  analysisMode: AnalysisMode; 
  selectedModel: ModelType;
  sam2Mode: SAM2Mode;
  sam2ServiceAvailable: boolean;
  onAnalysisModeChange: (mode: AnalysisMode) => void; 
  onModelChange: (model: ModelType) => void;
  onSam2ModeChange: (mode: SAM2Mode) => void;
  onCheckSam2Health: () => Promise<boolean>;
}> = ({ 
  analysisMode, 
  selectedModel, 
  sam2Mode, 
  sam2ServiceAvailable,
  onAnalysisModeChange, 
  onModelChange, 
  onSam2ModeChange,
  onCheckSam2Health
}) => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Options</h3>
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="analysisMode"
            value="detection"
            checked={analysisMode === 'detection'}
            onChange={() => onAnalysisModeChange('detection')}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
          />
          <div>
            <span className="font-medium text-gray-700">Object Detection</span>
            <p className="text-sm text-gray-500">Detect objects with bounding boxes and coordinates</p>
          </div>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="analysisMode"
            value="segmentation"
            checked={analysisMode === 'segmentation'}
            onChange={() => onAnalysisModeChange('segmentation')}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
          />
          <div>
            <span className="font-medium text-gray-700">Segmentation (Qwen-VL)</span>
            <p className="text-sm text-gray-500">Segment objects with precise boundaries and pixel coverage</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="analysisMode"
            value="sam2"
            checked={analysisMode === 'sam2'}
            onChange={() => onAnalysisModeChange('sam2')}
            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">SAM 2 Segmentation</span>
              <div className={`w-2 h-2 rounded-full ${sam2ServiceAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className={`text-xs ${sam2ServiceAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {sam2ServiceAvailable ? 'Available' : 'Offline'}
              </span>
            </div>
            <p className="text-sm text-gray-500">High-precision segmentation using Meta's SAM 2</p>
            {!sam2ServiceAvailable && (
              <button
                onClick={onCheckSam2Health}
                className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
              >
                Check Service Status
              </button>
            )}
          </div>
        </label>
      </div>
      
      {analysisMode === 'detection' && (
        <div className="pt-2 border-t border-gray-200">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            disabled={false}
          />
        </div>
      )}

      {analysisMode === 'sam2' && (
        <div className="pt-2 border-t border-gray-200">
          <SAM2ModeSelector
            selectedMode={sam2Mode}
            onModeChange={onSam2ModeChange}
            disabled={!sam2ServiceAvailable}
          />
        </div>
      )}
    </div>
  </div>
);

const ActionButtons: React.FC<{
  loading: boolean;
  hasInput: boolean;
  analysisMode: AnalysisMode;
  onAnalyze: (e: React.FormEvent) => void;
  onClearImage: () => void;
}> = ({ loading, hasInput, analysisMode, onAnalyze, onClearImage }) => (
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
        `🔍 ${analysisMode === 'segmentation' ? 'Segment Image' : 'Detect Objects'}`
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
  segments: Array<{ label: string; points: Array<{ x: number; y: number }>; confidence?: number; pixelCoverage?: number }>;
  sam2Masks: SAM2Mask[];
  analysisMode: AnalysisMode;
  selectedBoxIndices: Set<number>;
  onToggleBox: (index: number) => void;
  onClearSelection: () => void;
}> = ({ currentImage, boxes, segments, sam2Masks, analysisMode, selectedBoxIndices, onToggleBox, onClearSelection }) => {
  const hasResults = (analysisMode === 'detection' && boxes.length > 0) || 
                     (analysisMode === 'segmentation' && segments.length > 0) ||
                     (analysisMode === 'sam2' && sam2Masks.length > 0);
  
  const getDisplayTitle = () => {
    if (analysisMode === 'sam2') return 'SAM 2 Segmentation';
    if (analysisMode === 'segmentation') return 'Segmentation';
    return 'Object Detection';
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Image {hasResults && `+ ${getDisplayTitle()}`}
        </h3>
        {selectedBoxIndices.size > 0 && (
          <button
            onClick={onClearSelection}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Show All {analysisMode === 'sam2' ? 'Masks' : analysisMode === 'segmentation' ? 'Segments' : 'Boxes'}
          </button>
        )}
      </div>
      <div className="flex justify-center">
        <ImageCanvas 
          imageUrl={currentImage} 
          boxes={analysisMode === 'detection' ? (selectedBoxIndices.size > 0 ? boxes.filter((_, index) => selectedBoxIndices.has(index)) : boxes) : []}
          segments={analysisMode === 'segmentation' ? (selectedBoxIndices.size > 0 ? segments.filter((_, index) => selectedBoxIndices.has(index)) : segments) : []}
        />
      </div>
      <ObjectDetectionSummary 
        boxes={analysisMode === 'detection' ? boxes : []}
        segments={analysisMode === 'segmentation' ? segments : []}
        selectedBoxIndices={selectedBoxIndices}
        onToggleBox={onToggleBox}
      />
      {analysisMode === 'sam2' && sam2Masks.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-semibold text-gray-700 mb-2">SAM 2 Masks ({sam2Masks.length})</h4>
          <div className="grid grid-cols-2 gap-2">
            {sam2Masks.map((mask, index) => (
              <div key={mask.id} className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-600">
                  Mask {mask.id + 1} - Score: {(mask.score * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  Area: {mask.area.toLocaleString()} pixels
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingCard: React.FC = () => (
  <motion.div 
    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center justify-center space-x-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <motion.span 
        className="text-lg text-gray-600"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Analyzing image(s)...
      </motion.span>
    </div>
  </motion.div>
);

const ErrorCard: React.FC<{ error: string }> = ({ error }) => (
  <motion.div 
    className="bg-red-50 border border-red-200 rounded-2xl p-6"
    initial={{ opacity: 0, scale: 0.95, x: -20 }}
    animate={{ opacity: 1, scale: 1, x: 0 }}
    transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
  >
    <div className="flex items-center gap-3">
      <motion.div 
        className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </motion.div>
      <div>
        <h3 className="font-semibold text-red-800">Analysis Failed</h3>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    </div>
  </motion.div>
);

const AnalysisResultsCard: React.FC<{
  description: string;
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  boxes: Array<{ label: string; x: number; y: number; width: number; height: number; confidence?: number }>;
  segments: Array<{ label: string; points: Array<{ x: number; y: number }>; confidence?: number; pixelCoverage?: number }>;
  sam2Masks: SAM2Mask[];
  selectedBoxIndices: Set<number>;
}> = ({ description, usage, boxes, segments, sam2Masks, selectedBoxIndices }) => {
  
  // Function to highlight text based on selected objects (works for both boxes and segments)
  const highlightSelectedObjects = (text: string): string => {
    if (selectedBoxIndices.size === 0) return text;
    
    let highlightedText = text;
    
    // For each selected item, highlight its label and relevant info
    selectedBoxIndices.forEach(index => {
      // Handle both boxes and segments
      const box = boxes[index];
      const segment = segments[index];
      
      if (box) {
        // Highlight the object label (case insensitive)
        const cleanLabel = box.label.replace(/^plaintext\s*/i, "");
        const labelRegex = new RegExp(`(${cleanLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        highlightedText = highlightedText.replace(labelRegex, '<mark class="bg-blue-200 text-blue-900 px-1 rounded">$1</mark>');
        
        // For bounding boxes, highlight coordinates
        const coordString = `[${box.x}, ${box.y}, ${box.width}, ${box.height}]`;
        const coordRegex = new RegExp(`\\[${box.x},\\s*${box.y},\\s*${box.width},\\s*${box.height}\\]`, 'g');
        highlightedText = highlightedText.replace(coordRegex, `<mark class="bg-yellow-200 text-yellow-900 px-1 rounded font-mono text-xs">${coordString}</mark>`);
      }
      
      if (segment) {
        // Highlight the object label (case insensitive)
        const cleanLabel = segment.label.replace(/^plaintext\s*/i, "");
        const labelRegex = new RegExp(`(${cleanLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        highlightedText = highlightedText.replace(labelRegex, '<mark class="bg-blue-200 text-blue-900 px-1 rounded">$1</mark>');
        
        // For segments, highlight pixel coverage if available
        if (segment.pixelCoverage !== undefined && segment.pixelCoverage !== null) {
          const coverageRegex = new RegExp(`(${segment.pixelCoverage.toFixed(1)}%|${Math.round(segment.pixelCoverage)}%)`, 'g');
          highlightedText = highlightedText.replace(coverageRegex, '<mark class="bg-green-200 text-green-900 px-1 rounded font-mono text-xs">$1</mark>');
        }
      }
    });
    
    return highlightedText;
  };

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
    >
      <motion.div 
        className="flex items-center gap-3 mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <motion.div 
          className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a9 9 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 21H9.154a3.374 3.374 0 00-2.53-1.098l-.548-.549z" />
          </svg>
        </motion.div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">AI Analysis</h3>
          <p className="text-xs text-gray-600">
            {segments.length > 0 ? 'Detailed segmentation and pixel coverage' : 'Detailed object detection and description'}
          </p>
        </div>
      </motion.div>
      
      <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed text-sm">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: highlightSelectedObjects(description)
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
              .replace(/### (.*?)(\n|$)/g, '<h3 class="text-base font-semibold text-gray-800 mt-4 mb-2 flex items-center gap-2"><span class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>$1</h3>')
              .replace(/#### (.*?)(\n|$)/g, '<h4 class="text-sm font-medium text-gray-700 mt-3 mb-1">$1</h4>')
              .replace(/^\* (.*?)(\n|$)/gm, '<li class="text-gray-600 text-sm ml-4">$1</li>')
              .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded p-2 overflow-x-auto my-2"><code>$1</code></pre>')
              .replace(/((\[\d+,\s*\d+\](,?\s*)?)+)/g, '<pre class="bg-gray-100 rounded p-2 overflow-x-auto my-2"><code>$1</code></pre>')
              .replace(/\n\n/g, '</p><p class="mb-2 text-gray-700 leading-relaxed text-sm">')
              .replace(/^(?!<[hlp])/gm, '<p class="mb-2 text-gray-700 leading-relaxed text-sm">')
              .replace(/$(?!<\/p>)/gm, '</p>')
          }}
        />
      </div>
      
      {usage && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">API Usage</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-sm font-bold text-gray-800">{isNaN(usage.prompt_tokens || 0) ? 0 : (usage.prompt_tokens || 0)}</div>
              <div className="text-xs text-gray-500">Prompt</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-sm font-bold text-gray-800">{isNaN(usage.completion_tokens || 0) ? 0 : (usage.completion_tokens || 0)}</div>
              <div className="text-xs text-gray-500">Response</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-sm font-bold text-blue-600">{isNaN(usage.total_tokens || 0) ? 0 : (usage.total_tokens || 0)}</div>
              <div className="text-xs text-blue-500">Total</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

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
          <li>• Detect objects with bounding boxes</li>
          <li>• Shows exact coordinates and sizes</li>
          <li>• Click objects to highlight in analysis</li>
        </ul>
      </div>
      <div>
        <h4 className="font-medium text-gray-700 mb-2">🧩 Segmentation</h4>
        <ul className="space-y-1 text-gray-600 text-sm">
          <li>• Precise object boundaries with polygons</li>
          <li>• Calculate pixel coverage percentages</li>
          <li>• Perfect for detailed analysis</li>
        </ul>
      </div>
    </div>
  </div>
);
