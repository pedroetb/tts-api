# TTS-API

Text to speech REST API for multiple TTS engines.

## Setup

First, you should install the supported TTS engines:

### GoogleSpeech

```
TODO
```

### Festival

```
TODO
```

### eSpeak

```
TODO
```

You also need to install **nodejs** and **npm**, and then, simply run `npm install` and `npm start`.
The API should now be running at `http://localhost:3000`.

## Usage

When running, the API will receive POST request at `http://localhost:3000`.
You can use your favourite REST client to send a request, or use the built-in form.

### Built-in form

Go to `http://localhost:3000/form`, fill the form with data and submit it. Just that.

### Send POST request

You can send a POST request to `http://localhost:3000` following this scheme:

* **Headers**
	* **Content-Type**: `application/json`
* **Body**
	* `{ "voice": "google_speech", "textToSpeech": "hello world", "language": "en", "speed": "1" }`

## Available TTS engines

### GoogleSpeech

TODO

### Festival

TODO

### eSpeak

TODO
