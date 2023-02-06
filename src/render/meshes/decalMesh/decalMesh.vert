#version 300 es
precision highp float;

uniform mat4 mat_mvp;

layout (location=0) in vec3 pos;
layout (location=1) in vec2 tex;
layout (location=2) in float lightness;

out vec2 multi_tex_coord;
out float alpha;

void main() {
	gl_Position = mat_mvp * vec4(pos, 1.0);
	multi_tex_coord = tex;
	alpha = lightness;
}
