#!/usr/bin/env python3
"""Split Physik-Abenteuer-8-Lehrkraft.html into index.html + css/ + js/ modules.

Content-preserving: every <script> block becomes exactly one .js file with
byte-identical content (minus the <script>/</script> wrapper), both <style>
blocks become css/style.css, and index.html references everything in the
original order. Classic scripts share the global lexical scope, so runtime
behavior is unchanged.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "Physik-Abenteuer-8-Lehrkraft.html"

text = SRC.read_text(encoding="utf-8")
lines = text.split("\n")

# --- locate script blocks: a block starts at a line beginning with "<script>"
blocks = []  # (start_idx, end_idx, content)
i = 0
while i < len(lines):
    if lines[i].startswith("<script>"):
        if lines[i].endswith("</script>"):
            content = lines[i][len("<script>"):-len("</script>")]
            blocks.append((i, i, content))
            i += 1
        else:
            content = lines[i][len("<script>"):]
            j = i + 1
            while j < len(lines) and lines[j] != "</script>":
                j += 1
            if j >= len(lines):
                sys.exit(f"no closing </script> for block at line {i+1}")
            content += "\n" + "\n".join(lines[i + 1:j])
            blocks.append((i, j, content))
            i = j + 1
    else:
        i += 1

if not blocks:
    sys.exit("no script blocks found")

pre = "\n".join(lines[:blocks[0][0]])
post = "\n".join(lines[blocks[-1][1] + 1:])

# --- head/body split inside pre
head_end = pre.index("</head>")
head = pre[:head_end]
body = pre[head_end + len("</head>"):]

# --- extract the two <style> blocks from head -> css/style.css
style_matches = list(re.finditer(r"<style>(.*?)</style>", head, re.DOTALL))
if len(style_matches) != 2:
    sys.exit(f"expected 2 style blocks in head, found {len(style_matches)}")
css = style_matches[0].group(1) + "\n" + style_matches[1].group(1) + "\n"
new_head = head[:style_matches[0].start()] + '<link rel="stylesheet" href="css/style.css">' + head[style_matches[0].end():]
# remove the second (big) style block entirely
new_head = re.sub(r"<style>.*?</style>", "", new_head, count=1, flags=re.DOTALL)

# --- map each script block to a file path
def block_path(content: str) -> str:
    if "window.MUSIK_B64=" in content:
        return "js/data/inhalte.js"
    if content.startswith("/* three.js r158"):
        return "js/vendor/three.min.js"
    m = re.match(r"/\* ---------- (.+?) ---------- \*/", content)
    if m:
        name = m.group(1)
        if name == "Lehrkraft: Inhalte":
            return "js/lehrer/daten.js"
        return "js/" + name
    if "Lernapp-Engine" in content[:400]:
        return "js/engine.js"
    sys.exit("cannot classify script block:\n" + content[:200])

paths = [block_path(c) for _, _, c in blocks]
if len(set(paths)) != len(paths):
    sys.exit("duplicate target paths: " + str(paths))

# --- write files
(ROOT / "css").mkdir(exist_ok=True)
(ROOT / "js" / "data").mkdir(parents=True, exist_ok=True)
(ROOT / "js" / "vendor").mkdir(parents=True, exist_ok=True)
(ROOT / "js" / "lehrer").mkdir(parents=True, exist_ok=True)

(ROOT / "css" / "style.css").write_text(css, encoding="utf-8")
for (start, end, content), rel in zip(blocks, paths):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")

# --- build index.html
parts = [new_head, "</head>", body]
for rel in paths:
    parts.append(f'<script src="{rel}"></script>')
parts.append(post)
index_html = "\n".join(parts)
if not index_html.endswith("\n"):
    index_html += "\n"
(ROOT / "index.html").write_text(index_html, encoding="utf-8")

print(f"script blocks: {len(blocks)}")
for (start, end, _), rel in zip(blocks, paths):
    print(f"  lines {start+1}-{end+1} -> {rel}")
print(f"css/style.css: {len(css)} bytes")
print(f"index.html: {len(index_html)} bytes")
