import { mat4 } from 'gl-matrix';

export class Shader {
    name: string;
    program: WebGLProgram;
    gl: WebGL2RenderingContext;
    uniforms: Map<string, WebGLUniformLocation>;

    constructor(
        gl: WebGL2RenderingContext,
        name: string,
        vert: string,
        frag: string,
        uniforms: string[]
    ) {
        this.name = name;

        const vertShader = gl.createShader(gl.VERTEX_SHADER);
        if (!vertShader) {
            throw new Error(`Can't create vertex shader for '${name}'`);
        }
        gl.shaderSource(vertShader, vert);
        gl.compileShader(vertShader);
        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vertShader));
            throw new Error(`Couldn't compile vertex shader ${name}`);
        }

        const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fragShader) {
            throw new Error(`Can't create fragment shader for '${name}'`);
        }
        gl.shaderSource(fragShader, frag);
        gl.compileShader(fragShader);
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fragShader));
            throw new Error(`Couldn't compile fragment shader ${name}`);
        }

        const program = gl.createProgram();
        if (!program) {
            throw new Error(`Can't create shader program for '${name}'`);
        }
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            throw new Error(`Couldn't link shader ${name}`);
        }
        this.program = program;
        this.gl = gl;
        this.uniforms = new Map();
        for (const u of uniforms) {
            const loc = gl.getUniformLocation(program, u);
            if (!loc) {
                throw new Error(
                    `Couldn't determine location of uniform '${u}' for '${name}'`
                );
            }
            this.uniforms.set(u, loc);
        }
    }

    bind() {
        this.gl.useProgram(this.program);
    }

    uniform1i(name: string, value: number) {
        const loc = this.uniforms.get(name);
        if (!loc) {
            throw new Error(
                `No uniform location stored for '${name}' for shader '${this.name}'`
            );
        }
        this.gl.uniform1i(loc, value);
    }

    uniform4fv(name: string, value: mat4) {
        const loc = this.uniforms.get(name);
        if (!loc) {
            throw new Error(
                `No uniform location stored for '${name}' for shader '${this.name}'`
            );
        }
        this.gl.uniformMatrix4fv(loc, false, value);
    }
}
