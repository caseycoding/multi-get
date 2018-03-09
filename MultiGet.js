/**
MultiGet

Casey Loren Billman
3-8-18
*/
const fs = require('fs');
const http = require('http');
const url = require('url');

// options for use
const GET_OPTIONS = `
source - the location of the file
         eg. source=www.imgur.com/awesomeCatPhoto.jpg
num    - the number of pices to use
         eg. num=4
output - the filename and location to output the file. defaults to ./output[filetype]
         eg. output=prettycat.jpg
`;

const DEFAULT_OPTIONS = {
  num: 4,
  output: './output',
  // size: 4359041,
  size: 1000000,
}

// handle arguments
const args = process.argv;
if (args.length < 3) {
  console.log('Not enough arguments\n' + GET_OPTIONS);
  return;
}

let userOptions = {};
// check arguments
for (let i = 2; i < args.length; i += 1) {
  // split arg into key value pare
  const arg = args[i].split('=');
  userOptions[arg[0]] = arg[1];
}
console.log(userOptions)

const requestOptions = Object.assign(DEFAULT_OPTIONS, userOptions)

const parsedUrl = url.parse(requestOptions.source)

// get filetype
const filename = parsedUrl.path.slice(parsedUrl.path.lastIndexOf('/') + 1);
console.log('filename', filename)

const requestObject = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.path,
    agent: false,  // create a new agent just for this one request
    headers: {}
  }

// const responseHandler = function(i, 


let fileParts = [];
let completed = 0;
// get the parts of the file
for (let i = 0; i < requestOptions.num; i += 1) {
  console.log('get!')
  const bytesStart = i * requestOptions.size;
  const bytesEnd = bytesStart + requestOptions.size - 1;
  const byteRange = `bytes=${bytesStart}-${bytesEnd}`;
  console.log(byteRange)

  requestObject.headers.Range = byteRange;
  http.get(
    requestObject, 
    (res) => {
    if (res.statusCode !== 206) {
      throw new Error('Request Failed.\n' +
        `Status Code: ${res.statusCode}`);
    }

    console.log(res.statusCode)

    res.setEncoding('binary');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      console.log('adding part', i);
      fileParts[i] = rawData;

      if (completed === Number(requestOptions.num) - 1) {
        console.log('call write')
        writeFileToSystem(fileParts);
      } else {
        completed += 1;
      }
    });
  
  }
  );
}

function writeFileToSystem(parts) {
  // combine the parts
  const fileCombined = fileParts.join('');
  console.log('part of it', fileCombined.slice(0, 10))
  // write the file
  fs.writeFile(filename, fileCombined, 'binary', (err) => {
    if (err) throw err;
    console.log(`Saved at ${filename}`);
  });
}


