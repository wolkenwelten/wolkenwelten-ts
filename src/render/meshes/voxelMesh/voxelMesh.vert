#version 300 es
precision highp float;

uniform mat4 mat_mvp;

layout (location=0) in uvec3 pos;
layout (location=1) in uint texture_index;
layout (location=2) in uint side_and_light;

out vec3 view_position;
flat out uint tex_coord;
out float light_value;

void main(){
    /* Now we unpack the side of the current vertex, the
     | side is used select the correct spatial axes for usage as texture
     | coordinates.
     */
	uint side = side_and_light & 0x7u;

    /* We divide the uv coordinates by 2 since we have 4 variations per
     | texture right now. If we ever add more we have to increase this value.
     | Here we also mirror the textures, so that they are the right side up.
     */
	tex_coord = texture_index - 1u;

    /* Finally we extract the 4-bit lightness value, turn it into a float
     | in the range of 0.0-1.0 and then multiply it by itself to make the
     | lightness curve look non-linear
     */
	float light_raw = float(side_and_light >> 4) * (1.0 / 16.0);
	light_value = light_raw * light_raw;

    /* To determine the position we multiply by our MVP matrix after adding
     | our transPos uniform value, this is done so that our position within
     | a chunk can fit in 5-bits, without this step we would need 16-bit
     | values, per axis...
     */
	gl_Position = mat_mvp * (vec4(pos, 1.0) - vec4(16.0,16.0,16.0,0.0));
}