#version 300 es
precision highp float;

uniform mat4 mat_mvp;

layout (location=0) in vec2 pos;
layout (location=1) in vec2 uv;
layout (location=2) in vec4 color;

out vec2 multi_tex_coord;
out vec4 front_color;

void main(){
	gl_Position     = mat_mvp * vec4(pos, 1.0, 1.0);
	multi_tex_coord = uv;
	front_color     = color;
}
