import { BoundingBox } from '@/types/api';

/**
 * Parses bounding box coordinates from AI response text
 * Supports multiple coordinate formats and labeled objects
 */
export const parseBoundingBoxes = (description: string): BoundingBox[] => {
  const boxes: BoundingBox[] = [];

  try {
    // Look for coordinate patterns in the response text
    // Patterns: `[x, y, width, height]` or **Label**: `[x, y, width, height]`
    const coordinateRegex = /`\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]`(?:\s*\([^)]+\))?/g;
    const matches = Array.from(description.matchAll(coordinateRegex));

    // Also look for labels that precede the coordinates
    const labelRegex = /\*\*([^*]+)\*\*[^`]*`\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]`(?:\s*\([^)]+\))?/g;
    const labelMatches = Array.from(description.matchAll(labelRegex));

    // Extract from labeled matches first
    labelMatches.forEach((match) => {
      const [, label, x, y, width, height] = match;
      boxes.push({
        label: sanitizeLabel(label),
        x: parseInt(x, 10),
        y: parseInt(y, 10),
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        confidence: 0.85,
      });
    });

    // Add remaining unlabeled coordinates
    if (labelMatches.length < matches.length) {
      for (let i = labelMatches.length; i < matches.length; i++) {
        const match = matches[i];
        boxes.push({
          label: `Object ${i + 1}`,
          x: parseInt(match[1], 10),
          y: parseInt(match[2], 10),
          width: parseInt(match[3], 10),
          height: parseInt(match[4], 10),
          confidence: 0.8,
        });
      }
    }

    return boxes;
  } catch (parseError) {
    console.error('Error parsing bounding box data from text:', parseError);
    return [];
  }
};

/**
 * Sanitizes label text by removing trailing numbers and extra whitespace
 */
const sanitizeLabel = (label: string): string => {
  return label.replace(/\d+$/, '').trim();
};

/**
 * Validates parsed bounding box coordinates
 */
export const validateBoundingBox = (box: BoundingBox): boolean => {
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.width > 0 &&
    box.height > 0 &&
    box.label.length > 0
  );
}; 