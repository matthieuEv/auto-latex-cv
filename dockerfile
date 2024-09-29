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

# docker buildx build --push --platform linux/arm64/v8,linux/amd64 . -t ghcr.io/matthieuev/auto-latex-cv:latest
