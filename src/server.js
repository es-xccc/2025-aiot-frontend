const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// 提供靜態檔案服務
app.use(express.static(__dirname));

// 緩存檔案內容
let cachedData = '';

// 定時刷新檔案內容（直接讀本地 output/output.csv）
const refreshData = () => {
  const localFilePath = './output/output.csv';
  fs.readFile(localFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('檔案讀取失敗:', err);
      return;
    }
    cachedData = data;
    console.log('檔案已更新');
  });
};

// 每秒刷新一次
setInterval(refreshData, 1000);

// 提供 index.html 作為根路徑的回應
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// /data API 端點，返回緩存的檔案內容
app.get('/data', (req, res) => {
  if (cachedData) {
    res.send(cachedData);
  } else {
    res.status(500).send('尚無可用的檔案資料');
  }
});

// /filtered-data API，過濾最後 5 秒的資料
app.get('/filtered-data', (req, res) => {
  const localFilePath = './output/output.csv';
  fs.readFile(localFilePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('本地檔案讀取失敗');
      return;
    }
    const lines = data.trim().split('\n');
    const lastTimestamp = parseFloat(lines[lines.length - 1].split(',')[0]);
    const filteredData = lines.filter(line => {
      const timestamp = parseFloat(line.split(',')[0]);
      return lastTimestamp - timestamp <= 5;
    });
    res.json(filteredData.map(line => {
      const [time, name, x1, y1, x2, y2] = line.split(',');
      return { time: parseFloat(time), name, x1: parseInt(x1), y1: parseInt(y1), x2: parseInt(x2), y2: parseInt(y2) };
    }));
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器正在執行於 http://localhost:${PORT}`);
});