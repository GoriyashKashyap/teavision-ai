"""
TeaVision AI — FastAPI Backend
Entry point. Loads configuration, sets up middleware, mounts routers.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.ml.model import model_manager
from app.api.routes import health, predict, model_info, feedback, history, observations, analytics, assistant, diagnose


setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the ML model once at startup; release on shutdown."""
    import logging
    logger = logging.getLogger("teavision")

    logger.info("TeaVision AI backend starting …")
    try:
        model_manager.load()
        logger.info(f"Model loaded: {model_manager.version}")
    except FileNotFoundError as exc:
        logger.error(f"Model artifact not found: {exc}")
        logger.warning(
            "Inference endpoints will return 503 until a valid model is placed at: "
            f"{settings.MODEL_PATH}"
        )
    except Exception as exc:
        logger.error(f"Failed to load model: {exc}", exc_info=True)

    yield

    logger.info("TeaVision AI backend shutting down.")


app = FastAPI(
    title="TeaVision AI",
    description="AI-powered tea leaf disease detection API.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ---- CORS ----------------------------------------------------------------
_origins = settings.ALLOWED_ORIGINS_LIST
_allow_all = "*" in _origins

if _allow_all:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_origins,
        allow_origin_regex=r"^https://.*\.vercel\.app$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ---- Routers -------------------------------------------------------------
app.include_router(health.router)
app.include_router(predict.router,      prefix="/api/v1")
app.include_router(model_info.router,   prefix="/api/v1")
app.include_router(feedback.router,     prefix="/api/v1")
app.include_router(history.router,      prefix="/api/v1")
app.include_router(observations.router,      prefix="/api/v1")
app.include_router(analytics.router,         prefix="/api/v1")
app.include_router(diagnose.router,          prefix="/api/v1")
app.include_router(assistant.router,    prefix="/api/v1")
