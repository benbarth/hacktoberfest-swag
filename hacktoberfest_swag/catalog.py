from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator, FormatChecker

YEAR_DIRECTORY = re.compile(r"^\d{4}$")
class CatalogError(RuntimeError):
    """Raised when participant source data cannot produce a valid catalog."""


def repository_root(start: Path | None = None) -> Path:
    candidate = (start or Path.cwd()).resolve()
    for path in (candidate, *candidate.parents):
        if (path / ".git").exists() and (path / "participants").is_dir():
            return path
    raise CatalogError("Could not locate the repository root.")


def _read_yaml(path: Path) -> dict[str, Any]:
    try:
        parsed = yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as error:
        raise CatalogError(f"Unable to read {path}: {error}") from error

    if not isinstance(parsed, dict):
        raise CatalogError(f"{path} must contain one YAML mapping.")
    return parsed


def _load_schema(root: Path) -> dict[str, Any]:
    try:
        schema = json.loads((root / ".jsonschema").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise CatalogError(f"Unable to load .jsonschema: {error}") from error
    return schema


def participant_files(root: Path, season: int) -> list[Path]:
    season_directory = root / "participants" / str(season)
    files: list[Path] = []
    if season_directory.is_dir():
        files.extend(sorted(season_directory.glob("*.yml"), key=lambda path: path.name.casefold()))
    return files


def validate_sources(root: Path, season: int) -> list[Path]:
    files = participant_files(root, season)
    validator = Draft202012Validator(_load_schema(root), format_checker=FormatChecker())
    messages: list[str] = []
    for path in files:
        errors = sorted(
            validator.iter_errors(_read_yaml(path)),
            key=lambda item: list(item.path),
        )
        for error in errors:
            location = ".".join(str(part) for part in error.path) or "document"
            messages.append(f"{path.relative_to(root)}:{location}: {error.message}")

    if messages:
        raise CatalogError("Participant validation failed:\n" + "\n".join(messages))
    return files


def rollover(root: Path, season: int) -> list[Path]:
    if not 2000 <= season <= 2100:
        raise CatalogError(f"Refusing implausible season year: {season}")

    participants = root / "participants"
    removed: list[Path] = []
    for path in participants.iterdir():
        if not path.is_dir() or not YEAR_DIRECTORY.fullmatch(path.name):
            continue
        if int(path.name) < season:
            shutil.rmtree(path)
            removed.append(path)

    current = participants / str(season)
    current.mkdir(parents=True, exist_ok=True)
    (current / ".gitkeep").touch()
    return sorted(removed)
