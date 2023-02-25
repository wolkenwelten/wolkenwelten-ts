/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * Contains a script that recompresses all PNGs with zopflipng, should be portable
 * but needs the `zopflipng` utility available in the $PATH
 *
 * Might be expanded to compress other types of asset in the future.
 */
import { readdirSync, statSync } from "fs";
import { execSync } from "child_process";

const zopfli = (path) => {
    console.log(path);
    execSync(`zopflipng -y ${path} ${path}`);
};

const isDir = (path) => statSync(path).isDirectory();

const readdirRecSync = (path) => {
    const res = readdirSync(path);
    for(const file of res){
        if(file[0] === '.'){continue;} // Skip hidden/special files
        const filepath = path+file;
        if(filepath.endsWith(".png")){
            zopfli(filepath);
        } else if(isDir(filepath)){
            readdirRecSync(filepath+'/');
        }
    }
};
readdirRecSync(process.cwd()+'/assets/');
