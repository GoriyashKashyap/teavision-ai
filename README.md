# 🍃 TeaVision AI

> Intelligence for healthier tea plantations.

**TeaVision AI** is an AI-powered tea leaf disease detection platform that identifies diseases and pest-related damage in tea leaves using a custom-trained lightweight deep learning model — **LightTeaNet-ECA**.

---

## 🚀 Project Status — All 7 Phases Complete

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation — Project scaffold, design system, routing | ✅ Complete |
| 2 | Model Integration — LightTeaNet-ECA TorchScript inference | ✅ Complete |
| 3 | Frontend Experience — Disease library, results card, charts | ✅ Complete |
| 4 | Database — SQLite (local) / Supabase PostgreSQL (cloud) | ✅ Complete |
| 5 | Analytics — Dashboard KPIs, charts, prediction history | ✅ Complete |
| 6 | Advanced AI — Saliency maps, image quality, AI agronomist | ✅ Complete |
| 7 | Production Deployment — Vercel + Render + Supabase | ✅ Ready |

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS, Framer Motion |
| **UI** | Lucide React, Recharts |
| **Backend** | FastAPI, Python 3.11+ |
| **ML** | PyTorch (CPU), TorchScript |
| **Database** | SQLite (local) / Supabase PostgreSQL (cloud) |
| **Deployment** | Vercel (frontend), Render (backend) |

---

## 🤖 ML Model — LightTeaNet-ECA

| Property | Value |
|----------|-------|
| Architecture | Lightweight depthwise-separable CNN + ECA attention |
| Parameters | 101,940 |
| Input | (N, 3, 224, 224) RGB |
| Output | 7-class softmax |
| Format | TorchScript (.pt) |
| Test Accuracy | 87.50% (792 samples, lab conditions) |
| Macro F1 | 86.00% |

### Disease Classes (class index order is fixed)

| Index | Class |
|-------|-------|
| 0 | Tea algal leaf spot |
| 1 | Brown Blight |
| 2 | Gray Blight |
| 3 | Helopeltis |
| 4 | Red spider |
| 5 | Green mirid bug |
| 6 | Healthy leaf |

> **Note:** Confidence scores are softmax probabilities from the model — not real-world field accuracy. Always consult a certified plant pathologist before chemical applications.

---

## 📂 Project Structure

```
TeaVision Application/
├── frontend/                     # React + Vite app
│   ├── src/
│   │   ├── pages/               # LandingPage, ScannerPage, DashboardPage, etc.
│   │   ├── components/          # ResultsCard, AttentionHeatmap, AIAssistantDrawer, ...
│   │   ├── services/api.ts      # Axios API client
│   │   ├── data/diseases.ts     # TRI-curated disease knowledge base
│   │   └── types/index.ts       # TypeScript interfaces
│   ├── public/manifest.json     # PWA manifest
│   ├── vercel.json              # Vercel SPA routing + security headers
│   └── .env.production          # Production API URL
│
└── backend/                     # FastAPI Python app
    ├── app/
    │   ├── api/routes/          # predict, history, analytics, assistant, ...
    │   ├── ml/                  # predictor.py, explainability.py, quality.py
    │   ├── database/repository.py
    │   └── schemas/             # Pydantic models
    ├── models/                  # TorchScript .pt artifact (not in git)
    ├── tests/                   # test_backend.py (12), test_phase6.py (4)
    ├── Dockerfile               # Docker deployment
    ├── render.yaml              # Render.com deployment config
    ├── supabase_schema.sql      # Supabase PostgreSQL migration
    └── requirements.txt
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- PyTorch (CPU) installed: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu`

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
# Place lightteanet_eca_mobilevit_xxs_kd_torchscript.pt in backend/models/
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

App available at: http://localhost:5173  
API docs at: http://localhost:8000/docs

### Tests

```powershell
cd backend
.\venv\Scripts\python.exe -m unittest tests/test_backend.py tests/test_phase6.py
# Expected: Ran 16 tests in ~2s, OK
```

---

## 🌐 Production Deployment

### Frontend → Vercel

1. Push repo to GitHub
2. Import project in [vercel.com/new](https://vercel.com/new)
3. Set **Framework Preset**: Vite
4. Set **Root Directory**: `frontend`
5. Add environment variable: `VITE_API_URL=https://teavision-api.onrender.com`
6. Deploy

### Backend → Render

1. Create **New Web Service** on [render.com](https://render.com)
2. Connect GitHub repo
3. Set **Root Directory**: `backend`
4. **Build Command**:
   ```
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt
   ```
5. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Set environment variables:
   - `ALLOWED_ORIGINS` → your Vercel URL (e.g. `https://teavision.vercel.app`)
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
7. Upload the `.pt` model file via Render Shell or persistent storage
8. Deploy

> ⚠️ The `.pt` model file is excluded from git. See [Model Hosting](#model-hosting) below.

### Model Hosting

The TorchScript artifact (`lightteanet_eca_mobilevit_xxs_kd_torchscript.pt`, ~0.577 MB) is excluded from git due to binary size conventions. Deployment options:

| Option | Method |
|--------|--------|
| **Render** | Use Render Shell to upload after first deploy |
| **Git LFS** | `git lfs track "*.pt"` then commit normally |
| **Object storage** | Host on Supabase Storage / S3, download at startup |

### Database → Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run `backend/supabase_schema.sql` in the SQL Editor
3. Copy credentials to Render environment variables

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health + model status |
| GET | `/api/v1/model/info` | Model metadata |
| POST | `/api/v1/predict` | Upload image → disease prediction |
| GET | `/api/v1/predictions` | List prediction history |
| GET | `/api/v1/predictions/{id}` | Single prediction detail |
| POST | `/api/v1/feedback` | Submit prediction feedback |
| POST | `/api/v1/field-observations` | Log field observation |
| GET | `/api/v1/analytics/summary` | Analytics aggregates |
| POST | `/api/v1/assistant/chat` | AI agronomist chat |

Full interactive docs: `http://localhost:8000/docs`

---

## 🧠 Phase 6 — Advanced AI Features

- **Image Quality Assessment** — Laplacian variance blur detection + brightness/contrast analysis. Warns users about poor-quality images before accepting predictions.
- **Gradient Saliency Maps** — Input gradient–based visual explanations showing which image regions most influenced the prediction. (Note: TorchScript does not support `register_forward_hook`; `torch.autograd.grad` is used instead of Grad-CAM.)
- **AI Agronomist** — KB-driven conversational assistant covering all 7 disease classes with symptom identification, treatment protocols, and organic management options. Backed by TRI-referenced literature.

---

## 📄 License & Research Use

This application was developed as part of a final-year research project to evaluate the LightTeaNet-ECA model in real-world field conditions. It is intended for research and educational demonstrations.

Predictions are probabilistic AI outputs and do **not** guarantee agricultural accuracy. Always consult a certified plant pathologist or agricultural extension officer before making treatment decisions.
