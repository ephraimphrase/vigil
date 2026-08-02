from fastapi import APIRouter

from .ingest import router as ingest_router
from .score import router as score_router

router = APIRouter()
router.include_router(ingest_router)
router.include_router(score_router)
