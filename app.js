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

		console.log('Listening at port', this.address().port);
	});

function renderForm(req, res) {

	var formView = 'form';
	res.render(formView);
}

function processData(req, res) {

	var body = req.body,
		cmdWithArgs = getCmdWithArgs(body) || {},
		httpArgs = {
			res: res,
			fields: body
		};

	if (cmdWithArgs instanceof Array) {
		runSpeechProcessChain(cmdWithArgs, httpArgs);
	} else {
		runLastSpeechProcess(cmdWithArgs, httpArgs);
	}
}

function getCmdWithArgs(fields) {

	var voice = fields.voice;

	if (voice === 'google_speech') {
		return getGoogleSpeechCmdWithArgs(fields);
	} else if (voice === 'gtts') {
		return getGttsCmdWithArgs(fields);
	} else if (voice === 'festival') {
		return getFestivalCmdWithArgs(fields);
	} else if (voice === 'espeak') {
		return getEspeakCmdWithArgs(fields);
	}
}

function getGoogleSpeechCmdWithArgs(fields) {

	var text = fields.textToSpeech,
		language = fields.language,
		soxArgs = getSoxEffectsArgs(fields);

	var args = [
		'-v', 'warning',
		'-l', language,
		text
	];

	if (soxArgs.length) {
		args.push('-e');
		args = args.concat(soxArgs);
	}

	return {
		cmd: 'google_speech',
		args: args
	};
}

function getGttsCmdWithArgs(fields) {

	var text = fields.textToSpeech,
		language = fields.language,
		slowReadingParam = fields.slowReading ? '-s' : null,
		soxArgs = getSoxEffectsArgs(fields);

	var args0 = [
		'-l', language,
		'--nocheck',
		text
	];

	if (slowReadingParam) {
		args0.unshift(slowReadingParam);
	}

	var args1 = [
		'-q',
		'-t', 'mp3',
		'-'
	];

	if (soxArgs.length) {
		args1 = args1.concat(soxArgs);
	}

	return [{
		cmd: 'gtts-cli',
		args: args0
	},{
		cmd: 'play',
		args: args1
	}];
}

function getSoxEffectsArgs(fields) {

	var availableParametrizedEffects = ['speed', 'pitch', 'tempo', 'gain', 'delay'],
		availableUnaryEffects = ['reverse', 'reverb'],
		args = [],
		i, effectName, effectValue;

	for (i = 0; i < availableParametrizedEffects.length; i++) {
		effectName = availableParametrizedEffects[i];
		effectValue = fields[effectName];

		if (effectValue !== undefined) {
			args.push(effectName, effectValue);
		}
	}

	for (i = 0; i < availableUnaryEffects.length; i++) {
		effectName = availableUnaryEffects[i];
		effectValue = fields[effectName];

		if (effectValue) {
			args.push(effectName);
		}
	}

	return args;
}

function getFestivalCmdWithArgs(fields) {

	var text = fields.textToSpeech,
		language = fields.language;

	return [{
		cmd: 'echo',
		args: [
			text
		]
	},{
		cmd: 'festival',
		args: [
			'--tts',
			'--language', language,
			'--heap', '1000000'
		]
	}];
}

function getEspeakCmdWithArgs(fields) {

	var text = fields.textToSpeech,
		language = fields.language,
		voiceCode = '+f4',
		voice = language + voiceCode,
		speed = Math.floor(fields.speed * 150),
		pitch = '70';

	return {
		cmd: 'espeak',
		args: [
			'-v', voice,
			'-s', speed,
			'-p', pitch,
			text
		]
	};
}

function runLastSpeechProcess(cmdWithArgs, httpArgs) {

	var speechProcess = runSpeechProcess(cmdWithArgs);

	speechProcess.on('error', onLastSpeechError.bind(this, httpArgs));
	speechProcess.on('close', onLastSpeechClose);
	speechProcess.on('exit', onLastSpeechExit.bind(this, httpArgs));

	return speechProcess;
}

function runSpeechProcess(cmdWithArgs) {

	var newProcess = childProcess.spawn(cmdWithArgs.cmd, cmdWithArgs.args);

	newProcess.stderr.on('data', onSpeechStandardError);

	return newProcess;
}

function onSpeechStandardError(buffer) {

	console.error('[stderr]:', buffer.toString('utf8'));
}

function runSpeechProcessChain(cmdWithArgs, httpArgs) {

	var speechProcs = {};

	for (var i = 0; i < cmdWithArgs.length; i++) {
		if (i !== cmdWithArgs.length - 1) {
			var getNextProcessCbk = getNextSpeechProcess.bind(speechProcs, i + 1);
			speechProcs[i] = runIntermediateSpeechProcess(cmdWithArgs[i], getNextProcessCbk);
		} else {
			speechProcs[i] = runLastSpeechProcess(cmdWithArgs[i], httpArgs);
		}
	}
}

function runIntermediateSpeechProcess(cmdWithArgs, procArgs) {

	var speechProcess = runSpeechProcess(cmdWithArgs);

	speechProcess.stdout.on('data', onIntermediateSpeechStandardOutput.bind(this, procArgs));
	speechProcess.on('error', onIntermediateSpeechError);
	speechProcess.on('close', onIntermediateSpeechClose.bind(this, procArgs));

	return speechProcess;
}

function getNextSpeechProcess(nextIndex) {

	return this[nextIndex];
}

function onIntermediateSpeechStandardOutput(getNextProc, data) {

	var nextSpeechProcess = getNextProc(),
		inputStream = nextSpeechProcess.stdin;

	if (inputStream.writable) {
		inputStream.write(data);
	}
}

function onIntermediateSpeechClose(getNextProc, code) {

	var nextSpeechProcess = getNextProc(),
		inputStream = nextSpeechProcess.stdin;

	if (code) {
		console.error('[intermediate exit code]:', code);
	}

	inputStream.end();
}

function onIntermediateSpeechError(err) {

	console.error('[intermediate error]:', util.inspect(err));
}

function onLastSpeechClose(code) {

	if (code) {
		console.error('[exit code]:', code);
	}
}

function onLastSpeechExit(args, err) {

	var res = args.res;

	if (!err) {
		res.end();
	} else {
		handleSpeechError(args, err);
	}
}

function onLastSpeechError(args, err) {

	handleSpeechError(args, err);
}

function handleSpeechError(args, err) {

	var res = args.res,
		fields = args.fields,
		errorHeaderMessage = '----[error]----',
		dataHeaderMessage = '-----[data]-----',
		inspectedError = util.inspect(err),
		inspectedFields = util.inspect(fields);

	res.writeHead(500, {
		'Content-Type': 'text/plain; charset=utf-8'
	});

	res.write(errorHeaderMessage + '\n');
	res.write(inspectedError + '\n');
	res.write(dataHeaderMessage + '\n');
	res.write(inspectedFields + '\n');

	res.end();

	console.error(errorHeaderMessage);
	console.error(inspectedError);
	console.error(dataHeaderMessage);
	console.error(inspectedFields);
}
