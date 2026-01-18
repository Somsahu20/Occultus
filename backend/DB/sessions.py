from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import psycopg2
from config.configs import settings

DATABASE_URL = f"postgresql://{settings.db_user}:{settings.password}@{settings.db_host}/{settings.db_name}"

engine = create_engine(url=DATABASE_URL, echo=True)
sessionmaker = sessionmaker(bind=engine, autoflush=False, expire_on_commit=True)

def get_db():
    db = sessionmaker()
    try:
        yield db
    finally:
        db.close()
