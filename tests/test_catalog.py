from __future__ import annotations

import json
from pathlib import Path

import pytest

from hacktoberfest_swag.catalog import CatalogError, rollover, validate_sources
from hacktoberfest_swag.links import LinkState, check_links, state_for_status, urls_from_files


def _write_project(root: Path) -> None:
    (root / ".git").mkdir()
    (root / "participants" / "2026").mkdir(parents=True)
    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "required": ["Name", "Website", "Swag", "Description", "Details"],
        "properties": {
            "Name": {"type": "string"},
            "Website": {"type": "string", "format": "uri"},
            "Swag": {"type": "array", "items": {"type": "string"}},
            "Description": {"type": "string"},
            "Details": {"type": "string", "format": "uri"},
        },
        "additionalProperties": False,
    }
    (root / ".jsonschema").write_text(json.dumps(schema), encoding="utf-8")


def test_valid_source_is_discovered(tmp_path: Path) -> None:
    _write_project(tmp_path)
    source = tmp_path / "participants" / "2026" / "example.yml"
    source.write_text(
        "Name: Example Community\n"
        "Website: https://example.com\n"
        "Swag: [shirt, stickers]\n"
        "Description: Make a useful contribution to the example project.\n"
        "Details: https://example.com/hacktoberfest\n",
        encoding="utf-8",
    )

    assert validate_sources(tmp_path, 2026) == [source]


def test_empty_current_season_is_valid(tmp_path: Path) -> None:
    _write_project(tmp_path)

    assert validate_sources(tmp_path, 2026) == []


def test_invalid_source_reports_the_file(tmp_path: Path) -> None:
    _write_project(tmp_path)
    source = tmp_path / "participants" / "2026" / "invalid.yml"
    source.write_text("Name: Incomplete\n", encoding="utf-8")

    with pytest.raises(CatalogError, match=r"participants[/\\]2026[/\\]invalid.yml"):
        validate_sources(tmp_path, 2026)


def test_rollover_removes_only_past_years(tmp_path: Path) -> None:
    _write_project(tmp_path)
    (tmp_path / "participants" / "2024").mkdir()
    (tmp_path / "participants" / "2025").mkdir()
    (tmp_path / "participants" / "notes").mkdir()
    (tmp_path / "participants" / "2027").mkdir()

    removed = rollover(tmp_path, 2026)

    assert [path.name for path in removed] == ["2024", "2025"]
    assert (tmp_path / "participants" / "2026" / ".gitkeep").exists()
    assert (tmp_path / "participants" / "2027").exists()
    assert (tmp_path / "participants" / "notes").exists()

    assert rollover(tmp_path, 2026) == []


def test_url_extraction_includes_description_links(tmp_path: Path) -> None:
    path = tmp_path / "entry.yml"
    path.write_text(
        "Name: Example\n"
        "Website: https://example.com\n"
        "Swag: [stickers]\n"
        "Description: Read https://example.com/rules before contributing.\n"
        "Details: https://example.com/details\n",
        encoding="utf-8",
    )

    assert urls_from_files([path]) == [
        "https://example.com",
        "https://example.com/details",
        "https://example.com/rules",
    ]


@pytest.mark.parametrize(
    ("status", "expected"),
    [
        (206, LinkState.OK),
        (403, LinkState.WARNING),
        (404, LinkState.BROKEN),
        (410, LinkState.BROKEN),
        (429, LinkState.WARNING),
        (500, None),
    ],
)
def test_link_status_classification(status: int, expected: LinkState | None) -> None:
    assert state_for_status(status) == expected


def test_link_checker_requires_an_attempt() -> None:
    with pytest.raises(ValueError, match="at least 1"):
        check_links([], attempts=0)
