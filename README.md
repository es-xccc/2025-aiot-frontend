docker build -t aiot-frontend .

docker run -d -p 3000:3000 --name aiot-frontend-container aiot-frontend

http://localhost:3000
