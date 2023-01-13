import { TextMesh, meshInit } from "./meshes";

export interface GameConfig {
    parent: HTMLElement,
}

export class Game {
    rootElement: HTMLElement;
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    width = 640;
    height = 480;
    frames = 0;
    drawFrameClosure: () => void;

    testMesh: TextMesh;

    constructor (config: GameConfig) {
        this.rootElement = config.parent;
        this.canvas = document.createElement('canvas');
        this.rootElement.append(this.canvas);

        const gl = this.canvas.getContext('webgl2');
        if(!gl){ throw new Error("Can't create WebGL2 context, please try upgrading your browser or use a different device"); }
        this.gl = gl;
        this.initGLContext();
        meshInit(gl);
        this.testMesh = new TextMesh();

        this.drawFrameClosure = this.drawFrame.bind(this);
        window.requestAnimationFrame(this.drawFrameClosure);

        window.addEventListener("resize", this.resize.bind(this));
        this.resize();
    }

    resize () {
        this.width = window.innerWidth|0;
        this.height = window.innerHeight|0;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    initGLContext() {
        this.gl.clearColor(0.5,0.3,0.1,1.0);
        //this.gl.enable(this.gl.DEPTH_TEST);
    }

    drawFrame () {
        window.requestAnimationFrame(this.drawFrameClosure);
        this.frames++;
        this.gl.clearColor((this.frames & 127) / 128,0.3,0.1,1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.viewport(0,0, this.canvas.width, this.canvas.height);

        this.testMesh.draw();

        this.gl.flush();
    }
};
