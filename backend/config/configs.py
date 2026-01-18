from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"

class Settings(BaseSettings):
    db_port: int
    db_user: str
    password: str
    db_host: str
    db_name: str
    secret_key: str
    algorithm: str
    expire_minutes: int

    model_config = SettingsConfigDict(env_file=str(ENV_PATH), case_sensitive=False, env_file_encoding="utf-8")

settings = Settings()

# print(str(ENV_PATH))