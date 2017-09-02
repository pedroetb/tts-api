var util = require('util'),
	childProcess = require('child_process'),
	express = require('express'),
	bodyParser = require('body-parser'),

	server = express(),
	port = 3000;

server.set('view engine', 'pug')
	.use(bodyParser.json())

	.use('/css/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/css'))
	.use('/css/alertify', express.static(__dirname + '/node_modules/alertifyjs/build/css'))
	.use('/css/alertify', express.static(__dirname + '/node_modules/alertifyjs/build/css/themes'))
	.use('/js', express.static(__dirname + '/js'))
	.use('/js/alertify', express.static(__dirname + '/node_modules/alertifyjs/build'))

	.get('/', renderForm)
	.post('/', processData)

	.listen(port, function() {

		var port = this.address().port;
		console.log('Listening at port', port);
	});

function renderForm(req, res) {

	var formView = 'form';
	res.render(formView);
}

function processData(req, res) {

	var body = req.body,
		exec = childProcess.exec,
		cmd = getCmdWithArgs(body),
		cbk = onSpeechDone.bind(this, {
			res: res,
			fields: body
		});

	if (!cmd) {
		cbk('Empty command generated');
	} else {
		exec(cmd, cbk);
	}
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

function onSpeechDone(args, err, stdout, stderr) {

	var res = args.res,
		fields = args.fields;

	if (!err) {
		res.end();
		return;
	}

	res.writeHead(500, {
		'content-type': 'text/plain'
	});
	res.write('error:\n\n');
	res.write(util.inspect(err) + '\n\n');
	res.write('received data:\n\n');
	res.end(util.inspect(fields));
}
