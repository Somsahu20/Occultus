from fastapi import FastAPI, HTTPException, Depends
from contextlib import asynccontextmanager
from DB.sessions import get_db
from sqlalchemy.orm import Session
from Routes import users, auth, vaults
import redis.asyncio as redis
from fastapi_limiter import FastAPILimiter
import os
from fastapi.middleware.cors import CORSMiddleware

cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
origins = [origin.strip() for origin in cors_origins_str.split(",")]

app = FastAPI()
app.add_middleware(
    CORSMiddleware, 
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.get('/')
def start_function():
    return {"message": "success"}

@app.get('/database')
def check_db(db: Session = Depends(get_db)):
    return {"success": "Connected successfully"}

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(vaults.router)