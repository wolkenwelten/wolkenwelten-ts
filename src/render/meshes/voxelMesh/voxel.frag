#version 300 es
precision lowp float;
precision lowp sampler2D;

uniform sampler2D cur_tex;
uniform float alpha;
const float fade_distance = 160.0;
const float fade_start = fade_distance - 8.0;

in vec3 view_position;
flat in uint tex_coord;
in float light_value;

out vec4 frag_color;

void main() {
/* Very simple shader, we look up the currents pixel color according to
 | the texCoord passed to us, and then multiply in order to darken the
 | color according to the current lightness level.  The alpha value is
 | stored as a uniform because we only fadeIn entire chunks just after
 | they have been generated so their sudden appearance is less jarring.
 */
	vec3 light_color = vec3(light_value, light_value, light_value);
	vec4 rgba = texture(cur_tex, vec2(tex_coord,0)).rgba;
	vec4 color = vec4(rgba.rgb * light_color, rgba.a);
	frag_color = color * (alpha * (1.0 - smoothstep(fade_start, fade_distance, length(view_position))));
}
