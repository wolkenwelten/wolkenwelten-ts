#version 300 es
precision mediump float;

uniform mat4 mat_mvp;
uniform vec2 tex_offset;

layout (location=0) in vec3 pos;
layout (location=1) in vec2 tex;

out vec2 multi_tex_coord;

void main() {
	gl_Position = mat_mvp * vec4(pos, 1.0);
	multi_tex_coord = tex + tex_offset;
}