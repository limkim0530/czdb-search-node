import { openSync, readSync, writeSync, fstatSync, closeSync } from "fs";

class Cz88RandomAccessFile {
    private fd: number;
    private offset: number;
    private currentPosition = 0;
    private alive: boolean;

    constructor(filename: string, mode: string, offset: number) {
        this.fd = openSync(filename, mode);
        this.alive = true;
        this.offset = offset;
    }

    seek(position: number): void {
        this.currentPosition = position + this.offset;
    }

    read(buffer: Buffer, length: number): number {
        return readSync(this.fd, buffer, 0, length, this.currentPosition);
    }

    readFully(buffer: Buffer, off = 0, len = buffer.length): void {
        let bytesRead = 0;
        while (bytesRead < len) {
            const n = readSync(this.fd, buffer, off + bytesRead, len - bytesRead, this.currentPosition + bytesRead);
            if (n === 0) {
                throw new Error('EOF reached before reading fully');
            }
            bytesRead += n;
        }
        this.currentPosition += bytesRead;
    }

    write(buffer: Buffer, length: number): number {
        return writeSync(this.fd, buffer, 0, length, this.currentPosition);
    }

    length(): number {
        const stats = fstatSync(this.fd);
        return stats.size - this.offset;
    }

    close(): void {
        if (this.alive) {
            closeSync(this.fd);
            this.alive = false;
        }
    }
}

export default Cz88RandomAccessFile;
