FROM node:slim

LABEL maintainer="pedroetb@gmail.com"

RUN apt-get update && \
	apt-get install --no-install-recommends -y \
		software-properties-common && \
	add-apt-repository \
		"deb http://ftp.de.debian.org/debian stretch main non-free" && \
	apt-get update && \
	apt-get install --no-install-recommends -y \
		python3 \
		sox \
		libsox-fmt-mp3 \
		festival \
		festvox-ellpc11k \
		espeak && \
	apt-get install -y \
		python3-pip && \
	pip3 install google_speech && \
	apt-get remove --purge -y \
		software-properties-common \
		python3-pip && \
	apt-get autoremove --purge -y && \
	rm -rf /var/lib/apt/lists/*

WORKDIR /tts-api

COPY package.json package-lock.json app.js ./
COPY js/ ./js/
COPY views/ ./views/

EXPOSE 3000

RUN npm i

CMD ["npm", "start"]
