import json, os, glob, re

BASE_DIR = "data"
IMAGES_DIR = "images"

# Keywords that SHOULD trigger an image requirement in the audit
VISUAL_KEYWORDS = [
    "sign", "signal", "light", "yellow", "red", "green", "arrow", 
    "marking", "line", "curb", "hand signal", "flagger", "railroad"
]

def audit_file(filepath):
    with open(filepath, 'r') as f:
        questions = json.load(f)
    
    missing = []
    broken = []
    
    for i, q in enumerate(questions):
        text = q.get("question", "").lower()
        has_image = "image" in q and q["image"]
        
        # Use word boundaries to avoid matching "red" in "injured"
        should_have_image = False
        for kw in VISUAL_KEYWORDS:
            if re.search(f"\\b{kw}\\b", text):
                should_have_image = True
                break
        
        # Exception: Black ice is a road condition
        if "black ice" in text:
            should_have_image = False

        if should_have_image and not has_image:
            missing.append(f"Q{i+1}: {q.get('question')[:60]}...")
        
        if has_image:
            if not os.path.exists(q["image"]):
                broken.append(f"Q{i+1}: {q['image']} (File not found)")
                
    return missing, broken, len(questions)

def main():
    json_files = glob.glob(os.path.join(BASE_DIR, "*.json"))
    total_q = 0
    total_missing = 0
    total_broken = 0
    
    print("=== STARTING SMART AUDIT (Stricter Rules) ===")
    for f in json_files:
        m, b, count = audit_file(f)
        total_q += count
        if m or b:
            print(f"\nIssues in {os.path.basename(f)}:")
            for msg in m: print(f"  [MISSING] {msg}")
            for msg in b: print(f"  [BROKEN] {msg}")
            total_missing += len(m)
            total_broken += len(b)

    print("\n=== AUDIT SUMMARY ===")
    print(f"Total Scalped: {total_q}")
    print(f"Missing Images: {total_missing}")
    print(f"Broken Links: {total_broken}")
    
    if total_missing == 0 and total_broken == 0:
        print("\n✅ SUCCESS: Every relevant question has a working image!")
    else:
        print("\n❌ FAILURE: Fix the mapping script to cover these questions.")

if __name__ == "__main__":
    main()
