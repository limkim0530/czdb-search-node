# czdb-search-node

<img src="https://img.shields.io/npm/v/czdb" alt="czdb"/>

### 一个提供纯真离线社区版 IP 地址库`czdb`新格式数据查询的 nodejs 包。它支持两种种类型的搜索算法：内存搜索（MEMORY）和 B 树搜索（BTREE）。数据库类型（IPv4 或 IPv6）和查询类型（MEMORY、BTREE）在运行时确定。

### [JAVA 版本](https://github.com/tagphi/czdb-search-java)

### [PHP 版本](https://github.com/tagphi/czdb_searcher_php)

### [C 版本](https://github.com/tagphi/czdb-search-c)

## 支持 IPv4 和 IPv6

czdb-search 支持 IPv4 和 IPv6 地址的查询。在创建 DbSearcher 实例时，你需要提供相应的数据库文件和密钥。

数据库文件和密钥可以从 [www.cz88.net](https://cz88.net/geo-public) 获取。

## 安装

### 请使用  **Node.js v8.0.0**  或者更高版本以取得 ES6 支持.

```bash
npm install czdb
```

## 使用

```typescript
// 引入DbSearcher
import DbSearcher, { QueryType } from "czdb";

// CommonJS 使用 require 引入:
// const { default: DbSearcher, QueryType } = require('czdb');

// 准备好你的.czdb文件与密钥
const IPV4_DB_PATH = "YOUR_IPV4_DB_PATH";
const IPV4_IP = "1.64.219.93";
const KEY = "YOUR_KEY_HERE";

// 创建查询实例
const searcher = new DbSearcher(IPV4_DB_PATH, QueryType.BTREE, KEY);

// 使用 search 方法来根据提供的 IP 地址在数据库中搜索数据
const region = searcher.search(IPV4_IP);

// 返回的字符串格式为 "国家–省份–城市–区域 ISP"。如果搜索失败，它将返回 null。
console.log(region); // 中国–香港  电讯盈科有限公司
```

## 使用样例

你可以在 example 文件夹下找到一个简单的使用样例，在填入路径与密钥后，运行以下命令以进行测试：

```bash
pnpm i

pnpm run test
```

## 查询类型

DbSearcher 支持 2 种查询类型：`MEMORY` 和` BTREE`。

`MEMORY`：此模式是线程安全的，将数据存储在内存中。
`BTREE`：此模式使用 `B-tree` 数据结构进行查询。
你可以在创建 `DbSearcher` 实例时选择查询类型。

```typescript
DbSearcher searcher = new DbSearcher("YOUR_DB_PATH", QueryType.BTREE, "YOUR_KEY");
```

## 关闭数据库

当查询结束且不再使用时，你应该关闭数据库。

```typescript
searcher.close();
```

这将释放所有使用的资源，并关闭对数据库文件的访问。
