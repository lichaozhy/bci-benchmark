const dgram = require('dgram');
const server = dgram.createSocket('udp4');

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
	package/s: ${total.count / total.spent}
	byte/s: ${total.size / total.spent}

	-------------------------------------

	last time:

	packages: ${last.count}
	bytes: ${last.size}
	averagePackageSize: ${last.size / last.count} byte
	spent: ${last.spent} ms
	package/s: ${last.count / last.spent}
	byte/s: ${last.size / last.spent}
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
	const time = Date.now();
	status.size += rinfo.size;

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

server.bind(41234, '127.0.0.1');