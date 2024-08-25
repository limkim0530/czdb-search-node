declare class Cz88RandomAccessFile {
    private fd;
    private offset;
    private currentPosition;
    private alive;
    constructor(filename: string, mode: string, offset: number);
    seek(position: number): void;
    read(buffer: Buffer, length: number): number;
    readFully(buffer: Buffer, off?: number, len?: number): void;
    write(buffer: Buffer, length: number): number;
    length(): number;
    close(): void;
}

declare class DecryptedBlock {
    private clientId;
    private expirationDate;
    private randomSize;
    constructor();
    /**
     * Gets the client ID.
     * @return The client ID.
     */
    getClientId(): number;
    /**
     * Sets the client ID.
     * @param clientId The client ID to set.
     */
    setClientId(clientId: number): void;
    /**
     * Gets the expiration date.
     * @return The expiration date.
     */
    getExpirationDate(): number;
    /**
     * Sets the expiration date.
     * @param expirationDate The expiration date to set.
     */
    setExpirationDate(expirationDate: number): void;
    /**
     * Gets the size of the random bytes.
     * This method returns the size of the random bytes that are used in the encryption process.
     * The random bytes size is crucial for ensuring the uniqueness and security of the encryption.
     *
     * @return The size of the random bytes.
     */
    getRandomSize(): number;
    /**
     * Sets the size of the random bytes.
     * This method allows setting the size of the random bytes that are to be used in the encryption process.
     * Adjusting the size of the random bytes can impact the security and performance of the encryption.
     *
     * @param randomSize The size of the random bytes to set.
     */
    setRandomSize(randomSize: number): void;
    /**
     * Serializes the DecryptedBlock instance into a byte array.
     * The array is structured as follows: the first 4 bytes contain the client ID and expiration date,
     * the next 4 bytes contain the start pointer, and the last 8 bytes are reserved and initialized to 0.
     * @return A 16-byte array representing the serialized DecryptedBlock instance.
     */
    toBytes(): Buffer;
    /**
     * Encrypts the provided byte array using AES encryption with a specified key.
     * The key is expected to be a base64 encoded string representing the AES key.
     * @param data The byte array to encrypt.
     * @param key The base64 encoded string representing the AES key.
     * @return The encrypted byte array.
     * @throws Exception If an error occurs during encryption.
     */
    encrypt(data: Buffer, key: string): Buffer;
    toEncryptedBytes(key: string): Buffer;
    static decrypt(key: string, encryptedBytes: Buffer): DecryptedBlock;
}

declare class HyperHeaderBlock {
    static readonly HEADER_SIZE = 12;
    protected version: number;
    protected clientId: number;
    protected encryptedBlockSize: number;
    protected encryptedData: Buffer;
    protected decryptedBlock: DecryptedBlock;
    constructor();
    /**
     * Gets the version of the HyperHeaderBlock.
     * @return The version of the HyperHeaderBlock.
     */
    getVersion(): number;
    /**
     * Sets the version of the HyperHeaderBlock.
     * @param version The version to set.
     */
    setVersion(version: number): void;
    /**
     * Gets the client ID of the HyperHeaderBlock.
     * @return The client ID of the HyperHeaderBlock.
     */
    getClientId(): number;
    /**
     * Sets the client ID of the HyperHeaderBlock.
     * @param clientId The client ID to set.
     */
    setClientId(clientId: number): void;
    /**
     * Gets the size of the encrypted data block.
     * @return The size of the encrypted data block.
     */
    getEncryptedBlockSize(): number;
    /**
     * Sets the size of the encrypted data block.
     * @param encryptedBlockSize The size of the encrypted data block to set.
     */
    setEncryptedBlockSize(encryptedBlockSize: number): void;
    getEncryptedData(): Buffer;
    setEncryptedData(encryptedData: Buffer): void;
    getDecryptedBlock(): DecryptedBlock;
    setDecryptedBlock(decryptedBlock: DecryptedBlock): void;
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
    toBytes(): Buffer;
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
    static fromBytes(bytes: Buffer): HyperHeaderBlock;
    /**
     * Returns the total size of the HyperHeaderBlock.
     * The size is calculated as the sum of the following:
     * - The size of the header (12 bytes)
     * - The size of the encrypted data block
     * - The size of the random bytes
     *
     * @return The total size of the HyperHeaderBlock in bytes.
     */
    getHeaderSize(): number;
}

declare class HyperHeaderDecoder {
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
    static decrypt(dbFile: string | number, key: string): HyperHeaderBlock;
}

/**
 * The DbType enum represents the different types of database types available in the application.
 * It includes IPV4 and IPV6 types.
 */
declare enum DbType {
    /**
     * Represents the IPV4 type.
     * This type is used when the database is storing data related to IPV4 addresses.
     */
    IPV4 = "IPV4",
    /**
     * Represents the IPV6 type.
     * This type is used when the database is storing data related to IPV6 addresses.
     */
    IPV6 = "IPV6"
}

/**
 * The QueryType enum represents the different types of query modes available in the application.
 * It includes MEMORY, BINARY, and BTREE modes.
 */
