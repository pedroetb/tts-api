# TTS-API

Text to speech REST API for multiple TTS engines.

## Setup

First, you should install the supported TTS engines:

### GoogleSpeech

```
$ apt install python3 sox libsox-fmt-mp3
$ pip install google_speech
```

### gTTS

```
$ apt install python3 sox libsox-fmt-mp3
$ pip install gTTS
```

### Festival

```
$ apt install festival festvox-ellpc11k
```

### eSpeak

```
$ apt install espeak
```

You also need to install **nodejs** and **npm**, and then, simply run `npm install` and `npm start`.
The API should now be running at `http://localhost:3000`.

Or you can just use [pedroetb/tts-api](https://hub.docker.com/r/pedroetb/tts-api) **Docker** image, which already has all dependencies configured.

## Setup using Docker

The only requirement is to have **Docker** installed. Then, you can run:
```
$ docker run --rm --device /dev/snd -d -p 3000:3000 pedroetb/tts-api
```

The API will be running and accessible at `http://localhost:3000`.

Alternatively, you can deploy it in a **Docker Swarm** cluster using `docker-compose` (install it first) and `docker swarm` (create Swarm cluster first):
```
$ cd deploy
# Deploy Caddy service
$ env $(grep -v '^[#| ]' .env | xargs) \
	TRAEFIK_DOMAIN=change.me \
	PLACEMENT_CONSTRAINT='node.hostname == node' \
	docker stack deploy \
	-c docker-compose.caddy.yml \
	tts-api
# Deploy API-TTS container
$ docker-compose \
	-f docker-compose.tts-api.yml \
	-p tts-api \
	up -d
```

The service is prepared to be reverse-proxied with **Traefik**, and accessible at `tts.${TRAEFIK_DOMAIN}` domain. How to run **Traefik** is not described here, check its [official site](https://traefik.io).

The proxy needs a little help from **Caddy** (provided by [lucaslorentz/caddy-docker-proxy](https://github.com/lucaslorentz/caddy-docker-proxy) plugin for Docker), because Docker Swarm is not compatible with devices configuration (required to use sound capabilities), and Traefik cannot work with Docker containers and Docker Swarm services at once.

Both, Docker container and service, must be running on the same host, to be able to communicate. `PLACEMENT_CONSTRAINT` environment variable is used at service to ensure that tasks are created always into same host. Check [service constraints documentation](https://docs.docker.com/engine/reference/commandline/service_create/#specify-service-constraints-constraint) to choose how to set it.

Don't forget to edit `TRAEFIK_DOMAIN` and `PLACEMENT_CONSTRAINT` environment variables before deploying.

## Usage

When running, the API will receive POST request at `http://localhost:3000`.
You can use your favourite REST client to send a request, or use the built-in form.

### Built-in form

Go to `http://localhost:3000` with your browser, fill the form with data and submit it. Just that.

### Send POST request

You can send a POST request to `http://localhost:3000` following this scheme:

* **Headers**
	* **Content-Type**: `application/json`
* **Body**
	* `{ "voice": "google_speech", "textToSpeech": "hello world", "language": "en", "speed": "1" }`

For example, using `curl`:
```
$ curl http://localhost:3000 \
  -d '{ "voice": "google_speech", "textToSpeech": "hello world", "language": "en", "speed": "1" }' \
  -H "Content-Type: application/json"
```

## Available TTS engines

### GoogleSpeech

Google Speech is a simple multiplatform command line tool to read text using Google Translate TTS (Text To Speech) API.

You need to be online to communicate with Google servers.

Learn more at https://github.com/desbma/GoogleSpeech

### gTTS

Google Text-to-Speech (gTTS) is a Python library and CLI tool to interface with Google Translate's text-to-speech API.

You need to be online to communicate with Google servers.

Learn more at https://github.com/pndurette/gTTS

### Festival

Festival is a free software multi-lingual speech synthesis workbench that runs on multiple-platforms offering black box text to speech, as well as an open architecture for research in speech synthesis.

It works offline.

Learn more at http://www.cstr.ed.ac.uk/projects/festival/ and http://festvox.org/festival/

### eSpeak

eSpeak is a compact open source software speech synthesizer for English and other languages, for Linux and Windows.

It works offline.

Learn more at http://espeak.sourceforge.net/
