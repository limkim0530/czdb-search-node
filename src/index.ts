import net from 'net';
import Cz88RandomAccessFile from "./modules/Cz88RandomAccessFile";
import HyperHeaderDecoder from "./utils/HyperHeaderDecoder";
import DbType from "./typings/DbType";
import QueryType from "./typings/QueryType";
import { END_INDEX_PTR, FILE_SIZE_PTR, FIRST_INDEX_PTR, HEADER_BLOCK_PTR, SUPER_PART_LENGTH } from "./constant";
import ByteUtil from "./utils/ByteUtils";
import IndexBlock from "./modules/IndexBlock";
import Decryptor from "./utils/Decryptor";
import { DataBlock } from "./modules/DataBlock";

export default class DbSearcher {
    // Enum representing the type of the database (IPv4 or IPv6)
    private dbType: DbType = DbType.IPV4;

    // Length of the IP bytes
    private ipBytesLength = 0;

    // Enum representing the type of the query (MEMORY, BINARY, BTREE)
    private queryType: QueryType;

    // Total size of the header block in the database
    private totalHeaderBlockSize = 0;

    /**
    * Handler for accessing the database file.
    * It is used to read from and write to the file.
    */
    private raf: Cz88RandomAccessFile | null = null;

    /**
     * These are used only for B-tree search.
     * HeaderSip is a 2D byte array representing the start IP of each index block.
     * HeaderPtr is an integer array representing the data pointer of each index block.
     * headerLength is the number of index blocks in the header.
     */
    private HeaderSip: Buffer[] = [];
    private HeaderPtr: number[] = [];
    private headerLength = 0;

    /**
     * These are used for memory and binary search.
     * firstIndexPtr is the pointer to the first index block.
     * lastIndexPtr is the pointer to the last index block.
     * totalIndexBlocks is the total number of index blocks.
     */
    private firstIndexPtr = 0;
    private totalIndexBlocks = 0;

    private dbBinStr: Buffer | null = null;

    private columnSelection = 0;
    private geoMapData: Buffer | null = null;

    /**
     * Constructor for DbSearcher class.
     * Initializes the DbSearcher instance based on the provided database file, query type, and key.
     * Depending on the query type, it calls the appropriate initialization method.
     *
     * @param dbFilePath The path to the database file.
     * @param queryType The type of the query (MEMORY, BINARY, BTREE).
     * @param key The key used for decrypting the header block of the database file.
     */
    constructor(dbFile: string, queryType: QueryType, key: string) {
        this.queryType = queryType;
        const headerBlock = HyperHeaderDecoder.decrypt(dbFile, key);

        // if (typeof dbFile === 'string') {
        this.raf = new Cz88RandomAccessFile(dbFile, "r", headerBlock.getHeaderSize());

        // set db type
        this.raf.seek(0);
        const superBytes = Buffer.alloc(SUPER_PART_LENGTH);
        this.raf.readFully(superBytes);
        this.dbType = (superBytes[0] & 1) === 0 ? DbType.IPV4 : DbType.IPV6;
        this.ipBytesLength = this.dbType === DbType.IPV4 ? 4 : 16;

        // load geo setting
        this.loadGeoSetting(this.raf, key);

        if (queryType === QueryType.MEMORY) {
            this.initializeForMemorySearch();
        } else if (queryType === QueryType.BTREE) {
            this.initBtreeModeParam(this.raf);
        }
    }

