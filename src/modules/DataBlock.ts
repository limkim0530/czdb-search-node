import { decode, decodeMulti, Decoder } from '@msgpack/msgpack';

export class DataBlock {
    private region: Buffer;
    private dataPtr: number;

    constructor(region: Buffer, dataPtr: number) {
        this.region = region;
        this.dataPtr = dataPtr;
    }

    /**
     * Returns the region of this data block.
     *
     * @return the region of this data block
     */
    getRegion(geoMapData: Buffer | null, columnSelection: number): string | null {
        try {
            return this.unpack(geoMapData, columnSelection);
        } catch (e) {
            return null;
        }
    }

    /**
     * Sets the region of this data block to the specified value.
     *
     * @param region the new region
     * @return this data block
     */
    setRegion(region: Buffer): DataBlock {
        this.region = region;
        return this;
    }

    /**
     * Returns the data pointer of this data block.
     *
     * @return the data pointer of this data block
     */
    getDataPtr(): number {
        return this.dataPtr;
    }

    /**
     * Sets the data pointer of this data block to the specified value.
     *
     * @param dataPtr the new data pointer
     * @return this data block
     */
    setDataPtr(dataPtr: number): DataBlock {
        this.dataPtr = dataPtr;
        return this;
    }

    private unpack(geoMapData: Buffer | null, columnSelection: number): string | null {
        const regionUnpacker = decodeMulti(this.region);

        const geoPosMixSize = regionUnpacker.next().value as number;
        const otherData = regionUnpacker.next().value as string;

        if (geoPosMixSize === 0) {
            return otherData;
        }

        const dataLen = (geoPosMixSize >> 24) & 0xFF;
        const dataPtr = geoPosMixSize & 0x00FFFFFF;

        if (!geoMapData) {
            return null;
        }
        // read the region data from the geoMapData
        const regionData = Buffer.alloc(dataLen);
        regionData.set(geoMapData.subarray(dataPtr, dataPtr + dataLen), 0);
        let str = '';

        const geoColumnUnpacker = decodeMulti(regionData);
        let quitLoop = false;
        let count = 0;
        do {
            let { value, done } = geoColumnUnpacker.next();
            quitLoop = done || false;
            count++;

            const columnSelected = (columnSelection >> (count + 1) & 1) === 1;
            value = value === "" ? "null" : value;

            if (columnSelected) {
                str += value as string;
                str += "\t";
            }
        } while (!quitLoop);
  
        return str + otherData;
    }
}
