var http = require('http'),
	fs = require('fs'),
	formidable = require('formidable'),
	util = require('util'),
	childProcess = require('child_process'),
	express = require("express"),

	server = express();

server.get('/', function (req, res) {

	displayForm(res);
});

server.post('/', function (req, res) {

	processForm(req, res);
});

function displayForm(res) {

	fs.readFile('form.html', function (err, data) {

		res.writeHead(200, {
			'Content-Type': 'text/html',
			'Content-Length': data.length
		});
		res.write(data);
		res.end();
	});
}

function processForm(req, res) {

	var form = new formidable.IncomingForm();

	form.parse(req, parseForm.bind(this, res));
}

function parseForm(res, err, fields, files) {

	var exec = childProcess.exec,
		cmd = getCmdWithArgs(fields);

	if (!cmd) {
		onSpeechDone(res, {
			fields: fields,
			files: files
		}, 'Empty command was generated');

		return;
	}

	exec(cmd, onSpeechDone.bind(this, res, {
		fields: fields,
		files: files
	}));
}

function getCmdWithArgs(fields) {

	var voice = fields.voice;

	if (voice === 'google_speech') {
		return getGoogleSpeechCmdWithArgs(fields);
	} else if (voice === 'festival') {
		return getFestivalCmdWithArgs(fields);
	} else if (voice === 'espeak') {
		return getEspeakCmdWithArgs(fields);
	}

	return '';
}

function getGoogleSpeechCmdWithArgs(fields) {

	var text = fields.textToSpeech,
		language = fields.language,
		speed = fields.speed,

		cmd = 'google_speech',
		args = '-l ' + language + ' \"' + text + '\"' + ' -e overdrive 10 speed ' + speed;

	return cmd + ' ' + args;
}

function getFestivalCmdWithArgs(fields) {

	var text = fields.textToSpeech,
		language = fields.language,

		cmd = 'echo "' + text + '" | festival',
		args = '--tts --language ' + language;

	return cmd + ' ' + args;
}

function getEspeakCmdWithArgs(fields) {

	var text = fields.textToSpeech,
		language = fields.language,
		voiceCode = '+f4',
		speed = Math.floor(fields.speed * 150),
		pitch = '70',

		cmd = 'espeak',
		args = '-v' + language + voiceCode + ' -s ' + speed + ' -p ' + pitch + ' \"' + text + '\"';

	return cmd + ' ' + args;
}

function onSpeechDone(res, formData, err, stdout, stderr) {

	if (!err) {
		displayForm(res);
		return;
	}

	res.writeHead(200, {
		'content-type': 'text/plain'
	});
	res.write('error:\n\n');
	res.write(util.inspect(err) + '\n\n');
	res.write('received the data:\n\n');
	res.end(util.inspect(formData));
}

server.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));

server.listen(3000, function () {

	var port = this.address().port;
	console.log('Listening at port', port);
});