    private loadGeoSetting(raf: Cz88RandomAccessFile, key: string): void {
        raf.seek(END_INDEX_PTR);
        const data = Buffer.alloc(4);
        raf.readFully(data);

        const endIndexPtr = ByteUtil.getIntLong(data, 0);

        const columnSelectionPtr = endIndexPtr + IndexBlock.getIndexBlockLength(this.dbType);

        raf.seek(columnSelectionPtr);
        raf.readFully(data);

        this.columnSelection = ByteUtil.getIntLong(data, 0);

        // not geo mapping
        if (this.columnSelection == 0) {
            return;
        }

        const geoMapPtr = columnSelectionPtr + 4;
        raf.seek(geoMapPtr);
        raf.readFully(data);
        const geoMapSize = ByteUtil.getIntLong(data, 0);

        raf.seek(geoMapPtr + 4);
        this.geoMapData = Buffer.alloc(geoMapSize);
        raf.readFully(this.geoMapData);

        const decryptor = new Decryptor(key);
        this.geoMapData = decryptor.decrypt(this.geoMapData);
    }

    /**
     * Initializes the DbSearcher instance for memory search.
     * Reads the entire database file into memory and then initializes the parameters for memory or binary search.
     */
    private initializeForMemorySearch(): void {
        this.dbBinStr = Buffer.alloc(this.raf!.length());
        this.raf!.seek(0);
        this.raf!.readFully(this.dbBinStr);
        this.raf!.close();
        this.initMemoryOrBinaryModeParam(this.dbBinStr, this.dbBinStr.length);
    }

    private initMemoryOrBinaryModeParam(bytes: Buffer, fileSize: number): void {
        this.totalHeaderBlockSize = ByteUtil.getIntLong(bytes, HEADER_BLOCK_PTR);
        const fileSizeInFile = ByteUtil.getIntLong(bytes, FILE_SIZE_PTR);
        if (fileSizeInFile != fileSize) {
            throw new Error(`db file size error, excepted ${fileSizeInFile}, real ${fileSize}`);
        }
        this.firstIndexPtr = ByteUtil.getIntLong(bytes, FIRST_INDEX_PTR);
        const lastIndexPtr = ByteUtil.getIntLong(bytes, END_INDEX_PTR);
        this.totalIndexBlocks = ((lastIndexPtr - this.firstIndexPtr) / IndexBlock.getIndexBlockLength(this.dbType)) + 1;

        const b = Buffer.alloc(this.totalHeaderBlockSize);
        b.set(bytes.subarray(SUPER_PART_LENGTH, SUPER_PART_LENGTH + b.length), 0);
        this.initHeaderBlock(b);
    }

    private initBtreeModeParam(raf: Cz88RandomAccessFile): void {
        // set db type
        raf.seek(0);
        const superBytes = Buffer.alloc(SUPER_PART_LENGTH);
        raf.readFully(superBytes, 0, superBytes.length);
        this.totalHeaderBlockSize = ByteUtil.getIntLong(superBytes, HEADER_BLOCK_PTR);

        const fileSizeInFile = ByteUtil.getIntLong(superBytes, FILE_SIZE_PTR);
        const realFileSize = raf.length();

        if (fileSizeInFile !== realFileSize) {
            throw new Error(`db file size error, excepted ${fileSizeInFile}, real ${realFileSize}"`);
        }

        const b = Buffer.alloc(this.totalHeaderBlockSize);
        raf.readFully(b, 0, b.length);

        this.initHeaderBlock(b);
    }

    private initHeaderBlock(headerBytes: Buffer): void {
        const indexLength = 20;

        const len = headerBytes.length / indexLength;
        let idx = 0;
        this.HeaderSip = Array.from({ length: len }, () => Buffer.alloc(16));;
        this.HeaderPtr = [];
        let dataPtr: number;
        for (let i = 0; i < headerBytes.length; i += indexLength) {
            dataPtr = ByteUtil.getIntLong(headerBytes, i + 16);
            if (dataPtr == 0) {
                break;
            }
            this.HeaderSip[idx].set(headerBytes.subarray(i, i + 16), 0);
            this.HeaderPtr[idx] = dataPtr;
            idx++;
        }
        this.headerLength = idx;
    }

