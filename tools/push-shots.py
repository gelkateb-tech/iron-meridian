#!/usr/bin/env python3
"""Save screenshots sent to the owner onto the separate "shots" branch.

Owner's standing rule (2026-11-26): every screenshot or sheet sent to the owner
is also saved to the repo, on the branch "shots" (never on master, never
merged), one folder per day and job, JPG at most 1600 px wide; keep only the
last 14 days and rewrite the branch when old ones are removed.

Usage:
  python3 -I tools/push-shots.py <YYYY-MM-DD> <job> <file> [<file> ...]
      [--name <file>=<new-name>] [--no-push]

Files land at shots/<date>/<job>/<name>.jpg in the worktree WT (created as an
orphan branch on first use). If any day folder is older than 14 days it is
removed and the branch is squashed to one commit (force-pushed), so old
pictures leave the history.
"""
import datetime
import os
import re
import shutil
import subprocess
import sys

from PIL import Image

REPO = '/home/user/iron-meridian'
WT = '/home/user/iron-meridian-shots'
BR = 'shots'
MAXW = 1600
KEEP_DAYS = 14
TRAILER = ('Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n'
           'Claude-Session: https://claude.ai/code/session_01KVGBc2Umi6eiR6tSvLXXtJ')
README = """# Screenshots for the owner

This branch only holds the screenshots and sheets sent to the owner, so they can
be reviewed from another chat. It is never merged into master.

- One folder per day and job: shots/<date>/<job>/
- JPG, at most 1600 px wide.
- Only the last 14 days are kept; when older days are removed the branch is
  rewritten (squashed), so old pictures leave the history.
"""


def git(*a, cwd=WT, check=True):
    return subprocess.run(['git', *a], cwd=cwd, check=check, text=True,
                          capture_output=True).stdout.strip()


def ensure_wt():
    if os.path.isdir(WT):
        return
    remote = git('ls-remote', '--heads', 'origin', BR, cwd=REPO)
    if remote:
        git('fetch', '-q', 'origin', f'{BR}:{BR}', cwd=REPO, check=False)
        git('worktree', 'add', '-q', WT, BR, cwd=REPO)
    else:
        git('worktree', 'add', '-q', '--detach', WT, cwd=REPO)
        git('checkout', '-q', '--orphan', BR)
        git('rm', '-rq', '--cached', '.')
        for n in os.listdir(WT):
            if n == '.git':
                continue
            p = os.path.join(WT, n)
            shutil.rmtree(p) if os.path.isdir(p) and not os.path.islink(p) else os.remove(p)
    with open(os.path.join(WT, 'README.md'), 'w') as f:
        f.write(README)


def slug(s):
    s = re.sub(r'[^A-Za-z0-9._-]+', '-', s).strip('-').lower()
    return s or 'shot'


def save(src, dst):
    im = Image.open(src)
    im.load()
    if im.mode not in ('RGB', 'L'):
        bg = Image.new('RGB', im.size, (255, 255, 255))
        bg.paste(im, mask=im.convert('RGBA').split()[-1])
        im = bg
    if im.width > MAXW:
        im = im.resize((MAXW, round(im.height * MAXW / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.convert('RGB').save(dst, 'JPEG', quality=82, optimize=True, progressive=True)


def push(force):
    args = ['push', '-q', '-u', 'origin', BR]
    if force:
        args.insert(1, '--force')
    for i in range(4):
        r = subprocess.run(['git', *args], cwd=WT, text=True, capture_output=True)
        if r.returncode == 0:
            return
        print(r.stderr.strip(), file=sys.stderr)
        subprocess.run(['sleep', str(2 ** (i + 1))])
    raise SystemExit('push failed')


def main(argv):
    nopush = '--no-push' in argv
    argv = [a for a in argv if a != '--no-push']
    names = {}
    while '--name' in argv:
        i = argv.index('--name')
        k, v = argv[i + 1].split('=', 1)
        names[os.path.abspath(k)] = v
        del argv[i:i + 2]
    if len(argv) < 3:
        raise SystemExit(__doc__)
    day, job, files = argv[0], slug(argv[1]), argv[2:]
    today = datetime.date.fromisoformat(day)
    ensure_wt()
    out = []
    for f in files:
        base = names.get(os.path.abspath(f)) or os.path.splitext(os.path.basename(f))[0]
        dst = os.path.join(WT, 'shots', day, job, slug(os.path.splitext(base)[0]) + '.jpg')
        save(f, dst)
        out.append(os.path.relpath(dst, WT))
    # prune days older than KEEP_DAYS
    pruned = []
    root = os.path.join(WT, 'shots')
    for d in sorted(os.listdir(root)):
        try:
            dd = datetime.date.fromisoformat(d)
        except ValueError:
            continue
        if (today - dd).days >= KEEP_DAYS:
            shutil.rmtree(os.path.join(root, d))
            pruned.append(d)
    git('add', '-A')
    has_head = subprocess.run(['git', 'rev-parse', '-q', '--verify', 'HEAD'], cwd=WT,
                              capture_output=True).returncode == 0
    if pruned and has_head:
        # rewrite: one fresh commit holding only what is kept
        tree = git('write-tree')
        msg = f'Shots: last {KEEP_DAYS} days (removed {", ".join(pruned)})\n\n{TRAILER}'
        c = subprocess.run(['git', 'commit-tree', tree], cwd=WT, input=msg, text=True,
                           capture_output=True, check=True).stdout.strip()
        git('reset', '-q', '--soft', c)
        git('reset', '-q', c)
    elif git('status', '--porcelain'):
        git('commit', '-q', '-m', f'Shots {day}: {job} ({len(out)})\n\n{TRAILER}')
    if not nopush:
        push(force=bool(pruned and has_head))
        if pruned:
            git('reflog', 'expire', '--expire=now', '--all', check=False)
            git('gc', '-q', '--prune=now', check=False)
    print(f'folder: shots/{day}/{job}/')
    for o in out:
        print('  ' + o)
    if pruned:
        print('removed days (branch rewritten): ' + ', '.join(pruned))


if __name__ == '__main__':
    main(sys.argv[1:])
