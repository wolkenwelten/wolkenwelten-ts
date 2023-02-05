#version 300 es
precision highp float;

uniform mat4 mat_mvp;

in vec3 pos;
in vec2 tex;
in float lightness;

out vec2 multi_tex_coord;
out float alpha;

void main() {
	gl_Position = mat_mvp * vec4(pos, 1.0);
	multi_tex_coord = tex;
	alpha = lightness;
}
