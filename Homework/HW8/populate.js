const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./visitsdb.sqlite');

// helper program to populate the database


// helper functions
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const generateUID = () => `uid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const patients = ["Alice", "Bob", "Charlie", "Diana", "Evan", "Fiona", "George"];
const descriptions = ["General Checkup", "Dental Checkup", "Eye Examination", "ENT Checkup", "Orthopedic Consultation"];
const attendees = ["alice@example.com", "bob@example.com", "charlie@example.com", "diana@example.com", "evan@example.com", "fiona@example.com", "george@example.com"];

// generate and insert data
const insertData = () => {
  for (let i = 0; i < 10; i++) { // generates 10 entries
    const patientName = patients[getRandomInt(0, patients.length - 1)];
    const visitDate = getRandomDate(new Date(2022, 0, 1), new Date(2023, 11, 31)).toISOString().split('T')[0]; // format as YYYY-MM-DD
    const description = descriptions[getRandomInt(0, descriptions.length - 1)];
    const attendee = attendees[getRandomInt(0, attendees.length - 1)];
    const dtstart = visitDate;
    const dtstamp = new Date().toISOString();
    const uid = generateUID();

    db.run(`INSERT INTO visits (patientName, visitDate, description, attendee, dtstart, dtstamp, method, status, uid) VALUES (?, ?, ?, ?, ?, ?, 'REQUEST', 'CONFIRMED', ?)`,
      [patientName, visitDate, description, attendee, dtstart, dtstamp, uid], function(err) {
        if (err) {
          return console.error(err.message);
        }
        console.log(`A row has been inserted with rowid ${this.lastID}`);
      });
  }
};

db.serialize(() => {
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
  )`, insertData); 
});