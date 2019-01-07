const fs = require('fs'),
    path = require('path'),
    beautify = require('js-beautify').js,
    UglifyJS = require('uglify-js'),
    strip = require('strip-comments');

const unpackers = {};
["javascriptobfuscator_unpacker", "myobfuscate_unpacker", "p_a_c_k_e_r_unpacker"].forEach(function (unpacker) {
    unpackers[unpacker] = require("./unpackers/" + unpacker);
});


const filePath = process.env.FilePath;
if (!filePath) return;

const dirPath = path.dirname(filePath);
const fileName = path.basename(filePath);
const outDirPath = path.resolve(dirPath, 'out');
if (!fs.existsSync(outDirPath)) {
    fs.mkdirSync(outDirPath);
}
const outFilePath = path.resolve(outDirPath, fileName);

const unpack = function (code, config) {
    Object.getOwnPropertyNames(unpackers).forEach(function (unpackername) {
        var unpacker = unpackers[unpackername];
        if (unpacker.detect(code)) {
            console.log('unpacking using ' + unpackername);
            var unpacked = unpacker.unpack(code);
            if (unpacked != code) {
                code = unpack(unpacked, config);
            }
        }
    });
    return code;
}

var code = fs.readFileSync(filePath, "utf8");


// 去除注释，否则无法解混淆
console.log('removing comments...');
code = strip(code).trim();

// 解混淆
console.log('unpacking...');
code = unpack(code);

// 转义 \x 字符串
console.log('excaping \\x characters...');
code = beautify(code, {
    indent_size: 2,
    unescape_strings: true
});

// 替换变量名
console.log('replacing variable names...');
code = UglifyJS.minify(code, {
    compress: {
        arguments: false,
        collapse_vars: false,
        conditionals: false,
        expression: true,
        hoist_props: false,
        if_return: false,
        inline: false,
        join_vars: false,
        keep_infinity: true,
        reduce_funcs: false,
        reduce_vars: false,
        sequences: false,
        typeofs: false
    },
    output: {
        beautify: true,
        braces: true,
        quote_style: 1,
        semicolons: true,
        wrap_iife: true
    }
}).code;

fs.writeFileSync(outFilePath, code, "utf8");