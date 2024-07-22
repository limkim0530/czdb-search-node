/**
 * The DbType enum represents the different types of database types available in the application.
 * It includes IPV4 and IPV6 types.
 */
enum DbType {
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

export default DbType;
