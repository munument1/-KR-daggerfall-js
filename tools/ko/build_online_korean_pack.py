#!/usr/bin/env python3
"""Build a Daggerfall Online Korean translation pack from the DFU Korean patch.

Requires Python 3.10+. Only uses the standard library.
Examples:
  python tools/ko/build_online_korean_pack.py --dfu-path ../-KR-Daggerfall_Unity
  python tools/ko/build_online_korean_pack.py --dfu-path Daggerfall_Unity_Korean.zip
"""
from __future__ import annotations

import argparse
import csv
import io
import os
from pathlib import Path
import re
import sys
import zipfile

REPO_ROOT = Path(__file__).resolve().parents[2]
PORT_CSV = REPO_ROOT / "locales" / "ko" / "Port_Strings.csv"
ENGLISH_CSV = REPO_ROOT / "locales" / "en" / "Port_Strings.csv"
DEFAULT_OUTPUT = Path("Daggerfall_Online_Korean_Combined.zip")


def classify(path: str) -> tuple[str, str] | None:
    """Mirror translationPacks.js: last Text/Fonts folder wins, by kind/name."""
    parts = [p for p in path.replace("\\", "/").split("/") if p and p != "."]
    index = next((i for i in range(len(parts) - 2, -1, -1)
                  if parts[i].lower() in ("text", "fonts")), -1)
    if index < 0:
        return None
    folder = parts[index].lower()
    rest = parts[index + 1:]
    if not rest:
        return None
    name = rest[-1]
    if folder == "fonts":
        if len(rest) != 1 or not re.fullmatch(r"FONT000[0-4]-SDF\.(?:ttf|otf|txt)", name, re.I):
            return None
        return ("font", "Fonts/" + name)
    if len(rest) == 2 and rest[0].lower() in ("quests", "books"):
        if not re.fullmatch(r".+-LOC\.txt", name, re.I):
            return None
        category = "quest" if rest[0].lower() == "quests" else "book"
        return (category, f"Text/{'Quests' if category == 'quest' else 'Books'}/{name}")
    if len(rest) == 1 and re.fullmatch(r"[A-Za-z0-9_]+\.(?:csv|txt)", name, re.I):
        return ("table", "Text/" + name)
    return None


def source_files(path: Path):
    if path.is_file() and path.suffix.lower() == ".zip":
        with zipfile.ZipFile(path) as package:
            for info in package.infolist():
                if not info.is_dir() and classify(info.filename):
                    yield info.filename, package.read(info)
    elif path.is_dir():
        for base, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if d not in (".git", "__pycache__")]
            for filename in sorted(files):
                full = Path(base) / filename
                relative = str(full.relative_to(path)).replace(os.sep, "/")
                if classify(relative):
                    yield relative, full.read_bytes()
    else:
        raise ValueError("--dfu-path must be a directory or .zip file")


def read_csv_rows(data: bytes) -> dict[str, str]:
    with io.StringIO(data.decode("utf-8-sig"), newline="") as stream:
        reader = csv.reader(stream)
        if next(reader, None) != ["Key", "Value"]:
            raise ValueError("CSV must begin with Key,Value")
        rows = {}
        for row in reader:
            if len(row) != 2:
                raise ValueError(f"Invalid CSV row: {row[:2]}")
            if row[0] in rows:
                raise ValueError(f"Duplicate CSV key: {row[0]}")
            rows[row[0]] = row[1]
        return rows


def build(dfu_path: Path, output: Path):
    if output.exists():
        raise FileExistsError(f"Refusing to overwrite existing archive: {output}")
    if not PORT_CSV.exists() or not ENGLISH_CSV.exists():
        raise FileNotFoundError("Run this tool from a checkout containing locales/ko and locales/en")
    ko = PORT_CSV.read_bytes()
    en_rows = read_csv_rows(ENGLISH_CSV.read_bytes())
    ko_rows = read_csv_rows(ko)
    missing = sorted(set(en_rows) - set(ko_rows))
    extra = sorted(set(ko_rows) - set(en_rows))
    if missing or extra:
        raise ValueError(f"Port_Strings keys differ from English: missing={len(missing)} extra={len(extra)}")

    selected = {}
    counts = {"table": 0, "quest": 0, "book": 0, "font": 0}
    for path, data in source_files(dfu_path):
        kind, final_name = classify(path)
        selected[final_name.lower()] = (final_name, data, kind)

    selected["text/port_strings.csv"] = ("Text/Port_Strings.csv", ko, "table")
    for _, _, kind in selected.values():
        counts[kind] += 1
    if not counts["quest"] or not counts["book"] or counts["table"] < 10:
        raise ValueError(f"Unexpected source coverage; refusing incomplete package: {counts}")

    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=8) as package:
        for _, (name, data, _) in sorted(selected.items()):
            package.writestr(name, data)
        package.writestr("README_Online_Korean.txt",
            "Daggerfall Online Korean combined translation pack.\n"
            "Source: munument1/-KR-Daggerfall_Unity and munument1/-KR-daggerfall-js.\n"
            "Install under Settings > Interface > Language: Korean > Translation pack.\n"
            "Only DFU-compatible Text/Fonts and online-specific Port_Strings are included.\n"
            "DFU BIOGs, textures and videos are not supported by this importer.\n")
    print(f"Created: {output.resolve()}")
    print(f"Contents: {counts}; online UI keys: {len(ko_rows)}")
    print("Note: hard-coded English strings in DFO still require upstream localization routing.")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--dfu-path", required=True, type=Path, help="DFU Korean patch folder or zip")
    p.add_argument("--output", default=DEFAULT_OUTPUT, type=Path, help="New output zip (must not exist)")
    args = p.parse_args()
    try:
        build(args.dfu_path, args.output)
    except (OSError, ValueError, zipfile.BadZipFile) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
