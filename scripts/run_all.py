"""
MediGrid Unified Care Platform - Master Service Orchestrator
Starts and manages:
  1. Python FastAPI DASS-42 ML Inference Engine (Port 8000)
  2. Python Streamlit Machine Learning Dashboard (Port 8501)
  3. Node.js Express 5 REST API Server (Port 5000)
  4. Vite React 19 Frontend Web Application (Port 5173)
"""

import os
import sys
import subprocess
import time
import signal

# Ensure utf-8 encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVICES_DIR = os.path.join(ROOT_DIR, "services")
APPS_DIR = os.path.join(ROOT_DIR, "apps")

processes = []

def cleanup(signum=None, frame=None):
    print("\n[MediGrid] Shutting down all services...")
    for p in processes:
        try:
            p.terminate()
        except Exception:
            pass
    sys.exit(0)

def main():
    print("=" * 65)
    print("      MediGrid - Unified Healthcare & ML Intelligence Platform   ")
    print("=" * 65)
    print(f"[*] Root Directory: {ROOT_DIR}")

    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    common_env = {**os.environ, "PYTHONIOENCODING": "utf-8"}

    # 1. FastAPI ML Engine
    ml_dir = os.path.join(SERVICES_DIR, "ml-service")
    print("\n[1/4] Starting DASS-42 FastAPI ML Service on http://127.0.0.1:8000 ...")
    p_ml = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=ml_dir,
        env={**common_env, "PYTHONPATH": ml_dir}
    )
    processes.append(p_ml)

    # 2. Streamlit ML Dashboard
    print("[2/4] Starting Streamlit ML Analytics Dashboard on http://127.0.0.1:8501 ...")
    p_streamlit = subprocess.Popen(
        [sys.executable, "-m", "streamlit", "run", "dashboard/app.py", "--server.port", "8501", "--server.headless", "true", "--server.address", "0.0.0.0"],
        cwd=ml_dir,
        env={**common_env, "PYTHONPATH": ml_dir}
    )
    processes.append(p_streamlit)

    # 3. Express API Server
    api_dir = os.path.join(SERVICES_DIR, "api-server")
    print("[3/4] Starting Express REST API Server on http://localhost:5000 ...")
    p_api = subprocess.Popen(
        ["pnpm", "run", "dev"],
        cwd=api_dir,
        shell=True,
        env={**common_env, "PORT": "5000", "ML_API_URL": "http://127.0.0.1:8000"}
    )
    processes.append(p_api)

    # 4. Vite React App
    web_dir = os.path.join(APPS_DIR, "medigrid-app")
    print("[4/4] Starting Vite React App on http://localhost:5173 ...")
    p_web = subprocess.Popen(
        ["pnpm", "run", "dev"],
        cwd=web_dir,
        shell=True,
        env={**common_env, "PORT": "5173"}
    )
    processes.append(p_web)

    print("\n" + "=" * 65)
    print(">> All MediGrid Services are LIVE and RUNNING:")
    print("   * Main React Web App:       http://localhost:5173")
    print("   * Streamlit ML Dashboard:   http://localhost:8501")
    print("   * FastAPI ML Docs:          http://127.0.0.1:8000/docs")
    print("   * Express REST API:         http://localhost:5000/api/healthz")
    print("   * Dark Glassmorphic Portal: http://localhost:5173/apps/static-portal/index.html")
    print("=" * 65)
    print("\nPress Ctrl+C to stop all services.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
