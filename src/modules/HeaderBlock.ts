import ByteUtil from '../utils/ByteUtils';

export default class HeaderBlock {
    public static readonly HEADER_LINE_SIZE = 20;
    private indexStartIp: Buffer;
    private indexPtr: number;

    /**
     * Constructs a new HeaderBlock with the specified index start IP address and index pointer.
     *
     * @param indexStartIp the index start IP address
     * @param indexPtr the index pointer
     */
    constructor(indexStartIp: Buffer, indexPtr: number) {
        this.indexStartIp = indexStartIp;
        this.indexPtr = indexPtr;
    }

    /**
     * Returns the index start IP address of this header block.
     *
     * @return the index start IP address of this header block
     */
    getIndexStartIp(): Buffer {
        return this.indexStartIp;
    }

    /**
     * Sets the index start IP address of this header block to the specified value.
     *
     * @param indexStartIp the new index start IP address
     * @return this header block
     */
    setIndexStartIp(indexStartIp: Buffer): HeaderBlock {
        this.indexStartIp = indexStartIp;
        return this;
    }

    /**
     * Returns the index pointer of this header block.
     *
     * @return the index pointer of this header block
     */
    getIndexPtr(): number {
        return this.indexPtr;
    }

    /**
     * Sets the index pointer of this header block to the specified value.
     *
     * @param indexPtr the new index pointer
     * @return this header block
     */
    setIndexPtr(indexPtr: number): HeaderBlock {
        this.indexPtr = indexPtr;
        return this;
    }

    /**
     * Returns the bytes for database storage.
     * The returned byte array is 20 bytes long, with the first 16 bytes being the index start IP address and the last 4 bytes being the index pointer.
     *
     * @return a byte array representing this header block for database storage
     */
    getBytes(): Buffer {
        const b = Buffer.alloc(20);

        b.set(this.indexStartIp.slice(0, Math.min(this.indexStartIp.length, 16)), 0);
        ByteUtil.writeIntLong(b, 16, this.indexPtr);
        return b;
    }
}
