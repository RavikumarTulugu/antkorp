# syntax=docker/dockerfile:1
FROM ubuntu:latest
# RUN ls
# WORKDIR /app
COPY . .
RUN sh ./setup.sh
RUN cd server/src
CMD [ "make" ]
# CMD [ "sh", "./setup.sh"]
# CMD ["find", "/", "-name", "ssl.h"]
# CMD ["node", "src/index.js"]
EXPOSE 3000
