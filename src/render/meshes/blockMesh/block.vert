#version 300 es
precision mediump float;

uniform mat4 mat_mvp;
//uniform mat4 mat_mv;
//uniform vec3 trans_pos;

layout (location=0) in uvec3 pos;
layout (location=1) in uint texture_index;
layout (location=2) in uint side_and_light;

//out vec3 view_position;
out vec3 tex_coord;
out float light_value;

void main(){
    /* Then we use the positional data as texture coordinates, since our
     | textures wrap around we get a tiling effect, as well as different
     | textures for each block depending on world position which should
     | help make things look slightly more interesting.
     */
	uvec2 taxis[3] = uvec2[3](pos.xy, pos.xz, pos.zy);

    /* Now we unpack the side of the current vertex, the
     | side is used select the correct spatial axes for usage as texture
     | coordinates.
     */
	uint side = side_and_light & 0x7u;

    /* We divide the uv coordinates by 2 since we have 4 variations per
     | texture right now. If we ever add more we have to increase this value.
     | Here we also mirror the textures, so that they are the right side up.
     */
	tex_coord = vec3(uvec3(taxis[side >> 1], texture_index)) * vec3(0.5, 0.5, 1.0);

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
    //vec4 world_position = (vec4(pos, 1.0) + vec4(trans_pos,0.0));
    vec4 world_position = vec4(pos, 1.0);
    //view_position = (mat_mv * world_position).xyz;
	gl_Position = mat_mvp * world_position;
}
