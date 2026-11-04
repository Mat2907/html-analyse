#!/usr/bin/env python3
"""Verify the split is content-preserving: re-parse the original monolith and
compare every script block / style block against the extracted files, and
check index.html references them in the original order."""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "Physik-Abenteuer-8-Lehrkraft.html"
text = SRC.read_text(encoding="utf-8")
lines = text.split("\n")

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
            while lines[j] != "</script>":
                j += 1
            blocks.append(content + "\n" + "\n".join(lines[i + 1:j]))
            i = j + 1
    else:
        i += 1

pre = "\n".join(lines[:lines.index(next(l for l in lines if l.startswith("<script>")))])
head_end = pre.index("</head>")
head = pre[:head_end]
styles = list(re.finditer(r"<style>(.*?)</style>", head, re.DOTALL))
expected_css = styles[0].group(1) + "\n" + styles[1].group(1) + "\n"

errors = []

css_on_disk = (ROOT / "css" / "style.css").read_text(encoding="utf-8")
if css_on_disk != expected_css:
    errors.append("css/style.css differs from original style blocks")

index = (ROOT / "index.html").read_text(encoding="utf-8")
srcs = re.findall(r'<script src="([^"]+)"></script>', index)
if len(srcs) != len(blocks):
    errors.append(f"index.html references {len(srcs)} scripts, original has {len(blocks)} blocks")
else:
    for src, block in zip(srcs, blocks):
        p = ROOT / src
        if not p.exists():
            errors.append(f"missing file: {src}")
            continue
        if p.read_text(encoding="utf-8") != block:
            errors.append(f"content mismatch: {src}")

if "<style>" in index or re.search(r"<script>", index):
    errors.append("index.html still contains an inline <style> or <script>")

if "</head>" not in index or "<body>" not in index or "</body></html>" not in index:
    errors.append("index.html lost head/body skeleton")

# body markup (between <body> and first script tag) must equal original body markup
body_orig = pre[head_end + len("</head>"):]
body_new = index.split("<body>", 1)[1].split('<script src=', 1)[0]
if body_new.strip() != body_orig.replace("<body>", "", 1).strip():
    errors.append("body markup changed")

# head meta/title preserved
for needle in ['<meta charset="utf-8">', 'name="viewport"', 'claude:viewport-fit-sides', "<title>"]:
    if needle not in index:
        errors.append(f"head lost: {needle}")

if errors:
    print("FAIL")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print(f"OK: {len(blocks)} script blocks + css byte-identical, index.html references all in order, skeleton intact")
