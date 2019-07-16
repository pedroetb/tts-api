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

module.exports = {
	getCmdWithArgs: getCmdWithArgs
};
