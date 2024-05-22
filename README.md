This is the readme file for setting up this project for a webserver.

1. Setup your web server of choice for example Amazon AWS for Linux distubution.
2. The following ports; 3001, 3005, 3010 need to be opened for the services to be able to run.
3. Connect to your web server console via SSH.
4. Enter the following commands (These commands are targed towards Amazon ECS Servers so may need changing if on any other service. There are some commands that require parameters to be filled out):
5. sudo yum update 
6. sudo groupadd docker
7. sudo usermod –aG docker ec2-user 
8. sudo yum install docker 
9. sudo reboot 
10. sudo service docker start 
11. docker pull callum1h3/dogwalkerapp-backend 
12. docker pull callum1h3/dogwalkerapp-frontend 
13. docker pull callum1h3/dogwalkerapp-listing 
14. docker run -d –p 3005:3005 --restart unless-stopped -e MONGO_URL=[MONGODB URL] callum1h3/dogwalkerapp-backend:latest 
15. docker run -d –p 3010:3010 --restart unless-stopped -e MONGO_URL=[MONGODB URL] callum1h3/dogwalkerapp-listing:latest 
16. docker run -d –p 3001:3001 --restart unless-stopped callum1h3/dogwalkerapp-frontend:latest

After these steps the website will be online on the port 3001 on the servers IP address.
Geolocation is not enabled on default for insecure servers so for now chrome users will need to add the website Ip and port to the following setting:

chrome://flags/#unsafely-treat-insecure-origin-as-secure