#!/usr/bin/env python3
"""Check every internal link and image in the built site (dist/) points at something that exists."""
import os, re, sys, html

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')
bad = 0
pages = 0
for dirpath, _, files in os.walk(root):
    for f in files:
        if not f.endswith('.html'):
            continue
        pages += 1
        path = os.path.join(dirpath, f)
        text = open(path, encoding='utf-8').read()
        ids = set(re.findall(r'\sid="([^"]+)"', text))
        for attr, link in re.findall(r'\s(href|src)="([^"]+)"', text):
            link = html.unescape(link)
            if re.match(r'^(https?:|mailto:|data:|#$|//)', link):
                continue
            target, _, anchor = link.partition('#')
            if not target:  # same-page anchor
                if anchor and anchor not in ids:
                    print(f'{os.path.relpath(path, root)}: missing anchor #{anchor}'); bad += 1
                continue
            target = target.split('?')[0]
            full = os.path.join(root, target.lstrip('/')) if target.startswith('/') else os.path.join(dirpath, target)
            if os.path.isdir(full):
                full = os.path.join(full, 'index.html')
            if not os.path.exists(full):
                print(f'{os.path.relpath(path, root)}: broken {attr} {link}'); bad += 1
            elif anchor and full.endswith('.html'):
                if anchor not in set(re.findall(r'\sid="([^"]+)"', open(full, encoding='utf-8').read())):
                    print(f'{os.path.relpath(path, root)}: missing anchor {link}'); bad += 1
print(f'{pages} pages, {bad} broken links')
sys.exit(1 if bad else 0)
