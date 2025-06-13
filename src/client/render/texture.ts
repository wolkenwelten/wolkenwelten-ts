/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * Texture is a small wrapper that unifies 2-D, 2-D array and 1-D LUT textures
 * while hiding the verbose WebGL boilerplate. In addition to convenience
 * helpers it implements a *global texture binding cache* so redundant
 * `gl.bindTexture` calls are avoided.
 *
 * Key features
 * ------------
 * • Lazy asynchronous loading via `Image` for 2-D and array textures.
 * • Automatic pink *error* placeholder until the real image arrives.
 * • Simple caching of last bound texture per texture unit – see `bind()`.
 * • Built-in manual colour Look-Up Table (LUT) generation for shader colour
 *   modulation effects.
 *
 * Usage tips
 * ----------
 * • Always call `.bind(unit)` before issuing draw calls; relying on the global
 *   cache is optional but recommended for performance.
 * • After changing `linearInterpolation`, `doesRepeat` or similar flags remember
 *   to call the corresponding method (`linear()`, `repeat()`, …) **after** the
 *   image finished loading, otherwise the parameters will be reset by the miplevel upload.
 * • If you plan to mutate the LUT at runtime, set `dirtyLUT` and let `bind()` handle it.
 *
 * Footguns
 * --------
 * • Non power-of-two textures cannot use mip-mapping or `REPEAT` wrapping – the
 *   code falls back to clamped.
 * • While the placeholder pixel is uploaded synchronously, texture dimensions
 *   are 1×1 until the real image arrives. Shaders that rely on texture size in
 *   texel space may misbehave.
 */
const isPowerOf2 = (value: number) => (value & (value - 1)) === 0;

type MaybeWebGLTexture = WebGLTexture | undefined;

let lastBoundTexture: MaybeWebGLTexture[] = [];
let activeTextureUnit = 0;
let texturesInFlight = 0;
let texturesLoaded = 0;

export const allTexturesLoaded = () => texturesLoaded >= texturesInFlight;

export class Texture {
	readonly name: string;
	readonly texture: WebGLTexture;
	readonly type: "2D" | "2DArray" | "LUT";
	readonly gl: WebGL2RenderingContext;
	linearInterpolation = false;
	doesRepeat = false;
	hasMipmap = false;
	colors: number[] = [];
	dirtyLUT = false;

	/**
	 * Uploads a 1×1 pink placeholder, starts async image download and upgrades
	 * the texture once loaded. Handles optional mip-map generation and repeat/
	 * clamp states.
	 */
	loadTexture2D(url: string) {
		texturesInFlight++;
		const gl = this.gl;
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
			pixel,
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
				image,
			);

			if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
				gl.generateMipmap(gl.TEXTURE_2D);
				that.hasMipmap = true;
			}
			if (that.linearInterpolation) {
				that.linear();
			} else {
				that.nearest();
			}
			if (that.doesRepeat) {
				that.repeat();
			} else {
				that.clamp();
			}
			texturesLoaded++;
		};
		lastBoundTexture[activeTextureUnit] = this;
		image.src = url;
	}

	/**
	 * Similar to `loadTexture2D` but treats the source image as a vertical strip
	 * of square layers and uploads it as `TEXTURE_2D_ARRAY`.
	 */
	loadTexture2DArray(url: string) {
		const gl = this.gl;
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
			pixel,
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
				image,
			);

			if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
				gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
				that.hasMipmap = true;
			}
			if (that.linearInterpolation) {
				that.linear();
			} else {
				that.nearest();
			}
			that.repeat();
		};
		lastBoundTexture[activeTextureUnit] = this;
		image.src = url;
	}

	/**
	 * Pushes the JS-side `colors` array into a 256×1 RGBA LUT texture. Call this
	 * after mutating the array or set `dirtyLUT` and let `bind()` handle it.
	 */
	updateLUT() {
		const gl = this.gl;
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.target(), this.texture);
		lastBoundTexture[0] = this.texture;

		const level = 0;
		const internalFormat = gl.RGBA;
		const width = 256;
		const height = 1;
		const border = 0;
		const srcFormat = gl.RGBA;
		const srcType = gl.UNSIGNED_BYTE;
		const pixel = new Uint8Array(this.colors);
		gl.texImage2D(
			gl.TEXTURE_2D,
			level,
			internalFormat,
			width,
			height,
			border,
			srcFormat,
			srcType,
			pixel,
		);
		this.dirtyLUT = false;
	}

	createLUT() {
		for (let i = 0; i < 256; i++) {
			this.colors.push(255 * (i & 1), 48, 128, 255);
		}
		this.updateLUT();
	}

	setLUTEntry(i: number, color: number) {
		const off = (i - 1) * 4;
		this.colors[off] = color & 0xff;
		this.colors[off + 1] = (color >> 8) & 0xff;
		this.colors[off + 2] = (color >> 16) & 0xff;
		this.colors[off + 3] = 0xff;

		this.dirtyLUT = true;
	}

	constructor(
		gl: WebGL2RenderingContext,
		name: string,
		url: string,
		type: "2D" | "2DArray" | "LUT" = "2D",
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
			case "2D":
				this.loadTexture2D(url);
				break;
			case "2DArray":
				this.loadTexture2DArray(url);
				break;
			case "LUT":
				this.bind();
				this.createLUT();
				this.nearest();
				break;
		}
	}

	target() {
		return this.type === "2DArray"
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
		this.doesRepeat = true;
		return this;
	}

	linear() {
		this.bind();
		this.linearInterpolation = true;
		const target = this.target();
		if (this.hasMipmap) {
			this.gl.texParameteri(
				target,
				this.gl.TEXTURE_MIN_FILTER,
				this.gl.NEAREST_MIPMAP_LINEAR,
			);
			this.gl.texParameteri(target, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
		} else {
			this.gl.texParameteri(target, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(target, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
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
				this.gl.NEAREST_MIPMAP_NEAREST,
			);
			this.gl.texParameteri(
				target,
				this.gl.TEXTURE_MAG_FILTER,
				this.gl.NEAREST,
			);
		} else {
			this.gl.texParameteri(
				target,
				this.gl.TEXTURE_MIN_FILTER,
				this.gl.NEAREST,
			);
			this.gl.texParameteri(
				target,
				this.gl.TEXTURE_MAG_FILTER,
				this.gl.NEAREST,
			);
		}
		return this;
	}

	/**
	 * Ensures the texture handle is bound to the requested unit while minimising
	 * redundant state changes. Also triggers a deferred LUT upload if required.
	 */
	bind(unit = 0) {
		if (this.dirtyLUT) {
			this.updateLUT();
			activeTextureUnit = unit;
			lastBoundTexture[unit] = this.texture;
			this.gl.activeTexture(this.gl.TEXTURE0 + unit);
			this.gl.bindTexture(this.target(), this.texture);
		}
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
