const assert = require('assert');
const Mahudas = require('mahudas');
const path = require('path');
const request = require('supertest');

const app = new Mahudas({
  root: path.join(__dirname, '..'),
});

app.on('configDidLoad', () => {
  app.config.apollo4.typeDefsDir = path.join(__dirname, 'app/gql/typedef');
  app.config.apollo4.resolversDir = path.join(__dirname, 'app/gql/resolver');
});

const waitForServer = () => new Promise((resolve) => {
  if (app.server) {
    resolve();
    return;
  }
  app.on('serverDidReady', resolve);
});

before(async () => {
  await waitForServer();
});

after(() => {
  app.server.close();
});

it('GQL echo', async () => {
  const echoMsg = 'echo msg';
  const res = await request(app.server)
    .post(app.config.apollo4.path)
    .send({
      query: `
      query test($msg: String) {
        echo(msg: $msg) {
          fields
          msg
          sub {
            field1
          }
        }
      }`,
      variables: {
        msg: echoMsg,
      },
    })
    .expect(200);
  assert.equal(res.body.data.echo.msg, echoMsg);
});
