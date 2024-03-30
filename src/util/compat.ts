export const isServer = () =>
	typeof window === "undefined" && typeof process === "object";
export const isClient = () => !isServer();

export const mockElement = () => {
	const ret: unknown = {
		append: (e: any) => {},
		appendChild: (e: any) => {},
		focus: () => {},
		prepend: (e: any) => {},
		getContext: (t: string) => mockContext2D(),
		setAttribute: (a: string, b: string) => {},
		removeAttribute: (a: string) => {},
		addEventListener: (a: string, b: any) => {},
		classList: {
			add: (k: string) => {},
			toggle: (k: string) => {},
			remove: (k: string) => {},
			replace: (a: string, b: string) => {},
			contains: (k: string) => false,
		},
		querySelector: (q: string) => null,
		querySelectorAll: (q: string) => [],
		style: {},
	};
	return ret as HTMLElement;
};

export const mockContextWebGL2 = () => {
	const ret: unknown = {
		createShader: (t: any) => true,
		createTexture: () => true,
		createVertexArray: () => true,
		createBuffer: (t: any) => true,
		bufferData: (t: any, d: any, u: any) => {},
		vertexAttribPointer: () => {},
		enableVertexAttribArray: () => {},
		bindBuffer: (t: any) => {},
		bindVertexArray: (t: any) => {},
		bindTexture: (t: any) => {},
		shaderSource: (t: any, src: string) => {},
		compileShader: (t: any) => {},
		createProgram: () => true,
		attachShader: (program: any, shader: any) => {},
		linkProgram: (program: any) => true,
		getProgramParameter: (program: any, t: any) => true,
		getProgramInfoLog: (program: any, t: any) => "",
		getShaderParameter: (shader: any, t: any) => true,
		getUniformLocation: (program: any, u: any) => 1,
		useProgram: (program: any) => {},
		texParameteri: (t: any, v: any) => {},
	};
	return ret as WebGL2RenderingContext;
};

export const mockContext2D = () => {
	const ret: unknown = {};
	return ret as CanvasRenderingContext2D;
};

export const mockCanvas = () => {
	const ret: unknown = mockElement();
	return ret as HTMLCanvasElement;
};
