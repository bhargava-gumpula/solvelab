"""Downloads a list of URLs politely: one at a time, DELAY seconds apart,
skipping any already saved. Pages are saved as text; nothing is run.

Usage: python3 fetch_list.py OUT_DIR LIST_FILE [DELAY]
LIST_FILE has one "filename<TAB>url" per line."""
import os, sys, time, urllib.request

out_dir, list_file = sys.argv[1], sys.argv[2]
delay = float(sys.argv[3]) if len(sys.argv) > 3 else 3
os.makedirs(out_dir, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (research; SolveLab)"}
for line in open(list_file):
    if not line.strip():
        continue
    name, url = line.rstrip("\n").split("\t", 1)
    path = os.path.join(out_dir, name)
    if os.path.exists(path) and os.path.getsize(path) > 100:
        continue
    for attempt in range(3):
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
            open(path, "wb").write(data)
            print("ok", name, len(data), flush=True)
            break
        except Exception as error:
            print("retry", name, error, flush=True)
            time.sleep(15)
    time.sleep(delay)
print("done", flush=True)
