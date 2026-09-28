# 🏥 MediGrid — Unified Care Platform & Machine Learning Intelligence

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11+-green.svg)](https://fastapi.tiangolo.com/)
[![pnpm](https://img.shields.io/badge/pnpm-11-orange.svg)](https://pnpm.io/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

A unified monorepo integrating patient care workflows, digital e-prescriptions, clinician operations, interactive glassmorphic portals, and a **DASS-42 Machine Learning Psychometric Engine** trained on 39,775 responses.

---

## 🌟 Architecture & Monorepo Layout

```
MediGrid-Unified-Care-Platform/
├── apps/
│   ├── medigrid-app/         # React 19 + Vite 7 SPA (Patients, Doctors, Reception, Admin)
│   └── static-portal/        # Dark glassmorphic showcase with interactive neural brain canvas
├── services/
│   ├── api-server/           # Node.js + Express 5 REST API (Care loops, E-Prescriptions, ML Proxy)
│   └── ml-service/           # Python DASS-42 Machine Learning Engine & Streamlit Dashboard
│       ├── api/              # FastAPI server (POST /predict, GET /health)
│       ├── dashboard/        # Interactive Streamlit analytics dashboard
│       ├── models/           # Trained joblib models (Depression, Anxiety, Stress)
│       ├── data/             # Raw & processed DASS-42 datasets (39,775 respondents)
│       └── src/              # Feature engineering, preprocessing & inference pipelines
├── lib/
│   ├── api-spec/             # OpenAPI 3.0 Contract (`openapi.yaml`) & Orval codegen
│   ├── api-client-react/     # Auto-generated TanStack React Query client hooks
│   ├── api-zod/              # Auto-generated runtime Zod validation schemas
│   └── db/                   # Drizzle ORM schema & database configuration
├── scripts/
│   └── run_all.py            # Master Python service orchestrator (starts all 4 services)
├── start.bat                 # Windows one-click Batch launcher
├── start.ps1                 # Windows one-click PowerShell launcher
├── package.json              # Monorepo root scripts & dev tools
└── pnpm-workspace.yaml       # pnpm workspace definition
```

---

## 🚀 Quick Start (One-Click Launch)

### Option 1: One-Click Windows Script
Run in Command Prompt or PowerShell:
```bat
.\start.bat
```
or
```powershell
.\start.ps1
```

### Option 2: Python Orchestrator
```bash
python scripts/run_all.py
```

### Option 3: Individual npm/pnpm Scripts
```bash
# Install all monorepo dependencies
pnpm install

# Start all development servers
pnpm dev:all

# Or start individual components:
pnpm dev:web     # React App (port 5173)
pnpm dev:api     # Express REST API (port 5000)
pnpm dev:ml      # FastAPI ML Server (port 8000)
```

---

## 🌐 Live Ports & Service Endpoints

| Service | Port / URL | Description |
| :--- | :--- | :--- |
| **Main React 19 App** | [`http://localhost:5173`](http://localhost:5173) | Primary portal for patients, doctors, reception & admin |
| **Express API Server** | [`http://localhost:5000`](http://localhost:5000) | REST API for prescriptions, appointments, & proxy |
| **FastAPI ML Engine** | [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs) | Interactive Swagger UI for DASS-42 inference |
| **Streamlit ML Dashboard** | [`http://localhost:8501`](http://localhost:8501) | Deep exploratory data analysis & SHAP explanations |
| **Dark Showcase Portal** | `apps/static-portal/index.html` | Glassmorphism canvas neural brain portal |

---

## 🧠 DASS-42 Machine Learning Engine

The ML subsystem classifies severity across 3 psychiatric dimensions:
- **Depression**: Normal, Mild, Moderate, Severe, Extremely Severe
- **Anxiety**: Normal, Mild, Moderate, Severe, Extremely Severe
- **Stress**: Normal, Mild, Moderate, Severe, Extremely Severe

### Key Machine Learning Features:
1. **Leakage-Free Training**: Features use Big-Five personality traits (TIPI 1–10) and demographic markers to screen for risk *before* direct clinical assessment.
2. **Multi-Target Classification**: Separate optimized estimators for each target.
3. **Resilient Fallback**: The Express backend includes an in-process psychometric baseline so user assessment requests never fail even while Python services are starting up.

---

## 📋 Digital E-Prescription System

Doctors can create, sign, and issue structured digital prescriptions:
- **Dosage & Route**: E.g., `500 mg`, `Oral` / `Inhalation`
- **Schedule**: Frequency (e.g. `Twice daily`), duration, and specific instructions
- **Patient History**: Full patient prescription history linked to medical records
- **Downloadable Summary**: Exportable clinical records for patient portability

---

## 🛠️ Verification & Build Commands

```bash
# Typecheck entire monorepo (libs, apps, services)
pnpm run typecheck

# Re-generate React Query client & Zod schemas from openapi.yaml
pnpm run codegen

# Build production bundles
pnpm run build
```

---

## 📜 Medical Disclaimer
*The machine learning models and assessments in this platform are intended for educational and clinical research support. They do not constitute formal medical diagnoses. Always consult licensed medical professionals for clinical evaluations.*
