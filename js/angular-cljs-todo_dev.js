var CLOSURE_NO_DEPS = true;
var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.TRUSTED_SITE = true;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      if(doc.readyState == "complete") {
        var isDeps = /\bdeps.js$/.test(src);
        if(isDeps) {
          return false
        }else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }
      doc.write('\x3cscript type\x3d"text/javascript" src\x3d"' + src + '"\x3e\x3c/' + "script\x3e");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call((value));
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (Math.random() * 1E9 >>> 0);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return(fn.call.apply(fn.bind, arguments))
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = goog.TRUSTED_SITE && Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ \x3d 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.getMsgWithFallback = function(a, b) {
  return a
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "\x3cbr /\x3e" : "\x3cbr\x3e")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "\x26amp;").replace(goog.string.ltRe_, "\x26lt;").replace(goog.string.gtRe_, "\x26gt;").replace(goog.string.quotRe_, "\x26quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("\x26") != -1) {
      str = str.replace(goog.string.amperRe_, "\x26amp;")
    }
    if(str.indexOf("\x3c") != -1) {
      str = str.replace(goog.string.ltRe_, "\x26lt;")
    }
    if(str.indexOf("\x3e") != -1) {
      str = str.replace(goog.string.gtRe_, "\x26gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "\x26quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "\x26")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"\x26amp;":"\x26", "\x26lt;":"\x3c", "\x26gt;":"\x3e", "\x26quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"\x26";
      case "lt":
        return"\x3c";
      case "gt":
        return"\x3e";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " \x26#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return(value)
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = goog.TRUSTED_SITE;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.count = function(arr, f, opt_obj) {
  var count = 0;
  goog.array.forEach(arr, function(element, index, arr) {
    if(f.call(opt_obj, element, index, arr)) {
      ++count
    }
  }, opt_obj);
  return count
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && Object.prototype.hasOwnProperty.call(arr2, "callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element
  });
  return ret
};
goog.array.range = function(startOrEnd, opt_end, opt_step) {
  var array = [];
  var start = 0;
  var end = startOrEnd;
  var step = opt_step || 1;
  if(opt_end !== undefined) {
    start = startOrEnd;
    end = opt_end
  }
  if(step * (end - start) < 0) {
    return[]
  }
  if(step > 0) {
    for(var i = start;i < end;i += step) {
      array.push(i)
    }
  }else {
    for(var i = start;i > end;i += step) {
      array.push(i)
    }
  }
  return array
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if(Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result)
  }
  return result
};
goog.object.isImmutableView = function(obj) {
  return!!Object.isFrozen && Object.isFrozen(obj)
};
goog.provide("goog.string.StringBuffer");
goog.string.StringBuffer = function(opt_a1, var_args) {
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.buffer_ = "";
goog.string.StringBuffer.prototype.set = function(s) {
  this.buffer_ = "" + s
};
goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  this.buffer_ += a1;
  if(opt_a2 != null) {
    for(var i = 1;i < arguments.length;i++) {
      this.buffer_ += arguments[i]
    }
  }
  return this
};
goog.string.StringBuffer.prototype.clear = function() {
  this.buffer_ = ""
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.buffer_.length
};
goog.string.StringBuffer.prototype.toString = function() {
  return this.buffer_
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.object");
goog.require("goog.string.StringBuffer");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
goog.require("goog.string");
cljs.core._STAR_clojurescript_version_STAR_ = "0.0-2014";
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.set_print_fn_BANG_ = function set_print_fn_BANG_(f) {
  return cljs.core._STAR_print_fn_STAR_ = f
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "flush-on-newline", "flush-on-newline", 4338025857), cljs.core._STAR_flush_on_newline_STAR_, new cljs.core.Keyword(null, "readably", "readably", 4441712502), cljs.core._STAR_print_readably_STAR_, new cljs.core.Keyword(null, "meta", "meta", 1017252215), cljs.core._STAR_print_meta_STAR_, new cljs.core.Keyword(null, "dup", "dup", 1014004081), cljs.core._STAR_print_dup_STAR_], true)
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.not_native = null;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.array_QMARK_ = function array_QMARK_(x) {
  return x instanceof Array
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return typeof n === "number"
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  return goog.isString(x)
};
cljs.core.native_satisfies_QMARK_ = function native_satisfies_QMARK_(p, x) {
  var x__$1 = x == null ? null : x;
  if(p[goog.typeOf(x__$1)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  var ty = cljs.core.type.call(null, obj);
  var ty__$1 = cljs.core.truth_(function() {
    var and__3119__auto__ = ty;
    if(cljs.core.truth_(and__3119__auto__)) {
      return ty.cljs$lang$type
    }else {
      return and__3119__auto__
    }
  }()) ? ty.cljs$lang$ctorStr : goog.typeOf(obj);
  return new Error(["No protocol method ", proto, " defined for type ", ty__$1, ": ", obj].join(""))
};
cljs.core.type__GT_str = function type__GT_str(ty) {
  var temp__4090__auto__ = ty.cljs$lang$ctorStr;
  if(cljs.core.truth_(temp__4090__auto__)) {
    var s = temp__4090__auto__;
    return s
  }else {
    return[cljs.core.str(ty)].join("")
  }
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  make_array.cljs$core$IFn$_invoke$arity$1 = make_array__1;
  make_array.cljs$core$IFn$_invoke$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6131__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6131 = function(array, i, var_args) {
      var idxs = null;
      if(arguments.length > 2) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6131__delegate.call(this, array, i, idxs)
    };
    G__6131.cljs$lang$maxFixedArity = 2;
    G__6131.cljs$lang$applyTo = function(arglist__6132) {
      var array = cljs.core.first(arglist__6132);
      arglist__6132 = cljs.core.next(arglist__6132);
      var i = cljs.core.first(arglist__6132);
      var idxs = cljs.core.rest(arglist__6132);
      return G__6131__delegate(array, i, idxs)
    };
    G__6131.cljs$core$IFn$_invoke$arity$variadic = G__6131__delegate;
    return G__6131
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$core$IFn$_invoke$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$core$IFn$_invoke$arity$2 = aget__2;
  aget.cljs$core$IFn$_invoke$arity$variadic = aget__3.cljs$core$IFn$_invoke$arity$variadic;
  return aget
}();
cljs.core.aset = function() {
  var aset = null;
  var aset__3 = function(array, i, val) {
    return array[i] = val
  };
  var aset__4 = function() {
    var G__6133__delegate = function(array, idx, idx2, idxv) {
      return cljs.core.apply.call(null, aset, array[idx], idx2, idxv)
    };
    var G__6133 = function(array, idx, idx2, var_args) {
      var idxv = null;
      if(arguments.length > 3) {
        idxv = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6133__delegate.call(this, array, idx, idx2, idxv)
    };
    G__6133.cljs$lang$maxFixedArity = 3;
    G__6133.cljs$lang$applyTo = function(arglist__6134) {
      var array = cljs.core.first(arglist__6134);
      arglist__6134 = cljs.core.next(arglist__6134);
      var idx = cljs.core.first(arglist__6134);
      arglist__6134 = cljs.core.next(arglist__6134);
      var idx2 = cljs.core.first(arglist__6134);
      var idxv = cljs.core.rest(arglist__6134);
      return G__6133__delegate(array, idx, idx2, idxv)
    };
    G__6133.cljs$core$IFn$_invoke$arity$variadic = G__6133__delegate;
    return G__6133
  }();
  aset = function(array, idx, idx2, var_args) {
    var idxv = var_args;
    switch(arguments.length) {
      case 3:
        return aset__3.call(this, array, idx, idx2);
      default:
        return aset__4.cljs$core$IFn$_invoke$arity$variadic(array, idx, idx2, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  aset.cljs$lang$maxFixedArity = 3;
  aset.cljs$lang$applyTo = aset__4.cljs$lang$applyTo;
  aset.cljs$core$IFn$_invoke$arity$3 = aset__3;
  aset.cljs$core$IFn$_invoke$arity$variadic = aset__4.cljs$core$IFn$_invoke$arity$variadic;
  return aset
}();
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  into_array.cljs$core$IFn$_invoke$arity$1 = into_array__1;
  into_array.cljs$core$IFn$_invoke$arity$2 = into_array__2;
  return into_array
}();
cljs.core.Fn = {};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3119__auto__ = this$;
      if(and__3119__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3119__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__3723__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3128__auto__ = cljs.core._invoke[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._invoke["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _invoke.cljs$core$IFn$_invoke$arity$1 = _invoke__1;
  _invoke.cljs$core$IFn$_invoke$arity$2 = _invoke__2;
  _invoke.cljs$core$IFn$_invoke$arity$3 = _invoke__3;
  _invoke.cljs$core$IFn$_invoke$arity$4 = _invoke__4;
  _invoke.cljs$core$IFn$_invoke$arity$5 = _invoke__5;
  _invoke.cljs$core$IFn$_invoke$arity$6 = _invoke__6;
  _invoke.cljs$core$IFn$_invoke$arity$7 = _invoke__7;
  _invoke.cljs$core$IFn$_invoke$arity$8 = _invoke__8;
  _invoke.cljs$core$IFn$_invoke$arity$9 = _invoke__9;
  _invoke.cljs$core$IFn$_invoke$arity$10 = _invoke__10;
  _invoke.cljs$core$IFn$_invoke$arity$11 = _invoke__11;
  _invoke.cljs$core$IFn$_invoke$arity$12 = _invoke__12;
  _invoke.cljs$core$IFn$_invoke$arity$13 = _invoke__13;
  _invoke.cljs$core$IFn$_invoke$arity$14 = _invoke__14;
  _invoke.cljs$core$IFn$_invoke$arity$15 = _invoke__15;
  _invoke.cljs$core$IFn$_invoke$arity$16 = _invoke__16;
  _invoke.cljs$core$IFn$_invoke$arity$17 = _invoke__17;
  _invoke.cljs$core$IFn$_invoke$arity$18 = _invoke__18;
  _invoke.cljs$core$IFn$_invoke$arity$19 = _invoke__19;
  _invoke.cljs$core$IFn$_invoke$arity$20 = _invoke__20;
  _invoke.cljs$core$IFn$_invoke$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._count[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._count["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._empty[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._empty["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._conj[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._conj["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3119__auto__ = coll;
      if(and__3119__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3119__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__3723__auto__ = coll == null ? null : coll;
      return function() {
        var or__3128__auto__ = cljs.core._nth[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._nth["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3119__auto__ = coll;
      if(and__3119__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3119__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__3723__auto__ = coll == null ? null : coll;
      return function() {
        var or__3128__auto__ = cljs.core._nth[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._nth["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _nth.cljs$core$IFn$_invoke$arity$2 = _nth__2;
  _nth.cljs$core$IFn$_invoke$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._first[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._first["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._rest[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._rest["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._next[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._next["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3119__auto__ = o;
      if(and__3119__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3119__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__3723__auto__ = o == null ? null : o;
      return function() {
        var or__3128__auto__ = cljs.core._lookup[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._lookup["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3119__auto__ = o;
      if(and__3119__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3119__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__3723__auto__ = o == null ? null : o;
      return function() {
        var or__3128__auto__ = cljs.core._lookup[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._lookup["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _lookup.cljs$core$IFn$_invoke$arity$2 = _lookup__2;
  _lookup.cljs$core$IFn$_invoke$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._contains_key_QMARK_[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._contains_key_QMARK_["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._assoc[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._assoc["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._dissoc[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._dissoc["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._key[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._key["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._val[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._val["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._disjoin[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._disjoin["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._peek[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._peek["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._pop[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._pop["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._assoc_n[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._assoc_n["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3119__auto__ = o;
    if(and__3119__auto__) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__3723__auto__ = o == null ? null : o;
    return function() {
      var or__3128__auto__ = cljs.core._deref[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._deref["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3119__auto__ = o;
    if(and__3119__auto__) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__3723__auto__ = o == null ? null : o;
    return function() {
      var or__3128__auto__ = cljs.core._deref_with_timeout[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._deref_with_timeout["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3119__auto__ = o;
    if(and__3119__auto__) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__3723__auto__ = o == null ? null : o;
    return function() {
      var or__3128__auto__ = cljs.core._meta[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._meta["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3119__auto__ = o;
    if(and__3119__auto__) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__3723__auto__ = o == null ? null : o;
    return function() {
      var or__3128__auto__ = cljs.core._with_meta[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._with_meta["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3119__auto__ = coll;
      if(and__3119__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3119__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__3723__auto__ = coll == null ? null : coll;
      return function() {
        var or__3128__auto__ = cljs.core._reduce[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._reduce["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3119__auto__ = coll;
      if(and__3119__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3119__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__3723__auto__ = coll == null ? null : coll;
      return function() {
        var or__3128__auto__ = cljs.core._reduce[goog.typeOf(x__3723__auto__)];
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = cljs.core._reduce["_"];
          if(or__3128__auto____$1) {
            return or__3128__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _reduce.cljs$core$IFn$_invoke$arity$2 = _reduce__2;
  _reduce.cljs$core$IFn$_invoke$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._kv_reduce[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._kv_reduce["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3119__auto__ = o;
    if(and__3119__auto__) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__3723__auto__ = o == null ? null : o;
    return function() {
      var or__3128__auto__ = cljs.core._equiv[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._equiv["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3119__auto__ = o;
    if(and__3119__auto__) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__3723__auto__ = o == null ? null : o;
    return function() {
      var or__3128__auto__ = cljs.core._hash[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._hash["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3119__auto__ = o;
    if(and__3119__auto__) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__3723__auto__ = o == null ? null : o;
    return function() {
      var or__3128__auto__ = cljs.core._seq[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._seq["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._rseq[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._rseq["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._sorted_seq[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._sorted_seq["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._sorted_seq_from[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._sorted_seq_from["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._entry_key[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._entry_key["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._comparator[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._comparator["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IWriter = {};
cljs.core._write = function _write(writer, s) {
  if(function() {
    var and__3119__auto__ = writer;
    if(and__3119__auto__) {
      return writer.cljs$core$IWriter$_write$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_write$arity$2(writer, s)
  }else {
    var x__3723__auto__ = writer == null ? null : writer;
    return function() {
      var or__3128__auto__ = cljs.core._write[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._write["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-write", writer);
        }
      }
    }().call(null, writer, s)
  }
};
cljs.core._flush = function _flush(writer) {
  if(function() {
    var and__3119__auto__ = writer;
    if(and__3119__auto__) {
      return writer.cljs$core$IWriter$_flush$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_flush$arity$1(writer)
  }else {
    var x__3723__auto__ = writer == null ? null : writer;
    return function() {
      var or__3128__auto__ = cljs.core._flush[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._flush["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-flush", writer);
        }
      }
    }().call(null, writer)
  }
};
cljs.core.IPrintWithWriter = {};
cljs.core._pr_writer = function _pr_writer(o, writer, opts) {
  if(function() {
    var and__3119__auto__ = o;
    if(and__3119__auto__) {
      return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3(o, writer, opts)
  }else {
    var x__3723__auto__ = o == null ? null : o;
    return function() {
      var or__3128__auto__ = cljs.core._pr_writer[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._pr_writer["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintWithWriter.-pr-writer", o);
        }
      }
    }().call(null, o, writer, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3119__auto__ = d;
    if(and__3119__auto__) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__3723__auto__ = d == null ? null : d;
    return function() {
      var or__3128__auto__ = cljs.core._realized_QMARK_[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._realized_QMARK_["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = cljs.core._notify_watches[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._notify_watches["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = cljs.core._add_watch[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._add_watch["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = cljs.core._remove_watch[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._remove_watch["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._as_transient[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._as_transient["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3119__auto__ = tcoll;
    if(and__3119__auto__) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__3723__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3128__auto__ = cljs.core._conj_BANG_[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._conj_BANG_["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3119__auto__ = tcoll;
    if(and__3119__auto__) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__3723__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3128__auto__ = cljs.core._persistent_BANG_[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._persistent_BANG_["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3119__auto__ = tcoll;
    if(and__3119__auto__) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__3723__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3128__auto__ = cljs.core._assoc_BANG_[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._assoc_BANG_["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3119__auto__ = tcoll;
    if(and__3119__auto__) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__3723__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3128__auto__ = cljs.core._dissoc_BANG_[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._dissoc_BANG_["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3119__auto__ = tcoll;
    if(and__3119__auto__) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__3723__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3128__auto__ = cljs.core._assoc_n_BANG_[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._assoc_n_BANG_["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3119__auto__ = tcoll;
    if(and__3119__auto__) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__3723__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3128__auto__ = cljs.core._pop_BANG_[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._pop_BANG_["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3119__auto__ = tcoll;
    if(and__3119__auto__) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__3723__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3128__auto__ = cljs.core._disjoin_BANG_[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._disjoin_BANG_["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3119__auto__ = x;
    if(and__3119__auto__) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__3723__auto__ = x == null ? null : x;
    return function() {
      var or__3128__auto__ = cljs.core._compare[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._compare["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._drop_first[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._drop_first["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._chunked_first[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._chunked_first["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._chunked_rest[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._chunked_rest["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3119__auto__ = coll;
    if(and__3119__auto__) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__3723__auto__ = coll == null ? null : coll;
    return function() {
      var or__3128__auto__ = cljs.core._chunked_next[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._chunked_next["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INamed = {};
cljs.core._name = function _name(x) {
  if(function() {
    var and__3119__auto__ = x;
    if(and__3119__auto__) {
      return x.cljs$core$INamed$_name$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return x.cljs$core$INamed$_name$arity$1(x)
  }else {
    var x__3723__auto__ = x == null ? null : x;
    return function() {
      var or__3128__auto__ = cljs.core._name[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._name["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INamed.-name", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._namespace = function _namespace(x) {
  if(function() {
    var and__3119__auto__ = x;
    if(and__3119__auto__) {
      return x.cljs$core$INamed$_namespace$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return x.cljs$core$INamed$_namespace$arity$1(x)
  }else {
    var x__3723__auto__ = x == null ? null : x;
    return function() {
      var or__3128__auto__ = cljs.core._namespace[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._namespace["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INamed.-namespace", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core.StringBufferWriter = function(sb) {
  this.sb = sb;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073741824
};
cljs.core.StringBufferWriter.cljs$lang$type = true;
cljs.core.StringBufferWriter.cljs$lang$ctorStr = "cljs.core/StringBufferWriter";
cljs.core.StringBufferWriter.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/StringBufferWriter")
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_write$arity$2 = function(_, s) {
  var self__ = this;
  var ___$1 = this;
  return self__.sb.append(s)
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_flush$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return null
};
cljs.core.__GT_StringBufferWriter = function __GT_StringBufferWriter(sb) {
  return new cljs.core.StringBufferWriter(sb)
};
cljs.core.pr_str_STAR_ = function pr_str_STAR_(obj) {
  var sb = new goog.string.StringBuffer;
  var writer = new cljs.core.StringBufferWriter(sb);
  cljs.core._pr_writer.call(null, obj, writer, cljs.core.pr_opts.call(null));
  cljs.core._flush.call(null, writer);
  return[cljs.core.str(sb)].join("")
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  return x instanceof cljs.core.Symbol
};
cljs.core.hash_symbol = function hash_symbol(sym) {
  return cljs.core.hash_combine.call(null, cljs.core.hash.call(null, sym.ns), cljs.core.hash.call(null, sym.name))
};
cljs.core.Symbol = function(ns, name, str, _hash, _meta) {
  this.ns = ns;
  this.name = name;
  this.str = str;
  this._hash = _hash;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition0$ = 2154168321;
  this.cljs$lang$protocol_mask$partition1$ = 4096
};
cljs.core.Symbol.cljs$lang$type = true;
cljs.core.Symbol.cljs$lang$ctorStr = "cljs.core/Symbol";
cljs.core.Symbol.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/Symbol")
};
cljs.core.Symbol.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(o, writer, _) {
  var self__ = this;
  var o__$1 = this;
  return cljs.core._write.call(null, writer, self__.str)
};
cljs.core.Symbol.prototype.cljs$core$INamed$_name$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return self__.name
};
cljs.core.Symbol.prototype.cljs$core$INamed$_namespace$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return self__.ns
};
cljs.core.Symbol.prototype.cljs$core$IHash$_hash$arity$1 = function(sym) {
  var self__ = this;
  var sym__$1 = this;
  var h__3532__auto__ = self__._hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_symbol.call(null, sym__$1);
    self__._hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.Symbol.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_, new_meta) {
  var self__ = this;
  var ___$1 = this;
  return new cljs.core.Symbol(self__.ns, self__.name, self__.str, self__._hash, new_meta)
};
cljs.core.Symbol.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return self__._meta
};
cljs.core.Symbol.prototype.call = function() {
  var G__6136 = null;
  var G__6136__2 = function(self__, coll) {
    var self__ = this;
    var self____$1 = this;
    var sym = self____$1;
    return cljs.core._lookup.call(null, coll, sym, null)
  };
  var G__6136__3 = function(self__, coll, not_found) {
    var self__ = this;
    var self____$1 = this;
    var sym = self____$1;
    return cljs.core._lookup.call(null, coll, sym, not_found)
  };
  G__6136 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6136__2.call(this, self__, coll);
      case 3:
        return G__6136__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6136
}();
cljs.core.Symbol.prototype.apply = function(self__, args6135) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6135.slice()))
};
cljs.core.Symbol.prototype.cljs$core$IFn$_invoke$arity$1 = function(coll) {
  var self__ = this;
  var sym = this;
  return cljs.core._lookup.call(null, coll, sym, null)
};
cljs.core.Symbol.prototype.cljs$core$IFn$_invoke$arity$2 = function(coll, not_found) {
  var self__ = this;
  var sym = this;
  return cljs.core._lookup.call(null, coll, sym, not_found)
};
cljs.core.Symbol.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  var ___$1 = this;
  if(other instanceof cljs.core.Symbol) {
    return self__.str === other.str
  }else {
    return false
  }
};
cljs.core.Symbol.prototype.toString = function() {
  var self__ = this;
  var _ = this;
  return self__.str
};
cljs.core.__GT_Symbol = function __GT_Symbol(ns, name, str, _hash, _meta) {
  return new cljs.core.Symbol(ns, name, str, _hash, _meta)
};
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(name instanceof cljs.core.Symbol) {
      return name
    }else {
      return symbol.call(null, null, name)
    }
  };
  var symbol__2 = function(ns, name) {
    var sym_str = !(ns == null) ? [cljs.core.str(ns), cljs.core.str("/"), cljs.core.str(name)].join("") : name;
    return new cljs.core.Symbol(ns, name, sym_str, null, null)
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  symbol.cljs$core$IFn$_invoke$arity$1 = symbol__1;
  symbol.cljs$core$IFn$_invoke$arity$2 = symbol__2;
  return symbol
}();
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6138 = coll;
      if(G__6138) {
        var bit__3739__auto__ = G__6138.cljs$lang$protocol_mask$partition0$ & 8388608;
        if(bit__3739__auto__ || G__6138.cljs$core$ISeqable$) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._seq.call(null, coll)
    }else {
      if(coll instanceof Array) {
        if(coll.length === 0) {
          return null
        }else {
          return new cljs.core.IndexedSeq(coll, 0)
        }
      }else {
        if(typeof coll === "string") {
          if(coll.length === 0) {
            return null
          }else {
            return new cljs.core.IndexedSeq(coll, 0)
          }
        }else {
          if(cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISeqable, coll)) {
            return cljs.core._seq.call(null, coll)
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              throw new Error([cljs.core.str(coll), cljs.core.str("is not ISeqable")].join(""));
            }else {
              return null
            }
          }
        }
      }
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6140 = coll;
      if(G__6140) {
        var bit__3739__auto__ = G__6140.cljs$lang$protocol_mask$partition0$ & 64;
        if(bit__3739__auto__ || G__6140.cljs$core$ISeq$) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s = cljs.core.seq.call(null, coll);
      if(s == null) {
        return null
      }else {
        return cljs.core._first.call(null, s)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6142 = coll;
      if(G__6142) {
        var bit__3739__auto__ = G__6142.cljs$lang$protocol_mask$partition0$ & 64;
        if(bit__3739__auto__ || G__6142.cljs$core$ISeq$) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s = cljs.core.seq.call(null, coll);
      if(s) {
        return cljs.core._rest.call(null, s)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6144 = coll;
      if(G__6144) {
        var bit__3739__auto__ = G__6144.cljs$lang$protocol_mask$partition0$ & 128;
        if(bit__3739__auto__ || G__6144.cljs$core$INext$) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    return x === y || cljs.core._equiv.call(null, x, y)
  };
  var _EQ___3 = function() {
    var G__6145__delegate = function(x, y, more) {
      while(true) {
        if(_EQ_.call(null, x, y)) {
          if(cljs.core.next.call(null, more)) {
            var G__6146 = y;
            var G__6147 = cljs.core.first.call(null, more);
            var G__6148 = cljs.core.next.call(null, more);
            x = G__6146;
            y = G__6147;
            more = G__6148;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6145 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6145__delegate.call(this, x, y, more)
    };
    G__6145.cljs$lang$maxFixedArity = 2;
    G__6145.cljs$lang$applyTo = function(arglist__6149) {
      var x = cljs.core.first(arglist__6149);
      arglist__6149 = cljs.core.next(arglist__6149);
      var y = cljs.core.first(arglist__6149);
      var more = cljs.core.rest(arglist__6149);
      return G__6145__delegate(x, y, more)
    };
    G__6145.cljs$core$IFn$_invoke$arity$variadic = G__6145__delegate;
    return G__6145
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$core$IFn$_invoke$arity$1 = _EQ___1;
  _EQ_.cljs$core$IFn$_invoke$arity$2 = _EQ___2;
  _EQ_.cljs$core$IFn$_invoke$arity$variadic = _EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _EQ_
}();
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.IKVReduce["null"] = true;
cljs.core._kv_reduce["null"] = function(_, f, init) {
  return init
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var o__$1 = this;
  return other instanceof Date && o__$1.toString() === other.toString()
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IMeta["function"] = true;
cljs.core._meta["function"] = function(_) {
  return null
};
cljs.core.Fn["function"] = true;
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorStr = "cljs.core/Reduced";
cljs.core.Reduced.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var self__ = this;
  var o__$1 = this;
  return self__.val
};
cljs.core.__GT_Reduced = function __GT_Reduced(val) {
  return new cljs.core.Reduced(val)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return r instanceof cljs.core.Reduced
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt = cljs.core._count.call(null, cicoll);
    if(cnt === 0) {
      return f.call(null)
    }else {
      var val = cljs.core._nth.call(null, cicoll, 0);
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.call(null, val, cljs.core._nth.call(null, cicoll, n));
          if(cljs.core.reduced_QMARK_.call(null, nval)) {
            return cljs.core.deref.call(null, nval)
          }else {
            var G__6150 = nval;
            var G__6151 = n + 1;
            val = G__6150;
            n = G__6151;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt = cljs.core._count.call(null, cicoll);
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, cljs.core._nth.call(null, cicoll, n));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__6152 = nval;
          var G__6153 = n + 1;
          val__$1 = G__6152;
          n = G__6153;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt = cljs.core._count.call(null, cicoll);
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, cljs.core._nth.call(null, cicoll, n));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__6154 = nval;
          var G__6155 = n + 1;
          val__$1 = G__6154;
          n = G__6155;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ci_reduce.cljs$core$IFn$_invoke$arity$2 = ci_reduce__2;
  ci_reduce.cljs$core$IFn$_invoke$arity$3 = ci_reduce__3;
  ci_reduce.cljs$core$IFn$_invoke$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val = arr[0];
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.call(null, val, arr[n]);
          if(cljs.core.reduced_QMARK_.call(null, nval)) {
            return cljs.core.deref.call(null, nval)
          }else {
            var G__6156 = nval;
            var G__6157 = n + 1;
            val = G__6156;
            n = G__6157;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__6158 = nval;
          var G__6159 = n + 1;
          val__$1 = G__6158;
          n = G__6159;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__6160 = nval;
          var G__6161 = n + 1;
          val__$1 = G__6160;
          n = G__6161;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_reduce.cljs$core$IFn$_invoke$arity$2 = array_reduce__2;
  array_reduce.cljs$core$IFn$_invoke$arity$3 = array_reduce__3;
  array_reduce.cljs$core$IFn$_invoke$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6163 = x;
  if(G__6163) {
    var bit__3746__auto__ = G__6163.cljs$lang$protocol_mask$partition0$ & 2;
    if(bit__3746__auto__ || G__6163.cljs$core$ICounted$) {
      return true
    }else {
      if(!G__6163.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ICounted, G__6163)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ICounted, G__6163)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6165 = x;
  if(G__6165) {
    var bit__3746__auto__ = G__6165.cljs$lang$protocol_mask$partition0$ & 16;
    if(bit__3746__auto__ || G__6165.cljs$core$IIndexed$) {
      return true
    }else {
      if(!G__6165.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IIndexed, G__6165)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IIndexed, G__6165)
  }
};
cljs.core.IndexedSeq = function(arr, i) {
  this.arr = arr;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199550
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorStr = "cljs.core/IndexedSeq";
cljs.core.IndexedSeq.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.hash_coll.call(null, coll__$1)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  if(self__.i + 1 < self__.arr.length) {
    return new cljs.core.IndexedSeq(self__.arr, self__.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.cons.call(null, o, coll__$1)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var c = cljs.core._count.call(null, coll__$1);
  if(c > 0) {
    return new cljs.core.RSeq(coll__$1, c - 1, null)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, self__.arr[self__.i], self__.i + 1)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, start, self__.i)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  var this$__$1 = this;
  return this$__$1
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return self__.arr.length - self__.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return self__.arr[self__.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  if(self__.i + 1 < self__.arr.length) {
    return new cljs.core.IndexedSeq(self__.arr, self__.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  var coll__$1 = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.arr.length) {
    return self__.arr[i__$1]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  var coll__$1 = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.arr.length) {
    return self__.arr[i__$1]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.List.EMPTY
};
cljs.core.__GT_IndexedSeq = function __GT_IndexedSeq(arr, i) {
  return new cljs.core.IndexedSeq(arr, i)
};
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(i < prim.length) {
      return new cljs.core.IndexedSeq(prim, i)
    }else {
      return null
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  prim_seq.cljs$core$IFn$_invoke$arity$1 = prim_seq__1;
  prim_seq.cljs$core$IFn$_invoke$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_seq.cljs$core$IFn$_invoke$arity$1 = array_seq__1;
  array_seq.cljs$core$IFn$_invoke$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374862
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorStr = "cljs.core/RSeq";
cljs.core.RSeq.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.hash_coll.call(null, coll__$1)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.cons.call(null, o, coll__$1)
};
cljs.core.RSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(col, f) {
  var self__ = this;
  var col__$1 = this;
  return cljs.core.seq_reduce.call(null, f, col__$1)
};
cljs.core.RSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(col, f, start) {
  var self__ = this;
  var col__$1 = this;
  return cljs.core.seq_reduce.call(null, f, start, col__$1)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return coll__$1
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._nth.call(null, self__.ci, self__.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.i > 0) {
    return new cljs.core.RSeq(self__.ci, self__.i - 1, null)
  }else {
    return null
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.RSeq(self__.ci, self__.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.RSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_RSeq = function __GT_RSeq(ci, i, meta) {
  return new cljs.core.RSeq(ci, i, meta)
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn = cljs.core.next.call(null, s);
    if(!(sn == null)) {
      var G__6166 = sn;
      s = G__6166;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    if(!(coll == null)) {
      return cljs.core._conj.call(null, coll, x)
    }else {
      return cljs.core.list.call(null, x)
    }
  };
  var conj__3 = function() {
    var G__6167__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6168 = conj.call(null, coll, x);
          var G__6169 = cljs.core.first.call(null, xs);
          var G__6170 = cljs.core.next.call(null, xs);
          coll = G__6168;
          x = G__6169;
          xs = G__6170;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6167 = function(coll, x, var_args) {
      var xs = null;
      if(arguments.length > 2) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6167__delegate.call(this, coll, x, xs)
    };
    G__6167.cljs$lang$maxFixedArity = 2;
    G__6167.cljs$lang$applyTo = function(arglist__6171) {
      var coll = cljs.core.first(arglist__6171);
      arglist__6171 = cljs.core.next(arglist__6171);
      var x = cljs.core.first(arglist__6171);
      var xs = cljs.core.rest(arglist__6171);
      return G__6167__delegate(coll, x, xs)
    };
    G__6167.cljs$core$IFn$_invoke$arity$variadic = G__6167__delegate;
    return G__6167
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$core$IFn$_invoke$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$core$IFn$_invoke$arity$2 = conj__2;
  conj.cljs$core$IFn$_invoke$arity$variadic = conj__3.cljs$core$IFn$_invoke$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s = cljs.core.seq.call(null, coll);
  var acc = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s)) {
      return acc + cljs.core._count.call(null, s)
    }else {
      var G__6172 = cljs.core.next.call(null, s);
      var G__6173 = acc + 1;
      s = G__6172;
      acc = G__6173;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6175 = coll;
      if(G__6175) {
        var bit__3739__auto__ = G__6175.cljs$lang$protocol_mask$partition0$ & 2;
        if(bit__3739__auto__ || G__6175.cljs$core$ICounted$) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._count.call(null, coll)
    }else {
      if(coll instanceof Array) {
        return coll.length
      }else {
        if(typeof coll === "string") {
          return coll.length
        }else {
          if(cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ICounted, coll)) {
            return cljs.core._count.call(null, coll)
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return cljs.core.accumulating_seq_count.call(null, coll)
            }else {
              return null
            }
          }
        }
      }
    }
  }else {
    return 0
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    while(true) {
      if(coll == null) {
        throw new Error("Index out of bounds");
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            throw new Error("Index out of bounds");
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__6176 = cljs.core.next.call(null, coll);
              var G__6177 = n - 1;
              coll = G__6176;
              n = G__6177;
              continue
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                throw new Error("Index out of bounds");
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    while(true) {
      if(coll == null) {
        return not_found
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            return not_found
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n, not_found)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__6178 = cljs.core.next.call(null, coll);
              var G__6179 = n - 1;
              var G__6180 = not_found;
              coll = G__6178;
              n = G__6179;
              not_found = G__6180;
              continue
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  linear_traversal_nth.cljs$core$IFn$_invoke$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$core$IFn$_invoke$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6185 = coll;
        if(G__6185) {
          var bit__3739__auto__ = G__6185.cljs$lang$protocol_mask$partition0$ & 16;
          if(bit__3739__auto__ || G__6185.cljs$core$IIndexed$) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._nth.call(null, coll, n)
      }else {
        if(coll instanceof Array) {
          if(n < coll.length) {
            return coll[n]
          }else {
            return null
          }
        }else {
          if(typeof coll === "string") {
            if(n < coll.length) {
              return coll[n]
            }else {
              return null
            }
          }else {
            if(cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IIndexed, coll)) {
              return cljs.core._nth.call(null, coll, n)
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                if(function() {
                  var G__6186 = coll;
                  if(G__6186) {
                    var bit__3746__auto__ = G__6186.cljs$lang$protocol_mask$partition0$ & 64;
                    if(bit__3746__auto__ || G__6186.cljs$core$ISeq$) {
                      return true
                    }else {
                      if(!G__6186.cljs$lang$protocol_mask$partition0$) {
                        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISeq, G__6186)
                      }else {
                        return false
                      }
                    }
                  }else {
                    return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISeq, G__6186)
                  }
                }()) {
                  return cljs.core.linear_traversal_nth.call(null, coll, n)
                }else {
                  throw new Error([cljs.core.str("nth not supported on this type "), cljs.core.str(cljs.core.type__GT_str.call(null, cljs.core.type.call(null, coll)))].join(""));
                }
              }else {
                return null
              }
            }
          }
        }
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6187 = coll;
        if(G__6187) {
          var bit__3739__auto__ = G__6187.cljs$lang$protocol_mask$partition0$ & 16;
          if(bit__3739__auto__ || G__6187.cljs$core$IIndexed$) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._nth.call(null, coll, n, not_found)
      }else {
        if(coll instanceof Array) {
          if(n < coll.length) {
            return coll[n]
          }else {
            return not_found
          }
        }else {
          if(typeof coll === "string") {
            if(n < coll.length) {
              return coll[n]
            }else {
              return not_found
            }
          }else {
            if(cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IIndexed, coll)) {
              return cljs.core._nth.call(null, coll, n)
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                if(function() {
                  var G__6188 = coll;
                  if(G__6188) {
                    var bit__3746__auto__ = G__6188.cljs$lang$protocol_mask$partition0$ & 64;
                    if(bit__3746__auto__ || G__6188.cljs$core$ISeq$) {
                      return true
                    }else {
                      if(!G__6188.cljs$lang$protocol_mask$partition0$) {
                        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISeq, G__6188)
                      }else {
                        return false
                      }
                    }
                  }else {
                    return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISeq, G__6188)
                  }
                }()) {
                  return cljs.core.linear_traversal_nth.call(null, coll, n, not_found)
                }else {
                  throw new Error([cljs.core.str("nth not supported on this type "), cljs.core.str(cljs.core.type__GT_str.call(null, cljs.core.type.call(null, coll)))].join(""));
                }
              }else {
                return null
              }
            }
          }
        }
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  nth.cljs$core$IFn$_invoke$arity$2 = nth__2;
  nth.cljs$core$IFn$_invoke$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    if(o == null) {
      return null
    }else {
      if(function() {
        var G__6191 = o;
        if(G__6191) {
          var bit__3739__auto__ = G__6191.cljs$lang$protocol_mask$partition0$ & 256;
          if(bit__3739__auto__ || G__6191.cljs$core$ILookup$) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._lookup.call(null, o, k)
      }else {
        if(o instanceof Array) {
          if(k < o.length) {
            return o[k]
          }else {
            return null
          }
        }else {
          if(typeof o === "string") {
            if(k < o.length) {
              return o[k]
            }else {
              return null
            }
          }else {
            if(cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ILookup, o)) {
              return cljs.core._lookup.call(null, o, k)
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                return null
              }else {
                return null
              }
            }
          }
        }
      }
    }
  };
  var get__3 = function(o, k, not_found) {
    if(!(o == null)) {
      if(function() {
        var G__6192 = o;
        if(G__6192) {
          var bit__3739__auto__ = G__6192.cljs$lang$protocol_mask$partition0$ & 256;
          if(bit__3739__auto__ || G__6192.cljs$core$ILookup$) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._lookup.call(null, o, k, not_found)
      }else {
        if(o instanceof Array) {
          if(k < o.length) {
            return o[k]
          }else {
            return not_found
          }
        }else {
          if(typeof o === "string") {
            if(k < o.length) {
              return o[k]
            }else {
              return not_found
            }
          }else {
            if(cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ILookup, o)) {
              return cljs.core._lookup.call(null, o, k, not_found)
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
    }else {
      return not_found
    }
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get.cljs$core$IFn$_invoke$arity$2 = get__2;
  get.cljs$core$IFn$_invoke$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    if(!(coll == null)) {
      return cljs.core._assoc.call(null, coll, k, v)
    }else {
      return cljs.core.hash_map.call(null, k, v)
    }
  };
  var assoc__4 = function() {
    var G__6193__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6194 = ret;
          var G__6195 = cljs.core.first.call(null, kvs);
          var G__6196 = cljs.core.second.call(null, kvs);
          var G__6197 = cljs.core.nnext.call(null, kvs);
          coll = G__6194;
          k = G__6195;
          v = G__6196;
          kvs = G__6197;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__6193 = function(coll, k, v, var_args) {
      var kvs = null;
      if(arguments.length > 3) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6193__delegate.call(this, coll, k, v, kvs)
    };
    G__6193.cljs$lang$maxFixedArity = 3;
    G__6193.cljs$lang$applyTo = function(arglist__6198) {
      var coll = cljs.core.first(arglist__6198);
      arglist__6198 = cljs.core.next(arglist__6198);
      var k = cljs.core.first(arglist__6198);
      arglist__6198 = cljs.core.next(arglist__6198);
      var v = cljs.core.first(arglist__6198);
      var kvs = cljs.core.rest(arglist__6198);
      return G__6193__delegate(coll, k, v, kvs)
    };
    G__6193.cljs$core$IFn$_invoke$arity$variadic = G__6193__delegate;
    return G__6193
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$core$IFn$_invoke$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$core$IFn$_invoke$arity$3 = assoc__3;
  assoc.cljs$core$IFn$_invoke$arity$variadic = assoc__4.cljs$core$IFn$_invoke$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6199__delegate = function(coll, k, ks) {
      while(true) {
        var ret = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6200 = ret;
          var G__6201 = cljs.core.first.call(null, ks);
          var G__6202 = cljs.core.next.call(null, ks);
          coll = G__6200;
          k = G__6201;
          ks = G__6202;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__6199 = function(coll, k, var_args) {
      var ks = null;
      if(arguments.length > 2) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6199__delegate.call(this, coll, k, ks)
    };
    G__6199.cljs$lang$maxFixedArity = 2;
    G__6199.cljs$lang$applyTo = function(arglist__6203) {
      var coll = cljs.core.first(arglist__6203);
      arglist__6203 = cljs.core.next(arglist__6203);
      var k = cljs.core.first(arglist__6203);
      var ks = cljs.core.rest(arglist__6203);
      return G__6199__delegate(coll, k, ks)
    };
    G__6199.cljs$core$IFn$_invoke$arity$variadic = G__6199__delegate;
    return G__6199
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$core$IFn$_invoke$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$core$IFn$_invoke$arity$1 = dissoc__1;
  dissoc.cljs$core$IFn$_invoke$arity$2 = dissoc__2;
  dissoc.cljs$core$IFn$_invoke$arity$variadic = dissoc__3.cljs$core$IFn$_invoke$arity$variadic;
  return dissoc
}();
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  var or__3128__auto__ = goog.isFunction(f);
  if(or__3128__auto__) {
    return or__3128__auto__
  }else {
    var G__6207 = f;
    if(G__6207) {
      var bit__3746__auto__ = null;
      if(cljs.core.truth_(function() {
        var or__3128__auto____$1 = bit__3746__auto__;
        if(cljs.core.truth_(or__3128__auto____$1)) {
          return or__3128__auto____$1
        }else {
          return G__6207.cljs$core$Fn$
        }
      }())) {
        return true
      }else {
        if(!G__6207.cljs$lang$protocol_mask$partition$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.Fn, G__6207)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.Fn, G__6207)
    }
  }
};
cljs.core.with_meta = function with_meta(o, meta) {
  if(cljs.core.fn_QMARK_.call(null, o) && !function() {
    var G__6215 = o;
    if(G__6215) {
      var bit__3746__auto__ = G__6215.cljs$lang$protocol_mask$partition0$ & 262144;
      if(bit__3746__auto__ || G__6215.cljs$core$IWithMeta$) {
        return true
      }else {
        if(!G__6215.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IWithMeta, G__6215)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IWithMeta, G__6215)
    }
  }()) {
    return with_meta.call(null, function() {
      if(typeof cljs.core.t6216 !== "undefined") {
      }else {
        cljs.core.t6216 = function(meta, o, with_meta, meta6217) {
          this.meta = meta;
          this.o = o;
          this.with_meta = with_meta;
          this.meta6217 = meta6217;
          this.cljs$lang$protocol_mask$partition1$ = 0;
          this.cljs$lang$protocol_mask$partition0$ = 393217
        };
        cljs.core.t6216.cljs$lang$type = true;
        cljs.core.t6216.cljs$lang$ctorStr = "cljs.core/t6216";
        cljs.core.t6216.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
          return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/t6216")
        };
        cljs.core.t6216.prototype.call = function() {
          var G__6220__delegate = function(self__, args) {
            var self____$1 = this;
            var _ = self____$1;
            return cljs.core.apply.call(null, self__.o, args)
          };
          var G__6220 = function(self__, var_args) {
            var self__ = this;
            var args = null;
            if(arguments.length > 1) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
            }
            return G__6220__delegate.call(this, self__, args)
          };
          G__6220.cljs$lang$maxFixedArity = 1;
          G__6220.cljs$lang$applyTo = function(arglist__6221) {
            var self__ = cljs.core.first(arglist__6221);
            var args = cljs.core.rest(arglist__6221);
            return G__6220__delegate(self__, args)
          };
          G__6220.cljs$core$IFn$_invoke$arity$variadic = G__6220__delegate;
          return G__6220
        }();
        cljs.core.t6216.prototype.apply = function(self__, args6219) {
          var self__ = this;
          var self____$1 = this;
          return self____$1.call.apply(self____$1, [self____$1].concat(args6219.slice()))
        };
        cljs.core.t6216.prototype.cljs$core$IFn$_invoke$arity$2 = function() {
          var G__6222__delegate = function(args) {
            var _ = this;
            return cljs.core.apply.call(null, self__.o, args)
          };
          var G__6222 = function(var_args) {
            var self__ = this;
            var args = null;
            if(arguments.length > 0) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
            }
            return G__6222__delegate.call(this, args)
          };
          G__6222.cljs$lang$maxFixedArity = 0;
          G__6222.cljs$lang$applyTo = function(arglist__6223) {
            var args = cljs.core.seq(arglist__6223);
            return G__6222__delegate(args)
          };
          G__6222.cljs$core$IFn$_invoke$arity$variadic = G__6222__delegate;
          return G__6222
        }();
        cljs.core.t6216.prototype.cljs$core$Fn$ = true;
        cljs.core.t6216.prototype.cljs$core$IMeta$_meta$arity$1 = function(_6218) {
          var self__ = this;
          var _6218__$1 = this;
          return self__.meta6217
        };
        cljs.core.t6216.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_6218, meta6217__$1) {
          var self__ = this;
          var _6218__$1 = this;
          return new cljs.core.t6216(self__.meta, self__.o, self__.with_meta, meta6217__$1)
        };
        cljs.core.__GT_t6216 = function __GT_t6216(meta__$1, o__$1, with_meta__$1, meta6217) {
          return new cljs.core.t6216(meta__$1, o__$1, with_meta__$1, meta6217)
        }
      }
      return new cljs.core.t6216(meta, o, with_meta, null)
    }(), meta)
  }else {
    return cljs.core._with_meta.call(null, o, meta)
  }
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6225 = o;
    if(G__6225) {
      var bit__3746__auto__ = G__6225.cljs$lang$protocol_mask$partition0$ & 131072;
      if(bit__3746__auto__ || G__6225.cljs$core$IMeta$) {
        return true
      }else {
        if(!G__6225.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IMeta, G__6225)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IMeta, G__6225)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6226__delegate = function(coll, k, ks) {
      while(true) {
        var ret = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6227 = ret;
          var G__6228 = cljs.core.first.call(null, ks);
          var G__6229 = cljs.core.next.call(null, ks);
          coll = G__6227;
          k = G__6228;
          ks = G__6229;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__6226 = function(coll, k, var_args) {
      var ks = null;
      if(arguments.length > 2) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6226__delegate.call(this, coll, k, ks)
    };
    G__6226.cljs$lang$maxFixedArity = 2;
    G__6226.cljs$lang$applyTo = function(arglist__6230) {
      var coll = cljs.core.first(arglist__6230);
      arglist__6230 = cljs.core.next(arglist__6230);
      var k = cljs.core.first(arglist__6230);
      var ks = cljs.core.rest(arglist__6230);
      return G__6226__delegate(coll, k, ks)
    };
    G__6226.cljs$core$IFn$_invoke$arity$variadic = G__6226__delegate;
    return G__6226
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$core$IFn$_invoke$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$core$IFn$_invoke$arity$1 = disj__1;
  disj.cljs$core$IFn$_invoke$arity$2 = disj__2;
  disj.cljs$core$IFn$_invoke$arity$variadic = disj__3.cljs$core$IFn$_invoke$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h = cljs.core.string_hash_cache[k];
  if(typeof h === "number") {
    return h
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function hash(o) {
  if(function() {
    var G__6232 = o;
    if(G__6232) {
      var bit__3739__auto__ = G__6232.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(bit__3739__auto__ || G__6232.cljs$core$IHash$) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._hash.call(null, o)
  }else {
    if(typeof o === "number") {
      return Math.floor(o) % 2147483647
    }else {
      if(o === true) {
        return 1
      }else {
        if(o === false) {
          return 0
        }else {
          if(typeof o === "string") {
            return cljs.core.check_string_hash_cache.call(null, o)
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return cljs.core._hash.call(null, o)
            }else {
              return null
            }
          }
        }
      }
    }
  }
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return coll == null || cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6234 = x;
    if(G__6234) {
      var bit__3746__auto__ = G__6234.cljs$lang$protocol_mask$partition0$ & 8;
      if(bit__3746__auto__ || G__6234.cljs$core$ICollection$) {
        return true
      }else {
        if(!G__6234.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ICollection, G__6234)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ICollection, G__6234)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6236 = x;
    if(G__6236) {
      var bit__3746__auto__ = G__6236.cljs$lang$protocol_mask$partition0$ & 4096;
      if(bit__3746__auto__ || G__6236.cljs$core$ISet$) {
        return true
      }else {
        if(!G__6236.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISet, G__6236)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISet, G__6236)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6238 = x;
  if(G__6238) {
    var bit__3746__auto__ = G__6238.cljs$lang$protocol_mask$partition0$ & 512;
    if(bit__3746__auto__ || G__6238.cljs$core$IAssociative$) {
      return true
    }else {
      if(!G__6238.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IAssociative, G__6238)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IAssociative, G__6238)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6240 = x;
  if(G__6240) {
    var bit__3746__auto__ = G__6240.cljs$lang$protocol_mask$partition0$ & 16777216;
    if(bit__3746__auto__ || G__6240.cljs$core$ISequential$) {
      return true
    }else {
      if(!G__6240.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISequential, G__6240)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISequential, G__6240)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6242 = x;
  if(G__6242) {
    var bit__3746__auto__ = G__6242.cljs$lang$protocol_mask$partition0$ & 524288;
    if(bit__3746__auto__ || G__6242.cljs$core$IReduce$) {
      return true
    }else {
      if(!G__6242.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IReduce, G__6242)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IReduce, G__6242)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6244 = x;
    if(G__6244) {
      var bit__3746__auto__ = G__6244.cljs$lang$protocol_mask$partition0$ & 1024;
      if(bit__3746__auto__ || G__6244.cljs$core$IMap$) {
        return true
      }else {
        if(!G__6244.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IMap, G__6244)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IMap, G__6244)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6246 = x;
  if(G__6246) {
    var bit__3746__auto__ = G__6246.cljs$lang$protocol_mask$partition0$ & 16384;
    if(bit__3746__auto__ || G__6246.cljs$core$IVector$) {
      return true
    }else {
      if(!G__6246.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IVector, G__6246)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IVector, G__6246)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6248 = x;
  if(G__6248) {
    var bit__3739__auto__ = G__6248.cljs$lang$protocol_mask$partition1$ & 512;
    if(bit__3739__auto__ || G__6248.cljs$core$IChunkedSeq$) {
      return true
    }else {
      return false
    }
  }else {
    return false
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6249__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6249 = function(var_args) {
      var keyvals = null;
      if(arguments.length > 0) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6249__delegate.call(this, keyvals)
    };
    G__6249.cljs$lang$maxFixedArity = 0;
    G__6249.cljs$lang$applyTo = function(arglist__6250) {
      var keyvals = cljs.core.seq(arglist__6250);
      return G__6249__delegate(keyvals)
    };
    G__6249.cljs$core$IFn$_invoke$arity$variadic = G__6249__delegate;
    return G__6249
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$core$IFn$_invoke$arity$0 = js_obj__0;
  js_obj.cljs$core$IFn$_invoke$arity$variadic = js_obj__1.cljs$core$IFn$_invoke$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys = [];
  goog.object.forEach(obj, function(val, key, obj__$1) {
    return keys.push(key)
  });
  return keys
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__$1 = i;
  var j__$1 = j;
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__6251 = i__$1 + 1;
      var G__6252 = j__$1 + 1;
      var G__6253 = len__$1 - 1;
      i__$1 = G__6251;
      j__$1 = G__6252;
      len__$1 = G__6253;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__$1 = i + (len - 1);
  var j__$1 = j + (len - 1);
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__6254 = i__$1 - 1;
      var G__6255 = j__$1 - 1;
      var G__6256 = len__$1 - 1;
      i__$1 = G__6254;
      j__$1 = G__6255;
      len__$1 = G__6256;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__6258 = s;
    if(G__6258) {
      var bit__3746__auto__ = G__6258.cljs$lang$protocol_mask$partition0$ & 64;
      if(bit__3746__auto__ || G__6258.cljs$core$ISeq$) {
        return true
      }else {
        if(!G__6258.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISeq, G__6258)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISeq, G__6258)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6260 = s;
  if(G__6260) {
    var bit__3746__auto__ = G__6260.cljs$lang$protocol_mask$partition0$ & 8388608;
    if(bit__3746__auto__ || G__6260.cljs$core$ISeqable$) {
      return true
    }else {
      if(!G__6260.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISeqable, G__6260)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISeqable, G__6260)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3128__auto__ = cljs.core.fn_QMARK_.call(null, f);
  if(or__3128__auto__) {
    return or__3128__auto__
  }else {
    var G__6264 = f;
    if(G__6264) {
      var bit__3746__auto__ = G__6264.cljs$lang$protocol_mask$partition0$ & 1;
      if(bit__3746__auto__ || G__6264.cljs$core$IFn$) {
        return true
      }else {
        if(!G__6264.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IFn, G__6264)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IFn, G__6264)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  return typeof n === "number" && !isNaN(n) && !(n === Infinity) && parseFloat(n) === parseInt(n, 10)
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.get.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(!(coll == null) && cljs.core.associative_QMARK_.call(null, coll) && cljs.core.contains_QMARK_.call(null, coll, k)) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core.get.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__6265__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s = cljs.core.PersistentHashSet.fromArray([y, null, x, null], true);
        var xs = more;
        while(true) {
          var x__$1 = cljs.core.first.call(null, xs);
          var etc = cljs.core.next.call(null, xs);
          if(cljs.core.truth_(xs)) {
            if(cljs.core.contains_QMARK_.call(null, s, x__$1)) {
              return false
            }else {
              var G__6266 = cljs.core.conj.call(null, s, x__$1);
              var G__6267 = etc;
              s = G__6266;
              xs = G__6267;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__6265 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6265__delegate.call(this, x, y, more)
    };
    G__6265.cljs$lang$maxFixedArity = 2;
    G__6265.cljs$lang$applyTo = function(arglist__6268) {
      var x = cljs.core.first(arglist__6268);
      arglist__6268 = cljs.core.next(arglist__6268);
      var y = cljs.core.first(arglist__6268);
      var more = cljs.core.rest(arglist__6268);
      return G__6265__delegate(x, y, more)
    };
    G__6265.cljs$core$IFn$_invoke$arity$variadic = G__6265__delegate;
    return G__6265
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$variadic = distinct_QMARK___3.cljs$core$IFn$_invoke$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__6270 = x;
            if(G__6270) {
              var bit__3739__auto__ = G__6270.cljs$lang$protocol_mask$partition1$ & 2048;
              if(bit__3739__auto__ || G__6270.cljs$core$IComparable$) {
                return true
              }else {
                return false
              }
            }else {
              return false
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl = cljs.core.count.call(null, xs);
    var yl = cljs.core.count.call(null, ys);
    if(xl < yl) {
      return-1
    }else {
      if(xl > yl) {
        return 1
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return compare_indexed.call(null, xs, ys, xl, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(d === 0 && n + 1 < len) {
        var G__6271 = xs;
        var G__6272 = ys;
        var G__6273 = len;
        var G__6274 = n + 1;
        xs = G__6271;
        ys = G__6272;
        len = G__6273;
        n = G__6274;
        continue
      }else {
        return d
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  compare_indexed.cljs$core$IFn$_invoke$arity$2 = compare_indexed__2;
  compare_indexed.cljs$core$IFn$_invoke$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r = f.call(null, x, y);
      if(typeof r === "number") {
        return r
      }else {
        if(cljs.core.truth_(r)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort.cljs$core$IFn$_invoke$arity$1 = sort__1;
  sort.cljs$core$IFn$_invoke$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort_by.cljs$core$IFn$_invoke$arity$2 = sort_by__2;
  sort_by.cljs$core$IFn$_invoke$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__4090__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4090__auto__) {
      var s = temp__4090__auto__;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s), cljs.core.next.call(null, s))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__$1 = val;
    var coll__$1 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__$1) {
        var nval = f.call(null, val__$1, cljs.core.first.call(null, coll__$1));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__6275 = nval;
          var G__6276 = cljs.core.next.call(null, coll__$1);
          val__$1 = G__6275;
          coll__$1 = G__6276;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  seq_reduce.cljs$core$IFn$_invoke$arity$2 = seq_reduce__2;
  seq_reduce.cljs$core$IFn$_invoke$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a);
  return cljs.core.vec.call(null, a)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__6279 = coll;
      if(G__6279) {
        var bit__3739__auto__ = G__6279.cljs$lang$protocol_mask$partition0$ & 524288;
        if(bit__3739__auto__ || G__6279.cljs$core$IReduce$) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      if(coll instanceof Array) {
        return cljs.core.array_reduce.call(null, coll, f)
      }else {
        if(typeof coll === "string") {
          return cljs.core.array_reduce.call(null, coll, f)
        }else {
          if(cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IReduce, coll)) {
            return cljs.core._reduce.call(null, coll, f)
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return cljs.core.seq_reduce.call(null, f, coll)
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__6280 = coll;
      if(G__6280) {
        var bit__3739__auto__ = G__6280.cljs$lang$protocol_mask$partition0$ & 524288;
        if(bit__3739__auto__ || G__6280.cljs$core$IReduce$) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      if(coll instanceof Array) {
        return cljs.core.array_reduce.call(null, coll, f, val)
      }else {
        if(typeof coll === "string") {
          return cljs.core.array_reduce.call(null, coll, f, val)
        }else {
          if(cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IReduce, coll)) {
            return cljs.core._reduce.call(null, coll, f, val)
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return cljs.core.seq_reduce.call(null, f, val, coll)
            }else {
              return null
            }
          }
        }
      }
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reduce.cljs$core$IFn$_invoke$arity$2 = reduce__2;
  reduce.cljs$core$IFn$_invoke$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__6281__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__6281 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6281__delegate.call(this, x, y, more)
    };
    G__6281.cljs$lang$maxFixedArity = 2;
    G__6281.cljs$lang$applyTo = function(arglist__6282) {
      var x = cljs.core.first(arglist__6282);
      arglist__6282 = cljs.core.next(arglist__6282);
      var y = cljs.core.first(arglist__6282);
      var more = cljs.core.rest(arglist__6282);
      return G__6281__delegate(x, y, more)
    };
    G__6281.cljs$core$IFn$_invoke$arity$variadic = G__6281__delegate;
    return G__6281
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$core$IFn$_invoke$arity$0 = _PLUS___0;
  _PLUS_.cljs$core$IFn$_invoke$arity$1 = _PLUS___1;
  _PLUS_.cljs$core$IFn$_invoke$arity$2 = _PLUS___2;
  _PLUS_.cljs$core$IFn$_invoke$arity$variadic = _PLUS___3.cljs$core$IFn$_invoke$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__6283__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__6283 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6283__delegate.call(this, x, y, more)
    };
    G__6283.cljs$lang$maxFixedArity = 2;
    G__6283.cljs$lang$applyTo = function(arglist__6284) {
      var x = cljs.core.first(arglist__6284);
      arglist__6284 = cljs.core.next(arglist__6284);
      var y = cljs.core.first(arglist__6284);
      var more = cljs.core.rest(arglist__6284);
      return G__6283__delegate(x, y, more)
    };
    G__6283.cljs$core$IFn$_invoke$arity$variadic = G__6283__delegate;
    return G__6283
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$core$IFn$_invoke$arity$1 = ___1;
  _.cljs$core$IFn$_invoke$arity$2 = ___2;
  _.cljs$core$IFn$_invoke$arity$variadic = ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__6285__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__6285 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6285__delegate.call(this, x, y, more)
    };
    G__6285.cljs$lang$maxFixedArity = 2;
    G__6285.cljs$lang$applyTo = function(arglist__6286) {
      var x = cljs.core.first(arglist__6286);
      arglist__6286 = cljs.core.next(arglist__6286);
      var y = cljs.core.first(arglist__6286);
      var more = cljs.core.rest(arglist__6286);
      return G__6285__delegate(x, y, more)
    };
    G__6285.cljs$core$IFn$_invoke$arity$variadic = G__6285__delegate;
    return G__6285
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$core$IFn$_invoke$arity$0 = _STAR___0;
  _STAR_.cljs$core$IFn$_invoke$arity$1 = _STAR___1;
  _STAR_.cljs$core$IFn$_invoke$arity$2 = _STAR___2;
  _STAR_.cljs$core$IFn$_invoke$arity$variadic = _STAR___3.cljs$core$IFn$_invoke$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__6287__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__6287 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6287__delegate.call(this, x, y, more)
    };
    G__6287.cljs$lang$maxFixedArity = 2;
    G__6287.cljs$lang$applyTo = function(arglist__6288) {
      var x = cljs.core.first(arglist__6288);
      arglist__6288 = cljs.core.next(arglist__6288);
      var y = cljs.core.first(arglist__6288);
      var more = cljs.core.rest(arglist__6288);
      return G__6287__delegate(x, y, more)
    };
    G__6287.cljs$core$IFn$_invoke$arity$variadic = G__6287__delegate;
    return G__6287
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$core$IFn$_invoke$arity$1 = _SLASH___1;
  _SLASH_.cljs$core$IFn$_invoke$arity$2 = _SLASH___2;
  _SLASH_.cljs$core$IFn$_invoke$arity$variadic = _SLASH___3.cljs$core$IFn$_invoke$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__6289__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__6290 = y;
            var G__6291 = cljs.core.first.call(null, more);
            var G__6292 = cljs.core.next.call(null, more);
            x = G__6290;
            y = G__6291;
            more = G__6292;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6289 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6289__delegate.call(this, x, y, more)
    };
    G__6289.cljs$lang$maxFixedArity = 2;
    G__6289.cljs$lang$applyTo = function(arglist__6293) {
      var x = cljs.core.first(arglist__6293);
      arglist__6293 = cljs.core.next(arglist__6293);
      var y = cljs.core.first(arglist__6293);
      var more = cljs.core.rest(arglist__6293);
      return G__6289__delegate(x, y, more)
    };
    G__6289.cljs$core$IFn$_invoke$arity$variadic = G__6289__delegate;
    return G__6289
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$core$IFn$_invoke$arity$1 = _LT___1;
  _LT_.cljs$core$IFn$_invoke$arity$2 = _LT___2;
  _LT_.cljs$core$IFn$_invoke$arity$variadic = _LT___3.cljs$core$IFn$_invoke$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__6294__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__6295 = y;
            var G__6296 = cljs.core.first.call(null, more);
            var G__6297 = cljs.core.next.call(null, more);
            x = G__6295;
            y = G__6296;
            more = G__6297;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6294 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6294__delegate.call(this, x, y, more)
    };
    G__6294.cljs$lang$maxFixedArity = 2;
    G__6294.cljs$lang$applyTo = function(arglist__6298) {
      var x = cljs.core.first(arglist__6298);
      arglist__6298 = cljs.core.next(arglist__6298);
      var y = cljs.core.first(arglist__6298);
      var more = cljs.core.rest(arglist__6298);
      return G__6294__delegate(x, y, more)
    };
    G__6294.cljs$core$IFn$_invoke$arity$variadic = G__6294__delegate;
    return G__6294
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$variadic = _LT__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__6299__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__6300 = y;
            var G__6301 = cljs.core.first.call(null, more);
            var G__6302 = cljs.core.next.call(null, more);
            x = G__6300;
            y = G__6301;
            more = G__6302;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6299 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6299__delegate.call(this, x, y, more)
    };
    G__6299.cljs$lang$maxFixedArity = 2;
    G__6299.cljs$lang$applyTo = function(arglist__6303) {
      var x = cljs.core.first(arglist__6303);
      arglist__6303 = cljs.core.next(arglist__6303);
      var y = cljs.core.first(arglist__6303);
      var more = cljs.core.rest(arglist__6303);
      return G__6299__delegate(x, y, more)
    };
    G__6299.cljs$core$IFn$_invoke$arity$variadic = G__6299__delegate;
    return G__6299
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$core$IFn$_invoke$arity$1 = _GT___1;
  _GT_.cljs$core$IFn$_invoke$arity$2 = _GT___2;
  _GT_.cljs$core$IFn$_invoke$arity$variadic = _GT___3.cljs$core$IFn$_invoke$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__6304__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__6305 = y;
            var G__6306 = cljs.core.first.call(null, more);
            var G__6307 = cljs.core.next.call(null, more);
            x = G__6305;
            y = G__6306;
            more = G__6307;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6304 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6304__delegate.call(this, x, y, more)
    };
    G__6304.cljs$lang$maxFixedArity = 2;
    G__6304.cljs$lang$applyTo = function(arglist__6308) {
      var x = cljs.core.first(arglist__6308);
      arglist__6308 = cljs.core.next(arglist__6308);
      var y = cljs.core.first(arglist__6308);
      var more = cljs.core.rest(arglist__6308);
      return G__6304__delegate(x, y, more)
    };
    G__6304.cljs$core$IFn$_invoke$arity$variadic = G__6304__delegate;
    return G__6304
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$variadic = _GT__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    var x__3433__auto__ = x;
    var y__3434__auto__ = y;
    return x__3433__auto__ > y__3434__auto__ ? x__3433__auto__ : y__3434__auto__
  };
  var max__3 = function() {
    var G__6309__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, function() {
        var x__3433__auto__ = x;
        var y__3434__auto__ = y;
        return x__3433__auto__ > y__3434__auto__ ? x__3433__auto__ : y__3434__auto__
      }(), more)
    };
    var G__6309 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6309__delegate.call(this, x, y, more)
    };
    G__6309.cljs$lang$maxFixedArity = 2;
    G__6309.cljs$lang$applyTo = function(arglist__6310) {
      var x = cljs.core.first(arglist__6310);
      arglist__6310 = cljs.core.next(arglist__6310);
      var y = cljs.core.first(arglist__6310);
      var more = cljs.core.rest(arglist__6310);
      return G__6309__delegate(x, y, more)
    };
    G__6309.cljs$core$IFn$_invoke$arity$variadic = G__6309__delegate;
    return G__6309
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$core$IFn$_invoke$arity$1 = max__1;
  max.cljs$core$IFn$_invoke$arity$2 = max__2;
  max.cljs$core$IFn$_invoke$arity$variadic = max__3.cljs$core$IFn$_invoke$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    var x__3440__auto__ = x;
    var y__3441__auto__ = y;
    return x__3440__auto__ < y__3441__auto__ ? x__3440__auto__ : y__3441__auto__
  };
  var min__3 = function() {
    var G__6311__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, function() {
        var x__3440__auto__ = x;
        var y__3441__auto__ = y;
        return x__3440__auto__ < y__3441__auto__ ? x__3440__auto__ : y__3441__auto__
      }(), more)
    };
    var G__6311 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6311__delegate.call(this, x, y, more)
    };
    G__6311.cljs$lang$maxFixedArity = 2;
    G__6311.cljs$lang$applyTo = function(arglist__6312) {
      var x = cljs.core.first(arglist__6312);
      arglist__6312 = cljs.core.next(arglist__6312);
      var y = cljs.core.first(arglist__6312);
      var more = cljs.core.rest(arglist__6312);
      return G__6311__delegate(x, y, more)
    };
    G__6311.cljs$core$IFn$_invoke$arity$variadic = G__6311__delegate;
    return G__6311
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$core$IFn$_invoke$arity$1 = min__1;
  min.cljs$core$IFn$_invoke$arity$2 = min__2;
  min.cljs$core$IFn$_invoke$arity$variadic = min__3.cljs$core$IFn$_invoke$arity$variadic;
  return min
}();
cljs.core.byte$ = function byte$(x) {
  return x
};
cljs.core.char$ = function char$(x) {
  if(typeof x === "number") {
    return String.fromCharCode(x)
  }else {
    if(typeof x === "string" && x.length === 1) {
      return x
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        throw new Error("Argument to char must be a character or number");
      }else {
        return null
      }
    }
  }
};
cljs.core.short$ = function short$(x) {
  return x
};
cljs.core.float$ = function float$(x) {
  return x
};
cljs.core.double$ = function double$(x) {
  return x
};
cljs.core.unchecked_byte = function unchecked_byte(x) {
  return x
};
cljs.core.unchecked_char = function unchecked_char(x) {
  return x
};
cljs.core.unchecked_short = function unchecked_short(x) {
  return x
};
cljs.core.unchecked_float = function unchecked_float(x) {
  return x
};
cljs.core.unchecked_double = function unchecked_double(x) {
  return x
};
cljs.core.unchecked_add = function() {
  var unchecked_add = null;
  var unchecked_add__0 = function() {
    return 0
  };
  var unchecked_add__1 = function(x) {
    return x
  };
  var unchecked_add__2 = function(x, y) {
    return x + y
  };
  var unchecked_add__3 = function() {
    var G__6313__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_add, x + y, more)
    };
    var G__6313 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6313__delegate.call(this, x, y, more)
    };
    G__6313.cljs$lang$maxFixedArity = 2;
    G__6313.cljs$lang$applyTo = function(arglist__6314) {
      var x = cljs.core.first(arglist__6314);
      arglist__6314 = cljs.core.next(arglist__6314);
      var y = cljs.core.first(arglist__6314);
      var more = cljs.core.rest(arglist__6314);
      return G__6313__delegate(x, y, more)
    };
    G__6313.cljs$core$IFn$_invoke$arity$variadic = G__6313__delegate;
    return G__6313
  }();
  unchecked_add = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_add__0.call(this);
      case 1:
        return unchecked_add__1.call(this, x);
      case 2:
        return unchecked_add__2.call(this, x, y);
      default:
        return unchecked_add__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_add.cljs$lang$maxFixedArity = 2;
  unchecked_add.cljs$lang$applyTo = unchecked_add__3.cljs$lang$applyTo;
  unchecked_add.cljs$core$IFn$_invoke$arity$0 = unchecked_add__0;
  unchecked_add.cljs$core$IFn$_invoke$arity$1 = unchecked_add__1;
  unchecked_add.cljs$core$IFn$_invoke$arity$2 = unchecked_add__2;
  unchecked_add.cljs$core$IFn$_invoke$arity$variadic = unchecked_add__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_add
}();
cljs.core.unchecked_add_int = function() {
  var unchecked_add_int = null;
  var unchecked_add_int__0 = function() {
    return 0
  };
  var unchecked_add_int__1 = function(x) {
    return x
  };
  var unchecked_add_int__2 = function(x, y) {
    return x + y
  };
  var unchecked_add_int__3 = function() {
    var G__6315__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_add_int, x + y, more)
    };
    var G__6315 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6315__delegate.call(this, x, y, more)
    };
    G__6315.cljs$lang$maxFixedArity = 2;
    G__6315.cljs$lang$applyTo = function(arglist__6316) {
      var x = cljs.core.first(arglist__6316);
      arglist__6316 = cljs.core.next(arglist__6316);
      var y = cljs.core.first(arglist__6316);
      var more = cljs.core.rest(arglist__6316);
      return G__6315__delegate(x, y, more)
    };
    G__6315.cljs$core$IFn$_invoke$arity$variadic = G__6315__delegate;
    return G__6315
  }();
  unchecked_add_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_add_int__0.call(this);
      case 1:
        return unchecked_add_int__1.call(this, x);
      case 2:
        return unchecked_add_int__2.call(this, x, y);
      default:
        return unchecked_add_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_add_int.cljs$lang$maxFixedArity = 2;
  unchecked_add_int.cljs$lang$applyTo = unchecked_add_int__3.cljs$lang$applyTo;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$0 = unchecked_add_int__0;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$1 = unchecked_add_int__1;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$2 = unchecked_add_int__2;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_add_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_add_int
}();
cljs.core.unchecked_dec = function unchecked_dec(x) {
  return x - 1
};
cljs.core.unchecked_dec_int = function unchecked_dec_int(x) {
  return x - 1
};
cljs.core.unchecked_divide_int = function() {
  var unchecked_divide_int = null;
  var unchecked_divide_int__1 = function(x) {
    return unchecked_divide_int.call(null, 1, x)
  };
  var unchecked_divide_int__2 = function(x, y) {
    return x / y
  };
  var unchecked_divide_int__3 = function() {
    var G__6317__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_divide_int, unchecked_divide_int.call(null, x, y), more)
    };
    var G__6317 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6317__delegate.call(this, x, y, more)
    };
    G__6317.cljs$lang$maxFixedArity = 2;
    G__6317.cljs$lang$applyTo = function(arglist__6318) {
      var x = cljs.core.first(arglist__6318);
      arglist__6318 = cljs.core.next(arglist__6318);
      var y = cljs.core.first(arglist__6318);
      var more = cljs.core.rest(arglist__6318);
      return G__6317__delegate(x, y, more)
    };
    G__6317.cljs$core$IFn$_invoke$arity$variadic = G__6317__delegate;
    return G__6317
  }();
  unchecked_divide_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_divide_int__1.call(this, x);
      case 2:
        return unchecked_divide_int__2.call(this, x, y);
      default:
        return unchecked_divide_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_divide_int.cljs$lang$maxFixedArity = 2;
  unchecked_divide_int.cljs$lang$applyTo = unchecked_divide_int__3.cljs$lang$applyTo;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$1 = unchecked_divide_int__1;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$2 = unchecked_divide_int__2;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_divide_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_divide_int
}();
cljs.core.unchecked_inc = function unchecked_inc(x) {
  return x + 1
};
cljs.core.unchecked_inc_int = function unchecked_inc_int(x) {
  return x + 1
};
cljs.core.unchecked_multiply = function() {
  var unchecked_multiply = null;
  var unchecked_multiply__0 = function() {
    return 1
  };
  var unchecked_multiply__1 = function(x) {
    return x
  };
  var unchecked_multiply__2 = function(x, y) {
    return x * y
  };
  var unchecked_multiply__3 = function() {
    var G__6319__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_multiply, x * y, more)
    };
    var G__6319 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6319__delegate.call(this, x, y, more)
    };
    G__6319.cljs$lang$maxFixedArity = 2;
    G__6319.cljs$lang$applyTo = function(arglist__6320) {
      var x = cljs.core.first(arglist__6320);
      arglist__6320 = cljs.core.next(arglist__6320);
      var y = cljs.core.first(arglist__6320);
      var more = cljs.core.rest(arglist__6320);
      return G__6319__delegate(x, y, more)
    };
    G__6319.cljs$core$IFn$_invoke$arity$variadic = G__6319__delegate;
    return G__6319
  }();
  unchecked_multiply = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_multiply__0.call(this);
      case 1:
        return unchecked_multiply__1.call(this, x);
      case 2:
        return unchecked_multiply__2.call(this, x, y);
      default:
        return unchecked_multiply__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_multiply.cljs$lang$maxFixedArity = 2;
  unchecked_multiply.cljs$lang$applyTo = unchecked_multiply__3.cljs$lang$applyTo;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$0 = unchecked_multiply__0;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$1 = unchecked_multiply__1;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$2 = unchecked_multiply__2;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$variadic = unchecked_multiply__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_multiply
}();
cljs.core.unchecked_multiply_int = function() {
  var unchecked_multiply_int = null;
  var unchecked_multiply_int__0 = function() {
    return 1
  };
  var unchecked_multiply_int__1 = function(x) {
    return x
  };
  var unchecked_multiply_int__2 = function(x, y) {
    return x * y
  };
  var unchecked_multiply_int__3 = function() {
    var G__6321__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_multiply_int, x * y, more)
    };
    var G__6321 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6321__delegate.call(this, x, y, more)
    };
    G__6321.cljs$lang$maxFixedArity = 2;
    G__6321.cljs$lang$applyTo = function(arglist__6322) {
      var x = cljs.core.first(arglist__6322);
      arglist__6322 = cljs.core.next(arglist__6322);
      var y = cljs.core.first(arglist__6322);
      var more = cljs.core.rest(arglist__6322);
      return G__6321__delegate(x, y, more)
    };
    G__6321.cljs$core$IFn$_invoke$arity$variadic = G__6321__delegate;
    return G__6321
  }();
  unchecked_multiply_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_multiply_int__0.call(this);
      case 1:
        return unchecked_multiply_int__1.call(this, x);
      case 2:
        return unchecked_multiply_int__2.call(this, x, y);
      default:
        return unchecked_multiply_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_multiply_int.cljs$lang$maxFixedArity = 2;
  unchecked_multiply_int.cljs$lang$applyTo = unchecked_multiply_int__3.cljs$lang$applyTo;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$0 = unchecked_multiply_int__0;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$1 = unchecked_multiply_int__1;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$2 = unchecked_multiply_int__2;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_multiply_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_multiply_int
}();
cljs.core.unchecked_negate = function unchecked_negate(x) {
  return-x
};
cljs.core.unchecked_negate_int = function unchecked_negate_int(x) {
  return-x
};
cljs.core.unchecked_remainder_int = function unchecked_remainder_int(x, n) {
  return cljs.core.mod.call(null, x, n)
};
cljs.core.unchecked_substract = function() {
  var unchecked_substract = null;
  var unchecked_substract__1 = function(x) {
    return-x
  };
  var unchecked_substract__2 = function(x, y) {
    return x - y
  };
  var unchecked_substract__3 = function() {
    var G__6323__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_substract, x - y, more)
    };
    var G__6323 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6323__delegate.call(this, x, y, more)
    };
    G__6323.cljs$lang$maxFixedArity = 2;
    G__6323.cljs$lang$applyTo = function(arglist__6324) {
      var x = cljs.core.first(arglist__6324);
      arglist__6324 = cljs.core.next(arglist__6324);
      var y = cljs.core.first(arglist__6324);
      var more = cljs.core.rest(arglist__6324);
      return G__6323__delegate(x, y, more)
    };
    G__6323.cljs$core$IFn$_invoke$arity$variadic = G__6323__delegate;
    return G__6323
  }();
  unchecked_substract = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_substract__1.call(this, x);
      case 2:
        return unchecked_substract__2.call(this, x, y);
      default:
        return unchecked_substract__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_substract.cljs$lang$maxFixedArity = 2;
  unchecked_substract.cljs$lang$applyTo = unchecked_substract__3.cljs$lang$applyTo;
  unchecked_substract.cljs$core$IFn$_invoke$arity$1 = unchecked_substract__1;
  unchecked_substract.cljs$core$IFn$_invoke$arity$2 = unchecked_substract__2;
  unchecked_substract.cljs$core$IFn$_invoke$arity$variadic = unchecked_substract__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_substract
}();
cljs.core.unchecked_substract_int = function() {
  var unchecked_substract_int = null;
  var unchecked_substract_int__1 = function(x) {
    return-x
  };
  var unchecked_substract_int__2 = function(x, y) {
    return x - y
  };
  var unchecked_substract_int__3 = function() {
    var G__6325__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_substract_int, x - y, more)
    };
    var G__6325 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6325__delegate.call(this, x, y, more)
    };
    G__6325.cljs$lang$maxFixedArity = 2;
    G__6325.cljs$lang$applyTo = function(arglist__6326) {
      var x = cljs.core.first(arglist__6326);
      arglist__6326 = cljs.core.next(arglist__6326);
      var y = cljs.core.first(arglist__6326);
      var more = cljs.core.rest(arglist__6326);
      return G__6325__delegate(x, y, more)
    };
    G__6325.cljs$core$IFn$_invoke$arity$variadic = G__6325__delegate;
    return G__6325
  }();
  unchecked_substract_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_substract_int__1.call(this, x);
      case 2:
        return unchecked_substract_int__2.call(this, x, y);
      default:
        return unchecked_substract_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_substract_int.cljs$lang$maxFixedArity = 2;
  unchecked_substract_int.cljs$lang$applyTo = unchecked_substract_int__3.cljs$lang$applyTo;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$1 = unchecked_substract_int__1;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$2 = unchecked_substract_int__2;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_substract_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_substract_int
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return x | 0
};
cljs.core.unchecked_int = function unchecked_int(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.unchecked_long = function unchecked_long(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.booleans = function booleans(x) {
  return x
};
cljs.core.bytes = function bytes(x) {
  return x
};
cljs.core.chars = function chars(x) {
  return x
};
cljs.core.shorts = function shorts(x) {
  return x
};
cljs.core.ints = function ints(x) {
  return x
};
cljs.core.floats = function floats(x) {
  return x
};
cljs.core.doubles = function doubles(x) {
  return x
};
cljs.core.longs = function longs(x) {
  return x
};
cljs.core.js_mod = function js_mod(n, d) {
  return n % d
};
cljs.core.mod = function mod(n, d) {
  return(n % d + d) % d
};
cljs.core.quot = function quot(n, d) {
  var rem = n % d;
  return cljs.core.fix.call(null, (n - rem) / d)
};
cljs.core.rem = function rem(n, d) {
  var q = cljs.core.quot.call(null, n, d);
  return n - d * q
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$core$IFn$_invoke$arity$0 = rand__0;
  rand.cljs$core$IFn$_invoke$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__$1 = v - (v >> 1 & 1431655765);
  var v__$2 = (v__$1 & 858993459) + (v__$1 >> 2 & 858993459);
  return(v__$2 + (v__$2 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__6327__delegate = function(x, y, more) {
      while(true) {
        if(_EQ__EQ_.call(null, x, y)) {
          if(cljs.core.next.call(null, more)) {
            var G__6328 = y;
            var G__6329 = cljs.core.first.call(null, more);
            var G__6330 = cljs.core.next.call(null, more);
            x = G__6328;
            y = G__6329;
            more = G__6330;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6327 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6327__delegate.call(this, x, y, more)
    };
    G__6327.cljs$lang$maxFixedArity = 2;
    G__6327.cljs$lang$applyTo = function(arglist__6331) {
      var x = cljs.core.first(arglist__6331);
      arglist__6331 = cljs.core.next(arglist__6331);
      var y = cljs.core.first(arglist__6331);
      var more = cljs.core.rest(arglist__6331);
      return G__6327__delegate(x, y, more)
    };
    G__6327.cljs$core$IFn$_invoke$arity$variadic = G__6327__delegate;
    return G__6327
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$variadic = _EQ__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__$1 = n;
  var xs = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs && n__$1 > 0) {
      var G__6332 = n__$1 - 1;
      var G__6333 = cljs.core.next.call(null, xs);
      n__$1 = G__6332;
      xs = G__6333;
      continue
    }else {
      return xs
    }
    break
  }
};
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(x == null) {
      return""
    }else {
      return x.toString()
    }
  };
  var str__2 = function() {
    var G__6334__delegate = function(x, ys) {
      var sb = new goog.string.StringBuffer(str.call(null, x));
      var more = ys;
      while(true) {
        if(cljs.core.truth_(more)) {
          var G__6335 = sb.append(str.call(null, cljs.core.first.call(null, more)));
          var G__6336 = cljs.core.next.call(null, more);
          sb = G__6335;
          more = G__6336;
          continue
        }else {
          return sb.toString()
        }
        break
      }
    };
    var G__6334 = function(x, var_args) {
      var ys = null;
      if(arguments.length > 1) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6334__delegate.call(this, x, ys)
    };
    G__6334.cljs$lang$maxFixedArity = 1;
    G__6334.cljs$lang$applyTo = function(arglist__6337) {
      var x = cljs.core.first(arglist__6337);
      var ys = cljs.core.rest(arglist__6337);
      return G__6334__delegate(x, ys)
    };
    G__6334.cljs$core$IFn$_invoke$arity$variadic = G__6334__delegate;
    return G__6334
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$core$IFn$_invoke$arity$0 = str__0;
  str.cljs$core$IFn$_invoke$arity$1 = str__1;
  str.cljs$core$IFn$_invoke$arity$variadic = str__2.cljs$core$IFn$_invoke$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subs.cljs$core$IFn$_invoke$arity$2 = subs__2;
  subs.cljs$core$IFn$_invoke$arity$3 = subs__3;
  return subs
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs = cljs.core.seq.call(null, x);
    var ys = cljs.core.seq.call(null, y);
    while(true) {
      if(xs == null) {
        return ys == null
      }else {
        if(ys == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs), cljs.core.first.call(null, ys))) {
            var G__6338 = cljs.core.next.call(null, xs);
            var G__6339 = cljs.core.next.call(null, ys);
            xs = G__6338;
            ys = G__6339;
            continue
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  if(cljs.core.seq.call(null, coll)) {
    var res = cljs.core.hash.call(null, cljs.core.first.call(null, coll));
    var s = cljs.core.next.call(null, coll);
    while(true) {
      if(s == null) {
        return res
      }else {
        var G__6340 = cljs.core.hash_combine.call(null, res, cljs.core.hash.call(null, cljs.core.first.call(null, s)));
        var G__6341 = cljs.core.next.call(null, s);
        res = G__6340;
        s = G__6341;
        continue
      }
      break
    }
  }else {
    return 0
  }
};
cljs.core.hash_imap = function hash_imap(m) {
  var h = 0;
  var s = cljs.core.seq.call(null, m);
  while(true) {
    if(s) {
      var e = cljs.core.first.call(null, s);
      var G__6342 = (h + (cljs.core.hash.call(null, cljs.core.key.call(null, e)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e)))) % 4503599627370496;
      var G__6343 = cljs.core.next.call(null, s);
      h = G__6342;
      s = G__6343;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h = 0;
  var s__$1 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__$1) {
      var e = cljs.core.first.call(null, s__$1);
      var G__6344 = (h + cljs.core.hash.call(null, e)) % 4503599627370496;
      var G__6345 = cljs.core.next.call(null, s__$1);
      h = G__6344;
      s__$1 = G__6345;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var seq__6352_6358 = cljs.core.seq.call(null, fn_map);
  var chunk__6353_6359 = null;
  var count__6354_6360 = 0;
  var i__6355_6361 = 0;
  while(true) {
    if(i__6355_6361 < count__6354_6360) {
      var vec__6356_6362 = cljs.core._nth.call(null, chunk__6353_6359, i__6355_6361);
      var key_name_6363 = cljs.core.nth.call(null, vec__6356_6362, 0, null);
      var f_6364 = cljs.core.nth.call(null, vec__6356_6362, 1, null);
      var str_name_6365 = cljs.core.name.call(null, key_name_6363);
      obj[str_name_6365] = f_6364;
      var G__6366 = seq__6352_6358;
      var G__6367 = chunk__6353_6359;
      var G__6368 = count__6354_6360;
      var G__6369 = i__6355_6361 + 1;
      seq__6352_6358 = G__6366;
      chunk__6353_6359 = G__6367;
      count__6354_6360 = G__6368;
      i__6355_6361 = G__6369;
      continue
    }else {
      var temp__4092__auto___6370 = cljs.core.seq.call(null, seq__6352_6358);
      if(temp__4092__auto___6370) {
        var seq__6352_6371__$1 = temp__4092__auto___6370;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__6352_6371__$1)) {
          var c__3844__auto___6372 = cljs.core.chunk_first.call(null, seq__6352_6371__$1);
          var G__6373 = cljs.core.chunk_rest.call(null, seq__6352_6371__$1);
          var G__6374 = c__3844__auto___6372;
          var G__6375 = cljs.core.count.call(null, c__3844__auto___6372);
          var G__6376 = 0;
          seq__6352_6358 = G__6373;
          chunk__6353_6359 = G__6374;
          count__6354_6360 = G__6375;
          i__6355_6361 = G__6376;
          continue
        }else {
          var vec__6357_6377 = cljs.core.first.call(null, seq__6352_6371__$1);
          var key_name_6378 = cljs.core.nth.call(null, vec__6357_6377, 0, null);
          var f_6379 = cljs.core.nth.call(null, vec__6357_6377, 1, null);
          var str_name_6380 = cljs.core.name.call(null, key_name_6378);
          obj[str_name_6380] = f_6379;
          var G__6381 = cljs.core.next.call(null, seq__6352_6371__$1);
          var G__6382 = null;
          var G__6383 = 0;
          var G__6384 = 0;
          seq__6352_6358 = G__6381;
          chunk__6353_6359 = G__6382;
          count__6354_6360 = G__6383;
          i__6355_6361 = G__6384;
          continue
        }
      }else {
      }
    }
    break
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65937646
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorStr = "cljs.core/List";
cljs.core.List.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.count === 1) {
    return null
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.List(self__.meta, o, coll__$1, self__.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.List.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, coll__$1)
};
cljs.core.List.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, start, coll__$1)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return coll__$1
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._rest.call(null, coll__$1)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.List(meta__$1, self__.first, self__.rest, self__.count, self__.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.List.EMPTY
};
cljs.core.__GT_List = function __GT_List(meta, first, rest, count, __hash) {
  return new cljs.core.List(meta, first, rest, count, __hash)
};
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65937614
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorStr = "cljs.core/EmptyList";
cljs.core.EmptyList.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.List(self__.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, coll__$1)
};
cljs.core.EmptyList.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, start, coll__$1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.EmptyList(meta__$1)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return coll__$1
};
cljs.core.__GT_EmptyList = function __GT_EmptyList(meta) {
  return new cljs.core.EmptyList(meta)
};
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__6386 = coll;
  if(G__6386) {
    var bit__3746__auto__ = G__6386.cljs$lang$protocol_mask$partition0$ & 134217728;
    if(bit__3746__auto__ || G__6386.cljs$core$IReversible$) {
      return true
    }else {
      if(!G__6386.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IReversible, G__6386)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IReversible, G__6386)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list__delegate = function(xs) {
    var arr = xs instanceof cljs.core.IndexedSeq ? xs.arr : function() {
      var arr = [];
      var xs__$1 = xs;
      while(true) {
        if(!(xs__$1 == null)) {
          arr.push(cljs.core._first.call(null, xs__$1));
          var G__6387 = cljs.core._next.call(null, xs__$1);
          xs__$1 = G__6387;
          continue
        }else {
          return arr
        }
        break
      }
    }();
    var i = arr.length;
    var r = cljs.core.List.EMPTY;
    while(true) {
      if(i > 0) {
        var G__6388 = i - 1;
        var G__6389 = cljs.core._conj.call(null, r, arr[i - 1]);
        i = G__6388;
        r = G__6389;
        continue
      }else {
        return r
      }
      break
    }
  };
  var list = function(var_args) {
    var xs = null;
    if(arguments.length > 0) {
      xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, xs)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__6390) {
    var xs = cljs.core.seq(arglist__6390);
    return list__delegate(xs)
  };
  list.cljs$core$IFn$_invoke$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65929452
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorStr = "cljs.core/Cons";
cljs.core.Cons.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.rest == null) {
    return null
  }else {
    return cljs.core.seq.call(null, self__.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.Cons(null, o, coll__$1, self__.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, coll__$1)
};
cljs.core.Cons.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, start, coll__$1)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return coll__$1
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.Cons(meta__$1, self__.first, self__.rest, self__.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_Cons = function __GT_Cons(meta, first, rest, __hash) {
  return new cljs.core.Cons(meta, first, rest, __hash)
};
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3128__auto__ = coll == null;
    if(or__3128__auto__) {
      return or__3128__auto__
    }else {
      var G__6394 = coll;
      if(G__6394) {
        var bit__3739__auto__ = G__6394.cljs$lang$protocol_mask$partition0$ & 64;
        if(bit__3739__auto__ || G__6394.cljs$core$ISeq$) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__6396 = x;
  if(G__6396) {
    var bit__3746__auto__ = G__6396.cljs$lang$protocol_mask$partition0$ & 33554432;
    if(bit__3746__auto__ || G__6396.cljs$core$IList$) {
      return true
    }else {
      if(!G__6396.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IList, G__6396)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IList, G__6396)
  }
};
cljs.core.Keyword = function(ns, name, fqn, _hash) {
  this.ns = ns;
  this.name = name;
  this.fqn = fqn;
  this._hash = _hash;
  this.cljs$lang$protocol_mask$partition0$ = 2153775105;
  this.cljs$lang$protocol_mask$partition1$ = 4096
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorStr = "cljs.core/Keyword";
cljs.core.Keyword.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(o, writer, _) {
  var self__ = this;
  var o__$1 = this;
  return cljs.core._write.call(null, writer, [cljs.core.str(":"), cljs.core.str(self__.fqn)].join(""))
};
cljs.core.Keyword.prototype.cljs$core$INamed$_name$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return self__.name
};
cljs.core.Keyword.prototype.cljs$core$INamed$_namespace$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return self__.ns
};
cljs.core.Keyword.prototype.cljs$core$IHash$_hash$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  if(self__._hash == null) {
    self__._hash = cljs.core.hash_combine.call(null, cljs.core.hash.call(null, self__.ns), cljs.core.hash.call(null, self__.name)) + 2654435769;
    return self__._hash
  }else {
    return self__._hash
  }
};
cljs.core.Keyword.prototype.call = function() {
  var G__6398 = null;
  var G__6398__2 = function(self__, coll) {
    var self__ = this;
    var self____$1 = this;
    var kw = self____$1;
    return cljs.core.get.call(null, coll, kw)
  };
  var G__6398__3 = function(self__, coll, not_found) {
    var self__ = this;
    var self____$1 = this;
    var kw = self____$1;
    return cljs.core.get.call(null, coll, kw, not_found)
  };
  G__6398 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6398__2.call(this, self__, coll);
      case 3:
        return G__6398__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6398
}();
cljs.core.Keyword.prototype.apply = function(self__, args6397) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6397.slice()))
};
cljs.core.Keyword.prototype.cljs$core$IFn$_invoke$arity$1 = function(coll) {
  var self__ = this;
  var kw = this;
  return cljs.core.get.call(null, coll, kw)
};
cljs.core.Keyword.prototype.cljs$core$IFn$_invoke$arity$2 = function(coll, not_found) {
  var self__ = this;
  var kw = this;
  return cljs.core.get.call(null, coll, kw, not_found)
};
cljs.core.Keyword.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  var ___$1 = this;
  if(other instanceof cljs.core.Keyword) {
    return self__.fqn === other.fqn
  }else {
    return false
  }
};
cljs.core.Keyword.prototype.toString = function() {
  var self__ = this;
  var _ = this;
  return[cljs.core.str(":"), cljs.core.str(self__.fqn)].join("")
};
cljs.core.__GT_Keyword = function __GT_Keyword(ns, name, fqn, _hash) {
  return new cljs.core.Keyword(ns, name, fqn, _hash)
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  return x instanceof cljs.core.Keyword
};
cljs.core.keyword_identical_QMARK_ = function keyword_identical_QMARK_(x, y) {
  if(x === y) {
    return true
  }else {
    if(x instanceof cljs.core.Keyword && y instanceof cljs.core.Keyword) {
      return x.fqn === y.fqn
    }else {
      return false
    }
  }
};
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(name instanceof cljs.core.Keyword) {
      return name
    }else {
      if(name instanceof cljs.core.Symbol) {
        return new cljs.core.Keyword(null, cljs.core.name.call(null, name), cljs.core.name.call(null, name), null)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return new cljs.core.Keyword(null, name, name, null)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return new cljs.core.Keyword(ns, name, [cljs.core.str(cljs.core.truth_(ns) ? [cljs.core.str(ns), cljs.core.str("/")].join("") : null), cljs.core.str(name)].join(""), null)
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  keyword.cljs$core$IFn$_invoke$arity$1 = keyword__1;
  keyword.cljs$core$IFn$_invoke$arity$2 = keyword__2;
  return keyword
}();
cljs.core.LazySeq = function(meta, fn, s, __hash) {
  this.meta = meta;
  this.fn = fn;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374988
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorStr = "cljs.core/LazySeq";
cljs.core.LazySeq.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  cljs.core._seq.call(null, coll__$1);
  if(self__.s == null) {
    return null
  }else {
    return cljs.core.next.call(null, self__.s)
  }
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.cons.call(null, o, coll__$1)
};
cljs.core.LazySeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.LazySeq.prototype.sval = function() {
  var self__ = this;
  var coll = this;
  if(self__.fn == null) {
    return self__.s
  }else {
    self__.s = self__.fn.call(null);
    self__.fn = null;
    return self__.s
  }
};
cljs.core.LazySeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, coll__$1)
};
cljs.core.LazySeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, start, coll__$1)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  coll__$1.sval();
  if(self__.s == null) {
    return null
  }else {
    var ls = self__.s;
    while(true) {
      if(ls instanceof cljs.core.LazySeq) {
        var G__6399 = ls.sval();
        ls = G__6399;
        continue
      }else {
        self__.s = ls;
        return cljs.core.seq.call(null, self__.s)
      }
      break
    }
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  cljs.core._seq.call(null, coll__$1);
  if(self__.s == null) {
    return null
  }else {
    return cljs.core.first.call(null, self__.s)
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  cljs.core._seq.call(null, coll__$1);
  if(!(self__.s == null)) {
    return cljs.core.rest.call(null, self__.s)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.LazySeq(meta__$1, self__.fn, self__.s, self__.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_LazySeq = function __GT_LazySeq(meta, fn, s, __hash) {
  return new cljs.core.LazySeq(meta, fn, s, __hash)
};
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorStr = "cljs.core/ChunkBuffer";
cljs.core.ChunkBuffer.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return self__.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var self__ = this;
  var _ = this;
  self__.buf[self__.end] = o;
  return self__.end = self__.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var self__ = this;
  var _ = this;
  var ret = new cljs.core.ArrayChunk(self__.buf, 0, self__.end);
  self__.buf = null;
  return ret
};
cljs.core.__GT_ChunkBuffer = function __GT_ChunkBuffer(buf, end) {
  return new cljs.core.ChunkBuffer(buf, end)
};
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(new Array(capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorStr = "cljs.core/ArrayChunk";
cljs.core.ArrayChunk.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, self__.arr[self__.off], self__.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, start, self__.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.off === self__.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(self__.arr, self__.off + 1, self__.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var self__ = this;
  var coll__$1 = this;
  return self__.arr[self__.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var self__ = this;
  var coll__$1 = this;
  if(i >= 0 && i < self__.end - self__.off) {
    return self__.arr[self__.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return self__.end - self__.off
};
cljs.core.__GT_ArrayChunk = function __GT_ArrayChunk(arr, off, end) {
  return new cljs.core.ArrayChunk(arr, off, end)
};
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return new cljs.core.ArrayChunk(arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return new cljs.core.ArrayChunk(arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_chunk.cljs$core$IFn$_invoke$arity$1 = array_chunk__1;
  array_chunk.cljs$core$IFn$_invoke$arity$2 = array_chunk__2;
  array_chunk.cljs$core$IFn$_invoke$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta, __hash) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31850732;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorStr = "cljs.core/ChunkedCons";
cljs.core.ChunkedCons.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(cljs.core._count.call(null, self__.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, self__.chunk), self__.more, self__.meta, null)
  }else {
    var more__$1 = cljs.core._seq.call(null, self__.more);
    if(more__$1 == null) {
      return null
    }else {
      return more__$1
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var self__ = this;
  var this$__$1 = this;
  return cljs.core.cons.call(null, o, this$__$1)
};
cljs.core.ChunkedCons.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return coll__$1
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._nth.call(null, self__.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(cljs.core._count.call(null, self__.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, self__.chunk), self__.more, self__.meta, null)
  }else {
    if(self__.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return self__.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.more == null) {
    return null
  }else {
    return self__.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.ChunkedCons(self__.chunk, self__.more, m, self__.__hash)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.more
  }
};
cljs.core.__GT_ChunkedCons = function __GT_ChunkedCons(chunk, more, meta, __hash) {
  return new cljs.core.ChunkedCons(chunk, more, meta, __hash)
};
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__6401 = s;
    if(G__6401) {
      var bit__3739__auto__ = G__6401.cljs$lang$protocol_mask$partition1$ & 1024;
      if(bit__3739__auto__ || G__6401.cljs$core$IChunkedNext$) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary = [];
  var s__$1 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__$1)) {
      ary.push(cljs.core.first.call(null, s__$1));
      var G__6402 = cljs.core.next.call(null, s__$1);
      s__$1 = G__6402;
      continue
    }else {
      return ary
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret = new Array(cljs.core.count.call(null, coll));
  var i_6403 = 0;
  var xs_6404 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs_6404) {
      ret[i_6403] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs_6404));
      var G__6405 = i_6403 + 1;
      var G__6406 = cljs.core.next.call(null, xs_6404);
      i_6403 = G__6405;
      xs_6404 = G__6406;
      continue
    }else {
    }
    break
  }
  return ret
};
cljs.core.int_array = function() {
  var int_array = null;
  var int_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return int_array.call(null, size_or_seq, null)
    }else {
      return cljs.core.into_array.call(null, size_or_seq)
    }
  };
  var int_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(s__$1 && i < size) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__6407 = i + 1;
          var G__6408 = cljs.core.next.call(null, s__$1);
          i = G__6407;
          s__$1 = G__6408;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3891__auto___6409 = size;
      var i_6410 = 0;
      while(true) {
        if(i_6410 < n__3891__auto___6409) {
          a[i_6410] = init_val_or_seq;
          var G__6411 = i_6410 + 1;
          i_6410 = G__6411;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  int_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return int_array__1.call(this, size);
      case 2:
        return int_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  int_array.cljs$core$IFn$_invoke$arity$1 = int_array__1;
  int_array.cljs$core$IFn$_invoke$arity$2 = int_array__2;
  return int_array
}();
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return long_array.call(null, size_or_seq, null)
    }else {
      return cljs.core.into_array.call(null, size_or_seq)
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(s__$1 && i < size) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__6412 = i + 1;
          var G__6413 = cljs.core.next.call(null, s__$1);
          i = G__6412;
          s__$1 = G__6413;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3891__auto___6414 = size;
      var i_6415 = 0;
      while(true) {
        if(i_6415 < n__3891__auto___6414) {
          a[i_6415] = init_val_or_seq;
          var G__6416 = i_6415 + 1;
          i_6415 = G__6416;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  long_array.cljs$core$IFn$_invoke$arity$1 = long_array__1;
  long_array.cljs$core$IFn$_invoke$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return double_array.call(null, size_or_seq, null)
    }else {
      return cljs.core.into_array.call(null, size_or_seq)
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(s__$1 && i < size) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__6417 = i + 1;
          var G__6418 = cljs.core.next.call(null, s__$1);
          i = G__6417;
          s__$1 = G__6418;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3891__auto___6419 = size;
      var i_6420 = 0;
      while(true) {
        if(i_6420 < n__3891__auto___6419) {
          a[i_6420] = init_val_or_seq;
          var G__6421 = i_6420 + 1;
          i_6420 = G__6421;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  double_array.cljs$core$IFn$_invoke$arity$1 = double_array__1;
  double_array.cljs$core$IFn$_invoke$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return object_array.call(null, size_or_seq, null)
    }else {
      return cljs.core.into_array.call(null, size_or_seq)
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(s__$1 && i < size) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__6422 = i + 1;
          var G__6423 = cljs.core.next.call(null, s__$1);
          i = G__6422;
          s__$1 = G__6423;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3891__auto___6424 = size;
      var i_6425 = 0;
      while(true) {
        if(i_6425 < n__3891__auto___6424) {
          a[i_6425] = init_val_or_seq;
          var G__6426 = i_6425 + 1;
          i_6425 = G__6426;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  object_array.cljs$core$IFn$_invoke$arity$1 = object_array__1;
  object_array.cljs$core$IFn$_invoke$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__$1 = s;
    var i = n;
    var sum = 0;
    while(true) {
      if(i > 0 && cljs.core.seq.call(null, s__$1)) {
        var G__6427 = cljs.core.next.call(null, s__$1);
        var G__6428 = i - 1;
        var G__6429 = sum + 1;
        s__$1 = G__6427;
        i = G__6428;
        sum = G__6429;
        continue
      }else {
        return sum
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, function() {
      return null
    }, null, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, function() {
      return x
    }, null, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, function() {
      var s = cljs.core.seq.call(null, x);
      if(s) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s), concat.call(null, cljs.core.chunk_rest.call(null, s), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s), concat.call(null, cljs.core.rest.call(null, s), y))
        }
      }else {
        return y
      }
    }, null, null)
  };
  var concat__3 = function() {
    var G__6430__delegate = function(x, y, zs) {
      var cat = function cat(xys, zs__$1) {
        return new cljs.core.LazySeq(null, function() {
          var xys__$1 = cljs.core.seq.call(null, xys);
          if(xys__$1) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__$1)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__$1), cat.call(null, cljs.core.chunk_rest.call(null, xys__$1), zs__$1))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__$1), cat.call(null, cljs.core.rest.call(null, xys__$1), zs__$1))
            }
          }else {
            if(cljs.core.truth_(zs__$1)) {
              return cat.call(null, cljs.core.first.call(null, zs__$1), cljs.core.next.call(null, zs__$1))
            }else {
              return null
            }
          }
        }, null, null)
      };
      return cat.call(null, concat.call(null, x, y), zs)
    };
    var G__6430 = function(x, y, var_args) {
      var zs = null;
      if(arguments.length > 2) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6430__delegate.call(this, x, y, zs)
    };
    G__6430.cljs$lang$maxFixedArity = 2;
    G__6430.cljs$lang$applyTo = function(arglist__6431) {
      var x = cljs.core.first(arglist__6431);
      arglist__6431 = cljs.core.next(arglist__6431);
      var y = cljs.core.first(arglist__6431);
      var zs = cljs.core.rest(arglist__6431);
      return G__6430__delegate(x, y, zs)
    };
    G__6430.cljs$core$IFn$_invoke$arity$variadic = G__6430__delegate;
    return G__6430
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$core$IFn$_invoke$arity$0 = concat__0;
  concat.cljs$core$IFn$_invoke$arity$1 = concat__1;
  concat.cljs$core$IFn$_invoke$arity$2 = concat__2;
  concat.cljs$core$IFn$_invoke$arity$variadic = concat__3.cljs$core$IFn$_invoke$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__6432__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__6432 = function(a, b, c, d, var_args) {
      var more = null;
      if(arguments.length > 4) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6432__delegate.call(this, a, b, c, d, more)
    };
    G__6432.cljs$lang$maxFixedArity = 4;
    G__6432.cljs$lang$applyTo = function(arglist__6433) {
      var a = cljs.core.first(arglist__6433);
      arglist__6433 = cljs.core.next(arglist__6433);
      var b = cljs.core.first(arglist__6433);
      arglist__6433 = cljs.core.next(arglist__6433);
      var c = cljs.core.first(arglist__6433);
      arglist__6433 = cljs.core.next(arglist__6433);
      var d = cljs.core.first(arglist__6433);
      var more = cljs.core.rest(arglist__6433);
      return G__6432__delegate(a, b, c, d, more)
    };
    G__6432.cljs$core$IFn$_invoke$arity$variadic = G__6432__delegate;
    return G__6432
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$core$IFn$_invoke$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$core$IFn$_invoke$arity$1 = list_STAR___1;
  list_STAR_.cljs$core$IFn$_invoke$arity$2 = list_STAR___2;
  list_STAR_.cljs$core$IFn$_invoke$arity$3 = list_STAR___3;
  list_STAR_.cljs$core$IFn$_invoke$arity$4 = list_STAR___4;
  list_STAR_.cljs$core$IFn$_invoke$arity$variadic = list_STAR___5.cljs$core$IFn$_invoke$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__$1 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a = cljs.core._first.call(null, args__$1);
    var args__$2 = cljs.core._rest.call(null, args__$1);
    if(argc === 1) {
      if(f.cljs$core$IFn$_invoke$arity$1) {
        return f.cljs$core$IFn$_invoke$arity$1(a)
      }else {
        return f.call(null, a)
      }
    }else {
      var b = cljs.core._first.call(null, args__$2);
      var args__$3 = cljs.core._rest.call(null, args__$2);
      if(argc === 2) {
        if(f.cljs$core$IFn$_invoke$arity$2) {
          return f.cljs$core$IFn$_invoke$arity$2(a, b)
        }else {
          return f.call(null, a, b)
        }
      }else {
        var c = cljs.core._first.call(null, args__$3);
        var args__$4 = cljs.core._rest.call(null, args__$3);
        if(argc === 3) {
          if(f.cljs$core$IFn$_invoke$arity$3) {
            return f.cljs$core$IFn$_invoke$arity$3(a, b, c)
          }else {
            return f.call(null, a, b, c)
          }
        }else {
          var d = cljs.core._first.call(null, args__$4);
          var args__$5 = cljs.core._rest.call(null, args__$4);
          if(argc === 4) {
            if(f.cljs$core$IFn$_invoke$arity$4) {
              return f.cljs$core$IFn$_invoke$arity$4(a, b, c, d)
            }else {
              return f.call(null, a, b, c, d)
            }
          }else {
            var e = cljs.core._first.call(null, args__$5);
            var args__$6 = cljs.core._rest.call(null, args__$5);
            if(argc === 5) {
              if(f.cljs$core$IFn$_invoke$arity$5) {
                return f.cljs$core$IFn$_invoke$arity$5(a, b, c, d, e)
              }else {
                return f.call(null, a, b, c, d, e)
              }
            }else {
              var f__$1 = cljs.core._first.call(null, args__$6);
              var args__$7 = cljs.core._rest.call(null, args__$6);
              if(argc === 6) {
                if(f__$1.cljs$core$IFn$_invoke$arity$6) {
                  return f__$1.cljs$core$IFn$_invoke$arity$6(a, b, c, d, e, f__$1)
                }else {
                  return f__$1.call(null, a, b, c, d, e, f__$1)
                }
              }else {
                var g = cljs.core._first.call(null, args__$7);
                var args__$8 = cljs.core._rest.call(null, args__$7);
                if(argc === 7) {
                  if(f__$1.cljs$core$IFn$_invoke$arity$7) {
                    return f__$1.cljs$core$IFn$_invoke$arity$7(a, b, c, d, e, f__$1, g)
                  }else {
                    return f__$1.call(null, a, b, c, d, e, f__$1, g)
                  }
                }else {
                  var h = cljs.core._first.call(null, args__$8);
                  var args__$9 = cljs.core._rest.call(null, args__$8);
                  if(argc === 8) {
                    if(f__$1.cljs$core$IFn$_invoke$arity$8) {
                      return f__$1.cljs$core$IFn$_invoke$arity$8(a, b, c, d, e, f__$1, g, h)
                    }else {
                      return f__$1.call(null, a, b, c, d, e, f__$1, g, h)
                    }
                  }else {
                    var i = cljs.core._first.call(null, args__$9);
                    var args__$10 = cljs.core._rest.call(null, args__$9);
                    if(argc === 9) {
                      if(f__$1.cljs$core$IFn$_invoke$arity$9) {
                        return f__$1.cljs$core$IFn$_invoke$arity$9(a, b, c, d, e, f__$1, g, h, i)
                      }else {
                        return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i)
                      }
                    }else {
                      var j = cljs.core._first.call(null, args__$10);
                      var args__$11 = cljs.core._rest.call(null, args__$10);
                      if(argc === 10) {
                        if(f__$1.cljs$core$IFn$_invoke$arity$10) {
                          return f__$1.cljs$core$IFn$_invoke$arity$10(a, b, c, d, e, f__$1, g, h, i, j)
                        }else {
                          return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j)
                        }
                      }else {
                        var k = cljs.core._first.call(null, args__$11);
                        var args__$12 = cljs.core._rest.call(null, args__$11);
                        if(argc === 11) {
                          if(f__$1.cljs$core$IFn$_invoke$arity$11) {
                            return f__$1.cljs$core$IFn$_invoke$arity$11(a, b, c, d, e, f__$1, g, h, i, j, k)
                          }else {
                            return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k)
                          }
                        }else {
                          var l = cljs.core._first.call(null, args__$12);
                          var args__$13 = cljs.core._rest.call(null, args__$12);
                          if(argc === 12) {
                            if(f__$1.cljs$core$IFn$_invoke$arity$12) {
                              return f__$1.cljs$core$IFn$_invoke$arity$12(a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }else {
                              return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }
                          }else {
                            var m = cljs.core._first.call(null, args__$13);
                            var args__$14 = cljs.core._rest.call(null, args__$13);
                            if(argc === 13) {
                              if(f__$1.cljs$core$IFn$_invoke$arity$13) {
                                return f__$1.cljs$core$IFn$_invoke$arity$13(a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }else {
                                return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }
                            }else {
                              var n = cljs.core._first.call(null, args__$14);
                              var args__$15 = cljs.core._rest.call(null, args__$14);
                              if(argc === 14) {
                                if(f__$1.cljs$core$IFn$_invoke$arity$14) {
                                  return f__$1.cljs$core$IFn$_invoke$arity$14(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }else {
                                  return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }
                              }else {
                                var o = cljs.core._first.call(null, args__$15);
                                var args__$16 = cljs.core._rest.call(null, args__$15);
                                if(argc === 15) {
                                  if(f__$1.cljs$core$IFn$_invoke$arity$15) {
                                    return f__$1.cljs$core$IFn$_invoke$arity$15(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }else {
                                    return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }
                                }else {
                                  var p = cljs.core._first.call(null, args__$16);
                                  var args__$17 = cljs.core._rest.call(null, args__$16);
                                  if(argc === 16) {
                                    if(f__$1.cljs$core$IFn$_invoke$arity$16) {
                                      return f__$1.cljs$core$IFn$_invoke$arity$16(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }else {
                                      return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }
                                  }else {
                                    var q = cljs.core._first.call(null, args__$17);
                                    var args__$18 = cljs.core._rest.call(null, args__$17);
                                    if(argc === 17) {
                                      if(f__$1.cljs$core$IFn$_invoke$arity$17) {
                                        return f__$1.cljs$core$IFn$_invoke$arity$17(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }else {
                                        return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }
                                    }else {
                                      var r = cljs.core._first.call(null, args__$18);
                                      var args__$19 = cljs.core._rest.call(null, args__$18);
                                      if(argc === 18) {
                                        if(f__$1.cljs$core$IFn$_invoke$arity$18) {
                                          return f__$1.cljs$core$IFn$_invoke$arity$18(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }else {
                                          return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }
                                      }else {
                                        var s = cljs.core._first.call(null, args__$19);
                                        var args__$20 = cljs.core._rest.call(null, args__$19);
                                        if(argc === 19) {
                                          if(f__$1.cljs$core$IFn$_invoke$arity$19) {
                                            return f__$1.cljs$core$IFn$_invoke$arity$19(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }else {
                                            return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }
                                        }else {
                                          var t = cljs.core._first.call(null, args__$20);
                                          var args__$21 = cljs.core._rest.call(null, args__$20);
                                          if(argc === 20) {
                                            if(f__$1.cljs$core$IFn$_invoke$arity$20) {
                                              return f__$1.cljs$core$IFn$_invoke$arity$20(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }else {
                                              return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, args, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__6 = function() {
    var G__6434__delegate = function(f, a, b, c, d, args) {
      var arglist = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity = f.cljs$lang$maxFixedArity;
      if(f.cljs$lang$applyTo) {
        var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
        if(bc <= fixed_arity) {
          return cljs.core.apply_to.call(null, f, bc, arglist)
        }else {
          return f.cljs$lang$applyTo(arglist)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist))
      }
    };
    var G__6434 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(arguments.length > 5) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6434__delegate.call(this, f, a, b, c, d, args)
    };
    G__6434.cljs$lang$maxFixedArity = 5;
    G__6434.cljs$lang$applyTo = function(arglist__6435) {
      var f = cljs.core.first(arglist__6435);
      arglist__6435 = cljs.core.next(arglist__6435);
      var a = cljs.core.first(arglist__6435);
      arglist__6435 = cljs.core.next(arglist__6435);
      var b = cljs.core.first(arglist__6435);
      arglist__6435 = cljs.core.next(arglist__6435);
      var c = cljs.core.first(arglist__6435);
      arglist__6435 = cljs.core.next(arglist__6435);
      var d = cljs.core.first(arglist__6435);
      var args = cljs.core.rest(arglist__6435);
      return G__6434__delegate(f, a, b, c, d, args)
    };
    G__6434.cljs$core$IFn$_invoke$arity$variadic = G__6434__delegate;
    return G__6434
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$core$IFn$_invoke$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$core$IFn$_invoke$arity$2 = apply__2;
  apply.cljs$core$IFn$_invoke$arity$3 = apply__3;
  apply.cljs$core$IFn$_invoke$arity$4 = apply__4;
  apply.cljs$core$IFn$_invoke$arity$5 = apply__5;
  apply.cljs$core$IFn$_invoke$arity$variadic = apply__6.cljs$core$IFn$_invoke$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(arguments.length > 2) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__6436) {
    var obj = cljs.core.first(arglist__6436);
    arglist__6436 = cljs.core.next(arglist__6436);
    var f = cljs.core.first(arglist__6436);
    var args = cljs.core.rest(arglist__6436);
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$core$IFn$_invoke$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__6437__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__6437 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6437__delegate.call(this, x, y, more)
    };
    G__6437.cljs$lang$maxFixedArity = 2;
    G__6437.cljs$lang$applyTo = function(arglist__6438) {
      var x = cljs.core.first(arglist__6438);
      arglist__6438 = cljs.core.next(arglist__6438);
      var y = cljs.core.first(arglist__6438);
      var more = cljs.core.rest(arglist__6438);
      return G__6437__delegate(x, y, more)
    };
    G__6437.cljs$core$IFn$_invoke$arity$variadic = G__6437__delegate;
    return G__6437
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$core$IFn$_invoke$arity$1 = not_EQ___1;
  not_EQ_.cljs$core$IFn$_invoke$arity$2 = not_EQ___2;
  not_EQ_.cljs$core$IFn$_invoke$arity$variadic = not_EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__6439 = pred;
        var G__6440 = cljs.core.next.call(null, coll);
        pred = G__6439;
        coll = G__6440;
        continue
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3128__auto__ = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3128__auto__)) {
        return or__3128__auto__
      }else {
        var G__6441 = pred;
        var G__6442 = cljs.core.next.call(null, coll);
        pred = G__6441;
        coll = G__6442;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__6443 = null;
    var G__6443__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__6443__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__6443__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__6443__3 = function() {
      var G__6444__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__6444 = function(x, y, var_args) {
        var zs = null;
        if(arguments.length > 2) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__6444__delegate.call(this, x, y, zs)
      };
      G__6444.cljs$lang$maxFixedArity = 2;
      G__6444.cljs$lang$applyTo = function(arglist__6445) {
        var x = cljs.core.first(arglist__6445);
        arglist__6445 = cljs.core.next(arglist__6445);
        var y = cljs.core.first(arglist__6445);
        var zs = cljs.core.rest(arglist__6445);
        return G__6444__delegate(x, y, zs)
      };
      G__6444.cljs$core$IFn$_invoke$arity$variadic = G__6444__delegate;
      return G__6444
    }();
    G__6443 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__6443__0.call(this);
        case 1:
          return G__6443__1.call(this, x);
        case 2:
          return G__6443__2.call(this, x, y);
        default:
          return G__6443__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw new Error("Invalid arity: " + arguments.length);
    };
    G__6443.cljs$lang$maxFixedArity = 2;
    G__6443.cljs$lang$applyTo = G__6443__3.cljs$lang$applyTo;
    return G__6443
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__6446__delegate = function(args) {
      return x
    };
    var G__6446 = function(var_args) {
      var args = null;
      if(arguments.length > 0) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6446__delegate.call(this, args)
    };
    G__6446.cljs$lang$maxFixedArity = 0;
    G__6446.cljs$lang$applyTo = function(arglist__6447) {
      var args = cljs.core.seq(arglist__6447);
      return G__6446__delegate(args)
    };
    G__6446.cljs$core$IFn$_invoke$arity$variadic = G__6446__delegate;
    return G__6446
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__6448 = null;
      var G__6448__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__6448__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__6448__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__6448__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__6448__4 = function() {
        var G__6449__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6449 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6449__delegate.call(this, x, y, z, args)
        };
        G__6449.cljs$lang$maxFixedArity = 3;
        G__6449.cljs$lang$applyTo = function(arglist__6450) {
          var x = cljs.core.first(arglist__6450);
          arglist__6450 = cljs.core.next(arglist__6450);
          var y = cljs.core.first(arglist__6450);
          arglist__6450 = cljs.core.next(arglist__6450);
          var z = cljs.core.first(arglist__6450);
          var args = cljs.core.rest(arglist__6450);
          return G__6449__delegate(x, y, z, args)
        };
        G__6449.cljs$core$IFn$_invoke$arity$variadic = G__6449__delegate;
        return G__6449
      }();
      G__6448 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6448__0.call(this);
          case 1:
            return G__6448__1.call(this, x);
          case 2:
            return G__6448__2.call(this, x, y);
          case 3:
            return G__6448__3.call(this, x, y, z);
          default:
            return G__6448__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6448.cljs$lang$maxFixedArity = 3;
      G__6448.cljs$lang$applyTo = G__6448__4.cljs$lang$applyTo;
      return G__6448
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__6451 = null;
      var G__6451__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__6451__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__6451__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__6451__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__6451__4 = function() {
        var G__6452__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__6452 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6452__delegate.call(this, x, y, z, args)
        };
        G__6452.cljs$lang$maxFixedArity = 3;
        G__6452.cljs$lang$applyTo = function(arglist__6453) {
          var x = cljs.core.first(arglist__6453);
          arglist__6453 = cljs.core.next(arglist__6453);
          var y = cljs.core.first(arglist__6453);
          arglist__6453 = cljs.core.next(arglist__6453);
          var z = cljs.core.first(arglist__6453);
          var args = cljs.core.rest(arglist__6453);
          return G__6452__delegate(x, y, z, args)
        };
        G__6452.cljs$core$IFn$_invoke$arity$variadic = G__6452__delegate;
        return G__6452
      }();
      G__6451 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6451__0.call(this);
          case 1:
            return G__6451__1.call(this, x);
          case 2:
            return G__6451__2.call(this, x, y);
          case 3:
            return G__6451__3.call(this, x, y, z);
          default:
            return G__6451__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6451.cljs$lang$maxFixedArity = 3;
      G__6451.cljs$lang$applyTo = G__6451__4.cljs$lang$applyTo;
      return G__6451
    }()
  };
  var comp__4 = function() {
    var G__6454__delegate = function(f1, f2, f3, fs) {
      var fs__$1 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__6455__delegate = function(args) {
          var ret = cljs.core.apply.call(null, cljs.core.first.call(null, fs__$1), args);
          var fs__$2 = cljs.core.next.call(null, fs__$1);
          while(true) {
            if(fs__$2) {
              var G__6456 = cljs.core.first.call(null, fs__$2).call(null, ret);
              var G__6457 = cljs.core.next.call(null, fs__$2);
              ret = G__6456;
              fs__$2 = G__6457;
              continue
            }else {
              return ret
            }
            break
          }
        };
        var G__6455 = function(var_args) {
          var args = null;
          if(arguments.length > 0) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__6455__delegate.call(this, args)
        };
        G__6455.cljs$lang$maxFixedArity = 0;
        G__6455.cljs$lang$applyTo = function(arglist__6458) {
          var args = cljs.core.seq(arglist__6458);
          return G__6455__delegate(args)
        };
        G__6455.cljs$core$IFn$_invoke$arity$variadic = G__6455__delegate;
        return G__6455
      }()
    };
    var G__6454 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(arguments.length > 3) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6454__delegate.call(this, f1, f2, f3, fs)
    };
    G__6454.cljs$lang$maxFixedArity = 3;
    G__6454.cljs$lang$applyTo = function(arglist__6459) {
      var f1 = cljs.core.first(arglist__6459);
      arglist__6459 = cljs.core.next(arglist__6459);
      var f2 = cljs.core.first(arglist__6459);
      arglist__6459 = cljs.core.next(arglist__6459);
      var f3 = cljs.core.first(arglist__6459);
      var fs = cljs.core.rest(arglist__6459);
      return G__6454__delegate(f1, f2, f3, fs)
    };
    G__6454.cljs$core$IFn$_invoke$arity$variadic = G__6454__delegate;
    return G__6454
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$core$IFn$_invoke$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$core$IFn$_invoke$arity$0 = comp__0;
  comp.cljs$core$IFn$_invoke$arity$1 = comp__1;
  comp.cljs$core$IFn$_invoke$arity$2 = comp__2;
  comp.cljs$core$IFn$_invoke$arity$3 = comp__3;
  comp.cljs$core$IFn$_invoke$arity$variadic = comp__4.cljs$core$IFn$_invoke$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__1 = function(f) {
    return f
  };
  var partial__2 = function(f, arg1) {
    return function() {
      var G__6460__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__6460 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__6460__delegate.call(this, args)
      };
      G__6460.cljs$lang$maxFixedArity = 0;
      G__6460.cljs$lang$applyTo = function(arglist__6461) {
        var args = cljs.core.seq(arglist__6461);
        return G__6460__delegate(args)
      };
      G__6460.cljs$core$IFn$_invoke$arity$variadic = G__6460__delegate;
      return G__6460
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__6462__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__6462 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__6462__delegate.call(this, args)
      };
      G__6462.cljs$lang$maxFixedArity = 0;
      G__6462.cljs$lang$applyTo = function(arglist__6463) {
        var args = cljs.core.seq(arglist__6463);
        return G__6462__delegate(args)
      };
      G__6462.cljs$core$IFn$_invoke$arity$variadic = G__6462__delegate;
      return G__6462
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__6464__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__6464 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__6464__delegate.call(this, args)
      };
      G__6464.cljs$lang$maxFixedArity = 0;
      G__6464.cljs$lang$applyTo = function(arglist__6465) {
        var args = cljs.core.seq(arglist__6465);
        return G__6464__delegate(args)
      };
      G__6464.cljs$core$IFn$_invoke$arity$variadic = G__6464__delegate;
      return G__6464
    }()
  };
  var partial__5 = function() {
    var G__6466__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__6467__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__6467 = function(var_args) {
          var args = null;
          if(arguments.length > 0) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__6467__delegate.call(this, args)
        };
        G__6467.cljs$lang$maxFixedArity = 0;
        G__6467.cljs$lang$applyTo = function(arglist__6468) {
          var args = cljs.core.seq(arglist__6468);
          return G__6467__delegate(args)
        };
        G__6467.cljs$core$IFn$_invoke$arity$variadic = G__6467__delegate;
        return G__6467
      }()
    };
    var G__6466 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(arguments.length > 4) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6466__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__6466.cljs$lang$maxFixedArity = 4;
    G__6466.cljs$lang$applyTo = function(arglist__6469) {
      var f = cljs.core.first(arglist__6469);
      arglist__6469 = cljs.core.next(arglist__6469);
      var arg1 = cljs.core.first(arglist__6469);
      arglist__6469 = cljs.core.next(arglist__6469);
      var arg2 = cljs.core.first(arglist__6469);
      arglist__6469 = cljs.core.next(arglist__6469);
      var arg3 = cljs.core.first(arglist__6469);
      var more = cljs.core.rest(arglist__6469);
      return G__6466__delegate(f, arg1, arg2, arg3, more)
    };
    G__6466.cljs$core$IFn$_invoke$arity$variadic = G__6466__delegate;
    return G__6466
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return partial__1.call(this, f);
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$core$IFn$_invoke$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$core$IFn$_invoke$arity$1 = partial__1;
  partial.cljs$core$IFn$_invoke$arity$2 = partial__2;
  partial.cljs$core$IFn$_invoke$arity$3 = partial__3;
  partial.cljs$core$IFn$_invoke$arity$4 = partial__4;
  partial.cljs$core$IFn$_invoke$arity$variadic = partial__5.cljs$core$IFn$_invoke$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__6470 = null;
      var G__6470__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__6470__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__6470__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__6470__4 = function() {
        var G__6471__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__6471 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6471__delegate.call(this, a, b, c, ds)
        };
        G__6471.cljs$lang$maxFixedArity = 3;
        G__6471.cljs$lang$applyTo = function(arglist__6472) {
          var a = cljs.core.first(arglist__6472);
          arglist__6472 = cljs.core.next(arglist__6472);
          var b = cljs.core.first(arglist__6472);
          arglist__6472 = cljs.core.next(arglist__6472);
          var c = cljs.core.first(arglist__6472);
          var ds = cljs.core.rest(arglist__6472);
          return G__6471__delegate(a, b, c, ds)
        };
        G__6471.cljs$core$IFn$_invoke$arity$variadic = G__6471__delegate;
        return G__6471
      }();
      G__6470 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__6470__1.call(this, a);
          case 2:
            return G__6470__2.call(this, a, b);
          case 3:
            return G__6470__3.call(this, a, b, c);
          default:
            return G__6470__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6470.cljs$lang$maxFixedArity = 3;
      G__6470.cljs$lang$applyTo = G__6470__4.cljs$lang$applyTo;
      return G__6470
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__6473 = null;
      var G__6473__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__6473__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__6473__4 = function() {
        var G__6474__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__6474 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6474__delegate.call(this, a, b, c, ds)
        };
        G__6474.cljs$lang$maxFixedArity = 3;
        G__6474.cljs$lang$applyTo = function(arglist__6475) {
          var a = cljs.core.first(arglist__6475);
          arglist__6475 = cljs.core.next(arglist__6475);
          var b = cljs.core.first(arglist__6475);
          arglist__6475 = cljs.core.next(arglist__6475);
          var c = cljs.core.first(arglist__6475);
          var ds = cljs.core.rest(arglist__6475);
          return G__6474__delegate(a, b, c, ds)
        };
        G__6474.cljs$core$IFn$_invoke$arity$variadic = G__6474__delegate;
        return G__6474
      }();
      G__6473 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__6473__2.call(this, a, b);
          case 3:
            return G__6473__3.call(this, a, b, c);
          default:
            return G__6473__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6473.cljs$lang$maxFixedArity = 3;
      G__6473.cljs$lang$applyTo = G__6473__4.cljs$lang$applyTo;
      return G__6473
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__6476 = null;
      var G__6476__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__6476__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__6476__4 = function() {
        var G__6477__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__6477 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6477__delegate.call(this, a, b, c, ds)
        };
        G__6477.cljs$lang$maxFixedArity = 3;
        G__6477.cljs$lang$applyTo = function(arglist__6478) {
          var a = cljs.core.first(arglist__6478);
          arglist__6478 = cljs.core.next(arglist__6478);
          var b = cljs.core.first(arglist__6478);
          arglist__6478 = cljs.core.next(arglist__6478);
          var c = cljs.core.first(arglist__6478);
          var ds = cljs.core.rest(arglist__6478);
          return G__6477__delegate(a, b, c, ds)
        };
        G__6477.cljs$core$IFn$_invoke$arity$variadic = G__6477__delegate;
        return G__6477
      }();
      G__6476 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__6476__2.call(this, a, b);
          case 3:
            return G__6476__3.call(this, a, b, c);
          default:
            return G__6476__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6476.cljs$lang$maxFixedArity = 3;
      G__6476.cljs$lang$applyTo = G__6476__4.cljs$lang$applyTo;
      return G__6476
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  fnil.cljs$core$IFn$_invoke$arity$2 = fnil__2;
  fnil.cljs$core$IFn$_invoke$arity$3 = fnil__3;
  fnil.cljs$core$IFn$_invoke$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi = function mapi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll__$1);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__3891__auto___6479 = size;
          var i_6480 = 0;
          while(true) {
            if(i_6480 < n__3891__auto___6479) {
              cljs.core.chunk_append.call(null, b, f.call(null, idx + i_6480, cljs.core._nth.call(null, c, i_6480)));
              var G__6481 = i_6480 + 1;
              i_6480 = G__6481;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), mapi.call(null, idx + size, cljs.core.chunk_rest.call(null, s)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }, null, null)
  };
  return mapi.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
        var c = cljs.core.chunk_first.call(null, s);
        var size = cljs.core.count.call(null, c);
        var b = cljs.core.chunk_buffer.call(null, size);
        var n__3891__auto___6482 = size;
        var i_6483 = 0;
        while(true) {
          if(i_6483 < n__3891__auto___6482) {
            var x_6484 = f.call(null, cljs.core._nth.call(null, c, i_6483));
            if(x_6484 == null) {
            }else {
              cljs.core.chunk_append.call(null, b, x_6484)
            }
            var G__6485 = i_6483 + 1;
            i_6483 = G__6485;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), keep.call(null, f, cljs.core.chunk_rest.call(null, s)))
      }else {
        var x = f.call(null, cljs.core.first.call(null, s));
        if(x == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s))
        }else {
          return cljs.core.cons.call(null, x, keep.call(null, f, cljs.core.rest.call(null, s)))
        }
      }
    }else {
      return null
    }
  }, null, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi = function keepi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll__$1);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__3891__auto___6486 = size;
          var i_6487 = 0;
          while(true) {
            if(i_6487 < n__3891__auto___6486) {
              var x_6488 = f.call(null, idx + i_6487, cljs.core._nth.call(null, c, i_6487));
              if(x_6488 == null) {
              }else {
                cljs.core.chunk_append.call(null, b, x_6488)
              }
              var G__6489 = i_6487 + 1;
              i_6487 = G__6489;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), keepi.call(null, idx + size, cljs.core.chunk_rest.call(null, s)))
        }else {
          var x = f.call(null, idx, cljs.core.first.call(null, s));
          if(x == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s))
          }else {
            return cljs.core.cons.call(null, x, keepi.call(null, idx + 1, cljs.core.rest.call(null, s)))
          }
        }
      }else {
        return null
      }
    }, null, null)
  };
  return keepi.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3119__auto__ = p.call(null, x);
          if(cljs.core.truth_(and__3119__auto__)) {
            return p.call(null, y)
          }else {
            return and__3119__auto__
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3119__auto__ = p.call(null, x);
          if(cljs.core.truth_(and__3119__auto__)) {
            var and__3119__auto____$1 = p.call(null, y);
            if(cljs.core.truth_(and__3119__auto____$1)) {
              return p.call(null, z)
            }else {
              return and__3119__auto____$1
            }
          }else {
            return and__3119__auto__
          }
        }())
      };
      var ep1__4 = function() {
        var G__6496__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3119__auto__ = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3119__auto__)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3119__auto__
            }
          }())
        };
        var G__6496 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6496__delegate.call(this, x, y, z, args)
        };
        G__6496.cljs$lang$maxFixedArity = 3;
        G__6496.cljs$lang$applyTo = function(arglist__6497) {
          var x = cljs.core.first(arglist__6497);
          arglist__6497 = cljs.core.next(arglist__6497);
          var y = cljs.core.first(arglist__6497);
          arglist__6497 = cljs.core.next(arglist__6497);
          var z = cljs.core.first(arglist__6497);
          var args = cljs.core.rest(arglist__6497);
          return G__6496__delegate(x, y, z, args)
        };
        G__6496.cljs$core$IFn$_invoke$arity$variadic = G__6496__delegate;
        return G__6496
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$core$IFn$_invoke$arity$0 = ep1__0;
      ep1.cljs$core$IFn$_invoke$arity$1 = ep1__1;
      ep1.cljs$core$IFn$_invoke$arity$2 = ep1__2;
      ep1.cljs$core$IFn$_invoke$arity$3 = ep1__3;
      ep1.cljs$core$IFn$_invoke$arity$variadic = ep1__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3119__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3119__auto__)) {
            return p2.call(null, x)
          }else {
            return and__3119__auto__
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3119__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3119__auto__)) {
            var and__3119__auto____$1 = p1.call(null, y);
            if(cljs.core.truth_(and__3119__auto____$1)) {
              var and__3119__auto____$2 = p2.call(null, x);
              if(cljs.core.truth_(and__3119__auto____$2)) {
                return p2.call(null, y)
              }else {
                return and__3119__auto____$2
              }
            }else {
              return and__3119__auto____$1
            }
          }else {
            return and__3119__auto__
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3119__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3119__auto__)) {
            var and__3119__auto____$1 = p1.call(null, y);
            if(cljs.core.truth_(and__3119__auto____$1)) {
              var and__3119__auto____$2 = p1.call(null, z);
              if(cljs.core.truth_(and__3119__auto____$2)) {
                var and__3119__auto____$3 = p2.call(null, x);
                if(cljs.core.truth_(and__3119__auto____$3)) {
                  var and__3119__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3119__auto____$4)) {
                    return p2.call(null, z)
                  }else {
                    return and__3119__auto____$4
                  }
                }else {
                  return and__3119__auto____$3
                }
              }else {
                return and__3119__auto____$2
              }
            }else {
              return and__3119__auto____$1
            }
          }else {
            return and__3119__auto__
          }
        }())
      };
      var ep2__4 = function() {
        var G__6498__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3119__auto__ = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3119__auto__)) {
              return cljs.core.every_QMARK_.call(null, function(p1__6490_SHARP_) {
                var and__3119__auto____$1 = p1.call(null, p1__6490_SHARP_);
                if(cljs.core.truth_(and__3119__auto____$1)) {
                  return p2.call(null, p1__6490_SHARP_)
                }else {
                  return and__3119__auto____$1
                }
              }, args)
            }else {
              return and__3119__auto__
            }
          }())
        };
        var G__6498 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6498__delegate.call(this, x, y, z, args)
        };
        G__6498.cljs$lang$maxFixedArity = 3;
        G__6498.cljs$lang$applyTo = function(arglist__6499) {
          var x = cljs.core.first(arglist__6499);
          arglist__6499 = cljs.core.next(arglist__6499);
          var y = cljs.core.first(arglist__6499);
          arglist__6499 = cljs.core.next(arglist__6499);
          var z = cljs.core.first(arglist__6499);
          var args = cljs.core.rest(arglist__6499);
          return G__6498__delegate(x, y, z, args)
        };
        G__6498.cljs$core$IFn$_invoke$arity$variadic = G__6498__delegate;
        return G__6498
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$core$IFn$_invoke$arity$0 = ep2__0;
      ep2.cljs$core$IFn$_invoke$arity$1 = ep2__1;
      ep2.cljs$core$IFn$_invoke$arity$2 = ep2__2;
      ep2.cljs$core$IFn$_invoke$arity$3 = ep2__3;
      ep2.cljs$core$IFn$_invoke$arity$variadic = ep2__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3119__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3119__auto__)) {
            var and__3119__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3119__auto____$1)) {
              return p3.call(null, x)
            }else {
              return and__3119__auto____$1
            }
          }else {
            return and__3119__auto__
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3119__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3119__auto__)) {
            var and__3119__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3119__auto____$1)) {
              var and__3119__auto____$2 = p3.call(null, x);
              if(cljs.core.truth_(and__3119__auto____$2)) {
                var and__3119__auto____$3 = p1.call(null, y);
                if(cljs.core.truth_(and__3119__auto____$3)) {
                  var and__3119__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3119__auto____$4)) {
                    return p3.call(null, y)
                  }else {
                    return and__3119__auto____$4
                  }
                }else {
                  return and__3119__auto____$3
                }
              }else {
                return and__3119__auto____$2
              }
            }else {
              return and__3119__auto____$1
            }
          }else {
            return and__3119__auto__
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3119__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3119__auto__)) {
            var and__3119__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3119__auto____$1)) {
              var and__3119__auto____$2 = p3.call(null, x);
              if(cljs.core.truth_(and__3119__auto____$2)) {
                var and__3119__auto____$3 = p1.call(null, y);
                if(cljs.core.truth_(and__3119__auto____$3)) {
                  var and__3119__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3119__auto____$4)) {
                    var and__3119__auto____$5 = p3.call(null, y);
                    if(cljs.core.truth_(and__3119__auto____$5)) {
                      var and__3119__auto____$6 = p1.call(null, z);
                      if(cljs.core.truth_(and__3119__auto____$6)) {
                        var and__3119__auto____$7 = p2.call(null, z);
                        if(cljs.core.truth_(and__3119__auto____$7)) {
                          return p3.call(null, z)
                        }else {
                          return and__3119__auto____$7
                        }
                      }else {
                        return and__3119__auto____$6
                      }
                    }else {
                      return and__3119__auto____$5
                    }
                  }else {
                    return and__3119__auto____$4
                  }
                }else {
                  return and__3119__auto____$3
                }
              }else {
                return and__3119__auto____$2
              }
            }else {
              return and__3119__auto____$1
            }
          }else {
            return and__3119__auto__
          }
        }())
      };
      var ep3__4 = function() {
        var G__6500__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3119__auto__ = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3119__auto__)) {
              return cljs.core.every_QMARK_.call(null, function(p1__6491_SHARP_) {
                var and__3119__auto____$1 = p1.call(null, p1__6491_SHARP_);
                if(cljs.core.truth_(and__3119__auto____$1)) {
                  var and__3119__auto____$2 = p2.call(null, p1__6491_SHARP_);
                  if(cljs.core.truth_(and__3119__auto____$2)) {
                    return p3.call(null, p1__6491_SHARP_)
                  }else {
                    return and__3119__auto____$2
                  }
                }else {
                  return and__3119__auto____$1
                }
              }, args)
            }else {
              return and__3119__auto__
            }
          }())
        };
        var G__6500 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6500__delegate.call(this, x, y, z, args)
        };
        G__6500.cljs$lang$maxFixedArity = 3;
        G__6500.cljs$lang$applyTo = function(arglist__6501) {
          var x = cljs.core.first(arglist__6501);
          arglist__6501 = cljs.core.next(arglist__6501);
          var y = cljs.core.first(arglist__6501);
          arglist__6501 = cljs.core.next(arglist__6501);
          var z = cljs.core.first(arglist__6501);
          var args = cljs.core.rest(arglist__6501);
          return G__6500__delegate(x, y, z, args)
        };
        G__6500.cljs$core$IFn$_invoke$arity$variadic = G__6500__delegate;
        return G__6500
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$core$IFn$_invoke$arity$0 = ep3__0;
      ep3.cljs$core$IFn$_invoke$arity$1 = ep3__1;
      ep3.cljs$core$IFn$_invoke$arity$2 = ep3__2;
      ep3.cljs$core$IFn$_invoke$arity$3 = ep3__3;
      ep3.cljs$core$IFn$_invoke$arity$variadic = ep3__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__6502__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__6492_SHARP_) {
            return p1__6492_SHARP_.call(null, x)
          }, ps__$1)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__6493_SHARP_) {
            var and__3119__auto__ = p1__6493_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3119__auto__)) {
              return p1__6493_SHARP_.call(null, y)
            }else {
              return and__3119__auto__
            }
          }, ps__$1)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__6494_SHARP_) {
            var and__3119__auto__ = p1__6494_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3119__auto__)) {
              var and__3119__auto____$1 = p1__6494_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3119__auto____$1)) {
                return p1__6494_SHARP_.call(null, z)
              }else {
                return and__3119__auto____$1
              }
            }else {
              return and__3119__auto__
            }
          }, ps__$1)
        };
        var epn__4 = function() {
          var G__6503__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3119__auto__ = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3119__auto__)) {
                return cljs.core.every_QMARK_.call(null, function(p1__6495_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__6495_SHARP_, args)
                }, ps__$1)
              }else {
                return and__3119__auto__
              }
            }())
          };
          var G__6503 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6503__delegate.call(this, x, y, z, args)
          };
          G__6503.cljs$lang$maxFixedArity = 3;
          G__6503.cljs$lang$applyTo = function(arglist__6504) {
            var x = cljs.core.first(arglist__6504);
            arglist__6504 = cljs.core.next(arglist__6504);
            var y = cljs.core.first(arglist__6504);
            arglist__6504 = cljs.core.next(arglist__6504);
            var z = cljs.core.first(arglist__6504);
            var args = cljs.core.rest(arglist__6504);
            return G__6503__delegate(x, y, z, args)
          };
          G__6503.cljs$core$IFn$_invoke$arity$variadic = G__6503__delegate;
          return G__6503
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$core$IFn$_invoke$arity$0 = epn__0;
        epn.cljs$core$IFn$_invoke$arity$1 = epn__1;
        epn.cljs$core$IFn$_invoke$arity$2 = epn__2;
        epn.cljs$core$IFn$_invoke$arity$3 = epn__3;
        epn.cljs$core$IFn$_invoke$arity$variadic = epn__4.cljs$core$IFn$_invoke$arity$variadic;
        return epn
      }()
    };
    var G__6502 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(arguments.length > 3) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6502__delegate.call(this, p1, p2, p3, ps)
    };
    G__6502.cljs$lang$maxFixedArity = 3;
    G__6502.cljs$lang$applyTo = function(arglist__6505) {
      var p1 = cljs.core.first(arglist__6505);
      arglist__6505 = cljs.core.next(arglist__6505);
      var p2 = cljs.core.first(arglist__6505);
      arglist__6505 = cljs.core.next(arglist__6505);
      var p3 = cljs.core.first(arglist__6505);
      var ps = cljs.core.rest(arglist__6505);
      return G__6502__delegate(p1, p2, p3, ps)
    };
    G__6502.cljs$core$IFn$_invoke$arity$variadic = G__6502__delegate;
    return G__6502
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$core$IFn$_invoke$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$core$IFn$_invoke$arity$1 = every_pred__1;
  every_pred.cljs$core$IFn$_invoke$arity$2 = every_pred__2;
  every_pred.cljs$core$IFn$_invoke$arity$3 = every_pred__3;
  every_pred.cljs$core$IFn$_invoke$arity$variadic = every_pred__4.cljs$core$IFn$_invoke$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3128__auto__ = p.call(null, x);
        if(cljs.core.truth_(or__3128__auto__)) {
          return or__3128__auto__
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3128__auto__ = p.call(null, x);
        if(cljs.core.truth_(or__3128__auto__)) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = p.call(null, y);
          if(cljs.core.truth_(or__3128__auto____$1)) {
            return or__3128__auto____$1
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__6512__delegate = function(x, y, z, args) {
          var or__3128__auto__ = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3128__auto__)) {
            return or__3128__auto__
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__6512 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6512__delegate.call(this, x, y, z, args)
        };
        G__6512.cljs$lang$maxFixedArity = 3;
        G__6512.cljs$lang$applyTo = function(arglist__6513) {
          var x = cljs.core.first(arglist__6513);
          arglist__6513 = cljs.core.next(arglist__6513);
          var y = cljs.core.first(arglist__6513);
          arglist__6513 = cljs.core.next(arglist__6513);
          var z = cljs.core.first(arglist__6513);
          var args = cljs.core.rest(arglist__6513);
          return G__6512__delegate(x, y, z, args)
        };
        G__6512.cljs$core$IFn$_invoke$arity$variadic = G__6512__delegate;
        return G__6512
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$core$IFn$_invoke$arity$0 = sp1__0;
      sp1.cljs$core$IFn$_invoke$arity$1 = sp1__1;
      sp1.cljs$core$IFn$_invoke$arity$2 = sp1__2;
      sp1.cljs$core$IFn$_invoke$arity$3 = sp1__3;
      sp1.cljs$core$IFn$_invoke$arity$variadic = sp1__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3128__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3128__auto__)) {
          return or__3128__auto__
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3128__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3128__auto__)) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = p1.call(null, y);
          if(cljs.core.truth_(or__3128__auto____$1)) {
            return or__3128__auto____$1
          }else {
            var or__3128__auto____$2 = p2.call(null, x);
            if(cljs.core.truth_(or__3128__auto____$2)) {
              return or__3128__auto____$2
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3128__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3128__auto__)) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = p1.call(null, y);
          if(cljs.core.truth_(or__3128__auto____$1)) {
            return or__3128__auto____$1
          }else {
            var or__3128__auto____$2 = p1.call(null, z);
            if(cljs.core.truth_(or__3128__auto____$2)) {
              return or__3128__auto____$2
            }else {
              var or__3128__auto____$3 = p2.call(null, x);
              if(cljs.core.truth_(or__3128__auto____$3)) {
                return or__3128__auto____$3
              }else {
                var or__3128__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3128__auto____$4)) {
                  return or__3128__auto____$4
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__6514__delegate = function(x, y, z, args) {
          var or__3128__auto__ = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3128__auto__)) {
            return or__3128__auto__
          }else {
            return cljs.core.some.call(null, function(p1__6506_SHARP_) {
              var or__3128__auto____$1 = p1.call(null, p1__6506_SHARP_);
              if(cljs.core.truth_(or__3128__auto____$1)) {
                return or__3128__auto____$1
              }else {
                return p2.call(null, p1__6506_SHARP_)
              }
            }, args)
          }
        };
        var G__6514 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6514__delegate.call(this, x, y, z, args)
        };
        G__6514.cljs$lang$maxFixedArity = 3;
        G__6514.cljs$lang$applyTo = function(arglist__6515) {
          var x = cljs.core.first(arglist__6515);
          arglist__6515 = cljs.core.next(arglist__6515);
          var y = cljs.core.first(arglist__6515);
          arglist__6515 = cljs.core.next(arglist__6515);
          var z = cljs.core.first(arglist__6515);
          var args = cljs.core.rest(arglist__6515);
          return G__6514__delegate(x, y, z, args)
        };
        G__6514.cljs$core$IFn$_invoke$arity$variadic = G__6514__delegate;
        return G__6514
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$core$IFn$_invoke$arity$0 = sp2__0;
      sp2.cljs$core$IFn$_invoke$arity$1 = sp2__1;
      sp2.cljs$core$IFn$_invoke$arity$2 = sp2__2;
      sp2.cljs$core$IFn$_invoke$arity$3 = sp2__3;
      sp2.cljs$core$IFn$_invoke$arity$variadic = sp2__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3128__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3128__auto__)) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3128__auto____$1)) {
            return or__3128__auto____$1
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3128__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3128__auto__)) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3128__auto____$1)) {
            return or__3128__auto____$1
          }else {
            var or__3128__auto____$2 = p3.call(null, x);
            if(cljs.core.truth_(or__3128__auto____$2)) {
              return or__3128__auto____$2
            }else {
              var or__3128__auto____$3 = p1.call(null, y);
              if(cljs.core.truth_(or__3128__auto____$3)) {
                return or__3128__auto____$3
              }else {
                var or__3128__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3128__auto____$4)) {
                  return or__3128__auto____$4
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3128__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3128__auto__)) {
          return or__3128__auto__
        }else {
          var or__3128__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3128__auto____$1)) {
            return or__3128__auto____$1
          }else {
            var or__3128__auto____$2 = p3.call(null, x);
            if(cljs.core.truth_(or__3128__auto____$2)) {
              return or__3128__auto____$2
            }else {
              var or__3128__auto____$3 = p1.call(null, y);
              if(cljs.core.truth_(or__3128__auto____$3)) {
                return or__3128__auto____$3
              }else {
                var or__3128__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3128__auto____$4)) {
                  return or__3128__auto____$4
                }else {
                  var or__3128__auto____$5 = p3.call(null, y);
                  if(cljs.core.truth_(or__3128__auto____$5)) {
                    return or__3128__auto____$5
                  }else {
                    var or__3128__auto____$6 = p1.call(null, z);
                    if(cljs.core.truth_(or__3128__auto____$6)) {
                      return or__3128__auto____$6
                    }else {
                      var or__3128__auto____$7 = p2.call(null, z);
                      if(cljs.core.truth_(or__3128__auto____$7)) {
                        return or__3128__auto____$7
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__6516__delegate = function(x, y, z, args) {
          var or__3128__auto__ = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3128__auto__)) {
            return or__3128__auto__
          }else {
            return cljs.core.some.call(null, function(p1__6507_SHARP_) {
              var or__3128__auto____$1 = p1.call(null, p1__6507_SHARP_);
              if(cljs.core.truth_(or__3128__auto____$1)) {
                return or__3128__auto____$1
              }else {
                var or__3128__auto____$2 = p2.call(null, p1__6507_SHARP_);
                if(cljs.core.truth_(or__3128__auto____$2)) {
                  return or__3128__auto____$2
                }else {
                  return p3.call(null, p1__6507_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__6516 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6516__delegate.call(this, x, y, z, args)
        };
        G__6516.cljs$lang$maxFixedArity = 3;
        G__6516.cljs$lang$applyTo = function(arglist__6517) {
          var x = cljs.core.first(arglist__6517);
          arglist__6517 = cljs.core.next(arglist__6517);
          var y = cljs.core.first(arglist__6517);
          arglist__6517 = cljs.core.next(arglist__6517);
          var z = cljs.core.first(arglist__6517);
          var args = cljs.core.rest(arglist__6517);
          return G__6516__delegate(x, y, z, args)
        };
        G__6516.cljs$core$IFn$_invoke$arity$variadic = G__6516__delegate;
        return G__6516
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$core$IFn$_invoke$arity$0 = sp3__0;
      sp3.cljs$core$IFn$_invoke$arity$1 = sp3__1;
      sp3.cljs$core$IFn$_invoke$arity$2 = sp3__2;
      sp3.cljs$core$IFn$_invoke$arity$3 = sp3__3;
      sp3.cljs$core$IFn$_invoke$arity$variadic = sp3__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__6518__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__6508_SHARP_) {
            return p1__6508_SHARP_.call(null, x)
          }, ps__$1)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__6509_SHARP_) {
            var or__3128__auto__ = p1__6509_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3128__auto__)) {
              return or__3128__auto__
            }else {
              return p1__6509_SHARP_.call(null, y)
            }
          }, ps__$1)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__6510_SHARP_) {
            var or__3128__auto__ = p1__6510_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3128__auto__)) {
              return or__3128__auto__
            }else {
              var or__3128__auto____$1 = p1__6510_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3128__auto____$1)) {
                return or__3128__auto____$1
              }else {
                return p1__6510_SHARP_.call(null, z)
              }
            }
          }, ps__$1)
        };
        var spn__4 = function() {
          var G__6519__delegate = function(x, y, z, args) {
            var or__3128__auto__ = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3128__auto__)) {
              return or__3128__auto__
            }else {
              return cljs.core.some.call(null, function(p1__6511_SHARP_) {
                return cljs.core.some.call(null, p1__6511_SHARP_, args)
              }, ps__$1)
            }
          };
          var G__6519 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6519__delegate.call(this, x, y, z, args)
          };
          G__6519.cljs$lang$maxFixedArity = 3;
          G__6519.cljs$lang$applyTo = function(arglist__6520) {
            var x = cljs.core.first(arglist__6520);
            arglist__6520 = cljs.core.next(arglist__6520);
            var y = cljs.core.first(arglist__6520);
            arglist__6520 = cljs.core.next(arglist__6520);
            var z = cljs.core.first(arglist__6520);
            var args = cljs.core.rest(arglist__6520);
            return G__6519__delegate(x, y, z, args)
          };
          G__6519.cljs$core$IFn$_invoke$arity$variadic = G__6519__delegate;
          return G__6519
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$core$IFn$_invoke$arity$0 = spn__0;
        spn.cljs$core$IFn$_invoke$arity$1 = spn__1;
        spn.cljs$core$IFn$_invoke$arity$2 = spn__2;
        spn.cljs$core$IFn$_invoke$arity$3 = spn__3;
        spn.cljs$core$IFn$_invoke$arity$variadic = spn__4.cljs$core$IFn$_invoke$arity$variadic;
        return spn
      }()
    };
    var G__6518 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(arguments.length > 3) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6518__delegate.call(this, p1, p2, p3, ps)
    };
    G__6518.cljs$lang$maxFixedArity = 3;
    G__6518.cljs$lang$applyTo = function(arglist__6521) {
      var p1 = cljs.core.first(arglist__6521);
      arglist__6521 = cljs.core.next(arglist__6521);
      var p2 = cljs.core.first(arglist__6521);
      arglist__6521 = cljs.core.next(arglist__6521);
      var p3 = cljs.core.first(arglist__6521);
      var ps = cljs.core.rest(arglist__6521);
      return G__6518__delegate(p1, p2, p3, ps)
    };
    G__6518.cljs$core$IFn$_invoke$arity$variadic = G__6518__delegate;
    return G__6518
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$core$IFn$_invoke$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$core$IFn$_invoke$arity$1 = some_fn__1;
  some_fn.cljs$core$IFn$_invoke$arity$2 = some_fn__2;
  some_fn.cljs$core$IFn$_invoke$arity$3 = some_fn__3;
  some_fn.cljs$core$IFn$_invoke$arity$variadic = some_fn__4.cljs$core$IFn$_invoke$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__3891__auto___6523 = size;
          var i_6524 = 0;
          while(true) {
            if(i_6524 < n__3891__auto___6523) {
              cljs.core.chunk_append.call(null, b, f.call(null, cljs.core._nth.call(null, c, i_6524)));
              var G__6525 = i_6524 + 1;
              i_6524 = G__6525;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), map.call(null, f, cljs.core.chunk_rest.call(null, s)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s)), map.call(null, f, cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }, null, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      if(s1 && s2) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1), cljs.core.first.call(null, s2)), map.call(null, f, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2)))
      }else {
        return null
      }
    }, null, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      var s3 = cljs.core.seq.call(null, c3);
      if(s1 && s2 && s3) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1), cljs.core.first.call(null, s2), cljs.core.first.call(null, s3)), map.call(null, f, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2), cljs.core.rest.call(null, s3)))
      }else {
        return null
      }
    }, null, null)
  };
  var map__5 = function() {
    var G__6526__delegate = function(f, c1, c2, c3, colls) {
      var step = function step(cs) {
        return new cljs.core.LazySeq(null, function() {
          var ss = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss), step.call(null, map.call(null, cljs.core.rest, ss)))
          }else {
            return null
          }
        }, null, null)
      };
      return map.call(null, function(p1__6522_SHARP_) {
        return cljs.core.apply.call(null, f, p1__6522_SHARP_)
      }, step.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__6526 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(arguments.length > 4) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6526__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__6526.cljs$lang$maxFixedArity = 4;
    G__6526.cljs$lang$applyTo = function(arglist__6527) {
      var f = cljs.core.first(arglist__6527);
      arglist__6527 = cljs.core.next(arglist__6527);
      var c1 = cljs.core.first(arglist__6527);
      arglist__6527 = cljs.core.next(arglist__6527);
      var c2 = cljs.core.first(arglist__6527);
      arglist__6527 = cljs.core.next(arglist__6527);
      var c3 = cljs.core.first(arglist__6527);
      var colls = cljs.core.rest(arglist__6527);
      return G__6526__delegate(f, c1, c2, c3, colls)
    };
    G__6526.cljs$core$IFn$_invoke$arity$variadic = G__6526__delegate;
    return G__6526
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$core$IFn$_invoke$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$core$IFn$_invoke$arity$2 = map__2;
  map.cljs$core$IFn$_invoke$arity$3 = map__3;
  map.cljs$core$IFn$_invoke$arity$4 = map__4;
  map.cljs$core$IFn$_invoke$arity$variadic = map__5.cljs$core$IFn$_invoke$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, function() {
    if(n > 0) {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s), take.call(null, n - 1, cljs.core.rest.call(null, s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null, null)
};
cljs.core.drop = function drop(n, coll) {
  var step = function(n__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq.call(null, coll__$1);
      if(n__$1 > 0 && s) {
        var G__6528 = n__$1 - 1;
        var G__6529 = cljs.core.rest.call(null, s);
        n__$1 = G__6528;
        coll__$1 = G__6529;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, function() {
    return step.call(null, n, coll)
  }, null, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  drop_last.cljs$core$IFn$_invoke$arity$1 = drop_last__1;
  drop_last.cljs$core$IFn$_invoke$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s = cljs.core.seq.call(null, coll);
  var lead = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead) {
      var G__6530 = cljs.core.next.call(null, s);
      var G__6531 = cljs.core.next.call(null, lead);
      s = G__6530;
      lead = G__6531;
      continue
    }else {
      return s
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step = function(pred__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq.call(null, coll__$1);
      if(cljs.core.truth_(function() {
        var and__3119__auto__ = s;
        if(and__3119__auto__) {
          return pred__$1.call(null, cljs.core.first.call(null, s))
        }else {
          return and__3119__auto__
        }
      }())) {
        var G__6532 = pred__$1;
        var G__6533 = cljs.core.rest.call(null, s);
        pred__$1 = G__6532;
        coll__$1 = G__6533;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, function() {
    return step.call(null, pred, coll)
  }, null, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      return cljs.core.concat.call(null, s, cycle.call(null, s))
    }else {
      return null
    }
  }, null, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeat.cljs$core$IFn$_invoke$arity$1 = repeat__1;
  repeat.cljs$core$IFn$_invoke$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeatedly.cljs$core$IFn$_invoke$arity$1 = repeatedly__1;
  repeatedly.cljs$core$IFn$_invoke$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      if(s1 && s2) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1), cljs.core.cons.call(null, cljs.core.first.call(null, s2), interleave.call(null, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2))))
      }else {
        return null
      }
    }, null, null)
  };
  var interleave__3 = function() {
    var G__6534__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, function() {
        var ss = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss)))
        }else {
          return null
        }
      }, null, null)
    };
    var G__6534 = function(c1, c2, var_args) {
      var colls = null;
      if(arguments.length > 2) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6534__delegate.call(this, c1, c2, colls)
    };
    G__6534.cljs$lang$maxFixedArity = 2;
    G__6534.cljs$lang$applyTo = function(arglist__6535) {
      var c1 = cljs.core.first(arglist__6535);
      arglist__6535 = cljs.core.next(arglist__6535);
      var c2 = cljs.core.first(arglist__6535);
      var colls = cljs.core.rest(arglist__6535);
      return G__6534__delegate(c1, c2, colls)
    };
    G__6534.cljs$core$IFn$_invoke$arity$variadic = G__6534__delegate;
    return G__6534
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$core$IFn$_invoke$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$core$IFn$_invoke$arity$2 = interleave__2;
  interleave.cljs$core$IFn$_invoke$arity$variadic = interleave__3.cljs$core$IFn$_invoke$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat = function cat(coll, colls__$1) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4090__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4090__auto__) {
        var coll__$1 = temp__4090__auto__;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__$1), cat.call(null, cljs.core.rest.call(null, coll__$1), colls__$1))
      }else {
        if(cljs.core.seq.call(null, colls__$1)) {
          return cat.call(null, cljs.core.first.call(null, colls__$1), cljs.core.rest.call(null, colls__$1))
        }else {
          return null
        }
      }
    }, null, null)
  };
  return cat.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__6536__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__6536 = function(f, coll, var_args) {
      var colls = null;
      if(arguments.length > 2) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6536__delegate.call(this, f, coll, colls)
    };
    G__6536.cljs$lang$maxFixedArity = 2;
    G__6536.cljs$lang$applyTo = function(arglist__6537) {
      var f = cljs.core.first(arglist__6537);
      arglist__6537 = cljs.core.next(arglist__6537);
      var coll = cljs.core.first(arglist__6537);
      var colls = cljs.core.rest(arglist__6537);
      return G__6536__delegate(f, coll, colls)
    };
    G__6536.cljs$core$IFn$_invoke$arity$variadic = G__6536__delegate;
    return G__6536
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$core$IFn$_invoke$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$core$IFn$_invoke$arity$2 = mapcat__2;
  mapcat.cljs$core$IFn$_invoke$arity$variadic = mapcat__3.cljs$core$IFn$_invoke$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
        var c = cljs.core.chunk_first.call(null, s);
        var size = cljs.core.count.call(null, c);
        var b = cljs.core.chunk_buffer.call(null, size);
        var n__3891__auto___6538 = size;
        var i_6539 = 0;
        while(true) {
          if(i_6539 < n__3891__auto___6538) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c, i_6539)))) {
              cljs.core.chunk_append.call(null, b, cljs.core._nth.call(null, c, i_6539))
            }else {
            }
            var G__6540 = i_6539 + 1;
            i_6539 = G__6540;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), filter.call(null, pred, cljs.core.chunk_rest.call(null, s)))
      }else {
        var f = cljs.core.first.call(null, s);
        var r = cljs.core.rest.call(null, s);
        if(cljs.core.truth_(pred.call(null, f))) {
          return cljs.core.cons.call(null, f, filter.call(null, pred, r))
        }else {
          return filter.call(null, pred, r)
        }
      }
    }else {
      return null
    }
  }, null, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk = function walk(node) {
    return new cljs.core.LazySeq(null, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null, null)
  };
  return walk.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__6541_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__6541_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(!(to == null)) {
    if(function() {
      var G__6543 = to;
      if(G__6543) {
        var bit__3739__auto__ = G__6543.cljs$lang$protocol_mask$partition1$ & 4;
        if(bit__3739__auto__ || G__6543.cljs$core$IEditableCollection$) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
    }else {
      return cljs.core.reduce.call(null, cljs.core._conj, to, from)
    }
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__6544__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__6544 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(arguments.length > 4) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6544__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__6544.cljs$lang$maxFixedArity = 4;
    G__6544.cljs$lang$applyTo = function(arglist__6545) {
      var f = cljs.core.first(arglist__6545);
      arglist__6545 = cljs.core.next(arglist__6545);
      var c1 = cljs.core.first(arglist__6545);
      arglist__6545 = cljs.core.next(arglist__6545);
      var c2 = cljs.core.first(arglist__6545);
      arglist__6545 = cljs.core.next(arglist__6545);
      var c3 = cljs.core.first(arglist__6545);
      var colls = cljs.core.rest(arglist__6545);
      return G__6544__delegate(f, c1, c2, c3, colls)
    };
    G__6544.cljs$core$IFn$_invoke$arity$variadic = G__6544__delegate;
    return G__6544
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$core$IFn$_invoke$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$core$IFn$_invoke$arity$2 = mapv__2;
  mapv.cljs$core$IFn$_invoke$arity$3 = mapv__3;
  mapv.cljs$core$IFn$_invoke$arity$4 = mapv__4;
  mapv.cljs$core$IFn$_invoke$arity$variadic = mapv__5.cljs$core$IFn$_invoke$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        var p = cljs.core.take.call(null, n, s);
        if(n === cljs.core.count.call(null, p)) {
          return cljs.core.cons.call(null, p, partition.call(null, n, step, cljs.core.drop.call(null, step, s)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        var p = cljs.core.take.call(null, n, s);
        if(n === cljs.core.count.call(null, p)) {
          return cljs.core.cons.call(null, p, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p, pad)))
        }
      }else {
        return null
      }
    }, null, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition.cljs$core$IFn$_invoke$arity$2 = partition__2;
  partition.cljs$core$IFn$_invoke$arity$3 = partition__3;
  partition.cljs$core$IFn$_invoke$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return get_in.call(null, m, ks, null)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel = cljs.core.lookup_sentinel;
    var m__$1 = m;
    var ks__$1 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__$1) {
        if(!function() {
          var G__6547 = m__$1;
          if(G__6547) {
            var bit__3746__auto__ = G__6547.cljs$lang$protocol_mask$partition0$ & 256;
            if(bit__3746__auto__ || G__6547.cljs$core$ILookup$) {
              return true
            }else {
              if(!G__6547.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ILookup, G__6547)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ILookup, G__6547)
          }
        }()) {
          return not_found
        }else {
          var m__$2 = cljs.core.get.call(null, m__$1, cljs.core.first.call(null, ks__$1), sentinel);
          if(sentinel === m__$2) {
            return not_found
          }else {
            var G__6548 = sentinel;
            var G__6549 = m__$2;
            var G__6550 = cljs.core.next.call(null, ks__$1);
            sentinel = G__6548;
            m__$1 = G__6549;
            ks__$1 = G__6550;
            continue
          }
        }
      }else {
        return m__$1
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get_in.cljs$core$IFn$_invoke$arity$2 = get_in__2;
  get_in.cljs$core$IFn$_invoke$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__6551, v) {
  var vec__6553 = p__6551;
  var k = cljs.core.nth.call(null, vec__6553, 0, null);
  var ks = cljs.core.nthnext.call(null, vec__6553, 1);
  if(cljs.core.truth_(ks)) {
    return cljs.core.assoc.call(null, m, k, assoc_in.call(null, cljs.core.get.call(null, m, k), ks, v))
  }else {
    return cljs.core.assoc.call(null, m, k, v)
  }
};
cljs.core.update_in = function() {
  var update_in = null;
  var update_in__3 = function(m, p__6554, f) {
    var vec__6564 = p__6554;
    var k = cljs.core.nth.call(null, vec__6564, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__6564, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k)))
    }
  };
  var update_in__4 = function(m, p__6555, f, a) {
    var vec__6565 = p__6555;
    var k = cljs.core.nth.call(null, vec__6565, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__6565, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f, a))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), a))
    }
  };
  var update_in__5 = function(m, p__6556, f, a, b) {
    var vec__6566 = p__6556;
    var k = cljs.core.nth.call(null, vec__6566, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__6566, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f, a, b))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), a, b))
    }
  };
  var update_in__6 = function(m, p__6557, f, a, b, c) {
    var vec__6567 = p__6557;
    var k = cljs.core.nth.call(null, vec__6567, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__6567, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f, a, b, c))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), a, b, c))
    }
  };
  var update_in__7 = function() {
    var G__6569__delegate = function(m, p__6558, f, a, b, c, args) {
      var vec__6568 = p__6558;
      var k = cljs.core.nth.call(null, vec__6568, 0, null);
      var ks = cljs.core.nthnext.call(null, vec__6568, 1);
      if(cljs.core.truth_(ks)) {
        return cljs.core.assoc.call(null, m, k, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k), ks, f, a, b, c, args))
      }else {
        return cljs.core.assoc.call(null, m, k, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k), a, b, c, args))
      }
    };
    var G__6569 = function(m, p__6558, f, a, b, c, var_args) {
      var args = null;
      if(arguments.length > 6) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 6), 0)
      }
      return G__6569__delegate.call(this, m, p__6558, f, a, b, c, args)
    };
    G__6569.cljs$lang$maxFixedArity = 6;
    G__6569.cljs$lang$applyTo = function(arglist__6570) {
      var m = cljs.core.first(arglist__6570);
      arglist__6570 = cljs.core.next(arglist__6570);
      var p__6558 = cljs.core.first(arglist__6570);
      arglist__6570 = cljs.core.next(arglist__6570);
      var f = cljs.core.first(arglist__6570);
      arglist__6570 = cljs.core.next(arglist__6570);
      var a = cljs.core.first(arglist__6570);
      arglist__6570 = cljs.core.next(arglist__6570);
      var b = cljs.core.first(arglist__6570);
      arglist__6570 = cljs.core.next(arglist__6570);
      var c = cljs.core.first(arglist__6570);
      var args = cljs.core.rest(arglist__6570);
      return G__6569__delegate(m, p__6558, f, a, b, c, args)
    };
    G__6569.cljs$core$IFn$_invoke$arity$variadic = G__6569__delegate;
    return G__6569
  }();
  update_in = function(m, p__6558, f, a, b, c, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 3:
        return update_in__3.call(this, m, p__6558, f);
      case 4:
        return update_in__4.call(this, m, p__6558, f, a);
      case 5:
        return update_in__5.call(this, m, p__6558, f, a, b);
      case 6:
        return update_in__6.call(this, m, p__6558, f, a, b, c);
      default:
        return update_in__7.cljs$core$IFn$_invoke$arity$variadic(m, p__6558, f, a, b, c, cljs.core.array_seq(arguments, 6))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  update_in.cljs$lang$maxFixedArity = 6;
  update_in.cljs$lang$applyTo = update_in__7.cljs$lang$applyTo;
  update_in.cljs$core$IFn$_invoke$arity$3 = update_in__3;
  update_in.cljs$core$IFn$_invoke$arity$4 = update_in__4;
  update_in.cljs$core$IFn$_invoke$arity$5 = update_in__5;
  update_in.cljs$core$IFn$_invoke$arity$6 = update_in__6;
  update_in.cljs$core$IFn$_invoke$arity$variadic = update_in__7.cljs$core$IFn$_invoke$arity$variadic;
  return update_in
}();
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorStr = "cljs.core/VectorNode";
cljs.core.VectorNode.cljs$lang$ctorPrWriter = function(this__3667__auto__, writer__3668__auto__, opts__3669__auto__) {
  return cljs.core._write.call(null, writer__3668__auto__, "cljs.core/VectorNode")
};
cljs.core.__GT_VectorNode = function __GT_VectorNode(edit, arr) {
  return new cljs.core.VectorNode(edit, arr)
};
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, new Array(32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt = pv.cnt;
  if(cnt < 32) {
    return 0
  }else {
    return cnt - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll = level;
  var ret = node;
  while(true) {
    if(ll === 0) {
      return ret
    }else {
      var embed = ret;
      var r = cljs.core.pv_fresh_node.call(null, edit);
      var _ = cljs.core.pv_aset.call(null, r, 0, embed);
      var G__6571 = ll - 5;
      var G__6572 = r;
      ll = G__6571;
      ret = G__6572;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret = cljs.core.pv_clone_node.call(null, parent);
  var subidx = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret, subidx, tailnode);
    return ret
  }else {
    var child = cljs.core.pv_aget.call(null, parent, subidx);
    if(!(child == null)) {
      var node_to_insert = push_tail.call(null, pv, level - 5, child, tailnode);
      cljs.core.pv_aset.call(null, ret, subidx, node_to_insert);
      return ret
    }else {
      var node_to_insert = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret, subidx, node_to_insert);
      return ret
    }
  }
};
cljs.core.vector_index_out_of_bounds = function vector_index_out_of_bounds(i, cnt) {
  throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(cnt)].join(""));
};
cljs.core.array_for = function array_for(pv, i) {
  if(0 <= i && i < pv.cnt) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node = pv.root;
      var level = pv.shift;
      while(true) {
        if(level > 0) {
          var G__6573 = cljs.core.pv_aget.call(null, node, i >>> level & 31);
          var G__6574 = level - 5;
          node = G__6573;
          level = G__6574;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    return cljs.core.vector_index_out_of_bounds.call(null, i, pv.cnt)
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret, i & 31, val);
    return ret
  }else {
    var subidx = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret, subidx, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx), i, val));
    return ret
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx));
    if(new_child == null && subidx === 0) {
      return null
    }else {
      var ret = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret, subidx, new_child);
      return ret
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        var ret = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret, subidx, null);
        return ret
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorStr = "cljs.core/PersistentVector";
cljs.core.PersistentVector.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.TransientVector(self__.cnt, self__.shift, cljs.core.tv_editable_root.call(null, self__.root), cljs.core.tv_editable_tail.call(null, self__.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._nth.call(null, coll__$1, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._nth.call(null, coll__$1, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var coll__$1 = this;
  if(0 <= k && k < self__.cnt) {
    if(cljs.core.tail_off.call(null, coll__$1) <= k) {
      var new_tail = self__.tail.slice();
      new_tail[k & 31] = v;
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, self__.root, new_tail, null)
    }else {
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, cljs.core.do_assoc.call(null, coll__$1, self__.shift, self__.root, k, v), self__.tail, null)
    }
  }else {
    if(k === self__.cnt) {
      return cljs.core._conj.call(null, coll__$1, v)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(self__.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__6576 = null;
  var G__6576__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$IIndexed$_nth$arity$2(null, k)
  };
  var G__6576__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$IIndexed$_nth$arity$3(null, k, not_found)
  };
  G__6576 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6576__2.call(this, self__, k);
      case 3:
        return G__6576__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6576
}();
cljs.core.PersistentVector.prototype.apply = function(self__, args6575) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6575.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$_invoke$arity$1 = function(k) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(null, k)
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$_invoke$arity$2 = function(k, not_found) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(null, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var self__ = this;
  var v__$1 = this;
  var step_init = [0, init];
  var i = 0;
  while(true) {
    if(i < self__.cnt) {
      var arr = cljs.core.array_for.call(null, v__$1, i);
      var len = arr.length;
      var init__$1 = function() {
        var j = 0;
        var init__$1 = step_init[1];
        while(true) {
          if(j < len) {
            var init__$2 = f.call(null, init__$1, j + i, arr[j]);
            if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
              return init__$2
            }else {
              var G__6577 = j + 1;
              var G__6578 = init__$2;
              j = G__6577;
              init__$1 = G__6578;
              continue
            }
          }else {
            step_init[0] = len;
            step_init[1] = init__$1;
            return init__$1
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
        return cljs.core.deref.call(null, init__$1)
      }else {
        var G__6579 = i + step_init[0];
        i = G__6579;
        continue
      }
    }else {
      return step_init[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.cnt - cljs.core.tail_off.call(null, coll__$1) < 32) {
    var new_tail = self__.tail.slice();
    new_tail.push(o);
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, self__.shift, self__.root, new_tail, null)
  }else {
    var root_overflow_QMARK_ = self__.cnt >>> 5 > 1 << self__.shift;
    var new_shift = root_overflow_QMARK_ ? self__.shift + 5 : self__.shift;
    var new_root = root_overflow_QMARK_ ? function() {
      var n_r = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r, 0, self__.root);
      cljs.core.pv_aset.call(null, n_r, 1, cljs.core.new_path.call(null, null, self__.shift, new cljs.core.VectorNode(null, self__.tail)));
      return n_r
    }() : cljs.core.push_tail.call(null, coll__$1, self__.shift, self__.root, new cljs.core.VectorNode(null, self__.tail));
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, new_shift, new_root, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.cnt > 0) {
    return new cljs.core.RSeq(coll__$1, self__.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._nth.call(null, coll__$1, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._nth.call(null, coll__$1, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var self__ = this;
  var v__$1 = this;
  return cljs.core.ci_reduce.call(null, v__$1, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var self__ = this;
  var v__$1 = this;
  return cljs.core.ci_reduce.call(null, v__$1, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.cnt === 0) {
    return null
  }else {
    if(self__.cnt < 32) {
      return cljs.core.array_seq.call(null, self__.tail)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return cljs.core.chunked_seq.call(null, coll__$1, 0, 0)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.cnt > 0) {
    return cljs.core._nth.call(null, coll__$1, self__.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === self__.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
    }else {
      if(1 < self__.cnt - cljs.core.tail_off.call(null, coll__$1)) {
        return new cljs.core.PersistentVector(self__.meta, self__.cnt - 1, self__.shift, self__.root, self__.tail.slice(0, -1), null)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var new_tail = cljs.core.array_for.call(null, coll__$1, self__.cnt - 2);
          var nr = cljs.core.pop_tail.call(null, coll__$1, self__.shift, self__.root);
          var new_root = nr == null ? cljs.core.PersistentVector.EMPTY_NODE : nr;
          var cnt_1 = self__.cnt - 1;
          if(5 < self__.shift && cljs.core.pv_aget.call(null, new_root, 1) == null) {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift - 5, cljs.core.pv_aget.call(null, new_root, 0), new_tail, null)
          }else {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift, new_root, new_tail, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._assoc.call(null, coll__$1, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentVector(meta__$1, self__.cnt, self__.shift, self__.root, self__.tail, self__.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.array_for.call(null, coll__$1, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  var coll__$1 = this;
  if(0 <= n && n < self__.cnt) {
    return cljs.core._nth.call(null, coll__$1, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentVector = function __GT_PersistentVector(meta, cnt, shift, root, tail, __hash) {
  return new cljs.core.PersistentVector(meta, cnt, shift, root, tail, __hash)
};
cljs.core.PersistentVector.EMPTY_NODE = new cljs.core.VectorNode(null, new Array(32));
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l = xs.length;
  var xs__$1 = no_clone ? xs : xs.slice();
  if(l < 32) {
    return new cljs.core.PersistentVector(null, l, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__$1, null)
  }else {
    var node = xs__$1.slice(0, 32);
    var v = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node, null);
    var i = 32;
    var out = cljs.core._as_transient.call(null, v);
    while(true) {
      if(i < l) {
        var G__6580 = i + 1;
        var G__6581 = cljs.core.conj_BANG_.call(null, out, xs__$1[i]);
        i = G__6580;
        out = G__6581;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(arguments.length > 0) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__6582) {
    var args = cljs.core.seq(arglist__6582);
    return vector__delegate(args)
  };
  vector.cljs$core$IFn$_invoke$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta, __hash) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 32243948;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorStr = "cljs.core/ChunkedSeq";
cljs.core.ChunkedSeq.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return null
    }else {
      return s
    }
  }else {
    return cljs.core._chunked_next.call(null, coll__$1)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.cons.call(null, o, coll__$1)
};
cljs.core.ChunkedSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.ci_reduce.call(null, cljs.core.subvec.call(null, self__.vec, self__.i + self__.off, cljs.core.count.call(null, self__.vec)), f)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.ci_reduce.call(null, cljs.core.subvec.call(null, self__.vec, self__.i + self__.off, cljs.core.count.call(null, self__.vec)), f, start)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return coll__$1
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.node[self__.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return cljs.core.List.EMPTY
    }else {
      return s
    }
  }else {
    return cljs.core._chunked_rest.call(null, coll__$1)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count.call(null, self__.vec) ? cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return null
  }else {
    return s
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.array_chunk.call(null, self__.node, self__.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count.call(null, self__.vec) ? cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return cljs.core.List.EMPTY
  }else {
    return s
  }
};
cljs.core.__GT_ChunkedSeq = function __GT_ChunkedSeq(vec, node, i, off, meta, __hash) {
  return new cljs.core.ChunkedSeq(vec, node, i, off, meta, __hash)
};
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return new cljs.core.ChunkedSeq(vec, cljs.core.array_for.call(null, vec, i), i, off, null, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, null, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta, null)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  chunked_seq.cljs$core$IFn$_invoke$arity$3 = chunked_seq__3;
  chunked_seq.cljs$core$IFn$_invoke$arity$4 = chunked_seq__4;
  chunked_seq.cljs$core$IFn$_invoke$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorStr = "cljs.core/Subvec";
cljs.core.Subvec.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._nth.call(null, coll__$1, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._nth.call(null, coll__$1, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var self__ = this;
  var coll__$1 = this;
  var v_pos = self__.start + key;
  return cljs.core.build_subvec.call(null, self__.meta, cljs.core.assoc.call(null, self__.v, v_pos, val), self__.start, function() {
    var x__3433__auto__ = self__.end;
    var y__3434__auto__ = v_pos + 1;
    return x__3433__auto__ > y__3434__auto__ ? x__3433__auto__ : y__3434__auto__
  }(), null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__6584 = null;
  var G__6584__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$IIndexed$_nth$arity$2(null, k)
  };
  var G__6584__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$IIndexed$_nth$arity$3(null, k, not_found)
  };
  G__6584 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6584__2.call(this, self__, k);
      case 3:
        return G__6584__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6584
}();
cljs.core.Subvec.prototype.apply = function(self__, args6583) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6583.slice()))
};
cljs.core.Subvec.prototype.cljs$core$IFn$_invoke$arity$1 = function(k) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(null, k)
};
cljs.core.Subvec.prototype.cljs$core$IFn$_invoke$arity$2 = function(k, not_found) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(null, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.build_subvec.call(null, self__.meta, cljs.core._assoc_n.call(null, self__.v, self__.end, o), self__.start, self__.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.ci_reduce.call(null, coll__$1, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start__$1) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.ci_reduce.call(null, coll__$1, f, start__$1)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var subvec_seq = function subvec_seq(i) {
    if(i === self__.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, self__.v, i), new cljs.core.LazySeq(null, function() {
        return subvec_seq.call(null, i + 1)
      }, null, null))
    }
  };
  return subvec_seq.call(null, self__.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.end - self__.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._nth.call(null, self__.v, self__.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.start === self__.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return cljs.core.build_subvec.call(null, self__.meta, self__.v, self__.start, self__.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._assoc.call(null, coll__$1, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.build_subvec.call(null, meta__$1, self__.v, self__.start, self__.end, self__.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  var coll__$1 = this;
  if(n < 0 || self__.end <= self__.start + n) {
    return cljs.core.vector_index_out_of_bounds.call(null, n, self__.end - self__.start)
  }else {
    return cljs.core._nth.call(null, self__.v, self__.start + n)
  }
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  var coll__$1 = this;
  if(n < 0 || self__.end <= self__.start + n) {
    return not_found
  }else {
    return cljs.core._nth.call(null, self__.v, self__.start + n, not_found)
  }
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.__GT_Subvec = function __GT_Subvec(meta, v, start, end, __hash) {
  return new cljs.core.Subvec(meta, v, start, end, __hash)
};
cljs.core.build_subvec = function build_subvec(meta, v, start, end, __hash) {
  while(true) {
    if(v instanceof cljs.core.Subvec) {
      var G__6585 = meta;
      var G__6586 = v.v;
      var G__6587 = v.start + start;
      var G__6588 = v.start + end;
      var G__6589 = __hash;
      meta = G__6585;
      v = G__6586;
      start = G__6587;
      end = G__6588;
      __hash = G__6589;
      continue
    }else {
      var c = cljs.core.count.call(null, v);
      if(start < 0 || end < 0 || start > c || end > c) {
        throw new Error("Index out of bounds");
      }else {
      }
      return new cljs.core.Subvec(meta, v, start, end, __hash)
    }
    break
  }
};
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return cljs.core.build_subvec.call(null, null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subvec.cljs$core$IFn$_invoke$arity$2 = subvec__2;
  subvec.cljs$core$IFn$_invoke$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret = new Array(32);
  cljs.core.array_copy.call(null, tl, 0, ret, 0, tl.length);
  return ret
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret, subidx, level === 5 ? tail_node : function() {
    var child = cljs.core.pv_aget.call(null, ret, subidx);
    if(!(child == null)) {
      return tv_push_tail.call(null, tv, level - 5, child, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__$1 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__$1, subidx));
    if(new_child == null && subidx === 0) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__$1, subidx, new_child);
      return node__$1
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        cljs.core.pv_aset.call(null, node__$1, subidx, null);
        return node__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(0 <= i && i < tv.cnt) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root = tv.root;
      var node = root;
      var level = tv.shift;
      while(true) {
        if(level > 0) {
          var G__6590 = cljs.core.tv_ensure_editable.call(null, root.edit, cljs.core.pv_aget.call(null, node, i >>> level & 31));
          var G__6591 = level - 5;
          node = G__6590;
          level = G__6591;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 88
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorStr = "cljs.core/TransientVector";
cljs.core.TransientVector.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__6593 = null;
  var G__6593__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
  };
  var G__6593__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
  };
  G__6593 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6593__2.call(this, self__, k);
      case 3:
        return G__6593__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6593
}();
cljs.core.TransientVector.prototype.apply = function(self__, args6592) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6592.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$IFn$_invoke$arity$1 = function(k) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
};
cljs.core.TransientVector.prototype.cljs$core$IFn$_invoke$arity$2 = function(k, not_found) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._nth.call(null, coll__$1, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._nth.call(null, coll__$1, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.root.edit) {
    return cljs.core.array_for.call(null, coll__$1, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  var coll__$1 = this;
  if(0 <= n && n < self__.cnt) {
    return cljs.core._nth.call(null, coll__$1, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.root.edit) {
    return self__.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var self__ = this;
  var tcoll__$1 = this;
  if(self__.root.edit) {
    if(0 <= n && n < self__.cnt) {
      if(cljs.core.tail_off.call(null, tcoll__$1) <= n) {
        self__.tail[n & 31] = val;
        return tcoll__$1
      }else {
        var new_root = function go(level, node) {
          var node__$1 = cljs.core.tv_ensure_editable.call(null, self__.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__$1, n & 31, val);
            return node__$1
          }else {
            var subidx = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__$1, subidx, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__$1, subidx)));
            return node__$1
          }
        }.call(null, self__.shift, self__.root);
        self__.root = new_root;
        return tcoll__$1
      }
    }else {
      if(n === self__.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll__$1, val)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(self__.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  var tcoll__$1 = this;
  if(self__.root.edit) {
    if(self__.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === self__.cnt) {
        self__.cnt = 0;
        return tcoll__$1
      }else {
        if((self__.cnt - 1 & 31) > 0) {
          self__.cnt = self__.cnt - 1;
          return tcoll__$1
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            var new_tail = cljs.core.editable_array_for.call(null, tcoll__$1, self__.cnt - 2);
            var new_root = function() {
              var nr = cljs.core.tv_pop_tail.call(null, tcoll__$1, self__.shift, self__.root);
              if(!(nr == null)) {
                return nr
              }else {
                return new cljs.core.VectorNode(self__.root.edit, new Array(32))
              }
            }();
            if(5 < self__.shift && cljs.core.pv_aget.call(null, new_root, 1) == null) {
              var new_root__$1 = cljs.core.tv_ensure_editable.call(null, self__.root.edit, cljs.core.pv_aget.call(null, new_root, 0));
              self__.root = new_root__$1;
              self__.shift = self__.shift - 5;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll__$1
            }else {
              self__.root = new_root;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll__$1
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  var tcoll__$1 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll__$1, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  var tcoll__$1 = this;
  if(self__.root.edit) {
    if(self__.cnt - cljs.core.tail_off.call(null, tcoll__$1) < 32) {
      self__.tail[self__.cnt & 31] = o;
      self__.cnt = self__.cnt + 1;
      return tcoll__$1
    }else {
      var tail_node = new cljs.core.VectorNode(self__.root.edit, self__.tail);
      var new_tail = new Array(32);
      new_tail[0] = o;
      self__.tail = new_tail;
      if(self__.cnt >>> 5 > 1 << self__.shift) {
        var new_root_array = new Array(32);
        var new_shift = self__.shift + 5;
        new_root_array[0] = self__.root;
        new_root_array[1] = cljs.core.new_path.call(null, self__.root.edit, self__.shift, tail_node);
        self__.root = new cljs.core.VectorNode(self__.root.edit, new_root_array);
        self__.shift = new_shift;
        self__.cnt = self__.cnt + 1;
        return tcoll__$1
      }else {
        var new_root = cljs.core.tv_push_tail.call(null, tcoll__$1, self__.shift, self__.root, tail_node);
        self__.root = new_root;
        self__.cnt = self__.cnt + 1;
        return tcoll__$1
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  var tcoll__$1 = this;
  if(self__.root.edit) {
    self__.root.edit = null;
    var len = self__.cnt - cljs.core.tail_off.call(null, tcoll__$1);
    var trimmed_tail = new Array(len);
    cljs.core.array_copy.call(null, self__.tail, 0, trimmed_tail, 0, len);
    return new cljs.core.PersistentVector(null, self__.cnt, self__.shift, self__.root, trimmed_tail, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.__GT_TransientVector = function __GT_TransientVector(cnt, shift, root, tail) {
  return new cljs.core.TransientVector(cnt, shift, root, tail)
};
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorStr = "cljs.core/PersistentQueueSeq";
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.cons.call(null, o, coll__$1)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return coll__$1
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var temp__4090__auto__ = cljs.core.next.call(null, self__.front);
  if(temp__4090__auto__) {
    var f1 = temp__4090__auto__;
    return new cljs.core.PersistentQueueSeq(self__.meta, f1, self__.rear, null)
  }else {
    if(self__.rear == null) {
      return cljs.core._empty.call(null, coll__$1)
    }else {
      return new cljs.core.PersistentQueueSeq(self__.meta, self__.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentQueueSeq(meta__$1, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentQueueSeq = function __GT_PersistentQueueSeq(meta, front, rear, __hash) {
  return new cljs.core.PersistentQueueSeq(meta, front, rear, __hash)
};
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorStr = "cljs.core/PersistentQueue";
cljs.core.PersistentQueue.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  if(cljs.core.truth_(self__.front)) {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, self__.front, cljs.core.conj.call(null, function() {
      var or__3128__auto__ = self__.rear;
      if(cljs.core.truth_(or__3128__auto__)) {
        return or__3128__auto__
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, cljs.core.conj.call(null, self__.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var rear__$1 = cljs.core.seq.call(null, self__.rear);
  if(cljs.core.truth_(function() {
    var or__3128__auto__ = self__.front;
    if(cljs.core.truth_(or__3128__auto__)) {
      return or__3128__auto__
    }else {
      return rear__$1
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, self__.front, cljs.core.seq.call(null, rear__$1), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(cljs.core.truth_(self__.front)) {
    var temp__4090__auto__ = cljs.core.next.call(null, self__.front);
    if(temp__4090__auto__) {
      var f1 = temp__4090__auto__;
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, f1, self__.rear, null)
    }else {
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, cljs.core.seq.call(null, self__.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll__$1
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll__$1))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentQueue(meta__$1, self__.count, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.__GT_PersistentQueue = function __GT_PersistentQueue(meta, count, front, rear, __hash) {
  return new cljs.core.PersistentQueue(meta, count, front, rear, __hash)
};
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorStr = "cljs.core/NeverEquiv";
cljs.core.NeverEquiv.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  var o__$1 = this;
  return false
};
cljs.core.__GT_NeverEquiv = function __GT_NeverEquiv() {
  return new cljs.core.NeverEquiv
};
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len = array.length;
  var i = 0;
  while(true) {
    if(i < len) {
      if(k === array[i]) {
        return i
      }else {
        var G__6594 = i + incr;
        i = G__6594;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__$1 = cljs.core.hash.call(null, a);
  var b__$1 = cljs.core.hash.call(null, b);
  if(a__$1 < b__$1) {
    return-1
  }else {
    if(a__$1 > b__$1) {
      return 1
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks = m.keys;
  var len = ks.length;
  var so = m.strobj;
  var mm = cljs.core.meta.call(null, m);
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i < len) {
      var k__$1 = ks[i];
      var G__6595 = i + 1;
      var G__6596 = cljs.core.assoc_BANG_.call(null, out, k__$1, so[k__$1]);
      i = G__6595;
      out = G__6596;
      continue
    }else {
      return cljs.core.with_meta.call(null, cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out, k, v)), mm)
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj = {};
  var l = ks.length;
  var i_6597 = 0;
  while(true) {
    if(i_6597 < l) {
      var k_6598 = ks[i_6597];
      new_obj[k_6598] = obj[k_6598];
      var G__6599 = i_6597 + 1;
      i_6597 = G__6599;
      continue
    }else {
    }
    break
  }
  return new_obj
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorStr = "cljs.core/ObjMap";
cljs.core.ObjMap.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll__$1))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_imap.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._lookup.call(null, coll__$1, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var coll__$1 = this;
  if(goog.isString(k) && !(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)) {
    return self__.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var coll__$1 = this;
  if(goog.isString(k)) {
    if(self__.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD || self__.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll__$1, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)) {
        var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
        new_strobj[k] = v;
        return new cljs.core.ObjMap(self__.meta, self__.keys, new_strobj, self__.update_count + 1, null)
      }else {
        var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
        var new_keys = self__.keys.slice();
        new_strobj[k] = v;
        new_keys.push(k);
        return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll__$1, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  if(goog.isString(k) && !(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__6602 = null;
  var G__6602__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
  };
  var G__6602__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
  };
  G__6602 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6602__2.call(this, self__, k);
      case 3:
        return G__6602__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6602
}();
cljs.core.ObjMap.prototype.apply = function(self__, args6601) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6601.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$IFn$_invoke$arity$1 = function(k) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$_invoke$arity$2 = function(k, not_found) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var coll__$1 = this;
  var len = self__.keys.length;
  var keys__$1 = self__.keys.sort(cljs.core.obj_map_compare_keys);
  var init__$1 = init;
  while(true) {
    if(cljs.core.seq.call(null, keys__$1)) {
      var k = cljs.core.first.call(null, keys__$1);
      var init__$2 = f.call(null, init__$1, k, self__.strobj[k]);
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__6603 = cljs.core.rest.call(null, keys__$1);
        var G__6604 = init__$2;
        keys__$1 = G__6603;
        init__$1 = G__6604;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  var coll__$1 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll__$1, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll__$1, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__6600_SHARP_) {
      return cljs.core.vector.call(null, p1__6600_SHARP_, self__.strobj[p1__6600_SHARP_])
    }, self__.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_map.call(null, coll__$1, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.ObjMap(meta__$1, self__.keys, self__.strobj, self__.update_count, self__.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, self__.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  if(goog.isString(k) && !(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)) {
    var new_keys = self__.keys.slice();
    var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
    new_keys.splice(cljs.core.scan_array.call(null, 1, k, new_keys), 1);
    delete new_strobj[k];
    return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
  }else {
    return coll__$1
  }
};
cljs.core.__GT_ObjMap = function __GT_ObjMap(meta, keys, strobj, update_count, __hash) {
  return new cljs.core.ObjMap(meta, keys, strobj, update_count, __hash)
};
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 8;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.array_map_index_of_nil_QMARK_ = function array_map_index_of_nil_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(arr[i] == null) {
        return i
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var G__6605 = i + 2;
          i = G__6605;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_keyword_QMARK_ = function array_map_index_of_keyword_QMARK_(arr, m, k) {
  var len = arr.length;
  var kstr = k.fqn;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(function() {
        var k_SINGLEQUOTE_ = arr[i];
        return k_SINGLEQUOTE_ instanceof cljs.core.Keyword && kstr === k_SINGLEQUOTE_.fqn
      }()) {
        return i
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var G__6606 = i + 2;
          i = G__6606;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_symbol_QMARK_ = function array_map_index_of_symbol_QMARK_(arr, m, k) {
  var len = arr.length;
  var kstr = k.str;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(function() {
        var k_SINGLEQUOTE_ = arr[i];
        return k_SINGLEQUOTE_ instanceof cljs.core.Symbol && kstr === k_SINGLEQUOTE_.str
      }()) {
        return i
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var G__6607 = i + 2;
          i = G__6607;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_identical_QMARK_ = function array_map_index_of_identical_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(k === arr[i]) {
        return i
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var G__6608 = i + 2;
          i = G__6608;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_equiv_QMARK_ = function array_map_index_of_equiv_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, k, arr[i])) {
        return i
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var G__6609 = i + 2;
          i = G__6609;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr = m.arr;
  if(k instanceof cljs.core.Keyword) {
    return cljs.core.array_map_index_of_keyword_QMARK_.call(null, arr, m, k)
  }else {
    if(goog.isString(k) || typeof k === "number") {
      return cljs.core.array_map_index_of_identical_QMARK_.call(null, arr, m, k)
    }else {
      if(k instanceof cljs.core.Symbol) {
        return cljs.core.array_map_index_of_symbol_QMARK_.call(null, arr, m, k)
      }else {
        if(k == null) {
          return cljs.core.array_map_index_of_nil_QMARK_.call(null, arr, m, k)
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            return cljs.core.array_map_index_of_equiv_QMARK_.call(null, arr, m, k)
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.array_map_extend_kv = function array_map_extend_kv(m, k, v) {
  var arr = m.arr;
  var l = arr.length;
  var narr = new Array(l + 2);
  var i_6610 = 0;
  while(true) {
    if(i_6610 < l) {
      narr[i_6610] = arr[i_6610];
      var G__6611 = i_6610 + 1;
      i_6610 = G__6611;
      continue
    }else {
    }
    break
  }
  narr[l] = k;
  narr[l + 1] = v;
  return narr
};
cljs.core.PersistentArrayMapSeq = function(arr, i, _meta) {
  this.arr = arr;
  this.i = i;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374990
};
cljs.core.PersistentArrayMapSeq.cljs$lang$type = true;
cljs.core.PersistentArrayMapSeq.cljs$lang$ctorStr = "cljs.core/PersistentArrayMapSeq";
cljs.core.PersistentArrayMapSeq.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/PersistentArrayMapSeq")
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.hash_coll.call(null, coll__$1)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.i < self__.arr.length - 2) {
    return new cljs.core.PersistentArrayMapSeq(self__.arr, self__.i + 2, self__._meta)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.cons.call(null, o, coll__$1)
};
cljs.core.PersistentArrayMapSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, coll__$1)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, start, coll__$1)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return coll__$1
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return(self__.arr.length - self__.i) / 2
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.PersistentVector.fromArray([self__.arr[self__.i], self__.arr[self__.i + 1]], true)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.i < self__.arr.length - 2) {
    return new cljs.core.PersistentArrayMapSeq(self__.arr, self__.i + 2, self__._meta)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentArrayMapSeq(self__.arr, self__.i, new_meta)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__._meta
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__._meta)
};
cljs.core.__GT_PersistentArrayMapSeq = function __GT_PersistentArrayMapSeq(arr, i, _meta) {
  return new cljs.core.PersistentArrayMapSeq(arr, i, _meta)
};
cljs.core.persistent_array_map_seq = function persistent_array_map_seq(arr, i, _meta) {
  if(i <= arr.length - 2) {
    return new cljs.core.PersistentArrayMapSeq(arr, i, _meta)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorStr = "cljs.core/PersistentArrayMap";
cljs.core.PersistentArrayMap.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.TransientArrayMap({}, self__.arr.length, self__.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_imap.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._lookup.call(null, coll__$1, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var coll__$1 = this;
  var idx = cljs.core.array_map_index_of.call(null, coll__$1, k);
  if(idx === -1) {
    return not_found
  }else {
    return self__.arr[idx + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var coll__$1 = this;
  var idx = cljs.core.array_map_index_of.call(null, coll__$1, k);
  if(idx === -1) {
    if(self__.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      var arr__$1 = cljs.core.array_map_extend_kv.call(null, coll__$1, k, v);
      return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt + 1, arr__$1, null)
    }else {
      return cljs.core._with_meta.call(null, cljs.core._assoc.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll__$1), k, v), self__.meta)
    }
  }else {
    if(v === self__.arr[idx + 1]) {
      return coll__$1
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        var arr__$1 = function() {
          var G__6613 = self__.arr.slice();
          G__6613[idx + 1] = v;
          return G__6613
        }();
        return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt, arr__$1, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  return!(cljs.core.array_map_index_of.call(null, coll__$1, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__6614 = null;
  var G__6614__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
  };
  var G__6614__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
  };
  G__6614 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6614__2.call(this, self__, k);
      case 3:
        return G__6614__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6614
}();
cljs.core.PersistentArrayMap.prototype.apply = function(self__, args6612) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6612.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$_invoke$arity$1 = function(k) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$_invoke$arity$2 = function(k, not_found) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var coll__$1 = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = f.call(null, init__$1, self__.arr[i], self__.arr[i + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__6615 = i + 2;
        var G__6616 = init__$2;
        i = G__6615;
        init__$1 = G__6616;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  var coll__$1 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll__$1, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll__$1, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.persistent_array_map_seq.call(null, self__.arr, 0, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_map.call(null, coll__$1, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentArrayMap(meta__$1, self__.cnt, self__.arr, self__.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, self__.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  var idx = cljs.core.array_map_index_of.call(null, coll__$1, k);
  if(idx >= 0) {
    var len = self__.arr.length;
    var new_len = len - 2;
    if(new_len === 0) {
      return cljs.core._empty.call(null, coll__$1)
    }else {
      var new_arr = new Array(new_len);
      var s = 0;
      var d = 0;
      while(true) {
        if(s >= len) {
          return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt - 1, new_arr, null)
        }else {
          if(cljs.core._EQ_.call(null, k, self__.arr[s])) {
            var G__6617 = s + 2;
            var G__6618 = d;
            s = G__6617;
            d = G__6618;
            continue
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              new_arr[d] = self__.arr[s];
              new_arr[d + 1] = self__.arr[s + 1];
              var G__6619 = s + 2;
              var G__6620 = d + 2;
              s = G__6619;
              d = G__6620;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll__$1
  }
};
cljs.core.__GT_PersistentArrayMap = function __GT_PersistentArrayMap(meta, cnt, arr, __hash) {
  return new cljs.core.PersistentArrayMap(meta, cnt, arr, __hash)
};
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 8;
cljs.core.PersistentArrayMap.fromArray = function(arr, no_clone) {
  var arr__$1 = no_clone ? arr : arr.slice();
  var cnt = arr__$1.length / 2;
  return new cljs.core.PersistentArrayMap(null, cnt, arr__$1, null)
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorStr = "cljs.core/TransientArrayMap";
cljs.core.TransientArrayMap.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  var tcoll__$1 = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll__$1, key);
    if(idx >= 0) {
      self__.arr[idx] = self__.arr[self__.len - 2];
      self__.arr[idx + 1] = self__.arr[self__.len - 1];
      var G__6621_6623 = self__.arr;
      G__6621_6623.pop();
      G__6621_6623.pop();
      self__.len = self__.len - 2
    }else {
    }
    return tcoll__$1
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  var tcoll__$1 = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll__$1, key);
    if(idx === -1) {
      if(self__.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        self__.len = self__.len + 2;
        self__.arr.push(key);
        self__.arr.push(val);
        return tcoll__$1
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, self__.len, self__.arr), key, val)
      }
    }else {
      if(val === self__.arr[idx + 1]) {
        return tcoll__$1
      }else {
        self__.arr[idx + 1] = val;
        return tcoll__$1
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  var tcoll__$1 = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    if(function() {
      var G__6622 = o;
      if(G__6622) {
        var bit__3746__auto__ = G__6622.cljs$lang$protocol_mask$partition0$ & 2048;
        if(bit__3746__auto__ || G__6622.cljs$core$IMapEntry$) {
          return true
        }else {
          if(!G__6622.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IMapEntry, G__6622)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IMapEntry, G__6622)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll__$1, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq.call(null, o);
      var tcoll__$2 = tcoll__$1;
      while(true) {
        var temp__4090__auto__ = cljs.core.first.call(null, es);
        if(cljs.core.truth_(temp__4090__auto__)) {
          var e = temp__4090__auto__;
          var G__6624 = cljs.core.next.call(null, es);
          var G__6625 = cljs.core._assoc_BANG_.call(null, tcoll__$2, cljs.core.key.call(null, e), cljs.core.val.call(null, e));
          es = G__6624;
          tcoll__$2 = G__6625;
          continue
        }else {
          return tcoll__$2
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  var tcoll__$1 = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    self__.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, self__.len, 2), self__.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  var tcoll__$1 = this;
  return cljs.core._lookup.call(null, tcoll__$1, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  var tcoll__$1 = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll__$1, k);
    if(idx === -1) {
      return not_found
    }else {
      return self__.arr[idx + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  var tcoll__$1 = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    return cljs.core.quot.call(null, self__.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.__GT_TransientArrayMap = function __GT_TransientArrayMap(editable_QMARK_, len, arr) {
  return new cljs.core.TransientArrayMap(editable_QMARK_, len, arr)
};
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  var i = 0;
  while(true) {
    if(i < len) {
      var G__6626 = cljs.core.assoc_BANG_.call(null, out, arr[i], arr[i + 1]);
      var G__6627 = i + 2;
      out = G__6626;
      i = G__6627;
      continue
    }else {
      return out
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorStr = "cljs.core/Box";
cljs.core.Box.cljs$lang$ctorPrWriter = function(this__3667__auto__, writer__3668__auto__, opts__3669__auto__) {
  return cljs.core._write.call(null, writer__3668__auto__, "cljs.core/Box")
};
cljs.core.__GT_Box = function __GT_Box(val) {
  return new cljs.core.Box(val)
};
cljs.core.key_test = function key_test(key, other) {
  if(key === other) {
    return true
  }else {
    if(cljs.core.keyword_identical_QMARK_.call(null, key, other)) {
      return true
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return cljs.core._EQ_.call(null, key, other)
      }else {
        return null
      }
    }
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__6630 = arr.slice();
    G__6630[i] = a;
    return G__6630
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__6631 = arr.slice();
    G__6631[i] = a;
    G__6631[j] = b;
    return G__6631
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  clone_and_set.cljs$core$IFn$_invoke$arity$3 = clone_and_set__3;
  clone_and_set.cljs$core$IFn$_invoke$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr = new Array(arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr, 2 * i, new_arr.length - 2 * i);
  return new_arr
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    return editable
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    editable.arr[j] = b;
    return editable
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  edit_and_set.cljs$core$IFn$_invoke$arity$4 = edit_and_set__4;
  edit_and_set.cljs$core$IFn$_invoke$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len = arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = function() {
        var k = arr[i];
        if(!(k == null)) {
          return f.call(null, init__$1, k, arr[i + 1])
        }else {
          var node = arr[i + 1];
          if(!(node == null)) {
            return node.kv_reduce(f, init__$1)
          }else {
            return init__$1
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__6632 = i + 2;
        var G__6633 = init__$2;
        i = G__6632;
        init__$1 = G__6633;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorStr = "cljs.core/BitmapIndexedNode";
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var self__ = this;
  var inode = this;
  if(self__.bitmap === bit) {
    return null
  }else {
    var editable = inode.ensure_editable(e);
    var earr = editable.arr;
    var len = earr.length;
    editable.bitmap = bit ^ editable.bitmap;
    cljs.core.array_copy.call(null, earr, 2 * (i + 1), earr, 2 * i, len - 2 * (i + 1));
    earr[len - 2] = null;
    earr[len - 1] = null;
    return editable
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    if(2 * n < self__.arr.length) {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr, 2 * idx, earr, 2 * (idx + 1), 2 * (n - idx));
      earr[2 * idx] = key;
      earr[2 * idx + 1] = val;
      editable.bitmap = editable.bitmap | bit;
      return editable
    }else {
      if(n >= 16) {
        var nodes = new Array(32);
        var jdx = hash >>> shift & 31;
        nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i_6634 = 0;
        var j_6635 = 0;
        while(true) {
          if(i_6634 < 32) {
            if((self__.bitmap >>> i_6634 & 1) === 0) {
              var G__6636 = i_6634 + 1;
              var G__6637 = j_6635;
              i_6634 = G__6636;
              j_6635 = G__6637;
              continue
            }else {
              nodes[i_6634] = !(self__.arr[j_6635] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, cljs.core.hash.call(null, self__.arr[j_6635]), self__.arr[j_6635], self__.arr[j_6635 + 1], added_leaf_QMARK_) : self__.arr[j_6635 + 1];
              var G__6638 = i_6634 + 1;
              var G__6639 = j_6635 + 2;
              i_6634 = G__6638;
              j_6635 = G__6639;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit__$1, n + 1, nodes)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var new_arr = new Array(2 * (n + 4));
          cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * idx);
          new_arr[2 * idx] = key;
          new_arr[2 * idx + 1] = val;
          cljs.core.array_copy.call(null, self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
          added_leaf_QMARK_.val = true;
          var editable = inode.ensure_editable(edit__$1);
          editable.arr = new_arr;
          editable.bitmap = editable.bitmap | bit;
          return editable
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, n)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, val)
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.call(null, edit__$1, shift + 5, key_or_nil, val_or_node, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, n)
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return inode.edit_and_remove_pair(edit__$1, bit, idx)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        removed_leaf_QMARK_[0] = true;
        return inode.edit_and_remove_pair(edit__$1, bit, idx)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    var new_arr = new Array(n < 0 ? 4 : 2 * (n + 1));
    cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * n);
    return new cljs.core.BitmapIndexedNode(e, self__.bitmap, new_arr)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce.call(null, self__.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil, val_or_node], true)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without(shift + 5, hash, key);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, n))
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair.call(null, self__.arr, idx))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair.call(null, self__.arr, idx))
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    if(n >= 16) {
      var nodes = new Array(32);
      var jdx = hash >>> shift & 31;
      nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i_6640 = 0;
      var j_6641 = 0;
      while(true) {
        if(i_6640 < 32) {
          if((self__.bitmap >>> i_6640 & 1) === 0) {
            var G__6642 = i_6640 + 1;
            var G__6643 = j_6641;
            i_6640 = G__6642;
            j_6641 = G__6643;
            continue
          }else {
            nodes[i_6640] = !(self__.arr[j_6641] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, self__.arr[j_6641]), self__.arr[j_6641], self__.arr[j_6641 + 1], added_leaf_QMARK_) : self__.arr[j_6641 + 1];
            var G__6644 = i_6640 + 1;
            var G__6645 = j_6641 + 2;
            i_6640 = G__6644;
            j_6641 = G__6645;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n + 1, nodes)
    }else {
      var new_arr = new Array(2 * (n + 1));
      cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * idx);
      new_arr[2 * idx] = key;
      new_arr[2 * idx + 1] = val;
      cljs.core.array_copy.call(null, self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, self__.bitmap | bit, new_arr)
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, n))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, val))
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil, val_or_node, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return val_or_node
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.__GT_BitmapIndexedNode = function __GT_BitmapIndexedNode(edit, bitmap, arr) {
  return new cljs.core.BitmapIndexedNode(edit, bitmap, arr)
};
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, new Array(0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr = array_node.arr;
  var len = 2 * (array_node.cnt - 1);
  var new_arr = new Array(len);
  var i = 0;
  var j = 1;
  var bitmap = 0;
  while(true) {
    if(i < len) {
      if(!(i === idx) && !(arr[i] == null)) {
        new_arr[j] = arr[i];
        var G__6646 = i + 1;
        var G__6647 = j + 2;
        var G__6648 = bitmap | 1 << i;
        i = G__6646;
        j = G__6647;
        bitmap = G__6648;
        continue
      }else {
        var G__6649 = i + 1;
        var G__6650 = j;
        var G__6651 = bitmap;
        i = G__6649;
        j = G__6650;
        bitmap = G__6651;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap, new_arr)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorStr = "cljs.core/ArrayNode";
cljs.core.ArrayNode.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable.cnt = editable.cnt + 1;
    return editable
  }else {
    var n = node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_array_node_seq.call(null, self__.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return inode
  }else {
    var n = node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode, edit__$1, idx)
        }else {
          var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n);
          editable.cnt = editable.cnt - 1;
          return editable
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    return new cljs.core.ArrayNode(e, self__.cnt, self__.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var node = self__.arr[i];
      if(!(node == null)) {
        var init__$2 = node.kv_reduce(f, init__$1);
        if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
          return cljs.core.deref.call(null, init__$2)
        }else {
          var G__6652 = i + 1;
          var G__6653 = init__$2;
          i = G__6652;
          init__$1 = G__6653;
          continue
        }
      }else {
        var G__6654 = i + 1;
        var G__6655 = init__$1;
        i = G__6654;
        init__$1 = G__6655;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    var n = node.inode_without(shift + 5, hash, key);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode, null, idx)
        }else {
          return new cljs.core.ArrayNode(null, self__.cnt - 1, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
        }else {
          return null
        }
      }
    }
  }else {
    return inode
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return new cljs.core.ArrayNode(null, self__.cnt + 1, cljs.core.clone_and_set.call(null, self__.arr, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n = node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.__GT_ArrayNode = function __GT_ArrayNode(edit, cnt, arr) {
  return new cljs.core.ArrayNode(edit, cnt, arr)
};
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim = 2 * cnt;
  var i = 0;
  while(true) {
    if(i < lim) {
      if(cljs.core.key_test.call(null, key, arr[i])) {
        return i
      }else {
        var G__6656 = i + 2;
        i = G__6656;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorStr = "cljs.core/HashCollisionNode";
cljs.core.HashCollisionNode.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
    if(idx === -1) {
      if(self__.arr.length > 2 * self__.cnt) {
        var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * self__.cnt, key, 2 * self__.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable.cnt = editable.cnt + 1;
        return editable
      }else {
        var len = self__.arr.length;
        var new_arr = new Array(len + 2);
        cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, len);
        new_arr[len] = key;
        new_arr[len + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode.ensure_editable_array(edit__$1, self__.cnt + 1, new_arr)
      }
    }else {
      if(self__.arr[idx + 1] === val) {
        return inode
      }else {
        return cljs.core.edit_and_set.call(null, inode, edit__$1, idx + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit__$1, 1 << (self__.collision_hash >>> shift & 31), [null, inode, null, null])).inode_assoc_BANG_(edit__$1, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    removed_leaf_QMARK_[0] = true;
    if(self__.cnt === 1) {
      return null
    }else {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      earr[idx] = earr[2 * self__.cnt - 2];
      earr[idx + 1] = earr[2 * self__.cnt - 1];
      earr[2 * self__.cnt - 1] = null;
      earr[2 * self__.cnt - 2] = null;
      editable.cnt = editable.cnt - 1;
      return editable
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var new_arr = new Array(2 * (self__.cnt + 1));
    cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * self__.cnt);
    return new cljs.core.HashCollisionNode(e, self__.collision_hash, self__.cnt, new_arr)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce.call(null, self__.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, self__.arr[idx])) {
      return cljs.core.PersistentVector.fromArray([self__.arr[idx], self__.arr[idx + 1]], true)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    if(self__.cnt === 1) {
      return null
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt - 1, cljs.core.remove_pair.call(null, self__.arr, cljs.core.quot.call(null, idx, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
    if(idx === -1) {
      var len = 2 * self__.cnt;
      var new_arr = new Array(len + 2);
      cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, len);
      new_arr[len] = key;
      new_arr[len + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt + 1, new_arr)
    }else {
      if(cljs.core._EQ_.call(null, self__.arr[idx], val)) {
        return inode
      }else {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (self__.collision_hash >>> shift & 31), [null, inode])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, self__.arr[idx])) {
      return self__.arr[idx + 1]
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    self__.arr = array;
    self__.cnt = count;
    return inode
  }else {
    return new cljs.core.HashCollisionNode(self__.edit, self__.collision_hash, count, array)
  }
};
cljs.core.__GT_HashCollisionNode = function __GT_HashCollisionNode(edit, collision_hash, cnt, arr) {
  return new cljs.core.HashCollisionNode(edit, collision_hash, cnt, arr)
};
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.call(null, key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.call(null, key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_node.cljs$core$IFn$_invoke$arity$6 = create_node__6;
  create_node.cljs$core$IFn$_invoke$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374860
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorStr = "cljs.core/NodeSeq";
cljs.core.NodeSeq.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.cons.call(null, o, coll__$1)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.NodeSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, coll__$1)
};
cljs.core.NodeSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, start, coll__$1)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  var this$__$1 = this;
  return this$__$1
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.s == null) {
    return cljs.core.PersistentVector.fromArray([self__.nodes[self__.i], self__.nodes[self__.i + 1]], true)
  }else {
    return cljs.core.first.call(null, self__.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.s == null) {
    return cljs.core.create_inode_seq.call(null, self__.nodes, self__.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, self__.nodes, self__.i, cljs.core.next.call(null, self__.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.NodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_NodeSeq = function __GT_NodeSeq(meta, nodes, i, s, __hash) {
  return new cljs.core.NodeSeq(meta, nodes, i, s, __hash)
};
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          if(!(nodes[j] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j, null, null)
          }else {
            var temp__4090__auto__ = nodes[j + 1];
            if(cljs.core.truth_(temp__4090__auto__)) {
              var node = temp__4090__auto__;
              var temp__4090__auto____$1 = node.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____$1)) {
                var node_seq = temp__4090__auto____$1;
                return new cljs.core.NodeSeq(null, nodes, j + 2, node_seq, null)
              }else {
                var G__6657 = j + 2;
                j = G__6657;
                continue
              }
            }else {
              var G__6658 = j + 2;
              j = G__6658;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_inode_seq.cljs$core$IFn$_invoke$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$core$IFn$_invoke$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374860
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorStr = "cljs.core/ArrayNodeSeq";
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.cons.call(null, o, coll__$1)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, coll__$1)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, start, coll__$1)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  var this$__$1 = this;
  return this$__$1
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.first.call(null, self__.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.create_array_node_seq.call(null, null, self__.nodes, self__.i, cljs.core.next.call(null, self__.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.ArrayNodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_ArrayNodeSeq = function __GT_ArrayNodeSeq(meta, nodes, i, s, __hash) {
  return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, __hash)
};
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          var temp__4090__auto__ = nodes[j];
          if(cljs.core.truth_(temp__4090__auto__)) {
            var nj = temp__4090__auto__;
            var temp__4090__auto____$1 = nj.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____$1)) {
              var ns = temp__4090__auto____$1;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j + 1, ns, null)
            }else {
              var G__6659 = j + 1;
              j = G__6659;
              continue
            }
          }else {
            var G__6660 = j + 1;
            j = G__6660;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_array_node_seq.cljs$core$IFn$_invoke$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$core$IFn$_invoke$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorStr = "cljs.core/PersistentHashMap";
cljs.core.PersistentHashMap.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.TransientHashMap({}, self__.root, self__.cnt, self__.has_nil_QMARK_, self__.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_imap.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._lookup.call(null, coll__$1, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var coll__$1 = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var coll__$1 = this;
  if(k == null) {
    if(self__.has_nil_QMARK_ && v === self__.nil_val) {
      return coll__$1
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, self__.has_nil_QMARK_ ? self__.cnt : self__.cnt + 1, self__.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK_ = new cljs.core.Box(false);
    var new_root = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK_);
    if(new_root === self__.root) {
      return coll__$1
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, added_leaf_QMARK_.val ? self__.cnt + 1 : self__.cnt, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  if(k == null) {
    return self__.has_nil_QMARK_
  }else {
    if(self__.root == null) {
      return false
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return!(self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__6662 = null;
  var G__6662__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
  };
  var G__6662__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
  };
  G__6662 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6662__2.call(this, self__, k);
      case 3:
        return G__6662__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6662
}();
cljs.core.PersistentHashMap.prototype.apply = function(self__, args6661) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6661.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$_invoke$arity$1 = function(k) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$_invoke$arity$2 = function(k, not_found) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var coll__$1 = this;
  var init__$1 = self__.has_nil_QMARK_ ? f.call(null, init, null, self__.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
    return cljs.core.deref.call(null, init__$1)
  }else {
    if(!(self__.root == null)) {
      return self__.root.kv_reduce(f, init__$1)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return init__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  var coll__$1 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll__$1, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll__$1, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.cnt > 0) {
    var s = !(self__.root == null) ? self__.root.inode_seq() : null;
    if(self__.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, self__.nil_val], true), s)
    }else {
      return s
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_map.call(null, coll__$1, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentHashMap(meta__$1, self__.cnt, self__.root, self__.has_nil_QMARK_, self__.nil_val, self__.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, self__.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, self__.root, false, null, null)
    }else {
      return coll__$1
    }
  }else {
    if(self__.root == null) {
      return coll__$1
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        var new_root = self__.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root === self__.root) {
          return coll__$1
        }else {
          return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.__GT_PersistentHashMap = function __GT_PersistentHashMap(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  return new cljs.core.PersistentHashMap(meta, cnt, root, has_nil_QMARK_, nil_val, __hash)
};
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len = ks.length;
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i < len) {
      var G__6663 = i + 1;
      var G__6664 = cljs.core.assoc_BANG_.call(null, out, ks[i], vs[i]);
      i = G__6663;
      out = G__6664;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorStr = "cljs.core/TransientHashMap";
cljs.core.TransientHashMap.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  var tcoll__$1 = this;
  return tcoll__$1.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  var tcoll__$1 = this;
  return tcoll__$1.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var self__ = this;
  var tcoll__$1 = this;
  return tcoll__$1.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  var tcoll__$1 = this;
  return tcoll__$1.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  var tcoll__$1 = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return null
    }
  }else {
    if(self__.root == null) {
      return null
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  var tcoll__$1 = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.edit) {
    return self__.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(function() {
      var G__6665 = o;
      if(G__6665) {
        var bit__3746__auto__ = G__6665.cljs$lang$protocol_mask$partition0$ & 2048;
        if(bit__3746__auto__ || G__6665.cljs$core$IMapEntry$) {
          return true
        }else {
          if(!G__6665.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IMapEntry, G__6665)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IMapEntry, G__6665)
      }
    }()) {
      return tcoll.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq.call(null, o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__4090__auto__ = cljs.core.first.call(null, es);
        if(cljs.core.truth_(temp__4090__auto__)) {
          var e = temp__4090__auto__;
          var G__6666 = cljs.core.next.call(null, es);
          var G__6667 = tcoll__$1.assoc_BANG_(cljs.core.key.call(null, e), cljs.core.val.call(null, e));
          es = G__6666;
          tcoll__$1 = G__6667;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.nil_val === v) {
      }else {
        self__.nil_val = v
      }
      if(self__.has_nil_QMARK_) {
      }else {
        self__.count = self__.count + 1;
        self__.has_nil_QMARK_ = true
      }
      return tcoll
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      var node = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc_BANG_(self__.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK_);
      if(node === self__.root) {
      }else {
        self__.root = node
      }
      if(added_leaf_QMARK_.val) {
        self__.count = self__.count + 1
      }else {
      }
      return tcoll
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.has_nil_QMARK_) {
        self__.has_nil_QMARK_ = false;
        self__.nil_val = null;
        self__.count = self__.count - 1;
        return tcoll
      }else {
        return tcoll
      }
    }else {
      if(self__.root == null) {
        return tcoll
      }else {
        var removed_leaf_QMARK_ = new cljs.core.Box(false);
        var node = self__.root.inode_without_BANG_(self__.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK_);
        if(node === self__.root) {
        }else {
          self__.root = node
        }
        if(cljs.core.truth_(removed_leaf_QMARK_[0])) {
          self__.count = self__.count - 1
        }else {
        }
        return tcoll
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    self__.edit = null;
    return new cljs.core.PersistentHashMap(null, self__.count, self__.root, self__.has_nil_QMARK_, self__.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.__GT_TransientHashMap = function __GT_TransientHashMap(edit, root, count, has_nil_QMARK_, nil_val) {
  return new cljs.core.TransientHashMap(edit, root, count, has_nil_QMARK_, nil_val)
};
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t = node;
  var stack__$1 = stack;
  while(true) {
    if(!(t == null)) {
      var G__6668 = ascending_QMARK_ ? t.left : t.right;
      var G__6669 = cljs.core.conj.call(null, stack__$1, t);
      t = G__6668;
      stack__$1 = G__6669;
      continue
    }else {
      return stack__$1
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374862
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorStr = "cljs.core/PersistentTreeMapSeq";
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.cons.call(null, o, coll__$1)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, coll__$1)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, start, coll__$1)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  var this$__$1 = this;
  return this$__$1
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll__$1)) + 1
  }else {
    return self__.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var self__ = this;
  var this$__$1 = this;
  return cljs.core.peek.call(null, self__.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var self__ = this;
  var this$__$1 = this;
  var t = cljs.core.first.call(null, self__.stack);
  var next_stack = cljs.core.tree_map_seq_push.call(null, self__.ascending_QMARK_ ? t.right : t.left, cljs.core.next.call(null, self__.stack), self__.ascending_QMARK_);
  if(!(next_stack == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack, self__.ascending_QMARK_, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentTreeMapSeq(meta__$1, self__.stack, self__.ascending_QMARK_, self__.cnt, self__.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentTreeMapSeq = function __GT_PersistentTreeMapSeq(meta, stack, ascending_QMARK_, cnt, __hash) {
  return new cljs.core.PersistentTreeMapSeq(meta, stack, ascending_QMARK_, cnt, __hash)
};
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(ins instanceof cljs.core.RedNode) {
    if(ins.left instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(ins.right instanceof cljs.core.RedNode) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(ins instanceof cljs.core.RedNode) {
    if(ins.right instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(ins.left instanceof cljs.core.RedNode) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(del instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(right instanceof cljs.core.BlackNode) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(right instanceof cljs.core.RedNode && right.left instanceof cljs.core.BlackNode) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(del instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(left instanceof cljs.core.BlackNode) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(left instanceof cljs.core.RedNode && left.right instanceof cljs.core.BlackNode) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__$1 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
    return cljs.core.deref.call(null, init__$1)
  }else {
    var init__$2 = f.call(null, init__$1, node.key, node.val);
    if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
      return cljs.core.deref.call(null, init__$2)
    }else {
      var init__$3 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__$2) : init__$2;
      if(cljs.core.reduced_QMARK_.call(null, init__$3)) {
        return cljs.core.deref.call(null, init__$3)
      }else {
        return init__$3
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorStr = "cljs.core/BlackNode";
cljs.core.BlackNode.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core._nth.call(null, node__$1, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core._nth.call(null, node__$1, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__6671 = null;
  var G__6671__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(null, k)
  };
  var G__6671__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
  };
  G__6671 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6671__2.call(this, self__, k);
      case 3:
        return G__6671__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6671
}();
cljs.core.BlackNode.prototype.apply = function(self__, args6670) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6670.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$IFn$_invoke$arity$1 = function(k) {
  var self__ = this;
  var node = this;
  return node.cljs$core$ILookup$_lookup$arity$2(null, k)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$_invoke$arity$2 = function(k, not_found) {
  var self__ = this;
  var node = this;
  return node.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return self__.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return self__.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_right(node)
};
cljs.core.BlackNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_right_del.call(null, self__.key, self__.val, self__.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce.call(null, node, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_left_del.call(null, self__.key, self__.val, del, self__.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_left(node)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
};
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return node
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.ci_reduce.call(null, node__$1, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.ci_reduce.call(null, node__$1, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return self__.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  var node__$1 = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  var node__$1 = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.__GT_BlackNode = function __GT_BlackNode(key, val, left, right, __hash) {
  return new cljs.core.BlackNode(key, val, left, right, __hash)
};
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorStr = "cljs.core/RedNode";
cljs.core.RedNode.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core._nth.call(null, node__$1, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core._nth.call(null, node__$1, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__6673 = null;
  var G__6673__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(null, k)
  };
  var G__6673__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
  };
  G__6673 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6673__2.call(this, self__, k);
      case 3:
        return G__6673__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6673
}();
cljs.core.RedNode.prototype.apply = function(self__, args6672) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6672.slice()))
};
cljs.core.RedNode.prototype.cljs$core$IFn$_invoke$arity$1 = function(k) {
  var self__ = this;
  var node = this;
  return node.cljs$core$ILookup$_lookup$arity$2(null, k)
};
cljs.core.RedNode.prototype.cljs$core$IFn$_invoke$arity$2 = function(k, not_found) {
  var self__ = this;
  var node = this;
  return node.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return self__.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return self__.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce.call(null, node, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, del, self__.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, ins, self__.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  if(self__.left instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(self__.key, self__.val, self__.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, self__.right, parent.right, null), null)
  }else {
    if(self__.right instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(self__.right.key, self__.right.val, new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, self__.right.right, parent.right, null), null)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  if(self__.right instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(self__.key, self__.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left, null), self__.right.blacken(), null)
  }else {
    if(self__.left instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(self__.left.key, self__.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left.left, null), new cljs.core.BlackNode(self__.key, self__.val, self__.left.right, self__.right, null), null)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.ci_reduce.call(null, node__$1, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.ci_reduce.call(null, node__$1, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return self__.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  var node__$1 = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  var node__$1 = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  var node__$1 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.__GT_RedNode = function __GT_RedNode(key, val, left, right, __hash) {
  return new cljs.core.RedNode(key, val, left, right, __hash)
};
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c = comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return null
    }else {
      if(c < 0) {
        var ins = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins == null)) {
          return tree.add_left(ins)
        }else {
          return null
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var ins = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins == null)) {
            return tree.add_right(ins)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(left instanceof cljs.core.RedNode) {
        if(right instanceof cljs.core.RedNode) {
          var app = tree_map_append.call(null, left.right, right.left);
          if(app instanceof cljs.core.RedNode) {
            return new cljs.core.RedNode(app.key, app.val, new cljs.core.RedNode(left.key, left.val, left.left, app.left, null), new cljs.core.RedNode(right.key, right.val, app.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(right instanceof cljs.core.RedNode) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            var app = tree_map_append.call(null, left.right, right.left);
            if(app instanceof cljs.core.RedNode) {
              return new cljs.core.RedNode(app.key, app.val, new cljs.core.BlackNode(left.key, left.val, left.left, app.left, null), new cljs.core.BlackNode(right.key, right.val, app.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c = comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c < 0) {
        var del = tree_map_remove.call(null, comp, tree.left, k, found);
        if(!(del == null) || !(found[0] == null)) {
          if(tree.left instanceof cljs.core.BlackNode) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var del = tree_map_remove.call(null, comp, tree.right, k, found);
          if(!(del == null) || !(found[0] == null)) {
            if(tree.right instanceof cljs.core.BlackNode) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk = tree.key;
  var c = comp.call(null, k, tk);
  if(c === 0) {
    return tree.replace(tk, v, tree.left, tree.right)
  }else {
    if(c < 0) {
      return tree.replace(tk, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return tree.replace(tk, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorStr = "cljs.core/PersistentTreeMap";
cljs.core.PersistentTreeMap.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_imap.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._lookup.call(null, coll__$1, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var coll__$1 = this;
  var n = coll__$1.entry_at(k);
  if(!(n == null)) {
    return n.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var coll__$1 = this;
  var found = [null];
  var t = cljs.core.tree_map_add.call(null, self__.comp, self__.tree, k, v, found);
  if(t == null) {
    var found_node = cljs.core.nth.call(null, found, 0);
    if(cljs.core._EQ_.call(null, v, found_node.val)) {
      return coll__$1
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, cljs.core.tree_map_replace.call(null, self__.comp, self__.tree, k, v), self__.cnt, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt + 1, self__.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  return!(coll__$1.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6675 = null;
  var G__6675__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
  };
  var G__6675__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
  };
  G__6675 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6675__2.call(this, self__, k);
      case 3:
        return G__6675__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6675
}();
cljs.core.PersistentTreeMap.prototype.apply = function(self__, args6674) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6674.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$_invoke$arity$1 = function(k) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$_invoke$arity$2 = function(k, not_found) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var coll__$1 = this;
  if(!(self__.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, self__.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  var coll__$1 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll__$1, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll__$1, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, false, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var self__ = this;
  var coll = this;
  var t = self__.tree;
  while(true) {
    if(!(t == null)) {
      var c = self__.comp.call(null, k, t.key);
      if(c === 0) {
        return t
      }else {
        if(c < 0) {
          var G__6676 = t.left;
          t = G__6676;
          continue
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            var G__6677 = t.right;
            t = G__6677;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, ascending_QMARK_, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.cnt > 0) {
    var stack = null;
    var t = self__.tree;
    while(true) {
      if(!(t == null)) {
        var c = self__.comp.call(null, k, t.key);
        if(c === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack, t), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c < 0) {
              var G__6678 = cljs.core.conj.call(null, stack, t);
              var G__6679 = t.left;
              stack = G__6678;
              t = G__6679;
              continue
            }else {
              var G__6680 = stack;
              var G__6681 = t.right;
              stack = G__6680;
              t = G__6681;
              continue
            }
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              if(c > 0) {
                var G__6682 = cljs.core.conj.call(null, stack, t);
                var G__6683 = t.right;
                stack = G__6682;
                t = G__6683;
                continue
              }else {
                var G__6684 = stack;
                var G__6685 = t.left;
                stack = G__6684;
                t = G__6685;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack == null) {
          return null
        }else {
          return new cljs.core.PersistentTreeMapSeq(null, stack, ascending_QMARK_, -1, null)
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, true, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_map.call(null, coll__$1, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentTreeMap(self__.comp, self__.tree, self__.cnt, meta__$1, self__.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, self__.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var coll__$1 = this;
  var found = [null];
  var t = cljs.core.tree_map_remove.call(null, self__.comp, self__.tree, k, found);
  if(t == null) {
    if(cljs.core.nth.call(null, found, 0) == null) {
      return coll__$1
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, null, 0, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt - 1, self__.meta, null)
  }
};
cljs.core.__GT_PersistentTreeMap = function __GT_PersistentTreeMap(comp, tree, cnt, meta, __hash) {
  return new cljs.core.PersistentTreeMap(comp, tree, cnt, meta, __hash)
};
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in$) {
        var G__6686 = cljs.core.nnext.call(null, in$);
        var G__6687 = cljs.core.assoc_BANG_.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__6686;
        out = G__6687;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__6688) {
    var keyvals = cljs.core.seq(arglist__6688);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$core$IFn$_invoke$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__6689) {
    var keyvals = cljs.core.seq(arglist__6689);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$core$IFn$_invoke$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks = [];
    var obj = {};
    var kvs = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs) {
        ks.push(cljs.core.first.call(null, kvs));
        obj[cljs.core.first.call(null, kvs)] = cljs.core.second.call(null, kvs);
        var G__6690 = cljs.core.nnext.call(null, kvs);
        kvs = G__6690;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks, obj)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__6691) {
    var keyvals = cljs.core.seq(arglist__6691);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$core$IFn$_invoke$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in$) {
        var G__6692 = cljs.core.nnext.call(null, in$);
        var G__6693 = cljs.core.assoc.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__6692;
        out = G__6693;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__6694) {
    var keyvals = cljs.core.seq(arglist__6694);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$core$IFn$_invoke$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = new cljs.core.PersistentTreeMap(cljs.core.fn__GT_comparator.call(null, comparator), null, 0, null, 0);
    while(true) {
      if(in$) {
        var G__6695 = cljs.core.nnext.call(null, in$);
        var G__6696 = cljs.core.assoc.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__6695;
        out = G__6696;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(arguments.length > 1) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__6697) {
    var comparator = cljs.core.first(arglist__6697);
    var keyvals = cljs.core.rest(arglist__6697);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$core$IFn$_invoke$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.KeySeq = function(mseq, _meta) {
  this.mseq = mseq;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374988
};
cljs.core.KeySeq.cljs$lang$type = true;
cljs.core.KeySeq.cljs$lang$ctorStr = "cljs.core/KeySeq";
cljs.core.KeySeq.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/KeySeq")
};
cljs.core.KeySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.hash_coll.call(null, coll__$1)
};
cljs.core.KeySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var nseq = function() {
    var G__6698 = self__.mseq;
    if(G__6698) {
      var bit__3746__auto__ = G__6698.cljs$lang$protocol_mask$partition0$ & 128;
      if(bit__3746__auto__ || G__6698.cljs$core$INext$) {
        return true
      }else {
        if(!G__6698.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.INext, G__6698)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.INext, G__6698)
    }
  }() ? cljs.core._next.call(null, self__.mseq) : cljs.core.next.call(null, self__.mseq);
  if(nseq == null) {
    return null
  }else {
    return new cljs.core.KeySeq(nseq, self__._meta)
  }
};
cljs.core.KeySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.cons.call(null, o, coll__$1)
};
cljs.core.KeySeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.KeySeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, coll__$1)
};
cljs.core.KeySeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, start, coll__$1)
};
cljs.core.KeySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return coll__$1
};
cljs.core.KeySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var me = cljs.core._first.call(null, self__.mseq);
  return cljs.core._key.call(null, me)
};
cljs.core.KeySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var nseq = function() {
    var G__6699 = self__.mseq;
    if(G__6699) {
      var bit__3746__auto__ = G__6699.cljs$lang$protocol_mask$partition0$ & 128;
      if(bit__3746__auto__ || G__6699.cljs$core$INext$) {
        return true
      }else {
        if(!G__6699.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.INext, G__6699)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.INext, G__6699)
    }
  }() ? cljs.core._next.call(null, self__.mseq) : cljs.core.next.call(null, self__.mseq);
  if(!(nseq == null)) {
    return new cljs.core.KeySeq(nseq, self__._meta)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.KeySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.KeySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.KeySeq(self__.mseq, new_meta)
};
cljs.core.KeySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__._meta
};
cljs.core.KeySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__._meta)
};
cljs.core.__GT_KeySeq = function __GT_KeySeq(mseq, _meta) {
  return new cljs.core.KeySeq(mseq, _meta)
};
cljs.core.keys = function keys(hash_map) {
  var temp__4092__auto__ = cljs.core.seq.call(null, hash_map);
  if(temp__4092__auto__) {
    var mseq = temp__4092__auto__;
    return new cljs.core.KeySeq(mseq, null)
  }else {
    return null
  }
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.ValSeq = function(mseq, _meta) {
  this.mseq = mseq;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374988
};
cljs.core.ValSeq.cljs$lang$type = true;
cljs.core.ValSeq.cljs$lang$ctorStr = "cljs.core/ValSeq";
cljs.core.ValSeq.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/ValSeq")
};
cljs.core.ValSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.hash_coll.call(null, coll__$1)
};
cljs.core.ValSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var nseq = function() {
    var G__6700 = self__.mseq;
    if(G__6700) {
      var bit__3746__auto__ = G__6700.cljs$lang$protocol_mask$partition0$ & 128;
      if(bit__3746__auto__ || G__6700.cljs$core$INext$) {
        return true
      }else {
        if(!G__6700.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.INext, G__6700)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.INext, G__6700)
    }
  }() ? cljs.core._next.call(null, self__.mseq) : cljs.core.next.call(null, self__.mseq);
  if(nseq == null) {
    return null
  }else {
    return new cljs.core.ValSeq(nseq, self__._meta)
  }
};
cljs.core.ValSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.cons.call(null, o, coll__$1)
};
cljs.core.ValSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ValSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, coll__$1)
};
cljs.core.ValSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.seq_reduce.call(null, f, start, coll__$1)
};
cljs.core.ValSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return coll__$1
};
cljs.core.ValSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var me = cljs.core._first.call(null, self__.mseq);
  return cljs.core._val.call(null, me)
};
cljs.core.ValSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var nseq = function() {
    var G__6701 = self__.mseq;
    if(G__6701) {
      var bit__3746__auto__ = G__6701.cljs$lang$protocol_mask$partition0$ & 128;
      if(bit__3746__auto__ || G__6701.cljs$core$INext$) {
        return true
      }else {
        if(!G__6701.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.INext, G__6701)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.INext, G__6701)
    }
  }() ? cljs.core._next.call(null, self__.mseq) : cljs.core.next.call(null, self__.mseq);
  if(!(nseq == null)) {
    return new cljs.core.ValSeq(nseq, self__._meta)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.ValSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.equiv_sequential.call(null, coll__$1, other)
};
cljs.core.ValSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.ValSeq(self__.mseq, new_meta)
};
cljs.core.ValSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__._meta
};
cljs.core.ValSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__._meta)
};
cljs.core.__GT_ValSeq = function __GT_ValSeq(mseq, _meta) {
  return new cljs.core.ValSeq(mseq, _meta)
};
cljs.core.vals = function vals(hash_map) {
  var temp__4092__auto__ = cljs.core.seq.call(null, hash_map);
  if(temp__4092__auto__) {
    var mseq = temp__4092__auto__;
    return new cljs.core.ValSeq(mseq, null)
  }else {
    return null
  }
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__6702_SHARP_, p2__6703_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3128__auto__ = p1__6702_SHARP_;
          if(cljs.core.truth_(or__3128__auto__)) {
            return or__3128__auto__
          }else {
            return cljs.core.PersistentArrayMap.EMPTY
          }
        }(), p2__6703_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(arguments.length > 0) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__6704) {
    var maps = cljs.core.seq(arglist__6704);
    return merge__delegate(maps)
  };
  merge.cljs$core$IFn$_invoke$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry = function(m, e) {
        var k = cljs.core.first.call(null, e);
        var v = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k)) {
          return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), v))
        }else {
          return cljs.core.assoc.call(null, m, k, v)
        }
      };
      var merge2 = function(merge_entry) {
        return function(m1, m2) {
          return cljs.core.reduce.call(null, merge_entry, function() {
            var or__3128__auto__ = m1;
            if(cljs.core.truth_(or__3128__auto__)) {
              return or__3128__auto__
            }else {
              return cljs.core.PersistentArrayMap.EMPTY
            }
          }(), cljs.core.seq.call(null, m2))
        }
      }(merge_entry);
      return cljs.core.reduce.call(null, merge2, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(arguments.length > 1) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__6705) {
    var f = cljs.core.first(arglist__6705);
    var maps = cljs.core.rest(arglist__6705);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$core$IFn$_invoke$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret = cljs.core.PersistentArrayMap.EMPTY;
  var keys = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys) {
      var key = cljs.core.first.call(null, keys);
      var entry = cljs.core.get.call(null, map, key, new cljs.core.Keyword("cljs.core", "not-found", "cljs.core/not-found", 4155500789));
      var G__6706 = cljs.core.not_EQ_.call(null, entry, new cljs.core.Keyword("cljs.core", "not-found", "cljs.core/not-found", 4155500789)) ? cljs.core.assoc.call(null, ret, key, entry) : ret;
      var G__6707 = cljs.core.next.call(null, keys);
      ret = G__6706;
      keys = G__6707;
      continue
    }else {
      return ret
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorStr = "cljs.core/PersistentHashSet";
cljs.core.PersistentHashSet.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.TransientHashSet(cljs.core._as_transient.call(null, self__.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_iset.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._lookup.call(null, coll__$1, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  var coll__$1 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, self__.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6710 = null;
  var G__6710__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
  };
  var G__6710__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
  };
  G__6710 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6710__2.call(this, self__, k);
      case 3:
        return G__6710__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6710
}();
cljs.core.PersistentHashSet.prototype.apply = function(self__, args6709) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6709.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$_invoke$arity$1 = function(k) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$_invoke$arity$2 = function(k, not_found) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core.assoc.call(null, self__.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.keys.call(null, self__.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core._dissoc.call(null, self__.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._count.call(null, self__.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.set_QMARK_.call(null, other) && cljs.core.count.call(null, coll__$1) === cljs.core.count.call(null, other) && cljs.core.every_QMARK_.call(null, function(p1__6708_SHARP_) {
    return cljs.core.contains_QMARK_.call(null, coll__$1, p1__6708_SHARP_)
  }, other)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentHashSet(meta__$1, self__.hash_map, self__.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentHashSet = function __GT_PersistentHashSet(meta, hash_map, __hash) {
  return new cljs.core.PersistentHashSet(meta, hash_map, __hash)
};
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.PersistentArrayMap.EMPTY, 0);
cljs.core.PersistentHashSet.fromArray = function(items, no_clone) {
  var len = items.length;
  if(len / 2 <= cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
    var arr = no_clone ? items : items.slice();
    return new cljs.core.PersistentHashSet(null, cljs.core.PersistentArrayMap.fromArray.call(null, arr, true), null)
  }else {
    var i = 0;
    var out = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
    while(true) {
      if(i < len) {
        var G__6711 = i + 2;
        var G__6712 = cljs.core.conj_BANG_.call(null, out, items[i]);
        i = G__6711;
        out = G__6712;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 136
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorStr = "cljs.core/TransientHashSet";
cljs.core.TransientHashSet.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__6714 = null;
  var G__6714__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6714__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6714 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6714__2.call(this, self__, k);
      case 3:
        return G__6714__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6714
}();
cljs.core.TransientHashSet.prototype.apply = function(self__, args6713) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6713.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$_invoke$arity$1 = function(k) {
  var self__ = this;
  var tcoll = this;
  if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return null
  }else {
    return k
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$_invoke$arity$2 = function(k, not_found) {
  var self__ = this;
  var tcoll = this;
  if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return k
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var self__ = this;
  var tcoll__$1 = this;
  return cljs.core._lookup.call(null, tcoll__$1, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var self__ = this;
  var tcoll__$1 = this;
  if(cljs.core._lookup.call(null, self__.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  var tcoll__$1 = this;
  return cljs.core.count.call(null, self__.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var self__ = this;
  var tcoll__$1 = this;
  self__.transient_map = cljs.core.dissoc_BANG_.call(null, self__.transient_map, v);
  return tcoll__$1
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  var tcoll__$1 = this;
  self__.transient_map = cljs.core.assoc_BANG_.call(null, self__.transient_map, o, null);
  return tcoll__$1
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  var tcoll__$1 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, self__.transient_map), null)
};
cljs.core.__GT_TransientHashSet = function __GT_TransientHashSet(transient_map) {
  return new cljs.core.TransientHashSet(transient_map)
};
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorStr = "cljs.core/PersistentTreeSet";
cljs.core.PersistentTreeSet.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_iset.call(null, coll__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._lookup.call(null, coll__$1, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  var coll__$1 = this;
  var n = self__.tree_map.entry_at(v);
  if(!(n == null)) {
    return n.key
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6717 = null;
  var G__6717__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
  };
  var G__6717__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
  };
  G__6717 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6717__2.call(this, self__, k);
      case 3:
        return G__6717__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6717
}();
cljs.core.PersistentTreeSet.prototype.apply = function(self__, args6716) {
  var self__ = this;
  var self____$1 = this;
  return self____$1.call.apply(self____$1, [self____$1].concat(args6716.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$_invoke$arity$1 = function(k) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$2(null, k)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$_invoke$arity$2 = function(k, not_found) {
  var self__ = this;
  var coll = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(null, k, not_found)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.assoc.call(null, self__.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  if(cljs.core.count.call(null, self__.tree_map) > 0) {
    return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, self__.tree_map))
  }else {
    return null
  }
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, self__.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, self__.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  var coll__$1 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core._comparator.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.keys.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.dissoc.call(null, self__.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.count.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.set_QMARK_.call(null, other) && cljs.core.count.call(null, coll__$1) === cljs.core.count.call(null, other) && cljs.core.every_QMARK_.call(null, function(p1__6715_SHARP_) {
    return cljs.core.contains_QMARK_.call(null, coll__$1, p1__6715_SHARP_)
  }, other)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  var coll__$1 = this;
  return new cljs.core.PersistentTreeSet(meta__$1, self__.tree_map, self__.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return self__.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  var coll__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentTreeSet = function __GT_PersistentTreeSet(meta, tree_map, __hash) {
  return new cljs.core.PersistentTreeSet(meta, tree_map, __hash)
};
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.PersistentTreeMap.EMPTY, 0);
cljs.core.set_from_indexed_seq = function set_from_indexed_seq(iseq) {
  var arr = iseq.arr;
  var ret = function() {
    var a__3885__auto__ = arr;
    var i = 0;
    var res = cljs.core._as_transient.call(null, cljs.core.PersistentHashSet.EMPTY);
    while(true) {
      if(i < a__3885__auto__.length) {
        var G__6718 = i + 1;
        var G__6719 = cljs.core._conj_BANG_.call(null, res, arr[i]);
        i = G__6718;
        res = G__6719;
        continue
      }else {
        return res
      }
      break
    }
  }();
  return cljs.core._persistent_BANG_.call(null, ret)
};
cljs.core.set = function set(coll) {
  var in$ = cljs.core.seq.call(null, coll);
  if(in$ == null) {
    return cljs.core.PersistentHashSet.EMPTY
  }else {
    if(in$ instanceof cljs.core.IndexedSeq) {
      return cljs.core.set_from_indexed_seq.call(null, in$)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        var in$__$1 = in$;
        var out = cljs.core._as_transient.call(null, cljs.core.PersistentHashSet.EMPTY);
        while(true) {
          if(!(in$__$1 == null)) {
            var G__6720 = cljs.core._next.call(null, in$__$1);
            var G__6721 = cljs.core._conj_BANG_.call(null, out, cljs.core._first.call(null, in$__$1));
            in$__$1 = G__6720;
            out = G__6721;
            continue
          }else {
            return cljs.core._persistent_BANG_.call(null, out)
          }
          break
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__6722__delegate = function(keys) {
      return cljs.core.set.call(null, keys)
    };
    var G__6722 = function(var_args) {
      var keys = null;
      if(arguments.length > 0) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6722__delegate.call(this, keys)
    };
    G__6722.cljs$lang$maxFixedArity = 0;
    G__6722.cljs$lang$applyTo = function(arglist__6723) {
      var keys = cljs.core.seq(arglist__6723);
      return G__6722__delegate(keys)
    };
    G__6722.cljs$core$IFn$_invoke$arity$variadic = G__6722__delegate;
    return G__6722
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$core$IFn$_invoke$arity$0 = hash_set__0;
  hash_set.cljs$core$IFn$_invoke$arity$variadic = hash_set__1.cljs$core$IFn$_invoke$arity$variadic;
  return hash_set
}();
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(arguments.length > 0) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__6724) {
    var keys = cljs.core.seq(arglist__6724);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$core$IFn$_invoke$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(arguments.length > 1) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__6725) {
    var comparator = cljs.core.first(arglist__6725);
    var keys = cljs.core.rest(arglist__6725);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$core$IFn$_invoke$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__4090__auto__ = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__4090__auto__)) {
        var e = temp__4090__auto__;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6726_SHARP_) {
      var temp__4090__auto__ = cljs.core.find.call(null, smap, p1__6726_SHARP_);
      if(cljs.core.truth_(temp__4090__auto__)) {
        var e = temp__4090__auto__;
        return cljs.core.second.call(null, e)
      }else {
        return p1__6726_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step = function step(xs, seen) {
    return new cljs.core.LazySeq(null, function() {
      return function(p__6733, seen__$1) {
        while(true) {
          var vec__6734 = p__6733;
          var f = cljs.core.nth.call(null, vec__6734, 0, null);
          var xs__$1 = vec__6734;
          var temp__4092__auto__ = cljs.core.seq.call(null, xs__$1);
          if(temp__4092__auto__) {
            var s = temp__4092__auto__;
            if(cljs.core.contains_QMARK_.call(null, seen__$1, f)) {
              var G__6735 = cljs.core.rest.call(null, s);
              var G__6736 = seen__$1;
              p__6733 = G__6735;
              seen__$1 = G__6736;
              continue
            }else {
              return cljs.core.cons.call(null, f, step.call(null, cljs.core.rest.call(null, s), cljs.core.conj.call(null, seen__$1, f)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null, null)
  };
  return step.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret = cljs.core.PersistentVector.EMPTY;
  var s__$1 = s;
  while(true) {
    if(cljs.core.next.call(null, s__$1)) {
      var G__6737 = cljs.core.conj.call(null, ret, cljs.core.first.call(null, s__$1));
      var G__6738 = cljs.core.next.call(null, s__$1);
      ret = G__6737;
      s__$1 = G__6738;
      continue
    }else {
      return cljs.core.seq.call(null, ret)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(function() {
    var G__6740 = x;
    if(G__6740) {
      var bit__3739__auto__ = G__6740.cljs$lang$protocol_mask$partition1$ & 4096;
      if(bit__3739__auto__ || G__6740.cljs$core$INamed$) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._name.call(null, x)
  }else {
    if(typeof x === "string") {
      return x
    }else {
      throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var G__6742 = x;
    if(G__6742) {
      var bit__3739__auto__ = G__6742.cljs$lang$protocol_mask$partition1$ & 4096;
      if(bit__3739__auto__ || G__6742.cljs$core$INamed$) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._namespace.call(null, x)
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  var ks = cljs.core.seq.call(null, keys);
  var vs = cljs.core.seq.call(null, vals);
  while(true) {
    if(ks && vs) {
      var G__6743 = cljs.core.assoc_BANG_.call(null, map, cljs.core.first.call(null, ks), cljs.core.first.call(null, vs));
      var G__6744 = cljs.core.next.call(null, ks);
      var G__6745 = cljs.core.next.call(null, vs);
      map = G__6743;
      ks = G__6744;
      vs = G__6745;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, map)
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__6748__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6746_SHARP_, p2__6747_SHARP_) {
        return max_key.call(null, k, p1__6746_SHARP_, p2__6747_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6748 = function(k, x, y, var_args) {
      var more = null;
      if(arguments.length > 3) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6748__delegate.call(this, k, x, y, more)
    };
    G__6748.cljs$lang$maxFixedArity = 3;
    G__6748.cljs$lang$applyTo = function(arglist__6749) {
      var k = cljs.core.first(arglist__6749);
      arglist__6749 = cljs.core.next(arglist__6749);
      var x = cljs.core.first(arglist__6749);
      arglist__6749 = cljs.core.next(arglist__6749);
      var y = cljs.core.first(arglist__6749);
      var more = cljs.core.rest(arglist__6749);
      return G__6748__delegate(k, x, y, more)
    };
    G__6748.cljs$core$IFn$_invoke$arity$variadic = G__6748__delegate;
    return G__6748
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$core$IFn$_invoke$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$core$IFn$_invoke$arity$2 = max_key__2;
  max_key.cljs$core$IFn$_invoke$arity$3 = max_key__3;
  max_key.cljs$core$IFn$_invoke$arity$variadic = max_key__4.cljs$core$IFn$_invoke$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__6752__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6750_SHARP_, p2__6751_SHARP_) {
        return min_key.call(null, k, p1__6750_SHARP_, p2__6751_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6752 = function(k, x, y, var_args) {
      var more = null;
      if(arguments.length > 3) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6752__delegate.call(this, k, x, y, more)
    };
    G__6752.cljs$lang$maxFixedArity = 3;
    G__6752.cljs$lang$applyTo = function(arglist__6753) {
      var k = cljs.core.first(arglist__6753);
      arglist__6753 = cljs.core.next(arglist__6753);
      var x = cljs.core.first(arglist__6753);
      arglist__6753 = cljs.core.next(arglist__6753);
      var y = cljs.core.first(arglist__6753);
      var more = cljs.core.rest(arglist__6753);
      return G__6752__delegate(k, x, y, more)
    };
    G__6752.cljs$core$IFn$_invoke$arity$variadic = G__6752__delegate;
    return G__6752
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$core$IFn$_invoke$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$core$IFn$_invoke$arity$2 = min_key__2;
  min_key.cljs$core$IFn$_invoke$arity$3 = min_key__3;
  min_key.cljs$core$IFn$_invoke$arity$variadic = min_key__4.cljs$core$IFn$_invoke$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s)))
      }else {
        return null
      }
    }, null, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition_all.cljs$core$IFn$_invoke$arity$2 = partition_all__2;
  partition_all.cljs$core$IFn$_invoke$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s), take_while.call(null, pred, cljs.core.rest.call(null, s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp = cljs.core._comparator.call(null, sc);
    return test.call(null, comp.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, null, cljs.core._GT__EQ_, null], true).call(null, test))) {
      var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var vec__6756 = temp__4092__auto__;
        var e = cljs.core.nth.call(null, vec__6756, 0, null);
        var s = vec__6756;
        if(cljs.core.truth_(include.call(null, e))) {
          return s
        }else {
          return cljs.core.next.call(null, s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var vec__6757 = temp__4092__auto__;
      var e = cljs.core.nth.call(null, vec__6757, 0, null);
      var s = vec__6757;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e)) ? s : cljs.core.next.call(null, s))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subseq.cljs$core$IFn$_invoke$arity$3 = subseq__3;
  subseq.cljs$core$IFn$_invoke$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, null, cljs.core._LT__EQ_, null], true).call(null, test))) {
      var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var vec__6760 = temp__4092__auto__;
        var e = cljs.core.nth.call(null, vec__6760, 0, null);
        var s = vec__6760;
        if(cljs.core.truth_(include.call(null, e))) {
          return s
        }else {
          return cljs.core.next.call(null, s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var vec__6761 = temp__4092__auto__;
      var e = cljs.core.nth.call(null, vec__6761, 0, null);
      var s = vec__6761;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e)) ? s : cljs.core.next.call(null, s))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rsubseq.cljs$core$IFn$_invoke$arity$3 = rsubseq__3;
  rsubseq.cljs$core$IFn$_invoke$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorStr = "cljs.core/Range";
cljs.core.Range.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var self__ = this;
  var rng__$1 = this;
  var h__3532__auto__ = self__.__hash;
  if(!(h__3532__auto__ == null)) {
    return h__3532__auto__
  }else {
    var h__3532__auto____$1 = cljs.core.hash_coll.call(null, rng__$1);
    self__.__hash = h__3532__auto____$1;
    return h__3532__auto____$1
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var self__ = this;
  var rng__$1 = this;
  if(self__.step > 0) {
    if(self__.start + self__.step < self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }else {
    if(self__.start + self__.step > self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var self__ = this;
  var rng__$1 = this;
  return cljs.core.cons.call(null, o, rng__$1)
};
cljs.core.Range.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var self__ = this;
  var rng__$1 = this;
  return cljs.core.ci_reduce.call(null, rng__$1, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var self__ = this;
  var rng__$1 = this;
  return cljs.core.ci_reduce.call(null, rng__$1, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var self__ = this;
  var rng__$1 = this;
  if(self__.step > 0) {
    if(self__.start < self__.end) {
      return rng__$1
    }else {
      return null
    }
  }else {
    if(self__.start > self__.end) {
      return rng__$1
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var self__ = this;
  var rng__$1 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng__$1))) {
    return 0
  }else {
    return Math.ceil((self__.end - self__.start) / self__.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var self__ = this;
  var rng__$1 = this;
  return self__.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var self__ = this;
  var rng__$1 = this;
  if(!(cljs.core._seq.call(null, rng__$1) == null)) {
    return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var self__ = this;
  var rng__$1 = this;
  return cljs.core.equiv_sequential.call(null, rng__$1, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta__$1) {
  var self__ = this;
  var rng__$1 = this;
  return new cljs.core.Range(meta__$1, self__.start, self__.end, self__.step, self__.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var self__ = this;
  var rng__$1 = this;
  return self__.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var self__ = this;
  var rng__$1 = this;
  if(n < cljs.core._count.call(null, rng__$1)) {
    return self__.start + n * self__.step
  }else {
    if(self__.start > self__.end && self__.step === 0) {
      return self__.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var self__ = this;
  var rng__$1 = this;
  if(n < cljs.core._count.call(null, rng__$1)) {
    return self__.start + n * self__.step
  }else {
    if(self__.start > self__.end && self__.step === 0) {
      return self__.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var self__ = this;
  var rng__$1 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_Range = function __GT_Range(meta, start, end, step, __hash) {
  return new cljs.core.Range(meta, start, end, step, __hash)
};
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  range.cljs$core$IFn$_invoke$arity$0 = range__0;
  range.cljs$core$IFn$_invoke$arity$1 = range__1;
  range.cljs$core$IFn$_invoke$arity$2 = range__2;
  range.cljs$core$IFn$_invoke$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s), take_nth.call(null, n, cljs.core.drop.call(null, n, s)))
    }else {
      return null
    }
  }, null, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      var fst = cljs.core.first.call(null, s);
      var fv = f.call(null, fst);
      var run = cljs.core.cons.call(null, fst, cljs.core.take_while.call(null, function(fst, fv) {
        return function(p1__6762_SHARP_) {
          return cljs.core._EQ_.call(null, fv, f.call(null, p1__6762_SHARP_))
        }
      }(fst, fv), cljs.core.next.call(null, s)));
      return cljs.core.cons.call(null, run, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run), s))))
    }else {
      return null
    }
  }, null, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4090__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4090__auto__) {
        var s = temp__4090__auto__;
        return reductions.call(null, f, cljs.core.first.call(null, s), cljs.core.rest.call(null, s))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s)), cljs.core.rest.call(null, s))
      }else {
        return null
      }
    }, null, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reductions.cljs$core$IFn$_invoke$arity$2 = reductions__2;
  reductions.cljs$core$IFn$_invoke$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__6773 = null;
      var G__6773__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6773__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6773__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6773__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6773__4 = function() {
        var G__6774__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6774 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6774__delegate.call(this, x, y, z, args)
        };
        G__6774.cljs$lang$maxFixedArity = 3;
        G__6774.cljs$lang$applyTo = function(arglist__6775) {
          var x = cljs.core.first(arglist__6775);
          arglist__6775 = cljs.core.next(arglist__6775);
          var y = cljs.core.first(arglist__6775);
          arglist__6775 = cljs.core.next(arglist__6775);
          var z = cljs.core.first(arglist__6775);
          var args = cljs.core.rest(arglist__6775);
          return G__6774__delegate(x, y, z, args)
        };
        G__6774.cljs$core$IFn$_invoke$arity$variadic = G__6774__delegate;
        return G__6774
      }();
      G__6773 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6773__0.call(this);
          case 1:
            return G__6773__1.call(this, x);
          case 2:
            return G__6773__2.call(this, x, y);
          case 3:
            return G__6773__3.call(this, x, y, z);
          default:
            return G__6773__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6773.cljs$lang$maxFixedArity = 3;
      G__6773.cljs$lang$applyTo = G__6773__4.cljs$lang$applyTo;
      return G__6773
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6776 = null;
      var G__6776__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6776__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6776__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6776__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6776__4 = function() {
        var G__6777__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6777 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6777__delegate.call(this, x, y, z, args)
        };
        G__6777.cljs$lang$maxFixedArity = 3;
        G__6777.cljs$lang$applyTo = function(arglist__6778) {
          var x = cljs.core.first(arglist__6778);
          arglist__6778 = cljs.core.next(arglist__6778);
          var y = cljs.core.first(arglist__6778);
          arglist__6778 = cljs.core.next(arglist__6778);
          var z = cljs.core.first(arglist__6778);
          var args = cljs.core.rest(arglist__6778);
          return G__6777__delegate(x, y, z, args)
        };
        G__6777.cljs$core$IFn$_invoke$arity$variadic = G__6777__delegate;
        return G__6777
      }();
      G__6776 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6776__0.call(this);
          case 1:
            return G__6776__1.call(this, x);
          case 2:
            return G__6776__2.call(this, x, y);
          case 3:
            return G__6776__3.call(this, x, y, z);
          default:
            return G__6776__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6776.cljs$lang$maxFixedArity = 3;
      G__6776.cljs$lang$applyTo = G__6776__4.cljs$lang$applyTo;
      return G__6776
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6779 = null;
      var G__6779__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6779__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6779__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6779__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6779__4 = function() {
        var G__6780__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6780 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6780__delegate.call(this, x, y, z, args)
        };
        G__6780.cljs$lang$maxFixedArity = 3;
        G__6780.cljs$lang$applyTo = function(arglist__6781) {
          var x = cljs.core.first(arglist__6781);
          arglist__6781 = cljs.core.next(arglist__6781);
          var y = cljs.core.first(arglist__6781);
          arglist__6781 = cljs.core.next(arglist__6781);
          var z = cljs.core.first(arglist__6781);
          var args = cljs.core.rest(arglist__6781);
          return G__6780__delegate(x, y, z, args)
        };
        G__6780.cljs$core$IFn$_invoke$arity$variadic = G__6780__delegate;
        return G__6780
      }();
      G__6779 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6779__0.call(this);
          case 1:
            return G__6779__1.call(this, x);
          case 2:
            return G__6779__2.call(this, x, y);
          case 3:
            return G__6779__3.call(this, x, y, z);
          default:
            return G__6779__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6779.cljs$lang$maxFixedArity = 3;
      G__6779.cljs$lang$applyTo = G__6779__4.cljs$lang$applyTo;
      return G__6779
    }()
  };
  var juxt__4 = function() {
    var G__6782__delegate = function(f, g, h, fs) {
      var fs__$1 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6783 = null;
        var G__6783__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6763_SHARP_, p2__6764_SHARP_) {
            return cljs.core.conj.call(null, p1__6763_SHARP_, p2__6764_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__6783__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6765_SHARP_, p2__6766_SHARP_) {
            return cljs.core.conj.call(null, p1__6765_SHARP_, p2__6766_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__6783__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6767_SHARP_, p2__6768_SHARP_) {
            return cljs.core.conj.call(null, p1__6767_SHARP_, p2__6768_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__6783__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6769_SHARP_, p2__6770_SHARP_) {
            return cljs.core.conj.call(null, p1__6769_SHARP_, p2__6770_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__6783__4 = function() {
          var G__6784__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6771_SHARP_, p2__6772_SHARP_) {
              return cljs.core.conj.call(null, p1__6771_SHARP_, cljs.core.apply.call(null, p2__6772_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__$1)
          };
          var G__6784 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6784__delegate.call(this, x, y, z, args)
          };
          G__6784.cljs$lang$maxFixedArity = 3;
          G__6784.cljs$lang$applyTo = function(arglist__6785) {
            var x = cljs.core.first(arglist__6785);
            arglist__6785 = cljs.core.next(arglist__6785);
            var y = cljs.core.first(arglist__6785);
            arglist__6785 = cljs.core.next(arglist__6785);
            var z = cljs.core.first(arglist__6785);
            var args = cljs.core.rest(arglist__6785);
            return G__6784__delegate(x, y, z, args)
          };
          G__6784.cljs$core$IFn$_invoke$arity$variadic = G__6784__delegate;
          return G__6784
        }();
        G__6783 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6783__0.call(this);
            case 1:
              return G__6783__1.call(this, x);
            case 2:
              return G__6783__2.call(this, x, y);
            case 3:
              return G__6783__3.call(this, x, y, z);
            default:
              return G__6783__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        G__6783.cljs$lang$maxFixedArity = 3;
        G__6783.cljs$lang$applyTo = G__6783__4.cljs$lang$applyTo;
        return G__6783
      }()
    };
    var G__6782 = function(f, g, h, var_args) {
      var fs = null;
      if(arguments.length > 3) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6782__delegate.call(this, f, g, h, fs)
    };
    G__6782.cljs$lang$maxFixedArity = 3;
    G__6782.cljs$lang$applyTo = function(arglist__6786) {
      var f = cljs.core.first(arglist__6786);
      arglist__6786 = cljs.core.next(arglist__6786);
      var g = cljs.core.first(arglist__6786);
      arglist__6786 = cljs.core.next(arglist__6786);
      var h = cljs.core.first(arglist__6786);
      var fs = cljs.core.rest(arglist__6786);
      return G__6782__delegate(f, g, h, fs)
    };
    G__6782.cljs$core$IFn$_invoke$arity$variadic = G__6782__delegate;
    return G__6782
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$core$IFn$_invoke$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$core$IFn$_invoke$arity$1 = juxt__1;
  juxt.cljs$core$IFn$_invoke$arity$2 = juxt__2;
  juxt.cljs$core$IFn$_invoke$arity$3 = juxt__3;
  juxt.cljs$core$IFn$_invoke$arity$variadic = juxt__4.cljs$core$IFn$_invoke$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__6787 = cljs.core.next.call(null, coll);
        coll = G__6787;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll) && n > 0) {
        var G__6788 = n - 1;
        var G__6789 = cljs.core.next.call(null, coll);
        n = G__6788;
        coll = G__6789;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dorun.cljs$core$IFn$_invoke$arity$1 = dorun__1;
  dorun.cljs$core$IFn$_invoke$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  doall.cljs$core$IFn$_invoke$arity$1 = doall__1;
  doall.cljs$core$IFn$_invoke$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches), s)) {
    if(cljs.core.count.call(null, matches) === 1) {
      return cljs.core.first.call(null, matches)
    }else {
      return cljs.core.vec.call(null, matches)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches = re.exec(s);
  if(matches == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches) === 1) {
      return cljs.core.first.call(null, matches)
    }else {
      return cljs.core.vec.call(null, matches)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data = cljs.core.re_find.call(null, re, s);
  var match_idx = s.search(re);
  var match_str = cljs.core.coll_QMARK_.call(null, match_data) ? cljs.core.first.call(null, match_data) : match_data;
  var post_match = cljs.core.subs.call(null, s, match_idx + cljs.core.count.call(null, match_str));
  if(cljs.core.truth_(match_data)) {
    return new cljs.core.LazySeq(null, function() {
      return cljs.core.cons.call(null, match_data, cljs.core.seq.call(null, post_match) ? re_seq.call(null, re, post_match) : null)
    }, null, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6791 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var _ = cljs.core.nth.call(null, vec__6791, 0, null);
  var flags = cljs.core.nth.call(null, vec__6791, 1, null);
  var pattern = cljs.core.nth.call(null, vec__6791, 2, null);
  return new RegExp(pattern, flags)
};
cljs.core.pr_sequential_writer = function pr_sequential_writer(writer, print_one, begin, sep, end, opts, coll) {
  cljs.core._write.call(null, writer, begin);
  if(cljs.core.seq.call(null, coll)) {
    print_one.call(null, cljs.core.first.call(null, coll), writer, opts)
  }else {
  }
  var seq__6796_6800 = cljs.core.seq.call(null, cljs.core.next.call(null, coll));
  var chunk__6797_6801 = null;
  var count__6798_6802 = 0;
  var i__6799_6803 = 0;
  while(true) {
    if(i__6799_6803 < count__6798_6802) {
      var o_6804 = cljs.core._nth.call(null, chunk__6797_6801, i__6799_6803);
      cljs.core._write.call(null, writer, sep);
      print_one.call(null, o_6804, writer, opts);
      var G__6805 = seq__6796_6800;
      var G__6806 = chunk__6797_6801;
      var G__6807 = count__6798_6802;
      var G__6808 = i__6799_6803 + 1;
      seq__6796_6800 = G__6805;
      chunk__6797_6801 = G__6806;
      count__6798_6802 = G__6807;
      i__6799_6803 = G__6808;
      continue
    }else {
      var temp__4092__auto___6809 = cljs.core.seq.call(null, seq__6796_6800);
      if(temp__4092__auto___6809) {
        var seq__6796_6810__$1 = temp__4092__auto___6809;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__6796_6810__$1)) {
          var c__3844__auto___6811 = cljs.core.chunk_first.call(null, seq__6796_6810__$1);
          var G__6812 = cljs.core.chunk_rest.call(null, seq__6796_6810__$1);
          var G__6813 = c__3844__auto___6811;
          var G__6814 = cljs.core.count.call(null, c__3844__auto___6811);
          var G__6815 = 0;
          seq__6796_6800 = G__6812;
          chunk__6797_6801 = G__6813;
          count__6798_6802 = G__6814;
          i__6799_6803 = G__6815;
          continue
        }else {
          var o_6816 = cljs.core.first.call(null, seq__6796_6810__$1);
          cljs.core._write.call(null, writer, sep);
          print_one.call(null, o_6816, writer, opts);
          var G__6817 = cljs.core.next.call(null, seq__6796_6810__$1);
          var G__6818 = null;
          var G__6819 = 0;
          var G__6820 = 0;
          seq__6796_6800 = G__6817;
          chunk__6797_6801 = G__6818;
          count__6798_6802 = G__6819;
          i__6799_6803 = G__6820;
          continue
        }
      }else {
      }
    }
    break
  }
  return cljs.core._write.call(null, writer, end)
};
cljs.core.write_all = function() {
  var write_all__delegate = function(writer, ss) {
    var seq__6825 = cljs.core.seq.call(null, ss);
    var chunk__6826 = null;
    var count__6827 = 0;
    var i__6828 = 0;
    while(true) {
      if(i__6828 < count__6827) {
        var s = cljs.core._nth.call(null, chunk__6826, i__6828);
        cljs.core._write.call(null, writer, s);
        var G__6829 = seq__6825;
        var G__6830 = chunk__6826;
        var G__6831 = count__6827;
        var G__6832 = i__6828 + 1;
        seq__6825 = G__6829;
        chunk__6826 = G__6830;
        count__6827 = G__6831;
        i__6828 = G__6832;
        continue
      }else {
        var temp__4092__auto__ = cljs.core.seq.call(null, seq__6825);
        if(temp__4092__auto__) {
          var seq__6825__$1 = temp__4092__auto__;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__6825__$1)) {
            var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__6825__$1);
            var G__6833 = cljs.core.chunk_rest.call(null, seq__6825__$1);
            var G__6834 = c__3844__auto__;
            var G__6835 = cljs.core.count.call(null, c__3844__auto__);
            var G__6836 = 0;
            seq__6825 = G__6833;
            chunk__6826 = G__6834;
            count__6827 = G__6835;
            i__6828 = G__6836;
            continue
          }else {
            var s = cljs.core.first.call(null, seq__6825__$1);
            cljs.core._write.call(null, writer, s);
            var G__6837 = cljs.core.next.call(null, seq__6825__$1);
            var G__6838 = null;
            var G__6839 = 0;
            var G__6840 = 0;
            seq__6825 = G__6837;
            chunk__6826 = G__6838;
            count__6827 = G__6839;
            i__6828 = G__6840;
            continue
          }
        }else {
          return null
        }
      }
      break
    }
  };
  var write_all = function(writer, var_args) {
    var ss = null;
    if(arguments.length > 1) {
      ss = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return write_all__delegate.call(this, writer, ss)
  };
  write_all.cljs$lang$maxFixedArity = 1;
  write_all.cljs$lang$applyTo = function(arglist__6841) {
    var writer = cljs.core.first(arglist__6841);
    var ss = cljs.core.rest(arglist__6841);
    return write_all__delegate(writer, ss)
  };
  write_all.cljs$core$IFn$_invoke$arity$variadic = write_all__delegate;
  return write_all
}();
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.char_escapes = {'"':'\\"', "\\":"\\\\", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t"};
cljs.core.quote_string = function quote_string(s) {
  return[cljs.core.str('"'), cljs.core.str(s.replace(RegExp('[\\\\"\b\f\n\r\t]', "g"), function(match) {
    return cljs.core.char_escapes[match]
  })), cljs.core.str('"')].join("")
};
cljs.core.pr_writer = function pr_writer(obj, writer, opts) {
  if(obj == null) {
    return cljs.core._write.call(null, writer, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core._write.call(null, writer, "#\x3cundefined\x3e")
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        if(cljs.core.truth_(function() {
          var and__3119__auto__ = cljs.core.get.call(null, opts, new cljs.core.Keyword(null, "meta", "meta", 1017252215));
          if(cljs.core.truth_(and__3119__auto__)) {
            var and__3119__auto____$1 = function() {
              var G__6847 = obj;
              if(G__6847) {
                var bit__3746__auto__ = G__6847.cljs$lang$protocol_mask$partition0$ & 131072;
                if(bit__3746__auto__ || G__6847.cljs$core$IMeta$) {
                  return true
                }else {
                  if(!G__6847.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IMeta, G__6847)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IMeta, G__6847)
              }
            }();
            if(and__3119__auto____$1) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3119__auto____$1
            }
          }else {
            return and__3119__auto__
          }
        }())) {
          cljs.core._write.call(null, writer, "^");
          pr_writer.call(null, cljs.core.meta.call(null, obj), writer, opts);
          cljs.core._write.call(null, writer, " ")
        }else {
        }
        if(obj == null) {
          return cljs.core._write.call(null, writer, "nil")
        }else {
          if(obj.cljs$lang$type) {
            return obj.cljs$lang$ctorPrWriter(obj, writer, opts)
          }else {
            if(function() {
              var G__6848 = obj;
              if(G__6848) {
                var bit__3739__auto__ = G__6848.cljs$lang$protocol_mask$partition0$ & 2147483648;
                if(bit__3739__auto__ || G__6848.cljs$core$IPrintWithWriter$) {
                  return true
                }else {
                  return false
                }
              }else {
                return false
              }
            }()) {
              return cljs.core._pr_writer.call(null, obj, writer, opts)
            }else {
              if(cljs.core.type.call(null, obj) === Boolean || typeof obj === "number") {
                return cljs.core._write.call(null, writer, [cljs.core.str(obj)].join(""))
              }else {
                if(obj instanceof Array) {
                  return cljs.core.pr_sequential_writer.call(null, writer, pr_writer, "#\x3cArray [", ", ", "]\x3e", opts, obj)
                }else {
                  if(goog.isString(obj)) {
                    if(cljs.core.truth_((new cljs.core.Keyword(null, "readably", "readably", 4441712502)).cljs$core$IFn$_invoke$arity$1(opts))) {
                      return cljs.core._write.call(null, writer, cljs.core.quote_string.call(null, obj))
                    }else {
                      return cljs.core._write.call(null, writer, obj)
                    }
                  }else {
                    if(cljs.core.fn_QMARK_.call(null, obj)) {
                      return cljs.core.write_all.call(null, writer, "#\x3c", [cljs.core.str(obj)].join(""), "\x3e")
                    }else {
                      if(obj instanceof Date) {
                        var normalize = function(n, len) {
                          var ns = [cljs.core.str(n)].join("");
                          while(true) {
                            if(cljs.core.count.call(null, ns) < len) {
                              var G__6850 = [cljs.core.str("0"), cljs.core.str(ns)].join("");
                              ns = G__6850;
                              continue
                            }else {
                              return ns
                            }
                            break
                          }
                        };
                        return cljs.core.write_all.call(null, writer, '#inst "', [cljs.core.str(obj.getUTCFullYear())].join(""), "-", normalize.call(null, obj.getUTCMonth() + 1, 2), "-", normalize.call(null, obj.getUTCDate(), 2), "T", normalize.call(null, obj.getUTCHours(), 2), ":", normalize.call(null, obj.getUTCMinutes(), 2), ":", normalize.call(null, obj.getUTCSeconds(), 2), ".", normalize.call(null, obj.getUTCMilliseconds(), 3), "-", '00:00"')
                      }else {
                        if(cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj))) {
                          return cljs.core.write_all.call(null, writer, '#"', obj.source, '"')
                        }else {
                          if(function() {
                            var G__6849 = obj;
                            if(G__6849) {
                              var bit__3746__auto__ = G__6849.cljs$lang$protocol_mask$partition0$ & 2147483648;
                              if(bit__3746__auto__ || G__6849.cljs$core$IPrintWithWriter$) {
                                return true
                              }else {
                                if(!G__6849.cljs$lang$protocol_mask$partition0$) {
                                  return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IPrintWithWriter, G__6849)
                                }else {
                                  return false
                                }
                              }
                            }else {
                              return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IPrintWithWriter, G__6849)
                            }
                          }()) {
                            return cljs.core._pr_writer.call(null, obj, writer, opts)
                          }else {
                            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                              return cljs.core.write_all.call(null, writer, "#\x3c", [cljs.core.str(obj)].join(""), "\x3e")
                            }else {
                              return null
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_seq_writer = function pr_seq_writer(objs, writer, opts) {
  cljs.core.pr_writer.call(null, cljs.core.first.call(null, objs), writer, opts);
  var seq__6855 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  var chunk__6856 = null;
  var count__6857 = 0;
  var i__6858 = 0;
  while(true) {
    if(i__6858 < count__6857) {
      var obj = cljs.core._nth.call(null, chunk__6856, i__6858);
      cljs.core._write.call(null, writer, " ");
      cljs.core.pr_writer.call(null, obj, writer, opts);
      var G__6859 = seq__6855;
      var G__6860 = chunk__6856;
      var G__6861 = count__6857;
      var G__6862 = i__6858 + 1;
      seq__6855 = G__6859;
      chunk__6856 = G__6860;
      count__6857 = G__6861;
      i__6858 = G__6862;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__6855);
      if(temp__4092__auto__) {
        var seq__6855__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__6855__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__6855__$1);
          var G__6863 = cljs.core.chunk_rest.call(null, seq__6855__$1);
          var G__6864 = c__3844__auto__;
          var G__6865 = cljs.core.count.call(null, c__3844__auto__);
          var G__6866 = 0;
          seq__6855 = G__6863;
          chunk__6856 = G__6864;
          count__6857 = G__6865;
          i__6858 = G__6866;
          continue
        }else {
          var obj = cljs.core.first.call(null, seq__6855__$1);
          cljs.core._write.call(null, writer, " ");
          cljs.core.pr_writer.call(null, obj, writer, opts);
          var G__6867 = cljs.core.next.call(null, seq__6855__$1);
          var G__6868 = null;
          var G__6869 = 0;
          var G__6870 = 0;
          seq__6855 = G__6867;
          chunk__6856 = G__6868;
          count__6857 = G__6869;
          i__6858 = G__6870;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.pr_sb_with_opts = function pr_sb_with_opts(objs, opts) {
  var sb = new goog.string.StringBuffer;
  var writer = new cljs.core.StringBufferWriter(sb);
  cljs.core.pr_seq_writer.call(null, objs, writer, opts);
  cljs.core._flush.call(null, writer);
  return sb
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return""
  }else {
    return[cljs.core.str(cljs.core.pr_sb_with_opts.call(null, objs, opts))].join("")
  }
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return"\n"
  }else {
    var sb = cljs.core.pr_sb_with_opts.call(null, objs, opts);
    sb.append("\n");
    return[cljs.core.str(sb)].join("")
  }
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  return cljs.core.string_print.call(null, cljs.core.pr_str_with_opts.call(null, objs, opts))
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, new cljs.core.Keyword(null, "flush-on-newline", "flush-on-newline", 4338025857)))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__6871) {
    var objs = cljs.core.seq(arglist__6871);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$core$IFn$_invoke$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__6872) {
    var objs = cljs.core.seq(arglist__6872);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$core$IFn$_invoke$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__6873) {
    var objs = cljs.core.seq(arglist__6873);
    return pr__delegate(objs)
  };
  pr.cljs$core$IFn$_invoke$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), new cljs.core.Keyword(null, "readably", "readably", 4441712502), false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__6874) {
    var objs = cljs.core.seq(arglist__6874);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$core$IFn$_invoke$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), new cljs.core.Keyword(null, "readably", "readably", 4441712502), false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__6875) {
    var objs = cljs.core.seq(arglist__6875);
    return print_str__delegate(objs)
  };
  print_str.cljs$core$IFn$_invoke$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), new cljs.core.Keyword(null, "readably", "readably", 4441712502), false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__6876) {
    var objs = cljs.core.seq(arglist__6876);
    return println__delegate(objs)
  };
  println.cljs$core$IFn$_invoke$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), new cljs.core.Keyword(null, "readably", "readably", 4441712502), false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__6877) {
    var objs = cljs.core.seq(arglist__6877);
    return println_str__delegate(objs)
  };
  println_str.cljs$core$IFn$_invoke$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__6878) {
    var objs = cljs.core.seq(arglist__6878);
    return prn__delegate(objs)
  };
  prn.cljs$core$IFn$_invoke$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.KeySeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.KeySeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll__$1)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll__$1)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll__$1)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll__$1))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll__$1)
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll__$1)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll__$1)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll__$1)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll__$1)
};
cljs.core.List.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.List.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core._write.call(null, writer, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll__$1)
};
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.ValSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ValSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll__$1)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var coll__$1 = this;
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll__$1)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  var x__$1 = this;
  return cljs.core.compare_indexed.call(null, x__$1, y)
};
cljs.core.Subvec.prototype.cljs$core$IComparable$ = true;
cljs.core.Subvec.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  var x__$1 = this;
  return cljs.core.compare_indexed.call(null, x__$1, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition0$ = 2153938944;
  this.cljs$lang$protocol_mask$partition1$ = 2
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorStr = "cljs.core/Atom";
cljs.core.Atom.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  var this$__$1 = this;
  return goog.getUid(this$__$1)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var self__ = this;
  var this$__$1 = this;
  var seq__6879 = cljs.core.seq.call(null, self__.watches);
  var chunk__6880 = null;
  var count__6881 = 0;
  var i__6882 = 0;
  while(true) {
    if(i__6882 < count__6881) {
      var vec__6883 = cljs.core._nth.call(null, chunk__6880, i__6882);
      var key = cljs.core.nth.call(null, vec__6883, 0, null);
      var f = cljs.core.nth.call(null, vec__6883, 1, null);
      f.call(null, key, this$__$1, oldval, newval);
      var G__6885 = seq__6879;
      var G__6886 = chunk__6880;
      var G__6887 = count__6881;
      var G__6888 = i__6882 + 1;
      seq__6879 = G__6885;
      chunk__6880 = G__6886;
      count__6881 = G__6887;
      i__6882 = G__6888;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__6879);
      if(temp__4092__auto__) {
        var seq__6879__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__6879__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__6879__$1);
          var G__6889 = cljs.core.chunk_rest.call(null, seq__6879__$1);
          var G__6890 = c__3844__auto__;
          var G__6891 = cljs.core.count.call(null, c__3844__auto__);
          var G__6892 = 0;
          seq__6879 = G__6889;
          chunk__6880 = G__6890;
          count__6881 = G__6891;
          i__6882 = G__6892;
          continue
        }else {
          var vec__6884 = cljs.core.first.call(null, seq__6879__$1);
          var key = cljs.core.nth.call(null, vec__6884, 0, null);
          var f = cljs.core.nth.call(null, vec__6884, 1, null);
          f.call(null, key, this$__$1, oldval, newval);
          var G__6893 = cljs.core.next.call(null, seq__6879__$1);
          var G__6894 = null;
          var G__6895 = 0;
          var G__6896 = 0;
          seq__6879 = G__6893;
          chunk__6880 = G__6894;
          count__6881 = G__6895;
          i__6882 = G__6896;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var self__ = this;
  var this$__$1 = this;
  return this$__$1.watches = cljs.core.assoc.call(null, self__.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var self__ = this;
  var this$__$1 = this;
  return this$__$1.watches = cljs.core.dissoc.call(null, self__.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(a, writer, opts) {
  var self__ = this;
  var a__$1 = this;
  cljs.core._write.call(null, writer, "#\x3cAtom: ");
  cljs.core.pr_writer.call(null, self__.state, writer, opts);
  return cljs.core._write.call(null, writer, "\x3e")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return self__.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return self__.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  var o__$1 = this;
  return o__$1 === other
};
cljs.core.__GT_Atom = function __GT_Atom(state, meta, validator, watches) {
  return new cljs.core.Atom(state, meta, validator, watches)
};
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__6900__delegate = function(x, p__6897) {
      var map__6899 = p__6897;
      var map__6899__$1 = cljs.core.seq_QMARK_.call(null, map__6899) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6899) : map__6899;
      var validator = cljs.core.get.call(null, map__6899__$1, new cljs.core.Keyword(null, "validator", "validator", 4199087812));
      var meta = cljs.core.get.call(null, map__6899__$1, new cljs.core.Keyword(null, "meta", "meta", 1017252215));
      return new cljs.core.Atom(x, meta, validator, null)
    };
    var G__6900 = function(x, var_args) {
      var p__6897 = null;
      if(arguments.length > 1) {
        p__6897 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6900__delegate.call(this, x, p__6897)
    };
    G__6900.cljs$lang$maxFixedArity = 1;
    G__6900.cljs$lang$applyTo = function(arglist__6901) {
      var x = cljs.core.first(arglist__6901);
      var p__6897 = cljs.core.rest(arglist__6901);
      return G__6900__delegate(x, p__6897)
    };
    G__6900.cljs$core$IFn$_invoke$arity$variadic = G__6900__delegate;
    return G__6900
  }();
  atom = function(x, var_args) {
    var p__6897 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$core$IFn$_invoke$arity$1 = atom__1;
  atom.cljs$core$IFn$_invoke$arity$variadic = atom__2.cljs$core$IFn$_invoke$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__4092__auto___6902 = a.validator;
  if(cljs.core.truth_(temp__4092__auto___6902)) {
    var validate_6903 = temp__4092__auto___6902;
    if(cljs.core.truth_(validate_6903.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "validate", "validate", 1233162959, null), new cljs.core.Symbol(null, "new-value", "new-value", 972165309, null))))].join(""));
    }
  }else {
  }
  var old_value_6904 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value_6904, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__6905__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__6905 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(arguments.length > 5) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6905__delegate.call(this, a, f, x, y, z, more)
    };
    G__6905.cljs$lang$maxFixedArity = 5;
    G__6905.cljs$lang$applyTo = function(arglist__6906) {
      var a = cljs.core.first(arglist__6906);
      arglist__6906 = cljs.core.next(arglist__6906);
      var f = cljs.core.first(arglist__6906);
      arglist__6906 = cljs.core.next(arglist__6906);
      var x = cljs.core.first(arglist__6906);
      arglist__6906 = cljs.core.next(arglist__6906);
      var y = cljs.core.first(arglist__6906);
      arglist__6906 = cljs.core.next(arglist__6906);
      var z = cljs.core.first(arglist__6906);
      var more = cljs.core.rest(arglist__6906);
      return G__6905__delegate(a, f, x, y, z, more)
    };
    G__6905.cljs$core$IFn$_invoke$arity$variadic = G__6905__delegate;
    return G__6905
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$core$IFn$_invoke$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$core$IFn$_invoke$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$core$IFn$_invoke$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$core$IFn$_invoke$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$core$IFn$_invoke$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$core$IFn$_invoke$arity$variadic = swap_BANG___6.cljs$core$IFn$_invoke$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(arguments.length > 2) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__6907) {
    var iref = cljs.core.first(arglist__6907);
    arglist__6907 = cljs.core.next(arglist__6907);
    var f = cljs.core.first(arglist__6907);
    var args = cljs.core.rest(arglist__6907);
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$core$IFn$_invoke$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  gensym.cljs$core$IFn$_invoke$arity$0 = gensym__0;
  gensym.cljs$core$IFn$_invoke$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorStr = "cljs.core/Delay";
cljs.core.Delay.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var self__ = this;
  var d__$1 = this;
  return(new cljs.core.Keyword(null, "done", "done", 1016993524)).cljs$core$IFn$_invoke$arity$1(cljs.core.deref.call(null, self__.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  var ___$1 = this;
  return(new cljs.core.Keyword(null, "value", "value", 1125876963)).cljs$core$IFn$_invoke$arity$1(cljs.core.swap_BANG_.call(null, self__.state, function(p__6908) {
    var map__6909 = p__6908;
    var map__6909__$1 = cljs.core.seq_QMARK_.call(null, map__6909) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6909) : map__6909;
    var curr_state = map__6909__$1;
    var done = cljs.core.get.call(null, map__6909__$1, new cljs.core.Keyword(null, "done", "done", 1016993524));
    if(cljs.core.truth_(done)) {
      return curr_state
    }else {
      return cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "done", "done", 1016993524), true, new cljs.core.Keyword(null, "value", "value", 1125876963), self__.f.call(null)], true)
    }
  }))
};
cljs.core.__GT_Delay = function __GT_Delay(state, f) {
  return new cljs.core.Delay(state, f)
};
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return x instanceof cljs.core.Delay
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.IEncodeJS = {};
cljs.core._clj__GT_js = function _clj__GT_js(x) {
  if(function() {
    var and__3119__auto__ = x;
    if(and__3119__auto__) {
      return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1(x)
  }else {
    var x__3723__auto__ = x == null ? null : x;
    return function() {
      var or__3128__auto__ = cljs.core._clj__GT_js[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._clj__GT_js["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-clj-\x3ejs", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._key__GT_js = function _key__GT_js(x) {
  if(function() {
    var and__3119__auto__ = x;
    if(and__3119__auto__) {
      return x.cljs$core$IEncodeJS$_key__GT_js$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_key__GT_js$arity$1(x)
  }else {
    var x__3723__auto__ = x == null ? null : x;
    return function() {
      var or__3128__auto__ = cljs.core._key__GT_js[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._key__GT_js["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-key-\x3ejs", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core.key__GT_js = function key__GT_js(k) {
  if(function() {
    var G__6911 = k;
    if(G__6911) {
      var bit__3746__auto__ = null;
      if(cljs.core.truth_(function() {
        var or__3128__auto__ = bit__3746__auto__;
        if(cljs.core.truth_(or__3128__auto__)) {
          return or__3128__auto__
        }else {
          return G__6911.cljs$core$IEncodeJS$
        }
      }())) {
        return true
      }else {
        if(!G__6911.cljs$lang$protocol_mask$partition$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IEncodeJS, G__6911)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IEncodeJS, G__6911)
    }
  }()) {
    return cljs.core._clj__GT_js.call(null, k)
  }else {
    if(typeof k === "string" || typeof k === "number" || k instanceof cljs.core.Keyword || k instanceof cljs.core.Symbol) {
      return cljs.core.clj__GT_js.call(null, k)
    }else {
      return cljs.core.pr_str.call(null, k)
    }
  }
};
cljs.core.clj__GT_js = function clj__GT_js(x) {
  if(x == null) {
    return null
  }else {
    if(function() {
      var G__6919 = x;
      if(G__6919) {
        var bit__3746__auto__ = null;
        if(cljs.core.truth_(function() {
          var or__3128__auto__ = bit__3746__auto__;
          if(cljs.core.truth_(or__3128__auto__)) {
            return or__3128__auto__
          }else {
            return G__6919.cljs$core$IEncodeJS$
          }
        }())) {
          return true
        }else {
          if(!G__6919.cljs$lang$protocol_mask$partition$) {
            return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IEncodeJS, G__6919)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IEncodeJS, G__6919)
      }
    }()) {
      return cljs.core._clj__GT_js.call(null, x)
    }else {
      if(x instanceof cljs.core.Keyword) {
        return cljs.core.name.call(null, x)
      }else {
        if(x instanceof cljs.core.Symbol) {
          return[cljs.core.str(x)].join("")
        }else {
          if(cljs.core.map_QMARK_.call(null, x)) {
            var m = {};
            var seq__6920_6926 = cljs.core.seq.call(null, x);
            var chunk__6921_6927 = null;
            var count__6922_6928 = 0;
            var i__6923_6929 = 0;
            while(true) {
              if(i__6923_6929 < count__6922_6928) {
                var vec__6924_6930 = cljs.core._nth.call(null, chunk__6921_6927, i__6923_6929);
                var k_6931 = cljs.core.nth.call(null, vec__6924_6930, 0, null);
                var v_6932 = cljs.core.nth.call(null, vec__6924_6930, 1, null);
                m[cljs.core.key__GT_js.call(null, k_6931)] = clj__GT_js.call(null, v_6932);
                var G__6933 = seq__6920_6926;
                var G__6934 = chunk__6921_6927;
                var G__6935 = count__6922_6928;
                var G__6936 = i__6923_6929 + 1;
                seq__6920_6926 = G__6933;
                chunk__6921_6927 = G__6934;
                count__6922_6928 = G__6935;
                i__6923_6929 = G__6936;
                continue
              }else {
                var temp__4092__auto___6937 = cljs.core.seq.call(null, seq__6920_6926);
                if(temp__4092__auto___6937) {
                  var seq__6920_6938__$1 = temp__4092__auto___6937;
                  if(cljs.core.chunked_seq_QMARK_.call(null, seq__6920_6938__$1)) {
                    var c__3844__auto___6939 = cljs.core.chunk_first.call(null, seq__6920_6938__$1);
                    var G__6940 = cljs.core.chunk_rest.call(null, seq__6920_6938__$1);
                    var G__6941 = c__3844__auto___6939;
                    var G__6942 = cljs.core.count.call(null, c__3844__auto___6939);
                    var G__6943 = 0;
                    seq__6920_6926 = G__6940;
                    chunk__6921_6927 = G__6941;
                    count__6922_6928 = G__6942;
                    i__6923_6929 = G__6943;
                    continue
                  }else {
                    var vec__6925_6944 = cljs.core.first.call(null, seq__6920_6938__$1);
                    var k_6945 = cljs.core.nth.call(null, vec__6925_6944, 0, null);
                    var v_6946 = cljs.core.nth.call(null, vec__6925_6944, 1, null);
                    m[cljs.core.key__GT_js.call(null, k_6945)] = clj__GT_js.call(null, v_6946);
                    var G__6947 = cljs.core.next.call(null, seq__6920_6938__$1);
                    var G__6948 = null;
                    var G__6949 = 0;
                    var G__6950 = 0;
                    seq__6920_6926 = G__6947;
                    chunk__6921_6927 = G__6948;
                    count__6922_6928 = G__6949;
                    i__6923_6929 = G__6950;
                    continue
                  }
                }else {
                }
              }
              break
            }
            return m
          }else {
            if(cljs.core.coll_QMARK_.call(null, x)) {
              return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.IEncodeClojure = {};
cljs.core._js__GT_clj = function _js__GT_clj(x, options) {
  if(function() {
    var and__3119__auto__ = x;
    if(and__3119__auto__) {
      return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2(x, options)
  }else {
    var x__3723__auto__ = x == null ? null : x;
    return function() {
      var or__3128__auto__ = cljs.core._js__GT_clj[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._js__GT_clj["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeClojure.-js-\x3eclj", x);
        }
      }
    }().call(null, x, options)
  }
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj = null;
  var js__GT_clj__1 = function(x) {
    return js__GT_clj.call(null, x, cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "keywordize-keys", "keywordize-keys", 4191781672), false], true))
  };
  var js__GT_clj__2 = function() {
    var G__6971__delegate = function(x, opts) {
      if(function() {
        var G__6961 = x;
        if(G__6961) {
          var bit__3746__auto__ = null;
          if(cljs.core.truth_(function() {
            var or__3128__auto__ = bit__3746__auto__;
            if(cljs.core.truth_(or__3128__auto__)) {
              return or__3128__auto__
            }else {
              return G__6961.cljs$core$IEncodeClojure$
            }
          }())) {
            return true
          }else {
            if(!G__6961.cljs$lang$protocol_mask$partition$) {
              return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IEncodeClojure, G__6961)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IEncodeClojure, G__6961)
        }
      }()) {
        return cljs.core._js__GT_clj.call(null, x, cljs.core.apply.call(null, cljs.core.array_map, opts))
      }else {
        if(cljs.core.seq.call(null, opts)) {
          var map__6962 = opts;
          var map__6962__$1 = cljs.core.seq_QMARK_.call(null, map__6962) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6962) : map__6962;
          var keywordize_keys = cljs.core.get.call(null, map__6962__$1, new cljs.core.Keyword(null, "keywordize-keys", "keywordize-keys", 4191781672));
          var keyfn = cljs.core.truth_(keywordize_keys) ? cljs.core.keyword : cljs.core.str;
          var f = function(map__6962, map__6962__$1, keywordize_keys, keyfn) {
            return function thisfn(x__$1) {
              if(cljs.core.seq_QMARK_.call(null, x__$1)) {
                return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x__$1))
              }else {
                if(cljs.core.coll_QMARK_.call(null, x__$1)) {
                  return cljs.core.into.call(null, cljs.core.empty.call(null, x__$1), cljs.core.map.call(null, thisfn, x__$1))
                }else {
                  if(x__$1 instanceof Array) {
                    return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x__$1))
                  }else {
                    if(cljs.core.type.call(null, x__$1) === Object) {
                      return cljs.core.into.call(null, cljs.core.PersistentArrayMap.EMPTY, function() {
                        var iter__3813__auto__ = function(map__6962, map__6962__$1, keywordize_keys, keyfn) {
                          return function iter__6967(s__6968) {
                            return new cljs.core.LazySeq(null, function(map__6962, map__6962__$1, keywordize_keys, keyfn) {
                              return function() {
                                var s__6968__$1 = s__6968;
                                while(true) {
                                  var temp__4092__auto__ = cljs.core.seq.call(null, s__6968__$1);
                                  if(temp__4092__auto__) {
                                    var s__6968__$2 = temp__4092__auto__;
                                    if(cljs.core.chunked_seq_QMARK_.call(null, s__6968__$2)) {
                                      var c__3811__auto__ = cljs.core.chunk_first.call(null, s__6968__$2);
                                      var size__3812__auto__ = cljs.core.count.call(null, c__3811__auto__);
                                      var b__6970 = cljs.core.chunk_buffer.call(null, size__3812__auto__);
                                      if(function() {
                                        var i__6969 = 0;
                                        while(true) {
                                          if(i__6969 < size__3812__auto__) {
                                            var k = cljs.core._nth.call(null, c__3811__auto__, i__6969);
                                            cljs.core.chunk_append.call(null, b__6970, cljs.core.PersistentVector.fromArray([keyfn.call(null, k), thisfn.call(null, x__$1[k])], true));
                                            var G__6972 = i__6969 + 1;
                                            i__6969 = G__6972;
                                            continue
                                          }else {
                                            return true
                                          }
                                          break
                                        }
                                      }()) {
                                        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__6970), iter__6967.call(null, cljs.core.chunk_rest.call(null, s__6968__$2)))
                                      }else {
                                        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__6970), null)
                                      }
                                    }else {
                                      var k = cljs.core.first.call(null, s__6968__$2);
                                      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn.call(null, k), thisfn.call(null, x__$1[k])], true), iter__6967.call(null, cljs.core.rest.call(null, s__6968__$2)))
                                    }
                                  }else {
                                    return null
                                  }
                                  break
                                }
                              }
                            }(map__6962, map__6962__$1, keywordize_keys, keyfn), null, null)
                          }
                        }(map__6962, map__6962__$1, keywordize_keys, keyfn);
                        return iter__3813__auto__.call(null, cljs.core.js_keys.call(null, x__$1))
                      }())
                    }else {
                      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                        return x__$1
                      }else {
                        return null
                      }
                    }
                  }
                }
              }
            }
          }(map__6962, map__6962__$1, keywordize_keys, keyfn);
          return f.call(null, x)
        }else {
          return null
        }
      }
    };
    var G__6971 = function(x, var_args) {
      var opts = null;
      if(arguments.length > 1) {
        opts = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6971__delegate.call(this, x, opts)
    };
    G__6971.cljs$lang$maxFixedArity = 1;
    G__6971.cljs$lang$applyTo = function(arglist__6973) {
      var x = cljs.core.first(arglist__6973);
      var opts = cljs.core.rest(arglist__6973);
      return G__6971__delegate(x, opts)
    };
    G__6971.cljs$core$IFn$_invoke$arity$variadic = G__6971__delegate;
    return G__6971
  }();
  js__GT_clj = function(x, var_args) {
    var opts = var_args;
    switch(arguments.length) {
      case 1:
        return js__GT_clj__1.call(this, x);
      default:
        return js__GT_clj__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = js__GT_clj__2.cljs$lang$applyTo;
  js__GT_clj.cljs$core$IFn$_invoke$arity$1 = js__GT_clj__1;
  js__GT_clj.cljs$core$IFn$_invoke$arity$variadic = js__GT_clj__2.cljs$core$IFn$_invoke$arity$variadic;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem = cljs.core.atom.call(null, cljs.core.PersistentArrayMap.EMPTY);
  return function() {
    var G__6974__delegate = function(args) {
      var temp__4090__auto__ = cljs.core.get.call(null, cljs.core.deref.call(null, mem), args);
      if(cljs.core.truth_(temp__4090__auto__)) {
        var v = temp__4090__auto__;
        return v
      }else {
        var ret = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem, cljs.core.assoc, args, ret);
        return ret
      }
    };
    var G__6974 = function(var_args) {
      var args = null;
      if(arguments.length > 0) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6974__delegate.call(this, args)
    };
    G__6974.cljs$lang$maxFixedArity = 0;
    G__6974.cljs$lang$applyTo = function(arglist__6975) {
      var args = cljs.core.seq(arglist__6975);
      return G__6974__delegate(args)
    };
    G__6974.cljs$core$IFn$_invoke$arity$variadic = G__6974__delegate;
    return G__6974
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret)) {
        var G__6976 = ret;
        f = G__6976;
        continue
      }else {
        return ret
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__6977__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__6977 = function(f, var_args) {
      var args = null;
      if(arguments.length > 1) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6977__delegate.call(this, f, args)
    };
    G__6977.cljs$lang$maxFixedArity = 1;
    G__6977.cljs$lang$applyTo = function(arglist__6978) {
      var f = cljs.core.first(arglist__6978);
      var args = cljs.core.rest(arglist__6978);
      return G__6977__delegate(f, args)
    };
    G__6977.cljs$core$IFn$_invoke$arity$variadic = G__6977__delegate;
    return G__6977
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$core$IFn$_invoke$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$core$IFn$_invoke$arity$1 = trampoline__1;
  trampoline.cljs$core$IFn$_invoke$arity$variadic = trampoline__2.cljs$core$IFn$_invoke$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$core$IFn$_invoke$arity$0 = rand__0;
  rand.cljs$core$IFn$_invoke$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.PersistentArrayMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "parents", "parents", 4515496059), cljs.core.PersistentArrayMap.EMPTY, new cljs.core.Keyword(null, "descendants", "descendants", 768214664), cljs.core.PersistentArrayMap.EMPTY, new cljs.core.Keyword(null, "ancestors", "ancestors", 889955442), cljs.core.PersistentArrayMap.EMPTY], true)
};
cljs.core._global_hierarchy = null;
cljs.core.get_global_hierarchy = function get_global_hierarchy() {
  if(cljs.core._global_hierarchy == null) {
    cljs.core._global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null))
  }else {
  }
  return cljs.core._global_hierarchy
};
cljs.core.swap_global_hierarchy_BANG_ = function() {
  var swap_global_hierarchy_BANG___delegate = function(f, args) {
    return cljs.core.apply.call(null, cljs.core.swap_BANG_, cljs.core.get_global_hierarchy.call(null), f, args)
  };
  var swap_global_hierarchy_BANG_ = function(f, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return swap_global_hierarchy_BANG___delegate.call(this, f, args)
  };
  swap_global_hierarchy_BANG_.cljs$lang$maxFixedArity = 1;
  swap_global_hierarchy_BANG_.cljs$lang$applyTo = function(arglist__6979) {
    var f = cljs.core.first(arglist__6979);
    var args = cljs.core.rest(arglist__6979);
    return swap_global_hierarchy_BANG___delegate(f, args)
  };
  swap_global_hierarchy_BANG_.cljs$core$IFn$_invoke$arity$variadic = swap_global_hierarchy_BANG___delegate;
  return swap_global_hierarchy_BANG_
}();
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3128__auto__ = cljs.core._EQ_.call(null, child, parent);
    if(or__3128__auto__) {
      return or__3128__auto__
    }else {
      var or__3128__auto____$1 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword(null, "ancestors", "ancestors", 889955442)).cljs$core$IFn$_invoke$arity$1(h).call(null, child), parent);
      if(or__3128__auto____$1) {
        return or__3128__auto____$1
      }else {
        var and__3119__auto__ = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3119__auto__) {
          var and__3119__auto____$1 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3119__auto____$1) {
            var and__3119__auto____$2 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3119__auto____$2) {
              var ret = true;
              var i = 0;
              while(true) {
                if(!ret || i === cljs.core.count.call(null, parent)) {
                  return ret
                }else {
                  var G__6980 = isa_QMARK_.call(null, h, child.call(null, i), parent.call(null, i));
                  var G__6981 = i + 1;
                  ret = G__6980;
                  i = G__6981;
                  continue
                }
                break
              }
            }else {
              return and__3119__auto____$2
            }
          }else {
            return and__3119__auto____$1
          }
        }else {
          return and__3119__auto__
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  isa_QMARK_.cljs$core$IFn$_invoke$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$core$IFn$_invoke$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, (new cljs.core.Keyword(null, "parents", "parents", 4515496059)).cljs$core$IFn$_invoke$arity$1(h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  parents.cljs$core$IFn$_invoke$arity$1 = parents__1;
  parents.cljs$core$IFn$_invoke$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, (new cljs.core.Keyword(null, "ancestors", "ancestors", 889955442)).cljs$core$IFn$_invoke$arity$1(h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ancestors.cljs$core$IFn$_invoke$arity$1 = ancestors__1;
  ancestors.cljs$core$IFn$_invoke$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, (new cljs.core.Keyword(null, "descendants", "descendants", 768214664)).cljs$core$IFn$_invoke$arity$1(h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  descendants.cljs$core$IFn$_invoke$arity$1 = descendants__1;
  descendants.cljs$core$IFn$_invoke$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "namespace", "namespace", -388313324, null), new cljs.core.Symbol(null, "parent", "parent", 1659011683, null))))].join(""));
    }
    cljs.core.swap_global_hierarchy_BANG_.call(null, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "not\x3d", "not\x3d", -1637144189, null), new cljs.core.Symbol(null, "tag", "tag", -1640416941, null), new cljs.core.Symbol(null, "parent", "parent", 1659011683, null))))].join(""));
    }
    var tp = (new cljs.core.Keyword(null, "parents", "parents", 4515496059)).cljs$core$IFn$_invoke$arity$1(h);
    var td = (new cljs.core.Keyword(null, "descendants", "descendants", 768214664)).cljs$core$IFn$_invoke$arity$1(h);
    var ta = (new cljs.core.Keyword(null, "ancestors", "ancestors", 889955442)).cljs$core$IFn$_invoke$arity$1(h);
    var tf = function(tp, td, ta) {
      return function(m, source, sources, target, targets) {
        return cljs.core.reduce.call(null, function(tp, td, ta) {
          return function(ret, k) {
            return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
          }
        }(tp, td, ta), m, cljs.core.cons.call(null, source, sources.call(null, source)))
      }
    }(tp, td, ta);
    var or__3128__auto__ = cljs.core.contains_QMARK_.call(null, tp.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "parents", "parents", 4515496059), cljs.core.assoc.call(null, (new cljs.core.Keyword(null, "parents", "parents", 4515496059)).cljs$core$IFn$_invoke$arity$1(h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp, tag, cljs.core.PersistentHashSet.EMPTY), parent)), new cljs.core.Keyword(null, "ancestors", "ancestors", 889955442), tf.call(null, (new cljs.core.Keyword(null, "ancestors", "ancestors", 889955442)).cljs$core$IFn$_invoke$arity$1(h), 
      tag, td, parent, ta), new cljs.core.Keyword(null, "descendants", "descendants", 768214664), tf.call(null, (new cljs.core.Keyword(null, "descendants", "descendants", 768214664)).cljs$core$IFn$_invoke$arity$1(h), parent, ta, tag, td)], true)
    }();
    if(cljs.core.truth_(or__3128__auto__)) {
      return or__3128__auto__
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  derive.cljs$core$IFn$_invoke$arity$2 = derive__2;
  derive.cljs$core$IFn$_invoke$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_global_hierarchy_BANG_.call(null, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap = (new cljs.core.Keyword(null, "parents", "parents", 4515496059)).cljs$core$IFn$_invoke$arity$1(h);
    var childsParents = cljs.core.truth_(parentMap.call(null, tag)) ? cljs.core.disj.call(null, parentMap.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents)) ? cljs.core.assoc.call(null, parentMap, tag, childsParents) : cljs.core.dissoc.call(null, parentMap, tag);
    var deriv_seq = cljs.core.flatten.call(null, cljs.core.map.call(null, function(parentMap, childsParents, newParents) {
      return function(p1__6982_SHARP_) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, p1__6982_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__6982_SHARP_), cljs.core.second.call(null, p1__6982_SHARP_)))
      }
    }(parentMap, childsParents, newParents), cljs.core.seq.call(null, newParents)));
    if(cljs.core.contains_QMARK_.call(null, parentMap.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__6983_SHARP_, p2__6984_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__6983_SHARP_, p2__6984_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  underive.cljs$core$IFn$_invoke$arity$2 = underive__2;
  underive.cljs$core$IFn$_invoke$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3128__auto__ = cljs.core.truth_(function() {
    var and__3119__auto__ = xprefs;
    if(cljs.core.truth_(and__3119__auto__)) {
      return xprefs.call(null, y)
    }else {
      return and__3119__auto__
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3128__auto__)) {
    return or__3128__auto__
  }else {
    var or__3128__auto____$1 = function() {
      var ps = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps), prefer_table))) {
          }else {
          }
          var G__6985 = cljs.core.rest.call(null, ps);
          ps = G__6985;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3128__auto____$1)) {
      return or__3128__auto____$1
    }else {
      var or__3128__auto____$2 = function() {
        var ps = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps), y, prefer_table))) {
            }else {
            }
            var G__6986 = cljs.core.rest.call(null, ps);
            ps = G__6986;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3128__auto____$2)) {
        return or__3128__auto____$2
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3128__auto__ = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3128__auto__)) {
    return or__3128__auto__
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry = cljs.core.reduce.call(null, function(be, p__6989) {
    var vec__6990 = p__6989;
    var k = cljs.core.nth.call(null, vec__6990, 0, null);
    var _ = cljs.core.nth.call(null, vec__6990, 1, null);
    var e = vec__6990;
    if(cljs.core.isa_QMARK_.call(null, cljs.core.deref.call(null, hierarchy), dispatch_val, k)) {
      var be2 = cljs.core.truth_(function() {
        var or__3128__auto__ = be == null;
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          return cljs.core.dominates.call(null, k, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2), k, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -\x3e "), cljs.core.str(k), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry));
      return cljs.core.second.call(null, best_entry)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3119__auto__ = mf;
    if(and__3119__auto__) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__3723__auto__ = mf == null ? null : mf;
    return function() {
      var or__3128__auto__ = cljs.core._reset[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._reset["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3119__auto__ = mf;
    if(and__3119__auto__) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__3723__auto__ = mf == null ? null : mf;
    return function() {
      var or__3128__auto__ = cljs.core._add_method[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._add_method["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3119__auto__ = mf;
    if(and__3119__auto__) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__3723__auto__ = mf == null ? null : mf;
    return function() {
      var or__3128__auto__ = cljs.core._remove_method[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._remove_method["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3119__auto__ = mf;
    if(and__3119__auto__) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__3723__auto__ = mf == null ? null : mf;
    return function() {
      var or__3128__auto__ = cljs.core._prefer_method[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._prefer_method["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3119__auto__ = mf;
    if(and__3119__auto__) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__3723__auto__ = mf == null ? null : mf;
    return function() {
      var or__3128__auto__ = cljs.core._get_method[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._get_method["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3119__auto__ = mf;
    if(and__3119__auto__) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__3723__auto__ = mf == null ? null : mf;
    return function() {
      var or__3128__auto__ = cljs.core._methods[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._methods["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3119__auto__ = mf;
    if(and__3119__auto__) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__3723__auto__ = mf == null ? null : mf;
    return function() {
      var or__3128__auto__ = cljs.core._prefers[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._prefers["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3119__auto__ = mf;
    if(and__3119__auto__) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__3723__auto__ = mf == null ? null : mf;
    return function() {
      var or__3128__auto__ = cljs.core._dispatch[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = cljs.core._dispatch["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, name, dispatch_fn, args) {
  var dispatch_val = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn = cljs.core._get_method.call(null, mf, dispatch_val);
  if(cljs.core.truth_(target_fn)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val)].join(""));
  }
  return cljs.core.apply.call(null, target_fn, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 256
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorStr = "cljs.core/MultiFn";
cljs.core.MultiFn.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  var this$__$1 = this;
  return goog.getUid(this$__$1)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var self__ = this;
  var mf__$1 = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, function(mf__$2) {
    return cljs.core.PersistentArrayMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.method_cache, function(mf__$2) {
    return cljs.core.PersistentArrayMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.prefer_table, function(mf__$2) {
    return cljs.core.PersistentArrayMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.cached_hierarchy, function(mf__$2) {
    return null
  });
  return mf__$1
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var self__ = this;
  var mf__$1 = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf__$1
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  var mf__$1 = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf__$1
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  var mf__$1 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, self__.cached_hierarchy), cljs.core.deref.call(null, self__.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
  }
  var temp__4090__auto__ = cljs.core.deref.call(null, self__.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto__)) {
    var target_fn = temp__4090__auto__;
    return target_fn
  }else {
    var temp__4090__auto____$1 = cljs.core.find_and_cache_best_method.call(null, self__.name, dispatch_val, self__.hierarchy, self__.method_table, self__.prefer_table, self__.method_cache, self__.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____$1)) {
      var target_fn = temp__4090__auto____$1;
      return target_fn
    }else {
      return cljs.core.deref.call(null, self__.method_table).call(null, self__.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var self__ = this;
  var mf__$1 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, self__.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(self__.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, self__.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var self__ = this;
  var mf__$1 = this;
  return cljs.core.deref.call(null, self__.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var self__ = this;
  var mf__$1 = this;
  return cljs.core.deref.call(null, self__.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var self__ = this;
  var mf__$1 = this;
  return cljs.core.do_dispatch.call(null, mf__$1, self__.name, self__.dispatch_fn, args)
};
cljs.core.__GT_MultiFn = function __GT_MultiFn(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  return new cljs.core.MultiFn(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
};
cljs.core.MultiFn.prototype.call = function() {
  var G__6991__delegate = function(_, args) {
    var self = this;
    return cljs.core._dispatch.call(null, self, args)
  };
  var G__6991 = function(_, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__6991__delegate.call(this, _, args)
  };
  G__6991.cljs$lang$maxFixedArity = 1;
  G__6991.cljs$lang$applyTo = function(arglist__6992) {
    var _ = cljs.core.first(arglist__6992);
    var args = cljs.core.rest(arglist__6992);
    return G__6991__delegate(_, args)
  };
  G__6991.cljs$core$IFn$_invoke$arity$variadic = G__6991__delegate;
  return G__6991
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self = this;
  return cljs.core._dispatch.call(null, self, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2153775104
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorStr = "cljs.core/UUID";
cljs.core.UUID.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  var this$__$1 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$__$1))
};
cljs.core.UUID.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(_, writer, ___$1) {
  var self__ = this;
  var ___$2 = this;
  return cljs.core._write.call(null, writer, [cljs.core.str('#uuid "'), cljs.core.str(self__.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  var ___$1 = this;
  return other instanceof cljs.core.UUID && self__.uuid === other.uuid
};
cljs.core.__GT_UUID = function __GT_UUID(uuid) {
  return new cljs.core.UUID(uuid)
};
cljs.core.ExceptionInfo = function(message, data, cause) {
  this.message = message;
  this.data = data;
  this.cause = cause
};
cljs.core.ExceptionInfo.cljs$lang$type = true;
cljs.core.ExceptionInfo.cljs$lang$ctorStr = "cljs.core/ExceptionInfo";
cljs.core.ExceptionInfo.cljs$lang$ctorPrWriter = function(this__3667__auto__, writer__3668__auto__, opts__3669__auto__) {
  return cljs.core._write.call(null, writer__3668__auto__, "cljs.core/ExceptionInfo")
};
cljs.core.__GT_ExceptionInfo = function __GT_ExceptionInfo(message, data, cause) {
  return new cljs.core.ExceptionInfo(message, data, cause)
};
cljs.core.ExceptionInfo.prototype = new Error;
cljs.core.ExceptionInfo.prototype.constructor = cljs.core.ExceptionInfo;
cljs.core.ex_info = function() {
  var ex_info = null;
  var ex_info__2 = function(msg, map) {
    return new cljs.core.ExceptionInfo(msg, map, null)
  };
  var ex_info__3 = function(msg, map, cause) {
    return new cljs.core.ExceptionInfo(msg, map, cause)
  };
  ex_info = function(msg, map, cause) {
    switch(arguments.length) {
      case 2:
        return ex_info__2.call(this, msg, map);
      case 3:
        return ex_info__3.call(this, msg, map, cause)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ex_info.cljs$core$IFn$_invoke$arity$2 = ex_info__2;
  ex_info.cljs$core$IFn$_invoke$arity$3 = ex_info__3;
  return ex_info
}();
cljs.core.ex_data = function ex_data(ex) {
  if(ex instanceof cljs.core.ExceptionInfo) {
    return ex.data
  }else {
    return null
  }
};
cljs.core.ex_message = function ex_message(ex) {
  if(ex instanceof Error) {
    return ex.message
  }else {
    return null
  }
};
cljs.core.ex_cause = function ex_cause(ex) {
  if(ex instanceof cljs.core.ExceptionInfo) {
    return ex.cause
  }else {
    return null
  }
};
cljs.core.comparator = function comparator(pred) {
  return function(x, y) {
    if(cljs.core.truth_(pred.call(null, x, y))) {
      return-1
    }else {
      if(cljs.core.truth_(pred.call(null, y, x))) {
        return 1
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return 0
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.special_symbol_QMARK_ = function special_symbol_QMARK_(x) {
  return cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray([new cljs.core.Symbol(null, "deftype*", "deftype*", -978581244, null), null, new cljs.core.Symbol(null, "new", "new", -1640422567, null), null, new cljs.core.Symbol(null, "quote", "quote", -1532577739, null), null, new cljs.core.Symbol(null, "\x26", "\x26", -1640531489, null), null, new cljs.core.Symbol(null, "set!", "set!", -1637004872, null), null, new cljs.core.Symbol(null, "recur", "recur", -1532142362, null), 
  null, new cljs.core.Symbol(null, ".", ".", -1640531481, null), null, new cljs.core.Symbol(null, "ns", "ns", -1640528002, null), null, new cljs.core.Symbol(null, "do", "do", -1640528316, null), null, new cljs.core.Symbol(null, "fn*", "fn*", -1640430053, null), null, new cljs.core.Symbol(null, "throw", "throw", -1530191713, null), null, new cljs.core.Symbol(null, "letfn*", "letfn*", 1548249632, null), null, new cljs.core.Symbol(null, "js*", "js*", -1640426054, null), null, new cljs.core.Symbol(null, 
  "defrecord*", "defrecord*", 774272013, null), null, new cljs.core.Symbol(null, "let*", "let*", -1637213400, null), null, new cljs.core.Symbol(null, "loop*", "loop*", -1537374273, null), null, new cljs.core.Symbol(null, "try", "try", -1640416396, null), null, new cljs.core.Symbol(null, "if", "if", -1640528170, null), null, new cljs.core.Symbol(null, "def", "def", -1640432194, null), null], true), x)
};
goog.provide("angular_cljs_todo.core");
goog.require("cljs.core");
angular_cljs_todo.core.expose = function expose(src, dest) {
  var dest__$1 = cljs.core.name.call(null, dest);
  var o_SHARP_ = window;
  o_SHARP_[dest__$1] = src;
  return o_SHARP_
};
angular_cljs_todo.core.todos = [function() {
  var G__6507 = {};
  G__6507["text"] = "clean dishes";
  G__6507["done"] = false;
  return G__6507
}(), function() {
  var G__6509 = {};
  G__6509["text"] = "throw out garbage";
  G__6509["done"] = false;
  return G__6509
}()];
angular_cljs_todo.core.clear_new_todo_text = function clear_new_todo_text($scope) {
  var o_SHARP_ = $scope;
  delete o_SHARP_["newTodoText"];
  return o_SHARP_
};
angular_cljs_todo.core.add_todo = function add_todo(text) {
  var obj_SHARP__6515 = angular_cljs_todo.core.todos;
  var fn_SHARP__6516 = obj_SHARP__6515["push"];
  fn_SHARP__6516.call(obj_SHARP__6515, function() {
    var G__6513 = {};
    G__6513["text"] = text;
    G__6513["done"] = false;
    return G__6513
  }());
  return angular_cljs_todo.core.clear_new_todo_text.call(null, this)
};
angular_cljs_todo.core.todo_controller = function todo_controller($scope) {
  var o_SHARP__6517 = $scope;
  o_SHARP__6517["todos"] = angular_cljs_todo.core.todos;
  var o_SHARP_ = $scope;
  o_SHARP_["addTodo"] = angular_cljs_todo.core.add_todo;
  return o_SHARP_
};
angular_cljs_todo.core.expose.call(null, angular_cljs_todo.core.todo_controller, new cljs.core.Keyword(null, "TodoController", "TodoController", 4049815572));
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(typeof match === "string") {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  join.cljs$core$IFn$_invoke$arity$1 = join__1;
  join.cljs$core$IFn$_invoke$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.pop_last_while_empty = function pop_last_while_empty(v) {
  var v__$1 = v;
  while(true) {
    if(cljs.core._EQ_.call(null, "", cljs.core.peek.call(null, v__$1))) {
      var G__7031 = cljs.core.pop.call(null, v__$1);
      v__$1 = G__7031;
      continue
    }else {
      return v__$1
    }
    break
  }
};
clojure.string.discard_trailing_if_needed = function discard_trailing_if_needed(limit, v) {
  if(cljs.core._EQ_.call(null, 0, limit)) {
    return clojure.string.pop_last_while_empty.call(null, v)
  }else {
    return v
  }
};
clojure.string.split_with_empty_regex = function split_with_empty_regex(s, limit) {
  if(limit <= 0 || limit >= 2 + cljs.core.count.call(null, s)) {
    return cljs.core.conj.call(null, cljs.core.vec.call(null, cljs.core.cons.call(null, "", cljs.core.map.call(null, cljs.core.str, cljs.core.seq.call(null, s)))), "")
  }else {
    var pred__7035 = cljs.core._EQ_;
    var expr__7036 = limit;
    if(pred__7035.call(null, 1, expr__7036)) {
      return cljs.core.vector.call(null, s)
    }else {
      if(pred__7035.call(null, 2, expr__7036)) {
        return cljs.core.vector.call(null, "", s)
      }else {
        var c = limit - 2;
        return cljs.core.conj.call(null, cljs.core.vec.call(null, cljs.core.cons.call(null, "", cljs.core.subvec.call(null, cljs.core.vec.call(null, cljs.core.map.call(null, cljs.core.str, cljs.core.seq.call(null, s))), 0, c))), cljs.core.subs.call(null, s, c))
      }
    }
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return split.call(null, s, re, 0)
  };
  var split__3 = function(s, re, limit) {
    return clojure.string.discard_trailing_if_needed.call(null, limit, cljs.core._EQ_.call(null, [cljs.core.str(re)].join(""), "/(?:)/") ? clojure.string.split_with_empty_regex.call(null, s, limit) : limit < 1 ? cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re)) : function() {
      var s__$1 = s;
      var limit__$1 = limit;
      var parts = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__$1, 1)) {
          return cljs.core.conj.call(null, parts, s__$1)
        }else {
          var temp__4090__auto__ = cljs.core.re_find.call(null, re, s__$1);
          if(cljs.core.truth_(temp__4090__auto__)) {
            var m = temp__4090__auto__;
            var index = s__$1.indexOf(m);
            var G__7038 = s__$1.substring(index + cljs.core.count.call(null, m));
            var G__7039 = limit__$1 - 1;
            var G__7040 = cljs.core.conj.call(null, parts, s__$1.substring(0, index));
            s__$1 = G__7038;
            limit__$1 = G__7039;
            parts = G__7040;
            continue
          }else {
            return cljs.core.conj.call(null, parts, s__$1)
          }
        }
        break
      }
    }())
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  split.cljs$core$IFn$_invoke$arity$2 = split__2;
  split.cljs$core$IFn$_invoke$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index = s.length;
  while(true) {
    if(index === 0) {
      return""
    }else {
      var ch = cljs.core.get.call(null, s, index - 1);
      if(cljs.core._EQ_.call(null, ch, "\n") || cljs.core._EQ_.call(null, ch, "\r")) {
        var G__7041 = index - 1;
        index = G__7041;
        continue
      }else {
        return s.substring(0, index)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  return goog.string.isEmptySafe(s)
};
clojure.string.escape = function escape(s, cmap) {
  var buffer = new goog.string.StringBuffer;
  var length = s.length;
  var index = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length, index)) {
      return buffer.toString()
    }else {
      var ch = s.charAt(index);
      var temp__4090__auto___7042 = cljs.core.get.call(null, cmap, ch);
      if(cljs.core.truth_(temp__4090__auto___7042)) {
        var replacement_7043 = temp__4090__auto___7042;
        buffer.append([cljs.core.str(replacement_7043)].join(""))
      }else {
        buffer.append(ch)
      }
      var G__7044 = index + 1;
      index = G__7044;
      continue
    }
    break
  }
};
goog.provide("speclj.platform");
goog.require("cljs.core");
goog.require("clojure.string");
goog.require("clojure.string");
speclj.platform.endl = "\n";
speclj.platform.file_separator = "/";
speclj.platform.re_type = cljs.core.type.call(null, /./);
speclj.platform.re_QMARK_ = function re_QMARK_(obj) {
  return cljs.core._EQ_.call(null, speclj.platform.re_type, cljs.core.type.call(null, obj))
};
speclj.platform.SpecFailure = function(message) {
  this.message = message
};
speclj.platform.SpecFailure.cljs$lang$type = true;
speclj.platform.SpecFailure.cljs$lang$ctorStr = "speclj.platform/SpecFailure";
speclj.platform.SpecFailure.cljs$lang$ctorPrWriter = function(this__3667__auto__, writer__3668__auto__, opts__3669__auto__) {
  return cljs.core._write.call(null, writer__3668__auto__, "speclj.platform/SpecFailure")
};
speclj.platform.__GT_SpecFailure = function __GT_SpecFailure(message) {
  return new speclj.platform.SpecFailure(message)
};
speclj.platform.SpecPending = function(message) {
  this.message = message
};
speclj.platform.SpecPending.cljs$lang$type = true;
speclj.platform.SpecPending.cljs$lang$ctorStr = "speclj.platform/SpecPending";
speclj.platform.SpecPending.cljs$lang$ctorPrWriter = function(this__3667__auto__, writer__3668__auto__, opts__3669__auto__) {
  return cljs.core._write.call(null, writer__3668__auto__, "speclj.platform/SpecPending")
};
speclj.platform.__GT_SpecPending = function __GT_SpecPending(message) {
  return new speclj.platform.SpecPending(message)
};
speclj.platform.bound_by_should_invoke_QMARK_ = function bound_by_should_invoke_QMARK_() {
  return speclj.platform._STAR_bound_by_should_invoke_STAR_
};
speclj.platform.throwable = Object;
speclj.platform.exception = Error;
speclj.platform.failure = speclj.platform.SpecFailure;
speclj.platform.pending = speclj.platform.SpecPending;
speclj.platform.new_exception = function() {
  var new_exception = null;
  var new_exception__0 = function() {
    return new Error
  };
  var new_exception__1 = function(message) {
    return new Error(message)
  };
  var new_exception__2 = function(message, cause) {
    return new Error(message)
  };
  new_exception = function(message, cause) {
    switch(arguments.length) {
      case 0:
        return new_exception__0.call(this);
      case 1:
        return new_exception__1.call(this, message);
      case 2:
        return new_exception__2.call(this, message, cause)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  new_exception.cljs$core$IFn$_invoke$arity$0 = new_exception__0;
  new_exception.cljs$core$IFn$_invoke$arity$1 = new_exception__1;
  new_exception.cljs$core$IFn$_invoke$arity$2 = new_exception__2;
  return new_exception
}();
speclj.platform.new_throwable = function() {
  var new_throwable = null;
  var new_throwable__0 = function() {
    return new Object
  };
  var new_throwable__1 = function(message) {
    return new Object(message)
  };
  new_throwable = function(message) {
    switch(arguments.length) {
      case 0:
        return new_throwable__0.call(this);
      case 1:
        return new_throwable__1.call(this, message)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  new_throwable.cljs$core$IFn$_invoke$arity$0 = new_throwable__0;
  new_throwable.cljs$core$IFn$_invoke$arity$1 = new_throwable__1;
  return new_throwable
}();
speclj.platform.new_failure = function new_failure(message) {
  return new speclj.platform.SpecFailure(message)
};
speclj.platform.new_pending = function new_pending(message) {
  return new speclj.platform.SpecPending(message)
};
speclj.platform.throw_error = function throw_error(message) {
  throw new Error(message);
};
speclj.platform.difference_greater_than_delta_QMARK_ = function difference_greater_than_delta_QMARK_(expected, actual, delta) {
  return Math.abs(expected - actual) > Math.abs(delta)
};
speclj.platform.pending_QMARK_ = function pending_QMARK_(e) {
  return cljs.core.isa_QMARK_.call(null, cljs.core.type.call(null, e), speclj.platform.pending)
};
speclj.platform.failure_QMARK_ = function failure_QMARK_(e) {
  return cljs.core.isa_QMARK_.call(null, cljs.core.type.call(null, e), speclj.platform.failure)
};
speclj.platform.error_message = function error_message(e) {
  return e.message
};
speclj.platform.failure_source = function failure_source(e) {
  if(cljs.core.truth_(e.fileName)) {
    return[cljs.core.str(e.fileName), cljs.core.str(":"), cljs.core.str(function() {
      var or__3128__auto__ = e.lineNumber;
      if(cljs.core.truth_(or__3128__auto__)) {
        return or__3128__auto__
      }else {
        return"?"
      }
    }())].join("")
  }else {
    if(cljs.core.truth_(e.stack)) {
      return clojure.string.trim.call(null, cljs.core.nth.call(null, clojure.string.split_lines.call(null, e.stack), cljs.core.count.call(null, clojure.string.split_lines.call(null, e.message))))
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return"unkown-file:?"
      }else {
        return null
      }
    }
  }
};
speclj.platform.stack_trace = function stack_trace(e) {
  return cljs.core.rest.call(null, clojure.string.split_lines.call(null, function() {
    var or__3128__auto__ = e.stack;
    if(cljs.core.truth_(or__3128__auto__)) {
      return or__3128__auto__
    }else {
      return e.toString()
    }
  }()))
};
speclj.platform.cause = function cause(e) {
  return null
};
speclj.platform.print_stack_trace = function print_stack_trace(e) {
  return cljs.core.println.call(null, function() {
    var or__3128__auto__ = e.stack;
    if(cljs.core.truth_(or__3128__auto__)) {
      return or__3128__auto__
    }else {
      return"missing stack trace"
    }
  }())
};
speclj.platform.elide_level_QMARK_ = function elide_level_QMARK_(stack_element) {
  return false
};
speclj.platform.type_name = function type_name(t) {
  if(cljs.core.truth_(t)) {
    return t.name
  }else {
    return"nil"
  }
};
speclj.platform.format_seconds = function format_seconds(secs) {
  return secs.toFixed(5)
};
speclj.platform.current_time = function current_time() {
  return(new Date).getTime()
};
speclj.platform.secs_since = function secs_since(start) {
  return((new Date).getTime() - start) / 1E3
};
cljs.core._STAR_print_fn_STAR_ = function(thing) {
  return console.log(thing)
};
speclj.platform.dynamically_invoke = function dynamically_invoke(ns_name, fn_name) {
  var code = [cljs.core.str(clojure.string.replace.call(null, ns_name, "-", "_")), cljs.core.str("."), cljs.core.str(clojure.string.replace.call(null, fn_name, "-", "_")), cljs.core.str("();")].join("");
  return eval(code)
};
goog.provide("speclj.components");
goog.require("cljs.core");
speclj.components.SpecComponent = {};
speclj.components.install = function install(this$, description) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.speclj$components$SpecComponent$install$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.speclj$components$SpecComponent$install$arity$2(this$, description)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = speclj.components.install[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = speclj.components.install["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "SpecComponent.install", this$);
        }
      }
    }().call(null, this$, description)
  }
};
speclj.components.SpecComponent["object"] = true;
speclj.components.install["object"] = function(this$, description) {
  return null
};
cljs.core.PersistentVector.prototype.speclj$components$SpecComponent$ = true;
cljs.core.PersistentVector.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var this$__$1 = this;
  var seq__7318 = cljs.core.seq.call(null, cljs.core.seq.call(null, this$__$1));
  var chunk__7319 = null;
  var count__7320 = 0;
  var i__7321 = 0;
  while(true) {
    if(i__7321 < count__7320) {
      var component = cljs.core._nth.call(null, chunk__7319, i__7321);
      speclj.components.install.call(null, component, description);
      var G__7334 = seq__7318;
      var G__7335 = chunk__7319;
      var G__7336 = count__7320;
      var G__7337 = i__7321 + 1;
      seq__7318 = G__7334;
      chunk__7319 = G__7335;
      count__7320 = G__7336;
      i__7321 = G__7337;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7318);
      if(temp__4092__auto__) {
        var seq__7318__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7318__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7318__$1);
          var G__7338 = cljs.core.chunk_rest.call(null, seq__7318__$1);
          var G__7339 = c__3844__auto__;
          var G__7340 = cljs.core.count.call(null, c__3844__auto__);
          var G__7341 = 0;
          seq__7318 = G__7338;
          chunk__7319 = G__7339;
          count__7320 = G__7340;
          i__7321 = G__7341;
          continue
        }else {
          var component = cljs.core.first.call(null, seq__7318__$1);
          speclj.components.install.call(null, component, description);
          var G__7342 = cljs.core.next.call(null, seq__7318__$1);
          var G__7343 = null;
          var G__7344 = 0;
          var G__7345 = 0;
          seq__7318 = G__7342;
          chunk__7319 = G__7343;
          count__7320 = G__7344;
          i__7321 = G__7345;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.EmptyList.prototype.speclj$components$SpecComponent$ = true;
cljs.core.EmptyList.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var this$__$1 = this;
  var seq__7322 = cljs.core.seq.call(null, cljs.core.seq.call(null, this$__$1));
  var chunk__7323 = null;
  var count__7324 = 0;
  var i__7325 = 0;
  while(true) {
    if(i__7325 < count__7324) {
      var component = cljs.core._nth.call(null, chunk__7323, i__7325);
      speclj.components.install.call(null, component, description);
      var G__7346 = seq__7322;
      var G__7347 = chunk__7323;
      var G__7348 = count__7324;
      var G__7349 = i__7325 + 1;
      seq__7322 = G__7346;
      chunk__7323 = G__7347;
      count__7324 = G__7348;
      i__7325 = G__7349;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7322);
      if(temp__4092__auto__) {
        var seq__7322__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7322__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7322__$1);
          var G__7350 = cljs.core.chunk_rest.call(null, seq__7322__$1);
          var G__7351 = c__3844__auto__;
          var G__7352 = cljs.core.count.call(null, c__3844__auto__);
          var G__7353 = 0;
          seq__7322 = G__7350;
          chunk__7323 = G__7351;
          count__7324 = G__7352;
          i__7325 = G__7353;
          continue
        }else {
          var component = cljs.core.first.call(null, seq__7322__$1);
          speclj.components.install.call(null, component, description);
          var G__7354 = cljs.core.next.call(null, seq__7322__$1);
          var G__7355 = null;
          var G__7356 = 0;
          var G__7357 = 0;
          seq__7322 = G__7354;
          chunk__7323 = G__7355;
          count__7324 = G__7356;
          i__7325 = G__7357;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.List.prototype.speclj$components$SpecComponent$ = true;
cljs.core.List.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var this$__$1 = this;
  var seq__7326 = cljs.core.seq.call(null, cljs.core.seq.call(null, this$__$1));
  var chunk__7327 = null;
  var count__7328 = 0;
  var i__7329 = 0;
  while(true) {
    if(i__7329 < count__7328) {
      var component = cljs.core._nth.call(null, chunk__7327, i__7329);
      speclj.components.install.call(null, component, description);
      var G__7358 = seq__7326;
      var G__7359 = chunk__7327;
      var G__7360 = count__7328;
      var G__7361 = i__7329 + 1;
      seq__7326 = G__7358;
      chunk__7327 = G__7359;
      count__7328 = G__7360;
      i__7329 = G__7361;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7326);
      if(temp__4092__auto__) {
        var seq__7326__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7326__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7326__$1);
          var G__7362 = cljs.core.chunk_rest.call(null, seq__7326__$1);
          var G__7363 = c__3844__auto__;
          var G__7364 = cljs.core.count.call(null, c__3844__auto__);
          var G__7365 = 0;
          seq__7326 = G__7362;
          chunk__7327 = G__7363;
          count__7328 = G__7364;
          i__7329 = G__7365;
          continue
        }else {
          var component = cljs.core.first.call(null, seq__7326__$1);
          speclj.components.install.call(null, component, description);
          var G__7366 = cljs.core.next.call(null, seq__7326__$1);
          var G__7367 = null;
          var G__7368 = 0;
          var G__7369 = 0;
          seq__7326 = G__7366;
          chunk__7327 = G__7367;
          count__7328 = G__7368;
          i__7329 = G__7369;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.LazySeq.prototype.speclj$components$SpecComponent$ = true;
cljs.core.LazySeq.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var this$__$1 = this;
  var seq__7330 = cljs.core.seq.call(null, cljs.core.seq.call(null, this$__$1));
  var chunk__7331 = null;
  var count__7332 = 0;
  var i__7333 = 0;
  while(true) {
    if(i__7333 < count__7332) {
      var component = cljs.core._nth.call(null, chunk__7331, i__7333);
      speclj.components.install.call(null, component, description);
      var G__7370 = seq__7330;
      var G__7371 = chunk__7331;
      var G__7372 = count__7332;
      var G__7373 = i__7333 + 1;
      seq__7330 = G__7370;
      chunk__7331 = G__7371;
      count__7332 = G__7372;
      i__7333 = G__7373;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7330);
      if(temp__4092__auto__) {
        var seq__7330__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7330__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7330__$1);
          var G__7374 = cljs.core.chunk_rest.call(null, seq__7330__$1);
          var G__7375 = c__3844__auto__;
          var G__7376 = cljs.core.count.call(null, c__3844__auto__);
          var G__7377 = 0;
          seq__7330 = G__7374;
          chunk__7331 = G__7375;
          count__7332 = G__7376;
          i__7333 = G__7377;
          continue
        }else {
          var component = cljs.core.first.call(null, seq__7330__$1);
          speclj.components.install.call(null, component, description);
          var G__7378 = cljs.core.next.call(null, seq__7330__$1);
          var G__7379 = null;
          var G__7380 = 0;
          var G__7381 = 0;
          seq__7330 = G__7378;
          chunk__7331 = G__7379;
          count__7332 = G__7380;
          i__7333 = G__7381;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
speclj.components.Description = function(name, ns, parent, children, charcteristics, tags, befores, before_alls, afters, after_alls, withs, with_alls, arounds) {
  this.name = name;
  this.ns = ns;
  this.parent = parent;
  this.children = children;
  this.charcteristics = charcteristics;
  this.tags = tags;
  this.befores = befores;
  this.before_alls = before_alls;
  this.afters = afters;
  this.after_alls = after_alls;
  this.withs = withs;
  this.with_alls = with_alls;
  this.arounds = arounds
};
speclj.components.Description.cljs$lang$type = true;
speclj.components.Description.cljs$lang$ctorStr = "speclj.components/Description";
speclj.components.Description.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.components/Description")
};
speclj.components.Description.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return[cljs.core.str("Description: "), cljs.core.str('"'), cljs.core.str(self__.name), cljs.core.str('"')].join("")
};
speclj.components.Description.prototype.speclj$components$SpecComponent$ = true;
speclj.components.Description.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  cljs.core.reset_BANG_.call(null, this$__$1.parent, description);
  return cljs.core.swap_BANG_.call(null, description.children, cljs.core.conj, this$__$1)
};
speclj.components.__GT_Description = function __GT_Description(name, ns, parent, children, charcteristics, tags, befores, before_alls, afters, after_alls, withs, with_alls, arounds) {
  return new speclj.components.Description(name, ns, parent, children, charcteristics, tags, befores, before_alls, afters, after_alls, withs, with_alls, arounds)
};
speclj.components.new_description = function new_description(name, ns) {
  return new speclj.components.Description(name, ns, cljs.core.atom.call(null, null), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentHashSet.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), 
  cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY))
};
speclj.components.Characteristic = function(name, parent, body) {
  this.name = name;
  this.parent = parent;
  this.body = body
};
speclj.components.Characteristic.cljs$lang$type = true;
speclj.components.Characteristic.cljs$lang$ctorStr = "speclj.components/Characteristic";
speclj.components.Characteristic.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.components/Characteristic")
};
speclj.components.Characteristic.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return[cljs.core.str('"'), cljs.core.str(self__.name), cljs.core.str('"')].join("")
};
speclj.components.Characteristic.prototype.speclj$components$SpecComponent$ = true;
speclj.components.Characteristic.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  cljs.core.reset_BANG_.call(null, this$__$1.parent, description);
  return cljs.core.swap_BANG_.call(null, description.charcteristics, cljs.core.conj, this$__$1)
};
speclj.components.__GT_Characteristic = function __GT_Characteristic(name, parent, body) {
  return new speclj.components.Characteristic(name, parent, body)
};
speclj.components.new_characteristic = function() {
  var new_characteristic = null;
  var new_characteristic__2 = function(name, body) {
    return new speclj.components.Characteristic(name, cljs.core.atom.call(null, null), body)
  };
  var new_characteristic__3 = function(name, description, body) {
    return new speclj.components.Characteristic(name, cljs.core.atom.call(null, description), body)
  };
  new_characteristic = function(name, description, body) {
    switch(arguments.length) {
      case 2:
        return new_characteristic__2.call(this, name, description);
      case 3:
        return new_characteristic__3.call(this, name, description, body)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  new_characteristic.cljs$core$IFn$_invoke$arity$2 = new_characteristic__2;
  new_characteristic.cljs$core$IFn$_invoke$arity$3 = new_characteristic__3;
  return new_characteristic
}();
speclj.components.Before = function(body) {
  this.body = body
};
speclj.components.Before.cljs$lang$type = true;
speclj.components.Before.cljs$lang$ctorStr = "speclj.components/Before";
speclj.components.Before.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.components/Before")
};
speclj.components.Before.prototype.speclj$components$SpecComponent$ = true;
speclj.components.Before.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  return cljs.core.swap_BANG_.call(null, description.befores, cljs.core.conj, this$__$1)
};
speclj.components.__GT_Before = function __GT_Before(body) {
  return new speclj.components.Before(body)
};
speclj.components.new_before = function new_before(body) {
  return new speclj.components.Before(body)
};
speclj.components.After = function(body) {
  this.body = body
};
speclj.components.After.cljs$lang$type = true;
speclj.components.After.cljs$lang$ctorStr = "speclj.components/After";
speclj.components.After.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.components/After")
};
speclj.components.After.prototype.speclj$components$SpecComponent$ = true;
speclj.components.After.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  return cljs.core.swap_BANG_.call(null, description.afters, cljs.core.conj, this$__$1)
};
speclj.components.__GT_After = function __GT_After(body) {
  return new speclj.components.After(body)
};
speclj.components.new_after = function new_after(body) {
  return new speclj.components.After(body)
};
speclj.components.Around = function(body) {
  this.body = body
};
speclj.components.Around.cljs$lang$type = true;
speclj.components.Around.cljs$lang$ctorStr = "speclj.components/Around";
speclj.components.Around.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.components/Around")
};
speclj.components.Around.prototype.speclj$components$SpecComponent$ = true;
speclj.components.Around.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  return cljs.core.swap_BANG_.call(null, description.arounds, cljs.core.conj, this$__$1)
};
speclj.components.__GT_Around = function __GT_Around(body) {
  return new speclj.components.Around(body)
};
speclj.components.new_around = function new_around(body) {
  return new speclj.components.Around(body)
};
speclj.components.BeforeAll = function(body) {
  this.body = body
};
speclj.components.BeforeAll.cljs$lang$type = true;
speclj.components.BeforeAll.cljs$lang$ctorStr = "speclj.components/BeforeAll";
speclj.components.BeforeAll.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.components/BeforeAll")
};
speclj.components.BeforeAll.prototype.speclj$components$SpecComponent$ = true;
speclj.components.BeforeAll.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  return cljs.core.swap_BANG_.call(null, description.before_alls, cljs.core.conj, this$__$1)
};
speclj.components.__GT_BeforeAll = function __GT_BeforeAll(body) {
  return new speclj.components.BeforeAll(body)
};
speclj.components.new_before_all = function new_before_all(body) {
  return new speclj.components.BeforeAll(body)
};
speclj.components.AfterAll = function(body) {
  this.body = body
};
speclj.components.AfterAll.cljs$lang$type = true;
speclj.components.AfterAll.cljs$lang$ctorStr = "speclj.components/AfterAll";
speclj.components.AfterAll.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.components/AfterAll")
};
speclj.components.AfterAll.prototype.speclj$components$SpecComponent$ = true;
speclj.components.AfterAll.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  return cljs.core.swap_BANG_.call(null, description.after_alls, cljs.core.conj, this$__$1)
};
speclj.components.__GT_AfterAll = function __GT_AfterAll(body) {
  return new speclj.components.AfterAll(body)
};
speclj.components.new_after_all = function new_after_all(body) {
  return new speclj.components.AfterAll(body)
};
speclj.components.With = function(name, unique_name, body, value, bang) {
  this.name = name;
  this.unique_name = unique_name;
  this.body = body;
  this.value = value;
  this.bang = bang;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
speclj.components.With.cljs$lang$type = true;
speclj.components.With.cljs$lang$ctorStr = "speclj.components/With";
speclj.components.With.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.components/With")
};
speclj.components.With.prototype.cljs$core$IDeref$_deref$arity$1 = function(this$) {
  var self__ = this;
  var this$__$1 = this;
  if(cljs.core._EQ_.call(null, new cljs.core.Keyword("speclj.components", "none", "speclj.components/none", 3628366185), cljs.core.deref.call(null, self__.value))) {
    cljs.core.reset_BANG_.call(null, self__.value, self__.body.call(null))
  }else {
  }
  return cljs.core.deref.call(null, self__.value)
};
speclj.components.With.prototype.speclj$components$SpecComponent$ = true;
speclj.components.With.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  return cljs.core.swap_BANG_.call(null, description.withs, cljs.core.conj, this$__$1)
};
speclj.components.__GT_With = function __GT_With(name, unique_name, body, value, bang) {
  return new speclj.components.With(name, unique_name, body, value, bang)
};
speclj.components.reset_with = function reset_with(with$) {
  cljs.core.reset_BANG_.call(null, with$.value, new cljs.core.Keyword("speclj.components", "none", "speclj.components/none", 3628366185));
  if(cljs.core.truth_(with$.bang)) {
    return cljs.core.deref.call(null, with$)
  }else {
    return null
  }
};
speclj.components.new_with = function new_with(name, unique_name, body, bang) {
  var with$ = new speclj.components.With(name, unique_name, body, cljs.core.atom.call(null, new cljs.core.Keyword("speclj.components", "none", "speclj.components/none", 3628366185)), bang);
  if(cljs.core.truth_(bang)) {
    cljs.core.deref.call(null, with$)
  }else {
  }
  return with$
};
speclj.components.WithAll = function(name, unique_name, body, value, bang) {
  this.name = name;
  this.unique_name = unique_name;
  this.body = body;
  this.value = value;
  this.bang = bang;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
speclj.components.WithAll.cljs$lang$type = true;
speclj.components.WithAll.cljs$lang$ctorStr = "speclj.components/WithAll";
speclj.components.WithAll.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.components/WithAll")
};
speclj.components.WithAll.prototype.cljs$core$IDeref$_deref$arity$1 = function(this$) {
  var self__ = this;
  var this$__$1 = this;
  if(cljs.core._EQ_.call(null, new cljs.core.Keyword("speclj.components", "none", "speclj.components/none", 3628366185), cljs.core.deref.call(null, self__.value))) {
    cljs.core.reset_BANG_.call(null, self__.value, self__.body.call(null))
  }else {
  }
  return cljs.core.deref.call(null, self__.value)
};
speclj.components.WithAll.prototype.speclj$components$SpecComponent$ = true;
speclj.components.WithAll.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  return cljs.core.swap_BANG_.call(null, description.with_alls, cljs.core.conj, this$__$1)
};
speclj.components.__GT_WithAll = function __GT_WithAll(name, unique_name, body, value, bang) {
  return new speclj.components.WithAll(name, unique_name, body, value, bang)
};
speclj.components.new_with_all = function new_with_all(name, unique_name, body, bang) {
  var with_all = new speclj.components.WithAll(name, unique_name, body, cljs.core.atom.call(null, new cljs.core.Keyword("speclj.components", "none", "speclj.components/none", 3628366185)), bang);
  if(cljs.core.truth_(bang)) {
    cljs.core.deref.call(null, with_all)
  }else {
  }
  return with_all
};
speclj.components.Tag = function(name) {
  this.name = name
};
speclj.components.Tag.cljs$lang$type = true;
speclj.components.Tag.cljs$lang$ctorStr = "speclj.components/Tag";
speclj.components.Tag.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.components/Tag")
};
speclj.components.Tag.prototype.speclj$components$SpecComponent$ = true;
speclj.components.Tag.prototype.speclj$components$SpecComponent$install$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  return cljs.core.swap_BANG_.call(null, description.tags, cljs.core.conj, self__.name)
};
speclj.components.__GT_Tag = function __GT_Tag(name) {
  return new speclj.components.Tag(name)
};
speclj.components.new_tag = function new_tag(name) {
  return new speclj.components.Tag(name)
};
goog.provide("speclj.results");
goog.require("cljs.core");
speclj.results.PassResult = function(characteristic, seconds) {
  this.characteristic = characteristic;
  this.seconds = seconds
};
speclj.results.PassResult.cljs$lang$type = true;
speclj.results.PassResult.cljs$lang$ctorStr = "speclj.results/PassResult";
speclj.results.PassResult.cljs$lang$ctorPrWriter = function(this__3667__auto__, writer__3668__auto__, opts__3669__auto__) {
  return cljs.core._write.call(null, writer__3668__auto__, "speclj.results/PassResult")
};
speclj.results.__GT_PassResult = function __GT_PassResult(characteristic, seconds) {
  return new speclj.results.PassResult(characteristic, seconds)
};
speclj.results.FailResult = function(characteristic, seconds, failure) {
  this.characteristic = characteristic;
  this.seconds = seconds;
  this.failure = failure
};
speclj.results.FailResult.cljs$lang$type = true;
speclj.results.FailResult.cljs$lang$ctorStr = "speclj.results/FailResult";
speclj.results.FailResult.cljs$lang$ctorPrWriter = function(this__3667__auto__, writer__3668__auto__, opts__3669__auto__) {
  return cljs.core._write.call(null, writer__3668__auto__, "speclj.results/FailResult")
};
speclj.results.__GT_FailResult = function __GT_FailResult(characteristic, seconds, failure) {
  return new speclj.results.FailResult(characteristic, seconds, failure)
};
speclj.results.PendingResult = function(characteristic, seconds, exception) {
  this.characteristic = characteristic;
  this.seconds = seconds;
  this.exception = exception
};
speclj.results.PendingResult.cljs$lang$type = true;
speclj.results.PendingResult.cljs$lang$ctorStr = "speclj.results/PendingResult";
speclj.results.PendingResult.cljs$lang$ctorPrWriter = function(this__3667__auto__, writer__3668__auto__, opts__3669__auto__) {
  return cljs.core._write.call(null, writer__3668__auto__, "speclj.results/PendingResult")
};
speclj.results.__GT_PendingResult = function __GT_PendingResult(characteristic, seconds, exception) {
  return new speclj.results.PendingResult(characteristic, seconds, exception)
};
speclj.results.ErrorResult = function(characteristic, seconds, exception) {
  this.characteristic = characteristic;
  this.seconds = seconds;
  this.exception = exception
};
speclj.results.ErrorResult.cljs$lang$type = true;
speclj.results.ErrorResult.cljs$lang$ctorStr = "speclj.results/ErrorResult";
speclj.results.ErrorResult.cljs$lang$ctorPrWriter = function(this__3667__auto__, writer__3668__auto__, opts__3669__auto__) {
  return cljs.core._write.call(null, writer__3668__auto__, "speclj.results/ErrorResult")
};
speclj.results.__GT_ErrorResult = function __GT_ErrorResult(characteristic, seconds, exception) {
  return new speclj.results.ErrorResult(characteristic, seconds, exception)
};
speclj.results.pass_result = function pass_result(characteristic, seconds) {
  return new speclj.results.PassResult(characteristic, seconds)
};
speclj.results.fail_result = function fail_result(characteristic, seconds, failure) {
  return new speclj.results.FailResult(characteristic, seconds, failure)
};
speclj.results.pending_result = function pending_result(characteristic, seconds, exception) {
  return new speclj.results.PendingResult(characteristic, seconds, exception)
};
speclj.results.error_result = function error_result(exception) {
  return new speclj.results.ErrorResult(null, 0, exception)
};
speclj.results.pass_QMARK_ = function pass_QMARK_(result) {
  return cljs.core._EQ_.call(null, cljs.core.type.call(null, result), speclj.results.PassResult)
};
speclj.results.fail_QMARK_ = function fail_QMARK_(result) {
  return cljs.core._EQ_.call(null, cljs.core.type.call(null, result), speclj.results.FailResult)
};
speclj.results.pending_QMARK_ = function pending_QMARK_(result) {
  return cljs.core._EQ_.call(null, cljs.core.type.call(null, result), speclj.results.PendingResult)
};
speclj.results.error_QMARK_ = function error_QMARK_(result) {
  return cljs.core._EQ_.call(null, cljs.core.type.call(null, result), speclj.results.ErrorResult)
};
speclj.results.fail_count = function fail_count(results) {
  return cljs.core.reduce.call(null, function(p1__7071_SHARP_, p2__7070_SHARP_) {
    if(cljs.core.truth_(function() {
      var or__3128__auto__ = speclj.results.fail_QMARK_.call(null, p2__7070_SHARP_);
      if(cljs.core.truth_(or__3128__auto__)) {
        return or__3128__auto__
      }else {
        return speclj.results.error_QMARK_.call(null, p2__7070_SHARP_)
      }
    }())) {
      return p1__7071_SHARP_ + 1
    }else {
      return p1__7071_SHARP_
    }
  }, 0, results)
};
speclj.results.categorize = function categorize(results) {
  return cljs.core.reduce.call(null, function(tally, result) {
    if(cljs.core.truth_(speclj.results.pending_QMARK_.call(null, result))) {
      return cljs.core.update_in.call(null, tally, cljs.core.PersistentVector.fromArray([new cljs.core.Keyword(null, "pending", "pending", 4626283785)], true), cljs.core.conj, result)
    }else {
      if(cljs.core.truth_(speclj.results.error_QMARK_.call(null, result))) {
        return cljs.core.update_in.call(null, tally, cljs.core.PersistentVector.fromArray([new cljs.core.Keyword(null, "error", "error", 1110689146)], true), cljs.core.conj, result)
      }else {
        if(cljs.core.truth_(speclj.results.fail_QMARK_.call(null, result))) {
          return cljs.core.update_in.call(null, tally, cljs.core.PersistentVector.fromArray([new cljs.core.Keyword(null, "fail", "fail", 1017039504)], true), cljs.core.conj, result)
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            return cljs.core.update_in.call(null, tally, cljs.core.PersistentVector.fromArray([new cljs.core.Keyword(null, "pass", "pass", 1017337731)], true), cljs.core.conj, result)
          }else {
            return null
          }
        }
      }
    }
  }, cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "pending", "pending", 4626283785), cljs.core.PersistentVector.EMPTY, new cljs.core.Keyword(null, "fail", "fail", 1017039504), cljs.core.PersistentVector.EMPTY, new cljs.core.Keyword(null, "pass", "pass", 1017337731), cljs.core.PersistentVector.EMPTY, new cljs.core.Keyword(null, "error", "error", 1110689146), cljs.core.PersistentVector.EMPTY], true), results)
};
goog.provide("speclj.config");
goog.require("cljs.core");
goog.require("speclj.platform");
goog.require("speclj.platform");
speclj.config.default_reporters = cljs.core.atom.call(null, null);
speclj.config.active_reporters = function active_reporters() {
  if(cljs.core.truth_(speclj.config._STAR_reporters_STAR_)) {
    return speclj.config._STAR_reporters_STAR_
  }else {
    var temp__4090__auto__ = cljs.core.deref.call(null, speclj.config.default_reporters);
    if(cljs.core.truth_(temp__4090__auto__)) {
      var reporters = temp__4090__auto__;
      return reporters
    }else {
      throw speclj.platform.new_exception.call(null, "*reporters* is unbound and no default value has been provided");
    }
  }
};
speclj.config.default_runner = cljs.core.atom.call(null, null);
speclj.config.default_runner_fn = cljs.core.atom.call(null, null);
speclj.config.active_runner = function active_runner() {
  if(cljs.core.truth_(speclj.config._STAR_runner_STAR_)) {
    return speclj.config._STAR_runner_STAR_
  }else {
    var temp__4090__auto__ = cljs.core.deref.call(null, speclj.config.default_runner);
    if(cljs.core.truth_(temp__4090__auto__)) {
      var runner = temp__4090__auto__;
      return runner
    }else {
      throw Error("*runner* is unbound and no default value has been provided");
    }
  }
};
speclj.config._STAR_color_QMARK__STAR_ = false;
speclj.config._STAR_full_stack_trace_QMARK__STAR_ = false;
speclj.config._STAR_tag_filter_STAR_ = cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "include", "include", 2956478490), cljs.core.PersistentHashSet.EMPTY, new cljs.core.Keyword(null, "exclude", "exclude", 3987722572), cljs.core.PersistentHashSet.EMPTY], true);
speclj.config.default_config = cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "specs", "specs", 1123545994), cljs.core.PersistentVector.fromArray(["spec"], true), new cljs.core.Keyword(null, "runner", "runner", 4389065378), "standard", new cljs.core.Keyword(null, "reporters", "reporters", 660581156), cljs.core.PersistentVector.fromArray(["progress"], true), new cljs.core.Keyword(null, "tags", "tags", 1017456523), cljs.core.PersistentVector.EMPTY], true);
speclj.config.config_bindings = function config_bindings() {
  throw"Not Supported";
};
speclj.config.load_runner = function load_runner(name) {
  try {
    return speclj.platform.dynamically_invoke.call(null, [cljs.core.str("speclj.run."), cljs.core.str(name)].join(""), [cljs.core.str("new-"), cljs.core.str(name), cljs.core.str("-runner")].join(""))
  }catch(e7051) {
    if(e7051 instanceof Object) {
      var e = e7051;
      throw speclj.platform.new_exception.call(null, [cljs.core.str("Failed to load runner: "), cljs.core.str(name)].join(""), e);
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        throw e7051;
      }else {
        return null
      }
    }
  }
};
speclj.config.load_reporter_by_name = function load_reporter_by_name(name) {
  try {
    return speclj.platform.dynamically_invoke.call(null, [cljs.core.str("speclj.report."), cljs.core.str(name)].join(""), [cljs.core.str("new-"), cljs.core.str(name), cljs.core.str("-reporter")].join(""))
  }catch(e7053) {
    if(e7053 instanceof Object) {
      var e = e7053;
      throw speclj.platform.new_exception.call(null, [cljs.core.str("Failed to load reporter: "), cljs.core.str(name)].join(""), e);
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        throw e7053;
      }else {
        return null
      }
    }
  }
};
speclj.config.load_reporter = function load_reporter(name_or_object) {
  if(typeof name_or_object === "string") {
    return speclj.config.load_reporter_by_name.call(null, name_or_object)
  }else {
    return name_or_object
  }
};
speclj.config.parse_tags = function parse_tags(values) {
  var result = cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "includes", "includes", 1104163901), cljs.core.PersistentHashSet.EMPTY, new cljs.core.Keyword(null, "excludes", "excludes", 3007959371), cljs.core.PersistentHashSet.EMPTY], true);
  var values__$1 = values;
  while(true) {
    if(cljs.core.seq.call(null, values__$1)) {
      var value = cljs.core.name.call(null, cljs.core.first.call(null, values__$1));
      if(cljs.core._EQ_.call(null, "~", cljs.core.first.call(null, value))) {
        var G__7054 = cljs.core.update_in.call(null, result, cljs.core.PersistentVector.fromArray([new cljs.core.Keyword(null, "excludes", "excludes", 3007959371)], true), cljs.core.conj, cljs.core.keyword.call(null, cljs.core.apply.call(null, cljs.core.str, cljs.core.rest.call(null, value))));
        var G__7055 = cljs.core.rest.call(null, values__$1);
        result = G__7054;
        values__$1 = G__7055;
        continue
      }else {
        var G__7056 = cljs.core.update_in.call(null, result, cljs.core.PersistentVector.fromArray([new cljs.core.Keyword(null, "includes", "includes", 1104163901)], true), cljs.core.conj, cljs.core.keyword.call(null, value));
        var G__7057 = cljs.core.rest.call(null, values__$1);
        result = G__7056;
        values__$1 = G__7057;
        continue
      }
    }else {
      return result
    }
    break
  }
};
speclj.config.config_mappings = function config_mappings(_) {
  throw"Not Supported";
};
speclj.config.with_config = function with_config(config, action) {
  var _STAR_runner_STAR_7064 = speclj.config._STAR_runner_STAR_;
  var _STAR_reporters_STAR_7065 = speclj.config._STAR_reporters_STAR_;
  var _STAR_specs_STAR_7066 = speclj.config._STAR_specs_STAR_;
  var _STAR_color_QMARK__STAR_7067 = speclj.config._STAR_color_QMARK__STAR_;
  var _STAR_full_stack_trace_QMARK__STAR_7068 = speclj.config._STAR_full_stack_trace_QMARK__STAR_;
  var _STAR_tag_filter_STAR_7069 = speclj.config._STAR_tag_filter_STAR_;
  try {
    speclj.config._STAR_runner_STAR_ = cljs.core.truth_((new cljs.core.Keyword(null, "runner", "runner", 4389065378)).cljs$core$IFn$_invoke$arity$1(config)) ? function() {
      cljs.core.println.call(null, "loading runner in config");
      return speclj.config.load_runner.call(null, (new cljs.core.Keyword(null, "runner", "runner", 4389065378)).cljs$core$IFn$_invoke$arity$1(config))
    }() : speclj.config.active_runner.call(null);
    speclj.config._STAR_reporters_STAR_ = cljs.core.truth_((new cljs.core.Keyword(null, "reporters", "reporters", 660581156)).cljs$core$IFn$_invoke$arity$1(config)) ? cljs.core.mapv.call(null, speclj.config.load_reporter, (new cljs.core.Keyword(null, "reporters", "reporters", 660581156)).cljs$core$IFn$_invoke$arity$1(config)) : speclj.config.active_reporters.call(null);
    speclj.config._STAR_specs_STAR_ = (new cljs.core.Keyword(null, "specs", "specs", 1123545994)).cljs$core$IFn$_invoke$arity$1(config);
    speclj.config._STAR_color_QMARK__STAR_ = (new cljs.core.Keyword(null, "color", "color", 1108746965)).cljs$core$IFn$_invoke$arity$1(config);
    speclj.config._STAR_full_stack_trace_QMARK__STAR_ = !((new cljs.core.Keyword(null, "stacktrace", "stacktrace", 3069736751)).cljs$core$IFn$_invoke$arity$1(config) == null);
    speclj.config._STAR_tag_filter_STAR_ = speclj.config.parse_tags.call(null, (new cljs.core.Keyword(null, "tags", "tags", 1017456523)).cljs$core$IFn$_invoke$arity$1(config));
    return action.call(null)
  }finally {
    speclj.config._STAR_tag_filter_STAR_ = _STAR_tag_filter_STAR_7069;
    speclj.config._STAR_full_stack_trace_QMARK__STAR_ = _STAR_full_stack_trace_QMARK__STAR_7068;
    speclj.config._STAR_color_QMARK__STAR_ = _STAR_color_QMARK__STAR_7067;
    speclj.config._STAR_specs_STAR_ = _STAR_specs_STAR_7066;
    speclj.config._STAR_reporters_STAR_ = _STAR_reporters_STAR_7065;
    speclj.config._STAR_runner_STAR_ = _STAR_runner_STAR_7064
  }
};
goog.provide("speclj.reporting");
goog.require("cljs.core");
goog.require("clojure.string");
goog.require("speclj.results");
goog.require("speclj.config");
goog.require("speclj.platform");
goog.require("speclj.results");
goog.require("speclj.platform");
goog.require("speclj.config");
goog.require("goog.string");
goog.require("clojure.string");
goog.require("clojure.string");
speclj.reporting.tally_time = function tally_time(results) {
  return cljs.core.apply.call(null, cljs.core._PLUS_, cljs.core.map.call(null, function(p1__7132_SHARP_) {
    return p1__7132_SHARP_.seconds
  }, results))
};
speclj.reporting.Reporter = {};
speclj.reporting.report_message = function report_message(reporter, message) {
  if(function() {
    var and__3119__auto__ = reporter;
    if(and__3119__auto__) {
      return reporter.speclj$reporting$Reporter$report_message$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return reporter.speclj$reporting$Reporter$report_message$arity$2(reporter, message)
  }else {
    var x__3723__auto__ = reporter == null ? null : reporter;
    return function() {
      var or__3128__auto__ = speclj.reporting.report_message[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = speclj.reporting.report_message["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-message", reporter);
        }
      }
    }().call(null, reporter, message)
  }
};
speclj.reporting.report_description = function report_description(this$, description) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.speclj$reporting$Reporter$report_description$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.speclj$reporting$Reporter$report_description$arity$2(this$, description)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = speclj.reporting.report_description[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = speclj.reporting.report_description["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-description", this$);
        }
      }
    }().call(null, this$, description)
  }
};
speclj.reporting.report_pass = function report_pass(this$, result) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.speclj$reporting$Reporter$report_pass$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.speclj$reporting$Reporter$report_pass$arity$2(this$, result)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = speclj.reporting.report_pass[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = speclj.reporting.report_pass["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-pass", this$);
        }
      }
    }().call(null, this$, result)
  }
};
speclj.reporting.report_pending = function report_pending(this$, result) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.speclj$reporting$Reporter$report_pending$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.speclj$reporting$Reporter$report_pending$arity$2(this$, result)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = speclj.reporting.report_pending[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = speclj.reporting.report_pending["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-pending", this$);
        }
      }
    }().call(null, this$, result)
  }
};
speclj.reporting.report_fail = function report_fail(this$, result) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.speclj$reporting$Reporter$report_fail$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.speclj$reporting$Reporter$report_fail$arity$2(this$, result)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = speclj.reporting.report_fail[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = speclj.reporting.report_fail["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-fail", this$);
        }
      }
    }().call(null, this$, result)
  }
};
speclj.reporting.report_runs = function report_runs(this$, results) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.speclj$reporting$Reporter$report_runs$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.speclj$reporting$Reporter$report_runs$arity$2(this$, results)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = speclj.reporting.report_runs[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = speclj.reporting.report_runs["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-runs", this$);
        }
      }
    }().call(null, this$, results)
  }
};
speclj.reporting.report_error = function report_error(this$, exception) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.speclj$reporting$Reporter$report_error$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.speclj$reporting$Reporter$report_error$arity$2(this$, exception)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = speclj.reporting.report_error[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = speclj.reporting.report_error["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Reporter.report-error", this$);
        }
      }
    }().call(null, this$, exception)
  }
};
speclj.reporting.report_run = function() {
  var method_table__3901__auto__ = cljs.core.atom.call(null, cljs.core.PersistentArrayMap.EMPTY);
  var prefer_table__3902__auto__ = cljs.core.atom.call(null, cljs.core.PersistentArrayMap.EMPTY);
  var method_cache__3903__auto__ = cljs.core.atom.call(null, cljs.core.PersistentArrayMap.EMPTY);
  var cached_hierarchy__3904__auto__ = cljs.core.atom.call(null, cljs.core.PersistentArrayMap.EMPTY);
  var hierarchy__3905__auto__ = cljs.core.get.call(null, cljs.core.PersistentArrayMap.EMPTY, new cljs.core.Keyword(null, "hierarchy", "hierarchy", 3129050535), cljs.core.get_global_hierarchy.call(null));
  return new cljs.core.MultiFn("report-run", function(result, reporters) {
    return cljs.core.type.call(null, result)
  }, new cljs.core.Keyword(null, "default", "default", 2558708147), hierarchy__3905__auto__, method_table__3901__auto__, prefer_table__3902__auto__, method_cache__3903__auto__, cached_hierarchy__3904__auto__)
}();
cljs.core._add_method.call(null, speclj.reporting.report_run, speclj.results.PassResult, function(result, reporters) {
  var seq__7133 = cljs.core.seq.call(null, reporters);
  var chunk__7134 = null;
  var count__7135 = 0;
  var i__7136 = 0;
  while(true) {
    if(i__7136 < count__7135) {
      var reporter = cljs.core._nth.call(null, chunk__7134, i__7136);
      speclj.reporting.report_pass.call(null, reporter, result);
      var G__7137 = seq__7133;
      var G__7138 = chunk__7134;
      var G__7139 = count__7135;
      var G__7140 = i__7136 + 1;
      seq__7133 = G__7137;
      chunk__7134 = G__7138;
      count__7135 = G__7139;
      i__7136 = G__7140;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7133);
      if(temp__4092__auto__) {
        var seq__7133__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7133__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7133__$1);
          var G__7141 = cljs.core.chunk_rest.call(null, seq__7133__$1);
          var G__7142 = c__3844__auto__;
          var G__7143 = cljs.core.count.call(null, c__3844__auto__);
          var G__7144 = 0;
          seq__7133 = G__7141;
          chunk__7134 = G__7142;
          count__7135 = G__7143;
          i__7136 = G__7144;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__7133__$1);
          speclj.reporting.report_pass.call(null, reporter, result);
          var G__7145 = cljs.core.next.call(null, seq__7133__$1);
          var G__7146 = null;
          var G__7147 = 0;
          var G__7148 = 0;
          seq__7133 = G__7145;
          chunk__7134 = G__7146;
          count__7135 = G__7147;
          i__7136 = G__7148;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
});
cljs.core._add_method.call(null, speclj.reporting.report_run, speclj.results.FailResult, function(result, reporters) {
  var seq__7149 = cljs.core.seq.call(null, reporters);
  var chunk__7150 = null;
  var count__7151 = 0;
  var i__7152 = 0;
  while(true) {
    if(i__7152 < count__7151) {
      var reporter = cljs.core._nth.call(null, chunk__7150, i__7152);
      speclj.reporting.report_fail.call(null, reporter, result);
      var G__7153 = seq__7149;
      var G__7154 = chunk__7150;
      var G__7155 = count__7151;
      var G__7156 = i__7152 + 1;
      seq__7149 = G__7153;
      chunk__7150 = G__7154;
      count__7151 = G__7155;
      i__7152 = G__7156;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7149);
      if(temp__4092__auto__) {
        var seq__7149__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7149__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7149__$1);
          var G__7157 = cljs.core.chunk_rest.call(null, seq__7149__$1);
          var G__7158 = c__3844__auto__;
          var G__7159 = cljs.core.count.call(null, c__3844__auto__);
          var G__7160 = 0;
          seq__7149 = G__7157;
          chunk__7150 = G__7158;
          count__7151 = G__7159;
          i__7152 = G__7160;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__7149__$1);
          speclj.reporting.report_fail.call(null, reporter, result);
          var G__7161 = cljs.core.next.call(null, seq__7149__$1);
          var G__7162 = null;
          var G__7163 = 0;
          var G__7164 = 0;
          seq__7149 = G__7161;
          chunk__7150 = G__7162;
          count__7151 = G__7163;
          i__7152 = G__7164;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
});
cljs.core._add_method.call(null, speclj.reporting.report_run, speclj.results.PendingResult, function(result, reporters) {
  var seq__7165 = cljs.core.seq.call(null, reporters);
  var chunk__7166 = null;
  var count__7167 = 0;
  var i__7168 = 0;
  while(true) {
    if(i__7168 < count__7167) {
      var reporter = cljs.core._nth.call(null, chunk__7166, i__7168);
      speclj.reporting.report_pending.call(null, reporter, result);
      var G__7169 = seq__7165;
      var G__7170 = chunk__7166;
      var G__7171 = count__7167;
      var G__7172 = i__7168 + 1;
      seq__7165 = G__7169;
      chunk__7166 = G__7170;
      count__7167 = G__7171;
      i__7168 = G__7172;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7165);
      if(temp__4092__auto__) {
        var seq__7165__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7165__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7165__$1);
          var G__7173 = cljs.core.chunk_rest.call(null, seq__7165__$1);
          var G__7174 = c__3844__auto__;
          var G__7175 = cljs.core.count.call(null, c__3844__auto__);
          var G__7176 = 0;
          seq__7165 = G__7173;
          chunk__7166 = G__7174;
          count__7167 = G__7175;
          i__7168 = G__7176;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__7165__$1);
          speclj.reporting.report_pending.call(null, reporter, result);
          var G__7177 = cljs.core.next.call(null, seq__7165__$1);
          var G__7178 = null;
          var G__7179 = 0;
          var G__7180 = 0;
          seq__7165 = G__7177;
          chunk__7166 = G__7178;
          count__7167 = G__7179;
          i__7168 = G__7180;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
});
cljs.core._add_method.call(null, speclj.reporting.report_run, speclj.results.ErrorResult, function(result, reporters) {
  var seq__7181 = cljs.core.seq.call(null, reporters);
  var chunk__7182 = null;
  var count__7183 = 0;
  var i__7184 = 0;
  while(true) {
    if(i__7184 < count__7183) {
      var reporter = cljs.core._nth.call(null, chunk__7182, i__7184);
      speclj.reporting.report_error.call(null, reporter, result);
      var G__7185 = seq__7181;
      var G__7186 = chunk__7182;
      var G__7187 = count__7183;
      var G__7188 = i__7184 + 1;
      seq__7181 = G__7185;
      chunk__7182 = G__7186;
      count__7183 = G__7187;
      i__7184 = G__7188;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7181);
      if(temp__4092__auto__) {
        var seq__7181__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7181__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7181__$1);
          var G__7189 = cljs.core.chunk_rest.call(null, seq__7181__$1);
          var G__7190 = c__3844__auto__;
          var G__7191 = cljs.core.count.call(null, c__3844__auto__);
          var G__7192 = 0;
          seq__7181 = G__7189;
          chunk__7182 = G__7190;
          count__7183 = G__7191;
          i__7184 = G__7192;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__7181__$1);
          speclj.reporting.report_error.call(null, reporter, result);
          var G__7193 = cljs.core.next.call(null, seq__7181__$1);
          var G__7194 = null;
          var G__7195 = 0;
          var G__7196 = 0;
          seq__7181 = G__7193;
          chunk__7182 = G__7194;
          count__7183 = G__7195;
          i__7184 = G__7196;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
});
speclj.reporting.stylizer = function stylizer(code) {
  return function(text) {
    if(cljs.core.truth_(speclj.config._STAR_color_QMARK__STAR_)) {
      return[cljs.core.str("\u001b["), cljs.core.str(code), cljs.core.str("m"), cljs.core.str(text), cljs.core.str("\u001b[0m")].join("")
    }else {
      return text
    }
  }
};
speclj.reporting.red = speclj.reporting.stylizer.call(null, "31");
speclj.reporting.green = speclj.reporting.stylizer.call(null, "32");
speclj.reporting.yellow = speclj.reporting.stylizer.call(null, "33");
speclj.reporting.grey = speclj.reporting.stylizer.call(null, "90");
speclj.reporting.print_elides = function print_elides(n) {
  if(n > 0) {
    return cljs.core.println.call(null, "\t...", n, "stack levels elided ...")
  }else {
    return null
  }
};
speclj.reporting.print_stack_levels = function print_stack_levels(exception) {
  var levels_7197 = speclj.platform.stack_trace.call(null, exception);
  var elides_7198 = 0;
  while(true) {
    if(cljs.core.seq.call(null, levels_7197)) {
      var level_7199 = cljs.core.first.call(null, levels_7197);
      if(cljs.core.truth_(speclj.platform.elide_level_QMARK_.call(null, level_7199))) {
        var G__7200 = cljs.core.rest.call(null, levels_7197);
        var G__7201 = elides_7198 + 1;
        levels_7197 = G__7200;
        elides_7198 = G__7201;
        continue
      }else {
        speclj.reporting.print_elides.call(null, elides_7198);
        cljs.core.println.call(null, [cljs.core.str(level_7199)].join(""));
        var G__7202 = cljs.core.rest.call(null, levels_7197);
        var G__7203 = 0;
        levels_7197 = G__7202;
        elides_7198 = G__7203;
        continue
      }
    }else {
      speclj.reporting.print_elides.call(null, elides_7198)
    }
    break
  }
  var temp__4090__auto__ = speclj.platform.cause.call(null, exception);
  if(cljs.core.truth_(temp__4090__auto__)) {
    var cause = temp__4090__auto__;
    return speclj.reporting.print_exception.call(null, "Caused by:", cause)
  }else {
    return null
  }
};
speclj.reporting.print_exception = function print_exception(prefix, exception) {
  if(cljs.core.truth_(prefix)) {
    cljs.core.println.call(null, prefix, [cljs.core.str(exception)].join(""))
  }else {
    cljs.core.println.call(null, [cljs.core.str(exception)].join(""))
  }
  return speclj.reporting.print_stack_levels.call(null, exception)
};
speclj.reporting.stack_trace_str = function stack_trace_str(exception) {
  var sb__3941__auto__ = new goog.string.StringBuffer;
  var _STAR_print_fn_STAR_7205_7206 = cljs.core._STAR_print_fn_STAR_;
  try {
    cljs.core._STAR_print_fn_STAR_ = function(x__3942__auto__) {
      return sb__3941__auto__.append(x__3942__auto__)
    };
    if(cljs.core.truth_(speclj.config._STAR_full_stack_trace_QMARK__STAR_)) {
      speclj.platform.print_stack_trace.call(null, exception)
    }else {
      speclj.reporting.print_exception.call(null, null, exception)
    }
  }finally {
    cljs.core._STAR_print_fn_STAR_ = _STAR_print_fn_STAR_7205_7206
  }
  return[cljs.core.str(sb__3941__auto__)].join("")
};
speclj.reporting.prefix = function() {
  var prefix__delegate = function(pre, args) {
    var value = cljs.core.apply.call(null, cljs.core.str, args);
    var lines = clojure.string.split.call(null, value, /[\r\n]+/);
    var prefixed_lines = cljs.core.map.call(null, function(value, lines) {
      return function(p1__7207_SHARP_) {
        return[cljs.core.str(pre), cljs.core.str(p1__7207_SHARP_)].join("")
      }
    }(value, lines), lines);
    return clojure.string.join.call(null, speclj.platform.endl, prefixed_lines)
  };
  var prefix = function(pre, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return prefix__delegate.call(this, pre, args)
  };
  prefix.cljs$lang$maxFixedArity = 1;
  prefix.cljs$lang$applyTo = function(arglist__7208) {
    var pre = cljs.core.first(arglist__7208);
    var args = cljs.core.rest(arglist__7208);
    return prefix__delegate(pre, args)
  };
  prefix.cljs$core$IFn$_invoke$arity$variadic = prefix__delegate;
  return prefix
}();
speclj.reporting.indent = function() {
  var indent__delegate = function(n, args) {
    var spaces = n * 2 | 0;
    var indention = cljs.core.reduce.call(null, function(spaces) {
      return function(p, _) {
        return[cljs.core.str(" "), cljs.core.str(p)].join("")
      }
    }(spaces), "", cljs.core.range.call(null, spaces));
    return cljs.core.apply.call(null, speclj.reporting.prefix, indention, args)
  };
  var indent = function(n, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return indent__delegate.call(this, n, args)
  };
  indent.cljs$lang$maxFixedArity = 1;
  indent.cljs$lang$applyTo = function(arglist__7209) {
    var n = cljs.core.first(arglist__7209);
    var args = cljs.core.rest(arglist__7209);
    return indent__delegate(n, args)
  };
  indent.cljs$core$IFn$_invoke$arity$variadic = indent__delegate;
  return indent
}();
speclj.reporting.report_description_STAR_ = function report_description_STAR_(reporters, description) {
  var seq__7214 = cljs.core.seq.call(null, reporters);
  var chunk__7215 = null;
  var count__7216 = 0;
  var i__7217 = 0;
  while(true) {
    if(i__7217 < count__7216) {
      var reporter = cljs.core._nth.call(null, chunk__7215, i__7217);
      speclj.reporting.report_description.call(null, reporter, description);
      var G__7218 = seq__7214;
      var G__7219 = chunk__7215;
      var G__7220 = count__7216;
      var G__7221 = i__7217 + 1;
      seq__7214 = G__7218;
      chunk__7215 = G__7219;
      count__7216 = G__7220;
      i__7217 = G__7221;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7214);
      if(temp__4092__auto__) {
        var seq__7214__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7214__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7214__$1);
          var G__7222 = cljs.core.chunk_rest.call(null, seq__7214__$1);
          var G__7223 = c__3844__auto__;
          var G__7224 = cljs.core.count.call(null, c__3844__auto__);
          var G__7225 = 0;
          seq__7214 = G__7222;
          chunk__7215 = G__7223;
          count__7216 = G__7224;
          i__7217 = G__7225;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__7214__$1);
          speclj.reporting.report_description.call(null, reporter, description);
          var G__7226 = cljs.core.next.call(null, seq__7214__$1);
          var G__7227 = null;
          var G__7228 = 0;
          var G__7229 = 0;
          seq__7214 = G__7226;
          chunk__7215 = G__7227;
          count__7216 = G__7228;
          i__7217 = G__7229;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
speclj.reporting.report_runs_STAR_ = function report_runs_STAR_(reporters, results) {
  var seq__7234 = cljs.core.seq.call(null, reporters);
  var chunk__7235 = null;
  var count__7236 = 0;
  var i__7237 = 0;
  while(true) {
    if(i__7237 < count__7236) {
      var reporter = cljs.core._nth.call(null, chunk__7235, i__7237);
      speclj.reporting.report_runs.call(null, reporter, results);
      var G__7238 = seq__7234;
      var G__7239 = chunk__7235;
      var G__7240 = count__7236;
      var G__7241 = i__7237 + 1;
      seq__7234 = G__7238;
      chunk__7235 = G__7239;
      count__7236 = G__7240;
      i__7237 = G__7241;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7234);
      if(temp__4092__auto__) {
        var seq__7234__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7234__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7234__$1);
          var G__7242 = cljs.core.chunk_rest.call(null, seq__7234__$1);
          var G__7243 = c__3844__auto__;
          var G__7244 = cljs.core.count.call(null, c__3844__auto__);
          var G__7245 = 0;
          seq__7234 = G__7242;
          chunk__7235 = G__7243;
          count__7236 = G__7244;
          i__7237 = G__7245;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__7234__$1);
          speclj.reporting.report_runs.call(null, reporter, results);
          var G__7246 = cljs.core.next.call(null, seq__7234__$1);
          var G__7247 = null;
          var G__7248 = 0;
          var G__7249 = 0;
          seq__7234 = G__7246;
          chunk__7235 = G__7247;
          count__7236 = G__7248;
          i__7237 = G__7249;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
speclj.reporting.report_message_STAR_ = function report_message_STAR_(reporters, message) {
  var seq__7254 = cljs.core.seq.call(null, reporters);
  var chunk__7255 = null;
  var count__7256 = 0;
  var i__7257 = 0;
  while(true) {
    if(i__7257 < count__7256) {
      var reporter = cljs.core._nth.call(null, chunk__7255, i__7257);
      speclj.reporting.report_message.call(null, reporter, message);
      var G__7258 = seq__7254;
      var G__7259 = chunk__7255;
      var G__7260 = count__7256;
      var G__7261 = i__7257 + 1;
      seq__7254 = G__7258;
      chunk__7255 = G__7259;
      count__7256 = G__7260;
      i__7257 = G__7261;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7254);
      if(temp__4092__auto__) {
        var seq__7254__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7254__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7254__$1);
          var G__7262 = cljs.core.chunk_rest.call(null, seq__7254__$1);
          var G__7263 = c__3844__auto__;
          var G__7264 = cljs.core.count.call(null, c__3844__auto__);
          var G__7265 = 0;
          seq__7254 = G__7262;
          chunk__7255 = G__7263;
          count__7256 = G__7264;
          i__7257 = G__7265;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__7254__$1);
          speclj.reporting.report_message.call(null, reporter, message);
          var G__7266 = cljs.core.next.call(null, seq__7254__$1);
          var G__7267 = null;
          var G__7268 = 0;
          var G__7269 = 0;
          seq__7254 = G__7266;
          chunk__7255 = G__7267;
          count__7256 = G__7268;
          i__7257 = G__7269;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
speclj.reporting.report_error_STAR_ = function report_error_STAR_(reporters, exception) {
  var seq__7274 = cljs.core.seq.call(null, reporters);
  var chunk__7275 = null;
  var count__7276 = 0;
  var i__7277 = 0;
  while(true) {
    if(i__7277 < count__7276) {
      var reporter = cljs.core._nth.call(null, chunk__7275, i__7277);
      speclj.reporting.report_error.call(null, reporter, exception);
      var G__7278 = seq__7274;
      var G__7279 = chunk__7275;
      var G__7280 = count__7276;
      var G__7281 = i__7277 + 1;
      seq__7274 = G__7278;
      chunk__7275 = G__7279;
      count__7276 = G__7280;
      i__7277 = G__7281;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7274);
      if(temp__4092__auto__) {
        var seq__7274__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7274__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7274__$1);
          var G__7282 = cljs.core.chunk_rest.call(null, seq__7274__$1);
          var G__7283 = c__3844__auto__;
          var G__7284 = cljs.core.count.call(null, c__3844__auto__);
          var G__7285 = 0;
          seq__7274 = G__7282;
          chunk__7275 = G__7283;
          count__7276 = G__7284;
          i__7277 = G__7285;
          continue
        }else {
          var reporter = cljs.core.first.call(null, seq__7274__$1);
          speclj.reporting.report_error.call(null, reporter, exception);
          var G__7286 = cljs.core.next.call(null, seq__7274__$1);
          var G__7287 = null;
          var G__7288 = 0;
          var G__7289 = 0;
          seq__7274 = G__7286;
          chunk__7275 = G__7287;
          count__7276 = G__7288;
          i__7277 = G__7289;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
goog.provide("clojure.set");
goog.require("cljs.core");
clojure.set.bubble_max_key = function bubble_max_key(k, coll) {
  var max = cljs.core.apply.call(null, cljs.core.max_key, k, coll);
  return cljs.core.cons.call(null, max, cljs.core.remove.call(null, function(p1__7001_SHARP_) {
    return max === p1__7001_SHARP_
  }, coll))
};
clojure.set.union = function() {
  var union = null;
  var union__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var union__1 = function(s1) {
    return s1
  };
  var union__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, cljs.core.conj, s2, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.conj, s1, s2)
    }
  };
  var union__3 = function() {
    var G__7002__delegate = function(s1, s2, sets) {
      var bubbled_sets = clojure.set.bubble_max_key.call(null, cljs.core.count, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, cljs.core.into, cljs.core.first.call(null, bubbled_sets), cljs.core.rest.call(null, bubbled_sets))
    };
    var G__7002 = function(s1, s2, var_args) {
      var sets = null;
      if(arguments.length > 2) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7002__delegate.call(this, s1, s2, sets)
    };
    G__7002.cljs$lang$maxFixedArity = 2;
    G__7002.cljs$lang$applyTo = function(arglist__7003) {
      var s1 = cljs.core.first(arglist__7003);
      arglist__7003 = cljs.core.next(arglist__7003);
      var s2 = cljs.core.first(arglist__7003);
      var sets = cljs.core.rest(arglist__7003);
      return G__7002__delegate(s1, s2, sets)
    };
    G__7002.cljs$core$IFn$_invoke$arity$variadic = G__7002__delegate;
    return G__7002
  }();
  union = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 0:
        return union__0.call(this);
      case 1:
        return union__1.call(this, s1);
      case 2:
        return union__2.call(this, s1, s2);
      default:
        return union__3.cljs$core$IFn$_invoke$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  union.cljs$lang$maxFixedArity = 2;
  union.cljs$lang$applyTo = union__3.cljs$lang$applyTo;
  union.cljs$core$IFn$_invoke$arity$0 = union__0;
  union.cljs$core$IFn$_invoke$arity$1 = union__1;
  union.cljs$core$IFn$_invoke$arity$2 = union__2;
  union.cljs$core$IFn$_invoke$arity$variadic = union__3.cljs$core$IFn$_invoke$arity$variadic;
  return union
}();
clojure.set.intersection = function() {
  var intersection = null;
  var intersection__1 = function(s1) {
    return s1
  };
  var intersection__2 = function(s1, s2) {
    while(true) {
      if(cljs.core.count.call(null, s2) < cljs.core.count.call(null, s1)) {
        var G__7005 = s2;
        var G__7006 = s1;
        s1 = G__7005;
        s2 = G__7006;
        continue
      }else {
        return cljs.core.reduce.call(null, function(s1, s2) {
          return function(result, item) {
            if(cljs.core.contains_QMARK_.call(null, s2, item)) {
              return result
            }else {
              return cljs.core.disj.call(null, result, item)
            }
          }
        }(s1, s2), s1, s1)
      }
      break
    }
  };
  var intersection__3 = function() {
    var G__7007__delegate = function(s1, s2, sets) {
      var bubbled_sets = clojure.set.bubble_max_key.call(null, function(p1__7004_SHARP_) {
        return-cljs.core.count.call(null, p1__7004_SHARP_)
      }, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, intersection, cljs.core.first.call(null, bubbled_sets), cljs.core.rest.call(null, bubbled_sets))
    };
    var G__7007 = function(s1, s2, var_args) {
      var sets = null;
      if(arguments.length > 2) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7007__delegate.call(this, s1, s2, sets)
    };
    G__7007.cljs$lang$maxFixedArity = 2;
    G__7007.cljs$lang$applyTo = function(arglist__7008) {
      var s1 = cljs.core.first(arglist__7008);
      arglist__7008 = cljs.core.next(arglist__7008);
      var s2 = cljs.core.first(arglist__7008);
      var sets = cljs.core.rest(arglist__7008);
      return G__7007__delegate(s1, s2, sets)
    };
    G__7007.cljs$core$IFn$_invoke$arity$variadic = G__7007__delegate;
    return G__7007
  }();
  intersection = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return intersection__1.call(this, s1);
      case 2:
        return intersection__2.call(this, s1, s2);
      default:
        return intersection__3.cljs$core$IFn$_invoke$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  intersection.cljs$lang$maxFixedArity = 2;
  intersection.cljs$lang$applyTo = intersection__3.cljs$lang$applyTo;
  intersection.cljs$core$IFn$_invoke$arity$1 = intersection__1;
  intersection.cljs$core$IFn$_invoke$arity$2 = intersection__2;
  intersection.cljs$core$IFn$_invoke$arity$variadic = intersection__3.cljs$core$IFn$_invoke$arity$variadic;
  return intersection
}();
clojure.set.difference = function() {
  var difference = null;
  var difference__1 = function(s1) {
    return s1
  };
  var difference__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, function(result, item) {
        if(cljs.core.contains_QMARK_.call(null, s2, item)) {
          return cljs.core.disj.call(null, result, item)
        }else {
          return result
        }
      }, s1, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.disj, s1, s2)
    }
  };
  var difference__3 = function() {
    var G__7009__delegate = function(s1, s2, sets) {
      return cljs.core.reduce.call(null, difference, s1, cljs.core.conj.call(null, sets, s2))
    };
    var G__7009 = function(s1, s2, var_args) {
      var sets = null;
      if(arguments.length > 2) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7009__delegate.call(this, s1, s2, sets)
    };
    G__7009.cljs$lang$maxFixedArity = 2;
    G__7009.cljs$lang$applyTo = function(arglist__7010) {
      var s1 = cljs.core.first(arglist__7010);
      arglist__7010 = cljs.core.next(arglist__7010);
      var s2 = cljs.core.first(arglist__7010);
      var sets = cljs.core.rest(arglist__7010);
      return G__7009__delegate(s1, s2, sets)
    };
    G__7009.cljs$core$IFn$_invoke$arity$variadic = G__7009__delegate;
    return G__7009
  }();
  difference = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return difference__1.call(this, s1);
      case 2:
        return difference__2.call(this, s1, s2);
      default:
        return difference__3.cljs$core$IFn$_invoke$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  difference.cljs$lang$maxFixedArity = 2;
  difference.cljs$lang$applyTo = difference__3.cljs$lang$applyTo;
  difference.cljs$core$IFn$_invoke$arity$1 = difference__1;
  difference.cljs$core$IFn$_invoke$arity$2 = difference__2;
  difference.cljs$core$IFn$_invoke$arity$variadic = difference__3.cljs$core$IFn$_invoke$arity$variadic;
  return difference
}();
clojure.set.select = function select(pred, xset) {
  return cljs.core.reduce.call(null, function(s, k) {
    if(cljs.core.truth_(pred.call(null, k))) {
      return s
    }else {
      return cljs.core.disj.call(null, s, k)
    }
  }, xset, xset)
};
clojure.set.project = function project(xrel, ks) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__7011_SHARP_) {
    return cljs.core.select_keys.call(null, p1__7011_SHARP_, ks)
  }, xrel))
};
clojure.set.rename_keys = function rename_keys(map, kmap) {
  return cljs.core.reduce.call(null, function(m, p__7014) {
    var vec__7015 = p__7014;
    var old = cljs.core.nth.call(null, vec__7015, 0, null);
    var new$ = cljs.core.nth.call(null, vec__7015, 1, null);
    if(cljs.core.not_EQ_.call(null, old, new$) && cljs.core.contains_QMARK_.call(null, m, old)) {
      return cljs.core.dissoc.call(null, cljs.core.assoc.call(null, m, new$, cljs.core.get.call(null, m, old)), old)
    }else {
      return m
    }
  }, map, kmap)
};
clojure.set.rename = function rename(xrel, kmap) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__7016_SHARP_) {
    return clojure.set.rename_keys.call(null, p1__7016_SHARP_, kmap)
  }, xrel))
};
clojure.set.index = function index(xrel, ks) {
  return cljs.core.reduce.call(null, function(m, x) {
    var ik = cljs.core.select_keys.call(null, x, ks);
    return cljs.core.assoc.call(null, m, ik, cljs.core.conj.call(null, cljs.core.get.call(null, m, ik, cljs.core.PersistentHashSet.EMPTY), x))
  }, cljs.core.PersistentArrayMap.EMPTY, xrel)
};
clojure.set.map_invert = function map_invert(m) {
  return cljs.core.reduce.call(null, function(m__$1, p__7019) {
    var vec__7020 = p__7019;
    var k = cljs.core.nth.call(null, vec__7020, 0, null);
    var v = cljs.core.nth.call(null, vec__7020, 1, null);
    return cljs.core.assoc.call(null, m__$1, v, k)
  }, cljs.core.PersistentArrayMap.EMPTY, m)
};
clojure.set.join = function() {
  var join = null;
  var join__2 = function(xrel, yrel) {
    if(cljs.core.seq.call(null, xrel) && cljs.core.seq.call(null, yrel)) {
      var ks = clojure.set.intersection.call(null, cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, xrel))), cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, yrel))));
      var vec__7027 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel], true) : cljs.core.PersistentVector.fromArray([yrel, xrel], true);
      var r = cljs.core.nth.call(null, vec__7027, 0, null);
      var s = cljs.core.nth.call(null, vec__7027, 1, null);
      var idx = clojure.set.index.call(null, r, ks);
      return cljs.core.reduce.call(null, function(ret, x) {
        var found = idx.call(null, cljs.core.select_keys.call(null, x, ks));
        if(cljs.core.truth_(found)) {
          return cljs.core.reduce.call(null, function(p1__7021_SHARP_, p2__7022_SHARP_) {
            return cljs.core.conj.call(null, p1__7021_SHARP_, cljs.core.merge.call(null, p2__7022_SHARP_, x))
          }, ret, found)
        }else {
          return ret
        }
      }, cljs.core.PersistentHashSet.EMPTY, s)
    }else {
      return cljs.core.PersistentHashSet.EMPTY
    }
  };
  var join__3 = function(xrel, yrel, km) {
    var vec__7028 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel, clojure.set.map_invert.call(null, km)], true) : cljs.core.PersistentVector.fromArray([yrel, xrel, km], true);
    var r = cljs.core.nth.call(null, vec__7028, 0, null);
    var s = cljs.core.nth.call(null, vec__7028, 1, null);
    var k = cljs.core.nth.call(null, vec__7028, 2, null);
    var idx = clojure.set.index.call(null, r, cljs.core.vals.call(null, k));
    return cljs.core.reduce.call(null, function(ret, x) {
      var found = idx.call(null, clojure.set.rename_keys.call(null, cljs.core.select_keys.call(null, x, cljs.core.keys.call(null, k)), k));
      if(cljs.core.truth_(found)) {
        return cljs.core.reduce.call(null, function(p1__7023_SHARP_, p2__7024_SHARP_) {
          return cljs.core.conj.call(null, p1__7023_SHARP_, cljs.core.merge.call(null, p2__7024_SHARP_, x))
        }, ret, found)
      }else {
        return ret
      }
    }, cljs.core.PersistentHashSet.EMPTY, s)
  };
  join = function(xrel, yrel, km) {
    switch(arguments.length) {
      case 2:
        return join__2.call(this, xrel, yrel);
      case 3:
        return join__3.call(this, xrel, yrel, km)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  join.cljs$core$IFn$_invoke$arity$2 = join__2;
  join.cljs$core$IFn$_invoke$arity$3 = join__3;
  return join
}();
clojure.set.subset_QMARK_ = function subset_QMARK_(set1, set2) {
  return cljs.core.count.call(null, set1) <= cljs.core.count.call(null, set2) && cljs.core.every_QMARK_.call(null, function(p1__7029_SHARP_) {
    return cljs.core.contains_QMARK_.call(null, set2, p1__7029_SHARP_)
  }, set1)
};
clojure.set.superset_QMARK_ = function superset_QMARK_(set1, set2) {
  return cljs.core.count.call(null, set1) >= cljs.core.count.call(null, set2) && cljs.core.every_QMARK_.call(null, function(p1__7030_SHARP_) {
    return cljs.core.contains_QMARK_.call(null, set1, p1__7030_SHARP_)
  }, set2)
};
goog.provide("speclj.tags");
goog.require("cljs.core");
goog.require("speclj.config");
goog.require("clojure.string");
goog.require("clojure.set");
goog.require("speclj.config");
goog.require("clojure.string");
goog.require("clojure.set");
speclj.tags.pass_includes_QMARK_ = function pass_includes_QMARK_(includes, tags) {
  if(cljs.core.empty_QMARK_.call(null, includes)) {
    return true
  }else {
    return cljs.core._EQ_.call(null, includes, clojure.set.intersection.call(null, includes, cljs.core.set.call(null, tags)))
  }
};
speclj.tags.pass_excludes_QMARK_ = function pass_excludes_QMARK_(excludes, tags) {
  if(cljs.core.empty_QMARK_.call(null, excludes)) {
    return true
  }else {
    return cljs.core.not.call(null, cljs.core.some.call(null, function(p1__6995_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, excludes, p1__6995_SHARP_)
    }, tags))
  }
};
speclj.tags.pass_tag_filter_QMARK_ = function() {
  var pass_tag_filter_QMARK_ = null;
  var pass_tag_filter_QMARK___1 = function(tags) {
    return pass_tag_filter_QMARK_.call(null, speclj.config._STAR_tag_filter_STAR_, tags)
  };
  var pass_tag_filter_QMARK___2 = function(filter, tags) {
    var and__3119__auto__ = speclj.tags.pass_includes_QMARK_.call(null, (new cljs.core.Keyword(null, "includes", "includes", 1104163901)).cljs$core$IFn$_invoke$arity$1(filter), tags);
    if(cljs.core.truth_(and__3119__auto__)) {
      return speclj.tags.pass_excludes_QMARK_.call(null, (new cljs.core.Keyword(null, "excludes", "excludes", 3007959371)).cljs$core$IFn$_invoke$arity$1(filter), tags)
    }else {
      return and__3119__auto__
    }
  };
  pass_tag_filter_QMARK_ = function(filter, tags) {
    switch(arguments.length) {
      case 1:
        return pass_tag_filter_QMARK___1.call(this, filter);
      case 2:
        return pass_tag_filter_QMARK___2.call(this, filter, tags)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  pass_tag_filter_QMARK_.cljs$core$IFn$_invoke$arity$1 = pass_tag_filter_QMARK___1;
  pass_tag_filter_QMARK_.cljs$core$IFn$_invoke$arity$2 = pass_tag_filter_QMARK___2;
  return pass_tag_filter_QMARK_
}();
speclj.tags.tags_for = function tags_for(context) {
  if(cljs.core.truth_(context)) {
    return clojure.set.union.call(null, tags_for.call(null, cljs.core.deref.call(null, context.parent)), cljs.core.deref.call(null, context.tags))
  }else {
    return cljs.core.PersistentHashSet.EMPTY
  }
};
speclj.tags.tag_sets_for = function tag_sets_for(context) {
  var context_seq = cljs.core.tree_seq.call(null, function(p1__6996_SHARP_) {
    return!(p1__6996_SHARP_ == null)
  }, function(p1__6997_SHARP_) {
    return cljs.core.deref.call(null, p1__6997_SHARP_.children)
  }, context);
  return cljs.core.map.call(null, speclj.tags.tags_for, context_seq)
};
speclj.tags.context_with_tags_seq = function context_with_tags_seq(context) {
  var context_seq = cljs.core.tree_seq.call(null, function(p1__6998_SHARP_) {
    return!(p1__6998_SHARP_ == null)
  }, function(p1__6999_SHARP_) {
    return cljs.core.deref.call(null, p1__6999_SHARP_.children)
  }, context);
  return cljs.core.map.call(null, function(p1__7000_SHARP_) {
    return cljs.core.hash_map.call(null, new cljs.core.Keyword(null, "context", "context", 1965435169), p1__7000_SHARP_, new cljs.core.Keyword(null, "tag-set", "tag-set", 3758720801), speclj.tags.tags_for.call(null, p1__7000_SHARP_))
  }, context_seq)
};
speclj.tags.describe_filter = function() {
  var describe_filter = null;
  var describe_filter__0 = function() {
    return describe_filter.call(null, speclj.config._STAR_tag_filter_STAR_)
  };
  var describe_filter__1 = function(filter) {
    var includes = cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.name, (new cljs.core.Keyword(null, "includes", "includes", 1104163901)).cljs$core$IFn$_invoke$arity$1(filter)));
    var excludes = cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.name, (new cljs.core.Keyword(null, "excludes", "excludes", 3007959371)).cljs$core$IFn$_invoke$arity$1(filter)));
    if(includes || excludes) {
      return[cljs.core.str("Filtering tags."), cljs.core.str(includes ? [cljs.core.str(" Including: "), cljs.core.str(clojure.string.join.call(null, ", ", includes)), cljs.core.str(".")].join("") : null), cljs.core.str(excludes ? [cljs.core.str(" Excluding: "), cljs.core.str(clojure.string.join.call(null, ", ", excludes)), cljs.core.str(".")].join("") : null)].join("")
    }else {
      return null
    }
  };
  describe_filter = function(filter) {
    switch(arguments.length) {
      case 0:
        return describe_filter__0.call(this);
      case 1:
        return describe_filter__1.call(this, filter)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  describe_filter.cljs$core$IFn$_invoke$arity$0 = describe_filter__0;
  describe_filter.cljs$core$IFn$_invoke$arity$1 = describe_filter__1;
  return describe_filter
}();
goog.provide("speclj.running");
goog.require("cljs.core");
goog.require("speclj.components");
goog.require("speclj.config");
goog.require("speclj.results");
goog.require("speclj.reporting");
goog.require("speclj.tags");
goog.require("speclj.platform");
goog.require("speclj.tags");
goog.require("speclj.results");
goog.require("speclj.reporting");
goog.require("speclj.platform");
goog.require("speclj.config");
goog.require("speclj.components");
goog.require("clojure.string");
goog.require("clojure.string");
speclj.running.eval_components = function eval_components(components) {
  var seq__7396 = cljs.core.seq.call(null, components);
  var chunk__7397 = null;
  var count__7398 = 0;
  var i__7399 = 0;
  while(true) {
    if(i__7399 < count__7398) {
      var component = cljs.core._nth.call(null, chunk__7397, i__7399);
      component.body.call(null);
      var G__7400 = seq__7396;
      var G__7401 = chunk__7397;
      var G__7402 = count__7398;
      var G__7403 = i__7399 + 1;
      seq__7396 = G__7400;
      chunk__7397 = G__7401;
      count__7398 = G__7402;
      i__7399 = G__7403;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7396);
      if(temp__4092__auto__) {
        var seq__7396__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7396__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7396__$1);
          var G__7404 = cljs.core.chunk_rest.call(null, seq__7396__$1);
          var G__7405 = c__3844__auto__;
          var G__7406 = cljs.core.count.call(null, c__3844__auto__);
          var G__7407 = 0;
          seq__7396 = G__7404;
          chunk__7397 = G__7405;
          count__7398 = G__7406;
          i__7399 = G__7407;
          continue
        }else {
          var component = cljs.core.first.call(null, seq__7396__$1);
          component.body.call(null);
          var G__7408 = cljs.core.next.call(null, seq__7396__$1);
          var G__7409 = null;
          var G__7410 = 0;
          var G__7411 = 0;
          seq__7396 = G__7408;
          chunk__7397 = G__7409;
          count__7398 = G__7410;
          i__7399 = G__7411;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
speclj.running.nested_fns = function nested_fns(base, fns) {
  if(cljs.core.seq.call(null, fns)) {
    return cljs.core.partial.call(null, cljs.core.first.call(null, fns), nested_fns.call(null, base, cljs.core.rest.call(null, fns)))
  }else {
    return base
  }
};
speclj.running.eval_characteristic = function eval_characteristic(befores, body, afters) {
  speclj.running.eval_components.call(null, befores);
  try {
    return body.call(null)
  }finally {
    speclj.running.eval_components.call(null, afters)
  }
};
speclj.running.reset_withs = function reset_withs(withs) {
  var seq__7416 = cljs.core.seq.call(null, withs);
  var chunk__7417 = null;
  var count__7418 = 0;
  var i__7419 = 0;
  while(true) {
    if(i__7419 < count__7418) {
      var with$ = cljs.core._nth.call(null, chunk__7417, i__7419);
      speclj.components.reset_with.call(null, with$);
      var G__7420 = seq__7416;
      var G__7421 = chunk__7417;
      var G__7422 = count__7418;
      var G__7423 = i__7419 + 1;
      seq__7416 = G__7420;
      chunk__7417 = G__7421;
      count__7418 = G__7422;
      i__7419 = G__7423;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7416);
      if(temp__4092__auto__) {
        var seq__7416__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7416__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7416__$1);
          var G__7424 = cljs.core.chunk_rest.call(null, seq__7416__$1);
          var G__7425 = c__3844__auto__;
          var G__7426 = cljs.core.count.call(null, c__3844__auto__);
          var G__7427 = 0;
          seq__7416 = G__7424;
          chunk__7417 = G__7425;
          count__7418 = G__7426;
          i__7419 = G__7427;
          continue
        }else {
          var with$ = cljs.core.first.call(null, seq__7416__$1);
          speclj.components.reset_with.call(null, with$);
          var G__7428 = cljs.core.next.call(null, seq__7416__$1);
          var G__7429 = null;
          var G__7430 = 0;
          var G__7431 = 0;
          seq__7416 = G__7428;
          chunk__7417 = G__7429;
          count__7418 = G__7430;
          i__7419 = G__7431;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
speclj.running.collect_components = function collect_components(getter, description) {
  var description__$1 = description;
  var components = cljs.core.PersistentVector.EMPTY;
  while(true) {
    if(cljs.core.truth_(description__$1)) {
      var G__7432 = cljs.core.deref.call(null, description__$1.parent);
      var G__7433 = cljs.core.concat.call(null, getter.call(null, description__$1), components);
      description__$1 = G__7432;
      components = G__7433;
      continue
    }else {
      return components
    }
    break
  }
};
speclj.running.report_result = function report_result(result_constructor, characteristic, start_time, reporters, failure) {
  var present_args = cljs.core.filter.call(null, cljs.core.identity, cljs.core.PersistentVector.fromArray([characteristic, speclj.platform.secs_since.call(null, start_time), failure], true));
  var result = cljs.core.apply.call(null, result_constructor, present_args);
  speclj.reporting.report_run.call(null, result, reporters);
  return result
};
speclj.running.do_characteristic = function do_characteristic(characteristic, reporters) {
  var description = cljs.core.deref.call(null, characteristic.parent);
  var befores = speclj.running.collect_components.call(null, function(description) {
    return function(p1__7434_SHARP_) {
      return cljs.core.deref.call(null, p1__7434_SHARP_.befores)
    }
  }(description), description);
  var afters = speclj.running.collect_components.call(null, function(description, befores) {
    return function(p1__7435_SHARP_) {
      return cljs.core.deref.call(null, p1__7435_SHARP_.afters)
    }
  }(description, befores), description);
  var core_body = characteristic.body;
  var before_and_after_body = function(description, befores, afters, core_body) {
    return function() {
      return speclj.running.eval_characteristic.call(null, befores, core_body, afters)
    }
  }(description, befores, afters, core_body);
  var arounds = speclj.running.collect_components.call(null, function(description, befores, afters, core_body, before_and_after_body) {
    return function(p1__7436_SHARP_) {
      return cljs.core.deref.call(null, p1__7436_SHARP_.arounds)
    }
  }(description, befores, afters, core_body, before_and_after_body), description);
  var full_body = speclj.running.nested_fns.call(null, before_and_after_body, cljs.core.map.call(null, function(description, befores, afters, core_body, before_and_after_body, arounds) {
    return function(p1__7437_SHARP_) {
      return p1__7437_SHARP_.body
    }
  }(description, befores, afters, core_body, before_and_after_body, arounds), arounds));
  var withs = speclj.running.collect_components.call(null, function(description, befores, afters, core_body, before_and_after_body, arounds, full_body) {
    return function(p1__7438_SHARP_) {
      return cljs.core.deref.call(null, p1__7438_SHARP_.withs)
    }
  }(description, befores, afters, core_body, before_and_after_body, arounds, full_body), description);
  var start_time = speclj.platform.current_time.call(null);
  try {
    full_body.call(null);
    return speclj.running.report_result.call(null, speclj.results.pass_result, characteristic, start_time, reporters, null)
  }catch(e7440) {
    if(e7440 instanceof Object) {
      var e = e7440;
      if(cljs.core.truth_(speclj.platform.pending_QMARK_.call(null, e))) {
        return speclj.running.report_result.call(null, speclj.results.pending_result, characteristic, start_time, reporters, e)
      }else {
        return speclj.running.report_result.call(null, speclj.results.fail_result, characteristic, start_time, reporters, e)
      }
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        throw e7440;
      }else {
        return null
      }
    }
  }finally {
    speclj.running.reset_withs.call(null, withs)
  }
};
speclj.running.do_characteristics = function do_characteristics(characteristics, reporters) {
  return cljs.core.doall.call(null, function() {
    var iter__3813__auto__ = function iter__7445(s__7446) {
      return new cljs.core.LazySeq(null, function() {
        var s__7446__$1 = s__7446;
        while(true) {
          var temp__4092__auto__ = cljs.core.seq.call(null, s__7446__$1);
          if(temp__4092__auto__) {
            var s__7446__$2 = temp__4092__auto__;
            if(cljs.core.chunked_seq_QMARK_.call(null, s__7446__$2)) {
              var c__3811__auto__ = cljs.core.chunk_first.call(null, s__7446__$2);
              var size__3812__auto__ = cljs.core.count.call(null, c__3811__auto__);
              var b__7448 = cljs.core.chunk_buffer.call(null, size__3812__auto__);
              if(function() {
                var i__7447 = 0;
                while(true) {
                  if(i__7447 < size__3812__auto__) {
                    var characteristic = cljs.core._nth.call(null, c__3811__auto__, i__7447);
                    cljs.core.chunk_append.call(null, b__7448, speclj.running.do_characteristic.call(null, characteristic, reporters));
                    var G__7449 = i__7447 + 1;
                    i__7447 = G__7449;
                    continue
                  }else {
                    return true
                  }
                  break
                }
              }()) {
                return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7448), iter__7445.call(null, cljs.core.chunk_rest.call(null, s__7446__$2)))
              }else {
                return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7448), null)
              }
            }else {
              var characteristic = cljs.core.first.call(null, s__7446__$2);
              return cljs.core.cons.call(null, speclj.running.do_characteristic.call(null, characteristic, reporters), iter__7445.call(null, cljs.core.rest.call(null, s__7446__$2)))
            }
          }else {
            return null
          }
          break
        }
      }, null, null)
    };
    return iter__3813__auto__.call(null, characteristics)
  }())
};
speclj.running.do_child_contexts = function do_child_contexts(context, results, reporters) {
  var results__$1 = results;
  var contexts = cljs.core.deref.call(null, context.children);
  while(true) {
    if(cljs.core.seq.call(null, contexts)) {
      var G__7450 = cljs.core.concat.call(null, results__$1, speclj.running.do_description.call(null, cljs.core.first.call(null, contexts), reporters));
      var G__7451 = cljs.core.rest.call(null, contexts);
      results__$1 = G__7450;
      contexts = G__7451;
      continue
    }else {
      speclj.running.eval_components.call(null, cljs.core.deref.call(null, context.after_alls));
      return results__$1
    }
    break
  }
};
speclj.running.results_for_context = function results_for_context(context, reporters) {
  if(cljs.core.truth_(speclj.tags.pass_tag_filter_QMARK_.call(null, speclj.tags.tags_for.call(null, context)))) {
    return speclj.running.do_characteristics.call(null, cljs.core.deref.call(null, context.charcteristics), reporters)
  }else {
    return cljs.core.PersistentVector.EMPTY
  }
};
speclj.running.with_withs_bound = function with_withs_bound(description, body) {
  var withs = cljs.core.concat.call(null, cljs.core.deref.call(null, description.withs), cljs.core.deref.call(null, description.with_alls));
  var ns = clojure.string.replace.call(null, description.ns, "-", "_");
  var var_names = cljs.core.map.call(null, function(withs, ns) {
    return function(p1__7452_SHARP_) {
      return[cljs.core.str(ns), cljs.core.str("."), cljs.core.str(cljs.core.name.call(null, p1__7452_SHARP_.name))].join("")
    }
  }(withs, ns), withs);
  var unique_names = cljs.core.map.call(null, function(withs, ns, var_names) {
    return function(p1__7453_SHARP_) {
      return[cljs.core.str(ns), cljs.core.str("."), cljs.core.str(cljs.core.name.call(null, p1__7453_SHARP_.unique_name))].join("")
    }
  }(withs, ns, var_names), withs);
  var seq__7466_7478 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, cljs.core.interleave.call(null, var_names, unique_names)));
  var chunk__7467_7479 = null;
  var count__7468_7480 = 0;
  var i__7469_7481 = 0;
  while(true) {
    if(i__7469_7481 < count__7468_7480) {
      var vec__7470_7482 = cljs.core._nth.call(null, chunk__7467_7479, i__7469_7481);
      var n_7483 = cljs.core.nth.call(null, vec__7470_7482, 0, null);
      var un_7484 = cljs.core.nth.call(null, vec__7470_7482, 1, null);
      var code_7485 = [cljs.core.str(n_7483), cljs.core.str(" \x3d "), cljs.core.str(un_7484), cljs.core.str(";")].join("");
      eval(code_7485);
      var G__7486 = seq__7466_7478;
      var G__7487 = chunk__7467_7479;
      var G__7488 = count__7468_7480;
      var G__7489 = i__7469_7481 + 1;
      seq__7466_7478 = G__7486;
      chunk__7467_7479 = G__7487;
      count__7468_7480 = G__7488;
      i__7469_7481 = G__7489;
      continue
    }else {
      var temp__4092__auto___7490 = cljs.core.seq.call(null, seq__7466_7478);
      if(temp__4092__auto___7490) {
        var seq__7466_7491__$1 = temp__4092__auto___7490;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7466_7491__$1)) {
          var c__3844__auto___7492 = cljs.core.chunk_first.call(null, seq__7466_7491__$1);
          var G__7493 = cljs.core.chunk_rest.call(null, seq__7466_7491__$1);
          var G__7494 = c__3844__auto___7492;
          var G__7495 = cljs.core.count.call(null, c__3844__auto___7492);
          var G__7496 = 0;
          seq__7466_7478 = G__7493;
          chunk__7467_7479 = G__7494;
          count__7468_7480 = G__7495;
          i__7469_7481 = G__7496;
          continue
        }else {
          var vec__7471_7497 = cljs.core.first.call(null, seq__7466_7491__$1);
          var n_7498 = cljs.core.nth.call(null, vec__7471_7497, 0, null);
          var un_7499 = cljs.core.nth.call(null, vec__7471_7497, 1, null);
          var code_7500 = [cljs.core.str(n_7498), cljs.core.str(" \x3d "), cljs.core.str(un_7499), cljs.core.str(";")].join("");
          eval(code_7500);
          var G__7501 = cljs.core.next.call(null, seq__7466_7491__$1);
          var G__7502 = null;
          var G__7503 = 0;
          var G__7504 = 0;
          seq__7466_7478 = G__7501;
          chunk__7467_7479 = G__7502;
          count__7468_7480 = G__7503;
          i__7469_7481 = G__7504;
          continue
        }
      }else {
      }
    }
    break
  }
  try {
    return body.call(null)
  }finally {
    var seq__7472_7505 = cljs.core.seq.call(null, var_names);
    var chunk__7473_7506 = null;
    var count__7474_7507 = 0;
    var i__7475_7508 = 0;
    while(true) {
      if(i__7475_7508 < count__7474_7507) {
        var vec__7476_7509 = cljs.core._nth.call(null, chunk__7473_7506, i__7475_7508);
        var n_7510 = cljs.core.nth.call(null, vec__7476_7509, 0, null);
        var code_7511 = [cljs.core.str(n_7510), cljs.core.str(" \x3d null;")].join("");
        eval(code_7511);
        var G__7512 = seq__7472_7505;
        var G__7513 = chunk__7473_7506;
        var G__7514 = count__7474_7507;
        var G__7515 = i__7475_7508 + 1;
        seq__7472_7505 = G__7512;
        chunk__7473_7506 = G__7513;
        count__7474_7507 = G__7514;
        i__7475_7508 = G__7515;
        continue
      }else {
        var temp__4092__auto___7516 = cljs.core.seq.call(null, seq__7472_7505);
        if(temp__4092__auto___7516) {
          var seq__7472_7517__$1 = temp__4092__auto___7516;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__7472_7517__$1)) {
            var c__3844__auto___7518 = cljs.core.chunk_first.call(null, seq__7472_7517__$1);
            var G__7519 = cljs.core.chunk_rest.call(null, seq__7472_7517__$1);
            var G__7520 = c__3844__auto___7518;
            var G__7521 = cljs.core.count.call(null, c__3844__auto___7518);
            var G__7522 = 0;
            seq__7472_7505 = G__7519;
            chunk__7473_7506 = G__7520;
            count__7474_7507 = G__7521;
            i__7475_7508 = G__7522;
            continue
          }else {
            var vec__7477_7523 = cljs.core.first.call(null, seq__7472_7517__$1);
            var n_7524 = cljs.core.nth.call(null, vec__7477_7523, 0, null);
            var code_7525 = [cljs.core.str(n_7524), cljs.core.str(" \x3d null;")].join("");
            eval(code_7525);
            var G__7526 = cljs.core.next.call(null, seq__7472_7517__$1);
            var G__7527 = null;
            var G__7528 = 0;
            var G__7529 = 0;
            seq__7472_7505 = G__7526;
            chunk__7473_7506 = G__7527;
            count__7474_7507 = G__7528;
            i__7475_7508 = G__7529;
            continue
          }
        }else {
        }
      }
      break
    }
  }
};
speclj.running.do_description = function do_description(description, reporters) {
  var tag_sets = speclj.tags.tag_sets_for.call(null, description);
  if(cljs.core.truth_(cljs.core.some.call(null, speclj.tags.pass_tag_filter_QMARK_, tag_sets))) {
    speclj.reporting.report_description_STAR_.call(null, reporters, description);
    return speclj.running.with_withs_bound.call(null, description, function() {
      speclj.running.eval_components.call(null, cljs.core.deref.call(null, description.before_alls));
      try {
        var results = speclj.running.results_for_context.call(null, description, reporters);
        return speclj.running.do_child_contexts.call(null, description, results, reporters)
      }finally {
        speclj.running.reset_withs.call(null, cljs.core.deref.call(null, description.with_alls))
      }
    })
  }else {
    return null
  }
};
speclj.running.process_compile_error = function process_compile_error(runner, e) {
  var error_result = speclj.results.error_result.call(null, e);
  cljs.core.swap_BANG_.call(null, runner.results, cljs.core.conj, error_result);
  return speclj.reporting.report_run.call(null, error_result, speclj.config.active_reporters.call(null))
};
speclj.running.Runner = {};
speclj.running.run_directories = function run_directories(this$, directories, reporters) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.speclj$running$Runner$run_directories$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.speclj$running$Runner$run_directories$arity$3(this$, directories, reporters)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = speclj.running.run_directories[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = speclj.running.run_directories["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Runner.run-directories", this$);
        }
      }
    }().call(null, this$, directories, reporters)
  }
};
speclj.running.submit_description = function submit_description(this$, description) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.speclj$running$Runner$submit_description$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.speclj$running$Runner$submit_description$arity$2(this$, description)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = speclj.running.submit_description[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = speclj.running.submit_description["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Runner.submit-description", this$);
        }
      }
    }().call(null, this$, description)
  }
};
speclj.running.run_description = function run_description(this$, description, reporters) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.speclj$running$Runner$run_description$arity$3
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.speclj$running$Runner$run_description$arity$3(this$, description, reporters)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = speclj.running.run_description[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = speclj.running.run_description["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Runner.run-description", this$);
        }
      }
    }().call(null, this$, description, reporters)
  }
};
speclj.running.run_and_report = function run_and_report(this$, reporters) {
  if(function() {
    var and__3119__auto__ = this$;
    if(and__3119__auto__) {
      return this$.speclj$running$Runner$run_and_report$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return this$.speclj$running$Runner$run_and_report$arity$2(this$, reporters)
  }else {
    var x__3723__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3128__auto__ = speclj.running.run_and_report[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = speclj.running.run_and_report["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Runner.run-and-report", this$);
        }
      }
    }().call(null, this$, reporters)
  }
};
goog.provide("clojure.data");
goog.require("cljs.core");
goog.require("clojure.set");
goog.require("clojure.set");
clojure.data.atom_diff = function atom_diff(a, b) {
  if(cljs.core._EQ_.call(null, a, b)) {
    return cljs.core.PersistentVector.fromArray([null, null, a], true)
  }else {
    return cljs.core.PersistentVector.fromArray([a, b, null], true)
  }
};
clojure.data.vectorize = function vectorize(m) {
  if(cljs.core.seq.call(null, m)) {
    return cljs.core.reduce.call(null, function(result, p__7384) {
      var vec__7385 = p__7384;
      var k = cljs.core.nth.call(null, vec__7385, 0, null);
      var v = cljs.core.nth.call(null, vec__7385, 1, null);
      return cljs.core.assoc.call(null, result, k, v)
    }, cljs.core.vec.call(null, cljs.core.repeat.call(null, cljs.core.apply.call(null, cljs.core.max, cljs.core.keys.call(null, m)), null)), m)
  }else {
    return null
  }
};
clojure.data.diff_associative_key = function diff_associative_key(a, b, k) {
  var va = cljs.core.get.call(null, a, k);
  var vb = cljs.core.get.call(null, b, k);
  var vec__7387 = clojure.data.diff.call(null, va, vb);
  var a_STAR_ = cljs.core.nth.call(null, vec__7387, 0, null);
  var b_STAR_ = cljs.core.nth.call(null, vec__7387, 1, null);
  var ab = cljs.core.nth.call(null, vec__7387, 2, null);
  var in_a = cljs.core.contains_QMARK_.call(null, a, k);
  var in_b = cljs.core.contains_QMARK_.call(null, b, k);
  var same = in_a && in_b && (!(ab == null) || va == null && vb == null);
  return cljs.core.PersistentVector.fromArray([in_a && (!(a_STAR_ == null) || !same) ? cljs.core.PersistentArrayMap.fromArray([k, a_STAR_], true) : null, in_b && (!(b_STAR_ == null) || !same) ? cljs.core.PersistentArrayMap.fromArray([k, b_STAR_], true) : null, same ? cljs.core.PersistentArrayMap.fromArray([k, ab], true) : null], true)
};
clojure.data.diff_associative = function() {
  var diff_associative = null;
  var diff_associative__2 = function(a, b) {
    return diff_associative.call(null, a, b, clojure.set.union.call(null, cljs.core.keys.call(null, a), cljs.core.keys.call(null, b)))
  };
  var diff_associative__3 = function(a, b, ks) {
    return cljs.core.reduce.call(null, function(diff1, diff2) {
      return cljs.core.doall.call(null, cljs.core.map.call(null, cljs.core.merge, diff1, diff2))
    }, cljs.core.PersistentVector.fromArray([null, null, null], true), cljs.core.map.call(null, cljs.core.partial.call(null, clojure.data.diff_associative_key, a, b), ks))
  };
  diff_associative = function(a, b, ks) {
    switch(arguments.length) {
      case 2:
        return diff_associative__2.call(this, a, b);
      case 3:
        return diff_associative__3.call(this, a, b, ks)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  diff_associative.cljs$core$IFn$_invoke$arity$2 = diff_associative__2;
  diff_associative.cljs$core$IFn$_invoke$arity$3 = diff_associative__3;
  return diff_associative
}();
clojure.data.diff_sequential = function diff_sequential(a, b) {
  return cljs.core.vec.call(null, cljs.core.map.call(null, clojure.data.vectorize, clojure.data.diff_associative.call(null, cljs.core.vector_QMARK_.call(null, a) ? a : cljs.core.vec.call(null, a), cljs.core.vector_QMARK_.call(null, b) ? b : cljs.core.vec.call(null, b), cljs.core.range.call(null, function() {
    var x__3433__auto__ = cljs.core.count.call(null, a);
    var y__3434__auto__ = cljs.core.count.call(null, b);
    return x__3433__auto__ > y__3434__auto__ ? x__3433__auto__ : y__3434__auto__
  }()))))
};
clojure.data.diff_set = function diff_set(a, b) {
  return cljs.core.PersistentVector.fromArray([cljs.core.not_empty.call(null, clojure.set.difference.call(null, a, b)), cljs.core.not_empty.call(null, clojure.set.difference.call(null, b, a)), cljs.core.not_empty.call(null, clojure.set.intersection.call(null, a, b))], true)
};
clojure.data.EqualityPartition = {};
clojure.data.equality_partition = function equality_partition(x) {
  if(function() {
    var and__3119__auto__ = x;
    if(and__3119__auto__) {
      return x.clojure$data$EqualityPartition$equality_partition$arity$1
    }else {
      return and__3119__auto__
    }
  }()) {
    return x.clojure$data$EqualityPartition$equality_partition$arity$1(x)
  }else {
    var x__3723__auto__ = x == null ? null : x;
    return function() {
      var or__3128__auto__ = clojure.data.equality_partition[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = clojure.data.equality_partition["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "EqualityPartition.equality-partition", x);
        }
      }
    }().call(null, x)
  }
};
clojure.data.Diff = {};
clojure.data.diff_similar = function diff_similar(a, b) {
  if(function() {
    var and__3119__auto__ = a;
    if(and__3119__auto__) {
      return a.clojure$data$Diff$diff_similar$arity$2
    }else {
      return and__3119__auto__
    }
  }()) {
    return a.clojure$data$Diff$diff_similar$arity$2(a, b)
  }else {
    var x__3723__auto__ = a == null ? null : a;
    return function() {
      var or__3128__auto__ = clojure.data.diff_similar[goog.typeOf(x__3723__auto__)];
      if(or__3128__auto__) {
        return or__3128__auto__
      }else {
        var or__3128__auto____$1 = clojure.data.diff_similar["_"];
        if(or__3128__auto____$1) {
          return or__3128__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "Diff.diff-similar", a);
        }
      }
    }().call(null, a, b)
  }
};
clojure.data.EqualityPartition["_"] = true;
clojure.data.equality_partition["_"] = function(x) {
  if(function() {
    var G__7388 = x;
    if(G__7388) {
      var bit__3746__auto__ = G__7388.cljs$lang$protocol_mask$partition0$ & 1024;
      if(bit__3746__auto__ || G__7388.cljs$core$IMap$) {
        return true
      }else {
        if(!G__7388.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IMap, G__7388)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.IMap, G__7388)
    }
  }()) {
    return new cljs.core.Keyword(null, "map", "map", 1014012110)
  }else {
    if(function() {
      var G__7389 = x;
      if(G__7389) {
        var bit__3746__auto__ = G__7389.cljs$lang$protocol_mask$partition0$ & 4096;
        if(bit__3746__auto__ || G__7389.cljs$core$ISet$) {
          return true
        }else {
          if(!G__7389.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISet, G__7389)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISet, G__7389)
      }
    }()) {
      return new cljs.core.Keyword(null, "set", "set", 1014018004)
    }else {
      if(function() {
        var G__7390 = x;
        if(G__7390) {
          var bit__3746__auto__ = G__7390.cljs$lang$protocol_mask$partition0$ & 16777216;
          if(bit__3746__auto__ || G__7390.cljs$core$ISequential$) {
            return true
          }else {
            if(!G__7390.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISequential, G__7390)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.native_satisfies_QMARK_.call(null, cljs.core.ISequential, G__7390)
        }
      }()) {
        return new cljs.core.Keyword(null, "sequential", "sequential", 849892465)
      }else {
        if(new cljs.core.Keyword(null, "default", "default", 2558708147)) {
          return new cljs.core.Keyword(null, "atom", "atom", 1016908995)
        }else {
          return null
        }
      }
    }
  }
};
clojure.data.EqualityPartition["boolean"] = true;
clojure.data.equality_partition["boolean"] = function(x) {
  return new cljs.core.Keyword(null, "atom", "atom", 1016908995)
};
clojure.data.EqualityPartition["function"] = true;
clojure.data.equality_partition["function"] = function(x) {
  return new cljs.core.Keyword(null, "atom", "atom", 1016908995)
};
clojure.data.EqualityPartition["array"] = true;
clojure.data.equality_partition["array"] = function(x) {
  return new cljs.core.Keyword(null, "sequential", "sequential", 849892465)
};
clojure.data.EqualityPartition["number"] = true;
clojure.data.equality_partition["number"] = function(x) {
  return new cljs.core.Keyword(null, "atom", "atom", 1016908995)
};
clojure.data.EqualityPartition["string"] = true;
clojure.data.equality_partition["string"] = function(x) {
  return new cljs.core.Keyword(null, "atom", "atom", 1016908995)
};
clojure.data.EqualityPartition["null"] = true;
clojure.data.equality_partition["null"] = function(x) {
  return new cljs.core.Keyword(null, "atom", "atom", 1016908995)
};
clojure.data.Diff["_"] = true;
clojure.data.diff_similar["_"] = function(a, b) {
  return function() {
    var G__7391 = clojure.data.equality_partition.call(null, a);
    if(cljs.core._EQ_.call(null, new cljs.core.Keyword(null, "map", "map", 1014012110), G__7391)) {
      return clojure.data.diff_associative
    }else {
      if(cljs.core._EQ_.call(null, new cljs.core.Keyword(null, "sequential", "sequential", 849892465), G__7391)) {
        return clojure.data.diff_sequential
      }else {
        if(cljs.core._EQ_.call(null, new cljs.core.Keyword(null, "set", "set", 1014018004), G__7391)) {
          return clojure.data.diff_set
        }else {
          if(cljs.core._EQ_.call(null, new cljs.core.Keyword(null, "atom", "atom", 1016908995), G__7391)) {
            return clojure.data.atom_diff
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(clojure.data.equality_partition.call(null, a))].join(""));
            }else {
              return null
            }
          }
        }
      }
    }
  }().call(null, a, b)
};
clojure.data.Diff["boolean"] = true;
clojure.data.diff_similar["boolean"] = function(a, b) {
  return clojure.data.atom_diff.call(null, a, b)
};
clojure.data.Diff["function"] = true;
clojure.data.diff_similar["function"] = function(a, b) {
  return clojure.data.atom_diff.call(null, a, b)
};
clojure.data.Diff["array"] = true;
clojure.data.diff_similar["array"] = function(a, b) {
  return clojure.data.diff_sequential.call(null, a, b)
};
clojure.data.Diff["number"] = true;
clojure.data.diff_similar["number"] = function(a, b) {
  return clojure.data.atom_diff.call(null, a, b)
};
clojure.data.Diff["string"] = true;
clojure.data.diff_similar["string"] = function(a, b) {
  return clojure.data.atom_diff.call(null, a, b)
};
clojure.data.Diff["null"] = true;
clojure.data.diff_similar["null"] = function(a, b) {
  return clojure.data.atom_diff.call(null, a, b)
};
clojure.data.diff = function diff(a, b) {
  if(cljs.core._EQ_.call(null, a, b)) {
    return cljs.core.PersistentVector.fromArray([null, null, a], true)
  }else {
    if(cljs.core._EQ_.call(null, clojure.data.equality_partition.call(null, a), clojure.data.equality_partition.call(null, b))) {
      return clojure.data.diff_similar.call(null, a, b)
    }else {
      return clojure.data.atom_diff.call(null, a, b)
    }
  }
};
goog.provide("speclj.report.silent");
goog.require("cljs.core");
goog.require("speclj.reporting");
speclj.report.silent.SilentReporter = function(passes, fails, results) {
  this.passes = passes;
  this.fails = fails;
  this.results = results
};
speclj.report.silent.SilentReporter.cljs$lang$type = true;
speclj.report.silent.SilentReporter.cljs$lang$ctorStr = "speclj.report.silent/SilentReporter";
speclj.report.silent.SilentReporter.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.report.silent/SilentReporter")
};
speclj.report.silent.SilentReporter.prototype.speclj$reporting$Reporter$ = true;
speclj.report.silent.SilentReporter.prototype.speclj$reporting$Reporter$report_message$arity$2 = function(this$, message) {
  var self__ = this;
  var this$__$1 = this;
  return null
};
speclj.report.silent.SilentReporter.prototype.speclj$reporting$Reporter$report_description$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  return null
};
speclj.report.silent.SilentReporter.prototype.speclj$reporting$Reporter$report_pass$arity$2 = function(this$, result) {
  var self__ = this;
  var this$__$1 = this;
  return null
};
speclj.report.silent.SilentReporter.prototype.speclj$reporting$Reporter$report_pending$arity$2 = function(this$, result) {
  var self__ = this;
  var this$__$1 = this;
  return null
};
speclj.report.silent.SilentReporter.prototype.speclj$reporting$Reporter$report_fail$arity$2 = function(this$, result) {
  var self__ = this;
  var this$__$1 = this;
  return null
};
speclj.report.silent.SilentReporter.prototype.speclj$reporting$Reporter$report_runs$arity$2 = function(this$, results__$1) {
  var self__ = this;
  var this$__$1 = this;
  return null
};
speclj.report.silent.SilentReporter.prototype.speclj$reporting$Reporter$report_error$arity$2 = function(this$, exception) {
  var self__ = this;
  var this$__$1 = this;
  return null
};
speclj.report.silent.__GT_SilentReporter = function __GT_SilentReporter(passes, fails, results) {
  return new speclj.report.silent.SilentReporter(passes, fails, results)
};
speclj.report.silent.new_silent_reporter = function new_silent_reporter() {
  return new speclj.report.silent.SilentReporter(cljs.core.atom.call(null, 0), cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
goog.provide("speclj.report.progress");
goog.require("cljs.core");
goog.require("speclj.config");
goog.require("speclj.reporting");
goog.require("speclj.results");
goog.require("clojure.string");
goog.require("clojure.string");
goog.require("speclj.results");
goog.require("speclj.reporting");
goog.require("speclj.platform");
goog.require("speclj.platform");
goog.require("speclj.config");
speclj.report.progress.full_name = function full_name(characteristic) {
  var context = cljs.core.deref.call(null, characteristic.parent);
  var name = characteristic.name;
  while(true) {
    if(cljs.core.truth_(context)) {
      var G__7072 = cljs.core.deref.call(null, context.parent);
      var G__7073 = [cljs.core.str(context.name), cljs.core.str(" "), cljs.core.str(name)].join("");
      context = G__7072;
      name = G__7073;
      continue
    }else {
      return name
    }
    break
  }
};
speclj.report.progress.print_failure = function print_failure(id, result) {
  var characteristic = result.characteristic;
  var failure = result.failure;
  cljs.core.println.call(null);
  cljs.core.println.call(null, speclj.reporting.indent.call(null, 1, id, ") ", speclj.report.progress.full_name.call(null, characteristic)));
  cljs.core.println.call(null, speclj.reporting.red.call(null, speclj.reporting.indent.call(null, 2.5, speclj.platform.error_message.call(null, failure))));
  if(cljs.core.truth_(speclj.platform.failure_QMARK_.call(null, failure))) {
    return cljs.core.println.call(null, speclj.reporting.grey.call(null, speclj.reporting.indent.call(null, 2.5, speclj.platform.failure_source.call(null, failure))))
  }else {
    return cljs.core.println.call(null, speclj.reporting.grey.call(null, speclj.reporting.indent.call(null, 2.5, speclj.reporting.stack_trace_str.call(null, failure))))
  }
};
speclj.report.progress.print_failures = function print_failures(failures) {
  if(cljs.core.seq.call(null, failures)) {
    cljs.core.println.call(null);
    cljs.core.println.call(null, "Failures:")
  }else {
  }
  var n__3891__auto__ = cljs.core.count.call(null, failures);
  var i = 0;
  while(true) {
    if(i < n__3891__auto__) {
      speclj.report.progress.print_failure.call(null, i + 1, cljs.core.nth.call(null, failures, i));
      var G__7074 = i + 1;
      i = G__7074;
      continue
    }else {
      return null
    }
    break
  }
};
speclj.report.progress.print_pendings = function print_pendings(pending_results) {
  if(cljs.core.seq.call(null, pending_results)) {
    cljs.core.println.call(null);
    cljs.core.println.call(null, "Pending:")
  }else {
  }
  var seq__7079 = cljs.core.seq.call(null, pending_results);
  var chunk__7080 = null;
  var count__7081 = 0;
  var i__7082 = 0;
  while(true) {
    if(i__7082 < count__7081) {
      var result = cljs.core._nth.call(null, chunk__7080, i__7082);
      cljs.core.println.call(null);
      cljs.core.println.call(null, speclj.reporting.yellow.call(null, [cljs.core.str("  "), cljs.core.str(speclj.report.progress.full_name.call(null, result.characteristic))].join("")));
      cljs.core.println.call(null, speclj.reporting.grey.call(null, [cljs.core.str("    ; "), cljs.core.str(speclj.platform.error_message.call(null, result.exception))].join("")));
      cljs.core.println.call(null, speclj.reporting.grey.call(null, [cljs.core.str("    ; "), cljs.core.str(speclj.platform.failure_source.call(null, result.exception))].join("")));
      var G__7083 = seq__7079;
      var G__7084 = chunk__7080;
      var G__7085 = count__7081;
      var G__7086 = i__7082 + 1;
      seq__7079 = G__7083;
      chunk__7080 = G__7084;
      count__7081 = G__7085;
      i__7082 = G__7086;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__7079);
      if(temp__4092__auto__) {
        var seq__7079__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7079__$1)) {
          var c__3844__auto__ = cljs.core.chunk_first.call(null, seq__7079__$1);
          var G__7087 = cljs.core.chunk_rest.call(null, seq__7079__$1);
          var G__7088 = c__3844__auto__;
          var G__7089 = cljs.core.count.call(null, c__3844__auto__);
          var G__7090 = 0;
          seq__7079 = G__7087;
          chunk__7080 = G__7088;
          count__7081 = G__7089;
          i__7082 = G__7090;
          continue
        }else {
          var result = cljs.core.first.call(null, seq__7079__$1);
          cljs.core.println.call(null);
          cljs.core.println.call(null, speclj.reporting.yellow.call(null, [cljs.core.str("  "), cljs.core.str(speclj.report.progress.full_name.call(null, result.characteristic))].join("")));
          cljs.core.println.call(null, speclj.reporting.grey.call(null, [cljs.core.str("    ; "), cljs.core.str(speclj.platform.error_message.call(null, result.exception))].join("")));
          cljs.core.println.call(null, speclj.reporting.grey.call(null, [cljs.core.str("    ; "), cljs.core.str(speclj.platform.failure_source.call(null, result.exception))].join("")));
          var G__7091 = cljs.core.next.call(null, seq__7079__$1);
          var G__7092 = null;
          var G__7093 = 0;
          var G__7094 = 0;
          seq__7079 = G__7091;
          chunk__7080 = G__7092;
          count__7081 = G__7093;
          i__7082 = G__7094;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
speclj.report.progress.print_errors = function print_errors(error_results) {
  if(cljs.core.seq.call(null, error_results)) {
    cljs.core.println.call(null);
    cljs.core.println.call(null, "Errors:")
  }else {
  }
  var seq__7101_7107 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, cljs.core.interleave.call(null, cljs.core.iterate.call(null, cljs.core.inc, 1), error_results)));
  var chunk__7102_7108 = null;
  var count__7103_7109 = 0;
  var i__7104_7110 = 0;
  while(true) {
    if(i__7104_7110 < count__7103_7109) {
      var vec__7105_7111 = cljs.core._nth.call(null, chunk__7102_7108, i__7104_7110);
      var number_7112 = cljs.core.nth.call(null, vec__7105_7111, 0, null);
      var result_7113 = cljs.core.nth.call(null, vec__7105_7111, 1, null);
      cljs.core.println.call(null);
      cljs.core.println.call(null, speclj.reporting.indent.call(null, 1, number_7112, ") ", speclj.reporting.red.call(null, [cljs.core.str(result_7113.exception)].join(""))));
      cljs.core.println.call(null, speclj.reporting.grey.call(null, speclj.reporting.indent.call(null, 2.5, speclj.reporting.stack_trace_str.call(null, result_7113.exception))));
      var G__7114 = seq__7101_7107;
      var G__7115 = chunk__7102_7108;
      var G__7116 = count__7103_7109;
      var G__7117 = i__7104_7110 + 1;
      seq__7101_7107 = G__7114;
      chunk__7102_7108 = G__7115;
      count__7103_7109 = G__7116;
      i__7104_7110 = G__7117;
      continue
    }else {
      var temp__4092__auto___7118 = cljs.core.seq.call(null, seq__7101_7107);
      if(temp__4092__auto___7118) {
        var seq__7101_7119__$1 = temp__4092__auto___7118;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7101_7119__$1)) {
          var c__3844__auto___7120 = cljs.core.chunk_first.call(null, seq__7101_7119__$1);
          var G__7121 = cljs.core.chunk_rest.call(null, seq__7101_7119__$1);
          var G__7122 = c__3844__auto___7120;
          var G__7123 = cljs.core.count.call(null, c__3844__auto___7120);
          var G__7124 = 0;
          seq__7101_7107 = G__7121;
          chunk__7102_7108 = G__7122;
          count__7103_7109 = G__7123;
          i__7104_7110 = G__7124;
          continue
        }else {
          var vec__7106_7125 = cljs.core.first.call(null, seq__7101_7119__$1);
          var number_7126 = cljs.core.nth.call(null, vec__7106_7125, 0, null);
          var result_7127 = cljs.core.nth.call(null, vec__7106_7125, 1, null);
          cljs.core.println.call(null);
          cljs.core.println.call(null, speclj.reporting.indent.call(null, 1, number_7126, ") ", speclj.reporting.red.call(null, [cljs.core.str(result_7127.exception)].join(""))));
          cljs.core.println.call(null, speclj.reporting.grey.call(null, speclj.reporting.indent.call(null, 2.5, speclj.reporting.stack_trace_str.call(null, result_7127.exception))));
          var G__7128 = cljs.core.next.call(null, seq__7101_7119__$1);
          var G__7129 = null;
          var G__7130 = 0;
          var G__7131 = 0;
          seq__7101_7107 = G__7128;
          chunk__7102_7108 = G__7129;
          count__7103_7109 = G__7130;
          i__7104_7110 = G__7131;
          continue
        }
      }else {
      }
    }
    break
  }
  return cljs.core.flush.call(null)
};
speclj.report.progress.print_duration = function print_duration(results) {
  cljs.core.println.call(null);
  return cljs.core.println.call(null, "Finished in", speclj.platform.format_seconds.call(null, speclj.reporting.tally_time.call(null, results)), "seconds")
};
speclj.report.progress.color_fn_for = function color_fn_for(result_map) {
  if(cljs.core.not_EQ_.call(null, 0, cljs.core.count.call(null, cljs.core.concat.call(null, (new cljs.core.Keyword(null, "fail", "fail", 1017039504)).cljs$core$IFn$_invoke$arity$1(result_map), (new cljs.core.Keyword(null, "error", "error", 1110689146)).cljs$core$IFn$_invoke$arity$1(result_map))))) {
    return speclj.reporting.red
  }else {
    if(cljs.core.not_EQ_.call(null, 0, cljs.core.count.call(null, (new cljs.core.Keyword(null, "pending", "pending", 4626283785)).cljs$core$IFn$_invoke$arity$1(result_map)))) {
      return speclj.reporting.yellow
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return speclj.reporting.green
      }else {
        return null
      }
    }
  }
};
speclj.report.progress.apply_pending_tally = function apply_pending_tally(report, tally) {
  if((new cljs.core.Keyword(null, "pending", "pending", 4626283785)).cljs$core$IFn$_invoke$arity$1(tally) > 0) {
    return cljs.core.conj.call(null, report, [cljs.core.str((new cljs.core.Keyword(null, "pending", "pending", 4626283785)).cljs$core$IFn$_invoke$arity$1(tally)), cljs.core.str(" pending")].join(""))
  }else {
    return report
  }
};
speclj.report.progress.apply_error_tally = function apply_error_tally(report, tally) {
  if((new cljs.core.Keyword(null, "error", "error", 1110689146)).cljs$core$IFn$_invoke$arity$1(tally) > 0) {
    return cljs.core.conj.call(null, report, [cljs.core.str((new cljs.core.Keyword(null, "error", "error", 1110689146)).cljs$core$IFn$_invoke$arity$1(tally)), cljs.core.str(" errors")].join(""))
  }else {
    return report
  }
};
speclj.report.progress.describe_counts_for = function describe_counts_for(result_map) {
  var tally = cljs.core.zipmap.call(null, cljs.core.keys.call(null, result_map), cljs.core.map.call(null, cljs.core.count, cljs.core.vals.call(null, result_map)));
  var always_on_counts = cljs.core.PersistentVector.fromArray([[cljs.core.str(cljs.core.apply.call(null, cljs.core._PLUS_, cljs.core.vals.call(null, tally))), cljs.core.str(" examples")].join(""), [cljs.core.str((new cljs.core.Keyword(null, "fail", "fail", 1017039504)).cljs$core$IFn$_invoke$arity$1(tally)), cljs.core.str(" failures")].join("")], true);
  return clojure.string.join.call(null, ", ", speclj.report.progress.apply_error_tally.call(null, speclj.report.progress.apply_pending_tally.call(null, always_on_counts, tally), tally))
};
speclj.report.progress.print_tally = function print_tally(result_map) {
  var color_fn = speclj.report.progress.color_fn_for.call(null, result_map);
  return cljs.core.println.call(null, color_fn.call(null, speclj.report.progress.describe_counts_for.call(null, result_map)))
};
speclj.report.progress.print_summary = function print_summary(results) {
  var result_map = speclj.results.categorize.call(null, results);
  speclj.report.progress.print_failures.call(null, (new cljs.core.Keyword(null, "fail", "fail", 1017039504)).cljs$core$IFn$_invoke$arity$1(result_map));
  speclj.report.progress.print_pendings.call(null, (new cljs.core.Keyword(null, "pending", "pending", 4626283785)).cljs$core$IFn$_invoke$arity$1(result_map));
  speclj.report.progress.print_errors.call(null, (new cljs.core.Keyword(null, "error", "error", 1110689146)).cljs$core$IFn$_invoke$arity$1(result_map));
  speclj.report.progress.print_duration.call(null, results);
  return speclj.report.progress.print_tally.call(null, result_map)
};
speclj.report.progress.ProgressReporter = function() {
};
speclj.report.progress.ProgressReporter.cljs$lang$type = true;
speclj.report.progress.ProgressReporter.cljs$lang$ctorStr = "speclj.report.progress/ProgressReporter";
speclj.report.progress.ProgressReporter.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.report.progress/ProgressReporter")
};
speclj.report.progress.ProgressReporter.prototype.speclj$reporting$Reporter$ = true;
speclj.report.progress.ProgressReporter.prototype.speclj$reporting$Reporter$report_message$arity$2 = function(this$, message) {
  var self__ = this;
  var this$__$1 = this;
  cljs.core.println.call(null, message);
  return cljs.core.flush.call(null)
};
speclj.report.progress.ProgressReporter.prototype.speclj$reporting$Reporter$report_description$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  return null
};
speclj.report.progress.ProgressReporter.prototype.speclj$reporting$Reporter$report_pass$arity$2 = function(this$, result) {
  var self__ = this;
  var this$__$1 = this;
  cljs.core.print.call(null, speclj.reporting.green.call(null, "."));
  return cljs.core.flush.call(null)
};
speclj.report.progress.ProgressReporter.prototype.speclj$reporting$Reporter$report_pending$arity$2 = function(this$, result) {
  var self__ = this;
  var this$__$1 = this;
  cljs.core.print.call(null, speclj.reporting.yellow.call(null, "*"));
  return cljs.core.flush.call(null)
};
speclj.report.progress.ProgressReporter.prototype.speclj$reporting$Reporter$report_fail$arity$2 = function(this$, result) {
  var self__ = this;
  var this$__$1 = this;
  cljs.core.print.call(null, speclj.reporting.red.call(null, "F"));
  return cljs.core.flush.call(null)
};
speclj.report.progress.ProgressReporter.prototype.speclj$reporting$Reporter$report_error$arity$2 = function(this$, result) {
  var self__ = this;
  var this$__$1 = this;
  cljs.core.print.call(null, speclj.reporting.red.call(null, "E"));
  return cljs.core.flush.call(null)
};
speclj.report.progress.ProgressReporter.prototype.speclj$reporting$Reporter$report_runs$arity$2 = function(this$, results) {
  var self__ = this;
  var this$__$1 = this;
  cljs.core.println.call(null);
  return speclj.report.progress.print_summary.call(null, results)
};
speclj.report.progress.__GT_ProgressReporter = function __GT_ProgressReporter() {
  return new speclj.report.progress.ProgressReporter
};
speclj.report.progress.new_progress_reporter = function new_progress_reporter() {
  return new speclj.report.progress.ProgressReporter
};
cljs.core.reset_BANG_.call(null, speclj.config.default_reporters, cljs.core.PersistentVector.fromArray([speclj.report.progress.new_progress_reporter.call(null)], true));
goog.provide("speclj.run.standard");
goog.require("cljs.core");
goog.require("speclj.tags");
goog.require("speclj.running");
goog.require("speclj.reporting");
goog.require("speclj.config");
goog.require("speclj.results");
goog.require("speclj.tags");
goog.require("speclj.running");
goog.require("speclj.results");
goog.require("speclj.reporting");
goog.require("speclj.report.progress");
goog.require("speclj.config");
goog.require("speclj.components");
speclj.run.standard.counter = cljs.core.atom.call(null, 0);
speclj.run.standard.StandardRunner = function(num, descriptions, results) {
  this.num = num;
  this.descriptions = descriptions;
  this.results = results
};
speclj.run.standard.StandardRunner.cljs$lang$type = true;
speclj.run.standard.StandardRunner.cljs$lang$ctorStr = "speclj.run.standard/StandardRunner";
speclj.run.standard.StandardRunner.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.run.standard/StandardRunner")
};
speclj.run.standard.StandardRunner.prototype.speclj$running$Runner$ = true;
speclj.run.standard.StandardRunner.prototype.speclj$running$Runner$run_directories$arity$3 = function(this$, directories, reporters) {
  var self__ = this;
  var this$__$1 = this;
  return alert("StandardRunner.run-directories:  I don't know how to do this.")
};
speclj.run.standard.StandardRunner.prototype.speclj$running$Runner$submit_description$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  return cljs.core.swap_BANG_.call(null, self__.descriptions, cljs.core.conj, description)
};
speclj.run.standard.StandardRunner.prototype.speclj$running$Runner$run_description$arity$3 = function(this$, description, reporters) {
  var self__ = this;
  var this$__$1 = this;
  var run_results = speclj.running.do_description.call(null, description, reporters);
  return cljs.core.swap_BANG_.call(null, self__.results, cljs.core.into, run_results)
};
speclj.run.standard.StandardRunner.prototype.speclj$running$Runner$run_and_report$arity$2 = function(this$, reporters) {
  var self__ = this;
  var this$__$1 = this;
  var seq__7290_7294 = cljs.core.seq.call(null, cljs.core.deref.call(null, self__.descriptions));
  var chunk__7291_7295 = null;
  var count__7292_7296 = 0;
  var i__7293_7297 = 0;
  while(true) {
    if(i__7293_7297 < count__7292_7296) {
      var description_7298 = cljs.core._nth.call(null, chunk__7291_7295, i__7293_7297);
      speclj.running.run_description.call(null, this$__$1, description_7298, reporters);
      var G__7299 = seq__7290_7294;
      var G__7300 = chunk__7291_7295;
      var G__7301 = count__7292_7296;
      var G__7302 = i__7293_7297 + 1;
      seq__7290_7294 = G__7299;
      chunk__7291_7295 = G__7300;
      count__7292_7296 = G__7301;
      i__7293_7297 = G__7302;
      continue
    }else {
      var temp__4092__auto___7303 = cljs.core.seq.call(null, seq__7290_7294);
      if(temp__4092__auto___7303) {
        var seq__7290_7304__$1 = temp__4092__auto___7303;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7290_7304__$1)) {
          var c__3844__auto___7305 = cljs.core.chunk_first.call(null, seq__7290_7304__$1);
          var G__7306 = cljs.core.chunk_rest.call(null, seq__7290_7304__$1);
          var G__7307 = c__3844__auto___7305;
          var G__7308 = cljs.core.count.call(null, c__3844__auto___7305);
          var G__7309 = 0;
          seq__7290_7294 = G__7306;
          chunk__7291_7295 = G__7307;
          count__7292_7296 = G__7308;
          i__7293_7297 = G__7309;
          continue
        }else {
          var description_7310 = cljs.core.first.call(null, seq__7290_7304__$1);
          speclj.running.run_description.call(null, this$__$1, description_7310, reporters);
          var G__7311 = cljs.core.next.call(null, seq__7290_7304__$1);
          var G__7312 = null;
          var G__7313 = 0;
          var G__7314 = 0;
          seq__7290_7294 = G__7311;
          chunk__7291_7295 = G__7312;
          count__7292_7296 = G__7313;
          i__7293_7297 = G__7314;
          continue
        }
      }else {
      }
    }
    break
  }
  return speclj.reporting.report_runs_STAR_.call(null, reporters, cljs.core.deref.call(null, self__.results))
};
speclj.run.standard.__GT_StandardRunner = function __GT_StandardRunner(num, descriptions, results) {
  return new speclj.run.standard.StandardRunner(num, descriptions, results)
};
speclj.components.Description.prototype.cljs$core$IPrintWithWriter$ = true;
speclj.components.Description.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(x, writer, opts) {
  var x__$1 = this;
  return cljs.core._write.call(null, writer, [cljs.core.str("#\x3cspeclj.component.Description(name: "), cljs.core.str(x__$1.name), cljs.core.str(")\x3e")].join(""))
};
speclj.run.standard.StandardRunner.prototype.cljs$core$IPrintWithWriter$ = true;
speclj.run.standard.StandardRunner.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(x, writer, opts) {
  var x__$1 = this;
  cljs.core._write.call(null, writer, [cljs.core.str("#\x3cspeclj.run.standard.StandardRunner(num: "), cljs.core.str(x__$1.num), cljs.core.str(", descriptions: ")].join(""));
  cljs.core._pr_writer.call(null, cljs.core.deref.call(null, x__$1.descriptions), writer, opts);
  return cljs.core._write.call(null, writer, ")\x3e")
};
speclj.run.standard.new_standard_runner = function new_standard_runner() {
  return new speclj.run.standard.StandardRunner(cljs.core.swap_BANG_.call(null, speclj.run.standard.counter, cljs.core.inc), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY), cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY))
};
cljs.core.reset_BANG_.call(null, speclj.config.default_runner_fn, speclj.run.standard.new_standard_runner);
cljs.core.reset_BANG_.call(null, speclj.config.default_runner, speclj.run.standard.new_standard_runner.call(null));
speclj.run.standard.armed = false;
speclj.run.standard.run_specs = function() {
  var run_specs__delegate = function(configurations) {
    if(cljs.core.truth_(speclj.run.standard.armed)) {
      var config = cljs.core.apply.call(null, cljs.core.hash_map, configurations);
      var config__$1 = cljs.core.merge.call(null, cljs.core.dissoc.call(null, speclj.config.default_config, new cljs.core.Keyword(null, "runner", "runner", 4389065378)), config);
      return speclj.config.with_config.call(null, config__$1, function() {
        var temp__4090__auto___7315 = speclj.tags.describe_filter.call(null);
        if(cljs.core.truth_(temp__4090__auto___7315)) {
          var filter_msg_7316 = temp__4090__auto___7315;
          speclj.reporting.report_message_STAR_.call(null, speclj.config.active_reporters.call(null), filter_msg_7316)
        }else {
        }
        speclj.running.run_and_report.call(null, speclj.config.active_runner.call(null), speclj.config.active_reporters.call(null));
        return speclj.results.fail_count.call(null, cljs.core.deref.call(null, speclj.config.active_runner.call(null).results))
      })
    }else {
      return null
    }
  };
  var run_specs = function(var_args) {
    var configurations = null;
    if(arguments.length > 0) {
      configurations = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return run_specs__delegate.call(this, configurations)
  };
  run_specs.cljs$lang$maxFixedArity = 0;
  run_specs.cljs$lang$applyTo = function(arglist__7317) {
    var configurations = cljs.core.seq(arglist__7317);
    return run_specs__delegate(configurations)
  };
  run_specs.cljs$core$IFn$_invoke$arity$variadic = run_specs__delegate;
  return run_specs
}();
goog.provide("speclj.stub");
goog.require("cljs.core");
goog.require("speclj.platform");
goog.require("speclj.platform");
speclj.stub.check_recording = function check_recording() {
  if(cljs.core.truth_(speclj.stub._STAR_stubbed_invocations_STAR_)) {
    return null
  }else {
    return speclj.platform.throw_error.call(null, "Stub recoding not bound.  Please add (with-stubs) to the decribe/context.")
  }
};
speclj.stub._record_invocation = function _record_invocation(name, args) {
  speclj.stub.check_recording.call(null);
  var args__$1 = cljs.core._EQ_.call(null, null, args) ? cljs.core.PersistentVector.EMPTY : cljs.core.vec.call(null, args);
  return cljs.core.swap_BANG_.call(null, speclj.stub._STAR_stubbed_invocations_STAR_, cljs.core.conj, cljs.core.PersistentVector.fromArray([name, args__$1], true))
};
speclj.stub.invoke_delegate = function invoke_delegate(name, delegate, args) {
  return cljs.core.apply.call(null, delegate, args)
};
speclj.stub.stub = function() {
  var stub = null;
  var stub__1 = function(name) {
    return stub.call(null, name, cljs.core.PersistentArrayMap.EMPTY)
  };
  var stub__2 = function(name, options) {
    var delegate = (new cljs.core.Keyword(null, "invoke", "invoke", 4125177834)).cljs$core$IFn$_invoke$arity$1(options);
    if(cljs.core.truth_(function() {
      var and__3119__auto__ = delegate;
      if(cljs.core.truth_(and__3119__auto__)) {
        return!cljs.core.ifn_QMARK_.call(null, delegate)
      }else {
        return and__3119__auto__
      }
    }())) {
      speclj.platform.throw_error.call(null, "stub's :invoke argument must be an ifn")
    }else {
    }
    return function() {
      var G__7045__delegate = function(args) {
        speclj.stub._record_invocation.call(null, name, args);
        var result = cljs.core.truth_(delegate) ? speclj.stub.invoke_delegate.call(null, name, delegate, args) : null;
        var temp__4092__auto___7046 = (new cljs.core.Keyword(null, "throw", "throw", 1124244056)).cljs$core$IFn$_invoke$arity$1(options);
        if(cljs.core.truth_(temp__4092__auto___7046)) {
          var throwable_7047 = temp__4092__auto___7046;
          throw throwable_7047;
        }else {
        }
        if(cljs.core.contains_QMARK_.call(null, options, new cljs.core.Keyword(null, "return", "return", 4374474914))) {
          return(new cljs.core.Keyword(null, "return", "return", 4374474914)).cljs$core$IFn$_invoke$arity$1(options)
        }else {
          return result
        }
      };
      var G__7045 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7045__delegate.call(this, args)
      };
      G__7045.cljs$lang$maxFixedArity = 0;
      G__7045.cljs$lang$applyTo = function(arglist__7048) {
        var args = cljs.core.seq(arglist__7048);
        return G__7045__delegate(args)
      };
      G__7045.cljs$core$IFn$_invoke$arity$variadic = G__7045__delegate;
      return G__7045
    }()
  };
  stub = function(name, options) {
    switch(arguments.length) {
      case 1:
        return stub__1.call(this, name);
      case 2:
        return stub__2.call(this, name, options)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  stub.cljs$core$IFn$_invoke$arity$1 = stub__1;
  stub.cljs$core$IFn$_invoke$arity$2 = stub__2;
  return stub
}();
speclj.stub.invocations_of = function invocations_of(name) {
  return cljs.core.map.call(null, cljs.core.second, cljs.core.filter.call(null, function(p1__7049_SHARP_) {
    return cljs.core._EQ_.call(null, name, cljs.core.first.call(null, p1__7049_SHARP_))
  }, cljs.core.deref.call(null, speclj.stub._STAR_stubbed_invocations_STAR_)))
};
speclj.stub.first_invocation_of = function first_invocation_of(name) {
  return cljs.core.first.call(null, speclj.stub.invocations_of.call(null, name))
};
speclj.stub.last_invocation_of = function last_invocation_of(name) {
  return cljs.core.last.call(null, speclj.stub.invocations_of.call(null, name))
};
speclj.stub.params_match_QMARK_ = function params_match_QMARK_(expected, actual) {
  return cljs.core.sequential_QMARK_.call(null, expected) && cljs.core.sequential_QMARK_.call(null, actual) && cljs.core._EQ_.call(null, cljs.core.count.call(null, expected), cljs.core.count.call(null, actual)) && cljs.core.every_QMARK_.call(null, cljs.core.true_QMARK_, cljs.core.map.call(null, function(e, a) {
    if(cljs.core._EQ_.call(null, new cljs.core.Keyword(null, "*", "*", 1013904284), e)) {
      return true
    }else {
      if(cljs.core.fn_QMARK_.call(null, e)) {
        var or__3128__auto__ = cljs.core._EQ_.call(null, e, a);
        if(or__3128__auto__) {
          return or__3128__auto__
        }else {
          return e.call(null, a)
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return cljs.core._EQ_.call(null, e, a)
        }else {
          return null
        }
      }
    }
  }, expected, actual))
};
goog.provide("speclj.report.documentation");
goog.require("cljs.core");
goog.require("speclj.report.progress");
goog.require("speclj.config");
goog.require("speclj.platform");
goog.require("speclj.reporting");
goog.require("speclj.results");
goog.require("speclj.results");
goog.require("speclj.reporting");
goog.require("speclj.report.progress");
goog.require("speclj.platform");
goog.require("speclj.config");
speclj.report.documentation.level_of = function level_of(component) {
  var component__$1 = cljs.core.deref.call(null, component.parent);
  var level = 0;
  while(true) {
    if(cljs.core.truth_(component__$1)) {
      var G__6993 = cljs.core.deref.call(null, component__$1.parent);
      var G__6994 = level + 1;
      component__$1 = G__6993;
      level = G__6994;
      continue
    }else {
      return level
    }
    break
  }
};
speclj.report.documentation.DocumentationReporter = function() {
};
speclj.report.documentation.DocumentationReporter.cljs$lang$type = true;
speclj.report.documentation.DocumentationReporter.cljs$lang$ctorStr = "speclj.report.documentation/DocumentationReporter";
speclj.report.documentation.DocumentationReporter.cljs$lang$ctorPrWriter = function(this__3664__auto__, writer__3665__auto__, opt__3666__auto__) {
  return cljs.core._write.call(null, writer__3665__auto__, "speclj.report.documentation/DocumentationReporter")
};
speclj.report.documentation.DocumentationReporter.prototype.speclj$reporting$Reporter$ = true;
speclj.report.documentation.DocumentationReporter.prototype.speclj$reporting$Reporter$report_message$arity$2 = function(this$, message) {
  var self__ = this;
  var this$__$1 = this;
  cljs.core.println.call(null, message);
  return cljs.core.flush.call(null)
};
speclj.report.documentation.DocumentationReporter.prototype.speclj$reporting$Reporter$report_description$arity$2 = function(this$, description) {
  var self__ = this;
  var this$__$1 = this;
  var level = speclj.report.documentation.level_of.call(null, description);
  if(level === 0) {
    cljs.core.println.call(null)
  }else {
  }
  cljs.core.println.call(null, [cljs.core.str(speclj.reporting.indent.call(null, level, description.name))].join(""));
  return cljs.core.flush.call(null)
};
speclj.report.documentation.DocumentationReporter.prototype.speclj$reporting$Reporter$report_pass$arity$2 = function(this$, result) {
  var self__ = this;
  var this$__$1 = this;
  var characteristic = result.characteristic;
  var level = speclj.report.documentation.level_of.call(null, characteristic);
  cljs.core.println.call(null, speclj.reporting.green.call(null, speclj.reporting.indent.call(null, level - 1, "- ", characteristic.name)));
  return cljs.core.flush.call(null)
};
speclj.report.documentation.DocumentationReporter.prototype.speclj$reporting$Reporter$report_pending$arity$2 = function(this$, result) {
  var self__ = this;
  var this$__$1 = this;
  var characteristic = result.characteristic;
  var level = speclj.report.documentation.level_of.call(null, characteristic);
  cljs.core.println.call(null, speclj.reporting.yellow.call(null, speclj.reporting.indent.call(null, level - 1, "- ", characteristic.name, " (PENDING: ", speclj.platform.error_message.call(null, result.exception), ")")));
  return cljs.core.flush.call(null)
};
speclj.report.documentation.DocumentationReporter.prototype.speclj$reporting$Reporter$report_fail$arity$2 = function(this$, result) {
  var self__ = this;
  var this$__$1 = this;
  var characteristic = result.characteristic;
  var level = speclj.report.documentation.level_of.call(null, characteristic);
  cljs.core.println.call(null, speclj.reporting.red.call(null, speclj.reporting.indent.call(null, level - 1, "- ", characteristic.name, " (FAILED)")));
  return cljs.core.flush.call(null)
};
speclj.report.documentation.DocumentationReporter.prototype.speclj$reporting$Reporter$report_error$arity$2 = function(this$, result) {
  var self__ = this;
  var this$__$1 = this;
  return cljs.core.println.call(null, speclj.reporting.red.call(null, result.exception.toString()))
};
speclj.report.documentation.DocumentationReporter.prototype.speclj$reporting$Reporter$report_runs$arity$2 = function(this$, results) {
  var self__ = this;
  var this$__$1 = this;
  return speclj.report.progress.print_summary.call(null, results)
};
speclj.report.documentation.__GT_DocumentationReporter = function __GT_DocumentationReporter() {
  return new speclj.report.documentation.DocumentationReporter
};
speclj.report.documentation.new_documentation_reporter = function new_documentation_reporter() {
  return new speclj.report.documentation.DocumentationReporter
};
goog.provide("speclj.core");
goog.require("cljs.core");
goog.require("speclj.running");
goog.require("clojure.data");
goog.require("speclj.platform");
goog.require("speclj.report.silent");
goog.require("speclj.components");
goog.require("speclj.run.standard");
goog.require("speclj.reporting");
goog.require("speclj.report.progress");
goog.require("speclj.results");
goog.require("speclj.config");
goog.require("speclj.stub");
goog.require("speclj.tags");
goog.require("speclj.report.documentation");
goog.provide("angular_cljs_todo.core_spec");
goog.require("cljs.core");
goog.require("angular_cljs_todo.core");
goog.require("speclj.core");
var description__5061__auto___5819 = speclj.components.new_description.call(null, "todo app", "angular-cljs-todo.core-spec");
var _STAR_parent_description_STAR_5814_5820 = speclj.config._STAR_parent_description_STAR_;
try {
  speclj.config._STAR_parent_description_STAR_ = description__5061__auto___5819;
  var seq__5815_5821 = cljs.core.seq.call(null, cljs.core.list.call(null, speclj.components.new_characteristic.call(null, "works", function() {
    var expected__5141__auto__ = 1;
    var actual__5142__auto__ = 1;
    if(cljs.core._EQ_.call(null, expected__5141__auto__, actual__5142__auto__)) {
      return null
    }else {
      throw speclj.platform.new_failure.call(null, [cljs.core.str("Expected: "), cljs.core.str(expected__5141__auto__ == null ? "nil" : cljs.core.pr_str.call(null, expected__5141__auto__)), cljs.core.str(speclj.platform.endl), cljs.core.str("     got: "), cljs.core.str(actual__5142__auto__ == null ? "nil" : cljs.core.pr_str.call(null, actual__5142__auto__)), cljs.core.str(" (using \x3d)")].join(""));
    }
  })));
  var chunk__5816_5822 = null;
  var count__5817_5823 = 0;
  var i__5818_5824 = 0;
  while(true) {
    if(i__5818_5824 < count__5817_5823) {
      var component__5062__auto___5825 = cljs.core._nth.call(null, chunk__5816_5822, i__5818_5824);
      speclj.components.install.call(null, component__5062__auto___5825, description__5061__auto___5819);
      var G__5826 = seq__5815_5821;
      var G__5827 = chunk__5816_5822;
      var G__5828 = count__5817_5823;
      var G__5829 = i__5818_5824 + 1;
      seq__5815_5821 = G__5826;
      chunk__5816_5822 = G__5827;
      count__5817_5823 = G__5828;
      i__5818_5824 = G__5829;
      continue
    }else {
      var temp__4092__auto___5830 = cljs.core.seq.call(null, seq__5815_5821);
      if(temp__4092__auto___5830) {
        var seq__5815_5831__$1 = temp__4092__auto___5830;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5815_5831__$1)) {
          var c__3844__auto___5832 = cljs.core.chunk_first.call(null, seq__5815_5831__$1);
          var G__5833 = cljs.core.chunk_rest.call(null, seq__5815_5831__$1);
          var G__5834 = c__3844__auto___5832;
          var G__5835 = cljs.core.count.call(null, c__3844__auto___5832);
          var G__5836 = 0;
          seq__5815_5821 = G__5833;
          chunk__5816_5822 = G__5834;
          count__5817_5823 = G__5835;
          i__5818_5824 = G__5836;
          continue
        }else {
          var component__5062__auto___5837 = cljs.core.first.call(null, seq__5815_5831__$1);
          speclj.components.install.call(null, component__5062__auto___5837, description__5061__auto___5819);
          var G__5838 = cljs.core.next.call(null, seq__5815_5831__$1);
          var G__5839 = null;
          var G__5840 = 0;
          var G__5841 = 0;
          seq__5815_5821 = G__5838;
          chunk__5816_5822 = G__5839;
          count__5817_5823 = G__5840;
          i__5818_5824 = G__5841;
          continue
        }
      }else {
      }
    }
    break
  }
}finally {
  speclj.config._STAR_parent_description_STAR_ = _STAR_parent_description_STAR_5814_5820
}
if(cljs.core.truth_(speclj.config._STAR_parent_description_STAR_)) {
}else {
  speclj.running.submit_description.call(null, speclj.config.active_runner.call(null), description__5061__auto___5819)
}
;