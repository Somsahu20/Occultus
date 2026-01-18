from sqlalchemy import BigInteger, TIMESTAMP, Text, text, ForeignKey, LargeBinary
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase, relationship
from datetime import datetime as dt

class Base(DeclarativeBase):
    pass

class User(Base):

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(nullable=False, unique=True, index=True) #! Enail
    salt_b64: Mapped[str] = mapped_column(nullable=False)
    hashed_key_a: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[dt] = mapped_column(TIMESTAMP(timezone=True),nullable=False, server_default=text('now()'))

    vault: Mapped["Vault"] = relationship("Vault", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Vault(Base):

    __tablename__ = "vaults"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    encrypted_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    nonce_b64: Mapped[str] = mapped_column(nullable=False)
    version: Mapped[int] = mapped_column(BigInteger, nullable=False, default=1)

    user: Mapped["User"] = relationship("User", back_populates="vault")