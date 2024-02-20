var Module;
if (!Module) Module = (typeof Module !== "undefined" ? Module : null) || {};
var moduleOverrides = {};
for (var key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}
var ENVIRONMENT_IS_WEB = typeof window === "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
var ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
 if (!Module["print"]) Module["print"] = function print(x) {
  process["stdout"].write(x + "\n");
 };
 if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
  process["stderr"].write(x + "\n");
 };
 var nodeFS = require("fs");
 var nodePath = require("path");
 Module["read"] = function read(filename, binary) {
  filename = nodePath["normalize"](filename);
  var ret = nodeFS["readFileSync"](filename);
  if (!ret && filename != nodePath["resolve"](filename)) {
   filename = path.join(__dirname, "..", "src", filename);
   ret = nodeFS["readFileSync"](filename);
  }
  if (ret && !binary) ret = ret.toString();
  return ret;
 };
 Module["readBinary"] = function readBinary(filename) {
  var ret = Module["read"](filename, true);
  if (!ret.buffer) {
   ret = new Uint8Array(ret);
  }
  assert(ret.buffer);
  return ret;
 };
 Module["load"] = function load(f) {
  globalEval(read(f));
 };
 if (!Module["thisProgram"]) {
  if (process["argv"].length > 1) {
   Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/");
  } else {
   Module["thisProgram"] = "unknown-program";
  }
 }
 Module["arguments"] = process["argv"].slice(2);
 if (typeof module !== "undefined") {
  module["exports"] = Module;
 }
 process["on"]("uncaughtException", (function(ex) {
  if (!(ex instanceof ExitStatus)) {
   throw ex;
  }
 }));
 Module["inspect"] = (function() {
  return "[Emscripten Module object]";
 });
} else if (ENVIRONMENT_IS_SHELL) {
 if (!Module["print"]) Module["print"] = print;
 if (typeof printErr != "undefined") Module["printErr"] = printErr;
 if (typeof read != "undefined") {
  Module["read"] = read;
 } else {
  Module["read"] = function read() {
   throw "no read() available (jsc?)";
  };
 }
 Module["readBinary"] = function readBinary(f) {
  if (typeof readbuffer === "function") {
   return new Uint8Array(readbuffer(f));
  }
  var data = read(f, "binary");
  assert(typeof data === "object");
  return data;
 };
 if (typeof scriptArgs != "undefined") {
  Module["arguments"] = scriptArgs;
 } else if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 Module["read"] = function read(url) {
  var xhr = new XMLHttpRequest;
  xhr.open("GET", url, false);
  xhr.send(null);
  return xhr.responseText;
 };
 if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
 if (typeof console !== "undefined") {
  if (!Module["print"]) Module["print"] = function print(x) {
   console.log(x);
  };
  if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
   console.log(x);
  };
 } else {
  var TRY_USE_DUMP = false;
  if (!Module["print"]) Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? (function(x) {
   dump(x);
  }) : (function(x) {});
 }
 if (ENVIRONMENT_IS_WORKER) {
  Module["load"] = importScripts;
 }
 if (typeof Module["setWindowTitle"] === "undefined") {
  Module["setWindowTitle"] = (function(title) {
   document.title = title;
  });
 }
} else {
 throw "Unknown runtime environment. Where are we?";
}
function globalEval(x) {
 eval.call(null, x);
}
if (!Module["load"] && Module["read"]) {
 Module["load"] = function load(f) {
  globalEval(Module["read"](f));
 };
}
if (!Module["print"]) {
 Module["print"] = (function() {});
}
if (!Module["printErr"]) {
 Module["printErr"] = Module["print"];
}
if (!Module["arguments"]) {
 Module["arguments"] = [];
}
if (!Module["thisProgram"]) {
 Module["thisProgram"] = "./this.program";
}
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for (var key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}
var Runtime = {
 setTempRet0: (function(value) {
  tempRet0 = value;
 }),
 getTempRet0: (function() {
  return tempRet0;
 }),
 stackSave: (function() {
  return STACKTOP;
 }),
 stackRestore: (function(stackTop) {
  STACKTOP = stackTop;
 }),
 getNativeTypeSize: (function(type) {
  switch (type) {
  case "i1":
  case "i8":
   return 1;
  case "i16":
   return 2;
  case "i32":
   return 4;
  case "i64":
   return 8;
  case "float":
   return 4;
  case "double":
   return 8;
  default:
   {
    if (type[type.length - 1] === "*") {
     return Runtime.QUANTUM_SIZE;
    } else if (type[0] === "i") {
     var bits = parseInt(type.substr(1));
     assert(bits % 8 === 0);
     return bits / 8;
    } else {
     return 0;
    }
   }
  }
 }),
 getNativeFieldSize: (function(type) {
  return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
 }),
 STACK_ALIGN: 16,
 prepVararg: (function(ptr, type) {
  if (type === "double" || type === "i64") {
   if (ptr & 7) {
    assert((ptr & 7) === 4);
    ptr += 4;
   }
  } else {
   assert((ptr & 3) === 0);
  }
  return ptr;
 }),
 getAlignSize: (function(type, size, vararg) {
  if (!vararg && (type == "i64" || type == "double")) return 8;
  if (!type) return Math.min(size, 8);
  return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
 }),
 dynCall: (function(sig, ptr, args) {
  if (args && args.length) {
   if (!args.splice) args = Array.prototype.slice.call(args);
   args.splice(0, 0, ptr);
   return Module["dynCall_" + sig].apply(null, args);
  } else {
   return Module["dynCall_" + sig].call(null, ptr);
  }
 }),
 functionPointers: [],
 addFunction: (function(func) {
  for (var i = 0; i < Runtime.functionPointers.length; i++) {
   if (!Runtime.functionPointers[i]) {
    Runtime.functionPointers[i] = func;
    return 2 * (1 + i);
   }
  }
  throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.";
 }),
 removeFunction: (function(index) {
  Runtime.functionPointers[(index - 2) / 2] = null;
 }),
 warnOnce: (function(text) {
  if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
  if (!Runtime.warnOnce.shown[text]) {
   Runtime.warnOnce.shown[text] = 1;
   Module.printErr(text);
  }
 }),
 funcWrappers: {},
 getFuncWrapper: (function(func, sig) {
  assert(sig);
  if (!Runtime.funcWrappers[sig]) {
   Runtime.funcWrappers[sig] = {};
  }
  var sigCache = Runtime.funcWrappers[sig];
  if (!sigCache[func]) {
   sigCache[func] = function dynCall_wrapper() {
    return Runtime.dynCall(sig, func, arguments);
   };
  }
  return sigCache[func];
 }),
 getCompilerSetting: (function(name) {
  throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work";
 }),
 stackAlloc: (function(size) {
  var ret = STACKTOP;
  STACKTOP = STACKTOP + size | 0;
  STACKTOP = STACKTOP + 15 & -16;
  return ret;
 }),
 staticAlloc: (function(size) {
  var ret = STATICTOP;
  STATICTOP = STATICTOP + size | 0;
  STATICTOP = STATICTOP + 15 & -16;
  return ret;
 }),
 dynamicAlloc: (function(size) {
  var ret = DYNAMICTOP;
  DYNAMICTOP = DYNAMICTOP + size | 0;
  DYNAMICTOP = DYNAMICTOP + 15 & -16;
  if (DYNAMICTOP >= TOTAL_MEMORY) {
   var success = enlargeMemory();
   if (!success) {
    DYNAMICTOP = ret;
    return 0;
   }
  }
  return ret;
 }),
 alignMemory: (function(size, quantum) {
  var ret = size = Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16);
  return ret;
 }),
 makeBigInt: (function(low, high, unsigned) {
  var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * +4294967296 : +(low >>> 0) + +(high | 0) * +4294967296;
  return ret;
 }),
 GLOBAL_BASE: 8,
 QUANTUM_SIZE: 4,
 __dummy__: 0
};
Module["Runtime"] = Runtime;
var __THREW__ = 0;
var ABORT = false;
var EXITSTATUS = 0;
var undef = 0;
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}
var globalScope = this;
function getCFunc(ident) {
 var func = Module["_" + ident];
 if (!func) {
  try {
   func = eval("_" + ident);
  } catch (e) {}
 }
 assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");
 return func;
}
var cwrap, ccall;
((function() {
 var JSfuncs = {
  "stackSave": (function() {
   Runtime.stackSave();
  }),
  "stackRestore": (function() {
   Runtime.stackRestore();
  }),
  "arrayToC": (function(arr) {
   var ret = Runtime.stackAlloc(arr.length);
   writeArrayToMemory(arr, ret);
   return ret;
  }),
  "stringToC": (function(str) {
   var ret = 0;
   if (str !== null && str !== undefined && str !== 0) {
    ret = Runtime.stackAlloc((str.length << 2) + 1);
    writeStringToMemory(str, ret);
   }
   return ret;
  })
 };
 var toC = {
  "string": JSfuncs["stringToC"],
  "array": JSfuncs["arrayToC"]
 };
 ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
   for (var i = 0; i < args.length; i++) {
    var converter = toC[argTypes[i]];
    if (converter) {
     if (stack === 0) stack = Runtime.stackSave();
     cArgs[i] = converter(args[i]);
    } else {
     cArgs[i] = args[i];
    }
   }
  }
  var ret = func.apply(null, cArgs);
  if (returnType === "string") ret = Pointer_stringify(ret);
  if (stack !== 0) {
   if (opts && opts.async) {
    EmterpreterAsync.asyncFinalizers.push((function() {
     Runtime.stackRestore(stack);
    }));
    return;
   }
   Runtime.stackRestore(stack);
  }
  return ret;
 };
 var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
 function parseJSFunc(jsfunc) {
  var parsed = jsfunc.toString().match(sourceRegex).slice(1);
  return {
   arguments: parsed[0],
   body: parsed[1],
   returnValue: parsed[2]
  };
 }
 var JSsource = {};
 for (var fun in JSfuncs) {
  if (JSfuncs.hasOwnProperty(fun)) {
   JSsource[fun] = parseJSFunc(JSfuncs[fun]);
  }
 }
 cwrap = function cwrap(ident, returnType, argTypes) {
  argTypes = argTypes || [];
  var cfunc = getCFunc(ident);
  var numericArgs = argTypes.every((function(type) {
   return type === "number";
  }));
  var numericRet = returnType !== "string";
  if (numericRet && numericArgs) {
   return cfunc;
  }
  var argNames = argTypes.map((function(x, i) {
   return "$" + i;
  }));
  var funcstr = "(function(" + argNames.join(",") + ") {";
  var nargs = argTypes.length;
  if (!numericArgs) {
   funcstr += "var stack = " + JSsource["stackSave"].body + ";";
   for (var i = 0; i < nargs; i++) {
    var arg = argNames[i], type = argTypes[i];
    if (type === "number") continue;
    var convertCode = JSsource[type + "ToC"];
    funcstr += "var " + convertCode.arguments + " = " + arg + ";";
    funcstr += convertCode.body + ";";
    funcstr += arg + "=" + convertCode.returnValue + ";";
   }
  }
  var cfuncname = parseJSFunc((function() {
   return cfunc;
  })).returnValue;
  funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
  if (!numericRet) {
   var strgfy = parseJSFunc((function() {
    return Pointer_stringify;
   })).returnValue;
   funcstr += "ret = " + strgfy + "(ret);";
  }
  if (!numericArgs) {
   funcstr += JSsource["stackRestore"].body.replace("()", "(stack)") + ";";
  }
  funcstr += "return ret})";
  return eval(funcstr);
 };
}))();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
function setValue(ptr, value, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;
 case "i8":
  HEAP8[ptr >> 0] = value;
  break;
 case "i16":
  HEAP16[ptr >> 1] = value;
  break;
 case "i32":
  HEAP32[ptr >> 2] = value;
  break;
 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0) ], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;
 case "float":
  HEAPF32[ptr >> 2] = value;
  break;
 case "double":
  HEAPF64[ptr >> 3] = value;
  break;
 default:
  abort("invalid type for setValue: " + type);
 }
}
Module["setValue"] = setValue;
function getValue(ptr, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  return HEAP8[ptr >> 0];
 case "i8":
  return HEAP8[ptr >> 0];
 case "i16":
  return HEAP16[ptr >> 1];
 case "i32":
  return HEAP32[ptr >> 2];
 case "i64":
  return HEAP32[ptr >> 2];
 case "float":
  return HEAPF32[ptr >> 2];
 case "double":
  return HEAPF64[ptr >> 3];
 default:
  abort("invalid type for setValue: " + type);
 }
 return null;
}
Module["getValue"] = getValue;
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
var ALLOC_STATIC = 2;
var ALLOC_DYNAMIC = 3;
var ALLOC_NONE = 4;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;
function allocate(slab, types, allocator, ptr) {
 var zeroinit, size;
 if (typeof slab === "number") {
  zeroinit = true;
  size = slab;
 } else {
  zeroinit = false;
  size = slab.length;
 }
 var singleType = typeof types === "string" ? types : null;
 var ret;
 if (allocator == ALLOC_NONE) {
  ret = ptr;
 } else {
  ret = [ _malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc ][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
 }
 if (zeroinit) {
  var ptr = ret, stop;
  assert((ret & 3) == 0);
  stop = ret + (size & ~3);
  for (; ptr < stop; ptr += 4) {
   HEAP32[ptr >> 2] = 0;
  }
  stop = ret + size;
  while (ptr < stop) {
   HEAP8[ptr++ >> 0] = 0;
  }
  return ret;
 }
 if (singleType === "i8") {
  if (slab.subarray || slab.slice) {
   HEAPU8.set(slab, ret);
  } else {
   HEAPU8.set(new Uint8Array(slab), ret);
  }
  return ret;
 }
 var i = 0, type, typeSize, previousType;
 while (i < size) {
  var curr = slab[i];
  if (typeof curr === "function") {
   curr = Runtime.getFunctionIndex(curr);
  }
  type = singleType || types[i];
  if (type === 0) {
   i++;
   continue;
  }
  if (type == "i64") type = "i32";
  setValue(ret + i, curr, type);
  if (previousType !== type) {
   typeSize = Runtime.getNativeTypeSize(type);
   previousType = type;
  }
  i += typeSize;
 }
 return ret;
}
Module["allocate"] = allocate;
function getMemory(size) {
 if (!staticSealed) return Runtime.staticAlloc(size);
 if (typeof _sbrk !== "undefined" && !_sbrk.called || !runtimeInitialized) return Runtime.dynamicAlloc(size);
 return _malloc(size);
}
Module["getMemory"] = getMemory;
function Pointer_stringify(ptr, length) {
 if (length === 0 || !ptr) return "";
 var hasUtf = 0;
 var t;
 var i = 0;
 while (1) {
  t = HEAPU8[ptr + i >> 0];
  hasUtf |= t;
  if (t == 0 && !length) break;
  i++;
  if (length && i == length) break;
 }
 if (!length) length = i;
 var ret = "";
 if (hasUtf < 128) {
  var MAX_CHUNK = 1024;
  var curr;
  while (length > 0) {
   curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
   ret = ret ? ret + curr : curr;
   ptr += MAX_CHUNK;
   length -= MAX_CHUNK;
  }
  return ret;
 }
 return Module["UTF8ToString"](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;
function AsciiToString(ptr) {
 var str = "";
 while (1) {
  var ch = HEAP8[ptr++ >> 0];
  if (!ch) return str;
  str += String.fromCharCode(ch);
 }
}
Module["AsciiToString"] = AsciiToString;
function stringToAscii(str, outPtr) {
 return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;
function UTF8ArrayToString(u8Array, idx) {
 var u0, u1, u2, u3, u4, u5;
 var str = "";
 while (1) {
  u0 = u8Array[idx++];
  if (!u0) return str;
  if (!(u0 & 128)) {
   str += String.fromCharCode(u0);
   continue;
  }
  u1 = u8Array[idx++] & 63;
  if ((u0 & 224) == 192) {
   str += String.fromCharCode((u0 & 31) << 6 | u1);
   continue;
  }
  u2 = u8Array[idx++] & 63;
  if ((u0 & 240) == 224) {
   u0 = (u0 & 15) << 12 | u1 << 6 | u2;
  } else {
   u3 = u8Array[idx++] & 63;
   if ((u0 & 248) == 240) {
    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3;
   } else {
    u4 = u8Array[idx++] & 63;
    if ((u0 & 252) == 248) {
     u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4;
    } else {
     u5 = u8Array[idx++] & 63;
     u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5;
    }
   }
  }
  if (u0 < 65536) {
   str += String.fromCharCode(u0);
  } else {
   var ch = u0 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  }
 }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;
function UTF8ToString(ptr) {
 return UTF8ArrayToString(HEAPU8, ptr);
}
Module["UTF8ToString"] = UTF8ToString;
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   outU8Array[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   outU8Array[outIdx++] = 192 | u >> 6;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   outU8Array[outIdx++] = 224 | u >> 12;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 2097151) {
   if (outIdx + 3 >= endIdx) break;
   outU8Array[outIdx++] = 240 | u >> 18;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 67108863) {
   if (outIdx + 4 >= endIdx) break;
   outU8Array[outIdx++] = 248 | u >> 24;
   outU8Array[outIdx++] = 128 | u >> 18 & 63;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 5 >= endIdx) break;
   outU8Array[outIdx++] = 252 | u >> 30;
   outU8Array[outIdx++] = 128 | u >> 24 & 63;
   outU8Array[outIdx++] = 128 | u >> 18 & 63;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  }
 }
 outU8Array[outIdx] = 0;
 return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;
function stringToUTF8(str, outPtr, maxBytesToWrite) {
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;
function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) {
   ++len;
  } else if (u <= 2047) {
   len += 2;
  } else if (u <= 65535) {
   len += 3;
  } else if (u <= 2097151) {
   len += 4;
  } else if (u <= 67108863) {
   len += 5;
  } else {
   len += 6;
  }
 }
 return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;
function UTF16ToString(ptr) {
 var i = 0;
 var str = "";
 while (1) {
  var codeUnit = HEAP16[ptr + i * 2 >> 1];
  if (codeUnit == 0) return str;
  ++i;
  str += String.fromCharCode(codeUnit);
 }
}
Module["UTF16ToString"] = UTF16ToString;
function stringToUTF16(str, outPtr, maxBytesToWrite) {
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 2) return 0;
 maxBytesToWrite -= 2;
 var startPtr = outPtr;
 var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
 for (var i = 0; i < numCharsToWrite; ++i) {
  var codeUnit = str.charCodeAt(i);
  HEAP16[outPtr >> 1] = codeUnit;
  outPtr += 2;
 }
 HEAP16[outPtr >> 1] = 0;
 return outPtr - startPtr;
}
Module["stringToUTF16"] = stringToUTF16;
function lengthBytesUTF16(str) {
 return str.length * 2;
}
Module["lengthBytesUTF16"] = lengthBytesUTF16;
function UTF32ToString(ptr) {
 var i = 0;
 var str = "";
 while (1) {
  var utf32 = HEAP32[ptr + i * 4 >> 2];
  if (utf32 == 0) return str;
  ++i;
  if (utf32 >= 65536) {
   var ch = utf32 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  } else {
   str += String.fromCharCode(utf32);
  }
 }
}
Module["UTF32ToString"] = UTF32ToString;
function stringToUTF32(str, outPtr, maxBytesToWrite) {
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 4) return 0;
 var startPtr = outPtr;
 var endPtr = startPtr + maxBytesToWrite - 4;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) {
   var trailSurrogate = str.charCodeAt(++i);
   codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
  }
  HEAP32[outPtr >> 2] = codeUnit;
  outPtr += 4;
  if (outPtr + 4 > endPtr) break;
 }
 HEAP32[outPtr >> 2] = 0;
 return outPtr - startPtr;
}
Module["stringToUTF32"] = stringToUTF32;
function lengthBytesUTF32(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
  len += 4;
 }
 return len;
}
Module["lengthBytesUTF32"] = lengthBytesUTF32;
function demangle(func) {
 var hasLibcxxabi = !!Module["___cxa_demangle"];
 if (hasLibcxxabi) {
  try {
   var buf = _malloc(func.length);
   writeStringToMemory(func.substr(1), buf);
   var status = _malloc(4);
   var ret = Module["___cxa_demangle"](buf, 0, 0, status);
   if (getValue(status, "i32") === 0 && ret) {
    return Pointer_stringify(ret);
   }
  } catch (e) {} finally {
   if (buf) _free(buf);
   if (status) _free(status);
   if (ret) _free(ret);
  }
 }
 var i = 3;
 var basicTypes = {
  "v": "void",
  "b": "bool",
  "c": "char",
  "s": "short",
  "i": "int",
  "l": "long",
  "f": "float",
  "d": "double",
  "w": "wchar_t",
  "a": "signed char",
  "h": "unsigned char",
  "t": "unsigned short",
  "j": "unsigned int",
  "m": "unsigned long",
  "x": "long long",
  "y": "unsigned long long",
  "z": "..."
 };
 var subs = [];
 var first = true;
 function dump(x) {
  if (x) Module.print(x);
  Module.print(func);
  var pre = "";
  for (var a = 0; a < i; a++) pre += " ";
  Module.print(pre + "^");
 }
 function parseNested() {
  i++;
  if (func[i] === "K") i++;
  var parts = [];
  while (func[i] !== "E") {
   if (func[i] === "S") {
    i++;
    var next = func.indexOf("_", i);
    var num = func.substring(i, next) || 0;
    parts.push(subs[num] || "?");
    i = next + 1;
    continue;
   }
   if (func[i] === "C") {
    parts.push(parts[parts.length - 1]);
    i += 2;
    continue;
   }
   var size = parseInt(func.substr(i));
   var pre = size.toString().length;
   if (!size || !pre) {
    i--;
    break;
   }
   var curr = func.substr(i + pre, size);
   parts.push(curr);
   subs.push(curr);
   i += pre + size;
  }
  i++;
  return parts;
 }
 function parse(rawList, limit, allowVoid) {
  limit = limit || Infinity;
  var ret = "", list = [];
  function flushList() {
   return "(" + list.join(", ") + ")";
  }
  var name;
  if (func[i] === "N") {
   name = parseNested().join("::");
   limit--;
   if (limit === 0) return rawList ? [ name ] : name;
  } else {
   if (func[i] === "K" || first && func[i] === "L") i++;
   var size = parseInt(func.substr(i));
   if (size) {
    var pre = size.toString().length;
    name = func.substr(i + pre, size);
    i += pre + size;
   }
  }
  first = false;
  if (func[i] === "I") {
   i++;
   var iList = parse(true);
   var iRet = parse(true, 1, true);
   ret += iRet[0] + " " + name + "<" + iList.join(", ") + ">";
  } else {
   ret = name;
  }
  paramLoop : while (i < func.length && limit-- > 0) {
   var c = func[i++];
   if (c in basicTypes) {
    list.push(basicTypes[c]);
   } else {
    switch (c) {
    case "P":
     list.push(parse(true, 1, true)[0] + "*");
     break;
    case "R":
     list.push(parse(true, 1, true)[0] + "&");
     break;
    case "L":
     {
      i++;
      var end = func.indexOf("E", i);
      var size = end - i;
      list.push(func.substr(i, size));
      i += size + 2;
      break;
     }
    case "A":
     {
      var size = parseInt(func.substr(i));
      i += size.toString().length;
      if (func[i] !== "_") throw "?";
      i++;
      list.push(parse(true, 1, true)[0] + " [" + size + "]");
      break;
     }
    case "E":
     break paramLoop;
    default:
     ret += "?" + c;
     break paramLoop;
    }
   }
  }
  if (!allowVoid && list.length === 1 && list[0] === "void") list = [];
  if (rawList) {
   if (ret) {
    list.push(ret + "?");
   }
   return list;
  } else {
   return ret + flushList();
  }
 }
 var parsed = func;
 try {
  if (func == "Object._main" || func == "_main") {
   return "main()";
  }
  if (typeof func === "number") func = Pointer_stringify(func);
  if (func[0] !== "_") return func;
  if (func[1] !== "_") return func;
  if (func[2] !== "Z") return func;
  switch (func[3]) {
  case "n":
   return "operator new()";
  case "d":
   return "operator delete()";
  }
  parsed = parse();
 } catch (e) {
  parsed += "?";
 }
 if (parsed.indexOf("?") >= 0 && !hasLibcxxabi) {
  Runtime.warnOnce("warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");
 }
 return parsed;
}
function demangleAll(text) {
 return text.replace(/__Z[\w\d_]+/g, (function(x) {
  var y = demangle(x);
  return x === y ? x : x + " [" + y + "]";
 }));
}
function jsStackTrace() {
 var err = new Error;
 if (!err.stack) {
  try {
   throw new Error(0);
  } catch (e) {
   err = e;
  }
  if (!err.stack) {
   return "(no stack trace available)";
  }
 }
 return err.stack.toString();
}
function stackTrace() {
 return demangleAll(jsStackTrace());
}
Module["stackTrace"] = stackTrace;
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
 if (x % 4096 > 0) {
  x += 4096 - x % 4096;
 }
 return x;
}
var HEAP;
var buffer;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBuffer(buf) {
 Module["buffer"] = buffer = buf;
}
function updateGlobalBufferViews() {
 Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
 Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
 Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
}
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false;
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0;
var DYNAMIC_BASE = 0, DYNAMICTOP = 0;
function abortOnCannotGrowMemory() {
 abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ");
}
function enlargeMemory() {
 abortOnCannotGrowMemory();
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 52428800;
var totalMemory = 64 * 1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2 * TOTAL_STACK) {
 if (totalMemory < 16 * 1024 * 1024) {
  totalMemory *= 2;
 } else {
  totalMemory += 16 * 1024 * 1024;
 }
}
if (totalMemory !== TOTAL_MEMORY) {
 TOTAL_MEMORY = totalMemory;
}
assert(typeof Int32Array !== "undefined" && typeof Float64Array !== "undefined" && !!(new Int32Array(1))["subarray"] && !!(new Int32Array(1))["set"], "JS engine does not provide full typed array support");
if (Module["buffer"]) {
 buffer = Module["buffer"];
 assert(buffer.byteLength === TOTAL_MEMORY, "provided buffer should be " + TOTAL_MEMORY + " bytes, but it is " + buffer.byteLength);
} else {
 buffer = new ArrayBuffer(TOTAL_MEMORY);
}
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, "Typed arrays 2 must be run on a little-endian system");
Module["HEAP"] = HEAP;
Module["buffer"] = buffer;
Module["HEAP8"] = HEAP8;
Module["HEAP16"] = HEAP16;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPU16"] = HEAPU16;
Module["HEAPU32"] = HEAPU32;
Module["HEAPF32"] = HEAPF32;
Module["HEAPF64"] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback();
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    Runtime.dynCall("v", func);
   } else {
    Runtime.dynCall("vi", func, [ callback.arg ]);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
 if (runtimeInitialized) return;
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
 callRuntimeCallbacks(__ATEXIT__);
 runtimeExited = true;
}
function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = addOnPreRun;
function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;
function addOnPreMain(cb) {
 __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;
function addOnExit(cb) {
 __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;
function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;
function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
}
Module["intArrayFromString"] = intArrayFromString;
function intArrayToString(array) {
 var ret = [];
 for (var i = 0; i < array.length; i++) {
  var chr = array[i];
  if (chr > 255) {
   chr &= 255;
  }
  ret.push(String.fromCharCode(chr));
 }
 return ret.join("");
}
Module["intArrayToString"] = intArrayToString;
function writeStringToMemory(string, buffer, dontAddNull) {
 var array = intArrayFromString(string, dontAddNull);
 var i = 0;
 while (i < array.length) {
  var chr = array[i];
  HEAP8[buffer + i >> 0] = chr;
  i = i + 1;
 }
}
Module["writeStringToMemory"] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
 for (var i = 0; i < array.length; i++) {
  HEAP8[buffer++ >> 0] = array[i];
 }
}
Module["writeArrayToMemory"] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
 for (var i = 0; i < str.length; ++i) {
  HEAP8[buffer++ >> 0] = str.charCodeAt(i);
 }
 if (!dontAddNull) HEAP8[buffer >> 0] = 0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
function unSign(value, bits, ignore) {
 if (value >= 0) {
  return value;
 }
 return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value;
}
function reSign(value, bits, ignore) {
 if (value <= 0) {
  return value;
 }
 var half = bits <= 32 ? Math.abs(1 << bits - 1) : Math.pow(2, bits - 1);
 if (value >= half && (bits <= 32 || value > half)) {
  value = -2 * half + value;
 }
 return value;
}
if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5) Math["imul"] = function imul(a, b) {
 var ah = a >>> 16;
 var al = a & 65535;
 var bh = b >>> 16;
 var bl = b & 65535;
 return al * bl + (ah * bl + al * bh << 16) | 0;
};
Math.imul = Math["imul"];
if (!Math["clz32"]) Math["clz32"] = (function(x) {
 x = x >>> 0;
 for (var i = 0; i < 32; i++) {
  if (x & 1 << 31 - i) return i;
 }
 return 32;
});
Math.clz32 = Math["clz32"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
 return id;
}
function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}
Module["addRunDependency"] = addRunDependency;
function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var memoryInitializer = null;
var ASM_CONSTS = [];
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 8864;
__ATINIT__.push();
allocate([ 10, 0, 0, 0, 13, 0, 0, 0, 16, 0, 0, 0, 11, 0, 0, 0, 14, 0, 0, 0, 18, 0, 0, 0, 13, 0, 0, 0, 16, 0, 0, 0, 20, 0, 0, 0, 14, 0, 0, 0, 18, 0, 0, 0, 23, 0, 0, 0, 16, 0, 0, 0, 20, 0, 0, 0, 25, 0, 0, 0, 18, 0, 0, 0, 23, 0, 0, 0, 29, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 14, 0, 0, 0, 15, 0, 0, 0, 16, 0, 0, 0, 17, 0, 0, 0, 18, 0, 0, 0, 19, 0, 0, 0, 20, 0, 0, 0, 21, 0, 0, 0, 22, 0, 0, 0, 23, 0, 0, 0, 24, 0, 0, 0, 25, 0, 0, 0, 26, 0, 0, 0, 27, 0, 0, 0, 28, 0, 0, 0, 29, 0, 0, 0, 29, 0, 0, 0, 30, 0, 0, 0, 31, 0, 0, 0, 32, 0, 0, 0, 32, 0, 0, 0, 33, 0, 0, 0, 34, 0, 0, 0, 34, 0, 0, 0, 35, 0, 0, 0, 35, 0, 0, 0, 36, 0, 0, 0, 36, 0, 0, 0, 37, 0, 0, 0, 37, 0, 0, 0, 37, 0, 0, 0, 38, 0, 0, 0, 38, 0, 0, 0, 38, 0, 0, 0, 39, 0, 0, 0, 39, 0, 0, 0, 39, 0, 0, 0, 39, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 14, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 4, 0, 0, 0, 10, 0, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 4, 0, 0, 0, 12, 0, 0, 0, 4, 0, 0, 0, 11, 0, 0, 0, 4, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 4, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 19, 0, 0, 0, 4, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 21, 0, 0, 0, 4, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 4, 0, 0, 0, 22, 0, 0, 0, 1, 0, 0, 0, 10, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 1, 0, 0, 0, 15, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 4, 0, 0, 0, 7, 0, 0, 0, 4, 0, 0, 0, 12, 0, 0, 0, 4, 0, 0, 0, 13, 0, 0, 0, 1, 0, 0, 0, 18, 0, 0, 0, 1, 0, 0, 0, 19, 0, 0, 0, 4, 0, 0, 0, 16, 0, 0, 0, 4, 0, 0, 0, 17, 0, 0, 0, 1, 0, 0, 0, 22, 0, 0, 0, 1, 0, 0, 0, 23, 0, 0, 0, 4, 0, 0, 0, 20, 0, 0, 0, 4, 0, 0, 0, 21, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 255, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 15, 0, 0, 0, 2, 0, 0, 0, 10, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 255, 0, 0, 0, 12, 0, 0, 0, 4, 0, 0, 0, 7, 0, 0, 0, 255, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 13, 0, 0, 0, 255, 0, 0, 0, 8, 0, 0, 0, 1, 0, 0, 0, 19, 0, 0, 0, 2, 0, 0, 0, 18, 0, 0, 0, 4, 0, 0, 0, 17, 0, 0, 0, 255, 0, 0, 0, 16, 0, 0, 0, 1, 0, 0, 0, 23, 0, 0, 0, 2, 0, 0, 0, 22, 0, 0, 0, 4, 0, 0, 0, 21, 0, 0, 0, 255, 0, 0, 0, 20, 0, 0, 0, 3, 0, 0, 0, 15, 0, 0, 0, 1, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 4, 0, 0, 0, 12, 0, 0, 0, 3, 0, 0, 0, 19, 0, 0, 0, 1, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 4, 0, 0, 0, 16, 0, 0, 0, 3, 0, 0, 0, 23, 0, 0, 0, 1, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 0, 21, 0, 0, 0, 4, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 4, 0, 0, 0, 10, 0, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 4, 0, 0, 0, 11, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 4, 0, 0, 0, 12, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 4, 0, 0, 0, 12, 0, 0, 0, 4, 0, 0, 0, 11, 0, 0, 0, 4, 0, 0, 0, 14, 0, 0, 0, 1, 0, 0, 0, 10, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 10, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 10, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 10, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 1, 0, 0, 0, 15, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 1, 0, 0, 0, 15, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 4, 0, 0, 0, 12, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 4, 0, 0, 0, 7, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 4, 0, 0, 0, 7, 0, 0, 0, 4, 0, 0, 0, 12, 0, 0, 0, 4, 0, 0, 0, 13, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 255, 0, 0, 0, 4, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 255, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 10, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 10, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 15, 0, 0, 0, 2, 0, 0, 0, 10, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 15, 0, 0, 0, 2, 0, 0, 0, 10, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 255, 0, 0, 0, 12, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 255, 0, 0, 0, 12, 0, 0, 0, 255, 0, 0, 0, 2, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 2, 0, 0, 0, 255, 0, 0, 0, 8, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 7, 0, 0, 0, 255, 0, 0, 0, 2, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 7, 0, 0, 0, 255, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 13, 0, 0, 0, 255, 0, 0, 0, 8, 0, 0, 0, 3, 0, 0, 0, 15, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 15, 0, 0, 0, 1, 0, 0, 0, 10, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 15, 0, 0, 0, 1, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 6, 0, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 4, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 14, 0, 0, 0, 15, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 148, 30, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 102, 32, 38, 16, 6, 8, 101, 24, 101, 24, 67, 16, 67, 16, 67, 16, 67, 16, 67, 16, 67, 16, 67, 16, 67, 16, 34, 8, 34, 8, 34, 8, 34, 8, 34, 8, 34, 8, 34, 8, 34, 8, 34, 8, 34, 8, 34, 8, 34, 8, 34, 8, 34, 8, 34, 8, 34, 8, 0, 0, 0, 0, 0, 0, 0, 0, 106, 64, 74, 48, 42, 40, 10, 32, 105, 56, 105, 56, 73, 40, 73, 40, 41, 32, 41, 32, 9, 24, 9, 24, 104, 48, 104, 48, 104, 48, 104, 48, 72, 32, 72, 32, 72, 32, 72, 32, 40, 24, 40, 24, 40, 24, 40, 24, 8, 16, 8, 16, 8, 16, 8, 16, 103, 40, 103, 40, 103, 40, 103, 40, 103, 40, 103, 40, 103, 40, 103, 40, 71, 24, 71, 24, 71, 24, 71, 24, 71, 24, 71, 24, 71, 24, 71, 24, 110, 96, 78, 88, 46, 80, 14, 80, 110, 88, 78, 80, 46, 72, 14, 72, 13, 64, 13, 64, 77, 72, 77, 72, 45, 64, 45, 64, 13, 56, 13, 56, 109, 80, 109, 80, 77, 64, 77, 64, 45, 56, 45, 56, 13, 48, 13, 48, 107, 72, 107, 72, 107, 72, 107, 72, 107, 72, 107, 72, 107, 72, 107, 72, 75, 56, 75, 56, 75, 56, 75, 56, 75, 56, 75, 56, 75, 56, 75, 56, 43, 48, 43, 48, 43, 48, 43, 48, 43, 48, 43, 48, 43, 48, 43, 48, 11, 40, 11, 40, 11, 40, 11, 40, 11, 40, 11, 40, 11, 40, 11, 40, 0, 0, 0, 0, 47, 104, 47, 104, 16, 128, 80, 128, 48, 128, 16, 120, 112, 128, 80, 120, 48, 120, 16, 112, 112, 120, 80, 112, 48, 112, 16, 104, 111, 112, 111, 112, 79, 104, 79, 104, 47, 96, 47, 96, 15, 96, 15, 96, 111, 104, 111, 104, 79, 96, 79, 96, 47, 88, 47, 88, 15, 88, 15, 88, 0, 0, 0, 0, 0, 0, 0, 0, 102, 56, 70, 32, 38, 32, 6, 16, 102, 48, 70, 24, 38, 24, 6, 8, 101, 40, 101, 40, 37, 16, 37, 16, 100, 32, 100, 32, 100, 32, 100, 32, 100, 24, 100, 24, 100, 24, 100, 24, 67, 16, 67, 16, 67, 16, 67, 16, 67, 16, 67, 16, 67, 16, 67, 16, 0, 0, 0, 0, 0, 0, 0, 0, 105, 72, 73, 56, 41, 56, 9, 48, 8, 40, 8, 40, 72, 48, 72, 48, 40, 48, 40, 48, 8, 32, 8, 32, 103, 64, 103, 64, 103, 64, 103, 64, 71, 40, 71, 40, 71, 40, 71, 40, 39, 40, 39, 40, 39, 40, 39, 40, 7, 24, 7, 24, 7, 24, 7, 24, 0, 0, 0, 0, 109, 120, 109, 120, 110, 128, 78, 128, 46, 128, 14, 128, 46, 120, 14, 120, 78, 120, 46, 112, 77, 112, 77, 112, 13, 112, 13, 112, 109, 112, 109, 112, 77, 104, 77, 104, 45, 104, 45, 104, 13, 104, 13, 104, 109, 104, 109, 104, 77, 96, 77, 96, 45, 96, 45, 96, 13, 96, 13, 96, 12, 88, 12, 88, 12, 88, 12, 88, 76, 88, 76, 88, 76, 88, 76, 88, 44, 88, 44, 88, 44, 88, 44, 88, 12, 80, 12, 80, 12, 80, 12, 80, 108, 96, 108, 96, 108, 96, 108, 96, 76, 80, 76, 80, 76, 80, 76, 80, 44, 80, 44, 80, 44, 80, 44, 80, 12, 72, 12, 72, 12, 72, 12, 72, 107, 88, 107, 88, 107, 88, 107, 88, 107, 88, 107, 88, 107, 88, 107, 88, 75, 72, 75, 72, 75, 72, 75, 72, 75, 72, 75, 72, 75, 72, 75, 72, 43, 72, 43, 72, 43, 72, 43, 72, 43, 72, 43, 72, 43, 72, 43, 72, 11, 64, 11, 64, 11, 64, 11, 64, 11, 64, 11, 64, 11, 64, 11, 64, 107, 80, 107, 80, 107, 80, 107, 80, 107, 80, 107, 80, 107, 80, 107, 80, 75, 64, 75, 64, 75, 64, 75, 64, 75, 64, 75, 64, 75, 64, 75, 64, 43, 64, 43, 64, 43, 64, 43, 64, 43, 64, 43, 64, 43, 64, 43, 64, 11, 56, 11, 56, 11, 56, 11, 56, 11, 56, 11, 56, 11, 56, 11, 56, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 24, 70, 56, 38, 56, 6, 16, 102, 72, 70, 48, 38, 48, 6, 8, 37, 40, 37, 40, 69, 40, 69, 40, 37, 32, 37, 32, 69, 32, 69, 32, 37, 24, 37, 24, 101, 64, 101, 64, 69, 24, 69, 24, 37, 16, 37, 16, 100, 56, 100, 56, 100, 56, 100, 56, 100, 48, 100, 48, 100, 48, 100, 48, 100, 40, 100, 40, 100, 40, 100, 40, 100, 32, 100, 32, 100, 32, 100, 32, 100, 24, 100, 24, 100, 24, 100, 24, 68, 16, 68, 16, 68, 16, 68, 16, 36, 8, 36, 8, 36, 8, 36, 8, 4, 0, 4, 0, 4, 0, 4, 0, 0, 0, 10, 128, 106, 128, 74, 128, 42, 128, 10, 120, 106, 120, 74, 120, 42, 120, 10, 112, 106, 112, 74, 112, 42, 112, 10, 104, 41, 104, 41, 104, 9, 96, 9, 96, 73, 104, 73, 104, 41, 96, 41, 96, 9, 88, 9, 88, 105, 104, 105, 104, 73, 96, 73, 96, 41, 88, 41, 88, 9, 80, 9, 80, 104, 96, 104, 96, 104, 96, 104, 96, 72, 88, 72, 88, 72, 88, 72, 88, 40, 80, 40, 80, 40, 80, 40, 80, 8, 72, 8, 72, 8, 72, 8, 72, 104, 88, 104, 88, 104, 88, 104, 88, 72, 80, 72, 80, 72, 80, 72, 80, 40, 72, 40, 72, 40, 72, 40, 72, 8, 64, 8, 64, 8, 64, 8, 64, 7, 56, 7, 56, 7, 56, 7, 56, 7, 56, 7, 56, 7, 56, 7, 56, 7, 48, 7, 48, 7, 48, 7, 48, 7, 48, 7, 48, 7, 48, 7, 48, 71, 72, 71, 72, 71, 72, 71, 72, 71, 72, 71, 72, 71, 72, 71, 72, 7, 40, 7, 40, 7, 40, 7, 40, 7, 40, 7, 40, 7, 40, 7, 40, 103, 80, 103, 80, 103, 80, 103, 80, 103, 80, 103, 80, 103, 80, 103, 80, 71, 64, 71, 64, 71, 64, 71, 64, 71, 64, 71, 64, 71, 64, 71, 64, 39, 64, 39, 64, 39, 64, 39, 64, 39, 64, 39, 64, 39, 64, 39, 64, 7, 32, 7, 32, 7, 32, 7, 32, 7, 32, 7, 32, 7, 32, 7, 32, 6, 8, 38, 8, 0, 0, 6, 0, 6, 16, 38, 16, 70, 16, 0, 0, 6, 24, 38, 24, 70, 24, 102, 24, 6, 32, 38, 32, 70, 32, 102, 32, 6, 40, 38, 40, 70, 40, 102, 40, 6, 48, 38, 48, 70, 48, 102, 48, 6, 56, 38, 56, 70, 56, 102, 56, 6, 64, 38, 64, 70, 64, 102, 64, 6, 72, 38, 72, 70, 72, 102, 72, 6, 80, 38, 80, 70, 80, 102, 80, 6, 88, 38, 88, 70, 88, 102, 88, 6, 96, 38, 96, 70, 96, 102, 96, 6, 104, 38, 104, 70, 104, 102, 104, 6, 112, 38, 112, 70, 112, 102, 112, 6, 120, 38, 120, 70, 120, 102, 120, 6, 128, 38, 128, 70, 128, 102, 128, 0, 0, 67, 16, 2, 0, 2, 0, 33, 8, 33, 8, 33, 8, 33, 8, 103, 32, 103, 32, 72, 32, 40, 32, 71, 24, 71, 24, 39, 24, 39, 24, 6, 32, 6, 32, 6, 32, 6, 32, 6, 24, 6, 24, 6, 24, 6, 24, 6, 16, 6, 16, 6, 16, 6, 16, 102, 24, 102, 24, 102, 24, 102, 24, 38, 16, 38, 16, 38, 16, 38, 16, 6, 8, 6, 8, 6, 8, 6, 8, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 0, 16, 1, 2, 4, 8, 32, 3, 5, 10, 12, 15, 47, 7, 11, 13, 14, 6, 9, 31, 35, 37, 42, 44, 33, 34, 36, 40, 39, 43, 45, 46, 17, 18, 20, 24, 19, 21, 26, 28, 23, 27, 29, 30, 22, 25, 38, 41, 47, 31, 15, 0, 23, 27, 29, 30, 7, 11, 13, 14, 39, 43, 45, 46, 16, 3, 5, 10, 12, 19, 21, 26, 28, 35, 37, 42, 44, 1, 2, 4, 8, 17, 18, 20, 24, 6, 9, 22, 25, 32, 33, 34, 36, 40, 38, 41, 0, 0, 101, 85, 68, 68, 52, 52, 35, 35, 35, 35, 19, 19, 19, 19, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 249, 233, 217, 200, 200, 184, 184, 167, 167, 167, 167, 151, 151, 151, 151, 134, 134, 134, 134, 134, 134, 134, 134, 118, 118, 118, 118, 118, 118, 118, 118, 230, 214, 198, 182, 165, 165, 149, 149, 132, 132, 132, 132, 116, 116, 116, 116, 100, 100, 100, 100, 84, 84, 84, 84, 67, 67, 67, 67, 67, 67, 67, 67, 51, 51, 51, 51, 51, 51, 51, 51, 35, 35, 35, 35, 35, 35, 35, 35, 19, 19, 19, 19, 19, 19, 19, 19, 3, 3, 3, 3, 3, 3, 3, 3, 214, 182, 197, 197, 165, 165, 149, 149, 132, 132, 132, 132, 84, 84, 84, 84, 68, 68, 68, 68, 4, 4, 4, 4, 115, 115, 115, 115, 115, 115, 115, 115, 99, 99, 99, 99, 99, 99, 99, 99, 51, 51, 51, 51, 51, 51, 51, 51, 35, 35, 35, 35, 35, 35, 35, 35, 19, 19, 19, 19, 19, 19, 19, 19, 197, 181, 165, 5, 148, 148, 116, 116, 52, 52, 36, 36, 131, 131, 131, 131, 99, 99, 99, 99, 83, 83, 83, 83, 67, 67, 67, 67, 19, 19, 19, 19, 181, 149, 164, 164, 132, 132, 36, 36, 20, 20, 4, 4, 115, 115, 115, 115, 99, 99, 99, 99, 83, 83, 83, 83, 67, 67, 67, 67, 51, 51, 51, 51, 166, 6, 21, 21, 132, 132, 132, 132, 147, 147, 147, 147, 147, 147, 147, 147, 115, 115, 115, 115, 115, 115, 115, 115, 99, 99, 99, 99, 99, 99, 99, 99, 83, 83, 83, 83, 83, 83, 83, 83, 67, 67, 67, 67, 67, 67, 67, 67, 51, 51, 51, 51, 51, 51, 51, 51, 35, 35, 35, 35, 35, 35, 35, 35, 150, 6, 21, 21, 116, 116, 116, 116, 131, 131, 131, 131, 131, 131, 131, 131, 99, 99, 99, 99, 99, 99, 99, 99, 67, 67, 67, 67, 67, 67, 67, 67, 51, 51, 51, 51, 51, 51, 51, 51, 35, 35, 35, 35, 35, 35, 35, 35, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 134, 6, 37, 37, 20, 20, 20, 20, 115, 115, 115, 115, 115, 115, 115, 115, 99, 99, 99, 99, 99, 99, 99, 99, 51, 51, 51, 51, 51, 51, 51, 51, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 82, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 22, 6, 117, 117, 36, 36, 36, 36, 83, 83, 83, 83, 83, 83, 83, 83, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 98, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 66, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 21, 5, 100, 100, 35, 35, 35, 35, 82, 82, 82, 82, 82, 82, 82, 82, 66, 66, 66, 66, 66, 66, 66, 66, 50, 50, 50, 50, 50, 50, 50, 50, 4, 20, 35, 35, 51, 51, 83, 83, 65, 65, 65, 65, 65, 65, 65, 65, 4, 20, 67, 67, 34, 34, 34, 34, 49, 49, 49, 49, 49, 49, 49, 49, 3, 19, 50, 50, 33, 33, 33, 33, 2, 18, 33, 33, 17, 1, 34, 18, 1, 1, 50, 34, 18, 2, 67, 51, 34, 34, 18, 18, 2, 2, 83, 67, 51, 35, 18, 18, 2, 2, 19, 35, 67, 51, 99, 83, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 5, 6, 7, 8, 9, 10, 12, 13, 15, 17, 20, 22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 71, 80, 90, 101, 113, 127, 144, 162, 182, 203, 226, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 3, 1, 2, 3, 2, 2, 3, 2, 2, 4, 2, 3, 4, 2, 3, 4, 3, 3, 5, 3, 4, 6, 3, 4, 6, 4, 5, 7, 4, 5, 8, 4, 6, 9, 5, 7, 10, 6, 8, 11, 6, 8, 13, 7, 10, 14, 8, 11, 16, 9, 12, 18, 10, 13, 20, 11, 15, 23, 13, 17, 25, 68, 69, 67, 79, 68, 69, 82, 32, 73, 78, 73, 84, 73, 65, 76, 73, 90, 65, 84, 73, 79, 78, 32, 70, 65, 73, 76, 69, 68, 0 ], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) {
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
 HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
 HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
}
function copyTempDouble(ptr) {
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
 HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
 HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
 HEAP8[tempDoublePtr + 4] = HEAP8[ptr + 4];
 HEAP8[tempDoublePtr + 5] = HEAP8[ptr + 5];
 HEAP8[tempDoublePtr + 6] = HEAP8[ptr + 6];
 HEAP8[tempDoublePtr + 7] = HEAP8[ptr + 7];
}
function ___setErrNo(value) {
 if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
 return value;
}
var ERRNO_CODES = {
 EPERM: 1,
 ENOENT: 2,
 ESRCH: 3,
 EINTR: 4,
 EIO: 5,
 ENXIO: 6,
 E2BIG: 7,
 ENOEXEC: 8,
 EBADF: 9,
 ECHILD: 10,
 EAGAIN: 11,
 EWOULDBLOCK: 11,
 ENOMEM: 12,
 EACCES: 13,
 EFAULT: 14,
 ENOTBLK: 15,
 EBUSY: 16,
 EEXIST: 17,
 EXDEV: 18,
 ENODEV: 19,
 ENOTDIR: 20,
 EISDIR: 21,
 EINVAL: 22,
 ENFILE: 23,
 EMFILE: 24,
 ENOTTY: 25,
 ETXTBSY: 26,
 EFBIG: 27,
 ENOSPC: 28,
 ESPIPE: 29,
 EROFS: 30,
 EMLINK: 31,
 EPIPE: 32,
 EDOM: 33,
 ERANGE: 34,
 ENOMSG: 42,
 EIDRM: 43,
 ECHRNG: 44,
 EL2NSYNC: 45,
 EL3HLT: 46,
 EL3RST: 47,
 ELNRNG: 48,
 EUNATCH: 49,
 ENOCSI: 50,
 EL2HLT: 51,
 EDEADLK: 35,
 ENOLCK: 37,
 EBADE: 52,
 EBADR: 53,
 EXFULL: 54,
 ENOANO: 55,
 EBADRQC: 56,
 EBADSLT: 57,
 EDEADLOCK: 35,
 EBFONT: 59,
 ENOSTR: 60,
 ENODATA: 61,
 ETIME: 62,
 ENOSR: 63,
 ENONET: 64,
 ENOPKG: 65,
 EREMOTE: 66,
 ENOLINK: 67,
 EADV: 68,
 ESRMNT: 69,
 ECOMM: 70,
 EPROTO: 71,
 EMULTIHOP: 72,
 EDOTDOT: 73,
 EBADMSG: 74,
 ENOTUNIQ: 76,
 EBADFD: 77,
 EREMCHG: 78,
 ELIBACC: 79,
 ELIBBAD: 80,
 ELIBSCN: 81,
 ELIBMAX: 82,
 ELIBEXEC: 83,
 ENOSYS: 38,
 ENOTEMPTY: 39,
 ENAMETOOLONG: 36,
 ELOOP: 40,
 EOPNOTSUPP: 95,
 EPFNOSUPPORT: 96,
 ECONNRESET: 104,
 ENOBUFS: 105,
 EAFNOSUPPORT: 97,
 EPROTOTYPE: 91,
 ENOTSOCK: 88,
 ENOPROTOOPT: 92,
 ESHUTDOWN: 108,
 ECONNREFUSED: 111,
 EADDRINUSE: 98,
 ECONNABORTED: 103,
 ENETUNREACH: 101,
 ENETDOWN: 100,
 ETIMEDOUT: 110,
 EHOSTDOWN: 112,
 EHOSTUNREACH: 113,
 EINPROGRESS: 115,
 EALREADY: 114,
 EDESTADDRREQ: 89,
 EMSGSIZE: 90,
 EPROTONOSUPPORT: 93,
 ESOCKTNOSUPPORT: 94,
 EADDRNOTAVAIL: 99,
 ENETRESET: 102,
 EISCONN: 106,
 ENOTCONN: 107,
 ETOOMANYREFS: 109,
 EUSERS: 87,
 EDQUOT: 122,
 ESTALE: 116,
 ENOTSUP: 95,
 ENOMEDIUM: 123,
 EILSEQ: 84,
 EOVERFLOW: 75,
 ECANCELED: 125,
 ENOTRECOVERABLE: 131,
 EOWNERDEAD: 130,
 ESTRPIPE: 86
};
function _sysconf(name) {
 switch (name) {
 case 30:
  return PAGE_SIZE;
 case 85:
  return totalMemory / PAGE_SIZE;
 case 132:
 case 133:
 case 12:
 case 137:
 case 138:
 case 15:
 case 235:
 case 16:
 case 17:
 case 18:
 case 19:
 case 20:
 case 149:
 case 13:
 case 10:
 case 236:
 case 153:
 case 9:
 case 21:
 case 22:
 case 159:
 case 154:
 case 14:
 case 77:
 case 78:
 case 139:
 case 80:
 case 81:
 case 82:
 case 68:
 case 67:
 case 164:
 case 11:
 case 29:
 case 47:
 case 48:
 case 95:
 case 52:
 case 51:
 case 46:
  return 200809;
 case 79:
  return 0;
 case 27:
 case 246:
 case 127:
 case 128:
 case 23:
 case 24:
 case 160:
 case 161:
 case 181:
 case 182:
 case 242:
 case 183:
 case 184:
 case 243:
 case 244:
 case 245:
 case 165:
 case 178:
 case 179:
 case 49:
 case 50:
 case 168:
 case 169:
 case 175:
 case 170:
 case 171:
 case 172:
 case 97:
 case 76:
 case 32:
 case 173:
 case 35:
  return -1;
 case 176:
 case 177:
 case 7:
 case 155:
 case 8:
 case 157:
 case 125:
 case 126:
 case 92:
 case 93:
 case 129:
 case 130:
 case 131:
 case 94:
 case 91:
  return 1;
 case 74:
 case 60:
 case 69:
 case 70:
 case 4:
  return 1024;
 case 31:
 case 42:
 case 72:
  return 32;
 case 87:
 case 26:
 case 33:
  return 2147483647;
 case 34:
 case 1:
  return 47839;
 case 38:
 case 36:
  return 99;
 case 43:
 case 37:
  return 2048;
 case 0:
  return 2097152;
 case 3:
  return 65536;
 case 28:
  return 32768;
 case 44:
  return 32767;
 case 75:
  return 16384;
 case 39:
  return 1e3;
 case 89:
  return 700;
 case 71:
  return 256;
 case 40:
  return 255;
 case 2:
  return 100;
 case 180:
  return 64;
 case 25:
  return 20;
 case 5:
  return 16;
 case 6:
  return 6;
 case 73:
  return 4;
 case 84:
  {
   if (typeof navigator === "object") return navigator["hardwareConcurrency"] || 1;
   return 1;
  }
 }
 ___setErrNo(ERRNO_CODES.EINVAL);
 return -1;
}
Module["_memset"] = _memset;
function _pthread_cleanup_push(routine, arg) {
 __ATEXIT__.push((function() {
  Runtime.dynCall("vi", routine, [ arg ]);
 }));
 _pthread_cleanup_push.level = __ATEXIT__.length;
}
function _broadwayOnPictureDecoded($buffer, width, height) {
 par_broadwayOnPictureDecoded($buffer, width, height);
}
Module["_broadwayOnPictureDecoded"] = _broadwayOnPictureDecoded;
function _pthread_cleanup_pop() {
 assert(_pthread_cleanup_push.level == __ATEXIT__.length, "cannot pop if something else added meanwhile!");
 __ATEXIT__.pop();
 _pthread_cleanup_push.level = __ATEXIT__.length;
}
function _abort() {
 Module["abort"]();
}
function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
 return dest;
}
Module["_memcpy"] = _memcpy;
var SYSCALLS = {
 varargs: 0,
 get: (function(varargs) {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
 }),
 getStr: (function() {
  var ret = Pointer_stringify(SYSCALLS.get());
  return ret;
 }),
 get64: (function() {
  var low = SYSCALLS.get(), high = SYSCALLS.get();
  if (low >= 0) assert(high === 0); else assert(high === -1);
  return low;
 }),
 getZero: (function() {
  assert(SYSCALLS.get() === 0);
 })
};
function ___syscall6(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD();
  FS.close(stream);
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function _sbrk(bytes) {
 var self = _sbrk;
 if (!self.called) {
  DYNAMICTOP = alignMemoryPage(DYNAMICTOP);
  self.called = true;
  assert(Runtime.dynamicAlloc);
  self.alloc = Runtime.dynamicAlloc;
  Runtime.dynamicAlloc = (function() {
   abort("cannot dynamically allocate, sbrk now has control");
  });
 }
 var ret = DYNAMICTOP;
 if (bytes != 0) {
  var success = self.alloc(bytes);
  if (!success) return -1 >>> 0;
 }
 return ret;
}
function _broadwayOnHeadersDecoded() {
 par_broadwayOnHeadersDecoded();
}
Module["_broadwayOnHeadersDecoded"] = _broadwayOnHeadersDecoded;
function _time(ptr) {
 var ret = Date.now() / 1e3 | 0;
 if (ptr) {
  HEAP32[ptr >> 2] = ret;
 }
 return ret;
}
function _pthread_self() {
 return 0;
}
function ___syscall140(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
  var offset = offset_low;
  assert(offset_high === 0);
  FS.llseek(stream, offset, whence);
  HEAP32[result >> 2] = stream.position;
  if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function ___syscall146(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.get(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
  var ret = 0;
  if (!___syscall146.buffer) ___syscall146.buffer = [];
  var buffer = ___syscall146.buffer;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = HEAP32[iov + i * 8 >> 2];
   var len = HEAP32[iov + (i * 8 + 4) >> 2];
   for (var j = 0; j < len; j++) {
    var curr = HEAPU8[ptr + j];
    if (curr === 0 || curr === 10) {
     Module["print"](UTF8ArrayToString(buffer, 0));
     buffer.length = 0;
    } else {
     buffer.push(curr);
    }
   }
   ret += len;
  }
  return ret;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function ___syscall54(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true;
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");
function invoke_ii(index, a1) {
 try {
  return Module["dynCall_ii"](index, a1);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iiii(index, a1, a2, a3) {
 try {
  return Module["dynCall_iiii"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiiii(index, a1, a2, a3, a4, a5) {
 try {
  Module["dynCall_viiiii"](index, a1, a2, a3, a4, a5);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vi(index, a1) {
 try {
  Module["dynCall_vi"](index, a1);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
Module.asmGlobalArg = {
 "Math": Math,
 "Int8Array": Int8Array,
 "Int16Array": Int16Array,
 "Int32Array": Int32Array,
 "Uint8Array": Uint8Array,
 "Uint16Array": Uint16Array,
 "Uint32Array": Uint32Array,
 "Float32Array": Float32Array,
 "Float64Array": Float64Array,
 "NaN": NaN,
 "Infinity": Infinity
};
Module.asmLibraryArg = {
 "abort": abort,
 "assert": assert,
 "invoke_ii": invoke_ii,
 "invoke_iiii": invoke_iiii,
 "invoke_viiiii": invoke_viiiii,
 "invoke_vi": invoke_vi,
 "_broadwayOnPictureDecoded": _broadwayOnPictureDecoded,
 "_pthread_cleanup_pop": _pthread_cleanup_pop,
 "_pthread_self": _pthread_self,
 "___syscall6": ___syscall6,
 "___setErrNo": ___setErrNo,
 "_abort": _abort,
 "_sbrk": _sbrk,
 "_time": _time,
 "_pthread_cleanup_push": _pthread_cleanup_push,
 "_emscripten_memcpy_big": _emscripten_memcpy_big,
 "___syscall54": ___syscall54,
 "_broadwayOnHeadersDecoded": _broadwayOnHeadersDecoded,
 "___syscall140": ___syscall140,
 "_sysconf": _sysconf,
 "___syscall146": ___syscall146,
 "STACKTOP": STACKTOP,
 "STACK_MAX": STACK_MAX,
 "tempDoublePtr": tempDoublePtr,
 "ABORT": ABORT
};
// EMSCRIPTEN_START_ASM

var asm = (function(global,env,buffer) {
"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=0;var n=0;var o=0;var p=0;var q=global.NaN,r=global.Infinity;var s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0.0;var B=0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=global.Math.floor;var M=global.Math.abs;var N=global.Math.sqrt;var O=global.Math.pow;var P=global.Math.cos;var Q=global.Math.sin;var R=global.Math.tan;var S=global.Math.acos;var T=global.Math.asin;var U=global.Math.atan;var V=global.Math.atan2;var W=global.Math.exp;var X=global.Math.log;var Y=global.Math.ceil;var Z=global.Math.imul;var _=global.Math.min;var $=global.Math.clz32;var aa=env.abort;var ba=env.assert;var ca=env.invoke_ii;var da=env.invoke_iiii;var ea=env.invoke_viiiii;var fa=env.invoke_vi;var ga=env._broadwayOnPictureDecoded;var ha=env._pthread_cleanup_pop;var ia=env._pthread_self;var ja=env.___syscall6;var ka=env.___setErrNo;var la=env._abort;var ma=env._sbrk;var na=env._time;var oa=env._pthread_cleanup_push;var pa=env._emscripten_memcpy_big;var qa=env.___syscall54;var ra=env._broadwayOnHeadersDecoded;var sa=env.___syscall140;var ta=env._sysconf;var ua=env.___syscall146;var va=0.0;
// EMSCRIPTEN_START_FUNCS
function ib(e, f, g, h, j) {
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 j = j | 0;
 var k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, U = 0, V = 0, W = 0, X = 0, Y = 0, _ = 0, $ = 0, aa = 0, ba = 0, ca = 0, da = 0, ea = 0, fa = 0, ga = 0, ha = 0, ia = 0, ja = 0, ka = 0, la = 0, ma = 0, na = 0, oa = 0, pa = 0, qa = 0, ra = 0, sa = 0, ta = 0, ua = 0, va = 0, wa = 0, xa = 0, ya = 0, za = 0, Aa = 0, Ba = 0, Ca = 0, Da = 0, Ea = 0, Fa = 0, Ga = 0, Ha = 0, Ia = 0, Ja = 0, Pa = 0, Qa = 0, Ra = 0, Sa = 0, Ta = 0, Ua = 0, Va = 0, Wa = 0, Xa = 0, Ya = 0, $a = 0, gb = 0, ib = 0, jb = 0, kb = 0, lb = 0, mb = 0, nb = 0, ob = 0, pb = 0, qb = 0, rb = 0;
 rb = i;
 i = i + 816 | 0;
 if ((c[e + 3344 >> 2] | 0) != 0 ? (c[e + 3348 >> 2] | 0) == (f | 0) : 0) {
  c[rb >> 2] = c[e + 3356 >> 2];
  c[rb + 4 >> 2] = c[e + 3356 + 4 >> 2];
  c[rb + 8 >> 2] = c[e + 3356 + 8 >> 2];
  c[rb + 12 >> 2] = c[e + 3356 + 12 >> 2];
  c[rb + 4 >> 2] = c[rb >> 2];
  c[rb + 8 >> 2] = 0;
  c[rb + 16 >> 2] = 0;
  c[j >> 2] = c[e + 3352 >> 2];
  A = rb + 8 | 0;
  t = rb + 4 | 0;
  u = rb + 16 | 0;
  m = 0;
 } else {
  do if (((g >>> 0 > 3 ? (a[f >> 0] | 0) == 0 : 0) ? (a[f + 1 >> 0] | 0) == 0 : 0) ? (n = a[f + 2 >> 0] | 0, (n & 255) < 2) : 0) {
   s = -3;
   r = 3;
   q = f + 3 | 0;
   o = 2;
   while (1) {
    if (n << 24 >> 24) if (n << 24 >> 24 == 1 & o >>> 0 > 1) {
     t = r;
     u = 0;
     v = 0;
     x = q;
     y = 0;
     break;
    } else o = 0; else o = o + 1 | 0;
    p = r + 1 | 0;
    if ((p | 0) == (g | 0)) {
     Xa = 9;
     break;
    }
    s = ~r;
    n = a[q >> 0] | 0;
    r = p;
    q = q + 1 | 0;
   }
   if ((Xa | 0) == 9) {
    c[j >> 2] = g;
    e = 3;
    i = rb;
    return e | 0;
   }
   while (1) {
    n = a[x >> 0] | 0;
    o = t + 1 | 0;
    p = (n << 24 >> 24 != 0 ^ 1) + y | 0;
    u = n << 24 >> 24 == 3 & (p | 0) == 2 ? 1 : u;
    if (n << 24 >> 24 == 1 & p >>> 0 > 1) {
     Xa = 16;
     break;
    }
    y = n << 24 >> 24 != 0 ? 0 : p;
    w = n << 24 >> 24 != 0 & p >>> 0 > 2 ? 1 : v;
    if ((o | 0) == (g | 0)) {
     Xa = 18;
     break;
    } else {
     t = o;
     v = w;
     x = x + 1 | 0;
    }
   }
   if ((Xa | 0) == 16) {
    z = t + s - p | 0;
    c[rb + 12 >> 2] = z;
    E = rb + 12 | 0;
    A = u;
    B = r;
    C = v;
    D = p - (p >>> 0 < 3 ? p : 3) | 0;
    break;
   } else if ((Xa | 0) == 18) {
    z = s + g - y | 0;
    c[rb + 12 >> 2] = z;
    E = rb + 12 | 0;
    A = u;
    B = r;
    C = w;
    D = y;
    break;
   }
  } else Xa = 19; while (0);
  if ((Xa | 0) == 19) {
   c[rb + 12 >> 2] = g;
   E = rb + 12 | 0;
   z = g;
   A = 1;
   B = 0;
   C = 0;
   D = 0;
  }
  n = f + B | 0;
  c[rb >> 2] = n;
  c[rb + 4 >> 2] = n;
  c[rb + 8 >> 2] = 0;
  c[rb + 16 >> 2] = 0;
  c[j >> 2] = B + z + D;
  if (C) {
   e = 3;
   i = rb;
   return e | 0;
  }
  do if (A) {
   p = c[E >> 2] | 0;
   q = n;
   r = n;
   n = 0;
   a : while (1) {
    while (1) {
     Sa = p;
     p = p + -1 | 0;
     if (!Sa) {
      Xa = 31;
      break a;
     }
     o = a[q >> 0] | 0;
     if ((n | 0) != 2) {
      F = n;
      break;
     }
     if (o << 24 >> 24 != 3) {
      Xa = 29;
      break;
     }
     if (!p) {
      la = 3;
      Xa = 1499;
      break a;
     }
     n = q + 1 | 0;
     if ((d[n >> 0] | 0) > 3) {
      la = 3;
      Xa = 1499;
      break a;
     } else {
      q = n;
      n = 0;
     }
    }
    if ((Xa | 0) == 29) {
     Xa = 0;
     if ((o & 255) < 3) {
      la = 3;
      Xa = 1499;
      break;
     } else F = 2;
    }
    a[r >> 0] = o;
    q = q + 1 | 0;
    r = r + 1 | 0;
    n = o << 24 >> 24 == 0 ? F + 1 | 0 : 0;
   }
   if ((Xa | 0) == 31) {
    c[E >> 2] = r - q + (c[E >> 2] | 0);
    m = c[rb + 16 >> 2] | 0;
    break;
   } else if ((Xa | 0) == 1499) {
    i = rb;
    return la | 0;
   }
  } else m = 0; while (0);
  c[e + 3356 >> 2] = c[rb >> 2];
  c[e + 3356 + 4 >> 2] = c[rb + 4 >> 2];
  c[e + 3356 + 8 >> 2] = c[rb + 8 >> 2];
  c[e + 3356 + 12 >> 2] = c[rb + 12 >> 2];
  c[e + 3356 + 16 >> 2] = c[rb + 16 >> 2];
  c[e + 3352 >> 2] = c[j >> 2];
  c[e + 3348 >> 2] = f;
  A = rb + 8 | 0;
  t = rb + 4 | 0;
  u = rb + 16 | 0;
 }
 c[e + 3344 >> 2] = 0;
 Sa = c[rb + 12 >> 2] << 3;
 o = m + 1 | 0;
 c[u >> 2] = o;
 c[A >> 2] = o & 7;
 if (o >>> 0 > Sa >>> 0) {
  e = 3;
  i = rb;
  return e | 0;
 }
 s = c[rb >> 2] | 0;
 c[t >> 2] = s + (o >>> 3);
 q = c[rb + 12 >> 2] << 3;
 r = c[u >> 2] | 0;
 if ((q - r | 0) > 31) {
  m = c[A >> 2] | 0;
  n = d[s + (o >>> 3) + 1 >> 0] << 16 | d[s + (o >>> 3) >> 0] << 24 | d[s + (o >>> 3) + 2 >> 0] << 8 | d[s + (o >>> 3) + 3 >> 0];
  if (m) n = (d[s + (o >>> 3) + 4 >> 0] | 0) >>> (8 - m | 0) | n << m;
 } else if ((q - r | 0) > 0) {
  m = c[A >> 2] | 0;
  n = d[s + (o >>> 3) >> 0] << m + 24;
  if ((q - r + -8 + m | 0) > 0) {
   p = q - r + -8 + m | 0;
   o = s + (o >>> 3) | 0;
   m = m + 24 | 0;
   while (1) {
    o = o + 1 | 0;
    m = m + -8 | 0;
    n = d[o >> 0] << m | n;
    if ((p | 0) <= 8) break; else p = p + -8 | 0;
   }
  }
 } else n = 0;
 c[u >> 2] = r + 2;
 c[A >> 2] = r + 2 & 7;
 if ((r + 2 | 0) >>> 0 > q >>> 0) {
  m = 0;
  o = c[t >> 2] | 0;
 } else {
  c[t >> 2] = s + ((r + 2 | 0) >>> 3);
  m = 1;
  o = s + ((r + 2 | 0) >>> 3) | 0;
 }
 z = m ? n >>> 30 : -1;
 q = c[rb + 12 >> 2] << 3;
 r = c[u >> 2] | 0;
 if ((q - r | 0) > 31) {
  n = c[A >> 2] | 0;
  m = d[o + 1 >> 0] << 16 | d[o >> 0] << 24 | d[o + 2 >> 0] << 8 | d[o + 3 >> 0];
  if (n) m = (d[o + 4 >> 0] | 0) >>> (8 - n | 0) | m << n;
 } else if ((q - r | 0) > 0) {
  n = c[A >> 2] | 0;
  m = d[o >> 0] << n + 24;
  if ((q - r + -8 + n | 0) > 0) {
   p = q - r + -8 + n | 0;
   n = n + 24 | 0;
   while (1) {
    o = o + 1 | 0;
    n = n + -8 | 0;
    m = d[o >> 0] << n | m;
    if ((p | 0) <= 8) break; else p = p + -8 | 0;
   }
  }
 } else m = 0;
 c[u >> 2] = r + 5;
 c[A >> 2] = r + 5 & 7;
 if ((r + 5 | 0) >>> 0 > q >>> 0) {
  e = 0;
  i = rb;
  return e | 0;
 }
 c[t >> 2] = s + ((r + 5 | 0) >>> 3);
 y = m >>> 27;
 if ((y + -2 | 0) >>> 0 < 3) {
  e = 3;
  i = rb;
  return e | 0;
 }
 switch (y | 0) {
 case 5:
 case 7:
 case 8:
  {
   if ((z | 0) == 0 | (y | 0) == 6) {
    e = 3;
    i = rb;
    return e | 0;
   }
   break;
  }
 case 6:
 case 9:
 case 10:
 case 11:
 case 12:
  {
   if (z) {
    e = 3;
    i = rb;
    return e | 0;
   }
   break;
  }
 default:
  {}
 }
 if ((y + -1 | 0) >>> 0 > 11) {
  e = 0;
  i = rb;
  return e | 0;
 }
 b : do switch (y | 0) {
 case 6:
 case 7:
 case 8:
 case 9:
 case 10:
 case 11:
 case 13:
 case 14:
 case 15:
 case 16:
 case 17:
 case 18:
  {
   P = 1;
   Xa = 206;
   break;
  }
 case 5:
 case 1:
  {
   if (!(c[e + 1332 >> 2] | 0)) x = 0; else {
    c[e + 1332 >> 2] = 0;
    x = 1;
   };
   c[rb + 648 >> 2] = c[rb >> 2];
   c[rb + 648 + 4 >> 2] = c[rb + 4 >> 2];
   c[rb + 648 + 8 >> 2] = c[rb + 8 >> 2];
   c[rb + 648 + 12 >> 2] = c[rb + 12 >> 2];
   c[rb + 648 + 16 >> 2] = c[rb + 16 >> 2];
   m = Na(rb + 648 | 0, rb + 688 | 0) | 0;
   c : do if (!m) {
    m = Na(rb + 648 | 0, rb + 688 | 0) | 0;
    if (!m) {
     m = Na(rb + 648 | 0, rb + 688 | 0) | 0;
     if (!m) {
      m = c[rb + 688 >> 2] | 0;
      if (m >>> 0 > 255) {
       O = 1;
       Xa = 63;
      } else {
       u = c[e + 148 + (m << 2) >> 2] | 0;
       if (((u | 0) != 0 ? (G = c[u + 4 >> 2] | 0, M = c[e + 20 + (G << 2) >> 2] | 0, (M | 0) != 0) : 0) ? (Sa = c[e + 8 >> 2] | 0, (Sa | 0) == 32 | (G | 0) == (Sa | 0) | (y | 0) == 5) : 0) {
        m = c[e + 1304 >> 2] | 0;
        if ((m | 0) == (z | 0)) m = x; else m = (m | 0) == 0 | (z | 0) == 0 ? 1 : x;
        if ((c[e + 1300 >> 2] | 0) == 5) if ((y | 0) == 5) k = m; else Xa = 72; else if ((y | 0) == 5) Xa = 72; else k = m;
        if ((Xa | 0) == 72) k = 1;
        m = c[M + 12 >> 2] | 0;
        c[rb + 628 >> 2] = c[rb >> 2];
        c[rb + 628 + 4 >> 2] = c[rb + 4 >> 2];
        c[rb + 628 + 8 >> 2] = c[rb + 8 >> 2];
        c[rb + 628 + 12 >> 2] = c[rb + 12 >> 2];
        c[rb + 628 + 16 >> 2] = c[rb + 16 >> 2];
        d : do if (!(Na(rb + 628 | 0, rb + 688 | 0) | 0)) {
         if (Na(rb + 628 | 0, rb + 688 | 0) | 0) {
          Xa = 85;
          break;
         }
         if (!(Na(rb + 628 | 0, rb + 688 | 0) | 0)) t = 0; else {
          Xa = 85;
          break;
         }
         while (1) if (!(m >>> t)) break; else t = t + 1 | 0;
         q = t + -1 | 0;
         w = rb + 628 + 4 | 0;
         o = c[w >> 2] | 0;
         v = rb + 628 + 12 | 0;
         r = c[v >> 2] << 3;
         g = rb + 628 + 16 | 0;
         s = c[g >> 2] | 0;
         do if ((r - s | 0) > 31) {
          n = c[rb + 628 + 8 >> 2] | 0;
          m = d[o + 1 >> 0] << 16 | d[o >> 0] << 24 | d[o + 2 >> 0] << 8 | d[o + 3 >> 0];
          if (!n) {
           n = rb + 628 + 8 | 0;
           break;
          }
          m = (d[o + 4 >> 0] | 0) >>> (8 - n | 0) | m << n;
          n = rb + 628 + 8 | 0;
         } else {
          if ((r - s | 0) <= 0) {
           m = 0;
           n = rb + 628 + 8 | 0;
           break;
          }
          n = c[rb + 628 + 8 >> 2] | 0;
          m = d[o >> 0] << n + 24;
          if ((r - s + -8 + n | 0) > 0) {
           p = r - s + -8 + n | 0;
           n = n + 24 | 0;
          } else {
           n = rb + 628 + 8 | 0;
           break;
          }
          while (1) {
           o = o + 1 | 0;
           n = n + -8 | 0;
           m = d[o >> 0] << n | m;
           if ((p | 0) <= 8) {
            n = rb + 628 + 8 | 0;
            break;
           } else p = p + -8 | 0;
          }
         } while (0);
         c[g >> 2] = q + s;
         c[n >> 2] = q + s & 7;
         if ((q + s | 0) >>> 0 > r >>> 0) {
          Xa = 85;
          break;
         }
         c[w >> 2] = (c[rb + 628 >> 2] | 0) + ((q + s | 0) >>> 3);
         m = m >>> (33 - t | 0);
         if ((m | 0) == -1) {
          Xa = 85;
          break;
         }
         if ((c[e + 1308 >> 2] | 0) != (m | 0)) {
          c[e + 1308 >> 2] = m;
          k = 1;
         }
         e : do if ((y | 0) == 5) {
          m = c[M + 12 >> 2] | 0;
          c[rb + 628 >> 2] = c[rb >> 2];
          c[rb + 628 + 4 >> 2] = c[rb + 4 >> 2];
          c[rb + 628 + 8 >> 2] = c[rb + 8 >> 2];
          c[rb + 628 + 12 >> 2] = c[rb + 12 >> 2];
          c[rb + 628 + 16 >> 2] = c[rb + 16 >> 2];
          do if (!(Na(rb + 628 | 0, rb + 688 | 0) | 0)) {
           if (Na(rb + 628 | 0, rb + 688 | 0) | 0) break;
           if (!(Na(rb + 628 | 0, rb + 688 | 0) | 0)) t = 0; else break;
           while (1) if (!(m >>> t)) break; else t = t + 1 | 0;
           q = t + -1 | 0;
           o = c[w >> 2] | 0;
           r = c[v >> 2] << 3;
           s = c[g >> 2] | 0;
           do if ((r - s | 0) > 31) {
            n = c[rb + 628 + 8 >> 2] | 0;
            m = d[o + 1 >> 0] << 16 | d[o >> 0] << 24 | d[o + 2 >> 0] << 8 | d[o + 3 >> 0];
            if (!n) {
             n = rb + 628 + 8 | 0;
             break;
            }
            m = (d[o + 4 >> 0] | 0) >>> (8 - n | 0) | m << n;
            n = rb + 628 + 8 | 0;
           } else {
            if ((r - s | 0) <= 0) {
             m = 0;
             n = rb + 628 + 8 | 0;
             break;
            }
            n = c[rb + 628 + 8 >> 2] | 0;
            m = d[o >> 0] << n + 24;
            if ((r - s + -8 + n | 0) > 0) {
             p = r - s + -8 + n | 0;
             n = n + 24 | 0;
            } else {
             n = rb + 628 + 8 | 0;
             break;
            }
            while (1) {
             o = o + 1 | 0;
             n = n + -8 | 0;
             m = d[o >> 0] << n | m;
             if ((p | 0) <= 8) {
              n = rb + 628 + 8 | 0;
              break;
             } else p = p + -8 | 0;
            }
           } while (0);
           c[g >> 2] = q + s;
           c[n >> 2] = q + s & 7;
           if ((q + s | 0) >>> 0 > r >>> 0) break;
           c[w >> 2] = (c[rb + 628 >> 2] | 0) + ((q + s | 0) >>> 3);
           if ((m >>> (33 - t | 0) | 0) == -1) break;
           if (Na(rb + 628 | 0, rb + 196 | 0) | 0) break d;
           if ((c[e + 1300 >> 2] | 0) == 5) {
            Ra = c[e + 1312 >> 2] | 0;
            Sa = c[rb + 196 >> 2] | 0;
            m = e + 1312 | 0;
            n = (Ra | 0) == (Sa | 0) ? Ra : Sa;
            k = (Ra | 0) == (Sa | 0) ? k : 1;
           } else {
            m = e + 1312 | 0;
            n = c[rb + 196 >> 2] | 0;
           }
           c[m >> 2] = n;
           break e;
          } while (0);
          break d;
         } while (0);
         f : do switch (c[M + 16 >> 2] | 0) {
         case 0:
          {
           c[rb + 628 >> 2] = c[rb >> 2];
           c[rb + 628 + 4 >> 2] = c[rb + 4 >> 2];
           c[rb + 628 + 8 >> 2] = c[rb + 8 >> 2];
           c[rb + 628 + 12 >> 2] = c[rb + 12 >> 2];
           c[rb + 628 + 16 >> 2] = c[rb + 16 >> 2];
           do if (!(Na(rb + 628 | 0, rb + 688 | 0) | 0)) {
            if (Na(rb + 628 | 0, rb + 688 | 0) | 0) break;
            if (Na(rb + 628 | 0, rb + 688 | 0) | 0) break;
            m = c[M + 12 >> 2] | 0;
            t = 0;
            while (1) if (!(m >>> t)) break; else t = t + 1 | 0;
            q = t + -1 | 0;
            o = c[w >> 2] | 0;
            r = c[v >> 2] << 3;
            s = c[g >> 2] | 0;
            do if ((r - s | 0) > 31) {
             n = c[rb + 628 + 8 >> 2] | 0;
             m = d[o + 1 >> 0] << 16 | d[o >> 0] << 24 | d[o + 2 >> 0] << 8 | d[o + 3 >> 0];
             if (!n) {
              n = rb + 628 + 8 | 0;
              break;
             }
             m = (d[o + 4 >> 0] | 0) >>> (8 - n | 0) | m << n;
             n = rb + 628 + 8 | 0;
            } else {
             if ((r - s | 0) <= 0) {
              m = 0;
              n = rb + 628 + 8 | 0;
              break;
             }
             n = c[rb + 628 + 8 >> 2] | 0;
             m = d[o >> 0] << n + 24;
             if ((r - s + -8 + n | 0) > 0) {
              p = r - s + -8 + n | 0;
              n = n + 24 | 0;
             } else {
              n = rb + 628 + 8 | 0;
              break;
             }
             while (1) {
              o = o + 1 | 0;
              n = n + -8 | 0;
              m = d[o >> 0] << n | m;
              if ((p | 0) <= 8) {
               n = rb + 628 + 8 | 0;
               break;
              } else p = p + -8 | 0;
             }
            } while (0);
            c[g >> 2] = q + s;
            c[n >> 2] = q + s & 7;
            if ((q + s | 0) >>> 0 > r >>> 0) break;
            c[w >> 2] = (c[rb + 628 >> 2] | 0) + ((q + s | 0) >>> 3);
            if ((m >>> (33 - t | 0) | 0) == -1) break;
            if ((y | 0) == 5 ? (Na(rb + 628 | 0, rb + 688 | 0) | 0) != 0 : 0) break;
            m = c[M + 20 >> 2] | 0;
            t = 0;
            while (1) if (!(m >>> t)) break; else t = t + 1 | 0;
            q = t + -1 | 0;
            o = c[w >> 2] | 0;
            r = c[v >> 2] << 3;
            s = c[g >> 2] | 0;
            do if ((r - s | 0) > 31) {
             n = c[rb + 628 + 8 >> 2] | 0;
             m = d[o + 1 >> 0] << 16 | d[o >> 0] << 24 | d[o + 2 >> 0] << 8 | d[o + 3 >> 0];
             if (!n) {
              n = rb + 628 + 8 | 0;
              break;
             }
             m = (d[o + 4 >> 0] | 0) >>> (8 - n | 0) | m << n;
             n = rb + 628 + 8 | 0;
            } else {
             if ((r - s | 0) <= 0) {
              m = 0;
              n = rb + 628 + 8 | 0;
              break;
             }
             n = c[rb + 628 + 8 >> 2] | 0;
             m = d[o >> 0] << n + 24;
             if ((r - s + -8 + n | 0) > 0) {
              p = r - s + -8 + n | 0;
              n = n + 24 | 0;
             } else {
              n = rb + 628 + 8 | 0;
              break;
             }
             while (1) {
              o = o + 1 | 0;
              n = n + -8 | 0;
              m = d[o >> 0] << n | m;
              if ((p | 0) <= 8) {
               n = rb + 628 + 8 | 0;
               break;
              } else p = p + -8 | 0;
             }
            } while (0);
            c[g >> 2] = q + s;
            c[n >> 2] = q + s & 7;
            if ((q + s | 0) >>> 0 > r >>> 0) break;
            c[w >> 2] = (c[rb + 628 >> 2] | 0) + ((q + s | 0) >>> 3);
            m = m >>> (33 - t | 0);
            if ((m | 0) == -1) break;
            if ((c[e + 1316 >> 2] | 0) != (m | 0)) {
             c[e + 1316 >> 2] = m;
             k = 1;
            }
            if (!(c[u + 8 >> 2] | 0)) break f;
            c[rb + 628 >> 2] = c[rb >> 2];
            c[rb + 628 + 4 >> 2] = c[rb + 4 >> 2];
            c[rb + 628 + 8 >> 2] = c[rb + 8 >> 2];
            c[rb + 628 + 12 >> 2] = c[rb + 12 >> 2];
            c[rb + 628 + 16 >> 2] = c[rb + 16 >> 2];
            m = Na(rb + 628 | 0, rb + 648 | 0) | 0;
            do if (!m) {
             m = Na(rb + 628 | 0, rb + 648 | 0) | 0;
             if (m) {
              l = m;
              break;
             }
             m = Na(rb + 628 | 0, rb + 648 | 0) | 0;
             if (m) {
              l = m;
              break;
             }
             m = c[M + 12 >> 2] | 0;
             t = 0;
             while (1) if (!(m >>> t)) break; else t = t + 1 | 0;
             q = t + -1 | 0;
             o = c[w >> 2] | 0;
             r = c[v >> 2] << 3;
             s = c[g >> 2] | 0;
             do if ((r - s | 0) > 31) {
              n = c[rb + 628 + 8 >> 2] | 0;
              m = d[o + 1 >> 0] << 16 | d[o >> 0] << 24 | d[o + 2 >> 0] << 8 | d[o + 3 >> 0];
              if (!n) {
               n = rb + 628 + 8 | 0;
               break;
              }
              m = (d[o + 4 >> 0] | 0) >>> (8 - n | 0) | m << n;
              n = rb + 628 + 8 | 0;
             } else {
              if ((r - s | 0) <= 0) {
               m = 0;
               n = rb + 628 + 8 | 0;
               break;
              }
              n = c[rb + 628 + 8 >> 2] | 0;
              m = d[o >> 0] << n + 24;
              if ((r - s + -8 + n | 0) > 0) {
               p = r - s + -8 + n | 0;
               n = n + 24 | 0;
              } else {
               n = rb + 628 + 8 | 0;
               break;
              }
              while (1) {
               o = o + 1 | 0;
               n = n + -8 | 0;
               m = d[o >> 0] << n | m;
               if ((p | 0) <= 8) {
                n = rb + 628 + 8 | 0;
                break;
               } else p = p + -8 | 0;
              }
             } while (0);
             c[g >> 2] = q + s;
             c[n >> 2] = q + s & 7;
             if ((q + s | 0) >>> 0 > r >>> 0) {
              l = 1;
              break;
             }
             c[w >> 2] = (c[rb + 628 >> 2] | 0) + ((q + s | 0) >>> 3);
             if ((m >>> (33 - t | 0) | 0) == -1) {
              l = 1;
              break;
             }
             if ((y | 0) == 5 ? (L = Na(rb + 628 | 0, rb + 648 | 0) | 0, (L | 0) != 0) : 0) {
              l = L;
              break;
             }
             m = c[M + 20 >> 2] | 0;
             t = 0;
             while (1) if (!(m >>> t)) break; else t = t + 1 | 0;
             s = t + -1 | 0;
             o = c[w >> 2] | 0;
             q = c[v >> 2] << 3;
             r = c[g >> 2] | 0;
             do if ((q - r | 0) > 31) {
              n = c[rb + 628 + 8 >> 2] | 0;
              m = d[o + 1 >> 0] << 16 | d[o >> 0] << 24 | d[o + 2 >> 0] << 8 | d[o + 3 >> 0];
              if (!n) {
               n = rb + 628 + 8 | 0;
               break;
              }
              m = (d[o + 4 >> 0] | 0) >>> (8 - n | 0) | m << n;
              n = rb + 628 + 8 | 0;
             } else {
              if ((q - r | 0) <= 0) {
               m = 0;
               n = rb + 628 + 8 | 0;
               break;
              }
              n = c[rb + 628 + 8 >> 2] | 0;
              m = d[o >> 0] << n + 24;
              if ((q - r + -8 + n | 0) > 0) {
               p = q - r + -8 + n | 0;
               n = n + 24 | 0;
              } else {
               n = rb + 628 + 8 | 0;
               break;
              }
              while (1) {
               o = o + 1 | 0;
               n = n + -8 | 0;
               m = d[o >> 0] << n | m;
               if ((p | 0) <= 8) {
                n = rb + 628 + 8 | 0;
                break;
               } else p = p + -8 | 0;
              }
             } while (0);
             c[g >> 2] = s + r;
             c[n >> 2] = s + r & 7;
             if ((s + r | 0) >>> 0 > q >>> 0) {
              l = 1;
              break;
             }
             c[w >> 2] = (c[rb + 628 >> 2] | 0) + ((s + r | 0) >>> 3);
             if ((m >>> (33 - t | 0) | 0) == -1) {
              l = 1;
              break;
             }
             c[rb + 688 >> 2] = 0;
             m = Na(rb + 628 | 0, rb + 688 | 0) | 0;
             n = c[rb + 688 >> 2] | 0;
             do if ((n | 0) == -1) {
              o = (m | 0) == 0 ? 1 : 0;
              m = (m | 0) == 0 ? 0 : -2147483648;
             } else {
              if (m) {
               o = 1;
               m = 0;
               break;
              }
              o = 0;
              m = (n & 1 | 0) != 0 ? (n + 1 | 0) >>> 1 : 0 - ((n + 1 | 0) >>> 1) | 0;
             } while (0);
             if (o) break d;
             if ((c[e + 1320 >> 2] | 0) == (m | 0)) break f;
             c[e + 1320 >> 2] = m;
             k = 1;
             break f;
            } else l = m; while (0);
            N = k;
            Xa = 208;
            break c;
           } while (0);
           break d;
          }
         case 1:
          {
           if (c[M + 24 >> 2] | 0) break f;
           t = c[u + 8 >> 2] | 0;
           c[rb + 628 >> 2] = c[rb >> 2];
           c[rb + 628 + 4 >> 2] = c[rb + 4 >> 2];
           c[rb + 628 + 8 >> 2] = c[rb + 8 >> 2];
           c[rb + 628 + 12 >> 2] = c[rb + 12 >> 2];
           c[rb + 628 + 16 >> 2] = c[rb + 16 >> 2];
           l = Na(rb + 628 | 0, rb + 648 | 0) | 0;
           g : do if (!l) {
            l = Na(rb + 628 | 0, rb + 648 | 0) | 0;
            if (l) break;
            l = Na(rb + 628 | 0, rb + 648 | 0) | 0;
            if (l) break;
            l = c[M + 12 >> 2] | 0;
            s = 0;
            while (1) if (!(l >>> s)) break; else s = s + 1 | 0;
            r = s + -1 | 0;
            n = c[w >> 2] | 0;
            p = c[v >> 2] << 3;
            q = c[g >> 2] | 0;
            do if ((p - q | 0) > 31) {
             m = c[rb + 628 + 8 >> 2] | 0;
             l = d[n + 1 >> 0] << 16 | d[n >> 0] << 24 | d[n + 2 >> 0] << 8 | d[n + 3 >> 0];
             if (!m) {
              m = rb + 628 + 8 | 0;
              break;
             }
             l = (d[n + 4 >> 0] | 0) >>> (8 - m | 0) | l << m;
             m = rb + 628 + 8 | 0;
            } else {
             if ((p - q | 0) <= 0) {
              l = 0;
              m = rb + 628 + 8 | 0;
              break;
             }
             m = c[rb + 628 + 8 >> 2] | 0;
             l = d[n >> 0] << m + 24;
             if ((p - q + -8 + m | 0) > 0) {
              o = p - q + -8 + m | 0;
              m = m + 24 | 0;
             } else {
              m = rb + 628 + 8 | 0;
              break;
             }
             while (1) {
              n = n + 1 | 0;
              m = m + -8 | 0;
              l = d[n >> 0] << m | l;
              if ((o | 0) <= 8) {
               m = rb + 628 + 8 | 0;
               break;
              } else o = o + -8 | 0;
             }
            } while (0);
            c[g >> 2] = r + q;
            c[m >> 2] = r + q & 7;
            if ((r + q | 0) >>> 0 > p >>> 0) {
             l = 1;
             break;
            }
            c[w >> 2] = (c[rb + 628 >> 2] | 0) + ((r + q | 0) >>> 3);
            if ((l >>> (33 - s | 0) | 0) == -1) {
             l = 1;
             break;
            }
            if ((y | 0) == 5 ? (H = Na(rb + 628 | 0, rb + 648 | 0) | 0, (H | 0) != 0) : 0) {
             l = H;
             break;
            }
            c[rb + 688 >> 2] = 0;
            l = Na(rb + 628 | 0, rb + 688 | 0) | 0;
            m = c[rb + 688 >> 2] | 0;
            do if ((m | 0) == -1) if (!l) Xa = 190; else I = -2147483648; else {
             if (l) {
              Xa = 190;
              break;
             }
             I = (m & 1 | 0) != 0 ? (m + 1 | 0) >>> 1 : 0 - ((m + 1 | 0) >>> 1) | 0;
            } while (0);
            if ((Xa | 0) == 190) {
             l = 1;
             break;
            }
            do if (t) {
             c[rb + 688 >> 2] = 0;
             l = Na(rb + 628 | 0, rb + 688 | 0) | 0;
             m = c[rb + 688 >> 2] | 0;
             do if ((m | 0) == -1) if (!l) Xa = 197; else {
              J = -2147483648;
              Xa = 196;
             } else {
              if (l) {
               Xa = 197;
               break;
              }
              J = (m & 1 | 0) != 0 ? (m + 1 | 0) >>> 1 : 0 - ((m + 1 | 0) >>> 1) | 0;
              Xa = 196;
             } while (0);
             if ((Xa | 0) == 196) {
              K = J;
              break;
             } else if ((Xa | 0) == 197) {
              l = 1;
              break g;
             }
            } else K = 0; while (0);
            if ((c[e + 1324 >> 2] | 0) != (I | 0)) {
             c[e + 1324 >> 2] = I;
             k = 1;
            }
            if (!(c[u + 8 >> 2] | 0)) break f;
            if ((c[e + 1328 >> 2] | 0) == (K | 0)) break f;
            c[e + 1328 >> 2] = K;
            k = 1;
            break f;
           } while (0);
           N = k;
           Xa = 208;
           break c;
          }
         default:
          {}
         } while (0);
         c[e + 1300 >> 2] = y;
         c[e + 1300 + 4 >> 2] = z;
         P = k;
         Xa = 206;
         break b;
        } else Xa = 85; while (0);
        break;
       }
       e = 4;
       i = rb;
       return e | 0;
      }
     } else {
      O = m;
      Xa = 63;
     }
    } else {
     O = m;
     Xa = 63;
    }
   } else {
    O = m;
    Xa = 63;
   } while (0);
   if ((Xa | 0) == 63) {
    l = O;
    N = x;
    Xa = 208;
   }
   h : do if ((Xa | 0) == 208) {
    if ((l | 0) < 65520) switch (l | 0) {
    case 0:
     {
      Q = N;
      break b;
     }
    default:
     break h;
    }
    switch (l | 0) {
    case 65520:
     {
      la = 4;
      break;
     }
    default:
     break h;
    }
    i = rb;
    return la | 0;
   } while (0);
   e = 3;
   i = rb;
   return e | 0;
  }
 default:
  {
   P = 0;
   Xa = 206;
  }
 } while (0);
 if ((Xa | 0) == 206) Q = P;
 do if (!Q) Xa = 222; else {
  if ((c[e + 1184 >> 2] | 0) != 0 ? (c[e + 16 >> 2] | 0) != 0 : 0) {
   if (c[e + 3380 >> 2] | 0) {
    e = 3;
    i = rb;
    return e | 0;
   }
   if (!(c[e + 1188 >> 2] | 0)) {
    k = c[e + 1220 >> 2] | 0;
    l = k + ((c[e + 1248 >> 2] | 0) * 40 | 0) | 0;
    c[e + 1228 >> 2] = l;
    c[e + 1336 >> 2] = c[l >> 2];
    l = c[e + 1260 >> 2] | 0;
    if ((l | 0) != 0 ? (c[c[e + 1224 >> 2] >> 2] = k, (l | 0) != 1) : 0) {
     k = 1;
     do {
      c[(c[e + 1224 >> 2] | 0) + (k << 2) >> 2] = (c[e + 1220 >> 2] | 0) + (k * 40 | 0);
      k = k + 1 | 0;
     } while ((k | 0) != (l | 0));
    }
    fb(e, e + 1336 | 0, 0);
    k = e + 1336 | 0;
   } else {
    fb(e, e + 1336 | 0, c[e + 1372 >> 2] | 0);
    k = e + 1336 | 0;
   }
   c[j >> 2] = 0;
   c[e + 3344 >> 2] = 1;
   c[e + 1180 >> 2] = 0;
   Ua = e + 16 | 0;
   Wa = e + 1188 | 0;
   Ta = e + 1212 | 0;
   Va = k;
   break;
  }
  c[e + 1188 >> 2] = 0;
  c[e + 1180 >> 2] = 0;
  Xa = 222;
 } while (0);
 i : do if ((Xa | 0) == 222) switch (y | 0) {
 case 7:
  {
   l = rb + 96 | 0;
   m = l + 92 | 0;
   do {
    c[l >> 2] = 0;
    l = l + 4 | 0;
   } while ((l | 0) < (m | 0));
   k = Ma(rb, 8) | 0;
   j : do if ((((((((k | 0) != -1 ? (c[rb + 96 >> 2] = k, Ma(rb, 1) | 0, Ma(rb, 1) | 0, (Ma(rb, 1) | 0) != -1) : 0) ? (Ma(rb, 5) | 0) != -1 : 0) ? (T = Ma(rb, 8) | 0, (T | 0) != -1) : 0) ? (c[rb + 96 + 4 >> 2] = T, qb = (Na(rb, rb + 96 + 8 | 0) | 0) != 0, !(qb | (c[rb + 96 + 8 >> 2] | 0) >>> 0 > 31)) : 0) ? (Na(rb, rb + 648 | 0) | 0) == 0 : 0) ? (U = c[rb + 648 >> 2] | 0, U >>> 0 <= 12) : 0) ? (c[rb + 96 + 12 >> 2] = 1 << U + 4, (Na(rb, rb + 648 | 0) | 0) == 0) : 0) {
    k = c[rb + 648 >> 2] | 0;
    if (k >>> 0 > 2) break;
    c[rb + 96 + 16 >> 2] = k;
    k : do switch (k | 0) {
    case 0:
     {
      if (Na(rb, rb + 648 | 0) | 0) break j;
      k = c[rb + 648 >> 2] | 0;
      if (k >>> 0 > 12) break j;
      c[rb + 96 + 20 >> 2] = 1 << k + 4;
      break;
     }
    case 1:
     {
      k = Ma(rb, 1) | 0;
      if ((k | 0) == -1) break j;
      c[rb + 96 + 24 >> 2] = (k | 0) == 1 & 1;
      c[rb + 688 >> 2] = 0;
      k = Na(rb, rb + 688 | 0) | 0;
      l = c[rb + 688 >> 2] | 0;
      do if ((l | 0) == -1) if (!k) Xa = 241; else X = -2147483648; else {
       if (k) {
        Xa = 241;
        break;
       }
       X = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
      } while (0);
      if ((Xa | 0) == 241) break j;
      c[rb + 96 + 28 >> 2] = X;
      c[rb + 688 >> 2] = 0;
      k = Na(rb, rb + 688 | 0) | 0;
      l = c[rb + 688 >> 2] | 0;
      do if ((l | 0) == -1) if (!k) Xa = 246; else Y = -2147483648; else {
       if (k) {
        Xa = 246;
        break;
       }
       Y = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
      } while (0);
      if ((Xa | 0) == 246) break j;
      c[rb + 96 + 32 >> 2] = Y;
      o = rb + 96 + 36 | 0;
      if (Na(rb, o) | 0) break j;
      k = c[o >> 2] | 0;
      if (k >>> 0 > 255) break j;
      if (!k) {
       c[rb + 96 + 40 >> 2] = 0;
       break k;
      }
      k = ub(k << 2) | 0;
      c[rb + 96 + 40 >> 2] = k;
      if (!k) break j;
      if (!(c[o >> 2] | 0)) break k;
      c[rb + 688 >> 2] = 0;
      l = Na(rb, rb + 688 | 0) | 0;
      m = c[rb + 688 >> 2] | 0;
      do if ((m | 0) == -1) if (!l) Xa = 258; else _ = -2147483648; else {
       if (l) {
        Xa = 258;
        break;
       }
       _ = (m & 1 | 0) != 0 ? (m + 1 | 0) >>> 1 : 0 - ((m + 1 | 0) >>> 1) | 0;
      } while (0);
      if ((Xa | 0) == 258) break j;
      c[k >> 2] = _;
      if ((c[o >> 2] | 0) >>> 0 <= 1) break k;
      n = 1;
      while (1) {
       m = (c[rb + 96 + 40 >> 2] | 0) + (n << 2) | 0;
       c[rb + 688 >> 2] = 0;
       k = Na(rb, rb + 688 | 0) | 0;
       l = c[rb + 688 >> 2] | 0;
       if ((l | 0) == -1) if (!k) break; else k = -2147483648; else {
        if (k) break;
        k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
       }
       c[m >> 2] = k;
       n = n + 1 | 0;
       if (n >>> 0 >= (c[o >> 2] | 0) >>> 0) break k;
      }
      break j;
     }
    default:
     {}
    } while (0);
    t = rb + 96 + 44 | 0;
    qb = (Na(rb, t) | 0) != 0;
    if (qb | (c[t >> 2] | 0) >>> 0 > 16) break;
    k = Ma(rb, 1) | 0;
    if ((k | 0) == -1) break;
    c[rb + 96 + 48 >> 2] = (k | 0) == 1 & 1;
    if (Na(rb, rb + 648 | 0) | 0) break;
    c[rb + 96 + 52 >> 2] = (c[rb + 648 >> 2] | 0) + 1;
    if (Na(rb, rb + 648 | 0) | 0) break;
    c[rb + 96 + 56 >> 2] = (c[rb + 648 >> 2] | 0) + 1;
    switch (Ma(rb, 1) | 0) {
    case 0:
    case -1:
     break j;
    default:
     {}
    }
    if ((Ma(rb, 1) | 0) == -1) break;
    k = Ma(rb, 1) | 0;
    if ((k | 0) == -1) break;
    c[rb + 96 + 60 >> 2] = (k | 0) == 1 & 1;
    if ((k | 0) == 1) {
     if (Na(rb, rb + 96 + 64 | 0) | 0) break;
     if (Na(rb, rb + 96 + 68 | 0) | 0) break;
     if (Na(rb, rb + 96 + 72 | 0) | 0) break;
     if (Na(rb, rb + 96 + 76 | 0) | 0) break;
     l = c[rb + 96 + 52 >> 2] | 0;
     if ((c[rb + 96 + 64 >> 2] | 0) > ((l << 3) + ~c[rb + 96 + 68 >> 2] | 0)) break;
     k = c[rb + 96 + 56 >> 2] | 0;
     if ((c[rb + 96 + 72 >> 2] | 0) > ((k << 3) + ~c[rb + 96 + 76 >> 2] | 0)) break;
    } else {
     k = c[rb + 96 + 56 >> 2] | 0;
     l = c[rb + 96 + 52 >> 2] | 0;
    }
    k = Z(l, k) | 0;
    do switch (c[rb + 96 + 4 >> 2] | 0) {
    case 10:
     {
      aa = 99;
      ba = 152064;
      Xa = 296;
      break;
     }
    case 11:
     {
      aa = 396;
      ba = 345600;
      Xa = 296;
      break;
     }
    case 12:
     {
      aa = 396;
      ba = 912384;
      Xa = 296;
      break;
     }
    case 13:
     {
      aa = 396;
      ba = 912384;
      Xa = 296;
      break;
     }
    case 20:
     {
      aa = 396;
      ba = 912384;
      Xa = 296;
      break;
     }
    case 21:
     {
      aa = 792;
      ba = 1824768;
      Xa = 296;
      break;
     }
    case 22:
     {
      aa = 1620;
      ba = 3110400;
      Xa = 296;
      break;
     }
    case 30:
     {
      aa = 1620;
      ba = 3110400;
      Xa = 296;
      break;
     }
    case 31:
     {
      aa = 3600;
      ba = 6912e3;
      Xa = 296;
      break;
     }
    case 32:
     {
      aa = 5120;
      ba = 7864320;
      Xa = 296;
      break;
     }
    case 40:
     {
      aa = 8192;
      ba = 12582912;
      Xa = 296;
      break;
     }
    case 41:
     {
      aa = 8192;
      ba = 12582912;
      Xa = 296;
      break;
     }
    case 42:
     {
      aa = 8704;
      ba = 13369344;
      Xa = 296;
      break;
     }
    case 50:
     {
      aa = 22080;
      ba = 42393600;
      Xa = 296;
      break;
     }
    case 51:
     {
      aa = 36864;
      ba = 70778880;
      Xa = 296;
      break;
     }
    default:
     Xa = 298;
    } while (0);
    do if ((Xa | 0) == 296) {
     if (aa >>> 0 < k >>> 0) {
      Xa = 298;
      break;
     }
     k = (ba >>> 0) / ((k * 384 | 0) >>> 0) | 0;
     k = k >>> 0 < 16 ? k : 16;
     c[rb + 648 >> 2] = k;
     l = c[t >> 2] | 0;
     if (l >>> 0 > k >>> 0) {
      ca = l;
      Xa = 299;
     } else da = k;
    } while (0);
    if ((Xa | 0) == 298) {
     c[rb + 648 >> 2] = 2147483647;
     ca = c[t >> 2] | 0;
     Xa = 299;
    }
    if ((Xa | 0) == 299) {
     c[rb + 648 >> 2] = ca;
     da = ca;
    }
    c[rb + 96 + 88 >> 2] = da;
    k = Ma(rb, 1) | 0;
    if ((k | 0) == -1) break;
    c[rb + 96 + 80 >> 2] = (k | 0) == 1 & 1;
    do if ((k | 0) == 1) {
     s = ub(952) | 0;
     c[rb + 96 + 84 >> 2] = s;
     if (!s) break j;
     xb(s | 0, 0, 952) | 0;
     k = Ma(rb, 1) | 0;
     if ((k | 0) == -1) break j;
     c[s >> 2] = (k | 0) == 1 & 1;
     do if ((k | 0) == 1) {
      k = Ma(rb, 8) | 0;
      if ((k | 0) == -1) break j;
      c[s + 4 >> 2] = k;
      if ((k | 0) != 255) break;
      k = Ma(rb, 16) | 0;
      if ((k | 0) == -1) break j;
      c[s + 8 >> 2] = k;
      k = Ma(rb, 16) | 0;
      if ((k | 0) == -1) break j;
      c[s + 12 >> 2] = k;
     } while (0);
     k = Ma(rb, 1) | 0;
     if ((k | 0) == -1) break j;
     c[s + 16 >> 2] = (k | 0) == 1 & 1;
     if ((k | 0) == 1) {
      k = Ma(rb, 1) | 0;
      if ((k | 0) == -1) break j;
      c[s + 20 >> 2] = (k | 0) == 1 & 1;
     }
     k = Ma(rb, 1) | 0;
     if ((k | 0) == -1) break j;
     c[s + 24 >> 2] = (k | 0) == 1 & 1;
     do if ((k | 0) == 1) {
      k = Ma(rb, 3) | 0;
      if ((k | 0) == -1) break j;
      c[s + 28 >> 2] = k;
      k = Ma(rb, 1) | 0;
      if ((k | 0) == -1) break j;
      c[s + 32 >> 2] = (k | 0) == 1 & 1;
      k = Ma(rb, 1) | 0;
      if ((k | 0) == -1) break j;
      c[s + 36 >> 2] = (k | 0) == 1 & 1;
      if ((k | 0) != 1) {
       c[s + 40 >> 2] = 2;
       c[s + 44 >> 2] = 2;
       c[s + 48 >> 2] = 2;
       break;
      }
      k = Ma(rb, 8) | 0;
      if ((k | 0) == -1) break j;
      c[s + 40 >> 2] = k;
      k = Ma(rb, 8) | 0;
      if ((k | 0) == -1) break j;
      c[s + 44 >> 2] = k;
      k = Ma(rb, 8) | 0;
      if ((k | 0) == -1) break j;
      c[s + 48 >> 2] = k;
     } else {
      c[s + 28 >> 2] = 5;
      c[s + 40 >> 2] = 2;
      c[s + 44 >> 2] = 2;
      c[s + 48 >> 2] = 2;
     } while (0);
     k = Ma(rb, 1) | 0;
     if ((k | 0) == -1) break j;
     c[s + 52 >> 2] = (k | 0) == 1 & 1;
     if ((k | 0) == 1) {
      if (Na(rb, s + 56 | 0) | 0) break j;
      if ((c[s + 56 >> 2] | 0) >>> 0 > 5) break j;
      if (Na(rb, s + 60 | 0) | 0) break j;
      if ((c[s + 60 >> 2] | 0) >>> 0 > 5) break j;
     }
     k = Ma(rb, 1) | 0;
     if ((k | 0) == -1) break j;
     c[s + 64 >> 2] = (k | 0) == 1 & 1;
     if ((k | 0) == 1) {
      m = c[rb + 4 >> 2] | 0;
      q = c[rb + 12 >> 2] << 3;
      r = c[rb + 16 >> 2] | 0;
      do if ((q - r | 0) > 31) {
       k = c[A >> 2] | 0;
       l = d[m + 1 >> 0] << 16 | d[m >> 0] << 24 | d[m + 2 >> 0] << 8 | d[m + 3 >> 0];
       if (!k) break;
       l = (d[m + 4 >> 0] | 0) >>> (8 - k | 0) | l << k;
      } else {
       if ((q - r | 0) <= 0) {
        l = 0;
        break;
       }
       k = c[A >> 2] | 0;
       l = d[m >> 0] << k + 24;
       if ((q - r + -8 + k | 0) > 0) {
        n = q - r + -8 + k | 0;
        k = k + 24 | 0;
       } else break;
       while (1) {
        m = m + 1 | 0;
        k = k + -8 | 0;
        l = d[m >> 0] << k | l;
        if ((n | 0) <= 8) break; else n = n + -8 | 0;
       }
      } while (0);
      c[rb + 16 >> 2] = r + 32;
      n = r + 32 & 7;
      c[A >> 2] = n;
      if (q >>> 0 < (r + 32 | 0) >>> 0) break j;
      p = c[rb >> 2] | 0;
      m = p + ((r + 32 | 0) >>> 3) | 0;
      c[rb + 4 >> 2] = m;
      if (!l) break j;
      c[s + 68 >> 2] = l;
      do if ((q - (r + 32) | 0) > 31) {
       k = d[m + 1 >> 0] << 16 | d[m >> 0] << 24 | d[m + 2 >> 0] << 8 | d[m + 3 >> 0];
       if (!n) break;
       k = (d[m + 4 >> 0] | 0) >>> (8 - n | 0) | k << n;
      } else {
       if ((q - (r + 32) | 0) <= 0) {
        k = 0;
        break;
       }
       k = d[m >> 0] << (n | 24);
       if ((q - (r + 32) + -8 + n | 0) > 0) {
        o = q - (r + 32) + -8 + n | 0;
        l = n | 24;
       } else break;
       while (1) {
        m = m + 1 | 0;
        l = l + -8 | 0;
        k = d[m >> 0] << l | k;
        if ((o | 0) <= 8) break; else o = o + -8 | 0;
       }
      } while (0);
      c[rb + 16 >> 2] = r + 64;
      c[A >> 2] = r + 64 & 7;
      if ((r + 64 | 0) >>> 0 > q >>> 0) break j;
      c[rb + 4 >> 2] = p + ((r + 64 | 0) >>> 3);
      if (!k) break j;
      c[s + 72 >> 2] = k;
      k = Ma(rb, 1) | 0;
      if ((k | 0) == -1) break j;
      c[s + 76 >> 2] = (k | 0) == 1 & 1;
     }
     k = Ma(rb, 1) | 0;
     if ((k | 0) == -1) break j;
     c[s + 80 >> 2] = (k | 0) == 1 & 1;
     if ((k | 0) == 1) {
      if (hb(rb, s + 84 | 0) | 0) break j;
     } else {
      c[s + 84 >> 2] = 1;
      c[s + 96 >> 2] = 288000001;
      c[s + 224 >> 2] = 288000001;
      c[s + 480 >> 2] = 24;
      c[s + 484 >> 2] = 24;
      c[s + 488 >> 2] = 24;
      c[s + 492 >> 2] = 24;
     }
     k = Ma(rb, 1) | 0;
     if ((k | 0) == -1) break j;
     c[s + 496 >> 2] = (k | 0) == 1 & 1;
     if ((k | 0) == 1) {
      if (hb(rb, s + 500 | 0) | 0) break j;
     } else {
      c[s + 500 >> 2] = 1;
      c[s + 512 >> 2] = 240000001;
      c[s + 640 >> 2] = 240000001;
      c[s + 896 >> 2] = 24;
      c[s + 900 >> 2] = 24;
      c[s + 904 >> 2] = 24;
      c[s + 908 >> 2] = 24;
     }
     if (!((c[s + 80 >> 2] | 0) == 0 ? (c[s + 496 >> 2] | 0) == 0 : 0)) {
      k = Ma(rb, 1) | 0;
      if ((k | 0) == -1) break j;
      c[s + 912 >> 2] = (k | 0) == 1 & 1;
     }
     k = Ma(rb, 1) | 0;
     if ((k | 0) == -1) break j;
     c[s + 916 >> 2] = (k | 0) == 1 & 1;
     k = Ma(rb, 1) | 0;
     if ((k | 0) == -1) break j;
     c[s + 920 >> 2] = (k | 0) == 1 & 1;
     if ((k | 0) == 1) {
      k = Ma(rb, 1) | 0;
      if ((k | 0) == -1) break j;
      c[s + 924 >> 2] = (k | 0) == 1 & 1;
      if (Na(rb, s + 928 | 0) | 0) break j;
      if ((c[s + 928 >> 2] | 0) >>> 0 > 16) break j;
      if (Na(rb, s + 932 | 0) | 0) break j;
      if ((c[s + 932 >> 2] | 0) >>> 0 > 16) break j;
      if (Na(rb, s + 936 | 0) | 0) break j;
      if ((c[s + 936 >> 2] | 0) >>> 0 > 16) break j;
      if (Na(rb, s + 940 | 0) | 0) break j;
      if ((c[s + 940 >> 2] | 0) >>> 0 > 16) break j;
      if (Na(rb, s + 944 | 0) | 0) break j;
      if (Na(rb, s + 948 | 0) | 0) break j;
     } else {
      c[s + 924 >> 2] = 1;
      c[s + 928 >> 2] = 2;
      c[s + 932 >> 2] = 1;
      c[s + 936 >> 2] = 16;
      c[s + 940 >> 2] = 16;
      c[s + 944 >> 2] = 16;
      c[s + 948 >> 2] = 16;
     }
     k = c[rb + 96 + 84 >> 2] | 0;
     if (!(c[k + 920 >> 2] | 0)) break;
     l = c[k + 948 >> 2] | 0;
     if ((l >>> 0 < (c[t >> 2] | 0) >>> 0 ? 1 : (c[k + 944 >> 2] | 0) >>> 0 > l >>> 0) | l >>> 0 > (c[rb + 96 + 88 >> 2] | 0) >>> 0) break j;
     c[rb + 96 + 88 >> 2] = (l | 0) == 0 ? 1 : l;
    } while (0);
    Ma(rb, 8 - (c[A >> 2] | 0) | 0) | 0;
    p = c[rb + 96 + 8 >> 2] | 0;
    q = c[e + 20 + (p << 2) >> 2] | 0;
    do if (!q) {
     qb = ub(92) | 0;
     c[e + 20 + (p << 2) >> 2] = qb;
     if (!qb) la = 0; else break;
     i = rb;
     return la | 0;
    } else {
     if ((p | 0) != (c[e + 8 >> 2] | 0)) {
      vb(c[q + 40 >> 2] | 0);
      c[(c[e + 20 + (p << 2) >> 2] | 0) + 40 >> 2] = 0;
      vb(c[(c[e + 20 + (p << 2) >> 2] | 0) + 84 >> 2] | 0);
      c[(c[e + 20 + (p << 2) >> 2] | 0) + 84 >> 2] = 0;
      break;
     }
     r = c[e + 16 >> 2] | 0;
     l : do if ((c[rb + 96 >> 2] | 0) == (c[r >> 2] | 0)) {
      if ((c[rb + 96 + 4 >> 2] | 0) != (c[r + 4 >> 2] | 0)) break;
      if ((c[rb + 96 + 12 >> 2] | 0) != (c[r + 12 >> 2] | 0)) break;
      k = c[rb + 96 + 16 >> 2] | 0;
      if ((k | 0) != (c[r + 16 >> 2] | 0)) break;
      if ((c[t >> 2] | 0) != (c[r + 44 >> 2] | 0)) break;
      if ((c[rb + 96 + 48 >> 2] | 0) != (c[r + 48 >> 2] | 0)) break;
      if ((c[rb + 96 + 52 >> 2] | 0) != (c[r + 52 >> 2] | 0)) break;
      if ((c[rb + 96 + 56 >> 2] | 0) != (c[r + 56 >> 2] | 0)) break;
      o = c[rb + 96 + 60 >> 2] | 0;
      if ((o | 0) != (c[r + 60 >> 2] | 0)) break;
      if ((c[rb + 96 + 80 >> 2] | 0) != (c[r + 80 >> 2] | 0)) break;
      m : do switch (k | 0) {
      case 0:
       {
        if ((c[rb + 96 + 20 >> 2] | 0) != (c[r + 20 >> 2] | 0)) break l;
        break;
       }
      case 1:
       {
        if ((c[rb + 96 + 24 >> 2] | 0) != (c[r + 24 >> 2] | 0)) break l;
        if ((c[rb + 96 + 28 >> 2] | 0) != (c[r + 28 >> 2] | 0)) break l;
        if ((c[rb + 96 + 32 >> 2] | 0) != (c[r + 32 >> 2] | 0)) break l;
        k = c[rb + 96 + 36 >> 2] | 0;
        if ((k | 0) != (c[r + 36 >> 2] | 0)) break l;
        if (!k) break m;
        l = c[rb + 96 + 40 >> 2] | 0;
        m = c[r + 40 >> 2] | 0;
        n = 0;
        do {
         if ((c[l + (n << 2) >> 2] | 0) != (c[m + (n << 2) >> 2] | 0)) break l;
         n = n + 1 | 0;
        } while (n >>> 0 < k >>> 0);
        break;
       }
      default:
       {}
      } while (0);
      if (o) {
       if ((c[rb + 96 + 64 >> 2] | 0) != (c[r + 64 >> 2] | 0)) break;
       if ((c[rb + 96 + 68 >> 2] | 0) != (c[r + 68 >> 2] | 0)) break;
       if ((c[rb + 96 + 72 >> 2] | 0) != (c[r + 72 >> 2] | 0)) break;
       if ((c[rb + 96 + 76 >> 2] | 0) != (c[r + 76 >> 2] | 0)) break;
      }
      vb(c[rb + 96 + 40 >> 2] | 0);
      c[rb + 96 + 40 >> 2] = 0;
      vb(c[rb + 96 + 84 >> 2] | 0);
      c[rb + 96 + 84 >> 2] = 0;
      e = 0;
      i = rb;
      return e | 0;
     } while (0);
     vb(c[q + 40 >> 2] | 0);
     c[(c[e + 20 + (p << 2) >> 2] | 0) + 40 >> 2] = 0;
     vb(c[(c[e + 20 + (p << 2) >> 2] | 0) + 84 >> 2] | 0);
     c[(c[e + 20 + (p << 2) >> 2] | 0) + 84 >> 2] = 0;
     c[e + 8 >> 2] = 33;
     c[e + 4 >> 2] = 257;
     c[e + 16 >> 2] = 0;
     c[e + 12 >> 2] = 0;
    } while (0);
    l = c[e + 20 + (p << 2) >> 2] | 0;
    k = rb + 96 | 0;
    m = l + 92 | 0;
    do {
     c[l >> 2] = c[k >> 2];
     l = l + 4 | 0;
     k = k + 4 | 0;
    } while ((l | 0) < (m | 0));
    e = 0;
    i = rb;
    return e | 0;
   } while (0);
   vb(c[rb + 96 + 40 >> 2] | 0);
   c[rb + 96 + 40 >> 2] = 0;
   vb(c[rb + 96 + 84 >> 2] | 0);
   c[rb + 96 + 84 >> 2] = 0;
   e = 3;
   i = rb;
   return e | 0;
  }
 case 8:
  {
   l = rb + 24 | 0;
   m = l + 72 | 0;
   do {
    c[l >> 2] = 0;
    l = l + 4 | 0;
   } while ((l | 0) < (m | 0));
   n : do if (((((!((Na(rb, rb + 24 | 0) | 0) != 0 ? 1 : (c[rb + 24 >> 2] | 0) >>> 0 > 255) ? (qb = (Na(rb, rb + 24 + 4 | 0) | 0) != 0, !(qb | (c[rb + 24 + 4 >> 2] | 0) >>> 0 > 31)) : 0) ? (Ma(rb, 1) | 0) == 0 : 0) ? (R = Ma(rb, 1) | 0, (R | 0) != -1) : 0) ? (c[rb + 24 + 8 >> 2] = (R | 0) == 1 & 1, (Na(rb, rb + 648 | 0) | 0) == 0) : 0) ? (S = (c[rb + 648 >> 2] | 0) + 1 | 0, W = rb + 24 + 12 | 0, c[W >> 2] = S, S >>> 0 <= 8) : 0) {
    o : do if (S >>> 0 > 1) {
     if (Na(rb, rb + 24 + 16 | 0) | 0) break n;
     k = c[rb + 24 + 16 >> 2] | 0;
     if (k >>> 0 > 6) break n;
     switch (k | 0) {
     case 0:
      {
       qb = ub(c[W >> 2] << 2) | 0;
       c[rb + 24 + 20 >> 2] = qb;
       if (!qb) break n;
       if (!(c[W >> 2] | 0)) break o; else k = 0;
       do {
        if (Na(rb, rb + 648 | 0) | 0) break n;
        c[(c[rb + 24 + 20 >> 2] | 0) + (k << 2) >> 2] = (c[rb + 648 >> 2] | 0) + 1;
        k = k + 1 | 0;
       } while (k >>> 0 < (c[W >> 2] | 0) >>> 0);
       break;
      }
     case 2:
      {
       c[rb + 24 + 24 >> 2] = ub((c[W >> 2] << 2) + -4 | 0) | 0;
       qb = ub((c[W >> 2] << 2) + -4 | 0) | 0;
       c[rb + 24 + 28 >> 2] = qb;
       if ((qb | 0) == 0 ? 1 : (c[rb + 24 + 24 >> 2] | 0) == 0) break n;
       if ((c[W >> 2] | 0) == 1) break o; else k = 0;
       do {
        if (Na(rb, rb + 648 | 0) | 0) break n;
        c[(c[rb + 24 + 24 >> 2] | 0) + (k << 2) >> 2] = c[rb + 648 >> 2];
        if (Na(rb, rb + 648 | 0) | 0) break n;
        c[(c[rb + 24 + 28 >> 2] | 0) + (k << 2) >> 2] = c[rb + 648 >> 2];
        k = k + 1 | 0;
       } while (k >>> 0 < ((c[W >> 2] | 0) + -1 | 0) >>> 0);
       break;
      }
     case 5:
     case 4:
     case 3:
      {
       k = Ma(rb, 1) | 0;
       if ((k | 0) == -1) break n;
       c[rb + 24 + 32 >> 2] = (k | 0) == 1 & 1;
       if (Na(rb, rb + 648 | 0) | 0) break n;
       c[rb + 24 + 36 >> 2] = (c[rb + 648 >> 2] | 0) + 1;
       break o;
      }
     case 6:
      {
       if (Na(rb, rb + 648 | 0) | 0) break n;
       qb = (c[rb + 648 >> 2] | 0) + 1 | 0;
       c[rb + 24 + 40 >> 2] = qb;
       qb = ub(qb << 2) | 0;
       c[rb + 24 + 44 >> 2] = qb;
       if (!qb) break n;
       k = c[288 + ((c[W >> 2] | 0) + -1 << 2) >> 2] | 0;
       if (!(c[rb + 24 + 40 >> 2] | 0)) break o; else l = 0;
       do {
        qb = Ma(rb, k) | 0;
        c[(c[rb + 24 + 44 >> 2] | 0) + (l << 2) >> 2] = qb;
        l = l + 1 | 0;
        if (qb >>> 0 >= (c[W >> 2] | 0) >>> 0) break n;
       } while (l >>> 0 < (c[rb + 24 + 40 >> 2] | 0) >>> 0);
       break;
      }
     default:
      break o;
     }
    } while (0);
    if (!(Na(rb, rb + 648 | 0) | 0)) {
     k = c[rb + 648 >> 2] | 0;
     if (k >>> 0 > 31) break;
     c[rb + 24 + 48 >> 2] = k + 1;
     qb = (Na(rb, rb + 648 | 0) | 0) != 0;
     if (qb | (c[rb + 648 >> 2] | 0) >>> 0 > 31) break;
     if (Ma(rb, 1) | 0) break;
     if ((Ma(rb, 2) | 0) >>> 0 > 2) break;
     c[rb + 688 >> 2] = 0;
     k = Na(rb, rb + 688 | 0) | 0;
     l = c[rb + 688 >> 2] | 0;
     do if ((l | 0) == -1) {
      if (!k) break;
      break n;
     } else {
      if (k) break;
      k = ((l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0) + 26 | 0;
      if (k >>> 0 > 51) break n;
      c[rb + 24 + 52 >> 2] = k;
      c[rb + 688 >> 2] = 0;
      k = Na(rb, rb + 688 | 0) | 0;
      l = c[rb + 688 >> 2] | 0;
      do if ((l | 0) == -1) {
       if (!k) break;
       break n;
      } else {
       if (k) break;
       if ((((l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0) + 26 | 0) >>> 0 > 51) break n;
       c[rb + 688 >> 2] = 0;
       k = Na(rb, rb + 688 | 0) | 0;
       l = c[rb + 688 >> 2] | 0;
       do if ((l | 0) == -1) {
        if (!k) break;
        break n;
       } else {
        if (k) break;
        k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
        if ((k + 12 | 0) >>> 0 > 24) break n;
        c[rb + 24 + 56 >> 2] = k;
        k = Ma(rb, 1) | 0;
        if ((k | 0) == -1) break n;
        c[rb + 24 + 60 >> 2] = (k | 0) == 1 & 1;
        k = Ma(rb, 1) | 0;
        if ((k | 0) == -1) break n;
        c[rb + 24 + 64 >> 2] = (k | 0) == 1 & 1;
        k = Ma(rb, 1) | 0;
        if ((k | 0) == -1) break n;
        c[rb + 24 + 68 >> 2] = (k | 0) == 1 & 1;
        Ma(rb, 8 - (c[A >> 2] | 0) | 0) | 0;
        l = c[rb + 24 >> 2] | 0;
        k = c[e + 148 + (l << 2) >> 2] | 0;
        do if (!k) {
         qb = ub(72) | 0;
         c[e + 148 + (l << 2) >> 2] = qb;
         if (!qb) la = 0; else break;
         i = rb;
         return la | 0;
        } else {
         if ((l | 0) != (c[e + 4 >> 2] | 0)) {
          vb(c[k + 20 >> 2] | 0);
          c[(c[e + 148 + (l << 2) >> 2] | 0) + 20 >> 2] = 0;
          vb(c[(c[e + 148 + (l << 2) >> 2] | 0) + 24 >> 2] | 0);
          c[(c[e + 148 + (l << 2) >> 2] | 0) + 24 >> 2] = 0;
          vb(c[(c[e + 148 + (l << 2) >> 2] | 0) + 28 >> 2] | 0);
          c[(c[e + 148 + (l << 2) >> 2] | 0) + 28 >> 2] = 0;
          vb(c[(c[e + 148 + (l << 2) >> 2] | 0) + 44 >> 2] | 0);
          c[(c[e + 148 + (l << 2) >> 2] | 0) + 44 >> 2] = 0;
          break;
         }
         if ((c[rb + 24 + 4 >> 2] | 0) != (c[e + 8 >> 2] | 0)) {
          c[e + 4 >> 2] = 257;
          k = c[e + 148 + (l << 2) >> 2] | 0;
         }
         vb(c[k + 20 >> 2] | 0);
         c[(c[e + 148 + (l << 2) >> 2] | 0) + 20 >> 2] = 0;
         vb(c[(c[e + 148 + (l << 2) >> 2] | 0) + 24 >> 2] | 0);
         c[(c[e + 148 + (l << 2) >> 2] | 0) + 24 >> 2] = 0;
         vb(c[(c[e + 148 + (l << 2) >> 2] | 0) + 28 >> 2] | 0);
         c[(c[e + 148 + (l << 2) >> 2] | 0) + 28 >> 2] = 0;
         vb(c[(c[e + 148 + (l << 2) >> 2] | 0) + 44 >> 2] | 0);
         c[(c[e + 148 + (l << 2) >> 2] | 0) + 44 >> 2] = 0;
        } while (0);
        l = c[e + 148 + (l << 2) >> 2] | 0;
        k = rb + 24 | 0;
        m = l + 72 | 0;
        do {
         c[l >> 2] = c[k >> 2];
         l = l + 4 | 0;
         k = k + 4 | 0;
        } while ((l | 0) < (m | 0));
        e = 0;
        i = rb;
        return e | 0;
       } while (0);
       break n;
      } while (0);
      break n;
     } while (0);
    }
   } while (0);
   vb(c[rb + 24 + 20 >> 2] | 0);
   c[rb + 24 + 20 >> 2] = 0;
   vb(c[rb + 24 + 24 >> 2] | 0);
   c[rb + 24 + 24 >> 2] = 0;
   vb(c[rb + 24 + 28 >> 2] | 0);
   c[rb + 24 + 28 >> 2] = 0;
   vb(c[rb + 24 + 44 >> 2] | 0);
   c[rb + 24 + 44 >> 2] = 0;
   e = 3;
   i = rb;
   return e | 0;
  }
 case 1:
 case 5:
  {
   if (c[e + 1180 >> 2] | 0) {
    e = 0;
    i = rb;
    return e | 0;
   }
   c[e + 1184 >> 2] = 1;
   p : do if (!(c[e + 1188 >> 2] | 0)) {
    c[e + 1204 >> 2] = 0;
    c[e + 1208 >> 2] = h;
    c[rb + 648 >> 2] = c[rb >> 2];
    c[rb + 648 + 4 >> 2] = c[rb + 4 >> 2];
    c[rb + 648 + 8 >> 2] = c[rb + 8 >> 2];
    c[rb + 648 + 12 >> 2] = c[rb + 12 >> 2];
    c[rb + 648 + 16 >> 2] = c[rb + 16 >> 2];
    if ((Na(rb + 648 | 0, rb + 688 | 0) | 0) == 0 ? (Na(rb + 648 | 0, rb + 688 | 0) | 0) == 0 : 0) {
     Na(rb + 648 | 0, rb + 688 | 0) | 0;
     t = c[rb + 688 >> 2] | 0;
    } else t = 0;
    u = c[e + 8 >> 2] | 0;
    s = e + 148 + (t << 2) | 0;
    l = c[s >> 2] | 0;
    q : do if ((l | 0) != 0 ? ($ = c[l + 4 >> 2] | 0, V = c[e + 20 + ($ << 2) >> 2] | 0, (V | 0) != 0) : 0) {
     p = c[V + 52 >> 2] | 0;
     q = Z(c[V + 56 >> 2] | 0, p) | 0;
     r = c[l + 12 >> 2] | 0;
     r : do if (r >>> 0 > 1) {
      k = c[l + 16 >> 2] | 0;
      switch (k | 0) {
      case 0:
       {
        k = c[l + 20 >> 2] | 0;
        l = 0;
        do {
         if ((c[k + (l << 2) >> 2] | 0) >>> 0 > q >>> 0) {
          k = 4;
          break q;
         }
         l = l + 1 | 0;
        } while (l >>> 0 < r >>> 0);
        break;
       }
      case 2:
       {
        o = c[l + 24 >> 2] | 0;
        k = c[l + 28 >> 2] | 0;
        n = 0;
        do {
         l = c[o + (n << 2) >> 2] | 0;
         m = c[k + (n << 2) >> 2] | 0;
         if (!(l >>> 0 <= m >>> 0 & m >>> 0 < q >>> 0)) {
          k = 4;
          break q;
         }
         n = n + 1 | 0;
         if (((l >>> 0) % (p >>> 0) | 0) >>> 0 > ((m >>> 0) % (p >>> 0) | 0) >>> 0) {
          k = 4;
          break q;
         }
        } while (n >>> 0 < (r + -1 | 0) >>> 0);
        break;
       }
      default:
       {
        if ((k + -3 | 0) >>> 0 < 3) if ((c[l + 36 >> 2] | 0) >>> 0 > q >>> 0) {
         k = 4;
         break q;
        } else break r;
        if ((k | 0) != 6) break r;
        if ((c[l + 40 >> 2] | 0) >>> 0 < q >>> 0) {
         k = 4;
         break q;
        } else break r;
       }
      }
     } while (0);
     k = c[e + 4 >> 2] | 0;
     do if ((k | 0) == 256) {
      c[e + 4 >> 2] = t;
      k = c[s >> 2] | 0;
      c[e + 12 >> 2] = k;
      k = c[k + 4 >> 2] | 0;
      c[e + 8 >> 2] = k;
      Wa = c[e + 20 + (k << 2) >> 2] | 0;
      c[e + 16 >> 2] = Wa;
      Va = c[Wa + 52 >> 2] | 0;
      Wa = c[Wa + 56 >> 2] | 0;
      c[e + 1176 >> 2] = Z(Wa, Va) | 0;
      c[e + 1340 >> 2] = Va;
      c[e + 1344 >> 2] = Wa;
      c[e + 3380 >> 2] = 1;
     } else {
      if (!(c[e + 3380 >> 2] | 0)) {
       if ((k | 0) == (t | 0)) {
        k = u;
        break;
       }
       if (($ | 0) == (u | 0)) {
        c[e + 4 >> 2] = t;
        c[e + 12 >> 2] = c[s >> 2];
        k = u;
        break;
       }
       if ((y | 0) != 5) {
        k = 4;
        break q;
       }
       c[e + 4 >> 2] = t;
       k = c[s >> 2] | 0;
       c[e + 12 >> 2] = k;
       k = c[k + 4 >> 2] | 0;
       c[e + 8 >> 2] = k;
       Wa = c[e + 20 + (k << 2) >> 2] | 0;
       c[e + 16 >> 2] = Wa;
       Va = c[Wa + 52 >> 2] | 0;
       Wa = c[Wa + 56 >> 2] | 0;
       c[e + 1176 >> 2] = Z(Wa, Va) | 0;
       c[e + 1340 >> 2] = Va;
       c[e + 1344 >> 2] = Wa;
       c[e + 3380 >> 2] = 1;
       break;
      }
      c[e + 3380 >> 2] = 0;
      vb(c[e + 1212 >> 2] | 0);
      c[e + 1212 >> 2] = 0;
      vb(c[e + 1172 >> 2] | 0);
      c[e + 1172 >> 2] = 0;
      c[e + 1212 >> 2] = ub((c[e + 1176 >> 2] | 0) * 216 | 0) | 0;
      Wa = ub(c[e + 1176 >> 2] << 2) | 0;
      c[e + 1172 >> 2] = Wa;
      k = c[e + 1212 >> 2] | 0;
      if ((Wa | 0) == 0 | (k | 0) == 0) {
       k = 5;
       break q;
      }
      xb(k | 0, 0, (c[e + 1176 >> 2] | 0) * 216 | 0) | 0;
      q = c[e + 1212 >> 2] | 0;
      k = c[e + 16 >> 2] | 0;
      r = c[k + 52 >> 2] | 0;
      s = c[e + 1176 >> 2] | 0;
      if (!s) l = k; else {
       n = 0;
       o = 0;
       p = 0;
       while (1) {
        k = (n | 0) != 0;
        l = q + (o * 216 | 0) | 0;
        c[q + (o * 216 | 0) + 200 >> 2] = k ? l + -216 | 0 : 0;
        m = (p | 0) != 0;
        do if (m) {
         c[q + (o * 216 | 0) + 204 >> 2] = l + ((0 - r | 0) * 216 | 0);
         if (n >>> 0 >= (r + -1 | 0) >>> 0) {
          Xa = 507;
          break;
         }
         c[q + (o * 216 | 0) + 208 >> 2] = l + ((1 - r | 0) * 216 | 0);
        } else {
         c[q + (o * 216 | 0) + 204 >> 2] = 0;
         Xa = 507;
        } while (0);
        if ((Xa | 0) == 507) {
         Xa = 0;
         c[q + (o * 216 | 0) + 208 >> 2] = 0;
        }
        c[q + (o * 216 | 0) + 212 >> 2] = k & m ? l + (~r * 216 | 0) | 0 : 0;
        k = n + 1 | 0;
        o = o + 1 | 0;
        if ((o | 0) == (s | 0)) break; else {
         n = (k | 0) == (r | 0) ? 0 : k;
         p = ((k | 0) == (r | 0) & 1) + p | 0;
        }
       }
       l = c[e + 16 >> 2] | 0;
      }
      s : do if (!(c[e + 1216 >> 2] | 0)) {
       if ((c[l + 16 >> 2] | 0) == 2) {
        p = 1;
        break;
       }
       do if (c[l + 80 >> 2] | 0) {
        k = c[l + 84 >> 2] | 0;
        if (!(c[k + 920 >> 2] | 0)) break;
        if (!(c[k + 944 >> 2] | 0)) {
         p = 1;
         break s;
        }
       } while (0);
       p = 0;
      } else p = 1; while (0);
      r = Z(c[l + 56 >> 2] | 0, c[l + 52 >> 2] | 0) | 0;
      n = c[l + 88 >> 2] | 0;
      o = c[l + 44 >> 2] | 0;
      m = c[l + 12 >> 2] | 0;
      k = c[e + 1220 >> 2] | 0;
      do if (!k) q = e + 1248 | 0; else {
       if ((c[e + 1248 >> 2] | 0) == -1) {
        q = e + 1248 | 0;
        break;
       } else l = 0;
       do {
        vb(c[k + (l * 40 | 0) + 4 >> 2] | 0);
        k = c[e + 1220 >> 2] | 0;
        c[k + (l * 40 | 0) + 4 >> 2] = 0;
        l = l + 1 | 0;
       } while (l >>> 0 < ((c[e + 1248 >> 2] | 0) + 1 | 0) >>> 0);
       q = e + 1248 | 0;
      } while (0);
      vb(k);
      c[e + 1220 >> 2] = 0;
      vb(c[e + 1224 >> 2] | 0);
      c[e + 1224 >> 2] = 0;
      vb(c[e + 1232 >> 2] | 0);
      c[e + 1232 >> 2] = 0;
      c[e + 1256 >> 2] = 65535;
      k = o >>> 0 > 1 ? o : 1;
      c[e + 1244 >> 2] = k;
      c[q >> 2] = (p | 0) == 0 ? n : k;
      c[e + 1252 >> 2] = m;
      c[e + 1276 >> 2] = p;
      c[e + 1264 >> 2] = 0;
      c[e + 1260 >> 2] = 0;
      c[e + 1268 >> 2] = 0;
      k = ub(680) | 0;
      c[e + 1220 >> 2] = k;
      if (!k) {
       k = 5;
       break q;
      }
      xb(k | 0, 0, 680) | 0;
      if ((c[q >> 2] | 0) != -1) {
       m = 0;
       do {
        k = ub(r * 384 | 47) | 0;
        l = c[e + 1220 >> 2] | 0;
        c[l + (m * 40 | 0) + 4 >> 2] = k;
        if (!k) {
         k = 5;
         break q;
        }
        c[l + (m * 40 | 0) >> 2] = k + (0 - k & 15);
        m = m + 1 | 0;
       } while (m >>> 0 < ((c[q >> 2] | 0) + 1 | 0) >>> 0);
      }
      c[e + 1224 >> 2] = ub(68) | 0;
      Wa = ub((c[q >> 2] << 4) + 16 | 0) | 0;
      c[e + 1232 >> 2] = Wa;
      k = c[e + 1224 >> 2] | 0;
      if ((Wa | 0) == 0 | (k | 0) == 0) {
       k = 5;
       break q;
      }
      l = k;
      m = l + 68 | 0;
      do {
       a[l >> 0] = 0;
       l = l + 1 | 0;
      } while ((l | 0) < (m | 0));
      c[e + 1240 >> 2] = 0;
      c[e + 1236 >> 2] = 0;
      k = c[e + 8 >> 2] | 0;
     } while (0);
     if ((u | 0) == (k | 0)) break p;
     w = c[e + 16 >> 2] | 0;
     k = c[e >> 2] | 0;
     if (k >>> 0 < 32) v = c[e + 20 + (k << 2) >> 2] | 0; else v = 0;
     c[j >> 2] = 0;
     c[e + 3344 >> 2] = 1;
     t : do if ((y | 0) == 5) {
      s = c[e + 12 >> 2] | 0;
      c[rb + 628 >> 2] = c[rb >> 2];
      c[rb + 628 + 4 >> 2] = c[rb + 4 >> 2];
      c[rb + 628 + 8 >> 2] = c[rb + 8 >> 2];
      c[rb + 628 + 12 >> 2] = c[rb + 12 >> 2];
      c[rb + 628 + 16 >> 2] = c[rb + 16 >> 2];
      k = Na(rb + 628 | 0, rb + 648 | 0) | 0;
      u : do if (!k) {
       k = Na(rb + 628 | 0, rb + 648 | 0) | 0;
       if (k) {
        l = 1;
        break;
       }
       k = Na(rb + 628 | 0, rb + 648 | 0) | 0;
       if (k) {
        l = 1;
        break;
       }
       k = c[w + 12 >> 2] | 0;
       r = 0;
       while (1) if (!(k >>> r)) break; else r = r + 1 | 0;
       o = r + -1 | 0;
       t = rb + 628 + 4 | 0;
       m = c[t >> 2] | 0;
       p = c[rb + 628 + 12 >> 2] << 3;
       u = rb + 628 + 16 | 0;
       q = c[u >> 2] | 0;
       do if ((p - q | 0) > 31) {
        l = c[rb + 628 + 8 >> 2] | 0;
        k = d[m + 1 >> 0] << 16 | d[m >> 0] << 24 | d[m + 2 >> 0] << 8 | d[m + 3 >> 0];
        if (!l) {
         l = rb + 628 + 8 | 0;
         break;
        }
        k = (d[m + 4 >> 0] | 0) >>> (8 - l | 0) | k << l;
        l = rb + 628 + 8 | 0;
       } else {
        if ((p - q | 0) <= 0) {
         k = 0;
         l = rb + 628 + 8 | 0;
         break;
        }
        l = c[rb + 628 + 8 >> 2] | 0;
        k = d[m >> 0] << l + 24;
        if ((p - q + -8 + l | 0) > 0) {
         n = p - q + -8 + l | 0;
         l = l + 24 | 0;
        } else {
         l = rb + 628 + 8 | 0;
         break;
        }
        while (1) {
         m = m + 1 | 0;
         l = l + -8 | 0;
         k = d[m >> 0] << l | k;
         if ((n | 0) <= 8) {
          l = rb + 628 + 8 | 0;
          break;
         } else n = n + -8 | 0;
        }
       } while (0);
       c[u >> 2] = o + q;
       c[l >> 2] = o + q & 7;
       if ((o + q | 0) >>> 0 > p >>> 0) {
        k = 1;
        l = 1;
        break;
       }
       c[t >> 2] = (c[rb + 628 >> 2] | 0) + ((o + q | 0) >>> 3);
       if ((k >>> (33 - r | 0) | 0) == -1) {
        k = 1;
        l = 1;
        break;
       }
       k = Na(rb + 628 | 0, rb + 648 | 0) | 0;
       if (k) {
        l = 1;
        break;
       }
       k = c[w + 16 >> 2] | 0;
       do if (!k) {
        k = c[w + 20 >> 2] | 0;
        r = 0;
        while (1) if (!(k >>> r)) break; else r = r + 1 | 0;
        o = r + -1 | 0;
        m = c[t >> 2] | 0;
        p = c[rb + 628 + 12 >> 2] << 3;
        q = c[u >> 2] | 0;
        do if ((p - q | 0) > 31) {
         l = c[rb + 628 + 8 >> 2] | 0;
         k = d[m + 1 >> 0] << 16 | d[m >> 0] << 24 | d[m + 2 >> 0] << 8 | d[m + 3 >> 0];
         if (!l) {
          l = rb + 628 + 8 | 0;
          break;
         }
         k = (d[m + 4 >> 0] | 0) >>> (8 - l | 0) | k << l;
         l = rb + 628 + 8 | 0;
        } else {
         if ((p - q | 0) <= 0) {
          k = 0;
          l = rb + 628 + 8 | 0;
          break;
         }
         l = c[rb + 628 + 8 >> 2] | 0;
         k = d[m >> 0] << l + 24;
         if ((p - q + -8 + l | 0) > 0) {
          n = p - q + -8 + l | 0;
          l = l + 24 | 0;
         } else {
          l = rb + 628 + 8 | 0;
          break;
         }
         while (1) {
          m = m + 1 | 0;
          l = l + -8 | 0;
          k = d[m >> 0] << l | k;
          if ((n | 0) <= 8) {
           l = rb + 628 + 8 | 0;
           break;
          } else n = n + -8 | 0;
         }
        } while (0);
        c[u >> 2] = o + q;
        c[l >> 2] = o + q & 7;
        if ((o + q | 0) >>> 0 > p >>> 0) {
         k = 1;
         l = 1;
         break u;
        }
        c[t >> 2] = (c[rb + 628 >> 2] | 0) + ((o + q | 0) >>> 3);
        if ((k >>> (33 - r | 0) | 0) == -1) {
         k = 1;
         l = 1;
         break u;
        }
        if (!(c[s + 8 >> 2] | 0)) break;
        c[rb + 688 >> 2] = 0;
        k = Na(rb + 628 | 0, rb + 688 | 0) | 0;
        if ((c[rb + 688 >> 2] | 0) == -1) if (!k) Xa = 567; else Xa = 566; else if (!k) Xa = 566; else Xa = 567;
        if ((Xa | 0) == 566) {
         ja = c[w + 16 >> 2] | 0;
         Xa = 568;
         break;
        } else if ((Xa | 0) == 567) {
         k = 1;
         l = 1;
         break u;
        }
       } else {
        ja = k;
        Xa = 568;
       } while (0);
       do if ((Xa | 0) == 568) {
        if ((ja | 0) != 1) break;
        if (c[w + 24 >> 2] | 0) break;
        c[rb + 688 >> 2] = 0;
        k = Na(rb + 628 | 0, rb + 688 | 0) | 0;
        if ((c[rb + 688 >> 2] | 0) == -1) {
         if (!k) Xa = 573;
        } else if (k) Xa = 573;
        if ((Xa | 0) == 573) {
         k = 1;
         l = 1;
         break u;
        }
        if (!(c[s + 8 >> 2] | 0)) break;
        c[rb + 688 >> 2] = 0;
        k = Na(rb + 628 | 0, rb + 688 | 0) | 0;
        if ((c[rb + 688 >> 2] | 0) == -1) if (!k) Xa = 579; else Xa = 578; else if (!k) Xa = 578; else Xa = 579;
        if ((Xa | 0) == 578) break; else if ((Xa | 0) == 579) {
         k = 1;
         l = 1;
         break u;
        }
       } while (0);
       if ((c[s + 68 >> 2] | 0) != 0 ? (ka = Na(rb + 628 | 0, rb + 648 | 0) | 0, (ka | 0) != 0) : 0) {
        k = ka;
        l = 1;
        break;
       }
       m = c[t >> 2] | 0;
       o = c[rb + 628 + 12 >> 2] << 3;
       p = c[u >> 2] | 0;
       do if ((o - p | 0) > 31) {
        k = c[rb + 628 + 8 >> 2] | 0;
        l = d[m + 1 >> 0] << 16 | d[m >> 0] << 24 | d[m + 2 >> 0] << 8 | d[m + 3 >> 0];
        if (!k) {
         k = rb + 628 + 8 | 0;
         break;
        }
        l = (d[m + 4 >> 0] | 0) >>> (8 - k | 0) | l << k;
        k = rb + 628 + 8 | 0;
       } else {
        if ((o - p | 0) <= 0) {
         l = 0;
         k = rb + 628 + 8 | 0;
         break;
        }
        k = c[rb + 628 + 8 >> 2] | 0;
        l = d[m >> 0] << k + 24;
        if ((o - p + -8 + k | 0) > 0) {
         n = o - p + -8 + k | 0;
         k = k + 24 | 0;
        } else {
         k = rb + 628 + 8 | 0;
         break;
        }
        while (1) {
         m = m + 1 | 0;
         k = k + -8 | 0;
         l = d[m >> 0] << k | l;
         if ((n | 0) <= 8) {
          k = rb + 628 + 8 | 0;
          break;
         } else n = n + -8 | 0;
        }
       } while (0);
       c[u >> 2] = p + 1;
       c[k >> 2] = p + 1 & 7;
       if ((p + 1 | 0) >>> 0 > o >>> 0) k = 0; else {
        c[t >> 2] = (c[rb + 628 >> 2] | 0) + ((p + 1 | 0) >>> 3);
        k = 1;
       }
       l = k ? l >>> 31 : -1;
       k = (l | 0) == -1 & 1;
      } else l = 1; while (0);
      if (l | k) {
       Xa = 596;
       break;
      }
      if ((v | 0) == 0 | (c[e + 1276 >> 2] | 0) != 0) {
       Xa = 596;
       break;
      }
      if ((c[v + 52 >> 2] | 0) != (c[w + 52 >> 2] | 0)) {
       Xa = 596;
       break;
      }
      if ((c[v + 56 >> 2] | 0) != (c[w + 56 >> 2] | 0)) {
       Xa = 596;
       break;
      }
      if ((c[v + 88 >> 2] | 0) != (c[w + 88 >> 2] | 0)) {
       Xa = 596;
       break;
      }
      k = c[e + 1220 >> 2] | 0;
      if (!k) break;
      c[e + 1280 >> 2] = 1;
      while (1) {
       n = c[e + 1248 >> 2] | 0;
       o = 0;
       l = 2147483647;
       m = 0;
       do {
        if (c[k + (o * 40 | 0) + 24 >> 2] | 0) {
         pb = c[k + (o * 40 | 0) + 16 >> 2] | 0;
         qb = (pb | 0) < (l | 0);
         l = qb ? pb : l;
         m = qb ? k + (o * 40 | 0) | 0 : m;
        }
        o = o + 1 | 0;
       } while (o >>> 0 <= n >>> 0);
       if (!m) break t;
       qb = c[e + 1236 >> 2] | 0;
       pb = c[e + 1232 >> 2] | 0;
       c[pb + (qb << 4) >> 2] = c[m >> 2];
       c[pb + (qb << 4) + 12 >> 2] = c[m + 36 >> 2];
       c[pb + (qb << 4) + 4 >> 2] = c[m + 28 >> 2];
       c[pb + (qb << 4) + 8 >> 2] = c[m + 32 >> 2];
       c[e + 1236 >> 2] = qb + 1;
       c[m + 24 >> 2] = 0;
       if (!(c[m + 20 >> 2] | 0)) c[e + 1264 >> 2] = (c[e + 1264 >> 2] | 0) + -1;
       k = c[e + 1220 >> 2] | 0;
      }
     } else Xa = 596; while (0);
     if ((Xa | 0) == 596) c[e + 1280 >> 2] = 0;
     c[e >> 2] = c[e + 8 >> 2];
     e = 2;
     i = rb;
     return e | 0;
    } else k = 4; while (0);
    c[e + 4 >> 2] = 256;
    c[e + 12 >> 2] = 0;
    c[e + 8 >> 2] = 32;
    c[e + 16 >> 2] = 0;
    c[e + 3380 >> 2] = 0;
    e = k;
    i = rb;
    return e | 0;
   } while (0);
   if (c[e + 3380 >> 2] | 0) {
    e = 3;
    i = rb;
    return e | 0;
   }
   o = c[e + 16 >> 2] | 0;
   s = c[e + 12 >> 2] | 0;
   xb(e + 2356 | 0, 0, 988) | 0;
   t = Z(c[o + 56 >> 2] | 0, c[o + 52 >> 2] | 0) | 0;
   v : do if (((Na(rb, rb + 628 | 0) | 0) == 0 ? (Wa = c[rb + 628 >> 2] | 0, c[e + 2356 >> 2] = Wa, Wa >>> 0 < t >>> 0) : 0) ? (Na(rb, rb + 628 | 0) | 0) == 0 : 0) {
    Wa = c[rb + 628 >> 2] | 0;
    c[e + 2360 >> 2] = Wa;
    switch (Wa | 0) {
    case 7:
    case 2:
     break;
    case 5:
    case 0:
     {
      if ((y | 0) == 5) break v;
      if (!(c[o + 44 >> 2] | 0)) break v;
      break;
     }
    default:
     break v;
    }
    if ((Na(rb, rb + 628 | 0) | 0) == 0 ? (Wa = c[rb + 628 >> 2] | 0, c[e + 2364 >> 2] = Wa, (Wa | 0) == (c[s >> 2] | 0)) : 0) {
     k = c[o + 12 >> 2] | 0;
     l = 0;
     while (1) if (!(k >>> l)) break; else l = l + 1 | 0;
     k = Ma(rb, l + -1 | 0) | 0;
     if ((k | 0) == -1) break;
     if ((k | 0) != 0 & (y | 0) == 5) break;
     c[e + 2368 >> 2] = k;
     if ((y | 0) == 5) {
      if (Na(rb, rb + 628 | 0) | 0) break;
      Wa = c[rb + 628 >> 2] | 0;
      c[e + 2372 >> 2] = Wa;
      if (Wa >>> 0 > 65535) break;
     }
     k = c[o + 16 >> 2] | 0;
     if (!k) {
      k = c[o + 20 >> 2] | 0;
      l = 0;
      while (1) if (!(k >>> l)) break; else l = l + 1 | 0;
      k = Ma(rb, l + -1 | 0) | 0;
      if ((k | 0) == -1) break;
      c[e + 2376 >> 2] = k;
      do if (c[s + 8 >> 2] | 0) {
       c[rb + 688 >> 2] = 0;
       k = Na(rb, rb + 688 | 0) | 0;
       l = c[rb + 688 >> 2] | 0;
       do if ((l | 0) == -1) if (!k) Xa = 633; else {
        ea = -2147483648;
        Xa = 634;
       } else {
        if (k) {
         Xa = 633;
         break;
        }
        ea = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
        Xa = 634;
       } while (0);
       if ((Xa | 0) == 633) break v; else if ((Xa | 0) == 634) {
        c[e + 2380 >> 2] = ea;
        break;
       }
      } while (0);
      if ((y | 0) == 5) {
       k = c[e + 2376 >> 2] | 0;
       if (k >>> 0 > (c[o + 20 >> 2] | 0) >>> 1 >>> 0) break;
       Wa = c[e + 2380 >> 2] | 0;
       if ((k | 0) != (0 - ((Wa | 0) > 0 ? 0 : Wa) | 0)) break;
      }
      k = c[o + 16 >> 2] | 0;
     }
     do if ((k | 0) == 1) {
      if (c[o + 24 >> 2] | 0) break;
      c[rb + 688 >> 2] = 0;
      k = Na(rb, rb + 688 | 0) | 0;
      l = c[rb + 688 >> 2] | 0;
      do if ((l | 0) == -1) if (!k) Xa = 645; else fa = -2147483648; else {
       if (k) {
        Xa = 645;
        break;
       }
       fa = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
      } while (0);
      if ((Xa | 0) == 645) break v;
      c[e + 2384 >> 2] = fa;
      do if (c[s + 8 >> 2] | 0) {
       c[rb + 688 >> 2] = 0;
       k = Na(rb, rb + 688 | 0) | 0;
       l = c[rb + 688 >> 2] | 0;
       do if ((l | 0) == -1) if (!k) Xa = 651; else {
        ga = -2147483648;
        Xa = 652;
       } else {
        if (k) {
         Xa = 651;
         break;
        }
        ga = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
        Xa = 652;
       } while (0);
       if ((Xa | 0) == 651) break v; else if ((Xa | 0) == 652) {
        c[e + 2388 >> 2] = ga;
        break;
       }
      } while (0);
      if ((y | 0) != 5) break;
      Va = c[e + 2384 >> 2] | 0;
      Wa = (c[o + 32 >> 2] | 0) + Va + (c[e + 2388 >> 2] | 0) | 0;
      if (((Va | 0) < (Wa | 0) ? Va : Wa) | 0) break v;
     } while (0);
     if (c[s + 68 >> 2] | 0) {
      if (Na(rb, rb + 628 | 0) | 0) break;
      Wa = c[rb + 628 >> 2] | 0;
      c[e + 2392 >> 2] = Wa;
      if (Wa >>> 0 > 127) break;
     }
     k = c[e + 2360 >> 2] | 0;
     switch (k | 0) {
     case 5:
     case 0:
      {
       k = Ma(rb, 1) | 0;
       if ((k | 0) == -1) break v;
       c[e + 2396 >> 2] = k;
       if (!k) {
        k = c[s + 48 >> 2] | 0;
        if (k >>> 0 > 16) break v;
        c[e + 2400 >> 2] = k;
       } else {
        if (Na(rb, rb + 628 | 0) | 0) break v;
        k = c[rb + 628 >> 2] | 0;
        if (k >>> 0 > 15) break v;
        c[e + 2400 >> 2] = k + 1;
       }
       k = c[e + 2360 >> 2] | 0;
       break;
      }
     default:
      {}
     }
     w : do switch (k | 0) {
     case 5:
     case 0:
      {
       m = c[e + 2400 >> 2] | 0;
       n = c[o + 12 >> 2] | 0;
       k = Ma(rb, 1) | 0;
       x : do if ((k | 0) != -1) {
        c[e + 2424 >> 2] = k;
        if (k) {
         k = 0;
         while (1) {
          if (Na(rb, rb + 648 | 0) | 0) break x;
          l = c[rb + 648 >> 2] | 0;
          if (l >>> 0 > 3) break x;
          c[e + 2428 + (k * 12 | 0) >> 2] = l;
          if (l >>> 0 < 2) {
           if (Na(rb, rb + 688 | 0) | 0) break x;
           l = c[rb + 688 >> 2] | 0;
           if (l >>> 0 >= n >>> 0) break x;
           c[e + 2428 + (k * 12 | 0) + 4 >> 2] = l + 1;
          } else {
           if ((l | 0) != 2) break;
           if (Na(rb, rb + 688 | 0) | 0) break x;
           c[e + 2428 + (k * 12 | 0) + 8 >> 2] = c[rb + 688 >> 2];
          }
          k = k + 1 | 0;
          if (k >>> 0 > m >>> 0) break x;
         }
         if (!k) break;
        }
        break w;
       } while (0);
       break v;
      }
     default:
      {}
     } while (0);
     do if (z) {
      r = c[o + 44 >> 2] | 0;
      k = Ma(rb, 1) | 0;
      y : do if ((y | 0) == 5) {
       if ((k | 0) == -1) {
        Xa = 708;
        break;
       }
       c[e + 2632 >> 2] = k;
       k = Ma(rb, 1) | 0;
       if ((k | 0) == -1) {
        Xa = 708;
        break;
       }
       c[e + 2636 >> 2] = k;
       if ((r | 0) != 0 | (k | 0) == 0) Xa = 709; else Xa = 708;
      } else {
       if ((k | 0) == -1) {
        Xa = 708;
        break;
       }
       c[e + 2640 >> 2] = k;
       if (!k) {
        Xa = 709;
        break;
       }
       m = 0;
       n = 0;
       o = 0;
       p = 0;
       q = 0;
       while (1) {
        if (m >>> 0 > ((r << 1) + 2 | 0) >>> 0) {
         Xa = 708;
         break y;
        }
        if (Na(rb, rb + 648 | 0) | 0) {
         Xa = 708;
         break y;
        }
        l = c[rb + 648 >> 2] | 0;
        if (l >>> 0 > 6) {
         Xa = 708;
         break y;
        }
        c[e + 2644 + (m * 20 | 0) >> 2] = l;
        if ((l & -3 | 0) == 1) {
         if (Na(rb, rb + 688 | 0) | 0) {
          Xa = 708;
          break y;
         }
         c[e + 2644 + (m * 20 | 0) + 4 >> 2] = (c[rb + 688 >> 2] | 0) + 1;
        }
        switch (l | 0) {
        case 2:
         {
          if (Na(rb, rb + 688 | 0) | 0) {
           Xa = 708;
           break y;
          }
          c[e + 2644 + (m * 20 | 0) + 8 >> 2] = c[rb + 688 >> 2];
          ha = o;
          break;
         }
        case 3:
        case 6:
         {
          if (Na(rb, rb + 688 | 0) | 0) {
           Xa = 708;
           break y;
          }
          c[e + 2644 + (m * 20 | 0) + 12 >> 2] = c[rb + 688 >> 2];
          if ((l | 0) == 4) Xa = 702; else ha = o;
          break;
         }
        case 4:
         {
          Xa = 702;
          break;
         }
        default:
         ha = o;
        }
        if ((Xa | 0) == 702) {
         Xa = 0;
         if (Na(rb, rb + 688 | 0) | 0) {
          Xa = 708;
          break y;
         }
         k = c[rb + 688 >> 2] | 0;
         if (k >>> 0 > r >>> 0) {
          Xa = 708;
          break y;
         }
         c[e + 2644 + (m * 20 | 0) + 16 >> 2] = (k | 0) == 0 ? 65535 : k + -1 | 0;
         ha = o + 1 | 0;
        }
        p = ((l | 0) == 5 & 1) + p | 0;
        n = ((l + -1 | 0) >>> 0 < 3 & 1) + n | 0;
        q = ((l | 0) == 6 & 1) + q | 0;
        if (!l) break; else {
         m = m + 1 | 0;
         o = ha;
        }
       }
       if ((p | ha | q) >>> 0 > 1) {
        Xa = 708;
        break;
       }
       if ((p | 0) != 0 & (n | 0) != 0) Xa = 708; else Xa = 709;
      } while (0);
      if ((Xa | 0) == 708) break v; else if ((Xa | 0) == 709) break;
     } while (0);
     c[rb + 688 >> 2] = 0;
     k = Na(rb, rb + 688 | 0) | 0;
     l = c[rb + 688 >> 2] | 0;
     do if ((l | 0) == -1) if (!k) Xa = 714; else ia = -2147483648; else {
      if (k) {
       Xa = 714;
       break;
      }
      ia = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
     } while (0);
     if ((Xa | 0) == 714) break;
     c[e + 2404 >> 2] = ia;
     if (((c[s + 52 >> 2] | 0) + ia | 0) >>> 0 > 51) break;
     z : do if (c[s + 60 >> 2] | 0) {
      if (Na(rb, rb + 628 | 0) | 0) break v;
      k = c[rb + 628 >> 2] | 0;
      c[e + 2408 >> 2] = k;
      if (k >>> 0 > 2) break v;
      if ((k | 0) == 1) break;
      c[rb + 688 >> 2] = 0;
      k = Na(rb, rb + 688 | 0) | 0;
      l = c[rb + 688 >> 2] | 0;
      do if ((l | 0) == -1) {
       if (!k) break;
       break v;
      } else {
       if (k) break;
       k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
       if ((k + 6 | 0) >>> 0 > 12) break v;
       c[e + 2412 >> 2] = k << 1;
       c[rb + 688 >> 2] = 0;
       k = Na(rb, rb + 688 | 0) | 0;
       l = c[rb + 688 >> 2] | 0;
       do if ((l | 0) == -1) {
        if (!k) break;
        break v;
       } else {
        if (k) break;
        k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
        if ((k + 6 | 0) >>> 0 > 12) break v;
        c[e + 2416 >> 2] = k << 1;
        break z;
       } while (0);
       break v;
      } while (0);
      break v;
     } while (0);
     do if ((c[s + 12 >> 2] | 0) >>> 0 > 1) {
      if (((c[s + 16 >> 2] | 0) + -3 | 0) >>> 0 >= 3) break;
      m = c[s + 36 >> 2] | 0;
      m = (((t >>> 0) % (m >>> 0) | 0 | 0) == 0 ? 1 : 2) + ((t >>> 0) / (m >>> 0) | 0) | 0;
      l = 0;
      while (1) {
       k = l + 1 | 0;
       if (!(-1 << k & m)) break; else l = k;
      }
      k = Ma(rb, ((1 << l) + -1 & m | 0) == 0 ? l : k) | 0;
      c[rb + 628 >> 2] = k;
      if ((k | 0) == -1) break v;
      c[e + 2420 >> 2] = k;
      Wa = c[s + 36 >> 2] | 0;
      if (k >>> 0 > (((t + -1 + Wa | 0) >>> 0) / (Wa >>> 0) | 0) >>> 0) break v;
     } while (0);
     if (!(c[e + 1188 >> 2] | 0)) {
      do if ((y | 0) != 5) {
       s = c[e + 2368 >> 2] | 0;
       Wa = c[(c[e + 16 >> 2] | 0) + 48 >> 2] | 0;
       c[e + 1236 >> 2] = 0;
       c[e + 1240 >> 2] = 0;
       if (!Wa) break;
       t = c[e + 1268 >> 2] | 0;
       do if ((t | 0) != (s | 0)) {
        k = c[e + 1252 >> 2] | 0;
        if ((((t + 1 | 0) >>> 0) % (k >>> 0) | 0 | 0) == (s | 0)) {
         Xa = 780;
         break;
        }
        u = c[(c[e + 1220 >> 2] | 0) + ((c[e + 1248 >> 2] | 0) * 40 | 0) >> 2] | 0;
        n = k;
        r = ((t + 1 | 0) >>> 0) % (k >>> 0) | 0;
        A : while (1) {
         k = c[e + 1260 >> 2] | 0;
         if (!k) o = 0; else {
          l = c[e + 1220 >> 2] | 0;
          m = 0;
          do {
           if (((c[l + (m * 40 | 0) + 20 >> 2] | 0) + -1 | 0) >>> 0 < 2) {
            Xa = c[l + (m * 40 | 0) + 12 >> 2] | 0;
            c[(c[e + 1220 >> 2] | 0) + (m * 40 | 0) + 8 >> 2] = Xa - (Xa >>> 0 > r >>> 0 ? n : 0);
           }
           m = m + 1 | 0;
          } while ((m | 0) != (k | 0));
          o = k;
         }
         do if (o >>> 0 >= (c[e + 1244 >> 2] | 0) >>> 0) {
          if (!o) {
           la = 3;
           Xa = 1499;
           break A;
          }
          p = c[e + 1220 >> 2] | 0;
          m = 0;
          k = -1;
          l = 0;
          while (1) {
           if (((c[p + (m * 40 | 0) + 20 >> 2] | 0) + -1 | 0) >>> 0 < 2) {
            Xa = c[p + (m * 40 | 0) + 8 >> 2] | 0;
            Wa = (k | 0) == -1 | (Xa | 0) < (l | 0);
            n = Wa ? m : k;
            l = Wa ? Xa : l;
           } else n = k;
           m = m + 1 | 0;
           if ((m | 0) == (o | 0)) break; else k = n;
          }
          if ((n | 0) <= -1) {
           la = 3;
           Xa = 1499;
           break A;
          }
          c[p + (n * 40 | 0) + 20 >> 2] = 0;
          k = o + -1 | 0;
          c[e + 1260 >> 2] = k;
          if (c[p + (n * 40 | 0) + 24 >> 2] | 0) break;
          c[e + 1264 >> 2] = (c[e + 1264 >> 2] | 0) + -1;
         } while (0);
         l = c[e + 1264 >> 2] | 0;
         q = c[e + 1248 >> 2] | 0;
         if (l >>> 0 >= q >>> 0) {
          if (c[e + 1276 >> 2] | 0) {
           Xa = 770;
           break;
          }
          do {
           o = c[e + 1220 >> 2] | 0;
           p = 0;
           m = 2147483647;
           n = 0;
           do {
            if (c[o + (p * 40 | 0) + 24 >> 2] | 0) {
             Wa = c[o + (p * 40 | 0) + 16 >> 2] | 0;
             Xa = (Wa | 0) < (m | 0);
             m = Xa ? Wa : m;
             n = Xa ? o + (p * 40 | 0) | 0 : n;
            }
            p = p + 1 | 0;
           } while (p >>> 0 <= q >>> 0);
           do if (n) {
            Xa = c[e + 1236 >> 2] | 0;
            Wa = c[e + 1232 >> 2] | 0;
            c[Wa + (Xa << 4) >> 2] = c[n >> 2];
            c[Wa + (Xa << 4) + 12 >> 2] = c[n + 36 >> 2];
            c[Wa + (Xa << 4) + 4 >> 2] = c[n + 28 >> 2];
            c[Wa + (Xa << 4) + 8 >> 2] = c[n + 32 >> 2];
            c[e + 1236 >> 2] = Xa + 1;
            c[n + 24 >> 2] = 0;
            if (c[n + 20 >> 2] | 0) break;
            l = l + -1 | 0;
            c[e + 1264 >> 2] = l;
           } while (0);
          } while (l >>> 0 >= q >>> 0);
         }
         n = c[e + 1220 >> 2] | 0;
         c[n + (q * 40 | 0) + 20 >> 2] = 1;
         c[n + (q * 40 | 0) + 12 >> 2] = r;
         c[n + (q * 40 | 0) + 8 >> 2] = r;
         c[n + (q * 40 | 0) + 16 >> 2] = 0;
         c[n + (q * 40 | 0) + 24 >> 2] = 0;
         c[e + 1264 >> 2] = l + 1;
         c[e + 1260 >> 2] = k + 1;
         _a(n, q + 1 | 0);
         n = c[e + 1252 >> 2] | 0;
         r = ((r + 1 | 0) >>> 0) % (n >>> 0) | 0;
         if ((r | 0) == (s | 0)) {
          Xa = 772;
          break;
         }
        }
        if ((Xa | 0) == 770) while (1) {} else if ((Xa | 0) == 772) {
         k = c[e + 1236 >> 2] | 0;
         B : do if (k) {
          l = c[e + 1232 >> 2] | 0;
          n = c[e + 1248 >> 2] | 0;
          o = c[e + 1220 >> 2] | 0;
          p = c[o + (n * 40 | 0) >> 2] | 0;
          m = 0;
          while (1) {
           if ((c[l + (m << 4) >> 2] | 0) == (p | 0)) break;
           m = m + 1 | 0;
           if (m >>> 0 >= k >>> 0) break B;
          }
          if (!n) break; else l = 0;
          while (1) {
           k = o + (l * 40 | 0) | 0;
           l = l + 1 | 0;
           if ((c[k >> 2] | 0) == (u | 0)) break;
           if (l >>> 0 >= n >>> 0) break B;
          }
          c[k >> 2] = p;
          c[o + (n * 40 | 0) >> 2] = u;
         } while (0);
         if (z) {
          Xa = 784;
          break;
         }
         ma = c[e + 1268 >> 2] | 0;
         break;
        } else if ((Xa | 0) == 1499) {
         i = rb;
         return la | 0;
        }
       } else Xa = 780; while (0);
       do if ((Xa | 0) == 780) {
        if (!z) {
         ma = t;
         break;
        }
        if ((t | 0) == (s | 0)) la = 3; else {
         Xa = 784;
         break;
        }
        i = rb;
        return la | 0;
       } while (0);
       if ((Xa | 0) == 784) {
        c[e + 1268 >> 2] = s;
        break;
       }
       if ((ma | 0) == (s | 0)) break;
       Wa = c[e + 1252 >> 2] | 0;
       c[e + 1268 >> 2] = ((s + -1 + Wa | 0) >>> 0) % (Wa >>> 0) | 0;
      } while (0);
      Wa = (c[e + 1220 >> 2] | 0) + ((c[e + 1248 >> 2] | 0) * 40 | 0) | 0;
      c[e + 1228 >> 2] = Wa;
      c[e + 1336 >> 2] = c[Wa >> 2];
     }
     yb(e + 1368 | 0, e + 2356 | 0, 988) | 0;
     c[e + 1188 >> 2] = 1;
     c[e + 1360 >> 2] = y;
     c[e + 1360 + 4 >> 2] = z;
     k = c[e + 1432 >> 2] | 0;
     y = c[e + 1172 >> 2] | 0;
     m = c[e + 12 >> 2] | 0;
     g = c[e + 16 >> 2] | 0;
     x = c[g + 52 >> 2] | 0;
     g = c[g + 56 >> 2] | 0;
     t = Z(g, x) | 0;
     s = c[m + 12 >> 2] | 0;
     C : do if ((s | 0) == 1) xb(y | 0, 0, t << 2 | 0) | 0; else {
      l = c[m + 16 >> 2] | 0;
      do if ((l + -3 | 0) >>> 0 < 3) {
       k = Z(c[m + 36 >> 2] | 0, k) | 0;
       k = k >>> 0 < t >>> 0 ? k : t;
       if ((l & -2 | 0) != 4) {
        p = 0;
        w = k;
        break;
       }
       p = (c[m + 32 >> 2] | 0) == 0 ? k : t - k | 0;
       w = k;
      } else {
       p = 0;
       w = 0;
      } while (0);
      switch (l | 0) {
      case 0:
       {
        p = c[m + 20 >> 2] | 0;
        if (!t) break C; else {
         k = 0;
         q = 0;
        }
        while (1) {
         while (1) if (k >>> 0 < s >>> 0) break; else k = 0;
         o = p + (k << 2) | 0;
         l = c[o >> 2] | 0;
         D : do if (!l) l = 0; else {
          n = 0;
          do {
           m = n + q | 0;
           if (m >>> 0 >= t >>> 0) break D;
           c[y + (m << 2) >> 2] = k;
           n = n + 1 | 0;
           l = c[o >> 2] | 0;
          } while (n >>> 0 < l >>> 0);
         } while (0);
         q = l + q | 0;
         if (q >>> 0 >= t >>> 0) break; else k = k + 1 | 0;
        }
        break;
       }
      case 1:
       {
        if (!t) break C; else k = 0;
        do {
         c[y + (k << 2) >> 2] = ((((Z((k >>> 0) / (x >>> 0) | 0, s) | 0) >>> 1) + ((k >>> 0) % (x >>> 0) | 0) | 0) >>> 0) % (s >>> 0) | 0;
         k = k + 1 | 0;
        } while ((k | 0) != (t | 0));
        break;
       }
      case 2:
       {
        r = c[m + 24 >> 2] | 0;
        q = c[m + 28 >> 2] | 0;
        if (t) {
         k = 0;
         do {
          c[y + (k << 2) >> 2] = s + -1;
          k = k + 1 | 0;
         } while ((k | 0) != (t | 0));
         if (!(s + -1 | 0)) break C;
        }
        o = s + -2 | 0;
        while (1) {
         k = c[r + (o << 2) >> 2] | 0;
         p = c[q + (o << 2) >> 2] | 0;
         E : do if (((k >>> 0) / (x >>> 0) | 0) >>> 0 <= ((p >>> 0) / (x >>> 0) | 0) >>> 0) {
          if (((k >>> 0) % (x >>> 0) | 0) >>> 0 > ((p >>> 0) % (x >>> 0) | 0) >>> 0) {
           k = (k >>> 0) / (x >>> 0) | 0;
           while (1) {
            k = k + 1 | 0;
            if (k >>> 0 > ((p >>> 0) / (x >>> 0) | 0) >>> 0) break E;
           }
          } else n = (k >>> 0) / (x >>> 0) | 0;
          do {
           l = Z(n, x) | 0;
           m = (k >>> 0) % (x >>> 0) | 0;
           do {
            c[y + (m + l << 2) >> 2] = o;
            m = m + 1 | 0;
           } while (m >>> 0 <= ((p >>> 0) % (x >>> 0) | 0) >>> 0);
           n = n + 1 | 0;
          } while (n >>> 0 <= ((p >>> 0) / (x >>> 0) | 0) >>> 0);
         } while (0);
         if (!o) break; else o = o + -1 | 0;
        }
        break;
       }
      case 3:
       {
        v = c[m + 32 >> 2] | 0;
        if (t) {
         k = 0;
         do {
          c[y + (k << 2) >> 2] = 1;
          k = k + 1 | 0;
         } while ((k | 0) != (t | 0));
        }
        if (!w) break C;
        s = (g - v | 0) >>> 1;
        u = 0;
        l = (x - v | 0) >>> 1;
        m = (x - v | 0) >>> 1;
        n = (g - v | 0) >>> 1;
        o = (x - v | 0) >>> 1;
        p = v + -1 | 0;
        q = (g - v | 0) >>> 1;
        r = v;
        while (1) {
         k = y + ((Z(q, x) | 0) + o << 2) | 0;
         t = (c[k >> 2] | 0) == 1;
         if (t) c[k >> 2] = 0;
         do if (!((p | 0) == -1 & (o | 0) == (l | 0))) {
          if ((p | 0) == 1 & (o | 0) == (m | 0)) {
           o = m + 1 | 0;
           o = (o | 0) < (x + -1 | 0) ? o : x + -1 | 0;
           k = s;
           m = o;
           p = 0;
           r = 1 - (v << 1) | 0;
           break;
          }
          if ((r | 0) == -1 & (q | 0) == (n | 0)) {
           q = n + -1 | 0;
           q = (q | 0) > 0 ? q : 0;
           k = s;
           n = q;
           p = 1 - (v << 1) | 0;
           r = 0;
           break;
          }
          if ((r | 0) == 1 & (q | 0) == (s | 0)) {
           q = s + 1 | 0;
           q = (q | 0) < (g + -1 | 0) ? q : g + -1 | 0;
           k = q;
           p = (v << 1) + -1 | 0;
           r = 0;
           break;
          } else {
           k = s;
           o = o + p | 0;
           q = q + r | 0;
           break;
          }
         } else {
          o = l + -1 | 0;
          o = (o | 0) > 0 ? o : 0;
          k = s;
          l = o;
          p = 0;
          r = (v << 1) + -1 | 0;
         } while (0);
         u = (t & 1) + u | 0;
         if (u >>> 0 >= w >>> 0) break; else s = k;
        }
        break;
       }
      case 4:
       {
        k = c[m + 32 >> 2] | 0;
        if (!t) break C;
        l = 0;
        do {
         c[y + (l << 2) >> 2] = l >>> 0 < p >>> 0 ? k : 1 - k | 0;
         l = l + 1 | 0;
        } while ((l | 0) != (t | 0));
        break;
       }
      case 5:
       {
        k = c[m + 32 >> 2] | 0;
        if (!x) break C;
        if (!g) break C; else {
         m = 0;
         n = 0;
        }
        while (1) {
         l = 0;
         o = n;
         while (1) {
          Wa = y + ((Z(l, x) | 0) + m << 2) | 0;
          c[Wa >> 2] = o >>> 0 < p >>> 0 ? k : 1 - k | 0;
          l = l + 1 | 0;
          if ((l | 0) == (g | 0)) break; else o = o + 1 | 0;
         }
         m = m + 1 | 0;
         if ((m | 0) == (x | 0)) break; else n = n + g | 0;
        }
        break;
       }
      default:
       {
        if (!t) break C;
        k = c[m + 44 >> 2] | 0;
        l = 0;
        do {
         c[y + (l << 2) >> 2] = c[k + (l << 2) >> 2];
         l = l + 1 | 0;
        } while ((l | 0) != (t | 0));
       }
      }
     } while (0);
     o = c[e + 1260 >> 2] | 0;
     do if (!o) {
      l = c[e + 1380 >> 2] | 0;
      p = c[e + 1412 >> 2] | 0;
      w = e + 1412 | 0;
     } else {
      k = 0;
      do {
       c[(c[e + 1224 >> 2] | 0) + (k << 2) >> 2] = (c[e + 1220 >> 2] | 0) + (k * 40 | 0);
       k = k + 1 | 0;
      } while ((k | 0) != (o | 0));
      l = c[e + 1380 >> 2] | 0;
      p = c[e + 1412 >> 2] | 0;
      if (!o) {
       w = e + 1412 | 0;
       break;
      }
      m = c[e + 1220 >> 2] | 0;
      n = 0;
      do {
       if (((c[m + (n * 40 | 0) + 20 >> 2] | 0) + -1 | 0) >>> 0 < 2) {
        k = c[m + (n * 40 | 0) + 12 >> 2] | 0;
        if (k >>> 0 > l >>> 0) k = k - (c[e + 1252 >> 2] | 0) | 0;
        c[(c[e + 1220 >> 2] | 0) + (n * 40 | 0) + 8 >> 2] = k;
       }
       n = n + 1 | 0;
      } while ((n | 0) != (o | 0));
      w = e + 1412 | 0;
     } while (0);
     F : do if (c[e + 1436 >> 2] | 0) {
      k = c[e + 1440 >> 2] | 0;
      if (k >>> 0 >= 3) break;
      r = l;
      s = 0;
      G : while (1) {
       H : do if (k >>> 0 < 2) {
        m = c[e + 1440 + (s * 12 | 0) + 4 >> 2] | 0;
        do if (!k) {
         k = r - m | 0;
         if ((k | 0) >= 0) break;
         k = (c[e + 1252 >> 2] | 0) + k | 0;
        } else {
         Wa = m + r | 0;
         k = c[e + 1252 >> 2] | 0;
         k = Wa - ((Wa | 0) < (k | 0) ? 0 : k) | 0;
        } while (0);
        if (k >>> 0 > l >>> 0) q = k - (c[e + 1252 >> 2] | 0) | 0; else q = k;
        m = c[e + 1244 >> 2] | 0;
        if (!m) {
         la = 3;
         Xa = 1499;
         break G;
        }
        n = c[e + 1220 >> 2] | 0;
        r = 0;
        while (1) {
         o = c[n + (r * 40 | 0) + 20 >> 2] | 0;
         if ((o + -1 | 0) >>> 0 < 2 ? (c[n + (r * 40 | 0) + 8 >> 2] | 0) == (q | 0) : 0) {
          q = r;
          r = k;
          break H;
         }
         r = r + 1 | 0;
         if (r >>> 0 >= m >>> 0) {
          la = 3;
          Xa = 1499;
          break G;
         }
        }
       } else {
        k = c[e + 1440 + (s * 12 | 0) + 8 >> 2] | 0;
        m = c[e + 1244 >> 2] | 0;
        if (!m) {
         la = 3;
         Xa = 1499;
         break G;
        }
        n = c[e + 1220 >> 2] | 0;
        q = 0;
        while (1) {
         if ((c[n + (q * 40 | 0) + 20 >> 2] | 0) == 3 ? (c[n + (q * 40 | 0) + 8 >> 2] | 0) == (k | 0) : 0) {
          o = 3;
          break H;
         }
         q = q + 1 | 0;
         if (q >>> 0 >= m >>> 0) {
          la = 3;
          Xa = 1499;
          break G;
         }
        }
       } while (0);
       if (!(o >>> 0 > 1 & (q | 0) > -1)) {
        la = 3;
        Xa = 1499;
        break;
       }
       if (s >>> 0 < p >>> 0) {
        k = p;
        do {
         Wa = k;
         k = k + -1 | 0;
         Va = c[e + 1224 >> 2] | 0;
         c[Va + (Wa << 2) >> 2] = c[Va + (k << 2) >> 2];
        } while (k >>> 0 > s >>> 0);
        k = c[e + 1220 >> 2] | 0;
       } else k = n;
       c[(c[e + 1224 >> 2] | 0) + (s << 2) >> 2] = k + (q * 40 | 0);
       s = s + 1 | 0;
       if (s >>> 0 <= p >>> 0) {
        o = s;
        k = s;
        do {
         m = c[e + 1224 >> 2] | 0;
         n = c[m + (o << 2) >> 2] | 0;
         if ((n | 0) != ((c[e + 1220 >> 2] | 0) + (q * 40 | 0) | 0)) {
          c[m + (k << 2) >> 2] = n;
          k = k + 1 | 0;
         }
         o = o + 1 | 0;
        } while (o >>> 0 <= p >>> 0);
       }
       k = c[e + 1440 + (s * 12 | 0) >> 2] | 0;
       if (k >>> 0 >= 3) break F;
      }
      if ((Xa | 0) == 1499) {
       i = rb;
       return la | 0;
      }
     } while (0);
     u = c[e + 3376 >> 2] | 0;
     t = c[e + 1368 >> 2] | 0;
     c[rb + 192 >> 2] = 0;
     c[e + 1192 >> 2] = (c[e + 1192 >> 2] | 0) + 1;
     c[e + 1200 >> 2] = 0;
     c[rb + 188 >> 2] = (c[e + 1416 >> 2] | 0) + (c[(c[e + 12 >> 2] | 0) + 52 >> 2] | 0);
     q = c[e + 1212 >> 2] | 0;
     m = 0;
     v = 0;
     n = 0;
     I : while (1) {
      if ((c[e + 1404 >> 2] | 0) == 0 ? (c[q + (t * 216 | 0) + 196 >> 2] | 0) != 0 : 0) {
       ua = 1;
       break;
      }
      l = c[(c[e + 12 >> 2] | 0) + 56 >> 2] | 0;
      Ua = c[e + 1420 >> 2] | 0;
      Va = c[e + 1424 >> 2] | 0;
      Wa = c[e + 1428 >> 2] | 0;
      c[q + (t * 216 | 0) + 4 >> 2] = c[e + 1192 >> 2];
      c[q + (t * 216 | 0) + 8 >> 2] = Ua;
      c[q + (t * 216 | 0) + 12 >> 2] = Va;
      c[q + (t * 216 | 0) + 16 >> 2] = Wa;
      c[q + (t * 216 | 0) + 24 >> 2] = l;
      l = c[e + 1372 >> 2] | 0;
      do if ((l | 0) != 2) {
       if ((n | 0) != 0 | (l | 0) == 7) {
        Xa = 891;
        break;
       }
       k = Na(rb, rb + 192 | 0) | 0;
       if (k) {
        ua = k;
        break I;
       }
       k = c[rb + 192 >> 2] | 0;
       if (k >>> 0 > ((c[e + 1176 >> 2] | 0) - t | 0) >>> 0) {
        ua = 1;
        break I;
       }
       if (!k) {
        ya = c[e + 1212 >> 2] | 0;
        za = c[e + 1372 >> 2] | 0;
        Xa = 893;
        break;
       } else {
        xb(u + 12 | 0, 0, 164) | 0;
        c[u >> 2] = 0;
        xa = k;
        Da = 1;
        Xa = 892;
        break;
       }
      } else Xa = 891; while (0);
      if ((Xa | 0) == 891) if (!m) {
       ya = q;
       za = l;
       Xa = 893;
      } else {
       xa = m;
       Da = n;
       Xa = 892;
      }
      if ((Xa | 0) == 892) {
       Xa = 0;
       na = xa + -1 | 0;
       c[rb + 192 >> 2] = na;
       oa = Da;
      } else if ((Xa | 0) == 893) {
       Xa = 0;
       s = ya + (t * 216 | 0) | 0;
       o = c[w >> 2] | 0;
       xb(u | 0, 0, 2088) | 0;
       k = Na(rb, rb + 628 | 0) | 0;
       l = c[rb + 628 >> 2] | 0;
       switch (za | 0) {
       case 2:
       case 7:
        {
         if ((k | 0) != 0 | (l + 6 | 0) >>> 0 > 31) {
          Fa = 1;
          Xa = 1094;
          break I;
         } else n = l + 6 | 0;
         break;
        }
       default:
        if ((k | 0) != 0 | (l + 1 | 0) >>> 0 > 31) {
         Fa = 1;
         Xa = 1094;
         break I;
        } else n = l + 1 | 0;
       }
       c[u >> 2] = n;
       do if ((n | 0) != 31) {
        Wa = n >>> 0 < 6;
        r = Wa ? 2 : (n | 0) != 6 & 1;
        if (n >>> 0 < 4 | Wa ^ 1) {
         J : do switch (r | 0) {
         case 2:
          {
           K : do if (o >>> 0 > 1) {
            switch (n | 0) {
            case 0:
            case 1:
             {
              k = 0;
              break;
             }
            case 3:
            case 2:
             {
              k = 1;
              break;
             }
            default:
             k = 3;
            }
            if (o >>> 0 > 2) {
             m = 0;
             while (1) {
              if (Na(rb, rb + 648 | 0) | 0) {
               sa = 1;
               break J;
              }
              l = c[rb + 648 >> 2] | 0;
              if (l >>> 0 >= o >>> 0) {
               sa = 1;
               break J;
              }
              c[u + 144 + (m << 2) >> 2] = l;
              if (!k) break K; else {
               k = k + -1 | 0;
               m = m + 1 | 0;
              }
             }
            } else l = 0;
            while (1) {
             m = Ma(rb, 1) | 0;
             if ((m | 0) == -1) {
              Ba = -1;
              Xa = 1050;
              break;
             }
             if ((m ^ 1) >>> 0 >= o >>> 0) {
              Ba = m ^ 1;
              Xa = 1050;
              break;
             }
             c[u + 144 + (l << 2) >> 2] = m ^ 1;
             if (!k) {
              Xa = 1006;
              break;
             } else {
              k = k + -1 | 0;
              l = l + 1 | 0;
             }
            }
            if ((Xa | 0) == 1006) {
             Xa = 0;
             c[rb + 648 >> 2] = m ^ 1;
             break;
            } else if ((Xa | 0) == 1050) {
             Xa = 0;
             c[rb + 648 >> 2] = Ba;
             sa = 1;
             break J;
            }
           } while (0);
           switch (n | 0) {
           case 0:
           case 1:
            {
             m = 0;
             n = 0;
             break;
            }
           case 3:
           case 2:
            {
             m = 1;
             n = 0;
             break;
            }
           default:
            {
             m = 3;
             n = 0;
            }
           }
           while (1) {
            c[rb + 688 >> 2] = 0;
            k = Na(rb, rb + 688 | 0) | 0;
            l = c[rb + 688 >> 2] | 0;
            if ((l | 0) == -1) if (!k) {
             Xa = 1014;
             break;
            } else k = -2147483648; else {
             if (k) {
              Xa = 1014;
              break;
             }
             k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
            }
            b[u + 160 + (n << 2) >> 1] = k;
            c[rb + 688 >> 2] = 0;
            k = Na(rb, rb + 688 | 0) | 0;
            l = c[rb + 688 >> 2] | 0;
            if ((l | 0) == -1) if (!k) {
             Xa = 1019;
             break;
            } else k = -2147483648; else {
             if (k) {
              Xa = 1019;
              break;
             }
             k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
            }
            b[u + 160 + (n << 2) + 2 >> 1] = k;
            if (!m) {
             sa = 0;
             break J;
            } else {
             m = m + -1 | 0;
             n = n + 1 | 0;
            }
           }
           if ((Xa | 0) == 1014) {
            Xa = 0;
            sa = 1;
            break J;
           } else if ((Xa | 0) == 1019) {
            Xa = 0;
            sa = 1;
            break J;
           }
           break;
          }
         case 0:
          {
           k = c[rb + 12 >> 2] | 0;
           l = c[rb + 16 >> 2] | 0;
           m = c[rb + 4 >> 2] | 0;
           p = 0;
           q = 0;
           while (1) {
            l = (k << 3) - l | 0;
            do if ((l | 0) > 31) {
             k = c[A >> 2] | 0;
             l = d[m + 1 >> 0] << 16 | d[m >> 0] << 24 | d[m + 2 >> 0] << 8 | d[m + 3 >> 0];
             if (!k) {
              qa = l;
              Xa = 1028;
              break;
             }
             qa = (d[m + 4 >> 0] | 0) >>> (8 - k | 0) | l << k;
             Xa = 1028;
            } else {
             if ((l | 0) <= 0) {
              c[u + 12 + (q << 2) >> 2] = 0;
              va = 0;
              Xa = 1029;
              break;
             }
             n = c[A >> 2] | 0;
             k = d[m >> 0] << n + 24;
             if ((l + -8 + n | 0) > 0) {
              o = l + -8 + n | 0;
              l = n + 24 | 0;
             } else {
              qa = k;
              Xa = 1028;
              break;
             }
             while (1) {
              m = m + 1 | 0;
              l = l + -8 | 0;
              k = d[m >> 0] << l | k;
              if ((o | 0) <= 8) {
               qa = k;
               Xa = 1028;
               break;
              } else o = o + -8 | 0;
             }
            } while (0);
            if ((Xa | 0) == 1028) {
             Xa = 0;
             Wa = qa >>> 31;
             c[u + 12 + (q << 2) >> 2] = Wa;
             if (!Wa) {
              va = qa;
              Xa = 1029;
             } else {
              Aa = qa << 1;
              Ea = 0;
             }
            }
            if ((Xa | 0) == 1029) {
             c[u + 76 + (q << 2) >> 2] = va >>> 28 & 7;
             Aa = va << 4;
             Ea = 1;
            }
            l = q | 1;
            Xa = Aa >>> 31;
            c[u + 12 + (l << 2) >> 2] = Xa;
            if (!Xa) {
             c[u + 76 + (l << 2) >> 2] = Aa >>> 28 & 7;
             m = Aa << 4;
             k = Ea + 1 | 0;
            } else {
             m = Aa << 1;
             k = Ea;
            }
            Xa = m >>> 31;
            c[u + 12 + (l + 1 << 2) >> 2] = Xa;
            if (!Xa) {
             c[u + 76 + (l + 1 << 2) >> 2] = m >>> 28 & 7;
             l = m << 4;
             k = k + 1 | 0;
            } else l = m << 1;
            m = q | 3;
            Xa = l >>> 31;
            c[u + 12 + (m << 2) >> 2] = Xa;
            if (!Xa) {
             c[u + 76 + (m << 2) >> 2] = l >>> 28 & 7;
             l = l << 4;
             k = k + 1 | 0;
            } else l = l << 1;
            Xa = l >>> 31;
            c[u + 12 + (m + 1 << 2) >> 2] = Xa;
            if (!Xa) {
             c[u + 76 + (m + 1 << 2) >> 2] = l >>> 28 & 7;
             l = l << 4;
             k = k + 1 | 0;
            } else l = l << 1;
            Xa = l >>> 31;
            c[u + 12 + (m + 2 << 2) >> 2] = Xa;
            if (!Xa) {
             c[u + 76 + (m + 2 << 2) >> 2] = l >>> 28 & 7;
             l = l << 4;
             k = k + 1 | 0;
            } else l = l << 1;
            Xa = l >>> 31;
            c[u + 12 + (m + 3 << 2) >> 2] = Xa;
            if (!Xa) {
             c[u + 76 + (m + 3 << 2) >> 2] = l >>> 28 & 7;
             m = l << 4;
             k = k + 1 | 0;
            } else m = l << 1;
            l = q | 7;
            Xa = m >>> 31;
            c[u + 12 + (l << 2) >> 2] = Xa;
            if (!Xa) {
             c[u + 76 + (l << 2) >> 2] = m >>> 28 & 7;
             n = m << 4;
             k = k + 1 | 0;
            } else n = m << 1;
            l = (k * 3 | 0) + 8 + (c[rb + 16 >> 2] | 0) | 0;
            c[rb + 16 >> 2] = l;
            c[A >> 2] = l & 7;
            k = c[rb + 12 >> 2] | 0;
            if (l >>> 0 > k << 3 >>> 0) {
             Xa = 1035;
             break;
            }
            m = (c[rb >> 2] | 0) + (l >>> 3) | 0;
            c[rb + 4 >> 2] = m;
            p = p + 1 | 0;
            if ((p | 0) >= 2) {
             Xa = 1032;
             break;
            } else q = q + 8 | 0;
           }
           if ((Xa | 0) == 1032) {
            c[rb + 648 >> 2] = n;
            Xa = 1033;
            break J;
           } else if ((Xa | 0) == 1035) {
            Xa = 0;
            c[rb + 648 >> 2] = n;
            sa = 1;
            break J;
           }
           break;
          }
         case 1:
          {
           Xa = 1033;
           break;
          }
         default:
          sa = 0;
         } while (0);
         do if ((Xa | 0) == 1033) {
          Xa = 0;
          Wa = (Na(rb, rb + 648 | 0) | 0) != 0;
          k = c[rb + 648 >> 2] | 0;
          if (Wa | k >>> 0 > 3) {
           sa = 1;
           break;
          }
          c[u + 140 >> 2] = k;
          sa = 0;
         } while (0);
         k = sa;
        } else {
         Wa = (Na(rb, rb + 648 | 0) | 0) != 0;
         k = c[rb + 648 >> 2] | 0;
         L : do if (!(Wa | k >>> 0 > 3)) {
          c[u + 176 >> 2] = k;
          Wa = (Na(rb, rb + 648 | 0) | 0) != 0;
          k = c[rb + 648 >> 2] | 0;
          if (Wa | k >>> 0 > 3) {
           ta = 1;
           break;
          }
          c[u + 180 >> 2] = k;
          Wa = (Na(rb, rb + 648 | 0) | 0) != 0;
          k = c[rb + 648 >> 2] | 0;
          if (Wa | k >>> 0 > 3) {
           ta = 1;
           break;
          }
          c[u + 184 >> 2] = k;
          Wa = (Na(rb, rb + 648 | 0) | 0) != 0;
          k = c[rb + 648 >> 2] | 0;
          if (Wa | k >>> 0 > 3) {
           ta = 1;
           break;
          }
          c[u + 188 >> 2] = k;
          if (o >>> 0 > 1 & (n | 0) != 5) {
           if (o >>> 0 > 2) {
            if (Na(rb, rb + 648 | 0) | 0) {
             ta = 1;
             break;
            }
            k = c[rb + 648 >> 2] | 0;
           } else {
            k = Ma(rb, 1) | 0;
            c[rb + 648 >> 2] = k;
            if ((k | 0) == -1) {
             ta = 1;
             break;
            }
            c[rb + 648 >> 2] = k ^ 1;
            k = k ^ 1;
           }
           if (k >>> 0 >= o >>> 0) {
            ta = 1;
            break;
           }
           c[u + 192 >> 2] = k;
           if (o >>> 0 > 2) {
            if (Na(rb, rb + 648 | 0) | 0) {
             ta = 1;
             break;
            }
            k = c[rb + 648 >> 2] | 0;
           } else {
            k = Ma(rb, 1) | 0;
            c[rb + 648 >> 2] = k;
            if ((k | 0) == -1) {
             ta = 1;
             break;
            }
            c[rb + 648 >> 2] = k ^ 1;
            k = k ^ 1;
           }
           if (k >>> 0 >= o >>> 0) {
            ta = 1;
            break;
           }
           c[u + 196 >> 2] = k;
           if (o >>> 0 > 2) {
            if (Na(rb, rb + 648 | 0) | 0) {
             ta = 1;
             break;
            }
            k = c[rb + 648 >> 2] | 0;
           } else {
            k = Ma(rb, 1) | 0;
            c[rb + 648 >> 2] = k;
            if ((k | 0) == -1) {
             ta = 1;
             break;
            }
            c[rb + 648 >> 2] = k ^ 1;
            k = k ^ 1;
           }
           if (k >>> 0 >= o >>> 0) {
            ta = 1;
            break;
           }
           c[u + 200 >> 2] = k;
           if (o >>> 0 > 2) {
            if (Na(rb, rb + 648 | 0) | 0) {
             ta = 1;
             break;
            }
            k = c[rb + 648 >> 2] | 0;
           } else {
            k = Ma(rb, 1) | 0;
            c[rb + 648 >> 2] = k;
            if ((k | 0) == -1) {
             ta = 1;
             break;
            }
            c[rb + 648 >> 2] = k ^ 1;
            k = k ^ 1;
           }
           if (k >>> 0 >= o >>> 0) {
            ta = 1;
            break;
           }
           c[u + 204 >> 2] = k;
          }
          switch (c[u + 176 >> 2] | 0) {
          case 0:
           {
            k = 0;
            break;
           }
          case 2:
          case 1:
           {
            k = 1;
            break;
           }
          default:
           k = 3;
          }
          c[rb + 648 >> 2] = k;
          m = 0;
          while (1) {
           c[rb + 688 >> 2] = 0;
           k = Na(rb, rb + 688 | 0) | 0;
           l = c[rb + 688 >> 2] | 0;
           if ((l | 0) == -1) if (!k) {
            Xa = 923;
            break;
           } else k = -2147483648; else {
            if (k) {
             Xa = 923;
             break;
            }
            k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
           }
           b[u + 208 + (m << 2) >> 1] = k;
           c[rb + 688 >> 2] = 0;
           k = Na(rb, rb + 688 | 0) | 0;
           l = c[rb + 688 >> 2] | 0;
           if ((l | 0) == -1) if (!k) {
            Xa = 928;
            break;
           } else k = -2147483648; else {
            if (k) {
             Xa = 928;
             break;
            }
            k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
           }
           b[u + 208 + (m << 2) + 2 >> 1] = k;
           Xa = c[rb + 648 >> 2] | 0;
           c[rb + 648 >> 2] = Xa + -1;
           if (!Xa) {
            Xa = 930;
            break;
           } else m = m + 1 | 0;
          }
          if ((Xa | 0) == 923) {
           Xa = 0;
           ta = 1;
           break;
          } else if ((Xa | 0) == 928) {
           Xa = 0;
           ta = 1;
           break;
          } else if ((Xa | 0) == 930) {
           switch (c[u + 180 >> 2] | 0) {
           case 0:
            {
             k = 0;
             break;
            }
           case 2:
           case 1:
            {
             k = 1;
             break;
            }
           default:
            k = 3;
           }
           c[rb + 648 >> 2] = k;
           m = 0;
           while (1) {
            c[rb + 688 >> 2] = 0;
            k = Na(rb, rb + 688 | 0) | 0;
            l = c[rb + 688 >> 2] | 0;
            if ((l | 0) == -1) if (!k) {
             Xa = 938;
             break;
            } else k = -2147483648; else {
             if (k) {
              Xa = 938;
              break;
             }
             k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
            }
            b[u + 224 + (m << 2) >> 1] = k;
            c[rb + 688 >> 2] = 0;
            k = Na(rb, rb + 688 | 0) | 0;
            l = c[rb + 688 >> 2] | 0;
            if ((l | 0) == -1) if (!k) {
             Xa = 943;
             break;
            } else k = -2147483648; else {
             if (k) {
              Xa = 943;
              break;
             }
             k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
            }
            b[u + 224 + (m << 2) + 2 >> 1] = k;
            Xa = c[rb + 648 >> 2] | 0;
            c[rb + 648 >> 2] = Xa + -1;
            if (!Xa) {
             Xa = 945;
             break;
            } else m = m + 1 | 0;
           }
           if ((Xa | 0) == 938) {
            Xa = 0;
            ta = 1;
            break;
           } else if ((Xa | 0) == 943) {
            Xa = 0;
            ta = 1;
            break;
           } else if ((Xa | 0) == 945) {
            switch (c[u + 184 >> 2] | 0) {
            case 0:
             {
              k = 0;
              break;
             }
            case 2:
            case 1:
             {
              k = 1;
              break;
             }
            default:
             k = 3;
            }
            c[rb + 648 >> 2] = k;
            m = 0;
            while (1) {
             c[rb + 688 >> 2] = 0;
             k = Na(rb, rb + 688 | 0) | 0;
             l = c[rb + 688 >> 2] | 0;
             if ((l | 0) == -1) if (!k) {
              Xa = 953;
              break;
             } else k = -2147483648; else {
              if (k) {
               Xa = 953;
               break;
              }
              k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
             }
             b[u + 240 + (m << 2) >> 1] = k;
             c[rb + 688 >> 2] = 0;
             k = Na(rb, rb + 688 | 0) | 0;
             l = c[rb + 688 >> 2] | 0;
             if ((l | 0) == -1) if (!k) {
              Xa = 958;
              break;
             } else k = -2147483648; else {
              if (k) {
               Xa = 958;
               break;
              }
              k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
             }
             b[u + 240 + (m << 2) + 2 >> 1] = k;
             Xa = c[rb + 648 >> 2] | 0;
             c[rb + 648 >> 2] = Xa + -1;
             if (!Xa) {
              Xa = 960;
              break;
             } else m = m + 1 | 0;
            }
            if ((Xa | 0) == 953) {
             Xa = 0;
             ta = 1;
             break;
            } else if ((Xa | 0) == 958) {
             Xa = 0;
             ta = 1;
             break;
            } else if ((Xa | 0) == 960) {
             Xa = 0;
             switch (c[u + 188 >> 2] | 0) {
             case 0:
              {
               k = 0;
               break;
              }
             case 2:
             case 1:
              {
               k = 1;
               break;
              }
             default:
              k = 3;
             }
             c[rb + 648 >> 2] = k;
             m = 0;
             while (1) {
              c[rb + 688 >> 2] = 0;
              k = Na(rb, rb + 688 | 0) | 0;
              l = c[rb + 688 >> 2] | 0;
              if ((l | 0) == -1) if (!k) {
               Xa = 968;
               break;
              } else k = -2147483648; else {
               if (k) {
                Xa = 968;
                break;
               }
               k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
              }
              b[u + 256 + (m << 2) >> 1] = k;
              c[rb + 688 >> 2] = 0;
              k = Na(rb, rb + 688 | 0) | 0;
              l = c[rb + 688 >> 2] | 0;
              if ((l | 0) == -1) if (!k) {
               Xa = 973;
               break;
              } else k = -2147483648; else {
               if (k) {
                Xa = 973;
                break;
               }
               k = (l & 1 | 0) != 0 ? (l + 1 | 0) >>> 1 : 0 - ((l + 1 | 0) >>> 1) | 0;
              }
              b[u + 256 + (m << 2) + 2 >> 1] = k;
              Wa = c[rb + 648 >> 2] | 0;
              c[rb + 648 >> 2] = Wa + -1;
              if (!Wa) {
               ta = 0;
               break L;
              } else m = m + 1 | 0;
             }
             if ((Xa | 0) == 968) {
              Xa = 0;
              ta = 1;
              break;
             } else if ((Xa | 0) == 973) {
              Xa = 0;
              ta = 1;
              break;
             }
            }
           }
          }
         } else ta = 1; while (0);
         k = ta;
        }
        if (k) {
         Fa = 1;
         Xa = 1094;
         break I;
        }
        if ((r | 0) != 1) {
         if (Na(rb, rb + 688 | 0) | 0) {
          Xa = 1056;
          break I;
         }
         k = c[rb + 688 >> 2] | 0;
         if (k >>> 0 > 47) {
          Xa = 1056;
          break I;
         }
         Wa = a[((r | 0) == 0 ? 4968 : 4920) + k >> 0] | 0;
         c[rb + 628 >> 2] = Wa & 255;
         c[u + 4 >> 2] = Wa & 255;
         if (!(Wa << 24 >> 24)) break;
        } else {
         Wa = c[u >> 2] | 0;
         c[u + 4 >> 2] = ((Wa + -7 | 0) >>> 0 > 11 ? ((Wa + -7 | 0) >>> 2) + 268435453 | 0 : (Wa + -7 | 0) >>> 2) << 4 | (Wa >>> 0 > 18 ? 15 : 0);
        }
        c[rb + 688 >> 2] = 0;
        Wa = Na(rb, rb + 688 | 0) | 0;
        k = c[rb + 688 >> 2] | 0;
        if ((Wa | 0) != 0 | (k | 0) == -1) {
         Xa = 1060;
         break I;
        }
        k = (k & 1 | 0) != 0 ? (k + 1 | 0) >>> 1 : 0 - ((k + 1 | 0) >>> 1) | 0;
        if ((k + 26 | 0) >>> 0 > 51) {
         Fa = 1;
         Xa = 1094;
         break I;
        }
        c[u + 8 >> 2] = k;
        l = c[u + 4 >> 2] | 0;
        M : do if ((c[u >> 2] | 0) >>> 0 > 6) {
         k = c[ya + (t * 216 | 0) + 200 >> 2] | 0;
         do if (!k) {
          m = 0;
          n = 0;
         } else {
          if ((c[ya + (t * 216 | 0) + 4 >> 2] | 0) != (c[k + 4 >> 2] | 0)) {
           m = 0;
           n = 0;
           break;
          }
          m = b[k + 38 >> 1] | 0;
          n = 1;
         } while (0);
         k = c[ya + (t * 216 | 0) + 204 >> 2] | 0;
         do if (!k) k = m; else {
          if ((c[ya + (t * 216 | 0) + 4 >> 2] | 0) != (c[k + 4 >> 2] | 0)) {
           k = m;
           break;
          }
          k = b[k + 48 >> 1] | 0;
          if (!n) break;
          k = m + 1 + k >> 1;
         } while (0);
         k = Oa(rb, u + 1864 | 0, k, 16) | 0;
         if (k & 15) {
          ra = k;
          break;
         }
         b[u + 320 >> 1] = k >>> 4 & 255;
         o = 3;
         m = 0;
         while (1) {
          n = l >>> 1;
          if (l & 1) {
           k = Oa(rb, u + 328 + (m << 6) + 4 | 0, La(s, m, u + 272 | 0) | 0, 15) | 0;
           c[u + 1992 + (m << 2) >> 2] = k >>> 15;
           if (k & 15) {
            ra = k;
            break M;
           }
           b[u + 272 + (m << 1) >> 1] = k >>> 4 & 255;
           k = m | 1;
           l = Oa(rb, u + 328 + (k << 6) + 4 | 0, La(s, k, u + 272 | 0) | 0, 15) | 0;
           c[u + 1992 + (k << 2) >> 2] = l >>> 15;
           if (l & 15) {
            ra = l;
            break M;
           }
           b[u + 272 + (k << 1) >> 1] = l >>> 4 & 255;
           k = m | 2;
           l = Oa(rb, u + 328 + (k << 6) + 4 | 0, La(s, k, u + 272 | 0) | 0, 15) | 0;
           c[u + 1992 + (k << 2) >> 2] = l >>> 15;
           if (l & 15) {
            ra = l;
            break M;
           }
           b[u + 272 + (k << 1) >> 1] = l >>> 4 & 255;
           k = m | 3;
           l = Oa(rb, u + 328 + (k << 6) + 4 | 0, La(s, k, u + 272 | 0) | 0, 15) | 0;
           c[u + 1992 + (k << 2) >> 2] = l >>> 15;
           if (l & 15) {
            ra = l;
            break M;
           }
           b[u + 272 + (k << 1) >> 1] = l >>> 4 & 255;
          }
          k = m + 4 | 0;
          if (!o) {
           wa = n;
           Ca = k;
           Xa = 1080;
           break;
          } else {
           l = n;
           o = o + -1 | 0;
           m = k;
          }
         }
        } else {
         o = 3;
         m = 0;
         while (1) {
          n = l >>> 1;
          if (l & 1) {
           k = Oa(rb, u + 328 + (m << 6) | 0, La(s, m, u + 272 | 0) | 0, 16) | 0;
           c[u + 1992 + (m << 2) >> 2] = k >>> 16;
           if (k & 15) {
            ra = k;
            break M;
           }
           b[u + 272 + (m << 1) >> 1] = k >>> 4 & 255;
           k = m | 1;
           l = Oa(rb, u + 328 + (k << 6) | 0, La(s, k, u + 272 | 0) | 0, 16) | 0;
           c[u + 1992 + (k << 2) >> 2] = l >>> 16;
           if (l & 15) {
            ra = l;
            break M;
           }
           b[u + 272 + (k << 1) >> 1] = l >>> 4 & 255;
           k = m | 2;
           l = Oa(rb, u + 328 + (k << 6) | 0, La(s, k, u + 272 | 0) | 0, 16) | 0;
           c[u + 1992 + (k << 2) >> 2] = l >>> 16;
           if (l & 15) {
            ra = l;
            break M;
           }
           b[u + 272 + (k << 1) >> 1] = l >>> 4 & 255;
           k = m | 3;
           l = Oa(rb, u + 328 + (k << 6) | 0, La(s, k, u + 272 | 0) | 0, 16) | 0;
           c[u + 1992 + (k << 2) >> 2] = l >>> 16;
           if (l & 15) {
            ra = l;
            break M;
           }
           b[u + 272 + (k << 1) >> 1] = l >>> 4 & 255;
          }
          k = m + 4 | 0;
          if (!o) {
           wa = n;
           Ca = k;
           Xa = 1080;
           break;
          } else {
           l = n;
           o = o + -1 | 0;
           m = k;
          }
         }
        } while (0);
        N : do if ((Xa | 0) == 1080) {
         Xa = 0;
         if (wa & 3) {
          k = Oa(rb, u + 1928 | 0, -1, 4) | 0;
          if (k & 15) {
           ra = k;
           break;
          }
          b[u + 322 >> 1] = k >>> 4 & 255;
          k = Oa(rb, u + 1944 | 0, -1, 4) | 0;
          if (k & 15) {
           ra = k;
           break;
          }
          b[u + 324 >> 1] = k >>> 4 & 255;
         }
         if (!(wa & 2)) {
          ra = 0;
          break;
         } else {
          l = 7;
          m = Ca;
         }
         while (1) {
          k = Oa(rb, u + 328 + (m << 6) + 4 | 0, La(s, m, u + 272 | 0) | 0, 15) | 0;
          if (k & 15) {
           ra = k;
           break N;
          }
          b[u + 272 + (m << 1) >> 1] = k >>> 4 & 255;
          c[u + 1992 + (m << 2) >> 2] = k >>> 15;
          if (!l) {
           ra = 0;
           break;
          } else {
           l = l + -1 | 0;
           m = m + 1 | 0;
          }
         }
        } while (0);
        c[rb + 16 >> 2] = ((c[rb + 4 >> 2] | 0) - (c[rb >> 2] | 0) << 3) + (c[A >> 2] | 0);
        if (ra) {
         Fa = ra;
         Xa = 1094;
         break I;
        }
       } else {
        while (1) {
         if (!(c[A >> 2] | 0)) {
          l = 0;
          m = u + 328 | 0;
          break;
         }
         if (Ma(rb, 1) | 0) {
          Fa = 1;
          Xa = 1094;
          break I;
         }
        }
        while (1) {
         k = Ma(rb, 8) | 0;
         c[rb + 628 >> 2] = k;
         if ((k | 0) == -1) {
          Fa = 1;
          Xa = 1094;
          break I;
         }
         c[m >> 2] = k;
         l = l + 1 | 0;
         if (l >>> 0 >= 384) break; else m = m + 4 | 0;
        }
       } while (0);
       na = 0;
       oa = 0;
      }
      k = Ka((c[e + 1212 >> 2] | 0) + (t * 216 | 0) | 0, u, e + 1336 | 0, e + 1220 | 0, rb + 188 | 0, t, c[(c[e + 12 >> 2] | 0) + 64 >> 2] | 0, rb + 196 + (0 - (rb + 196) & 15) | 0) | 0;
      if (k) {
       ua = k;
       break;
      }
      q = c[e + 1212 >> 2] | 0;
      v = ((c[q + (t * 216 | 0) + 196 >> 2] | 0) == 1 & 1) + v | 0;
      o = c[rb + 12 >> 2] << 3;
      p = c[rb + 16 >> 2] | 0;
      do if ((o | 0) == (p | 0)) k = 0; else {
       if ((o - p | 0) >>> 0 > 8) {
        k = 1;
        break;
       }
       l = c[rb + 4 >> 2] | 0;
       do if ((o - p | 0) > 0) {
        m = c[A >> 2] | 0;
        k = d[l >> 0] << m + 24;
        if ((o - p + -8 + m | 0) > 0) {
         n = o - p + -8 + m | 0;
         m = m + 24 | 0;
        } else break;
        while (1) {
         l = l + 1 | 0;
         m = m + -8 | 0;
         k = d[l >> 0] << m | k;
         if ((n | 0) <= 8) break; else n = n + -8 | 0;
        }
       } else k = 0; while (0);
       k = (k >>> (32 - (o - p) | 0) | 0) != (1 << o - p + -1 | 0) & 1;
      } while (0);
      l = (na | k | 0) != 0;
      switch (c[e + 1372 >> 2] | 0) {
      case 7:
      case 2:
       {
        c[e + 1200 >> 2] = t;
        break;
       }
      default:
       {}
      }
      m = c[e + 1172 >> 2] | 0;
      pa = c[e + 1176 >> 2] | 0;
      n = c[m + (t << 2) >> 2] | 0;
      k = t;
      do {
       k = k + 1 | 0;
       if (k >>> 0 >= pa >>> 0) break;
      } while ((c[m + (k << 2) >> 2] | 0) != (n | 0));
      t = (k | 0) == (pa | 0) ? 0 : k;
      if (!((t | 0) != 0 | l ^ 1)) {
       ua = 1;
       break;
      }
      if (!l) {
       Xa = 1110;
       break;
      } else {
       m = na;
       n = oa;
      }
     }
     do if ((Xa | 0) == 1056) {
      Fa = 1;
      Xa = 1094;
     } else if ((Xa | 0) == 1060) {
      Fa = 1;
      Xa = 1094;
     } else if ((Xa | 0) == 1110) {
      k = (c[e + 1196 >> 2] | 0) + v | 0;
      if (k >>> 0 > pa >>> 0) {
       ua = 1;
       break;
      }
      c[e + 1196 >> 2] = k;
      ua = 0;
     } while (0);
     if ((Xa | 0) == 1094) ua = Fa;
     if (!ua) {
      do if (!(c[e + 1404 >> 2] | 0)) {
       if ((c[e + 1196 >> 2] | 0) == (c[e + 1176 >> 2] | 0)) break; else la = 0;
       i = rb;
       return la | 0;
      } else {
       k = c[e + 1176 >> 2] | 0;
       if (!k) break;
       l = c[e + 1212 >> 2] | 0;
       m = 0;
       n = 0;
       do {
        n = ((c[l + (m * 216 | 0) + 196 >> 2] | 0) != 0 & 1) + n | 0;
        m = m + 1 | 0;
       } while ((m | 0) != (k | 0));
       if ((n | 0) == (k | 0)) break; else la = 0;
       i = rb;
       return la | 0;
      } while (0);
      c[e + 1180 >> 2] = 1;
      Ua = e + 16 | 0;
      Wa = e + 1188 | 0;
      Ta = e + 1212 | 0;
      Va = e + 1336 | 0;
      break i;
     }
     m = c[e + 1368 >> 2] | 0;
     p = c[e + 1192 >> 2] | 0;
     k = c[e + 1200 >> 2] | 0;
     O : do if (!k) k = m; else {
      l = 0;
      do {
       do {
        k = k + -1 | 0;
        if (k >>> 0 <= m >>> 0) break O;
       } while ((c[(c[e + 1212 >> 2] | 0) + (k * 216 | 0) + 4 >> 2] | 0) != (p | 0));
       l = l + 1 | 0;
       qb = c[(c[e + 16 >> 2] | 0) + 52 >> 2] | 0;
      } while (l >>> 0 < (qb >>> 0 > 10 ? qb : 10) >>> 0);
     } while (0);
     o = c[e + 1212 >> 2] | 0;
     while (1) {
      if ((c[o + (k * 216 | 0) + 4 >> 2] | 0) != (p | 0)) {
       la = 3;
       Xa = 1499;
       break;
      }
      l = o + (k * 216 | 0) + 196 | 0;
      m = c[l >> 2] | 0;
      if (!m) {
       la = 3;
       Xa = 1499;
       break;
      }
      c[l >> 2] = m + -1;
      l = c[e + 1172 >> 2] | 0;
      m = c[e + 1176 >> 2] | 0;
      n = c[l + (k << 2) >> 2] | 0;
      do {
       k = k + 1 | 0;
       if (k >>> 0 >= m >>> 0) break;
      } while ((c[l + (k << 2) >> 2] | 0) != (n | 0));
      k = (k | 0) == (m | 0) ? 0 : k;
      if (!k) {
       la = 3;
       Xa = 1499;
       break;
      }
     }
     if ((Xa | 0) == 1499) {
      i = rb;
      return la | 0;
     }
    }
   } while (0);
   e = 3;
   i = rb;
   return e | 0;
  }
 default:
  {
   e = 0;
   i = rb;
   return e | 0;
  }
 } while (0);
 ka = c[Va + 4 >> 2] | 0;
 la = Va + 8 | 0;
 k = c[la >> 2] | 0;
 ma = Z(k, ka) | 0;
 if (k) {
  na = rb + 688 + 120 | 0;
  oa = rb + 688 + 112 | 0;
  pa = rb + 688 + 104 | 0;
  qa = rb + 688 + 96 | 0;
  ra = rb + 688 + 88 | 0;
  sa = rb + 688 + 80 | 0;
  ta = rb + 688 + 72 | 0;
  ua = rb + 688 + 64 | 0;
  va = rb + 688 + 56 | 0;
  wa = rb + 688 + 48 | 0;
  xa = rb + 688 + 40 | 0;
  ya = rb + 688 + 32 | 0;
  za = rb + 688 + 124 | 0;
  Aa = rb + 688 + 116 | 0;
  Ba = rb + 688 + 108 | 0;
  Ca = rb + 688 + 92 | 0;
  Da = rb + 688 + 84 | 0;
  Ea = rb + 688 + 76 | 0;
  Fa = rb + 688 + 60 | 0;
  Ga = rb + 688 + 52 | 0;
  Ha = rb + 688 + 44 | 0;
  Ia = rb + 688 + 28 | 0;
  Ja = rb + 688 + 20 | 0;
  Pa = rb + 688 + 12 | 0;
  Qa = Z(ka, -48) | 0;
  Ra = rb + 648 + 24 | 0;
  Sa = rb + 648 + 12 | 0;
  ha = 0;
  ia = 0;
  ja = c[Ta >> 2] | 0;
  while (1) {
   m = c[ja + 8 >> 2] | 0;
   P : do if ((m | 0) != 1) {
    ga = ja + 200 | 0;
    da = c[ga >> 2] | 0;
    do if (!da) l = 1; else {
     if ((m | 0) == 2 ? (c[ja + 4 >> 2] | 0) != (c[da + 4 >> 2] | 0) : 0) {
      l = 1;
      break;
     }
     l = 5;
    } while (0);
    fa = ja + 204 | 0;
    ca = c[fa >> 2] | 0;
    do if (ca) {
     if ((m | 0) == 2 ? (c[ja + 4 >> 2] | 0) != (c[ca + 4 >> 2] | 0) : 0) break;
     l = l | 2;
    } while (0);
    ea = (l & 2 | 0) == 0;
    Q : do if (ea) {
     c[rb + 688 + 24 >> 2] = 0;
     c[rb + 688 + 16 >> 2] = 0;
     c[rb + 688 + 8 >> 2] = 0;
     c[rb + 688 >> 2] = 0;
     r = 0;
    } else {
     do if ((c[ja >> 2] | 0) >>> 0 <= 5) {
      if ((c[ca >> 2] | 0) >>> 0 > 5) break;
      do if (!(b[ja + 28 >> 1] | 0)) {
       if (b[ca + 48 >> 1] | 0) {
        q = 2;
        break;
       }
       if ((c[ja + 116 >> 2] | 0) != (c[ca + 124 >> 2] | 0)) {
        q = 1;
        break;
       }
       m = c[ja + 132 >> 2] | 0;
       n = c[ca + 172 >> 2] | 0;
       if (((((m << 16 >> 16) - (n << 16 >> 16) | 0) < 0 ? 0 - ((m << 16 >> 16) - (n << 16 >> 16)) | 0 : (m << 16 >> 16) - (n << 16 >> 16) | 0) | 0) > 3) {
        q = 1;
        break;
       }
       q = ((((m >> 16) - (n >> 16) | 0) < 0 ? 0 - ((m >> 16) - (n >> 16)) | 0 : (m >> 16) - (n >> 16) | 0) | 0) > 3 & 1;
      } else q = 2; while (0);
      c[rb + 688 >> 2] = q;
      do if (!(b[ja + 30 >> 1] | 0)) {
       if (b[ca + 50 >> 1] | 0) {
        p = 2;
        break;
       }
       if ((c[ja + 116 >> 2] | 0) != (c[ca + 124 >> 2] | 0)) {
        p = 1;
        break;
       }
       m = c[ja + 136 >> 2] | 0;
       n = c[ca + 176 >> 2] | 0;
       if (((((m << 16 >> 16) - (n << 16 >> 16) | 0) < 0 ? 0 - ((m << 16 >> 16) - (n << 16 >> 16)) | 0 : (m << 16 >> 16) - (n << 16 >> 16) | 0) | 0) > 3) {
        p = 1;
        break;
       }
       p = ((((m >> 16) - (n >> 16) | 0) < 0 ? 0 - ((m >> 16) - (n >> 16)) | 0 : (m >> 16) - (n >> 16) | 0) | 0) > 3 & 1;
      } else p = 2; while (0);
      c[rb + 688 + 8 >> 2] = p;
      do if (!(b[ja + 36 >> 1] | 0)) {
       if (b[ca + 56 >> 1] | 0) {
        o = 2;
        break;
       }
       if ((c[ja + 120 >> 2] | 0) != (c[ca + 128 >> 2] | 0)) {
        o = 1;
        break;
       }
       m = c[ja + 148 >> 2] | 0;
       n = c[ca + 188 >> 2] | 0;
       if (((((m << 16 >> 16) - (n << 16 >> 16) | 0) < 0 ? 0 - ((m << 16 >> 16) - (n << 16 >> 16)) | 0 : (m << 16 >> 16) - (n << 16 >> 16) | 0) | 0) > 3) {
        o = 1;
        break;
       }
       o = ((((m >> 16) - (n >> 16) | 0) < 0 ? 0 - ((m >> 16) - (n >> 16)) | 0 : (m >> 16) - (n >> 16) | 0) | 0) > 3 & 1;
      } else o = 2; while (0);
      c[rb + 688 + 16 >> 2] = o;
      do if (!(b[ja + 38 >> 1] | 0)) {
       if (b[ca + 58 >> 1] | 0) {
        m = 2;
        break;
       }
       if ((c[ja + 120 >> 2] | 0) != (c[ca + 128 >> 2] | 0)) {
        m = 1;
        break;
       }
       m = c[ja + 152 >> 2] | 0;
       n = c[ca + 192 >> 2] | 0;
       if (((((m << 16 >> 16) - (n << 16 >> 16) | 0) < 0 ? 0 - ((m << 16 >> 16) - (n << 16 >> 16)) | 0 : (m << 16 >> 16) - (n << 16 >> 16) | 0) | 0) > 3) {
        m = 1;
        break;
       }
       m = ((((m >> 16) - (n >> 16) | 0) < 0 ? 0 - ((m >> 16) - (n >> 16)) | 0 : (m >> 16) - (n >> 16) | 0) | 0) > 3 & 1;
      } else m = 2; while (0);
      c[rb + 688 + 24 >> 2] = m;
      r = (p | q | o | m | 0) != 0 & 1;
      break Q;
     } while (0);
     c[rb + 688 + 24 >> 2] = 4;
     c[rb + 688 + 16 >> 2] = 4;
     c[rb + 688 + 8 >> 2] = 4;
     c[rb + 688 >> 2] = 4;
     r = 1;
    } while (0);
    j = (l & 4 | 0) == 0;
    R : do if (j) {
     c[rb + 688 + 100 >> 2] = 0;
     c[rb + 688 + 68 >> 2] = 0;
     c[rb + 688 + 36 >> 2] = 0;
     c[rb + 688 + 4 >> 2] = 0;
     gb = c[ja >> 2] | 0;
     ib = r;
     Xa = 1196;
    } else {
     q = c[ja >> 2] | 0;
     do if (q >>> 0 <= 5) {
      if ((c[da >> 2] | 0) >>> 0 > 5) break;
      do if (!(b[ja + 28 >> 1] | 0)) {
       if (b[da + 38 >> 1] | 0) {
        p = 2;
        break;
       }
       if ((c[ja + 116 >> 2] | 0) != (c[da + 120 >> 2] | 0)) {
        p = 1;
        break;
       }
       l = c[ja + 132 >> 2] | 0;
       m = c[da + 152 >> 2] | 0;
       if (((((l << 16 >> 16) - (m << 16 >> 16) | 0) < 0 ? 0 - ((l << 16 >> 16) - (m << 16 >> 16)) | 0 : (l << 16 >> 16) - (m << 16 >> 16) | 0) | 0) > 3) {
        p = 1;
        break;
       }
       p = ((((l >> 16) - (m >> 16) | 0) < 0 ? 0 - ((l >> 16) - (m >> 16)) | 0 : (l >> 16) - (m >> 16) | 0) | 0) > 3 & 1;
      } else p = 2; while (0);
      c[rb + 688 + 4 >> 2] = p;
      do if (!(b[ja + 32 >> 1] | 0)) {
       if (b[da + 42 >> 1] | 0) {
        o = 2;
        break;
       }
       if ((c[ja + 116 >> 2] | 0) != (c[da + 120 >> 2] | 0)) {
        o = 1;
        break;
       }
       l = c[ja + 140 >> 2] | 0;
       m = c[da + 160 >> 2] | 0;
       if (((((l << 16 >> 16) - (m << 16 >> 16) | 0) < 0 ? 0 - ((l << 16 >> 16) - (m << 16 >> 16)) | 0 : (l << 16 >> 16) - (m << 16 >> 16) | 0) | 0) > 3) {
        o = 1;
        break;
       }
       o = ((((l >> 16) - (m >> 16) | 0) < 0 ? 0 - ((l >> 16) - (m >> 16)) | 0 : (l >> 16) - (m >> 16) | 0) | 0) > 3 & 1;
      } else o = 2; while (0);
      c[rb + 688 + 36 >> 2] = o;
      do if (!(b[ja + 44 >> 1] | 0)) {
       if (b[da + 54 >> 1] | 0) {
        n = 2;
        break;
       }
       if ((c[ja + 124 >> 2] | 0) != (c[da + 128 >> 2] | 0)) {
        n = 1;
        break;
       }
       l = c[ja + 164 >> 2] | 0;
       m = c[da + 184 >> 2] | 0;
       if (((((l << 16 >> 16) - (m << 16 >> 16) | 0) < 0 ? 0 - ((l << 16 >> 16) - (m << 16 >> 16)) | 0 : (l << 16 >> 16) - (m << 16 >> 16) | 0) | 0) > 3) {
        n = 1;
        break;
       }
       n = ((((l >> 16) - (m >> 16) | 0) < 0 ? 0 - ((l >> 16) - (m >> 16)) | 0 : (l >> 16) - (m >> 16) | 0) | 0) > 3 & 1;
      } else n = 2; while (0);
      c[rb + 688 + 68 >> 2] = n;
      do if (!(b[ja + 48 >> 1] | 0)) {
       if (b[da + 58 >> 1] | 0) {
        l = 2;
        break;
       }
       if ((c[ja + 124 >> 2] | 0) != (c[da + 128 >> 2] | 0)) {
        l = 1;
        break;
       }
       l = c[ja + 172 >> 2] | 0;
       m = c[da + 192 >> 2] | 0;
       if (((((l << 16 >> 16) - (m << 16 >> 16) | 0) < 0 ? 0 - ((l << 16 >> 16) - (m << 16 >> 16)) | 0 : (l << 16 >> 16) - (m << 16 >> 16) | 0) | 0) > 3) {
        l = 1;
        break;
       }
       l = ((((l >> 16) - (m >> 16) | 0) < 0 ? 0 - ((l >> 16) - (m >> 16)) | 0 : (l >> 16) - (m >> 16) | 0) | 0) > 3 & 1;
      } else l = 2; while (0);
      c[rb + 688 + 100 >> 2] = l;
      if (r) {
       $a = q;
       Ya = r;
       Xa = 1198;
       break R;
      }
      $a = q;
      Ya = (o | p | n | l | 0) != 0 & 1;
      Xa = 1198;
      break R;
     } while (0);
     c[rb + 688 + 100 >> 2] = 4;
     c[rb + 688 + 68 >> 2] = 4;
     c[rb + 688 + 36 >> 2] = 4;
     c[rb + 688 + 4 >> 2] = 4;
     gb = q;
     ib = 1;
     Xa = 1196;
    } while (0);
    if ((Xa | 0) == 1196) {
     Xa = 0;
     if (gb >>> 0 > 5) {
      c[na >> 2] = 3;
      c[oa >> 2] = 3;
      c[pa >> 2] = 3;
      c[qa >> 2] = 3;
      c[ra >> 2] = 3;
      c[sa >> 2] = 3;
      c[ta >> 2] = 3;
      c[ua >> 2] = 3;
      c[va >> 2] = 3;
      c[wa >> 2] = 3;
      c[xa >> 2] = 3;
      c[ya >> 2] = 3;
      c[za >> 2] = 3;
      c[Aa >> 2] = 3;
      c[Ba >> 2] = 3;
      c[Ca >> 2] = 3;
      c[Da >> 2] = 3;
      c[Ea >> 2] = 3;
      c[Fa >> 2] = 3;
      c[Ga >> 2] = 3;
      c[Ha >> 2] = 3;
      c[Ia >> 2] = 3;
      c[Ja >> 2] = 3;
      c[Pa >> 2] = 3;
     } else {
      $a = gb;
      Ya = ib;
      Xa = 1198;
     }
    }
    do if ((Xa | 0) == 1198) {
     Xa = 0;
     S : do if ($a >>> 0 < 2) {
      l = ja + 28 | 0;
      n = c[ja + 32 >> 2] | 0;
      if (!((n & 65535) << 16 >> 16)) f = (b[l >> 1] | 0) != 0 ? 2 : 0; else f = 2;
      c[ya >> 2] = f;
      if (!((n >>> 16 & 65535) << 16 >> 16)) E = (b[ja + 30 >> 1] | 0) != 0 ? 2 : 0; else E = 2;
      c[xa >> 2] = E;
      o = c[ja + 40 >> 2] | 0;
      if (!((o & 65535) << 16 >> 16)) D = (b[ja + 36 >> 1] | 0) != 0 ? 2 : 0; else D = 2;
      c[wa >> 2] = D;
      if (!(o >>> 16)) B = (b[ja + 38 >> 1] | 0) != 0 ? 2 : 0; else B = 2;
      c[va >> 2] = B;
      p = c[ja + 44 >> 2] | 0;
      A = ((p | n) & 65535) << 16 >> 16 != 0 ? 2 : 0;
      c[ua >> 2] = A;
      z = (p >>> 16 | n >>> 16 | 0) != 0 ? 2 : 0;
      c[ta >> 2] = z;
      q = c[ja + 52 >> 2] | 0;
      y = ((q | o) & 65535) << 16 >> 16 != 0 ? 2 : 0;
      c[sa >> 2] = y;
      x = (q >>> 16 | o >>> 16 | 0) != 0 ? 2 : 0;
      c[ra >> 2] = x;
      r = c[ja + 48 >> 2] | 0;
      g = ((r | p) & 65535) << 16 >> 16 != 0 ? 2 : 0;
      c[qa >> 2] = g;
      w = (r >>> 16 | p >>> 16 | 0) != 0 ? 2 : 0;
      c[pa >> 2] = w;
      s = c[ja + 56 >> 2] | 0;
      v = (q & 65535) << 16 >> 16 != 0 | (s & 65535) << 16 >> 16 == 0 ^ 1 ? 2 : 0;
      c[oa >> 2] = v;
      u = (q >>> 16 | 0) != 0 | s >>> 0 < 65536 ^ 1 ? 2 : 0;
      c[na >> 2] = u;
      m = b[ja + 30 >> 1] | 0;
      if (!(m << 16 >> 16)) {
       l = c[l >> 2] | 0;
       t = (l & 65535) << 16 >> 16 != 0 ? 2 : 0;
       l = l >>> 16 & 65535;
      } else {
       t = 2;
       l = m;
      }
      c[Pa >> 2] = t;
      H = c[ja + 36 >> 2] | 0;
      F = (H & 65535 | l) << 16 >> 16 != 0 ? 2 : 0;
      c[Ja >> 2] = F;
      H = H >>> 0 > 65535 | (H & 65535) << 16 >> 16 != 0 ? 2 : 0;
      c[Ia >> 2] = H;
      G = (n & 65535) << 16 >> 16 != 0 | (n >>> 16 & 65535) << 16 >> 16 == 0 ^ 1 ? 2 : 0;
      c[Ha >> 2] = G;
      O = (n >>> 16 & 65535) << 16 >> 16 != 0 | (o & 65535) << 16 >> 16 == 0 ^ 1 ? 2 : 0;
      c[Ga >> 2] = O;
      n = (o & 65535) << 16 >> 16 != 0 | (o >>> 16 | 0) == 0 ^ 1 ? 2 : 0;
      c[Fa >> 2] = n;
      P = ((p >>> 16 | p) & 65535) << 16 >> 16 != 0 ? 2 : 0;
      c[Ea >> 2] = P;
      o = ((q | p >>> 16) & 65535) << 16 >> 16 != 0 ? 2 : 0;
      c[Da >> 2] = o;
      Q = ((q >>> 16 | q) & 65535) << 16 >> 16 != 0 ? 2 : 0;
      c[Ca >> 2] = Q;
      C = ((r >>> 16 | r) & 65535) << 16 >> 16 != 0 ? 2 : 0;
      c[Ba >> 2] = C;
      h = (s & 65535) << 16 >> 16 == 0 ? ((r >>> 16 | 0) != 0 ? 2 : 0) : 2;
      c[Aa >> 2] = h;
      l = s >>> 0 < 65536 ? ((s & 65535) << 16 >> 16 != 0 ? 2 : 0) : 2;
      c[za >> 2] = l;
      s = n;
      r = A;
      q = B;
      p = D;
      n = E;
      m = f;
     } else switch ($a | 0) {
     case 2:
      {
       t = ja + 28 | 0;
       w = c[ja + 32 >> 2] | 0;
       if (!((w & 65535) << 16 >> 16)) l = (b[t >> 1] | 0) != 0; else l = 1;
       J = l ? 2 : 0;
       c[ya >> 2] = J;
       if (!((w >>> 16 & 65535) << 16 >> 16)) l = (b[ja + 30 >> 1] | 0) != 0; else l = 1;
       I = l ? 2 : 0;
       c[xa >> 2] = I;
       u = c[ja + 40 >> 2] | 0;
       if (!((u & 65535) << 16 >> 16)) l = (b[ja + 36 >> 1] | 0) != 0; else l = 1;
       f = l ? 2 : 0;
       c[wa >> 2] = f;
       if (!((u >>> 16 & 65535) << 16 >> 16)) E = (b[ja + 38 >> 1] | 0) != 0 ? 2 : 0; else E = 2;
       c[va >> 2] = E;
       q = c[ja + 48 >> 2] | 0;
       if (!((q & 65535) << 16 >> 16)) g = (b[ja + 44 >> 1] | 0) != 0 ? 2 : 0; else g = 2;
       c[qa >> 2] = g;
       if (!((q >>> 16 & 65535) << 16 >> 16)) B = (b[ja + 46 >> 1] | 0) != 0 ? 2 : 0; else B = 2;
       c[pa >> 2] = B;
       r = c[ja + 56 >> 2] | 0;
       if (!((r & 65535) << 16 >> 16)) v = (b[ja + 52 >> 1] | 0) != 0 ? 2 : 0; else v = 2;
       c[oa >> 2] = v;
       if (r >>> 0 < 65536) A = (b[ja + 54 >> 1] | 0) != 0 ? 2 : 0; else A = 2;
       c[na >> 2] = A;
       s = b[ja + 44 >> 1] | 0;
       l = b[ja + 166 >> 1] | 0;
       m = b[ja + 142 >> 1] | 0;
       do if (!((s | w & 65535) << 16 >> 16)) {
        ba = (b[ja + 164 >> 1] | 0) - (b[ja + 140 >> 1] | 0) | 0;
        if ((((ba | 0) < 0 ? 0 - ba | 0 : ba) | 0) > 3) {
         D = 1;
         break;
        }
        if ((((l - m | 0) < 0 ? 0 - (l - m) | 0 : l - m | 0) | 0) > 3) {
         D = 1;
         break;
        }
        D = (c[ja + 124 >> 2] | 0) != (c[ja + 116 >> 2] | 0) & 1;
       } else D = 2; while (0);
       c[ua >> 2] = D;
       p = b[ja + 46 >> 1] | 0;
       l = b[ja + 170 >> 1] | 0;
       m = b[ja + 146 >> 1] | 0;
       do if (!((p | w >>> 16 & 65535) << 16 >> 16)) {
        ba = (b[ja + 168 >> 1] | 0) - (b[ja + 144 >> 1] | 0) | 0;
        if ((((ba | 0) < 0 ? 0 - ba | 0 : ba) | 0) > 3) {
         z = 1;
         break;
        }
        if ((((l - m | 0) < 0 ? 0 - (l - m) | 0 : l - m | 0) | 0) > 3) {
         z = 1;
         break;
        }
        z = (c[ja + 124 >> 2] | 0) != (c[ja + 116 >> 2] | 0) & 1;
       } else z = 2; while (0);
       c[ta >> 2] = z;
       o = b[ja + 52 >> 1] | 0;
       l = b[ja + 182 >> 1] | 0;
       m = b[ja + 158 >> 1] | 0;
       do if (!((o | u & 65535) << 16 >> 16)) {
        ba = (b[ja + 180 >> 1] | 0) - (b[ja + 156 >> 1] | 0) | 0;
        if ((((ba | 0) < 0 ? 0 - ba | 0 : ba) | 0) > 3) {
         y = 1;
         break;
        }
        if ((((l - m | 0) < 0 ? 0 - (l - m) | 0 : l - m | 0) | 0) > 3) {
         y = 1;
         break;
        }
        y = (c[ja + 128 >> 2] | 0) != (c[ja + 120 >> 2] | 0) & 1;
       } else y = 2; while (0);
       c[sa >> 2] = y;
       n = b[ja + 54 >> 1] | 0;
       l = b[ja + 186 >> 1] | 0;
       m = b[ja + 162 >> 1] | 0;
       do if (!((n | u >>> 16 & 65535) << 16 >> 16)) {
        ba = (b[ja + 184 >> 1] | 0) - (b[ja + 160 >> 1] | 0) | 0;
        if ((((ba | 0) < 0 ? 0 - ba | 0 : ba) | 0) > 3) {
         x = 1;
         break;
        }
        if ((((l - m | 0) < 0 ? 0 - (l - m) | 0 : l - m | 0) | 0) > 3) {
         x = 1;
         break;
        }
        x = (c[ja + 128 >> 2] | 0) != (c[ja + 120 >> 2] | 0) & 1;
       } else x = 2; while (0);
       c[ra >> 2] = x;
       l = b[ja + 30 >> 1] | 0;
       if (!(l << 16 >> 16)) {
        l = c[t >> 2] | 0;
        t = (l & 65535) << 16 >> 16 != 0 ? 2 : 0;
        l = l >>> 16 & 65535;
       } else t = 2;
       c[Pa >> 2] = t;
       H = c[ja + 36 >> 2] | 0;
       F = (H & 65535 | l) << 16 >> 16 != 0 ? 2 : 0;
       c[Ja >> 2] = F;
       H = H >>> 0 > 65535 | (H & 65535) << 16 >> 16 != 0 ? 2 : 0;
       c[Ia >> 2] = H;
       G = (w & 65535) << 16 >> 16 != 0 | (w >>> 16 & 65535) << 16 >> 16 == 0 ^ 1 ? 2 : 0;
       c[Ha >> 2] = G;
       O = (w >>> 16 & 65535) << 16 >> 16 != 0 | (u & 65535) << 16 >> 16 == 0 ^ 1 ? 2 : 0;
       c[Ga >> 2] = O;
       u = (u & 65535) << 16 >> 16 != 0 | (u >>> 16 & 65535) << 16 >> 16 == 0 ^ 1 ? 2 : 0;
       c[Fa >> 2] = u;
       P = (p | s) << 16 >> 16 != 0 ? 2 : 0;
       c[Ea >> 2] = P;
       s = (o | p) << 16 >> 16 != 0 ? 2 : 0;
       c[Da >> 2] = s;
       Q = (n | o) << 16 >> 16 != 0 ? 2 : 0;
       c[Ca >> 2] = Q;
       C = (q & 65535) << 16 >> 16 != 0 | (q >>> 16 & 65535) << 16 >> 16 == 0 ^ 1 ? 2 : 0;
       c[Ba >> 2] = C;
       h = (r & 65535) << 16 >> 16 == 0 ? ((q >>> 16 & 65535) << 16 >> 16 != 0 ? 2 : 0) : 2;
       c[Aa >> 2] = h;
       l = r >>> 0 < 65536 ? ((r & 65535) << 16 >> 16 != 0 ? 2 : 0) : 2;
       c[za >> 2] = l;
       o = s;
       s = u;
       u = A;
       w = B;
       r = D;
       q = E;
       p = f;
       n = I;
       m = J;
       break S;
      }
     case 3:
      {
       l = ja + 28 | 0;
       q = c[ja + 32 >> 2] | 0;
       if (!((q & 65535) << 16 >> 16)) N = (b[l >> 1] | 0) != 0 ? 2 : 0; else N = 2;
       c[ya >> 2] = N;
       if (!(q >>> 16)) M = (b[ja + 30 >> 1] | 0) != 0 ? 2 : 0; else M = 2;
       c[xa >> 2] = M;
       r = c[ja + 40 >> 2] | 0;
       if (!((r & 65535) << 16 >> 16)) L = (b[ja + 36 >> 1] | 0) != 0 ? 2 : 0; else L = 2;
       c[wa >> 2] = L;
       if (!(r >>> 16)) K = (b[ja + 38 >> 1] | 0) != 0 ? 2 : 0; else K = 2;
       c[va >> 2] = K;
       s = c[ja + 44 >> 2] | 0;
       J = ((s | q) & 65535) << 16 >> 16 != 0 ? 2 : 0;
       c[ua >> 2] = J;
       I = (s >>> 16 | q >>> 16 | 0) != 0 ? 2 : 0;
       c[ta >> 2] = I;
       z = c[ja + 52 >> 2] | 0;
       y = ((z | r) & 65535) << 16 >> 16 != 0 ? 2 : 0;
       c[sa >> 2] = y;
       x = (z >>> 16 | r >>> 16 | 0) != 0 ? 2 : 0;
       c[ra >> 2] = x;
       A = c[ja + 48 >> 2] | 0;
       g = ((A | s) & 65535) << 16 >> 16 != 0 ? 2 : 0;
       c[qa >> 2] = g;
       w = (s >>> 16 | 0) != 0 | (A >>> 16 | 0) == 0 ^ 1 ? 2 : 0;
       c[pa >> 2] = w;
       B = c[ja + 56 >> 2] | 0;
       v = ((B | z) & 65535) << 16 >> 16 != 0 ? 2 : 0;
       c[oa >> 2] = v;
       u = (z >>> 16 | 0) != 0 | B >>> 0 < 65536 ^ 1 ? 2 : 0;
       c[na >> 2] = u;
       m = b[ja + 30 >> 1] | 0;
       if (!(m << 16 >> 16)) {
        m = c[l >> 2] | 0;
        t = (m & 65535) << 16 >> 16 != 0 ? 2 : 0;
        m = m >>> 16 & 65535;
       } else t = 2;
       c[Pa >> 2] = t;
       l = ja + 36 | 0;
       if (!(b[ja + 38 >> 1] | 0)) {
        p = b[l >> 1] | 0;
        H = p << 16 >> 16 != 0 ? 2 : 0;
       } else {
        H = 2;
        p = b[l >> 1] | 0;
       }
       c[Ia >> 2] = H;
       G = (q & 65535) << 16 >> 16 != 0 | (q >>> 16 | 0) == 0 ^ 1 ? 2 : 0;
       c[Ha >> 2] = G;
       f = (r & 65535) << 16 >> 16 != 0 | (r >>> 16 | 0) == 0 ^ 1 ? 2 : 0;
       c[Fa >> 2] = f;
       E = ((s >>> 16 | s) & 65535) << 16 >> 16 != 0 ? 2 : 0;
       c[Ea >> 2] = E;
       D = ((z >>> 16 | z) & 65535) << 16 >> 16 != 0 ? 2 : 0;
       c[Ca >> 2] = D;
       C = (A >>> 16 | 0) == 0 ? ((A & 65535) << 16 >> 16 != 0 ? 2 : 0) : 2;
       c[Ba >> 2] = C;
       l = B >>> 0 < 65536 ? ((B & 65535) << 16 >> 16 != 0 ? 2 : 0) : 2;
       c[za >> 2] = l;
       n = b[ja + 150 >> 1] | 0;
       o = b[ja + 138 >> 1] | 0;
       do if (!((p | m) << 16 >> 16)) {
        ba = (b[ja + 148 >> 1] | 0) - (b[ja + 136 >> 1] | 0) | 0;
        if ((((ba | 0) < 0 ? 0 - ba | 0 : ba) | 0) > 3) {
         F = 1;
         break;
        }
        if ((((n - o | 0) < 0 ? 0 - (n - o) | 0 : n - o | 0) | 0) > 3) {
         F = 1;
         break;
        }
        F = (c[ja + 120 >> 2] | 0) != (c[ja + 116 >> 2] | 0) & 1;
       } else F = 2; while (0);
       c[Ja >> 2] = F;
       m = b[ja + 158 >> 1] | 0;
       n = b[ja + 146 >> 1] | 0;
       do if (!(((r | q >>> 16) & 65535) << 16 >> 16)) {
        ba = (b[ja + 156 >> 1] | 0) - (b[ja + 144 >> 1] | 0) | 0;
        if ((((ba | 0) < 0 ? 0 - ba | 0 : ba) | 0) > 3) {
         p = 1;
         break;
        }
        if ((((m - n | 0) < 0 ? 0 - (m - n) | 0 : m - n | 0) | 0) > 3) {
         p = 1;
         break;
        }
        p = (c[ja + 120 >> 2] | 0) != (c[ja + 116 >> 2] | 0) & 1;
       } else p = 2; while (0);
       c[Ga >> 2] = p;
       m = b[ja + 182 >> 1] | 0;
       n = b[ja + 170 >> 1] | 0;
       do if (!(((z | s >>> 16) & 65535) << 16 >> 16)) {
        ba = (b[ja + 180 >> 1] | 0) - (b[ja + 168 >> 1] | 0) | 0;
        if ((((ba | 0) < 0 ? 0 - ba | 0 : ba) | 0) > 3) {
         o = 1;
         break;
        }
        if ((((m - n | 0) < 0 ? 0 - (m - n) | 0 : m - n | 0) | 0) > 3) {
         o = 1;
         break;
        }
        o = (c[ja + 128 >> 2] | 0) != (c[ja + 124 >> 2] | 0) & 1;
       } else o = 2; while (0);
       c[Da >> 2] = o;
       m = b[ja + 190 >> 1] | 0;
       n = b[ja + 178 >> 1] | 0;
       do if (!(((B | A >>> 16) & 65535) << 16 >> 16)) {
        ba = (b[ja + 188 >> 1] | 0) - (b[ja + 176 >> 1] | 0) | 0;
        if ((((ba | 0) < 0 ? 0 - ba | 0 : ba) | 0) > 3) {
         m = 1;
         break;
        }
        if ((((m - n | 0) < 0 ? 0 - (m - n) | 0 : m - n | 0) | 0) > 3) {
         m = 1;
         break;
        }
        m = (c[ja + 128 >> 2] | 0) != (c[ja + 124 >> 2] | 0) & 1;
       } else m = 2; while (0);
       c[Aa >> 2] = m;
       h = m;
       Q = D;
       P = E;
       s = f;
       O = p;
       z = I;
       r = J;
       q = K;
       p = L;
       n = M;
       m = N;
       break S;
      }
     default:
      {
       Q = b[ja + 32 >> 1] | 0;
       f = b[ja + 28 >> 1] | 0;
       l = b[ja + 142 >> 1] | 0;
       n = b[ja + 134 >> 1] | 0;
       do if (!((f | Q) << 16 >> 16)) {
        o = c[ja + 132 >> 2] | 0;
        m = c[ja + 140 >> 2] | 0;
        if (((((m << 16 >> 16) - (o << 16 >> 16) | 0) < 0 ? 0 - ((m << 16 >> 16) - (o << 16 >> 16)) | 0 : (m << 16 >> 16) - (o << 16 >> 16) | 0) | 0) > 3) {
         ba = 1;
         l = m >>> 16 & 65535;
         n = o >>> 16 & 65535;
         break;
        }
        ba = (l << 16 >> 16) - (n << 16 >> 16) | 0;
        ba = (((ba | 0) < 0 ? 0 - ba | 0 : ba) | 0) > 3 & 1;
        l = m >>> 16 & 65535;
        n = o >>> 16 & 65535;
       } else ba = 2; while (0);
       c[ya >> 2] = ba;
       h = b[ja + 34 >> 1] | 0;
       F = b[ja + 30 >> 1] | 0;
       m = b[ja + 146 >> 1] | 0;
       p = b[ja + 138 >> 1] | 0;
       do if (!((F | h) << 16 >> 16)) {
        q = c[ja + 136 >> 2] | 0;
        o = c[ja + 144 >> 2] | 0;
        if (((((o << 16 >> 16) - (q << 16 >> 16) | 0) < 0 ? 0 - ((o << 16 >> 16) - (q << 16 >> 16)) | 0 : (o << 16 >> 16) - (q << 16 >> 16) | 0) | 0) > 3) {
         aa = 1;
         m = o >>> 16 & 65535;
         p = q >>> 16 & 65535;
         break;
        }
        aa = (m << 16 >> 16) - (p << 16 >> 16) | 0;
        aa = (((aa | 0) < 0 ? 0 - aa | 0 : aa) | 0) > 3 & 1;
        m = o >>> 16 & 65535;
        p = q >>> 16 & 65535;
       } else aa = 2; while (0);
       c[xa >> 2] = aa;
       S = b[ja + 40 >> 1] | 0;
       G = b[ja + 36 >> 1] | 0;
       o = b[ja + 158 >> 1] | 0;
       r = b[ja + 150 >> 1] | 0;
       do if (!((G | S) << 16 >> 16)) {
        s = c[ja + 148 >> 2] | 0;
        q = c[ja + 156 >> 2] | 0;
        if (((((q << 16 >> 16) - (s << 16 >> 16) | 0) < 0 ? 0 - ((q << 16 >> 16) - (s << 16 >> 16)) | 0 : (q << 16 >> 16) - (s << 16 >> 16) | 0) | 0) > 3) {
         $ = 1;
         o = q >>> 16 & 65535;
         r = s >>> 16 & 65535;
         break;
        }
        $ = (o << 16 >> 16) - (r << 16 >> 16) | 0;
        $ = ((($ | 0) < 0 ? 0 - $ | 0 : $) | 0) > 3 & 1;
        o = q >>> 16 & 65535;
        r = s >>> 16 & 65535;
       } else $ = 2; while (0);
       c[wa >> 2] = $;
       P = b[ja + 42 >> 1] | 0;
       D = b[ja + 38 >> 1] | 0;
       q = b[ja + 162 >> 1] | 0;
       t = b[ja + 154 >> 1] | 0;
       do if (!((D | P) << 16 >> 16)) {
        u = c[ja + 152 >> 2] | 0;
        s = c[ja + 160 >> 2] | 0;
        if (((((s << 16 >> 16) - (u << 16 >> 16) | 0) < 0 ? 0 - ((s << 16 >> 16) - (u << 16 >> 16)) | 0 : (s << 16 >> 16) - (u << 16 >> 16) | 0) | 0) > 3) {
         _ = 1;
         q = s >>> 16 & 65535;
         t = u >>> 16 & 65535;
         break;
        }
        _ = (q << 16 >> 16) - (t << 16 >> 16) | 0;
        _ = (((_ | 0) < 0 ? 0 - _ | 0 : _) | 0) > 3 & 1;
        q = s >>> 16 & 65535;
        t = u >>> 16 & 65535;
       } else _ = 2; while (0);
       c[va >> 2] = _;
       M = b[ja + 44 >> 1] | 0;
       u = b[ja + 166 >> 1] | 0;
       s = l << 16 >> 16;
       do if (!((M | Q) << 16 >> 16)) {
        v = c[ja + 140 >> 2] | 0;
        l = c[ja + 164 >> 2] | 0;
        if (((((l << 16 >> 16) - (v << 16 >> 16) | 0) < 0 ? 0 - ((l << 16 >> 16) - (v << 16 >> 16)) | 0 : (l << 16 >> 16) - (v << 16 >> 16) | 0) | 0) > 3) {
         Y = 1;
         u = l >>> 16 & 65535;
         l = v >>> 16 & 65535;
         break;
        }
        if (((((u << 16 >> 16) - s | 0) < 0 ? 0 - ((u << 16 >> 16) - s) | 0 : (u << 16 >> 16) - s | 0) | 0) > 3) {
         Y = 1;
         u = l >>> 16 & 65535;
         l = v >>> 16 & 65535;
         break;
        }
        Y = (c[ja + 124 >> 2] | 0) != (c[ja + 116 >> 2] | 0) & 1;
        u = l >>> 16 & 65535;
        l = v >>> 16 & 65535;
       } else Y = 2; while (0);
       c[ua >> 2] = Y;
       N = b[ja + 46 >> 1] | 0;
       v = b[ja + 170 >> 1] | 0;
       s = m << 16 >> 16;
       do if (!((N | h) << 16 >> 16)) {
        w = c[ja + 144 >> 2] | 0;
        m = c[ja + 168 >> 2] | 0;
        if (((((m << 16 >> 16) - (w << 16 >> 16) | 0) < 0 ? 0 - ((m << 16 >> 16) - (w << 16 >> 16)) | 0 : (m << 16 >> 16) - (w << 16 >> 16) | 0) | 0) > 3) {
         X = 1;
         v = m >>> 16 & 65535;
         m = w >>> 16 & 65535;
         break;
        }
        if (((((v << 16 >> 16) - s | 0) < 0 ? 0 - ((v << 16 >> 16) - s) | 0 : (v << 16 >> 16) - s | 0) | 0) > 3) {
         X = 1;
         v = m >>> 16 & 65535;
         m = w >>> 16 & 65535;
         break;
        }
        X = (c[ja + 124 >> 2] | 0) != (c[ja + 116 >> 2] | 0) & 1;
        v = m >>> 16 & 65535;
        m = w >>> 16 & 65535;
       } else X = 2; while (0);
       c[ta >> 2] = X;
       O = b[ja + 52 >> 1] | 0;
       w = b[ja + 182 >> 1] | 0;
       s = o << 16 >> 16;
       do if (!((O | S) << 16 >> 16)) {
        g = c[ja + 156 >> 2] | 0;
        o = c[ja + 180 >> 2] | 0;
        if (((((o << 16 >> 16) - (g << 16 >> 16) | 0) < 0 ? 0 - ((o << 16 >> 16) - (g << 16 >> 16)) | 0 : (o << 16 >> 16) - (g << 16 >> 16) | 0) | 0) > 3) {
         y = 1;
         w = o >>> 16 & 65535;
         o = g >>> 16 & 65535;
         break;
        }
        if (((((w << 16 >> 16) - s | 0) < 0 ? 0 - ((w << 16 >> 16) - s) | 0 : (w << 16 >> 16) - s | 0) | 0) > 3) {
         y = 1;
         w = o >>> 16 & 65535;
         o = g >>> 16 & 65535;
         break;
        }
        y = (c[ja + 128 >> 2] | 0) != (c[ja + 120 >> 2] | 0) & 1;
        w = o >>> 16 & 65535;
        o = g >>> 16 & 65535;
       } else y = 2; while (0);
       c[sa >> 2] = y;
       L = b[ja + 54 >> 1] | 0;
       g = b[ja + 186 >> 1] | 0;
       s = q << 16 >> 16;
       do if (!((L | P) << 16 >> 16)) {
        x = c[ja + 160 >> 2] | 0;
        q = c[ja + 184 >> 2] | 0;
        if (((((q << 16 >> 16) - (x << 16 >> 16) | 0) < 0 ? 0 - ((q << 16 >> 16) - (x << 16 >> 16)) | 0 : (q << 16 >> 16) - (x << 16 >> 16) | 0) | 0) > 3) {
         W = 1;
         g = q >>> 16 & 65535;
         q = x >>> 16 & 65535;
         break;
        }
        if (((((g << 16 >> 16) - s | 0) < 0 ? 0 - ((g << 16 >> 16) - s) | 0 : (g << 16 >> 16) - s | 0) | 0) > 3) {
         W = 1;
         g = q >>> 16 & 65535;
         q = x >>> 16 & 65535;
         break;
        }
        W = (c[ja + 128 >> 2] | 0) != (c[ja + 120 >> 2] | 0) & 1;
        g = q >>> 16 & 65535;
        q = x >>> 16 & 65535;
       } else W = 2; while (0);
       c[ra >> 2] = W;
       I = b[ja + 48 >> 1] | 0;
       z = b[ja + 174 >> 1] | 0;
       s = u << 16 >> 16;
       do if (!((I | M) << 16 >> 16)) {
        u = c[ja + 164 >> 2] | 0;
        x = c[ja + 172 >> 2] | 0;
        if (((((x << 16 >> 16) - (u << 16 >> 16) | 0) < 0 ? 0 - ((x << 16 >> 16) - (u << 16 >> 16)) | 0 : (x << 16 >> 16) - (u << 16 >> 16) | 0) | 0) > 3) {
         V = 1;
         u = u >>> 16 & 65535;
         z = x >>> 16 & 65535;
         break;
        }
        V = ((((z << 16 >> 16) - s | 0) < 0 ? 0 - ((z << 16 >> 16) - s) | 0 : (z << 16 >> 16) - s | 0) | 0) > 3 & 1;
        u = u >>> 16 & 65535;
        z = x >>> 16 & 65535;
       } else V = 2; while (0);
       c[qa >> 2] = V;
       J = b[ja + 50 >> 1] | 0;
       A = b[ja + 178 >> 1] | 0;
       s = v << 16 >> 16;
       do if (!((J | N) << 16 >> 16)) {
        v = c[ja + 168 >> 2] | 0;
        x = c[ja + 176 >> 2] | 0;
        if (((((x << 16 >> 16) - (v << 16 >> 16) | 0) < 0 ? 0 - ((x << 16 >> 16) - (v << 16 >> 16)) | 0 : (x << 16 >> 16) - (v << 16 >> 16) | 0) | 0) > 3) {
         U = 1;
         v = v >>> 16 & 65535;
         A = x >>> 16 & 65535;
         break;
        }
        U = ((((A << 16 >> 16) - s | 0) < 0 ? 0 - ((A << 16 >> 16) - s) | 0 : (A << 16 >> 16) - s | 0) | 0) > 3 & 1;
        v = v >>> 16 & 65535;
        A = x >>> 16 & 65535;
       } else U = 2; while (0);
       c[pa >> 2] = U;
       K = b[ja + 56 >> 1] | 0;
       B = b[ja + 190 >> 1] | 0;
       s = w << 16 >> 16;
       do if (!((K | O) << 16 >> 16)) {
        w = c[ja + 180 >> 2] | 0;
        x = c[ja + 188 >> 2] | 0;
        if (((((x << 16 >> 16) - (w << 16 >> 16) | 0) < 0 ? 0 - ((x << 16 >> 16) - (w << 16 >> 16)) | 0 : (x << 16 >> 16) - (w << 16 >> 16) | 0) | 0) > 3) {
         T = 1;
         w = w >>> 16 & 65535;
         B = x >>> 16 & 65535;
         break;
        }
        T = ((((B << 16 >> 16) - s | 0) < 0 ? 0 - ((B << 16 >> 16) - s) | 0 : (B << 16 >> 16) - s | 0) | 0) > 3 & 1;
        w = w >>> 16 & 65535;
        B = x >>> 16 & 65535;
       } else T = 2; while (0);
       c[oa >> 2] = T;
       E = b[ja + 58 >> 1] | 0;
       C = b[ja + 194 >> 1] | 0;
       s = g << 16 >> 16;
       do if (!((E | L) << 16 >> 16)) {
        g = c[ja + 184 >> 2] | 0;
        x = c[ja + 192 >> 2] | 0;
        if (((((x << 16 >> 16) - (g << 16 >> 16) | 0) < 0 ? 0 - ((x << 16 >> 16) - (g << 16 >> 16)) | 0 : (x << 16 >> 16) - (g << 16 >> 16) | 0) | 0) > 3) {
         R = 1;
         g = g >>> 16 & 65535;
         C = x >>> 16 & 65535;
         break;
        }
        R = ((((C << 16 >> 16) - s | 0) < 0 ? 0 - ((C << 16 >> 16) - s) | 0 : (C << 16 >> 16) - s | 0) | 0) > 3 & 1;
        g = g >>> 16 & 65535;
        C = x >>> 16 & 65535;
       } else R = 2; while (0);
       c[na >> 2] = R;
       x = p << 16 >> 16;
       s = n << 16 >> 16;
       do if (!((F | f) << 16 >> 16)) {
        n = c[ja + 136 >> 2] | 0;
        H = (n << 16 >> 16) - (b[ja + 132 >> 1] | 0) | 0;
        if ((((H | 0) < 0 ? 0 - H | 0 : H) | 0) > 3) {
         x = 1;
         p = n >>> 16 & 65535;
         break;
        }
        x = (((x - s | 0) < 0 ? 0 - (x - s) | 0 : x - s | 0) | 0) > 3 & 1;
        p = n >>> 16 & 65535;
       } else x = 2; while (0);
       c[Pa >> 2] = x;
       s = r << 16 >> 16;
       p = p << 16 >> 16;
       do if (!((G | F) << 16 >> 16)) {
        n = c[ja + 148 >> 2] | 0;
        H = (n << 16 >> 16) - (b[ja + 136 >> 1] | 0) | 0;
        if ((((H | 0) < 0 ? 0 - H | 0 : H) | 0) > 3) {
         F = 1;
         r = n >>> 16 & 65535;
         break;
        }
        if ((((s - p | 0) < 0 ? 0 - (s - p) | 0 : s - p | 0) | 0) > 3) {
         F = 1;
         r = n >>> 16 & 65535;
         break;
        }
        F = (c[ja + 120 >> 2] | 0) != (c[ja + 116 >> 2] | 0) & 1;
        r = n >>> 16 & 65535;
       } else F = 2; while (0);
       c[Ja >> 2] = F;
       p = t << 16 >> 16;
       n = r << 16 >> 16;
       do if (!((D | G) << 16 >> 16)) {
        H = (b[ja + 152 >> 1] | 0) - (b[ja + 148 >> 1] | 0) | 0;
        if ((((H | 0) < 0 ? 0 - H | 0 : H) | 0) > 3) {
         H = 1;
         break;
        }
        H = (((p - n | 0) < 0 ? 0 - (p - n) | 0 : p - n | 0) | 0) > 3 & 1;
       } else H = 2; while (0);
       c[Ia >> 2] = H;
       p = m << 16 >> 16;
       n = l << 16 >> 16;
       do if (!((h | Q) << 16 >> 16)) {
        l = c[ja + 144 >> 2] | 0;
        Q = (l << 16 >> 16) - (b[ja + 140 >> 1] | 0) | 0;
        if ((((Q | 0) < 0 ? 0 - Q | 0 : Q) | 0) > 3) {
         G = 1;
         m = l >>> 16 & 65535;
         break;
        }
        G = (((p - n | 0) < 0 ? 0 - (p - n) | 0 : p - n | 0) | 0) > 3 & 1;
        m = l >>> 16 & 65535;
       } else G = 2; while (0);
       c[Ha >> 2] = G;
       n = o << 16 >> 16;
       m = m << 16 >> 16;
       do if (!((S | h) << 16 >> 16)) {
        l = c[ja + 156 >> 2] | 0;
        h = (l << 16 >> 16) - (b[ja + 144 >> 1] | 0) | 0;
        if ((((h | 0) < 0 ? 0 - h | 0 : h) | 0) > 3) {
         t = 1;
         o = l >>> 16 & 65535;
         break;
        }
        if ((((n - m | 0) < 0 ? 0 - (n - m) | 0 : n - m | 0) | 0) > 3) {
         t = 1;
         o = l >>> 16 & 65535;
         break;
        }
        t = (c[ja + 120 >> 2] | 0) != (c[ja + 116 >> 2] | 0) & 1;
        o = l >>> 16 & 65535;
       } else t = 2; while (0);
       c[Ga >> 2] = t;
       m = q << 16 >> 16;
       l = o << 16 >> 16;
       do if (!((P | S) << 16 >> 16)) {
        S = (b[ja + 160 >> 1] | 0) - (b[ja + 156 >> 1] | 0) | 0;
        if ((((S | 0) < 0 ? 0 - S | 0 : S) | 0) > 3) {
         s = 1;
         break;
        }
        s = (((m - l | 0) < 0 ? 0 - (m - l) | 0 : m - l | 0) | 0) > 3 & 1;
       } else s = 2; while (0);
       c[Fa >> 2] = s;
       n = v << 16 >> 16;
       m = u << 16 >> 16;
       do if (!((N | M) << 16 >> 16)) {
        l = c[ja + 168 >> 2] | 0;
        S = (l << 16 >> 16) - (b[ja + 164 >> 1] | 0) | 0;
        if ((((S | 0) < 0 ? 0 - S | 0 : S) | 0) > 3) {
         r = 1;
         v = l >>> 16 & 65535;
         break;
        }
        r = (((n - m | 0) < 0 ? 0 - (n - m) | 0 : n - m | 0) | 0) > 3 & 1;
        v = l >>> 16 & 65535;
       } else r = 2; while (0);
       c[Ea >> 2] = r;
       n = w << 16 >> 16;
       m = v << 16 >> 16;
       do if (!((O | N) << 16 >> 16)) {
        l = c[ja + 180 >> 2] | 0;
        S = (l << 16 >> 16) - (b[ja + 168 >> 1] | 0) | 0;
        if ((((S | 0) < 0 ? 0 - S | 0 : S) | 0) > 3) {
         o = 1;
         w = l >>> 16 & 65535;
         break;
        }
        if ((((n - m | 0) < 0 ? 0 - (n - m) | 0 : n - m | 0) | 0) > 3) {
         o = 1;
         w = l >>> 16 & 65535;
         break;
        }
        o = (c[ja + 128 >> 2] | 0) != (c[ja + 124 >> 2] | 0) & 1;
        w = l >>> 16 & 65535;
       } else o = 2; while (0);
       c[Da >> 2] = o;
       m = g << 16 >> 16;
       l = w << 16 >> 16;
       do if (!((L | O) << 16 >> 16)) {
        S = (b[ja + 184 >> 1] | 0) - (b[ja + 180 >> 1] | 0) | 0;
        if ((((S | 0) < 0 ? 0 - S | 0 : S) | 0) > 3) {
         q = 1;
         break;
        }
        q = (((m - l | 0) < 0 ? 0 - (m - l) | 0 : m - l | 0) | 0) > 3 & 1;
       } else q = 2; while (0);
       c[Ca >> 2] = q;
       n = A << 16 >> 16;
       m = z << 16 >> 16;
       do if (!((J | I) << 16 >> 16)) {
        l = c[ja + 176 >> 2] | 0;
        S = (l << 16 >> 16) - (b[ja + 172 >> 1] | 0) | 0;
        if ((((S | 0) < 0 ? 0 - S | 0 : S) | 0) > 3) {
         p = 1;
         l = l >>> 16 & 65535;
         break;
        }
        p = (((n - m | 0) < 0 ? 0 - (n - m) | 0 : n - m | 0) | 0) > 3 & 1;
        l = l >>> 16 & 65535;
       } else {
        p = 2;
        l = A;
       } while (0);
       c[Ba >> 2] = p;
       n = B << 16 >> 16;
       m = l << 16 >> 16;
       do if (!((K | J) << 16 >> 16)) {
        l = c[ja + 188 >> 2] | 0;
        S = (l << 16 >> 16) - (b[ja + 176 >> 1] | 0) | 0;
        if ((((S | 0) < 0 ? 0 - S | 0 : S) | 0) > 3) {
         n = 1;
         l = l >>> 16 & 65535;
         break;
        }
        if ((((n - m | 0) < 0 ? 0 - (n - m) | 0 : n - m | 0) | 0) > 3) {
         n = 1;
         l = l >>> 16 & 65535;
         break;
        }
        n = (c[ja + 128 >> 2] | 0) != (c[ja + 124 >> 2] | 0) & 1;
        l = l >>> 16 & 65535;
       } else {
        n = 2;
        l = B;
       } while (0);
       c[Aa >> 2] = n;
       m = C << 16 >> 16;
       l = l << 16 >> 16;
       do if (!((E | K) << 16 >> 16)) {
        S = (b[ja + 192 >> 1] | 0) - (b[ja + 188 >> 1] | 0) | 0;
        if ((((S | 0) < 0 ? 0 - S | 0 : S) | 0) > 3) {
         l = 1;
         break;
        }
        l = (((m - l | 0) < 0 ? 0 - (m - l) | 0 : m - l | 0) | 0) > 3 & 1;
       } else l = 2; while (0);
       c[za >> 2] = l;
       h = n;
       C = p;
       Q = q;
       P = r;
       O = t;
       t = x;
       u = R;
       v = T;
       w = U;
       g = V;
       x = W;
       z = X;
       r = Y;
       q = _;
       p = $;
       n = aa;
       m = ba;
       break S;
      }
     } while (0);
     if (Ya) break;
     if (!(h | l | C | Q | o | P | s | O | G | H | F | t | u | v | w | g | x | y | z | r | q | p | n | m)) break P;
    } while (0);
    J = ja + 20 | 0;
    l = c[J >> 2] | 0;
    K = ja + 12 | 0;
    m = c[K >> 2] | 0;
    n = (m + l | 0) < 0 ? 0 : (m + l | 0) > 51 ? 51 : m + l | 0;
    L = ja + 16 | 0;
    o = c[L >> 2] | 0;
    p = d[6918 + n >> 0] | 0;
    c[rb + 648 + 28 >> 2] = p;
    q = d[6970 + ((o + l | 0) < 0 ? 0 : (o + l | 0) > 51 ? 51 : o + l | 0) >> 0] | 0;
    c[rb + 648 + 32 >> 2] = q;
    c[rb + 648 + 24 >> 2] = 7022 + (n * 3 | 0);
    do if (!ea) {
     k = c[ca + 20 >> 2] | 0;
     if ((k | 0) == (l | 0)) {
      c[rb + 648 + 4 >> 2] = p;
      c[rb + 648 + 8 >> 2] = q;
      c[rb + 648 >> 2] = 7022 + (n * 3 | 0);
      break;
     } else {
      ca = ((l + 1 + k | 0) >>> 1) + m | 0;
      ca = (ca | 0) < 0 ? 0 : (ca | 0) > 51 ? 51 : ca;
      ba = ((l + 1 + k | 0) >>> 1) + o | 0;
      c[rb + 648 + 4 >> 2] = d[6918 + ca >> 0];
      c[rb + 648 + 8 >> 2] = d[6970 + ((ba | 0) < 0 ? 0 : (ba | 0) > 51 ? 51 : ba) >> 0];
      c[rb + 648 >> 2] = 7022 + (ca * 3 | 0);
      break;
     }
    } while (0);
    do if (!j) {
     k = c[da + 20 >> 2] | 0;
     if ((k | 0) == (l | 0)) {
      c[rb + 648 + 16 >> 2] = p;
      c[rb + 648 + 20 >> 2] = q;
      c[Sa >> 2] = 7022 + (n * 3 | 0);
      break;
     } else {
      da = ((l + 1 + k | 0) >>> 1) + m | 0;
      da = (da | 0) < 0 ? 0 : (da | 0) > 51 ? 51 : da;
      ca = ((l + 1 + k | 0) >>> 1) + o | 0;
      c[rb + 648 + 16 >> 2] = d[6918 + da >> 0];
      c[rb + 648 + 20 >> 2] = d[6970 + ((ca | 0) < 0 ? 0 : (ca | 0) > 51 ? 51 : ca) >> 0];
      c[rb + 648 + 12 >> 2] = 7022 + (da * 3 | 0);
      break;
     }
    } while (0);
    I = Z(ia, ka) | 0;
    f = 3;
    F = 0;
    G = (c[Va >> 2] | 0) + (I << 8) + (ha << 4) | 0;
    H = rb + 688 | 0;
    while (1) {
     k = c[H + 4 >> 2] | 0;
     if (k) ab(G, k, Sa, ka << 4);
     k = c[H + 12 >> 2] | 0;
     if (k) ab(G + 4 | 0, k, Ra, ka << 4);
     D = H + 16 | 0;
     k = c[H + 20 >> 2] | 0;
     if (k) ab(G + 8 | 0, k, Ra, ka << 4);
     E = H + 24 | 0;
     k = c[H + 28 >> 2] | 0;
     if (k) ab(G + 12 | 0, k, Ra, ka << 4);
     B = c[H >> 2] | 0;
     C = H + 8 | 0;
     k = c[C >> 2] | 0;
     T : do if ((B | 0) == (k | 0)) {
      if ((B | 0) != (c[D >> 2] | 0)) {
       Xa = 1404;
       break;
      }
      if ((B | 0) != (c[E >> 2] | 0)) {
       Xa = 1404;
       break;
      }
      if (!B) break;
      if (B >>> 0 < 4) {
       q = d[(c[rb + 648 + (F * 12 | 0) >> 2] | 0) + (B + -1) >> 0] | 0;
       r = rb + 648 + (F * 12 | 0) + 4 | 0;
       s = rb + 648 + (F * 12 | 0) + 8 | 0;
       p = G;
       x = 16;
       while (1) {
        l = p + (0 - (ka << 4) << 1) | 0;
        t = p + (0 - (ka << 4)) | 0;
        o = p + (ka << 4) | 0;
        u = a[o >> 0] | 0;
        v = d[t >> 0] | 0;
        w = d[p >> 0] | 0;
        do if (((v - w | 0) < 0 ? 0 - (v - w) | 0 : v - w | 0) >>> 0 < (c[r >> 2] | 0) >>> 0) {
         g = d[l >> 0] | 0;
         m = c[s >> 2] | 0;
         if (((g - v | 0) < 0 ? 0 - (g - v) | 0 : g - v | 0) >>> 0 >= m >>> 0) break;
         if ((((u & 255) - w | 0) < 0 ? 0 - ((u & 255) - w) | 0 : (u & 255) - w | 0) >>> 0 >= m >>> 0) break;
         n = d[p + Qa >> 0] | 0;
         if (((n - v | 0) < 0 ? 0 - (n - v) | 0 : n - v | 0) >>> 0 < m >>> 0) {
          a[l >> 0] = ((((v + 1 + w | 0) >>> 1) - (g << 1) + n >> 1 | 0) < (0 - q | 0) ? 0 - q | 0 : (((v + 1 + w | 0) >>> 1) - (g << 1) + n >> 1 | 0) > (q | 0) ? q : ((v + 1 + w | 0) >>> 1) - (g << 1) + n >> 1) + g;
          m = c[s >> 2] | 0;
          l = q + 1 | 0;
         } else l = q;
         n = d[p + (ka << 5) >> 0] | 0;
         if (((n - w | 0) < 0 ? 0 - (n - w) | 0 : n - w | 0) >>> 0 < m >>> 0) {
          a[o >> 0] = ((((v + 1 + w | 0) >>> 1) - ((u & 255) << 1) + n >> 1 | 0) < (0 - q | 0) ? 0 - q | 0 : (((v + 1 + w | 0) >>> 1) - ((u & 255) << 1) + n >> 1 | 0) > (q | 0) ? q : ((v + 1 + w | 0) >>> 1) - ((u & 255) << 1) + n >> 1) + (u & 255);
          l = l + 1 | 0;
         }
         ca = 0 - l | 0;
         ca = (4 - (u & 255) + (w - v << 2) + g >> 3 | 0) < (ca | 0) ? ca : (4 - (u & 255) + (w - v << 2) + g >> 3 | 0) > (l | 0) ? l : 4 - (u & 255) + (w - v << 2) + g >> 3;
         da = a[6150 + (w - ca) >> 0] | 0;
         a[t >> 0] = a[6150 + (ca + v) >> 0] | 0;
         a[p >> 0] = da;
        } while (0);
        x = x + -1 | 0;
        if (!x) break T; else p = p + 1 | 0;
       }
      }
      o = rb + 648 + (F * 12 | 0) + 4 | 0;
      p = rb + 648 + (F * 12 | 0) + 8 | 0;
      n = G;
      A = 16;
      while (1) {
       q = n + (0 - (ka << 4) << 1) | 0;
       r = n + (0 - (ka << 4)) | 0;
       s = n + (ka << 4) | 0;
       t = a[s >> 0] | 0;
       u = d[r >> 0] | 0;
       v = d[n >> 0] | 0;
       l = (u - v | 0) < 0 ? 0 - (u - v) | 0 : u - v | 0;
       m = c[o >> 2] | 0;
       U : do if (l >>> 0 < m >>> 0) {
        w = d[q >> 0] | 0;
        g = c[p >> 2] | 0;
        if (((w - u | 0) < 0 ? 0 - (w - u) | 0 : w - u | 0) >>> 0 >= g >>> 0) break;
        if ((((t & 255) - v | 0) < 0 ? 0 - ((t & 255) - v) | 0 : (t & 255) - v | 0) >>> 0 >= g >>> 0) break;
        x = n + Qa | 0;
        y = n + (ka << 5) | 0;
        z = a[y >> 0] | 0;
        do if (l >>> 0 < ((m >>> 2) + 2 | 0) >>> 0) {
         l = d[x >> 0] | 0;
         if (((l - u | 0) < 0 ? 0 - (l - u) | 0 : l - u | 0) >>> 0 < g >>> 0) {
          a[r >> 0] = ((t & 255) + 4 + (v + u + w << 1) + l | 0) >>> 3;
          a[q >> 0] = (v + u + w + 2 + l | 0) >>> 2;
          a[x >> 0] = (v + u + w + 4 + (l * 3 | 0) + (d[n + (0 - (ka << 4) << 2) >> 0] << 1) | 0) >>> 3;
         } else a[r >> 0] = (u + 2 + (t & 255) + (w << 1) | 0) >>> 2;
         if ((((z & 255) - v | 0) < 0 ? 0 - ((z & 255) - v) | 0 : (z & 255) - v | 0) >>> 0 >= (c[p >> 2] | 0) >>> 0) break;
         a[n >> 0] = ((v + u + (t & 255) << 1) + 4 + w + (z & 255) | 0) >>> 3;
         a[s >> 0] = (v + u + (t & 255) + 2 + (z & 255) | 0) >>> 2;
         a[y >> 0] = (v + u + (t & 255) + 4 + ((z & 255) * 3 | 0) + (d[n + (ka * 48 | 0) >> 0] << 1) | 0) >>> 3;
         break U;
        } else a[r >> 0] = (u + 2 + (t & 255) + (w << 1) | 0) >>> 2; while (0);
        a[n >> 0] = (v + 2 + ((t & 255) << 1) + w | 0) >>> 2;
       } while (0);
       A = A + -1 | 0;
       if (!A) break; else n = n + 1 | 0;
      }
     } else Xa = 1404; while (0);
     do if ((Xa | 0) == 1404) {
      Xa = 0;
      if (B) {
       bb(G, B, rb + 648 + (F * 12 | 0) | 0, ka << 4);
       k = c[C >> 2] | 0;
      }
      if (k) bb(G + 4 | 0, k, rb + 648 + (F * 12 | 0) | 0, ka << 4);
      k = c[D >> 2] | 0;
      if (k) bb(G + 8 | 0, k, rb + 648 + (F * 12 | 0) | 0, ka << 4);
      k = c[E >> 2] | 0;
      if (!k) break;
      bb(G + 12 | 0, k, rb + 648 + (F * 12 | 0) | 0, ka << 4);
     } while (0);
     if (!f) break; else {
      f = f + -1 | 0;
      F = 2;
      G = G + (ka << 6) | 0;
      H = H + 32 | 0;
     }
    }
    s = c[ja + 24 >> 2] | 0;
    q = c[J >> 2] | 0;
    r = c[80 + (((q + s | 0) < 0 ? 0 : (q + s | 0) > 51 ? 51 : q + s | 0) << 2) >> 2] | 0;
    o = c[K >> 2] | 0;
    p = (o + r | 0) < 0 ? 0 : (o + r | 0) > 51 ? 51 : o + r | 0;
    l = c[L >> 2] | 0;
    m = d[6918 + p >> 0] | 0;
    c[rb + 648 + 28 >> 2] = m;
    n = d[6970 + ((l + r | 0) < 0 ? 0 : (l + r | 0) > 51 ? 51 : l + r | 0) >> 0] | 0;
    c[rb + 648 + 32 >> 2] = n;
    c[rb + 648 + 24 >> 2] = 7022 + (p * 3 | 0);
    do if (!ea) {
     k = c[(c[fa >> 2] | 0) + 20 >> 2] | 0;
     if ((k | 0) == (q | 0)) {
      c[rb + 648 + 4 >> 2] = m;
      c[rb + 648 + 8 >> 2] = n;
      c[rb + 648 >> 2] = 7022 + (p * 3 | 0);
      break;
     } else {
      ea = (r + 1 + (c[80 + (((k + s | 0) < 0 ? 0 : (k + s | 0) > 51 ? 51 : k + s | 0) << 2) >> 2] | 0) | 0) >>> 1;
      fa = (ea + o | 0) < 0 ? 0 : (ea + o | 0) > 51 ? 51 : ea + o | 0;
      c[rb + 648 + 4 >> 2] = d[6918 + fa >> 0];
      c[rb + 648 + 8 >> 2] = d[6970 + ((ea + l | 0) < 0 ? 0 : (ea + l | 0) > 51 ? 51 : ea + l | 0) >> 0];
      c[rb + 648 >> 2] = 7022 + (fa * 3 | 0);
      break;
     }
    } while (0);
    do if (!j) {
     k = c[(c[ga >> 2] | 0) + 20 >> 2] | 0;
     if ((k | 0) == (q | 0)) {
      c[rb + 648 + 16 >> 2] = m;
      c[rb + 648 + 20 >> 2] = n;
      c[Sa >> 2] = 7022 + (p * 3 | 0);
      break;
     } else {
      fa = (r + 1 + (c[80 + (((k + s | 0) < 0 ? 0 : (k + s | 0) > 51 ? 51 : k + s | 0) << 2) >> 2] | 0) | 0) >>> 1;
      ga = (fa + o | 0) < 0 ? 0 : (fa + o | 0) > 51 ? 51 : fa + o | 0;
      c[rb + 648 + 16 >> 2] = d[6918 + ga >> 0];
      c[rb + 648 + 20 >> 2] = d[6970 + ((fa + l | 0) < 0 ? 0 : (fa + l | 0) > 51 ? 51 : fa + l | 0) >> 0];
      c[rb + 648 + 12 >> 2] = 7022 + (ga * 3 | 0);
      break;
     }
    } while (0);
    p = (c[Va >> 2] | 0) + (ma << 8) + (I << 6) + (ha << 3) | 0;
    o = p + (ma << 6) | 0;
    q = 0;
    r = rb + 688 | 0;
    s = 0;
    while (1) {
     k = r + 4 | 0;
     l = c[k >> 2] | 0;
     if (l) {
      cb(p, l, Sa, ka << 3);
      cb(o, c[k >> 2] | 0, Sa, ka << 3);
     }
     k = r + 36 | 0;
     l = c[k >> 2] | 0;
     if (l) {
      cb(p + (ka << 4) | 0, l, Sa, ka << 3);
      cb(o + (ka << 4) | 0, c[k >> 2] | 0, Sa, ka << 3);
     }
     n = r + 16 | 0;
     k = r + 20 | 0;
     l = c[k >> 2] | 0;
     if (l) {
      cb(p + 4 | 0, l, Ra, ka << 3);
      cb(o + 4 | 0, c[k >> 2] | 0, Ra, ka << 3);
     }
     k = r + 52 | 0;
     l = c[k >> 2] | 0;
     if (l) {
      cb(p + (ka << 4) + 4 | 0, l, Ra, ka << 3);
      cb(o + (ka << 4) + 4 | 0, c[k >> 2] | 0, Ra, ka << 3);
     }
     l = c[r >> 2] | 0;
     m = r + 8 | 0;
     k = c[m >> 2] | 0;
     do if ((l | 0) == (k | 0)) {
      if ((l | 0) != (c[n >> 2] | 0)) {
       Xa = 1435;
       break;
      }
      if ((l | 0) != (c[r + 24 >> 2] | 0)) {
       Xa = 1435;
       break;
      }
      if (!l) break;
      ga = rb + 648 + (q * 12 | 0) | 0;
      db(p, l, ga, ka << 3);
      db(o, c[r >> 2] | 0, ga, ka << 3);
     } else Xa = 1435; while (0);
     do if ((Xa | 0) == 1435) {
      Xa = 0;
      if (l) {
       k = rb + 648 + (q * 12 | 0) | 0;
       eb(p, l, k, ka << 3);
       eb(o, c[r >> 2] | 0, k, ka << 3);
       k = c[m >> 2] | 0;
      }
      if (k) {
       ga = rb + 648 + (q * 12 | 0) | 0;
       eb(p + 2 | 0, k, ga, ka << 3);
       eb(o + 2 | 0, c[m >> 2] | 0, ga, ka << 3);
      }
      k = c[n >> 2] | 0;
      if (k) {
       ga = rb + 648 + (q * 12 | 0) | 0;
       eb(p + 4 | 0, k, ga, ka << 3);
       eb(o + 4 | 0, c[n >> 2] | 0, ga, ka << 3);
      }
      k = r + 24 | 0;
      l = c[k >> 2] | 0;
      if (!l) break;
      ga = rb + 648 + (q * 12 | 0) | 0;
      eb(p + 6 | 0, l, ga, ka << 3);
      eb(o + 6 | 0, c[k >> 2] | 0, ga, ka << 3);
     } while (0);
     s = s + 1 | 0;
     if ((s | 0) == 2) break; else {
      o = o + (ka << 5) | 0;
      p = p + (ka << 5) | 0;
      q = 2;
      r = r + 64 | 0;
     }
    }
    k = c[la >> 2] | 0;
   } while (0);
   l = ha + 1 | 0;
   ia = ((l | 0) == (ka | 0) & 1) + ia | 0;
   if (ia >>> 0 >= k >>> 0) break; else {
    ha = (l | 0) == (ka | 0) ? 0 : l;
    ja = ja + 216 | 0;
   }
  }
 }
 c[e + 1196 >> 2] = 0;
 c[e + 1192 >> 2] = 0;
 m = c[e + 1176 >> 2] | 0;
 if (m) {
  k = c[Ta >> 2] | 0;
  l = 0;
  do {
   c[k + (l * 216 | 0) + 4 >> 2] = 0;
   c[k + (l * 216 | 0) + 196 >> 2] = 0;
   l = l + 1 | 0;
  } while ((l | 0) != (m | 0));
 }
 t = c[Ua >> 2] | 0;
 V : do if (!(c[e + 1652 >> 2] | 0)) u = 0; else {
  k = 0;
  W : while (1) {
   switch (c[e + 1656 + (k * 20 | 0) >> 2] | 0) {
   case 5:
    {
     u = 1;
     break V;
    }
   case 0:
    break W;
   default:
    {}
   }
   k = k + 1 | 0;
  }
  u = 0;
 } while (0);
 X : do switch (c[t + 16 >> 2] | 0) {
 case 0:
  {
   if ((c[e + 1360 >> 2] | 0) != 5) {
    k = c[e + 1284 >> 2] | 0;
    l = c[e + 1388 >> 2] | 0;
    if (k >>> 0 > l >>> 0 ? (kb = c[t + 20 >> 2] | 0, (k - l | 0) >>> 0 >= kb >>> 1 >>> 0) : 0) {
     ob = e + 1284 | 0;
     pb = l;
     qb = (c[e + 1288 >> 2] | 0) + kb | 0;
    } else {
     jb = e + 1284 | 0;
     lb = l;
     mb = k;
     Xa = 1459;
    }
   } else {
    c[e + 1288 >> 2] = 0;
    c[e + 1284 >> 2] = 0;
    jb = e + 1284 | 0;
    lb = c[e + 1388 >> 2] | 0;
    mb = 0;
    Xa = 1459;
   }
   do if ((Xa | 0) == 1459) {
    if (lb >>> 0 > mb >>> 0 ? (nb = c[t + 20 >> 2] | 0, (lb - mb | 0) >>> 0 > nb >>> 1 >>> 0) : 0) {
     ob = jb;
     pb = lb;
     qb = (c[e + 1288 >> 2] | 0) - nb | 0;
     break;
    }
    ob = jb;
    pb = lb;
    qb = c[e + 1288 >> 2] | 0;
   } while (0);
   if (!(c[e + 1364 >> 2] | 0)) {
    k = c[e + 1392 >> 2] | 0;
    k = qb + pb + ((k | 0) < 0 ? k : 0) | 0;
    break X;
   }
   c[e + 1288 >> 2] = qb;
   k = c[e + 1392 >> 2] | 0;
   if (!u) {
    c[ob >> 2] = pb;
    k = qb + pb + ((k | 0) < 0 ? k : 0) | 0;
    break X;
   } else {
    c[e + 1288 >> 2] = 0;
    c[ob >> 2] = (k | 0) < 0 ? 0 - k | 0 : 0;
    k = 0;
    break X;
   }
  }
 case 1:
  {
   if ((c[e + 1360 >> 2] | 0) != 5) {
    k = c[e + 1296 >> 2] | 0;
    if ((c[e + 1292 >> 2] | 0) >>> 0 > (c[e + 1380 >> 2] | 0) >>> 0) k = (c[t + 12 >> 2] | 0) + k | 0;
   } else k = 0;
   p = c[t + 36 >> 2] | 0;
   if (!p) l = 0; else l = (c[e + 1380 >> 2] | 0) + k | 0;
   s = (c[e + 1364 >> 2] | 0) == 0;
   o = (((l | 0) != 0 & s) << 31 >> 31) + l | 0;
   if (o) {
    r = ((o + -1 | 0) >>> 0) % (p >>> 0) | 0;
    q = ((o + -1 | 0) >>> 0) / (p >>> 0) | 0;
   } else {
    r = 0;
    q = 0;
   }
   if (!p) l = 0; else {
    m = c[t + 40 >> 2] | 0;
    l = 0;
    n = 0;
    do {
     l = (c[m + (n << 2) >> 2] | 0) + l | 0;
     n = n + 1 | 0;
    } while ((n | 0) != (p | 0));
   }
   if (o) {
    l = Z(l, q) | 0;
    m = c[t + 40 >> 2] | 0;
    n = 0;
    do {
     l = (c[m + (n << 2) >> 2] | 0) + l | 0;
     n = n + 1 | 0;
    } while (n >>> 0 <= r >>> 0);
   } else l = 0;
   if (s) m = (c[t + 28 >> 2] | 0) + l | 0; else m = l;
   l = (c[e + 1400 >> 2] | 0) + (c[t + 32 >> 2] | 0) | 0;
   if (!u) {
    qb = ((l | 0) < 0 ? l : 0) + m + (c[e + 1396 >> 2] | 0) | 0;
    c[e + 1296 >> 2] = k;
    c[e + 1292 >> 2] = c[e + 1380 >> 2];
    k = qb;
    break X;
   } else {
    c[e + 1296 >> 2] = 0;
    c[e + 1292 >> 2] = 0;
    k = 0;
    break X;
   }
  }
 default:
  {
   if ((c[e + 1360 >> 2] | 0) == 5) {
    l = e + 1296 | 0;
    m = 0;
    k = 0;
   } else {
    n = c[e + 1380 >> 2] | 0;
    k = c[e + 1296 >> 2] | 0;
    if ((c[e + 1292 >> 2] | 0) >>> 0 > n >>> 0) k = (c[t + 12 >> 2] | 0) + k | 0;
    l = e + 1296 | 0;
    m = k;
    k = (((c[e + 1364 >> 2] | 0) == 0) << 31 >> 31) + (k + n << 1) | 0;
   }
   if (!u) {
    c[l >> 2] = m;
    c[e + 1292 >> 2] = c[e + 1380 >> 2];
    break X;
   } else {
    c[l >> 2] = 0;
    c[e + 1292 >> 2] = 0;
    k = 0;
    break X;
   }
  }
 } while (0);
 do if (c[Wa >> 2] | 0) {
  m = c[e + 1380 >> 2] | 0;
  n = c[e + 1360 >> 2] | 0;
  o = c[e + 1208 >> 2] | 0;
  p = c[e + 1204 >> 2] | 0;
  l = c[Va >> 2] | 0;
  if (!(c[e + 1364 >> 2] | 0)) {
   Za(e + 1220 | 0, 0, l, m, k, (n | 0) == 5 & 1, o, p);
   break;
  } else {
   Za(e + 1220 | 0, e + 1644 | 0, l, m, k, (n | 0) == 5 & 1, o, p);
   break;
  }
 } while (0);
 c[e + 1184 >> 2] = 0;
 c[Wa >> 2] = 0;
 e = 1;
 i = rb;
 return e | 0;
}

function Ka(f, g, h, j, k, l, m, n) {
 f = f | 0;
 g = g | 0;
 h = h | 0;
 j = j | 0;
 k = k | 0;
 l = l | 0;
 m = m | 0;
 n = n | 0;
 var o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0, R = 0, S = 0, T = 0, U = 0, V = 0, W = 0, X = 0;
 V = i;
 i = i + 80 | 0;
 G = c[g >> 2] | 0;
 c[f >> 2] = G;
 o = (c[f + 196 >> 2] | 0) + 1 | 0;
 c[f + 196 >> 2] = o;
 F = c[h + 4 >> 2] | 0;
 T = Z(c[h + 8 >> 2] | 0, F) | 0;
 E = c[h >> 2] | 0;
 c[h + 12 >> 2] = E + (((l >>> 0) % (F >>> 0) | 0) << 4) + (l - ((l >>> 0) % (F >>> 0) | 0) << 8);
 F = E + (T << 8) + (l - ((l >>> 0) % (F >>> 0) | 0) << 6) + (((l >>> 0) % (F >>> 0) | 0) << 3) | 0;
 c[h + 16 >> 2] = F;
 c[h + 20 >> 2] = F + (T << 6);
 if ((G | 0) == 31) {
  c[f + 20 >> 2] = 0;
  if (o >>> 0 > 1) {
   b[f + 28 >> 1] = 16;
   b[f + 30 >> 1] = 16;
   b[f + 32 >> 1] = 16;
   b[f + 34 >> 1] = 16;
   b[f + 36 >> 1] = 16;
   b[f + 38 >> 1] = 16;
   b[f + 40 >> 1] = 16;
   b[f + 42 >> 1] = 16;
   b[f + 44 >> 1] = 16;
   b[f + 46 >> 1] = 16;
   b[f + 48 >> 1] = 16;
   b[f + 50 >> 1] = 16;
   b[f + 52 >> 1] = 16;
   b[f + 54 >> 1] = 16;
   b[f + 56 >> 1] = 16;
   b[f + 58 >> 1] = 16;
   b[f + 60 >> 1] = 16;
   b[f + 62 >> 1] = 16;
   b[f + 64 >> 1] = 16;
   b[f + 66 >> 1] = 16;
   b[f + 68 >> 1] = 16;
   b[f + 70 >> 1] = 16;
   b[f + 72 >> 1] = 16;
   b[f + 74 >> 1] = 16;
   n = 0;
   i = V;
   return n | 0;
  }
  k = 23;
  p = g + 328 | 0;
  q = n;
  o = f + 28 | 0;
  while (1) {
   b[o >> 1] = 16;
   a[q >> 0] = c[p >> 2];
   a[q + 1 >> 0] = c[p + 4 >> 2];
   a[q + 2 >> 0] = c[p + 8 >> 2];
   a[q + 3 >> 0] = c[p + 12 >> 2];
   a[q + 4 >> 0] = c[p + 16 >> 2];
   a[q + 5 >> 0] = c[p + 20 >> 2];
   a[q + 6 >> 0] = c[p + 24 >> 2];
   a[q + 7 >> 0] = c[p + 28 >> 2];
   a[q + 8 >> 0] = c[p + 32 >> 2];
   a[q + 9 >> 0] = c[p + 36 >> 2];
   a[q + 10 >> 0] = c[p + 40 >> 2];
   a[q + 11 >> 0] = c[p + 44 >> 2];
   a[q + 12 >> 0] = c[p + 48 >> 2];
   a[q + 13 >> 0] = c[p + 52 >> 2];
   a[q + 14 >> 0] = c[p + 56 >> 2];
   a[q + 15 >> 0] = c[p + 60 >> 2];
   if (!k) break; else {
    k = k + -1 | 0;
    p = p + 64 | 0;
    q = q + 16 | 0;
    o = o + 2 | 0;
   }
  }
  $a(h, n);
  n = 0;
  i = V;
  return n | 0;
 }
 do if (!G) {
  o = f + 28 | 0;
  q = o + 54 | 0;
  do {
   a[o >> 0] = 0;
   o = o + 1 | 0;
  } while ((o | 0) < (q | 0));
  c[f + 20 >> 2] = c[k >> 2];
  r = 0;
 } else {
  o = f + 28 | 0;
  p = g + 272 | 0;
  q = o + 54 | 0;
  do {
   a[o >> 0] = a[p >> 0] | 0;
   o = o + 1 | 0;
   p = p + 1 | 0;
  } while ((o | 0) < (q | 0));
  p = c[g + 8 >> 2] | 0;
  o = c[k >> 2] | 0;
  do if (p) {
   c[k >> 2] = o + p;
   if ((o + p | 0) < 0) {
    c[k >> 2] = o + p + 52;
    o = o + p + 52 | 0;
    break;
   }
   if ((o + p | 0) > 51) {
    c[k >> 2] = o + p + -52;
    o = o + p + -52 | 0;
   } else o = o + p | 0;
  } while (0);
  c[f + 20 >> 2] = o;
  a : do if (G >>> 0 > 6) {
   if (!(b[f + 76 >> 1] | 0)) {
    o = g + 1992 | 0;
    k = 15;
    p = g + 328 | 0;
    r = 320;
    q = f + 28 | 0;
   } else {
    F = a[4868 + o >> 0] | 0;
    p = a[4816 + o >> 0] | 0;
    y = c[g + 1872 >> 2] | 0;
    u = c[g + 1884 >> 2] | 0;
    w = c[g + 1880 >> 2] | 0;
    A = c[g + 1896 >> 2] | 0;
    T = c[g + 1876 >> 2] | 0;
    s = c[g + 1888 >> 2] | 0;
    z = c[g + 1892 >> 2] | 0;
    x = c[g + 1912 >> 2] | 0;
    W = c[g + 1900 >> 2] | 0;
    E = c[g + 1904 >> 2] | 0;
    B = c[g + 1908 >> 2] | 0;
    X = c[g + 1916 >> 2] | 0;
    v = c[g + 1864 >> 2] | 0;
    t = c[g + 1868 >> 2] | 0;
    q = t + s + (v + u) | 0;
    c[g + 1864 >> 2] = q;
    k = t - s + (v - u) | 0;
    c[g + 1868 >> 2] = k;
    r = v - u - (t - s) | 0;
    c[g + 1872 >> 2] = r;
    s = v + u - (t + s) | 0;
    c[g + 1876 >> 2] = s;
    t = x + w + (z + y) | 0;
    c[g + 1880 >> 2] = t;
    u = w - x + (y - z) | 0;
    c[g + 1884 >> 2] = u;
    v = y - z - (w - x) | 0;
    c[g + 1888 >> 2] = v;
    w = z + y - (x + w) | 0;
    c[g + 1892 >> 2] = w;
    x = X + A + (B + T) | 0;
    c[g + 1896 >> 2] = x;
    y = A - X + (T - B) | 0;
    c[g + 1900 >> 2] = y;
    z = T - B - (A - X) | 0;
    c[g + 1904 >> 2] = z;
    A = B + T - (X + A) | 0;
    c[g + 1908 >> 2] = A;
    X = c[g + 1920 >> 2] | 0;
    T = c[g + 1924 >> 2] | 0;
    B = T + E + (X + W) | 0;
    c[g + 1912 >> 2] = B;
    C = E - T + (W - X) | 0;
    c[g + 1916 >> 2] = C;
    D = W - X - (E - T) | 0;
    c[g + 1920 >> 2] = D;
    E = X + W - (T + E) | 0;
    c[g + 1924 >> 2] = E;
    F = c[8 + ((F & 255) * 12 | 0) >> 2] | 0;
    if (o >>> 0 > 11) {
     o = F << (p & 255) + -2;
     c[g + 1864 >> 2] = Z(o, B + t + (q + x) | 0) | 0;
     c[g + 1880 >> 2] = Z(o, t - B + (q - x) | 0) | 0;
     c[g + 1896 >> 2] = Z(o, q - x - (t - B) | 0) | 0;
     c[g + 1912 >> 2] = Z(o, q + x - (B + t) | 0) | 0;
     c[g + 1868 >> 2] = Z(o, C + u + (k + y) | 0) | 0;
     c[g + 1884 >> 2] = Z(o, u - C + (k - y) | 0) | 0;
     c[g + 1900 >> 2] = Z(o, k - y - (u - C) | 0) | 0;
     c[g + 1916 >> 2] = Z(o, k + y - (C + u) | 0) | 0;
     c[g + 1872 >> 2] = Z(o, D + v + (r + z) | 0) | 0;
     c[g + 1888 >> 2] = Z(o, v - D + (r - z) | 0) | 0;
     c[g + 1904 >> 2] = Z(o, r - z - (v - D) | 0) | 0;
     c[g + 1920 >> 2] = Z(o, r + z - (D + v) | 0) | 0;
     c[g + 1876 >> 2] = Z(o, E + w + (s + A) | 0) | 0;
     c[g + 1892 >> 2] = Z(o, w - E + (s - A) | 0) | 0;
     c[g + 1908 >> 2] = Z(o, s - A - (w - E) | 0) | 0;
     o = Z(o, s + A - (E + w) | 0) | 0;
    } else {
     X = (o + -6 | 0) >>> 0 < 6 ? 1 : 2;
     o = 2 - (p & 255) | 0;
     c[g + 1864 >> 2] = (Z(F, B + t + (q + x) | 0) | 0) + X >> o;
     c[g + 1880 >> 2] = (Z(F, t - B + (q - x) | 0) | 0) + X >> o;
     c[g + 1896 >> 2] = (Z(F, q - x - (t - B) | 0) | 0) + X >> o;
     c[g + 1912 >> 2] = (Z(F, q + x - (B + t) | 0) | 0) + X >> o;
     c[g + 1868 >> 2] = (Z(F, C + u + (k + y) | 0) | 0) + X >> o;
     c[g + 1884 >> 2] = (Z(F, u - C + (k - y) | 0) | 0) + X >> o;
     c[g + 1900 >> 2] = (Z(F, k - y - (u - C) | 0) | 0) + X >> o;
     c[g + 1916 >> 2] = (Z(F, k + y - (C + u) | 0) | 0) + X >> o;
     c[g + 1872 >> 2] = (Z(F, D + v + (r + z) | 0) | 0) + X >> o;
     c[g + 1888 >> 2] = (Z(F, v - D + (r - z) | 0) | 0) + X >> o;
     c[g + 1904 >> 2] = (Z(F, r - z - (v - D) | 0) | 0) + X >> o;
     c[g + 1920 >> 2] = (Z(F, r + z - (D + v) | 0) | 0) + X >> o;
     c[g + 1876 >> 2] = (Z(F, E + w + (s + A) | 0) | 0) + X >> o;
     c[g + 1892 >> 2] = (Z(F, w - E + (s - A) | 0) | 0) + X >> o;
     c[g + 1908 >> 2] = (Z(F, s - A - (w - E) | 0) | 0) + X >> o;
     o = (Z(F, s + A - (E + w) | 0) | 0) + X >> o;
    }
    c[g + 1924 >> 2] = o;
    o = g + 1992 | 0;
    k = 15;
    p = g + 328 | 0;
    r = 320;
    q = f + 28 | 0;
   }
   while (1) {
    X = c[g + 1864 + (c[r >> 2] << 2) >> 2] | 0;
    r = r + 4 | 0;
    c[p >> 2] = X;
    if ((X | 0) == 0 ? (b[q >> 1] | 0) == 0 : 0) c[p >> 2] = 16777215; else U = 21;
    if ((U | 0) == 21 ? (U = 0, (Ja(p, c[f + 20 >> 2] | 0, 1, c[o >> 2] | 0) | 0) != 0) : 0) {
     o = 1;
     break;
    }
    p = p + 64 | 0;
    q = q + 2 | 0;
    o = o + 4 | 0;
    if (!k) {
     t = p;
     break a;
    } else k = k + -1 | 0;
   }
   i = V;
   return o | 0;
  } else {
   o = g + 1992 | 0;
   k = 15;
   p = g + 328 | 0;
   q = f + 28 | 0;
   while (1) {
    if (b[q >> 1] | 0) {
     if (Ja(p, c[f + 20 >> 2] | 0, 0, c[o >> 2] | 0) | 0) {
      o = 1;
      break;
     }
    } else c[p >> 2] = 16777215;
    p = p + 64 | 0;
    q = q + 2 | 0;
    o = o + 4 | 0;
    if (!k) {
     t = p;
     break a;
    } else k = k + -1 | 0;
   }
   i = V;
   return o | 0;
  } while (0);
  p = (c[f + 24 >> 2] | 0) + (c[f + 20 >> 2] | 0) | 0;
  p = (p | 0) < 0 ? 0 : (p | 0) > 51 ? 51 : p;
  s = c[80 + (p << 2) >> 2] | 0;
  if ((b[f + 78 >> 1] | 0) == 0 ? (b[f + 80 >> 1] | 0) == 0 : 0) {
   k = g + 1932 | 0;
   p = c[g + 1928 >> 2] | 0;
  } else {
   k = c[8 + ((d[4868 + s >> 0] | 0) * 12 | 0) >> 2] | 0;
   if ((p + -6 | 0) >>> 0 < 46) {
    k = k << (d[4816 + s >> 0] | 0) + -1;
    p = 0;
   } else p = 1;
   W = c[g + 1928 >> 2] | 0;
   T = c[g + 1936 >> 2] | 0;
   F = c[g + 1932 >> 2] | 0;
   E = c[g + 1940 >> 2] | 0;
   X = (Z(E + F + (T + W) | 0, k) | 0) >> p;
   c[g + 1928 >> 2] = X;
   c[g + 1932 >> 2] = (Z(T + W - (E + F) | 0, k) | 0) >> p;
   c[g + 1936 >> 2] = (Z(F - E + (W - T) | 0, k) | 0) >> p;
   c[g + 1940 >> 2] = (Z(W - T - (F - E) | 0, k) | 0) >> p;
   E = c[g + 1944 >> 2] | 0;
   F = c[g + 1952 >> 2] | 0;
   T = c[g + 1948 >> 2] | 0;
   W = c[g + 1956 >> 2] | 0;
   c[g + 1944 >> 2] = (Z(W + T + (F + E) | 0, k) | 0) >> p;
   c[g + 1948 >> 2] = (Z(F + E - (W + T) | 0, k) | 0) >> p;
   c[g + 1952 >> 2] = (Z(T - W + (E - F) | 0, k) | 0) >> p;
   c[g + 1956 >> 2] = (Z(E - F - (T - W) | 0, k) | 0) >> p;
   k = g + 1932 | 0;
   p = X;
  }
  c[t >> 2] = p;
  if ((p | 0) == 0 ? (b[q >> 1] | 0) == 0 : 0) c[t >> 2] = 16777215; else U = 36;
  if ((U | 0) == 36 ? (Ja(t, s, 1, c[o >> 2] | 0) | 0) != 0 : 0) {
   X = 1;
   i = V;
   return X | 0;
  }
  r = o + 4 | 0;
  X = c[k >> 2] | 0;
  p = t + 64 | 0;
  c[p >> 2] = X;
  if ((X | 0) == 0 ? (b[q + 2 >> 1] | 0) == 0 : 0) c[p >> 2] = 16777215; else U = 40;
  if ((U | 0) == 40 ? (Ja(p, s, 1, c[r >> 2] | 0) | 0) != 0 : 0) {
   X = 1;
   i = V;
   return X | 0;
  }
  p = o + 8 | 0;
  X = c[g + 1936 >> 2] | 0;
  k = t + 128 | 0;
  c[k >> 2] = X;
  if ((X | 0) == 0 ? (b[q + 4 >> 1] | 0) == 0 : 0) c[k >> 2] = 16777215; else U = 44;
  if ((U | 0) == 44 ? (Ja(k, s, 1, c[p >> 2] | 0) | 0) != 0 : 0) {
   X = 1;
   i = V;
   return X | 0;
  }
  p = o + 12 | 0;
  X = c[g + 1940 >> 2] | 0;
  k = t + 192 | 0;
  c[k >> 2] = X;
  if ((X | 0) == 0 ? (b[q + 6 >> 1] | 0) == 0 : 0) c[k >> 2] = 16777215; else U = 48;
  if ((U | 0) == 48 ? (Ja(k, s, 1, c[p >> 2] | 0) | 0) != 0 : 0) {
   X = 1;
   i = V;
   return X | 0;
  }
  p = o + 16 | 0;
  X = c[g + 1944 >> 2] | 0;
  k = t + 256 | 0;
  c[k >> 2] = X;
  if ((X | 0) == 0 ? (b[q + 8 >> 1] | 0) == 0 : 0) c[k >> 2] = 16777215; else U = 52;
  if ((U | 0) == 52 ? (Ja(k, s, 1, c[p >> 2] | 0) | 0) != 0 : 0) {
   X = 1;
   i = V;
   return X | 0;
  }
  p = o + 20 | 0;
  X = c[g + 1948 >> 2] | 0;
  k = t + 320 | 0;
  c[k >> 2] = X;
  if ((X | 0) == 0 ? (b[q + 10 >> 1] | 0) == 0 : 0) c[k >> 2] = 16777215; else U = 56;
  if ((U | 0) == 56 ? (Ja(k, s, 1, c[p >> 2] | 0) | 0) != 0 : 0) {
   X = 1;
   i = V;
   return X | 0;
  }
  p = o + 24 | 0;
  X = c[g + 1952 >> 2] | 0;
  k = t + 384 | 0;
  c[k >> 2] = X;
  if ((X | 0) == 0 ? (b[q + 12 >> 1] | 0) == 0 : 0) c[k >> 2] = 16777215; else U = 60;
  if ((U | 0) == 60 ? (Ja(k, s, 1, c[p >> 2] | 0) | 0) != 0 : 0) {
   X = 1;
   i = V;
   return X | 0;
  }
  p = o + 28 | 0;
  X = c[g + 1956 >> 2] | 0;
  o = t + 448 | 0;
  c[o >> 2] = X;
  if ((X | 0) == 0 ? (b[q + 14 >> 1] | 0) == 0 : 0) c[o >> 2] = 16777215; else U = 64;
  if ((U | 0) == 64 ? (Ja(o, s, 1, c[p >> 2] | 0) | 0) != 0 : 0) {
   X = 1;
   i = V;
   return X | 0;
  }
  if (G >>> 0 < 6) {
   r = c[f >> 2] | 0;
   break;
  }
  do if (l) {
   r = c[h + 4 >> 2] | 0;
   s = Z(c[h + 8 >> 2] | 0, r) | 0;
   t = Z((l >>> 0) / (r >>> 0) | 0, r) | 0;
   q = c[h >> 2] | 0;
   o = q + (Z(r << 8, (l >>> 0) / (r >>> 0) | 0) | 0) + (l - t << 4) | 0;
   if ((l >>> 0) / (r >>> 0) | 0) {
    a[V >> 0] = a[o + (0 - (r << 4 | 1)) >> 0] | 0;
    X = o + (0 - (r << 4 | 1)) + 1 + 1 | 0;
    a[V + 1 >> 0] = a[o + (0 - (r << 4 | 1)) + 1 >> 0] | 0;
    a[V + 2 >> 0] = a[X >> 0] | 0;
    a[V + 3 >> 0] = a[X + 1 >> 0] | 0;
    a[V + 4 >> 0] = a[X + 1 + 1 >> 0] | 0;
    a[V + 5 >> 0] = a[X + 1 + 1 + 1 >> 0] | 0;
    k = X + 1 + 1 + 1 + 1 + 1 | 0;
    a[V + 6 >> 0] = a[X + 1 + 1 + 1 + 1 >> 0] | 0;
    a[V + 7 >> 0] = a[k >> 0] | 0;
    a[V + 8 >> 0] = a[k + 1 >> 0] | 0;
    a[V + 9 >> 0] = a[k + 1 + 1 >> 0] | 0;
    a[V + 10 >> 0] = a[k + 1 + 1 + 1 >> 0] | 0;
    X = k + 1 + 1 + 1 + 1 + 1 | 0;
    a[V + 11 >> 0] = a[k + 1 + 1 + 1 + 1 >> 0] | 0;
    a[V + 12 >> 0] = a[X >> 0] | 0;
    a[V + 13 >> 0] = a[X + 1 >> 0] | 0;
    a[V + 14 >> 0] = a[X + 1 + 1 >> 0] | 0;
    a[V + 15 >> 0] = a[X + 1 + 1 + 1 >> 0] | 0;
    k = X + 1 + 1 + 1 + 1 + 1 | 0;
    a[V + 16 >> 0] = a[X + 1 + 1 + 1 + 1 >> 0] | 0;
    a[V + 17 >> 0] = a[k >> 0] | 0;
    a[V + 18 >> 0] = a[k + 1 >> 0] | 0;
    a[V + 19 >> 0] = a[k + 1 + 1 >> 0] | 0;
    a[V + 20 >> 0] = a[k + 1 + 1 + 1 >> 0] | 0;
    k = V + 21 | 0;
   } else k = V;
   if ((t | 0) != (l | 0)) {
    a[V + 40 >> 0] = a[o + -1 >> 0] | 0;
    a[V + 40 + 1 >> 0] = a[o + -1 + (r << 4) >> 0] | 0;
    p = o + -1 + (r << 4) + (r << 4) | 0;
    a[V + 40 + 2 >> 0] = a[p >> 0] | 0;
    a[V + 40 + 3 >> 0] = a[p + (r << 4) >> 0] | 0;
    a[V + 40 + 4 >> 0] = a[p + (r << 4) + (r << 4) >> 0] | 0;
    p = p + (r << 4) + (r << 4) + (r << 4) | 0;
    a[V + 40 + 5 >> 0] = a[p >> 0] | 0;
    a[V + 40 + 6 >> 0] = a[p + (r << 4) >> 0] | 0;
    a[V + 40 + 7 >> 0] = a[p + (r << 4) + (r << 4) >> 0] | 0;
    p = p + (r << 4) + (r << 4) + (r << 4) | 0;
    a[V + 40 + 8 >> 0] = a[p >> 0] | 0;
    a[V + 40 + 9 >> 0] = a[p + (r << 4) >> 0] | 0;
    a[V + 40 + 10 >> 0] = a[p + (r << 4) + (r << 4) >> 0] | 0;
    p = p + (r << 4) + (r << 4) + (r << 4) | 0;
    a[V + 40 + 11 >> 0] = a[p >> 0] | 0;
    a[V + 40 + 12 >> 0] = a[p + (r << 4) >> 0] | 0;
    a[V + 40 + 13 >> 0] = a[p + (r << 4) + (r << 4) >> 0] | 0;
    p = p + (r << 4) + (r << 4) + (r << 4) | 0;
    a[V + 40 + 14 >> 0] = a[p >> 0] | 0;
    a[V + 40 + 15 >> 0] = a[p + (r << 4) >> 0] | 0;
    p = V + 40 + 16 | 0;
   } else p = V + 40 | 0;
   o = q + (s << 8) + (Z(((l >>> 0) / (r >>> 0) | 0) << 3, r << 3 & 2147483640) | 0) + (l - t << 3) | 0;
   if ((l >>> 0) / (r >>> 0) | 0) {
    W = o + (0 - (r << 3 & 2147483640 | 1)) + 1 | 0;
    a[k >> 0] = a[o + (0 - (r << 3 & 2147483640 | 1)) >> 0] | 0;
    a[k + 1 >> 0] = a[W >> 0] | 0;
    a[k + 2 >> 0] = a[W + 1 >> 0] | 0;
    a[k + 3 >> 0] = a[W + 1 + 1 >> 0] | 0;
    a[k + 4 >> 0] = a[W + 1 + 1 + 1 >> 0] | 0;
    X = W + 1 + 1 + 1 + 1 + 1 | 0;
    a[k + 5 >> 0] = a[W + 1 + 1 + 1 + 1 >> 0] | 0;
    a[k + 6 >> 0] = a[X >> 0] | 0;
    a[k + 7 >> 0] = a[X + 1 >> 0] | 0;
    a[k + 8 >> 0] = a[X + 1 + 1 >> 0] | 0;
    W = X + 1 + 1 + 1 + ((s << 6) + -9) + 1 | 0;
    a[k + 9 >> 0] = a[X + 1 + 1 + 1 + ((s << 6) + -9) >> 0] | 0;
    a[k + 10 >> 0] = a[W >> 0] | 0;
    a[k + 11 >> 0] = a[W + 1 >> 0] | 0;
    a[k + 12 >> 0] = a[W + 1 + 1 >> 0] | 0;
    a[k + 13 >> 0] = a[W + 1 + 1 + 1 >> 0] | 0;
    X = W + 1 + 1 + 1 + 1 + 1 | 0;
    a[k + 14 >> 0] = a[W + 1 + 1 + 1 + 1 >> 0] | 0;
    a[k + 15 >> 0] = a[X >> 0] | 0;
    a[k + 16 >> 0] = a[X + 1 >> 0] | 0;
    a[k + 17 >> 0] = a[X + 1 + 1 >> 0] | 0;
   }
   if ((t | 0) == (l | 0)) break;
   a[p >> 0] = a[o + -1 >> 0] | 0;
   a[p + 1 >> 0] = a[o + -1 + (r << 3 & 2147483640) >> 0] | 0;
   X = o + -1 + (r << 3 & 2147483640) + (r << 3 & 2147483640) | 0;
   a[p + 2 >> 0] = a[X >> 0] | 0;
   a[p + 3 >> 0] = a[X + (r << 3 & 2147483640) >> 0] | 0;
   a[p + 4 >> 0] = a[X + (r << 3 & 2147483640) + (r << 3 & 2147483640) >> 0] | 0;
   X = X + (r << 3 & 2147483640) + (r << 3 & 2147483640) + (r << 3 & 2147483640) | 0;
   a[p + 5 >> 0] = a[X >> 0] | 0;
   a[p + 6 >> 0] = a[X + (r << 3 & 2147483640) >> 0] | 0;
   a[p + 7 >> 0] = a[X + (r << 3 & 2147483640) + (r << 3 & 2147483640) >> 0] | 0;
   X = X + (r << 3 & 2147483640) + (r << 3 & 2147483640) + (r << 3 & 2147483640) + (s - r << 6) | 0;
   a[p + 8 >> 0] = a[X >> 0] | 0;
   a[p + 9 >> 0] = a[X + (r << 3 & 2147483640) >> 0] | 0;
   a[p + 10 >> 0] = a[X + (r << 3 & 2147483640) + (r << 3 & 2147483640) >> 0] | 0;
   X = X + (r << 3 & 2147483640) + (r << 3 & 2147483640) + (r << 3 & 2147483640) | 0;
   a[p + 11 >> 0] = a[X >> 0] | 0;
   a[p + 12 >> 0] = a[X + (r << 3 & 2147483640) >> 0] | 0;
   a[p + 13 >> 0] = a[X + (r << 3 & 2147483640) + (r << 3 & 2147483640) >> 0] | 0;
   X = X + (r << 3 & 2147483640) + (r << 3 & 2147483640) + (r << 3 & 2147483640) | 0;
   a[p + 14 >> 0] = a[X >> 0] | 0;
   a[p + 15 >> 0] = a[X + (r << 3 & 2147483640) >> 0] | 0;
  } while (0);
  s = c[f >> 2] | 0;
  b : do if (s >>> 0 > 6) {
   o = c[f + 200 >> 2] | 0;
   do if (!o) {
    r = (m | 0) != 0;
    k = 0;
   } else {
    p = (c[f + 4 >> 2] | 0) == (c[o + 4 >> 2] | 0);
    if (!((m | 0) != 0 & p)) {
     r = (m | 0) != 0;
     k = p & 1;
     break;
    }
    r = 1;
    k = (c[o >> 2] | 0) >>> 0 < 6 ? 0 : p & 1;
   } while (0);
   o = c[f + 204 >> 2] | 0;
   do if (!o) q = 0; else {
    p = (c[f + 4 >> 2] | 0) == (c[o + 4 >> 2] | 0);
    if (!(r & p)) {
     q = p & 1;
     break;
    }
    q = (c[o >> 2] | 0) >>> 0 < 6 ? 0 : p & 1;
   } while (0);
   o = c[f + 212 >> 2] | 0;
   do if (!o) o = 0; else {
    p = (c[f + 4 >> 2] | 0) == (c[o + 4 >> 2] | 0);
    if (!(r & p)) {
     o = p & 1;
     break;
    }
    o = (c[o >> 2] | 0) >>> 0 < 6 ? 0 : p & 1;
   } while (0);
   switch (s + 1 & 3 | 0) {
   case 0:
    {
     if (!q) break b;
     o = n;
     p = 0;
     while (1) {
      a[o >> 0] = a[V + 1 >> 0] | 0;
      a[o + 1 >> 0] = a[V + 2 >> 0] | 0;
      a[o + 2 >> 0] = a[V + 3 >> 0] | 0;
      a[o + 3 >> 0] = a[V + 4 >> 0] | 0;
      a[o + 4 >> 0] = a[V + 5 >> 0] | 0;
      a[o + 5 >> 0] = a[V + 6 >> 0] | 0;
      a[o + 6 >> 0] = a[V + 7 >> 0] | 0;
      a[o + 7 >> 0] = a[V + 8 >> 0] | 0;
      a[o + 8 >> 0] = a[V + 9 >> 0] | 0;
      a[o + 9 >> 0] = a[V + 10 >> 0] | 0;
      a[o + 10 >> 0] = a[V + 11 >> 0] | 0;
      a[o + 11 >> 0] = a[V + 12 >> 0] | 0;
      a[o + 12 >> 0] = a[V + 13 >> 0] | 0;
      a[o + 13 >> 0] = a[V + 14 >> 0] | 0;
      a[o + 14 >> 0] = a[V + 15 >> 0] | 0;
      a[o + 15 >> 0] = a[V + 16 >> 0] | 0;
      p = p + 1 | 0;
      if ((p | 0) == 16) break; else o = o + 16 | 0;
     }
     break;
    }
   case 1:
    {
     if (!k) break b; else {
      o = n;
      p = 0;
     }
     while (1) {
      X = V + 40 + p | 0;
      a[o >> 0] = a[X >> 0] | 0;
      a[o + 1 >> 0] = a[X >> 0] | 0;
      a[o + 2 >> 0] = a[X >> 0] | 0;
      a[o + 3 >> 0] = a[X >> 0] | 0;
      a[o + 4 >> 0] = a[X >> 0] | 0;
      a[o + 5 >> 0] = a[X >> 0] | 0;
      a[o + 6 >> 0] = a[X >> 0] | 0;
      a[o + 7 >> 0] = a[X >> 0] | 0;
      a[o + 8 >> 0] = a[X >> 0] | 0;
      a[o + 9 >> 0] = a[X >> 0] | 0;
      a[o + 10 >> 0] = a[X >> 0] | 0;
      a[o + 11 >> 0] = a[X >> 0] | 0;
      a[o + 12 >> 0] = a[X >> 0] | 0;
      a[o + 13 >> 0] = a[X >> 0] | 0;
      a[o + 14 >> 0] = a[X >> 0] | 0;
      a[o + 15 >> 0] = a[X >> 0] | 0;
      p = p + 1 | 0;
      if ((p | 0) == 16) break; else o = o + 16 | 0;
     }
     break;
    }
   case 2:
    {
     p = (k | 0) != 0;
     o = (q | 0) != 0;
     do if (p & o) o = ((d[V + 1 >> 0] | 0) + 16 + (d[V + 40 >> 0] | 0) + (d[V + 2 >> 0] | 0) + (d[V + 40 + 1 >> 0] | 0) + (d[V + 3 >> 0] | 0) + (d[V + 40 + 2 >> 0] | 0) + (d[V + 4 >> 0] | 0) + (d[V + 40 + 3 >> 0] | 0) + (d[V + 5 >> 0] | 0) + (d[V + 40 + 4 >> 0] | 0) + (d[V + 6 >> 0] | 0) + (d[V + 40 + 5 >> 0] | 0) + (d[V + 7 >> 0] | 0) + (d[V + 40 + 6 >> 0] | 0) + (d[V + 8 >> 0] | 0) + (d[V + 40 + 7 >> 0] | 0) + (d[V + 9 >> 0] | 0) + (d[V + 40 + 8 >> 0] | 0) + (d[V + 10 >> 0] | 0) + (d[V + 40 + 9 >> 0] | 0) + (d[V + 11 >> 0] | 0) + (d[V + 40 + 10 >> 0] | 0) + (d[V + 12 >> 0] | 0) + (d[V + 40 + 11 >> 0] | 0) + (d[V + 13 >> 0] | 0) + (d[V + 40 + 12 >> 0] | 0) + (d[V + 14 >> 0] | 0) + (d[V + 40 + 13 >> 0] | 0) + (d[V + 15 >> 0] | 0) + (d[V + 40 + 14 >> 0] | 0) + (d[V + 16 >> 0] | 0) + (d[V + 40 + 15 >> 0] | 0) | 0) >>> 5; else {
      if (p) {
       o = ((d[V + 40 >> 0] | 0) + 8 + (d[V + 40 + 1 >> 0] | 0) + (d[V + 40 + 2 >> 0] | 0) + (d[V + 40 + 3 >> 0] | 0) + (d[V + 40 + 4 >> 0] | 0) + (d[V + 40 + 5 >> 0] | 0) + (d[V + 40 + 6 >> 0] | 0) + (d[V + 40 + 7 >> 0] | 0) + (d[V + 40 + 8 >> 0] | 0) + (d[V + 40 + 9 >> 0] | 0) + (d[V + 40 + 10 >> 0] | 0) + (d[V + 40 + 11 >> 0] | 0) + (d[V + 40 + 12 >> 0] | 0) + (d[V + 40 + 13 >> 0] | 0) + (d[V + 40 + 14 >> 0] | 0) + (d[V + 40 + 15 >> 0] | 0) | 0) >>> 4;
       break;
      }
      if (!o) {
       o = 128;
       break;
      }
      o = ((d[V + 1 >> 0] | 0) + 8 + (d[V + 2 >> 0] | 0) + (d[V + 3 >> 0] | 0) + (d[V + 4 >> 0] | 0) + (d[V + 5 >> 0] | 0) + (d[V + 6 >> 0] | 0) + (d[V + 7 >> 0] | 0) + (d[V + 8 >> 0] | 0) + (d[V + 9 >> 0] | 0) + (d[V + 10 >> 0] | 0) + (d[V + 11 >> 0] | 0) + (d[V + 12 >> 0] | 0) + (d[V + 13 >> 0] | 0) + (d[V + 14 >> 0] | 0) + (d[V + 15 >> 0] | 0) + (d[V + 16 >> 0] | 0) | 0) >>> 4;
     } while (0);
     xb(n | 0, o & 255 | 0, 256) | 0;
     break;
    }
   default:
    {
     if (!((k | 0) != 0 & (q | 0) != 0 & (o | 0) != 0)) break b;
     o = d[V + 16 >> 0] | 0;
     p = d[V + 40 + 15 >> 0] | 0;
     k = d[V >> 0] | 0;
     q = (((d[V + 9 >> 0] | 0) - (d[V + 7 >> 0] | 0) + ((d[V + 10 >> 0] | 0) - (d[V + 6 >> 0] | 0) << 1) + (((d[V + 11 >> 0] | 0) - (d[V + 5 >> 0] | 0) | 0) * 3 | 0) + ((d[V + 12 >> 0] | 0) - (d[V + 4 >> 0] | 0) << 2) + (((d[V + 13 >> 0] | 0) - (d[V + 3 >> 0] | 0) | 0) * 5 | 0) + (((d[V + 14 >> 0] | 0) - (d[V + 2 >> 0] | 0) | 0) * 6 | 0) + (((d[V + 15 >> 0] | 0) - (d[V + 1 >> 0] | 0) | 0) * 7 | 0) + (o - k << 3) | 0) * 5 | 0) + 32 >> 6;
     k = (((d[V + 40 + 8 >> 0] | 0) - (d[V + 40 + 6 >> 0] | 0) + (p - k << 3) + ((d[V + 40 + 9 >> 0] | 0) - (d[V + 40 + 5 >> 0] | 0) << 1) + (((d[V + 40 + 10 >> 0] | 0) - (d[V + 40 + 4 >> 0] | 0) | 0) * 3 | 0) + ((d[V + 40 + 11 >> 0] | 0) - (d[V + 40 + 3 >> 0] | 0) << 2) + (((d[V + 40 + 12 >> 0] | 0) - (d[V + 40 + 2 >> 0] | 0) | 0) * 5 | 0) + (((d[V + 40 + 13 >> 0] | 0) - (d[V + 40 + 1 >> 0] | 0) | 0) * 6 | 0) + (((d[V + 40 + 14 >> 0] | 0) - (d[V + 40 >> 0] | 0) | 0) * 7 | 0) | 0) * 5 | 0) + 32 >> 6;
     t = 0;
     do {
      r = (p + o << 4) + 16 + (Z(t + -7 | 0, k) | 0) | 0;
      s = t << 4;
      u = 0;
      do {
       X = r + (Z(u + -7 | 0, q) | 0) >> 5;
       a[n + (u + s) >> 0] = (X | 0) < 0 ? 0 : ((X | 0) > 255 ? 255 : X) & 255;
       u = u + 1 | 0;
      } while ((u | 0) != 16);
      t = t + 1 | 0;
     } while ((t | 0) != 16);
    }
   }
   Pa(n, g + 328 | 0, 0);
   Pa(n, g + 392 | 0, 1);
   Pa(n, g + 456 | 0, 2);
   Pa(n, g + 520 | 0, 3);
   Pa(n, g + 584 | 0, 4);
   Pa(n, g + 648 | 0, 5);
   Pa(n, g + 712 | 0, 6);
   Pa(n, g + 776 | 0, 7);
   Pa(n, g + 840 | 0, 8);
   Pa(n, g + 904 | 0, 9);
   Pa(n, g + 968 | 0, 10);
   Pa(n, g + 1032 | 0, 11);
   Pa(n, g + 1096 | 0, 12);
   Pa(n, g + 1160 | 0, 13);
   Pa(n, g + 1224 | 0, 14);
   Pa(n, g + 1288 | 0, 15);
   o = f + 200 | 0;
   U = 179;
  } else {
   O = 0;
   while (1) {
    X = 384 + (O << 3) | 0;
    s = c[X + 4 >> 2] | 0;
    switch (c[X >> 2] | 0) {
    case 0:
     {
      o = f + 200 | 0;
      U = 113;
      break;
     }
    case 1:
     {
      o = f + 204 | 0;
      U = 113;
      break;
     }
    case 2:
     {
      o = f + 208 | 0;
      U = 113;
      break;
     }
    case 3:
     {
      o = f + 212 | 0;
      U = 113;
      break;
     }
    case 4:
     {
      o = f;
      U = 114;
      break;
     }
    default:
     {
      r = 0;
      q = 0;
     }
    }
    if ((U | 0) == 113) {
     U = 0;
     o = c[o >> 2] | 0;
     if (!o) {
      r = 0;
      q = 0;
     } else U = 114;
    }
    do if ((U | 0) == 114) {
     p = (c[f + 4 >> 2] | 0) == (c[o + 4 >> 2] | 0);
     if (!((m | 0) != 0 & p)) {
      r = o;
      q = p & 1;
      break;
     }
     r = o;
     q = (c[o >> 2] | 0) >>> 0 < 6 ? 0 : p & 1;
    } while (0);
    X = 576 + (O << 3) | 0;
    k = c[X + 4 >> 2] | 0;
    switch (c[X >> 2] | 0) {
    case 0:
     {
      o = f + 200 | 0;
      U = 120;
      break;
     }
    case 1:
     {
      o = f + 204 | 0;
      U = 120;
      break;
     }
    case 2:
     {
      o = f + 208 | 0;
      U = 120;
      break;
     }
    case 3:
     {
      o = f + 212 | 0;
      U = 120;
      break;
     }
    case 4:
     {
      o = f;
      U = 122;
      break;
     }
    default:
     U = 121;
    }
    if ((U | 0) == 120) {
     o = c[o >> 2] | 0;
     if (!o) U = 121; else U = 122;
    }
    do if ((U | 0) == 121) {
     U = 0;
     N = 0;
     K = 0;
     A = (q | 0) != 0;
     o = 2;
    } else if ((U | 0) == 122) {
     U = 0;
     p = (c[f + 4 >> 2] | 0) == (c[o + 4 >> 2] | 0);
     if ((m | 0) != 0 & p) p = (c[o >> 2] | 0) >>> 0 < 6 ? 0 : p & 1; else p = p & 1;
     q = (q | 0) != 0;
     p = (p | 0) != 0;
     if (!(q & p)) {
      N = 0;
      K = p;
      A = q;
      o = 2;
      break;
     }
     if ((c[r >> 2] | 0) == 6) p = d[(s & 255) + (r + 82) >> 0] | 0; else p = 2;
     if ((c[o >> 2] | 0) == 6) o = d[(k & 255) + (o + 82) >> 0] | 0; else o = 2;
     N = 1;
     K = 1;
     A = 1;
     o = p >>> 0 < o >>> 0 ? p : o;
    } while (0);
    if (!(c[g + 12 + (O << 2) >> 2] | 0)) {
     X = c[g + 76 + (O << 2) >> 2] | 0;
     o = (X >>> 0 >= o >>> 0 & 1) + X | 0;
    }
    a[f + 82 + O >> 0] = o;
    switch (c[768 + (O << 3) >> 2] | 0) {
    case 0:
     {
      p = f + 200 | 0;
      U = 136;
      break;
     }
    case 1:
     {
      p = f + 204 | 0;
      U = 136;
      break;
     }
    case 2:
     {
      p = f + 208 | 0;
      U = 136;
      break;
     }
    case 3:
     {
      p = f + 212 | 0;
      U = 136;
      break;
     }
    case 4:
     {
      p = f;
      U = 137;
      break;
     }
    default:
     z = 0;
    }
    if ((U | 0) == 136) {
     U = 0;
     p = c[p >> 2] | 0;
     if (!p) z = 0; else U = 137;
    }
    do if ((U | 0) == 137) {
     U = 0;
     q = (c[f + 4 >> 2] | 0) == (c[p + 4 >> 2] | 0);
     if (!((m | 0) != 0 & q)) {
      z = q & 1;
      break;
     }
     z = (c[p >> 2] | 0) >>> 0 < 6 ? 0 : q & 1;
    } while (0);
    switch (c[960 + (O << 3) >> 2] | 0) {
    case 0:
     {
      p = f + 200 | 0;
      U = 143;
      break;
     }
    case 1:
     {
      p = f + 204 | 0;
      U = 143;
      break;
     }
    case 2:
     {
      p = f + 208 | 0;
      U = 143;
      break;
     }
    case 3:
     {
      p = f + 212 | 0;
      U = 143;
      break;
     }
    case 4:
     {
      p = f;
      U = 144;
      break;
     }
    default:
     y = 0;
    }
    if ((U | 0) == 143) {
     U = 0;
     p = c[p >> 2] | 0;
     if (!p) y = 0; else U = 144;
    }
    do if ((U | 0) == 144) {
     U = 0;
     q = (c[f + 4 >> 2] | 0) == (c[p + 4 >> 2] | 0);
     if (!((m | 0) != 0 & q)) {
      y = q & 1;
      break;
     }
     y = (c[p >> 2] | 0) >>> 0 < 6 ? 0 : q & 1;
    } while (0);
    L = c[1152 + (O << 2) >> 2] | 0;
    M = c[1216 + (O << 2) >> 2] | 0;
    s = (1285 >>> O & 1 | 0) != 0;
    if (s) {
     k = V + 40 + (M + 3) | 0;
     r = V + 40 + (M + 2) | 0;
     p = V + 40 + M | 0;
     q = V + 40 + (M + 1) | 0;
    } else {
     k = n + ((M << 4) + L + 47) | 0;
     r = n + ((M << 4) + L + 31) | 0;
     p = n + ((M << 4) + L + -1) | 0;
     q = n + ((M << 4) + L + 15) | 0;
    }
    J = a[p >> 0] | 0;
    I = a[q >> 0] | 0;
    H = a[k >> 0] | 0;
    G = a[r >> 0] | 0;
    do if (!(51 >>> O & 1)) {
     p = (M + -1 << 4) + L | 0;
     v = a[n + p >> 0] | 0;
     w = a[n + (p + 1) >> 0] | 0;
     x = a[n + (p + 2) >> 0] | 0;
     q = a[n + (p + 3) >> 0] | 0;
     k = a[n + (p + 4) >> 0] | 0;
     r = a[n + (p + 5) >> 0] | 0;
     t = a[n + (p + 6) >> 0] | 0;
     u = a[n + (p + 7) >> 0] | 0;
     if (s) {
      s = V + 40 + (M + -1) | 0;
      F = t;
      p = u;
      E = v;
      D = w;
      C = x;
      break;
     } else {
      s = n + (p + -1) | 0;
      F = t;
      p = u;
      E = v;
      D = w;
      C = x;
      break;
     }
    } else {
     s = V + L | 0;
     q = a[V + (L + 4) >> 0] | 0;
     k = a[V + (L + 5) >> 0] | 0;
     r = a[V + (L + 6) >> 0] | 0;
     F = a[V + (L + 7) >> 0] | 0;
     p = a[V + (L + 8) >> 0] | 0;
     E = a[V + (L + 1) >> 0] | 0;
     D = a[V + (L + 2) >> 0] | 0;
     C = a[V + (L + 3) >> 0] | 0;
    } while (0);
    B = a[s >> 0] | 0;
    switch (o | 0) {
    case 0:
     {
      if (!K) break b;
      p = E;
      k = D;
      r = C;
      s = q;
      t = E;
      u = D;
      v = C;
      w = q;
      x = E;
      y = D;
      z = C;
      A = q;
      o = (C & 255) << 16 | (q & 255) << 24 | (D & 255) << 8 | E & 255;
      break;
     }
    case 1:
     {
      if (!A) break b;
      s = Z(J & 255, 16843009) | 0;
      w = Z(I & 255, 16843009) | 0;
      A = Z(G & 255, 16843009) | 0;
      p = s & 255;
      k = s >>> 8 & 255;
      r = s >>> 16 & 255;
      s = s >>> 24 & 255;
      t = w & 255;
      u = w >>> 8 & 255;
      v = w >>> 16 & 255;
      w = w >>> 24 & 255;
      x = A & 255;
      y = A >>> 8 & 255;
      z = A >>> 16 & 255;
      A = A >>> 24 & 255;
      o = Z(H & 255, 16843009) | 0;
      break;
     }
    case 2:
     {
      do if (N) o = ((J & 255) + 4 + (I & 255) + (H & 255) + (G & 255) + (q & 255) + (C & 255) + (D & 255) + (E & 255) | 0) >>> 3; else {
       if (A) {
        o = ((J & 255) + 2 + (I & 255) + (H & 255) + (G & 255) | 0) >>> 2;
        break;
       }
       if (!K) {
        o = 128;
        break;
       }
       o = ((q & 255) + 2 + (C & 255) + (D & 255) + (E & 255) | 0) >>> 2;
      } while (0);
      o = Z(o & 255, 16843009) | 0;
      p = o & 255;
      k = o >>> 8 & 255;
      r = o >>> 16 & 255;
      s = o >>> 24 & 255;
      t = o & 255;
      u = o >>> 8 & 255;
      v = o >>> 16 & 255;
      w = o >>> 24 & 255;
      x = o & 255;
      y = o >>> 8 & 255;
      z = o >>> 16 & 255;
      A = o >>> 24 & 255;
      break;
     }
    case 3:
     {
      if (!K) break b;
      X = (z | 0) == 0;
      t = D & 255;
      x = C & 255;
      j = q & 255;
      l = (X ? q : k) & 255;
      W = (X ? q : r) & 255;
      y = (j + 2 + W + (l << 1) | 0) >>> 2 & 255;
      o = (X ? q : F) & 255;
      z = (l + 2 + o + (W << 1) | 0) >>> 2 & 255;
      X = (X ? q : p) & 255;
      p = ((E & 255) + (x + 2) + (t << 1) | 0) >>> 2 & 255;
      k = (t + (j + 2) + (x << 1) | 0) >>> 2 & 255;
      r = (l + (j << 1) + (x + 2) | 0) >>> 2 & 255;
      s = y;
      t = (t + (j + 2) + (x << 1) | 0) >>> 2 & 255;
      u = (l + (j << 1) + (x + 2) | 0) >>> 2 & 255;
      v = y;
      w = z;
      x = (l + (j << 1) + (x + 2) | 0) >>> 2 & 255;
      A = (W + 2 + X + (o << 1) | 0) >>> 2 & 255;
      o = (j + 2 + W + (l << 1) | 0) >>> 2 & 255 | (o + 2 + (X * 3 | 0) | 0) >>> 2 << 24 | (l + 2 + o + (W << 1) | 0) >>> 2 << 8 & 65280 | (W + 2 + X + (o << 1) | 0) >>> 2 << 16 & 16711680;
      break;
     }
    case 4:
     {
      if (!(N & (y | 0) != 0)) break b;
      o = E & 255;
      z = (o + 2 + (J & 255) + ((B & 255) << 1) | 0) >>> 2 & 255;
      A = D & 255;
      w = C & 255;
      y = (((J & 255) << 1) + 2 + (I & 255) + (B & 255) | 0) >>> 2 & 255;
      p = z;
      k = (A + 2 + (o << 1) + (B & 255) | 0) >>> 2 & 255;
      r = ((A << 1) + w + (o + 2) | 0) >>> 2 & 255;
      s = ((q & 255) + 2 + A + (w << 1) | 0) >>> 2 & 255;
      t = y;
      u = z;
      v = (A + 2 + (o << 1) + (B & 255) | 0) >>> 2 & 255;
      w = ((A << 1) + w + (o + 2) | 0) >>> 2 & 255;
      x = ((J & 255) + 2 + ((I & 255) << 1) + (G & 255) | 0) >>> 2 & 255;
      A = (A + 2 + (o << 1) + (B & 255) | 0) >>> 2 & 255;
      o = ((I & 255) + 2 + (H & 255) + ((G & 255) << 1) | 0) >>> 2 & 255 | ((J & 255) + 2 + ((I & 255) << 1) + (G & 255) | 0) >>> 2 << 8 & 65280 | (o + 2 + (J & 255) + ((B & 255) << 1) | 0) >>> 2 << 24 | (((J & 255) << 1) + 2 + (I & 255) + (B & 255) | 0) >>> 2 << 16 & 16711680;
      break;
     }
    case 5:
     {
      if (!(N & (y | 0) != 0)) break b;
      o = E & 255;
      X = D & 255;
      W = C & 255;
      w = q & 255;
      p = (o + 1 + (B & 255) | 0) >>> 1 & 255;
      k = (X + 1 + o | 0) >>> 1 & 255;
      r = (W + 1 + X | 0) >>> 1 & 255;
      s = (w + 1 + W | 0) >>> 1 & 255;
      t = (o + 2 + (J & 255) + ((B & 255) << 1) | 0) >>> 2 & 255;
      u = (X + 2 + (o << 1) + (B & 255) | 0) >>> 2 & 255;
      v = ((X << 1) + W + (o + 2) | 0) >>> 2 & 255;
      w = (w + 2 + X + (W << 1) | 0) >>> 2 & 255;
      x = ((I & 255) + 2 + ((J & 255) << 1) + (B & 255) | 0) >>> 2 & 255;
      y = (o + 1 + (B & 255) | 0) >>> 1 & 255;
      z = (X + 1 + o | 0) >>> 1 & 255;
      A = (W + 1 + X | 0) >>> 1 & 255;
      o = ((X << 1) + W + (o + 2) | 0) >>> 2 << 24 | ((J & 255) + 2 + ((I & 255) << 1) + (G & 255) | 0) >>> 2 & 255 | (X + 2 + (o << 1) + (B & 255) | 0) >>> 2 << 16 & 16711680 | (o + 2 + (J & 255) + ((B & 255) << 1) | 0) >>> 2 << 8 & 65280;
      break;
     }
    case 6:
     {
      if (!(N & (y | 0) != 0)) break b;
      w = E & 255;
      s = D & 255;
      p = ((B & 255) + ((J & 255) + 1) | 0) >>> 1 & 255;
      k = (w + ((J & 255) + 2) + ((B & 255) << 1) | 0) >>> 2 & 255;
      r = (s + 2 + (w << 1) + (B & 255) | 0) >>> 2 & 255;
      s = ((C & 255) + 2 + (s << 1) + w | 0) >>> 2 & 255;
      t = ((J & 255) + 1 + (I & 255) | 0) >>> 1 & 255;
      u = (((J & 255) << 1) + 2 + (I & 255) + (B & 255) | 0) >>> 2 & 255;
      v = ((B & 255) + ((J & 255) + 1) | 0) >>> 1 & 255;
      w = (w + ((J & 255) + 2) + ((B & 255) << 1) | 0) >>> 2 & 255;
      x = ((I & 255) + 1 + (G & 255) | 0) >>> 1 & 255;
      y = (((I & 255) << 1) + ((J & 255) + 2) + (G & 255) | 0) >>> 2 & 255;
      z = ((J & 255) + 1 + (I & 255) | 0) >>> 1 & 255;
      A = (((J & 255) << 1) + 2 + (I & 255) + (B & 255) | 0) >>> 2 & 255;
      o = ((H & 255) + 1 + (G & 255) | 0) >>> 1 & 255 | (((I & 255) << 1) + ((J & 255) + 2) + (G & 255) | 0) >>> 2 << 24 | ((I & 255) + 1 + (G & 255) | 0) >>> 1 << 16 & 16711680 | (I & 255) + 2 + (H & 255) + ((G & 255) << 1) << 6 & 65280;
      break;
     }
    case 7:
     {
      if (!K) break b;
      j = (z | 0) == 0;
      t = E & 255;
      T = D & 255;
      o = C & 255;
      X = q & 255;
      W = (j ? q : k) & 255;
      l = (j ? q : r) & 255;
      p = (T + 1 + t | 0) >>> 1 & 255;
      k = (o + 1 + T | 0) >>> 1 & 255;
      r = (X + 1 + o | 0) >>> 1 & 255;
      s = (X + 1 + W | 0) >>> 1 & 255;
      t = (t + (o + 2) + (T << 1) | 0) >>> 2 & 255;
      u = (T + (X + 2) + (o << 1) | 0) >>> 2 & 255;
      v = (W + (X << 1) + (o + 2) | 0) >>> 2 & 255;
      w = (X + 2 + l + (W << 1) | 0) >>> 2 & 255;
      x = (o + 1 + T | 0) >>> 1 & 255;
      y = (X + 1 + o | 0) >>> 1 & 255;
      z = (X + 1 + W | 0) >>> 1 & 255;
      A = (W + 1 + l | 0) >>> 1 & 255;
      o = (T + (X + 2) + (o << 1) | 0) >>> 2 & 255 | (W + 2 + ((j ? q : F) & 255) + (l << 1) | 0) >>> 2 << 24 | (X + 2 + l + (W << 1) | 0) >>> 2 << 16 & 16711680 | (W + (X << 1) + (o + 2) | 0) >>> 2 << 8 & 65280;
      break;
     }
    default:
     {
      if (!A) break b;
      p = ((J & 255) + 1 + (I & 255) | 0) >>> 1 & 255;
      k = ((J & 255) + 2 + ((I & 255) << 1) + (G & 255) | 0) >>> 2 & 255;
      r = ((I & 255) + 1 + (G & 255) | 0) >>> 1 & 255;
      s = ((I & 255) + 2 + (H & 255) + ((G & 255) << 1) | 0) >>> 2 & 255;
      t = ((I & 255) + 1 + (G & 255) | 0) >>> 1 & 255;
      u = ((I & 255) + 2 + (H & 255) + ((G & 255) << 1) | 0) >>> 2 & 255;
      v = ((H & 255) + 1 + (G & 255) | 0) >>> 1 & 255;
      w = ((G & 255) + 2 + ((H & 255) * 3 | 0) | 0) >>> 2 & 255;
      x = ((H & 255) + 1 + (G & 255) | 0) >>> 1 & 255;
      y = ((G & 255) + 2 + ((H & 255) * 3 | 0) | 0) >>> 2 & 255;
      z = H;
      A = H;
      o = (H & 255) << 8 | H & 255 | (H & 255) << 16 | (H & 255) << 24;
     }
    }
    c[n + ((M << 4) + L) >> 2] = (r & 255) << 16 | (s & 255) << 24 | (k & 255) << 8 | p & 255;
    c[n + ((M << 4) + L) + 16 >> 2] = (v & 255) << 16 | (w & 255) << 24 | (u & 255) << 8 | t & 255;
    c[n + ((M << 4) + L) + 32 >> 2] = (z & 255) << 16 | (A & 255) << 24 | (y & 255) << 8 | x & 255;
    c[n + ((M << 4) + L) + 48 >> 2] = o;
    Pa(n, g + 328 + (O << 6) | 0, O);
    O = O + 1 | 0;
    if (O >>> 0 >= 16) {
     o = f + 200 | 0;
     U = 179;
     break b;
    }
   }
  } while (0);
  c : do if ((U | 0) == 179) {
   E = c[g + 140 >> 2] | 0;
   o = c[o >> 2] | 0;
   do if (!o) {
    q = (m | 0) != 0;
    r = 0;
   } else {
    p = (c[f + 4 >> 2] | 0) == (c[o + 4 >> 2] | 0);
    if (!((m | 0) != 0 & p)) {
     q = (m | 0) != 0;
     r = p & 1;
     break;
    }
    q = 1;
    r = (c[o >> 2] | 0) >>> 0 < 6 ? 0 : p & 1;
   } while (0);
   o = c[f + 204 >> 2] | 0;
   do if (!o) k = 0; else {
    p = (c[f + 4 >> 2] | 0) == (c[o + 4 >> 2] | 0);
    if (!(q & p)) {
     k = p & 1;
     break;
    }
    k = (c[o >> 2] | 0) >>> 0 < 6 ? 0 : p & 1;
   } while (0);
   o = c[f + 212 >> 2] | 0;
   do if (!o) o = 0; else {
    p = (c[f + 4 >> 2] | 0) == (c[o + 4 >> 2] | 0);
    if (!(q & p)) {
     o = p & 1;
     break;
    }
    o = (c[o >> 2] | 0) >>> 0 < 6 ? 0 : p & 1;
   } while (0);
   C = (r | 0) != 0;
   D = (k | 0) != 0;
   B = C & D & (o | 0) != 0;
   A = (r | 0) == 0;
   z = (k | 0) == 0;
   w = n + 256 | 0;
   x = V + 40 + 16 | 0;
   y = V + 21 | 0;
   t = g + 1352 | 0;
   u = 16;
   v = 0;
   while (1) {
    switch (E | 0) {
    case 0:
     {
      q = y + 1 | 0;
      do if (C & D) {
       o = ((d[q >> 0] | 0) + 4 + (d[y + 2 >> 0] | 0) + (d[y + 3 >> 0] | 0) + (d[y + 4 >> 0] | 0) + (d[x >> 0] | 0) + (d[x + 1 >> 0] | 0) + (d[x + 2 >> 0] | 0) + (d[x + 3 >> 0] | 0) | 0) >>> 3;
       p = ((d[y + 5 >> 0] | 0) + 2 + (d[y + 6 >> 0] | 0) + (d[y + 7 >> 0] | 0) + (d[y + 8 >> 0] | 0) | 0) >>> 2;
      } else {
       if (D) {
        o = ((d[q >> 0] | 0) + 2 + (d[y + 2 >> 0] | 0) + (d[y + 3 >> 0] | 0) + (d[y + 4 >> 0] | 0) | 0) >>> 2;
        p = ((d[y + 5 >> 0] | 0) + 2 + (d[y + 6 >> 0] | 0) + (d[y + 7 >> 0] | 0) + (d[y + 8 >> 0] | 0) | 0) >>> 2;
        break;
       }
       if (!C) {
        o = 128;
        p = 128;
        break;
       }
       p = ((d[x >> 0] | 0) + 2 + (d[x + 1 >> 0] | 0) + (d[x + 2 >> 0] | 0) + (d[x + 3 >> 0] | 0) | 0) >>> 2;
       o = p;
      } while (0);
      W = o & 255;
      X = p & 255;
      xb(w | 0, W | 0, 4) | 0;
      xb(w + 4 | 0, X | 0, 4) | 0;
      xb(w + 8 | 0, W | 0, 4) | 0;
      xb(w + 12 | 0, X | 0, 4) | 0;
      xb(w + 16 | 0, W | 0, 4) | 0;
      xb(w + 20 | 0, X | 0, 4) | 0;
      s = w + 32 | 0;
      xb(w + 24 | 0, W | 0, 4) | 0;
      xb(w + 28 | 0, X | 0, 4) | 0;
      do if (C) {
       o = d[x + 4 >> 0] | 0;
       p = d[x + 5 >> 0] | 0;
       q = d[x + 6 >> 0] | 0;
       k = d[x + 7 >> 0] | 0;
       if (!D) {
        r = (o + 2 + p + q + k | 0) >>> 2;
        o = (o + 2 + p + q + k | 0) >>> 2;
        break;
       }
       r = (o + 2 + p + q + k | 0) >>> 2;
       o = (o + 4 + p + q + k + (d[y + 5 >> 0] | 0) + (d[y + 6 >> 0] | 0) + (d[y + 7 >> 0] | 0) + (d[y + 8 >> 0] | 0) | 0) >>> 3;
      } else {
       if (!D) {
        r = 128;
        o = 128;
        break;
       }
       r = ((d[q >> 0] | 0) + 2 + (d[y + 2 >> 0] | 0) + (d[y + 3 >> 0] | 0) + (d[y + 4 >> 0] | 0) | 0) >>> 2;
       o = ((d[y + 5 >> 0] | 0) + 2 + (d[y + 6 >> 0] | 0) + (d[y + 7 >> 0] | 0) + (d[y + 8 >> 0] | 0) | 0) >>> 2;
      } while (0);
      W = r & 255;
      X = o & 255;
      xb(s | 0, W | 0, 4) | 0;
      xb(w + 36 | 0, X | 0, 4) | 0;
      xb(w + 40 | 0, W | 0, 4) | 0;
      xb(w + 44 | 0, X | 0, 4) | 0;
      xb(w + 48 | 0, W | 0, 4) | 0;
      xb(w + 52 | 0, X | 0, 4) | 0;
      xb(w + 56 | 0, W | 0, 4) | 0;
      xb(w + 60 | 0, X | 0, 4) | 0;
      break;
     }
    case 1:
     {
      if (A) break c;
      xb(w | 0, a[x >> 0] | 0, 8) | 0;
      xb(w + 8 | 0, a[x + 1 >> 0] | 0, 8) | 0;
      xb(w + 16 | 0, a[x + 2 >> 0] | 0, 8) | 0;
      xb(w + 24 | 0, a[x + 3 >> 0] | 0, 8) | 0;
      xb(w + 32 | 0, a[x + 4 >> 0] | 0, 8) | 0;
      xb(w + 40 | 0, a[x + 5 >> 0] | 0, 8) | 0;
      xb(w + 48 | 0, a[x + 6 >> 0] | 0, 8) | 0;
      xb(w + 56 | 0, a[x + 7 >> 0] | 0, 8) | 0;
      break;
     }
    case 2:
     {
      if (z) break c;
      X = a[y + 1 >> 0] | 0;
      a[w >> 0] = X;
      a[w + 8 >> 0] = X;
      a[w + 16 >> 0] = X;
      a[w + 24 >> 0] = X;
      a[w + 32 >> 0] = X;
      a[w + 40 >> 0] = X;
      a[w + 48 >> 0] = X;
      a[w + 56 >> 0] = X;
      X = a[y + 2 >> 0] | 0;
      a[w + 1 >> 0] = X;
      a[w + 9 >> 0] = X;
      a[w + 17 >> 0] = X;
      a[w + 25 >> 0] = X;
      a[w + 33 >> 0] = X;
      a[w + 41 >> 0] = X;
      a[w + 49 >> 0] = X;
      a[w + 57 >> 0] = X;
      X = a[y + 3 >> 0] | 0;
      a[w + 2 >> 0] = X;
      a[w + 10 >> 0] = X;
      a[w + 18 >> 0] = X;
      a[w + 26 >> 0] = X;
      a[w + 34 >> 0] = X;
      a[w + 42 >> 0] = X;
      a[w + 50 >> 0] = X;
      a[w + 58 >> 0] = X;
      X = a[y + 4 >> 0] | 0;
      a[w + 3 >> 0] = X;
      a[w + 11 >> 0] = X;
      a[w + 19 >> 0] = X;
      a[w + 27 >> 0] = X;
      a[w + 35 >> 0] = X;
      a[w + 43 >> 0] = X;
      a[w + 51 >> 0] = X;
      a[w + 59 >> 0] = X;
      X = a[y + 5 >> 0] | 0;
      a[w + 4 >> 0] = X;
      a[w + 12 >> 0] = X;
      a[w + 20 >> 0] = X;
      a[w + 28 >> 0] = X;
      a[w + 36 >> 0] = X;
      a[w + 44 >> 0] = X;
      a[w + 52 >> 0] = X;
      a[w + 60 >> 0] = X;
      X = a[y + 6 >> 0] | 0;
      a[w + 5 >> 0] = X;
      a[w + 13 >> 0] = X;
      a[w + 21 >> 0] = X;
      a[w + 29 >> 0] = X;
      a[w + 37 >> 0] = X;
      a[w + 45 >> 0] = X;
      a[w + 53 >> 0] = X;
      a[w + 61 >> 0] = X;
      X = a[y + 7 >> 0] | 0;
      a[w + 6 >> 0] = X;
      a[w + 14 >> 0] = X;
      a[w + 22 >> 0] = X;
      a[w + 30 >> 0] = X;
      a[w + 38 >> 0] = X;
      a[w + 46 >> 0] = X;
      a[w + 54 >> 0] = X;
      a[w + 62 >> 0] = X;
      X = a[y + 8 >> 0] | 0;
      a[w + 7 >> 0] = X;
      a[w + 15 >> 0] = X;
      a[w + 23 >> 0] = X;
      a[w + 31 >> 0] = X;
      a[w + 39 >> 0] = X;
      a[w + 47 >> 0] = X;
      a[w + 55 >> 0] = X;
      a[w + 63 >> 0] = X;
      break;
     }
    default:
     {
      if (!B) break c;
      r = d[y + 8 >> 0] | 0;
      s = d[x + 7 >> 0] | 0;
      q = d[y >> 0] | 0;
      p = (((d[y + 5 >> 0] | 0) - (d[y + 3 >> 0] | 0) + ((d[y + 6 >> 0] | 0) - (d[y + 2 >> 0] | 0) << 1) + (((d[y + 7 >> 0] | 0) - (d[y + 1 >> 0] | 0) | 0) * 3 | 0) + (r - q << 2) | 0) * 17 | 0) + 16 >> 5;
      q = (((d[x + 4 >> 0] | 0) - (d[x + 2 >> 0] | 0) + (s - q << 2) + ((d[x + 5 >> 0] | 0) - (d[x + 1 >> 0] | 0) << 1) + (((d[x + 6 >> 0] | 0) - (d[x >> 0] | 0) | 0) * 3 | 0) | 0) * 17 | 0) + 16 >> 5;
      k = Z(p, -3) | 0;
      o = w;
      r = (s + r << 4) + 16 + (Z(q, -3) | 0) | 0;
      s = 8;
      while (1) {
       s = s + -1 | 0;
       X = r + k | 0;
       a[o >> 0] = a[6150 + (X >> 5) >> 0] | 0;
       a[o + 1 >> 0] = a[6150 + (X + p >> 5) >> 0] | 0;
       a[o + 2 >> 0] = a[6150 + (X + p + p >> 5) >> 0] | 0;
       a[o + 3 >> 0] = a[6150 + (X + p + p + p >> 5) >> 0] | 0;
       a[o + 4 >> 0] = a[6150 + (X + p + p + p + p >> 5) >> 0] | 0;
       X = X + p + p + p + p + p | 0;
       a[o + 5 >> 0] = a[6150 + (X >> 5) >> 0] | 0;
       a[o + 6 >> 0] = a[6150 + (X + p >> 5) >> 0] | 0;
       a[o + 7 >> 0] = a[6150 + (X + p + p >> 5) >> 0] | 0;
       if (!s) break; else {
        o = o + 8 | 0;
        r = r + q | 0;
       }
      }
     }
    }
    Pa(w, t, u);
    X = u | 1;
    Pa(w, t + 64 | 0, X);
    Pa(w, t + 128 | 0, X + 1 | 0);
    Pa(w, t + 192 | 0, u | 3);
    v = v + 1 | 0;
    if (v >>> 0 >= 2) break; else {
     w = w + 64 | 0;
     x = x + 8 | 0;
     y = y + 9 | 0;
     t = t + 256 | 0;
     u = u + 4 | 0;
    }
   }
   if ((c[f + 196 >> 2] | 0) >>> 0 <= 1) $a(h, n);
   X = 0;
   i = V;
   return X | 0;
  } while (0);
  X = 1;
  i = V;
  return X | 0;
 } while (0);
 X = c[h + 4 >> 2] | 0;
 m = ((l >>> 0) / (X >>> 0) | 0) << 4;
 T = l - (Z((l >>> 0) / (X >>> 0) | 0, X) | 0) << 4;
 c[V + 4 >> 2] = X;
 c[V + 8 >> 2] = c[h + 8 >> 2];
 d : do switch (r | 0) {
 case 1:
 case 0:
  {
   z = c[g + 144 >> 2] | 0;
   o = c[f + 200 >> 2] | 0;
   if ((o | 0) != 0 ? (c[o + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[o >> 2] | 0) >>> 0 < 6) {
    y = e[o + 152 >> 1] | e[o + 152 + 2 >> 1] << 16;
    k = 1;
    p = y & 65535;
    y = y >>> 16 & 65535;
    t = c[o + 104 >> 2] | 0;
   } else {
    k = 1;
    p = 0;
    y = 0;
    t = -1;
   } else {
    k = 0;
    p = 0;
    y = 0;
    t = -1;
   }
   o = c[f + 204 >> 2] | 0;
   if ((o | 0) != 0 ? (c[o + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[o >> 2] | 0) >>> 0 < 6) {
    w = e[o + 172 >> 1] | e[o + 172 + 2 >> 1] << 16;
    q = 1;
    s = c[o + 108 >> 2] | 0;
    u = w & 65535;
    w = w >>> 16 & 65535;
   } else {
    q = 1;
    s = -1;
    u = 0;
    w = 0;
   } else {
    q = 0;
    s = -1;
    u = 0;
    w = 0;
   }
   do if (!r) if (!((k | 0) == 0 | (q | 0) == 0)) {
    if ((t | 0) == 0 ? ((y & 65535) << 16 | p & 65535 | 0) == 0 : 0) {
     p = 0;
     o = 0;
     break;
    }
    if ((s | 0) == 0 ? ((w & 65535) << 16 | u & 65535 | 0) == 0 : 0) {
     p = 0;
     o = 0;
    } else U = 230;
   } else {
    p = 0;
    o = 0;
   } else U = 230; while (0);
   if ((U | 0) == 230) {
    v = b[g + 160 >> 1] | 0;
    x = b[g + 162 >> 1] | 0;
    o = c[f + 208 >> 2] | 0;
    if ((o | 0) != 0 ? (c[o + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[o >> 2] | 0) >>> 0 < 6) {
     r = c[o + 108 >> 2] | 0;
     k = e[o + 172 >> 1] | e[o + 172 + 2 >> 1] << 16;
     U = 239;
    } else {
     r = -1;
     k = 0;
     U = 239;
    } else U = 234;
    do if ((U | 0) == 234) {
     o = c[f + 212 >> 2] | 0;
     if ((o | 0) != 0 ? (c[o + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) {
      if ((c[o >> 2] | 0) >>> 0 >= 6) {
       r = -1;
       k = 0;
       U = 239;
       break;
      }
      r = c[o + 112 >> 2] | 0;
      k = e[o + 192 >> 1] | e[o + 192 + 2 >> 1] << 16;
      U = 239;
      break;
     }
     if ((k | 0) == 0 | (q | 0) != 0) {
      r = -1;
      k = 0;
      U = 239;
     } else o = y;
    } while (0);
    do if ((U | 0) == 239) {
     q = (t | 0) == (z | 0);
     o = (s | 0) == (z | 0);
     if (((o & 1) + (q & 1) + ((r | 0) == (z | 0) & 1) | 0) != 1) {
      X = p << 16 >> 16;
      Q = u << 16 >> 16;
      S = k << 16 >> 16;
      o = u << 16 >> 16 > p << 16 >> 16;
      R = o ? u : p;
      p = o ? X : (Q | 0) < (X | 0) ? Q : X;
      X = y << 16 >> 16;
      Q = w << 16 >> 16;
      o = k >> 16;
      P = w << 16 >> 16 > y << 16 >> 16;
      W = P ? w : y;
      X = P ? X : (Q | 0) < (X | 0) ? Q : X;
      p = (R << 16 >> 16 < (k & 65535) << 16 >> 16 ? R & 65535 : (p | 0) > (S | 0) ? p : S) & 65535;
      o = (W << 16 >> 16 < (k >>> 16 & 65535) << 16 >> 16 ? W & 65535 : (X | 0) > (o | 0) ? X : o) & 65535;
      break;
     }
     if (q | o) {
      p = q ? p : u;
      o = q ? y : w;
     } else {
      p = k & 65535;
      o = k >>> 16 & 65535;
     }
    } while (0);
    p = (p & 65535) + (v & 65535) | 0;
    o = (o & 65535) + (x & 65535) | 0;
    if (((p << 16 >> 16) + 8192 | 0) >>> 0 > 16383) {
     U = 431;
     break d;
    }
    if (((o << 16 >> 16) + 2048 | 0) >>> 0 > 4095) {
     U = 431;
     break d;
    } else {
     p = p & 65535;
     o = o & 65535;
    }
   }
   if (((z >>> 0 <= 16 ? (J = c[(c[j + 4 >> 2] | 0) + (z << 2) >> 2] | 0, (J | 0) != 0) : 0) ? (c[J + 20 >> 2] | 0) >>> 0 > 1 : 0) ? (K = c[J >> 2] | 0, (K | 0) != 0) : 0) {
    b[f + 192 >> 1] = p;
    b[f + 194 >> 1] = o;
    X = c[f + 192 >> 2] | 0;
    c[f + 188 >> 2] = X;
    c[f + 184 >> 2] = X;
    c[f + 180 >> 2] = X;
    c[f + 176 >> 2] = X;
    c[f + 172 >> 2] = X;
    c[f + 168 >> 2] = X;
    c[f + 164 >> 2] = X;
    c[f + 160 >> 2] = X;
    c[f + 156 >> 2] = X;
    c[f + 152 >> 2] = X;
    c[f + 148 >> 2] = X;
    c[f + 144 >> 2] = X;
    c[f + 140 >> 2] = X;
    c[f + 136 >> 2] = X;
    c[f + 132 >> 2] = X;
    c[f + 100 >> 2] = z;
    c[f + 104 >> 2] = z;
    c[f + 108 >> 2] = z;
    c[f + 112 >> 2] = z;
    c[f + 116 >> 2] = K;
    c[f + 120 >> 2] = K;
    c[f + 124 >> 2] = K;
    c[f + 128 >> 2] = K;
    c[V >> 2] = K;
    Wa(n, f + 132 | 0, V, T, m, 0, 0, 16, 16);
   } else U = 431;
   break;
  }
 case 2:
  {
   v = b[g + 160 >> 1] | 0;
   w = b[g + 162 >> 1] | 0;
   x = c[g + 144 >> 2] | 0;
   o = c[f + 204 >> 2] | 0;
   if ((o | 0) != 0 ? (c[o + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[o >> 2] | 0) >>> 0 < 6) {
    u = e[o + 172 >> 1] | e[o + 172 + 2 >> 1] << 16;
    r = 1;
    o = c[o + 108 >> 2] | 0;
    t = u & 65535;
    u = u >>> 16 & 65535;
   } else {
    r = 1;
    o = -1;
    t = 0;
    u = 0;
   } else {
    r = 0;
    o = -1;
    t = 0;
    u = 0;
   }
   e : do if ((o | 0) != (x | 0)) {
    q = c[f + 200 >> 2] | 0;
    if ((q | 0) != 0 ? (c[q + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[q >> 2] | 0) >>> 0 < 6) {
     o = e[q + 152 >> 1] | e[q + 152 + 2 >> 1] << 16;
     k = 1;
     p = o & 65535;
     o = o >>> 16 & 65535;
     s = c[q + 104 >> 2] | 0;
    } else {
     k = 1;
     p = 0;
     o = 0;
     s = -1;
    } else {
     k = 0;
     p = 0;
     o = 0;
     s = -1;
    }
    q = c[f + 208 >> 2] | 0;
    if ((q | 0) != 0 ? (c[q + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[q >> 2] | 0) >>> 0 < 6) {
     r = c[q + 108 >> 2] | 0;
     k = e[q + 172 >> 1] | e[q + 172 + 2 >> 1] << 16;
    } else {
     r = -1;
     k = 0;
    } else U = 263;
    do if ((U | 0) == 263) {
     q = c[f + 212 >> 2] | 0;
     if ((q | 0) != 0 ? (c[q + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) {
      if ((c[q >> 2] | 0) >>> 0 >= 6) {
       r = -1;
       k = 0;
       break;
      }
      r = c[q + 112 >> 2] | 0;
      k = e[q + 192 >> 1] | e[q + 192 + 2 >> 1] << 16;
      break;
     }
     if ((r | 0) != 0 | (k | 0) == 0) {
      r = -1;
      k = 0;
     } else break e;
    } while (0);
    q = (s | 0) == (x | 0);
    if ((((r | 0) == (x | 0) & 1) + (q & 1) | 0) != 1) {
     Q = p << 16 >> 16;
     P = t << 16 >> 16;
     S = k << 16 >> 16;
     X = t << 16 >> 16 > p << 16 >> 16;
     R = X ? t : p;
     p = X ? Q : (P | 0) < (Q | 0) ? P : Q;
     Q = o << 16 >> 16;
     P = u << 16 >> 16;
     X = k >> 16;
     L = u << 16 >> 16 > o << 16 >> 16;
     W = L ? u : o;
     o = L ? Q : (P | 0) < (Q | 0) ? P : Q;
     p = (R << 16 >> 16 < (k & 65535) << 16 >> 16 ? R & 65535 : (p | 0) > (S | 0) ? p : S) & 65535;
     o = (W << 16 >> 16 < (k >>> 16 & 65535) << 16 >> 16 ? W & 65535 : (o | 0) > (X | 0) ? o : X) & 65535;
     break;
    }
    if (!q) {
     p = k & 65535;
     o = k >>> 16 & 65535;
    }
   } else {
    p = t;
    o = u;
   } while (0);
   p = (p & 65535) + (v & 65535) | 0;
   o = (o & 65535) + (w & 65535) | 0;
   if ((((((p << 16 >> 16) + 8192 | 0) >>> 0 <= 16383 ? !(x >>> 0 > 16 | ((o << 16 >> 16) + 2048 | 0) >>> 0 > 4095) : 0) ? (I = c[(c[j + 4 >> 2] | 0) + (x << 2) >> 2] | 0, (I | 0) != 0) : 0) ? (c[I + 20 >> 2] | 0) >>> 0 > 1 : 0) ? (M = c[I >> 2] | 0, (M | 0) != 0) : 0) {
    b[f + 160 >> 1] = p;
    b[f + 162 >> 1] = o;
    s = c[f + 160 >> 2] | 0;
    c[f + 156 >> 2] = s;
    c[f + 152 >> 2] = s;
    c[f + 148 >> 2] = s;
    c[f + 144 >> 2] = s;
    c[f + 140 >> 2] = s;
    c[f + 136 >> 2] = s;
    c[f + 132 >> 2] = s;
    c[f + 100 >> 2] = x;
    c[f + 104 >> 2] = x;
    c[f + 116 >> 2] = M;
    c[f + 120 >> 2] = M;
    t = b[g + 164 >> 1] | 0;
    u = b[g + 166 >> 1] | 0;
    v = c[g + 148 >> 2] | 0;
    p = c[f + 200 >> 2] | 0;
    if (((p | 0) != 0 ? (c[p + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) ? (c[p >> 2] | 0) >>> 0 < 6 : 0) {
     r = e[p + 184 >> 1] | e[p + 184 + 2 >> 1] << 16;
     k = r & 65535;
     r = r >>> 16 & 65535;
     o = c[p + 112 >> 2] | 0;
    } else {
     k = 0;
     r = 0;
     o = -1;
    }
    do if ((o | 0) != (v | 0)) {
     if (((p | 0) != 0 ? (c[p + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) ? (c[p >> 2] | 0) >>> 0 < 6 : 0) {
      o = c[p + 104 >> 2] | 0;
      q = e[p + 160 >> 1] | e[p + 160 + 2 >> 1] << 16;
     } else {
      o = -1;
      q = 0;
     }
     if ((((o | 0) == (v | 0) & 1) + ((x | 0) == (v | 0) & 1) | 0) != 1) {
      S = k << 16 >> 16;
      p = q << 16 >> 16;
      X = (s & 65535) << 16 >> 16 > k << 16 >> 16;
      R = X ? s & 65535 : k;
      S = X ? S : (s << 16 >> 16 | 0) < (S | 0) ? s << 16 >> 16 : S;
      X = r << 16 >> 16;
      o = q >> 16;
      Q = (s >>> 16 & 65535) << 16 >> 16 > r << 16 >> 16;
      W = Q ? s >>> 16 & 65535 : r;
      X = Q ? X : (s >> 16 | 0) < (X | 0) ? s >> 16 : X;
      p = R << 16 >> 16 < (q & 65535) << 16 >> 16 ? R & 65535 : (S | 0) > (p | 0) ? S : p;
      o = W << 16 >> 16 < (q >>> 16 & 65535) << 16 >> 16 ? W & 65535 : (X | 0) > (o | 0) ? X : o;
      break;
     }
     if ((x | 0) == (v | 0)) {
      p = s;
      o = s >>> 16;
      break;
     } else {
      p = q;
      o = q >>> 16;
      break;
     }
    } else {
     o = r & 65535;
     p = o << 16 | k & 65535;
    } while (0);
    p = (p & 65535) + (t & 65535) | 0;
    o = (o & 65535) + (u & 65535) | 0;
    if ((((((p << 16 >> 16) + 8192 | 0) >>> 0 <= 16383 ? !(v >>> 0 > 16 | ((o << 16 >> 16) + 2048 | 0) >>> 0 > 4095) : 0) ? (N = c[(c[j + 4 >> 2] | 0) + (v << 2) >> 2] | 0, (N | 0) != 0) : 0) ? (c[N + 20 >> 2] | 0) >>> 0 > 1 : 0) ? (O = c[N >> 2] | 0, (O | 0) != 0) : 0) {
     b[f + 192 >> 1] = p;
     b[f + 194 >> 1] = o;
     X = c[f + 192 >> 2] | 0;
     c[f + 188 >> 2] = X;
     c[f + 184 >> 2] = X;
     c[f + 180 >> 2] = X;
     c[f + 176 >> 2] = X;
     c[f + 172 >> 2] = X;
     c[f + 168 >> 2] = X;
     c[f + 164 >> 2] = X;
     c[f + 108 >> 2] = v;
     c[f + 112 >> 2] = v;
     c[f + 124 >> 2] = O;
     c[f + 128 >> 2] = O;
     c[V >> 2] = M;
     Wa(n, f + 132 | 0, V, T, m, 0, 0, 16, 8);
     c[V >> 2] = c[f + 124 >> 2];
     Wa(n, f + 164 | 0, V, T, m, 0, 8, 16, 8);
    } else U = 431;
   } else U = 431;
   break;
  }
 case 3:
  {
   u = b[g + 160 >> 1] | 0;
   v = b[g + 162 >> 1] | 0;
   w = c[g + 144 >> 2] | 0;
   p = c[f + 200 >> 2] | 0;
   if ((p | 0) != 0 ? (c[p + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[p >> 2] | 0) >>> 0 < 6) {
    o = e[p + 152 >> 1] | e[p + 152 + 2 >> 1] << 16;
    q = 1;
    t = o & 65535;
    o = o >>> 16 & 65535;
    p = c[p + 104 >> 2] | 0;
   } else {
    q = 1;
    t = 0;
    o = 0;
    p = -1;
   } else {
    q = 0;
    t = 0;
    o = 0;
    p = -1;
   }
   f : do if ((p | 0) != (w | 0)) {
    k = c[f + 204 >> 2] | 0;
    if ((k | 0) != 0 ? (c[k + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[k >> 2] | 0) >>> 0 < 6) {
     s = e[k + 172 >> 1] | e[k + 172 + 2 >> 1] << 16;
     q = c[k + 108 >> 2] | 0;
     p = s & 65535;
     s = s >>> 16 & 65535;
     r = c[k + 112 >> 2] | 0;
     k = e[k + 188 >> 1] | e[k + 188 + 2 >> 1] << 16;
    } else {
     q = -1;
     p = 0;
     s = 0;
     r = -1;
     k = 0;
    } else U = 307;
    do if ((U | 0) == 307) {
     k = c[f + 212 >> 2] | 0;
     if ((k | 0) != 0 ? (c[k + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) {
      if ((c[k >> 2] | 0) >>> 0 >= 6) {
       q = -1;
       p = 0;
       s = 0;
       r = -1;
       k = 0;
       break;
      }
      q = -1;
      p = 0;
      s = 0;
      r = c[k + 112 >> 2] | 0;
      k = e[k + 192 >> 1] | e[k + 192 + 2 >> 1] << 16;
      break;
     }
     if (!q) {
      q = -1;
      p = 0;
      s = 0;
      r = -1;
      k = 0;
     } else {
      p = t;
      break f;
     }
    } while (0);
    q = (q | 0) == (w | 0);
    if (((q & 1) + ((r | 0) == (w | 0) & 1) | 0) != 1) {
     N = t << 16 >> 16;
     M = p << 16 >> 16;
     P = k << 16 >> 16;
     X = p << 16 >> 16 > t << 16 >> 16;
     O = X ? p : t;
     p = X ? N : (M | 0) < (N | 0) ? M : N;
     N = o << 16 >> 16;
     M = s << 16 >> 16;
     X = k >> 16;
     L = s << 16 >> 16 > o << 16 >> 16;
     W = L ? s : o;
     o = L ? N : (M | 0) < (N | 0) ? M : N;
     p = (O << 16 >> 16 < (k & 65535) << 16 >> 16 ? O & 65535 : (p | 0) > (P | 0) ? p : P) & 65535;
     o = (W << 16 >> 16 < (k >>> 16 & 65535) << 16 >> 16 ? W & 65535 : (o | 0) > (X | 0) ? o : X) & 65535;
     break;
    }
    if (q) o = s; else {
     p = k & 65535;
     o = k >>> 16 & 65535;
    }
   } else p = t; while (0);
   p = (p & 65535) + (u & 65535) | 0;
   o = (o & 65535) + (v & 65535) | 0;
   if ((((((p << 16 >> 16) + 8192 | 0) >>> 0 <= 16383 ? !(w >>> 0 > 16 | ((o << 16 >> 16) + 2048 | 0) >>> 0 > 4095) : 0) ? (H = c[(c[j + 4 >> 2] | 0) + (w << 2) >> 2] | 0, (H | 0) != 0) : 0) ? (c[H + 20 >> 2] | 0) >>> 0 > 1 : 0) ? (Q = c[H >> 2] | 0, (Q | 0) != 0) : 0) {
    b[f + 176 >> 1] = p;
    b[f + 178 >> 1] = o;
    r = c[f + 176 >> 2] | 0;
    c[f + 172 >> 2] = r;
    c[f + 168 >> 2] = r;
    c[f + 164 >> 2] = r;
    c[f + 144 >> 2] = r;
    c[f + 140 >> 2] = r;
    c[f + 136 >> 2] = r;
    c[f + 132 >> 2] = r;
    c[f + 100 >> 2] = w;
    c[f + 108 >> 2] = w;
    c[f + 116 >> 2] = Q;
    c[f + 124 >> 2] = Q;
    s = b[g + 164 >> 1] | 0;
    t = b[g + 166 >> 1] | 0;
    u = c[g + 148 >> 2] | 0;
    o = c[f + 208 >> 2] | 0;
    if ((o | 0) != 0 ? (c[o + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[o >> 2] | 0) >>> 0 < 6) {
     q = 1;
     p = c[o + 108 >> 2] | 0;
     k = e[o + 172 >> 1] | e[o + 172 + 2 >> 1] << 16;
    } else {
     q = 1;
     p = -1;
     k = 0;
    } else {
     o = c[f + 204 >> 2] | 0;
     if ((o | 0) != 0 ? (c[o + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[o >> 2] | 0) >>> 0 < 6) {
      q = 1;
      p = c[o + 108 >> 2] | 0;
      k = e[o + 176 >> 1] | e[o + 176 + 2 >> 1] << 16;
     } else {
      q = 1;
      p = -1;
      k = 0;
     } else {
      q = 0;
      p = -1;
      k = 0;
     }
    }
    do if ((p | 0) != (u | 0)) {
     o = c[f + 204 >> 2] | 0;
     if ((o | 0) != 0 ? (c[o + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[o >> 2] | 0) >>> 0 < 6) {
      q = e[o + 188 >> 1] | e[o + 188 + 2 >> 1] << 16;
      o = c[o + 112 >> 2] | 0;
      p = q & 65535;
      q = q >>> 16 & 65535;
     } else {
      o = -1;
      p = 0;
      q = 0;
     } else if (!q) {
      p = r;
      o = r >>> 16;
      break;
     } else {
      o = -1;
      p = 0;
      q = 0;
     }
     o = (o | 0) == (u | 0);
     if (((o & 1) + ((w | 0) == (u | 0) & 1) | 0) != 1) {
      X = p << 16 >> 16;
      P = k << 16 >> 16;
      o = p << 16 >> 16 > (r & 65535) << 16 >> 16;
      O = o ? p : r & 65535;
      p = o ? r << 16 >> 16 : (X | 0) < (r << 16 >> 16 | 0) ? X : r << 16 >> 16;
      X = q << 16 >> 16;
      o = k >> 16;
      N = q << 16 >> 16 > (r >>> 16 & 65535) << 16 >> 16;
      W = N ? q : r >>> 16 & 65535;
      X = N ? r >> 16 : (X | 0) < (r >> 16 | 0) ? X : r >> 16;
      p = O << 16 >> 16 < (k & 65535) << 16 >> 16 ? O & 65535 : (p | 0) > (P | 0) ? p : P;
      o = W << 16 >> 16 < (k >>> 16 & 65535) << 16 >> 16 ? W & 65535 : (X | 0) > (o | 0) ? X : o;
      break;
     }
     if ((w | 0) == (u | 0)) {
      p = r;
      o = r >>> 16;
      break;
     }
     if (o) {
      o = q & 65535;
      p = o << 16 | p & 65535;
      break;
     } else {
      p = k;
      o = k >>> 16;
      break;
     }
    } else {
     p = k;
     o = k >>> 16;
    } while (0);
    p = (p & 65535) + (s & 65535) | 0;
    o = (o & 65535) + (t & 65535) | 0;
    if ((((((p << 16 >> 16) + 8192 | 0) >>> 0 <= 16383 ? !(u >>> 0 > 16 | ((o << 16 >> 16) + 2048 | 0) >>> 0 > 4095) : 0) ? (R = c[(c[j + 4 >> 2] | 0) + (u << 2) >> 2] | 0, (R | 0) != 0) : 0) ? (c[R + 20 >> 2] | 0) >>> 0 > 1 : 0) ? (S = c[R >> 2] | 0, (S | 0) != 0) : 0) {
     b[f + 192 >> 1] = p;
     b[f + 194 >> 1] = o;
     X = c[f + 192 >> 2] | 0;
     c[f + 188 >> 2] = X;
     c[f + 184 >> 2] = X;
     c[f + 180 >> 2] = X;
     c[f + 160 >> 2] = X;
     c[f + 156 >> 2] = X;
     c[f + 152 >> 2] = X;
     c[f + 148 >> 2] = X;
     c[f + 104 >> 2] = u;
     c[f + 112 >> 2] = u;
     c[f + 120 >> 2] = S;
     c[f + 128 >> 2] = S;
     c[V >> 2] = Q;
     Wa(n, f + 132 | 0, V, T, m, 0, 0, 8, 16);
     c[V >> 2] = c[f + 120 >> 2];
     Wa(n, f + 148 | 0, V, T, m, 8, 0, 8, 16);
    } else U = 431;
   } else U = 431;
   break;
  }
 default:
  {
   o = 0;
   do {
    F = g + 176 + (o << 2) | 0;
    switch (c[F >> 2] | 0) {
    case 0:
     {
      E = 1;
      break;
     }
    case 2:
    case 1:
     {
      E = 2;
      break;
     }
    default:
     E = 4;
    }
    G = g + 192 + (o << 2) | 0;
    c[f + 100 + (o << 2) >> 2] = c[G >> 2];
    q = c[G >> 2] | 0;
    if (q >>> 0 > 16) {
     U = 357;
     break;
    }
    p = c[(c[j + 4 >> 2] | 0) + (q << 2) >> 2] | 0;
    if (!p) {
     U = 357;
     break;
    }
    if ((c[p + 20 >> 2] | 0) >>> 0 <= 1) {
     U = 357;
     break;
    }
    X = c[p >> 2] | 0;
    c[f + 116 + (o << 2) >> 2] = X;
    if (!X) {
     U = 431;
     break d;
    }
    D = o << 2;
    p = 0;
    while (1) {
     A = b[g + 208 + (o << 4) + (p << 2) >> 1] | 0;
     B = b[g + 208 + (o << 4) + (p << 2) + 2 >> 1] | 0;
     C = c[F >> 2] | 0;
     switch (c[1280 + (o << 7) + (C << 5) + (p << 3) >> 2] | 0) {
     case 0:
      {
       k = c[f + 200 >> 2] | 0;
       U = 365;
       break;
      }
     case 1:
      {
       k = c[f + 204 >> 2] | 0;
       U = 365;
       break;
      }
     case 2:
      {
       k = c[f + 208 >> 2] | 0;
       U = 365;
       break;
      }
     case 3:
      {
       k = c[f + 212 >> 2] | 0;
       U = 365;
       break;
      }
     case 4:
      {
       k = f;
       U = 365;
       break;
      }
     default:
      {
       u = 0;
       x = -1;
       k = 0;
       z = 0;
      }
     }
     if ((U | 0) == 365) {
      U = 0;
      r = d[1280 + (o << 7) + (C << 5) + (p << 3) + 4 >> 0] | 0;
      if ((k | 0) != 0 ? (c[k + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[k >> 2] | 0) >>> 0 < 6) {
       z = k + 132 + (r << 2) | 0;
       z = e[z >> 1] | e[z + 2 >> 1] << 16;
       u = 1;
       x = c[k + 100 + (r >>> 2 << 2) >> 2] | 0;
       k = z & 65535;
       z = z >>> 16 & 65535;
      } else {
       u = 1;
       x = -1;
       k = 0;
       z = 0;
      } else {
       u = 0;
       x = -1;
       k = 0;
       z = 0;
      }
     }
     switch (c[1792 + (o << 7) + (C << 5) + (p << 3) >> 2] | 0) {
     case 0:
      {
       s = c[f + 200 >> 2] | 0;
       U = 374;
       break;
      }
     case 1:
      {
       s = c[f + 204 >> 2] | 0;
       U = 374;
       break;
      }
     case 2:
      {
       s = c[f + 208 >> 2] | 0;
       U = 374;
       break;
      }
     case 3:
      {
       s = c[f + 212 >> 2] | 0;
       U = 374;
       break;
      }
     case 4:
      {
       s = f;
       U = 374;
       break;
      }
     default:
      {
       t = 0;
       v = -1;
       w = 0;
       y = 0;
      }
     }
     if ((U | 0) == 374) {
      r = d[1792 + (o << 7) + (C << 5) + (p << 3) + 4 >> 0] | 0;
      if ((s | 0) != 0 ? (c[s + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[s >> 2] | 0) >>> 0 < 6) {
       y = s + 132 + (r << 2) | 0;
       y = e[y >> 1] | e[y + 2 >> 1] << 16;
       t = 1;
       v = c[s + 100 + (r >>> 2 << 2) >> 2] | 0;
       w = y & 65535;
       y = y >>> 16 & 65535;
      } else {
       t = 1;
       v = -1;
       w = 0;
       y = 0;
      } else {
       t = 0;
       v = -1;
       w = 0;
       y = 0;
      }
     }
     switch (c[2304 + (o << 7) + (C << 5) + (p << 3) >> 2] | 0) {
     case 0:
      {
       s = c[f + 200 >> 2] | 0;
       U = 383;
       break;
      }
     case 1:
      {
       s = c[f + 204 >> 2] | 0;
       U = 383;
       break;
      }
     case 2:
      {
       s = c[f + 208 >> 2] | 0;
       U = 383;
       break;
      }
     case 3:
      {
       s = c[f + 212 >> 2] | 0;
       U = 383;
       break;
      }
     case 4:
      {
       s = f;
       U = 383;
       break;
      }
     default:
      U = 387;
     }
     if ((U | 0) == 383) {
      r = d[2304 + (o << 7) + (C << 5) + (p << 3) + 4 >> 0] | 0;
      if ((s | 0) != 0 ? (c[s + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) if ((c[s >> 2] | 0) >>> 0 < 6) {
       u = s + 132 + (r << 2) | 0;
       t = c[s + 100 + (r >>> 2 << 2) >> 2] | 0;
       u = e[u >> 1] | e[u + 2 >> 1] << 16;
       U = 397;
      } else {
       t = -1;
       u = 0;
       U = 397;
      } else U = 387;
     }
     do if ((U | 0) == 387) {
      U = 0;
      switch (c[2816 + (o << 7) + (C << 5) + (p << 3) >> 2] | 0) {
      case 0:
       {
        L = c[f + 200 >> 2] | 0;
        U = 392;
        break;
       }
      case 1:
       {
        L = c[f + 204 >> 2] | 0;
        U = 392;
        break;
       }
      case 2:
       {
        L = c[f + 208 >> 2] | 0;
        U = 392;
        break;
       }
      case 3:
       {
        L = c[f + 212 >> 2] | 0;
        U = 392;
        break;
       }
      case 4:
       {
        L = f;
        U = 392;
        break;
       }
      default:
       {}
      }
      if (((U | 0) == 392 ? (U = 0, P = d[2816 + (o << 7) + (C << 5) + (p << 3) + 4 >> 0] | 0, (L | 0) != 0) : 0) ? (c[L + 4 >> 2] | 0) == (c[f + 4 >> 2] | 0) : 0) {
       if ((c[L >> 2] | 0) >>> 0 >= 6) {
        t = -1;
        u = 0;
        U = 397;
        break;
       }
       u = L + 132 + (P << 2) | 0;
       t = c[L + 100 + (P >>> 2 << 2) >> 2] | 0;
       u = e[u >> 1] | e[u + 2 >> 1] << 16;
       U = 397;
       break;
      }
      if ((u | 0) == 0 | (t | 0) != 0) {
       t = -1;
       u = 0;
       U = 397;
      } else q = z;
     } while (0);
     do if ((U | 0) == 397) {
      U = 0;
      s = (x | 0) == (q | 0);
      r = (v | 0) == (q | 0);
      if (((r & 1) + (s & 1) + ((t | 0) == (q | 0) & 1) | 0) != 1) {
       X = k << 16 >> 16;
       Q = w << 16 >> 16;
       S = u << 16 >> 16;
       q = w << 16 >> 16 > k << 16 >> 16;
       R = q ? w : k;
       k = q ? X : (Q | 0) < (X | 0) ? Q : X;
       X = z << 16 >> 16;
       Q = y << 16 >> 16;
       q = u >> 16;
       O = y << 16 >> 16 > z << 16 >> 16;
       W = O ? y : z;
       X = O ? X : (Q | 0) < (X | 0) ? Q : X;
       k = (R << 16 >> 16 < (u & 65535) << 16 >> 16 ? R & 65535 : (k | 0) > (S | 0) ? k : S) & 65535;
       q = (W << 16 >> 16 < (u >>> 16 & 65535) << 16 >> 16 ? W & 65535 : (X | 0) > (q | 0) ? X : q) & 65535;
       break;
      }
      if (s | r) {
       k = s ? k : w;
       q = s ? z : y;
      } else {
       k = u & 65535;
       q = u >>> 16 & 65535;
      }
     } while (0);
     k = (k & 65535) + (A & 65535) | 0;
     q = (q & 65535) + (B & 65535) | 0;
     if (((k << 16 >> 16) + 8192 | 0) >>> 0 > 16383) {
      U = 431;
      break d;
     }
     if (((q << 16 >> 16) + 2048 | 0) >>> 0 > 4095) {
      U = 431;
      break d;
     }
     switch (C | 0) {
     case 0:
      {
       b[f + 132 + (D << 2) >> 1] = k;
       b[f + 132 + (D << 2) + 2 >> 1] = q;
       b[f + 132 + ((D | 1) << 2) >> 1] = k;
       b[f + 132 + ((D | 1) << 2) + 2 >> 1] = q;
       b[f + 132 + ((D | 2) << 2) >> 1] = k;
       b[f + 132 + ((D | 2) << 2) + 2 >> 1] = q;
       b[f + 132 + ((D | 3) << 2) >> 1] = k;
       b[f + 132 + ((D | 3) << 2) + 2 >> 1] = q;
       break;
      }
     case 1:
      {
       X = (p << 1) + D | 0;
       b[f + 132 + (X << 2) >> 1] = k;
       b[f + 132 + (X << 2) + 2 >> 1] = q;
       b[f + 132 + ((X | 1) << 2) >> 1] = k;
       b[f + 132 + ((X | 1) << 2) + 2 >> 1] = q;
       break;
      }
     case 2:
      {
       X = p + D | 0;
       b[f + 132 + (X << 2) >> 1] = k;
       b[f + 132 + (X << 2) + 2 >> 1] = q;
       b[f + 132 + (X + 2 << 2) >> 1] = k;
       b[f + 132 + (X + 2 << 2) + 2 >> 1] = q;
       break;
      }
     case 3:
      {
       X = p + D | 0;
       b[f + 132 + (X << 2) >> 1] = k;
       b[f + 132 + (X << 2) + 2 >> 1] = q;
       break;
      }
     default:
      {}
     }
     p = p + 1 | 0;
     if (p >>> 0 >= E >>> 0) break;
     q = c[G >> 2] | 0;
    }
    o = o + 1 | 0;
   } while (o >>> 0 < 4);
   if ((U | 0) == 357) {
    c[f + 116 + (o << 2) >> 2] = 0;
    U = 431;
    break d;
   }
   q = 0;
   while (1) {
    c[V >> 2] = c[f + 116 + (q << 2) >> 2];
    o = q << 3 & 8;
    p = q >>> 0 < 2 ? 0 : 8;
    switch (c[g + 176 + (q << 2) >> 2] | 0) {
    case 0:
     {
      Wa(n, f + 132 + (q << 2 << 2) | 0, V, T, m, o, p, 8, 8);
      break;
     }
    case 1:
     {
      X = f + 132 + (q << 2 << 2) | 0;
      Wa(n, X, V, T, m, o, p, 8, 4);
      Wa(n, X + 8 | 0, V, T, m, o, p | 4, 8, 4);
      break;
     }
    case 2:
     {
      X = f + 132 + (q << 2 << 2) | 0;
      Wa(n, X, V, T, m, o, p, 4, 8);
      Wa(n, X + 4 | 0, V, T, m, o | 4, p, 4, 8);
      break;
     }
    default:
     {
      X = f + 132 + (q << 2 << 2) | 0;
      Wa(n, X, V, T, m, o, p, 4, 4);
      Wa(n, X + 4 | 0, V, T, m, o | 4, p, 4, 4);
      Wa(n, X + 8 | 0, V, T, m, o, p | 4, 4, 4);
      Wa(n, X + 12 | 0, V, T, m, o | 4, p | 4, 4, 4);
     }
    }
    q = q + 1 | 0;
    if ((q | 0) == 4) break d;
   }
  }
 } while (0);
 if ((U | 0) == 431) {
  X = 1;
  i = V;
  return X | 0;
 }
 do if ((c[f + 196 >> 2] | 0) >>> 0 <= 1) {
  if (!(c[f >> 2] | 0)) {
   $a(h, n);
   break;
  }
  t = c[h + 4 >> 2] | 0;
  u = Z(c[h + 8 >> 2] | 0, t) | 0;
  o = c[h >> 2] | 0;
  s = 0;
  do {
   p = c[1152 + (s << 2) >> 2] | 0;
   q = c[1216 + (s << 2) >> 2] | 0;
   k = o + (l - ((l >>> 0) % (t >>> 0) | 0) << 8) + (((l >>> 0) % (t >>> 0) | 0) << 4) + (Z(q, t << 4) | 0) + p | 0;
   r = c[g + 328 + (s << 6) >> 2] | 0;
   if ((r | 0) == 16777215) {
    X = c[n + (q << 4) + p + 16 >> 2] | 0;
    h = n + (q << 4) + p + 16 + 16 | 0;
    c[k >> 2] = c[n + (q << 4) + p >> 2];
    c[k + ((t << 2 & 1073741820) << 2) >> 2] = X;
    X = k + ((t << 2 & 1073741820) << 2) + ((t << 2 & 1073741820) << 2) | 0;
    W = c[h + 16 >> 2] | 0;
    c[X >> 2] = c[h >> 2];
    c[X + ((t << 2 & 1073741820) << 2) >> 2] = W;
   } else {
    X = d[n + (q << 4) + p + 1 >> 0] | 0;
    j = c[g + 328 + (s << 6) + 4 >> 2] | 0;
    a[k >> 0] = a[6150 + ((d[n + (q << 4) + p >> 0] | 0) + r) >> 0] | 0;
    f = d[n + (q << 4) + p + 2 >> 0] | 0;
    h = c[g + 328 + (s << 6) + 8 >> 2] | 0;
    a[k + 1 >> 0] = a[6150 + (j + X) >> 0] | 0;
    X = d[n + (q << 4) + p + 3 >> 0] | 0;
    j = c[g + 328 + (s << 6) + 12 >> 2] | 0;
    a[k + 2 >> 0] = a[6150 + (f + h) >> 0] | 0;
    h = n + (q << 4) + p + 16 | 0;
    a[k + 3 >> 0] = a[6150 + (X + j) >> 0] | 0;
    j = d[h + 1 >> 0] | 0;
    X = c[g + 328 + (s << 6) + 20 >> 2] | 0;
    a[k + (t << 4) >> 0] = a[6150 + ((d[h >> 0] | 0) + (c[g + 328 + (s << 6) + 16 >> 2] | 0)) >> 0] | 0;
    f = d[h + 2 >> 0] | 0;
    W = c[g + 328 + (s << 6) + 24 >> 2] | 0;
    a[k + (t << 4) + 1 >> 0] = a[6150 + (X + j) >> 0] | 0;
    j = d[h + 3 >> 0] | 0;
    X = c[g + 328 + (s << 6) + 28 >> 2] | 0;
    a[k + (t << 4) + 2 >> 0] = a[6150 + (f + W) >> 0] | 0;
    a[k + (t << 4) + 3 >> 0] = a[6150 + (j + X) >> 0] | 0;
    X = k + (t << 4) + (t << 4) | 0;
    j = d[h + 16 + 1 >> 0] | 0;
    W = c[g + 328 + (s << 6) + 36 >> 2] | 0;
    a[X >> 0] = a[6150 + ((d[h + 16 >> 0] | 0) + (c[g + 328 + (s << 6) + 32 >> 2] | 0)) >> 0] | 0;
    f = d[h + 16 + 2 >> 0] | 0;
    U = c[g + 328 + (s << 6) + 40 >> 2] | 0;
    a[X + 1 >> 0] = a[6150 + (W + j) >> 0] | 0;
    j = d[h + 16 + 3 >> 0] | 0;
    W = c[g + 328 + (s << 6) + 44 >> 2] | 0;
    a[X + 2 >> 0] = a[6150 + (f + U) >> 0] | 0;
    a[X + 3 >> 0] = a[6150 + (j + W) >> 0] | 0;
    W = d[h + 16 + 16 + 1 >> 0] | 0;
    j = c[g + 328 + (s << 6) + 52 >> 2] | 0;
    a[X + (t << 4) >> 0] = a[6150 + ((d[h + 16 + 16 >> 0] | 0) + (c[g + 328 + (s << 6) + 48 >> 2] | 0)) >> 0] | 0;
    U = d[h + 16 + 16 + 2 >> 0] | 0;
    f = c[g + 328 + (s << 6) + 56 >> 2] | 0;
    a[X + (t << 4) + 1 >> 0] = a[6150 + (j + W) >> 0] | 0;
    h = d[h + 16 + 16 + 3 >> 0] | 0;
    W = c[g + 328 + (s << 6) + 60 >> 2] | 0;
    a[X + (t << 4) + 2 >> 0] = a[6150 + (U + f) >> 0] | 0;
    a[X + (t << 4) + 3 >> 0] = a[6150 + (h + W) >> 0] | 0;
   }
   s = s + 1 | 0;
  } while ((s | 0) != 16);
  o = o + (u << 8) + (l - ((l >>> 0) % (t >>> 0) | 0) << 6) + (((l >>> 0) % (t >>> 0) | 0) << 3) | 0;
  r = 16;
  do {
   k = r & 3;
   q = c[1152 + (k << 2) >> 2] | 0;
   k = c[1216 + (k << 2) >> 2] | 0;
   X = r >>> 0 > 19;
   p = n + (X ? 320 : 256) + ((k << 3) + q) | 0;
   q = (X ? o + (u << 6) | 0 : o) + ((Z(k, t << 3 & 2147483640) | 0) + q) | 0;
   k = c[g + 328 + (r << 6) >> 2] | 0;
   if ((k | 0) == 16777215) {
    X = c[p + 8 >> 2] | 0;
    c[q >> 2] = c[p >> 2];
    c[q + ((t << 3 & 2147483640) >>> 2 << 2) >> 2] = X;
    X = q + ((t << 3 & 2147483640) >>> 2 << 2) + ((t << 3 & 2147483640) >>> 2 << 2) | 0;
    W = c[p + 8 + 8 + 8 >> 2] | 0;
    c[X >> 2] = c[p + 8 + 8 >> 2];
    c[X + ((t << 3 & 2147483640) >>> 2 << 2) >> 2] = W;
   } else {
    W = d[p + 1 >> 0] | 0;
    X = c[g + 328 + (r << 6) + 4 >> 2] | 0;
    a[q >> 0] = a[6150 + ((d[p >> 0] | 0) + k) >> 0] | 0;
    f = d[p + 2 >> 0] | 0;
    l = c[g + 328 + (r << 6) + 8 >> 2] | 0;
    a[q + 1 >> 0] = a[6150 + (X + W) >> 0] | 0;
    W = d[p + 3 >> 0] | 0;
    X = c[g + 328 + (r << 6) + 12 >> 2] | 0;
    a[q + 2 >> 0] = a[6150 + (f + l) >> 0] | 0;
    a[q + 3 >> 0] = a[6150 + (W + X) >> 0] | 0;
    X = q + (t << 3 & 2147483640) | 0;
    W = d[p + 8 + 1 >> 0] | 0;
    l = c[g + 328 + (r << 6) + 20 >> 2] | 0;
    a[X >> 0] = a[6150 + ((d[p + 8 >> 0] | 0) + (c[g + 328 + (r << 6) + 16 >> 2] | 0)) >> 0] | 0;
    f = d[p + 8 + 2 >> 0] | 0;
    h = c[g + 328 + (r << 6) + 24 >> 2] | 0;
    a[X + 1 >> 0] = a[6150 + (l + W) >> 0] | 0;
    W = d[p + 8 + 3 >> 0] | 0;
    l = c[g + 328 + (r << 6) + 28 >> 2] | 0;
    a[X + 2 >> 0] = a[6150 + (f + h) >> 0] | 0;
    h = p + 8 + 8 | 0;
    a[X + 3 >> 0] = a[6150 + (W + l) >> 0] | 0;
    X = X + (t << 3 & 2147483640) | 0;
    l = d[h + 1 >> 0] | 0;
    W = c[g + 328 + (r << 6) + 36 >> 2] | 0;
    a[X >> 0] = a[6150 + ((d[h >> 0] | 0) + (c[g + 328 + (r << 6) + 32 >> 2] | 0)) >> 0] | 0;
    f = d[h + 2 >> 0] | 0;
    U = c[g + 328 + (r << 6) + 40 >> 2] | 0;
    a[X + 1 >> 0] = a[6150 + (W + l) >> 0] | 0;
    l = d[h + 3 >> 0] | 0;
    W = c[g + 328 + (r << 6) + 44 >> 2] | 0;
    a[X + 2 >> 0] = a[6150 + (f + U) >> 0] | 0;
    a[X + 3 >> 0] = a[6150 + (l + W) >> 0] | 0;
    W = d[h + 8 + 1 >> 0] | 0;
    l = c[g + 328 + (r << 6) + 52 >> 2] | 0;
    a[X + (t << 3 & 2147483640) >> 0] = a[6150 + ((d[h + 8 >> 0] | 0) + (c[g + 328 + (r << 6) + 48 >> 2] | 0)) >> 0] | 0;
    U = d[h + 8 + 2 >> 0] | 0;
    f = c[g + 328 + (r << 6) + 56 >> 2] | 0;
    a[X + (t << 3 & 2147483640) + 1 >> 0] = a[6150 + (l + W) >> 0] | 0;
    h = d[h + 8 + 3 >> 0] | 0;
    W = c[g + 328 + (r << 6) + 60 >> 2] | 0;
    a[X + (t << 3 & 2147483640) + 2 >> 0] = a[6150 + (U + f) >> 0] | 0;
    a[X + (t << 3 & 2147483640) + 3 >> 0] = a[6150 + (h + W) >> 0] | 0;
   }
   r = r + 1 | 0;
  } while ((r | 0) != 24);
 } while (0);
 X = 0;
 i = V;
 return X | 0;
}

function ub(a) {
 a = a | 0;
 var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0;
 do if (a >>> 0 < 245) {
  n = a >>> 0 < 11 ? 16 : a + 11 & -8;
  g = c[1831] | 0;
  if (g >>> (n >>> 3) & 3) {
   a = 7364 + ((g >>> (n >>> 3) & 1 ^ 1) + (n >>> 3) << 1 << 2) | 0;
   b = c[a + 8 >> 2] | 0;
   d = c[b + 8 >> 2] | 0;
   do if ((a | 0) != (d | 0)) {
    if (d >>> 0 < (c[1835] | 0) >>> 0) la();
    if ((c[d + 12 >> 2] | 0) == (b | 0)) {
     c[d + 12 >> 2] = a;
     c[a + 8 >> 2] = d;
     break;
    } else la();
   } else c[1831] = g & ~(1 << (g >>> (n >>> 3) & 1 ^ 1) + (n >>> 3)); while (0);
   D = (g >>> (n >>> 3) & 1 ^ 1) + (n >>> 3) << 3;
   c[b + 4 >> 2] = D | 3;
   c[b + D + 4 >> 2] = c[b + D + 4 >> 2] | 1;
   D = b + 8 | 0;
   return D | 0;
  }
  b = c[1833] | 0;
  if (n >>> 0 > b >>> 0) {
   if (g >>> (n >>> 3)) {
    a = g >>> (n >>> 3) << (n >>> 3) & (2 << (n >>> 3) | 0 - (2 << (n >>> 3)));
    f = ((a & 0 - a) + -1 | 0) >>> (((a & 0 - a) + -1 | 0) >>> 12 & 16);
    e = f >>> (f >>> 5 & 8) >>> (f >>> (f >>> 5 & 8) >>> 2 & 4);
    e = (f >>> 5 & 8 | ((a & 0 - a) + -1 | 0) >>> 12 & 16 | f >>> (f >>> 5 & 8) >>> 2 & 4 | e >>> 1 & 2 | e >>> (e >>> 1 & 2) >>> 1 & 1) + (e >>> (e >>> 1 & 2) >>> (e >>> (e >>> 1 & 2) >>> 1 & 1)) | 0;
    f = c[7364 + (e << 1 << 2) + 8 >> 2] | 0;
    a = c[f + 8 >> 2] | 0;
    do if ((7364 + (e << 1 << 2) | 0) != (a | 0)) {
     if (a >>> 0 < (c[1835] | 0) >>> 0) la();
     if ((c[a + 12 >> 2] | 0) == (f | 0)) {
      c[a + 12 >> 2] = 7364 + (e << 1 << 2);
      c[7364 + (e << 1 << 2) + 8 >> 2] = a;
      h = c[1833] | 0;
      break;
     } else la();
    } else {
     c[1831] = g & ~(1 << e);
     h = b;
    } while (0);
    c[f + 4 >> 2] = n | 3;
    c[f + n + 4 >> 2] = (e << 3) - n | 1;
    c[f + n + ((e << 3) - n) >> 2] = (e << 3) - n;
    if (h) {
     d = c[1836] | 0;
     b = h >>> 3;
     a = c[1831] | 0;
     if (a & 1 << b) {
      a = c[7364 + (b << 1 << 2) + 8 >> 2] | 0;
      if (a >>> 0 < (c[1835] | 0) >>> 0) la(); else {
       i = 7364 + (b << 1 << 2) + 8 | 0;
       j = a;
      }
     } else {
      c[1831] = a | 1 << b;
      i = 7364 + (b << 1 << 2) + 8 | 0;
      j = 7364 + (b << 1 << 2) | 0;
     }
     c[i >> 2] = d;
     c[j + 12 >> 2] = d;
     c[d + 8 >> 2] = j;
     c[d + 12 >> 2] = 7364 + (b << 1 << 2);
    }
    c[1833] = (e << 3) - n;
    c[1836] = f + n;
    D = f + 8 | 0;
    return D | 0;
   }
   a = c[1832] | 0;
   if (a) {
    i = ((a & 0 - a) + -1 | 0) >>> (((a & 0 - a) + -1 | 0) >>> 12 & 16);
    j = i >>> (i >>> 5 & 8) >>> (i >>> (i >>> 5 & 8) >>> 2 & 4);
    j = c[7628 + ((i >>> 5 & 8 | ((a & 0 - a) + -1 | 0) >>> 12 & 16 | i >>> (i >>> 5 & 8) >>> 2 & 4 | j >>> 1 & 2 | j >>> (j >>> 1 & 2) >>> 1 & 1) + (j >>> (j >>> 1 & 2) >>> (j >>> (j >>> 1 & 2) >>> 1 & 1)) << 2) >> 2] | 0;
    i = (c[j + 4 >> 2] & -8) - n | 0;
    b = j;
    while (1) {
     a = c[b + 16 >> 2] | 0;
     if (!a) {
      a = c[b + 20 >> 2] | 0;
      if (!a) break;
     }
     b = (c[a + 4 >> 2] & -8) - n | 0;
     D = b >>> 0 < i >>> 0;
     i = D ? b : i;
     b = a;
     j = D ? a : j;
    }
    f = c[1835] | 0;
    if (j >>> 0 < f >>> 0) la();
    h = j + n | 0;
    if (j >>> 0 >= h >>> 0) la();
    g = c[j + 24 >> 2] | 0;
    a = c[j + 12 >> 2] | 0;
    do if ((a | 0) == (j | 0)) {
     b = j + 20 | 0;
     a = c[b >> 2] | 0;
     if (!a) {
      b = j + 16 | 0;
      a = c[b >> 2] | 0;
      if (!a) {
       k = 0;
       break;
      }
     }
     while (1) {
      d = a + 20 | 0;
      e = c[d >> 2] | 0;
      if (e) {
       a = e;
       b = d;
       continue;
      }
      d = a + 16 | 0;
      e = c[d >> 2] | 0;
      if (!e) break; else {
       a = e;
       b = d;
      }
     }
     if (b >>> 0 < f >>> 0) la(); else {
      c[b >> 2] = 0;
      k = a;
      break;
     }
    } else {
     b = c[j + 8 >> 2] | 0;
     if (b >>> 0 < f >>> 0) la();
     if ((c[b + 12 >> 2] | 0) != (j | 0)) la();
     if ((c[a + 8 >> 2] | 0) == (j | 0)) {
      c[b + 12 >> 2] = a;
      c[a + 8 >> 2] = b;
      k = a;
      break;
     } else la();
    } while (0);
    do if (g) {
     a = c[j + 28 >> 2] | 0;
     if ((j | 0) == (c[7628 + (a << 2) >> 2] | 0)) {
      c[7628 + (a << 2) >> 2] = k;
      if (!k) {
       c[1832] = c[1832] & ~(1 << a);
       break;
      }
     } else {
      if (g >>> 0 < (c[1835] | 0) >>> 0) la();
      if ((c[g + 16 >> 2] | 0) == (j | 0)) c[g + 16 >> 2] = k; else c[g + 20 >> 2] = k;
      if (!k) break;
     }
     b = c[1835] | 0;
     if (k >>> 0 < b >>> 0) la();
     c[k + 24 >> 2] = g;
     a = c[j + 16 >> 2] | 0;
     do if (a) if (a >>> 0 < b >>> 0) la(); else {
      c[k + 16 >> 2] = a;
      c[a + 24 >> 2] = k;
      break;
     } while (0);
     a = c[j + 20 >> 2] | 0;
     if (a) if (a >>> 0 < (c[1835] | 0) >>> 0) la(); else {
      c[k + 20 >> 2] = a;
      c[a + 24 >> 2] = k;
      break;
     }
    } while (0);
    if (i >>> 0 < 16) {
     D = i + n | 0;
     c[j + 4 >> 2] = D | 3;
     D = j + D + 4 | 0;
     c[D >> 2] = c[D >> 2] | 1;
    } else {
     c[j + 4 >> 2] = n | 3;
     c[h + 4 >> 2] = i | 1;
     c[h + i >> 2] = i;
     b = c[1833] | 0;
     if (b) {
      d = c[1836] | 0;
      a = c[1831] | 0;
      if (a & 1 << (b >>> 3)) {
       a = c[7364 + (b >>> 3 << 1 << 2) + 8 >> 2] | 0;
       if (a >>> 0 < (c[1835] | 0) >>> 0) la(); else {
        l = 7364 + (b >>> 3 << 1 << 2) + 8 | 0;
        m = a;
       }
      } else {
       c[1831] = a | 1 << (b >>> 3);
       l = 7364 + (b >>> 3 << 1 << 2) + 8 | 0;
       m = 7364 + (b >>> 3 << 1 << 2) | 0;
      }
      c[l >> 2] = d;
      c[m + 12 >> 2] = d;
      c[d + 8 >> 2] = m;
      c[d + 12 >> 2] = 7364 + (b >>> 3 << 1 << 2);
     }
     c[1833] = i;
     c[1836] = h;
    }
    D = j + 8 | 0;
    return D | 0;
   }
  }
 } else if (a >>> 0 <= 4294967231) {
  n = a + 11 & -8;
  i = c[1832] | 0;
  if (i) {
   if ((a + 11 | 0) >>> 8) if (n >>> 0 > 16777215) h = 31; else {
    h = (a + 11 | 0) >>> 8 << ((((a + 11 | 0) >>> 8) + 1048320 | 0) >>> 16 & 8);
    h = 14 - ((h + 520192 | 0) >>> 16 & 4 | (((a + 11 | 0) >>> 8) + 1048320 | 0) >>> 16 & 8 | ((h << ((h + 520192 | 0) >>> 16 & 4)) + 245760 | 0) >>> 16 & 2) + (h << ((h + 520192 | 0) >>> 16 & 4) << (((h << ((h + 520192 | 0) >>> 16 & 4)) + 245760 | 0) >>> 16 & 2) >>> 15) | 0;
    h = n >>> (h + 7 | 0) & 1 | h << 1;
   } else h = 0;
   b = c[7628 + (h << 2) >> 2] | 0;
   a : do if (!b) {
    d = 0 - n | 0;
    a = 0;
    b = 0;
    w = 86;
   } else {
    d = 0 - n | 0;
    a = 0;
    f = n << ((h | 0) == 31 ? 0 : 25 - (h >>> 1) | 0);
    g = b;
    b = 0;
    while (1) {
     e = c[g + 4 >> 2] & -8;
     if ((e - n | 0) >>> 0 < d >>> 0) if ((e | 0) == (n | 0)) {
      d = e - n | 0;
      a = g;
      b = g;
      w = 90;
      break a;
     } else {
      d = e - n | 0;
      b = g;
     }
     e = c[g + 20 >> 2] | 0;
     g = c[g + 16 + (f >>> 31 << 2) >> 2] | 0;
     a = (e | 0) == 0 | (e | 0) == (g | 0) ? a : e;
     e = (g | 0) == 0;
     if (e) {
      w = 86;
      break;
     } else f = f << (e & 1 ^ 1);
    }
   } while (0);
   if ((w | 0) == 86) {
    if ((a | 0) == 0 & (b | 0) == 0) {
     a = 2 << h;
     if (!((a | 0 - a) & i)) break;
     l = ((a | 0 - a) & i & 0 - ((a | 0 - a) & i)) + -1 | 0;
     m = l >>> (l >>> 12 & 16) >>> (l >>> (l >>> 12 & 16) >>> 5 & 8);
     a = m >>> (m >>> 2 & 4) >>> (m >>> (m >>> 2 & 4) >>> 1 & 2);
     a = c[7628 + ((l >>> (l >>> 12 & 16) >>> 5 & 8 | l >>> 12 & 16 | m >>> 2 & 4 | m >>> (m >>> 2 & 4) >>> 1 & 2 | a >>> 1 & 1) + (a >>> (a >>> 1 & 1)) << 2) >> 2] | 0;
    }
    if (!a) {
     i = d;
     j = b;
    } else w = 90;
   }
   if ((w | 0) == 90) while (1) {
    w = 0;
    m = (c[a + 4 >> 2] & -8) - n | 0;
    e = m >>> 0 < d >>> 0;
    d = e ? m : d;
    b = e ? a : b;
    e = c[a + 16 >> 2] | 0;
    if (e) {
     a = e;
     w = 90;
     continue;
    }
    a = c[a + 20 >> 2] | 0;
    if (!a) {
     i = d;
     j = b;
     break;
    } else w = 90;
   }
   if ((j | 0) != 0 ? i >>> 0 < ((c[1833] | 0) - n | 0) >>> 0 : 0) {
    f = c[1835] | 0;
    if (j >>> 0 < f >>> 0) la();
    h = j + n | 0;
    if (j >>> 0 >= h >>> 0) la();
    g = c[j + 24 >> 2] | 0;
    a = c[j + 12 >> 2] | 0;
    do if ((a | 0) == (j | 0)) {
     b = j + 20 | 0;
     a = c[b >> 2] | 0;
     if (!a) {
      b = j + 16 | 0;
      a = c[b >> 2] | 0;
      if (!a) {
       p = 0;
       break;
      }
     }
     while (1) {
      d = a + 20 | 0;
      e = c[d >> 2] | 0;
      if (e) {
       a = e;
       b = d;
       continue;
      }
      d = a + 16 | 0;
      e = c[d >> 2] | 0;
      if (!e) break; else {
       a = e;
       b = d;
      }
     }
     if (b >>> 0 < f >>> 0) la(); else {
      c[b >> 2] = 0;
      p = a;
      break;
     }
    } else {
     b = c[j + 8 >> 2] | 0;
     if (b >>> 0 < f >>> 0) la();
     if ((c[b + 12 >> 2] | 0) != (j | 0)) la();
     if ((c[a + 8 >> 2] | 0) == (j | 0)) {
      c[b + 12 >> 2] = a;
      c[a + 8 >> 2] = b;
      p = a;
      break;
     } else la();
    } while (0);
    do if (g) {
     a = c[j + 28 >> 2] | 0;
     if ((j | 0) == (c[7628 + (a << 2) >> 2] | 0)) {
      c[7628 + (a << 2) >> 2] = p;
      if (!p) {
       c[1832] = c[1832] & ~(1 << a);
       break;
      }
     } else {
      if (g >>> 0 < (c[1835] | 0) >>> 0) la();
      if ((c[g + 16 >> 2] | 0) == (j | 0)) c[g + 16 >> 2] = p; else c[g + 20 >> 2] = p;
      if (!p) break;
     }
     b = c[1835] | 0;
     if (p >>> 0 < b >>> 0) la();
     c[p + 24 >> 2] = g;
     a = c[j + 16 >> 2] | 0;
     do if (a) if (a >>> 0 < b >>> 0) la(); else {
      c[p + 16 >> 2] = a;
      c[a + 24 >> 2] = p;
      break;
     } while (0);
     a = c[j + 20 >> 2] | 0;
     if (a) if (a >>> 0 < (c[1835] | 0) >>> 0) la(); else {
      c[p + 20 >> 2] = a;
      c[a + 24 >> 2] = p;
      break;
     }
    } while (0);
    do if (i >>> 0 >= 16) {
     c[j + 4 >> 2] = n | 3;
     c[h + 4 >> 2] = i | 1;
     c[h + i >> 2] = i;
     b = i >>> 3;
     if (i >>> 0 < 256) {
      a = c[1831] | 0;
      if (a & 1 << b) {
       a = c[7364 + (b << 1 << 2) + 8 >> 2] | 0;
       if (a >>> 0 < (c[1835] | 0) >>> 0) la(); else {
        q = 7364 + (b << 1 << 2) + 8 | 0;
        r = a;
       }
      } else {
       c[1831] = a | 1 << b;
       q = 7364 + (b << 1 << 2) + 8 | 0;
       r = 7364 + (b << 1 << 2) | 0;
      }
      c[q >> 2] = h;
      c[r + 12 >> 2] = h;
      c[h + 8 >> 2] = r;
      c[h + 12 >> 2] = 7364 + (b << 1 << 2);
      break;
     }
     a = i >>> 8;
     if (a) if (i >>> 0 > 16777215) d = 31; else {
      d = a << ((a + 1048320 | 0) >>> 16 & 8) << (((a << ((a + 1048320 | 0) >>> 16 & 8)) + 520192 | 0) >>> 16 & 4);
      d = 14 - (((a << ((a + 1048320 | 0) >>> 16 & 8)) + 520192 | 0) >>> 16 & 4 | (a + 1048320 | 0) >>> 16 & 8 | (d + 245760 | 0) >>> 16 & 2) + (d << ((d + 245760 | 0) >>> 16 & 2) >>> 15) | 0;
      d = i >>> (d + 7 | 0) & 1 | d << 1;
     } else d = 0;
     e = 7628 + (d << 2) | 0;
     c[h + 28 >> 2] = d;
     c[h + 16 + 4 >> 2] = 0;
     c[h + 16 >> 2] = 0;
     a = c[1832] | 0;
     b = 1 << d;
     if (!(a & b)) {
      c[1832] = a | b;
      c[e >> 2] = h;
      c[h + 24 >> 2] = e;
      c[h + 12 >> 2] = h;
      c[h + 8 >> 2] = h;
      break;
     }
     d = i << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);
     e = c[e >> 2] | 0;
     while (1) {
      if ((c[e + 4 >> 2] & -8 | 0) == (i | 0)) {
       w = 148;
       break;
      }
      b = e + 16 + (d >>> 31 << 2) | 0;
      a = c[b >> 2] | 0;
      if (!a) {
       w = 145;
       break;
      } else {
       d = d << 1;
       e = a;
      }
     }
     if ((w | 0) == 145) if (b >>> 0 < (c[1835] | 0) >>> 0) la(); else {
      c[b >> 2] = h;
      c[h + 24 >> 2] = e;
      c[h + 12 >> 2] = h;
      c[h + 8 >> 2] = h;
      break;
     } else if ((w | 0) == 148) {
      a = e + 8 | 0;
      b = c[a >> 2] | 0;
      D = c[1835] | 0;
      if (b >>> 0 >= D >>> 0 & e >>> 0 >= D >>> 0) {
       c[b + 12 >> 2] = h;
       c[a >> 2] = h;
       c[h + 8 >> 2] = b;
       c[h + 12 >> 2] = e;
       c[h + 24 >> 2] = 0;
       break;
      } else la();
     }
    } else {
     D = i + n | 0;
     c[j + 4 >> 2] = D | 3;
     D = j + D + 4 | 0;
     c[D >> 2] = c[D >> 2] | 1;
    } while (0);
    D = j + 8 | 0;
    return D | 0;
   }
  }
 } else n = -1; while (0);
 d = c[1833] | 0;
 if (d >>> 0 >= n >>> 0) {
  a = d - n | 0;
  b = c[1836] | 0;
  if (a >>> 0 > 15) {
   D = b + n | 0;
   c[1836] = D;
   c[1833] = a;
   c[D + 4 >> 2] = a | 1;
   c[D + a >> 2] = a;
   c[b + 4 >> 2] = n | 3;
  } else {
   c[1833] = 0;
   c[1836] = 0;
   c[b + 4 >> 2] = d | 3;
   c[b + d + 4 >> 2] = c[b + d + 4 >> 2] | 1;
  }
  D = b + 8 | 0;
  return D | 0;
 }
 a = c[1834] | 0;
 if (a >>> 0 > n >>> 0) {
  B = a - n | 0;
  c[1834] = B;
  D = c[1837] | 0;
  C = D + n | 0;
  c[1837] = C;
  c[C + 4 >> 2] = B | 1;
  c[D + 4 >> 2] = n | 3;
  D = D + 8 | 0;
  return D | 0;
 }
 do if (!(c[1949] | 0)) {
  a = ta(30) | 0;
  if (!(a + -1 & a)) {
   c[1951] = a;
   c[1950] = a;
   c[1952] = -1;
   c[1953] = -1;
   c[1954] = 0;
   c[1942] = 0;
   c[1949] = (na(0) | 0) & -16 ^ 1431655768;
   break;
  } else la();
 } while (0);
 f = n + 48 | 0;
 d = c[1951] | 0;
 g = n + 47 | 0;
 h = d + g & 0 - d;
 if (h >>> 0 <= n >>> 0) {
  D = 0;
  return D | 0;
 }
 a = c[1941] | 0;
 if ((a | 0) != 0 ? (r = c[1939] | 0, (r + h | 0) >>> 0 <= r >>> 0 | (r + h | 0) >>> 0 > a >>> 0) : 0) {
  D = 0;
  return D | 0;
 }
 b : do if (!(c[1942] & 4)) {
  b = c[1837] | 0;
  c : do if (b) {
   e = 7772;
   while (1) {
    a = c[e >> 2] | 0;
    if (a >>> 0 <= b >>> 0 ? (o = e + 4 | 0, (a + (c[o >> 2] | 0) | 0) >>> 0 > b >>> 0) : 0) break;
    a = c[e + 8 >> 2] | 0;
    if (!a) {
     w = 173;
     break c;
    } else e = a;
   }
   a = d + g - (c[1834] | 0) & 0 - d;
   if (a >>> 0 < 2147483647) {
    b = ma(a | 0) | 0;
    if ((b | 0) == ((c[e >> 2] | 0) + (c[o >> 2] | 0) | 0)) {
     if ((b | 0) != (-1 | 0)) {
      h = b;
      g = a;
      w = 193;
      break b;
     }
    } else w = 183;
   }
  } else w = 173; while (0);
  do if ((w | 0) == 173 ? (s = ma(0) | 0, (s | 0) != (-1 | 0)) : 0) {
   a = c[1950] | 0;
   if (!(a + -1 & s)) a = h; else a = h - s + (a + -1 + s & 0 - a) | 0;
   b = c[1939] | 0;
   d = b + a | 0;
   if (a >>> 0 > n >>> 0 & a >>> 0 < 2147483647) {
    r = c[1941] | 0;
    if ((r | 0) != 0 ? d >>> 0 <= b >>> 0 | d >>> 0 > r >>> 0 : 0) break;
    b = ma(a | 0) | 0;
    if ((b | 0) == (s | 0)) {
     h = s;
     g = a;
     w = 193;
     break b;
    } else w = 183;
   }
  } while (0);
  d : do if ((w | 0) == 183) {
   d = 0 - a | 0;
   do if (f >>> 0 > a >>> 0 & (a >>> 0 < 2147483647 & (b | 0) != (-1 | 0)) ? (t = c[1951] | 0, t = g - a + t & 0 - t, t >>> 0 < 2147483647) : 0) if ((ma(t | 0) | 0) == (-1 | 0)) {
    ma(d | 0) | 0;
    break d;
   } else {
    a = t + a | 0;
    break;
   } while (0);
   if ((b | 0) != (-1 | 0)) {
    h = b;
    g = a;
    w = 193;
    break b;
   }
  } while (0);
  c[1942] = c[1942] | 4;
  w = 190;
 } else w = 190; while (0);
 if ((((w | 0) == 190 ? h >>> 0 < 2147483647 : 0) ? (u = ma(h | 0) | 0, v = ma(0) | 0, u >>> 0 < v >>> 0 & ((u | 0) != (-1 | 0) & (v | 0) != (-1 | 0))) : 0) ? (v - u | 0) >>> 0 > (n + 40 | 0) >>> 0 : 0) {
  h = u;
  g = v - u | 0;
  w = 193;
 }
 if ((w | 0) == 193) {
  a = (c[1939] | 0) + g | 0;
  c[1939] = a;
  if (a >>> 0 > (c[1940] | 0) >>> 0) c[1940] = a;
  k = c[1837] | 0;
  do if (k) {
   f = 7772;
   while (1) {
    a = c[f >> 2] | 0;
    b = f + 4 | 0;
    d = c[b >> 2] | 0;
    if ((h | 0) == (a + d | 0)) {
     w = 203;
     break;
    }
    e = c[f + 8 >> 2] | 0;
    if (!e) break; else f = e;
   }
   if (((w | 0) == 203 ? (c[f + 12 >> 2] & 8 | 0) == 0 : 0) ? k >>> 0 < h >>> 0 & k >>> 0 >= a >>> 0 : 0) {
    c[b >> 2] = d + g;
    C = (k + 8 & 7 | 0) == 0 ? 0 : 0 - (k + 8) & 7;
    D = (c[1834] | 0) + (g - C) | 0;
    c[1837] = k + C;
    c[1834] = D;
    c[k + C + 4 >> 2] = D | 1;
    c[k + C + D + 4 >> 2] = 40;
    c[1838] = c[1953];
    break;
   }
   a = c[1835] | 0;
   if (h >>> 0 < a >>> 0) {
    c[1835] = h;
    j = h;
   } else j = a;
   b = h + g | 0;
   a = 7772;
   while (1) {
    if ((c[a >> 2] | 0) == (b | 0)) {
     w = 211;
     break;
    }
    a = c[a + 8 >> 2] | 0;
    if (!a) {
     b = 7772;
     break;
    }
   }
   if ((w | 0) == 211) if (!(c[a + 12 >> 2] & 8)) {
    c[a >> 2] = h;
    m = a + 4 | 0;
    c[m >> 2] = (c[m >> 2] | 0) + g;
    m = h + 8 | 0;
    m = h + ((m & 7 | 0) == 0 ? 0 : 0 - m & 7) | 0;
    a = b + ((b + 8 & 7 | 0) == 0 ? 0 : 0 - (b + 8) & 7) | 0;
    l = m + n | 0;
    i = a - m - n | 0;
    c[m + 4 >> 2] = n | 3;
    do if ((a | 0) != (k | 0)) {
     if ((a | 0) == (c[1836] | 0)) {
      D = (c[1833] | 0) + i | 0;
      c[1833] = D;
      c[1836] = l;
      c[l + 4 >> 2] = D | 1;
      c[l + D >> 2] = D;
      break;
     }
     h = c[a + 4 >> 2] | 0;
     if ((h & 3 | 0) == 1) {
      e : do if (h >>> 0 >= 256) {
       g = c[a + 24 >> 2] | 0;
       b = c[a + 12 >> 2] | 0;
       do if ((b | 0) == (a | 0)) {
        b = c[a + 16 + 4 >> 2] | 0;
        if (!b) {
         b = c[a + 16 >> 2] | 0;
         if (!b) {
          B = 0;
          break;
         } else f = a + 16 | 0;
        } else f = a + 16 + 4 | 0;
        while (1) {
         d = b + 20 | 0;
         e = c[d >> 2] | 0;
         if (e) {
          b = e;
          f = d;
          continue;
         }
         d = b + 16 | 0;
         e = c[d >> 2] | 0;
         if (!e) break; else {
          b = e;
          f = d;
         }
        }
        if (f >>> 0 < j >>> 0) la(); else {
         c[f >> 2] = 0;
         B = b;
         break;
        }
       } else {
        d = c[a + 8 >> 2] | 0;
        if (d >>> 0 < j >>> 0) la();
        if ((c[d + 12 >> 2] | 0) != (a | 0)) la();
        if ((c[b + 8 >> 2] | 0) == (a | 0)) {
         c[d + 12 >> 2] = b;
         c[b + 8 >> 2] = d;
         B = b;
         break;
        } else la();
       } while (0);
       if (!g) break;
       b = c[a + 28 >> 2] | 0;
       do if ((a | 0) != (c[7628 + (b << 2) >> 2] | 0)) {
        if (g >>> 0 < (c[1835] | 0) >>> 0) la();
        if ((c[g + 16 >> 2] | 0) == (a | 0)) c[g + 16 >> 2] = B; else c[g + 20 >> 2] = B;
        if (!B) break e;
       } else {
        c[7628 + (b << 2) >> 2] = B;
        if (B) break;
        c[1832] = c[1832] & ~(1 << b);
        break e;
       } while (0);
       d = c[1835] | 0;
       if (B >>> 0 < d >>> 0) la();
       c[B + 24 >> 2] = g;
       b = c[a + 16 >> 2] | 0;
       do if (b) if (b >>> 0 < d >>> 0) la(); else {
        c[B + 16 >> 2] = b;
        c[b + 24 >> 2] = B;
        break;
       } while (0);
       b = c[a + 16 + 4 >> 2] | 0;
       if (!b) break;
       if (b >>> 0 < (c[1835] | 0) >>> 0) la(); else {
        c[B + 20 >> 2] = b;
        c[b + 24 >> 2] = B;
        break;
       }
      } else {
       b = c[a + 8 >> 2] | 0;
       d = c[a + 12 >> 2] | 0;
       do if ((b | 0) != (7364 + (h >>> 3 << 1 << 2) | 0)) {
        if (b >>> 0 < j >>> 0) la();
        if ((c[b + 12 >> 2] | 0) == (a | 0)) break;
        la();
       } while (0);
       if ((d | 0) == (b | 0)) {
        c[1831] = c[1831] & ~(1 << (h >>> 3));
        break;
       }
       do if ((d | 0) == (7364 + (h >>> 3 << 1 << 2) | 0)) z = d + 8 | 0; else {
        if (d >>> 0 < j >>> 0) la();
        if ((c[d + 8 >> 2] | 0) == (a | 0)) {
         z = d + 8 | 0;
         break;
        }
        la();
       } while (0);
       c[b + 12 >> 2] = d;
       c[z >> 2] = b;
      } while (0);
      a = a + (h & -8) | 0;
      f = (h & -8) + i | 0;
     } else f = i;
     b = a + 4 | 0;
     c[b >> 2] = c[b >> 2] & -2;
     c[l + 4 >> 2] = f | 1;
     c[l + f >> 2] = f;
     b = f >>> 3;
     if (f >>> 0 < 256) {
      a = c[1831] | 0;
      do if (!(a & 1 << b)) {
       c[1831] = a | 1 << b;
       C = 7364 + (b << 1 << 2) + 8 | 0;
       D = 7364 + (b << 1 << 2) | 0;
      } else {
       a = c[7364 + (b << 1 << 2) + 8 >> 2] | 0;
       if (a >>> 0 >= (c[1835] | 0) >>> 0) {
        C = 7364 + (b << 1 << 2) + 8 | 0;
        D = a;
        break;
       }
       la();
      } while (0);
      c[C >> 2] = l;
      c[D + 12 >> 2] = l;
      c[l + 8 >> 2] = D;
      c[l + 12 >> 2] = 7364 + (b << 1 << 2);
      break;
     }
     a = f >>> 8;
     do if (!a) d = 0; else {
      if (f >>> 0 > 16777215) {
       d = 31;
       break;
      }
      d = a << ((a + 1048320 | 0) >>> 16 & 8) << (((a << ((a + 1048320 | 0) >>> 16 & 8)) + 520192 | 0) >>> 16 & 4);
      d = 14 - (((a << ((a + 1048320 | 0) >>> 16 & 8)) + 520192 | 0) >>> 16 & 4 | (a + 1048320 | 0) >>> 16 & 8 | (d + 245760 | 0) >>> 16 & 2) + (d << ((d + 245760 | 0) >>> 16 & 2) >>> 15) | 0;
      d = f >>> (d + 7 | 0) & 1 | d << 1;
     } while (0);
     e = 7628 + (d << 2) | 0;
     c[l + 28 >> 2] = d;
     c[l + 16 + 4 >> 2] = 0;
     c[l + 16 >> 2] = 0;
     a = c[1832] | 0;
     b = 1 << d;
     if (!(a & b)) {
      c[1832] = a | b;
      c[e >> 2] = l;
      c[l + 24 >> 2] = e;
      c[l + 12 >> 2] = l;
      c[l + 8 >> 2] = l;
      break;
     }
     d = f << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);
     e = c[e >> 2] | 0;
     while (1) {
      if ((c[e + 4 >> 2] & -8 | 0) == (f | 0)) {
       w = 281;
       break;
      }
      b = e + 16 + (d >>> 31 << 2) | 0;
      a = c[b >> 2] | 0;
      if (!a) {
       w = 278;
       break;
      } else {
       d = d << 1;
       e = a;
      }
     }
     if ((w | 0) == 278) if (b >>> 0 < (c[1835] | 0) >>> 0) la(); else {
      c[b >> 2] = l;
      c[l + 24 >> 2] = e;
      c[l + 12 >> 2] = l;
      c[l + 8 >> 2] = l;
      break;
     } else if ((w | 0) == 281) {
      a = e + 8 | 0;
      b = c[a >> 2] | 0;
      D = c[1835] | 0;
      if (b >>> 0 >= D >>> 0 & e >>> 0 >= D >>> 0) {
       c[b + 12 >> 2] = l;
       c[a >> 2] = l;
       c[l + 8 >> 2] = b;
       c[l + 12 >> 2] = e;
       c[l + 24 >> 2] = 0;
       break;
      } else la();
     }
    } else {
     D = (c[1834] | 0) + i | 0;
     c[1834] = D;
     c[1837] = l;
     c[l + 4 >> 2] = D | 1;
    } while (0);
    D = m + 8 | 0;
    return D | 0;
   } else b = 7772;
   while (1) {
    a = c[b >> 2] | 0;
    if (a >>> 0 <= k >>> 0 ? (x = a + (c[b + 4 >> 2] | 0) | 0, x >>> 0 > k >>> 0) : 0) break;
    b = c[b + 8 >> 2] | 0;
   }
   f = x + -47 + ((x + -47 + 8 & 7 | 0) == 0 ? 0 : 0 - (x + -47 + 8) & 7) | 0;
   f = f >>> 0 < (k + 16 | 0) >>> 0 ? k : f;
   a = h + 8 | 0;
   a = (a & 7 | 0) == 0 ? 0 : 0 - a & 7;
   D = h + a | 0;
   a = g + -40 - a | 0;
   c[1837] = D;
   c[1834] = a;
   c[D + 4 >> 2] = a | 1;
   c[D + a + 4 >> 2] = 40;
   c[1838] = c[1953];
   c[f + 4 >> 2] = 27;
   c[f + 8 >> 2] = c[1943];
   c[f + 8 + 4 >> 2] = c[1944];
   c[f + 8 + 8 >> 2] = c[1945];
   c[f + 8 + 12 >> 2] = c[1946];
   c[1943] = h;
   c[1944] = g;
   c[1946] = 0;
   c[1945] = f + 8;
   a = f + 24 | 0;
   do {
    a = a + 4 | 0;
    c[a >> 2] = 7;
   } while ((a + 4 | 0) >>> 0 < x >>> 0);
   if ((f | 0) != (k | 0)) {
    c[f + 4 >> 2] = c[f + 4 >> 2] & -2;
    c[k + 4 >> 2] = f - k | 1;
    c[f >> 2] = f - k;
    if ((f - k | 0) >>> 0 < 256) {
     b = 7364 + ((f - k | 0) >>> 3 << 1 << 2) | 0;
     a = c[1831] | 0;
     if (a & 1 << ((f - k | 0) >>> 3)) {
      a = c[b + 8 >> 2] | 0;
      if (a >>> 0 < (c[1835] | 0) >>> 0) la(); else {
       y = b + 8 | 0;
       A = a;
      }
     } else {
      c[1831] = a | 1 << ((f - k | 0) >>> 3);
      y = b + 8 | 0;
      A = b;
     }
     c[y >> 2] = k;
     c[A + 12 >> 2] = k;
     c[k + 8 >> 2] = A;
     c[k + 12 >> 2] = b;
     break;
    }
    if ((f - k | 0) >>> 8) if ((f - k | 0) >>> 0 > 16777215) d = 31; else {
     d = (f - k | 0) >>> 8 << ((((f - k | 0) >>> 8) + 1048320 | 0) >>> 16 & 8);
     d = 14 - ((d + 520192 | 0) >>> 16 & 4 | (((f - k | 0) >>> 8) + 1048320 | 0) >>> 16 & 8 | ((d << ((d + 520192 | 0) >>> 16 & 4)) + 245760 | 0) >>> 16 & 2) + (d << ((d + 520192 | 0) >>> 16 & 4) << (((d << ((d + 520192 | 0) >>> 16 & 4)) + 245760 | 0) >>> 16 & 2) >>> 15) | 0;
     d = (f - k | 0) >>> (d + 7 | 0) & 1 | d << 1;
    } else d = 0;
    e = 7628 + (d << 2) | 0;
    c[k + 28 >> 2] = d;
    c[k + 20 >> 2] = 0;
    c[k + 16 >> 2] = 0;
    a = c[1832] | 0;
    b = 1 << d;
    if (!(a & b)) {
     c[1832] = a | b;
     c[e >> 2] = k;
     c[k + 24 >> 2] = e;
     c[k + 12 >> 2] = k;
     c[k + 8 >> 2] = k;
     break;
    }
    d = f - k << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);
    e = c[e >> 2] | 0;
    while (1) {
     if ((c[e + 4 >> 2] & -8 | 0) == (f - k | 0)) {
      w = 307;
      break;
     }
     b = e + 16 + (d >>> 31 << 2) | 0;
     a = c[b >> 2] | 0;
     if (!a) {
      w = 304;
      break;
     } else {
      d = d << 1;
      e = a;
     }
    }
    if ((w | 0) == 304) if (b >>> 0 < (c[1835] | 0) >>> 0) la(); else {
     c[b >> 2] = k;
     c[k + 24 >> 2] = e;
     c[k + 12 >> 2] = k;
     c[k + 8 >> 2] = k;
     break;
    } else if ((w | 0) == 307) {
     a = e + 8 | 0;
     b = c[a >> 2] | 0;
     D = c[1835] | 0;
     if (b >>> 0 >= D >>> 0 & e >>> 0 >= D >>> 0) {
      c[b + 12 >> 2] = k;
      c[a >> 2] = k;
      c[k + 8 >> 2] = b;
      c[k + 12 >> 2] = e;
      c[k + 24 >> 2] = 0;
      break;
     } else la();
    }
   }
  } else {
   D = c[1835] | 0;
   if ((D | 0) == 0 | h >>> 0 < D >>> 0) c[1835] = h;
   c[1943] = h;
   c[1944] = g;
   c[1946] = 0;
   c[1840] = c[1949];
   c[1839] = -1;
   a = 0;
   do {
    D = 7364 + (a << 1 << 2) | 0;
    c[D + 12 >> 2] = D;
    c[D + 8 >> 2] = D;
    a = a + 1 | 0;
   } while ((a | 0) != 32);
   D = h + 8 | 0;
   D = (D & 7 | 0) == 0 ? 0 : 0 - D & 7;
   C = h + D | 0;
   D = g + -40 - D | 0;
   c[1837] = C;
   c[1834] = D;
   c[C + 4 >> 2] = D | 1;
   c[C + D + 4 >> 2] = 40;
   c[1838] = c[1953];
  } while (0);
  a = c[1834] | 0;
  if (a >>> 0 > n >>> 0) {
   B = a - n | 0;
   c[1834] = B;
   D = c[1837] | 0;
   C = D + n | 0;
   c[1837] = C;
   c[C + 4 >> 2] = B | 1;
   c[D + 4 >> 2] = n | 3;
   D = D + 8 | 0;
   return D | 0;
  }
 }
 if (!0) a = 7320; else a = c[(ia() | 0) + 60 >> 2] | 0;
 c[a >> 2] = 12;
 D = 0;
 return D | 0;
}

function Wa(e, f, g, h, j, k, l, m, n) {
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 j = j | 0;
 k = k | 0;
 l = l | 0;
 m = m | 0;
 n = n | 0;
 var o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0;
 D = i;
 i = i + 1792 | 0;
 w = b[f >> 1] | 0;
 C = b[f + 2 >> 1] | 0;
 o = c[g + 4 >> 2] << 4;
 s = c[g + 8 >> 2] << 4;
 r = (w >> 2) + (k + h) | 0;
 q = (C >> 2) + (l + j) | 0;
 do switch (c[3328 + ((w & 3) << 4) + ((C & 3) << 2) >> 2] | 0) {
 case 0:
  {
   Qa(c[g >> 2] | 0, e + (l << 4) + k | 0, r, q, o, s, m, n, 16);
   o = g;
   break;
  }
 case 1:
  {
   Ra(c[g >> 2] | 0, e + (l << 4) + k | 0, r, q + -2 | 0, o, s, m, n, 0);
   o = g;
   break;
  }
 case 2:
  {
   p = c[g >> 2] | 0;
   if (((r | 0) >= 0 ? !((q | 0) < 2 | (r + m | 0) >>> 0 > o >>> 0) : 0) ? (q + 3 + n | 0) >>> 0 <= s >>> 0 : 0) {
    s = p;
    p = q + -2 | 0;
   } else {
    Qa(p, D, r, q + -2 | 0, o, s, m, n + 5 | 0, m);
    s = D;
    r = 0;
    p = 0;
    o = m;
   }
   p = s + ((Z(p, o) | 0) + r) + o | 0;
   if ((n >>> 2 | 0) != 0 ? (x = (o << 2) - m | 0, y = 0 - o | 0, z = o << 1, (m | 0) != 0) : 0) {
    u = e + (l << 4) + k | 0;
    v = n >>> 2;
    w = p;
    s = p + (o * 5 | 0) | 0;
    while (1) {
     p = u;
     q = m;
     r = w;
     t = s;
     while (1) {
      C = d[t + (y << 1) >> 0] | 0;
      F = d[t + y >> 0] | 0;
      B = d[t + o >> 0] | 0;
      G = d[t >> 0] | 0;
      A = d[r + z >> 0] | 0;
      a[p + 48 >> 0] = a[6150 + ((d[t + z >> 0] | 0) + 16 - (B + C) - (B + C << 2) + A + ((G + F | 0) * 20 | 0) >> 5) >> 0] | 0;
      E = d[r + o >> 0] | 0;
      a[p + 32 >> 0] = a[6150 + (B + 16 + ((F + C | 0) * 20 | 0) - (A + G) - (A + G << 2) + E >> 5) >> 0] | 0;
      B = d[r >> 0] | 0;
      a[p + 16 >> 0] = a[6150 + (G + 16 + ((A + C | 0) * 20 | 0) - (E + F) - (E + F << 2) + B >> 5) >> 0] | 0;
      a[p >> 0] = a[6150 + (F + 16 + ((E + A | 0) * 20 | 0) - (B + C) - (B + C << 2) + (d[r + y >> 0] | 0) >> 5) >> 0] | 0;
      q = q + -1 | 0;
      if (!q) break; else {
       p = p + 1 | 0;
       r = r + 1 | 0;
       t = t + 1 | 0;
      }
     }
     v = v + -1 | 0;
     if (!v) break; else {
      u = u + m + (64 - m) | 0;
      w = w + m + x | 0;
      s = s + m + x | 0;
     }
    }
   }
   o = g;
   break;
  }
 case 3:
  {
   Ra(c[g >> 2] | 0, e + (l << 4) + k | 0, r, q + -2 | 0, o, s, m, n, 1);
   o = g;
   break;
  }
 case 4:
  {
   Sa(c[g >> 2] | 0, e + (l << 4) + k | 0, r + -2 | 0, q, o, s, m, n, 0);
   o = g;
   break;
  }
 case 5:
  {
   Ta(c[g >> 2] | 0, e + (l << 4) + k | 0, r + -2 | 0, q + -2 | 0, o, s, m, n, 0);
   o = g;
   break;
  }
 case 6:
  {
   Va(c[g >> 2] | 0, e + (l << 4) + k | 0, r + -2 | 0, q + -2 | 0, o, s, m, n, 0);
   o = g;
   break;
  }
 case 7:
  {
   Ta(c[g >> 2] | 0, e + (l << 4) + k | 0, r + -2 | 0, q + -2 | 0, o, s, m, n, 2);
   o = g;
   break;
  }
 case 8:
  {
   p = c[g >> 2] | 0;
   if ((r | 0) >= 2 ? !((q + n | 0) >>> 0 > s >>> 0 | ((q | 0) < 0 | (r + 3 + m | 0) >>> 0 > o >>> 0)) : 0) r = r + -2 | 0; else {
    Qa(p, D, r + -2 | 0, q, o, s, m + 5 | 0, n, m + 5 | 0);
    p = D;
    r = 0;
    q = 0;
    o = m + 5 | 0;
   }
   if ((n | 0) != 0 ? (A = o - m | 0, (m >>> 2 | 0) != 0) : 0) {
    y = e + (l << 4) + k | 0;
    q = p + ((Z(q, o) | 0) + r) + 5 | 0;
    x = n;
    while (1) {
     p = y;
     r = q;
     s = d[q + -1 >> 0] | 0;
     t = d[q + -2 >> 0] | 0;
     u = d[q + -3 >> 0] | 0;
     v = d[q + -4 >> 0] | 0;
     o = d[q + -5 >> 0] | 0;
     w = m >>> 2;
     while (1) {
      G = s + v | 0;
      F = v;
      v = d[r >> 0] | 0;
      a[p >> 0] = a[6150 + (o + 16 - G + ((t + u | 0) * 20 | 0) - (G << 2) + v >> 5) >> 0] | 0;
      G = v + u | 0;
      o = u;
      u = d[r + 1 >> 0] | 0;
      a[p + 1 >> 0] = a[6150 + (F + 16 + ((s + t | 0) * 20 | 0) - G - (G << 2) + u >> 5) >> 0] | 0;
      G = u + t | 0;
      F = t;
      t = d[r + 2 >> 0] | 0;
      a[p + 2 >> 0] = a[6150 + (o + 16 + ((v + s | 0) * 20 | 0) - G - (G << 2) + t >> 5) >> 0] | 0;
      G = t + s | 0;
      o = d[r + 3 >> 0] | 0;
      a[p + 3 >> 0] = a[6150 + (F + 16 + ((u + v | 0) * 20 | 0) - G - (G << 2) + o >> 5) >> 0] | 0;
      w = w + -1 | 0;
      if (!w) break; else {
       G = s;
       p = p + 4 | 0;
       r = r + 4 | 0;
       s = o;
       o = G;
      }
     }
     x = x + -1 | 0;
     if (!x) break; else {
      y = y + (m >>> 2 << 2) + (16 - m) | 0;
      q = q + (m >>> 2 << 2) + A | 0;
     }
    }
   }
   o = g;
   break;
  }
 case 9:
  {
   Ua(c[g >> 2] | 0, e + (l << 4) + k | 0, r + -2 | 0, q + -2 | 0, o, s, m, n, 0);
   o = g;
   break;
  }
 case 10:
  {
   p = c[g >> 2] | 0;
   if (((r | 0) >= 2 ? !((q | 0) < 2 | (r + 3 + m | 0) >>> 0 > o >>> 0) : 0) ? (q + 3 + n | 0) >>> 0 <= s >>> 0 : 0) {
    s = r + -2 | 0;
    q = q + -2 | 0;
    r = n + 5 | 0;
   } else {
    Qa(p, D, r + -2 | 0, q + -2 | 0, o, s, m + 5 | 0, n + 5 | 0, m + 5 | 0);
    p = D;
    s = 0;
    q = 0;
    o = m + 5 | 0;
    r = n + 5 | 0;
   }
   if ((r | 0) != 0 ? (B = o - m | 0, (m >>> 2 | 0) != 0) : 0) {
    y = D + 448 | 0;
    x = p + ((Z(q, o) | 0) + s) + 5 | 0;
    while (1) {
     p = y;
     q = x;
     s = d[x + -1 >> 0] | 0;
     t = d[x + -2 >> 0] | 0;
     u = d[x + -3 >> 0] | 0;
     v = d[x + -4 >> 0] | 0;
     o = d[x + -5 >> 0] | 0;
     w = m >>> 2;
     while (1) {
      G = s + v | 0;
      F = v;
      v = d[q >> 0] | 0;
      c[p >> 2] = o - G + ((t + u | 0) * 20 | 0) - (G << 2) + v;
      G = v + u | 0;
      o = u;
      u = d[q + 1 >> 0] | 0;
      c[p + 4 >> 2] = ((s + t | 0) * 20 | 0) + F - G - (G << 2) + u;
      G = u + t | 0;
      F = t;
      t = d[q + 2 >> 0] | 0;
      c[p + 8 >> 2] = ((v + s | 0) * 20 | 0) + o - G - (G << 2) + t;
      G = t + s | 0;
      o = d[q + 3 >> 0] | 0;
      c[p + 12 >> 2] = ((u + v | 0) * 20 | 0) + F - G - (G << 2) + o;
      w = w + -1 | 0;
      if (!w) break; else {
       G = s;
       p = p + 16 | 0;
       q = q + 4 | 0;
       s = o;
       o = G;
      }
     }
     r = r + -1 | 0;
     if (!r) break; else {
      y = y + (m >>> 2 << 2 << 2) | 0;
      x = x + (m >>> 2 << 2) + B | 0;
     }
    }
   }
   if ((n >>> 2 | 0) != 0 ? (m | 0) != 0 : 0) {
    o = e + (l << 4) + k | 0;
    q = D + 448 + (m << 2) | 0;
    s = D + 448 + (m << 2) + (m * 5 << 2) | 0;
    v = n >>> 2;
    while (1) {
     p = o;
     r = q;
     t = s;
     u = m;
     while (1) {
      G = c[t + (0 - m << 1 << 2) >> 2] | 0;
      B = c[t + (0 - m << 2) >> 2] | 0;
      F = c[t + (m << 2) >> 2] | 0;
      A = c[t >> 2] | 0;
      E = c[r + (m << 1 << 2) >> 2] | 0;
      a[p + 48 >> 0] = a[6150 + ((c[t + (m << 1 << 2) >> 2] | 0) + 512 - (F + G) - (F + G << 2) + E + ((A + B | 0) * 20 | 0) >> 10) >> 0] | 0;
      C = c[r + (m << 2) >> 2] | 0;
      a[p + 32 >> 0] = a[6150 + (F + 512 + ((B + G | 0) * 20 | 0) - (E + A) - (E + A << 2) + C >> 10) >> 0] | 0;
      F = c[r >> 2] | 0;
      a[p + 16 >> 0] = a[6150 + (A + 512 + ((E + G | 0) * 20 | 0) - (C + B) - (C + B << 2) + F >> 10) >> 0] | 0;
      a[p >> 0] = a[6150 + (B + 512 + ((C + E | 0) * 20 | 0) - (F + G) - (F + G << 2) + (c[r + (0 - m << 2) >> 2] | 0) >> 10) >> 0] | 0;
      u = u + -1 | 0;
      if (!u) break; else {
       p = p + 1 | 0;
       r = r + 4 | 0;
       t = t + 4 | 0;
      }
     }
     v = v + -1 | 0;
     if (!v) break; else {
      o = o + m + (64 - m) | 0;
      q = q + (m << 2) + (m * 3 << 2) | 0;
      s = s + (m << 2) + (m * 3 << 2) | 0;
     }
    }
   }
   o = g;
   break;
  }
 case 11:
  {
   Ua(c[g >> 2] | 0, e + (l << 4) + k | 0, r + -2 | 0, q + -2 | 0, o, s, m, n, 1);
   o = g;
   break;
  }
 case 12:
  {
   Sa(c[g >> 2] | 0, e + (l << 4) + k | 0, r + -2 | 0, q, o, s, m, n, 1);
   o = g;
   break;
  }
 case 13:
  {
   Ta(c[g >> 2] | 0, e + (l << 4) + k | 0, r + -2 | 0, q + -2 | 0, o, s, m, n, 1);
   o = g;
   break;
  }
 case 14:
  {
   Va(c[g >> 2] | 0, e + (l << 4) + k | 0, r + -2 | 0, q + -2 | 0, o, s, m, n, 1);
   o = g;
   break;
  }
 default:
  {
   Ta(c[g >> 2] | 0, e + (l << 4) + k | 0, r + -2 | 0, q + -2 | 0, o, s, m, n, 3);
   o = g;
  }
 } while (0);
 r = c[g + 4 >> 2] | 0;
 s = c[g + 8 >> 2] | 0;
 C = b[f >> 1] | 0;
 p = (C >> 3) + ((k + h | 0) >>> 1) | 0;
 h = b[f + 2 >> 1] | 0;
 q = (h >> 3) + ((l + j | 0) >>> 1) | 0;
 o = (c[o >> 2] | 0) + (Z(r << 8, s) | 0) | 0;
 if ((C & 7 | 0) != 0 & (h & 7 | 0) != 0) {
  if (((p | 0) >= 0 ? !((q | 0) < 0 ? 1 : (p + 1 + (m >>> 1) | 0) >>> 0 > r << 3 >>> 0) : 0) ? (q + 1 + (n >>> 1) | 0) >>> 0 <= s << 3 >>> 0 : 0) {
   g = r << 3;
   r = s << 3;
  } else {
   Qa(o, D + 448 | 0, p, q, r << 3, s << 3, (m >>> 1) + 1 | 0, (n >>> 1) + 1 | 0, (m >>> 1) + 1 | 0);
   Qa(o + (Z(s << 3, r << 3) | 0) | 0, D + 448 + (Z((n >>> 1) + 1 | 0, (m >>> 1) + 1 | 0) | 0) | 0, p, q, r << 3, s << 3, (m >>> 1) + 1 | 0, (n >>> 1) + 1 | 0, (m >>> 1) + 1 | 0);
   o = D + 448 | 0;
   p = 0;
   q = 0;
   g = (m >>> 1) + 1 | 0;
   r = (n >>> 1) + 1 | 0;
  }
  s = g << 1;
  if (!((m >>> 2 | 0) == 0 | (n >>> 2 | 0) == 0)) {
   v = 0;
   do {
    t = e + 256 + (l >>> 1 << 3) + (k >>> 1) + (v << 6) | 0;
    w = o + (Z((Z(v, r) | 0) + q | 0, g) | 0) + p | 0;
    B = n >>> 2;
    while (1) {
     z = d[w + g >> 0] | 0;
     u = t;
     x = w;
     y = (Z(z, h & 7) | 0) + (Z(d[w >> 0] | 0, 8 - (h & 7) | 0) | 0) | 0;
     z = (Z(d[w + s >> 0] | 0, h & 7) | 0) + (Z(z, 8 - (h & 7) | 0) | 0) | 0;
     A = m >>> 2;
     while (1) {
      E = x + 1 | 0;
      F = d[E + g >> 0] | 0;
      G = (Z(F, h & 7) | 0) + (Z(d[E >> 0] | 0, 8 - (h & 7) | 0) | 0) | 0;
      F = (Z(d[E + s >> 0] | 0, h & 7) | 0) + (Z(F, 8 - (h & 7) | 0) | 0) | 0;
      E = ((Z(y, 8 - (C & 7) | 0) | 0) + 32 + (Z(G, C & 7) | 0) | 0) >>> 6;
      a[u + 8 >> 0] = ((Z(z, 8 - (C & 7) | 0) | 0) + 32 + (Z(F, C & 7) | 0) | 0) >>> 6;
      a[u >> 0] = E;
      x = x + 2 | 0;
      E = d[x + g >> 0] | 0;
      y = (Z(E, h & 7) | 0) + (Z(d[x >> 0] | 0, 8 - (h & 7) | 0) | 0) | 0;
      z = (Z(d[x + s >> 0] | 0, h & 7) | 0) + (Z(E, 8 - (h & 7) | 0) | 0) | 0;
      G = ((Z(G, 8 - (C & 7) | 0) | 0) + 32 + (Z(y, C & 7) | 0) | 0) >>> 6;
      a[u + 9 >> 0] = ((Z(F, 8 - (C & 7) | 0) | 0) + 32 + (Z(z, C & 7) | 0) | 0) >>> 6;
      a[u + 1 >> 0] = G;
      A = A + -1 | 0;
      if (!A) break; else u = u + 2 | 0;
     }
     B = B + -1 | 0;
     if (!B) break; else {
      t = t + (m >>> 2 << 1) + (16 - (m >>> 1)) | 0;
      w = w + (m >>> 2 << 1) + (s - (m >>> 1)) | 0;
     }
    }
    v = v + 1 | 0;
   } while ((v | 0) != 2);
  }
  i = D;
  return;
 }
 if (C & 7) {
  if ((p | 0) >= 0 ? !(((n >>> 1) + q | 0) >>> 0 > s << 3 >>> 0 | ((q | 0) < 0 ? 1 : (p + 1 + (m >>> 1) | 0) >>> 0 > r << 3 >>> 0)) : 0) {
   A = r << 3;
   x = s << 3;
  } else {
   Qa(o, D + 448 | 0, p, q, r << 3, s << 3, (m >>> 1) + 1 | 0, n >>> 1, (m >>> 1) + 1 | 0);
   Qa(o + (Z(s << 3, r << 3) | 0) | 0, D + 448 + (Z((m >>> 1) + 1 | 0, n >>> 1) | 0) | 0, p, q, r << 3, s << 3, (m >>> 1) + 1 | 0, n >>> 1, (m >>> 1) + 1 | 0);
   o = D + 448 | 0;
   p = 0;
   q = 0;
   A = (m >>> 1) + 1 | 0;
   x = n >>> 1;
  }
  y = 8 - (C & 7) | 0;
  z = (A << 1) - (m >>> 1) | 0;
  if (!((m >>> 2 | 0) == 0 | (n >>> 2 | 0) == 0)) {
   r = e + 256 + (l >>> 1 << 3) + (k >>> 1) | 0;
   t = o + (Z(q, A) | 0) + p | 0;
   w = n >>> 2;
   while (1) {
    s = r;
    u = t;
    v = m >>> 2;
    while (1) {
     G = u + 1 | 0;
     F = d[u >> 0] | 0;
     E = d[G + A >> 0] | 0;
     G = d[G >> 0] | 0;
     a[s + 8 >> 0] = (((Z(E, C & 7) | 0) + (Z(d[u + A >> 0] | 0, y) | 0) << 3) + 32 | 0) >>> 6;
     u = u + 2 | 0;
     a[s >> 0] = (((Z(G, C & 7) | 0) + (Z(F, y) | 0) << 3) + 32 | 0) >>> 6;
     F = d[u >> 0] | 0;
     a[s + 9 >> 0] = (((Z(d[u + A >> 0] | 0, C & 7) | 0) + (Z(E, y) | 0) << 3) + 32 | 0) >>> 6;
     a[s + 1 >> 0] = (((Z(F, C & 7) | 0) + (Z(G, y) | 0) << 3) + 32 | 0) >>> 6;
     v = v + -1 | 0;
     if (!v) break; else s = s + 2 | 0;
    }
    w = w + -1 | 0;
    if (!w) break; else {
     r = r + (m >>> 2 << 1) + (16 - (m >>> 1)) | 0;
     t = t + (m >>> 2 << 1) + z | 0;
    }
   }
   t = e + 256 + (l >>> 1 << 3) + (k >>> 1) + 64 | 0;
   s = o + (Z(q + x | 0, A) | 0) + p | 0;
   r = n >>> 2;
   while (1) {
    o = t;
    p = s;
    q = m >>> 2;
    while (1) {
     G = p + 1 | 0;
     F = d[p >> 0] | 0;
     E = d[G + A >> 0] | 0;
     G = d[G >> 0] | 0;
     a[o + 8 >> 0] = (((Z(E, C & 7) | 0) + (Z(d[p + A >> 0] | 0, y) | 0) << 3) + 32 | 0) >>> 6;
     p = p + 2 | 0;
     a[o >> 0] = (((Z(G, C & 7) | 0) + (Z(F, y) | 0) << 3) + 32 | 0) >>> 6;
     F = d[p >> 0] | 0;
     a[o + 9 >> 0] = (((Z(d[p + A >> 0] | 0, C & 7) | 0) + (Z(E, y) | 0) << 3) + 32 | 0) >>> 6;
     a[o + 1 >> 0] = (((Z(F, C & 7) | 0) + (Z(G, y) | 0) << 3) + 32 | 0) >>> 6;
     q = q + -1 | 0;
     if (!q) break; else o = o + 2 | 0;
    }
    r = r + -1 | 0;
    if (!r) break; else {
     t = t + (m >>> 2 << 1) + (16 - (m >>> 1)) | 0;
     s = s + (m >>> 2 << 1) + z | 0;
    }
   }
  }
  i = D;
  return;
 }
 if (!(h & 7)) {
  Qa(o, e + 256 + (l >>> 1 << 3) + (k >>> 1) | 0, p, q, r << 3, s << 3, m >>> 1, n >>> 1, 8);
  Qa(o + (Z(s << 3, r << 3) | 0) | 0, e + 256 + (l >>> 1 << 3) + (k >>> 1) + 64 | 0, p, q, r << 3, s << 3, m >>> 1, n >>> 1, 8);
  i = D;
  return;
 }
 if (((p | 0) >= 0 ? !((q | 0) < 0 ? 1 : ((m >>> 1) + p | 0) >>> 0 > r << 3 >>> 0) : 0) ? (q + 1 + (n >>> 1) | 0) >>> 0 <= s << 3 >>> 0 : 0) {
  A = r << 3;
  x = s << 3;
 } else {
  Qa(o, D + 448 | 0, p, q, r << 3, s << 3, m >>> 1, (n >>> 1) + 1 | 0, m >>> 1);
  Qa(o + (Z(s << 3, r << 3) | 0) | 0, D + 448 + (Z((n >>> 1) + 1 | 0, m >>> 1) | 0) | 0, p, q, r << 3, s << 3, m >>> 1, (n >>> 1) + 1 | 0, m >>> 1);
  o = D + 448 | 0;
  p = 0;
  q = 0;
  A = m >>> 1;
  x = (n >>> 1) + 1 | 0;
 }
 y = 8 - (h & 7) | 0;
 z = A << 1;
 if (!((m >>> 2 | 0) == 0 | (n >>> 2 | 0) == 0)) {
  r = e + 256 + (l >>> 1 << 3) + (k >>> 1) | 0;
  t = o + (Z(q, A) | 0) + p | 0;
  w = n >>> 2;
  while (1) {
   s = r;
   u = t;
   v = m >>> 2;
   while (1) {
    G = d[u + A >> 0] | 0;
    E = u + 1 | 0;
    F = d[u >> 0] | 0;
    a[s + 8 >> 0] = (((Z(G, y) | 0) + (Z(d[u + z >> 0] | 0, h & 7) | 0) << 3) + 32 | 0) >>> 6;
    a[s >> 0] = (((Z(F, y) | 0) + (Z(G, h & 7) | 0) << 3) + 32 | 0) >>> 6;
    G = d[E + A >> 0] | 0;
    F = d[E >> 0] | 0;
    a[s + 9 >> 0] = (((Z(G, y) | 0) + (Z(d[E + z >> 0] | 0, h & 7) | 0) << 3) + 32 | 0) >>> 6;
    a[s + 1 >> 0] = (((Z(F, y) | 0) + (Z(G, h & 7) | 0) << 3) + 32 | 0) >>> 6;
    v = v + -1 | 0;
    if (!v) break; else {
     s = s + 2 | 0;
     u = u + 2 | 0;
    }
   }
   w = w + -1 | 0;
   if (!w) break; else {
    r = r + (m >>> 2 << 1) + (16 - (m >>> 1)) | 0;
    t = t + (m >>> 2 << 1) + (z - (m >>> 1)) | 0;
   }
  }
  t = e + 256 + (l >>> 1 << 3) + (k >>> 1) + 64 | 0;
  s = o + (Z(q + x | 0, A) | 0) + p | 0;
  r = n >>> 2;
  while (1) {
   o = t;
   p = s;
   q = m >>> 2;
   while (1) {
    G = d[p + A >> 0] | 0;
    E = p + 1 | 0;
    F = d[p >> 0] | 0;
    a[o + 8 >> 0] = (((Z(G, y) | 0) + (Z(d[p + z >> 0] | 0, h & 7) | 0) << 3) + 32 | 0) >>> 6;
    a[o >> 0] = (((Z(F, y) | 0) + (Z(G, h & 7) | 0) << 3) + 32 | 0) >>> 6;
    G = d[E + A >> 0] | 0;
    F = d[E >> 0] | 0;
    a[o + 9 >> 0] = (((Z(G, y) | 0) + (Z(d[E + z >> 0] | 0, h & 7) | 0) << 3) + 32 | 0) >>> 6;
    a[o + 1 >> 0] = (((Z(F, y) | 0) + (Z(G, h & 7) | 0) << 3) + 32 | 0) >>> 6;
    q = q + -1 | 0;
    if (!q) break; else {
     o = o + 2 | 0;
     p = p + 2 | 0;
    }
   }
   r = r + -1 | 0;
   if (!r) break; else {
    t = t + (m >>> 2 << 1) + (16 - (m >>> 1)) | 0;
    s = s + (m >>> 2 << 1) + (z - (m >>> 1)) | 0;
   }
  }
 }
 i = D;
 return;
}

function Oa(a, b, f, g) {
 a = a | 0;
 b = b | 0;
 f = f | 0;
 g = g | 0;
 var h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0, Q = 0;
 Q = i;
 i = i + 128 | 0;
 p = c[a + 4 >> 2] | 0;
 M = c[a + 12 >> 2] << 3;
 o = c[a + 16 >> 2] | 0;
 if ((M - o | 0) > 31) {
  h = c[a + 8 >> 2] | 0;
  m = (d[p + 1 >> 0] | 0) << 16 | (d[p >> 0] | 0) << 24 | (d[p + 2 >> 0] | 0) << 8 | (d[p + 3 >> 0] | 0);
  if (h) m = (d[p + 4 >> 0] | 0) >>> (8 - h | 0) | m << h;
 } else if ((M - o | 0) > 0) {
  h = c[a + 8 >> 2] | 0;
  m = (d[p >> 0] | 0) << h + 24;
  if ((M - o + -8 + h | 0) > 0) {
   q = M - o + -8 + h | 0;
   h = h + 24 | 0;
   while (1) {
    p = p + 1 | 0;
    h = h + -8 | 0;
    m = (d[p >> 0] | 0) << h | m;
    if ((q | 0) <= 8) break; else q = q + -8 | 0;
   }
  }
 } else m = 0;
 h = m >>> 16;
 do if (f >>> 0 < 2) if ((m | 0) >= 0) {
  if (m >>> 0 > 201326591) {
   r = e[3504 + (m >>> 26 << 1) >> 1] | 0;
   t = 31;
   break;
  }
  if (m >>> 0 > 16777215) {
   r = e[3568 + (m >>> 22 << 1) >> 1] | 0;
   t = 31;
   break;
  }
  if (m >>> 0 > 2097151) {
   r = e[3664 + ((m >>> 18) + -8 << 1) >> 1] | 0;
   t = 31;
   break;
  } else {
   r = e[3776 + (h << 1) >> 1] | 0;
   t = 31;
   break;
  }
 } else s = 1; else if (f >>> 0 < 4) {
  if ((m | 0) < 0) {
   s = (h & 16384 | 0) != 0 ? 2 : 2082;
   break;
  }
  if (m >>> 0 > 268435455) {
   r = e[3840 + (m >>> 26 << 1) >> 1] | 0;
   t = 31;
   break;
  }
  if (m >>> 0 > 33554431) {
   r = e[3904 + (m >>> 23 << 1) >> 1] | 0;
   t = 31;
   break;
  } else {
   r = e[3968 + (m >>> 18 << 1) >> 1] | 0;
   t = 31;
   break;
  }
 } else {
  if (f >>> 0 < 8) {
   h = m >>> 26;
   if ((h + -8 | 0) >>> 0 < 56) {
    r = e[4224 + (h << 1) >> 1] | 0;
    t = 31;
    break;
   }
   r = e[4352 + (m >>> 22 << 1) >> 1] | 0;
   t = 31;
   break;
  }
  if (f >>> 0 < 17) {
   r = e[4608 + (m >>> 26 << 1) >> 1] | 0;
   t = 31;
   break;
  }
  h = m >>> 29;
  if (h) {
   r = e[4736 + (h << 1) >> 1] | 0;
   t = 31;
   break;
  }
  r = e[4752 + (m >>> 24 << 1) >> 1] | 0;
  t = 31;
  break;
 } while (0);
 if ((t | 0) == 31) if (!r) {
  a = 1;
  i = Q;
  return a | 0;
 } else s = r;
 r = s & 31;
 h = m << r;
 K = s >>> 11 & 31;
 if (K >>> 0 > g >>> 0) {
  a = 1;
  i = Q;
  return a | 0;
 }
 w = s >>> 5 & 63;
 do if (K) {
  if (!w) {
   p = 32 - r | 0;
   m = 0;
  } else {
   do if ((32 - r | 0) >>> 0 < w >>> 0) {
    c[a + 16 >> 2] = o + r;
    f = o + s & 7;
    c[a + 8 >> 2] = f;
    if (M >>> 0 < (o + r | 0) >>> 0) {
     a = 1;
     i = Q;
     return a | 0;
    }
    p = (c[a >> 2] | 0) + ((o + r | 0) >>> 3) | 0;
    c[a + 4 >> 2] = p;
    if ((M - (o + r) | 0) > 31) {
     h = (d[p + 1 >> 0] | 0) << 16 | (d[p >> 0] | 0) << 24 | (d[p + 2 >> 0] | 0) << 8 | (d[p + 3 >> 0] | 0);
     if (!f) {
      o = o + r | 0;
      r = 32;
      q = h;
      break;
     }
     o = o + r | 0;
     r = 32;
     q = (d[p + 4 >> 0] | 0) >>> (8 - f | 0) | h << f;
     break;
    }
    if ((M - (o + r) | 0) > 0) {
     h = (d[p >> 0] | 0) << (f | 24);
     if ((M - (o + r) + -8 + f | 0) > 0) {
      q = M - (o + r) + -8 + f | 0;
      m = h;
      h = f | 24;
      while (1) {
       p = p + 1 | 0;
       h = h + -8 | 0;
       m = (d[p >> 0] | 0) << h | m;
       if ((q | 0) <= 8) {
        o = o + r | 0;
        r = 32;
        q = m;
        break;
       } else q = q + -8 | 0;
      }
     } else {
      o = o + r | 0;
      r = 32;
      q = h;
     }
    } else {
     o = o + r | 0;
     r = 32;
     q = 0;
    }
   } else {
    r = 32 - r | 0;
    q = h;
   } while (0);
   h = q >>> (32 - w | 0);
   f = 0;
   m = 1 << w + -1;
   do {
    c[Q + 64 + (f << 2) >> 2] = (m & h | 0) != 0 ? -1 : 1;
    m = m >>> 1;
    f = f + 1 | 0;
   } while ((m | 0) != 0);
   p = r - w | 0;
   h = q << w;
   m = f;
  }
  a : do if (m >>> 0 < K >>> 0) {
   q = h;
   v = m;
   u = K >>> 0 > 10 & w >>> 0 < 3 & 1;
   b : while (1) {
    do if (p >>> 0 < 16) {
     q = o + (32 - p) | 0;
     c[a + 16 >> 2] = q;
     c[a + 8 >> 2] = q & 7;
     if (M >>> 0 < q >>> 0) {
      L = 1;
      t = 158;
      break b;
     }
     m = (c[a >> 2] | 0) + (q >>> 3) | 0;
     c[a + 4 >> 2] = m;
     if ((M - q | 0) > 31) {
      h = (d[m + 1 >> 0] | 0) << 16 | (d[m >> 0] | 0) << 24 | (d[m + 2 >> 0] | 0) << 8 | (d[m + 3 >> 0] | 0);
      if (!(q & 7)) {
       o = q;
       s = 32;
       r = h;
       break;
      }
      o = q;
      s = 32;
      r = (d[m + 4 >> 0] | 0) >>> (8 - (q & 7) | 0) | h << (q & 7);
      break;
     }
     if ((M - q | 0) <= 0) {
      L = 1;
      t = 158;
      break b;
     }
     h = (d[m >> 0] | 0) << (q & 7 | 24);
     if ((M - q + -8 + (q & 7) | 0) > 0) {
      p = M - q + -8 + (q & 7) | 0;
      o = q & 7 | 24;
      while (1) {
       m = m + 1 | 0;
       o = o + -8 | 0;
       h = (d[m >> 0] | 0) << o | h;
       if ((p | 0) <= 8) {
        o = q;
        s = 32;
        r = h;
        break;
       } else p = p + -8 | 0;
      }
     } else {
      o = q;
      s = 32;
      r = h;
     }
    } else {
     s = p;
     r = q;
    } while (0);
    do if ((r | 0) >= 0) if (r >>> 0 <= 1073741823) if (r >>> 0 <= 536870911) if (r >>> 0 <= 268435455) if (r >>> 0 <= 134217727) if (r >>> 0 <= 67108863) if (r >>> 0 <= 33554431) if (r >>> 0 <= 16777215) if (r >>> 0 > 8388607) {
     J = 8;
     t = 75;
    } else {
     if (r >>> 0 > 4194303) {
      J = 9;
      t = 75;
      break;
     }
     if (r >>> 0 > 2097151) {
      J = 10;
      t = 75;
      break;
     }
     if (r >>> 0 > 1048575) {
      J = 11;
      t = 75;
      break;
     }
     if (r >>> 0 > 524287) {
      J = 12;
      t = 75;
      break;
     }
     if (r >>> 0 > 262143) {
      J = 13;
      t = 75;
      break;
     }
     if (r >>> 0 > 131071) {
      h = s + -15 | 0;
      p = r << 15;
      m = 14;
      q = u;
      f = (u | 0) != 0 ? u : 4;
     } else {
      if (r >>> 0 < 65536) {
       L = 1;
       t = 158;
       break b;
      }
      h = s + -16 | 0;
      p = r << 16;
      m = 15;
      q = (u | 0) != 0 ? u : 1;
      f = 12;
     }
     I = h;
     G = m << q;
     H = (q | 0) == 0;
     F = p;
     E = q;
     D = f;
     t = 76;
    } else {
     J = 7;
     t = 75;
    } else {
     J = 6;
     t = 75;
    } else {
     J = 5;
     t = 75;
    } else {
     J = 4;
     t = 75;
    } else {
     J = 3;
     t = 75;
    } else {
     J = 2;
     t = 75;
    } else {
     J = 1;
     t = 75;
    } else {
     J = 0;
     t = 75;
    } while (0);
    if ((t | 0) == 75) {
     t = 0;
     h = J + 1 | 0;
     p = r << h;
     h = s - h | 0;
     m = J << u;
     if (!u) {
      C = 1;
      B = o;
      z = h;
      A = p;
      x = m;
      y = 0;
     } else {
      I = h;
      G = m;
      H = 0;
      F = p;
      E = u;
      D = u;
      t = 76;
     }
    }
    if ((t | 0) == 76) {
     do if (I >>> 0 < D >>> 0) {
      q = o + (32 - I) | 0;
      c[a + 16 >> 2] = q;
      c[a + 8 >> 2] = q & 7;
      if (M >>> 0 < q >>> 0) {
       L = 1;
       t = 158;
       break b;
      }
      m = (c[a >> 2] | 0) + (q >>> 3) | 0;
      c[a + 4 >> 2] = m;
      if ((M - q | 0) > 31) {
       h = (d[m + 1 >> 0] | 0) << 16 | (d[m >> 0] | 0) << 24 | (d[m + 2 >> 0] | 0) << 8 | (d[m + 3 >> 0] | 0);
       if (!(q & 7)) {
        o = q;
        p = 32;
        break;
       }
       o = q;
       p = 32;
       h = (d[m + 4 >> 0] | 0) >>> (8 - (q & 7) | 0) | h << (q & 7);
       break;
      }
      if ((M - q | 0) > 0) {
       h = (d[m >> 0] | 0) << (q & 7 | 24);
       if ((M - q + -8 + (q & 7) | 0) > 0) {
        p = M - q + -8 + (q & 7) | 0;
        o = q & 7 | 24;
        while (1) {
         m = m + 1 | 0;
         o = o + -8 | 0;
         h = (d[m >> 0] | 0) << o | h;
         if ((p | 0) <= 8) {
          o = q;
          p = 32;
          break;
         } else p = p + -8 | 0;
        }
       } else {
        o = q;
        p = 32;
       }
      } else {
       o = q;
       p = 32;
       h = 0;
      }
     } else {
      p = I;
      h = F;
     } while (0);
     C = H;
     B = o;
     z = p - D | 0;
     A = h << D;
     x = (h >>> (32 - D | 0)) + G | 0;
     y = E;
    }
    h = w >>> 0 < 3 & (v | 0) == (w | 0) ? x + 2 | 0 : x;
    m = C ? 1 : y;
    c[Q + 64 + (v << 2) >> 2] = (h & 1 | 0) == 0 ? (h + 2 | 0) >>> 1 : 0 - ((h + 2 | 0) >>> 1) | 0;
    v = v + 1 | 0;
    if (v >>> 0 >= K >>> 0) {
     n = B;
     l = z;
     k = A;
     break a;
    } else {
     o = B;
     p = z;
     q = A;
     u = ((m >>> 0 < 6 ? ((h + 2 | 0) >>> 1 | 0) > (3 << m + -1 | 0) : 0) & 1) + m | 0;
    }
   }
   if ((t | 0) == 158) {
    i = Q;
    return L | 0;
   }
  } else {
   n = o;
   l = p;
   k = h;
  } while (0);
  if (K >>> 0 < g >>> 0) {
   do if (l >>> 0 < 9) {
    o = n + (32 - l) | 0;
    c[a + 16 >> 2] = o;
    c[a + 8 >> 2] = o & 7;
    if (M >>> 0 < o >>> 0) {
     a = 1;
     i = Q;
     return a | 0;
    }
    k = (c[a >> 2] | 0) + (o >>> 3) | 0;
    c[a + 4 >> 2] = k;
    if ((M - o | 0) > 31) {
     h = (d[k + 1 >> 0] | 0) << 16 | (d[k >> 0] | 0) << 24 | (d[k + 2 >> 0] | 0) << 8 | (d[k + 3 >> 0] | 0);
     if (!(o & 7)) {
      n = o;
      l = 32;
      k = h;
      break;
     }
     n = o;
     l = 32;
     k = (d[k + 4 >> 0] | 0) >>> (8 - (o & 7) | 0) | h << (o & 7);
     break;
    }
    if ((M - o | 0) > 0) {
     h = (d[k >> 0] | 0) << (o & 7 | 24);
     if ((M - o + -8 + (o & 7) | 0) > 0) {
      m = M - o + -8 + (o & 7) | 0;
      l = o & 7 | 24;
      while (1) {
       k = k + 1 | 0;
       l = l + -8 | 0;
       h = (d[k >> 0] | 0) << l | h;
       if ((m | 0) <= 8) {
        n = o;
        l = 32;
        k = h;
        break;
       } else m = m + -8 | 0;
      }
     } else {
      n = o;
      l = 32;
      k = h;
     }
    } else {
     n = o;
     l = 32;
     k = 0;
    }
   } while (0);
   h = k >>> 23;
   c : do if ((g | 0) == 4) if ((k | 0) >= 0) if ((K | 0) != 3) if (k >>> 0 <= 1073741823) if ((K | 0) == 2) h = 34; else h = k >>> 0 > 536870911 ? 35 : 51; else h = 18; else h = 17; else h = 1; else {
    do switch (K | 0) {
    case 1:
     {
      if (k >>> 0 > 268435455) h = d[5016 + (k >>> 27) >> 0] | 0; else h = d[5048 + h >> 0] | 0;
      break;
     }
    case 2:
     {
      h = d[5080 + (k >>> 26) >> 0] | 0;
      break;
     }
    case 3:
     {
      h = d[5144 + (k >>> 26) >> 0] | 0;
      break;
     }
    case 4:
     {
      h = d[5208 + (k >>> 27) >> 0] | 0;
      break;
     }
    case 5:
     {
      h = d[5240 + (k >>> 27) >> 0] | 0;
      break;
     }
    case 6:
     {
      h = d[5272 + (k >>> 26) >> 0] | 0;
      break;
     }
    case 7:
     {
      h = d[5336 + (k >>> 26) >> 0] | 0;
      break;
     }
    case 8:
     {
      h = d[5400 + (k >>> 26) >> 0] | 0;
      break;
     }
    case 9:
     {
      h = d[5464 + (k >>> 26) >> 0] | 0;
      break;
     }
    case 10:
     {
      h = d[5528 + (k >>> 27) >> 0] | 0;
      break;
     }
    case 11:
     {
      h = d[5560 + (k >>> 28) >> 0] | 0;
      break;
     }
    case 12:
     {
      h = d[5576 + (k >>> 28) >> 0] | 0;
      break;
     }
    case 13:
     {
      h = d[5592 + (k >>> 29) >> 0] | 0;
      break;
     }
    case 14:
     {
      h = d[5600 + (k >>> 30) >> 0] | 0;
      break;
     }
    default:
     {
      h = k >> 31 & 16 | 1;
      break c;
     }
    } while (0);
    if (!h) {
     a = 1;
     i = Q;
     return a | 0;
    }
   } while (0);
   m = h & 15;
   l = l - m | 0;
   k = k << m;
   m = h >>> 4 & 15;
  } else m = 0;
  if (!(K + -1 | 0)) {
   c[b + (m << 2) >> 2] = c[Q + 64 >> 2];
   N = l;
   O = 1 << m;
   break;
  }
  h = k;
  q = 0;
  p = m;
  d : while (1) {
   if (!p) {
    c[Q + (q << 2) >> 2] = 1;
    k = n;
    P = l;
    j = 0;
   } else {
    do if (l >>> 0 < 11) {
     o = n + (32 - l) | 0;
     c[a + 16 >> 2] = o;
     c[a + 8 >> 2] = o & 7;
     if (M >>> 0 < o >>> 0) {
      L = 1;
      t = 158;
      break d;
     }
     m = (c[a >> 2] | 0) + (o >>> 3) | 0;
     c[a + 4 >> 2] = m;
     if ((M - o | 0) > 31) {
      h = (d[m + 1 >> 0] | 0) << 16 | (d[m >> 0] | 0) << 24 | (d[m + 2 >> 0] | 0) << 8 | (d[m + 3 >> 0] | 0);
      if (!(o & 7)) {
       k = o;
       l = 32;
       m = h;
       break;
      }
      k = o;
      l = 32;
      m = (d[m + 4 >> 0] | 0) >>> (8 - (o & 7) | 0) | h << (o & 7);
      break;
     }
     if ((M - o | 0) > 0) {
      h = (d[m >> 0] | 0) << (o & 7 | 24);
      if ((M - o + -8 + (o & 7) | 0) > 0) {
       n = M - o + -8 + (o & 7) | 0;
       k = m;
       l = o & 7 | 24;
       while (1) {
        k = k + 1 | 0;
        l = l + -8 | 0;
        h = (d[k >> 0] | 0) << l | h;
        if ((n | 0) <= 8) {
         k = o;
         l = 32;
         m = h;
         break;
        } else n = n + -8 | 0;
       }
      } else {
       k = o;
       l = 32;
       m = h;
      }
     } else {
      k = o;
      l = 32;
      m = 0;
     }
    } else {
     k = n;
     m = h;
    } while (0);
    switch (p | 0) {
    case 1:
     {
      h = d[5604 + (m >>> 31) >> 0] | 0;
      break;
     }
    case 2:
     {
      h = d[5606 + (m >>> 30) >> 0] | 0;
      break;
     }
    case 3:
     {
      h = d[5610 + (m >>> 30) >> 0] | 0;
      break;
     }
    case 4:
     {
      h = d[5614 + (m >>> 29) >> 0] | 0;
      break;
     }
    case 5:
     {
      h = d[5622 + (m >>> 29) >> 0] | 0;
      break;
     }
    case 6:
     {
      h = d[5630 + (m >>> 29) >> 0] | 0;
      break;
     }
    default:
     {
      do if (m >>> 0 <= 536870911) if (m >>> 0 <= 268435455) if (m >>> 0 <= 134217727) if (m >>> 0 <= 67108863) if (m >>> 0 > 33554431) h = 167; else {
       if (m >>> 0 > 16777215) {
        h = 184;
        break;
       }
       if (m >>> 0 > 8388607) {
        h = 201;
        break;
       }
       if (m >>> 0 > 4194303) {
        h = 218;
        break;
       }
       h = m >>> 0 < 2097152 ? 0 : 235;
      } else h = 150; else h = 133; else h = 116; else h = m >>> 29 << 4 ^ 115; while (0);
      if ((h >>> 4 & 15) >>> 0 > p >>> 0) {
       L = 1;
       t = 158;
       break d;
      }
     }
    }
    if (!h) {
     L = 1;
     t = 158;
     break;
    }
    g = h & 15;
    j = h >>> 4 & 15;
    c[Q + (q << 2) >> 2] = j + 1;
    P = l - g | 0;
    h = m << g;
    j = p - j | 0;
   }
   q = q + 1 | 0;
   if (q >>> 0 >= (K + -1 | 0) >>> 0) {
    t = 154;
    break;
   } else {
    n = k;
    l = P;
    p = j;
   }
  }
  if ((t | 0) == 154) {
   c[b + (j << 2) >> 2] = c[Q + 64 + (K + -1 << 2) >> 2];
   k = K + -2 | 0;
   h = 1 << j;
   while (1) {
    j = (c[Q + (k << 2) >> 2] | 0) + j | 0;
    h = 1 << j | h;
    c[b + (j << 2) >> 2] = c[Q + 64 + (k << 2) >> 2];
    if (!k) {
     N = P;
     O = h;
     break;
    } else k = k + -1 | 0;
   }
  } else if ((t | 0) == 158) {
   i = Q;
   return L | 0;
  }
 } else {
  N = 32 - r | 0;
  O = 0;
 } while (0);
 h = (c[a + 16 >> 2] | 0) + (32 - N) | 0;
 c[a + 16 >> 2] = h;
 c[a + 8 >> 2] = h & 7;
 if (h >>> 0 > c[a + 12 >> 2] << 3 >>> 0) {
  a = 1;
  i = Q;
  return a | 0;
 }
 c[a + 4 >> 2] = (c[a >> 2] | 0) + (h >>> 3);
 a = O << 16 | K << 4;
 i = Q;
 return a | 0;
}
function gb(b, e, f, g, h, j) {
 b = b | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 j = j | 0;
 var k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0, K = 0, L = 0, M = 0, N = 0, O = 0, P = 0;
 P = i;
 i = i + 480 | 0;
 N = c[e + 4 >> 2] | 0;
 k = c[e + 8 >> 2] | 0;
 M = (Z(N, f) | 0) + g | 0;
 O = Z(k, N) | 0;
 n = c[e >> 2] | 0;
 c[e + 12 >> 2] = n + (((M >>> 0) % (N >>> 0) | 0) << 4) + (M - ((M >>> 0) % (N >>> 0) | 0) << 8);
 M = n + (O << 8) + (M - ((M >>> 0) % (N >>> 0) | 0) << 6) + (((M >>> 0) % (N >>> 0) | 0) << 3) | 0;
 c[e + 16 >> 2] = M;
 c[e + 20 >> 2] = M + (O << 6);
 n = n + (Z(f << 8, N) | 0) + (g << 4) | 0;
 c[b + 20 >> 2] = 40;
 c[b + 8 >> 2] = 0;
 c[b >> 2] = 6;
 c[b + 12 >> 2] = 0;
 c[b + 16 >> 2] = 0;
 c[b + 24 >> 2] = 0;
 a : do switch (h | 0) {
 case 2:
 case 7:
  {
   xb(P + 96 | 0, 0, 384) | 0;
   break;
  }
 default:
  {
   c[P + 24 >> 2] = 0;
   c[P + 4 >> 2] = N;
   c[P + 8 >> 2] = k;
   c[P >> 2] = j;
   if (!j) {
    xb(P + 96 | 0, 0, 384) | 0;
    break a;
   }
   Wa(P + 96 | 0, P + 24 | 0, P, g << 4, f << 4, 0, 0, 16, 16);
   $a(e, P + 96 | 0);
   i = P;
   return;
  }
 } while (0);
 j = P + 32 | 0;
 h = j + 64 | 0;
 do {
  c[j >> 2] = 0;
  j = j + 4 | 0;
 } while ((j | 0) < (h | 0));
 if ((f | 0) != 0 ? (c[b + ((0 - N | 0) * 216 | 0) + 196 >> 2] | 0) != 0 : 0) {
  z = n + (0 - (N << 4)) + 1 + 1 | 0;
  w = (d[n + (0 - (N << 4)) + 1 >> 0] | 0) + (d[n + (0 - (N << 4)) >> 0] | 0) + (d[z >> 0] | 0) + (d[z + 1 >> 0] | 0) | 0;
  A = z + 1 + 1 + 1 + 1 + 1 | 0;
  z = (d[z + 1 + 1 + 1 >> 0] | 0) + (d[z + 1 + 1 >> 0] | 0) + (d[z + 1 + 1 + 1 + 1 >> 0] | 0) + (d[A >> 0] | 0) | 0;
  C = A + 1 + 1 + 1 + 1 + 1 | 0;
  A = (d[A + 1 + 1 >> 0] | 0) + (d[A + 1 >> 0] | 0) + (d[A + 1 + 1 + 1 >> 0] | 0) + (d[A + 1 + 1 + 1 + 1 >> 0] | 0) | 0;
  C = (d[C + 1 >> 0] | 0) + (d[C >> 0] | 0) + (d[C + 1 + 1 >> 0] | 0) + (d[C + 1 + 1 + 1 >> 0] | 0) | 0;
  c[P + 32 >> 2] = A + (z + w) + C;
  c[P + 32 + 4 >> 2] = z + w - A - C;
  j = A + (z + w) + C | 0;
  h = z + w - A - C | 0;
  y = 1;
 } else {
  j = 0;
  h = 0;
  w = 0;
  z = 0;
  A = 0;
  C = 0;
  y = 0;
 }
 if ((k + -1 | 0) != (f | 0) ? (c[b + (N * 216 | 0) + 196 >> 2] | 0) != 0 : 0) {
  B = n + (N << 8) + 1 + 1 + 1 | 0;
  u = (d[n + (N << 8) + 1 >> 0] | 0) + (d[n + (N << 8) >> 0] | 0) + (d[n + (N << 8) + 1 + 1 >> 0] | 0) + (d[B >> 0] | 0) | 0;
  x = B + 1 + 1 + 1 + 1 + 1 | 0;
  B = (d[B + 1 + 1 >> 0] | 0) + (d[B + 1 >> 0] | 0) + (d[B + 1 + 1 + 1 >> 0] | 0) + (d[B + 1 + 1 + 1 + 1 >> 0] | 0) | 0;
  D = (d[x + 1 >> 0] | 0) + (d[x >> 0] | 0) + (d[x + 1 + 1 >> 0] | 0) + (d[x + 1 + 1 + 1 >> 0] | 0) | 0;
  E = x + 1 + 1 + 1 + 1 + 1 | 0;
  E = (d[E >> 0] | 0) + (d[x + 1 + 1 + 1 + 1 >> 0] | 0) + (d[E + 1 >> 0] | 0) + (d[E + 1 + 1 >> 0] | 0) | 0;
  j = D + (B + u) + j + E | 0;
  c[P + 32 >> 2] = j;
  h = B + u - D - E + h | 0;
  c[P + 32 + 4 >> 2] = h;
  x = 1;
  s = y + 1 | 0;
 } else {
  x = 0;
  u = 0;
  B = 0;
  D = 0;
  E = 0;
  s = y;
 }
 if ((g | 0) != 0 ? (c[b + -20 >> 2] | 0) != 0 : 0) {
  v = (d[n + -1 + (N << 4) >> 0] | 0) + (d[n + -1 >> 0] | 0) + (d[n + -1 + (N << 5) >> 0] | 0) + (d[n + -1 + (N * 48 | 0) >> 0] | 0) | 0;
  I = n + -1 + (N << 6) | 0;
  F = (d[I + (N << 4) >> 0] | 0) + (d[I >> 0] | 0) + (d[I + (N << 5) >> 0] | 0) + (d[I + (N * 48 | 0) >> 0] | 0) | 0;
  G = (d[I + (N << 6) + (N << 4) >> 0] | 0) + (d[I + (N << 6) >> 0] | 0) + (d[I + (N << 6) + (N << 5) >> 0] | 0) + (d[I + (N << 6) + (N * 48 | 0) >> 0] | 0) | 0;
  I = I + (N << 6) + (N << 6) | 0;
  I = (d[I + (N << 4) >> 0] | 0) + (d[I >> 0] | 0) + (d[I + (N << 5) >> 0] | 0) + (d[I + (N * 48 | 0) >> 0] | 0) | 0;
  j = G + (F + v) + j + I | 0;
  c[P + 32 >> 2] = j;
  c[P + 32 + 16 >> 2] = F + v - G - I;
  l = F + v - G - I | 0;
  m = s + 1 | 0;
  t = 1;
 } else {
  l = 0;
  m = s;
  v = 0;
  F = 0;
  G = 0;
  I = 0;
  t = 0;
 }
 do if ((N + -1 | 0) != (g | 0) ? (c[b + 412 >> 2] | 0) != 0 : 0) {
  q = (d[n + 16 + (N << 4) >> 0] | 0) + (d[n + 16 >> 0] | 0) + (d[n + 16 + (N << 5) >> 0] | 0) + (d[n + 16 + (N * 48 | 0) >> 0] | 0) | 0;
  p = n + 16 + (N << 6) | 0;
  n = (d[p + (N << 4) >> 0] | 0) + (d[p >> 0] | 0) + (d[p + (N << 5) >> 0] | 0) + (d[p + (N * 48 | 0) >> 0] | 0) | 0;
  o = (d[p + (N << 6) + (N << 4) >> 0] | 0) + (d[p + (N << 6) >> 0] | 0) + (d[p + (N << 6) + (N << 5) >> 0] | 0) + (d[p + (N << 6) + (N * 48 | 0) >> 0] | 0) | 0;
  p = p + (N << 6) + (N << 6) | 0;
  p = (d[p + (N << 4) >> 0] | 0) + (d[p >> 0] | 0) + (d[p + (N << 5) >> 0] | 0) + (d[p + (N * 48 | 0) >> 0] | 0) | 0;
  r = m + 1 | 0;
  k = t + 1 | 0;
  j = o + (n + q) + j + p | 0;
  c[P + 32 >> 2] = j;
  l = n + q - o - p + l | 0;
  c[P + 32 + 16 >> 2] = l;
  b = (s | 0) == 0;
  m = (t | 0) != 0;
  if (!(b & m)) {
   if (!b) {
    b = m;
    n = 1;
    m = r;
    r = 21;
    break;
   }
  } else c[P + 32 + 4 >> 2] = G + I + F + v - q - n - o - p >> 5;
  p = P + 32 + 16 | 0;
  o = m;
  m = (y | 0) != 0;
  n = (x | 0) != 0;
  b = 1;
  h = r;
  r = 27;
 } else r = 17; while (0);
 if ((r | 0) == 17) {
  k = (t | 0) != 0;
  if (!s) {
   o = k;
   q = 0;
   h = m;
   k = t;
   r = 23;
  } else {
   b = k;
   n = 0;
   k = t;
   r = 21;
  }
 }
 if ((r | 0) == 21) {
  c[P + 32 + 4 >> 2] = h >> s + 3;
  o = b;
  q = n;
  h = m;
  r = 23;
 }
 do if ((r | 0) == 23) {
  b = (k | 0) == 0;
  m = (y | 0) != 0;
  n = (x | 0) != 0;
  if (n & (m & b)) {
   c[P + 32 + 16 >> 2] = A + C + z + w - E - D - B - u >> 5;
   m = 1;
   M = 1;
   L = q;
   break;
  }
  if (b) {
   M = n;
   L = q;
  } else {
   p = P + 32 + 16 | 0;
   b = q;
   r = 27;
  }
 } while (0);
 if ((r | 0) == 27) {
  c[p >> 2] = l >> k + 3;
  M = n;
  L = b;
 }
 switch (h | 0) {
 case 1:
  {
   k = j >> 4;
   c[P + 32 >> 2] = k;
   break;
  }
 case 2:
  {
   k = j >> 5;
   c[P + 32 >> 2] = k;
   break;
  }
 case 3:
  {
   k = j * 21 >> 10;
   c[P + 32 >> 2] = k;
   break;
  }
 default:
  {
   k = j >> 6;
   c[P + 32 >> 2] = k;
  }
 }
 J = P + 32 + 4 | 0;
 j = c[J >> 2] | 0;
 K = P + 32 + 16 | 0;
 h = c[K >> 2] | 0;
 if (!(h | j)) {
  c[P + 32 + 60 >> 2] = k;
  c[P + 32 + 56 >> 2] = k;
  c[P + 32 + 52 >> 2] = k;
  c[P + 32 + 48 >> 2] = k;
  c[P + 32 + 44 >> 2] = k;
  c[P + 32 + 40 >> 2] = k;
  c[P + 32 + 36 >> 2] = k;
  c[P + 32 + 32 >> 2] = k;
  c[P + 32 + 28 >> 2] = k;
  c[P + 32 + 24 >> 2] = k;
  c[P + 32 + 20 >> 2] = k;
  c[K >> 2] = k;
  c[P + 32 + 12 >> 2] = k;
  c[P + 32 + 8 >> 2] = k;
  c[J >> 2] = k;
  h = 0;
  k = P + 96 | 0;
  b = P + 32 | 0;
 } else {
  y = j + k | 0;
  H = (j >> 1) + k | 0;
  b = k - (j >> 1) | 0;
  k = k - j | 0;
  c[P + 32 >> 2] = y + h;
  c[K >> 2] = (h >> 1) + y;
  c[P + 32 + 32 >> 2] = y - (h >> 1);
  c[P + 32 + 48 >> 2] = y - h;
  c[J >> 2] = H + h;
  c[P + 32 + 20 >> 2] = H + (h >> 1);
  c[P + 32 + 36 >> 2] = H - (h >> 1);
  c[P + 32 + 52 >> 2] = H - h;
  c[P + 32 + 8 >> 2] = b + h;
  c[P + 32 + 24 >> 2] = b + (h >> 1);
  c[P + 32 + 40 >> 2] = b - (h >> 1);
  c[P + 32 + 56 >> 2] = b - h;
  c[P + 32 + 12 >> 2] = k + h;
  c[P + 32 + 28 >> 2] = (h >> 1) + k;
  c[P + 32 + 44 >> 2] = k - (h >> 1);
  c[P + 32 + 60 >> 2] = k - h;
  h = 0;
  k = P + 96 | 0;
  b = P + 32 | 0;
 }
 while (1) {
  j = c[b + ((h >>> 2 & 3) << 2) >> 2] | 0;
  a[k >> 0] = (j | 0) < 0 ? 0 : ((j | 0) > 255 ? 255 : j) & 255;
  j = h + 1 | 0;
  if ((j | 0) == 256) break; else {
   h = j;
   k = k + 1 | 0;
   b = (j & 63 | 0) == 0 ? b + 16 | 0 : b;
  }
 }
 t = z;
 b = A;
 k = C;
 r = B;
 n = D;
 l = E;
 H = 0;
 s = F;
 q = G;
 p = I;
 G = (c[e >> 2] | 0) + (O << 8) + (Z(f << 6, N) | 0) + (g << 3) | 0;
 while (1) {
  j = P + 32 | 0;
  h = j + 64 | 0;
  do {
   c[j >> 2] = 0;
   j = j + 4 | 0;
  } while ((j | 0) < (h | 0));
  if (m) {
   E = G + (0 - (N << 3)) | 0;
   w = (d[E + 1 >> 0] | 0) + (d[E >> 0] | 0) | 0;
   D = (d[E + 1 + 1 + 1 >> 0] | 0) + (d[E + 1 + 1 >> 0] | 0) | 0;
   F = E + 1 + 1 + 1 + 1 + 1 | 0;
   E = (d[F >> 0] | 0) + (d[E + 1 + 1 + 1 + 1 >> 0] | 0) | 0;
   F = (d[F + 1 + 1 >> 0] | 0) + (d[F + 1 >> 0] | 0) | 0;
   c[P + 32 >> 2] = E + (D + w) + F;
   c[J >> 2] = D + w - E - F;
   j = E + (D + w) + F | 0;
   h = D + w - E - F | 0;
   b = 1;
  } else {
   j = 0;
   h = 0;
   D = t;
   E = b;
   F = k;
   b = 0;
  }
  if (M) {
   B = G + (N << 6) | 0;
   u = (d[B + 1 >> 0] | 0) + (d[B >> 0] | 0) | 0;
   A = (d[B + 1 + 1 + 1 >> 0] | 0) + (d[B + 1 + 1 >> 0] | 0) | 0;
   C = B + 1 + 1 + 1 + 1 + 1 | 0;
   B = (d[C >> 0] | 0) + (d[B + 1 + 1 + 1 + 1 >> 0] | 0) | 0;
   C = (d[C + 1 + 1 >> 0] | 0) + (d[C + 1 >> 0] | 0) | 0;
   j = B + (A + u) + j + C | 0;
   c[P + 32 >> 2] = j;
   k = A + u - B - C + h | 0;
   c[J >> 2] = k;
   b = b + 1 | 0;
  } else {
   k = h;
   A = r;
   B = n;
   C = l;
  }
  if (o) {
   z = G + -1 | 0;
   v = (d[z + (N << 3) >> 0] | 0) + (d[z >> 0] | 0) | 0;
   x = (d[z + (N << 4) + (N << 3) >> 0] | 0) + (d[z + (N << 4) >> 0] | 0) | 0;
   z = z + (N << 4) + (N << 4) | 0;
   y = (d[z + (N << 3) >> 0] | 0) + (d[z >> 0] | 0) | 0;
   z = (d[z + (N << 4) + (N << 3) >> 0] | 0) + (d[z + (N << 4) >> 0] | 0) | 0;
   n = y + (x + v) + j + z | 0;
   c[P + 32 >> 2] = n;
   c[K >> 2] = x + v - y - z;
   l = x + v - y - z | 0;
   j = b + 1 | 0;
   h = 1;
  } else {
   n = j;
   l = 0;
   j = b;
   x = s;
   y = q;
   z = p;
   h = 0;
  }
  do if (L) {
   s = G + 8 | 0;
   p = (d[s + (N << 3) >> 0] | 0) + (d[s >> 0] | 0) | 0;
   q = (d[s + (N << 4) + (N << 3) >> 0] | 0) + (d[s + (N << 4) >> 0] | 0) | 0;
   s = s + (N << 4) + (N << 4) | 0;
   r = (d[s + (N << 3) >> 0] | 0) + (d[s >> 0] | 0) | 0;
   s = (d[s + (N << 4) + (N << 3) >> 0] | 0) + (d[s + (N << 4) >> 0] | 0) | 0;
   j = j + 1 | 0;
   h = h + 1 | 0;
   t = r + (q + p) + n + s | 0;
   c[P + 32 >> 2] = t;
   l = q + p - r - s + l | 0;
   c[K >> 2] = l;
   n = (b | 0) == 0;
   if (!(o & n)) if (n) {
    b = t;
    r = 53;
    break;
   } else {
    n = t;
    r = 49;
    break;
   } else {
    k = y + z + x + v - p - q - r - s >> 4;
    c[J >> 2] = k;
    b = t;
    r = 53;
    break;
   }
  } else if (!b) {
   p = k;
   b = n;
   r = 50;
  } else r = 49; while (0);
  if ((r | 0) == 49) {
   p = k >> b + 2;
   c[J >> 2] = p;
   b = n;
   r = 50;
  }
  do if ((r | 0) == 50) {
   r = 0;
   k = (h | 0) == 0;
   if (!(M & (m & k))) if (k) {
    k = p;
    h = l;
    break;
   } else {
    k = p;
    r = 53;
    break;
   } else {
    h = E + F + D + w - C - B - A - u >> 4;
    c[K >> 2] = h;
    k = p;
    break;
   }
  } while (0);
  if ((r | 0) == 53) {
   h = l >> h + 2;
   c[K >> 2] = h;
  }
  switch (j | 0) {
  case 1:
   {
    j = b >> 3;
    c[P + 32 >> 2] = j;
    break;
   }
  case 2:
   {
    j = b >> 4;
    c[P + 32 >> 2] = j;
    break;
   }
  case 3:
   {
    j = b * 21 >> 9;
    c[P + 32 >> 2] = j;
    break;
   }
  default:
   {
    j = b >> 5;
    c[P + 32 >> 2] = j;
   }
  }
  if (!(h | k)) {
   c[P + 32 + 60 >> 2] = j;
   c[P + 32 + 56 >> 2] = j;
   c[P + 32 + 52 >> 2] = j;
   c[P + 32 + 48 >> 2] = j;
   c[P + 32 + 44 >> 2] = j;
   c[P + 32 + 40 >> 2] = j;
   c[P + 32 + 36 >> 2] = j;
   c[P + 32 + 32 >> 2] = j;
   c[P + 32 + 28 >> 2] = j;
   c[P + 32 + 24 >> 2] = j;
   c[P + 32 + 20 >> 2] = j;
   c[K >> 2] = j;
   c[P + 32 + 12 >> 2] = j;
   c[P + 32 + 8 >> 2] = j;
   c[J >> 2] = j;
  } else {
   s = k + j | 0;
   I = k >> 1;
   t = I + j | 0;
   I = j - I | 0;
   f = j - k | 0;
   c[P + 32 >> 2] = s + h;
   g = h >> 1;
   c[K >> 2] = g + s;
   c[P + 32 + 32 >> 2] = s - g;
   c[P + 32 + 48 >> 2] = s - h;
   c[J >> 2] = t + h;
   c[P + 32 + 20 >> 2] = t + g;
   c[P + 32 + 36 >> 2] = t - g;
   c[P + 32 + 52 >> 2] = t - h;
   c[P + 32 + 8 >> 2] = I + h;
   c[P + 32 + 24 >> 2] = I + g;
   c[P + 32 + 40 >> 2] = I - g;
   c[P + 32 + 56 >> 2] = I - h;
   c[P + 32 + 12 >> 2] = f + h;
   c[P + 32 + 28 >> 2] = g + f;
   c[P + 32 + 44 >> 2] = f - g;
   c[P + 32 + 60 >> 2] = f - h;
  }
  h = 0;
  k = P + 96 + 256 + (H << 6) | 0;
  b = P + 32 | 0;
  while (1) {
   j = c[b + ((h >>> 1 & 3) << 2) >> 2] | 0;
   a[k >> 0] = (j | 0) < 0 ? 0 : ((j | 0) > 255 ? 255 : j) & 255;
   j = h + 1 | 0;
   if ((j | 0) == 64) break; else {
    h = j;
    k = k + 1 | 0;
    b = (j & 15 | 0) == 0 ? b + 16 | 0 : b;
   }
  }
  H = H + 1 | 0;
  if ((H | 0) == 2) break; else {
   t = D;
   b = E;
   k = F;
   r = A;
   n = B;
   l = C;
   s = x;
   q = y;
   p = z;
   G = G + (O << 6) | 0;
  }
 }
 $a(e, P + 96 | 0);
 i = P;
 return;
}

function Za(a, b, d, e, f, g, h, i) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 i = i | 0;
 var j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0;
 x = c[a + 8 >> 2] | 0;
 y = c[x >> 2] | 0;
 if ((y | 0) != (d | 0)) return;
 c[a + 52 >> 2] = 0;
 w = c[a + 56 >> 2] | 0;
 do if (!b) {
  c[x + 20 >> 2] = 0;
  c[x + 12 >> 2] = e;
  c[x + 8 >> 2] = e;
  c[x + 16 >> 2] = f;
  c[x + 24 >> 2] = (w | 0) == 0 & 1;
  if (!w) {
   j = (c[a + 44 >> 2] | 0) + 1 | 0;
   c[a + 44 >> 2] = j;
   c[x + 36 >> 2] = g;
   c[x + 28 >> 2] = h;
   c[x + 32 >> 2] = i;
   n = a + 44 | 0;
   v = 107;
   break;
  } else {
   c[x + 36 >> 2] = g;
   c[x + 28 >> 2] = h;
   c[x + 32 >> 2] = i;
   v = 117;
   break;
  }
 } else {
  do if (!g) {
   if (!(c[b + 8 >> 2] | 0)) {
    j = c[a + 40 >> 2] | 0;
    d = c[a + 24 >> 2] | 0;
    if (j >>> 0 >= d >>> 0) if (j) {
     m = c[a >> 2] | 0;
     n = 0;
     k = -1;
     l = 0;
     do {
      if (((c[m + (n * 40 | 0) + 20 >> 2] | 0) + -1 | 0) >>> 0 < 2) {
       b = c[m + (n * 40 | 0) + 8 >> 2] | 0;
       v = (k | 0) == -1 | (b | 0) < (l | 0);
       k = v ? n : k;
       l = v ? b : l;
      }
      n = n + 1 | 0;
     } while ((n | 0) != (j | 0));
     if ((k | 0) > -1) {
      c[m + (k * 40 | 0) + 20 >> 2] = 0;
      c[a + 40 >> 2] = j + -1;
      if (!(c[m + (k * 40 | 0) + 24 >> 2] | 0)) {
       c[a + 44 >> 2] = (c[a + 44 >> 2] | 0) + -1;
       k = a + 40 | 0;
       j = j + -1 | 0;
      } else {
       k = a + 40 | 0;
       j = j + -1 | 0;
      }
     } else k = a + 40 | 0;
    } else {
     k = a + 40 | 0;
     j = 0;
    } else k = a + 40 | 0;
   } else {
    d = w;
    r = w;
    t = 0;
    s = 0;
    a : while (1) {
     switch (c[b + 12 + (t * 20 | 0) >> 2] | 0) {
     case 6:
      {
       m = c[b + 12 + (t * 20 | 0) + 12 >> 2] | 0;
       q = c[a + 36 >> 2] | 0;
       if ((q | 0) == 65535 | q >>> 0 < m >>> 0) break a;
       n = c[a + 24 >> 2] | 0;
       b : do if (n) {
        l = c[a >> 2] | 0;
        j = 0;
        while (1) {
         k = l + (j * 40 | 0) + 20 | 0;
         if ((c[k >> 2] | 0) == 3 ? (c[l + (j * 40 | 0) + 8 >> 2] | 0) == (m | 0) : 0) break;
         j = j + 1 | 0;
         if (j >>> 0 >= n >>> 0) break b;
        }
        c[k >> 2] = 0;
        c[a + 40 >> 2] = (c[a + 40 >> 2] | 0) + -1;
        if (!(c[l + (j * 40 | 0) + 24 >> 2] | 0)) c[a + 44 >> 2] = (c[a + 44 >> 2] | 0) + -1;
       } while (0);
       j = c[a + 40 >> 2] | 0;
       if (j >>> 0 >= n >>> 0) break a;
       c[x + 12 >> 2] = e;
       c[x + 8 >> 2] = m;
       c[x + 16 >> 2] = f;
       c[x + 20 >> 2] = 3;
       c[x + 24 >> 2] = (d | 0) == 0 & 1;
       c[a + 40 >> 2] = j + 1;
       c[a + 44 >> 2] = (c[a + 44 >> 2] | 0) + 1;
       j = r;
       k = 1;
       break;
      }
     case 1:
      {
       l = e - (c[b + 12 + (t * 20 | 0) + 4 >> 2] | 0) | 0;
       m = c[a + 24 >> 2] | 0;
       if (!m) break a;
       n = c[a >> 2] | 0;
       j = 0;
       while (1) {
        k = n + (j * 40 | 0) + 20 | 0;
        if (((c[k >> 2] | 0) + -1 | 0) >>> 0 < 2 ? (c[n + (j * 40 | 0) + 8 >> 2] | 0) == (l | 0) : 0) break;
        j = j + 1 | 0;
        if (j >>> 0 >= m >>> 0) break a;
       }
       if ((j | 0) < 0) break a;
       c[k >> 2] = 0;
       c[a + 40 >> 2] = (c[a + 40 >> 2] | 0) + -1;
       if (!(c[n + (j * 40 | 0) + 24 >> 2] | 0)) {
        c[a + 44 >> 2] = (c[a + 44 >> 2] | 0) + -1;
        j = r;
        k = s;
       } else {
        j = r;
        k = s;
       }
       break;
      }
     case 2:
      {
       l = c[b + 12 + (t * 20 | 0) + 8 >> 2] | 0;
       m = c[a + 24 >> 2] | 0;
       if (!m) break a;
       n = c[a >> 2] | 0;
       j = 0;
       while (1) {
        k = n + (j * 40 | 0) + 20 | 0;
        if ((c[k >> 2] | 0) == 3 ? (c[n + (j * 40 | 0) + 8 >> 2] | 0) == (l | 0) : 0) break;
        j = j + 1 | 0;
        if (j >>> 0 >= m >>> 0) break a;
       }
       if ((j | 0) < 0) break a;
       c[k >> 2] = 0;
       c[a + 40 >> 2] = (c[a + 40 >> 2] | 0) + -1;
       if (!(c[n + (j * 40 | 0) + 24 >> 2] | 0)) {
        c[a + 44 >> 2] = (c[a + 44 >> 2] | 0) + -1;
        j = r;
        k = s;
       } else {
        j = r;
        k = s;
       }
       break;
      }
     case 3:
      {
       o = c[b + 12 + (t * 20 | 0) + 4 >> 2] | 0;
       q = c[b + 12 + (t * 20 | 0) + 12 >> 2] | 0;
       p = c[a + 36 >> 2] | 0;
       if ((p | 0) == 65535 | p >>> 0 < q >>> 0) break a;
       j = c[a + 24 >> 2] | 0;
       if (!j) break a;
       k = c[a >> 2] | 0;
       n = 0;
       while (1) {
        l = k + (n * 40 | 0) + 20 | 0;
        if ((c[l >> 2] | 0) == 3 ? (c[k + (n * 40 | 0) + 8 >> 2] | 0) == (q | 0) : 0) {
         v = 48;
         break;
        }
        m = n + 1 | 0;
        if (m >>> 0 < j >>> 0) n = m; else break;
       }
       if ((v | 0) == 48 ? (v = 0, c[l >> 2] = 0, c[a + 40 >> 2] = (c[a + 40 >> 2] | 0) + -1, (c[k + (n * 40 | 0) + 24 >> 2] | 0) == 0) : 0) c[a + 44 >> 2] = (c[a + 44 >> 2] | 0) + -1;
       p = c[a + 24 >> 2] | 0;
       m = e - o | 0;
       if (!p) break a;
       n = c[a >> 2] | 0;
       j = 0;
       while (1) {
        k = n + (j * 40 | 0) + 20 | 0;
        l = c[k >> 2] | 0;
        if ((l + -1 | 0) >>> 0 < 2 ? (u = n + (j * 40 | 0) + 8 | 0, (c[u >> 2] | 0) == (m | 0)) : 0) break;
        j = j + 1 | 0;
        if (j >>> 0 >= p >>> 0) break a;
       }
       if (!((j | 0) > -1 & l >>> 0 > 1)) break a;
       c[k >> 2] = 3;
       c[u >> 2] = q;
       j = r;
       k = s;
       break;
      }
     case 4:
      {
       l = c[b + 12 + (t * 20 | 0) + 16 >> 2] | 0;
       c[a + 36 >> 2] = l;
       m = c[a + 24 >> 2] | 0;
       if (!m) {
        j = r;
        k = s;
       } else {
        n = c[a >> 2] | 0;
        j = l;
        o = 0;
        do {
         k = n + (o * 40 | 0) + 20 | 0;
         do if ((c[k >> 2] | 0) == 3) {
          if ((c[n + (o * 40 | 0) + 8 >> 2] | 0) >>> 0 <= l >>> 0) if ((j | 0) == 65535) j = 65535; else break;
          c[k >> 2] = 0;
          c[a + 40 >> 2] = (c[a + 40 >> 2] | 0) + -1;
          if (!(c[n + (o * 40 | 0) + 24 >> 2] | 0)) c[a + 44 >> 2] = (c[a + 44 >> 2] | 0) + -1;
         } while (0);
         o = o + 1 | 0;
        } while ((o | 0) != (m | 0));
        j = r;
        k = s;
       }
       break;
      }
     case 5:
      {
       j = c[a >> 2] | 0;
       k = 0;
       do {
        e = j + (k * 40 | 0) + 20 | 0;
        if ((c[e >> 2] | 0) != 0 ? (c[e >> 2] = 0, (c[j + (k * 40 | 0) + 24 >> 2] | 0) == 0) : 0) c[a + 44 >> 2] = (c[a + 44 >> 2] | 0) + -1;
        k = k + 1 | 0;
       } while ((k | 0) != 16);
       c : do if (!d) {
        m = r;
        while (1) {
         e = c[a >> 2] | 0;
         k = c[a + 28 >> 2] | 0;
         l = 0;
         d = 2147483647;
         j = 0;
         do {
          if (c[e + (l * 40 | 0) + 24 >> 2] | 0) {
           q = c[e + (l * 40 | 0) + 16 >> 2] | 0;
           r = (q | 0) < (d | 0);
           d = r ? q : d;
           j = r ? e + (l * 40 | 0) | 0 : j;
          }
          l = l + 1 | 0;
         } while (l >>> 0 <= k >>> 0);
         if (!j) {
          j = m;
          d = 0;
          break c;
         }
         r = c[a + 16 >> 2] | 0;
         q = c[a + 12 >> 2] | 0;
         c[q + (r << 4) >> 2] = c[j >> 2];
         c[q + (r << 4) + 12 >> 2] = c[j + 36 >> 2];
         c[q + (r << 4) + 4 >> 2] = c[j + 28 >> 2];
         c[q + (r << 4) + 8 >> 2] = c[j + 32 >> 2];
         c[a + 16 >> 2] = r + 1;
         c[j + 24 >> 2] = 0;
         if (!(c[j + 20 >> 2] | 0)) c[a + 44 >> 2] = (c[a + 44 >> 2] | 0) + -1;
         if (!m) m = 0; else {
          j = m;
          d = m;
          break;
         }
        }
       } else j = r; while (0);
       c[a + 40 >> 2] = 0;
       c[a + 36 >> 2] = 65535;
       c[a + 48 >> 2] = 0;
       c[a + 52 >> 2] = 1;
       e = 0;
       k = s;
       break;
      }
     default:
      break a;
     }
     r = j;
     t = t + 1 | 0;
     s = k;
    }
    if (s) break;
    k = a + 40 | 0;
    j = c[a + 40 >> 2] | 0;
    d = c[a + 24 >> 2] | 0;
   }
   if (j >>> 0 < d >>> 0) {
    c[x + 12 >> 2] = e;
    c[x + 8 >> 2] = e;
    c[x + 16 >> 2] = f;
    c[x + 20 >> 2] = 2;
    c[x + 24 >> 2] = (w | 0) == 0 & 1;
    c[a + 44 >> 2] = (c[a + 44 >> 2] | 0) + 1;
    c[k >> 2] = j + 1;
   }
  } else {
   c[a + 20 >> 2] = 0;
   c[a + 16 >> 2] = 0;
   d = c[a >> 2] | 0;
   e = 0;
   do {
    j = d + (e * 40 | 0) + 20 | 0;
    if ((c[j >> 2] | 0) != 0 ? (c[j >> 2] = 0, (c[d + (e * 40 | 0) + 24 >> 2] | 0) == 0) : 0) c[a + 44 >> 2] = (c[a + 44 >> 2] | 0) + -1;
    e = e + 1 | 0;
   } while ((e | 0) != 16);
   d : do if (!w) {
    d = 0;
    while (1) {
     k = c[a >> 2] | 0;
     l = c[a + 28 >> 2] | 0;
     m = 0;
     j = 2147483647;
     e = 0;
     do {
      if (c[k + (m * 40 | 0) + 24 >> 2] | 0) {
       v = c[k + (m * 40 | 0) + 16 >> 2] | 0;
       f = (v | 0) < (j | 0);
       j = f ? v : j;
       e = f ? k + (m * 40 | 0) | 0 : e;
      }
      m = m + 1 | 0;
     } while (m >>> 0 <= l >>> 0);
     if (!e) break d;
     f = c[a + 12 >> 2] | 0;
     c[f + (d << 4) >> 2] = c[e >> 2];
     c[f + (d << 4) + 12 >> 2] = c[e + 36 >> 2];
     c[f + (d << 4) + 4 >> 2] = c[e + 28 >> 2];
     c[f + (d << 4) + 8 >> 2] = c[e + 32 >> 2];
     d = d + 1 | 0;
     c[a + 16 >> 2] = d;
     c[e + 24 >> 2] = 0;
     if (c[e + 20 >> 2] | 0) continue;
     c[a + 44 >> 2] = (c[a + 44 >> 2] | 0) + -1;
    }
   } while (0);
   c[a + 40 >> 2] = 0;
   c[a + 36 >> 2] = 65535;
   c[a + 48 >> 2] = 0;
   if ((c[b >> 2] | 0) != 0 | (w | 0) == 0 ^ 1) {
    c[a + 16 >> 2] = 0;
    c[a + 20 >> 2] = 0;
   }
   f = (c[b + 4 >> 2] | 0) == 0;
   c[x + 20 >> 2] = f ? 2 : 3;
   c[a + 36 >> 2] = f ? 65535 : 0;
   c[x + 12 >> 2] = 0;
   c[x + 8 >> 2] = 0;
   c[x + 16 >> 2] = 0;
   c[x + 24 >> 2] = (w | 0) == 0 & 1;
   c[a + 44 >> 2] = 1;
   c[a + 40 >> 2] = 1;
  } while (0);
  c[x + 36 >> 2] = g;
  c[x + 28 >> 2] = h;
  c[x + 32 >> 2] = i;
  if (!w) {
   n = a + 44 | 0;
   j = c[a + 44 >> 2] | 0;
   v = 107;
  } else v = 117;
 } while (0);
 if ((v | 0) == 107) {
  d = c[a + 28 >> 2] | 0;
  if (j >>> 0 > d >>> 0) {
   if (c[a + 56 >> 2] | 0) while (1) {}
   do {
    l = c[a >> 2] | 0;
    m = 0;
    e = 2147483647;
    k = 0;
    do {
     if (c[l + (m * 40 | 0) + 24 >> 2] | 0) {
      g = c[l + (m * 40 | 0) + 16 >> 2] | 0;
      i = (g | 0) < (e | 0);
      e = i ? g : e;
      k = i ? l + (m * 40 | 0) | 0 : k;
     }
     m = m + 1 | 0;
    } while (m >>> 0 <= d >>> 0);
    if ((k | 0) != 0 ? (i = c[a + 16 >> 2] | 0, g = c[a + 12 >> 2] | 0, c[g + (i << 4) >> 2] = c[k >> 2], c[g + (i << 4) + 12 >> 2] = c[k + 36 >> 2], c[g + (i << 4) + 4 >> 2] = c[k + 28 >> 2], c[g + (i << 4) + 8 >> 2] = c[k + 32 >> 2], c[a + 16 >> 2] = i + 1, c[k + 24 >> 2] = 0, (c[k + 20 >> 2] | 0) == 0) : 0) {
     j = j + -1 | 0;
     c[n >> 2] = j;
    }
   } while (j >>> 0 > d >>> 0);
  }
 } else if ((v | 0) == 117) {
  d = c[a + 16 >> 2] | 0;
  x = c[a + 12 >> 2] | 0;
  c[x + (d << 4) >> 2] = y;
  c[x + (d << 4) + 12 >> 2] = g;
  c[x + (d << 4) + 4 >> 2] = h;
  c[x + (d << 4) + 8 >> 2] = i;
  c[a + 16 >> 2] = d + 1;
  d = c[a + 28 >> 2] | 0;
 }
 _a(c[a >> 2] | 0, d + 1 | 0);
 return;
}

function vb(a) {
 a = a | 0;
 var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0;
 if (!a) return;
 h = c[1835] | 0;
 if ((a + -8 | 0) >>> 0 < h >>> 0) la();
 b = c[a + -4 >> 2] | 0;
 if ((b & 3 | 0) == 1) la();
 n = a + -8 + (b & -8) | 0;
 do if (!(b & 1)) {
  e = c[a + -8 >> 2] | 0;
  if (!(b & 3)) return;
  k = a + -8 + (0 - e) | 0;
  j = e + (b & -8) | 0;
  if (k >>> 0 < h >>> 0) la();
  if ((k | 0) == (c[1836] | 0)) {
   a = c[n + 4 >> 2] | 0;
   if ((a & 3 | 0) != 3) {
    q = k;
    f = j;
    break;
   }
   c[1833] = j;
   c[n + 4 >> 2] = a & -2;
   c[k + 4 >> 2] = j | 1;
   c[k + j >> 2] = j;
   return;
  }
  if (e >>> 0 < 256) {
   a = c[k + 8 >> 2] | 0;
   b = c[k + 12 >> 2] | 0;
   if ((a | 0) != (7364 + (e >>> 3 << 1 << 2) | 0)) {
    if (a >>> 0 < h >>> 0) la();
    if ((c[a + 12 >> 2] | 0) != (k | 0)) la();
   }
   if ((b | 0) == (a | 0)) {
    c[1831] = c[1831] & ~(1 << (e >>> 3));
    q = k;
    f = j;
    break;
   }
   if ((b | 0) != (7364 + (e >>> 3 << 1 << 2) | 0)) {
    if (b >>> 0 < h >>> 0) la();
    if ((c[b + 8 >> 2] | 0) != (k | 0)) la(); else d = b + 8 | 0;
   } else d = b + 8 | 0;
   c[a + 12 >> 2] = b;
   c[d >> 2] = a;
   q = k;
   f = j;
   break;
  }
  g = c[k + 24 >> 2] | 0;
  a = c[k + 12 >> 2] | 0;
  do if ((a | 0) == (k | 0)) {
   a = c[k + 16 + 4 >> 2] | 0;
   if (!a) {
    a = c[k + 16 >> 2] | 0;
    if (!a) {
     i = 0;
     break;
    } else e = k + 16 | 0;
   } else e = k + 16 + 4 | 0;
   while (1) {
    b = a + 20 | 0;
    d = c[b >> 2] | 0;
    if (d) {
     a = d;
     e = b;
     continue;
    }
    b = a + 16 | 0;
    d = c[b >> 2] | 0;
    if (!d) break; else {
     a = d;
     e = b;
    }
   }
   if (e >>> 0 < h >>> 0) la(); else {
    c[e >> 2] = 0;
    i = a;
    break;
   }
  } else {
   b = c[k + 8 >> 2] | 0;
   if (b >>> 0 < h >>> 0) la();
   if ((c[b + 12 >> 2] | 0) != (k | 0)) la();
   if ((c[a + 8 >> 2] | 0) == (k | 0)) {
    c[b + 12 >> 2] = a;
    c[a + 8 >> 2] = b;
    i = a;
    break;
   } else la();
  } while (0);
  if (g) {
   a = c[k + 28 >> 2] | 0;
   if ((k | 0) == (c[7628 + (a << 2) >> 2] | 0)) {
    c[7628 + (a << 2) >> 2] = i;
    if (!i) {
     c[1832] = c[1832] & ~(1 << a);
     q = k;
     f = j;
     break;
    }
   } else {
    if (g >>> 0 < (c[1835] | 0) >>> 0) la();
    if ((c[g + 16 >> 2] | 0) == (k | 0)) c[g + 16 >> 2] = i; else c[g + 20 >> 2] = i;
    if (!i) {
     q = k;
     f = j;
     break;
    }
   }
   b = c[1835] | 0;
   if (i >>> 0 < b >>> 0) la();
   c[i + 24 >> 2] = g;
   a = c[k + 16 >> 2] | 0;
   do if (a) if (a >>> 0 < b >>> 0) la(); else {
    c[i + 16 >> 2] = a;
    c[a + 24 >> 2] = i;
    break;
   } while (0);
   a = c[k + 16 + 4 >> 2] | 0;
   if (a) if (a >>> 0 < (c[1835] | 0) >>> 0) la(); else {
    c[i + 20 >> 2] = a;
    c[a + 24 >> 2] = i;
    q = k;
    f = j;
    break;
   } else {
    q = k;
    f = j;
   }
  } else {
   q = k;
   f = j;
  }
 } else {
  q = a + -8 | 0;
  f = b & -8;
 } while (0);
 if (q >>> 0 >= n >>> 0) la();
 d = c[n + 4 >> 2] | 0;
 if (!(d & 1)) la();
 if (!(d & 2)) {
  if ((n | 0) == (c[1837] | 0)) {
   p = (c[1834] | 0) + f | 0;
   c[1834] = p;
   c[1837] = q;
   c[q + 4 >> 2] = p | 1;
   if ((q | 0) != (c[1836] | 0)) return;
   c[1836] = 0;
   c[1833] = 0;
   return;
  }
  if ((n | 0) == (c[1836] | 0)) {
   p = (c[1833] | 0) + f | 0;
   c[1833] = p;
   c[1836] = q;
   c[q + 4 >> 2] = p | 1;
   c[q + p >> 2] = p;
   return;
  }
  f = (d & -8) + f | 0;
  do if (d >>> 0 >= 256) {
   g = c[n + 24 >> 2] | 0;
   a = c[n + 12 >> 2] | 0;
   do if ((a | 0) == (n | 0)) {
    a = c[n + 16 + 4 >> 2] | 0;
    if (!a) {
     a = c[n + 16 >> 2] | 0;
     if (!a) {
      m = 0;
      break;
     } else e = n + 16 | 0;
    } else e = n + 16 + 4 | 0;
    while (1) {
     b = a + 20 | 0;
     d = c[b >> 2] | 0;
     if (d) {
      a = d;
      e = b;
      continue;
     }
     b = a + 16 | 0;
     d = c[b >> 2] | 0;
     if (!d) break; else {
      a = d;
      e = b;
     }
    }
    if (e >>> 0 < (c[1835] | 0) >>> 0) la(); else {
     c[e >> 2] = 0;
     m = a;
     break;
    }
   } else {
    b = c[n + 8 >> 2] | 0;
    if (b >>> 0 < (c[1835] | 0) >>> 0) la();
    if ((c[b + 12 >> 2] | 0) != (n | 0)) la();
    if ((c[a + 8 >> 2] | 0) == (n | 0)) {
     c[b + 12 >> 2] = a;
     c[a + 8 >> 2] = b;
     m = a;
     break;
    } else la();
   } while (0);
   if (g) {
    a = c[n + 28 >> 2] | 0;
    if ((n | 0) == (c[7628 + (a << 2) >> 2] | 0)) {
     c[7628 + (a << 2) >> 2] = m;
     if (!m) {
      c[1832] = c[1832] & ~(1 << a);
      break;
     }
    } else {
     if (g >>> 0 < (c[1835] | 0) >>> 0) la();
     if ((c[g + 16 >> 2] | 0) == (n | 0)) c[g + 16 >> 2] = m; else c[g + 20 >> 2] = m;
     if (!m) break;
    }
    b = c[1835] | 0;
    if (m >>> 0 < b >>> 0) la();
    c[m + 24 >> 2] = g;
    a = c[n + 16 >> 2] | 0;
    do if (a) if (a >>> 0 < b >>> 0) la(); else {
     c[m + 16 >> 2] = a;
     c[a + 24 >> 2] = m;
     break;
    } while (0);
    a = c[n + 16 + 4 >> 2] | 0;
    if (a) if (a >>> 0 < (c[1835] | 0) >>> 0) la(); else {
     c[m + 20 >> 2] = a;
     c[a + 24 >> 2] = m;
     break;
    }
   }
  } else {
   a = c[n + 8 >> 2] | 0;
   b = c[n + 12 >> 2] | 0;
   if ((a | 0) != (7364 + (d >>> 3 << 1 << 2) | 0)) {
    if (a >>> 0 < (c[1835] | 0) >>> 0) la();
    if ((c[a + 12 >> 2] | 0) != (n | 0)) la();
   }
   if ((b | 0) == (a | 0)) {
    c[1831] = c[1831] & ~(1 << (d >>> 3));
    break;
   }
   if ((b | 0) != (7364 + (d >>> 3 << 1 << 2) | 0)) {
    if (b >>> 0 < (c[1835] | 0) >>> 0) la();
    if ((c[b + 8 >> 2] | 0) != (n | 0)) la(); else l = b + 8 | 0;
   } else l = b + 8 | 0;
   c[a + 12 >> 2] = b;
   c[l >> 2] = a;
  } while (0);
  c[q + 4 >> 2] = f | 1;
  c[q + f >> 2] = f;
  if ((q | 0) == (c[1836] | 0)) {
   c[1833] = f;
   return;
  }
 } else {
  c[n + 4 >> 2] = d & -2;
  c[q + 4 >> 2] = f | 1;
  c[q + f >> 2] = f;
 }
 b = f >>> 3;
 if (f >>> 0 < 256) {
  a = c[1831] | 0;
  if (a & 1 << b) {
   a = c[7364 + (b << 1 << 2) + 8 >> 2] | 0;
   if (a >>> 0 < (c[1835] | 0) >>> 0) la(); else {
    o = 7364 + (b << 1 << 2) + 8 | 0;
    p = a;
   }
  } else {
   c[1831] = a | 1 << b;
   o = 7364 + (b << 1 << 2) + 8 | 0;
   p = 7364 + (b << 1 << 2) | 0;
  }
  c[o >> 2] = q;
  c[p + 12 >> 2] = q;
  c[q + 8 >> 2] = p;
  c[q + 12 >> 2] = 7364 + (b << 1 << 2);
  return;
 }
 a = f >>> 8;
 if (a) if (f >>> 0 > 16777215) d = 31; else {
  d = a << ((a + 1048320 | 0) >>> 16 & 8) << (((a << ((a + 1048320 | 0) >>> 16 & 8)) + 520192 | 0) >>> 16 & 4);
  d = 14 - (((a << ((a + 1048320 | 0) >>> 16 & 8)) + 520192 | 0) >>> 16 & 4 | (a + 1048320 | 0) >>> 16 & 8 | (d + 245760 | 0) >>> 16 & 2) + (d << ((d + 245760 | 0) >>> 16 & 2) >>> 15) | 0;
  d = f >>> (d + 7 | 0) & 1 | d << 1;
 } else d = 0;
 e = 7628 + (d << 2) | 0;
 c[q + 28 >> 2] = d;
 c[q + 20 >> 2] = 0;
 c[q + 16 >> 2] = 0;
 a = c[1832] | 0;
 b = 1 << d;
 do if (a & b) {
  d = f << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);
  e = c[e >> 2] | 0;
  while (1) {
   if ((c[e + 4 >> 2] & -8 | 0) == (f | 0)) {
    a = 130;
    break;
   }
   b = e + 16 + (d >>> 31 << 2) | 0;
   a = c[b >> 2] | 0;
   if (!a) {
    a = 127;
    break;
   } else {
    d = d << 1;
    e = a;
   }
  }
  if ((a | 0) == 127) if (b >>> 0 < (c[1835] | 0) >>> 0) la(); else {
   c[b >> 2] = q;
   c[q + 24 >> 2] = e;
   c[q + 12 >> 2] = q;
   c[q + 8 >> 2] = q;
   break;
  } else if ((a | 0) == 130) {
   a = e + 8 | 0;
   b = c[a >> 2] | 0;
   p = c[1835] | 0;
   if (b >>> 0 >= p >>> 0 & e >>> 0 >= p >>> 0) {
    c[b + 12 >> 2] = q;
    c[a >> 2] = q;
    c[q + 8 >> 2] = b;
    c[q + 12 >> 2] = e;
    c[q + 24 >> 2] = 0;
    break;
   } else la();
  }
 } else {
  c[1832] = a | b;
  c[e >> 2] = q;
  c[q + 24 >> 2] = e;
  c[q + 12 >> 2] = q;
  c[q + 8 >> 2] = q;
 } while (0);
 q = (c[1839] | 0) + -1 | 0;
 c[1839] = q;
 if (!q) a = 7780; else return;
 while (1) {
  a = c[a >> 2] | 0;
  if (!a) break; else a = a + 8 | 0;
 }
 c[1839] = -1;
 return;
}

function kb(a) {
 a = a | 0;
 var b = 0, d = 0, e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0;
 x = i;
 i = i + 16 | 0;
 c[1806] = a;
 b = c[1807] | 0;
 c[1802] = b;
 c[1803] = a;
 d = a;
 a : while (1) {
  a = c[1812] | 0;
  c[1804] = a;
  p = c[1810] | 0;
  b : do if (!((b | 0) == 0 | (d | 0) == 0 | (p | 0) == 0) ? (v = c[p >> 2] | 0, (v | 0) != 0) : 0) {
   c[1813] = 0;
   c[x >> 2] = 0;
   c[p + 3392 >> 2] = c[1805];
   c : do if ((v | 0) == 2) {
    a = 0;
    w = 5;
   } else {
    e = a;
    a = 1;
    d : while (1) {
     m = ib(p + 8 | 0, b, d, e, x) | 0;
     o = c[x >> 2] | 0;
     b = b + o | 0;
     n = d - o | 0;
     n = (n | 0) < 0 ? 0 : n;
     c[1813] = b;
     switch (m | 0) {
     case 5:
      {
       w = 31;
       break b;
      }
     case 2:
      {
       w = 7;
       break c;
      }
     case 1:
      {
       w = 10;
       break d;
      }
     case 4:
      {
       m = 0;
       e : while (1) {
        e = c[p + 8 + 148 + (m << 2) >> 2] | 0;
        f : do if ((e | 0) != 0 ? (u = c[p + 8 + 20 + (c[e + 4 >> 2] << 2) >> 2] | 0, (u | 0) != 0) : 0) {
         j = c[u + 52 >> 2] | 0;
         k = Z(c[u + 56 >> 2] | 0, j) | 0;
         l = c[e + 12 >> 2] | 0;
         if (l >>> 0 <= 1) {
          d = 0;
          break e;
         }
         d = c[e + 16 >> 2] | 0;
         switch (d | 0) {
         case 0:
          {
           d = c[e + 20 >> 2] | 0;
           e = 0;
           while (1) {
            if ((c[d + (e << 2) >> 2] | 0) >>> 0 > k >>> 0) break f;
            e = e + 1 | 0;
            if (e >>> 0 >= l >>> 0) {
             d = 0;
             break e;
            }
           }
          }
         case 2:
          {
           h = c[e + 24 >> 2] | 0;
           d = c[e + 28 >> 2] | 0;
           g = 0;
           while (1) {
            e = c[h + (g << 2) >> 2] | 0;
            f = c[d + (g << 2) >> 2] | 0;
            if (!(e >>> 0 <= f >>> 0 & f >>> 0 < k >>> 0)) break f;
            g = g + 1 | 0;
            if (((e >>> 0) % (j >>> 0) | 0) >>> 0 > ((f >>> 0) % (j >>> 0) | 0) >>> 0) break f;
            if (g >>> 0 >= (l + -1 | 0) >>> 0) {
             d = 0;
             break e;
            }
           }
          }
         default:
          {
           if ((d + -3 | 0) >>> 0 < 3) if ((c[e + 36 >> 2] | 0) >>> 0 > k >>> 0) break f; else {
            d = 0;
            break e;
           }
           if ((d | 0) != 6) {
            d = 0;
            break e;
           }
           if ((c[e + 40 >> 2] | 0) >>> 0 < k >>> 0) break f; else {
            d = 0;
            break e;
           }
          }
         }
        } while (0);
        m = m + 1 | 0;
        if (m >>> 0 >= 256) {
         d = 1;
         break;
        }
       }
       a = ((d | 0) == 0 | n | 0) == 0 ? -2 : a;
       break;
      }
     default:
      {}
     }
     if (!n) break;
     if ((c[p >> 2] | 0) == 2) {
      a = o;
      w = 5;
      break c;
     }
     e = c[1804] | 0;
     d = n;
    }
    if ((w | 0) == 10) {
     w = 0;
     c[p + 4 >> 2] = (c[p + 4 >> 2] | 0) + 1;
     a = (n | 0) == 0 ? 2 : 3;
    }
    switch (a | 0) {
    case -2:
    case 1:
     break a;
    case 4:
     {
      w = 34;
      break;
     }
    case 3:
     {
      w = 70;
      break;
     }
    case 2:
     break;
    default:
     break b;
    }
   } while (0);
   if ((w | 0) == 5) {
    c[p >> 2] = 1;
    b = b + a | 0;
    c[1813] = b;
    w = 7;
   }
   do if ((w | 0) == 7) {
    if ((c[p + 1288 >> 2] | 0) != 0 ? (c[p + 1244 >> 2] | 0) != (c[p + 1248 >> 2] | 0) : 0) {
     c[p + 1288 >> 2] = 0;
     c[p >> 2] = 2;
     w = 70;
     break;
    }
    w = 34;
   } while (0);
   if ((w | 0) == 34) {
    w = 0;
    b = c[1810] | 0;
    if (!b) break;
    d = c[b + 24 >> 2] | 0;
    if (!d) break;
    if (!(c[b + 20 >> 2] | 0)) break;
    c[1815] = c[d + 52 >> 2] << 4;
    c[1816] = c[d + 56 >> 2] << 4;
    if (c[d + 80 >> 2] | 0) {
     p = c[d + 84 >> 2] | 0;
     if (((p | 0) != 0 ? (c[p + 24 >> 2] | 0) != 0 : 0) ? (c[p + 32 >> 2] | 0) != 0 : 0) c[1817] = 1; else c[1817] = 0;
     b = c[d + 84 >> 2] | 0;
     if (((b | 0) != 0 ? (c[b + 24 >> 2] | 0) != 0 : 0) ? (c[b + 36 >> 2] | 0) != 0 : 0) b = c[b + 48 >> 2] | 0; else b = 2;
    } else {
     c[1817] = 0;
     b = 2;
    }
    c[1818] = b;
    if (!(c[d + 60 >> 2] | 0)) {
     c[1821] = 0;
     c[1822] = 0;
     c[1823] = 0;
     c[1824] = 0;
     b = 0;
    } else {
     c[1821] = 1;
     c[1822] = c[d + 64 >> 2] << 1;
     c[1823] = (c[d + 52 >> 2] << 4) - ((c[d + 68 >> 2] | 0) + (c[d + 64 >> 2] | 0) << 1);
     c[1824] = c[d + 72 >> 2] << 1;
     b = (c[d + 56 >> 2] << 4) - ((c[d + 76 >> 2] | 0) + (c[d + 72 >> 2] | 0) << 1) | 0;
    }
    c[1825] = b;
    g : do if (((c[d + 80 >> 2] | 0) != 0 ? (q = c[d + 84 >> 2] | 0, (q | 0) != 0) : 0) ? (c[q >> 2] | 0) != 0 : 0) {
     b = c[q + 4 >> 2] | 0;
     do switch (b | 0) {
     case 1:
     case 0:
      {
       a = b;
       break g;
      }
     case 2:
      {
       a = 11;
       b = 12;
       break g;
      }
     case 3:
      {
       a = 11;
       b = 10;
       break g;
      }
     case 4:
      {
       a = 11;
       b = 16;
       break g;
      }
     case 5:
      {
       a = 33;
       b = 40;
       break g;
      }
     case 6:
      {
       a = 11;
       b = 24;
       break g;
      }
     case 7:
      {
       a = 11;
       b = 20;
       break g;
      }
     case 8:
      {
       a = 11;
       b = 32;
       break g;
      }
     case 9:
      {
       a = 33;
       b = 80;
       break g;
      }
     case 10:
      {
       a = 11;
       b = 18;
       break g;
      }
     case 11:
      {
       a = 11;
       b = 15;
       break g;
      }
     case 12:
      {
       a = 33;
       b = 64;
       break g;
      }
     case 13:
      {
       a = 99;
       b = 160;
       break g;
      }
     case 255:
      {
       b = c[q + 8 >> 2] | 0;
       p = c[q + 12 >> 2] | 0;
       a = (b | 0) == 0 | (p | 0) == 0 ? 0 : p;
       b = (b | 0) == 0 | (p | 0) == 0 ? 0 : b;
       break g;
      }
     default:
      {
       a = 0;
       b = 0;
       break g;
      }
     } while (0);
    } else {
     a = 1;
     b = 1;
    } while (0);
    c[1819] = b;
    c[1820] = a;
    c[1814] = c[d >> 2];
    ra();
    p = c[1813] | 0;
    c[1803] = (c[1802] | 0) - p + (c[1803] | 0);
    c[1802] = p;
    break;
   } else if ((w | 0) == 70) {
    w = 0;
    c[1803] = (c[1802] | 0) - b + (c[1803] | 0);
    c[1802] = b;
   }
   c[1803] = 0;
   c[1812] = (c[1812] | 0) + 1;
   b = c[1810] | 0;
   if ((((b | 0) != 0 ? (r = c[b + 1248 >> 2] | 0, r >>> 0 < (c[b + 1244 >> 2] | 0) >>> 0) : 0) ? (s = c[b + 1240 >> 2] | 0, c[b + 1248 >> 2] = r + 1, (s + (r << 4) | 0) != 0) : 0) ? (t = c[s + (r << 4) >> 2] | 0, (t | 0) != 0) : 0) {
    e = s + (r << 4) + 8 | 0;
    f = s + (r << 4) + 12 | 0;
    a = s + (r << 4) + 4 | 0;
    b = t;
    while (1) {
     p = c[e >> 2] | 0;
     o = c[f >> 2] | 0;
     n = c[a >> 2] | 0;
     c[1826] = b;
     c[1827] = n;
     c[1828] = o;
     c[1829] = p;
     c[1811] = (c[1811] | 0) + 1;
     ga(b | 0, c[1815] | 0, c[1816] | 0);
     b = c[1810] | 0;
     if (!b) break b;
     a = c[b + 1248 >> 2] | 0;
     if (a >>> 0 >= (c[b + 1244 >> 2] | 0) >>> 0) break b;
     d = c[b + 1240 >> 2] | 0;
     c[b + 1248 >> 2] = a + 1;
     if (!(d + (a << 4) | 0)) break b;
     b = c[d + (a << 4) >> 2] | 0;
     if (!b) break b;
     e = d + (a << 4) + 8 | 0;
     f = d + (a << 4) + 12 | 0;
     a = d + (a << 4) + 4 | 0;
    }
   }
  } else w = 31; while (0);
  if ((w | 0) == 31) w = 0;
  a = c[1803] | 0;
  if (!a) {
   w = 84;
   break;
  }
  b = c[1802] | 0;
  d = a;
 }
 if ((w | 0) == 84) {
  i = x;
  return;
 }
 c[1803] = 0;
 i = x;
 return;
}

function Na(a, b) {
 a = a | 0;
 b = b | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 g = c[a + 4 >> 2] | 0;
 j = c[a + 12 >> 2] << 3;
 i = c[a + 16 >> 2] | 0;
 if ((j - i | 0) > 31) {
  f = c[a + 8 >> 2] | 0;
  e = (d[g + 1 >> 0] | 0) << 16 | (d[g >> 0] | 0) << 24 | (d[g + 2 >> 0] | 0) << 8 | (d[g + 3 >> 0] | 0);
  if (!f) f = 7; else {
   e = (d[g + 4 >> 0] | 0) >>> (8 - f | 0) | e << f;
   f = 7;
  }
 } else if ((j - i | 0) > 0) {
  f = c[a + 8 >> 2] | 0;
  e = (d[g >> 0] | 0) << f + 24;
  if ((j - i + -8 + f | 0) > 0) {
   h = j - i + -8 + f | 0;
   f = f + 24 | 0;
   while (1) {
    g = g + 1 | 0;
    f = f + -8 | 0;
    e = (d[g >> 0] | 0) << f | e;
    if ((h | 0) <= 8) {
     f = 7;
     break;
    } else h = h + -8 | 0;
   }
  } else f = 7;
 } else {
  e = 0;
  f = 21;
 }
 do if ((f | 0) == 7) {
  if ((e | 0) < 0) {
   c[a + 16 >> 2] = i + 1;
   c[a + 8 >> 2] = i + 1 & 7;
   if ((i + 1 | 0) >>> 0 <= j >>> 0) c[a + 4 >> 2] = (c[a >> 2] | 0) + ((i + 1 | 0) >>> 3);
   c[b >> 2] = 0;
   b = 0;
   return b | 0;
  }
  if (e >>> 0 > 1073741823) {
   c[a + 16 >> 2] = i + 3;
   c[a + 8 >> 2] = i + 3 & 7;
   if ((i + 3 | 0) >>> 0 > j >>> 0) {
    b = 1;
    return b | 0;
   }
   c[a + 4 >> 2] = (c[a >> 2] | 0) + ((i + 3 | 0) >>> 3);
   c[b >> 2] = (e >>> 29 & 1) + 1;
   b = 0;
   return b | 0;
  }
  if (e >>> 0 > 536870911) {
   c[a + 16 >> 2] = i + 5;
   c[a + 8 >> 2] = i + 5 & 7;
   if ((i + 5 | 0) >>> 0 > j >>> 0) {
    b = 1;
    return b | 0;
   }
   c[a + 4 >> 2] = (c[a >> 2] | 0) + ((i + 5 | 0) >>> 3);
   c[b >> 2] = (e >>> 27 & 3) + 3;
   b = 0;
   return b | 0;
  }
  if (e >>> 0 <= 268435455) if (!(e & 134217728)) {
   f = 21;
   break;
  } else {
   g = 4;
   e = 0;
   break;
  }
  c[a + 16 >> 2] = i + 7;
  c[a + 8 >> 2] = i + 7 & 7;
  if ((i + 7 | 0) >>> 0 > j >>> 0) {
   b = 1;
   return b | 0;
  }
  c[a + 4 >> 2] = (c[a >> 2] | 0) + ((i + 7 | 0) >>> 3);
  c[b >> 2] = (e >>> 25 & 7) + 7;
  b = 0;
  return b | 0;
 } while (0);
 if ((f | 0) == 21) {
  f = 134217728;
  g = 0;
  while (1) {
   h = g + 1 | 0;
   f = f >>> 1;
   if (!((f | 0) != 0 & (f & e | 0) == 0)) break; else g = h;
  }
  e = g + 5 | 0;
  if ((e | 0) == 32) {
   c[b >> 2] = 0;
   e = (c[a + 16 >> 2] | 0) + 32 | 0;
   c[a + 16 >> 2] = e;
   c[a + 8 >> 2] = e & 7;
   if (e >>> 0 <= c[a + 12 >> 2] << 3 >>> 0) c[a + 4 >> 2] = (c[a >> 2] | 0) + (e >>> 3);
   if ((Ma(a, 1) | 0) != 1) {
    b = 1;
    return b | 0;
   }
   g = c[a + 4 >> 2] | 0;
   i = c[a + 12 >> 2] << 3;
   j = c[a + 16 >> 2] | 0;
   if ((i - j | 0) > 31) {
    f = c[a + 8 >> 2] | 0;
    e = (d[g + 1 >> 0] | 0) << 16 | (d[g >> 0] | 0) << 24 | (d[g + 2 >> 0] | 0) << 8 | (d[g + 3 >> 0] | 0);
    if (f) e = (d[g + 4 >> 0] | 0) >>> (8 - f | 0) | e << f;
   } else if ((i - j | 0) > 0) {
    f = c[a + 8 >> 2] | 0;
    e = (d[g >> 0] | 0) << f + 24;
    if ((i - j + -8 + f | 0) > 0) {
     h = i - j + -8 + f | 0;
     f = f + 24 | 0;
     while (1) {
      g = g + 1 | 0;
      f = f + -8 | 0;
      e = (d[g >> 0] | 0) << f | e;
      if ((h | 0) <= 8) break; else h = h + -8 | 0;
     }
    }
   } else e = 0;
   c[a + 16 >> 2] = j + 32;
   c[a + 8 >> 2] = j + 32 & 7;
   if ((j + 32 | 0) >>> 0 > i >>> 0) {
    b = 1;
    return b | 0;
   }
   c[a + 4 >> 2] = (c[a >> 2] | 0) + ((j + 32 | 0) >>> 3);
   switch (e | 0) {
   case 0:
    {
     c[b >> 2] = -1;
     b = 0;
     return b | 0;
    }
   case 1:
    {
     c[b >> 2] = -1;
     b = 1;
     return b | 0;
    }
   default:
    {
     b = 1;
     return b | 0;
    }
   }
  } else {
   g = e;
   e = h;
  }
 }
 e = e + 5 + i | 0;
 c[a + 16 >> 2] = e;
 c[a + 8 >> 2] = e & 7;
 if (e >>> 0 <= j >>> 0) c[a + 4 >> 2] = (c[a >> 2] | 0) + (e >>> 3);
 e = Ma(a, g) | 0;
 if ((e | 0) == -1) {
  b = 1;
  return b | 0;
 }
 c[b >> 2] = (1 << g) + -1 + e;
 b = 0;
 return b | 0;
}

function Ja(a, b, e, f) {
 a = a | 0;
 b = b | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0;
 g = d[4816 + b >> 0] | 0;
 j = d[4868 + b >> 0] | 0;
 h = c[8 + (j * 12 | 0) >> 2] << g;
 b = c[8 + (j * 12 | 0) + 4 >> 2] << g;
 g = c[8 + (j * 12 | 0) + 8 >> 2] << g;
 if (!e) c[a >> 2] = Z(c[a >> 2] | 0, h) | 0;
 a : do if (!(f & 65436)) {
  if (f & 98) {
   j = Z(c[a + 4 >> 2] | 0, b) | 0;
   k = Z(c[a + 20 >> 2] | 0, h) | 0;
   h = Z(c[a + 24 >> 2] | 0, b) | 0;
   g = c[a >> 2] | 0;
   f = k + 32 + g + ((h >> 1) + j) >> 6;
   c[a >> 2] = f;
   e = g - k + 32 + ((j >> 1) - h) >> 6;
   c[a + 4 >> 2] = e;
   i = g - k + 32 - ((j >> 1) - h) >> 6;
   c[a + 8 >> 2] = i;
   j = k + 32 + g - ((h >> 1) + j) >> 6;
   c[a + 12 >> 2] = j;
   c[a + 48 >> 2] = f;
   c[a + 32 >> 2] = f;
   c[a + 16 >> 2] = f;
   c[a + 52 >> 2] = e;
   c[a + 36 >> 2] = e;
   c[a + 20 >> 2] = e;
   c[a + 56 >> 2] = i;
   c[a + 40 >> 2] = i;
   c[a + 24 >> 2] = i;
   c[a + 60 >> 2] = j;
   c[a + 44 >> 2] = j;
   c[a + 28 >> 2] = j;
   if ((f + 512 | e + 512 | i + 512 | j + 512) >>> 0 > 1023) b = 1; else break;
   return b | 0;
  }
  b = (c[a >> 2] | 0) + 32 >> 6;
  if ((b + 512 | 0) >>> 0 > 1023) {
   k = 1;
   return k | 0;
  } else {
   c[a + 60 >> 2] = b;
   c[a + 56 >> 2] = b;
   c[a + 52 >> 2] = b;
   c[a + 48 >> 2] = b;
   c[a + 44 >> 2] = b;
   c[a + 40 >> 2] = b;
   c[a + 36 >> 2] = b;
   c[a + 32 >> 2] = b;
   c[a + 28 >> 2] = b;
   c[a + 24 >> 2] = b;
   c[a + 20 >> 2] = b;
   c[a + 16 >> 2] = b;
   c[a + 12 >> 2] = b;
   c[a + 8 >> 2] = b;
   c[a + 4 >> 2] = b;
   c[a >> 2] = b;
   break;
  }
 } else {
  f = Z(c[a + 4 >> 2] | 0, b) | 0;
  i = Z(c[a + 56 >> 2] | 0, b) | 0;
  l = Z(c[a + 60 >> 2] | 0, g) | 0;
  m = Z(c[a + 8 >> 2] | 0, b) | 0;
  r = Z(c[a + 20 >> 2] | 0, h) | 0;
  o = Z(c[a + 16 >> 2] | 0, g) | 0;
  s = Z(c[a + 32 >> 2] | 0, b) | 0;
  e = Z(c[a + 12 >> 2] | 0, h) | 0;
  q = Z(c[a + 24 >> 2] | 0, b) | 0;
  n = Z(c[a + 28 >> 2] | 0, b) | 0;
  p = Z(c[a + 48 >> 2] | 0, g) | 0;
  k = Z(c[a + 36 >> 2] | 0, b) | 0;
  g = Z(c[a + 40 >> 2] | 0, g) | 0;
  h = Z(c[a + 44 >> 2] | 0, h) | 0;
  t = Z(c[a + 52 >> 2] | 0, b) | 0;
  b = c[a >> 2] | 0;
  c[a >> 2] = b + r + ((q >> 1) + f);
  c[a + 4 >> 2] = b - r + ((f >> 1) - q);
  c[a + 8 >> 2] = b - r - ((f >> 1) - q);
  c[a + 12 >> 2] = b + r - ((q >> 1) + f);
  c[a + 16 >> 2] = (p >> 1) + o + (n + m);
  c[a + 20 >> 2] = (o >> 1) - p + (m - n);
  c[a + 24 >> 2] = m - n - ((o >> 1) - p);
  c[a + 28 >> 2] = n + m - ((p >> 1) + o);
  c[a + 32 >> 2] = (t >> 1) + s + (h + e);
  c[a + 36 >> 2] = (s >> 1) - t + (e - h);
  c[a + 40 >> 2] = e - h - ((s >> 1) - t);
  c[a + 44 >> 2] = h + e - ((t >> 1) + s);
  c[a + 48 >> 2] = (l >> 1) + g + (i + k);
  c[a + 52 >> 2] = (g >> 1) - l + (k - i);
  c[a + 56 >> 2] = k - i - ((g >> 1) - l);
  c[a + 60 >> 2] = i + k - ((l >> 1) + g);
  j = 3;
  e = (t >> 1) + s + (h + e) | 0;
  f = b + r + ((q >> 1) + f) | 0;
  b = (p >> 1) + o + (n + m) | 0;
  g = (l >> 1) + g + (i + k) | 0;
  while (1) {
   i = (b >> 1) - g | 0;
   g = (g >> 1) + b | 0;
   h = e + 32 + f | 0;
   c[a >> 2] = h + g >> 6;
   b = f - e + 32 | 0;
   c[a + 16 >> 2] = b + i >> 6;
   c[a + 32 >> 2] = b - i >> 6;
   c[a + 48 >> 2] = h - g >> 6;
   if (((h + g >> 6) + 512 | (b + i >> 6) + 512) >>> 0 > 1023) {
    b = 1;
    g = 14;
    break;
   }
   if (((b - i >> 6) + 512 | (h - g >> 6) + 512) >>> 0 > 1023) {
    b = 1;
    g = 14;
    break;
   }
   b = a + 4 | 0;
   if (!j) break a;
   e = c[a + 36 >> 2] | 0;
   t = c[a + 20 >> 2] | 0;
   g = c[a + 52 >> 2] | 0;
   a = b;
   j = j + -1 | 0;
   f = c[b >> 2] | 0;
   b = t;
  }
  if ((g | 0) == 14) return b | 0;
 } while (0);
 t = 0;
 return t | 0;
}

function ab(b, e, f, g) {
 b = b | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 var h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0;
 if (e >>> 0 < 4) {
  p = d[(c[f >> 2] | 0) + (e + -1) >> 0] | 0;
  o = 4;
  while (1) {
   e = b + -2 | 0;
   k = b + -1 | 0;
   i = b + 1 | 0;
   l = a[i >> 0] | 0;
   m = d[k >> 0] | 0;
   n = d[b >> 0] | 0;
   if ((((m - n | 0) < 0 ? 0 - (m - n) | 0 : m - n | 0) >>> 0 < (c[f + 4 >> 2] | 0) >>> 0 ? (q = d[e >> 0] | 0, r = c[f + 8 >> 2] | 0, ((q - m | 0) < 0 ? 0 - (q - m) | 0 : q - m | 0) >>> 0 < r >>> 0) : 0) ? (((l & 255) - n | 0) < 0 ? 0 - ((l & 255) - n) | 0 : (l & 255) - n | 0) >>> 0 < r >>> 0 : 0) {
    j = a[b + 2 >> 0] | 0;
    h = d[b + -3 >> 0] | 0;
    if (((h - m | 0) < 0 ? 0 - (h - m) | 0 : h - m | 0) >>> 0 < r >>> 0) {
     a[e >> 0] = ((((m + 1 + n | 0) >>> 1) - (q << 1) + h >> 1 | 0) < (0 - p | 0) ? 0 - p | 0 : (((m + 1 + n | 0) >>> 1) - (q << 1) + h >> 1 | 0) > (p | 0) ? p : ((m + 1 + n | 0) >>> 1) - (q << 1) + h >> 1) + q;
     h = c[f + 8 >> 2] | 0;
     e = p + 1 | 0;
    } else {
     h = r;
     e = p;
    }
    if ((((j & 255) - n | 0) < 0 ? 0 - ((j & 255) - n) | 0 : (j & 255) - n | 0) >>> 0 < h >>> 0) {
     a[i >> 0] = ((((m + 1 + n | 0) >>> 1) - ((l & 255) << 1) + (j & 255) >> 1 | 0) < (0 - p | 0) ? 0 - p | 0 : (((m + 1 + n | 0) >>> 1) - ((l & 255) << 1) + (j & 255) >> 1 | 0) > (p | 0) ? p : ((m + 1 + n | 0) >>> 1) - ((l & 255) << 1) + (j & 255) >> 1) + (l & 255);
     e = e + 1 | 0;
    }
    s = 0 - e | 0;
    s = (4 - (l & 255) + (n - m << 2) + q >> 3 | 0) < (s | 0) ? s : (4 - (l & 255) + (n - m << 2) + q >> 3 | 0) > (e | 0) ? e : 4 - (l & 255) + (n - m << 2) + q >> 3;
    t = a[6150 + (n - s) >> 0] | 0;
    a[k >> 0] = a[6150 + (s + m) >> 0] | 0;
    a[b >> 0] = t;
   }
   o = o + -1 | 0;
   if (!o) break; else b = b + g | 0;
  }
  return;
 }
 r = 4;
 while (1) {
  i = b + -2 | 0;
  j = b + -1 | 0;
  k = b + 1 | 0;
  l = a[k >> 0] | 0;
  m = d[j >> 0] | 0;
  n = d[b >> 0] | 0;
  e = (m - n | 0) < 0 ? 0 - (m - n) | 0 : m - n | 0;
  h = c[f + 4 >> 2] | 0;
  do if ((e >>> 0 < h >>> 0 ? (s = d[i >> 0] | 0, t = c[f + 8 >> 2] | 0, ((s - m | 0) < 0 ? 0 - (s - m) | 0 : s - m | 0) >>> 0 < t >>> 0) : 0) ? (((l & 255) - n | 0) < 0 ? 0 - ((l & 255) - n) | 0 : (l & 255) - n | 0) >>> 0 < t >>> 0 : 0) {
   o = b + -3 | 0;
   p = b + 2 | 0;
   q = a[p >> 0] | 0;
   if (e >>> 0 < ((h >>> 2) + 2 | 0) >>> 0) {
    e = d[o >> 0] | 0;
    if (((e - m | 0) < 0 ? 0 - (e - m) | 0 : e - m | 0) >>> 0 < t >>> 0) {
     a[j >> 0] = ((l & 255) + 4 + (n + m + s << 1) + e | 0) >>> 3;
     a[i >> 0] = (n + m + s + 2 + e | 0) >>> 2;
     a[o >> 0] = (n + m + s + 4 + (e * 3 | 0) + ((d[b + -4 >> 0] | 0) << 1) | 0) >>> 3;
    } else a[j >> 0] = (m + 2 + (l & 255) + (s << 1) | 0) >>> 2;
    if ((((q & 255) - n | 0) < 0 ? 0 - ((q & 255) - n) | 0 : (q & 255) - n | 0) >>> 0 < (c[f + 8 >> 2] | 0) >>> 0) {
     a[b >> 0] = ((n + m + (l & 255) << 1) + 4 + s + (q & 255) | 0) >>> 3;
     a[k >> 0] = (n + m + (l & 255) + 2 + (q & 255) | 0) >>> 2;
     a[p >> 0] = (n + m + (l & 255) + 4 + ((q & 255) * 3 | 0) + ((d[b + 3 >> 0] | 0) << 1) | 0) >>> 3;
     break;
    }
   } else a[j >> 0] = (m + 2 + (l & 255) + (s << 1) | 0) >>> 2;
   a[b >> 0] = (n + 2 + ((l & 255) << 1) + s | 0) >>> 2;
  } while (0);
  r = r + -1 | 0;
  if (!r) break; else b = b + g | 0;
 }
 return;
}

function Ua(b, e, f, g, h, j, k, l, m) {
 b = b | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 j = j | 0;
 k = k | 0;
 l = l | 0;
 m = m | 0;
 var n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0;
 u = i;
 i = i + 1792 | 0;
 if (((f | 0) >= 0 ? !((g | 0) < 0 | (f + 5 + k | 0) >>> 0 > h >>> 0) : 0) ? (g + 5 + l | 0) >>> 0 <= j >>> 0 : 0) {
  j = h;
  h = l + 5 | 0;
 } else {
  Qa(b, u + 1344 | 0, f, g, h, j, k + 5 | 0, l + 5 | 0, k + 5 | 0);
  b = u + 1344 | 0;
  f = 0;
  g = 0;
  j = k + 5 | 0;
  h = l + 5 | 0;
 }
 if ((h | 0) != 0 ? (t = j - k | 0, (k >>> 2 | 0) != 0) : 0) {
  s = u;
  r = b + ((Z(g, j) | 0) + f) + 5 | 0;
  while (1) {
   b = s;
   f = r;
   g = d[r + -1 >> 0] | 0;
   n = d[r + -2 >> 0] | 0;
   o = d[r + -3 >> 0] | 0;
   p = d[r + -4 >> 0] | 0;
   j = d[r + -5 >> 0] | 0;
   q = k >>> 2;
   while (1) {
    v = g + p | 0;
    w = p;
    p = d[f >> 0] | 0;
    c[b >> 2] = j - v + ((n + o | 0) * 20 | 0) - (v << 2) + p;
    v = p + o | 0;
    j = o;
    o = d[f + 1 >> 0] | 0;
    c[b + 4 >> 2] = ((g + n | 0) * 20 | 0) + w - v - (v << 2) + o;
    v = o + n | 0;
    w = n;
    n = d[f + 2 >> 0] | 0;
    c[b + 8 >> 2] = ((p + g | 0) * 20 | 0) + j - v - (v << 2) + n;
    v = n + g | 0;
    j = d[f + 3 >> 0] | 0;
    c[b + 12 >> 2] = ((o + p | 0) * 20 | 0) + w - v - (v << 2) + j;
    q = q + -1 | 0;
    if (!q) break; else {
     w = g;
     b = b + 16 | 0;
     f = f + 4 | 0;
     g = j;
     j = w;
    }
   }
   h = h + -1 | 0;
   if (!h) break; else {
    s = s + (k >>> 2 << 2 << 2) | 0;
    r = r + (k >>> 2 << 2) + t | 0;
   }
  }
 }
 if (!(l >>> 2)) {
  i = u;
  return;
 }
 j = u + (k << 2) | 0;
 b = u + (k << 2) + ((Z(m + 2 | 0, k) | 0) << 2) | 0;
 f = u + (k << 2) + (k * 5 << 2) | 0;
 q = l >>> 2;
 while (1) {
  if (k) {
   g = e;
   h = j;
   n = b;
   o = f;
   p = k;
   while (1) {
    w = c[o + (0 - k << 1 << 2) >> 2] | 0;
    t = c[o + (0 - k << 2) >> 2] | 0;
    v = c[o + (k << 2) >> 2] | 0;
    s = c[o >> 2] | 0;
    l = c[h + (k << 1 << 2) >> 2] | 0;
    a[g + 48 >> 0] = ((d[6150 + ((c[o + (k << 1 << 2) >> 2] | 0) + 512 - (v + w) - (v + w << 2) + l + ((s + t | 0) * 20 | 0) >> 10) >> 0] | 0) + 1 + (d[6150 + ((c[n + (k << 1 << 2) >> 2] | 0) + 16 >> 5) >> 0] | 0) | 0) >>> 1;
    m = c[h + (k << 2) >> 2] | 0;
    a[g + 32 >> 0] = ((d[6150 + (v + 512 + ((t + w | 0) * 20 | 0) - (l + s) - (l + s << 2) + m >> 10) >> 0] | 0) + 1 + (d[6150 + ((c[n + (k << 2) >> 2] | 0) + 16 >> 5) >> 0] | 0) | 0) >>> 1;
    v = c[h >> 2] | 0;
    a[g + 16 >> 0] = ((d[6150 + (s + 512 + ((l + w | 0) * 20 | 0) - (m + t) - (m + t << 2) + v >> 10) >> 0] | 0) + 1 + (d[6150 + ((c[n >> 2] | 0) + 16 >> 5) >> 0] | 0) | 0) >>> 1;
    a[g >> 0] = ((d[6150 + (t + 512 + ((m + l | 0) * 20 | 0) - (v + w) - (v + w << 2) + (c[h + (0 - k << 2) >> 2] | 0) >> 10) >> 0] | 0) + 1 + (d[6150 + ((c[n + (0 - k << 2) >> 2] | 0) + 16 >> 5) >> 0] | 0) | 0) >>> 1;
    p = p + -1 | 0;
    if (!p) break; else {
     g = g + 1 | 0;
     h = h + 4 | 0;
     n = n + 4 | 0;
     o = o + 4 | 0;
    }
   }
   e = e + k | 0;
   j = j + (k << 2) | 0;
   b = b + (k << 2) | 0;
   f = f + (k << 2) | 0;
  }
  q = q + -1 | 0;
  if (!q) break; else {
   e = e + (64 - k) | 0;
   j = j + (k * 3 << 2) | 0;
   b = b + (k * 3 << 2) | 0;
   f = f + (k * 3 << 2) | 0;
  }
 }
 i = u;
 return;
}

function _a(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0;
 s = i;
 i = i + 16 | 0;
 r = 7;
 do {
  if (r >>> 0 < b >>> 0) {
   h = 0 - r | 0;
   q = r;
   do {
    d = a + (q * 40 | 0) | 0;
    o = c[d >> 2] | 0;
    p = c[d + 4 >> 2] | 0;
    j = c[a + (q * 40 | 0) + 8 >> 2] | 0;
    l = a + (q * 40 | 0) + 12 | 0;
    k = c[l >> 2] | 0;
    l = c[l + 4 >> 2] | 0;
    m = c[a + (q * 40 | 0) + 20 >> 2] | 0;
    n = c[a + (q * 40 | 0) + 24 >> 2] | 0;
    g = a + (q * 40 | 0) + 28 | 0;
    c[s >> 2] = c[g >> 2];
    c[s + 4 >> 2] = c[g + 4 >> 2];
    c[s + 8 >> 2] = c[g + 8 >> 2];
    a : do if (q >>> 0 < r >>> 0) e = q; else {
     b : do if (!m) if (!n) e = q; else {
      e = q;
      while (1) {
       d = a + (e * 40 | 0) | 0;
       if (c[d + (h * 40 | 0) + 20 >> 2] | 0) break b;
       if (c[d + (h * 40 | 0) + 24 >> 2] | 0) break b;
       e = e - r | 0;
       f = a + (e * 40 | 0) | 0;
       g = d + 40 | 0;
       do {
        c[d >> 2] = c[f >> 2];
        d = d + 4 | 0;
        f = f + 4 | 0;
       } while ((d | 0) < (g | 0));
       if (e >>> 0 < r >>> 0) {
        d = a + (e * 40 | 0) | 0;
        break a;
       }
      }
     } else {
      if ((m + -1 | 0) >>> 0 < 2) {
       e = q;
       while (1) {
        d = a + (e * 40 | 0) | 0;
        f = c[d + (h * 40 | 0) + 20 >> 2] | 0;
        do if (f) {
         if ((f + -1 | m + -1) >>> 0 >= 2) if ((f + -1 | 0) >>> 0 < 2) break b; else break;
         f = c[d + (h * 40 | 0) + 8 >> 2] | 0;
         if ((f | 0) > (j | 0)) break b;
         if ((f | 0) >= (j | 0)) break a;
        } while (0);
        e = e - r | 0;
        f = a + (e * 40 | 0) | 0;
        g = d + 40 | 0;
        do {
         c[d >> 2] = c[f >> 2];
         d = d + 4 | 0;
         f = f + 4 | 0;
        } while ((d | 0) < (g | 0));
        if (e >>> 0 < r >>> 0) {
         d = a + (e * 40 | 0) | 0;
         break a;
        }
       }
      } else e = q;
      while (1) {
       d = a + (e * 40 | 0) | 0;
       f = c[d + (h * 40 | 0) + 20 >> 2] | 0;
       do if (f) if ((f + -1 | m + -1) >>> 0 < 2) {
        f = c[d + (h * 40 | 0) + 8 >> 2] | 0;
        if ((f | 0) > (j | 0)) break b;
        if ((f | 0) < (j | 0)) break; else break a;
       } else {
        if ((f + -1 | 0) >>> 0 < 2) break b;
        if ((c[d + (h * 40 | 0) + 8 >> 2] | 0) > (j | 0)) break; else break b;
       } while (0);
       e = e - r | 0;
       f = a + (e * 40 | 0) | 0;
       g = d + 40 | 0;
       do {
        c[d >> 2] = c[f >> 2];
        d = d + 4 | 0;
        f = f + 4 | 0;
       } while ((d | 0) < (g | 0));
       if (e >>> 0 < r >>> 0) {
        d = a + (e * 40 | 0) | 0;
        break a;
       }
      }
     } while (0);
     d = a + (e * 40 | 0) | 0;
    } while (0);
    g = d;
    c[g >> 2] = o;
    c[g + 4 >> 2] = p;
    c[a + (e * 40 | 0) + 8 >> 2] = j;
    p = a + (e * 40 | 0) + 12 | 0;
    c[p >> 2] = k;
    c[p + 4 >> 2] = l;
    c[a + (e * 40 | 0) + 20 >> 2] = m;
    c[a + (e * 40 | 0) + 24 >> 2] = n;
    p = a + (e * 40 | 0) + 28 | 0;
    c[p >> 2] = c[s >> 2];
    c[p + 4 >> 2] = c[s + 4 >> 2];
    c[p + 8 >> 2] = c[s + 8 >> 2];
    q = q + 1 | 0;
   } while ((q | 0) != (b | 0));
  }
  r = r >>> 1;
 } while ((r | 0) != 0);
 i = s;
 return;
}

function lb() {
 var d = 0, e = 0, f = 0, g = 0, h = 0, j = 0;
 j = i;
 i = i + 16 | 0;
 g = ub(3396) | 0;
 if (g) {
  xb(g + 8 | 0, 0, 3388) | 0;
  c[g + 16 >> 2] = 32;
  c[g + 12 >> 2] = 256;
  c[g + 1340 >> 2] = 1;
  f = ub(2112) | 0;
  c[g + 3384 >> 2] = f;
  if (f) {
   c[g >> 2] = 1;
   c[g + 4 >> 2] = 0;
   c[1810] = g;
   c[1811] = 1;
   c[1812] = 1;
   h = 0;
   i = j;
   return h | 0;
  }
  f = 0;
  do {
   e = g + 8 + 20 + (f << 2) | 0;
   d = c[e >> 2] | 0;
   if (d) {
    vb(c[d + 40 >> 2] | 0);
    c[(c[e >> 2] | 0) + 40 >> 2] = 0;
    vb(c[(c[e >> 2] | 0) + 84 >> 2] | 0);
    c[(c[e >> 2] | 0) + 84 >> 2] = 0;
    vb(c[e >> 2] | 0);
    c[e >> 2] = 0;
   }
   f = f + 1 | 0;
  } while ((f | 0) != 32);
  f = 0;
  do {
   d = g + 8 + 148 + (f << 2) | 0;
   e = c[d >> 2] | 0;
   if (e) {
    vb(c[e + 20 >> 2] | 0);
    c[(c[d >> 2] | 0) + 20 >> 2] = 0;
    vb(c[(c[d >> 2] | 0) + 24 >> 2] | 0);
    c[(c[d >> 2] | 0) + 24 >> 2] = 0;
    vb(c[(c[d >> 2] | 0) + 28 >> 2] | 0);
    c[(c[d >> 2] | 0) + 28 >> 2] = 0;
    vb(c[(c[d >> 2] | 0) + 44 >> 2] | 0);
    c[(c[d >> 2] | 0) + 44 >> 2] = 0;
    vb(c[d >> 2] | 0);
    c[d >> 2] = 0;
   }
   f = f + 1 | 0;
  } while ((f | 0) != 256);
  vb(c[g + 3384 >> 2] | 0);
  c[g + 3384 >> 2] = 0;
  vb(c[g + 1220 >> 2] | 0);
  c[g + 1220 >> 2] = 0;
  vb(c[g + 1180 >> 2] | 0);
  c[g + 1180 >> 2] = 0;
  d = c[g + 1228 >> 2] | 0;
  if ((d | 0) != 0 ? (c[g + 1256 >> 2] | 0) != -1 : 0) {
   e = 0;
   do {
    vb(c[d + (e * 40 | 0) + 4 >> 2] | 0);
    d = c[g + 1228 >> 2] | 0;
    c[d + (e * 40 | 0) + 4 >> 2] = 0;
    e = e + 1 | 0;
   } while (e >>> 0 < ((c[g + 1256 >> 2] | 0) + 1 | 0) >>> 0);
  }
  vb(d);
  c[g + 1228 >> 2] = 0;
  vb(c[g + 1232 >> 2] | 0);
  c[g + 1232 >> 2] = 0;
  vb(c[g + 1240 >> 2] | 0);
  vb(g);
 }
 d = c[852] | 0;
 do if (!d) {
  d = a[3466] | 0;
  a[3466] = d + 255 | d;
  d = c[848] | 0;
  if (!(d & 8)) {
   c[850] = 0;
   c[849] = 0;
   e = c[859] | 0;
   c[855] = e;
   c[853] = e;
   d = e + (c[860] | 0) | 0;
   c[852] = d;
   break;
  }
  c[848] = d | 32;
  h = -1;
  i = j;
  return h | 0;
 } else e = c[853] | 0; while (0);
 if ((d - e | 0) >>> 0 < 29) {
  if ((xa[c[3428 >> 2] & 3](3392, 7178, 29) | 0) >>> 0 < 29) {
   h = -1;
   i = j;
   return h | 0;
  }
 } else {
  d = 7178;
  f = e + 29 | 0;
  do {
   a[e >> 0] = a[d >> 0] | 0;
   e = e + 1 | 0;
   d = d + 1 | 0;
  } while ((e | 0) < (f | 0));
  c[853] = (c[853] | 0) + 29;
 }
 e = a[3467] | 0;
 if (e << 24 >> 24 != 10) {
  f = c[853] | 0;
  d = c[852] | 0;
  if (f >>> 0 < d >>> 0) {
   c[853] = f + 1;
   a[f >> 0] = 10;
   h = -1;
   i = j;
   return h | 0;
  }
 } else d = c[852] | 0;
 a[j >> 0] = 10;
 do if (!d) {
  e = b[1733] | 0;
  a[3466] = ((e & 65535) << 24 >> 24) + 255 | (e & 65535) << 24 >> 24;
  d = c[848] | 0;
  if (!(d & 8)) {
   c[850] = 0;
   c[849] = 0;
   f = c[859] | 0;
   c[855] = f;
   c[853] = f;
   d = f + (c[860] | 0) | 0;
   c[852] = d;
   e = (e & 65535) >>> 8 & 255;
   h = 32;
   break;
  } else {
   c[848] = d | 32;
   break;
  }
 } else {
  f = c[853] | 0;
  h = 32;
 } while (0);
 do if ((h | 0) == 32) if (f >>> 0 >= d >>> 0 | e << 24 >> 24 == 10) {
  xa[c[3428 >> 2] & 3](3392, j, 1) | 0;
  break;
 } else {
  c[853] = f + 1;
  a[f >> 0] = 10;
  break;
 } while (0);
 h = -1;
 i = j;
 return h | 0;
}

function Ta(b, c, e, f, g, h, j, k, l) {
 b = b | 0;
 c = c | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 j = j | 0;
 k = k | 0;
 l = l | 0;
 var m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0;
 u = i;
 i = i + 448 | 0;
 if (((e | 0) >= 0 ? !((f | 0) < 0 | (e + 5 + j | 0) >>> 0 > g >>> 0) : 0) ? (f + 5 + k | 0) >>> 0 <= h >>> 0 : 0) h = e; else {
  Qa(b, u, e, f, g, h, j + 5 | 0, k + 5 | 0, j + 5 | 0);
  b = u;
  h = 0;
  f = 0;
  g = j + 5 | 0;
 }
 f = b + ((Z(f, g) | 0) + h) | 0;
 t = f + g + 2 + (l & 1) | 0;
 if (!k) {
  i = u;
  return;
 }
 s = g - j | 0;
 if (!(j >>> 2)) f = Z(k + -1 | 0, 16 - j | 0) | 0; else {
  r = c;
  b = f + (Z(g, l >>> 1 & 1 | 2) | 0) + 5 | 0;
  q = k;
  while (1) {
   h = r;
   e = b;
   l = d[b + -1 >> 0] | 0;
   m = d[b + -2 >> 0] | 0;
   n = d[b + -3 >> 0] | 0;
   o = d[b + -4 >> 0] | 0;
   f = d[b + -5 >> 0] | 0;
   p = j >>> 2;
   while (1) {
    v = l + o | 0;
    w = o;
    o = d[e >> 0] | 0;
    a[h >> 0] = a[6150 + (f + 16 - v + ((m + n | 0) * 20 | 0) - (v << 2) + o >> 5) >> 0] | 0;
    v = o + n | 0;
    f = n;
    n = d[e + 1 >> 0] | 0;
    a[h + 1 >> 0] = a[6150 + (w + 16 + ((l + m | 0) * 20 | 0) - v - (v << 2) + n >> 5) >> 0] | 0;
    v = n + m | 0;
    w = m;
    m = d[e + 2 >> 0] | 0;
    a[h + 2 >> 0] = a[6150 + (f + 16 + ((o + l | 0) * 20 | 0) - v - (v << 2) + m >> 5) >> 0] | 0;
    v = m + l | 0;
    f = d[e + 3 >> 0] | 0;
    a[h + 3 >> 0] = a[6150 + (w + 16 + ((n + o | 0) * 20 | 0) - v - (v << 2) + f >> 5) >> 0] | 0;
    p = p + -1 | 0;
    if (!p) break; else {
     w = l;
     h = h + 4 | 0;
     e = e + 4 | 0;
     l = f;
     f = w;
    }
   }
   q = q + -1 | 0;
   if (!q) break; else {
    r = r + (j >>> 2 << 2) + (16 - j) | 0;
    b = b + (j >>> 2 << 2) + s | 0;
   }
  }
  f = (Z(16 - j + (j >>> 2 << 2) | 0, k + -1 | 0) | 0) + (j >>> 2 << 2) | 0;
 }
 if (!(k >>> 2)) {
  i = u;
  return;
 }
 p = (g << 2) - j | 0;
 q = 0 - g | 0;
 r = g << 1;
 f = c + (16 - j + f) + (0 - (k << 4)) | 0;
 h = t;
 b = t + (g * 5 | 0) | 0;
 o = k >>> 2;
 while (1) {
  if (j) {
   e = f;
   l = h;
   m = b;
   n = j;
   while (1) {
    w = d[m + (q << 1) >> 0] | 0;
    t = d[m + q >> 0] | 0;
    s = d[m + g >> 0] | 0;
    x = d[m >> 0] | 0;
    k = d[l + r >> 0] | 0;
    c = e + 48 | 0;
    a[c >> 0] = ((d[6150 + ((d[m + r >> 0] | 0) + 16 - (s + w) - (s + w << 2) + k + ((x + t | 0) * 20 | 0) >> 5) >> 0] | 0) + 1 + (d[c >> 0] | 0) | 0) >>> 1;
    c = d[l + g >> 0] | 0;
    v = e + 32 | 0;
    a[v >> 0] = ((d[6150 + (s + 16 + ((t + w | 0) * 20 | 0) - (k + x) - (k + x << 2) + c >> 5) >> 0] | 0) + 1 + (d[v >> 0] | 0) | 0) >>> 1;
    v = d[l >> 0] | 0;
    s = e + 16 | 0;
    a[s >> 0] = ((d[6150 + (x + 16 + ((k + w | 0) * 20 | 0) - (c + t) - (c + t << 2) + v >> 5) >> 0] | 0) + 1 + (d[s >> 0] | 0) | 0) >>> 1;
    a[e >> 0] = ((d[6150 + (t + 16 + ((c + k | 0) * 20 | 0) - (v + w) - (v + w << 2) + (d[l + q >> 0] | 0) >> 5) >> 0] | 0) + 1 + (d[e >> 0] | 0) | 0) >>> 1;
    n = n + -1 | 0;
    if (!n) break; else {
     e = e + 1 | 0;
     l = l + 1 | 0;
     m = m + 1 | 0;
    }
   }
   f = f + j | 0;
   h = h + j | 0;
   b = b + j | 0;
  }
  o = o + -1 | 0;
  if (!o) break; else {
   f = f + (64 - j) | 0;
   h = h + p | 0;
   b = b + p | 0;
  }
 }
 i = u;
 return;
}

function Va(b, e, f, g, h, j, k, l, m) {
 b = b | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 j = j | 0;
 k = k | 0;
 l = l | 0;
 m = m | 0;
 var n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0;
 u = i;
 i = i + 1792 | 0;
 if (((f | 0) >= 0 ? !((g | 0) < 0 | (f + 5 + k | 0) >>> 0 > h >>> 0) : 0) ? (g + 5 + l | 0) >>> 0 <= j >>> 0 : 0) j = f; else {
  Qa(b, u + 1344 | 0, f, g, h, j, k + 5 | 0, l + 5 | 0, k + 5 | 0);
  b = u + 1344 | 0;
  j = 0;
  g = 0;
  h = k + 5 | 0;
 }
 g = b + ((Z(g, h) | 0) + j) + h | 0;
 if ((l >>> 2 | 0) != 0 ? (r = (h << 2) - k + -5 | 0, s = 0 - h | 0, t = h << 1, (k + 5 | 0) != 0) : 0) {
  p = u + (k + 5 << 2) | 0;
  q = g;
  b = g + (h * 5 | 0) | 0;
  o = l >>> 2;
  while (1) {
   g = p;
   j = q;
   f = b;
   n = k + 5 | 0;
   while (1) {
    v = d[f + (s << 1) >> 0] | 0;
    x = d[f + s >> 0] | 0;
    w = d[f + h >> 0] | 0;
    A = d[f >> 0] | 0;
    y = d[j + t >> 0] | 0;
    c[g + (k + 5 << 1 << 2) >> 2] = (d[f + t >> 0] | 0) - (w + v) - (w + v << 2) + y + ((A + x | 0) * 20 | 0);
    z = d[j + h >> 0] | 0;
    c[g + (k + 5 << 2) >> 2] = ((x + v | 0) * 20 | 0) + w - (y + A) - (y + A << 2) + z;
    w = d[j >> 0] | 0;
    c[g >> 2] = ((y + v | 0) * 20 | 0) + A - (z + x) - (z + x << 2) + w;
    c[g + (-5 - k << 2) >> 2] = ((z + y | 0) * 20 | 0) + x - (w + v) - (w + v << 2) + (d[j + s >> 0] | 0);
    n = n + -1 | 0;
    if (!n) break; else {
     g = g + 4 | 0;
     j = j + 1 | 0;
     f = f + 1 | 0;
    }
   }
   o = o + -1 | 0;
   if (!o) break; else {
    p = p + (k + 5 << 2) + ((k + 5 | 0) * 3 << 2) | 0;
    q = q + (k + 5) + r | 0;
    b = b + (k + 5) + r | 0;
   }
  }
 }
 if (!l) {
  i = u;
  return;
 }
 g = u + 8 + (m << 2) | 0;
 j = u + 20 | 0;
 while (1) {
  if (k >>> 2) {
   f = e;
   h = g;
   n = j;
   o = c[j + -4 >> 2] | 0;
   p = c[j + -8 >> 2] | 0;
   q = c[j + -12 >> 2] | 0;
   r = c[j + -16 >> 2] | 0;
   b = c[j + -20 >> 2] | 0;
   s = k >>> 2;
   while (1) {
    A = o + r | 0;
    z = r;
    r = c[n >> 2] | 0;
    a[f >> 0] = ((d[6150 + (b + 512 - A + ((p + q | 0) * 20 | 0) - (A << 2) + r >> 10) >> 0] | 0) + 1 + (d[6150 + ((c[h >> 2] | 0) + 16 >> 5) >> 0] | 0) | 0) >>> 1;
    A = r + q | 0;
    b = q;
    q = c[n + 4 >> 2] | 0;
    a[f + 1 >> 0] = ((d[6150 + (z + 512 + ((o + p | 0) * 20 | 0) - A - (A << 2) + q >> 10) >> 0] | 0) + 1 + (d[6150 + ((c[h + 4 >> 2] | 0) + 16 >> 5) >> 0] | 0) | 0) >>> 1;
    A = q + p | 0;
    z = p;
    p = c[n + 8 >> 2] | 0;
    a[f + 2 >> 0] = ((d[6150 + (b + 512 + ((r + o | 0) * 20 | 0) - A - (A << 2) + p >> 10) >> 0] | 0) + 1 + (d[6150 + ((c[h + 8 >> 2] | 0) + 16 >> 5) >> 0] | 0) | 0) >>> 1;
    A = p + o | 0;
    b = c[n + 12 >> 2] | 0;
    a[f + 3 >> 0] = ((d[6150 + (z + 512 + ((q + r | 0) * 20 | 0) - A - (A << 2) + b >> 10) >> 0] | 0) + 1 + (d[6150 + ((c[h + 12 >> 2] | 0) + 16 >> 5) >> 0] | 0) | 0) >>> 1;
    s = s + -1 | 0;
    if (!s) break; else {
     A = o;
     f = f + 4 | 0;
     h = h + 16 | 0;
     n = n + 16 | 0;
     o = b;
     b = A;
    }
   }
   e = e + (k >>> 2 << 2) | 0;
   g = g + (k >>> 2 << 2 << 2) | 0;
   j = j + (k >>> 2 << 2 << 2) | 0;
  }
  l = l + -1 | 0;
  if (!l) break; else {
   e = e + (16 - k) | 0;
   g = g + 20 | 0;
   j = j + 20 | 0;
  }
 }
 i = u;
 return;
}

function fb(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0;
 l = c[b + 4 >> 2] | 0;
 m = c[b + 8 >> 2] | 0;
 switch (d | 0) {
 case 0:
 case 5:
  {
   e = 3;
   break;
  }
 default:
  if (!(c[a + 3384 >> 2] | 0)) k = 0; else e = 3;
 }
 if ((e | 0) == 3) {
  f = c[a + 1224 >> 2] | 0;
  g = 0;
  do {
   e = c[f + (g << 2) >> 2] | 0;
   if ((e | 0) != 0 ? (c[e + 20 >> 2] | 0) >>> 0 > 1 : 0) e = c[e >> 2] | 0; else e = 0;
   g = g + 1 | 0;
  } while (g >>> 0 < 16 & (e | 0) == 0);
  k = e;
 }
 j = c[a + 1176 >> 2] | 0;
 a : do if (!j) {
  i = 0;
  f = 0;
  e = 0;
 } else {
  h = c[a + 1212 >> 2] | 0;
  f = 0;
  g = 0;
  e = 0;
  while (1) {
   if (c[h + (g * 216 | 0) + 196 >> 2] | 0) {
    i = f;
    f = g;
    break a;
   }
   g = g + 1 | 0;
   f = f + 1 | 0;
   e = ((f | 0) == (l | 0) & 1) + e | 0;
   f = (f | 0) == (l | 0) ? 0 : f;
   if (g >>> 0 >= j >>> 0) {
    i = f;
    f = g;
    break;
   }
  }
 } while (0);
 if ((f | 0) == (j | 0)) {
  switch (d | 0) {
  case 2:
  case 7:
   {
    if ((k | 0) == 0 | (c[a + 3384 >> 2] | 0) == 0) e = 16; else e = 17;
    break;
   }
  default:
   if (!k) e = 16; else e = 17;
  }
  if ((e | 0) == 16) xb(c[b >> 2] | 0, -128, Z(l * 384 | 0, m) | 0) | 0; else if ((e | 0) == 17) yb(c[b >> 2] | 0, k | 0, Z(l * 384 | 0, m) | 0) | 0;
  g = c[a + 1176 >> 2] | 0;
  c[a + 1204 >> 2] = g;
  if (!g) return;
  e = c[a + 1212 >> 2] | 0;
  f = 0;
  do {
   c[e + (f * 216 | 0) + 8 >> 2] = 1;
   f = f + 1 | 0;
  } while ((f | 0) != (g | 0));
  return;
 }
 h = (c[a + 1212 >> 2] | 0) + ((Z(e, l) | 0) * 216 | 0) | 0;
 if (i) {
  f = i;
  do {
   f = f + -1 | 0;
   j = h + (f * 216 | 0) | 0;
   gb(j, b, e, f, d, k);
   c[j + 196 >> 2] = 1;
   c[a + 1204 >> 2] = (c[a + 1204 >> 2] | 0) + 1;
  } while ((f | 0) != 0);
 }
 f = i + 1 | 0;
 if (f >>> 0 < l >>> 0) do {
  g = h + (f * 216 | 0) | 0;
  if (!(c[g + 196 >> 2] | 0)) {
   gb(g, b, e, f, d, k);
   c[g + 196 >> 2] = 1;
   c[a + 1204 >> 2] = (c[a + 1204 >> 2] | 0) + 1;
  }
  f = f + 1 | 0;
 } while ((f | 0) != (l | 0));
 if (e) {
  if (l) {
   f = e + -1 | 0;
   g = Z(f, l) | 0;
   i = 0;
   do {
    h = f;
    j = (c[a + 1212 >> 2] | 0) + (g * 216 | 0) + (i * 216 | 0) | 0;
    while (1) {
     gb(j, b, h, i, d, k);
     c[j + 196 >> 2] = 1;
     c[a + 1204 >> 2] = (c[a + 1204 >> 2] | 0) + 1;
     if (!h) break; else {
      h = h + -1 | 0;
      j = j + ((0 - l | 0) * 216 | 0) | 0;
     }
    }
    i = i + 1 | 0;
   } while ((i | 0) != (l | 0));
  }
 } else e = 0;
 e = e + 1 | 0;
 if (e >>> 0 >= m >>> 0) return;
 if (!l) return;
 do {
  f = (c[a + 1212 >> 2] | 0) + ((Z(e, l) | 0) * 216 | 0) | 0;
  h = 0;
  do {
   g = f + (h * 216 | 0) | 0;
   if (!(c[g + 196 >> 2] | 0)) {
    gb(g, b, e, h, d, k);
    c[g + 196 >> 2] = 1;
    c[a + 1204 >> 2] = (c[a + 1204 >> 2] | 0) + 1;
   }
   h = h + 1 | 0;
  } while ((h | 0) != (l | 0));
  e = e + 1 | 0;
 } while ((e | 0) != (m | 0));
 return;
}

function Sa(b, c, e, f, g, h, j, k, l) {
 b = b | 0;
 c = c | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 j = j | 0;
 k = k | 0;
 l = l | 0;
 var m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0;
 r = i;
 i = i + 448 | 0;
 if ((e | 0) >= 0 ? !((k + f | 0) >>> 0 > h >>> 0 | ((f | 0) < 0 | (e + 5 + j | 0) >>> 0 > g >>> 0)) : 0) h = g; else {
  Qa(b, r, e, f, g, h, j + 5 | 0, k, j + 5 | 0);
  b = r;
  e = 0;
  f = 0;
  h = j + 5 | 0;
 }
 if (!k) {
  i = r;
  return;
 }
 q = h - j | 0;
 h = b + ((Z(f, h) | 0) + e) + 5 | 0;
 while (1) {
  b = d[h + -5 >> 0] | 0;
  f = d[h + -4 >> 0] | 0;
  g = d[h + -3 >> 0] | 0;
  m = d[h + -2 >> 0] | 0;
  e = d[h + -1 >> 0] | 0;
  do if (j >>> 2) {
   p = c + (j >>> 2 << 2) | 0;
   if (!l) {
    o = h;
    n = e;
    e = j >>> 2;
    while (1) {
     s = n + f | 0;
     t = f;
     f = d[o >> 0] | 0;
     a[c >> 0] = (g + 1 + (d[6150 + (b + 16 - s + ((m + g | 0) * 20 | 0) - (s << 2) + f >> 5) >> 0] | 0) | 0) >>> 1;
     s = f + g | 0;
     b = g;
     g = d[o + 1 >> 0] | 0;
     a[c + 1 >> 0] = (m + 1 + (d[6150 + (t + 16 + ((n + m | 0) * 20 | 0) - s - (s << 2) + g >> 5) >> 0] | 0) | 0) >>> 1;
     s = g + m | 0;
     t = m;
     m = d[o + 2 >> 0] | 0;
     a[c + 2 >> 0] = (n + 1 + (d[6150 + (b + 16 + ((f + n | 0) * 20 | 0) - s - (s << 2) + m >> 5) >> 0] | 0) | 0) >>> 1;
     s = m + n | 0;
     b = d[o + 3 >> 0] | 0;
     a[c + 3 >> 0] = (f + 1 + (d[6150 + (t + 16 + ((g + f | 0) * 20 | 0) - s - (s << 2) + b >> 5) >> 0] | 0) | 0) >>> 1;
     e = e + -1 | 0;
     if (!e) break; else {
      t = n;
      c = c + 4 | 0;
      o = o + 4 | 0;
      n = b;
      b = t;
     }
    }
    c = p;
    h = h + (j >>> 2 << 2) | 0;
    break;
   } else {
    o = h;
    n = e;
    e = j >>> 2;
    while (1) {
     t = n + f | 0;
     s = f;
     f = d[o >> 0] | 0;
     a[c >> 0] = (m + 1 + (d[6150 + (b + 16 - t + ((m + g | 0) * 20 | 0) - (t << 2) + f >> 5) >> 0] | 0) | 0) >>> 1;
     t = f + g | 0;
     b = g;
     g = d[o + 1 >> 0] | 0;
     a[c + 1 >> 0] = (n + 1 + (d[6150 + (s + 16 + ((n + m | 0) * 20 | 0) - t - (t << 2) + g >> 5) >> 0] | 0) | 0) >>> 1;
     t = g + m | 0;
     s = m;
     m = d[o + 2 >> 0] | 0;
     a[c + 2 >> 0] = (f + 1 + (d[6150 + (b + 16 + ((f + n | 0) * 20 | 0) - t - (t << 2) + m >> 5) >> 0] | 0) | 0) >>> 1;
     t = m + n | 0;
     b = d[o + 3 >> 0] | 0;
     a[c + 3 >> 0] = (g + 1 + (d[6150 + (s + 16 + ((g + f | 0) * 20 | 0) - t - (t << 2) + b >> 5) >> 0] | 0) | 0) >>> 1;
     e = e + -1 | 0;
     if (!e) break; else {
      t = n;
      c = c + 4 | 0;
      o = o + 4 | 0;
      n = b;
      b = t;
     }
    }
    c = p;
    h = h + (j >>> 2 << 2) | 0;
    break;
   }
  } while (0);
  k = k + -1 | 0;
  if (!k) break; else {
   c = c + (16 - j) | 0;
   h = h + q | 0;
  }
 }
 i = r;
 return;
}

function $a(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0;
 e = c[a + 4 >> 2] | 0;
 f = c[a + 16 >> 2] | 0;
 g = c[a + 20 >> 2] | 0;
 h = 16;
 a = c[a + 12 >> 2] | 0;
 d = b;
 while (1) {
  i = c[d + 4 >> 2] | 0;
  c[a >> 2] = c[d >> 2];
  c[a + 4 >> 2] = i;
  i = c[d + 12 >> 2] | 0;
  c[a + 8 >> 2] = c[d + 8 >> 2];
  c[a + 12 >> 2] = i;
  h = h + -1 | 0;
  if (!h) break; else {
   a = a + 16 + ((e << 2) + -4 << 2) | 0;
   d = d + 16 | 0;
  }
 }
 i = c[b + 260 >> 2] | 0;
 c[f >> 2] = c[b + 256 >> 2];
 c[f + 4 >> 2] = i;
 i = f + 8 + ((e << 1 & 2147483646) + -2 << 2) | 0;
 h = c[b + 268 >> 2] | 0;
 c[i >> 2] = c[b + 264 >> 2];
 c[i + 4 >> 2] = h;
 i = i + 8 + ((e << 1 & 2147483646) + -2 << 2) | 0;
 h = c[b + 276 >> 2] | 0;
 c[i >> 2] = c[b + 272 >> 2];
 c[i + 4 >> 2] = h;
 i = i + 8 + ((e << 1 & 2147483646) + -2 << 2) | 0;
 h = c[b + 284 >> 2] | 0;
 c[i >> 2] = c[b + 280 >> 2];
 c[i + 4 >> 2] = h;
 i = i + 8 + ((e << 1 & 2147483646) + -2 << 2) | 0;
 h = c[b + 292 >> 2] | 0;
 c[i >> 2] = c[b + 288 >> 2];
 c[i + 4 >> 2] = h;
 i = i + 8 + ((e << 1 & 2147483646) + -2 << 2) | 0;
 h = c[b + 300 >> 2] | 0;
 c[i >> 2] = c[b + 296 >> 2];
 c[i + 4 >> 2] = h;
 i = i + 8 + ((e << 1 & 2147483646) + -2 << 2) | 0;
 h = c[b + 308 >> 2] | 0;
 c[i >> 2] = c[b + 304 >> 2];
 c[i + 4 >> 2] = h;
 h = c[b + 316 >> 2] | 0;
 c[i + 8 + ((e << 1 & 2147483646) + -2 << 2) >> 2] = c[b + 312 >> 2];
 c[i + 8 + ((e << 1 & 2147483646) + -2 << 2) + 4 >> 2] = h;
 i = c[b + 324 >> 2] | 0;
 c[g >> 2] = c[b + 320 >> 2];
 c[g + 4 >> 2] = i;
 i = g + 8 + ((e << 1 & 2147483646) + -2 << 2) | 0;
 h = c[b + 332 >> 2] | 0;
 c[i >> 2] = c[b + 328 >> 2];
 c[i + 4 >> 2] = h;
 i = i + 8 + ((e << 1 & 2147483646) + -2 << 2) | 0;
 h = c[b + 340 >> 2] | 0;
 c[i >> 2] = c[b + 336 >> 2];
 c[i + 4 >> 2] = h;
 i = i + 8 + ((e << 1 & 2147483646) + -2 << 2) | 0;
 h = c[b + 348 >> 2] | 0;
 c[i >> 2] = c[b + 344 >> 2];
 c[i + 4 >> 2] = h;
 i = i + 8 + ((e << 1 & 2147483646) + -2 << 2) | 0;
 h = c[b + 356 >> 2] | 0;
 c[i >> 2] = c[b + 352 >> 2];
 c[i + 4 >> 2] = h;
 i = i + 8 + ((e << 1 & 2147483646) + -2 << 2) | 0;
 h = c[b + 364 >> 2] | 0;
 c[i >> 2] = c[b + 360 >> 2];
 c[i + 4 >> 2] = h;
 i = i + 8 + ((e << 1 & 2147483646) + -2 << 2) | 0;
 h = c[b + 372 >> 2] | 0;
 c[i >> 2] = c[b + 368 >> 2];
 c[i + 4 >> 2] = h;
 h = c[b + 380 >> 2] | 0;
 c[i + 8 + ((e << 1 & 2147483646) + -2 << 2) >> 2] = c[b + 376 >> 2];
 c[i + 8 + ((e << 1 & 2147483646) + -2 << 2) + 4 >> 2] = h;
 return;
}

function Ra(b, c, e, f, g, h, j, k, l) {
 b = b | 0;
 c = c | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 j = j | 0;
 k = k | 0;
 l = l | 0;
 var m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0;
 s = i;
 i = i + 448 | 0;
 if (((e | 0) >= 0 ? !((f | 0) < 0 | (j + e | 0) >>> 0 > g >>> 0) : 0) ? (f + 5 + k | 0) >>> 0 <= h >>> 0 : 0) h = e; else {
  Qa(b, s, e, f, g, h, j, k + 5 | 0, j);
  b = s;
  h = 0;
  f = 0;
  g = j;
 }
 h = b + ((Z(f, g) | 0) + h) + g | 0;
 if (!(k >>> 2)) {
  i = s;
  return;
 }
 p = (g << 2) - j | 0;
 q = 0 - g | 0;
 r = g << 1;
 f = c;
 o = k >>> 2;
 n = h;
 b = h + (Z(g, l + 2 | 0) | 0) | 0;
 e = h + (g * 5 | 0) | 0;
 while (1) {
  if (!j) h = n; else {
   h = f;
   c = j;
   k = n;
   l = b;
   m = e;
   while (1) {
    t = d[m + (q << 1) >> 0] | 0;
    x = d[m + q >> 0] | 0;
    u = d[m + g >> 0] | 0;
    y = d[m >> 0] | 0;
    v = d[k + r >> 0] | 0;
    a[h + 48 >> 0] = ((d[6150 + ((d[m + r >> 0] | 0) + 16 - (u + t) - (u + t << 2) + v + ((y + x | 0) * 20 | 0) >> 5) >> 0] | 0) + 1 + (d[l + r >> 0] | 0) | 0) >>> 1;
    w = d[k + g >> 0] | 0;
    a[h + 32 >> 0] = ((d[6150 + (u + 16 + ((x + t | 0) * 20 | 0) - (v + y) - (v + y << 2) + w >> 5) >> 0] | 0) + 1 + (d[l + g >> 0] | 0) | 0) >>> 1;
    u = d[k >> 0] | 0;
    a[h + 16 >> 0] = ((d[6150 + (y + 16 + ((v + t | 0) * 20 | 0) - (w + x) - (w + x << 2) + u >> 5) >> 0] | 0) + 1 + (d[l >> 0] | 0) | 0) >>> 1;
    a[h >> 0] = ((d[6150 + (x + 16 + ((w + v | 0) * 20 | 0) - (u + t) - (u + t << 2) + (d[k + q >> 0] | 0) >> 5) >> 0] | 0) + 1 + (d[l + q >> 0] | 0) | 0) >>> 1;
    c = c + -1 | 0;
    if (!c) break; else {
     h = h + 1 | 0;
     k = k + 1 | 0;
     l = l + 1 | 0;
     m = m + 1 | 0;
    }
   }
   f = f + j | 0;
   h = n + j | 0;
   b = b + j | 0;
   e = e + j | 0;
  }
  o = o + -1 | 0;
  if (!o) break; else {
   f = f + (64 - j) | 0;
   n = h + p | 0;
   b = b + p | 0;
   e = e + p | 0;
  }
 }
 i = s;
 return;
}

function cb(b, e, f, g) {
 b = b | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 var h = 0, i = 0, j = 0, k = 0, l = 0;
 j = a[b + 1 >> 0] | 0;
 k = d[b + -1 >> 0] | 0;
 l = d[b >> 0] | 0;
 do if ((((k - l | 0) < 0 ? 0 - (k - l) | 0 : k - l | 0) >>> 0 < (c[f + 4 >> 2] | 0) >>> 0 ? (h = d[b + -2 >> 0] | 0, i = c[f + 8 >> 2] | 0, ((h - k | 0) < 0 ? 0 - (h - k) | 0 : h - k | 0) >>> 0 < i >>> 0) : 0) ? (((j & 255) - l | 0) < 0 ? 0 - ((j & 255) - l) | 0 : (j & 255) - l | 0) >>> 0 < i >>> 0 : 0) if (e >>> 0 < 4) {
  i = d[(c[f >> 2] | 0) + (e + -1) >> 0] | 0;
  j = (4 - (j & 255) + (l - k << 2) + h >> 3 | 0) < (~i | 0) ? ~i : (4 - (j & 255) + (l - k << 2) + h >> 3 | 0) > (i + 1 | 0) ? i + 1 | 0 : 4 - (j & 255) + (l - k << 2) + h >> 3;
  l = a[6150 + (l - j) >> 0] | 0;
  a[b + -1 >> 0] = a[6150 + (j + k) >> 0] | 0;
  a[b >> 0] = l;
  break;
 } else {
  a[b + -1 >> 0] = (k + 2 + (j & 255) + (h << 1) | 0) >>> 2;
  a[b >> 0] = (l + 2 + ((j & 255) << 1) + h | 0) >>> 2;
  break;
 } while (0);
 h = d[b + g + -1 >> 0] | 0;
 i = d[b + g >> 0] | 0;
 if (((h - i | 0) < 0 ? 0 - (h - i) | 0 : h - i | 0) >>> 0 >= (c[f + 4 >> 2] | 0) >>> 0) return;
 j = d[b + g + -2 >> 0] | 0;
 k = c[f + 8 >> 2] | 0;
 if (((j - h | 0) < 0 ? 0 - (j - h) | 0 : j - h | 0) >>> 0 >= k >>> 0) return;
 l = d[b + g + 1 >> 0] | 0;
 if (((l - i | 0) < 0 ? 0 - (l - i) | 0 : l - i | 0) >>> 0 >= k >>> 0) return;
 if (e >>> 0 < 4) {
  e = d[(c[f >> 2] | 0) + (e + -1) >> 0] | 0;
  e = (4 - l + (i - h << 2) + j >> 3 | 0) < (~e | 0) ? ~e : (4 - l + (i - h << 2) + j >> 3 | 0) > (e + 1 | 0) ? e + 1 | 0 : 4 - l + (i - h << 2) + j >> 3;
  f = a[6150 + (i - e) >> 0] | 0;
  a[b + g + -1 >> 0] = a[6150 + (e + h) >> 0] | 0;
  a[b + g >> 0] = f;
  return;
 } else {
  a[b + g + -1 >> 0] = (h + 2 + l + (j << 1) | 0) >>> 2;
  a[b + g >> 0] = (i + 2 + (l << 1) + j | 0) >>> 2;
  return;
 }
}

function bb(b, e, f, g) {
 b = b | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 var h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0, q = 0, r = 0, s = 0;
 p = d[(c[f >> 2] | 0) + (e + -1) >> 0] | 0;
 q = Z(g, -3) | 0;
 o = 4;
 while (1) {
  e = b + (0 - g << 1) | 0;
  k = b + (0 - g) | 0;
  j = b + g | 0;
  l = a[j >> 0] | 0;
  m = d[k >> 0] | 0;
  n = d[b >> 0] | 0;
  if ((((m - n | 0) < 0 ? 0 - (m - n) | 0 : m - n | 0) >>> 0 < (c[f + 4 >> 2] | 0) >>> 0 ? (r = d[e >> 0] | 0, s = c[f + 8 >> 2] | 0, ((r - m | 0) < 0 ? 0 - (r - m) | 0 : r - m | 0) >>> 0 < s >>> 0) : 0) ? (((l & 255) - n | 0) < 0 ? 0 - ((l & 255) - n) | 0 : (l & 255) - n | 0) >>> 0 < s >>> 0 : 0) {
   h = d[b + q >> 0] | 0;
   if (((h - m | 0) < 0 ? 0 - (h - m) | 0 : h - m | 0) >>> 0 < s >>> 0) {
    a[e >> 0] = ((((m + 1 + n | 0) >>> 1) - (r << 1) + h >> 1 | 0) < (0 - p | 0) ? 0 - p | 0 : (((m + 1 + n | 0) >>> 1) - (r << 1) + h >> 1 | 0) > (p | 0) ? p : ((m + 1 + n | 0) >>> 1) - (r << 1) + h >> 1) + r;
    i = c[f + 8 >> 2] | 0;
    e = p + 1 | 0;
   } else {
    i = s;
    e = p;
   }
   h = d[b + (g << 1) >> 0] | 0;
   if (((h - n | 0) < 0 ? 0 - (h - n) | 0 : h - n | 0) >>> 0 < i >>> 0) {
    a[j >> 0] = ((((m + 1 + n | 0) >>> 1) - ((l & 255) << 1) + h >> 1 | 0) < (0 - p | 0) ? 0 - p | 0 : (((m + 1 + n | 0) >>> 1) - ((l & 255) << 1) + h >> 1 | 0) > (p | 0) ? p : ((m + 1 + n | 0) >>> 1) - ((l & 255) << 1) + h >> 1) + (l & 255);
    e = e + 1 | 0;
   }
   j = 0 - e | 0;
   l = (4 - (l & 255) + (n - m << 2) + r >> 3 | 0) < (j | 0) ? j : (4 - (l & 255) + (n - m << 2) + r >> 3 | 0) > (e | 0) ? e : 4 - (l & 255) + (n - m << 2) + r >> 3;
   n = a[6150 + (n - l) >> 0] | 0;
   a[k >> 0] = a[6150 + (l + m) >> 0] | 0;
   a[b >> 0] = n;
  }
  o = o + -1 | 0;
  if (!o) break; else b = b + 1 | 0;
 }
 return;
}

function rb(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0, g = 0, h = 0, j = 0, k = 0;
 k = i;
 i = i + 48 | 0;
 g = c[a + 28 >> 2] | 0;
 c[k + 32 >> 2] = g;
 g = (c[a + 20 >> 2] | 0) - g | 0;
 c[k + 32 + 4 >> 2] = g;
 c[k + 32 + 8 >> 2] = b;
 c[k + 32 + 12 >> 2] = d;
 j = k + 32 | 0;
 f = 2;
 g = g + d | 0;
 while (1) {
  if (!0) {
   c[k + 16 >> 2] = c[a + 60 >> 2];
   c[k + 16 + 4 >> 2] = j;
   c[k + 16 + 8 >> 2] = f;
   b = ua(146, k + 16 | 0) | 0;
   if (b >>> 0 > 4294963200) {
    if (!0) e = 7320; else e = c[(ia() | 0) + 60 >> 2] | 0;
    c[e >> 2] = 0 - b;
    b = -1;
   }
  } else {
   oa(1, a | 0);
   c[k >> 2] = c[a + 60 >> 2];
   c[k + 4 >> 2] = j;
   c[k + 8 >> 2] = f;
   b = ua(146, k | 0) | 0;
   if (b >>> 0 > 4294963200) {
    if (!0) e = 7320; else e = c[(ia() | 0) + 60 >> 2] | 0;
    c[e >> 2] = 0 - b;
    b = -1;
   }
   ha(0);
  }
  if ((g | 0) == (b | 0)) {
   b = 13;
   break;
  }
  if ((b | 0) < 0) {
   b = 15;
   break;
  }
  g = g - b | 0;
  e = c[j + 4 >> 2] | 0;
  if (b >>> 0 <= e >>> 0) if ((f | 0) == 2) {
   c[a + 28 >> 2] = (c[a + 28 >> 2] | 0) + b;
   h = e;
   e = j;
   f = 2;
  } else {
   h = e;
   e = j;
  } else {
   h = c[a + 44 >> 2] | 0;
   c[a + 28 >> 2] = h;
   c[a + 20 >> 2] = h;
   h = c[j + 12 >> 2] | 0;
   b = b - e | 0;
   e = j + 8 | 0;
   f = f + -1 | 0;
  }
  c[e >> 2] = (c[e >> 2] | 0) + b;
  c[e + 4 >> 2] = h - b;
  j = e;
 }
 if ((b | 0) == 13) {
  j = c[a + 44 >> 2] | 0;
  c[a + 16 >> 2] = j + (c[a + 48 >> 2] | 0);
  c[a + 28 >> 2] = j;
  c[a + 20 >> 2] = j;
 } else if ((b | 0) == 15) {
  c[a + 16 >> 2] = 0;
  c[a + 28 >> 2] = 0;
  c[a + 20 >> 2] = 0;
  c[a >> 2] = c[a >> 2] | 32;
  if ((f | 0) == 2) d = 0; else d = d - (c[j + 4 >> 2] | 0) | 0;
 }
 i = k;
 return d | 0;
}

function Pa(b, e, f) {
 b = b | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0, i = 0, j = 0;
 g = c[e >> 2] | 0;
 if ((g | 0) == 16777215) return;
 h = f >>> 0 < 16 ? 16 : 8;
 i = f >>> 0 < 16 ? f : f & 3;
 b = b + (Z(c[1216 + (i << 2) >> 2] | 0, h) | 0) + (c[1152 + (i << 2) >> 2] | 0) | 0;
 i = c[e + 4 >> 2] | 0;
 j = d[b + 1 >> 0] | 0;
 a[b >> 0] = a[6150 + ((d[b >> 0] | 0) + g) >> 0] | 0;
 f = c[e + 8 >> 2] | 0;
 g = d[b + 2 >> 0] | 0;
 a[b + 1 >> 0] = a[6150 + (j + i) >> 0] | 0;
 i = a[6150 + ((d[b + 3 >> 0] | 0) + (c[e + 12 >> 2] | 0)) >> 0] | 0;
 a[b + 2 >> 0] = a[6150 + (g + f) >> 0] | 0;
 a[b + 3 >> 0] = i;
 i = c[e + 20 >> 2] | 0;
 f = d[b + h + 1 >> 0] | 0;
 a[b + h >> 0] = a[6150 + ((d[b + h >> 0] | 0) + (c[e + 16 >> 2] | 0)) >> 0] | 0;
 g = c[e + 24 >> 2] | 0;
 j = d[b + h + 2 >> 0] | 0;
 a[b + h + 1 >> 0] = a[6150 + (f + i) >> 0] | 0;
 i = a[6150 + ((d[b + h + 3 >> 0] | 0) + (c[e + 28 >> 2] | 0)) >> 0] | 0;
 a[b + h + 2 >> 0] = a[6150 + (j + g) >> 0] | 0;
 a[b + h + 3 >> 0] = i;
 b = b + h + h | 0;
 i = c[e + 36 >> 2] | 0;
 g = d[b + 1 >> 0] | 0;
 a[b >> 0] = a[6150 + ((d[b >> 0] | 0) + (c[e + 32 >> 2] | 0)) >> 0] | 0;
 j = c[e + 40 >> 2] | 0;
 f = d[b + 2 >> 0] | 0;
 a[b + 1 >> 0] = a[6150 + (g + i) >> 0] | 0;
 i = a[6150 + ((d[b + 3 >> 0] | 0) + (c[e + 44 >> 2] | 0)) >> 0] | 0;
 a[b + 2 >> 0] = a[6150 + (f + j) >> 0] | 0;
 a[b + 3 >> 0] = i;
 i = c[e + 52 >> 2] | 0;
 j = d[b + h + 1 >> 0] | 0;
 a[b + h >> 0] = a[6150 + ((d[b + h >> 0] | 0) + (c[e + 48 >> 2] | 0)) >> 0] | 0;
 f = c[e + 56 >> 2] | 0;
 g = d[b + h + 2 >> 0] | 0;
 a[b + h + 1 >> 0] = a[6150 + (j + i) >> 0] | 0;
 e = a[6150 + ((d[b + h + 3 >> 0] | 0) + (c[e + 60 >> 2] | 0)) >> 0] | 0;
 a[b + h + 2 >> 0] = a[6150 + (g + f) >> 0] | 0;
 a[b + h + 3 >> 0] = e;
 return;
}

function db(b, e, f, g) {
 b = b | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 var h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0;
 if (e >>> 0 < 4) {
  l = d[(c[f >> 2] | 0) + (e + -1) >> 0] | 0;
  k = 8;
  while (1) {
   e = b + (0 - g) | 0;
   h = a[b + g >> 0] | 0;
   i = d[e >> 0] | 0;
   j = d[b >> 0] | 0;
   if ((((i - j | 0) < 0 ? 0 - (i - j) | 0 : i - j | 0) >>> 0 < (c[f + 4 >> 2] | 0) >>> 0 ? (n = d[b + (0 - g << 1) >> 0] | 0, o = c[f + 8 >> 2] | 0, ((n - i | 0) < 0 ? 0 - (n - i) | 0 : n - i | 0) >>> 0 < o >>> 0) : 0) ? (((h & 255) - j | 0) < 0 ? 0 - ((h & 255) - j) | 0 : (h & 255) - j | 0) >>> 0 < o >>> 0 : 0) {
    h = (4 - (h & 255) + (j - i << 2) + n >> 3 | 0) < (~l | 0) ? ~l : (4 - (h & 255) + (j - i << 2) + n >> 3 | 0) > (l + 1 | 0) ? l + 1 | 0 : 4 - (h & 255) + (j - i << 2) + n >> 3;
    m = a[6150 + (j - h) >> 0] | 0;
    a[e >> 0] = a[6150 + (h + i) >> 0] | 0;
    a[b >> 0] = m;
   }
   k = k + -1 | 0;
   if (!k) break; else b = b + 1 | 0;
  }
  return;
 } else {
  k = 8;
  while (1) {
   e = b + (0 - g) | 0;
   h = a[b + g >> 0] | 0;
   i = d[e >> 0] | 0;
   j = d[b >> 0] | 0;
   if ((((i - j | 0) < 0 ? 0 - (i - j) | 0 : i - j | 0) >>> 0 < (c[f + 4 >> 2] | 0) >>> 0 ? (l = d[b + (0 - g << 1) >> 0] | 0, m = c[f + 8 >> 2] | 0, ((l - i | 0) < 0 ? 0 - (l - i) | 0 : l - i | 0) >>> 0 < m >>> 0) : 0) ? (((h & 255) - j | 0) < 0 ? 0 - ((h & 255) - j) | 0 : (h & 255) - j | 0) >>> 0 < m >>> 0 : 0) {
    a[e >> 0] = (i + 2 + (h & 255) + (l << 1) | 0) >>> 2;
    a[b >> 0] = (j + 2 + ((h & 255) << 1) + l | 0) >>> 2;
   }
   k = k + -1 | 0;
   if (!k) break; else b = b + 1 | 0;
  }
  return;
 }
}

function hb(a, b) {
 a = a | 0;
 b = b | 0;
 var d = 0, e = 0, f = 0;
 d = Na(a, b) | 0;
 if (d) {
  b = d;
  return b | 0;
 }
 f = (c[b >> 2] | 0) + 1 | 0;
 c[b >> 2] = f;
 if (f >>> 0 > 32) {
  b = 1;
  return b | 0;
 }
 d = Ma(a, 4) | 0;
 if ((d | 0) == -1) {
  b = 1;
  return b | 0;
 }
 c[b + 4 >> 2] = d;
 d = Ma(a, 4) | 0;
 if ((d | 0) == -1) {
  b = 1;
  return b | 0;
 }
 c[b + 8 >> 2] = d;
 a : do if (c[b >> 2] | 0) {
  f = 0;
  while (1) {
   e = b + 12 + (f << 2) | 0;
   d = Na(a, e) | 0;
   if (d) {
    e = 17;
    break;
   }
   d = c[e >> 2] | 0;
   if ((d | 0) == -1) {
    d = 1;
    e = 17;
    break;
   }
   c[e >> 2] = d + 1;
   c[e >> 2] = d + 1 << (c[b + 4 >> 2] | 0) + 6;
   e = b + 140 + (f << 2) | 0;
   d = Na(a, e) | 0;
   if (d) {
    e = 17;
    break;
   }
   d = c[e >> 2] | 0;
   if ((d | 0) == -1) {
    d = 1;
    e = 17;
    break;
   }
   c[e >> 2] = d + 1;
   c[e >> 2] = d + 1 << (c[b + 8 >> 2] | 0) + 4;
   d = Ma(a, 1) | 0;
   if ((d | 0) == -1) {
    d = 1;
    e = 17;
    break;
   }
   c[b + 268 + (f << 2) >> 2] = (d | 0) == 1 & 1;
   f = f + 1 | 0;
   if (f >>> 0 >= (c[b >> 2] | 0) >>> 0) break a;
  }
  if ((e | 0) == 17) return d | 0;
 } while (0);
 d = Ma(a, 5) | 0;
 if ((d | 0) == -1) {
  b = 1;
  return b | 0;
 }
 c[b + 396 >> 2] = d + 1;
 d = Ma(a, 5) | 0;
 if ((d | 0) == -1) {
  b = 1;
  return b | 0;
 }
 c[b + 400 >> 2] = d + 1;
 d = Ma(a, 5) | 0;
 if ((d | 0) == -1) {
  b = 1;
  return b | 0;
 }
 c[b + 404 >> 2] = d + 1;
 d = Ma(a, 5) | 0;
 if ((d | 0) == -1) {
  b = 1;
  return b | 0;
 }
 c[b + 408 >> 2] = d;
 b = 0;
 return b | 0;
}

function eb(b, e, f, g) {
 b = b | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 var h = 0, i = 0, j = 0, k = 0, l = 0, m = 0;
 m = d[(c[f >> 2] | 0) + (e + -1) >> 0] | 0;
 h = a[b + g >> 0] | 0;
 i = d[b + (0 - g) >> 0] | 0;
 j = d[b >> 0] | 0;
 e = c[f + 4 >> 2] | 0;
 if ((((i - j | 0) < 0 ? 0 - (i - j) | 0 : i - j | 0) >>> 0 < e >>> 0 ? (k = d[b + (0 - g << 1) >> 0] | 0, l = c[f + 8 >> 2] | 0, ((k - i | 0) < 0 ? 0 - (k - i) | 0 : k - i | 0) >>> 0 < l >>> 0) : 0) ? (((h & 255) - j | 0) < 0 ? 0 - ((h & 255) - j) | 0 : (h & 255) - j | 0) >>> 0 < l >>> 0 : 0) {
  l = (4 - (h & 255) + (j - i << 2) + k >> 3 | 0) < (~m | 0) ? ~m : (4 - (h & 255) + (j - i << 2) + k >> 3 | 0) > (m + 1 | 0) ? m + 1 | 0 : 4 - (h & 255) + (j - i << 2) + k >> 3;
  e = a[6150 + (j - l) >> 0] | 0;
  a[b + (0 - g) >> 0] = a[6150 + (l + i) >> 0] | 0;
  a[b >> 0] = e;
  e = c[f + 4 >> 2] | 0;
 }
 j = d[b + 1 + (0 - g) >> 0] | 0;
 k = d[b + 1 >> 0] | 0;
 if (((j - k | 0) < 0 ? 0 - (j - k) | 0 : j - k | 0) >>> 0 >= e >>> 0) return;
 i = d[b + 1 + (0 - g << 1) >> 0] | 0;
 e = c[f + 8 >> 2] | 0;
 if (((i - j | 0) < 0 ? 0 - (i - j) | 0 : i - j | 0) >>> 0 >= e >>> 0) return;
 h = d[b + 1 + g >> 0] | 0;
 if (((h - k | 0) < 0 ? 0 - (h - k) | 0 : h - k | 0) >>> 0 >= e >>> 0) return;
 f = (4 - h + (k - j << 2) + i >> 3 | 0) < (~m | 0) ? ~m : (4 - h + (k - j << 2) + i >> 3 | 0) > (m + 1 | 0) ? m + 1 | 0 : 4 - h + (k - j << 2) + i >> 3;
 m = a[6150 + (k - f) >> 0] | 0;
 a[b + 1 + (0 - g) >> 0] = a[6150 + (f + j) >> 0] | 0;
 a[b + 1 >> 0] = m;
 return;
}

function La(d, e, f) {
 d = d | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0, i = 0;
 h = a[384 + (e << 3) + 4 >> 0] | 0;
 i = a[576 + (e << 3) + 4 >> 0] | 0;
 if (11205370 >>> e & 1) {
  g = b[f + ((h & 255) << 1) >> 1] | 0;
  if (13434828 >>> e & 1) {
   d = g + 1 + (b[f + ((i & 255) << 1) >> 1] | 0) >> 1;
   return d | 0;
  }
  e = c[d + 204 >> 2] | 0;
  if (!e) {
   d = g;
   return d | 0;
  }
  if ((c[d + 4 >> 2] | 0) != (c[e + 4 >> 2] | 0)) {
   d = g;
   return d | 0;
  }
  d = g + 1 + (b[e + 28 + ((i & 255) << 1) >> 1] | 0) >> 1;
  return d | 0;
 }
 if (13434828 >>> e & 1) {
  e = b[f + ((i & 255) << 1) >> 1] | 0;
  g = c[d + 200 >> 2] | 0;
  if (!g) {
   d = e;
   return d | 0;
  }
  if ((c[d + 4 >> 2] | 0) != (c[g + 4 >> 2] | 0)) {
   d = e;
   return d | 0;
  }
  d = e + 1 + (b[g + 28 + ((h & 255) << 1) >> 1] | 0) >> 1;
  return d | 0;
 }
 e = c[d + 200 >> 2] | 0;
 if ((e | 0) != 0 ? (c[d + 4 >> 2] | 0) == (c[e + 4 >> 2] | 0) : 0) {
  g = b[e + 28 + ((h & 255) << 1) >> 1] | 0;
  f = 1;
 } else {
  g = 0;
  f = 0;
 }
 e = c[d + 204 >> 2] | 0;
 if (!e) {
  d = g;
  return d | 0;
 }
 if ((c[d + 4 >> 2] | 0) != (c[e + 4 >> 2] | 0)) {
  d = g;
  return d | 0;
 }
 e = b[e + 28 + ((i & 255) << 1) >> 1] | 0;
 if (!f) {
  d = e;
  return d | 0;
 }
 d = g + 1 + e >> 1;
 return d | 0;
}

function Qa(a, b, c, d, e, f, g, h, i) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 h = h | 0;
 i = i | 0;
 var j = 0, k = 0, l = 0, m = 0, n = 0, o = 0;
 o = (c | 0) < 0 | (g + c | 0) > (e | 0) ? 2 : 1;
 n = (h + d | 0) < 0 ? 0 - h | 0 : d;
 l = (g + c | 0) < 0 ? 0 - g | 0 : c;
 n = (n | 0) > (f | 0) ? f : n;
 l = (l | 0) > (e | 0) ? e : l;
 c = (l | 0) > 0 ? a + l | 0 : a;
 m = c + (Z(n, e) | 0) | 0;
 c = (n | 0) > 0 ? m : c;
 m = (l | 0) < 0 ? 0 - l | 0 : 0;
 l = (l + g | 0) > (e | 0) ? l + g - e | 0 : 0;
 j = (n | 0) < 0 ? 0 - n | 0 : 0;
 k = (n + h | 0) > (f | 0) ? n + h - f | 0 : 0;
 if (!j) d = b; else {
  d = b;
  a = 0 - n | 0;
  do {
   ya[o & 3](c, d, m, g - m - l | 0, l);
   d = d + i | 0;
   a = a + -1 | 0;
  } while ((a | 0) != 0);
 }
 if ((h - j | 0) != (k | 0)) {
  a = h - j - k | 0;
  do {
   ya[o & 3](c, d, m, g - m - l | 0, l);
   c = c + e | 0;
   d = d + i | 0;
   a = a + -1 | 0;
  } while ((a | 0) != 0);
 }
 a = c + (0 - e) | 0;
 if (!k) return; else c = n + h - f | 0;
 while (1) {
  ya[o & 3](a, d, m, g - m - l | 0, l);
  c = c + -1 | 0;
  if (!c) break; else d = d + i | 0;
 }
 return;
}

function Ma(a, b) {
 a = a | 0;
 b = b | 0;
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 g = c[a + 4 >> 2] | 0;
 i = c[a + 12 >> 2] << 3;
 j = c[a + 16 >> 2] | 0;
 if ((i - j | 0) > 31) {
  f = c[a + 8 >> 2] | 0;
  e = (d[g + 1 >> 0] | 0) << 16 | (d[g >> 0] | 0) << 24 | (d[g + 2 >> 0] | 0) << 8 | (d[g + 3 >> 0] | 0);
  if (!f) f = a + 8 | 0; else {
   e = (d[g + 4 >> 0] | 0) >>> (8 - f | 0) | e << f;
   f = a + 8 | 0;
  }
 } else if ((i - j | 0) > 0) {
  f = c[a + 8 >> 2] | 0;
  e = (d[g >> 0] | 0) << f + 24;
  if ((i - j + -8 + f | 0) > 0) {
   h = i - j + -8 + f | 0;
   f = f + 24 | 0;
   while (1) {
    g = g + 1 | 0;
    f = f + -8 | 0;
    e = (d[g >> 0] | 0) << f | e;
    if ((h | 0) <= 8) {
     f = a + 8 | 0;
     break;
    } else h = h + -8 | 0;
   }
  } else f = a + 8 | 0;
 } else {
  e = 0;
  f = a + 8 | 0;
 }
 c[a + 16 >> 2] = j + b;
 c[f >> 2] = j + b & 7;
 if ((j + b | 0) >>> 0 > i >>> 0) {
  j = 0;
  a = 32 - b | 0;
  a = e >>> a;
  a = j ? a : -1;
  return a | 0;
 }
 c[a + 4 >> 2] = (c[a >> 2] | 0) + ((j + b | 0) >>> 3);
 j = 1;
 a = 32 - b | 0;
 a = e >>> a;
 a = j ? a : -1;
 return a | 0;
}

function yb(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0;
 if ((e | 0) >= 4096) return pa(b | 0, d | 0, e | 0) | 0;
 f = b | 0;
 if ((b & 3) == (d & 3)) {
  while (b & 3) {
   if (!e) return f | 0;
   a[b >> 0] = a[d >> 0] | 0;
   b = b + 1 | 0;
   d = d + 1 | 0;
   e = e - 1 | 0;
  }
  while ((e | 0) >= 4) {
   c[b >> 2] = c[d >> 2];
   b = b + 4 | 0;
   d = d + 4 | 0;
   e = e - 4 | 0;
  }
 }
 while ((e | 0) > 0) {
  a[b >> 0] = a[d >> 0] | 0;
  b = b + 1 | 0;
  d = d + 1 | 0;
  e = e - 1 | 0;
 }
 return f | 0;
}

function pb(a, b, d) {
 a = a | 0;
 b = b | 0;
 d = d | 0;
 var e = 0, f = 0;
 f = i;
 i = i + 32 | 0;
 c[f >> 2] = c[a + 60 >> 2];
 c[f + 4 >> 2] = 0;
 c[f + 8 >> 2] = b;
 c[f + 12 >> 2] = f + 20;
 c[f + 16 >> 2] = d;
 b = sa(140, f | 0) | 0;
 if (b >>> 0 <= 4294963200) if ((b | 0) < 0) e = 7; else a = c[f + 20 >> 2] | 0; else {
  if (!0) a = 7320; else a = c[(ia() | 0) + 60 >> 2] | 0;
  c[a >> 2] = 0 - b;
  e = 7;
 }
 if ((e | 0) == 7) {
  c[f + 20 >> 2] = -1;
  a = -1;
 }
 i = f;
 return a | 0;
}

function wb() {}
function xb(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0, g = 0, h = 0;
 f = b + e | 0;
 if ((e | 0) >= 20) {
  d = d & 255;
  g = b & 3;
  h = d | d << 8 | d << 16 | d << 24;
  if (g) {
   g = b + 4 - g | 0;
   while ((b | 0) < (g | 0)) {
    a[b >> 0] = d;
    b = b + 1 | 0;
   }
  }
  while ((b | 0) < (f & ~3 | 0)) {
   c[b >> 2] = h;
   b = b + 4 | 0;
  }
 }
 while ((b | 0) < (f | 0)) {
  a[b >> 0] = d;
  b = b + 1 | 0;
 }
 return b - e | 0;
}

function Xa(b, c, d, e, f) {
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0;
 if (d) {
  xb(c | 0, a[b >> 0] | 0, d | 0) | 0;
  c = c + d | 0;
 }
 if (e) {
  d = e;
  g = b;
  h = c;
  while (1) {
   a[h >> 0] = a[g >> 0] | 0;
   d = d + -1 | 0;
   if (!d) break; else {
    g = g + 1 | 0;
    h = h + 1 | 0;
   }
  }
  b = b + e | 0;
  c = c + e | 0;
 }
 if (!f) return;
 xb(c | 0, a[b + -1 >> 0] | 0, f | 0) | 0;
 return;
}

function sb(b, d, e) {
 b = b | 0;
 d = d | 0;
 e = e | 0;
 var f = 0;
 f = i;
 i = i + 80 | 0;
 c[b + 36 >> 2] = 3;
 if ((c[b >> 2] & 64 | 0) == 0 ? (c[f >> 2] = c[b + 60 >> 2], c[f + 4 >> 2] = 21505, c[f + 8 >> 2] = f + 12, (qa(54, f | 0) | 0) != 0) : 0) a[b + 75 >> 0] = -1;
 e = rb(b, d, e) | 0;
 i = f;
 return e | 0;
}

function Ga(b) {
 b = b | 0;
 a[k >> 0] = a[b >> 0];
 a[k + 1 >> 0] = a[b + 1 >> 0];
 a[k + 2 >> 0] = a[b + 2 >> 0];
 a[k + 3 >> 0] = a[b + 3 >> 0];
 a[k + 4 >> 0] = a[b + 4 >> 0];
 a[k + 5 >> 0] = a[b + 5 >> 0];
 a[k + 6 >> 0] = a[b + 6 >> 0];
 a[k + 7 >> 0] = a[b + 7 >> 0];
}

function qb(a) {
 a = a | 0;
 var b = 0, d = 0;
 d = i;
 i = i + 16 | 0;
 c[d >> 2] = c[a + 60 >> 2];
 a = ja(6, d | 0) | 0;
 if (a >>> 0 > 4294963200) {
  if (!0) b = 7320; else b = c[(ia() | 0) + 60 >> 2] | 0;
  c[b >> 2] = 0 - a;
  a = -1;
 }
 i = d;
 return a | 0;
}

function Bb(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 ya[a & 3](b | 0, c | 0, d | 0, e | 0, f | 0);
}

function Fa(b) {
 b = b | 0;
 a[k >> 0] = a[b >> 0];
 a[k + 1 >> 0] = a[b + 1 >> 0];
 a[k + 2 >> 0] = a[b + 2 >> 0];
 a[k + 3 >> 0] = a[b + 3 >> 0];
}
function jb(a) {
 a = a | 0;
 var b = 0;
 b = ub(a) | 0;
 c[1808] = b;
 c[1807] = b;
 c[1806] = a;
 c[1809] = b + a;
 return b | 0;
}

function Ya(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 yb(b | 0, a | 0, d | 0) | 0;
 return;
}

function Ab(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 return xa[a & 3](b | 0, c | 0, d | 0) | 0;
}
function Aa(a) {
 a = a | 0;
 var b = 0;
 b = i;
 i = i + a | 0;
 i = i + 15 & -16;
 return b | 0;
}

function Fb(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 aa(2);
}

function Eb(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 aa(1);
 return 0;
}

function Ea(a, b) {
 a = a | 0;
 b = b | 0;
 if (!m) {
  m = a;
  n = b;
 }
}

function zb(a, b) {
 a = a | 0;
 b = b | 0;
 return wa[a & 1](b | 0) | 0;
}

function Cb(a, b) {
 a = a | 0;
 b = b | 0;
 za[a & 1](b | 0);
}

function Da(a, b) {
 a = a | 0;
 b = b | 0;
 i = a;
 j = b;
}

function Db(a) {
 a = a | 0;
 aa(0);
 return 0;
}

function tb(a) {
 a = a | 0;
 return;
}

function Ha(a) {
 a = a | 0;
 B = a;
}

function Gb(a) {
 a = a | 0;
 aa(3);
}

function Ca(a) {
 a = a | 0;
 i = a;
}

function Ia() {
 return B | 0;
}

function Ba() {
 return i | 0;
}

function ob() {
 return 3;
}

function nb() {
 return 2;
}

function mb() {
 return;
}

// EMSCRIPTEN_END_FUNCS
var wa=[Db,qb];var xa=[Eb,sb,pb,rb];var ya=[Fb,Ya,Xa,Fb];var za=[Gb,tb];return{_free:vb,_broadwayGetMajorVersion:nb,_broadwayExit:mb,_memset:xb,_broadwayCreateStream:jb,_malloc:ub,_memcpy:yb,_broadwayGetMinorVersion:ob,_broadwayPlayStream:kb,_broadwayInit:lb,runPostSets:wb,stackAlloc:Aa,stackSave:Ba,stackRestore:Ca,establishStackSpace:Da,setThrew:Ea,setTempRet0:Ha,getTempRet0:Ia,dynCall_ii:zb,dynCall_iiii:Ab,dynCall_viiiii:Bb,dynCall_vi:Cb}})


// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var _free = Module["_free"] = asm["_free"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var _broadwayGetMajorVersion = Module["_broadwayGetMajorVersion"] = asm["_broadwayGetMajorVersion"];
var _broadwayExit = Module["_broadwayExit"] = asm["_broadwayExit"];
var _broadwayGetMinorVersion = Module["_broadwayGetMinorVersion"] = asm["_broadwayGetMinorVersion"];
var _memset = Module["_memset"] = asm["_memset"];
var _broadwayCreateStream = Module["_broadwayCreateStream"] = asm["_broadwayCreateStream"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _broadwayPlayStream = Module["_broadwayPlayStream"] = asm["_broadwayPlayStream"];
var _broadwayInit = Module["_broadwayInit"] = asm["_broadwayInit"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
Runtime.stackAlloc = asm["stackAlloc"];
Runtime.stackSave = asm["stackSave"];
Runtime.stackRestore = asm["stackRestore"];
Runtime.establishStackSpace = asm["establishStackSpace"];
Runtime.setTempRet0 = asm["setTempRet0"];
Runtime.getTempRet0 = asm["getTempRet0"];
function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}
ExitStatus.prototype = new Error;
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
 if (!Module["calledRun"]) run();
 if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
};
Module["callMain"] = Module.callMain = function callMain(args) {
 assert(runDependencies == 0, "cannot call main when async dependencies remain! (listen on __ATMAIN__)");
 assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
 args = args || [];
 ensureInitRuntime();
 var argc = args.length + 1;
 function pad() {
  for (var i = 0; i < 4 - 1; i++) {
   argv.push(0);
  }
 }
 var argv = [ allocate(intArrayFromString(Module["thisProgram"]), "i8", ALLOC_NORMAL) ];
 pad();
 for (var i = 0; i < argc - 1; i = i + 1) {
  argv.push(allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL));
  pad();
 }
 argv.push(0);
 argv = allocate(argv, "i32", ALLOC_NORMAL);
 try {
  var ret = Module["_main"](argc, argv, 0);
  exit(ret, true);
 } catch (e) {
  if (e instanceof ExitStatus) {
   return;
  } else if (e == "SimulateInfiniteLoop") {
   Module["noExitRuntime"] = true;
   return;
  } else {
   if (e && typeof e === "object" && e.stack) Module.printErr("exception thrown: " + [ e, e.stack ]);
   throw e;
  }
 } finally {
  calledMain = true;
 }
};
function run(args) {
 args = args || Module["arguments"];
 if (preloadStartTime === null) preloadStartTime = Date.now();
 if (runDependencies > 0) {
  return;
 }
 preRun();
 if (runDependencies > 0) return;
 if (Module["calledRun"]) return;
 function doRun() {
  if (Module["calledRun"]) return;
  Module["calledRun"] = true;
  if (ABORT) return;
  ensureInitRuntime();
  preMain();
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  if (Module["_main"] && shouldRunNow) Module["callMain"](args);
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout((function() {
   setTimeout((function() {
    Module["setStatus"]("");
   }), 1);
   doRun();
  }), 1);
 } else {
  doRun();
 }
}
Module["run"] = Module.run = run;
function exit(status, implicit) {
 if (implicit && Module["noExitRuntime"]) {
  return;
 }
 if (Module["noExitRuntime"]) {} else {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  exitRuntime();
  if (Module["onExit"]) Module["onExit"](status);
 }
 if (ENVIRONMENT_IS_NODE) {
  process["stdout"]["once"]("drain", (function() {
   process["exit"](status);
  }));
  console.log(" ");
  setTimeout((function() {
   process["exit"](status);
  }), 500);
 } else if (ENVIRONMENT_IS_SHELL && typeof quit === "function") {
  quit(status);
 }
 throw new ExitStatus(status);
}
Module["exit"] = Module.exit = exit;
var abortDecorators = [];
function abort(what) {
 if (what !== undefined) {
  Module.print(what);
  Module.printErr(what);
  what = JSON.stringify(what);
 } else {
  what = "";
 }
 ABORT = true;
 EXITSTATUS = 1;
 var extra = "\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";
 var output = "abort(" + what + ") at " + stackTrace() + extra;
 if (abortDecorators) {
  abortDecorators.forEach((function(decorator) {
   output = decorator(output, what);
  }));
 }
 throw output;
}
Module["abort"] = Module.abort = abort;
if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}
var shouldRunNow = false;
if (Module["noInitialRun"]) {
 shouldRunNow = false;
}
Module["noExitRuntime"] = true;
run();




