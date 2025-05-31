const http = require('http');
const sqlite3 = require('sqlite3').verbose();



const sendJSON = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

// function for request handling
function requestHandler(req, res) {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const pathname = urlObj.pathname;
    const method = req.method;

    // setup to handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // define allowed methods for each route
    const methodRoutes = {
        '/add-reservation': ['POST'],
        '/lookup-reservations': ['GET'],
        '/cancel-reservation': ['POST'],
        '/check-availability': ['GET']
    };

    const allowedMethods = methodRoutes[pathname];
    if (!allowedMethods || !allowedMethods.includes(method)) {
        return sendJSON(res, 405, { message: 'Method Not Allowed' });
    }

    // route handling logic
    if (pathname === '/add-reservation' && method === 'POST') {
        handleAddReservation(req, res);
    } else if (pathname === '/lookup-reservations' && method === 'GET') {
        handleLookupReservations(req, res);
    } else if (pathname === '/cancel-reservation' && method === 'POST') {
        handleCancelReservation(req, res);
    } else if (pathname === '/check-availability' && method === 'GET') {
        handleCheckAvailability(req, res);
    } else {
        sendJSON(res, 404, { message: 'Route not found' });
    }
}

//function to initialize and configure the SQLite database
const initializeDatabase = () => {
    const db = new sqlite3.Database('./visitsdb.sqlite', err => {
        if (err) {
            console.error(err.message);
            throw new Error('Failed to connect to the SQLite database.');
        } else {
            console.log('Connected to the visits SQLite database.');
        }
    });

    // creating table
    db.run(`CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientName TEXT NOT NULL,
        visitDate TEXT NOT NULL,
        description TEXT,
        attendee TEXT,
        dtstart TEXT,
        dtstamp TEXT,
        method TEXT DEFAULT 'REQUEST',
        status TEXT DEFAULT 'CONFIRMED',
        uid TEXT
    )`, err => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Table setup completed successfully or already exists.');
        }
    });

    return db;
};

const db = initializeDatabase();

// sub function for check availability function
function getAvailableDates(startDate, endDate, N, callback) {
    // initialize a set to keep track of booked dates
    const bookedDates = new Set();
    // prepare an array to store the N available dates found
    let availableDates = [];

    // convert the start and end dates from strings to Date objects
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    // serialize database operations to ensure they execute in order
    db.serialize(() => {
        // query the database for booked dates within the given range
        db.all(`SELECT visitDate FROM visits WHERE visitDate BETWEEN ? AND ?`, [startDate, endDate], (err, rows) => {
            if (err) {
                // if an error occurs, call the callback with the error
                return callback(err, null);
            }

            // add each booked date to the set
            rows.forEach(row => {
                bookedDates.add(row.visitDate);
            });

            // compute available dates, skipping over weekends and booked dates
            while (currentDate <= end && availableDates.length < N) {
                const formattedDate = currentDate.toISOString().split('T')[0];

                // check if the current date is a weekend
                if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
                    currentDate.setDate(currentDate.getDate() + 1);
                    continue;
                }

                // check if the date is already booked
                if (!bookedDates.has(formattedDate)) {
                    // if the date is not booked, add it to the available dates array
                    availableDates.push(formattedDate);
                }

                // move to the next day
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // once all available dates are calculated or the end date is reached, call the callback with the results
            callback(null, availableDates);
        });
    });
}

