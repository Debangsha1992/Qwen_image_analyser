import { BoundingBox } from '@/types/api';
import { DETECTION_COLORS } from '@/utils/imageProcessing';

interface ObjectDetectionSummaryProps {
  boxes: BoundingBox[];
}

/**
 * Component displaying detected objects in a grid layout
 * Shows object labels, positions, sizes, and confidence scores
 */
export const ObjectDetectionSummary: React.FC<ObjectDetectionSummaryProps> = ({ boxes }) => {
  if (boxes.length === 0) return null;

  return (
    <div className="mt-6 p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
          />
        </svg>
        <h4 className="font-semibold text-gray-800">Detected Objects ({boxes.length})</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {boxes.map((box, index) => (
          <ObjectCard key={`${box.label}-${index}`} box={box} colorIndex={index} />
        ))}
      </div>
    </div>
  );
};

/**
 * Individual object card component
 */
interface ObjectCardProps {
  box: BoundingBox;
  colorIndex: number;
}

const ObjectCard: React.FC<ObjectCardProps> = ({ box, colorIndex }) => {
  const color = DETECTION_COLORS[colorIndex % DETECTION_COLORS.length];

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 truncate" title={box.label}>
          {box.label}
        </div>
        <div className="text-xs text-gray-500">
          Position: ({box.x}, {box.y}) • Size: {box.width}×{box.height}
          {box.confidence && (
            <span className="ml-2 text-blue-600 font-medium">
              {(box.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}; 