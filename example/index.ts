import DbSearcher, { QueryType } from "../lib/index";

const IPV6_DB_PATH = "YOUR_IPV6_DB_PATH";
const IPV4_DB_PATH = "YOUR_IPV4_DB_PATH";
const IPV6_IP = "240e:391:ed3:8a10::1";
const IPV4_IP = "1.64.219.93";
const KEY = "YOUR_KEY_HERE";

const searcher = new DbSearcher(IPV4_DB_PATH, QueryType.BTREE, KEY)

console.time('exampleFunction');
const region = searcher.search(IPV4_IP);
console.log('🚀 ~ region:', region)
console.timeEnd('exampleFunction');
searcher.close();
