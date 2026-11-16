# 🍃 TeaVision AI

<p align="center">
  <strong>Intelligent Tea Leaf Disease Diagnostics & Agronomic Decision Support</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?style=flat-square&logo=pytorch&logoColor=white" alt="PyTorch" />
  <img src="https://img.shields.io/badge/Google_Gemini-LLM-8E75C2?style=flat-square&logo=google&logoColor=white" alt="Gemini LLM" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-forest?style=flat-square" alt="License" />
</p>

---

## 📌 Overview

**TeaVision AI** is an end-to-end precision agriculture platform designed for tea plantations. It bridges deep learning vision models and generative AI to deliver instantaneous leaf disease identification, explainability heatmaps, clinical risk diagnostics, and actionable agronomic treatment advice.

At its core is **LightTeaNet-ECA**, a custom ultra-lightweight convolutional neural network (101K parameters) trained via knowledge distillation from MobileViT to detect foliar diseases directly in low-connectivity plantation settings.

---

## ✨ Key Features

- **Multi-Model Inference & Selection**: Switch seamlessly between 5 research architectures (Distilled Student CNNs, Vision Transformer Teachers, and Baseline CNNs) directly from the scanning interface.
- **Explainable AI (XAI)**: Generates input-gradient saliency heatmaps highlighting the exact morphological lesions driving model decisions.
- **Image Quality Validation**: Automated blur detection (Laplacian variance) and lighting analysis to prevent misclassifications from degraded field captures.
- **Clinical Diagnostic Engine**: Evaluates infection severity, spread risk, progression timelines, and expert verification thresholds based on top prediction entropy.
- **AI Agronomist**: Generative advisory powered by Google Gemini (with resilient offline rule-based fallback) delivering structured chemical, organic, and sanitation protocols.
- **Field Observations & Analytics**: Track disease incidence, geographic hotspots, plantation logs, and feedback across harvest seasons.
- **Cloud & Offline Sync**: Dual persistence supporting local SQLite out-of-the-box with automatic cloud replication to Supabase PostgreSQL.

---

## 🤖 Supported Models & Architecture

| Model | Architecture | Role | Parameters | Format | Latency (CPU) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LightTeaNet-ECA** *(Default)* | Depthwise CNN + ECA Attention | Primary Distilled Student | **101,940** | TorchScript (`.pt`) | ~30 ms |
| **LightTeaNet-SE** | Depthwise CNN + SE Blocks | Lightweight Student | **76,000** | TorchScript (`.pt`) | ~25 ms |
| **MobileNetV2** | Inverted Residual CNN | Empirical Baseline | **2,232,839** | PyTorch (`.pth`) | ~45 ms |
| **MobileViT-XXS** | Mobile Separable ViT | Teacher Model | **953,271** | ByobNet (`.pkl`) | ~65 ms |
| **MobileViT-S** | Mobile Separable ViT | Heavy Teacher | **4,942,119** | ByobNet (`.pkl`) | ~140 ms |

### Target Classes (Fixed Indexing)
`0: Tea algal leaf spot` · `1: Brown Blight` · `2: Gray Blight` · `3: Helopeltis` · `4: Red spider` · `5: Green mirid bug` · `6: Healthy leaf`

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | FastAPI, Uvicorn, Python 3.11, Pydantic v2 |
| **Machine Learning** | PyTorch (CPU-optimized), TorchScript, Timm |
| **Generative AI** | Google Gemini API (`gemini-3.1-flash-lite` / `gemini-1.5-flash`) |
| **Database** | SQLite (local) + Supabase PostgreSQL (cloud REST sync) |
| **Deployment** | Vercel (Frontend SPA) + Render (Backend Web Service) + GitHub Actions |

---

## 📂 Project Structure

```
TeaVision Application/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # Prediction, Models, Analytics, Diagnostics, Assistant
│   │   ├── core/                # Configuration and Pydantic settings
│   │   ├── database/            # SQLite repository & Supabase REST client
│   │   ├── ml/                  # Model manager, explainability (XAI), quality analysis
│   │   ├── schemas/             # Request/response validation models
│   │   └── services/            # Gemini LLM and agronomic advisor service
│   ├── models/                  # Research model artifacts (LightTeaNet, MobileViT, etc.)
│   ├── tests/                   # Automated unit & integration test suite (19 tests)
│   ├── render.yaml              # Render cloud infrastructure blueprint
│   └── requirements.txt         # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Diagnostic cards, ModelSelector, Results, XAI viewer
│   │   ├── pages/               # Scanner, Disease Library, History, Analytics Dashboard
│   │   └── services/api.ts      # Axios API client
│   └── vercel.json              # Vercel SPA routing and security headers
│
└── .github/workflows/
    └── keep-alive.yml           # Automated ping workflow to prevent free-tier spin-down
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** 20+
- **Python** 3.11
- **Git**

### 1. Clone & Configure
```bash
git clone https://github.com/GoriyashKashyap/teavision-ai.git
cd teavision-ai
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\Activate
# Linux / macOS:
source venv/bin/activate

# Install CPU PyTorch first, followed by requirements
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
```

Start backend server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API documentation will be live at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Client application will open at `http://localhost:5173`.

---

## 🧪 Running Tests

The test suite validates image preprocessing, multi-model loading, diagnostic entropy, and AI integration:

```bash
cd backend
.\venv\Scripts\python.exe -m unittest tests/test_backend.py tests/test_phase6.py -v
```
*(All 19 tests must pass)*

---

## 🌐 Production Deployment

- **Frontend (Vercel)**: Connect your repository, set root directory to `frontend`, and configure `VITE_API_URL=https://<your-render-url>.onrender.com`.
- **Backend (Render)**: Connect repository, set root directory to `backend`, runtime to `Python 3.11.10`, and build command:
  ```bash
  pip install --upgrade pip && pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt
  ```
- **Keep-Alive**: An automated GitHub Action (`.github/workflows/keep-alive.yml`) runs every 10 minutes to prevent Render free-tier cold starts.

---

## 📄 Research Disclaimer

TeaVision AI was created as an academic research platform to benchmark lightweight deep learning models and generative agronomic guidance in tea cultivation. Model confidence values represent statistical softmax distributions; critical agricultural decisions and chemical treatments should always be verified with a certified plant pathologist or tea estate advisory extension officer.
