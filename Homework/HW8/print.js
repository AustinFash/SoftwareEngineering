const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// helper program to print out visitsdb.sqlite

const dbPath = path.join(__dirname, 'visitsdb.sqlite');

// open the database
let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        return console.error('Error opening database:', err.message);
    }
    console.log('Connected to the visitsdb.sqlite database.');
});

function printAllVisits() {
    console.log('Fetching all visits from the database...');

    db.serialize(() => {
        db.all("SELECT * FROM visits", [], (err, rows) => {
            if (err) {
                console.error('Error fetching visits:', err.message);
                return;
            }
            if (rows.length === 0) {
                console.log('No visits found in the database.');
            } else {
                console.log('Visits:');
                rows.forEach((row) => {
                    console.log(`ID: ${row.id}, Patient Name: ${row.patientName}, Visit Date: ${row.visitDate}, Description: ${row.description}, Attendee: ${row.attendee}, Start Date: ${row.dtstart}, Timestamp: ${row.dtstamp}, Method: ${row.method}, Status: ${row.status}, UID: ${row.uid}`);
                });
            }
        });
    });
}

// call the function to print all visits
printAllVisits();

// close the database connection after a short delay to ensure all operations complete
setTimeout(() => {
    db.close((err) => {
        if (err) {
            return console.error('Error closing database:', err.message);
        }
        console.log('Closed the database connection.');
    });
}, 1000); // adjust delay as necessary based on your environment
