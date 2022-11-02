const apolloServer = require('./lib/apollo_server');

module.exports = (app) => {
  app.on('serverDidReady', async () => {
    await apolloServer(app);
  });
};
