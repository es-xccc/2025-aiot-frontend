# 使用官方 Node.js 基礎映像
FROM node:18

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製專案檔案
COPY . .

# 暴露應用程式埠
EXPOSE 3000

# 啟動應用程式
CMD ["npm", "start"]