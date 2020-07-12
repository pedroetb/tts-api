var util = require('util'),
	childProcess = require('child_process'),
	express = require('express'),
	bodyParser = require('body-parser'),

	cmd = require('./cmd'),

	server = express(),
	port = process.env.PORT || 3000;

server.set('view engine', 'pug')
	.use(bodyParser.json())

	.use('/css/bootstrap', express.static(__dirname + '/../node_modules/bootstrap/dist/css'))
	.use('/css/alertify', express.static(__dirname + '/../node_modules/alertifyjs/build/css'))
	.use('/css/alertify', express.static(__dirname + '/../node_modules/alertifyjs/build/css/themes'))
	.use('/js', express.static(__dirname + '/../js'))
	.use('/js/alertify', express.static(__dirname + '/../node_modules/alertifyjs/build'))

	.get('/', renderForm)
	.post('/', processData)

	.listen(port, function() {

		console.log('Listening at port', this.address().port);
	});

function renderForm(req, res) {

	res.render('index');
}

function processData(req, res) {

	var body = req.body,
		cmdWithArgs = cmd.getCmdWithArgs(body) || {},
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

function runLastSpeechProcess(cmdWithArgs, httpArgs) {

	var speechProcess = runSpeechProcess(cmdWithArgs);

	speechProcess.on('error', onLastSpeechError.bind(this, httpArgs));
	speechProcess.on('close', onLastSpeechClose);
	speechProcess.on('exit', onLastSpeechExit.bind(this, cmdWithArgs, httpArgs));

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

function onLastSpeechExit(cmdWithArgs, httpArgs, err) {

	var res = httpArgs.res,
		filePath = cmdWithArgs.file;

	if (!err) {
		if (filePath) {
			res.download(filePath);
		} else {
			res.end();
		}
	} else {
		handleSpeechError(httpArgs, err);
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
