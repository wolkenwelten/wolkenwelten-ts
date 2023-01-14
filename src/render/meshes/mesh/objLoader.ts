export interface WavefrontObjectFace {
    positionIndex: number;
    textureCoordinateIndex?: number;
    normalIndex?: number;
}

export class WavefrontObject {
    name: string;
    positions: [number, number, number][] = [];
    textureCoordinates: [number, number][] = [];
    normals: [number, number, number][] = [];
    faces: WavefrontObjectFace[] = [];
    smoothShading = false;

    constructor (name:string) {
        this.name = name;
    }
}

export class WavefrontFile {
    objects: WavefrontObject[] = [];

    constructor (content:string) {
        let curObject;
        let lineNumber = 0;
        for(const line of content.split("\n")){
            switch(line.substring(0,1)){
                case '':
                case ' ':
                case "\t":
                case "\r":
                case "\n":
                case '#': // Ignore Comments and white space
                    break;
                case 'o':
                    curObject = new WavefrontObject(line.substring(1).trim());
                    this.objects.push(curObject);
                    break;
                case 's': {
                    const val = line.substring(2).trim() === "on";
                    if(!curObject){ throw new Error(`Can't set smooth shading before the first object, error in line ${lineNumber}`);}
                    curObject.smoothShading = val;
                    break;
                }
                case 'f': {
                    if(!curObject){ throw new Error(`Vertex without object in line ${lineNumber}`); }
                    const s = line.substring(2).split(" ");
                    if(s.length !== 3){ throw new Error(`Faces need to be triangles, error in line ${lineNumber}, line: ${line}`); }
                    for(const f of s){
                        const parts = f.split("/");
                        if(parts.length !== 3){ throw new Error(`Faces need exactly 3 indices, error in line ${lineNumber}, line: ${line}`); }

                        curObject.faces.push({
                            positionIndex: (parseInt(parts[0]))-1,
                            textureCoordinateIndex: parseInt(parts[1])-1,
                            normalIndex: parseInt(parts[2])-1,
                        });
                    }
                    break;
                }
                case 'v': {
                    if(!curObject){ throw new Error(`Vertex without object in line ${lineNumber}`); }
                    switch(line.substring(1,2)){
                        case ' ': {
                            const s = line.substring(2).split(" ");
                            if(s.length !== 3){ throw new Error(`Invalid vertex in line ${lineNumber}: '${line}'`);}
                            curObject.positions.push([
                                parseFloat(s[0]),
                                parseFloat(s[1]),
                                parseFloat(s[2]),
                            ]);
                            break;
                        }
                        case 't': {
                            const s = line.substring(3).split(" ");
                            if(s.length !== 2){ throw new Error(`Invalid texture coordinate in line ${lineNumber}: '${line}'`);}
                            curObject.textureCoordinates.push([
                                parseFloat(s[0]),
                                parseFloat(s[1]),
                            ]);
                            break;
                        }
                        case 'n': {
                            const s = line.substring(3).split(" ");
                            if(s.length !== 3){ throw new Error(`Invalid normal coordinate in line ${lineNumber}: '${line}'`);}
                            curObject.normals.push([
                                parseFloat(s[0]),
                                parseFloat(s[1]),
                                parseFloat(s[2]),
                            ]);
                            break;
                        }
                        default:
                            throw new Error(`Unknown vertex in line: ${line}`)
                    }
                    break;
                }

                default:
                    throw new Error(`Unknown identifier in line: ${line}`)
            }
            lineNumber++;
        }
    }
}

