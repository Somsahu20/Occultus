from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import psycopg2
from config.configs import settings

DATABASE_URL = settings.database_url

engine = create_engine(url=DATABASE_URL, echo=True)
sessionmaker = sessionmaker(bind=engine, autoflush=False, expire_on_commit=True)

def get_db():
    db = sessionmaker()
    try:
        yield db
    finally:
        db.close()
