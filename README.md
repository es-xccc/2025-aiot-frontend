# Build, run, and access the container in one command
docker rm -f aiot-frontend-container; docker build -t aiot-frontend .; docker run -d -p 3000:3000 --name aiot-frontend-container aiot-frontend; docker exec -it aiot-frontend-container /bin/bash

http://localhost:3000
