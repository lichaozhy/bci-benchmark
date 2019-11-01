const config = {
	port: 41234,
	parse: true
};

const reg = /--(\S+)=(\S+)/;
const argv = {};
process.argv.forEach(item => {
	const result = item.match(reg);
	if (result) {
		argv[result[1]] = result[2];
	}
});

if (argv.port) {
	config.port = Number(argv.port);
}

if (argv.parse) {
	if (argv.parse === 'true') {
		config.parse = true;
	} else {
		config.parse = false;
	}
}


console.log(config);

const dgram = require('dgram');
const DataParser = require('./parser');
const server = dgram.createSocket('udp4');


const K = Math.pow(1024, 1);
const M = Math.pow(1024, 2);
const G = Math.pow(1024, 3);

function Speedometer(period) {
	let intervalId = null;
	let total = 0;

	function push(piece) {
		total += piece;
	}

	function reset() {
		total = 0;
	}

	function stop() {
		if (intervalId) {
			clearInterval(intervalId);
		}
		reset();
	}

	function start() {
		stop();
		intervalId = setInterval(() => {
			const speed = total / (period / 1000);
			console.log(`${speed / M} MB/s`);
			reset();
		}, period);
	}

	return {
		push,
		stop,
		start
	}
}

const parser = DataParser();
const speedometer = Speedometer(1000);
speedometer.start();
const data = {};
const array = [];
const record = [];

const status = {
	count: 0,
	size: 0,
	timeOutId: null,
	lastStartTime: null
};

function resetStatus() {
	status.count = 0;
	status.size = 0;
	status.timeOutId = null;
	status.lastStartTime = null;
}

function showStatistic() {
	const length = record.length;
	const last = record[length - 1];

	const total = {
		count: 0,
		size: 0,
		spent: 0
	}
	record.forEach(item => {
		total.count += item.count;
		total.size += item.size;
		total.spent += item.spent;
	});

	const message = `
	=====================================
	total of ${length} time:

	packages: ${total.count}
	bytes: ${total.size}
	spent: ${total.spent} ms

	average of ${length} time:

	packageSize: ${total.size / total.count} byte
	spent: ${total.spent / length} ms
	delay: ${total.spent / total.count} ms
	package/s: ${total.count / (total.spent / 1000)}
	MB/s: ${(total.size / (total.spent / 1000) / M)}

	-------------------------------------

	last time:

	packages: ${last.count}
	bytes: ${last.size}
	averagePackageSize: ${last.size / last.count} byte
	spent: ${last.spent} ms
	delay: ${last.spent / last.count} ms
	package/s: ${last.count / (last.spent / 1000)}
	MB/s: ${(last.size / (last.spent / 1000) / M)}
	=====================================
	`;

	console.log(message);
}

function EndFactory(time) {
	return function end() {
		record.push({
			startTime: status.lastStartTime,
			endTime: time,
			spent: time - status.lastStartTime,
			count: status.count,
			size: status.size
		});

		showStatistic();
		resetStatus();
	}
}

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
	const { size } = rinfo;
	if (config.parse) {
		const result = parser(msg);
		data[Date.now()] = result;
		// array.push(result);
	}

	speedometer.push(size);

	const time = Date.now();
	status.size += size;

	if (!status.timeOutId) {
		status.lastStartTime = time;
	} else {
		clearTimeout(status.timeOutId);
	}
	
	status.timeOutId = setTimeout(EndFactory(time), 1000);

  status.count++;
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(config.port, '127.0.0.1');