const resolvers = {
  Query: {
    echo: async (root, args, ctx, info) => {
      const fields = ctx.gql.parseInfo(info, ['sub']);
      return {
        fields,
        msg: args.msg,
      };
    },
  },
};

module.exports = resolvers;
