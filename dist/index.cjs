'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var net = require('net');
var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var msgpack = require('@msgpack/msgpack');

class Cz88RandomAccessFile {
    constructor(filename, mode, offset) {
        this.currentPosition = 0;
        this.fd = fs.openSync(filename, mode);
        this.alive = true;
        this.offset = offset;
    }
    seek(position) {
        this.currentPosition = position + this.offset;
    }
    read(buffer, length) {
        return fs.readSync(this.fd, buffer, 0, length, this.currentPosition);
    }
    readFully(buffer, off = 0, len = buffer.length) {
        let bytesRead = 0;
        while (bytesRead < len) {
            const n = fs.readSync(this.fd, buffer, off + bytesRead, len - bytesRead, this.currentPosition + bytesRead);
            if (n === 0) {
                throw new Error('EOF reached before reading fully');
            }
            bytesRead += n;
        }
        this.currentPosition += bytesRead;
    }
    write(buffer, length) {
        return fs.writeSync(this.fd, buffer, 0, length, this.currentPosition);
    }
    length() {
        const stats = fs.fstatSync(this.fd);
        return stats.size - this.offset;
    }
    close() {
        if (this.alive) {
            fs.closeSync(this.fd);
            this.alive = false;
        }
    }
}

class ByteUtil {
    static write(b, offset, v, bytes) {
        for (let i = 0; i < bytes; i++) {
            b[offset++] = (v >>> (8 * i)) & 0xFF;
        }
    }
    static writeIntLong(b, offset, v) {
        b[offset++] = (v >> 0) & 0xFF;
        b[offset++] = (v >> 8) & 0xFF;
        b[offset++] = (v >> 16) & 0xFF;
        b[offset] = (v >> 24) & 0xFF;
    }
    static getIntLong(b, offset) {
        return ((b[offset++] & 0x000000FF) |
            ((b[offset++] << 8) & 0x0000FF00) |
            ((b[offset++] << 16) & 0x00FF0000) |
            ((b[offset] << 24) & 0xFF000000));
    }
    static getInt3(b, offset) {
        return ((b[offset++] & 0x000000FF) |
            (b[offset++] & 0x0000FF00) |
            (b[offset] & 0x00FF0000));
    }
    static getInt2(b, offset) {
        return ((b[offset++] & 0x000000FF) |
            (b[offset] & 0x0000FF00));
    }
    static getInt1(b, offset) {
        return (b[offset] & 0x000000FF);
    }
}

class DecryptedBlock {
    constructor() {
        this.clientId = 0;
        this.expirationDate = 0;
        this.randomSize = 0;
    }
    getClientId() {
        return this.clientId;
    }
    setClientId(clientId) {
        this.clientId = clientId;
    }
    getExpirationDate() {
        return this.expirationDate;
    }
    setExpirationDate(expirationDate) {
        this.expirationDate = expirationDate;
    }
    getRandomSize() {
        return this.randomSize;
    }
    setRandomSize(randomSize) {
        this.randomSize = randomSize;
    }
    toBytes() {
        const b = Buffer.alloc(16);
        ByteUtil.writeIntLong(b, 0, (this.clientId << 20) | this.expirationDate);
        ByteUtil.writeIntLong(b, 4, this.randomSize);
        return b;
    }
    encrypt(data, key) {
        const keyBytes = Buffer.from(key, 'base64');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', keyBytes, iv);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        return Buffer.concat([iv, encrypted]);
    }
    toEncryptedBytes(key) {
        return this.encrypt(this.toBytes(), key);
    }
    static decrypt(key, encryptedBytes) {
        const keyBytes = Buffer.from(key, 'base64');
        const decipher = crypto.createDecipheriv('aes-128-ecb', keyBytes, null);
        decipher.setAutoPadding(true);
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedBytes)),
            decipher.final()
        ]);
        const decryptedBlock = new DecryptedBlock();
        const clientId = ByteUtil.getIntLong(decrypted, 0) >> 20;
        decryptedBlock.setClientId(clientId);
        const date = ByteUtil.getIntLong(decrypted, 0) & 0xFFFFF;
        decryptedBlock.setExpirationDate(date);
        const size = ByteUtil.getIntLong(decrypted, 4);
        decryptedBlock.setRandomSize(size);
        return decryptedBlock;
    }
}

