from fastapi import APIRouter, HTTPException, Depends, Response
from starlette.status import HTTP_403_FORBIDDEN, HTTP_500_INTERNAL_SERVER_ERROR, HTTP_401_UNAUTHORIZED
from jose import jwt
from jose.exceptions import JWTError
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from dotenv import load_dotenv
import os
load_dotenv()
from schemas.schemas import Token, UserBase, UserLogin
import secrets, base64
from argon2.low_level import hash_secret_raw, Type
from DB.sessions import get_db
from sqlalchemy.orm import Session
from sqlalchemy import Select
from Models.models import User
from utils.logger import logger
import secrets, base64
from typing import Union, Any
from datetime import datetime, timedelta, timezone

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("EXPIRE_MINUTES")) #! converting it into int just in case if it is stored as string
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

router = APIRouter()
oauth2 = OAuth2PasswordBearer(tokenUrl="token")

class TokenData(BaseModel):
    username: str | None = None

#!---------------Must be put in frontend later on ------------------------------
def make_hashed_password(entered_password: str, salt_b64: str) -> str:

    actual_salt = base64.b64decode(salt_b64)

    master_pass = entered_password.encode("utf-8")
    mastered_raw = hash_secret_raw(
        secret=master_pass,
        salt=actual_salt,
        time_cost=2,
        memory_cost=65536,
        parallelism=1,
        hash_len=64,
        type=Type.ID  
    )

    raw_a = mastered_raw[:32]
    entered_key_a = base64.b64encode(raw_a).decode('utf-8')

    return entered_key_a


#!--------------------------------------------------------------------------------------

@router.post('/auth/salt')
def check_salt(u: UserBase, db: Session = Depends(get_db)):

    try: 
        stmt = Select(User).where(User.username == u.username)
        res = db.execute(stmt).scalar_one_or_none()

        if res:
            return{"salt" : res.salt_b64}
        else:
            salt = secrets.token_bytes(16)
            salt_b64 = base64.b64encode(salt).decode("utf-8")
            return {"salt" : salt_b64}


    except Exception as err:
        logger.error(f"There is error in check_salt function, {err}")
        raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail='Error in the server')

def create_access_token(data: dict, expires_delta: int = None):
    plain_data = data.copy()

    if expires_delta is None:
        expires_delta = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    else:
        expires_delta = datetime.now(timezone.utc) + expires_delta

    plain_data.update({"exp": expires_delta, "type": "access"})
    encoded_jwt = jwt.encode(plain_data, SECRET_KEY, ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: int = None):

    plain_data = data.copy()

    if expires_delta is None:
        expires_delta = datetime.now(timezone.utc) + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    else:
        expires_delta = datetime.now(timezone.utc) + expires_delta

    plain_data.update({"exp": expires_delta, "type": "refresh"})
    encoded_jwt = jwt.encode(plain_data, SECRET_KEY, ALGORITHM)
    return encoded_jwt


def verify_token(token: str, credential_exception):
    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        payload_name = payload.get("sub")

        if not payload_name:
            raise  HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail='No token exists with this id')

        token_data = TokenData(username=payload_name)
        return token_data


    except JWTError:
        raise credential_exception


def get_current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)):
    credential_exception = HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail='Invalid credential detail', headers={"WWW-Authenticate": "Bearer"})

    t = verify_token(token=token, credential_exception=credential_exception)
    if not t:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail='Invalid token')

    stmt = Select(User).where(User.username == t.username)
    res = db.execute(stmt).scalar_one_or_none()

    if not res:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail='Not authorized to access the resource')

    return res

@router.post('/token', response_model=Token)
def func_login(u: UserLogin, db: Session = Depends(get_db)): #! This userlogin model will be received from frontend since all the hashing of key_a will be done on client side. UserLogin needs mail, hashed key
    try:
        stmt = Select(User).where(User.username == u.username)
        res = db.execute(stmt).scalar_one_or_none()
        
        if res:
            if secrets.compare_digest(res.hashed_key_a, u.hashed_key_a): #? res.hashed_key_a == u.hashed_key_a: Hacker can judge the latency to see where it find the mismatch. cmpare_digest takes same time whether the password is same or not

                access_token = create_access_token(data={"sub": res.username})
                refresh_token = create_refresh_token(data={"sub": res.username})

                return {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer"
                }
            else:
                raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail='Wrong username or password')
        else:
            raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail='Wrong username or password')
    except HTTPException as he:
        raise he
    except Exception as err:
        logger.error(f"Error in func_login,{err}")
        raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail='Error in logging in')




