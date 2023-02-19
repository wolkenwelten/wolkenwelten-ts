#version 300 es
precision lowp float;
uniform float alpha;

flat in vec4 rgba;
in vec3 light_color;

out vec4 frag_color;

void main() {
	frag_color = vec4(rgba.rgb * light_color, rgba.a * alpha);
}
