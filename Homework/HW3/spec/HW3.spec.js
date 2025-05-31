const fs = require('fs');
const { parseICalendar } = require('../HW3.js');

// Test iCalendar Parser
describe("iCalendar Parser", () => {
    let filePath;

    // create temporary iCalendar file with valid content
    beforeAll(() => {
        const fileContent = `
            BEGIN:VCALENDAR
            VERSION:2.0
            PRODID:-//Example Inc.//Example Calendar//EN
            METHOD:REQUEST
            BEGIN:VEVENT
            UID:1234567890
            DTSTAMP:20240212T120000Z
            DTSTART:20240215T090000Z
            DTEND:20240215T100000Z
            SUMMARY:Doctor Appointment
            LOCATION:Doctor's Office
            DESCRIPTION:Regular check-up
            STATUS:CONFIRMED
            ATTENDEE:patient@example.com
            ORGANIZER:doctor@example.com
            END:VEVENT
            END:VCALENDAR`;
            
        filePath = 'test.ics';
        fs.writeFileSync(filePath, fileContent);
    });

    // remove the temporary iCalendar file
    afterAll(() => {
        fs.unlinkSync(filePath);
    });

    // Test case, return valid message for a valid iCalendar file
    it("should return valid message for a valid iCalendar file", () => {
        const result = parseICalendar(filePath);
        expect(result.isValid).toBe(true);
        expect(result.message).toEqual("iCalendar file is valid");
    });

    // Test case, return error for missing VCALENDAR component
    it("should return error for missing VCALENDAR component", () => {
        const fileContent = "INVALID CONTENT";
        fs.writeFileSync(filePath, fileContent);
        const result = parseICalendar(filePath);
        expect(result.isValid).toBe(false);
        expect(result.message).toEqual("Invalid iCalendar format: BEGIN:VCALENDAR or END:VCALENDAR missing");
    });

    // Test case, return error for missing required properties in VCALENDAR component
    it("should return error for missing required properties in VCALENDAR component", () => {
        const fileContent = `
            BEGIN:VCALENDAR
            VERSION:2.0
            END:VCALENDAR`;
        fs.writeFileSync(filePath, fileContent);
        const result = parseICalendar(filePath);
        expect(result.isValid).toBe(false);
        expect(result.message).toEqual("Missing properties in VCALENDAR component: PRODID, METHOD");
    });

    // Test case, return error for missing VEVENT component
    it("should return error for missing VEVENT component", () => {
        const fileContent = `
            BEGIN:VCALENDAR
            VERSION:2.0
            PRODID:-//Example Inc.//Example Calendar//EN
            METHOD:REQUEST
            END:VCALENDAR`;
        fs.writeFileSync(filePath, fileContent);
        const result = parseICalendar(filePath);
        expect(result.isValid).toBe(false);
        expect(result.message).toEqual("VEVENT component not found");
    });

    // Test case, return error for missing required properties in VEVENT component
    it("should return error for missing required properties in VEVENT component", () => {
        const fileContent = `
            BEGIN:VCALENDAR
            VERSION:2.0
            PRODID:-//Example Inc.//Example Calendar//EN
            METHOD:REQUEST
            BEGIN:VEVENT
            END:VEVENT
            END:VCALENDAR`;
        fs.writeFileSync(filePath, fileContent);
        const result = parseICalendar(filePath);
        expect(result.isValid).toBe(false);
        expect(result.message).toEqual("Missing properties in VEVENT component: ATTENDEE, DTSTART, DTSTAMP, STATUS");
    });

    // Test case, return error for invalid datetime format
    it("should return error for invalid datetime format", () => {
        const fileContent = `
            BEGIN:VCALENDAR
            VERSION:2.0
            PRODID:-//Example Inc.//Example Calendar//EN
            METHOD:REQUEST
            BEGIN:VEVENT
            UID:1234567890
            DTSTAMP:INVALID_TIMESTAMP
            DTSTART:20240215T090000Z
            DTEND:20240215T100000Z
            SUMMARY:Doctor Appointment
            LOCATION:Doctor's Office
            DESCRIPTION:Regular check-up
            STATUS:CONFIRMED
            ATTENDEE:patient@example.com
            ORGANIZER:doctor@example.com
            END:VEVENT
            END:VCALENDAR`;
        fs.writeFileSync(filePath, fileContent);
        const result = parseICalendar(filePath);
        expect(result.isValid).toBe(false);
        expect(result.message).toEqual("Invalid datetime format for DTSTAMP");
    });
});