    /**
     * This method is used to search for a region in the database based on the provided IP address.
     * It supports three types of search algorithms: memory, binary, and B-tree.
     * The type of the search algorithm is determined by the queryType attribute of the DbSearcher instance.
     * The method first converts the IP address to a byte array, then performs the search based on the query type.
     * If the search is successful, it returns the region of the found data block.
     * If the search is unsuccessful, it returns null.
     *
     * @param ip The IP address to search for. It is a string in the standard IP address format.
     * @return The region of the found data block if the search is successful, null otherwise.
     */
    public search(ip: string): string | null {
        // Convert the IP address to a byte array
        const ipBytes = this.getIpBytes(ip);

        // The data block to be found
        let dataBlock: DataBlock | null = null;

        // Perform the search based on the query type
        switch (this.queryType) {
            case QueryType.MEMORY:
                // Perform a memory search
                dataBlock = this.memorySearch(ipBytes);
                break;
            case QueryType.BTREE:
                // Perform a B-tree search
                dataBlock = this.bTreeSearch(ipBytes);
                break;
            default:
                break;
        }

        // Return the region of the found data block if the search is successful, null otherwise
        if (dataBlock === null) {
            return null;
        }
        return dataBlock.getRegion(this.geoMapData, this.columnSelection);
    }

    /**
     * This method performs a memory search to find a data block in the database based on the provided IP address.
     * It uses a binary search algorithm to search the index blocks and find the data.
     * If the search is successful, it returns the data block containing the region and the data pointer.
     * If the search is unsuccessful, it returns null.
     *
     * @param ip The IP address to search for. It is a byte array representing the IP address.
     * @return The data block containing the region and the data pointer if the search is successful, null otherwise.
     */
    private memorySearch(ip: Buffer): DataBlock | null {
        // The length of an index block
        const blockLen = IndexBlock.getIndexBlockLength(this.dbType);

        // Use searchInHeader to get the search range
        const sptrNeptr = this.searchInHeader(ip);
        const sptr = sptrNeptr[0], eptr = sptrNeptr[1];

        if (sptr == 0) {
            return null;
        }

        // Calculate the number of index blocks in the search range
        // Initialize the search range
        let l = 0, h = (eptr - sptr) / blockLen;

        // The start IP and end IP of the current index block
        const sip = Buffer.alloc(this.ipBytesLength), eip = Buffer.alloc(this.ipBytesLength);

        // The data pointer of the found data block
        let dataPtr = 0;
        let dataLen = 0;

        // Perform a binary search on the index blocks
        while (l <= h && this.dbBinStr) {
            const m = (l + h) >> 1;
            const p = sptr + m * blockLen;
            sip.set(this.dbBinStr.subarray(p, p + this.ipBytesLength), 0);
            eip.set(this.dbBinStr.subarray(p + this.ipBytesLength, p + this.ipBytesLength + this.ipBytesLength), 0);

            const cmpStart = this.compareBytes(ip, sip, this.ipBytesLength);
            const cmpEnd = this.compareBytes(ip, eip, this.ipBytesLength);

            // If the IP is less than the start IP, search the left half
            if (cmpStart >= 0 && cmpEnd <= 0) {
                // IP is in this block
                dataPtr = ByteUtil.getIntLong(this.dbBinStr, p + this.ipBytesLength * 2);
                dataLen = ByteUtil.getInt1(this.dbBinStr, p + this.ipBytesLength * 2 + 4);
                break;
            } else if (cmpStart < 0) {
                // IP is less than this block, search in the left half
                h = m - 1;
            } else {
                // IP is greater than this block, search in the right half
                l = m + 1;
            }
        }

        //not matched
        if (dataPtr === 0 || !this.dbBinStr) {
            return null;
        }

        // Get the region from the database binary string
        const region = Buffer.alloc(dataLen);
        region.set(this.dbBinStr.subarray(dataPtr, dataPtr + dataLen), 0);

        // Return the data block containing the region and the data pointer
        return new DataBlock(region, dataPtr);
    }

