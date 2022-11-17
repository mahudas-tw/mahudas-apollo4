const nextPath = (info, path) => {
  const mynode = info.selectionSet.selections.find((f) => f.name.value === path);
  return mynode;
};

const findFields = (info, paths) => {
  const ps = [...paths];
  let node = { ...info };
  let i = 0;
  while (ps.length > 0 && i < 10) {
    node = nextPath(node, ps[0]);
    ps.splice(0, 1);
    i += 1;
  }

  const fields = [];
  node.selectionSet.selections.forEach((v2) => {
    fields.push(v2.name.value);
  });

  return fields;
};

/**
說明
從gql裡解析要從資料庫裡取得的資料欄位名稱

使用
parseInfo(info, path):[String]

參數
info: 在resolver裡得到的info
path: String或Array，指定要往下層查找的階層，可以往下去尋找fields(通常適用於回傳的結果跟query在不同層級的情況，例如cursor)

回傳
欄位名稱陣列
*/
const parseInfo = (info, path = '') => {
  let searchPath = [];
  if (path) {
    if (Array.isArray(path)) {
      searchPath = path;
    } else {
      searchPath = [path];
    }
  }

  const fields = findFields(info.fieldNodes[0], searchPath);

  return fields;
};

module.exports = parseInfo;
