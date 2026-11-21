# -*- coding: utf-8 -*-
"""Replace page footers with the Microsoft-style layout and drop Special thanks."""
import io
import os
import re

ZH_FOOTER = io.open('scripts/footer-zh.html', encoding='utf-8').read()
EN_FOOTER = io.open('scripts/footer-en.html', encoding='utf-8').read()
RE_FOOTER = r'(?s)<footer class="site-footer">.*?</footer>'

PAGES = [
    ('index.html', ZH_FOOTER, 'assets/css/footer.css'),
    ('about.html', ZH_FOOTER, 'assets/css/footer.css'),
    ('guide.html', ZH_FOOTER, 'assets/css/footer.css'),
    ('download.html', ZH_FOOTER, 'assets/css/footer.css'),
    ('legal.html', ZH_FOOTER, 'assets/css/footer.css'),
    ('en/index.html', EN_FOOTER, '../assets/css/footer.css'),
    ('en/about.html', EN_FOOTER, '../assets/css/footer.css'),
    ('en/guide.html', EN_FOOTER, '../assets/css/footer.css'),
    ('en/download.html', EN_FOOTER, '../assets/css/footer.css'),
    ('en/legal.html', EN_FOOTER, '../assets/css/footer.css'),
]


def read(path):
    with io.open(path, encoding='utf-8') as handle:
        return handle.read()


def write(path, text):
    with io.open(path, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(text)


for path, footer, href in PAGES:
    if not os.path.exists(path):
        continue
    text = read(path)
    if '<footer class="site-footer">' in text:
        text = re.sub(RE_FOOTER, lambda _m: footer, text)
    if 'footer.css' not in text:
        text = text.replace(
            '</head>',
            '  <link rel="stylesheet" href="%s">\n</head>' % href,
            1,
        )
    write(path, text)
    print('footer ->', path)

for path in ('about.html', 'en/about.html'):
    if not os.path.exists(path):
        continue
    text = read(path)
    stripped = re.sub(
        r'(?s)\s*<section class="about-section reveal">\s*<h2>\s*(?:\u7279\u522b\u9e23\u8c22|Special thanks)\s*</h2>.*?</section>',
        '',
        text,
    )
    write(path, stripped)
    print('special thanks removed', path, len(text) - len(stripped))

print('done')
