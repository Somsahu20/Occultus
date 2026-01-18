from fastapi import APIRouter, HTTPException, Depends, Response
from DB.sessions import get_db
from sqlalchemy import Select
from sqlalchemy.orm import Session
from schemas.schemas import UserSend, UserResponse, VaultCreate, ValutResponse, Token
import logging
from Models.models import User, Vault
from typing import List
from starlette.status import HTTP_404_NOT_FOUND, HTTP_409_CONFLICT
from Routes.auth import create_access_token, create_refresh_token
from sqlalchemy.exc import IntegrityError
from utils.logger import logger

router = APIRouter()


#todo
@router.get('/users', response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):

    try:
        stmt = Select(User)
        res = db.execute(stmt).scalars().all()

        return res

    except Exception as err:
        logger.error(f"The error is at get_all_users\n{err}")
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Can\'t process the request")

#todo find the id with username
@router.post('/users', response_model=Token)
def create_user(res: Response, user: UserSend, db: Session = Depends(get_db)):
    try:
        user_dict = user.model_dump()
        
        new_user = User(**user_dict)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        res.status_code = 201

        access_token = create_access_token(data={"sub": new_user.username})
        refresh_token = create_refresh_token(data={"sub": new_user.username})

        return {
            "access_token": access_token,
            "refesh_token": refresh_token,
            "token_type": "bearer"
        }


    except IntegrityError:
        db.rollback()
        logger.error("The user already exists")
        raise HTTPException(status_code=HTTP_409_CONFLICT, detail="User with this email already exists")
    
    except Exception as err:
        db.rollback()
        logger.error(f"Error at create_user\n{err}")
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail=f"Can\'t process the request\n{err}")
