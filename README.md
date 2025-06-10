# AIoT Frontend

## 說明

我使用了 nodemon，修改文件會自動重啟 node，不必重新 build container
SFTP 抓 pynqz2 的 csv 直接在主機運行，不放在 docker 內，比較好處理和 UART 的整合

## 如何啟動專案

docker-compose up --build -d

http://localhost:3000

## 如何停止 container

docker stop 2025-aiot-frontend

## 如何刪除 container

docker rm 2025-aiot-frontend
