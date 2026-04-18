import os
import subprocess
import sys
from pathlib import Path

from sqlalchemy import create_engine, inspect


def test_alembic_upgrade_head_creates_phase_2_tables(tmp_path: Path):
    database_url = f"sqlite+pysqlite:///{tmp_path / 'migration_test.db'}"
    env = os.environ.copy()
    env["DATABASE_URL"] = database_url
    env["JWT_SECRET_KEY"] = "test-secret"

    result = subprocess.run(
        [sys.executable, "-m", "alembic", "-c", "alembic.ini", "upgrade", "head"],
        cwd=Path(__file__).resolve().parents[1],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr

    engine = create_engine(database_url)
    tables = set(inspect(engine).get_table_names())

    assert {"users", "articles", "favorites", "analysis_logs", "alembic_version"} <= tables
