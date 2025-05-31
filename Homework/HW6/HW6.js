const http = require('http');
const sqlite3 = require('sqlite3').verbose();

//create SQLite database in memory for storing visit data
let db = new sqlite3.Database(':memory:', err => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');
        //create visits table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientName TEXT NOT NULL,
            visitDate TEXT NOT NULL,
            description TEXT
        )`);
    }
});

//request handler function for the HTTP server
const requestHandler = (req, res) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    //setup CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');

    //handle OPTIONS method for CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    //add a visit with POST request
    if (pathname === '/add-visit' && req.method === 'POST') {
        // Ensure content type is JSON
        if (req.headers['content-type'] !== 'application/json') {
            res.writeHead(415);
            res.end('Unsupported Media Type');
            return;
        }

        //collect request body data
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const visit = JSON.parse(body);
                //validate required fields
                if (!visit.patientName || !visit.visitDate || !visit.description) {
                    res.writeHead(400);
                    res.end('Bad Request: Missing required visit information');
                    return;
                }
                //insert visit into the database
                db.run(`INSERT INTO visits (patientName, visitDate, description) VALUES (?, ?, ?)`, 
                [visit.patientName, visit.visitDate, visit.description], function(err) {
                    if (err) {
                        res.writeHead(400);
                        res.end(`Database error: ${err.message}`);
                        return;
                    }
                    //respond with success message and the ID of the inserted visit
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Visit added successfully', id: this.lastID }));
                });
            } catch (error) {
                //handle JSON parsing errors
                res.writeHead(400);
                res.end('Bad Request: Invalid JSON');
            }
        });
        return;
    } else if (pathname === '/list-visits' && req.method === 'GET') {
        //list all visits
        db.all(`SELECT * FROM visits`, [], (err, rows) => {
            if (err) {
                res.writeHead(400);
                res.end(`Database error: ${err.message}`);
                return;
            }
            //respond with the list of visits
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        });
        return;
    } else {
        //handle unsupported methods for specific routes
        if (pathname === '/list-visits' && req.method === 'POST') {
            res.writeHead(405);
            res.end('Method Not Allowed');
            return;
        }

        //handle not found for undefined routes
        res.writeHead(404);
        res.end('Not Found');
    }
};

let server;

//start the server on a specified port
function startServer(port = 3000, callback) {
    server = http.createServer(requestHandler);
    server.listen(port, callback);
    return server;
}

//stop the server
function stopServer(callback) {
    server.close(callback);
}


startServer()

module.exports = { startServer, stopServer };
