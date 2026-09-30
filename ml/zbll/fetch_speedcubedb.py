"""Downloads SpeedCubeDB's pages for the given categories, politely: one
request at a time, three seconds apart, and never twice. Pages are saved as
text for extract.py; nothing downloaded is run.

Usage: python3 fetch_speedcubedb.py RAW_DIR [CATEGORY ...]"""
import os, re, sys, time, urllib.request, urllib.parse
RAW = os.path.join(sys.argv[1], "scdb")
os.makedirs(RAW, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (research; SolveLab)"}
def get(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 100:
        return open(path, encoding="utf-8").read()
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=UA)
            data = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")
            open(path, "w", encoding="utf-8").write(data)
            time.sleep(3)
            return data
        except Exception as e:
            print("retry", url, e, flush=True); time.sleep(15)
    return ""
CATEGORIES = sys.argv[2:] or ["ZBLLT", "ZBLLU", "ZBLLL", "ZBLLPi", "ZBLLH", "ZBLLS", "ZBLLAS"]
for cat in CATEGORIES:
    page = get(f"https://www.speedcubedb.com/a/3x3/{cat}", os.path.join(RAW, f"{cat}.html"))
    names = []
    for n in re.findall(r'class="row singlealgorithm[^"]*" data-subgroup="[^"]*" data-alg="([^"]+)"', page):
        if n not in names: names.append(n)
    print(cat, len(names), flush=True)
    for n in names:
        q = urllib.parse.urlencode({"algname": n, "cat": cat, "d": "0"})
        get(f"https://www.speedcubedb.com/category.algs.php?{q}", os.path.join(RAW, f"more-{cat}-{n.replace(' ', '_')}.html"))
print("done", flush=True)
