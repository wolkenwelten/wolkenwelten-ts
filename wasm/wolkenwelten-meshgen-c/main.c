
#include <stdint.h>
#define MAX(a,b) (a)>(b)?a:b;

static void blur_x(uint8_t data[34][34][34]) {
    for(int y=0;y<34;y++){
        for(int z=0;z<34;z++){
            uint8_t a = 0;
            uint8_t b = 0;
            for(int x=0;x<34;x++){
                a = MAX(a,(data[x][y][z]));
                data[x][y][z] = a;
                a = MAX(0,a - 1);

                b = MAX(b,data[33 - x][y][z]);
                data[33 - x][y][z] = b;
                b = MAX(0,b - 1);
            }
        }
    }
}

static void blur_y(uint8_t data[34][34][34]) {
    for(int x=0;x<34;x++){
        for(int z=0;z<34;z++){
            uint8_t a = 0;
            uint8_t b = 0;
            for(int y=0;y<34;y++){
                a = MAX(a,(data[x][y][z]));
                data[x][y][z] = a;
                a = MAX(0,a - 1);

                b = MAX(b,data[33 - x][y][z]);
                data[33 - x][y][z] = b;
                b = MAX(0,b - 1);
            }
        }
    }
}

static void blur_z(uint8_t data[34][34][34]) {
    for(int x=0;x<34;x++){
        for(int y=0;y<34;y++){
            uint8_t a = 0;
            uint8_t b = 0;
            for(int z=0;z<34;z++){
                a = MAX(a,(data[x][y][z]));
                data[x][y][z] = a;
                a = MAX(0,a - 1);

                b = MAX(b,data[33 - x][y][z]);
                data[33 - x][y][z] = b;
                b = MAX(0,b - 1);
            }
        }
    }
}

static void ambient_occlusion(uint8_t light[34][34][34], const uint8_t blocks[34][34][34]) {
    for(int x=0;x<34;x++){
        for(int y=0;y<34;y++){
            for(int z=0;z<34;z++){
                if(blocks[x][y][z] != 0){
                    light[x][y][z] /= 2;
                }
            }
        }
    }
}

__attribute__((visibility("default"))) void finish_light(uint8_t light[34][34][34], const uint8_t blocks[34][34][34]) {
    blur_x(light);
    blur_y(light);
    blur_z(light);
    ambient_occlusion(light, blocks);
}