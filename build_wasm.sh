#!/bin/bash

set -e

micromamba create -n unpack-env
micromamba activate unpack-env

git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install "3.1.45"
./emsdk activate "3.1.45"
source ./emsdk_env.sh
cd ..

export PREFIX=$MAMBA_ROOT_PREFIX/envs/unpack-env
export CPPFLAGS="-I$PREFIX/include"
export LDFLAGS="-L$PREFIX/lib"
export LDLIBS="-lbz2 -lz -lzstd"

wget https://sourceware.org/pub/bzip2/bzip2-latest.tar.gz
tar -xzf bzip2-latest.tar.gz
cd bzip2-1.0.8
make CC="emcc"
emmake make
emmake make install PREFIX=$PREFIX
cd ..

git clone https://github.com/facebook/zstd.git
cd zstd
emmake make
emmake make install PREFIX=$PREFIX
cd ..

wget https://github.com/madler/zlib/archive/v1.2.13.zip
unzip v1.2.13.zip
cd zlib-1.2.13
emconfigure ./configure --prefix=$PREFIX
emmake make
emmake make install
cd ..

wget https://www.libarchive.org/downloads/libarchive-3.7.6.tar.gz
tar -xzf libarchive-3.7.6.tar.gz
cd libarchive-3.7.6
emconfigure ./configure \
    --disable-shared \
    --enable-static \
    --with-zlib=yes --enable-bsdtar=static --enable-bsdcat=static --enable-bsdcpio=static \
    --with-zstd=yes \
    --prefix=${PREFIX}

emmake make
emmake make install
cd ..

emcc unpacking.c -o unpacking.js \
    $CPPFLAGS $LDFLAGS \
    ${PREFIX}/lib/libarchive.a \
    ${PREFIX}/lib/libz.a ${PREFIX}/lib/libbz2.a ${PREFIX}/lib/libzstd.a \
    -s MODULARIZE=1 -s WASM=1 -O3 -s ALLOW_MEMORY_GROWTH=1 \
    -s ENVIRONMENT=web \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "getValue"]' \
    -s EXPORTED_FUNCTIONS="['_extract_archive', '_malloc', '_free']"

echo "Build completed successfully!"
