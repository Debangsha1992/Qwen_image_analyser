# 🎯 SAM 2 Integration Setup Guide

This guide will help you set up and use the new **Segment Anything 2 (SAM 2)** integration in your AI Image Analyzer webapp.

## 🌟 What's New

Your webapp now supports **three analysis modes**:

1. **Object Detection** - Qwen-VL models for bounding box detection
2. **Segmentation (Qwen-VL)** - Text-based polygon segmentation  
3. **🆕 SAM 2 Segmentation** - High-precision pixel-level segmentation using Meta's SAM 2

## 📋 Prerequisites

- **Python 3.8+** (for SAM 2 backend)
- **Node.js 18+** (for Next.js frontend)
- **Git** (for cloning repositories)
- **4GB+ RAM** (recommended for SAM 2 models)

## 🚀 Setup Instructions

### Step 1: Install Python Dependencies

```bash
# Navigate to the project directory
cd /Users/debangsha/Desktop/Qwen_image_analyser

# Install Python dependencies
pip install -r requirements.txt

# Run the automated setup script
cd python-backend
python setup.py
```

### Step 2: Manual SAM 2 Installation (if setup.py fails)

```bash
# Clone SAM 2 repository
git clone https://github.com/facebookresearch/segment-anything-2.git sam2_repo

# Install SAM 2
cd sam2_repo
pip install -e .
cd ..
```

### Step 3: Start the SAM 2 Backend Service

```bash
# Navigate to SAM 2 service directory
cd python-backend/sam2_service

# Start the FastAPI server
python main.py
```

The SAM 2 service will start on `http://localhost:8000`

### Step 4: Start the Next.js Frontend

```bash
# In a new terminal, navigate to project root
cd /Users/debangsha/Desktop/Qwen_image_analyser

# Start the Next.js development server
npm run dev
```

The webapp will be available at `http://localhost:3000` or `http://localhost:3001`

## 🎮 How to Use SAM 2

### 1. **Select SAM 2 Mode**
- In the "Analysis Options" section, choose **"SAM 2 Segmentation"**
- You'll see a status indicator showing if the service is available

### 2. **Choose Segmentation Mode**
- **🎯 Segment Everything**: Automatically segments all objects
- **👆 Point Prompts**: Click on objects to segment them (coming soon)
- **📦 Box Prompts**: Draw boxes around objects (coming soon)

### 3. **Upload Image and Analyze**
- Upload an image or enter an image URL
- Click "🔍 Segment Image" 
- Wait for SAM 2 to process (may take 10-30 seconds)

### 4. **View Results**
- See high-precision segmentation masks
- Each mask shows confidence score and pixel area
- Masks are displayed as overlays on the image

## 🔧 Configuration Options

### SAM 2 Model Sizes

The backend supports different model sizes (configured in `sam2_predictor.py`):

- **tiny**: Fastest, lower quality (38.9M parameters)
- **small**: Balanced performance (46M parameters) 
- **base_plus**: Higher quality (80.8M parameters)
- **large**: Best quality, slower (224.4M parameters) - **Default**

### Service Configuration

Edit `python-backend/sam2_service/main.py` to configure:

- **Port**: Default 8000
- **CORS origins**: Add your domain
- **Model size**: Change in SAM2Predictor initialization
- **Timeout settings**: Adjust for your hardware

## 🐛 Troubleshooting

### SAM 2 Service Not Available

1. **Check if service is running**:
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check Python dependencies**:
   ```bash
   pip list | grep torch
   pip list | grep sam2
   ```

3. **Restart the service**:
   ```bash
   cd python-backend/sam2_service
   python main.py
   ```

### Memory Issues

- **Reduce model size**: Use 'tiny' or 'small' instead of 'large'
- **Close other applications**: SAM 2 requires significant RAM
- **Check available memory**: `free -h` (Linux) or Activity Monitor (Mac)

### Installation Issues

1. **PyTorch installation**:
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
   ```

2. **SAM 2 installation**:
   ```bash
   pip install git+https://github.com/facebookresearch/segment-anything-2.git
   ```

## 📊 Performance Comparison

| Mode | Speed | Quality | Use Case |
|------|-------|---------|----------|
| Object Detection | ⚡⚡⚡ Fast | 🎯 Good | Quick object identification |
| Qwen-VL Segmentation | ⚡⚡ Medium | 🎯🎯 Good | Text-based segmentation |
| SAM 2 Segmentation | ⚡ Slower | 🎯🎯🎯 Excellent | Precise pixel-level masks |

## 🔄 Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App  │    │  Python Backend  │    │   SAM 2 Model   │
│   (Frontend)    │◄──►│   (FastAPI)      │◄──►│   (PyTorch)     │
│   Port 3000     │    │   Port 8000      │    │   Local Files   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow

1. **User uploads image** → Frontend
2. **Image sent to SAM 2 service** → Python Backend  
3. **SAM 2 processes image** → Model inference
4. **Masks returned as base64** → Backend to Frontend
5. **Masks displayed as overlays** → Canvas rendering

## 🎯 Next Steps

### Planned Features

- **Interactive Point Prompts**: Click to segment specific objects
- **Box Prompts**: Draw bounding boxes for targeted segmentation  
- **Mask Editing**: Refine segmentation results
- **Batch Processing**: Segment multiple images
- **Export Options**: Download masks in various formats

### Integration Ideas

- **Combine with Object Detection**: Use detection boxes as SAM 2 prompts
- **Video Segmentation**: Extend to video analysis using SAM 2's video capabilities
- **Custom Training**: Fine-tune SAM 2 on domain-specific data

## 📚 References

- [SAM 2 Paper](https://arxiv.org/abs/2408.00714)
- [SAM 2 GitHub Repository](https://github.com/facebookresearch/segment-anything-2)
- [Meta SAM 2 Demo](https://sam2.metademolab.com/demo)
- [Hugging Face SAM 2](https://github.com/huggingface/segment-anything-2)

## 🆘 Support

If you encounter issues:

1. **Check the logs**: Both frontend (browser console) and backend (terminal)
2. **Verify service health**: Visit `http://localhost:8000/health`
3. **Review this guide**: Ensure all setup steps were completed
4. **Check system resources**: Monitor CPU and memory usage

---

**🎉 Congratulations!** You now have a powerful AI image analysis webapp with state-of-the-art segmentation capabilities powered by SAM 2! 