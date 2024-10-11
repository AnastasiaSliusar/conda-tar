
import libarchive from "../lib/libarchive.js";
import libarchiveWasm from "../lib/libarchive.wasm";

const initializeWasm = async () => {
    try {
        const wasmModule = await libarchive({
            locateFile(path) {
                if (path.endsWith('.wasm')) {
                    return libarchiveWasm;
                }
                return path;
            },
        });

        console.log("WASM module initialized:", wasmModule);
        
        return wasmModule;
    } catch (err) {
        console.error('Error initializing the WASM module:', err);
    }
};
export default initializeWasm;
