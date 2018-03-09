/**
MultiGet

Casey Loren Billman
3-8-18
*/
const fs = require('fs');
const http = require('http');
const url = require('url');

// options for use
const GET_OPTIONS = 
`url    - the location of the file
         eg. url=www.imgur.com/awesomeCatPhoto.jpg
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
  console.log('Usage:\n' + GET_OPTIONS);
  return;
}

let userOptions = {};
// check arguments
for (let i = 2; i < args.length; i += 1) {
  // split arg into key value pare
  const arg = args[i].split('=');
  userOptions[arg[0]] = arg[1];
}

if (!userOptions.url) {
  console.log('URL is required\n' + GET_OPTIONS);
  return;
}

const requestOptions = Object.assign(DEFAULT_OPTIONS, userOptions)
const parsedUrl = url.parse(requestOptions.url)

// get filename
const filename = parsedUrl.path.slice(parsedUrl.path.lastIndexOf('/') + 1);

const requestObject = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.path,
    agent: false,  // create a new agent just for this one request
    headers: {}
  }

let fileParts = [];
let completed = 0;
// get the parts of the file
for (let i = 0; i < requestOptions.num; i += 1) {
  const bytesStart = i * requestOptions.size;
  const bytesEnd = bytesStart + requestOptions.size - 1;
  const byteRange = `bytes=${bytesStart}-${bytesEnd}`;

  requestObject.headers.Range = byteRange;
  http.get(
    requestObject, 
    (res) => {
    if (res.statusCode !== 206) {
      throw new Error('Request Failed.\n' +
        `Status Code: ${res.statusCode}`);
    }

    res.setEncoding('binary');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      fileParts[i] = rawData;

      if (completed === Number(requestOptions.num) - 1) {
        writeFileToSystem(fileParts);
      } else {
        completed += 1;
      }
    });
  
  }
  );
}

// write the file passing in the array of parts
function writeFileToSystem(parts) {
  // combine the parts
  const fileCombined = fileParts.join('');
  // write the file
  fs.writeFile(filename, fileCombined, 'binary', (err) => {
    if (err) throw err;
    console.log(`File saved at ./${filename}`);
  });
}
