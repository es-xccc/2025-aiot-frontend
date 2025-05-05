const express = require('express');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// 提供靜態檔案服務
app.use(express.static(__dirname));

// SSH 配置
const sshConfig = {
  host: '192.168.3.14',
  username: 'root',
  password: 'root',
  port: 22,
};

// 緩存檔案內容
let cachedData = '';

// 定時刷新檔案內容
const refreshData = () => {
  const conn = new Client();

  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) {
        console.error('SFTP 連接失敗:', err);
        return;
      }

      const remoteFilePath = 'yolocpp/output.csv';
      const localFilePath = 'output.csv';

      sftp.fastGet(remoteFilePath, localFilePath, (err) => {
        if (err) {
          console.error('檔案下載失敗:', err);
          return;
        }

        // 讀取檔案內容
        fs.readFile(localFilePath, 'utf8', (err, data) => {
          if (err) {
            console.error('檔案讀取失敗:', err);
            return;
          }

          cachedData = data;
          console.log('檔案已更新');
        });
      });
    });
  }).connect(sshConfig);

  conn.on('error', (err) => {
    console.error('SSH 連接失敗:', err);
  });
};

// 每秒刷新一次
setInterval(refreshData, 1000);

// 提供 index.html 作為根路徑的回應
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 修改 /data API 端點，返回緩存的檔案內容
app.get('/data', (req, res) => {
  if (cachedData) {
    res.send(cachedData);
  } else {
    res.status(500).send('尚無可用的檔案資料');
  }
});

// 在 /data API 中過濾最後 5 秒的資料
app.get('/filtered-data', (req, res) => {
  const localFilePath = './output.csv';

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