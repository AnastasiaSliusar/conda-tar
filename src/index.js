
import initializeWasm from './helper';

const condaPackageUrl = 'https://conda.anaconda.org/conda-forge/linux-64/_libgcc_mutex-0.1-conda_forge.tar.bz2';
//const condaPackageUrl = "http://localhost:8888/_r-mutex-1.0.0-mro_2.conda";


export class Unpack {
    constructor() {
        this._wasmModule = null;
    }

    async fetchByteArray(url) {
        let response = await fetch(url)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let arrayBuffer = await response.arrayBuffer();
        let byte_array = new Uint8Array(arrayBuffer);
        return byte_array;
    }

    async _init() {
        this._wasmModule = await initializeWasm();
    }

    extractData(data) {
        let extractedData;
        try {
            if (!this._wasmModule) {
                throw new Error('WASM module not initialized.');
            }
            if (this._wasmModule) {
                const inputPtr = this._wasmModule._malloc(data.length);
                this._wasmModule.HEAPU8.set(data, inputPtr);
                const outputSizePtr = this._wasmModule._malloc(data.length);

                const extractedDataPtr = this._wasmModule._extract_archive(inputPtr, data.length, outputSizePtr);

                const extractedSize = this._wasmModule.getValue(outputSizePtr, 'i32');

                console.log('Extracted size:', extractedSize);

                if (extractedDataPtr === 0) {
                    throw new Error('Archive extraction failed.');
                }

                extractedData = new Uint8Array(this._wasmModule.HEAPU8.subarray(extractedDataPtr, extractedDataPtr + extractedSize));

                this._wasmModule._free(inputPtr);
                this._wasmModule._free(outputSizePtr);
                this._wasmModule._free(extractedDataPtr);

                return extractedData;
            }
        } catch (error) {
            console.log('Error during unpacking:', error);
        }
    }

    async unpackCondaFileByUrl(url) {
        let extractedData;
        this._init();
        try {
            let data = await this.fetchByteArray(url);
            console.log('Data downloaded:', data);

            extractedData = this.extractData(data);
        } catch (error) {
            console.error('Error during unpacking:', error);
        }
        return extractedData;
    }
}

let test = new Unpack;
test.unpackCondaFileByUrl(condaPackageUrl);