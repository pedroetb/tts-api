function getCmdWithArgs(fields) {

	var voice = fields.voice;

	if (voice === 'google_speech') {
		return getGoogleSpeechCmdWithArgs(fields);
	} else if (voice === 'google_speech_file') {
		return getGoogleSpeechFileCmdWithArgs(fields);
	} else if (voice === 'gtts') {
		return getGttsCmdWithArgs(fields);
	} else if (voice === 'gtts_file') {
		return getGttsFileCmdWithArgs(fields);
	} else if (voice === 'festival') {
		return getFestivalCmdWithArgs(fields);
	} else if (voice === 'espeak') {
		return getEspeakCmdWithArgs(fields);
	} else if (voice === 'espeak_file') {
		return getEspeakFileCmdWithArgs(fields);
	}
}

function getGoogleSpeechCmdWithArgs(fields) {

	var text = fields.textToSpeech,
		language = fields.language,
		soxArgs = getSoxEffectsArgs(fields);

	var args = [
		'-l', language,
		text,
		'-v', 'warning'
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

function getGoogleSpeechFileCmdWithArgs(fields) {

	var text = fields.textToSpeech,
		language = fields.language,
		outputPath = getAudioFilePath('mp3');

	var args = [
		'-l', language,
		text,
		'-v', 'warning',
		'-o', outputPath
	];

	return {
		cmd: 'google_speech',
		args: args,
		file: outputPath
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

function getGttsFileCmdWithArgs(fields) {

	var text = fields.textToSpeech,
		language = fields.language,
		slowReadingParam = fields.slowReading ? '-s' : null,
		soxArgs = getSoxEffectsArgs(fields),
		outputPath = getAudioFilePath('mp3');

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
		'-',
		outputPath
	];

	if (soxArgs.length) {
		args1 = args1.concat(soxArgs);
	}

	return [{
		cmd: 'gtts-cli',
		args: args0
	},{
		cmd: 'sox',
		args: args1,
		file: outputPath
	}];
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
		voiceCode = fields.voiceCode || '',
		soxArgs = getSoxEffectsArgs(fields),
		voice = language;

	if (voiceCode) {
		voice += '+' + voiceCode;
	}

	var args0 = [
		'-v', voice,
		'--stdout',
		text
	];

	var args1 = [
		'-q',
		'-t', 'wav',
		'-'
	];

	if (soxArgs.length) {
		args1 = args1.concat(soxArgs);
	}

	return [{
		cmd: 'espeak',
		args: args0
	},{
		cmd: 'play',
		args: args1
	}];
}

function getEspeakFileCmdWithArgs(fields) {

	var text = fields.textToSpeech,
		language = fields.language,
		voiceCode = fields.voiceCode || '',
		soxArgs = getSoxEffectsArgs(fields),
		voice = language,
		outputPath = getAudioFilePath('mp3');

	if (voiceCode) {
		voice += '+' + voiceCode;
	}

	var args0 = [
		'-v', voice,
		'--stdout',
		text
	];

	var args1 = [
		'-q',
		'-t', 'wav',
		'-',
		'-t', 'mp3',
		outputPath
	];

	if (soxArgs.length) {
		args1 = args1.concat(soxArgs);
	}

	return [{
		cmd: 'espeak',
		args: args0
	},{
		cmd: 'sox',
		args: args1,
		file: outputPath
	}];
}

function getAudioFilePath(extension) {

	var fileName = Math.random().toString(35).substring(2, 10),
		workingDirectory = 'audio';

	return workingDirectory + '/' + fileName + '.' + extension;
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

	if (fields.robot) {
		args = args.concat(getSoxRobotVoiceArgs());
	}

	return args;
}

function getSoxRobotVoiceArgs() {

	return [
		'overdrive', '10',
		'echo', '0.8', '0.8', '5', '0.7',
		'echo', '0.8', '0.7', '6', '0.7',
		'echo', '0.8', '0.7', '10', '0.7',
		'echo', '0.8', '0.7', '12', '0.7',
		'echo', '0.8', '0.88', '12', '0.7',
		'echo', '0.8', '0.88', '30', '0.7',
		'echo', '0.6', '0.6', '60', '0.7',
		'gain', '8'
	];
}

module.exports = {
	getCmdWithArgs: getCmdWithArgs
};
