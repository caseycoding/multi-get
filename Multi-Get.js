/*
 * Multi-Get
 * Casey Loren Billman
 * 3-8-18
 *
 * Summary:      Downloads a file from a remote server in chunks
 * Execution:    node Mult-Get.js url=[url] num=5 output=file size=1000000
 * Dependencies: Node.js
 * Assumptions:  This doesn't need to be exported to be used by another file. A class might look better for that.
*/
const fs = require('fs');
const http = require('http');
const url = require('url');

// command line options
const GET_OPTIONS =
`url    - location of the file
         eg. url=https://s3.us-east-2.amazonaws.com/dingodarksky/0007745_0007745-R1-E006.jpg
num    - the number of pices to use
         eg. num=4
output - the output filename and location of the file to write. Defaults to download output filename
         eg. output=dingo.jpg
size   - the size of the chunks in bytes
         eg. 1000000
`;

const DEFAULT_OPTIONS = {
  num: 4,
  size: 1000000,
};

// handle arguments
const args = process.argv;
if (args.length < 3) {
  console.log('Usage: node Mult-Get.js [options...] url=[url]\n' + GET_OPTIONS);
  process.exit(1);
}

// split args into tuples and save on object
const userArguments = {};
for (let i = 2; i < args.length; i += 1) {
  const arg = args[i].split('=');
  // cast num and size to number for later
  if (arg[0] === 'num' || arg[0] === 'size') {
    userArguments[arg[0]] = Number(arg[1]);
  } else {
    userArguments[arg[0]] = arg[1];
  }
}


if (!userArguments.url) {
  console.log('URL is required!\nUsage: node Mult-Get.js [options...] url=[url]\n' + GET_OPTIONS);
  process.exit(1);
}

// overwrite defaults with users arguments
const requestParams = Object.assign({}, DEFAULT_OPTIONS, userArguments);
const parsedUrl = url.parse(requestParams.url);

// get output filename
const outputFile = requestParams.output || parsedUrl.path.slice(parsedUrl.path.lastIndexOf('/') + 1);

const request = {
  hostname: parsedUrl.hostname,
  path: parsedUrl.path,
  agent: false,  // create a new agent just for this one request
  headers: {},
};

const fileChunks = [];
let completedChunks = 0;
// get the chunks of the file
for (let i = 0; i < requestParams.num; i += 1) {
  // copy request and set the range header
  const thisRequest = Object.assign({}, request);
  const bytesStart = i * requestParams.size;
  const bytesEnd = (bytesStart + requestParams.size) - 1;
  thisRequest.headers.Range = `bytes=${bytesStart}-${bytesEnd}`;

  http.get(thisRequest, addChunksToCollection(i, requestParams.num));
}

// creates a function to add a chunk to completed array at a specific index
function addChunksToCollection(idx, total) {
  return function getHandler(res) {
    if (res.statusCode !== 206) {  // 206: Partial Content
      throw new Error('Request Failed.\n' +
        `Status Code: ${res.statusCode}`);
    }

    res.setEncoding('binary');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      fileChunks[idx] = rawData;
      if (completedChunks === total - 1) {
        writeFileToSystem(fileChunks);
      } else {
        completedChunks += 1;
      }
    });
  };
}

// write the file passing in an array of the chunks of the file
function writeFileToSystem(chunks) {
  // combine the chunks
  const fileCombined = chunks.join('');
  // write the file
  fs.writeFile(outputFile, fileCombined, 'binary', (err) => {
    if (err) throw err;
    console.log(`File saved at ./${outputFile}`);
    process.exit(0);
  });
}
