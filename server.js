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
  host: '192.168.0.5',
  username: 'your-username',
  password: 'your-password',
};

// 提供 index.html 作為根路徑的回應
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 定義 API 端點
app.get('/data', (req, res) => {
  const conn = new Client();

  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) {
        res.status(500).send('SFTP 連接失敗');
        return;
      }

      const remoteFilePath = '/home/yolo/output.csv';
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
    res.status(500).send('SSH 連接失敗');
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器正在執行於 http://localhost:${PORT}`);
});