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
};

// 提供 index.html 作為根路徑的回應
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 修改 /data API 端點，若 SSH 連線失敗則改為讀取本地 output.csv
app.get('/data', (req, res) => {
  const conn = new Client();

  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) {
        res.status(500).send('SFTP 連接失敗');
        return;
      }

      const remoteFilePath = '/home/root/yolocpp/output.csv';
      const localFilePath = './output.csv';

      sftp.fastGet(remoteFilePath, localFilePath, (err) => {
        if (err) {
          res.status(500).send('檔案下載失敗');
          return;
        }

        // 讀取檔案內容
        fs.readFile(localFilePath, 'utf8', (err, data) => {
          if (err) {
            res.status(500).send('檔案讀取失敗');
            return;
          }

          res.send(data);
        });
      });
    });
  }).connect(sshConfig);

  conn.on('error', (err) => {
    console.error('SSH 連接失敗，改為讀取本地檔案:', err);
    const localFilePath = './output.csv';

    fs.readFile(localFilePath, 'utf8', (err, data) => {
      if (err) {
        res.status(500).send('本地檔案讀取失敗');
        return;
      }

      res.send(data);
    });
  });
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