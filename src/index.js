
import initializeWasm from './helper';

const condaPackageUrl = 'https://conda.anaconda.org/conda-forge/linux-64/_libgcc_mutex-0.1-conda_forge.tar.bz2';
//const condaPackageUrl = "http://localhost:8888/_r-mutex-1.0.0-mro_2.conda";

async function fetchByteArray(url) {
    let response = await fetch(url)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    let arrayBuffer = await response.arrayBuffer();
    let byte_array = new Uint8Array(arrayBuffer);
    return byte_array;
}

async function unpackCondaFile() {
    try {
        const wasmModule = await initializeWasm();
        let data = await fetchByteArray(condaPackageUrl);
        console.log('Data downloaded:', data);

        if (wasmModule) {
            const inputPtr = wasmModule._malloc(data.length);
            wasmModule.HEAPU8.set(data, inputPtr);
            const outputSizePtr = wasmModule._malloc(data.length);

            const extractedDataPtr = wasmModule._extract_archive(inputPtr, data.length, outputSizePtr);

            const extractedSize = wasmModule.getValue(outputSizePtr, 'i32');

            console.log('Extracted size:', extractedSize);

            if (extractedDataPtr === 0) {
                throw new Error('Archive extraction failed.');
            }

            const extractedData = new Uint8Array(wasmModule.HEAPU8.subarray(extractedDataPtr, extractedDataPtr + extractedSize));

            wasmModule._free(inputPtr);
            wasmModule._free(outputSizePtr);
            wasmModule._free(extractedDataPtr);

            return extractedData;
        }
    } catch (error) {
        console.log('Error during unpacking:', error);
    }
}

unpackCondaFile();