    searchInHeader(ip: Buffer): number[] {
        let l = 0, h = this.headerLength - 1, sptr = 0, eptr = 0;

        while (l <= h) {
            const m = (l + h) >> 1;
            const cmp = this.compareBytes(ip, this.HeaderSip[m], this.ipBytesLength);

            if (cmp < 0) {
                h = m - 1;
            } else if (cmp > 0) {
                l = m + 1;
            } else {
                sptr = this.HeaderPtr[m > 0 ? m - 1 : m];
                eptr = this.HeaderPtr[m];
                break;
            }
        }

        // less than header range
        if (l == 0 && h <= 0) {
            return [0, 0];
        }

        if (l > h) {
            if (l < this.headerLength) {
                sptr = this.HeaderPtr[l - 1];
                eptr = this.HeaderPtr[l];
            } else if (h >= 0 && h + 1 < this.headerLength) {
                sptr = this.HeaderPtr[h];
                eptr = this.HeaderPtr[h + 1];
            } else { // search to last header line, possible in last index block
                sptr = this.HeaderPtr[this.headerLength - 1];
                const blockLen = IndexBlock.getIndexBlockLength(this.dbType);

                eptr = sptr + blockLen;
            }
        }

        return [sptr, eptr];
    }

    /**
     * get the region with a int ip address with b-tree algorithm
     *
     * @param ip
     * @throws IOException
     */
    private bTreeSearch(ip: Buffer): DataBlock | null {
        const sptrNeptr = this.searchInHeader(ip);
        const sptr = sptrNeptr[0], eptr = sptrNeptr[1];

        if (sptr == 0) {
            return null;
        }

        //2. search the index blocks to define the data
        const blockLen = eptr - sptr, blen = IndexBlock.getIndexBlockLength(this.dbType);

        //include the right border block
        const iBuffer = Buffer.alloc(blockLen + blen);
        this.raf!.seek(sptr);
        this.raf!.readFully(iBuffer, 0, iBuffer.length);

        let l = 0;
        let h = blockLen / blen;
        const sip = Buffer.alloc(this.ipBytesLength), eip = Buffer.alloc(this.ipBytesLength);

        let dataPtr = 0;
        let dataLen = 0;

        while (l <= h) {
            const m = (l + h) >> 1;
            const p = m * blen;
            sip.set(iBuffer.subarray(p, p + this.ipBytesLength), 0);
            eip.set(iBuffer.subarray(p + this.ipBytesLength, p + this.ipBytesLength + this.ipBytesLength), 0);

            const cmpStart = this.compareBytes(ip, sip, this.ipBytesLength);
            const cmpEnd = this.compareBytes(ip, eip, this.ipBytesLength);

            if (cmpStart >= 0 && cmpEnd <= 0) {
                // IP is in this block
                dataPtr = ByteUtil.getIntLong(iBuffer, p + this.ipBytesLength * 2);
                dataLen = ByteUtil.getInt1(iBuffer, p + this.ipBytesLength * 2 + 4);

                break;
            } else if (cmpStart < 0) {
                // IP is less than this block, search in the left half
                h = m - 1;
            } else {
                // IP is greater than this block, search in the right half
                l = m + 1;
            }
        }

        //not matched
        if (dataPtr == 0) {
            return null;
        }

        //3. get the data
        this.raf!.seek(dataPtr);
        const region = Buffer.alloc(dataLen);
        this.raf!.readFully(region);
        return new DataBlock(region, dataPtr);
    }

    /**
     * get by index ptr
     *
     * @param ptr
     * @throws IOException
     */
    // private getByIndexPtr(ptr: number): DataBlock {
    //     this.raf.seek(ptr);
    //     const buffer = Buffer.alloc(36);
    //     this.raf.readFully(buffer, 0, buffer.length);
    //     const extra = ByteUtil.getIntLong(buffer, 32);

