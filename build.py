#!/usr/bin/env python3
"""Assemble promptbook.html and promptbook-cast.html from src/. Each output is one self-contained file."""
import base64, json, pathlib
root = pathlib.Path(__file__).parent
src = lambda f: (root / 'src' / f).read_text(encoding='utf-8')
faces = [('Regular', 'normal', 400), ('Italic', 'italic', 400), ('Bold', 'normal', 700)]
fonts = ''
for name, style, weight in faces:
    b64 = base64.b64encode((root / 'fonts' / f'pb-{name}.woff').read_bytes()).decode()
    fonts += ('@font-face{font-family:"PB";font-style:%s;font-weight:%d;font-display:block;'
              'src:url(data:font/woff;base64,%s) format("woff")}\n' % (style, weight, b64))
# The script for the actors: core.js for the parser and the strings, cast.js for the rest. System fonts.
cjs = src('core.js') + '\n' + src('cast.js')
assert '</script' not in cjs
cast = src('cast.html').replace('/*CSS*/', src('cast.css')).replace('/*JS*/', cjs)
(root / 'promptbook-cast.html').write_text(cast, encoding='utf-8')
print('promptbook-cast.html', len(cast.encode()) // 1024, 'KB')
# The main tool carries that file as a string, so that "Send to cast" can write it with a show inside.
js = '\n'.join(src(f) for f in ('core.js', 'view.js', 'io.js'))
js = js.replace('"/*CAST*/"', json.dumps(cast, ensure_ascii=False).replace('</', '<\\/'))
assert '</script' not in js
out = src('index.html').replace('/*FONTS*/', fonts).replace('/*CSS*/', src('style.css')).replace('/*JS*/', js)
(root / 'promptbook.html').write_text(out, encoding='utf-8')
print('promptbook.html', len(out.encode()) // 1024, 'KB')
