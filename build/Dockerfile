ARG NODE_IMAGE_TAG

FROM node:${NODE_IMAGE_TAG}

LABEL maintainer="pedroetb@gmail.com"

ARG APT_REPOSITORY \
	GOOGLE_SPEECH_VERSION \
	GTTS_VERSION \
	ESPEAK_VERSION \
	FESTIVAL_VERSION \
	WGET_VERSION \
	PYTHON3_VERSION \
	PYTHON3_PIP_VERSION \
	PYTHON3_SETUPTOOLS_VERSION \
	PYTHON3_WHEEL_VERSION \
	SOX_VERSION \
	FESTVOX_ELLPC11K_VERSION

RUN apt-get update && \
	apt-cache madison \
		wget \
		python3 \
		python3-pip \
		python3-setuptools \
		python3-wheel \
		sox \
		libsox-fmt-mp3 \
		festival \
		espeak && \
	apt-get install --no-install-recommends -y \
		wget="${WGET_VERSION}" \
		python3="${PYTHON3_VERSION}" \
		python3-pip="${PYTHON3_PIP_VERSION}" \
		python3-setuptools="${PYTHON3_SETUPTOOLS_VERSION}" \
		python3-wheel="${PYTHON3_WHEEL_VERSION}" \
		sox="${SOX_VERSION}" \
		libsox-fmt-mp3="${SOX_VERSION}" \
		festival="${FESTIVAL_VERSION}" \
		espeak="${ESPEAK_VERSION}" && \
	echo ${APT_REPOSITORY} >> /etc/apt/sources.list && \
	apt-get update && \
	apt-cache madison \
		festvox-ellpc11k && \
	apt-get install --no-install-recommends -y \
		festvox-ellpc11k="${FESTVOX_ELLPC11K_VERSION}" && \
	pip3 install --break-system-packages \
		google-speech=="${GOOGLE_SPEECH_VERSION}" \
		gTTS=="${GTTS_VERSION}" && \
	apt-get remove --purge -y \
		python3-pip \
		python3-setuptools \
		python3-wheel && \
	apt-get autoremove --purge -y && \
	rm -rf /var/lib/apt/lists/*

WORKDIR /tts-api

RUN mkdir audio

COPY package.json package-lock.json ./
COPY app/ ./app/
COPY js/ ./js/
COPY views/ ./views/

RUN npm i

ENV LC_ALL=C.UTF-8

ARG PORT
ENV PORT=${PORT}
EXPOSE ${PORT}

HEALTHCHECK --interval=1m --timeout=30s --start-period=1m --retries=10 \
	CMD wget --quiet --tries=1 --spider http://localhost:${PORT} || exit 1

CMD ["node", "app"]
