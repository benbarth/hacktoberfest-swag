from __future__ import annotations

import argparse
import datetime as dt
import os
import subprocess
import sys
from pathlib import Path

from .catalog import CatalogError, repository_root, rollover, validate_sources
from .links import LinkState, check_links, urls_from_files


def _season(value: str) -> int:
    year = int(value)
    if not 2000 <= year <= 2100:
        raise argparse.ArgumentTypeError("season must be between 2000 and 2100")
    return year


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Maintain Hacktoberfest Swag source data.")
    parser.add_argument("--root", type=Path, help="Repository root (auto-detected by default).")
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate_parser = subparsers.add_parser("validate")
    validate_parser.add_argument("--season", type=_season, default=dt.datetime.now(dt.UTC).year)

    rollover_parser = subparsers.add_parser("rollover")
    rollover_parser.add_argument("--season", type=_season, default=dt.datetime.now(dt.UTC).year)

    links_parser = subparsers.add_parser("links")
    links_parser.add_argument("paths", nargs="*", type=Path)
    links_parser.add_argument("--season", type=_season, default=dt.datetime.now(dt.UTC).year)
    links_parser.add_argument("--changed-since")
    return parser


def _changed_yaml(root: Path, base: str) -> list[Path]:
    process = subprocess.run(
        [
            "git",
            "diff",
            "--diff-filter=ACMR",
            "--name-only",
            f"{base}...HEAD",
            "--",
            "participants/**/*.yml",
        ],
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
    )
    return [root / line for line in process.stdout.splitlines() if line]


def _run(args: argparse.Namespace, root: Path) -> int:
    if args.command == "validate":
        files = validate_sources(root, args.season)
        print(f"Validated {len(files)} participant file(s) for {args.season}.")
        return 0

    if args.command == "rollover":
        removed = rollover(root, args.season)
        names = ", ".join(path.name for path in removed) or "none"
        print(f"Prepared season {args.season}; removed year directories: {names}.")
        return 0

    if args.command == "links":
        if args.changed_since:
            paths = _changed_yaml(root, args.changed_since)
        elif args.paths:
            paths = [path if path.is_absolute() else root / path for path in args.paths]
        else:
            paths = sorted((root / "participants" / str(args.season)).glob("*.yml"))

        paths = [path for path in paths if path.is_file()]
        if not paths:
            print("No participant files require link checking.")
            return 0

        results = check_links(urls_from_files(paths))
        broken = [result for result in results if result.state == LinkState.BROKEN]
        for result in results:
            prefix = {LinkState.OK: "OK", LinkState.WARNING: "WARN", LinkState.BROKEN: "FAIL"}[
                result.state
            ]
            print(f"{prefix:4} {result.url} ({result.detail})")
            if os.getenv("GITHUB_ACTIONS") == "true" and result.state != LinkState.OK:
                level = "error" if result.state == LinkState.BROKEN else "warning"
                print(f"::{level} title=Link check::{result.url}: {result.detail}")
        return 1 if broken else 0

    raise AssertionError(f"Unhandled command: {args.command}")


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        root = args.root.resolve() if args.root else repository_root()
        return _run(args, root)
    except (CatalogError, OSError, subprocess.CalledProcessError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
