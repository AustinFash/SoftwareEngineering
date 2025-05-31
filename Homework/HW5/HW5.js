const http = require('http');

//function to parse JSON data
const parseJson = (data) => {
    try {
        return JSON.parse(data);
    } catch {
        throw new Error('Invalid JSON');
    }
};

//function to parse URL-encoded data
const parseUrlEncoded = (data) => {
    return Object.fromEntries(new URLSearchParams(data));
};

//supported content-type parsing functions
const parsers = {
    'application/json': parseJson,
    'application/x-www-form-urlencoded': parseUrlEncoded,
    'text/plain': (data) => data, //no parsing needed, echo back directly
};

const server = http.createServer((req, res) => {
    if (req.method !== 'POST') {
        res.statusCode = 405; //method Not Allowed
        res.end('Only POST method is supported');
        return;
    }

    const contentType = req.headers['content-type'];
    if (!parsers[contentType]) {
        res.statusCode = 415; //unsupported media type
        res.setHeader('Content-Type', 'text/plain');
        res.end(`Unsupported Content-Type. Supported types: ${Object.keys(parsers).join(', ')}`);
        return;
    }

    let rawData = '';
    req.on('data', chunk => rawData += chunk);
    req.on('end', () => {
        try {
            const parsedData = parsers[contentType](rawData);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsedData)); //echo back parsed data
        } catch (error) {
            res.statusCode = 400; //bad Request
            res.setHeader('Content-Type', 'text/plain');
            res.end('Bad request: Error parsing the body');
        }
    });
});

//export server 
module.exports = server;
