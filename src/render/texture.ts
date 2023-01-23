const isPowerOf2 = (value: number) => (value & (value - 1)) === 0;

type MaybeWebGLTexture = WebGLTexture | undefined;

let lastBoundTexture: MaybeWebGLTexture[] = [];
let activeTextureUnit = 0;
let texturesInFlight = 0;
let texturesLoaded = 0;

export const allTexturesLoaded = () => texturesLoaded >= texturesInFlight;

export class Texture {
    name: string;
    texture: WebGLTexture;
    hasMipmap = false;
    type: '2D' | '2DArray';
    gl: WebGL2RenderingContext;

    loadTexture2D(url: string) {
        texturesInFlight++;
        const gl = this.gl;
        const texture = this.texture;
        this.bind();

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
        const that = this;
        image.onload = () => {
            that.bind();
            gl.texImage2D(
                gl.TEXTURE_2D,
                level,
                internalFormat,
                srcFormat,
                srcType,
                image
            );

            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE
            );
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
                that.hasMipmap = true;
            }
            that.nearest();
            that.clamp();
            texturesLoaded++;
        };
        lastBoundTexture[activeTextureUnit] = this;
        image.src = url;
    }

    loadTexture2DArray(url: string) {
        const gl = this.gl;
        const texture = this.texture;
        this.bind();

        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const depth = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([255, 48, 128, 255]); // opaque pink
        gl.texImage3D(
            gl.TEXTURE_2D_ARRAY,
            level,
            internalFormat,
            width,
            height,
            depth,
            border,
            srcFormat,
            srcType,
            pixel
        );

        const image = new Image();
        const that = this;
        image.onload = () => {
            that.bind();
            const width = image.width | 0;
            const height = width;
            const depth = (image.height | 0) / height;
            gl.texImage3D(
                gl.TEXTURE_2D_ARRAY,
                level,
                internalFormat,
                width,
                height,
                depth,
                0,
                srcFormat,
                srcType,
                image
            );

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
                that.hasMipmap = true;
            }
            that.nearest();
            that.repeat();
        };
        lastBoundTexture[activeTextureUnit] = this;
        image.src = url;
    }

    constructor(
        gl: WebGL2RenderingContext,
        name: string,
        url: string,
        type: '2D' | '2DArray' = '2D'
    ) {
        this.name = name;
        this.gl = gl;
        this.type = type;

        const texture = gl.createTexture();
        if (!texture) {
            throw new Error(`Couldn't create texture for ${name}`);
        }
        this.texture = texture;
        switch (type) {
            default:
            case '2D':
                this.loadTexture2D(url);
                break;
            case '2DArray':
                this.loadTexture2DArray(url);
                break;
        }
    }

    target() {
        return this.type === '2DArray'
            ? this.gl.TEXTURE_2D_ARRAY
            : this.gl.TEXTURE_2D;
    }

    clamp() {
        const gl = this.gl;
        const target = this.target();
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return this;
    }

    repeat() {
        const gl = this.gl;
        const target = this.target();
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.REPEAT);
        return this;
    }

    linear() {
        this.bind();
        const target = this.target();
        if (this.hasMipmap) {
            this.gl.texParameteri(
                target,
                this.gl.TEXTURE_MIN_FILTER,
                this.gl.NEAREST_MIPMAP_LINEAR
            );
            this.gl.texParameteri(
                target,
                this.gl.TEXTURE_MAG_FILTER,
                this.gl.NEAREST_MIPMAP_LINEAR
            );
        } else {
            this.gl.texParameteri(
                target,
                this.gl.TEXTURE_MIN_FILTER,
                this.gl.LINEAR
            );
            this.gl.texParameteri(
                target,
                this.gl.TEXTURE_MAG_FILTER,
                this.gl.LINEAR
            );
        }
        return this;
    }

    nearest() {
        this.bind();
        const target = this.target();
        if (this.hasMipmap) {
            this.gl.texParameteri(
                target,
                this.gl.TEXTURE_MIN_FILTER,
                this.gl.NEAREST_MIPMAP_NEAREST
            );
            this.gl.texParameteri(
                target,
                this.gl.TEXTURE_MAG_FILTER,
                this.gl.NEAREST
            );
        } else {
            this.gl.texParameteri(
                target,
                this.gl.TEXTURE_MIN_FILTER,
                this.gl.NEAREST
            );
            this.gl.texParameteri(
                target,
                this.gl.TEXTURE_MAG_FILTER,
                this.gl.NEAREST
            );
        }
        return this;
    }

    bind(unit = 0) {
        if (lastBoundTexture[unit] !== this.texture) {
            lastBoundTexture[unit] = this.texture;
            if (unit !== activeTextureUnit) {
                activeTextureUnit = unit;
                this.gl.activeTexture(this.gl.TEXTURE0 + unit);
            }
            this.gl.bindTexture(this.target(), this.texture);
        }
        return this;
    }
}