declare enum QueryType {
    /**
     * Represents the MEMORY mode.
     * This mode is thread-safe and stores the data in memory.
     */
    MEMORY = "MEMORY",
    /**
     * Represents the BTREE mode.
     * This mode uses a B-tree data structure for querying.
     * It is not thread-safe. Different threads can use different query objects.
     * In case of high concurrency, it may lead to too many open files error.
     * In such cases, either increase the maximum allowed open files in the kernel (fs.file-max) or use the MEMORY mode.
     */
    BTREE = "BTREE"
}

declare class IndexBlock {
    private startIp;
    private endIp;
    private dataPtr;
    private dataLen;
    private dbType;
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
    constructor(startIp: Buffer, endIp: Buffer, dataPtr: number, dataLen: number, dbType: DbType);
    getStartIp(): Buffer;
    setStartIp(startIp: Buffer): IndexBlock;
    getEndIp(): Buffer;
    setEndIp(endIp: Buffer): IndexBlock;
    getDataPtr(): number;
    setDataPtr(dataPtr: number): IndexBlock;
    getDataLen(): number;
    setDataLen(dataLen: number): IndexBlock;
    static getIndexBlockLength(dbType: DbType): number;
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
    getBytes(): Buffer;
}

declare class Decryptor {
    private keyBytes;
    constructor(key: string);
    decrypt(data: Buffer): Buffer;
}

declare class DataBlock {
    private region;
    private dataPtr;
    constructor(region: Buffer, dataPtr: number);
    /**
     * Returns the region of this data block.
     *
     * @return the region of this data block
     */
    getRegion(geoMapData: Buffer | null, columnSelection: number): string | null;
    /**
     * Sets the region of this data block to the specified value.
     *
     * @param region the new region
     * @return this data block
     */
    setRegion(region: Buffer): DataBlock;
    /**
     * Returns the data pointer of this data block.
     *
     * @return the data pointer of this data block
     */
    getDataPtr(): number;
    /**
     * Sets the data pointer of this data block to the specified value.
     *
     * @param dataPtr the new data pointer
     * @return this data block
     */
    setDataPtr(dataPtr: number): DataBlock;
    private unpack;
}

declare class DbSearcher {
    private dbType;
    private ipBytesLength;
    private queryType;
    private totalHeaderBlockSize;
    /**
    * Handler for accessing the database file.
    * It is used to read from and write to the file.
    */
    private raf;
    /**
     * These are used only for B-tree search.
     * HeaderSip is a 2D byte array representing the start IP of each index block.
     * HeaderPtr is an integer array representing the data pointer of each index block.
     * headerLength is the number of index blocks in the header.
     */
    private HeaderSip;
    private HeaderPtr;
    private headerLength;
    /**
     * These are used for memory and binary search.
     * firstIndexPtr is the pointer to the first index block.
     * lastIndexPtr is the pointer to the last index block.
     * totalIndexBlocks is the total number of index blocks.
     */
    private firstIndexPtr;
    private totalIndexBlocks;
    private dbBinStr;
    private columnSelection;
    private geoMapData;
    /**
     * Constructor for DbSearcher class.
     * Initializes the DbSearcher instance based on the provided database file, query type, and key.
     * Depending on the query type, it calls the appropriate initialization method.
     *
     * @param dbFilePath The path to the database file.
     * @param queryType The type of the query (MEMORY, BINARY, BTREE).
     * @param key The key used for decrypting the header block of the database file.
     */
    constructor(dbFile: string, queryType: QueryType, key: string);
    private loadGeoSetting;
    /**
     * Initializes the DbSearcher instance for memory search.
     * Reads the entire database file into memory and then initializes the parameters for memory or binary search.
     */
    private initializeForMemorySearch;
    private initMemoryOrBinaryModeParam;
    private initBtreeModeParam;
    private initHeaderBlock;
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
    search(ip: string): string | null;
    /**
     * This method performs a memory search to find a data block in the database based on the provided IP address.
     * It uses a binary search algorithm to search the index blocks and find the data.
     * If the search is successful, it returns the data block containing the region and the data pointer.
     * If the search is unsuccessful, it returns null.
     *
     * @param ip The IP address to search for. It is a byte array representing the IP address.
     * @return The data block containing the region and the data pointer if the search is successful, null otherwise.
     */
    private memorySearch;
    searchInHeader(ip: Buffer): number[];
    /**
     * get the region with a int ip address with b-tree algorithm
     *
     * @param ip
     * @throws IOException
     */
    private bTreeSearch;
    /**
     * get by index ptr
     *
     * @param ptr
     * @throws IOException
     */
    /**
     * get db type
     *
     * @return
     */
    getDbType(): DbType;
    /**
     * get query type
     *
     * @return
     */
    getQueryType(): QueryType;
    /**
     * close the db
     *
     * @throws IOException
     */
    close(): void;
    getIpBytes(ip: string): Buffer;
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
    private compareBytes;
}

export { Cz88RandomAccessFile, DataBlock, DbType, Decryptor, HyperHeaderDecoder, IndexBlock, QueryType, DbSearcher as default };
