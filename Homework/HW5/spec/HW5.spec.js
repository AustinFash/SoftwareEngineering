const request = require('supertest');
const server = require('../HW5');

describe('POST /', () => {
  let app;

  //starts server before all tests
  beforeAll((done) => {
    app = server.listen(3000, () => {
      console.log('Server started for testing');
      done();
    });
  });

  //closes server after all tests
  afterAll((done) => {
    app.close(() => {
      console.log('Server closed after testing');
      done(); //to signal completion
    });
  });

  //test for unsported media type
  it('responds with 415 Unsupported Media Type for unsupported content-types', (done) => {
    request(app)
      .post('/')
      .send('text=example')
      .set('Content-Type', 'application/unsupported-type')
      .expect(415)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });

  //test for URL-encoded data parsing
it('echoes the body for application/x-www-form-urlencoded content-type', (done) => {
  request(app)
    .post('/')
    .send('text=example&data=value')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .expect(200, '{"text":"example","data":"value"}')
    .end((err, res) => {
      if (err) return done(err);
      done();
    });
});

//test for handling invalid JSON body
it('responds with 400 Bad Request for invalid JSON data', (done) => {
  request(app)
    .post('/')
    .send('{"text": "example}')
    .set('Content-Type', 'application/json')
    .expect(400)
    .end((err, res) => {
      if (err) return done(err);
      expect(res.text).toBe('Bad request: Error parsing the body');
      done();
    });
});

//test for unsupported HTTP method
it('responds with 405 Method Not Allowed for non-POST methods', (done) => {
  request(app)
    .get('/')
    .expect(405)
    .end((err, res) => {
      if (err) return done(err);
      expect(res.text).toBe('Only POST method is supported');
      done();
    });
});

//test for handling empty body with application/json
it('responds with 400 Bad Request for empty body with application/json content-type', (done) => {
  request(app)
    .post('/')
    .set('Content-Type', 'application/json')
    .send('')
    .expect(400)
    .end((err, res) => {
      if (err) return done(err);
      expect(res.text).toBe('Bad request: Error parsing the body');
      done();
    });
});

//test for handling empty body with application/x-www-form-urlencoded
it('responds with 200 OK and echoes an empty object for empty body with application/x-www-form-urlencoded content-type', (done) => {
  request(app)
    .post('/')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send('')
    .expect(200, '{}')
    .end((err, res) => {
      if (err) return done(err);
      done();
    });
  });
});