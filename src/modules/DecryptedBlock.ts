import ByteUtil from '../utils/ByteUtils';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export default class DecryptedBlock {
    private clientId: number;
    private expirationDate: number;
    private randomSize: number;

    constructor() {
        this.clientId = 0;
        this.expirationDate = 0;
        this.randomSize = 0;
    }

    /**
     * Gets the client ID.
     * @return The client ID.
     */
    getClientId(): number {
        return this.clientId;
    }

    /**
     * Sets the client ID.
     * @param clientId The client ID to set.
     */
    setClientId(clientId: number): void {
        this.clientId = clientId;
    }

    /**
     * Gets the expiration date.
     * @return The expiration date.
     */
    getExpirationDate(): number {
        return this.expirationDate;
    }

    /**
     * Sets the expiration date.
     * @param expirationDate The expiration date to set.
     */
    setExpirationDate(expirationDate: number): void {
        this.expirationDate = expirationDate;
    }

    /**
     * Gets the size of the random bytes.
     * This method returns the size of the random bytes that are used in the encryption process.
     * The random bytes size is crucial for ensuring the uniqueness and security of the encryption.
     *
     * @return The size of the random bytes.
     */
    getRandomSize(): number {
        return this.randomSize;
    }

    /**
     * Sets the size of the random bytes.
     * This method allows setting the size of the random bytes that are to be used in the encryption process.
     * Adjusting the size of the random bytes can impact the security and performance of the encryption.
     *
     * @param randomSize The size of the random bytes to set.
     */
    setRandomSize(randomSize: number): void {
        this.randomSize = randomSize;
    }

    /**
     * Serializes the DecryptedBlock instance into a byte array.
     * The array is structured as follows: the first 4 bytes contain the client ID and expiration date,
     * the next 4 bytes contain the start pointer, and the last 8 bytes are reserved and initialized to 0.
     * @return A 16-byte array representing the serialized DecryptedBlock instance.
     */
    toBytes(): Buffer {
        const b = Buffer.alloc(16);
        ByteUtil.writeIntLong(b, 0, (this.clientId << 20) | this.expirationDate);
        ByteUtil.writeIntLong(b, 4, this.randomSize);
        // The reserved 8 bytes are already initialized to 0 by default.
        return b;
    }

    /**
     * Encrypts the provided byte array using AES encryption with a specified key.
     * The key is expected to be a base64 encoded string representing the AES key.
     * @param data The byte array to encrypt.
     * @param key The base64 encoded string representing the AES key.
     * @return The encrypted byte array.
     * @throws Exception If an error occurs during encryption.
     */
    encrypt(data: Buffer, key: string): Buffer {
        const keyBytes = Buffer.from(key, 'base64');
        const iv = randomBytes(16); // AES requires a 16-byte IV
        const cipher = createCipheriv('aes-256-cbc', keyBytes, iv);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        return Buffer.concat([iv, encrypted]);
    }

    toEncryptedBytes(key: string): Buffer {
        return this.encrypt(this.toBytes(), key);
    }

    static decrypt(key: string, encryptedBytes: Buffer): DecryptedBlock {
        const keyBytes = Buffer.from(key, 'base64');

        const decipher = createDecipheriv('aes-128-ecb', keyBytes, null);
        decipher.setAutoPadding(true);

        let decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedBytes)),
            decipher.final()
        ]);

        const decryptedBlock = new DecryptedBlock();
        const clientId = ByteUtil.getIntLong(decrypted, 0) >> 20;
        decryptedBlock.setClientId(clientId);
        const date = ByteUtil.getIntLong(decrypted, 0) & 0xFFFFF;
        decryptedBlock.setExpirationDate(date);
        const size = ByteUtil.getIntLong(decrypted, 4)
        decryptedBlock.setRandomSize(size);
        return decryptedBlock;
    }
}
