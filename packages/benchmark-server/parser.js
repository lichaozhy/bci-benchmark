const dataFrameSpec = {
	start: 1,
	time: 4,
	tag: 2,
	data: 96,
	verify: 1,
	end: 1
}

module.exports = function Parser() {
	const model = {};

	let prev = 0;
	let dataFrameLength = 0;
	
	Object.keys(dataFrameSpec).forEach(part => {
		const partLength = dataFrameSpec[part];
		dataFrameLength += partLength;
		const start = prev;
		const end = start + partLength;
		model[part] = {
			start: prev,
			end
		};

		prev = end;
	});

	return function parser(buffer) {
		const result = {
			length: dataFrameLength
		};

		Object.keys(model).forEach(partName => {
			const part = model[partName];
			result[partName] = buffer.slice(part.start, part.end);
		});

		return result;
	}
}