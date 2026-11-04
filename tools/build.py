#!/usr/bin/env python3
"""Baut aus den Modulen (index.html + css/ + js/) wieder eine einzelne HTML-Datei.

Gegenstueck zu tools/split.py – z. B. um die App als eine Datei weiterzugeben.
Aufruf:  python3 tools/build.py [Ausgabedatei]
Default: dist/Physik-Abenteuer-8-Lehrkraft.html (liegt in .gitignore)

Verifiziert sich selbst: die erzeugte Datei wird erneut geparst und jeder
Skript-Block / Style-Block byte-ident mit der jeweiligen Quelldatei verglichen.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "Physik-Abenteuer-8-Lehrkraft.html"


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


html = INDEX.read_text(encoding="utf-8")

m = re.search(r'<link rel="stylesheet" href="([^"]+)">', html)
if not m:
    sys.exit("Fehler: kein <link rel=\"stylesheet\"> in index.html gefunden")
css_src = m.group(1)
html = html.replace(m.group(0), "<style>" + read(css_src) + "</style>")

srcs = re.findall(r'<script src="([^"]+)"></script>', html)
if not srcs:
    sys.exit("Fehler: keine <script src> Tags in index.html gefunden")
for rel in srcs:
    content = read(rel)
    # einzeilige Dateien auf einer Zeile lassen, mehrzeilige mit </script> auf eigener Zeile
    html = html.replace(f'<script src="{rel}"></script>',
                        "<script>" + content + "</script>" if "\n" not in content else "<script>" + content + "\n</script>")

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(html, encoding="utf-8")

# ---------- Selbst-Verifikation ----------
built = OUT.read_text(encoding="utf-8")
errors = []

sm = re.search(r"<style>(.*?)</style>", built, re.DOTALL)
if not sm or sm.group(1) != read(css_src):
    errors.append("CSS im Build weicht von css/" + css_src + " ab")

lines = built.split("\n")
blocks = []
i = 0
while i < len(lines):
    if lines[i].startswith("<script>"):
        if lines[i].endswith("</script>"):
            blocks.append(lines[i][len("<script>"):-len("</script>")])
            i += 1
        else:
            content = lines[i][len("<script>"):]
            j = i + 1
            while j < len(lines) and lines[j] != "</script>":
                j += 1
            if j >= len(lines):
                errors.append(f"unge prueftes <script> ab Zeile {i + 1}")
                break
            blocks.append(content + "\n" + "\n".join(lines[i + 1:j]))
            i = j + 1
    else:
        i += 1

if len(blocks) != len(srcs):
    errors.append(f"Build enthaelt {len(blocks)} Skript-Bloecke, erwartet {len(srcs)}")
else:
    for rel, block in zip(srcs, blocks):
        if block != read(rel):
            errors.append(f"Block weicht ab: {rel}")

if errors:
    print("BUILD FEHLGESCHLAGEN:")
    for e in errors:
        print(" -", e)
    sys.exit(1)

print(f"OK: {OUT} ({OUT.stat().st_size} bytes) – {len(blocks)} Skript-Bloecke + CSS byte-ident zu den Modulen")
