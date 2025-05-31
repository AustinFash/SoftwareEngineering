function isDateValid(dateStr) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateStr.match(regex)) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
}

let appointments = []; //test appointment storage

function addAppointment(date, summary) {
    if (!isDateValid(date) || appointments.includes(date)) {
        return false; //invalid date or double booking testing
    }
    appointments.push(date); //storing the appointment testing
    return true;
}

// exports for testing
module.exports = { isDateValid, addAppointment };

//jasmine tests
describe("Appointment System", () => {
    describe("Date Validator", () => {
        it("validates correct date format", () => {
            expect(isDateValid("2023-01-01")).toBe(true);
        });

        it("invalidates incorrect date format", () => {
            expect(isDateValid("2023/01/01")).toBe(false);
        });

        it("invalidates non-date strings", () => {
            expect(isDateValid("NotADate")).toBe(false);
        });

        it("invalidates dates with wrong month", () => {
            expect(isDateValid("2023-13-01")).toBe(false); //13th month
        });
    });

    describe("Appointment Creation", () => {
        beforeEach(() => {
            //reset appointments before each test
            appointments = [];
        });

        it("allows adding a valid appointment", () => {
            expect(addAppointment("2023-01-01", "Doctor's Visit")).toBe(true);
        });

        it("prevents double booking", () => {
            addAppointment("2023-01-02", "Doctor's Visit");
            expect(addAppointment("2023-01-02", "Another Visit")).toBe(false);
        });
    });
});
