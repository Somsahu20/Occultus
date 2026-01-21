from fastapi import APIRouter, HTTPException, Depends, Response
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_500_INTERNAL_SERVER_ERROR, HTTP_404_NOT_FOUND, HTTP_409_CONFLICT
from DB.sessions import get_db
from Models.models import Vault, User
from schemas.schemas import VaultResponse, VaultSync, VaultClient
from Routes.auth import get_current_user
from utils.logger import logger
from sqlalchemy import Select, Delete
from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound
import base64
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

router = APIRouter()


@router.get('/vaults', response_model=VaultClient)
def get_vaults(u: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        stmt = Select(Vault).where(Vault.user_id == u.id)
        res = db.execute(stmt).scalar_one_or_none()

        if not res:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="No vault is there for the user")

        res.encrypted_data = base64.b64encode(res.encrypted_data).decode("utf-8")

        return res
        
    except HTTPException as he:
        logger.error(f"The user hasn\'t saved any password")
        raise he
    except Exception as err:
        logger.error(f"Error at get_all_vaults,{err}")
        raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail="Error in retrieving the vault")


@router.post('/vaults', response_model=VaultClient)
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
                new_secret.encrypted_data = base64.b64encode(new_secret.encrypted_data).decode("utf-8")
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
                res.encrypted_data = base64.b64encode(res.encrypted_data).decode("utf-8")
                return res

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as err:
        db.rollback()
        logger.error(f"Error in send_new_secrets")
        raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error, can\'t process the request")

@router.delete('/delete')
def delete_blob(response: Response, db: Session = Depends(get_db), u: User = Depends(get_current_user)):

    try:
        stmt = Delete(Vault).where(u.id == Vault.user_id)
        res = db.execute(stmt)
        
        if res.rowcount == 0:
            db.rollback()
            raise HTTPException(status_code=404, detail="Error at delete blob 1")

        db.commit()
        return Response(status_code=204)

    except Exception as err:
        db.rollback()
        raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail="Error at delete blob 2")





