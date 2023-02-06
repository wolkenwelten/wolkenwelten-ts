#version 300 es
precision lowp float;

in vec4 frontColor;
out vec4 fragColor;

void main() {
	fragColor = frontColor;
}
