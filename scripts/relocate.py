# -*- coding: utf-8 -*-
"""Move pages into /domeosai, rewrite paths, swap footer, split the music player."""
import io
import os
import re

ZH_PAGES = ['index.html', 'guide.html', 'download.html', 'legal.html', 'about.html']
EN_PAGES = ['en/index.html', 'en/guide.html', 'en/download.html', 'en/legal.html', 'en/about.html']
RE_FOOTER = r'(?s)<footer class="site-footer">.*?</footer>'
BASE = 'https://liu7pro.github.io/domeosai/'


def read(path):
    with io.open(path, encoding='utf-8') as handle:
        return handle.read()


def write(path, text):
    folder = os.path.dirname(path)
    if folder and not os.path.isdir(folder):
        os.makedirs(folder)
    with io.open(path, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(text)


def relocate(src, dst, footer):
    if not os.path.exists(src):
        return
    text = read(src)
    text = text.replace('href="assets/', 'href="/assets/')
    text = text.replace('src="assets/', 'src="/assets/')
    text = text.replace('href="../assets/', 'href="/assets/')
    text = text.replace('src="../assets/', 'src="/assets/')
    text = re.sub(r'https://liu7pro\.github\.io/(?!domeosai/)', BASE, text)
    text = re.sub(RE_FOOTER, lambda _m: footer, text)
    write(dst, text)
    print('relocate', dst, len(text))


def template(name):
    path = 'scripts/' + name
    return read(path) if os.path.exists(path) else ''


zh_footer = template('footer-zh.html')
en_footer = template('footer-en.html')

for page in ZH_PAGES:
    relocate(page, 'domeosai/' + page, zh_footer)
for page in EN_PAGES:
    relocate(page, 'domeosai/' + page, en_footer)

if os.path.exists('404.html'):
    text = read('404.html')
    text = text.replace('href="/"', 'href="/domeosai/"')
    text = text.replace('href="/en/"', 'href="/domeosai/en/"')
    write('404.html', text)
    print('404 updated')

REDIRECT = template('redirect.html')
TARGETS = {
    'index.html': '/domeosai/',
    'about.html': '/domeosai/about.html',
    'guide.html': '/domeosai/guide.html',
    'download.html': '/domeosai/download.html',
    'legal.html': '/domeosai/legal.html',
    'en/index.html': '/domeosai/en/',
    'en/about.html': '/domeosai/en/about.html',
    'en/guide.html': '/domeosai/en/guide.html',
    'en/download.html': '/domeosai/en/download.html',
    'en/legal.html': '/domeosai/en/legal.html',
}
if REDIRECT:
    for path, target in TARGETS.items():
        write(path, REDIRECT.replace('{{TARGET}}', target))
    print('redirects', len(TARGETS))

css_path = 'assets/css/style.css'
new_css = template('footer.css')
if os.path.exists(css_path) and new_css:
    css = read(css_path)
    css_new = re.sub(
        r'(/\* ---------- \u9875\u811a ---------- \*/)(.*?)(/\* ---------- \u5b50\u9875\u9762 ---------- \*/)',
        lambda m: m.group(1) + '\n' + new_css + '\n' + m.group(3),
        css,
        flags=re.S,
    )
    css_new = css_new.replace(
        '  .footer-top {\n    grid-template-columns: 1fr 1fr;\n  }\n',
        '  .footer-top {\n    grid-template-columns: 1fr 1fr;\n  }\n\n  .footer-legal {\n    margin-left: 0;\n  }\n',
    )
    write(css_path, css_new)
    print('css footer', len(css_new))

js_path = 'assets/js/main.js'
MUSIC_LINK = template('music-link.js')
if os.path.exists(js_path) and MUSIC_LINK:
    js = read(js_path)
    marker = '// \u97f3\u4e50\u64ad\u653e\u5668'
    idx = js.find(marker)
    if idx > 0:
        write(js_path, js[:idx].rstrip() + '\n\n' + MUSIC_LINK)
        print('main.js music link')

cfg_path = 'assets/js/config.js'
if os.path.exists(cfg_path):
    cfg = read(cfg_path)
    cfg_new = re.sub(r'\n\n  // [^\n]*\n  music: \{.*?\n  \},', '', cfg, flags=re.S)
    write(cfg_path, cfg_new)
    print('config music removed', 'music:' in cfg_new)

print('all done')
