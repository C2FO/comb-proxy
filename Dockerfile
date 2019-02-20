FROM node:5

WORKDIR /comb-proxy
COPY package.json .

RUN npm install -g grunt && npm install
COPY . .

RUN ["grunt", "test"]
