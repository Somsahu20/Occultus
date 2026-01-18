from fastapi import FastAPI, HTTPException, Depends
from DB.sessions import get_db
from sqlalchemy.orm import Session
from Routes import users, auth


app = FastAPI()

@app.get('/')
def start_function():
    return {"message": "success"}

@app.get('/database')
def check_db(db: Session = Depends(get_db)):
    return {"success": "Connected successfully"}

app.include_router(users.router)
app.include_router(auth.router)