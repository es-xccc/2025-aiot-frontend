import csv
import json
import time
import os

last_alert_time = None
last_control_mtime = None
control = {}
selected_objects = set()
overlap_mode = 'overlap'

def load_control():
    global control, selected_objects, overlap_mode, last_control_mtime
    try:
        mtime = os.path.getmtime('output/control.json')
        if mtime != last_control_mtime:
            with open('output/control.json', encoding='utf-8') as f:
                control = json.load(f)
            selected_objects = set(control.get('objects', []))
            overlap_mode = control.get('overlapMode', 'overlap')
            last_control_mtime = mtime
    except Exception as e:
        print(f"[警告] control.json 載入失敗: {e}")

def check_alert():
    global last_alert_time
    records = []
    if not os.path.exists('output/output.csv'):
        return
    with open('output/output.csv', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) != 6:
                continue
            t, cls, x1, y1, x2, y2 = row
            if cls in selected_objects:
                records.append({
                    'time': float(t),
                    'class': cls,
                    'x1': float(x1), 'y1': float(y1),
                    'x2': float(x2), 'y2': float(y2)
                })
    if records:
        last_time = records[-1]['time']
        window_records = [r for r in records if last_time - r['time'] <= 5]
    else:
        window_records = []
    overlap_found = False
    for a in range(len(window_records)):
        for b in range(a+1, len(window_records)):
            ra, rb = window_records[a], window_records[b]
            if (ra['x1'] < rb['x2'] and ra['x2'] > rb['x1'] and
                ra['y1'] < rb['y2'] and ra['y2'] > rb['y1']):
                overlap_found = True
                break
        if overlap_found:
            break
    if (overlap_mode == 'overlap' and overlap_found) or (overlap_mode == 'nooverlap' and not overlap_found):
        alert = True
    else:
        alert = False
    if window_records:
        if last_alert_time != last_time:
            print(f"time={last_time:.4f}, alert={alert}")
            last_alert_time = last_time
    else:
        print("no data in window")

def main_loop():
    while True:
        load_control()
        check_alert()
        time.sleep(1)

if __name__ == "__main__":
    main_loop()
