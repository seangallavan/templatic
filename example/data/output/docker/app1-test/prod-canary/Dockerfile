FROM node:8

=# Create app directory
RUN mkdir -p /usr/src/app1-test/

# Install app1-test app
ADD app1-test/ /usr/src/app1-test/
WORKDIR /usr/src/app1-test/

# Install node modules
RUN npm install --production
RUN rm /root/.ssh/id_rsa

ENTRYPOINT [ "node", "server.js" ]
