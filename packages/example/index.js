const Client = require('../benchmark-client');
const server = require('../benchmark-server');

const client = Client();

const M = 1000000;

function DataSet(total, packageSize, fillData = null) {
	const packages = Math.round(total/packageSize);
	
	const dataSet = new Array(packages);
	dataSet.fill(Buffer.alloc(packageSize));

	return dataSet;
}

async function test() {
	await client.send(DataSet(800 * M, 8500));
	await client.send(DataSet(800 * M, 1400));
}

test();