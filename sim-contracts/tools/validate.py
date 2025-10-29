import json, glob, os, sys
from jsonschema import Draft7Validator, RefResolver
def load(p):
    with open(p, "r", encoding="utf-8") as f: return json.load(f)
def main():
    base = os.path.dirname(os.path.dirname(__file__))
    schemas = os.path.join(base, "schemas")
    samples = os.path.join(base, "samples")
    store = {}
    for sp in glob.glob(os.path.join(schemas, "*.schema.json")):
        s = load(sp); 
        if "$id" in s: store[s["$id"]] = s
    errors = 0
    for smp in glob.glob(os.path.join(samples, "*.example.json")):
        sch = os.path.join(schemas, os.path.basename(smp).replace(".example.json",".schema.json"))
        if not os.path.exists(sch):
            print(f"❌ Schema missing for sample: {smp}"); errors += 1; continue
        inst = load(smp); schema = load(sch)
        v = Draft7Validator(schema, resolver=RefResolver.from_schema(schema, store=store))
        err = list(v.iter_errors(inst))
        if err:
            print(f"❌ FAIL: {os.path.basename(smp)}")
            for e in err:
                path = "/".join(str(p) for p in e.path) or "(root)"
                print("  -", path, ":", e.message)
            errors += 1
        else:
            print(f"✅ OK:   {os.path.basename(smp)}")
    sys.exit(1 if errors else 0)
if __name__ == "__main__": main()
