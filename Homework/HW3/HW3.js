const fs = require('fs');

const propertyPatt = /^([A-Za-z0-9-]+):(.*)$/;
const datePatt = /^(\d{8}T\d{6}Z)$/;

//function to parse the calender file
function parseICalendar(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8').split('\n');

    //checking file contents
    if (fileContent[0].trim() !== 'BEGIN:VCALENDAR' || fileContent[fileContent.length - 1].trim() !== 'END:VCALENDAR') {
        return { isValid: false, message: "Invalid iCalendar format: BEGIN:VCALENDAR or END:VCALENDAR missing" };
    }

    //check prop
    const vcalenderprop = new Set();
    for (let i = 1; i < fileContent.length - 1; i++) {
        const match = fileContent[i].trim().match(propertyPatt);
        if (match) {
            const propName = match[1];
            const propValue = match[2];
            vcalenderprop.add(propName);
        }
    }

    const reqVCalenderProp = new Set(['PRODID', 'VERSION', 'METHOD']);
    const missVCalenderProp = [...reqVCalenderProp].filter(prop => !vcalenderprop.has(prop));
    if (missVCalenderProp.length > 0) {
        return { isValid: false, message: `Missing properties in VCALENDAR component: ${missVCalenderProp.join(', ')}` };
    }


    let veventFound = false;
    for (let i = 1; i < fileContent.length - 1; i++) {
        if (fileContent[i].trim() === 'BEGIN:VEVENT') {
            veventFound = true;
            break;
        }
    }
    //check veventfound
    if (!veventFound) {
        return { isValid: false, message: "VEVENT component not found" };
    }

    const reqVEventProp = new Set(['ATTENDEE', 'DTSTART', 'DTSTAMP', 'STATUS']);
    const vEventProp = new Set();
    for (let i = fileContent.indexOf('BEGIN:VEVENT') + 1; i < fileContent.indexOf('END:VEVENT'); i++) {
        const match = fileContent[i].trim().match(propertyPatt);
        if (match) {
            const propName = match[1];
            const propValue = match[2];
            vEventProp.add(propName);

            // Check date/time properties format
            if (['DTSTART', 'DTSTAMP'].includes(propName)) {
                if (!isValidDateTimeFormat(propValue.trim())) {
                    return { isValid: false, message: `Invalid datetime format for ${propName}` };
                }
            }
        }
    }
    //check miss event prop
    const missEventProp = [...reqVEventProp].filter(prop => !vEventProp.has(prop));
    if (missEventProp.length > 0) {
        return { isValid: false, message: `Missing properties in VEVENT component: ${missEventProp.join(', ')}` };
    }

    return { isValid: true, message: "iCalendar file is valid" };
}

function isValidDateTimeFormat(dateTimeString) {
    return datePatt.test(dateTimeString);
}

module.exports = { parseICalendar };
