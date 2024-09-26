import DbSearcher, { QueryType } from "../src";

const IPV6_DB_PATH = "YOUR_IPV6_DB_PATH";
const IPV4_DB_PATH = "YOUR_IPV4_DB_PATH";
const IPV6_IP = "240e:391:ed3:8a10::1";
const KEY = "YOUR_KEY_HERE";
const IPV4_IP = "14.9.15.0";

const searcher = new DbSearcher(IPV4_DB_PATH, QueryType.MEMORY, KEY);
const ipv6Searcher = new DbSearcher(IPV6_DB_PATH, QueryType.MEMORY, KEY);

console.time('ipv4_perform');
const region = searcher.search(IPV4_IP);
console.log('🚀 ~ region:', region);
console.timeEnd('ipv4_perform');
searcher.close();

console.time('ipv6_perform');
const ipv6Region = ipv6Searcher.search(IPV6_IP);
console.log('🚀 ~ ipv6 region:', ipv6Region);
console.timeEnd('ipv6_perform');
ipv6Searcher.close();