    //     const dataLen = (extra >> 24) & 0xFF;
    //     const dataPtr = (extra & 0x00FFFFFF);

    //     this.raf.seek(dataPtr);
    //     const region = Buffer.alloc(dataLen);
    //     this.raf.readFully(region, 0, region.length);

    //     return new DataBlock(region, dataPtr);
    // }

    /**
     * get db type
     *
     * @return
     */
    public getDbType(): DbType {
        return this.dbType;
    }

    /**
     * get query type
     *
     * @return
     */
    public getQueryType(): QueryType {
        return this.queryType;
    }

    /**
     * close the db
     *
     * @throws IOException
     */
    public close(): void {
        //let gc do its work
        this.HeaderSip = [];
        this.HeaderPtr = [];
        this.dbBinStr = null;

        if (this.raf !== null) {
            this.raf.close();
        }
    }

    getIpBytes(ip: string): Buffer {
        // 检查 IP 地址是否有效
        if (!net.isIP(ip)) {
            throw new Error('Invalid IP address');
        }

        // 判断是 IPv4 还是 IPv6
        const isIPv4 = net.isIPv4(ip);

        if (isIPv4) {
            // 处理 IPv4
            return Buffer.from(ip.split('.').map(octet => parseInt(octet)));
        } else {
            // 处理 IPv6
            return Buffer.from(ip.split(':').reduce((acc, part) => {
                if (part === '') {
                    // 处理双冒号的情况
                    acc.push(...new Array(8 - ip.split(':').filter(Boolean).length).fill('0000'));
                } else {
                    acc.push(part.padStart(4, '0'));
                }
                return acc;
            }, [] as string[]).join(''), 'hex');
        }
    }

    /**
     * This method compares two byte arrays up to a specified length.
     * It is used to compare IP addresses in byte array format.
     * The comparison is done byte by byte, and the method returns as soon as a difference is found.
     * If the bytes at the current position in both arrays are positive or negative, the method compares their values.
     * If the bytes at the current position in both arrays have different signs, the method considers the negative byte as larger.
     * If one of the bytes at the current position is zero and the other is not, the method considers the zero byte as smaller.
     * If the method has compared all bytes up to the specified length and found no differences, it compares the lengths of the byte arrays.
     * If the lengths are equal, the byte arrays are considered equal.
     * If one byte array is longer than the other, it is considered larger.
     *
     * @param bytes1 The first byte array to compare. It represents an IP address.
     * @param bytes2 The second byte array to compare. It represents an IP address.
     * @param length The number of bytes to compare in each byte array.
     * @return A negative integer if the first byte array is less than the second, zero if they are equal, or a positive integer if the first byte array is greater than the second.
     */
    private compareBytes(bytes1: Buffer, bytes2: Buffer, length: number): number {
        for (let i = 0; i < bytes1.length && i < bytes2.length && i < length; i++) {
            if (bytes1[i] * bytes2[i] > 0) {
                if (bytes1[i] < bytes2[i]) {
                    return -1;
                } else if (bytes1[i] > bytes2[i]) {
                    return 1;
                }
            } else if (bytes1[i] * bytes2[i] < 0) {
                // When the signs are different, the negative byte is considered larger
                if (bytes1[i] > 0) {
                    return -1;
                } else {
                    return 1;
                }
            } else if (bytes1[i] * bytes2[i] == 0 && bytes1[i] + bytes2[i] != 0) {
                // When one byte is zero and the other is not, the zero byte is considered smaller
                if (bytes1[i] == 0) {
                    return -1;
                } else {
                    return 1;
                }
            }
        }
        if (bytes1.length >= length && bytes2.length >= length) {
            return 0;
        } else {
            return bytes1.length - bytes2.length;
        }
    }
}

export { DbType, QueryType, Cz88RandomAccessFile, HyperHeaderDecoder, IndexBlock, Decryptor, DataBlock };
