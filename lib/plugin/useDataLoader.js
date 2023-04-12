const DataLoader = require('dataloader');

module.exports = () => {
  const useDataLoaderPlugin = {
    async requestDidStart() {
      return {
        async responseForOperation({ contextValue }) {
          const ctx = contextValue;
          ctx.gql.__dataloaders = new Map();
          ctx.gql.useDataLoader = function useDataLoader(name, fn) {
            let loader = ctx.gql.__dataloaders.get(name);
            if (!loader) {
              loader = new DataLoader(fn);
              ctx.gql.__dataloaders.set(name, loader);
            }
            return loader;
          };
        },
      };
    },
  };

  return useDataLoaderPlugin;
};
