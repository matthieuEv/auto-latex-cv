FROM alpine:latest

WORKDIR /auto-latex-cv

RUN apk update && apk upgrade
# Utiliser texlive-full pour une installation complète
RUN apk add texlive-full
RUN apk add nodejs npm
RUN mkdir build

COPY . .

RUN npm install
CMD [ "node", "main.mjs" ]