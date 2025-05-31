const request = require('supertest');
let serverInstance, app;

describe('HTTP Server Test', () => {
    beforeAll(done => {
        const { startServer } = require('../HW8');
        serverInstance = startServer(0, (server, port) => {
            app = request(`http://localhost:${port}`);
            done();
        });
    });

    afterAll(done => {
        serverInstance.close(done);
    });

    //test to add a successful reservation
    it('should successfully add a reservation with all required fields', async () => {
        const newReservation = {
            patientName: 'John Smith',
            visitDate: '2024-05-20',
            description: 'Routine check-up',
            attendee: 'john@example.com',
            dtstart: '2024-05-19T10:00:00Z'
        };

        await app.post('/add-reservation')
            .send(newReservation)
            .expect(201)
            .then(response => {
                expect(response.body.message).toBe('Reservation added successfully');
                expect(response.body.confirmationCode).toBeDefined();
            });
    });

    //test for cancel non-existent reservation
    it("should not cancel a non-existent reservation", async () => {
        const fakeConfirmationCode = "nonexistent-code";
        await app.post("/cancel-reservation")
            .send({ confirmationCode: fakeConfirmationCode })
            .expect(404)
            .then(response => {
                expect(response.body.message).toContain('Reservation not found');
            });
    });

    //test lookup for resergations by attendee
    it("should lookup reservations by attendee", async () => {
        await app.get("/lookup-reservations?attendee=test@example.com")
            .expect(200)
            .then(response => {
                expect(Array.isArray(response.body)).toBe(true);
            });
    });

    //test data handling properly
    it("should handle boundary date conditions correctly", async () => {
        const boundaryStartDate = "2023-01-01";
        const boundaryEndDate = "2025-01-01";
        const N = 1;

        await app.get(`/check-availability?startDate=${boundaryStartDate}&endDate=${boundaryEndDate}&N=${N}`)
            .expect(200)
            .then(response => {
                expect(response.body.availableDates.length).toBeLessThanOrEqual(N);
            });
    });

    //test badly formatted query strings
    it("should return 400 for badly formatted query strings", async () => {
        await app.get("/lookup-reservations?attendee=test@exampl")
            .expect(400);
    });


    //test should fail for reservation with missing information
    it('should fail to add a reservation due to missing information', async () => {
        const incompleteData = {
            patientName: "John Doe",
            visitDate: "2024-05-15",
            description: "Annual check-up"
            // Missing dtstart and attendee
        };

        await app.post("/add-reservation")
            .send(incompleteData)
            .expect(400)
            .then(response => {
                expect(response.body.message).toContain('Missing required reservation information');
            });
    });

    //test to check availabilty
    it('should check availability', async () => {
        const startDate = "2024-01-01";
        const endDate = "2024-01-10";
        const N = 6;

        await app.get(`/check-availability?startDate=${startDate}&endDate=${endDate}&N=${N}`)
            .expect(200)
            .then(response => {
                expect(response.body.availableDates.length).toBeLessThanOrEqual(N);
                response.body.availableDates.forEach(date => {
                    expect(date).toMatch(/\d{4}-\d{2}-\d{2}/); // cecks if dates are in the correct format
                });
            });
    });

    //test return empty array for nonexistent attendee
    it('should return empty array when looking up reservations for a nonexistent attendee', async () => {
        const nonexistentAttendeeEmail = "fakeemail@example.com";

        await app.get(`/lookup-reservations?attendee=${nonexistentAttendeeEmail}`)
            .expect(200)
            .then(response => {
                expect(response.body).toEqual([]); // expects an empty array
            });
    });

    //test for ensuring unsupported media types are rejected
    it('should return 415 Unsupported Media Type for adding a visit with wrong content type', async () => {
        const newVisit = { patientName: 'Jane Doe', visitDate: '2024-02-02', description: 'Routine check-up' };
        await app
            .post('/add-reservation')
            .send(JSON.stringify(newVisit))
            .set('Content-Type', 'text/plain')
            .expect(415);
    });

    // test for verifying method not allowed response
    it('should return 405 Method Not Allowed for POST requests to list visits', async () => {
        await app
            .post('/list-visits')
            .expect(405);
    });

    // test for handling OPTIONS preflight requests
    it('should return 204 No Content for OPTIONS preflight request on add-reservation', async () => {
        await app
            .options('/add-reservation')
            .expect(204);
    });

    // test visits cannot be added with a past visit date 
    it('should allow adding a visit with a past visit date', async () => {
        const pastVisit = { patientName: 'Past Test', visitDate: '2020-01-01', description: 'Past visit' };
        await app
            .post('/add-reservation')
            .send(pastVisit)
            .set('Content-Type', 'application/json')
            .expect(400);
    });

    //test unexpected fields in the request body throw an error
    it('should add a visit unsuccessfully with extra fields in the request', async () => {
        const visitWithExtraField = { patientName: 'Extra Field Test', visitDate: '2024-04-04', description: 'Extra field visit', extraField: 'ignored' };
        await app
            .post('/add-reservation')
            .send(visitWithExtraField)
            .set('Content-Type', 'application/json')
            .expect(400);
    });

    // test for rejecting unsupported Content-Type like application/xml
    it('should return 415 Unsupported Media Type for Content-Type application/xml', async () => {
        const xmlData = '<visit><patientName>XML Test</patientName><visitDate>2024-06-06</visitDate><description>XML data</description></visit>';
        await app
            .post('/add-reservation')
            .send(xmlData)
            .set('Content-Type', 'application/xml')
            .expect(415);
    });

    // test visits cannot be added with invalid JSON structures
    it('should return 400 Bad Request for adding a visit with invalid JSON structure', async () => {
        const invalidJSON = "{ patientName: 'No quotes on keys', visitDate: '2024-01-01', description: 'Invalid JSON' }";
        await app
            .post('/add-reservation')
            .send(invalidJSON)
            .set('Content-Type', 'application/json')
            .expect(400);
    });

    //test for rejecting wrong request type
    it('should return 405 Method Not Allowed for POST requests to list-visits', async () => {
        await app
            .post('/list-visits')
            .expect(405)
            .then(response => {
                expect(response.body.message).toContain('Method Not Allowed');
            });
    });


})