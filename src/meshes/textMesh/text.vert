#version 300 es
precision mediump float;

uniform mat4 mat_mvp;

in vec2 pos;
//in vec2 tex;
//in vec4 color;

//out vec2 multi_tex_coord;
//out vec4 front_color;

void main(){
	gl_Position     = vec4(pos, 1.0, 1.0);
	//gl_Position     = mat_mvp * vec4(pos, 1.0, 1.0);
	//multi_tex_coord = tex;
	//front_color     = color;
}
