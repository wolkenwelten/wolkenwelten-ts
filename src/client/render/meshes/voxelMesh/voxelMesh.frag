#version 300 es
precision highp float;
precision highp sampler2DShadow;

uniform float alpha;
uniform sampler2DShadow shadow_map;
uniform vec3 sun_direction;
uniform vec3 sun_color;
uniform vec3 ambient_color;
uniform vec2 shadow_map_size;

flat in vec4 voxel_color;
in vec4 light_space_pos;
in vec3 world_normal;
in float ao_value;

out vec4 frag_color;

float sampleShadow(vec4 light_pos, vec3 normal) {
	vec3 proj = light_pos.xyz / light_pos.w;
	proj = proj * 0.5 + 0.5;
	if (proj.z > 1.0 || proj.z < 0.0) {
		return 1.0;
	}
	if (proj.x < 0.0 || proj.x > 1.0 || proj.y < 0.0 || proj.y > 1.0) {
		return 1.0;
	}
	vec2 texel = 1.0 / shadow_map_size;
	float cosine = clamp(dot(normalize(normal), -sun_direction), 0.0, 1.0);
	float bias = max(0.0006, 0.0015 * (1.0 - cosine));
	float shadow = 0.0;
	for (int x = -1; x <= 1; x++) {
		for (int y = -1; y <= 1; y++) {
			vec2 offset = vec2(float(x), float(y)) * texel;
			float depth = proj.z - bias;
			shadow += texture(shadow_map, vec3(proj.xy + offset, depth));
		}
	}
	return shadow / 9.0;
}

void main() {
	vec3 normal = normalize(world_normal);
	float lambert = clamp(dot(normal, -sun_direction), 0.0, 1.0);
	float shadow = sampleShadow(light_space_pos, normal);
	vec3 ambient = ambient_color * mix(0.4, 1.0, ao_value);
	float shadowFactor = mix(0.15, 1.0, shadow);
	vec3 diffuse = sun_color * lambert * shadowFactor;
	vec3 lit = voxel_color.rgb * (ambient + diffuse);
	frag_color = vec4(lit, voxel_color.a * alpha);
}
