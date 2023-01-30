const { parse } = require('url');

module.exports = (server, context) => {
  const fn = async (ctx) => {
    const ctxheaders = new Map();
    Object.entries(ctx.headers).forEach(([k, v]) => {
      ctxheaders.set(k, v);
    });
    const httpGraphQLRequest = {
      method: ctx.method.toUpperCase(),
      headers: ctxheaders,
      search: parse(ctx.url).search || '',
      body: ctx.request.body,
    };

    let ctxExtends = {};
    if (context) ctxExtends = await context(ctx);
    Object.keys(ctxExtends).forEach((exname) => {
      ctx[exname] = ctxExtends[exname];
    });

    const { body, headers, status } = await server.executeHTTPGraphQLRequest({
      httpGraphQLRequest,
      context: () => ctx,
    });
    headers.forEach((v, k) => {
      ctx.set(k, v);
    });
    ctx.status = status || 200;

    ctx.body = body.string;
  };
  return fn;
};
