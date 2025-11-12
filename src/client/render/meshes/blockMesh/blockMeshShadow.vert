#version 300 es
precision highp float;

uniform mat4 mat_light_mvp;
uniform vec3 trans_pos;

layout (location=0) in uvec3 pos;
layout (location=1) in uint texture_index;
layout (location=2) in uint side_and_light;

void main(){
	vec4 world_position = vec4(vec3(pos) + trans_pos, 1.0);
	gl_Position = mat_light_mvp * world_position;
}
