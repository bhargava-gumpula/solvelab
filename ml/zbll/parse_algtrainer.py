"""Reads Alg-Trainer's alg_list.js as text (never runs it) and writes JSON:
{collection: [{"label": key, "algs": [...]}, ...]}"""
import json, re, sys
src = open(sys.argv[1], encoding="utf-8").read()
WANT = {
  "zbll_full": "algtrainer-zbll-jabari", "zbll_jabari_justin_tao": "algtrainer-zbll-jjt",
  "algdbZBLL": "algtrainer-zbll-algdb", "zbll_juliette": "algtrainer-zbll-juliette",
  "PLL": "algtrainer-pll", "OHPLL": "algtrainer-ohpll", "OLL": "algtrainer-oll",
  "oll_cubeskills": "algtrainer-oll-cubeskills", "OHOLL": "algtrainer-oholl",
  "COLL": "algtrainer-coll", "taoCOLL": "algtrainer-coll-tao", "WVLS": "algtrainer-wv",
}
def tokens(text, i):
    """Tokens of the object literal starting at text[i] == '{'."""
    depth = 0
    while i < len(text):
        c = text[i]
        if c in "\"'":
            j = i + 1; buf = []
            while text[j] != c:
                if text[j] == "\\": buf.append(text[j+1]); j += 2; continue
                buf.append(text[j]); j += 1
            yield ("str", "".join(buf)); i = j + 1; continue
        if c == "/" and text[i+1] == "/":
            i = text.index("\n", i); continue
        if c in "{[": depth += 1; yield (c, c)
        elif c in "}]":
            depth -= 1; yield (c, c)
            if depth == 0: return
        elif c in ":,": yield (c, c)
        elif re.match(r"[A-Za-z0-9_]", c):
            m = re.match(r"[A-Za-z0-9_]+", text[i:]); yield ("id", m.group(0)); i += len(m.group(0)); continue
        i += 1
out = {}
for var, name in WANT.items():
    m = re.search(r"var\s+" + var + r"\s*=\s*\{", src)
    if not m: print("missing", var); continue
    toks = list(tokens(src, m.end() - 1))
    entries = []; k = 1
    while k < len(toks):
        t = toks[k]
        if t[0] in ("str", "id") and k + 1 < len(toks) and toks[k+1][0] == ":":
            label = t[1]; k += 2; algs = []
            if toks[k][0] == "[":
                k += 1
                while toks[k][0] != "]":
                    if toks[k][0] == "str": algs.append(toks[k][1])
                    k += 1
            elif toks[k][0] == "str": algs.append(toks[k][1])
            entries.append({"label": label, "algs": algs})
        k += 1
    out[name] = entries
    print(name, len(entries), "entries", sum(len(e["algs"]) for e in entries), "strings")
json.dump(out, open(sys.argv[2], "w"), indent=0)
