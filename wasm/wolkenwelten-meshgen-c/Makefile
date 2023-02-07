CC = clang
LD = wasm-ld

CFLAGS = \
     -c \
    -Wall \
    --target=wasm32 \
    -Os \
    -flto \
    -nostdlib \
    -fvisibility=hidden \
    -std=c11 \
    -ffunction-sections \
    -fdata-sections

LDFLAGS = \
    --no-entry \
    --strip-all \
    --export-dynamic \
    --initial-memory=131072 \
    --error-limit=0 \
    --lto-O3 \
    -O3 \
    --gc-sections

main.wasm: main.o
	$(LD) $(LDFLAGS) -o $@ $<

main.o: main.c
	$(CC) $(CFLAGS) -o $@ $<
