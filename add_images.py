import json, os, glob

BASE_PATH   = "data"
OUTPUT_JS   = "js/quiz-data.js"
MAX_PER_PART = 30

MAP = {
    "55mph": "sign_speed_limit_55.png",
    "55 mph": "sign_speed_limit_55.png",
    "wet road": "sign_slippery_when_wet.png",
    "snow": "sign_slippery_when_wet.png",
    "red circle and line": "sign_do_not_enter.png",
    "orange and red": "sign_slow_moving_vehicle.png",
    "pennant": "sign_no_passing_zone.png",
    "yield": "sign_yield.png",
    "stop": "sign_stop.png",
    "bicyclist": "sign_bicycle.png",
    "railroad": "sign_railroad_crossing.png",
    "walking person": "sign_pedestrian_crossing.png",
    "light rail": "sign_light_rail.png",
    "insurance": "regulatory_signs.webp",
    "collision": "warning_signs.webp",
    "horn": "guide_signs.webp",
    "sign": "regulatory_signs.webp",
    "light": "traffic_light_red.png",
    "signal": "sign_hand_left.png",
    "curb": "regulatory_signs.webp",
    "line": "regulatory_signs.webp"
}

def main():
    all_data = {}
    json_files = sorted(glob.glob(os.path.join(BASE_PATH, "*.json")))
    
    for f_path in json_files:
        set_id = os.path.basename(f_path).replace(".json", "")
        with open(f_path, 'r') as f: data = json.load(f)
        
        for q in data:
            if "image" in q: del q["image"]
            text = (q.get("question", "") + " " + q.get("explanation", "")).lower()
            img_file = next((v for k, v in MAP.items() if k in text), None)
            if "black ice" in text: img_file = None
            if img_file: q["image"] = f"images/{img_file}"
        
        # Split into parts of 30
        parts = []
        for i in range(0, len(data), MAX_PER_PART):
            parts.append(data[i:i + MAX_PER_PART])
        
        all_data[set_id] = {
            "title": set_id.replace("set", "Set "),
            "parts": parts
        }
        
    os.makedirs("js", exist_ok=True)
    with open(OUTPUT_JS, 'w') as f:
        f.write("window.QUIZ_DATA = " + json.dumps(all_data, indent=2) + ";")
    
    print(f"SUCCESS: Split {len(json_files)} sets into subsections (max {MAX_PER_PART} Qs each).")

if __name__ == "__main__":
    main()
