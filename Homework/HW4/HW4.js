const fs = require('fs');
const ical = require('node-ical');
const prompt = require('prompt-sync')({ sigint: true });

const calendarFilePath = './appointments.ics';

function isDateValid(dateStr) {
    const regex = /^\d{4}-\d{2}-\d{2}$/; //YYYY-MM-DD formatting
    if (!dateStr.match(regex)) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
}

function isDateAvailable(date, appointments) {
    // convert to start of day for comparison
    const targetDate = new Date(date).setHours(0, 0, 0, 0);
    return !Object.values(appointments).some(appointment => {
        if (appointment.type === 'VEVENT') {
            const appointmentDate = new Date(appointment.start).setHours(0, 0, 0, 0);
            return targetDate === appointmentDate;
        }
        return false;
    });
}

function loadAppointments() {
    if (fs.existsSync(calendarFilePath)) {
        return ical.parseICS(fs.readFileSync(calendarFilePath, 'utf-8'));
    }
    return {};
}

function addAppointment(date, summary, appointments) {
    if (!isDateAvailable(date, appointments)) {
        console.log("Selected date is already booked. Please choose another date.");
        return;
    }

    const uid = `event-${Date.now()}`;
    const dtstamp = new Date().toISOString().replace(/-|:|\.\d+Z$/g, "");
    const dtstart = date.replace(/-/g, "");
    const event = [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${dtstart}`,
        `SUMMARY:${summary}`,
        "END:VEVENT"
    ].join("\r\n");

    // connect to .ics file or create a new one
    if (fs.existsSync(calendarFilePath)) {
        let fileContent = fs.readFileSync(calendarFilePath, 'utf-8');
        fileContent = fileContent.replace(/END:VCALENDAR$/, `${event}\r\nEND:VCALENDAR`);
        fs.writeFileSync(calendarFilePath, fileContent);
    } else {
        fs.writeFileSync(calendarFilePath, `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${event}\r\nEND:VCALENDAR`);
    }

    console.log("Appointment added successfully.");
}

function main() {
    const appointments = loadAppointments();

    let date;
    do {
        date = prompt('Enter the date for the appointment (YYYY-MM-DD): ');
        if (!isDateValid(date)) {
            console.log("Invalid date format. Please enter the date in YYYY-MM-DD format.");
        }
    } while (!isDateValid(date));

    const summary = prompt('Enter the summary of the appointment: ');
    addAppointment(date, summary, appointments);
}

main();
