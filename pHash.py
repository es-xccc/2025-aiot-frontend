import cv2
import imagehash
from PIL import Image
from collections import deque
import time

class pHashAnomalyDetector:
    """
    使用滑動窗口和pHash來監測圖像異常。與上一版本完全相同
    """
    def __init__(self, window_size: int = 30, threshold: int = 10):
        if window_size < 1:
            raise ValueError("Window size must be at least 1.")
        
        self.window_size = window_size
        self.threshold = threshold
        self.phashes = deque(maxlen=self.window_size)
        self.image_count = 0

    def process_image(self, new_phash: imagehash.ImageHash) -> tuple[bool, int | None]:
        self.image_count += 1
        is_anomaly = False
        min_distance = None

        if self.phashes:
            distances = [new_phash - old_phash for old_phash in self.phashes]
            min_distance = min(distances)

            if min_distance is not None and min_distance > self.threshold:
                is_anomaly = True
        
        # 只有在非異常情況下才將hash加入窗口，避免用異常狀態污染"正常"的基準
        # 這是另一種策略，可以讓系統對短暫的異常更敏感
        if not is_anomaly:
            self.phashes.append(new_phash)

        # 暖機判斷：只有當窗口滿了之後才開始真正發出警報
        is_warming_up = self.image_count <= self.window_size
        if is_warming_up:
            return False, min_distance # 在暖機期間，永不回報異常

        return is_anomaly, min_distance

# --- 主程式：即時攝像頭監測 ---

def main():
    """主函數，運行即時攝像頭監測。"""
    print("--- Real-time pHash Anomaly Detection from Webcam ---")
    
    # 1. 設置參數
    WINDOW_SIZE = 10       # 參考過去50幀，約等於1-2秒的歷史
    ANOMALY_THRESHOLD = 8  # 閾值可以設得更低，因為連續幀之間變化很小
    
    # 2. 初始化監測器
    detector = pHashAnomalyDetector(window_size=WINDOW_SIZE, threshold=ANOMALY_THRESHOLD)
    print(f"Detector initialized with: Window Size = {WINDOW_SIZE}, Threshold = {ANOMALY_THRESHOLD}")
    print("Press 'q' to quit.")

    # 3. 初始化攝像頭
    # 0 代表預設攝像頭。如果有多個，可以嘗試 1, 2, ...
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Cannot open webcam.")
        return

    # 為了計算FPS
    prev_time = 0

    while True:
        # 4. 讀取一幀畫面
        ret, frame = cap.read()
        if not ret:
            print("Error: Can't receive frame. Exiting ...")
            break
        
        # 計算FPS
        current_time = time.time()
        fps = 1 / (current_time - prev_time)
        prev_time = current_time

        # 5. 處理畫面
        # OpenCV讀取的影像是BGR格式，Pillow需要RGB格式
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        # 將Numpy array轉換為Pillow Image對象
        pil_img = Image.fromarray(frame_rgb)
        
        # 計算pHash
        current_phash = imagehash.phash(pil_img)
        
        # 將pHash餵給監測器
        is_anomaly, min_dist = detector.process_image(current_phash)
        
        # 6. 視覺化結果
        display_text = ""
        color = (0, 255, 0) # 綠色 (B, G, R)

        is_warming_up = detector.image_count <= detector.window_size
        if is_warming_up:
            display_text = f"Warming up... {detector.image_count}/{detector.window_size}"
            color = (255, 255, 0) # 黃色
        elif is_anomaly:
            display_text = f"ANOMALY DETECTED! Min Distance: {min_dist}"
            color = (0, 0, 255) # 紅色
            # 在異常時畫一個紅色邊框
            cv2.rectangle(frame, (0,0), (frame.shape[1], frame.shape[0]), color, 10)
        else:
            display_text = f"Normal. Min Distance: {min_dist}"

        # 將文字和FPS顯示在畫面上
        cv2.putText(frame, display_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.putText(frame, f"FPS: {int(fps)}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # 7. 顯示畫面
        cv2.imshow('pHash Anomaly Detection', frame)
        
        # 8. 偵測按鍵，如果按下 'q' 則退出迴圈
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # 9. 釋放資源並關閉視窗
    print("--- Shutting down ---")
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()