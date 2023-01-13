export class Shader {
    name: string;
    program: WebGLProgram;
    gl: WebGL2RenderingContext;

    constructor (gl: WebGL2RenderingContext, name:string, vert:string, frag:string) {
        this.name = name;

        const vertShader = gl.createShader(gl.VERTEX_SHADER);
        if(!vertShader){throw new Error(`Can't create vertex shader for '${name}'`);}
        gl.shaderSource(vertShader, vert);
        gl.compileShader(vertShader);
        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vertShader));
            throw new Error(`Couldn't compile vertex shader ${name}`);
        }

        const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        if(!fragShader){throw new Error(`Can't create fragment shader for '${name}'`);}
        gl.shaderSource(fragShader, frag);
        gl.compileShader(fragShader);
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fragShader));
            throw new Error(`Couldn't compile fragment shader ${name}`);
        }

        const program = gl.createProgram();
        if(!program){throw new Error(`Can't create shader program for '${name}'`);}
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            throw new Error(`Couldn't link shader ${name}`);
        }
        this.program = program;
        this.gl = gl;
    }

    bind() {
        this.gl.useProgram(this.program);
    }
}