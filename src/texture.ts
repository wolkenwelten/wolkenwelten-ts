const isPowerOf2 = (value:number) => (value & (value - 1)) === 0;

let lastBoundTexture: WebGLTexture | undefined;

export class Texture {
    name: string;
    texture: WebGLTexture;
    gl: WebGL2RenderingContext;

    constructor (gl: WebGL2RenderingContext, name:string, url:string) {
        this.name = name;
        this.gl = gl;

        const texture = gl.createTexture();
        if(!texture){throw new Error(`Couldn't create texture for ${name}`); }
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([255, 0, 255, 255]); // opaque pink
        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat,
            width,
            height,
            border,
            srcFormat,
            srcType,
            pixel
        );

        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                level,
                internalFormat,
                srcFormat,
                srcType,
                image
            );

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            }
        };
        image.src = url;
        this.texture = texture;
    }

    bind() {
        if(lastBoundTexture !== this.texture){
            lastBoundTexture = this.texture;
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        }
    }
}