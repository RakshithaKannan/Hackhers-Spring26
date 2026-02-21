from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    language: str = "en"


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    language: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    language: str

    class Config:
        from_attributes = True
