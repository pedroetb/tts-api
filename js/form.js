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
			namedInput = inputs[inputName];

		if (namedInput) {
			inputValues[inputName] = namedInput.value;
		}
	}

	return inputValues;
}

function submitData(data) {

	alertify.message('Speaking...');
	fetch('/', {
		method: 'post',
		headers: new Headers({
			'Content-Type': 'application/json'
		}),
		body: JSON.stringify(data)
	}).then(function(res) {

		if (res.ok) {
			alertify.success('Speech done!');
		} else {
			alertify.error('Speech error!');
		}
	}).catch(function(err) {

		alertify.error('Connection error!');
	});
}