class HyperHeaderBlock {
    constructor() {
        this.version = 0;
        this.clientId = 0;
        this.encryptedBlockSize = 0;
        this.encryptedData = Buffer.alloc(0);
        this.decryptedBlock = new DecryptedBlock();
    }
    getVersion() {
        return this.version;
    }
    setVersion(version) {
        this.version = version;
    }
    getClientId() {
        return this.clientId;
    }
    setClientId(clientId) {
        this.clientId = clientId;
    }
    getEncryptedBlockSize() {
        return this.encryptedBlockSize;
    }
    setEncryptedBlockSize(encryptedBlockSize) {
        this.encryptedBlockSize = encryptedBlockSize;
    }
    getEncryptedData() {
        return this.encryptedData;
    }
    setEncryptedData(encryptedData) {
        this.encryptedData = encryptedData;
    }
    getDecryptedBlock() {
        return this.decryptedBlock;
    }
    setDecryptedBlock(decryptedBlock) {
        this.decryptedBlock = decryptedBlock;
    }
    toBytes() {
        const bytes = Buffer.alloc(12);
        ByteUtil.writeIntLong(bytes, 0, this.version);
        ByteUtil.writeIntLong(bytes, 4, this.clientId);
        ByteUtil.writeIntLong(bytes, 8, this.encryptedBlockSize);
        return bytes;
    }
    static fromBytes(bytes) {
        const version = ByteUtil.getIntLong(bytes, 0);
        const clientId = ByteUtil.getIntLong(bytes, 4);
        const encryptedBlockSize = ByteUtil.getIntLong(bytes, 8);
        const headerBlock = new HyperHeaderBlock();
        headerBlock.setVersion(version);
        headerBlock.setClientId(clientId);
        headerBlock.setEncryptedBlockSize(encryptedBlockSize);
        return headerBlock;
    }
    getHeaderSize() {
        return 12 + this.encryptedBlockSize + this.decryptedBlock.getRandomSize();
    }
}
HyperHeaderBlock.HEADER_SIZE = 12;

class HyperHeaderDecoder {
    static decrypt(dbFile, key) {
        const fd = typeof dbFile === 'string' ? fs.openSync(path.resolve(dbFile), 'r') : dbFile;
        const headerBytes = Buffer.alloc(HyperHeaderBlock.HEADER_SIZE);
        fs.readSync(fd, headerBytes, 0, HyperHeaderBlock.HEADER_SIZE, 0);
        const version = ByteUtil.getIntLong(headerBytes, 0);
        const clientId = ByteUtil.getIntLong(headerBytes, 4);
        const encryptedBlockSize = ByteUtil.getIntLong(headerBytes, 8);
        const encryptedBytes = Buffer.alloc(encryptedBlockSize);
        fs.readSync(fd, encryptedBytes, 0, encryptedBlockSize, HyperHeaderBlock.HEADER_SIZE);
        fs.closeSync(fd);
        const decryptedBlock = DecryptedBlock.decrypt(key, encryptedBytes);
        if (decryptedBlock.getClientId() !== clientId) {
            throw new Error("Wrong clientId");
        }
        const currentDate = parseInt(new Date().toISOString().slice(2, 10).replace(/-/g, ''), 10);
        if (decryptedBlock.getExpirationDate() < currentDate) {
            throw new Error("DB is expired");
        }
        const hyperHeaderBlock = new HyperHeaderBlock();
        hyperHeaderBlock.setVersion(version);
        hyperHeaderBlock.setClientId(clientId);
        hyperHeaderBlock.setEncryptedBlockSize(encryptedBlockSize);
        hyperHeaderBlock.setDecryptedBlock(decryptedBlock);
        return hyperHeaderBlock;
    }
}

var DbType;
(function (DbType) {
    DbType["IPV4"] = "IPV4";
    DbType["IPV6"] = "IPV6";
})(DbType || (DbType = {}));
var DbType$1 = DbType;

var QueryType;
(function (QueryType) {
    QueryType["MEMORY"] = "MEMORY";
    QueryType["BTREE"] = "BTREE";
})(QueryType || (QueryType = {}));
var QueryType$1 = QueryType;

const FILE_SIZE_PTR = 1;
const FIRST_INDEX_PTR = 5;
const HEADER_BLOCK_PTR = 9;
const END_INDEX_PTR = 13;
const SUPER_PART_LENGTH = 17;

