var Module = typeof Module !== 'undefined' ? Module : {}
var moduleOverrides = {}
var key
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key]
  }
}
var arguments_ = []
var thisProgram = './this.program'
var quit_ = function(status, toThrow) {
  throw toThrow
}
var ENVIRONMENT_IS_WEB = false
var ENVIRONMENT_IS_WORKER = false
var ENVIRONMENT_IS_NODE = false
var ENVIRONMENT_HAS_NODE = false
var ENVIRONMENT_IS_SHELL = false
ENVIRONMENT_IS_WEB = typeof window === 'object'
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function'
ENVIRONMENT_HAS_NODE =
  typeof process === 'object' &&
  typeof process.versions === 'object' &&
  typeof process.versions.node === 'string'
ENVIRONMENT_IS_NODE =
  ENVIRONMENT_HAS_NODE && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER
ENVIRONMENT_IS_SHELL =
  !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER
var scriptDirectory = ''
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory)
  }
  return scriptDirectory + path
}
var read_, readAsync, readBinary, setWindowTitle
if (ENVIRONMENT_IS_NODE) {
  scriptDirectory = __dirname + '/'
  var nodeFS
  var nodePath
  read_ = function shell_read(filename, binary) {
    var ret
    if (!nodeFS) nodeFS = require('fs')
    if (!nodePath) nodePath = require('path')
    filename = nodePath['normalize'](filename)
    ret = nodeFS['readFileSync'](filename)
    return binary ? ret : ret.toString()
  }
  readBinary = function readBinary(filename) {
    var ret = read_(filename, true)
    if (!ret.buffer) {
      ret = new Uint8Array(ret)
    }
    assert(ret.buffer)
    return ret
  }
  if (process['argv'].length > 1) {
    thisProgram = process['argv'][1].replace(/\\/g, '/')
  }
  arguments_ = process['argv'].slice(2)
  if (typeof module !== 'undefined') {
    module['exports'] = Module
  }
  process['on']('uncaughtException', function(ex) {
    if (!(ex instanceof ExitStatus)) {
      throw ex
    }
  })
  process['on']('unhandledRejection', abort)
  quit_ = function(status) {
    process['exit'](status)
  }
  Module['inspect'] = function() {
    return '[Emscripten Module object]'
  }
} else if (ENVIRONMENT_IS_SHELL) {
  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      return read(f)
    }
  }
  readBinary = function readBinary(f) {
    var data
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f))
    }
    data = read(f, 'binary')
    assert(typeof data === 'object')
    return data
  }
  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments
  }
  if (typeof quit === 'function') {
    quit_ = function(status) {
      quit(status)
    }
  }
  if (typeof print !== 'undefined') {
    if (typeof console === 'undefined') console = {}
    console.log = print
    console.warn = console.error =
      typeof printErr !== 'undefined' ? printErr : print
  }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = self.location.href
  } else if (document.currentScript) {
    scriptDirectory = document.currentScript.src
  }
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(
      0,
      scriptDirectory.lastIndexOf('/') + 1
    )
  } else {
    scriptDirectory = ''
  }
  read_ = function shell_read(url) {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url, false)
    xhr.send(null)
    return xhr.responseText
  }
  if (ENVIRONMENT_IS_WORKER) {
    readBinary = function readBinary(url) {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', url, false)
      xhr.responseType = 'arraybuffer'
      xhr.send(null)
      return new Uint8Array(xhr.response)
    }
  }
  readAsync = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'arraybuffer'
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
        onload(xhr.response)
        return
      }
      onerror()
    }
    xhr.onerror = onerror
    xhr.send(null)
  }
  setWindowTitle = function(title) {
    document.title = title
  }
} else {
}
var out = Module['print'] || console.log.bind(console)
var err = Module['printErr'] || console.warn.bind(console)
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key]
  }
}
moduleOverrides = null
if (Module['arguments']) arguments_ = Module['arguments']
if (Module['thisProgram']) thisProgram = Module['thisProgram']
if (Module['quit']) quit_ = Module['quit']
var STACK_ALIGN = 16
function dynamicAlloc(size) {
  var ret = HEAP32[DYNAMICTOP_PTR >> 2]
  var end = (ret + size + 15) & -16
  if (end > _emscripten_get_heap_size()) {
    abort()
  }
  HEAP32[DYNAMICTOP_PTR >> 2] = end
  return ret
}
function getNativeTypeSize(type) {
  switch (type) {
    case 'i1':
    case 'i8':
      return 1
    case 'i16':
      return 2
    case 'i32':
      return 4
    case 'i64':
      return 8
    case 'float':
      return 4
    case 'double':
      return 8
    default: {
      if (type[type.length - 1] === '*') {
        return 4
      } else if (type[0] === 'i') {
        var bits = parseInt(type.substr(1))
        assert(
          bits % 8 === 0,
          'getNativeTypeSize invalid bits ' + bits + ', type ' + type
        )
        return bits / 8
      } else {
        return 0
      }
    }
  }
}
function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {}
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1
    err(text)
  }
}
var asm2wasmImports = {
  'f64-rem': function(x, y) {
    return x % y
  },
  debugger: function() {}
}
var jsCallStartIndex = 1
var functionPointers = new Array(14)
function convertJsFunctionToWasm(func, sig) {
  var typeSection = [1, 0, 1, 96]
  var sigRet = sig.slice(0, 1)
  var sigParam = sig.slice(1)
  var typeCodes = { i: 127, j: 126, f: 125, d: 124 }
  typeSection.push(sigParam.length)
  for (var i = 0; i < sigParam.length; ++i) {
    typeSection.push(typeCodes[sigParam[i]])
  }
  if (sigRet == 'v') {
    typeSection.push(0)
  } else {
    typeSection = typeSection.concat([1, typeCodes[sigRet]])
  }
  typeSection[1] = typeSection.length - 2
  var bytes = new Uint8Array(
    [0, 97, 115, 109, 1, 0, 0, 0].concat(typeSection, [
      2,
      7,
      1,
      1,
      101,
      1,
      102,
      0,
      0,
      7,
      5,
      1,
      1,
      102,
      0,
      0
    ])
  )
  var module = new WebAssembly.Module(bytes)
  var instance = new WebAssembly.Instance(module, { e: { f: func } })
  var wrappedFunc = instance.exports.f
  return wrappedFunc
}
function addFunction(func, sig) {
  var base = 0
  for (var i = base; i < base + 14; i++) {
    if (!functionPointers[i]) {
      functionPointers[i] = func
      return jsCallStartIndex + i
    }
  }
  throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.'
}
var funcWrappers = {}
function dynCall(sig, ptr, args) {
  if (args && args.length) {
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args))
  } else {
    return Module['dynCall_' + sig].call(null, ptr)
  }
}
var tempRet0 = 0
var setTempRet0 = function(value) {
  tempRet0 = value
}
var getTempRet0 = function() {
  return tempRet0
}
var wasmBinary
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary']
var noExitRuntime
if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime']
if (typeof WebAssembly !== 'object') {
  err('no native wasm support detected')
}
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8'
  if (type.charAt(type.length - 1) === '*') type = 'i32'
  switch (type) {
    case 'i1':
      HEAP8[ptr >> 0] = value
      break
    case 'i8':
      HEAP8[ptr >> 0] = value
      break
    case 'i16':
      HEAP16[ptr >> 1] = value
      break
    case 'i32':
      HEAP32[ptr >> 2] = value
      break
    case 'i64':
      ;(tempI64 = [
        value >>> 0,
        ((tempDouble = value),
        +Math_abs(tempDouble) >= 1
          ? tempDouble > 0
            ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) |
                0) >>>
              0
            : ~~+Math_ceil(
                (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
              ) >>> 0
          : 0)
      ]),
        (HEAP32[ptr >> 2] = tempI64[0]),
        (HEAP32[(ptr + 4) >> 2] = tempI64[1])
      break
    case 'float':
      HEAPF32[ptr >> 2] = value
      break
    case 'double':
      HEAPF64[ptr >> 3] = value
      break
    default:
      abort('invalid type for setValue: ' + type)
  }
}
var wasmMemory
var wasmTable
var ABORT = false
var EXITSTATUS = 0
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text)
  }
}
function getCFunc(ident) {
  var func = Module['_' + ident]
  assert(
    func,
    'Cannot call unknown function ' + ident + ', make sure it is exported'
  )
  return func
}
function ccall(ident, returnType, argTypes, args, opts) {
  var toC = {
    string: function(str) {
      var ret = 0
      if (str !== null && str !== undefined && str !== 0) {
        var len = (str.length << 2) + 1
        ret = stackAlloc(len)
        stringToUTF8(str, ret, len)
      }
      return ret
    },
    array: function(arr) {
      var ret = stackAlloc(arr.length)
      writeArrayToMemory(arr, ret)
      return ret
    }
  }
  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret)
    if (returnType === 'boolean') return Boolean(ret)
    return ret
  }
  var func = getCFunc(ident)
  var cArgs = []
  var stack = 0
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]]
      if (converter) {
        if (stack === 0) stack = stackSave()
        cArgs[i] = converter(args[i])
      } else {
        cArgs[i] = args[i]
      }
    }
  }
  var ret = func.apply(null, cArgs)
  ret = convertReturnValue(ret)
  if (stack !== 0) stackRestore(stack)
  return ret
}
var ALLOC_NORMAL = 0
var ALLOC_NONE = 3
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size
  if (typeof slab === 'number') {
    zeroinit = true
    size = slab
  } else {
    zeroinit = false
    size = slab.length
  }
  var singleType = typeof types === 'string' ? types : null
  var ret
  if (allocator == ALLOC_NONE) {
    ret = ptr
  } else {
    ret = [_malloc, stackAlloc, dynamicAlloc][allocator](
      Math.max(size, singleType ? 1 : types.length)
    )
  }
  if (zeroinit) {
    var stop
    ptr = ret
    assert((ret & 3) == 0)
    stop = ret + (size & ~3)
    for (; ptr < stop; ptr += 4) {
      HEAP32[ptr >> 2] = 0
    }
    stop = ret + size
    while (ptr < stop) {
      HEAP8[ptr++ >> 0] = 0
    }
    return ret
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret)
    } else {
      HEAPU8.set(new Uint8Array(slab), ret)
    }
    return ret
  }
  var i = 0,
    type,
    typeSize,
    previousType
  while (i < size) {
    var curr = slab[i]
    type = singleType || types[i]
    if (type === 0) {
      i++
      continue
    }
    if (type == 'i64') type = 'i32'
    setValue(ret + i, curr, type)
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type)
      previousType = type
    }
    i += typeSize
  }
  return ret
}
function getMemory(size) {
  if (!runtimeInitialized) return dynamicAlloc(size)
  return _malloc(size)
}
var UTF8Decoder =
  typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined
function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead
  var endPtr = idx
  while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr
  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
  } else {
    var str = ''
    while (idx < endPtr) {
      var u0 = u8Array[idx++]
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0)
        continue
      }
      var u1 = u8Array[idx++] & 63
      if ((u0 & 224) == 192) {
        str += String.fromCharCode(((u0 & 31) << 6) | u1)
        continue
      }
      var u2 = u8Array[idx++] & 63
      if ((u0 & 240) == 224) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2
      } else {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63)
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0)
      } else {
        var ch = u0 - 65536
        str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023))
      }
    }
  }
  return str
}
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ''
}
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) return 0
  var startIdx = outIdx
  var endIdx = outIdx + maxBytesToWrite - 1
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i)
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i)
      u = (65536 + ((u & 1023) << 10)) | (u1 & 1023)
    }
    if (u <= 127) {
      if (outIdx >= endIdx) break
      outU8Array[outIdx++] = u
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break
      outU8Array[outIdx++] = 192 | (u >> 6)
      outU8Array[outIdx++] = 128 | (u & 63)
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break
      outU8Array[outIdx++] = 224 | (u >> 12)
      outU8Array[outIdx++] = 128 | ((u >> 6) & 63)
      outU8Array[outIdx++] = 128 | (u & 63)
    } else {
      if (outIdx + 3 >= endIdx) break
      outU8Array[outIdx++] = 240 | (u >> 18)
      outU8Array[outIdx++] = 128 | ((u >> 12) & 63)
      outU8Array[outIdx++] = 128 | ((u >> 6) & 63)
      outU8Array[outIdx++] = 128 | (u & 63)
    }
  }
  outU8Array[outIdx] = 0
  return outIdx - startIdx
}
function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}
function lengthBytesUTF8(str) {
  var len = 0
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i)
    if (u >= 55296 && u <= 57343)
      u = (65536 + ((u & 1023) << 10)) | (str.charCodeAt(++i) & 1023)
    if (u <= 127) ++len
    else if (u <= 2047) len += 2
    else if (u <= 65535) len += 3
    else len += 4
  }
  return len
}
var UTF16Decoder =
  typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1
  var ret = _malloc(size)
  if (ret) stringToUTF8Array(str, HEAP8, ret, size)
  return ret
}
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1
  var ret = stackAlloc(size)
  stringToUTF8Array(str, HEAP8, ret, size)
  return ret
}
function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer)
}
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[buffer++ >> 0] = str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[buffer >> 0] = 0
}
var PAGE_SIZE = 16384
var WASM_PAGE_SIZE = 65536
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64
function updateGlobalBufferAndViews(buf) {
  buffer = buf
  Module['HEAP8'] = HEAP8 = new Int8Array(buf)
  Module['HEAP16'] = HEAP16 = new Int16Array(buf)
  Module['HEAP32'] = HEAP32 = new Int32Array(buf)
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf)
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf)
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf)
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buf)
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buf)
}
var STACK_BASE = 135840,
  DYNAMIC_BASE = 5378720,
  DYNAMICTOP_PTR = 135808
