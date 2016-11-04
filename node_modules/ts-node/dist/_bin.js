"use strict";
var path_1 = require('path');
var repl_1 = require('repl');
var util_1 = require('util');
var arrify = require('arrify');
var Module = require('module');
var minimist = require('minimist');
var chalk = require('chalk');
var vm_1 = require('vm');
var index_1 = require('./index');
var strings = ['eval', 'print', 'compiler', 'project', 'ignoreWarnings', 'require', 'cacheDirectory', 'ignore'];
var booleans = ['help', 'fast', 'lazy', 'version', 'disableWarnings', 'cache'];
var aliases = {
    help: ['h'],
    fast: ['F'],
    lazy: ['L'],
    version: ['v'],
    eval: ['e'],
    print: ['p'],
    project: ['P'],
    compiler: ['C'],
    require: ['r'],
    cacheDirectory: ['cache-directory'],
    ignoreWarnings: ['I', 'ignore-warnings'],
    disableWarnings: ['D', 'disable-warnings'],
    compilerOptions: ['O', 'compiler-options']
};
var stop = process.argv.length;
function isFlagOnly(arg) {
    var name = arg.replace(/^--?/, '');
    if (/=/.test(name) || /^--no-/.test(arg)) {
        return true;
    }
    for (var _i = 0, booleans_1 = booleans; _i < booleans_1.length; _i++) {
        var bool = booleans_1[_i];
        if (name === bool) {
            return true;
        }
        var alias = aliases[bool];
        if (alias) {
            for (var _a = 0, alias_1 = alias; _a < alias_1.length; _a++) {
                var other = alias_1[_a];
                if (other === name) {
                    return true;
                }
            }
        }
    }
    return false;
}
for (var i = 2; i < process.argv.length; i++) {
    var arg = process.argv[i];
    var next = process.argv[i + 1];
    if (/^\[/.test(arg) || /\]$/.test(arg)) {
        continue;
    }
    if (/^-/.test(arg)) {
        if (!isFlagOnly(arg) && !/^-/.test(next)) {
            i++;
        }
        continue;
    }
    stop = i;
    break;
}
var argv = minimist(process.argv.slice(2, stop), {
    string: strings,
    boolean: booleans,
    alias: aliases,
    default: {
        cache: true
    }
});
if (argv.version) {
    console.log("ts-node v" + index_1.VERSION);
    console.log("node " + process.version);
    process.exit(0);
}
if (argv.help) {
    console.log("\nUsage: ts-node [options] [ -e script | script.ts ] [arguments]\n\nOptions:\n\n  -e, --eval [code]              Evaluate code\n  -p, --print [code]             Evaluate code and print result\n  -r, --require [path]           Require a node module for execution\n  -C, --compiler [name]          Specify a custom TypeScript compiler\n  -I, --ignoreWarnings [code]    Ignore TypeScript warnings by diagnostic code\n  -D, --disableWarnings          Ignore every TypeScript warning\n  -P, --project [path]           Path to TypeScript project (or `false`)\n  -O, --compilerOptions [opts]   JSON object to merge with compiler options\n  -L, --lazy                     Lazily load TypeScript compilation on demand\n  -F, --fast                     Run TypeScript compilation in transpile mode\n  --ignore [regexp], --no-ignore Set the ignore check (default: `/node_modules/`)\n  --no-cache                     Disable the TypeScript cache\n  --cache-directory              Configure the TypeScript cache directory\n");
    process.exit(0);
}
var cwd = process.cwd();
var code = argv.eval == null ? argv.print : argv.eval;
var isEvalScript = typeof argv.eval === 'string' || !!argv.print;
var isEval = isEvalScript || stop === process.argv.length;
var isPrinted = argv.print != null;
var supportsScriptOptions = parseFloat(process.version.substr(1)) >= 1;
var service = index_1.register({
    fast: argv.fast,
    lazy: argv.lazy,
    cache: argv.cache,
    cacheDirectory: argv.cacheDirectory,
    compiler: argv.compiler,
    project: argv.project,
    ignore: argv.ignore,
    ignoreWarnings: argv.ignoreWarnings,
    disableWarnings: argv.disableWarnings,
    compilerOptions: index_1.parse(argv.compilerOptions),
    getFile: isEval ? getFileEval : index_1.getFile,
    fileExists: isEval ? fileExistsEval : index_1.fileExists
});
var evalId = 0;
var EVAL_PATHS = {};
for (var _i = 0, _a = arrify(argv.require); _i < _a.length; _i++) {
    var id = _a[_i];
    Module._load(id);
}
if (isEvalScript) {
    evalAndExit(code, isPrinted);
}
else {
    if (stop < process.argv.length) {
        var args = process.argv.slice(stop);
        args[0] = path_1.resolve(cwd, args[0]);
        process.argv = ['node'].concat(args);
        process.execArgv.unshift(__filename);
        Module.runMain();
    }
    else {
        if (process.stdin.isTTY) {
            startRepl();
        }
        else {
            var code_1 = '';
            process.stdin.on('data', function (chunk) { return code_1 += chunk; });
            process.stdin.on('end', function () { return evalAndExit(code_1, isPrinted); });
        }
    }
}
function evalAndExit(code, isPrinted) {
    var filename = getEvalFileName(evalId);
    var module = new Module(filename);
    module.filename = filename;
    module.paths = Module._nodeModulePaths(cwd);
    global.__filename = filename;
    global.__dirname = cwd;
    global.exports = module.exports;
    global.module = module;
    global.require = module.require.bind(module);
    var result;
    try {
        result = _eval(code, global);
    }
    catch (error) {
        if (error instanceof index_1.TSError) {
            console.error(print(error));
            process.exit(1);
        }
        throw error;
    }
    if (isPrinted) {
        console.log(typeof result === 'string' ? result : util_1.inspect(result));
    }
    process.exit(0);
}
function print(error) {
    var title = chalk.red('⨯') + " Unable to compile TypeScript";
    return chalk.bold(title) + "\n" + error.diagnostics.map(function (x) { return x.message; }).join('\n');
}
function _eval(input, context) {
    var isCompletion = !/\n$/.test(input);
    var path = path_1.join(cwd, getEvalFileName(evalId++));
    var _a = getEvalContent(input), code = _a.code, lineOffset = _a.lineOffset;
    var filename = path_1.basename(path);
    var output = service().compile(code, path, lineOffset);
    var script = vm_1.createScript(output, supportsScriptOptions ? { filename: filename, lineOffset: lineOffset } : filename);
    var result = script.runInNewContext(context);
    if (!isCompletion) {
        EVAL_PATHS[path] = code;
    }
    return result;
}
function startRepl() {
    var repl = repl_1.start({
        prompt: '> ',
        input: process.stdin,
        output: process.stdout,
        eval: replEval,
        useGlobal: false
    });
    repl.defineCommand('type', {
        help: 'Check the type of a TypeScript identifier',
        action: function (identifier) {
            if (!identifier) {
                repl.displayPrompt();
                return;
            }
            var path = path_1.join(cwd, getEvalFileName(evalId++));
            var _a = getEvalContent(identifier), code = _a.code, lineOffset = _a.lineOffset;
            EVAL_PATHS[path] = code;
            var _b = service().getTypeInfo(path, code.length), name = _b.name, comment = _b.comment;
            delete EVAL_PATHS[path];
            repl.outputStream.write(chalk.bold(name) + "\n" + (comment ? comment + "\n" : ''));
            repl.displayPrompt();
        }
    });
}
function replEval(code, context, filename, callback) {
    var err;
    var result;
    if (code === '.scope') {
        callback();
        return;
    }
    try {
        result = _eval(code, context);
    }
    catch (error) {
        if (error instanceof index_1.TSError) {
            if (typeof repl_1.Recoverable === 'function' && isRecoverable(error)) {
                err = new repl_1.Recoverable(error);
            }
            else {
                err = print(error);
            }
        }
        else {
            err = error;
        }
    }
    callback(err, result);
}
function getFileEval(path) {
    return EVAL_PATHS.hasOwnProperty(path) ? EVAL_PATHS[path] : index_1.getFile(path);
}
function fileExistsEval(path) {
    return EVAL_PATHS.hasOwnProperty(path) || index_1.fileExists(path);
}
function getEvalContent(input) {
    var refs = Object.keys(EVAL_PATHS).map(function (x) { return ("/// <reference path=\"" + x + "\" />\n"); });
    return {
        lineOffset: -refs.length,
        code: refs.join('') + input
    };
}
function getEvalFileName(index) {
    return "[eval " + index + "].ts";
}
var RECOVERY_CODES = [
    1003,
    1005,
    1109,
    1126,
    1160,
    1161
];
function isRecoverable(error) {
    return error.diagnostics.every(function (x) { return RECOVERY_CODES.indexOf(x.code) > -1; });
}
//# sourceMappingURL=_bin.js.map