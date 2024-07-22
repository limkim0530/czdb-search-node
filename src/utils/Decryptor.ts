export default class Decryptor {
    private keyBytes: Buffer;

    constructor(key: string) {
        this.keyBytes = Buffer.from(key, 'base64');
    }

    decrypt(data: Buffer): Buffer {
        const result = Buffer.alloc(data.length);
        for (let i = 0; i < data.length; i++) {
            result[i] = data[i] ^ this.keyBytes[i % this.keyBytes.length];
        }
        return result;
    }
}