class IndexBlock {
    constructor(startIp, endIp, dataPtr, dataLen, dbType) {
        this.startIp = startIp;
        this.endIp = endIp;
        this.dataPtr = dataPtr;
        this.dataLen = dataLen;
        this.dbType = dbType;
    }
    getStartIp() {
        return this.startIp;
    }
    setStartIp(startIp) {
        this.startIp = startIp;
        return this;
    }
    getEndIp() {
        return this.endIp;
    }
    setEndIp(endIp) {
        this.endIp = endIp;
        return this;
    }
    getDataPtr() {
        return this.dataPtr;
    }
    setDataPtr(dataPtr) {
        this.dataPtr = dataPtr;
        return this;
    }
    getDataLen() {
        return this.dataLen;
    }
    setDataLen(dataLen) {
        this.dataLen = dataLen;
        return this;
    }
    static getIndexBlockLength(dbType) {
        return dbType === DbType$1.IPV4 ? 13 : 37;
    }
    getBytes() {
        const ipBytesLength = this.dbType === DbType$1.IPV4 ? 4 : 16;
        const b = Buffer.alloc(IndexBlock.getIndexBlockLength(this.dbType));
        b.set(this.startIp.slice(0, ipBytesLength), 0);
        b.set(this.endIp.slice(0, ipBytesLength), ipBytesLength);
        ByteUtil.writeIntLong(b, ipBytesLength * 2, this.dataPtr);
        ByteUtil.write(b, ipBytesLength * 2 + 4, this.dataLen, 1);
        return b;
    }
}

class Decryptor {
    constructor(key) {
        this.keyBytes = Buffer.from(key, 'base64');
    }
    decrypt(data) {
        const result = Buffer.alloc(data.length);
        for (let i = 0; i < data.length; i++) {
            result[i] = data[i] ^ this.keyBytes[i % this.keyBytes.length];
        }
        return result;
    }
}

class DataBlock {
    constructor(region, dataPtr) {
        this.region = region;
        this.dataPtr = dataPtr;
    }
    getRegion(geoMapData, columnSelection) {
        try {
            return this.unpack(geoMapData, columnSelection);
        }
        catch (_a) {
            return null;
        }
    }
    setRegion(region) {
        this.region = region;
        return this;
    }
    getDataPtr() {
        return this.dataPtr;
    }
    setDataPtr(dataPtr) {
        this.dataPtr = dataPtr;
        return this;
    }
    unpack(geoMapData, columnSelection) {
        const regionUnpacker = msgpack.decodeMulti(this.region);
        const geoPosMixSize = regionUnpacker.next().value;
        const otherData = regionUnpacker.next().value;
        if (geoPosMixSize === 0) {
            return otherData;
        }
        const dataLen = (geoPosMixSize >> 24) & 0xFF;
        const dataPtr = geoPosMixSize & 0x00FFFFFF;
        if (!geoMapData) {
            return null;
        }
        const regionData = Buffer.alloc(dataLen);
        regionData.set(geoMapData.subarray(dataPtr, dataPtr + dataLen), 0);
        let str = '';
        const geoColumnUnpackedData = msgpack.decode(regionData);
        const columnNumber = geoColumnUnpackedData.length;
        for (let i = 0; i < columnNumber; i++) {
            const columnSelected = (columnSelection >> (i + 1) & 1) === 1;
            let value = geoColumnUnpackedData[i];
            if (!value || !value.trim()) {
                value = "null";
            }
            if (columnSelected) {
                str += value;
                str += "\t";
            }
        }
        return str + otherData;
    }
}

