/**
 * This utility class provides methods for manipulating byte arrays.
 * It includes methods for writing specific bytes to a byte array,
 * writing an integer to a byte array, and getting an integer from a byte array.
 */
export default class ByteUtil {
    /**
     * Writes specified bytes to a byte array starting from a given offset.
     *
     * @param b     the byte array to write to
     * @param offset the position in the array to start writing
     * @param v     the value to write
     * @param bytes the number of bytes to write
     */
    static write(b: Buffer, offset: number, v: number, bytes: number): void {
        for (let i = 0; i < bytes; i++) {
            b[offset++] = (v >>> (8 * i)) & 0xFF;
        }
    }

    /**
     * Writes an integer to a byte array.
     *
     * @param b     the byte array to write to
     * @param offset the position in the array to start writing
     * @param v     the value to write
     */
    static writeIntLong(b: Buffer, offset: number, v: number): void {
        b[offset++] = (v >> 0) & 0xFF;
        b[offset++] = (v >> 8) & 0xFF;
        b[offset++] = (v >> 16) & 0xFF;
        b[offset] = (v >> 24) & 0xFF;
    }

    /**
     * Gets an integer from a byte array starting from a specified offset.
     *
     * @param b     the byte array to read from
     * @param offset the position in the array to start reading
     * @return the integer value read from the byte array
     */
    static getIntLong(b: Buffer, offset: number): number {
        return (
            (b[offset++] & 0x000000FF) |
            ((b[offset++] << 8) & 0x0000FF00) |
            ((b[offset++] << 16) & 0x00FF0000) |
            ((b[offset] << 24) & 0xFF000000)
        );
    }

    /**
     * Gets a 3-byte integer from a byte array starting from a specified offset.
     *
     * @param b     the byte array to read from
     * @param offset the position in the array to start reading
     * @return the integer value read from the byte array
     */
    static getInt3(b: Buffer, offset: number): number {
        return (
            (b[offset++] & 0x000000FF) |
            (b[offset++] & 0x0000FF00) |
            (b[offset] & 0x00FF0000)
        );
    }

    /**
     * Gets a 2-byte integer from a byte array starting from a specified offset.
     *
     * @param b     the byte array to read from
     * @param offset the position in the array to start reading
     * @return the integer value read from the byte array
     */
    static getInt2(b: Buffer, offset: number): number {
        return (
            (b[offset++] & 0x000000FF) |
            (b[offset] & 0x0000FF00)
        );
    }

    /**
     * Gets a 1-byte integer from a byte array starting from a specified offset.
     *
     * @param b     the byte array to read from
     * @param offset the position in the array to start reading
     * @return the integer value read from the byte array
     */
    static getInt1(b: Buffer, offset: number): number {
        return (
            b[offset] & 0x000000FF
        );
    }
}
