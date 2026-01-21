from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime as dt

class UserBase(BaseModel):
    username: EmailStr

class UserSend(UserBase):
    salt_b64: str
    hashed_key_a: str

class UserCreate(UserSend):
    pass


class UserLogin(BaseModel):
    username: EmailStr
    hashed_key_a: str
    

class UserResponse(UserBase):
    id: int
    created_at: dt
    model_config = ConfigDict(from_attributes=True)

class VaultCreate(BaseModel):
    encrypted_data: str 
    nonce_b64: str

class VaultSync(VaultCreate):
    version: int

class VaultResponse(BaseModel):
    id: int
    encrypted_data: bytes
    nonce_b64: str
    version: int
    model_config = ConfigDict(from_attributes=True)

class VaultClient(BaseModel):
    id: int
    encrypted_data: str
    nonce_b64: str
    version: int
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str









