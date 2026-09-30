"""Turns the raw downloads into records.json for build-zbll.ts.

Everything downloaded is read as text and parsed here; nothing fetched is
ever run. Usage: python3 extract.py RAW_DIR OUT.json
"""
import html, json, os, re, sys

raw, out_path = sys.argv[1], sys.argv[2]
records = []

def add(source, moves, label=None, votes=None):
    moves = html.unescape(re.sub(r"<[^>]+>", " ", moves))
    moves = re.sub(r"\s+", " ", moves).strip()
    if moves:
        records.append({"source": source, "label": label, "moves": moves, "votes": votes})

# SpeedCubeDB: the subset pages and each case's "More Algorithms" list.
scdb = os.path.join(raw, "scdb")
if os.path.isdir(scdb):
    def items(text, label):
        for item in re.split(r"<li class='list-group-item'>", text)[1:]:
            alg = re.search(r'class="formatted-alg">(.*?)</div>', item, re.S)
            vote = re.search(r"fa-thumbs-up me-1'></i>(-?\d+)", item)
            if alg:
                add("speedcubedb", alg.group(1), label, int(vote.group(1)) if vote else 0)
    for name in sorted(os.listdir(scdb)):
        text = open(os.path.join(scdb, name), encoding="utf-8").read()
        if name.startswith("more-"):
            rest = name[5:-5]
            if "-" in rest and not rest.startswith("ZBLL"):
                continue
            # more-<category>-<case>.html, or more-<case>.html from the first run.
            label = rest.split("-", 1)[1] if "-" in rest else rest
            items(text, label.replace("_", " "))
        elif name.startswith("ZBLL") and not name.startswith("more-"):
            for block in re.split(r'class="row singlealgorithm', text)[1:]:
                label = re.search(r'data-alg="([^"]+)"', block).group(1)
                items(block, label)

# Tao Yu's Alg-Trainer: four ZBLL collections, "/" between alternatives.
algtrainer = os.path.join(raw, "algtrainer.json")
if os.path.exists(algtrainer):
    names = {
        "algtrainer-zbll-jabari": "jabari-nuruddin",
        "algtrainer-zbll-jjt": "nuruddin-taylor-yu",
        "algtrainer-zbll-algdb": "algdb",
        "algtrainer-zbll-juliette": "juliette-sebastien",
    }
    data = json.load(open(algtrainer))
    for key, source in names.items():
        for entry in data.get(key, []):
            for case in entry["algs"]:
                for alg in case.split("/"):
                    add(source, alg, entry["label"])

MOVE = r"[\(\[]*[UDLRFBudlrfbMESxyz]w?[23]?['’′]?[\)\]]*\d?"
SEQUENCE = re.compile(r"(?<![A-Za-z])(?:" + MOVE + r"[ \t]+){5,}" + MOVE + r"(?![A-Za-z])")

def sequences(text):
    """Every run of six or more moves in a page of text: the page's algorithms."""
    text = html.unescape(re.sub(r"<[^>]+>", "\n", text)).replace("\u00a0", " ")
    return [m.group(0) for m in SEQUENCE.finditer(text)]

# The SpeedSolving wiki's algorithm database: a rotation column, then the moves.
wiki = os.path.join(raw, "wiki")
if os.path.isdir(wiki):
    for name in sorted(os.listdir(wiki)):
        path = os.path.join(wiki, name)
        text = open(path, encoding="utf-8", errors="replace").read()
        if name.startswith("algdb-") and name.count("-") == 2:
            for rotation, alg in re.findall(
                r"<td class='rtn_cell'>([^<]*)</td><td><a [^>]*>([^<]*)</a>", text
            ):
                add("speedsolving-wiki", f"{rotation} {alg}", name[6:-5])
        elif name.startswith("thread-"):
            for alg in sequences(text):
                add("speedsolving-forum-" + name[7:-5], alg)

# Spreadsheets (Google Sheets exported as .xlsx): every cell's text, read from the XML.
sheets = os.path.join(raw, "sheets")
if os.path.isdir(sheets):
    import zipfile
    for name in sorted(os.listdir(sheets)):
        if not name.endswith(".xlsx"):
            continue
        cells = []
        with zipfile.ZipFile(os.path.join(sheets, name)) as book:
            for part in book.namelist():
                if part == "xl/sharedStrings.xml" or part.startswith("xl/worksheets/sheet"):
                    xml = book.read(part).decode("utf-8", "replace")
                    for item in re.findall(r"<(?:si|is)>(.*?)</(?:si|is)>", xml, re.S):
                        cells.append("".join(re.findall(r"<t[^>]*>(.*?)</t>", item, re.S)))
        for cell in cells:
            for alg in sequences(cell.replace("/", "\n")):
                add(name[:-5], alg)

