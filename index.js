#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const chokidar = require('chokidar');

program.arguments('<location>');
program.parse(process.argv);

if(!program.args.length) {
    program.help();
    process.exit();
}

let location = program.args[0];

if(!fs.existsSync(location))
    console.error(location + " is not a valid location");

const filestats = fs.lstatSync(location);

function fixSdp(sdp_string) {
    
    let lines = sdp_string.split(/\r?\n/);

    for(let line of lines) {
        if(line.charAt(0) == 't')
            return; 
    }

    let inserted = false;
    let fixed_lines = [];

    let stopat = ['a', 'k', 'z', 'b', 'c', 'p', 'u', 'i', 's', 'o', 'v'];

    for(let i = lines.length - 1; i >= 0 && !inserted; --i){
        if(stopat.indexOf(lines[i].charAt(0)) != -1){
            lines.splice(i - 1, 0, 't=0 0');
            inserted = true;
        }
    }

    if(!inserted)
        console.error("invalid sdp file");

    return lines.join('\r\n');
}

function fixFile(file) {
    
    let fileext = file.split('.').pop();
    let fname = file.split('.').slice(0, -1).join('.');

    if(fileext != 'sdp')
        return;

    let str = fs.readFileSync(file).toString();

    let fixed = fixSdp(str);

    if(fixed)
        fs.writeFileSync(fname + '_fixed.sdp', fixed);

}

if(filestats.isFile())
    fixFile(location);

if(filestats.isDirectory()) {
    chokidar.watch(location)
        .on('add', path => {
            fixFile(path);
        })
        .on('change', path => {
            if(!path.endsWith('_fixed.sdp'))
                fixFile(path)
        })
}