
import tar from 'tar-stream';
import { decompress } from './bz2';
import initializeWasm from './helper';

//const condaPackageUrl = 'https://conda.anaconda.org/conda-forge/linux-64/_libgcc_mutex-0.1-conda_forge.tar.bz2';
const condaPackageUrl = "http://localhost:8888/_r-mutex-1.0.0-mro_2.conda";

function decompressBzip2(data) {
    return decompress(data);
}

async function fetchByteArray(url) {
    let response = await fetch(url)
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    let arrayBuffer = await response.arrayBuffer();
    let byte_array = new Uint8Array(arrayBuffer);
    return byte_array;
}

export async function fetchAndUntarBz2Package(url) {
    try {
        console.log('>??');

        const compressedData = await fetchByteArray(url);
        console.log(compressedData);
        const decompressedData = decompressBzip2(compressedData);
        const extract = tar.extract();
        const files = {};

        extract.on('entry', function (header, stream, next) {
            const fileName = header.name;
            let fileContent = '';
            console.log('fileName');
            console.log(fileName);
            stream.on('data', function (chunk) {
                fileContent += new TextDecoder().decode(chunk);
            });

            stream.on('end', function () {
                files[fileName] = fileContent;
                next();
            });


            stream.on('error', function (err) {
                console.error(`Error reading stream for ${fileName}:`, err);
                next(err);
            });
        });

        extract.on('finish', function () {
            console.log('All files extracted:', files);
        });

        extract.write(decompressedData);
        extract.end();

        return files;
    } catch (error) {
        console.error('Error fetching or untarring the package:', error);
        throw error;
    }
}

async function unpackCondaFile() {
    try {
        const wasmModule = await initializeWasm();
        console.dir(wasmModule);

        if (wasmModule) {
            let data = await fetchByteArray(condaPackageUrl);
            console.log('Data downloaded:', data);
            const archivePtr = wasmModule._malloc(data.length);
            console.log('archivePtr');
            console.dir(archivePtr);
            wasmModule.HEAPU8.set(data, archivePtr);

            const newArchive = wasmModule._archive_read_new();
            if (newArchive === 0) {
                console.error('Failed to create archive object');
                wasmModule._free(archivePtr);
                return;
            }
///
            const archiveHandle = wasmModule._archive_read_open_memory(newArchive, archivePtr, data.length);
            console.log('Archive handle:', archiveHandle);


            if (archiveHandle === 0) {
                console.error('Failed to open archive');
                return;
            }

            let header;
            while ((header = wasmModule._archive_read_next_header(archiveHandle)) !== 0) {
                const size = wasmModule._archive_entry_size(header);
                const pathname = wasmModule._archive_entry_pathname(header);
                const buffer = new Uint8Array(size);
                const bytesRead = wasmModule._archive_read_data(archiveHandle, buffer.byteOffset, size);

                if (bytesRead > 0) {
                    console.log(`Extracted: ${pathname}, Size: ${bytesRead}`);
                }
            }

            wasmModule._archive_read_close(archiveHandle);
            wasmModule._free(archivePtr);
        }
    } catch (error) {
        console.error('Error during unpacking:', error);
    }
}

unpackCondaFile();
