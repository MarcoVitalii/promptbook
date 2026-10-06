#!/usr/bin/env python3
"""Assemble promptbook.html from src/. The output is one self-contained file."""
import base64, pathlib
root = pathlib.Path(__file__).parent
faces = [('Regular', 'normal', 400), ('Italic', 'italic', 400), ('Bold', 'normal', 700)]
fonts = ''
for name, style, weight in faces:
    b64 = base64.b64encode((root / 'fonts' / f'pb-{name}.woff').read_bytes()).decode()
    fonts += ('@font-face{font-family:"PB";font-style:%s;font-weight:%d;font-display:block;'
              'src:url(data:font/woff;base64,%s) format("woff")}\n' % (style, weight, b64))
html = (root / 'src' / 'index.html').read_text(encoding='utf-8')
css = (root / 'src' / 'style.css').read_text(encoding='utf-8')
js = '\n'.join((root / 'src' / f).read_text(encoding='utf-8') for f in ('core.js', 'view.js', 'io.js'))
assert '</script' not in js
out = html.replace('/*FONTS*/', fonts).replace('/*CSS*/', css).replace('/*JS*/', js)
(root / 'promptbook.html').write_text(out, encoding='utf-8')
print('promptbook.html', len(out.encode()) // 1024, 'KB')
