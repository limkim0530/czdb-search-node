import HyperHeaderBlock from '../modules/HyperHeaderBlock.js';
import DecryptedBlock from '../modules/DecryptedBlock.js';
import ByteUtil from './ByteUtils.js';
import { closeSync, openSync, readSync } from 'fs';
import { resolve } from 'path';

export default class HyperHeaderDecoder {
    /**
     * Reads data from an InputStream and deserializes it into a HyperHeaderBlock.
     * The method first reads the header bytes and extracts the version, clientId, and encryptedBlockSize.
     * Then it reads the encrypted bytes and decrypts them into a DecryptedBlock.
     * It checks if the clientId and expirationDate in the DecryptedBlock match the clientId and version in the HyperHeaderBlock.
     * If they do not match, it throws an exception.
     * If the expirationDate in the DecryptedBlock is less than the current date, it throws an exception.
     * Finally, it creates a new HyperHeaderBlock with the read and decrypted data and returns it.
     *
     * @param is The InputStream to read data from.
     * @param key The key used for decryption.
     * @return A HyperHeaderBlock deserialized from the read data.
     * @throws Exception If an error occurs during the decryption process, or if the clientId or expirationDate do not match the expected values.
     */
    static decrypt(dbFile: string | number, key: string): HyperHeaderBlock {

        // 打开文件
        const fd = typeof dbFile === 'string' ? openSync(resolve(dbFile), 'r') : dbFile;

        const headerBytes = Buffer.alloc(HyperHeaderBlock.HEADER_SIZE);
        readSync(fd, headerBytes, 0, HyperHeaderBlock.HEADER_SIZE, 0);

        const version = ByteUtil.getIntLong(headerBytes, 0);
        const clientId = ByteUtil.getIntLong(headerBytes, 4);
        const encryptedBlockSize = ByteUtil.getIntLong(headerBytes, 8);

        const encryptedBytes = Buffer.alloc(encryptedBlockSize);
        readSync(fd, encryptedBytes, 0, encryptedBlockSize, HyperHeaderBlock.HEADER_SIZE);
        closeSync(fd);

        const decryptedBlock = DecryptedBlock.decrypt(key, encryptedBytes);

        // Check if the clientId in the DecryptedBlock matches the clientId in the HyperHeaderBlock
        if (decryptedBlock.getClientId() !== clientId) {
            throw new Error("Wrong clientId");
        }

        // Check if the expirationDate in the DecryptedBlock is less than the current date
        // The date here is in 'yyMMdd' format, e.g. 240711
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
