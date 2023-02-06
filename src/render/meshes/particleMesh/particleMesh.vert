#version 300 es
precision lowp float;

uniform mat4 mat_mvp;

layout (location=0) in vec4 pos;
layout (location=1) in vec4 color;

out vec4 frontColor;

void main(){
	gl_Position  = mat_mvp * vec4(pos.xyz,1.0);
	gl_PointSize = pos.w / (gl_Position.z);
	frontColor   = color;
}
