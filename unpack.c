#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <archive.h>
#include <archive_entry.h>
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
char* extract_archive(uint8_t* inputData, size_t inputSize, size_t* outputSize) {
    struct archive* archive;
    struct archive_entry* entry;
    char* outputBuffer = NULL;
    size_t bufferCapacity = 0;
    size_t totalBytes = 0;

    archive = archive_read_new();
    archive_read_support_filter_all(archive); 
    archive_read_support_format_all(archive); 
   
    if (archive_read_open_memory(archive, inputData, inputSize) != ARCHIVE_OK) {
        fprintf(stderr, "Error opening archive: %s\n", archive_error_string(archive));
        archive_read_free(archive);
        return NULL;
    }

    while (archive_read_next_header(archive, &entry) == ARCHIVE_OK) {
        const char* filename = archive_entry_pathname(entry);
        size_t entrySize = archive_entry_size(entry);

        if (totalBytes + entrySize > bufferCapacity) {
            bufferCapacity = totalBytes + entrySize + 1024;
            outputBuffer = realloc(outputBuffer, bufferCapacity);
        }

        size_t bytesRead = 0;
        while (bytesRead < entrySize) {
            ssize_t ret = archive_read_data(archive, outputBuffer + totalBytes, entrySize - bytesRead);
            if (ret < 0) {
                fprintf(stderr, "Error reading data: %s\n", archive_error_string(archive));
                free(outputBuffer);
                archive_read_free(archive);
                return NULL;
            }
            bytesRead += ret;
            totalBytes += ret;
        }

        printf("Extracted file: %s, Size: %zu bytes\n", filename, entrySize);
    }

    archive_read_free(archive);

    *outputSize = totalBytes;
    return outputBuffer;
}

