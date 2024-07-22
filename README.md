# czdb-search-node

### [中文文档](./README_CN.md)

<img src="https://img.shields.io/npm/v/czdb" alt="czdb"/>

### A Node.js package for querying the new format data of the Pure IP offline community version database `czdb`. It supports two types of search algorithms: in-memory search (MEMORY) and B-tree search (BTREE). The database type (IPv4 or IPv6) and query type (MEMORY, BTREE) are determined at runtime.

### [JAVA Version](https://github.com/tagphi/czdb-search-java)

### [PHP Version](https://github.com/tagphi/czdb_searcher_php)

### [C Version](https://github.com/tagphi/czdb-search-c)

## Supports IPv4 and IPv6

czdb-search supports querying both IPv4 and IPv6 addresses. When creating a DbSearcher instance, you need to provide the corresponding database file and key.

Database files and keys can be obtained from [www.cz88.net](https://cz88.net/geo-public).

## Installation

### Please use **Node.js v8.0.0** or higher to get ES6 support.

```bash
npm install czdb
```

## Usage

```typescript
// Import DbSearcher
import DbSearcher, { QueryType } from "../lib/index";

// Prepare your .czdb file and key
const IPV4_DB_PATH = "YOUR_IPV4_DB_PATH";
const IPV4_IP = "1.64.219.93";
const KEY = "YOUR_KEY_HERE";

// Create a search instance
const searcher = new DbSearcher(IPV4_DB_PATH, QueryType.BTREE, KEY);

// Use the search method to search the database based on the provided IP address
const region = searcher.search(IPV4_IP);

// The returned string format is "Country–Province–City–Region ISP". If the search fails, it will return null.
console.log(region); // China–Hong Kong  PCCW Limited
```

## Example

You can find a simple usage example in the example folder. After filling in the path and key, run the following commands to test:

```bash
pnpm i

pnpm run test
```

## Query Types

DbSearcher supports 2 query types: `MEMORY` and `BTREE`.

`MEMORY`: This mode is thread-safe and stores data in memory.
`BTREE`: This mode uses the `B-tree` data structure for queries.
You can choose the query type when creating a `DbSearcher` instance.

```typescript
DbSearcher searcher = new DbSearcher("YOUR_DB_PATH", QueryType.BTREE, "YOUR_KEY");
```

## Closing the Database

When the query is finished and no longer needed, you should close the database.

```typescript
searcher.close();
```

This will release all used resources and close access to the database file.
