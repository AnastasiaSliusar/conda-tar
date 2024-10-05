
import tar from 'tar-stream';
import { decompress } from './bz2';

const condaPackageUrl = 'https://conda.anaconda.org/conda-forge/linux-64/_libgcc_mutex-0.1-conda_forge.tar.bz2';


function decompressBzip2(data) {
    return decompress(data);
}

async function fetchByteArray(url){
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

        extract.on('entry', function(header, stream, next) {
            const fileName = header.name;
            let fileContent = '';
            console.log('fileName');
            console.log(fileName);
            stream.on('data', function(chunk) {
                fileContent +=new TextDecoder().decode(chunk);
            });

            stream.on('end', function() {
                files[fileName] = fileContent; 
                next(); 
            });

           
            stream.on('error', function(err) {
                console.error(`Error reading stream for ${fileName}:`, err);
                next(err);
            });
        });

        extract.on('finish', function() {
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


fetchAndUntarBz2Package(condaPackageUrl)
    .then((files) => {
        console.log('Successfully fetched and extracted the BZIP2 tar package!', files);
    })
    .catch((err) => {
        console.error('Failed to fetch and extract BZIP2 tar package:', err);
    });
