const dgram = require('dgram');
const client = dgram.createSocket('udp4');

const TOTAL = 800 * 10000000;
const PACKAGES_SIZE = 8500;
const PACKAGES = Math.round(TOTAL/PACKAGES_SIZE);

let count = 0;

console.log('total package', PACKAGES);

const dataSet = new Array(PACKAGES);
dataSet.fill(Buffer.alloc(PACKAGES_SIZE));

client.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  client.close();
});

client.on('listening', () => {
  const address = client.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

console.time('send');

dataSet.forEach(data => {
	client.send(data, 41234, '127.0.0.1', (error, bytes) => {
		count++;
		if (count === PACKAGES) {
			console.timeEnd('send');
			client.close();
		}
	});
});