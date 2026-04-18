from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    email: str
    password: str
    nickname: str | None = None
    invite_code: str | None = Field(default=None, validation_alias="inviteCode")


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    nickname: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str = Field(serialization_alias="accessToken")
    user: UserResponse
