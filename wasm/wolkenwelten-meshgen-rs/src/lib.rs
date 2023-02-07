use wasm_bindgen::prelude::*;
extern crate console_error_panic_hook;

fn blur_x(data:&mut [u8]) {
    for y in 0..34 {
        for z in 0..34 {
            let mut a: i8 = 0;
            let mut b: i8 = 0;
            for x in 0..34 {
                a = a.max(data[x*34*34 + y*34 + z] as i8);
                data[x*34*34 + y*34 + z] = a as u8;
                a = (a - 1).max(0);

                b = b.max(data[(33 as usize - x)*34*34 + y*34 +z] as i8);
                data[(33 as usize - x)*34*34 + y*34 + z] = b as u8;
                b = (b - 1).max(0);
            }
        }
    }
}

fn blur_y(data:&mut [u8]) {
    for x in 0..34 {
        for z in 0..34 {
            let mut a: i8 = 0;
            let mut b: i8 = 0;
            for y in 0..34 {
                a = a.max(data[x*34*34 + y*34 + z] as i8);
                data[x*34*34 + y*34 + z] = a as u8;
                a = (a - 1).max(0);

                b = b.max(data[(33 as usize - x)*34*34 + y*34 +z] as i8);
                data[(33 as usize - x)*34*34 + y*34 + z] = b as u8;
                b = (b - 1).max(0);
            }
        }
    }
}

fn blur_z(data:&mut [u8]) {
    for x in 0..34 {
        for y in 0..34 {
            let mut a: i8 = 0;
            let mut b: i8 = 0;
            for z in 0..34 {
                a = a.max(data[x*34*34 + y*34 + z] as i8);
                data[x*34*34 + y*34 + z] = a as u8;
                a = (a - 1).max(0);

                b = b.max(data[(33 as usize - x)*34*34 + y*34 +z] as i8);
                data[(33 as usize - x)*34*34 + y*34 + z] = b as u8;
                b = (b - 1).max(0);
            }
        }
    }
}

fn ambient_occlusion(light:&mut [u8], blocks:&[u8]) {
    let max = 34*34*34;
    for off in 0..max {
        if blocks[off] != 0 {
            light[off] /= 2;
        }
    }
}

#[wasm_bindgen]
pub fn finish_light(light:&mut [u8], blocks:&[u8]) {
    console_error_panic_hook::set_once();
    blur_x(light);
    blur_y(light);
    blur_z(light);
    ambient_occlusion(light, blocks);
}
