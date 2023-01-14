const isPowerOf2 = (value:number) => (value & (value - 1)) === 0;

let lastBoundTexture: WebGLTexture | undefined;

export class Texture {
    name: string;
    texture: WebGLTexture;
    hasMipmap = false;
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
        const pixel = new Uint8Array([255, 48, 128, 255]); // opaque pink
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

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
                this.hasMipmap = true;
            }
            this.nearest();
        };
        lastBoundTexture = this;
        image.src = url;
        this.texture = texture;
    }

    linear() {
        this.bind();
        if(this.hasMipmap){
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST_MIPMAP_LINEAR);
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        }
    }

    nearest() {
        this.bind();
        if(this.hasMipmap){
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST_MIPMAP_NEAREST);
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        }
    }

    bind() {
        if(lastBoundTexture !== this.texture){
            lastBoundTexture = this.texture;
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        }
    }
}