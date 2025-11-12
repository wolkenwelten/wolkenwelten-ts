#version 300 es
precision mediump float;
precision lowp sampler2D;

uniform sampler2D cur_tex;
uniform mat4 mat_mvp;
uniform mat4 mat_model;
uniform mat4 mat_light_mvp;
uniform vec3 trans_pos;

layout (location=0) in uvec3 pos;
layout (location=1) in uint texture_index;
layout (location=2) in uint side_and_light;

const vec3 normals[6] = vec3[](
	vec3(0.0, 0.0, 1.0),
	vec3(0.0, 0.0, -1.0),
	vec3(0.0, 1.0, 0.0),
	vec3(0.0, -1.0, 0.0),
	vec3(-1.0, 0.0, 0.0),
	vec3(1.0, 0.0, 0.0)
);

flat out vec4 voxel_color;
out vec4 light_space_pos;
out vec3 world_normal;
out float ao_value;

void main(){
	uint side = side_and_light & 0x7u;
	float light_raw = float(side_and_light >> 4) * (1.0 / 16.0);
	ao_value = light_raw * light_raw;
	voxel_color = texture(cur_tex, vec2(float(texture_index) * (1.0 / 256.0), 0.0));

	vec3 npos = vec3(pos) + trans_pos;
	vec4 local_position =
		vec4((npos * (1.0 / 32.0)) - vec3(0.5), 1.0);
	vec4 world_position = mat_model * local_position;
	light_space_pos = mat_light_mvp * world_position;

	mat3 normalMatrix = mat3(mat_model);
	world_normal = normalize(normalMatrix * normals[int(side)]);

	gl_Position = mat_mvp * local_position;
}
