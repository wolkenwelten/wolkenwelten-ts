#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D cur_tex;
uniform vec4 color;

in vec2 multi_tex_coord;

out vec4 frag_color;

void main() {
    vec4 tex_color = texture(cur_tex, multi_tex_coord);
	frag_color = vec4(color.rgb, tex_color.r * color.a);
}