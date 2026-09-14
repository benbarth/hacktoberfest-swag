from __future__ import annotations

import re
import time
from collections.abc import Iterable
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path

import httpx
import yaml

URL_PATTERN = re.compile(r"https?://[^\s)>\]}]+")
DEFINITELY_BROKEN = {404, 410}
INDETERMINATE = {401, 403, 408, 425, 429}


class LinkState(StrEnum):
    OK = "ok"
    BROKEN = "broken"
    WARNING = "warning"


@dataclass(frozen=True, slots=True)
class LinkResult:
    url: str
    state: LinkState
    detail: str


def state_for_status(status: int) -> LinkState | None:
    if status in DEFINITELY_BROKEN:
        return LinkState.BROKEN
    if status < 400:
        return LinkState.OK
    if status in INDETERMINATE:
        return LinkState.WARNING
    return None


def urls_from_files(paths: Iterable[Path]) -> list[str]:
    urls: set[str] = set()
    for path in paths:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            continue
        for field in ("Website", "Details"):
            value = data.get(field)
            if isinstance(value, str) and value.startswith(("http://", "https://")):
                urls.add(value.strip())
        description = data.get("Description", "")
        if isinstance(description, str):
            urls.update(match.rstrip(".,;:'\"") for match in URL_PATTERN.findall(description))
    return sorted(urls)


def _check_one(url: str, attempts: int, timeout: float) -> LinkResult:
    headers = {
        "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Range": "bytes=0-65535",
        "User-Agent": "hacktoberfest-swag-link-checker/1.0 (+https://hacktoberfest-swag.com)",
    }
    last_detail = "request did not run"
    last_state = LinkState.WARNING
    with httpx.Client(follow_redirects=True, timeout=timeout, headers=headers) as client:
        for attempt in range(attempts):
            try:
                with client.stream("GET", url) as response:
                    status = response.status_code
                state = state_for_status(status)
                if state == LinkState.OK:
                    return LinkResult(url, LinkState.OK, f"HTTP {status}")
                last_state = state or LinkState.WARNING
                last_detail = f"HTTP {status}"
                if state == LinkState.WARNING:
                    last_detail += "; endpoint may block bots"
            except httpx.HTTPError as error:
                last_state = LinkState.WARNING
                last_detail = f"{type(error).__name__}: {error}"

            if attempt + 1 < attempts:
                time.sleep(2**attempt)

    return LinkResult(url, last_state, f"{last_detail} after {attempts} attempts")


def check_links(
    urls: Iterable[str], *, attempts: int = 3, timeout: float = 15.0, workers: int = 6
) -> list[LinkResult]:
    if attempts < 1:
        raise ValueError("attempts must be at least 1")
    unique_urls = sorted(set(urls))
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(_check_one, url, attempts, timeout): url for url in unique_urls
        }
        results = [future.result() for future in as_completed(futures)]
    return sorted(results, key=lambda result: result.url)
