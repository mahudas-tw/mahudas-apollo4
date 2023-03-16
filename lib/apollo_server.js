const path = require('path');
const fs = require('fs');
const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault } = require('@apollo/server/plugin/landingPage/default');
const { mergeResolvers, mergeTypeDefs } = require('@graphql-tools/merge');
const { loadFilesSync } = require('@graphql-tools/load-files');
const serverMiddleware = require('./server_middleware');

module.exports = async (app) => {
  const config = app.config.apollo4;

  const options = {
    plugins: [],
    ...(config.options || {}),
  };

  // 判斷是否要啟用landingPage
  // 如果沒有在config裡找到landingPage的設定，則預設NODE_ENV非production時為開啟狀態
  let landingPage = false;
  if (config.landingPage !== null && config.landingPage !== undefined) {
    landingPage = config.landingPage === true;
  } else if (process.env.NODE_ENV !== 'production') landingPage = true;

  if (!landingPage) {
    options.plugins.push(ApolloServerPluginLandingPageProductionDefault());
  } else {
    options.introspection = true;
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

  // 如果不允許landingPage，就將GET的request設定為404
  if (!landingPage) {
    app.router.get(config.path, async (ctx) => {
      ctx.status = 404;
    });
  }
  app.router.all(config.path, serverMiddleware(server, options.context));
  console.log(`\x1b[34m[apollo] Server running on http://localhost:${app.config.port}${config.path}\x1b[0m`);
};
