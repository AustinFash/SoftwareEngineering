const request = require('supertest');
const { startServer, stopServer } = require('../HW6');

describe('HTTP Server Test', () => {
    let app;
    let serverInstance;

    //before all tests, start the server instance on a dynamically assigned port
    beforeAll(done => {
        serverInstance = startServer(0, () => {
            const port = serverInstance.address().port;
            // 'app' is now set up to make requests to the server
            app = request(`http://localhost:${port}`);
            done();
        });
    });

    //after all tests, ensure to stop the server to free up resources
    afterAll(done => {
        stopServer(done);
    });

    //test for verifying handling of incomplete visit data
    it('should return 400 Bad Request for adding a visit with incomplete data', async () => {
        const incompleteVisit = { patientName: 'Jane Doe' }; // Missing visitDate and description
        await app.post('/add-visit').send(incompleteVisit).set('Content-Type', 'application/json').expect(400);
    });

    //test for ensuring unsupported media types are rejected
    it('should return 415 Unsupported Media Type for adding a visit with wrong content type', async () => {
        const newVisit = { patientName: 'Jane Doe', visitDate: '2024-02-02', description: 'Routine check-up' };
        await app.post('/add-visit').send(JSON.stringify(newVisit)).set('Content-Type', 'text/plain').expect(415);
    });

    //test for verifying method not allowed response
    it('should return 405 Method Not Allowed for POST requests to list visits', async () => {
        await app.post('/list-visits').expect(405);
    });

    //test for handling requests to undefined routes
    it('should return 404 Not Found for undefined routes', async () => {
        await app.get('/undefined-route').expect(404);
    });

    //test for handling OPTIONS preflight requests
    it('should return 204 No Content for OPTIONS preflight request on add-visit', async () => {
        await app.options('/add-visit').expect(204);
    });

    //test to ensure that added visits are correctly listed
    it('should correctly list added visits', async () => {
        const newVisit = { patientName: 'Mark Twain', visitDate: '2024-03-03', description: 'Dental check-up' };
        //add a new visit
        await app.post('/add-visit').send(newVisit).set('Content-Type', 'application/json').expect(201);
        //verify it's included in the list of visits
        await app.get('/list-visits')
            .expect(200)
            .then(response => {
                const visits = response.body;
                expect(Array.isArray(visits)).toBeTruthy();
                //check for the existence of the added visit in the response
                const visitExists = visits.some(visit => visit.patientName === newVisit.patientName && visit.visitDate === newVisit.visitDate && visit.description === newVisit.description);
                expect(visitExists).toBe(true);
            });
    });

        //test to ensure visits can be added with a past visit date successfully
        it('should allow adding a visit with a past visit date', async () => {
            const pastVisit = { patientName: 'Past Test', visitDate: '2020-01-01', description: 'Past visit' };
            //add a visit with a date in the past and expect successful creation
            await app.post('/add-visit').send(pastVisit).set('Content-Type', 'application/json').expect(201);
        });
    
        //test to ensure that additional, unexpected fields in the request body are ignored and the visit is added successfully
        it('should add a visit successfully even with extra fields in the request', async () => {
            const visitWithExtraField = { patientName: 'Extra Field Test', visitDate: '2024-04-04', description: 'Extra field visit', extraField: 'ignored' };
            //extra fields should be ignored, and the visit should be added successfully
            await app.post('/add-visit').send(visitWithExtraField).set('Content-Type', 'application/json').expect(201);
        });
        
        //test for rejecting unsupported Content-Type like application/xml
        it('should return 415 Unsupported Media Type for Content-Type application/xml', async () => {
            const xmlData = '<visit><patientName>XML Test</patientName><visitDate>2024-06-06</visitDate><description>XML data</description></visit>';
            //expecting unsupported media type response due to XML Content-Type
            await app.post('/add-visit').send(xmlData).set('Content-Type', 'application/xml').expect(415);
        });
        
        //test to ensure visits cannot be added with invalid JSON structures
        it('should return 400 Bad Request for adding a visit with invalid JSON structure', async () => {
            const invalidJSON = "{ patientName: 'No quotes on keys', visitDate: '2024-01-01', description: 'Invalid JSON' }";
            //JSON parsing should fail, leading to a Bad Request response
            await app.post('/add-visit').send(invalidJSON).set('Content-Type', 'application/json').expect(400);
        });

        it('should update an existing reservation', async () => {
            const updateData = { description: 'Updated check-up' };
            const reservationId = 1; // Assuming this ID exists
            await app.put(`/update-reservation/${reservationId}`)
                .send(updateData)
                .expect(200)
                .then(async () => {
                    await app.get(`/lookup-reservations?attendee=${reservationId}`)
                        .expect(200)
                        .then(response => {
                            expect(response.body.description).toEqual('Updated check-up');
                        });
                });
        });
        
        
        it('should update an existing reservation', async () => {
            const updateData = { description: 'Updated check-up' };
            const reservationId = 1; // Assuming this ID exists
            await app.put(`/update-reservation/${reservationId}`)
                .send(updateData)
                .expect(200)
                .then(async () => {
                    await app.get(`/lookup-reservations?attendee=${reservationId}`)
                        .expect(200)
                        .then(response => {
                            expect(response.body.description).toEqual('Updated check-up');
                        });
                });
        });

        
        

});
