"""Launch the DASS dashboard with one command.

Run from the project root:
    python scripts/run_app.py

Models are created only for targets whose artifact is missing. Existing model
files are reused on later launches.
"""
import logging
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


def train_missing_models() -> None:
    """Create lightweight API-compatible models only when an artifact is absent."""
    missing = [
        target for target in config.TARGETS
        if not (config.MODELS_DIR / f"best_model_{target}.joblib").exists()
    ]
    if not missing:
        logger.info("All model artifacts found. Reusing saved models; no training needed.")
        return

    logger.info("Missing model artifacts: %s", ", ".join(missing))
    logger.info("Training missing targets once with the metadata-only baseline...")

    import joblib
    from sklearn.linear_model import LogisticRegression
    from src import data_loader, feature_engineering, preprocessing, scoring

    df = data_loader.load_raw()
    df = preprocessing.run_cleaning_pipeline(df)
    df = scoring.add_severity_labels(df)

    for target in missing:
        features = feature_engineering.build_features(df, target)
        labels = feature_engineering.get_target(df, target)
        model = LogisticRegression(
            max_iter=500,
            class_weight="balanced",
            solver="lbfgs",
            n_jobs=-1,
        )
        model.fit(features, labels)
        artifact = {
            "model": model,
            "feature_names": list(features.columns),
            "target": target,
            "model_name": "LogisticRegression (baseline)",
            "feature_mode": config.FEATURE_MODE,
        }
        path = config.MODELS_DIR / f"best_model_{target}.joblib"
        joblib.dump(artifact, path)
        logger.info("Saved %s", path)


def launch_services() -> None:
    """Start the API and dashboard, and stop both when this launcher exits."""
    api = subprocess.Popen([
        sys.executable, "-m", "uvicorn", "api.main:app",
        "--host", "127.0.0.1", "--port", "8000",
    ], cwd=ROOT_DIR)
    dashboard = subprocess.Popen([
        sys.executable, "-m", "streamlit", "run", "dashboard/app.py",
        "--server.headless", "true", "--server.port", "8501",
    ], cwd=ROOT_DIR)
    logger.info("API: http://localhost:8000")
    logger.info("Dashboard: http://localhost:8501")

    try:
        api.wait()
    except KeyboardInterrupt:
        logger.info("Stopping services...")
    finally:
        for process in (api, dashboard):
            if process.poll() is None:
                process.terminate()
        for process in (api, dashboard):
            process.wait()


if __name__ == "__main__":
    train_missing_models()
    launch_services()
