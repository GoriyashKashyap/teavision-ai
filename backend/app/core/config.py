"""Application configuration via environment variables."""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Server ---
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # --- CORS — comma-separated string in .env, parsed into list at runtime ---
    # e.g. ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
    ALLOWED_ORIGINS_STR: str = (
        "http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173"
    )

    @property
    def ALLOWED_ORIGINS(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS_STR.split(",") if o.strip()]

    # --- ML Model ---
    MODEL_PATH: Path = Path("models/lightteanet_eca_mobilevit_xxs_kd_torchscript.pt")
    MODEL_VERSION: str = "lightteanet-eca-v1"

    # --- Upload limits ---
    MAX_UPLOAD_SIZE_MB: int = 10

    # --- Supabase (optional for Phase 1) ---
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""


settings = Settings()
