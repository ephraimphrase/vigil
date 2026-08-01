import os

from dotenv import load_dotenv
from sqlmodel import create_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://vigil:vigil@localhost:5432/vigil")

engine = create_engine(DATABASE_URL)
