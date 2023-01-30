const path = require('path');
const fs = require('fs');
const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const { ApolloServerPluginLandingPageDisabled } = require('@apollo/server/plugin/disabled');
const { mergeResolvers, mergeTypeDefs } = require('@graphql-tools/merge');
const { loadFilesSync } = require('@graphql-tools/load-files');
const serverMiddleware = require('./server_middleware');

module.exports = async (app) => {
  const config = app.config.apollo4;

  const options = {
    plugins: [],
    ...(config.options || {}),
  };
  // 非開發環境之下，關閉 Apollo的Landing page
  if (process.env.NODE_ENV === 'production') {
    options.plugins.push(ApolloServerPluginLandingPageDisabled());
  } else {
    options.plugins.push(ApolloServerPluginLandingPageLocalDefault({ includeCookies: true }));
  }
  if (app.server) {
    options.plugins.push(ApolloServerPluginDrainHttpServer({ httpServer: app.server }));
  }

  if (!options.schema) {
    if (!options.typeDefs) {
      if (!config.typeDefsDir) {
        throw new Error('Apollo Error: typeDefs must be provided.');
      }
      // 先去判斷config.typeDefsDir是否真的有這個目錄
      // 如果沒有，就加上app.appInfo.root去尋找
      let defPath = path.resolve(config.typeDefsDir);
      if (!fs.existsSync(defPath)) defPath = path.join(app.appInfo.root, config.typeDefsDir);
      const typesArray = loadFilesSync(defPath, { recursive: true });
      const typeDefs = mergeTypeDefs(typesArray);
      options.typeDefs = typeDefs;
    }
    if (!options.resolvers) {
      if (!config.resolversDir) {
        console.log('\x1b[31m[apollo] %s\x1b[0m', 'WARNING: resolvers not defiined.');
      } else {
        // 先去判斷config.typeDefsDir是否真的有這個目錄
        // 如果沒有，就加上app.appInfo.root去尋找
        let resolverPath = path.resolve(config.resolversDir);
        if (!fs.existsSync(resolverPath)) resolverPath = path.join(app.appInfo.root, config.resolversDir);
        const resolversArray = loadFilesSync(resolverPath, { recursive: true });
        const resolvers = mergeResolvers(resolversArray);
        options.resolvers = resolvers;
      }
    }
  }

  const server = new ApolloServer(options);
  await server.start();

  app.router.all(config.path, serverMiddleware(server, options.context));
  console.log(`\x1b[34m[apollo] Server running on http://localhost:${app.config.port}${config.path}\x1b[0m`);
};
