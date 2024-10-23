#!/bin/bash

set -e

THIS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PREFIX_DIR=$THIS_DIR/wasm-unpack-env
EMSDK_DIR=$THIS_DIR/libs/emsdk
ZSTD_DIR=$THIS_DIR/libs/zstd
ZLIB_DIR=$THIS_DIR/libs/zlib-1.2.13
BZIP2_DIR=$THIS_DIR/libs/bzip2-1.0.8
LIBARCHIVE_DIR=$THIS_DIR/libs/libarchive-3.7.6

if [ -z "$MAMBA_EXE" ]; then
    echo "Error: MAMBA_EXE environment variable is not set."
    exit 1
fi

cd $THIS_DIR

rm -rf $PREFIX_DIR

echo "Start of compiling emscripten-forge"

if [ ! -d "$EMSDK_DIR" ]; then
    echo "Cloning emsdk repository..."
    git clone https://github.com/emscripten-core/emsdk.git
    cd $EMSDK_DIR
    ./emsdk install "3.1.45"
    ./emsdk activate "3.1.45"
    cd ..
else
    echo "$EMSDK_DIR directory already exists. Skipping clone."
fi

source $EMSDK_DIR/emsdk_env.sh
echo "Finish of compiling emscripten-forge"

if true; then
    echo "Creating wasm env at $PREFIX_DIR"
    $MAMBA_EXE create -p $PREFIX_DIR \
            --platform=emscripten-wasm32 \
            --yes
fi

export PREFIX=$PREFIX_DIR
export CPPFLAGS="-I$PREFIX/include"
export LDFLAGS="-L$PREFIX/lib"
export LDLIBS="-lbz2 -lz -lzstd"

echo "Start of compiling zstd"
if [ ! -d "$ZSTD_DIR" ]; then
    echo "Cloning zstd repository..."
    git clone https://github.com/facebook/zstd.git
else
    echo "$ZSTD_DIR directory already exists. Skipping clone."
fi

cd $ZSTD_DIR
emmake make
emmake make install PREFIX=$PREFIX
cd ..
echo "Finish of compiling zstd"

echo "Start of compiling zlib"
if [ ! -d "$ZLIB_DIR" ]; then
    if [ ! -f "v1.2.13.zip" ]; then
        echo "Donwloading zlib and unzip it..."
        wget https://github.com/madler/zlib/archive/v1.2.13.zip
    fi
    unzip v1.2.13.zip
else
    echo "$ZLIB_DIR directory already exists. Skipping downloading."
fi

cd $ZLIB_DIR
emconfigure ./configure --prefix=$PREFIX
emmake make
emmake make install
cd ..
echo "Finish of compiling zlib"

echo "Start of compiling bzip2"
if [ ! -d "$BZIP2_DIR" ]; then
    if [ ! -f "bzip2-latest.tar.gz" ]; then
        echo "Downloading bzip2 and untar it..."
        wget https://sourceware.org/pub/bzip2/bzip2-latest.tar.gz
    fi
    tar -xzf bzip2-latest.tar.gz
else
    echo "$BZIP2_DIR directory already exists. Skipping downloading."
fi

cd $BZIP2_DIR
make CC="emcc"
emmake make
emmake make install PREFIX=$PREFIX
cd ..
echo "Finish of compiling bzip2"

echo "Start of compiling libarchive"

if [ ! -d "$LIBARCHIVE_DIR" ]; then
    if [ ! -f "libarchive-3.7.6.tar.gz" ]; then
        echo "Downloading libarchive and untar it..."
        wget https://www.libarchive.org/downloads/libarchive-3.7.6.tar.gz
    fi
    tar -xzf libarchive-3.7.6.tar.gz
else
    echo "$LIBARCHIVE_DIR directory already exists. Skipping downloading."
fi

cd $LIBARCHIVE_DIR
emconfigure ./configure \
    --disable-shared \
    --enable-static \
    --with-zlib=yes --enable-bsdtar=static --enable-bsdcat=static --enable-bsdcpio=static \
    --with-zstd=yes \
    --prefix=${PREFIX}

emmake make
emmake make install

echo "Finish of compiling libarchive"

cd ..

cd $THIS_DIR

echo "Start of compiling unpacking"
emcc unpacking.c -o unpacking.js \
    $CPPFLAGS $LDFLAGS \
    ${PREFIX}/lib/libarchive.a \
    ${PREFIX}/lib/libz.a ${PREFIX}/lib/libbz2.a ${PREFIX}/lib/libzstd.a \
    -s MODULARIZE=1 -s WASM=1 -O3 -s ALLOW_MEMORY_GROWTH=1 \
    -s ENVIRONMENT=web \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "getValue"]' \
    -s EXPORTED_FUNCTIONS="['_extract_archive', '_malloc', '_free']"

echo "Build completed successfully!"