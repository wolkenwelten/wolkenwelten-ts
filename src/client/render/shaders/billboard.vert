#version 300 es
precision mediump float;

uniform mat4 mat_mvp;
uniform mat4 view_matrix;
uniform vec3 billboard_pos;
uniform vec2 billboard_size;

layout (location=0) in vec2 pos;
layout (location=1) in vec2 uv;

out vec2 tex_coord;

void main() {
    // Create billboard that always faces the camera
    // Extract right and up vectors from the view matrix
    vec3 right = normalize(vec3(view_matrix[0][0], view_matrix[1][0], view_matrix[2][0]));
    vec3 up = normalize(vec3(view_matrix[0][1], view_matrix[1][1], view_matrix[2][1]));
    
    vec3 world_pos = billboard_pos + 
                     right * (pos.x * billboard_size.x) + 
                     up * (pos.y * billboard_size.y);
    
    tex_coord = uv;
    gl_Position = mat_mvp * vec4(world_pos, 1.0);
}