import DbType from '../typings/DbType.js';
import ByteUtil from '../utils/ByteUtils.js';

export default class IndexBlock {
    private startIp: Buffer;
    private endIp: Buffer;
    private dataPtr: number;
    private dataLen: number;
    private dbType: DbType;

    /**
     * Constructor for the IndexBlock class.
     * It initializes the start IP, end IP, data pointer, and data length with the provided values.
     *
     * @param startIp The start IP address of the range that the data block covers.
     * @param endIp The end IP address of the range that the data block covers.
     * @param dataPtr The pointer to the data block in the database.
     * @param dataLen The length of the data block in bytes.
     * @param dbType The type of the database (IPV4 or IPV6).
     */
    constructor(startIp: Buffer, endIp: Buffer, dataPtr: number, dataLen: number, dbType: DbType) {
        this.startIp = startIp;
        this.endIp = endIp;
        this.dataPtr = dataPtr;
        this.dataLen = dataLen;
        this.dbType = dbType;
    }

    getStartIp(): Buffer {
        return this.startIp;
    }

    setStartIp(startIp: Buffer): IndexBlock {
        this.startIp = startIp;
        return this;
    }

    getEndIp(): Buffer {
        return this.endIp;
    }

    setEndIp(endIp: Buffer): IndexBlock {
        this.endIp = endIp;
        return this;
    }

    getDataPtr(): number {
        return this.dataPtr;
    }

    setDataPtr(dataPtr: number): IndexBlock {
        this.dataPtr = dataPtr;
        return this;
    }

    getDataLen(): number {
        return this.dataLen;
    }

    setDataLen(dataLen: number): IndexBlock {
        this.dataLen = dataLen;
        return this;
    }

    static getIndexBlockLength(dbType: DbType): number {
        // 16 bytes for start IP, 16 bytes for end IP if IPV6
        // or 4 bytes for start IP and 4 bytes for end IP if IPV4
        // + 4 bytes for data ptr and 1 byte for data len
        return dbType === DbType.IPV4 ? 13 : 37;
    }

    /**
     * Returns a byte array representing the index block.
     * The byte array is structured as follows:
     * +------------+-----------+-----------+
     * | 4/16 bytes | 4/16 bytes | 4 bytes  | 1 byte  |
     * +------------+-----------+-----------+
     *  start ip    end ip      data ptr    len
     *
     * @return A byte array representing the index block.
     */
    getBytes(): Buffer {
        const ipBytesLength = this.dbType === DbType.IPV4 ? 4 : 16;
        const b = Buffer.alloc(IndexBlock.getIndexBlockLength(this.dbType));

        b.set(this.startIp.slice(0, ipBytesLength), 0);
        b.set(this.endIp.slice(0, ipBytesLength), ipBytesLength);

        // Write the data ptr and the length
        ByteUtil.writeIntLong(b, ipBytesLength * 2, this.dataPtr);
        ByteUtil.write(b, ipBytesLength * 2 + 4, this.dataLen, 1);

        return b;
    }
}
