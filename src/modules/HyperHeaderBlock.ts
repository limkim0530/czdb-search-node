import DecryptedBlock from './DecryptedBlock.js';
import ByteUtil from '../utils/ByteUtils.js';

export default class HyperHeaderBlock {
    public static readonly HEADER_SIZE = 12;
    protected version: number;
    protected clientId: number;
    protected encryptedBlockSize: number;
    protected encryptedData: Buffer;
    protected decryptedBlock: DecryptedBlock;

    constructor() {
        this.version = 0;
        this.clientId = 0;
        this.encryptedBlockSize = 0;
        this.encryptedData = Buffer.alloc(0);
        this.decryptedBlock = new DecryptedBlock();
    }

    /**
     * Gets the version of the HyperHeaderBlock.
     * @return The version of the HyperHeaderBlock.
     */
    getVersion(): number {
        return this.version;
    }

    /**
     * Sets the version of the HyperHeaderBlock.
     * @param version The version to set.
     */
    setVersion(version: number): void {
        this.version = version;
    }

    /**
     * Gets the client ID of the HyperHeaderBlock.
     * @return The client ID of the HyperHeaderBlock.
     */
    getClientId(): number {
        return this.clientId;
    }

    /**
     * Sets the client ID of the HyperHeaderBlock.
     * @param clientId The client ID to set.
     */
    setClientId(clientId: number): void {
        this.clientId = clientId;
    }

    /**
     * Gets the size of the encrypted data block.
     * @return The size of the encrypted data block.
     */
    getEncryptedBlockSize(): number {
        return this.encryptedBlockSize;
    }

    /**
     * Sets the size of the encrypted data block.
     * @param encryptedBlockSize The size of the encrypted data block to set.
     */
    setEncryptedBlockSize(encryptedBlockSize: number): void {
        this.encryptedBlockSize = encryptedBlockSize;
    }

    getEncryptedData(): Buffer {
        return this.encryptedData;
    }

    setEncryptedData(encryptedData: Buffer): void {
        this.encryptedData = encryptedData;
    }

    getDecryptedBlock(): DecryptedBlock {
        return this.decryptedBlock;
    }

    setDecryptedBlock(decryptedBlock: DecryptedBlock): void {
        this.decryptedBlock = decryptedBlock;
    }

    /**
     * Converts the HyperHeaderBlock instance into a byte array.
     * This method serializes the HyperHeaderBlock instance into a byte array, which can be used for storage or transmission.
     * The byte array is structured as follows:
     * - The first 4 bytes represent the version of the HyperHeaderBlock.
     * - The next 4 bytes represent the client ID.
     * - The following 4 bytes represent the length of the encrypted data.
     *
     * @return A byte array representing the serialized HyperHeaderBlock instance.
     */
    toBytes(): Buffer {
        const bytes = Buffer.alloc(12);
        ByteUtil.writeIntLong(bytes, 0, this.version);
        ByteUtil.writeIntLong(bytes, 4, this.clientId);
        ByteUtil.writeIntLong(bytes, 8, this.encryptedBlockSize);
        return bytes;
    }

    /**
     * Deserializes a HyperHeaderBlock instance from a 12 length byte array.
     * This method takes a byte array and constructs a HyperHeaderBlock instance from it.
     * The byte array is expected to be structured as follows:
     * - The first 4 bytes represent the version of the HyperHeaderBlock.
     * - The next 4 bytes represent the client ID.
     * - The following 4 bytes represent the length of the encrypted data.
     *
     * @param bytes The byte array to deserialize.
     * @return A HyperHeaderBlock instance constructed from the byte array.
     */
    static fromBytes(bytes: Buffer): HyperHeaderBlock {
        const version = ByteUtil.getIntLong(bytes, 0);
        const clientId = ByteUtil.getIntLong(bytes, 4);
        const encryptedBlockSize = ByteUtil.getIntLong(bytes, 8);

        const headerBlock = new HyperHeaderBlock();
        headerBlock.setVersion(version);
        headerBlock.setClientId(clientId);
        headerBlock.setEncryptedBlockSize(encryptedBlockSize);

        return headerBlock;
    }

    /**
     * Returns the total size of the HyperHeaderBlock.
     * The size is calculated as the sum of the following:
     * - The size of the header (12 bytes)
     * - The size of the encrypted data block
     * - The size of the random bytes
     *
     * @return The total size of the HyperHeaderBlock in bytes.
     */
    getHeaderSize(): number {
        return 12 + this.encryptedBlockSize + this.decryptedBlock.getRandomSize();
    }
}
