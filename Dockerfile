# 使用官方 Node.js 基礎映像
FROM node:18

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 安裝 nodemon（全域或開發依賴，這裡用全域）
RUN npm install -g nodemon

# 複製 src 目錄
COPY src ./src
COPY output ./output

# 暴露應用程式埠
EXPOSE 3000

# 啟動應用程式（開發用 nodemon）
CMD ["nodemon", "src/server.js"]