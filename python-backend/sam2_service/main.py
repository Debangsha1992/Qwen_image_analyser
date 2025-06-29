#!/usr/bin/env python3
"""
SAM 2 Segmentation Service
FastAPI server for handling image segmentation using Segment Anything 2
"""

import os
import io
import base64
import logging
from typing import List, Dict, Any, Optional, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import cv2
from PIL import Image
import torch
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from sam2_predictor import SAM2Predictor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SAM 2 Segmentation Service",
    description="Image segmentation service using Segment Anything 2",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global predictor instance
predictor: Optional[SAM2Predictor] = None
executor = ThreadPoolExecutor(max_workers=2)

@app.on_event("startup")
async def startup_event():
    """Initialize SAM 2 model on startup"""
    global predictor
    try:
        logger.info("Loading SAM 2 model...")
        predictor = SAM2Predictor()
        await predictor.load_model()
        logger.info("SAM 2 model loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load SAM 2 model: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global predictor
    if predictor:
        predictor.cleanup()
    executor.shutdown(wait=True)

def process_image_data(image_data: bytes) -> np.ndarray:
    """Convert image bytes to numpy array"""
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(image)
        
        return image_array
    except Exception as e:
        logger.error(f"Error processing image data: {e}")
        raise HTTPException(status_code=400, detail="Invalid image data")

def encode_mask_to_base64(mask: np.ndarray) -> str:
    """Encode mask array to base64 string"""
    try:
        # Convert boolean mask to uint8
        mask_uint8 = (mask * 255).astype(np.uint8)
        
        # Convert to PIL Image
        mask_image = Image.fromarray(mask_uint8, mode='L')
        
        # Convert to base64
        buffer = io.BytesIO()
        mask_image.save(buffer, format='PNG')
        mask_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return mask_base64
    except Exception as e:
        logger.error(f"Error encoding mask: {e}")
        return ""

async def run_segmentation(
    image_array: np.ndarray,
    mode: str,
    points: Optional[List[List[int]]] = None,
    boxes: Optional[List[List[int]]] = None
) -> Dict[str, Any]:
    """Run SAM 2 segmentation in thread pool"""
    
    def _segment():
        try:
            if mode == "everything":
                return predictor.segment_everything(image_array)
            elif mode == "points" and points:
                return predictor.segment_with_points(image_array, points)
            elif mode == "boxes" and boxes:
                return predictor.segment_with_boxes(image_array, boxes)
            else:
                raise ValueError(f"Invalid segmentation mode: {mode}")
        except Exception as e:
            logger.error(f"Segmentation error: {e}")
            raise
    
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _segment)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": predictor is not None,
        "device": str(predictor.device) if predictor else "unknown"
    }

@app.post("/segment")
async def segment_image(
    file: UploadFile = File(...),
    mode: str = Form("everything"),
    points: Optional[str] = Form(None),
    boxes: Optional[str] = Form(None)
):
    """
    Segment image using SAM 2
    
    Args:
        file: Image file to segment
        mode: Segmentation mode ('everything', 'points', 'boxes')
        points: JSON string of point coordinates [[x1,y1], [x2,y2], ...]
        boxes: JSON string of box coordinates [[x1,y1,x2,y2], ...]
    
    Returns:
        JSON response with segmentation masks and metadata
    """
    
    if not predictor:
        raise HTTPException(status_code=503, detail="SAM 2 model not loaded")
    
    try:
        # Read and process image
        image_data = await file.read()
        image_array = process_image_data(image_data)
        
        # Parse points and boxes if provided
        parsed_points = None
        parsed_boxes = None
        
        if points:
            import json
            parsed_points = json.loads(points)
        
        if boxes:
            import json
            parsed_boxes = json.loads(boxes)
        
        # Run segmentation
        result = await run_segmentation(
            image_array, mode, parsed_points, parsed_boxes
        )
        
        # Process results
        masks = result.get('masks', [])
        scores = result.get('scores', [])
        
        # Encode masks to base64
        encoded_masks = []
        for i, mask in enumerate(masks):
            mask_base64 = encode_mask_to_base64(mask)
            encoded_masks.append({
                'id': i,
                'mask': mask_base64,
                'score': float(scores[i]) if i < len(scores) else 0.0,
                'area': int(np.sum(mask))
            })
        
        return JSONResponse({
            'success': True,
            'mode': mode,
            'num_masks': len(encoded_masks),
            'masks': encoded_masks,
            'image_shape': image_array.shape[:2]
        })
        
    except Exception as e:
        logger.error(f"Segmentation request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/segment-url")
async def segment_image_url(
    image_url: str = Form(...),
    mode: str = Form("everything"),
    points: Optional[str] = Form(None),
    boxes: Optional[str] = Form(None)
):
    """
    Segment image from URL using SAM 2
    """
    
    if not predictor:
        raise HTTPException(status_code=503, detail="SAM 2 model not loaded")
    
    try:
        import requests
        
        # Download image from URL
        response = requests.get(image_url, timeout=30)
        response.raise_for_status()
        
        # Process image
        image_array = process_image_data(response.content)
        
        # Parse points and boxes if provided
        parsed_points = None
        parsed_boxes = None
        
        if points:
            import json
            parsed_points = json.loads(points)
        
        if boxes:
            import json
            parsed_boxes = json.loads(boxes)
        
        # Run segmentation
        result = await run_segmentation(
            image_array, mode, parsed_points, parsed_boxes
        )
        
        # Process results
        masks = result.get('masks', [])
        scores = result.get('scores', [])
        
        # Encode masks to base64
        encoded_masks = []
        for i, mask in enumerate(masks):
            mask_base64 = encode_mask_to_base64(mask)
            encoded_masks.append({
                'id': i,
                'mask': mask_base64,
                'score': float(scores[i]) if i < len(scores) else 0.0,
                'area': int(np.sum(mask))
            })
        
        return JSONResponse({
            'success': True,
            'mode': mode,
            'num_masks': len(encoded_masks),
            'masks': encoded_masks,
            'image_shape': image_array.shape[:2]
        })
        
    except Exception as e:
        logger.error(f"URL segmentation request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 