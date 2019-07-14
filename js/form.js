var disabledInputIds;

function onVoiceChange(voiceItem) {

	if (disabledInputIds) {
		updateInputsDisabledState(disabledInputIds, false);
		disabledInputIds = null;
	}

	var incompatibleSettings = voiceItem.incompatibleSettings;
	if (incompatibleSettings && incompatibleSettings instanceof Array) {
		updateInputsDisabledState(incompatibleSettings, true);
		disabledInputIds = incompatibleSettings;
	}
}

function updateInputsDisabledState(inputIds, disable) {

	for (var i = 0; i < inputIds.length; i++) {
		var input = document.getElementById(inputIds[i]);
		if (disable) {
			input.setAttribute('disabled', '');
		} else {
			input.removeAttribute('disabled');
		}
	}
}

function onSubmit(evt) {

	var form = document.forms[0];

	if (!form || !form.checkValidity()) {
		return;
	}

	evt.preventDefault();

	var value = getInputValues(form);
	submitData(value);
}

function getInputValues(form) {

	var inputs = form.elements,
		inputValues = {};

	for (var i = 0; i < inputs.length; i++) {
		var input = inputs[i],
			inputName = input.name,
			inputType = input.type,
			inputValueAlreadySet = !!inputValues[inputName];

		if (inputValueAlreadySet) {
			continue;
		}

		var namedInput = inputs[inputName],
			inputIsDisabled = !(!disabledInputIds || disabledInputIds.indexOf(inputName) === -1);

		if (!namedInput || inputIsDisabled) {
			continue;
		}

		inputValues[inputName] = inputType === 'checkbox' ? namedInput.checked : namedInput.value;
	}

	return inputValues;
}

function submitData(data) {

	alertify.set('notifier', 'position', 'top-right');
	var startMessageHandler = alertify.message('Speaking...', 0);

	fetch('/', {
		method: 'post',
		headers: new Headers({
			'Content-Type': 'application/json'
		}),
		body: JSON.stringify(data)
	}).then((function(startMessageHandler, res) {

		startMessageHandler.dismiss();
		if (res.ok) {
			alertify.success('Speech done!');
		} else {
			alertify.error('Speech error!');
		}
	}).bind(null, startMessageHandler))
	.catch((function(startMessageHandler, err) {

		startMessageHandler.dismiss();
		alertify.error('Connection error!');
	}).bind(null, startMessageHandler));
}