var INITIAL_TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 67108864
if (Module['wasmMemory']) {
  wasmMemory = Module['wasmMemory']
} else {
  wasmMemory = new WebAssembly.Memory({
    initial: INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE,
    maximum: INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
  })
}
if (wasmMemory) {
  buffer = wasmMemory.buffer
}
INITIAL_TOTAL_MEMORY = buffer.byteLength
updateGlobalBufferAndViews(buffer)
HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE
function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    var callback = callbacks.shift()
    if (typeof callback == 'function') {
      callback()
      continue
    }
    var func = callback.func
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func)
      } else {
        Module['dynCall_vi'](func, callback.arg)
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg)
    }
  }
}
var __ATPRERUN__ = []
var __ATINIT__ = []
var __ATMAIN__ = []
var __ATPOSTRUN__ = []
var runtimeInitialized = false
var runtimeExited = false
function preRun() {
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function')
      Module['preRun'] = [Module['preRun']]
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift())
    }
  }
  callRuntimeCallbacks(__ATPRERUN__)
}
function initRuntime() {
  runtimeInitialized = true
  if (!Module['noFSInit'] && !FS.init.initialized) FS.init()
  TTY.init()
  callRuntimeCallbacks(__ATINIT__)
}
function preMain() {
  FS.ignorePermissions = false
  callRuntimeCallbacks(__ATMAIN__)
}
function exitRuntime() {
  runtimeExited = true
}
function postRun() {
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function')
      Module['postRun'] = [Module['postRun']]
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift())
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__)
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb)
}
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb)
}
var Math_abs = Math.abs
var Math_ceil = Math.ceil
var Math_floor = Math.floor
var Math_min = Math.min
var Math_trunc = Math.trunc
var runDependencies = 0
var runDependencyWatcher = null
var dependenciesFulfilled = null
function getUniqueRunDependency(id) {
  return id
}
function addRunDependency(id) {
  runDependencies++
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies)
  }
}
function removeRunDependency(id) {
  runDependencies--
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies)
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher)
      runDependencyWatcher = null
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled
      dependenciesFulfilled = null
      callback()
    }
  }
}
Module['preloadedImages'] = {}
Module['preloadedAudios'] = {}
var dataURIPrefix = 'data:application/octet-stream;base64,'
function isDataURI(filename) {
  return String.prototype.startsWith
    ? filename.startsWith(dataURIPrefix)
    : filename.indexOf(dataURIPrefix) === 0
}
var wasmBinaryFile = 'libffmpeg.wasm'
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile)
}
function getBinary() {
  try {
    if (wasmBinary) {
      return new Uint8Array(wasmBinary)
    }
    if (readBinary) {
      return readBinary(wasmBinaryFile)
    } else {
      throw 'both async and sync fetching of the wasm failed'
    }
  } catch (err) {
    abort(err)
  }
}
function getBinaryPromise() {
  if (
    !wasmBinary &&
    (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) &&
    typeof fetch === 'function'
  ) {
    return fetch(wasmBinaryFile, { credentials: 'same-origin' })
      .then(function(response) {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
        }
        return response['arrayBuffer']()
      })
      .catch(function() {
        return getBinary()
      })
  }
  return new Promise(function(resolve, reject) {
    resolve(getBinary())
  })
}
function createWasm(env) {
  var info = {
    env: env,
    wasi_unstable: env,
    global: { NaN: NaN, Infinity: Infinity },
    'global.Math': Math,
    asm2wasm: asm2wasmImports
  }
  function receiveInstance(instance, module) {
    var exports = instance.exports
    Module['asm'] = exports
    removeRunDependency('wasm-instantiate')
  }
  addRunDependency('wasm-instantiate')
  function receiveInstantiatedSource(output) {
    receiveInstance(output['instance'])
  }
  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise()
      .then(function(binary) {
        return WebAssembly.instantiate(binary, info)
      })
      .then(receiver, function(reason) {
        err('failed to asynchronously prepare wasm: ' + reason)
        abort(reason)
      })
  }
  function instantiateAsync() {
    if (
      !wasmBinary &&
      typeof WebAssembly.instantiateStreaming === 'function' &&
      !isDataURI(wasmBinaryFile) &&
      typeof fetch === 'function'
    ) {
      fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(
        response
      ) {
        var result = WebAssembly.instantiateStreaming(response, info)
        return result.then(receiveInstantiatedSource, function(reason) {
          err('wasm streaming compile failed: ' + reason)
          err('falling back to ArrayBuffer instantiation')
          instantiateArrayBuffer(receiveInstantiatedSource)
        })
      })
    } else {
      return instantiateArrayBuffer(receiveInstantiatedSource)
    }
  }
  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance)
      return exports
    } catch (e) {
      err('Module.instantiateWasm callback failed with error: ' + e)
      return false
    }
  }
  instantiateAsync()
  return {}
}
Module['asm'] = function(global, env, providedBuffer) {
  env['memory'] = wasmMemory
  env['table'] = wasmTable = new WebAssembly.Table({
    initial: 1072,
    maximum: 1072,
    element: 'anyfunc'
  })
  env['__memory_base'] = 1024
  env['__table_base'] = 0
  var exports = createWasm(env)
  return exports
}
var tempDouble
var tempI64
__ATINIT__.push({
  func: function() {
    ___emscripten_environ_constructor()
  }
})
var tempDoublePtr = 135824
function demangle(func) {
  return func
}
function demangleAll(text) {
  var regex = /\b__Z[\w\d_]+/g
  return text.replace(regex, function(x) {
    var y = demangle(x)
    return x === y ? x : y + ' [' + x + ']'
  })
}
function jsStackTrace() {
  var err = new Error()
  if (!err.stack) {
    try {
      throw new Error(0)
    } catch (e) {
      err = e
    }
    if (!err.stack) {
      return '(no stack trace available)'
    }
  }
  return err.stack.toString()
}
function stackTrace() {
  var js = jsStackTrace()
  if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']()
  return demangleAll(js)
}
var ENV = {}
function ___buildEnvironment(environ) {
  var MAX_ENV_VALUES = 64
  var TOTAL_ENV_SIZE = 1024
  var poolPtr
  var envPtr
  if (!___buildEnvironment.called) {
    ___buildEnvironment.called = true
    ENV['USER'] = ENV['LOGNAME'] = 'web_user'
    ENV['PATH'] = '/'
    ENV['PWD'] = '/'
    ENV['HOME'] = '/home/web_user'
    ENV['LANG'] =
      (
        (typeof navigator === 'object' &&
          navigator.languages &&
          navigator.languages[0]) ||
        'C'
      ).replace('-', '_') + '.UTF-8'
    ENV['_'] = thisProgram
    poolPtr = getMemory(TOTAL_ENV_SIZE)
    envPtr = getMemory(MAX_ENV_VALUES * 4)
    HEAP32[envPtr >> 2] = poolPtr
    HEAP32[environ >> 2] = envPtr
  } else {
    envPtr = HEAP32[environ >> 2]
    poolPtr = HEAP32[envPtr >> 2]
  }
  var strings = []
  var totalSize = 0
  for (var key in ENV) {
    if (typeof ENV[key] === 'string') {
      var line = key + '=' + ENV[key]
      strings.push(line)
      totalSize += line.length
    }
  }
  if (totalSize > TOTAL_ENV_SIZE) {
    throw new Error('Environment size exceeded TOTAL_ENV_SIZE!')
  }
  var ptrSize = 4
  for (var i = 0; i < strings.length; i++) {
    var line = strings[i]
    writeAsciiToMemory(line, poolPtr)
    HEAP32[(envPtr + i * ptrSize) >> 2] = poolPtr
    poolPtr += line.length + 1
  }
  HEAP32[(envPtr + strings.length * ptrSize) >> 2] = 0
}
var PATH = {
  splitPath: function(filename) {
    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/
    return splitPathRe.exec(filename).slice(1)
  },
  normalizeArray: function(parts, allowAboveRoot) {
    var up = 0
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i]
      if (last === '.') {
        parts.splice(i, 1)
      } else if (last === '..') {
        parts.splice(i, 1)
        up++
      } else if (up) {
        parts.splice(i, 1)
        up--
      }
    }
    if (allowAboveRoot) {
      for (; up; up--) {
        parts.unshift('..')
      }
    }
    return parts
  },
  normalize: function(path) {
    var isAbsolute = path.charAt(0) === '/',
      trailingSlash = path.substr(-1) === '/'
    path = PATH.normalizeArray(
      path.split('/').filter(function(p) {
        return !!p
      }),
      !isAbsolute
    ).join('/')
    if (!path && !isAbsolute) {
      path = '.'
    }
    if (path && trailingSlash) {
      path += '/'
    }
    return (isAbsolute ? '/' : '') + path
  },
  dirname: function(path) {
    var result = PATH.splitPath(path),
      root = result[0],
      dir = result[1]
    if (!root && !dir) {
      return '.'
    }
    if (dir) {
      dir = dir.substr(0, dir.length - 1)
    }
    return root + dir
  },
  basename: function(path) {
    if (path === '/') return '/'
    var lastSlash = path.lastIndexOf('/')
    if (lastSlash === -1) return path
    return path.substr(lastSlash + 1)
  },
  extname: function(path) {
    return PATH.splitPath(path)[3]
  },
  join: function() {
    var paths = Array.prototype.slice.call(arguments, 0)
    return PATH.normalize(paths.join('/'))
  },
  join2: function(l, r) {
    return PATH.normalize(l + '/' + r)
  }
}
function ___setErrNo(value) {
  if (Module['___errno_location'])
    HEAP32[Module['___errno_location']() >> 2] = value
  return value
}
var PATH_FS = {
  resolve: function() {
    var resolvedPath = '',
      resolvedAbsolute = false
    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = i >= 0 ? arguments[i] : FS.cwd()
      if (typeof path !== 'string') {
        throw new TypeError('Arguments to path.resolve must be strings')
      } else if (!path) {
        return ''
      }
      resolvedPath = path + '/' + resolvedPath
      resolvedAbsolute = path.charAt(0) === '/'
    }
    resolvedPath = PATH.normalizeArray(
      resolvedPath.split('/').filter(function(p) {
        return !!p
      }),
      !resolvedAbsolute
    ).join('/')
    return (resolvedAbsolute ? '/' : '') + resolvedPath || '.'
  },
  relative: function(from, to) {
    from = PATH_FS.resolve(from).substr(1)
    to = PATH_FS.resolve(to).substr(1)
    function trim(arr) {
      var start = 0
      for (; start < arr.length; start++) {
        if (arr[start] !== '') break
      }
      var end = arr.length - 1
      for (; end >= 0; end--) {
        if (arr[end] !== '') break
      }
      if (start > end) return []
      return arr.slice(start, end - start + 1)
    }
    var fromParts = trim(from.split('/'))
    var toParts = trim(to.split('/'))
    var length = Math.min(fromParts.length, toParts.length)
    var samePartsLength = length
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i
        break
      }
    }
    var outputParts = []
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push('..')
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength))
    return outputParts.join('/')
  }
}
var TTY = {
  ttys: [],
  init: function() {},
  shutdown: function() {},
  register: function(dev, ops) {
    TTY.ttys[dev] = { input: [], output: [], ops: ops }
    FS.registerDevice(dev, TTY.stream_ops)
  },
  stream_ops: {
    open: function(stream) {
      var tty = TTY.ttys[stream.node.rdev]
      if (!tty) {
        throw new FS.ErrnoError(19)
      }
      stream.tty = tty
      stream.seekable = false
    },
    close: function(stream) {
      stream.tty.ops.flush(stream.tty)
    },
    flush: function(stream) {
      stream.tty.ops.flush(stream.tty)
    },
    read: function(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.get_char) {
        throw new FS.ErrnoError(6)
      }
      var bytesRead = 0
      for (var i = 0; i < length; i++) {
        var result
        try {
          result = stream.tty.ops.get_char(stream.tty)
        } catch (e) {
          throw new FS.ErrnoError(5)
        }
        if (result === undefined && bytesRead === 0) {
          throw new FS.ErrnoError(11)
        }
        if (result === null || result === undefined) break
        bytesRead++
        buffer[offset + i] = result
      }
      if (bytesRead) {
        stream.node.timestamp = Date.now()
      }
      return bytesRead
    },
    write: function(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.put_char) {
        throw new FS.ErrnoError(6)
      }
      try {
        for (var i = 0; i < length; i++) {
          stream.tty.ops.put_char(stream.tty, buffer[offset + i])
        }
      } catch (e) {
        throw new FS.ErrnoError(5)
      }
      if (length) {
        stream.node.timestamp = Date.now()
      }
      return i
    }
  },
  default_tty_ops: {
    get_char: function(tty) {
      if (!tty.input.length) {
        var result = null
        if (ENVIRONMENT_IS_NODE) {
          var BUFSIZE = 256
          var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE)
          var bytesRead = 0
          var isPosixPlatform = process.platform != 'win32'
          var fd = process.stdin.fd
          if (isPosixPlatform) {
            var usingDevice = false
            try {
              fd = fs.openSync('/dev/stdin', 'r')
              usingDevice = true
            } catch (e) {}
          }
          try {
            bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null)
          } catch (e) {
            if (e.toString().indexOf('EOF') != -1) bytesRead = 0
            else throw e
          }
          if (usingDevice) {
            fs.closeSync(fd)
          }
          if (bytesRead > 0) {
            result = buf.slice(0, bytesRead).toString('utf-8')
          } else {
            result = null
          }
        } else if (
          typeof window != 'undefined' &&
          typeof window.prompt == 'function'
        ) {
          result = window.prompt('Input: ')
          if (result !== null) {
            result += '\n'
          }
        } else if (typeof readline == 'function') {
          result = readline()
          if (result !== null) {
            result += '\n'
          }
        }
        if (!result) {
          return null
        }
        tty.input = intArrayFromString(result, true)
      }
      return tty.input.shift()
    },
    put_char: function(tty, val) {
      if (val === null || val === 10) {
        out(UTF8ArrayToString(tty.output, 0))
        tty.output = []
      } else {
        if (val != 0) tty.output.push(val)
      }
    },
    flush: function(tty) {
      if (tty.output && tty.output.length > 0) {
        out(UTF8ArrayToString(tty.output, 0))
        tty.output = []
      }
    }
  },
  default_tty1_ops: {
    put_char: function(tty, val) {
      if (val === null || val === 10) {
        err(UTF8ArrayToString(tty.output, 0))
        tty.output = []
      } else {
        if (val != 0) tty.output.push(val)
      }
    },
    flush: function(tty) {
      if (tty.output && tty.output.length > 0) {
        err(UTF8ArrayToString(tty.output, 0))
        tty.output = []
      }
    }
  }
}
var MEMFS = {
  ops_table: null,
  mount: function(mount) {
    return MEMFS.createNode(null, '/', 16384 | 511, 0)
  },
  createNode: function(parent, name, mode, dev) {
    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
      throw new FS.ErrnoError(1)
    }
    if (!MEMFS.ops_table) {
      MEMFS.ops_table = {
        dir: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            lookup: MEMFS.node_ops.lookup,
            mknod: MEMFS.node_ops.mknod,
            rename: MEMFS.node_ops.rename,
            unlink: MEMFS.node_ops.unlink,
            rmdir: MEMFS.node_ops.rmdir,
            readdir: MEMFS.node_ops.readdir,
            symlink: MEMFS.node_ops.symlink
          },
          stream: { llseek: MEMFS.stream_ops.llseek }
        },
        file: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          },
          stream: {
            llseek: MEMFS.stream_ops.llseek,
            read: MEMFS.stream_ops.read,
            write: MEMFS.stream_ops.write,
            allocate: MEMFS.stream_ops.allocate,
            mmap: MEMFS.stream_ops.mmap,
            msync: MEMFS.stream_ops.msync
          }
        },
        link: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            readlink: MEMFS.node_ops.readlink
          },
          stream: {}
        },
        chrdev: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          },
          stream: FS.chrdev_stream_ops
        }
      }
    }
    var node = FS.createNode(parent, name, mode, dev)
    if (FS.isDir(node.mode)) {
      node.node_ops = MEMFS.ops_table.dir.node
      node.stream_ops = MEMFS.ops_table.dir.stream
      node.contents = {}
    } else if (FS.isFile(node.mode)) {
      node.node_ops = MEMFS.ops_table.file.node
      node.stream_ops = MEMFS.ops_table.file.stream
      node.usedBytes = 0
      node.contents = null
    } else if (FS.isLink(node.mode)) {
      node.node_ops = MEMFS.ops_table.link.node
      node.stream_ops = MEMFS.ops_table.link.stream
    } else if (FS.isChrdev(node.mode)) {
      node.node_ops = MEMFS.ops_table.chrdev.node
      node.stream_ops = MEMFS.ops_table.chrdev.stream
    }
    node.timestamp = Date.now()
    if (parent) {
      parent.contents[name] = node
    }
    return node
  },
  getFileDataAsRegularArray: function(node) {
    if (node.contents && node.contents.subarray) {
      var arr = []
      for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i])
      return arr
    }
    return node.contents
  },
  getFileDataAsTypedArray: function(node) {
    if (!node.contents) return new Uint8Array()
    if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes)
    return new Uint8Array(node.contents)
  },
  expandFileStorage: function(node, newCapacity) {
    var prevCapacity = node.contents ? node.contents.length : 0
    if (prevCapacity >= newCapacity) return
    var CAPACITY_DOUBLING_MAX = 1024 * 1024
    newCapacity = Math.max(
      newCapacity,
      (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) | 0
    )
    if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256)
    var oldContents = node.contents
    node.contents = new Uint8Array(newCapacity)
    if (node.usedBytes > 0)
      node.contents.set(oldContents.subarray(0, node.usedBytes), 0)
    return
  },
  resizeFileStorage: function(node, newSize) {
    if (node.usedBytes == newSize) return
    if (newSize == 0) {
      node.contents = null
      node.usedBytes = 0
      return
    }
    if (!node.contents || node.contents.subarray) {
      var oldContents = node.contents
      node.contents = new Uint8Array(new ArrayBuffer(newSize))
      if (oldContents) {
        node.contents.set(
          oldContents.subarray(0, Math.min(newSize, node.usedBytes))
        )
      }
      node.usedBytes = newSize
      return
    }
    if (!node.contents) node.contents = []
    if (node.contents.length > newSize) node.contents.length = newSize
    else while (node.contents.length < newSize) node.contents.push(0)
    node.usedBytes = newSize
  },
  node_ops: {
    getattr: function(node) {
      var attr = {}
      attr.dev = FS.isChrdev(node.mode) ? node.id : 1
      attr.ino = node.id
      attr.mode = node.mode
      attr.nlink = 1
      attr.uid = 0
      attr.gid = 0
      attr.rdev = node.rdev
      if (FS.isDir(node.mode)) {
        attr.size = 4096
      } else if (FS.isFile(node.mode)) {
        attr.size = node.usedBytes
      } else if (FS.isLink(node.mode)) {
        attr.size = node.link.length
      } else {
        attr.size = 0
      }
      attr.atime = new Date(node.timestamp)
      attr.mtime = new Date(node.timestamp)
      attr.ctime = new Date(node.timestamp)
      attr.blksize = 4096
      attr.blocks = Math.ceil(attr.size / attr.blksize)
      return attr
    },
    setattr: function(node, attr) {
      if (attr.mode !== undefined) {
        node.mode = attr.mode
      }
      if (attr.timestamp !== undefined) {
        node.timestamp = attr.timestamp
      }
      if (attr.size !== undefined) {
        MEMFS.resizeFileStorage(node, attr.size)
      }
    },
    lookup: function(parent, name) {
      throw FS.genericErrors[2]
    },
    mknod: function(parent, name, mode, dev) {
      return MEMFS.createNode(parent, name, mode, dev)
    },
    rename: function(old_node, new_dir, new_name) {
      if (FS.isDir(old_node.mode)) {
        var new_node
        try {
          new_node = FS.lookupNode(new_dir, new_name)
        } catch (e) {}
        if (new_node) {
          for (var i in new_node.contents) {
            throw new FS.ErrnoError(39)
          }
        }
      }
      delete old_node.parent.contents[old_node.name]
      old_node.name = new_name
      new_dir.contents[new_name] = old_node
      old_node.parent = new_dir
    },
    unlink: function(parent, name) {
      delete parent.contents[name]
    },
    rmdir: function(parent, name) {
      var node = FS.lookupNode(parent, name)
      for (var i in node.contents) {
        throw new FS.ErrnoError(39)
      }
      delete parent.contents[name]
    },
    readdir: function(node) {
      var entries = ['.', '..']
      for (var key in node.contents) {
        if (!node.contents.hasOwnProperty(key)) {
          continue
        }
        entries.push(key)
      }
      return entries
    },
    symlink: function(parent, newname, oldpath) {
      var node = MEMFS.createNode(parent, newname, 511 | 40960, 0)
      node.link = oldpath
      return node
    },
    readlink: function(node) {
      if (!FS.isLink(node.mode)) {
        throw new FS.ErrnoError(22)
      }
      return node.link
    }
  },
  stream_ops: {
    read: function(stream, buffer, offset, length, position) {
      var contents = stream.node.contents
      if (position >= stream.node.usedBytes) return 0
      var size = Math.min(stream.node.usedBytes - position, length)
      if (size > 8 && contents.subarray) {
        buffer.set(contents.subarray(position, position + size), offset)
      } else {
        for (var i = 0; i < size; i++)
          buffer[offset + i] = contents[position + i]
      }
      return size
    },
    write: function(stream, buffer, offset, length, position, canOwn) {
      if (!length) return 0
      var node = stream.node
      node.timestamp = Date.now()
      if (buffer.subarray && (!node.contents || node.contents.subarray)) {
        if (canOwn) {
          node.contents = buffer.subarray(offset, offset + length)
          node.usedBytes = length
          return length
        } else if (node.usedBytes === 0 && position === 0) {
          node.contents = new Uint8Array(
            buffer.subarray(offset, offset + length)
          )
          node.usedBytes = length
          return length
        } else if (position + length <= node.usedBytes) {
          node.contents.set(buffer.subarray(offset, offset + length), position)
          return length
        }
      }
      MEMFS.expandFileStorage(node, position + length)
      if (node.contents.subarray && buffer.subarray)
        node.contents.set(buffer.subarray(offset, offset + length), position)
      else {
        for (var i = 0; i < length; i++) {
          node.contents[position + i] = buffer[offset + i]
        }
      }
      node.usedBytes = Math.max(node.usedBytes, position + length)
      return length
    },
    llseek: function(stream, offset, whence) {
      var position = offset
      if (whence === 1) {
        position += stream.position
      } else if (whence === 2) {
        if (FS.isFile(stream.node.mode)) {
          position += stream.node.usedBytes
        }
      }
      if (position < 0) {
        throw new FS.ErrnoError(22)
      }
      return position
    },
    allocate: function(stream, offset, length) {
      MEMFS.expandFileStorage(stream.node, offset + length)
      stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
    },
    mmap: function(stream, buffer, offset, length, position, prot, flags) {
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(19)
      }
      var ptr
      var allocated
      var contents = stream.node.contents
      if (
        !(flags & 2) &&
        (contents.buffer === buffer || contents.buffer === buffer.buffer)
      ) {
        allocated = false
        ptr = contents.byteOffset
      } else {
        if (position > 0 || position + length < stream.node.usedBytes) {
          if (contents.subarray) {
            contents = contents.subarray(position, position + length)
          } else {
            contents = Array.prototype.slice.call(
              contents,
              position,
              position + length
            )
          }
        }
        allocated = true
        var fromHeap = buffer.buffer == HEAP8.buffer
        ptr = _malloc(length)
        if (!ptr) {
          throw new FS.ErrnoError(12)
        }
        ;(fromHeap ? HEAP8 : buffer).set(contents, ptr)
      }
      return { ptr: ptr, allocated: allocated }
    },
    msync: function(stream, buffer, offset, length, mmapFlags) {
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(19)
      }
      if (mmapFlags & 2) {
        return 0
      }
      var bytesWritten = MEMFS.stream_ops.write(
        stream,
        buffer,
        0,
        length,
        offset,
        false
      )
      return 0
    }
  }
}
var IDBFS = {
  dbs: {},
  indexedDB: function() {
    if (typeof indexedDB !== 'undefined') return indexedDB
    var ret = null
    if (typeof window === 'object')
      ret =
        window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB
    assert(ret, 'IDBFS used, but indexedDB not supported')
    return ret
  },
  DB_VERSION: 21,
  DB_STORE_NAME: 'FILE_DATA',
  mount: function(mount) {
    return MEMFS.mount.apply(null, arguments)
  },
  syncfs: function(mount, populate, callback) {
    IDBFS.getLocalSet(mount, function(err, local) {
      if (err) return callback(err)
      IDBFS.getRemoteSet(mount, function(err, remote) {
        if (err) return callback(err)
        var src = populate ? remote : local
        var dst = populate ? local : remote
        IDBFS.reconcile(src, dst, callback)
      })
    })
  },
  getDB: function(name, callback) {
    var db = IDBFS.dbs[name]
    if (db) {
      return callback(null, db)
    }
    var req
    try {
      req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
    } catch (e) {
      return callback(e)
    }
    if (!req) {
      return callback('Unable to connect to IndexedDB')
    }
    req.onupgradeneeded = function(e) {
      var db = e.target.result
      var transaction = e.target.transaction
      var fileStore
      if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
        fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
      } else {
        fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
      }
      if (!fileStore.indexNames.contains('timestamp')) {
        fileStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
    req.onsuccess = function() {
      db = req.result
      IDBFS.dbs[name] = db
      callback(null, db)
    }
    req.onerror = function(e) {
      callback(this.error)
      e.preventDefault()
    }
  },
  getLocalSet: function(mount, callback) {
    var entries = {}
    function isRealDir(p) {
      return p !== '.' && p !== '..'
    }
    function toAbsolute(root) {
      return function(p) {
        return PATH.join2(root, p)
      }
    }
    var check = FS.readdir(mount.mountpoint)
      .filter(isRealDir)
      .map(toAbsolute(mount.mountpoint))
    while (check.length) {
      var path = check.pop()
      var stat
      try {
        stat = FS.stat(path)
      } catch (e) {
        return callback(e)
      }
      if (FS.isDir(stat.mode)) {
        check.push.apply(
          check,
          FS.readdir(path)
            .filter(isRealDir)
            .map(toAbsolute(path))
        )
      }
      entries[path] = { timestamp: stat.mtime }
    }
    return callback(null, { type: 'local', entries: entries })
  },
  getRemoteSet: function(mount, callback) {
    var entries = {}
    IDBFS.getDB(mount.mountpoint, function(err, db) {
      if (err) return callback(err)
      try {
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly')
        transaction.onerror = function(e) {
          callback(this.error)
          e.preventDefault()
        }
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME)
        var index = store.index('timestamp')
        index.openKeyCursor().onsuccess = function(event) {
          var cursor = event.target.result
          if (!cursor) {
            return callback(null, { type: 'remote', db: db, entries: entries })
          }
          entries[cursor.primaryKey] = { timestamp: cursor.key }
          cursor.continue()
        }
      } catch (e) {
        return callback(e)
      }
    })
  },
  loadLocalEntry: function(path, callback) {
    var stat, node
    try {
      var lookup = FS.lookupPath(path)
      node = lookup.node
      stat = FS.stat(path)
    } catch (e) {
      return callback(e)
    }
    if (FS.isDir(stat.mode)) {
      return callback(null, { timestamp: stat.mtime, mode: stat.mode })
    } else if (FS.isFile(stat.mode)) {
      node.contents = MEMFS.getFileDataAsTypedArray(node)
      return callback(null, {
        timestamp: stat.mtime,
        mode: stat.mode,
        contents: node.contents
      })
    } else {
      return callback(new Error('node type not supported'))
    }
  },
  storeLocalEntry: function(path, entry, callback) {
    try {
      if (FS.isDir(entry.mode)) {
        FS.mkdir(path, entry.mode)
      } else if (FS.isFile(entry.mode)) {
        FS.writeFile(path, entry.contents, { canOwn: true })
      } else {
        return callback(new Error('node type not supported'))
      }
      FS.chmod(path, entry.mode)
      FS.utime(path, entry.timestamp, entry.timestamp)
    } catch (e) {
      return callback(e)
    }
    callback(null)
  },
  removeLocalEntry: function(path, callback) {
    try {
      var lookup = FS.lookupPath(path)
      var stat = FS.stat(path)
      if (FS.isDir(stat.mode)) {
        FS.rmdir(path)
      } else if (FS.isFile(stat.mode)) {
        FS.unlink(path)
      }
    } catch (e) {
      return callback(e)
    }
    callback(null)
  },
  loadRemoteEntry: function(store, path, callback) {
    var req = store.get(path)
    req.onsuccess = function(event) {
      callback(null, event.target.result)
    }
    req.onerror = function(e) {
      callback(this.error)
      e.preventDefault()
    }
  },
  storeRemoteEntry: function(store, path, entry, callback) {
    var req = store.put(entry, path)
    req.onsuccess = function() {
      callback(null)
    }
    req.onerror = function(e) {
      callback(this.error)
      e.preventDefault()
    }
  },
  removeRemoteEntry: function(store, path, callback) {
    var req = store.delete(path)
    req.onsuccess = function() {
      callback(null)
    }
    req.onerror = function(e) {
      callback(this.error)
      e.preventDefault()
    }
  },
  reconcile: function(src, dst, callback) {
    var total = 0
    var create = []
    Object.keys(src.entries).forEach(function(key) {
      var e = src.entries[key]
      var e2 = dst.entries[key]
      if (!e2 || e.timestamp > e2.timestamp) {
        create.push(key)
        total++
      }
    })
    var remove = []
    Object.keys(dst.entries).forEach(function(key) {
      var e = dst.entries[key]
      var e2 = src.entries[key]
      if (!e2) {
        remove.push(key)
        total++
      }
    })
    if (!total) {
      return callback(null)
    }
    var errored = false
    var db = src.type === 'remote' ? src.db : dst.db
    var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite')
    var store = transaction.objectStore(IDBFS.DB_STORE_NAME)
    function done(err) {
      if (err && !errored) {
        errored = true
        return callback(err)
      }
    }
    transaction.onerror = function(e) {
      done(this.error)
      e.preventDefault()
    }
    transaction.oncomplete = function(e) {
      if (!errored) {
        callback(null)
      }
    }
    create.sort().forEach(function(path) {
      if (dst.type === 'local') {
        IDBFS.loadRemoteEntry(store, path, function(err, entry) {
          if (err) return done(err)
          IDBFS.storeLocalEntry(path, entry, done)
        })
      } else {
        IDBFS.loadLocalEntry(path, function(err, entry) {
          if (err) return done(err)
          IDBFS.storeRemoteEntry(store, path, entry, done)
        })
      }
    })
    remove
      .sort()
      .reverse()
      .forEach(function(path) {
        if (dst.type === 'local') {
          IDBFS.removeLocalEntry(path, done)
        } else {
          IDBFS.removeRemoteEntry(store, path, done)
        }
      })
  }
}
var NODEFS = {
  isWindows: false,
  staticInit: function() {
    NODEFS.isWindows = !!process.platform.match(/^win/)
    var flags = process['binding']('constants')
    if (flags['fs']) {
      flags = flags['fs']
    }
    NODEFS.flagsForNodeMap = {
      1024: flags['O_APPEND'],
      64: flags['O_CREAT'],
      128: flags['O_EXCL'],
      0: flags['O_RDONLY'],
      2: flags['O_RDWR'],
      4096: flags['O_SYNC'],
      512: flags['O_TRUNC'],
      1: flags['O_WRONLY']
    }
  },
  bufferFrom: function(arrayBuffer) {
    return Buffer['alloc'] ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer)
  },
  mount: function(mount) {
    assert(ENVIRONMENT_HAS_NODE)
    return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0)
  },
  createNode: function(parent, name, mode, dev) {
    if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
      throw new FS.ErrnoError(22)
    }
    var node = FS.createNode(parent, name, mode)
    node.node_ops = NODEFS.node_ops
    node.stream_ops = NODEFS.stream_ops
    return node
  },
  getMode: function(path) {
    var stat
    try {
      stat = fs.lstatSync(path)
      if (NODEFS.isWindows) {
        stat.mode = stat.mode | ((stat.mode & 292) >> 2)
      }
    } catch (e) {
      if (!e.code) throw e
      throw new FS.ErrnoError(-e.errno)
    }
    return stat.mode
  },
  realPath: function(node) {
    var parts = []
    while (node.parent !== node) {
      parts.push(node.name)
      node = node.parent
    }
    parts.push(node.mount.opts.root)
    parts.reverse()
    return PATH.join.apply(null, parts)
  },
  flagsForNode: function(flags) {
    flags &= ~2097152
    flags &= ~2048
    flags &= ~32768
    flags &= ~524288
    var newFlags = 0
    for (var k in NODEFS.flagsForNodeMap) {
      if (flags & k) {
        newFlags |= NODEFS.flagsForNodeMap[k]
        flags ^= k
      }
    }
    if (!flags) {
      return newFlags
    } else {
      throw new FS.ErrnoError(22)
    }
  },
  node_ops: {
    getattr: function(node) {
      var path = NODEFS.realPath(node)
      var stat
      try {
        stat = fs.lstatSync(path)
      } catch (e) {
        if (!e.code) throw e
        throw new FS.ErrnoError(-e.errno)
      }
      if (NODEFS.isWindows && !stat.blksize) {
        stat.blksize = 4096
      }
      if (NODEFS.isWindows && !stat.blocks) {
        stat.blocks = ((stat.size + stat.blksize - 1) / stat.blksize) | 0
      }
      return {
        dev: stat.dev,
        ino: stat.ino,
        mode: stat.mode,
        nlink: stat.nlink,
        uid: stat.uid,
        gid: stat.gid,
        rdev: stat.rdev,
        size: stat.size,
        atime: stat.atime,
        mtime: stat.mtime,
        ctime: stat.ctime,
        blksize: stat.blksize,
        blocks: stat.blocks
      }
    },
    setattr: function(node, attr) {
      var path = NODEFS.realPath(node)
      try {
        if (attr.mode !== undefined) {
          fs.chmodSync(path, attr.mode)
          node.mode = attr.mode
        }
        if (attr.timestamp !== undefined) {
          var date = new Date(attr.timestamp)
          fs.utimesSync(path, date, date)
        }
        if (attr.size !== undefined) {
          fs.truncateSync(path, attr.size)
        }
      } catch (e) {
        if (!e.code) throw e
        throw new FS.ErrnoError(-e.errno)
      }
    },
    lookup: function(parent, name) {
      var path = PATH.join2(NODEFS.realPath(parent), name)
      var mode = NODEFS.getMode(path)
      return NODEFS.createNode(parent, name, mode)
    },
    mknod: function(parent, name, mode, dev) {
      var node = NODEFS.createNode(parent, name, mode, dev)
      var path = NODEFS.realPath(node)
      try {
        if (FS.isDir(node.mode)) {
          fs.mkdirSync(path, node.mode)
        } else {
          fs.writeFileSync(path, '', { mode: node.mode })
        }
      } catch (e) {
        if (!e.code) throw e
        throw new FS.ErrnoError(-e.errno)
      }
      return node
    },
    rename: function(oldNode, newDir, newName) {
      var oldPath = NODEFS.realPath(oldNode)
      var newPath = PATH.join2(NODEFS.realPath(newDir), newName)
      try {
        fs.renameSync(oldPath, newPath)
      } catch (e) {
        if (!e.code) throw e
        throw new FS.ErrnoError(-e.errno)
      }
    },
    unlink: function(parent, name) {
      var path = PATH.join2(NODEFS.realPath(parent), name)
      try {
        fs.unlinkSync(path)
      } catch (e) {
        if (!e.code) throw e
        throw new FS.ErrnoError(-e.errno)
      }
    },
    rmdir: function(parent, name) {
      var path = PATH.join2(NODEFS.realPath(parent), name)
      try {
        fs.rmdirSync(path)
      } catch (e) {
        if (!e.code) throw e
        throw new FS.ErrnoError(-e.errno)
      }
    },
    readdir: function(node) {
      var path = NODEFS.realPath(node)
      try {
        return fs.readdirSync(path)
      } catch (e) {
        if (!e.code) throw e
        throw new FS.ErrnoError(-e.errno)
      }
    },
    symlink: function(parent, newName, oldPath) {
      var newPath = PATH.join2(NODEFS.realPath(parent), newName)
      try {
        fs.symlinkSync(oldPath, newPath)
      } catch (e) {
        if (!e.code) throw e
        throw new FS.ErrnoError(-e.errno)
      }
    },
    readlink: function(node) {
      var path = NODEFS.realPath(node)
      try {
        path = fs.readlinkSync(path)
        path = NODEJS_PATH.relative(
          NODEJS_PATH.resolve(node.mount.opts.root),
          path
        )
        return path
      } catch (e) {
        if (!e.code) throw e
        throw new FS.ErrnoError(-e.errno)
      }
    }
  },
  stream_ops: {
    open: function(stream) {
      var path = NODEFS.realPath(stream.node)
      try {
        if (FS.isFile(stream.node.mode)) {
          stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags))
        }
      } catch (e) {
        if (!e.code) throw e
        throw new FS.ErrnoError(-e.errno)
      }
    },
    close: function(stream) {
      try {
        if (FS.isFile(stream.node.mode) && stream.nfd) {
          fs.closeSync(stream.nfd)
        }
      } catch (e) {
        if (!e.code) throw e
        throw new FS.ErrnoError(-e.errno)
      }
    },
    read: function(stream, buffer, offset, length, position) {
      if (length === 0) return 0
      try {
        return fs.readSync(
          stream.nfd,
          NODEFS.bufferFrom(buffer.buffer),
          offset,
          length,
          position
        )
      } catch (e) {
        throw new FS.ErrnoError(-e.errno)
      }
    },
    write: function(stream, buffer, offset, length, position) {
      try {
        return fs.writeSync(
          stream.nfd,
          NODEFS.bufferFrom(buffer.buffer),
          offset,
          length,
          position
        )
      } catch (e) {
        throw new FS.ErrnoError(-e.errno)
      }
    },
    llseek: function(stream, offset, whence) {
      var position = offset
      if (whence === 1) {
        position += stream.position
      } else if (whence === 2) {
        if (FS.isFile(stream.node.mode)) {
          try {
            var stat = fs.fstatSync(stream.nfd)
            position += stat.size
          } catch (e) {
            throw new FS.ErrnoError(-e.errno)
          }
        }
      }
      if (position < 0) {
        throw new FS.ErrnoError(22)
      }
      return position
    }
  }
}
var WORKERFS = {
  DIR_MODE: 16895,
  FILE_MODE: 33279,
  reader: null,
  mount: function(mount) {
    assert(ENVIRONMENT_IS_WORKER)
    if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync()
    var root = WORKERFS.createNode(null, '/', WORKERFS.DIR_MODE, 0)
    var createdParents = {}
    function ensureParent(path) {
      var parts = path.split('/')
      var parent = root
      for (var i = 0; i < parts.length - 1; i++) {
        var curr = parts.slice(0, i + 1).join('/')
        if (!createdParents[curr]) {
          createdParents[curr] = WORKERFS.createNode(
            parent,
            parts[i],
            WORKERFS.DIR_MODE,
            0
          )
        }
        parent = createdParents[curr]
      }
      return parent
    }
    function base(path) {
      var parts = path.split('/')
      return parts[parts.length - 1]
    }
    Array.prototype.forEach.call(mount.opts['files'] || [], function(file) {
      WORKERFS.createNode(
        ensureParent(file.name),
        base(file.name),
        WORKERFS.FILE_MODE,
        0,
        file,
        file.lastModifiedDate
      )
    })
    ;(mount.opts['blobs'] || []).forEach(function(obj) {
      WORKERFS.createNode(
        ensureParent(obj['name']),
        base(obj['name']),
        WORKERFS.FILE_MODE,
        0,
        obj['data']
      )
    })
    ;(mount.opts['packages'] || []).forEach(function(pack) {
      pack['metadata'].files.forEach(function(file) {
        var name = file.filename.substr(1)
        WORKERFS.createNode(
          ensureParent(name),
          base(name),
          WORKERFS.FILE_MODE,
          0,
          pack['blob'].slice(file.start, file.end)
        )
      })
    })
    return root
  },
  createNode: function(parent, name, mode, dev, contents, mtime) {
    var node = FS.createNode(parent, name, mode)
    node.mode = mode
    node.node_ops = WORKERFS.node_ops
    node.stream_ops = WORKERFS.stream_ops
    node.timestamp = (mtime || new Date()).getTime()
    assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE)
    if (mode === WORKERFS.FILE_MODE) {
      node.size = contents.size
      node.contents = contents
    } else {
      node.size = 4096
      node.contents = {}
    }
    if (parent) {
      parent.contents[name] = node
    }
    return node
  },
  node_ops: {
    getattr: function(node) {
      return {
        dev: 1,
        ino: undefined,
        mode: node.mode,
        nlink: 1,
        uid: 0,
        gid: 0,
        rdev: undefined,
        size: node.size,
        atime: new Date(node.timestamp),
        mtime: new Date(node.timestamp),
        ctime: new Date(node.timestamp),
        blksize: 4096,
        blocks: Math.ceil(node.size / 4096)
      }
    },
    setattr: function(node, attr) {
      if (attr.mode !== undefined) {
        node.mode = attr.mode
      }
      if (attr.timestamp !== undefined) {
        node.timestamp = attr.timestamp
      }
    },
    lookup: function(parent, name) {
      throw new FS.ErrnoError(2)
    },
    mknod: function(parent, name, mode, dev) {
      throw new FS.ErrnoError(1)
    },
    rename: function(oldNode, newDir, newName) {
      throw new FS.ErrnoError(1)
    },
    unlink: function(parent, name) {
      throw new FS.ErrnoError(1)
    },
    rmdir: function(parent, name) {
      throw new FS.ErrnoError(1)
    },
    readdir: function(node) {
      var entries = ['.', '..']
      for (var key in node.contents) {
        if (!node.contents.hasOwnProperty(key)) {
          continue
        }
        entries.push(key)
      }
      return entries
    },
    symlink: function(parent, newName, oldPath) {
      throw new FS.ErrnoError(1)
    },
    readlink: function(node) {
      throw new FS.ErrnoError(1)
    }
  },
  stream_ops: {
    read: function(stream, buffer, offset, length, position) {
      if (position >= stream.node.size) return 0
      var chunk = stream.node.contents.slice(position, position + length)
      var ab = WORKERFS.reader.readAsArrayBuffer(chunk)
      buffer.set(new Uint8Array(ab), offset)
      return chunk.size
    },
    write: function(stream, buffer, offset, length, position) {
      throw new FS.ErrnoError(5)
    },
    llseek: function(stream, offset, whence) {
      var position = offset
      if (whence === 1) {
        position += stream.position
      } else if (whence === 2) {
        if (FS.isFile(stream.node.mode)) {
          position += stream.node.size
        }
      }
      if (position < 0) {
        throw new FS.ErrnoError(22)
      }
      return position
    }
  }
}
var FS = {
  root: null,
  mounts: [],
  devices: {},
  streams: [],
  nextInode: 1,
  nameTable: null,
  currentPath: '/',
  initialized: false,
  ignorePermissions: true,
  trackingDelegate: {},
  tracking: { openFlags: { READ: 1, WRITE: 2 } },
  ErrnoError: null,
  genericErrors: {},
  filesystems: null,
  syncFSRequests: 0,
  handleFSError: function(e) {
    if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace()
    return ___setErrNo(e.errno)
  },
  lookupPath: function(path, opts) {
    path = PATH_FS.resolve(FS.cwd(), path)
    opts = opts || {}
    if (!path) return { path: '', node: null }
    var defaults = { follow_mount: true, recurse_count: 0 }
    for (var key in defaults) {
      if (opts[key] === undefined) {
        opts[key] = defaults[key]
      }
    }
    if (opts.recurse_count > 8) {
      throw new FS.ErrnoError(40)
    }
    var parts = PATH.normalizeArray(
      path.split('/').filter(function(p) {
        return !!p
      }),
      false
    )
    var current = FS.root
    var current_path = '/'
    for (var i = 0; i < parts.length; i++) {
      var islast = i === parts.length - 1
      if (islast && opts.parent) {
        break
      }
      current = FS.lookupNode(current, parts[i])
      current_path = PATH.join2(current_path, parts[i])
      if (FS.isMountpoint(current)) {
        if (!islast || (islast && opts.follow_mount)) {
          current = current.mounted.root
        }
      }
      if (!islast || opts.follow) {
        var count = 0
        while (FS.isLink(current.mode)) {
          var link = FS.readlink(current_path)
          current_path = PATH_FS.resolve(PATH.dirname(current_path), link)
          var lookup = FS.lookupPath(current_path, {
            recurse_count: opts.recurse_count
          })
          current = lookup.node
          if (count++ > 40) {
            throw new FS.ErrnoError(40)
          }
        }
      }
    }
    return { path: current_path, node: current }
  },
  getPath: function(node) {
    var path
    while (true) {
      if (FS.isRoot(node)) {
        var mount = node.mount.mountpoint
        if (!path) return mount
        return mount[mount.length - 1] !== '/'
          ? mount + '/' + path
          : mount + path
      }
      path = path ? node.name + '/' + path : node.name
      node = node.parent
    }
  },
  hashName: function(parentid, name) {
    var hash = 0
    for (var i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
    }
    return ((parentid + hash) >>> 0) % FS.nameTable.length
  },
  hashAddNode: function(node) {
    var hash = FS.hashName(node.parent.id, node.name)
    node.name_next = FS.nameTable[hash]
    FS.nameTable[hash] = node
  },
  hashRemoveNode: function(node) {
    var hash = FS.hashName(node.parent.id, node.name)
    if (FS.nameTable[hash] === node) {
      FS.nameTable[hash] = node.name_next
    } else {
      var current = FS.nameTable[hash]
      while (current) {
        if (current.name_next === node) {
          current.name_next = node.name_next
          break
        }
        current = current.name_next
      }
    }
  },
  lookupNode: function(parent, name) {
    var err = FS.mayLookup(parent)
    if (err) {
      throw new FS.ErrnoError(err, parent)
    }
    var hash = FS.hashName(parent.id, name)
    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
      var nodeName = node.name
      if (node.parent.id === parent.id && nodeName === name) {
        return node
      }
    }
    return FS.lookup(parent, name)
  },
  createNode: function(parent, name, mode, rdev) {
    if (!FS.FSNode) {
      FS.FSNode = function(parent, name, mode, rdev) {
        if (!parent) {
          parent = this
        }
        this.parent = parent
        this.mount = parent.mount
        this.mounted = null
        this.id = FS.nextInode++
        this.name = name
        this.mode = mode
        this.node_ops = {}
        this.stream_ops = {}
        this.rdev = rdev
      }
      FS.FSNode.prototype = {}
      var readMode = 292 | 73
      var writeMode = 146
      Object.defineProperties(FS.FSNode.prototype, {
        read: {
          get: function() {
            return (this.mode & readMode) === readMode
          },
          set: function(val) {
            val ? (this.mode |= readMode) : (this.mode &= ~readMode)
          }
        },
        write: {
          get: function() {
            return (this.mode & writeMode) === writeMode
          },
          set: function(val) {
            val ? (this.mode |= writeMode) : (this.mode &= ~writeMode)
          }
        },
        isFolder: {
          get: function() {
            return FS.isDir(this.mode)
          }
        },
        isDevice: {
          get: function() {
            return FS.isChrdev(this.mode)
          }
        }
      })
    }
    var node = new FS.FSNode(parent, name, mode, rdev)
    FS.hashAddNode(node)
    return node
  },
  destroyNode: function(node) {
    FS.hashRemoveNode(node)
  },
  isRoot: function(node) {
    return node === node.parent
  },
  isMountpoint: function(node) {
    return !!node.mounted
  },
  isFile: function(mode) {
    return (mode & 61440) === 32768
  },
  isDir: function(mode) {
    return (mode & 61440) === 16384
  },
  isLink: function(mode) {
    return (mode & 61440) === 40960
  },
  isChrdev: function(mode) {
    return (mode & 61440) === 8192
  },
  isBlkdev: function(mode) {
    return (mode & 61440) === 24576
  },
  isFIFO: function(mode) {
    return (mode & 61440) === 4096
  },
  isSocket: function(mode) {
    return (mode & 49152) === 49152
  },
  flagModes: {
    r: 0,
    rs: 1052672,
    'r+': 2,
    w: 577,
    wx: 705,
    xw: 705,
    'w+': 578,
    'wx+': 706,
    'xw+': 706,
    a: 1089,
    ax: 1217,
    xa: 1217,
    'a+': 1090,
    'ax+': 1218,
    'xa+': 1218
  },
  modeStringToFlags: function(str) {
    var flags = FS.flagModes[str]
    if (typeof flags === 'undefined') {
      throw new Error('Unknown file open mode: ' + str)
    }
    return flags
  },
  flagsToPermissionString: function(flag) {
    var perms = ['r', 'w', 'rw'][flag & 3]
    if (flag & 512) {
      perms += 'w'
    }
    return perms
  },
  nodePermissions: function(node, perms) {
    if (FS.ignorePermissions) {
      return 0
    }
    if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
      return 13
    } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
      return 13
    } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
      return 13
    }
    return 0
  },
  mayLookup: function(dir) {
    var err = FS.nodePermissions(dir, 'x')
    if (err) return err
    if (!dir.node_ops.lookup) return 13
    return 0
  },
  mayCreate: function(dir, name) {
    try {
      var node = FS.lookupNode(dir, name)
      return 17
    } catch (e) {}
    return FS.nodePermissions(dir, 'wx')
  },
  mayDelete: function(dir, name, isdir) {
    var node
    try {
      node = FS.lookupNode(dir, name)
    } catch (e) {
      return e.errno
    }
    var err = FS.nodePermissions(dir, 'wx')
    if (err) {
      return err
    }
    if (isdir) {
      if (!FS.isDir(node.mode)) {
        return 20
      }
      if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
        return 16
      }
    } else {
      if (FS.isDir(node.mode)) {
        return 21
      }
    }
    return 0
  },
  mayOpen: function(node, flags) {
    if (!node) {
      return 2
    }
    if (FS.isLink(node.mode)) {
      return 40
    } else if (FS.isDir(node.mode)) {
      if (FS.flagsToPermissionString(flags) !== 'r' || flags & 512) {
        return 21
      }
    }
    return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
  },
  MAX_OPEN_FDS: 4096,
  nextfd: function(fd_start, fd_end) {
    fd_start = fd_start || 0
    fd_end = fd_end || FS.MAX_OPEN_FDS
    for (var fd = fd_start; fd <= fd_end; fd++) {
      if (!FS.streams[fd]) {
        return fd
      }
    }
    throw new FS.ErrnoError(24)
  },
  getStream: function(fd) {
    return FS.streams[fd]
  },
  createStream: function(stream, fd_start, fd_end) {
    if (!FS.FSStream) {
      FS.FSStream = function() {}
      FS.FSStream.prototype = {}
      Object.defineProperties(FS.FSStream.prototype, {
        object: {
          get: function() {
            return this.node
          },
          set: function(val) {
            this.node = val
          }
        },
        isRead: {
          get: function() {
            return (this.flags & 2097155) !== 1
          }
        },
        isWrite: {
          get: function() {
            return (this.flags & 2097155) !== 0
          }
        },
        isAppend: {
          get: function() {
            return this.flags & 1024
          }
        }
      })
    }
    var newStream = new FS.FSStream()
    for (var p in stream) {
      newStream[p] = stream[p]
    }
    stream = newStream
    var fd = FS.nextfd(fd_start, fd_end)
    stream.fd = fd
    FS.streams[fd] = stream
    return stream
  },
  closeStream: function(fd) {
    FS.streams[fd] = null
  },
  chrdev_stream_ops: {
    open: function(stream) {
      var device = FS.getDevice(stream.node.rdev)
      stream.stream_ops = device.stream_ops
      if (stream.stream_ops.open) {
        stream.stream_ops.open(stream)
      }
    },
    llseek: function() {
      throw new FS.ErrnoError(29)
    }
  },
  major: function(dev) {
    return dev >> 8
  },
  minor: function(dev) {
    return dev & 255
  },
  makedev: function(ma, mi) {
    return (ma << 8) | mi
  },
  registerDevice: function(dev, ops) {
    FS.devices[dev] = { stream_ops: ops }
  },
  getDevice: function(dev) {
    return FS.devices[dev]
  },
  getMounts: function(mount) {
    var mounts = []
    var check = [mount]
    while (check.length) {
      var m = check.pop()
      mounts.push(m)
      check.push.apply(check, m.mounts)
    }
    return mounts
  },
  syncfs: function(populate, callback) {
    if (typeof populate === 'function') {
      callback = populate
      populate = false
    }
    FS.syncFSRequests++
    if (FS.syncFSRequests > 1) {
      console.log(
        'warning: ' +
          FS.syncFSRequests +
          ' FS.syncfs operations in flight at once, probably just doing extra work'
      )
    }
    var mounts = FS.getMounts(FS.root.mount)
    var completed = 0
    function doCallback(err) {
      FS.syncFSRequests--
      return callback(err)
    }
    function done(err) {
      if (err) {
        if (!done.errored) {
          done.errored = true
          return doCallback(err)
        }
        return
      }
      if (++completed >= mounts.length) {
        doCallback(null)
      }
    }
    mounts.forEach(function(mount) {
      if (!mount.type.syncfs) {
        return done(null)
      }
      mount.type.syncfs(mount, populate, done)
    })
  },
  mount: function(type, opts, mountpoint) {
    var root = mountpoint === '/'
    var pseudo = !mountpoint
    var node
    if (root && FS.root) {
      throw new FS.ErrnoError(16)
    } else if (!root && !pseudo) {
      var lookup = FS.lookupPath(mountpoint, { follow_mount: false })
      mountpoint = lookup.path
      node = lookup.node
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(16)
      }
      if (!FS.isDir(node.mode)) {
        throw new FS.ErrnoError(20)
      }
    }
    var mount = { type: type, opts: opts, mountpoint: mountpoint, mounts: [] }
    var mountRoot = type.mount(mount)
    mountRoot.mount = mount
    mount.root = mountRoot
    if (root) {
      FS.root = mountRoot
    } else if (node) {
      node.mounted = mount
      if (node.mount) {
        node.mount.mounts.push(mount)
      }
    }
    return mountRoot
  },
  unmount: function(mountpoint) {
    var lookup = FS.lookupPath(mountpoint, { follow_mount: false })
    if (!FS.isMountpoint(lookup.node)) {
      throw new FS.ErrnoError(22)
    }
    var node = lookup.node
    var mount = node.mounted
    var mounts = FS.getMounts(mount)
    Object.keys(FS.nameTable).forEach(function(hash) {
      var current = FS.nameTable[hash]
      while (current) {
        var next = current.name_next
        if (mounts.indexOf(current.mount) !== -1) {
          FS.destroyNode(current)
        }
        current = next
      }
    })
    node.mounted = null
    var idx = node.mount.mounts.indexOf(mount)
    node.mount.mounts.splice(idx, 1)
  },
  lookup: function(parent, name) {
    return parent.node_ops.lookup(parent, name)
  },
  mknod: function(path, mode, dev) {
    var lookup = FS.lookupPath(path, { parent: true })
    var parent = lookup.node
    var name = PATH.basename(path)
    if (!name || name === '.' || name === '..') {
      throw new FS.ErrnoError(22)
    }
    var err = FS.mayCreate(parent, name)
    if (err) {
      throw new FS.ErrnoError(err)
    }
    if (!parent.node_ops.mknod) {
      throw new FS.ErrnoError(1)
    }
    return parent.node_ops.mknod(parent, name, mode, dev)
  },
  create: function(path, mode) {
    mode = mode !== undefined ? mode : 438
    mode &= 4095
    mode |= 32768
    return FS.mknod(path, mode, 0)
  },
  mkdir: function(path, mode) {
    mode = mode !== undefined ? mode : 511
    mode &= 511 | 512
    mode |= 16384
    return FS.mknod(path, mode, 0)
  },
  mkdirTree: function(path, mode) {
    var dirs = path.split('/')
    var d = ''
    for (var i = 0; i < dirs.length; ++i) {
      if (!dirs[i]) continue
      d += '/' + dirs[i]
      try {
        FS.mkdir(d, mode)
      } catch (e) {
        if (e.errno != 17) throw e
      }
    }
  },
  mkdev: function(path, mode, dev) {
    if (typeof dev === 'undefined') {
      dev = mode
      mode = 438
    }
    mode |= 8192
    return FS.mknod(path, mode, dev)
  },
  symlink: function(oldpath, newpath) {
    if (!PATH_FS.resolve(oldpath)) {
      throw new FS.ErrnoError(2)
    }
    var lookup = FS.lookupPath(newpath, { parent: true })
    var parent = lookup.node
    if (!parent) {
      throw new FS.ErrnoError(2)
    }
    var newname = PATH.basename(newpath)
    var err = FS.mayCreate(parent, newname)
    if (err) {
      throw new FS.ErrnoError(err)
    }
    if (!parent.node_ops.symlink) {
      throw new FS.ErrnoError(1)
    }
    return parent.node_ops.symlink(parent, newname, oldpath)
  },
  rename: function(old_path, new_path) {
    var old_dirname = PATH.dirname(old_path)
    var new_dirname = PATH.dirname(new_path)
    var old_name = PATH.basename(old_path)
    var new_name = PATH.basename(new_path)
    var lookup, old_dir, new_dir
    try {
      lookup = FS.lookupPath(old_path, { parent: true })
      old_dir = lookup.node
      lookup = FS.lookupPath(new_path, { parent: true })
      new_dir = lookup.node
    } catch (e) {
      throw new FS.ErrnoError(16)
    }
    if (!old_dir || !new_dir) throw new FS.ErrnoError(2)
    if (old_dir.mount !== new_dir.mount) {
      throw new FS.ErrnoError(18)
    }
    var old_node = FS.lookupNode(old_dir, old_name)
    var relative = PATH_FS.relative(old_path, new_dirname)
    if (relative.charAt(0) !== '.') {
      throw new FS.ErrnoError(22)
    }
    relative = PATH_FS.relative(new_path, old_dirname)
    if (relative.charAt(0) !== '.') {
      throw new FS.ErrnoError(39)
    }
    var new_node
    try {
      new_node = FS.lookupNode(new_dir, new_name)
    } catch (e) {}
    if (old_node === new_node) {
      return
    }
    var isdir = FS.isDir(old_node.mode)
    var err = FS.mayDelete(old_dir, old_name, isdir)
    if (err) {
      throw new FS.ErrnoError(err)
    }
    err = new_node
      ? FS.mayDelete(new_dir, new_name, isdir)
      : FS.mayCreate(new_dir, new_name)
    if (err) {
      throw new FS.ErrnoError(err)
    }
    if (!old_dir.node_ops.rename) {
      throw new FS.ErrnoError(1)
    }
    if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
      throw new FS.ErrnoError(16)
    }
    if (new_dir !== old_dir) {
      err = FS.nodePermissions(old_dir, 'w')
      if (err) {
        throw new FS.ErrnoError(err)
      }
    }
    try {
      if (FS.trackingDelegate['willMovePath']) {
        FS.trackingDelegate['willMovePath'](old_path, new_path)
      }
    } catch (e) {
      console.log(
        "FS.trackingDelegate['willMovePath']('" +
          old_path +
          "', '" +
          new_path +
          "') threw an exception: " +
          e.message
      )
    }
    FS.hashRemoveNode(old_node)
    try {
      old_dir.node_ops.rename(old_node, new_dir, new_name)
    } catch (e) {
      throw e
    } finally {
      FS.hashAddNode(old_node)
    }
    try {
      if (FS.trackingDelegate['onMovePath'])
        FS.trackingDelegate['onMovePath'](old_path, new_path)
    } catch (e) {
      console.log(
        "FS.trackingDelegate['onMovePath']('" +
          old_path +
          "', '" +
          new_path +
          "') threw an exception: " +
          e.message
      )
    }
  },
  rmdir: function(path) {
    var lookup = FS.lookupPath(path, { parent: true })
    var parent = lookup.node
    var name = PATH.basename(path)
    var node = FS.lookupNode(parent, name)
    var err = FS.mayDelete(parent, name, true)
    if (err) {
      throw new FS.ErrnoError(err)
    }
    if (!parent.node_ops.rmdir) {
      throw new FS.ErrnoError(1)
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(16)
    }
    try {
      if (FS.trackingDelegate['willDeletePath']) {
        FS.trackingDelegate['willDeletePath'](path)
      }
    } catch (e) {
      console.log(
        "FS.trackingDelegate['willDeletePath']('" +
          path +
          "') threw an exception: " +
          e.message
      )
    }
    parent.node_ops.rmdir(parent, name)
    FS.destroyNode(node)
    try {
      if (FS.trackingDelegate['onDeletePath'])
        FS.trackingDelegate['onDeletePath'](path)
    } catch (e) {
      console.log(
        "FS.trackingDelegate['onDeletePath']('" +
          path +
          "') threw an exception: " +
          e.message
      )
    }
  },
  readdir: function(path) {
    var lookup = FS.lookupPath(path, { follow: true })
    var node = lookup.node
    if (!node.node_ops.readdir) {
      throw new FS.ErrnoError(20)
    }
    return node.node_ops.readdir(node)
  },
  unlink: function(path) {
    var lookup = FS.lookupPath(path, { parent: true })
    var parent = lookup.node
    var name = PATH.basename(path)
    var node = FS.lookupNode(parent, name)
    var err = FS.mayDelete(parent, name, false)
    if (err) {
      throw new FS.ErrnoError(err)
    }
    if (!parent.node_ops.unlink) {
      throw new FS.ErrnoError(1)
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(16)
    }
    try {
      if (FS.trackingDelegate['willDeletePath']) {
        FS.trackingDelegate['willDeletePath'](path)
      }
    } catch (e) {
      console.log(
        "FS.trackingDelegate['willDeletePath']('" +
          path +
          "') threw an exception: " +
          e.message
      )
    }
    parent.node_ops.unlink(parent, name)
    FS.destroyNode(node)
    try {
      if (FS.trackingDelegate['onDeletePath'])
        FS.trackingDelegate['onDeletePath'](path)
    } catch (e) {
      console.log(
        "FS.trackingDelegate['onDeletePath']('" +
          path +
          "') threw an exception: " +
          e.message
      )
    }
  },
  readlink: function(path) {
    var lookup = FS.lookupPath(path)
    var link = lookup.node
    if (!link) {
      throw new FS.ErrnoError(2)
    }
    if (!link.node_ops.readlink) {
      throw new FS.ErrnoError(22)
    }
    return PATH_FS.resolve(
      FS.getPath(link.parent),
      link.node_ops.readlink(link)
    )
  },
  stat: function(path, dontFollow) {
    var lookup = FS.lookupPath(path, { follow: !dontFollow })
    var node = lookup.node
    if (!node) {
      throw new FS.ErrnoError(2)
    }
    if (!node.node_ops.getattr) {
      throw new FS.ErrnoError(1)
    }
    return node.node_ops.getattr(node)
  },
  lstat: function(path) {
    return FS.stat(path, true)
  },
  chmod: function(path, mode, dontFollow) {
    var node
    if (typeof path === 'string') {
      var lookup = FS.lookupPath(path, { follow: !dontFollow })
      node = lookup.node
    } else {
      node = path
    }
    if (!node.node_ops.setattr) {
      throw new FS.ErrnoError(1)
    }
    node.node_ops.setattr(node, {
      mode: (mode & 4095) | (node.mode & ~4095),
      timestamp: Date.now()
    })
  },
  lchmod: function(path, mode) {
    FS.chmod(path, mode, true)
  },
  fchmod: function(fd, mode) {
    var stream = FS.getStream(fd)
    if (!stream) {
      throw new FS.ErrnoError(9)
    }
    FS.chmod(stream.node, mode)
  },
  chown: function(path, uid, gid, dontFollow) {
    var node
    if (typeof path === 'string') {
      var lookup = FS.lookupPath(path, { follow: !dontFollow })
      node = lookup.node
    } else {
      node = path
    }
    if (!node.node_ops.setattr) {
      throw new FS.ErrnoError(1)
    }
    node.node_ops.setattr(node, { timestamp: Date.now() })
  },
  lchown: function(path, uid, gid) {
    FS.chown(path, uid, gid, true)
  },
  fchown: function(fd, uid, gid) {
    var stream = FS.getStream(fd)
    if (!stream) {
      throw new FS.ErrnoError(9)
    }
    FS.chown(stream.node, uid, gid)
  },
  truncate: function(path, len) {
    if (len < 0) {
      throw new FS.ErrnoError(22)
    }
    var node
    if (typeof path === 'string') {
      var lookup = FS.lookupPath(path, { follow: true })
      node = lookup.node
    } else {
      node = path
    }
    if (!node.node_ops.setattr) {
      throw new FS.ErrnoError(1)
    }
    if (FS.isDir(node.mode)) {
      throw new FS.ErrnoError(21)
    }
    if (!FS.isFile(node.mode)) {
      throw new FS.ErrnoError(22)
    }
    var err = FS.nodePermissions(node, 'w')
    if (err) {
      throw new FS.ErrnoError(err)
    }
    node.node_ops.setattr(node, { size: len, timestamp: Date.now() })
  },
  ftruncate: function(fd, len) {
    var stream = FS.getStream(fd)
    if (!stream) {
      throw new FS.ErrnoError(9)
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(22)
    }
    FS.truncate(stream.node, len)
  },
  utime: function(path, atime, mtime) {
    var lookup = FS.lookupPath(path, { follow: true })
    var node = lookup.node
    node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) })
  },
  open: function(path, flags, mode, fd_start, fd_end) {
    if (path === '') {
      throw new FS.ErrnoError(2)
    }
    flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags
    mode = typeof mode === 'undefined' ? 438 : mode
    if (flags & 64) {
      mode = (mode & 4095) | 32768
    } else {
      mode = 0
    }
    var node
    if (typeof path === 'object') {
      node = path
    } else {
      path = PATH.normalize(path)
      try {
        var lookup = FS.lookupPath(path, { follow: !(flags & 131072) })
        node = lookup.node
      } catch (e) {}
    }
    var created = false
    if (flags & 64) {
      if (node) {
        if (flags & 128) {
          throw new FS.ErrnoError(17)
        }
      } else {
        node = FS.mknod(path, mode, 0)
        created = true
      }
    }
    if (!node) {
      throw new FS.ErrnoError(2)
    }
    if (FS.isChrdev(node.mode)) {
      flags &= ~512
    }
    if (flags & 65536 && !FS.isDir(node.mode)) {
      throw new FS.ErrnoError(20)
    }
    if (!created) {
      var err = FS.mayOpen(node, flags)
      if (err) {
        throw new FS.ErrnoError(err)
      }
    }
    if (flags & 512) {
      FS.truncate(node, 0)
    }
    flags &= ~(128 | 512)
    var stream = FS.createStream(
      {
        node: node,
        path: FS.getPath(node),
        flags: flags,
        seekable: true,
        position: 0,
        stream_ops: node.stream_ops,
        ungotten: [],
        error: false
      },
      fd_start,
      fd_end
    )
    if (stream.stream_ops.open) {
      stream.stream_ops.open(stream)
    }
    if (Module['logReadFiles'] && !(flags & 1)) {
      if (!FS.readFiles) FS.readFiles = {}
      if (!(path in FS.readFiles)) {
        FS.readFiles[path] = 1
        console.log('FS.trackingDelegate error on read file: ' + path)
      }
    }
    try {
      if (FS.trackingDelegate['onOpenFile']) {
        var trackingFlags = 0
        if ((flags & 2097155) !== 1) {
          trackingFlags |= FS.tracking.openFlags.READ
        }
        if ((flags & 2097155) !== 0) {
          trackingFlags |= FS.tracking.openFlags.WRITE
        }
        FS.trackingDelegate['onOpenFile'](path, trackingFlags)
      }
    } catch (e) {
      console.log(
        "FS.trackingDelegate['onOpenFile']('" +
          path +
          "', flags) threw an exception: " +
          e.message
      )
    }
    return stream
  },
  close: function(stream) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(9)
    }
    if (stream.getdents) stream.getdents = null
    try {
      if (stream.stream_ops.close) {
        stream.stream_ops.close(stream)
      }
    } catch (e) {
      throw e
    } finally {
      FS.closeStream(stream.fd)
    }
    stream.fd = null
  },
  isClosed: function(stream) {
    return stream.fd === null
  },
  llseek: function(stream, offset, whence) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(9)
    }
    if (!stream.seekable || !stream.stream_ops.llseek) {
      throw new FS.ErrnoError(29)
    }
    if (whence != 0 && whence != 1 && whence != 2) {
      throw new FS.ErrnoError(22)
    }
    stream.position = stream.stream_ops.llseek(stream, offset, whence)
    stream.ungotten = []
    return stream.position
  },
  read: function(stream, buffer, offset, length, position) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(22)
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(9)
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(9)
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(21)
    }
    if (!stream.stream_ops.read) {
      throw new FS.ErrnoError(22)
    }
    var seeking = typeof position !== 'undefined'
    if (!seeking) {
      position = stream.position
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(29)
    }
    var bytesRead = stream.stream_ops.read(
      stream,
      buffer,
      offset,
      length,
      position
    )
    if (!seeking) stream.position += bytesRead
    return bytesRead
  },
  write: function(stream, buffer, offset, length, position, canOwn) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(22)
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(9)
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(9)
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(21)
    }
    if (!stream.stream_ops.write) {
      throw new FS.ErrnoError(22)
    }
    if (stream.flags & 1024) {
      FS.llseek(stream, 0, 2)
    }
    var seeking = typeof position !== 'undefined'
    if (!seeking) {
      position = stream.position
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(29)
    }
    var bytesWritten = stream.stream_ops.write(
      stream,
      buffer,
      offset,
      length,
      position,
      canOwn
    )
    if (!seeking) stream.position += bytesWritten
    try {
      if (stream.path && FS.trackingDelegate['onWriteToFile'])
        FS.trackingDelegate['onWriteToFile'](stream.path)
    } catch (e) {
      console.log(
        "FS.trackingDelegate['onWriteToFile']('" +
          stream.path +
          "') threw an exception: " +
          e.message
      )
    }
    return bytesWritten
  },
  allocate: function(stream, offset, length) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(9)
    }
    if (offset < 0 || length <= 0) {
      throw new FS.ErrnoError(22)
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(9)
    }
    if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(19)
    }
    if (!stream.stream_ops.allocate) {
      throw new FS.ErrnoError(95)
    }
    stream.stream_ops.allocate(stream, offset, length)
  },
  mmap: function(stream, buffer, offset, length, position, prot, flags) {
    if (
      (prot & 2) !== 0 &&
      (flags & 2) === 0 &&
      (stream.flags & 2097155) !== 2
    ) {
      throw new FS.ErrnoError(13)
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(13)
    }
    if (!stream.stream_ops.mmap) {
      throw new FS.ErrnoError(19)
    }
    return stream.stream_ops.mmap(
      stream,
      buffer,
      offset,
      length,
      position,
      prot,
      flags
    )
  },
  msync: function(stream, buffer, offset, length, mmapFlags) {
    if (!stream || !stream.stream_ops.msync) {
      return 0
    }
    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
  },
  munmap: function(stream) {
    return 0
  },
  ioctl: function(stream, cmd, arg) {
    if (!stream.stream_ops.ioctl) {
      throw new FS.ErrnoError(25)
    }
    return stream.stream_ops.ioctl(stream, cmd, arg)
  },
  readFile: function(path, opts) {
    opts = opts || {}
    opts.flags = opts.flags || 'r'
    opts.encoding = opts.encoding || 'binary'
    if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
      throw new Error('Invalid encoding type "' + opts.encoding + '"')
    }
    var ret
    var stream = FS.open(path, opts.flags)
    var stat = FS.stat(path)
    var length = stat.size
    var buf = new Uint8Array(length)
    FS.read(stream, buf, 0, length, 0)
    if (opts.encoding === 'utf8') {
      ret = UTF8ArrayToString(buf, 0)
    } else if (opts.encoding === 'binary') {
      ret = buf
    }
    FS.close(stream)
    return ret
  },
  writeFile: function(path, data, opts) {
    opts = opts || {}
    opts.flags = opts.flags || 'w'
    var stream = FS.open(path, opts.flags, opts.mode)
    if (typeof data === 'string') {
      var buf = new Uint8Array(lengthBytesUTF8(data) + 1)
      var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length)
      FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
    } else if (ArrayBuffer.isView(data)) {
      FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
    } else {
      throw new Error('Unsupported data type')
    }
    FS.close(stream)
  },
  cwd: function() {
    return FS.currentPath
  },
  chdir: function(path) {
    var lookup = FS.lookupPath(path, { follow: true })
    if (lookup.node === null) {
      throw new FS.ErrnoError(2)
    }
    if (!FS.isDir(lookup.node.mode)) {
      throw new FS.ErrnoError(20)
    }
    var err = FS.nodePermissions(lookup.node, 'x')
    if (err) {
      throw new FS.ErrnoError(err)
    }
    FS.currentPath = lookup.path
  },
  createDefaultDirectories: function() {
    FS.mkdir('/tmp')
    FS.mkdir('/home')
    FS.mkdir('/home/web_user')
  },
  createDefaultDevices: function() {
    FS.mkdir('/dev')
    FS.registerDevice(FS.makedev(1, 3), {
      read: function() {
        return 0
      },
      write: function(stream, buffer, offset, length, pos) {
        return length
      }
    })
    FS.mkdev('/dev/null', FS.makedev(1, 3))
    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops)
    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops)
    FS.mkdev('/dev/tty', FS.makedev(5, 0))
    FS.mkdev('/dev/tty1', FS.makedev(6, 0))
    var random_device
    if (
      typeof crypto === 'object' &&
      typeof crypto['getRandomValues'] === 'function'
    ) {
      var randomBuffer = new Uint8Array(1)
      random_device = function() {
        crypto.getRandomValues(randomBuffer)
        return randomBuffer[0]
      }
    } else if (ENVIRONMENT_IS_NODE) {
      try {
        var crypto_module = require('crypto')
        random_device = function() {
          return crypto_module['randomBytes'](1)[0]
        }
      } catch (e) {}
    } else {
    }
    if (!random_device) {
      random_device = function() {
        abort('random_device')
      }
    }
    FS.createDevice('/dev', 'random', random_device)
    FS.createDevice('/dev', 'urandom', random_device)
    FS.mkdir('/dev/shm')
    FS.mkdir('/dev/shm/tmp')
  },
  createSpecialDirectories: function() {
    FS.mkdir('/proc')
    FS.mkdir('/proc/self')
    FS.mkdir('/proc/self/fd')
    FS.mount(
      {
        mount: function() {
          var node = FS.createNode('/proc/self', 'fd', 16384 | 511, 73)
          node.node_ops = {
            lookup: function(parent, name) {
              var fd = +name
              var stream = FS.getStream(fd)
              if (!stream) throw new FS.ErrnoError(9)
              var ret = {
                parent: null,
                mount: { mountpoint: 'fake' },
                node_ops: {
                  readlink: function() {
                    return stream.path
                  }
                }
              }
              ret.parent = ret
              return ret
            }
          }
          return node
        }
      },
      {},
      '/proc/self/fd'
    )
  },
  createStandardStreams: function() {
    if (Module['stdin']) {
      FS.createDevice('/dev', 'stdin', Module['stdin'])
    } else {
      FS.symlink('/dev/tty', '/dev/stdin')
    }
    if (Module['stdout']) {
      FS.createDevice('/dev', 'stdout', null, Module['stdout'])
    } else {
      FS.symlink('/dev/tty', '/dev/stdout')
    }
    if (Module['stderr']) {
      FS.createDevice('/dev', 'stderr', null, Module['stderr'])
    } else {
      FS.symlink('/dev/tty1', '/dev/stderr')
    }
    var stdin = FS.open('/dev/stdin', 'r')
    var stdout = FS.open('/dev/stdout', 'w')
    var stderr = FS.open('/dev/stderr', 'w')
  },
  ensureErrnoError: function() {
    if (FS.ErrnoError) return
    FS.ErrnoError = function ErrnoError(errno, node) {
      this.node = node
      this.setErrno = function(errno) {
        this.errno = errno
      }
      this.setErrno(errno)
      this.message = 'FS error'
    }
    FS.ErrnoError.prototype = new Error()
    FS.ErrnoError.prototype.constructor = FS.ErrnoError
    ;[2].forEach(function(code) {
      FS.genericErrors[code] = new FS.ErrnoError(code)
      FS.genericErrors[code].stack = '<generic error, no stack>'
    })
  },
  staticInit: function() {
    FS.ensureErrnoError()
    FS.nameTable = new Array(4096)
    FS.mount(MEMFS, {}, '/')
    FS.createDefaultDirectories()
    FS.createDefaultDevices()
    FS.createSpecialDirectories()
    FS.filesystems = {
      MEMFS: MEMFS,
      IDBFS: IDBFS,
      NODEFS: NODEFS,
      WORKERFS: WORKERFS
    }
  },
  init: function(input, output, error) {
    FS.init.initialized = true
    FS.ensureErrnoError()
    Module['stdin'] = input || Module['stdin']
    Module['stdout'] = output || Module['stdout']
    Module['stderr'] = error || Module['stderr']
    FS.createStandardStreams()
  },
  quit: function() {
    FS.init.initialized = false
    var fflush = Module['_fflush']
    if (fflush) fflush(0)
    for (var i = 0; i < FS.streams.length; i++) {
      var stream = FS.streams[i]
      if (!stream) {
        continue
      }
      FS.close(stream)
    }
  },
  getMode: function(canRead, canWrite) {
    var mode = 0
    if (canRead) mode |= 292 | 73
    if (canWrite) mode |= 146
    return mode
  },
  joinPath: function(parts, forceRelative) {
    var path = PATH.join.apply(null, parts)
    if (forceRelative && path[0] == '/') path = path.substr(1)
    return path
  },
  absolutePath: function(relative, base) {
    return PATH_FS.resolve(base, relative)
  },
  standardizePath: function(path) {
    return PATH.normalize(path)
  },
  findObject: function(path, dontResolveLastLink) {
    var ret = FS.analyzePath(path, dontResolveLastLink)
    if (ret.exists) {
      return ret.object
    } else {
      ___setErrNo(ret.error)
      return null
    }
  },
  analyzePath: function(path, dontResolveLastLink) {
    try {
      var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink })
      path = lookup.path
    } catch (e) {}
    var ret = {
      isRoot: false,
      exists: false,
      error: 0,
      name: null,
      path: null,
      object: null,
      parentExists: false,
      parentPath: null,
      parentObject: null
    }
    try {
      var lookup = FS.lookupPath(path, { parent: true })
      ret.parentExists = true
      ret.parentPath = lookup.path
      ret.parentObject = lookup.node
      ret.name = PATH.basename(path)
      lookup = FS.lookupPath(path, { follow: !dontResolveLastLink })
      ret.exists = true
      ret.path = lookup.path
      ret.object = lookup.node
      ret.name = lookup.node.name
      ret.isRoot = lookup.path === '/'
    } catch (e) {
      ret.error = e.errno
    }
    return ret
  },
  createFolder: function(parent, name, canRead, canWrite) {
    var path = PATH.join2(
      typeof parent === 'string' ? parent : FS.getPath(parent),
      name
    )
    var mode = FS.getMode(canRead, canWrite)
    return FS.mkdir(path, mode)
  },
  createPath: function(parent, path, canRead, canWrite) {
    parent = typeof parent === 'string' ? parent : FS.getPath(parent)
    var parts = path.split('/').reverse()
    while (parts.length) {
      var part = parts.pop()
      if (!part) continue
      var current = PATH.join2(parent, part)
      try {
        FS.mkdir(current)
      } catch (e) {}
      parent = current
    }
    return current
  },
  createFile: function(parent, name, properties, canRead, canWrite) {
    var path = PATH.join2(
      typeof parent === 'string' ? parent : FS.getPath(parent),
      name
    )
    var mode = FS.getMode(canRead, canWrite)
    return FS.create(path, mode)
  },
  createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
    var path = name
      ? PATH.join2(
          typeof parent === 'string' ? parent : FS.getPath(parent),
          name
        )
      : parent
    var mode = FS.getMode(canRead, canWrite)
    var node = FS.create(path, mode)
    if (data) {
      if (typeof data === 'string') {
        var arr = new Array(data.length)
        for (var i = 0, len = data.length; i < len; ++i)
          arr[i] = data.charCodeAt(i)
        data = arr
      }
      FS.chmod(node, mode | 146)
      var stream = FS.open(node, 'w')
      FS.write(stream, data, 0, data.length, 0, canOwn)
      FS.close(stream)
      FS.chmod(node, mode)
    }
    return node
  },
  createDevice: function(parent, name, input, output) {
    var path = PATH.join2(
      typeof parent === 'string' ? parent : FS.getPath(parent),
      name
    )
    var mode = FS.getMode(!!input, !!output)
    if (!FS.createDevice.major) FS.createDevice.major = 64
    var dev = FS.makedev(FS.createDevice.major++, 0)
    FS.registerDevice(dev, {
      open: function(stream) {
        stream.seekable = false
      },
      close: function(stream) {
        if (output && output.buffer && output.buffer.length) {
          output(10)
        }
      },
      read: function(stream, buffer, offset, length, pos) {
        var bytesRead = 0
        for (var i = 0; i < length; i++) {
          var result
          try {
            result = input()
          } catch (e) {
            throw new FS.ErrnoError(5)
          }
          if (result === undefined && bytesRead === 0) {
            throw new FS.ErrnoError(11)
          }
          if (result === null || result === undefined) break
          bytesRead++
          buffer[offset + i] = result
        }
        if (bytesRead) {
          stream.node.timestamp = Date.now()
        }
        return bytesRead
      },
      write: function(stream, buffer, offset, length, pos) {
        for (var i = 0; i < length; i++) {
          try {
            output(buffer[offset + i])
          } catch (e) {
            throw new FS.ErrnoError(5)
          }
        }
        if (length) {
          stream.node.timestamp = Date.now()
        }
        return i
      }
    })
    return FS.mkdev(path, mode, dev)
  },
  createLink: function(parent, name, target, canRead, canWrite) {
    var path = PATH.join2(
      typeof parent === 'string' ? parent : FS.getPath(parent),
      name
    )
    return FS.symlink(target, path)
  },
  forceLoadFile: function(obj) {
    if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true
    var success = true
    if (typeof XMLHttpRequest !== 'undefined') {
      throw new Error(
        'Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.'
      )
    } else if (read_) {
      try {
        obj.contents = intArrayFromString(read_(obj.url), true)
        obj.usedBytes = obj.contents.length
      } catch (e) {
        success = false
      }
    } else {
      throw new Error('Cannot load without read() or XMLHttpRequest.')
    }
    if (!success) ___setErrNo(5)
    return success
  },
  createLazyFile: function(parent, name, url, canRead, canWrite) {
    function LazyUint8Array() {
      this.lengthKnown = false
      this.chunks = []
    }
    LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
      if (idx > this.length - 1 || idx < 0) {
        return undefined
      }
      var chunkOffset = idx % this.chunkSize
      var chunkNum = (idx / this.chunkSize) | 0
      return this.getter(chunkNum)[chunkOffset]
    }
    LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(
      getter
    ) {
      this.getter = getter
    }
    LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
      var xhr = new XMLHttpRequest()
      xhr.open('HEAD', url, false)
      xhr.send(null)
      if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
        throw new Error("Couldn't load " + url + '. Status: ' + xhr.status)
      var datalength = Number(xhr.getResponseHeader('Content-length'))
      var header
      var hasByteServing =
        (header = xhr.getResponseHeader('Accept-Ranges')) && header === 'bytes'
      var usesGzip =
        (header = xhr.getResponseHeader('Content-Encoding')) &&
        header === 'gzip'
      var chunkSize = 1024 * 1024
      if (!hasByteServing) chunkSize = datalength
      var doXHR = function(from, to) {
        if (from > to)
          throw new Error(
            'invalid range (' + from + ', ' + to + ') or no bytes requested!'
          )
        if (to > datalength - 1)
          throw new Error(
            'only ' + datalength + ' bytes available! programmer error!'
          )
        var xhr = new XMLHttpRequest()
        xhr.open('GET', url, false)
        if (datalength !== chunkSize)
          xhr.setRequestHeader('Range', 'bytes=' + from + '-' + to)
        if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer'
        if (xhr.overrideMimeType) {
          xhr.overrideMimeType('text/plain; charset=x-user-defined')
        }
        xhr.send(null)
        if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
          throw new Error("Couldn't load " + url + '. Status: ' + xhr.status)
        if (xhr.response !== undefined) {
          return new Uint8Array(xhr.response || [])
        } else {
          return intArrayFromString(xhr.responseText || '', true)
        }
      }
      var lazyArray = this
      lazyArray.setDataGetter(function(chunkNum) {
        var start = chunkNum * chunkSize
        var end = (chunkNum + 1) * chunkSize - 1
        end = Math.min(end, datalength - 1)
        if (typeof lazyArray.chunks[chunkNum] === 'undefined') {
          lazyArray.chunks[chunkNum] = doXHR(start, end)
        }
        if (typeof lazyArray.chunks[chunkNum] === 'undefined')
          throw new Error('doXHR failed!')
        return lazyArray.chunks[chunkNum]
      })
      if (usesGzip || !datalength) {
        chunkSize = datalength = 1
        datalength = this.getter(0).length
        chunkSize = datalength
        console.log(
          'LazyFiles on gzip forces download of the whole file when length is accessed'
        )
      }
      this._length = datalength
      this._chunkSize = chunkSize
      this.lengthKnown = true
    }
    if (typeof XMLHttpRequest !== 'undefined') {
      if (!ENVIRONMENT_IS_WORKER)
        throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc'
      var lazyArray = new LazyUint8Array()
      Object.defineProperties(lazyArray, {
        length: {
          get: function() {
            if (!this.lengthKnown) {
              this.cacheLength()
            }
            return this._length
          }
        },
        chunkSize: {
          get: function() {
            if (!this.lengthKnown) {
              this.cacheLength()
            }
            return this._chunkSize
          }
        }
      })
      var properties = { isDevice: false, contents: lazyArray }
    } else {
      var properties = { isDevice: false, url: url }
    }
    var node = FS.createFile(parent, name, properties, canRead, canWrite)
    if (properties.contents) {
      node.contents = properties.contents
    } else if (properties.url) {
      node.contents = null
      node.url = properties.url
    }
    Object.defineProperties(node, {
      usedBytes: {
        get: function() {
          return this.contents.length
        }
      }
    })
    var stream_ops = {}
    var keys = Object.keys(node.stream_ops)
    keys.forEach(function(key) {
      var fn = node.stream_ops[key]
      stream_ops[key] = function forceLoadLazyFile() {
        if (!FS.forceLoadFile(node)) {
          throw new FS.ErrnoError(5)
        }
        return fn.apply(null, arguments)
      }
    })
    stream_ops.read = function stream_ops_read(
      stream,
      buffer,
      offset,
      length,
      position
    ) {
      if (!FS.forceLoadFile(node)) {
        throw new FS.ErrnoError(5)
      }
      var contents = stream.node.contents
      if (position >= contents.length) return 0
      var size = Math.min(contents.length - position, length)
      if (contents.slice) {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents[position + i]
        }
      } else {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents.get(position + i)
        }
      }
      return size
    }
    node.stream_ops = stream_ops
    return node
  },
  createPreloadedFile: function(
    parent,
    name,
    url,
    canRead,
    canWrite,
    onload,
    onerror,
    dontCreateFile,
    canOwn,
    preFinish
  ) {
    Browser.init()
    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent
    var dep = getUniqueRunDependency('cp ' + fullname)
    function processData(byteArray) {
      function finish(byteArray) {
        if (preFinish) preFinish()
        if (!dontCreateFile) {
          FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
        }
        if (onload) onload()
        removeRunDependency(dep)
      }
      var handled = false
      Module['preloadPlugins'].forEach(function(plugin) {
        if (handled) return
        if (plugin['canHandle'](fullname)) {
          plugin['handle'](byteArray, fullname, finish, function() {
            if (onerror) onerror()
            removeRunDependency(dep)
          })
          handled = true
        }
      })
      if (!handled) finish(byteArray)
    }
    addRunDependency(dep)
    if (typeof url == 'string') {
      Browser.asyncLoad(
        url,
        function(byteArray) {
          processData(byteArray)
        },
        onerror
      )
    } else {
      processData(url)
    }
  },
  indexedDB: function() {
    return (
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB
    )
  },
  DB_NAME: function() {
    return 'EM_FS_' + window.location.pathname
  },
  DB_VERSION: 20,
  DB_STORE_NAME: 'FILE_DATA',
  saveFilesToDB: function(paths, onload, onerror) {
    onload = onload || function() {}
    onerror = onerror || function() {}
    var indexedDB = FS.indexedDB()
    try {
      var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
    } catch (e) {
      return onerror(e)
    }
    openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
      console.log('creating db')
      var db = openRequest.result
      db.createObjectStore(FS.DB_STORE_NAME)
    }
    openRequest.onsuccess = function openRequest_onsuccess() {
      var db = openRequest.result
      var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite')
      var files = transaction.objectStore(FS.DB_STORE_NAME)
      var ok = 0,
        fail = 0,
        total = paths.length
      function finish() {
        if (fail == 0) onload()
        else onerror()
      }
      paths.forEach(function(path) {
        var putRequest = files.put(FS.analyzePath(path).object.contents, path)
        putRequest.onsuccess = function putRequest_onsuccess() {
          ok++
          if (ok + fail == total) finish()
        }
        putRequest.onerror = function putRequest_onerror() {
          fail++
          if (ok + fail == total) finish()
        }
      })
      transaction.onerror = onerror
    }
    openRequest.onerror = onerror
  },
  loadFilesFromDB: function(paths, onload, onerror) {
    onload = onload || function() {}
    onerror = onerror || function() {}
    var indexedDB = FS.indexedDB()
    try {
      var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
    } catch (e) {
      return onerror(e)
    }
    openRequest.onupgradeneeded = onerror
    openRequest.onsuccess = function openRequest_onsuccess() {
      var db = openRequest.result
      try {
        var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly')
      } catch (e) {
        onerror(e)
        return
      }
      var files = transaction.objectStore(FS.DB_STORE_NAME)
      var ok = 0,
        fail = 0,
        total = paths.length
      function finish() {
        if (fail == 0) onload()
        else onerror()
      }
      paths.forEach(function(path) {
        var getRequest = files.get(path)
        getRequest.onsuccess = function getRequest_onsuccess() {
          if (FS.analyzePath(path).exists) {
            FS.unlink(path)
          }
          FS.createDataFile(
            PATH.dirname(path),
            PATH.basename(path),
            getRequest.result,
            true,
            true,
            true
          )
          ok++
          if (ok + fail == total) finish()
        }
        getRequest.onerror = function getRequest_onerror() {
          fail++
          if (ok + fail == total) finish()
        }
      })
      transaction.onerror = onerror
    }
    openRequest.onerror = onerror
  }
}
var SYSCALLS = {
  DEFAULT_POLLMASK: 5,
  mappings: {},
  umask: 511,
  calculateAt: function(dirfd, path) {
    if (path[0] !== '/') {
      var dir
      if (dirfd === -100) {
        dir = FS.cwd()
      } else {
        var dirstream = FS.getStream(dirfd)
        if (!dirstream) throw new FS.ErrnoError(9)
        dir = dirstream.path
      }
      path = PATH.join2(dir, path)
    }
    return path
  },
  doStat: function(func, path, buf) {
    try {
      var stat = func(path)
    } catch (e) {
      if (
        e &&
        e.node &&
        PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))
      ) {
        return -20
      }
      throw e
    }
    HEAP32[buf >> 2] = stat.dev
    HEAP32[(buf + 4) >> 2] = 0
    HEAP32[(buf + 8) >> 2] = stat.ino
    HEAP32[(buf + 12) >> 2] = stat.mode
    HEAP32[(buf + 16) >> 2] = stat.nlink
    HEAP32[(buf + 20) >> 2] = stat.uid
    HEAP32[(buf + 24) >> 2] = stat.gid
    HEAP32[(buf + 28) >> 2] = stat.rdev
    HEAP32[(buf + 32) >> 2] = 0
    ;(tempI64 = [
      stat.size >>> 0,
      ((tempDouble = stat.size),
      +Math_abs(tempDouble) >= 1
        ? tempDouble > 0
          ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>>
            0
          : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0)
    ]),
      (HEAP32[(buf + 40) >> 2] = tempI64[0]),
      (HEAP32[(buf + 44) >> 2] = tempI64[1])
    HEAP32[(buf + 48) >> 2] = 4096
    HEAP32[(buf + 52) >> 2] = stat.blocks
    HEAP32[(buf + 56) >> 2] = (stat.atime.getTime() / 1e3) | 0
    HEAP32[(buf + 60) >> 2] = 0
    HEAP32[(buf + 64) >> 2] = (stat.mtime.getTime() / 1e3) | 0
    HEAP32[(buf + 68) >> 2] = 0
    HEAP32[(buf + 72) >> 2] = (stat.ctime.getTime() / 1e3) | 0
    HEAP32[(buf + 76) >> 2] = 0
    ;(tempI64 = [
      stat.ino >>> 0,
      ((tempDouble = stat.ino),
      +Math_abs(tempDouble) >= 1
        ? tempDouble > 0
          ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>>
            0
          : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0)
    ]),
      (HEAP32[(buf + 80) >> 2] = tempI64[0]),
      (HEAP32[(buf + 84) >> 2] = tempI64[1])
    return 0
  },
  doMsync: function(addr, stream, len, flags) {
    var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len))
    FS.msync(stream, buffer, 0, len, flags)
  },
  doMkdir: function(path, mode) {
    path = PATH.normalize(path)
    if (path[path.length - 1] === '/') path = path.substr(0, path.length - 1)
    FS.mkdir(path, mode, 0)
    return 0
  },
  doMknod: function(path, mode, dev) {
    switch (mode & 61440) {
      case 32768:
      case 8192:
      case 24576:
      case 4096:
      case 49152:
        break
      default:
        return -22
    }
    FS.mknod(path, mode, dev)
    return 0
  },
  doReadlink: function(path, buf, bufsize) {
    if (bufsize <= 0) return -22
    var ret = FS.readlink(path)
    var len = Math.min(bufsize, lengthBytesUTF8(ret))
    var endChar = HEAP8[buf + len]
    stringToUTF8(ret, buf, bufsize + 1)
    HEAP8[buf + len] = endChar
    return len
  },
  doAccess: function(path, amode) {
    if (amode & ~7) {
      return -22
    }
    var node
    var lookup = FS.lookupPath(path, { follow: true })
    node = lookup.node
    if (!node) {
      return -2
    }
    var perms = ''
    if (amode & 4) perms += 'r'
    if (amode & 2) perms += 'w'
    if (amode & 1) perms += 'x'
    if (perms && FS.nodePermissions(node, perms)) {
      return -13
    }
    return 0
  },
  doDup: function(path, flags, suggestFD) {
    var suggest = FS.getStream(suggestFD)
    if (suggest) FS.close(suggest)
    return FS.open(path, flags, 0, suggestFD, suggestFD).fd
  },
  doReadv: function(stream, iov, iovcnt, offset) {
    var ret = 0
    for (var i = 0; i < iovcnt; i++) {
      var ptr = HEAP32[(iov + i * 8) >> 2]
      var len = HEAP32[(iov + (i * 8 + 4)) >> 2]
      var curr = FS.read(stream, HEAP8, ptr, len, offset)
      if (curr < 0) return -1
      ret += curr
      if (curr < len) break
    }
    return ret
  },
  doWritev: function(stream, iov, iovcnt, offset) {
    var ret = 0
    for (var i = 0; i < iovcnt; i++) {
      var ptr = HEAP32[(iov + i * 8) >> 2]
      var len = HEAP32[(iov + (i * 8 + 4)) >> 2]
      var curr = FS.write(stream, HEAP8, ptr, len, offset)
      if (curr < 0) return -1
      ret += curr
    }
    return ret
  },
  varargs: 0,
  get: function(varargs) {
    SYSCALLS.varargs += 4
    var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2]
    return ret
  },
  getStr: function() {
    var ret = UTF8ToString(SYSCALLS.get())
    return ret
  },
  getStreamFromFD: function() {
    var stream = FS.getStream(SYSCALLS.get())
    if (!stream) throw new FS.ErrnoError(9)
    return stream
  },
  get64: function() {
    var low = SYSCALLS.get(),
      high = SYSCALLS.get()
    return low
  },
  getZero: function() {
    SYSCALLS.get()
  }
}
function ___syscall140(which, varargs) {
  SYSCALLS.varargs = varargs
  try {
    var stream = SYSCALLS.getStreamFromFD(),
      offset_high = SYSCALLS.get(),
      offset_low = SYSCALLS.get(),
      result = SYSCALLS.get(),
      whence = SYSCALLS.get()
    var HIGH_OFFSET = 4294967296
    var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0)
    var DOUBLE_LIMIT = 9007199254740992
    if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
      return -75
    }
    FS.llseek(stream, offset, whence)
    ;(tempI64 = [
      stream.position >>> 0,
      ((tempDouble = stream.position),
      +Math_abs(tempDouble) >= 1
        ? tempDouble > 0
          ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>>
            0
          : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0)
    ]),
      (HEAP32[result >> 2] = tempI64[0]),
      (HEAP32[(result + 4) >> 2] = tempI64[1])
    if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null
    return 0
  } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e)
    return -e.errno
  }
}
function ___syscall221(which, varargs) {
  SYSCALLS.varargs = varargs
  try {
    var stream = SYSCALLS.getStreamFromFD(),
      cmd = SYSCALLS.get()
    switch (cmd) {
      case 0: {
        var arg = SYSCALLS.get()
        if (arg < 0) {
          return -22
        }
        var newStream
        newStream = FS.open(stream.path, stream.flags, 0, arg)
        return newStream.fd
      }
      case 1:
      case 2:
        return 0
      case 3:
        return stream.flags
      case 4: {
        var arg = SYSCALLS.get()
        stream.flags |= arg
        return 0
      }
      case 12: {
        var arg = SYSCALLS.get()
        var offset = 0
        HEAP16[(arg + offset) >> 1] = 2
        return 0
      }
      case 13:
      case 14:
        return 0
      case 16:
      case 8:
        return -22
      case 9:
        ___setErrNo(22)
        return -1
      default: {
        return -22
      }
    }
  } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e)
    return -e.errno
  }
}
function ___syscall3(which, varargs) {
  SYSCALLS.varargs = varargs
  try {
    var stream = SYSCALLS.getStreamFromFD(),
      buf = SYSCALLS.get(),
      count = SYSCALLS.get()
    return FS.read(stream, HEAP8, buf, count)
  } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e)
    return -e.errno
  }
}
function ___syscall5(which, varargs) {
  SYSCALLS.varargs = varargs
  try {
    var pathname = SYSCALLS.getStr(),
      flags = SYSCALLS.get(),
      mode = SYSCALLS.get()
    var stream = FS.open(pathname, flags, mode)
    return stream.fd
  } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e)
    return -e.errno
  }
}
function ___syscall54(which, varargs) {
  SYSCALLS.varargs = varargs
  try {
    var stream = SYSCALLS.getStreamFromFD(),
      op = SYSCALLS.get()
    switch (op) {
      case 21509:
      case 21505: {
        if (!stream.tty) return -25
        return 0
      }
      case 21510:
      case 21511:
      case 21512:
      case 21506:
      case 21507:
      case 21508: {
        if (!stream.tty) return -25
        return 0
      }
      case 21519: {
        if (!stream.tty) return -25
        var argp = SYSCALLS.get()
        HEAP32[argp >> 2] = 0
        return 0
      }
      case 21520: {
        if (!stream.tty) return -25
        return -22
      }
      case 21531: {
        var argp = SYSCALLS.get()
        return FS.ioctl(stream, op, argp)
      }
      case 21523: {
        if (!stream.tty) return -25
        return 0
      }
      case 21524: {
        if (!stream.tty) return -25
        return 0
      }
      default:
        abort('bad ioctl syscall ' + op)
    }
  } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e)
    return -e.errno
  }
}
function ___syscall6(which, varargs) {
  SYSCALLS.varargs = varargs
  try {
    var stream = SYSCALLS.getStreamFromFD()
    FS.close(stream)
    return 0
  } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e)
    return -e.errno
  }
}
function _fd_write(stream, iov, iovcnt, pnum) {
  try {
    stream = FS.getStream(stream)
    if (!stream) throw new FS.ErrnoError(9)
    var num = SYSCALLS.doWritev(stream, iov, iovcnt)
    HEAP32[pnum >> 2] = num
    return 0
  } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e)
    return -e.errno
  }
}
function ___wasi_fd_write() {
  return _fd_write.apply(null, arguments)
}
function _abort() {
  Module['abort']()
}
function _clock() {
  if (_clock.start === undefined) _clock.start = Date.now()
  return ((Date.now() - _clock.start) * (1e6 / 1e3)) | 0
}
function _emscripten_get_heap_size() {
  return HEAP8.length
}
var _fabs = Math_abs
function _getenv(name) {
  if (name === 0) return 0
  name = UTF8ToString(name)
  if (!ENV.hasOwnProperty(name)) return 0
  if (_getenv.ret) _free(_getenv.ret)
  _getenv.ret = allocateUTF8(ENV[name])
  return _getenv.ret
}
function _gettimeofday(ptr) {
  var now = Date.now()
  HEAP32[ptr >> 2] = (now / 1e3) | 0
  HEAP32[(ptr + 4) >> 2] = ((now % 1e3) * 1e3) | 0
  return 0
}
var ___tm_timezone = (stringToUTF8('GMT', 135712, 4), 135712)
function _gmtime_r(time, tmPtr) {
  var date = new Date(HEAP32[time >> 2] * 1e3)
  HEAP32[tmPtr >> 2] = date.getUTCSeconds()
  HEAP32[(tmPtr + 4) >> 2] = date.getUTCMinutes()
  HEAP32[(tmPtr + 8) >> 2] = date.getUTCHours()
  HEAP32[(tmPtr + 12) >> 2] = date.getUTCDate()
  HEAP32[(tmPtr + 16) >> 2] = date.getUTCMonth()
  HEAP32[(tmPtr + 20) >> 2] = date.getUTCFullYear() - 1900
  HEAP32[(tmPtr + 24) >> 2] = date.getUTCDay()
  HEAP32[(tmPtr + 36) >> 2] = 0
  HEAP32[(tmPtr + 32) >> 2] = 0
  var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0)
  var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0
  HEAP32[(tmPtr + 28) >> 2] = yday
  HEAP32[(tmPtr + 40) >> 2] = ___tm_timezone
  return tmPtr
}
function _llvm_exp2_f32(x) {
  return Math.pow(2, x)
}
function _llvm_exp2_f64(a0) {
  return _llvm_exp2_f32(a0)
}
var _llvm_trunc_f64 = Math_trunc
function _tzset() {
  if (_tzset.called) return
  _tzset.called = true
  HEAP32[__get_timezone() >> 2] = new Date().getTimezoneOffset() * 60
  var winter = new Date(2e3, 0, 1)
  var summer = new Date(2e3, 6, 1)
  HEAP32[__get_daylight() >> 2] = Number(
    winter.getTimezoneOffset() != summer.getTimezoneOffset()
  )
  function extractZone(date) {
    var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/)
    return match ? match[1] : 'GMT'
  }
  var winterName = extractZone(winter)
  var summerName = extractZone(summer)
  var winterNamePtr = allocate(
    intArrayFromString(winterName),
    'i8',
    ALLOC_NORMAL
  )
  var summerNamePtr = allocate(
    intArrayFromString(summerName),
    'i8',
    ALLOC_NORMAL
  )
  if (summer.getTimezoneOffset() < winter.getTimezoneOffset()) {
    HEAP32[__get_tzname() >> 2] = winterNamePtr
    HEAP32[(__get_tzname() + 4) >> 2] = summerNamePtr
  } else {
    HEAP32[__get_tzname() >> 2] = summerNamePtr
    HEAP32[(__get_tzname() + 4) >> 2] = winterNamePtr
  }
}
function _localtime_r(time, tmPtr) {
  _tzset()
  var date = new Date(HEAP32[time >> 2] * 1e3)
  HEAP32[tmPtr >> 2] = date.getSeconds()
  HEAP32[(tmPtr + 4) >> 2] = date.getMinutes()
  HEAP32[(tmPtr + 8) >> 2] = date.getHours()
  HEAP32[(tmPtr + 12) >> 2] = date.getDate()
  HEAP32[(tmPtr + 16) >> 2] = date.getMonth()
  HEAP32[(tmPtr + 20) >> 2] = date.getFullYear() - 1900
  HEAP32[(tmPtr + 24) >> 2] = date.getDay()
  var start = new Date(date.getFullYear(), 0, 1)
  var yday = ((date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)) | 0
  HEAP32[(tmPtr + 28) >> 2] = yday
  HEAP32[(tmPtr + 36) >> 2] = -(date.getTimezoneOffset() * 60)
  var summerOffset = new Date(2e3, 6, 1).getTimezoneOffset()
  var winterOffset = start.getTimezoneOffset()
  var dst =
    (summerOffset != winterOffset &&
      date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0
  HEAP32[(tmPtr + 32) >> 2] = dst
  var zonePtr = HEAP32[(__get_tzname() + (dst ? 4 : 0)) >> 2]
  HEAP32[(tmPtr + 40) >> 2] = zonePtr
  return tmPtr
}
function _emscripten_memcpy_big(dest, src, num) {
  HEAPU8.set(HEAPU8.subarray(src, src + num), dest)
}
function _mktime(tmPtr) {
  _tzset()
  var date = new Date(
    HEAP32[(tmPtr + 20) >> 2] + 1900,
    HEAP32[(tmPtr + 16) >> 2],
    HEAP32[(tmPtr + 12) >> 2],
    HEAP32[(tmPtr + 8) >> 2],
    HEAP32[(tmPtr + 4) >> 2],
    HEAP32[tmPtr >> 2],
    0
  )
  var dst = HEAP32[(tmPtr + 32) >> 2]
  var guessedOffset = date.getTimezoneOffset()
  var start = new Date(date.getFullYear(), 0, 1)
  var summerOffset = new Date(2e3, 6, 1).getTimezoneOffset()
  var winterOffset = start.getTimezoneOffset()
  var dstOffset = Math.min(winterOffset, summerOffset)
  if (dst < 0) {
    HEAP32[(tmPtr + 32) >> 2] = Number(
      summerOffset != winterOffset && dstOffset == guessedOffset
    )
  } else if (dst > 0 != (dstOffset == guessedOffset)) {
    var nonDstOffset = Math.max(winterOffset, summerOffset)
    var trueOffset = dst > 0 ? dstOffset : nonDstOffset
    date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4)
  }
  HEAP32[(tmPtr + 24) >> 2] = date.getDay()
  var yday = ((date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)) | 0
  HEAP32[(tmPtr + 28) >> 2] = yday
  return (date.getTime() / 1e3) | 0
}
function _pthread_cond_destroy() {
  return 0
}
function _pthread_cond_init() {
  return 0
}
function _pthread_cond_signal() {
  return 0
}
function _pthread_cond_wait() {
  return 0
}
function _pthread_create() {
  return 11
}
function _pthread_join() {}
function abortOnCannotGrowMemory(requestedSize) {
  abort('OOM')
}
function _emscripten_resize_heap(requestedSize) {
  abortOnCannotGrowMemory(requestedSize)
}
function _sysconf(name) {
  switch (name) {
    case 30:
      return PAGE_SIZE
    case 85:
      var maxHeapSize = 2 * 1024 * 1024 * 1024 - 65536
      maxHeapSize = HEAPU8.length
      return maxHeapSize / PAGE_SIZE
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
      return 200809
    case 79:
      return 0
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
      return -1
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
      return 1
    case 74:
    case 60:
    case 69:
    case 70:
    case 4:
      return 1024
    case 31:
    case 42:
    case 72:
      return 32
    case 87:
    case 26:
    case 33:
      return 2147483647
    case 34:
    case 1:
      return 47839
    case 38:
    case 36:
      return 99
    case 43:
    case 37:
      return 2048
    case 0:
      return 2097152
    case 3:
      return 65536
    case 28:
      return 32768
    case 44:
      return 32767
    case 75:
      return 16384
    case 39:
      return 1e3
    case 89:
      return 700
    case 71:
      return 256
    case 40:
      return 255
    case 2:
      return 100
    case 180:
      return 64
    case 25:
      return 20
    case 5:
      return 16
    case 6:
      return 6
    case 73:
      return 4
    case 84: {
      if (typeof navigator === 'object')
        return navigator['hardwareConcurrency'] || 1
      return 1
    }
  }
  ___setErrNo(22)
  return -1
}
FS.staticInit()
Module['FS_createFolder'] = FS.createFolder
Module['FS_createPath'] = FS.createPath
Module['FS_createDataFile'] = FS.createDataFile
Module['FS_createPreloadedFile'] = FS.createPreloadedFile
Module['FS_createLazyFile'] = FS.createLazyFile
Module['FS_createLink'] = FS.createLink
Module['FS_createDevice'] = FS.createDevice
Module['FS_unlink'] = FS.unlink
if (ENVIRONMENT_HAS_NODE) {
  var fs = require('fs')
  var NODEJS_PATH = require('path')
  NODEFS.staticInit()
}
var ASSERTIONS = false
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1
  var u8array = new Array(len)
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length)
  if (dontAddNull) u8array.length = numBytesWritten
  return u8array
}
function jsCall_dd(index, a1) {
  return functionPointers[index](a1)
}
function jsCall_did(index, a1, a2) {
  return functionPointers[index](a1, a2)
}
function jsCall_didd(index, a1, a2, a3) {
  return functionPointers[index](a1, a2, a3)
}
function jsCall_ii(index, a1) {
  return functionPointers[index](a1)
}
function jsCall_iidiiii(index, a1, a2, a3, a4, a5, a6) {
  return functionPointers[index](a1, a2, a3, a4, a5, a6)
}
function jsCall_iii(index, a1, a2) {
  return functionPointers[index](a1, a2)
}
function jsCall_iiii(index, a1, a2, a3) {
  return functionPointers[index](a1, a2, a3)
}
function jsCall_iiiii(index, a1, a2, a3, a4) {
  return functionPointers[index](a1, a2, a3, a4)
}
function jsCall_iiiiii(index, a1, a2, a3, a4, a5) {
  return functionPointers[index](a1, a2, a3, a4, a5)
}
function jsCall_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
  return functionPointers[index](a1, a2, a3, a4, a5, a6)
}
function jsCall_jiji(index, a1, a2, a3) {
  return functionPointers[index](a1, a2, a3)
}
function jsCall_v(index) {
  functionPointers[index]()
}
function jsCall_vi(index, a1) {
  functionPointers[index](a1)
}
function jsCall_vii(index, a1, a2) {
  functionPointers[index](a1, a2)
}
function jsCall_viii(index, a1, a2, a3) {
  functionPointers[index](a1, a2, a3)
}
function jsCall_viiii(index, a1, a2, a3, a4) {
  functionPointers[index](a1, a2, a3, a4)
}
function jsCall_viiiii(index, a1, a2, a3, a4, a5) {
  functionPointers[index](a1, a2, a3, a4, a5)
}
function jsCall_viiiiii(index, a1, a2, a3, a4, a5, a6) {
  functionPointers[index](a1, a2, a3, a4, a5, a6)
}
function jsCall_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
  functionPointers[index](a1, a2, a3, a4, a5, a6, a7)
}
function jsCall_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
  functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8)
}
function jsCall_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
  functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9)
}
function jsCall_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
  functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
}
function jsCall_viiiiiiiiiii(
  index,
  a1,
  a2,
  a3,
  a4,
  a5,
  a6,
  a7,
  a8,
  a9,
  a10,
  a11
) {
  functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
}
function jsCall_viiiiiiiiiiii(
  index,
  a1,
  a2,
  a3,
  a4,
  a5,
  a6,
  a7,
  a8,
  a9,
  a10,
  a11,
  a12
) {
  functionPointers[index](a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12)
}
function jsCall_viiiiiiiiiiiiii(
  index,
  a1,
  a2,
  a3,
  a4,
  a5,
  a6,
  a7,
  a8,
  a9,
  a10,
  a11,
  a12,
  a13,
  a14
) {
  functionPointers[index](
    a1,
    a2,
    a3,
    a4,
    a5,
    a6,
    a7,
    a8,
    a9,
    a10,
    a11,
    a12,
    a13,
    a14
  )
}
var asmGlobalArg = {}
var asmLibraryArg = {
  abort: abort,
  setTempRet0: setTempRet0,
  getTempRet0: getTempRet0,
  jsCall_dd: jsCall_dd,
  jsCall_did: jsCall_did,
  jsCall_didd: jsCall_didd,
  jsCall_ii: jsCall_ii,
  jsCall_iidiiii: jsCall_iidiiii,
  jsCall_iii: jsCall_iii,
  jsCall_iiii: jsCall_iiii,
  jsCall_iiiii: jsCall_iiiii,
  jsCall_iiiiii: jsCall_iiiiii,
  jsCall_iiiiiii: jsCall_iiiiiii,
  jsCall_jiji: jsCall_jiji,
  jsCall_v: jsCall_v,
  jsCall_vi: jsCall_vi,
  jsCall_vii: jsCall_vii,
  jsCall_viii: jsCall_viii,
  jsCall_viiii: jsCall_viiii,
  jsCall_viiiii: jsCall_viiiii,
  jsCall_viiiiii: jsCall_viiiiii,
  jsCall_viiiiiii: jsCall_viiiiiii,
  jsCall_viiiiiiii: jsCall_viiiiiiii,
  jsCall_viiiiiiiii: jsCall_viiiiiiiii,
  jsCall_viiiiiiiiii: jsCall_viiiiiiiiii,
  jsCall_viiiiiiiiiii: jsCall_viiiiiiiiiii,
  jsCall_viiiiiiiiiiii: jsCall_viiiiiiiiiiii,
  jsCall_viiiiiiiiiiiiii: jsCall_viiiiiiiiiiiiii,
  ___buildEnvironment: ___buildEnvironment,
  ___setErrNo: ___setErrNo,
  ___syscall140: ___syscall140,
  ___syscall221: ___syscall221,
  ___syscall3: ___syscall3,
  ___syscall5: ___syscall5,
  ___syscall54: ___syscall54,
  ___syscall6: ___syscall6,
  ___wasi_fd_write: ___wasi_fd_write,
  _abort: _abort,
  _clock: _clock,
  _emscripten_get_heap_size: _emscripten_get_heap_size,
  _emscripten_memcpy_big: _emscripten_memcpy_big,
  _emscripten_resize_heap: _emscripten_resize_heap,
  _fabs: _fabs,
  _fd_write: _fd_write,
  _getenv: _getenv,
  _gettimeofday: _gettimeofday,
  _gmtime_r: _gmtime_r,
  _llvm_exp2_f32: _llvm_exp2_f32,
  _llvm_exp2_f64: _llvm_exp2_f64,
  _llvm_trunc_f64: _llvm_trunc_f64,
  _localtime_r: _localtime_r,
  _mktime: _mktime,
  _pthread_cond_destroy: _pthread_cond_destroy,
  _pthread_cond_init: _pthread_cond_init,
  _pthread_cond_signal: _pthread_cond_signal,
  _pthread_cond_wait: _pthread_cond_wait,
  _pthread_create: _pthread_create,
  _pthread_join: _pthread_join,
  _sysconf: _sysconf,
  _tzset: _tzset,
  abortOnCannotGrowMemory: abortOnCannotGrowMemory,
  demangle: demangle,
  demangleAll: demangleAll,
  jsStackTrace: jsStackTrace,
  stackTrace: stackTrace,
  tempDoublePtr: tempDoublePtr,
  DYNAMICTOP_PTR: DYNAMICTOP_PTR
}
var asm = Module['asm'](asmGlobalArg, asmLibraryArg, buffer)
Module['asm'] = asm
var ___emscripten_environ_constructor = (Module[
  '___emscripten_environ_constructor'
] = function() {
  return Module['asm']['___emscripten_environ_constructor'].apply(
    null,
    arguments
  )
})
var ___errno_location = (Module['___errno_location'] = function() {
  return Module['asm']['___errno_location'].apply(null, arguments)
})
var __get_daylight = (Module['__get_daylight'] = function() {
  return Module['asm']['__get_daylight'].apply(null, arguments)
})
var __get_environ = (Module['__get_environ'] = function() {
  return Module['asm']['__get_environ'].apply(null, arguments)
})
var __get_timezone = (Module['__get_timezone'] = function() {
  return Module['asm']['__get_timezone'].apply(null, arguments)
})
var __get_tzname = (Module['__get_tzname'] = function() {
  return Module['asm']['__get_tzname'].apply(null, arguments)
})
var _closeDecoder = (Module['_closeDecoder'] = function() {
  return Module['asm']['_closeDecoder'].apply(null, arguments)
})
var _decodeData = (Module['_decodeData'] = function() {
  return Module['asm']['_decodeData'].apply(null, arguments)
})
var _flushDecoder = (Module['_flushDecoder'] = function() {
  return Module['asm']['_flushDecoder'].apply(null, arguments)
})
var _free = (Module['_free'] = function() {
  return Module['asm']['_free'].apply(null, arguments)
})
var _llvm_bswap_i16 = (Module['_llvm_bswap_i16'] = function() {
  return Module['asm']['_llvm_bswap_i16'].apply(null, arguments)
})
var _llvm_bswap_i32 = (Module['_llvm_bswap_i32'] = function() {
  return Module['asm']['_llvm_bswap_i32'].apply(null, arguments)
})
var _llvm_round_f64 = (Module['_llvm_round_f64'] = function() {
  return Module['asm']['_llvm_round_f64'].apply(null, arguments)
})
var _main = (Module['_main'] = function() {
  return Module['asm']['_main'].apply(null, arguments)
})
var _malloc = (Module['_malloc'] = function() {
  return Module['asm']['_malloc'].apply(null, arguments)
})
var _memalign = (Module['_memalign'] = function() {
  return Module['asm']['_memalign'].apply(null, arguments)
})
var _memcpy = (Module['_memcpy'] = function() {
  return Module['asm']['_memcpy'].apply(null, arguments)
})
var _memmove = (Module['_memmove'] = function() {
  return Module['asm']['_memmove'].apply(null, arguments)
})
var _memset = (Module['_memset'] = function() {
  return Module['asm']['_memset'].apply(null, arguments)
})
var _openDecoder = (Module['_openDecoder'] = function() {
  return Module['asm']['_openDecoder'].apply(null, arguments)
})
var _pthread_cond_broadcast = (Module['_pthread_cond_broadcast'] = function() {
  return Module['asm']['_pthread_cond_broadcast'].apply(null, arguments)
})
var _sbrk = (Module['_sbrk'] = function() {
  return Module['asm']['_sbrk'].apply(null, arguments)
})
var establishStackSpace = (Module['establishStackSpace'] = function() {
  return Module['asm']['establishStackSpace'].apply(null, arguments)
})
var stackAlloc = (Module['stackAlloc'] = function() {
  return Module['asm']['stackAlloc'].apply(null, arguments)
})
var stackRestore = (Module['stackRestore'] = function() {
  return Module['asm']['stackRestore'].apply(null, arguments)
})
var stackSave = (Module['stackSave'] = function() {
  return Module['asm']['stackSave'].apply(null, arguments)
})
var dynCall_dd = (Module['dynCall_dd'] = function() {
  return Module['asm']['dynCall_dd'].apply(null, arguments)
})
var dynCall_did = (Module['dynCall_did'] = function() {
  return Module['asm']['dynCall_did'].apply(null, arguments)
})
var dynCall_didd = (Module['dynCall_didd'] = function() {
  return Module['asm']['dynCall_didd'].apply(null, arguments)
})
var dynCall_ii = (Module['dynCall_ii'] = function() {
  return Module['asm']['dynCall_ii'].apply(null, arguments)
})
var dynCall_iidiiii = (Module['dynCall_iidiiii'] = function() {
  return Module['asm']['dynCall_iidiiii'].apply(null, arguments)
})
var dynCall_iii = (Module['dynCall_iii'] = function() {
  return Module['asm']['dynCall_iii'].apply(null, arguments)
})
var dynCall_iiii = (Module['dynCall_iiii'] = function() {
  return Module['asm']['dynCall_iiii'].apply(null, arguments)
})
var dynCall_iiiii = (Module['dynCall_iiiii'] = function() {
  return Module['asm']['dynCall_iiiii'].apply(null, arguments)
})
var dynCall_iiiiii = (Module['dynCall_iiiiii'] = function() {
  return Module['asm']['dynCall_iiiiii'].apply(null, arguments)
})
var dynCall_iiiiiii = (Module['dynCall_iiiiiii'] = function() {
  return Module['asm']['dynCall_iiiiiii'].apply(null, arguments)
})
var dynCall_jiji = (Module['dynCall_jiji'] = function() {
  return Module['asm']['dynCall_jiji'].apply(null, arguments)
})
var dynCall_v = (Module['dynCall_v'] = function() {
  return Module['asm']['dynCall_v'].apply(null, arguments)
})
var dynCall_vi = (Module['dynCall_vi'] = function() {
  return Module['asm']['dynCall_vi'].apply(null, arguments)
})
var dynCall_vii = (Module['dynCall_vii'] = function() {
  return Module['asm']['dynCall_vii'].apply(null, arguments)
})
var dynCall_viii = (Module['dynCall_viii'] = function() {
  return Module['asm']['dynCall_viii'].apply(null, arguments)
})
var dynCall_viiii = (Module['dynCall_viiii'] = function() {
  return Module['asm']['dynCall_viiii'].apply(null, arguments)
})
var dynCall_viiiii = (Module['dynCall_viiiii'] = function() {
  return Module['asm']['dynCall_viiiii'].apply(null, arguments)
})
var dynCall_viiiiii = (Module['dynCall_viiiiii'] = function() {
  return Module['asm']['dynCall_viiiiii'].apply(null, arguments)
})
var dynCall_viiiiiii = (Module['dynCall_viiiiiii'] = function() {
  return Module['asm']['dynCall_viiiiiii'].apply(null, arguments)
})
var dynCall_viiiiiiii = (Module['dynCall_viiiiiiii'] = function() {
  return Module['asm']['dynCall_viiiiiiii'].apply(null, arguments)
})
var dynCall_viiiiiiiii = (Module['dynCall_viiiiiiiii'] = function() {
  return Module['asm']['dynCall_viiiiiiiii'].apply(null, arguments)
})
var dynCall_viiiiiiiiii = (Module['dynCall_viiiiiiiiii'] = function() {
  return Module['asm']['dynCall_viiiiiiiiii'].apply(null, arguments)
})
var dynCall_viiiiiiiiiii = (Module['dynCall_viiiiiiiiiii'] = function() {
  return Module['asm']['dynCall_viiiiiiiiiii'].apply(null, arguments)
})
var dynCall_viiiiiiiiiiii = (Module['dynCall_viiiiiiiiiiii'] = function() {
  return Module['asm']['dynCall_viiiiiiiiiiii'].apply(null, arguments)
})
var dynCall_viiiiiiiiiiiiii = (Module['dynCall_viiiiiiiiiiiiii'] = function() {
  return Module['asm']['dynCall_viiiiiiiiiiiiii'].apply(null, arguments)
})
Module['asm'] = asm
Module['getMemory'] = getMemory
Module['addRunDependency'] = addRunDependency
Module['removeRunDependency'] = removeRunDependency
Module['FS_createFolder'] = FS.createFolder
Module['FS_createPath'] = FS.createPath
Module['FS_createDataFile'] = FS.createDataFile
Module['FS_createPreloadedFile'] = FS.createPreloadedFile
Module['FS_createLazyFile'] = FS.createLazyFile
Module['FS_createLink'] = FS.createLink
Module['FS_createDevice'] = FS.createDevice
Module['FS_unlink'] = FS.unlink
Module['addFunction'] = addFunction
Module['calledRun'] = calledRun
var calledRun
function ExitStatus(status) {
  this.name = 'ExitStatus'
  this.message = 'Program terminated with exit(' + status + ')'
  this.status = status
}
var calledMain = false
dependenciesFulfilled = function runCaller() {
  if (!calledRun) run()
  if (!calledRun) dependenciesFulfilled = runCaller
}
function callMain(args) {
  args = args || []
  var argc = args.length + 1
  var argv = stackAlloc((argc + 1) * 4)
  HEAP32[argv >> 2] = allocateUTF8OnStack(thisProgram)
  for (var i = 1; i < argc; i++) {
    HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1])
  }
  HEAP32[(argv >> 2) + argc] = 0
  try {
    var ret = Module['_main'](argc, argv)
    exit(ret, true)
  } catch (e) {
    if (e instanceof ExitStatus) {
      return
    } else if (e == 'SimulateInfiniteLoop') {
      noExitRuntime = true
      return
    } else {
      var toLog = e
      if (e && typeof e === 'object' && e.stack) {
        toLog = [e, e.stack]
      }
      err('exception thrown: ' + toLog)
      quit_(1, e)
    }
  } finally {
    calledMain = true
  }
}
function run(args) {
  args = args || arguments_
  if (runDependencies > 0) {
    return
  }
  preRun()
  if (runDependencies > 0) return
  function doRun() {
    if (calledRun) return
    calledRun = true
    Module['calledRun'] = true
    if (ABORT) return
    initRuntime()
    preMain()
    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']()
    if (shouldRunNow) callMain(args)
    postRun()
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...')
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('')
      }, 1)
      doRun()
    }, 1)
  } else {
    doRun()
  }
}
Module['run'] = run
function exit(status, implicit) {
  if (implicit && noExitRuntime && status === 0) {
    return
  }
  if (noExitRuntime) {
  } else {
    ABORT = true
    EXITSTATUS = status
    exitRuntime()
    if (Module['onExit']) Module['onExit'](status)
  }
  quit_(status, new ExitStatus(status))
}
function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what)
  }
  what += ''
  out(what)
  err(what)
  ABORT = true
  EXITSTATUS = 1
  throw 'abort(' + what + '). Build with -s ASSERTIONS=1 for more info.'
}
Module['abort'] = abort
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function')
    Module['preInit'] = [Module['preInit']]
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()()
  }
}
var shouldRunNow = true
if (Module['noInitialRun']) shouldRunNow = false
noExitRuntime = true
run()
