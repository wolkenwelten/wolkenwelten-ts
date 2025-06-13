#version 300 es
precision mediump float;

uniform sampler2D text_texture;
uniform float alpha;

in vec2 tex_coord;
out vec4 fragColor;

void main() {
    vec4 texColor = texture(text_texture, tex_coord);
    fragColor = vec4(texColor.rgb, texColor.a * alpha);
}