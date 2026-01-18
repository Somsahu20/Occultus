from fastapi import APIRouter, HTTPException, Depends
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_500_INTERNAL_SERVER_ERROR, HTTP_404_NOT_FOUND, HTTP_409_CONFLICT
from DB.sessions import get_db
from Models.models import Vault, User
from schemas.schemas import VaultResponse, VaultSync
from Routes.auth import get_current_user
from utils.logger import logger
from sqlalchemy import Select
from sqlalchemy.orm import Session
from typing import List
import base64

router = APIRouter()

@router.get('/vaults', response_model=VaultResponse)
def get_all_vaults(u: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        stmt = Select(Vault).where(Vault.user_id == u.id)
        res = db.execute(stmt).scalar_one_or_none()

        if not res:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="No vault is there for the user")

        return res
        
    except HTTPException as he:
        logger.error(f"The user hasn\'t saved any password")
        raise he
    except Exception as err:
        logger.error(f"Error at get_all_vaults,{err}")
        raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail="Error in retrieving the vault")


@router.post('/vault', response_model=VaultResponse)
def send_new_secrets(v: VaultSync, db: Session = Depends(get_db), u: User = Depends(get_current_user)):
    try:
        stmt = Select(Vault).where(Vault.user_id == u.id)
        res = db.execute(stmt).scalar_one_or_none()

        if res is None:
            if v.version == 1:
                v_dict = v.model_dump()
                
                v_dict.update({"user_id": u.id})
                v_dict["encrypted_data"] = base64.b64decode(v.encrypted_data)
                
                new_secret = Vault(**v_dict)
                db.add(new_secret)
                db.commit()
                db.refresh(new_secret)
                return new_secret
            else:
                raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Some other changes have happened, please try again")
        else:
            if res.version != v.version:
                raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Some other changes have happened, please try again")
            else:
                res.version = v.version + 1
                res.encrypted_data = base64.b64decode(v.encrypted_data)
                res.nonce_b64 = v.nonce_b64
                db.commit()

                return res

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as err:
        db.rollback()
        logger.error(f"Error in send_new_secrets")
        raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error, can\'t process the request")