# Old documents and viewer pages (Google Drive): the text runs inside the file.
drive = os.path.join(raw, "drive")
if os.path.isdir(drive):
    names = {"swanson": "simon-swanson", "bindedsa": "bindedsa"}
    for name in sorted(os.listdir(drive)):
        data = open(os.path.join(drive, name), "rb").read()
        source = next((value for key, value in names.items() if name.startswith(key)), name)
        if data[:4] == b"%PDF":
            continue  # No text layer we can read without running a PDF library.
        texts = [data.decode("latin-1")]
        # Word documents keep their text as UTF-16 as often as not.
        texts.append(data.decode("utf-16-le", "replace"))
        seen = set()
        for text in texts:
            text = text.replace("\\u0027", "'").replace("\\n", "\n").replace("\r", "\n")
            for alg in sequences(text):
                if alg not in seen:
                    seen.add(alg)
                    add(source, alg)

# pepkin88's ZBLL Explorer: a JSON blob inside its data file, moves packed one
# character each (letter = code % 18, modifier = code // 18, after an offset),
# with a bitmask of which collections list each algorithm.
explorer = os.path.join(raw, "pepkin", "data.js.txt")
if os.path.exists(explorer):
    text = open(explorer, encoding="utf-8").read()
    blob = re.search(r"JSON\.parse\('(.*)'\)\}", text, re.S).group(1)
    data = json.loads(blob.replace("\\'", "'").replace("\\\\", "\\"))
    enc = data["encoderData"]
    letters, modifiers, offset = enc["letters"], enc["modifiers"], enc["offset"]
    tag_source = {
        "SC DB": "speedcubedb", "SC DB OH": "speedcubedb", "SC DB Big": "speedcubedb",
        "AlgDB": "algdb", "AlgDB OH": "algdb", "Juju": "juliette-sebastien",
        "Juju OH": "juliette-sebastien", "Yoruba": "yoruba", "yomie OH": "yomie",
        "Brooks-Jabari": "anthony-brooks", "Jabari 2016": "jabari-nuruddin",
        "Jabari 2021": "jabari-nuruddin", "Jabari OH": "jabari-nuruddin",
        "Jabari": "jabari-nuruddin", "D. V. Egdal": "dv-egdal", "Swanson": "simon-swanson",
    }
    for label, entries in data["algsByCase"].items():
        for entry in entries:
            moves = " ".join(
                letters[(ord(ch) - offset) % len(letters)] + modifiers[(ord(ch) - offset) // len(letters)]
                for ch in entry[0]
            )
            mask = entry[1] if len(entry) > 1 else 0
            sources = {tag_source.get(tag, tag) for i, tag in enumerate(data["tags"]) if mask >> i & 1}
            # Its case labels are its own numbering, so they are left off: the
            # builder names cases after SpeedCubeDB's.
            for source in sorted(sources) or ["pepkin88-explorer"]:
                add(source, moves)

# Plain web pages: every run of moves in the page's text.
TEXT_PAGES = {
    "sct": "speedcubingtips-eu",
    "cubingapp": "cubingapp",
    "caidenlee": "caiden-lee",
    "cuberpro": "cuber-pro",
}
for folder, source in TEXT_PAGES.items():
    path = os.path.join(raw, folder)
    if not os.path.isdir(path):
        continue
    for name in sorted(os.listdir(path)):
        if name.startswith("_") or name.startswith("other-"):
            continue
        text = open(os.path.join(path, name), encoding="utf-8", errors="replace").read()
        for alg in sequences(text):
            add(source or name.split("-")[0], alg)

# Bernard Helmstetter's original list (2003, archived): compact notation, with
# notes in braces, "(X-X')" for turns that cancel, and <RL'> for two at once.
archive = os.path.join(raw, "archive")
if os.path.isdir(archive):
    for name in sorted(os.listdir(archive)):
        if not name.startswith("helmstetter"):
            continue
        text = html.unescape(re.sub(r"<[^>]+>", "\n", open(os.path.join(archive, name), encoding="latin-1").read()))
        for line in text.split("\n"):
            match = re.match(r"^\S+\s+\d+ \d+ \d+\s+\*?\s*(.+)$", line.strip())
            if not match:
                continue
            body = match.group(1).replace("\u00b2", "2")
            if "<<" in body:
                continue  # a construct this reader doesn't handle
            body = re.sub(r"\{([^ }]+) as [^}]*\}", r" \1 ", body)  # "{X as ...}": X goes here
            body = re.sub(r"\([^()]*-[^()]*\)", " ", body)  # "(X-X')": turns that cancel
            body = body.replace("<", " ").replace(">", " ").replace("-", " ")
            tokens = re.findall(r"[UDLRFB](?:2|')?|\(|\)", body)
            moves = " ".join(token for token in tokens if token not in "()")
            if len(moves.split()) >= 6:
                add("bernard-helmstetter", moves)

# Roman Strakhov's ZBLL trainer: its case map lists algorithms (and scrambles,
# which are set-ups rather than algorithms, so they are left out).
roman = os.path.join(raw, "roman", "zbll_map_next.json")
if os.path.exists(roman):
    for case in json.load(open(roman)).values():
        for alg in case.get("algs", []):
            add("roman-strakhov", alg)

# Any further source saved as JSON lines of {"source", "label", "moves", "votes"}.
extra = os.path.join(raw, "extra")
if os.path.isdir(extra):
    for name in sorted(os.listdir(extra)):
        if name.startswith("other-"):
            continue
        for line in open(os.path.join(extra, name), encoding="utf-8"):
            if line.strip():
                row = json.loads(line)
                add(row["source"], row["moves"], row.get("label"), row.get("votes"))

# The other sets, for the report on what the same sources would add to them.
other_path = sys.argv[3] if len(sys.argv) > 3 else None
if other_path:
    other = []
    def add_other(source, set_name, moves, votes=None):
        moves = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", moves))).strip()
        if moves:
            other.append({"source": source, "set": set_name, "moves": moves, "votes": votes})
    sets = {"PLL": "pll", "OLL": "oll", "COLL": "coll", "WV": "wv"}
    if os.path.isdir(scdb):
        for name in sorted(os.listdir(scdb)):
            category = name[5:].split("-", 1)[0] if name.startswith("more-") else name[:-5]
            if category not in sets:
                continue
            text = open(os.path.join(scdb, name), encoding="utf-8").read()
            for item in re.split(r"<li class='list-group-item'>", text)[1:]:
                alg = re.search(r'class="formatted-alg">(.*?)</div>', item, re.S)
                vote = re.search(r"fa-thumbs-up me-1'></i>(-?\d+)", item)
                if alg:
                    add_other("speedcubedb", sets[category], alg.group(1), int(vote.group(1)) if vote else 0)
    # The SpeedSolving wiki's algorithm database for OLL, PLL and COLL.
    if os.path.isdir(wiki):
        for name in sorted(os.listdir(wiki)):
            match = re.match(r"other-(OLL|PLL|COLL)-\d+\.html$", name)
            if not match:
                continue
            text = open(os.path.join(wiki, name), encoding="utf-8", errors="replace").read()
            for rotation, alg in re.findall(
                r"<td class='rtn_cell'>([^<]*)</td><td><a [^>]*>([^<]*)</a>", text
            ):
                add_other("speedsolving-wiki", sets[match.group(1)], f"{rotation} {alg}")
    if os.path.exists(algtrainer):
        data = json.load(open(algtrainer))
        for key, set_name in {
            "algtrainer-pll": "pll", "algtrainer-ohpll": "pll", "algtrainer-oll": "oll",
            "algtrainer-oll-cubeskills": "oll", "algtrainer-oholl": "oll",
            "algtrainer-coll": "coll", "algtrainer-coll-tao": "coll", "algtrainer-wv": "wv",
        }.items():
            for entry in data.get(key, []):
                for case in entry["algs"]:
                    for alg in case.split("/"):
                        add_other(key.replace("algtrainer-", "alg-trainer "), set_name, alg)
    if os.path.isdir(extra):
        for name in sorted(os.listdir(extra)):
            if not name.startswith("other-"):
                continue
            for line in open(os.path.join(extra, name), encoding="utf-8"):
                if line.strip():
                    row = json.loads(line)
                    add_other(row["source"], row["set"], row["moves"])
    # J Perm's algorithm pages keep their lists in a script: alg:["...", ...].
    jperm = os.path.join(raw, "jperm")
    if os.path.isdir(jperm):
        for name, set_name in {
            "lib_pll.js.txt": "pll", "lib_ohpll.js.txt": "pll", "lib_oll.js.txt": "oll",
            "lib_oholl.js.txt": "oll", "lib_coll.js.txt": "coll", "lib_wv.js.txt": "wv",
        }.items():
            path = os.path.join(jperm, name)
            if not os.path.exists(path):
                continue
            for group in re.findall(r"alg:\[([^\]]*)\]", open(path, encoding="utf-8").read()):
                for alg in re.findall(r'"([^"]*)"', group):
                    add_other("jperm", set_name, alg)
    # Web pages saved as other-<SET>-*.html next to a source's ZBLL pages.
    for folder, source in TEXT_PAGES.items():
        path = os.path.join(raw, folder)
        if not os.path.isdir(path):
            continue
        for name in sorted(os.listdir(path)):
            match = re.match(r"other-(PLL|OLL|COLL|WV)-", name)
            if match:
                text = open(os.path.join(path, name), encoding="utf-8", errors="replace").read()
                for alg in sequences(text):
                    add_other(source, {"PLL": "pll", "OLL": "oll", "COLL": "coll", "WV": "wv"}[match.group(1)], alg)
    # Brant Holbein's ZZ document has a front-right Winter Variation section.
    for row in records:
        if row["source"] == "brant-holbein":
            add_other("brant-holbein", "wv", row["moves"])
    json.dump({"records": other}, open(other_path, "w"))
    from collections import Counter
    print(len(other), "other-set records", dict(Counter((r["source"], r["set"]) for r in other)))

json.dump({"records": records}, open(out_path, "w"))
from collections import Counter
print(len(records), "records", dict(Counter(r["source"] for r in records)))
