# @mahudas/apollo4
這是使用Apollo v4版本的Mahudas plugin。

## Dependencies
+ mahudas^0.1.3
+ @apollo/server^4.6.0
+ @graphql-tools/load-files^6.6.1
+ @graphql-tools/merge^8.3.14
+ dataloader^2.1.0

## 使用
### Standalone
```console
npm i
npm run mahudas
```

### As a plugin
如同一般的plugin，透過npm安裝之後，在Application的`plugin.env.js`裡設定啟用。  
```console
npm i @mahudas/apollo4 -s
```
```js
// config/plugin.deafult.js
module.exports = {
  apollo4: {
    enable: true,
    package: '@mahudas/apollo4',
  },
}
```

## 設定
```js
// config/config.default.js
module.exports = {
  apollo4: {
    path: '/gql',
    typeDefsDir: 'app/gql/typedef',
    resolversDir: 'app/gql/resolver',
    options: {
      typeDefs,
      resolvers,
      schema,
    },
  },
}
```
參數 | 說明
--- | ---
path | gql呼叫的path
typeDefsDir | 定義typedef檔案的目錄
resolversDir | 定義resolver檔案的目錄
options.typeDefs | 已經寫好的typedefs，如果此參數有值，會忽略typeDefsDir
options.resolvers | 已經寫好的resolvers，如果此參數有值，會忽略resolversDir
schema | 已經合併的schema，很少被使用，如果此參數有值，會忽略typedefs跟resolvers的設定

## 對於Mahudas context的擴充
@mahudas/apollo4 對context進行了擴充：
## ctx.gql.useDataLoader(name:String, fn: Function):DataLoader
`@mahudas/apollo4`預設會自動啟用一個plugin，用來在ctx階段時存取多個resolvers之間共用的DataLoader。  
DataLoader是以名稱為key值，如果name不存在，就會新增一個DataLoader，若是name已經存在，就會返回相對應的DataLoader。  

```js
// some_resolver.js
module.exports = {
  Query: {
    me: async (rootValue, args, ctx) => {  
      // 這邊會以users這個名稱為依據來取得DataLoader
      const userDataLoader = ctx.gql.useDataLoader('users', async(user_ids) => {
        // ... do somthing
        return returnData;
      });
      const me = await userDataLoader.load(myid);
      return me;
    },
  }
}
```

### ctx.gql.parseInfo(info:Object, deepPath:Sring|[String]):[String]
parseInfo是用來解析query裡的fields，以方便開發者用來判斷要如何處理回傳資料。  
其中，info參數為resolver接收到的第四個參數。  
deepPath是一個String或String陣列，表示要往子層級尋找的深度。  
例如有一個typedef如下:
```js
type User {
  email: String
  friends: Friend
}

type Friend {
  email: String
  gender: String
}
```

如果我們想知道這次User的query是否有查詢User.Friend之下的gender欄位：
```js
// some_resolver.js
module.exports = {
  Query: {
    test: async (rootValue, args, ctx, info) => { 
      const fs = ctx.gql.parseInfo(info, ['friends']);
      console.log(fs); // ['email', 'gender'] 則表示兩個欄位都被選擇了
      return {};
    },
  }
}
```

### DataLoader
基本上只是讓開發者可以快速使用 `DataLoader` 。  
DataLoader是用來當有類似query情況的話，用來減少資料庫多次query負擔的工具，在GraphQL的使用上算是常見，因此將它加入到context裡以方便使用。  
DataLoder的使用方式可以參考 [這裡](https://github.com/graphql/dataloader) 。  
```js
const dataloader = new ctx.gql.DataLoader(async(id)=> {
  // ... do something
  return result;
});
const idResult = await dataloader.load(userid);
```

## 透過config.env.js擴充Apollo的ctx
除了使用Mahudas本身的extends來擴充context以外，Apollo本身也有一個設定可以擴充context，這個設定可以透過config.env.js裡的`apollo4.options`來達成。  

以下範例可以讓開發者在 resolver 裡的 ctx 直接取得 `ctx.dataloaders` 這個空物件。
```js
// config.env.js
module.exports = {
  apollo4: {
    // ...
    options: {
      // 接收Mahudas的ctx為參數
      // "只需"回傳需要擴充的Object就好，回傳型別必須是Object
      context: async (ctx) => {
        const toExt = {
          dataloaders: {},
        };
        return toExt;
      },
    },
  },
}
```