// sub function for add reservation request
function handleAddReservation(req, res) {
    if (req.headers['content-type'] !== 'application/json') {
        return sendJSON(res, 415, { message: 'Unsupported Media Type' });
    }

    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
        try {
            const reservation = JSON.parse(body);

            // validate the required fields
            if (!reservation.patientName || !reservation.visitDate || !reservation.description || !reservation.attendee || !reservation.dtstart) {
                return sendJSON(res, 400, { message: 'Bad Request: Missing required reservation information' });
            }

            // generate dtstamp at the moment of insertion
            const dtstamp = new Date().toISOString();

            // generate a unique identifier (UID) for each reservation
            const uid = `uid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // insert the reservation into the database
            db.run(`INSERT INTO visits (patientName, visitDate, description, attendee, dtstart, dtstamp, method, status, uid) VALUES (?, ?, ?, ?, ?, ?, 'REQUEST', 'CONFIRMED', ?)`,
                [reservation.patientName, reservation.visitDate, reservation.description, reservation.attendee, reservation.dtstart, dtstamp, uid], function (err) {
                    if (err) {
                        console.error(`Database error: ${err.message}`);
                        return sendJSON(res, 500, { message: `Database error: ${err.message}` });
                    }
                    // respond with success message including the unique confirmation code (UID)
                    sendJSON(res, 201, { message: 'Reservation added successfully', confirmationCode: uid });
                });
        } catch (error) {
            console.error('Error parsing JSON:', error);
            sendJSON(res, 400, { message: 'Bad Request: Invalid JSON' });
        }
    });
    return;
}

// sub function for check availability reservation request
function handleCheckAvailability(req, res) {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const startDate = urlObj.searchParams.get('startDate');
    const endDate = urlObj.searchParams.get('endDate');
    const numDates = parseInt(urlObj.searchParams.get('N'), 10);

    // check the required parameters are provided
    if (!startDate || !endDate || isNaN(numDates)) {
        return sendJSON(res, 400, { message: 'Bad Request: Missing or invalid query parameters' });
    }

    // call getAvailableDates function
    getAvailableDates(startDate, endDate, numDates, (err, availableDates) => {
        if (err) {
            console.error(err);
            return sendJSON(res, 500, { message: 'Internal Server Error' });
        }
        sendJSON(res, 200, { availableDates });
    });

    return;
}

// sub function for cancel reservation request
function handleCancelReservation(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
        let parsedBody;
        try {
            parsedBody = JSON.parse(body);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return sendJSON(res, 400, { message: 'Bad Request: Invalid JSON format' });
        }

        const confirmationCode = parsedBody.confirmationCode;
        if (!confirmationCode) {
            return sendJSON(res, 400, { message: 'Bad Request: Missing confirmation code' });
        }

        // check if the reservation exists and is not already cancelled
        db.get("SELECT * FROM visits WHERE uid = ? AND status <> 'CANCELLED'", [confirmationCode], (err, row) => {
            if (err) {
                console.error('Database error when finding reservation:', err);
                return sendJSON(res, 500, { message: 'Internal Server Error: Error finding reservation' });
            }
            if (!row) {
                return sendJSON(res, 404, { message: 'Reservation not found or already canceled' });
            }

            // proceed to delete the reservation from visits database
            db.run("DELETE FROM visits WHERE uid = ?", [confirmationCode], (err) => {
                if (err) {
                    console.error('Error deleting reservation:', err);
                    return sendJSON(res, 500, { message: 'Internal Server Error: Error deleting reservation' });
                }

                // send the response to the client
                sendJSON(res, 200, { message: 'Reservation canceled successfully.' });
            });
        });
    });
    return;
}

// sub function for lookup reservation request
function handleLookupReservations(req, res) {
    const attendee = new URL(req.url, `http://${req.headers.host}`).searchParams.get('attendee');

    // check if the 'attendee' parameter was provided in the query
    if (!attendee) {
        return sendJSON(res, 400, { message: 'Bad Request: Missing attendee identifier' });
    }

    // validate email format for 'attendee'
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(attendee)) {
        return sendJSON(res, 400, { message: 'Bad Request: Malformed email address' });
    }

    let sql = `SELECT * FROM visits WHERE attendee = ?`;
    db.all(sql, [attendee], (err, rows) => {
        if (err) {
            console.error(err);
            return sendJSON(res, 500, { message: 'Internal Server Error' });
        }
        sendJSON(res, 200, rows);
    });
}

let server;

// function to start server
function startServer(port = 3000, callback) {
    server = http.createServer(requestHandler);
    server.listen(port, () => {
        const actualPort = server.address().port;
        console.log(`Server running on port ${actualPort}`);
        if (callback) callback(server, actualPort); // Pass the server and port back to the callback
    });
    return server;
}

// function to stop server
function stopServer(callback) {
    if (server) {
        server.close(() => {
            console.log('Server stopped');
            if (callback) callback();
        });
    }
}

module.exports = { startServer, stopServer };


// check if the file is being run directly to start the server
if (require.main === module) {
    startServer();
}