class DbSearcher {
    constructor(dbFile, queryType, key) {
        this.dbType = DbType$1.IPV4;
        this.ipBytesLength = 0;
        this.totalHeaderBlockSize = 0;
        this.raf = null;
        this.HeaderSip = [];
        this.HeaderPtr = [];
        this.headerLength = 0;
        this.firstIndexPtr = 0;
        this.totalIndexBlocks = 0;
        this.dbBinStr = null;
        this.columnSelection = 0;
        this.geoMapData = null;
        this.queryType = queryType;
        const headerBlock = HyperHeaderDecoder.decrypt(dbFile, key);
        this.raf = new Cz88RandomAccessFile(dbFile, "r", headerBlock.getHeaderSize());
        this.raf.seek(0);
        const superBytes = Buffer.alloc(SUPER_PART_LENGTH);
        this.raf.readFully(superBytes);
        this.dbType = (superBytes[0] & 1) === 0 ? DbType$1.IPV4 : DbType$1.IPV6;
        this.ipBytesLength = this.dbType === DbType$1.IPV4 ? 4 : 16;
        this.loadGeoSetting(this.raf, key);
        if (queryType === QueryType$1.MEMORY) {
            this.initializeForMemorySearch();
        }
        else if (queryType === QueryType$1.BTREE) {
            this.initBtreeModeParam(this.raf);
        }
    }
    loadGeoSetting(raf, key) {
        raf.seek(END_INDEX_PTR);
        const data = Buffer.alloc(4);
        raf.readFully(data);
        const endIndexPtr = ByteUtil.getIntLong(data, 0);
        const columnSelectionPtr = endIndexPtr + IndexBlock.getIndexBlockLength(this.dbType);
        raf.seek(columnSelectionPtr);
        raf.readFully(data);
        this.columnSelection = ByteUtil.getIntLong(data, 0);
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
    initializeForMemorySearch() {
        this.dbBinStr = Buffer.alloc(this.raf.length());
        this.raf.seek(0);
        this.raf.readFully(this.dbBinStr);
        this.raf.close();
        this.initMemoryOrBinaryModeParam(this.dbBinStr, this.dbBinStr.length);
    }
    initMemoryOrBinaryModeParam(bytes, fileSize) {
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
    initBtreeModeParam(raf) {
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
    initHeaderBlock(headerBytes) {
        const indexLength = 20;
        const len = headerBytes.length / indexLength;
        let idx = 0;
        this.HeaderSip = Array.from({ length: len }, () => Buffer.alloc(16));
        this.HeaderPtr = [];
        let dataPtr;
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
    search(ip) {
        const ipBytes = this.getIpBytes(ip);
        let dataBlock = null;
        switch (this.queryType) {
            case QueryType$1.MEMORY:
                dataBlock = this.memorySearch(ipBytes);
                break;
            case QueryType$1.BTREE:
                dataBlock = this.bTreeSearch(ipBytes);
                break;
        }
        if (dataBlock === null) {
            return null;
        }
        return dataBlock.getRegion(this.geoMapData, this.columnSelection);
    }
    memorySearch(ip) {
        const blockLen = IndexBlock.getIndexBlockLength(this.dbType);
        const sptrNeptr = this.searchInHeader(ip);
        const sptr = sptrNeptr[0], eptr = sptrNeptr[1];
        if (sptr == 0) {
            return null;
        }
        let l = 0, h = (eptr - sptr) / blockLen;
        const sip = Buffer.alloc(this.ipBytesLength), eip = Buffer.alloc(this.ipBytesLength);
        let dataPtr = 0;
        let dataLen = 0;
        while (l <= h && this.dbBinStr) {
            const m = (l + h) >> 1;
            const p = sptr + m * blockLen;
            sip.set(this.dbBinStr.subarray(p, p + this.ipBytesLength), 0);
            eip.set(this.dbBinStr.subarray(p + this.ipBytesLength, p + this.ipBytesLength + this.ipBytesLength), 0);
            const cmpStart = this.compareBytes(ip, sip, this.ipBytesLength);
            const cmpEnd = this.compareBytes(ip, eip, this.ipBytesLength);
            if (cmpStart >= 0 && cmpEnd <= 0) {
                dataPtr = ByteUtil.getIntLong(this.dbBinStr, p + this.ipBytesLength * 2);
                dataLen = ByteUtil.getInt1(this.dbBinStr, p + this.ipBytesLength * 2 + 4);
                break;
            }
            else if (cmpStart < 0) {
                h = m - 1;
            }
            else {
                l = m + 1;
            }
        }
        if (dataPtr === 0 || !this.dbBinStr) {
            return null;
        }
        const region = Buffer.alloc(dataLen);
        region.set(this.dbBinStr.subarray(dataPtr, dataPtr + dataLen), 0);
        return new DataBlock(region, dataPtr);
    }
    searchInHeader(ip) {
        let l = 0, h = this.headerLength - 1, sptr = 0, eptr = 0;
        while (l <= h) {
            const m = (l + h) >> 1;
            const cmp = this.compareBytes(ip, this.HeaderSip[m], this.ipBytesLength);
            if (cmp < 0) {
                h = m - 1;
            }
            else if (cmp > 0) {
                l = m + 1;
            }
            else {
                sptr = this.HeaderPtr[m > 0 ? m - 1 : m];
                eptr = this.HeaderPtr[m];
                break;
            }
        }
        if (l == 0 && h <= 0) {
            return [0, 0];
        }
        if (l > h) {
            if (l < this.headerLength) {
                sptr = this.HeaderPtr[l - 1];
                eptr = this.HeaderPtr[l];
            }
            else if (h >= 0 && h + 1 < this.headerLength) {
                sptr = this.HeaderPtr[h];
                eptr = this.HeaderPtr[h + 1];
            }
            else {
                sptr = this.HeaderPtr[this.headerLength - 1];
                const blockLen = IndexBlock.getIndexBlockLength(this.dbType);
                eptr = sptr + blockLen;
            }
        }
        return [sptr, eptr];
    }
    bTreeSearch(ip) {
        const sptrNeptr = this.searchInHeader(ip);
        const sptr = sptrNeptr[0], eptr = sptrNeptr[1];
        if (sptr == 0) {
            return null;
        }
        const blockLen = eptr - sptr, blen = IndexBlock.getIndexBlockLength(this.dbType);
        const iBuffer = Buffer.alloc(blockLen + blen);
        this.raf.seek(sptr);
        this.raf.readFully(iBuffer, 0, iBuffer.length);
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
                dataPtr = ByteUtil.getIntLong(iBuffer, p + this.ipBytesLength * 2);
                dataLen = ByteUtil.getInt1(iBuffer, p + this.ipBytesLength * 2 + 4);
                break;
            }
            else if (cmpStart < 0) {
                h = m - 1;
            }
            else {
                l = m + 1;
            }
        }
        if (dataPtr == 0) {
            return null;
        }
        this.raf.seek(dataPtr);
        const region = Buffer.alloc(dataLen);
        this.raf.readFully(region);
        return new DataBlock(region, dataPtr);
    }
    getDbType() {
        return this.dbType;
    }
    getQueryType() {
        return this.queryType;
    }
    close() {
        this.HeaderSip = [];
        this.HeaderPtr = [];
        this.dbBinStr = null;
        if (this.raf !== null) {
            this.raf.close();
        }
    }
    getIpBytes(ip) {
        if (!net.isIP(ip)) {
            throw new Error('Invalid IP address');
        }
        const isIPv4 = net.isIPv4(ip);
        if (isIPv4) {
            return Buffer.from(ip.split('.').map(octet => parseInt(octet)));
        }
        else {
            return Buffer.from(ip.split(':').reduce((acc, part) => {
                if (part === '') {
                    const array = new Array(8 - ip.split(':').filter(Boolean).length).fill('0000');
                    acc.push(...array);
                }
                else {
                    acc.push(part.padStart(4, '0'));
                }
                return acc;
            }, []).join(''), 'hex');
        }
    }
    compareBytes(bytes1, bytes2, length) {
        for (let i = 0; i < bytes1.length && i < bytes2.length && i < length; i++) {
            if (bytes1[i] * bytes2[i] > 0) {
                if (bytes1[i] < bytes2[i]) {
                    return -1;
                }
                else if (bytes1[i] > bytes2[i]) {
                    return 1;
                }
            }
            else if (bytes1[i] * bytes2[i] < 0) {
                if (bytes1[i] > 0) {
                    return -1;
                }
                else {
                    return 1;
                }
            }
            else if (bytes1[i] * bytes2[i] == 0 && bytes1[i] + bytes2[i] != 0) {
                if (bytes1[i] == 0) {
                    return -1;
                }
                else {
                    return 1;
                }
            }
        }
        if (bytes1.length >= length && bytes2.length >= length) {
            return 0;
        }
        else {
            return bytes1.length - bytes2.length;
        }
    }
}

exports.Cz88RandomAccessFile = Cz88RandomAccessFile;
exports.DataBlock = DataBlock;
exports.DbType = DbType$1;
exports.Decryptor = Decryptor;
exports.HyperHeaderDecoder = HyperHeaderDecoder;
exports.IndexBlock = IndexBlock;
exports.QueryType = QueryType$1;
exports.default = DbSearcher;
