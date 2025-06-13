'use client';

import React from 'react';
import { ModelType } from '@/types/api';

interface ModelSelectorProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  disabled?: boolean;
}

const MODEL_OPTIONS = [
  { value: 'qwen-vl-max' as const, label: 'Qwen-VL-Max', description: 'High performance model' },
  { value: 'qwen-vl-plus' as const, label: 'Qwen-VL-Plus', description: 'Balanced performance' },
  { value: 'qwen-vl-max-2025-04-08' as const, label: 'Qwen-VL-Max-2025-04-08', description: 'Latest version' },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="model-select" className="block text-sm font-medium text-gray-700">
        Select Model
      </label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value as ModelType)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {MODEL_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        {MODEL_OPTIONS.find(option => option.value === selectedModel)?.description}
      </p>
    </div>
  );
}; 