#version 300 es
precision mediump float;
precision lowp sampler2D;

uniform sampler2D cur_tex;
uniform mat4 mat_mvp;
uniform vec3 trans_pos;

layout (location=0) in uvec3 pos;
layout (location=1) in uint texture_index;
layout (location=2) in uint side_and_light;

out vec3 light_color;
flat out vec4 rgba;

void main(){
	lowp float light_raw = float(side_and_light >> 4) * (1.0 / 16.0);
	lowp float light_value = light_raw * light_raw;
	light_color = vec3(light_value, light_value, light_value);

	rgba = texture(cur_tex, vec2(float(texture_index) * (1.0/256.0),0));

	/* To determine the position we multiply by our MVP matrix after adding
	 | our transPos uniform value, this is done so that our position within
	 | a chunk can fit in 5-bits, without this step we would need 16-bit
	 | values, per axis...
	 */
	vec3 npos = vec3(pos) + trans_pos;
	gl_Position = mat_mvp * ((vec4(npos, 1.0) * vec4(1.0/32.0, 1.0/32.0, 1.0/32.0, 1.0)) - vec4(0.5,0.5,0.5,0.0));
}
