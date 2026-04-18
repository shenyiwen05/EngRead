from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError, ProgrammingError

from app import models  # noqa: F401
from app.database import SessionLocal
from app.routers import articles, auth, favorites
from app.services.article_service import seed_sample_article

def initialize_database() -> None:
    with SessionLocal() as db:
        try:
            seed_sample_article(db)
        except (OperationalError, ProgrammingError) as exc:
            raise RuntimeError(
                "Database tables are missing. Run `python -m alembic -c alembic.ini upgrade head` before starting the API."
            ) from exc


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    initialize_database()
    yield


app = FastAPI(title="Context Reader API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(articles.router)
app.include_router(favorites.router)


@app.get("/health")
def health():
    return {"status": "ok"}
