// Input 0
var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
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
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
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
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
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
      var className = Object.prototype.toString.call(value);
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
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
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
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
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
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
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
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
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
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
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
// Input 1
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
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
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
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
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
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
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
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
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
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
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
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
// Input 2
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
// Input 3
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
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
// Input 4
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
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
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
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
// Input 5
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
// Input 6
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
// Input 7
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
// Input 8
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
// Input 9
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6233 = x == null ? null : x;
  if(p[goog.typeOf(x__6233)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
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
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
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
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6234__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6234 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6234__delegate.call(this, array, i, idxs)
    };
    G__6234.cljs$lang$maxFixedArity = 2;
    G__6234.cljs$lang$applyTo = function(arglist__6235) {
      var array = cljs.core.first(arglist__6235);
      var i = cljs.core.first(cljs.core.next(arglist__6235));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6235));
      return G__6234__delegate(array, i, idxs)
    };
    G__6234.cljs$lang$arity$variadic = G__6234__delegate;
    return G__6234
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
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
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6320 = this$;
      if(and__3822__auto____6320) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6320
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2363__auto____6321 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6322 = cljs.core._invoke[goog.typeOf(x__2363__auto____6321)];
        if(or__3824__auto____6322) {
          return or__3824__auto____6322
        }else {
          var or__3824__auto____6323 = cljs.core._invoke["_"];
          if(or__3824__auto____6323) {
            return or__3824__auto____6323
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6324 = this$;
      if(and__3822__auto____6324) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6324
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2363__auto____6325 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6326 = cljs.core._invoke[goog.typeOf(x__2363__auto____6325)];
        if(or__3824__auto____6326) {
          return or__3824__auto____6326
        }else {
          var or__3824__auto____6327 = cljs.core._invoke["_"];
          if(or__3824__auto____6327) {
            return or__3824__auto____6327
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6328 = this$;
      if(and__3822__auto____6328) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6328
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2363__auto____6329 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6330 = cljs.core._invoke[goog.typeOf(x__2363__auto____6329)];
        if(or__3824__auto____6330) {
          return or__3824__auto____6330
        }else {
          var or__3824__auto____6331 = cljs.core._invoke["_"];
          if(or__3824__auto____6331) {
            return or__3824__auto____6331
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6332 = this$;
      if(and__3822__auto____6332) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6332
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2363__auto____6333 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6334 = cljs.core._invoke[goog.typeOf(x__2363__auto____6333)];
        if(or__3824__auto____6334) {
          return or__3824__auto____6334
        }else {
          var or__3824__auto____6335 = cljs.core._invoke["_"];
          if(or__3824__auto____6335) {
            return or__3824__auto____6335
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6336 = this$;
      if(and__3822__auto____6336) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6336
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2363__auto____6337 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6338 = cljs.core._invoke[goog.typeOf(x__2363__auto____6337)];
        if(or__3824__auto____6338) {
          return or__3824__auto____6338
        }else {
          var or__3824__auto____6339 = cljs.core._invoke["_"];
          if(or__3824__auto____6339) {
            return or__3824__auto____6339
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6340 = this$;
      if(and__3822__auto____6340) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6340
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2363__auto____6341 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6342 = cljs.core._invoke[goog.typeOf(x__2363__auto____6341)];
        if(or__3824__auto____6342) {
          return or__3824__auto____6342
        }else {
          var or__3824__auto____6343 = cljs.core._invoke["_"];
          if(or__3824__auto____6343) {
            return or__3824__auto____6343
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6344 = this$;
      if(and__3822__auto____6344) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6344
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2363__auto____6345 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6346 = cljs.core._invoke[goog.typeOf(x__2363__auto____6345)];
        if(or__3824__auto____6346) {
          return or__3824__auto____6346
        }else {
          var or__3824__auto____6347 = cljs.core._invoke["_"];
          if(or__3824__auto____6347) {
            return or__3824__auto____6347
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6348 = this$;
      if(and__3822__auto____6348) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6348
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2363__auto____6349 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6350 = cljs.core._invoke[goog.typeOf(x__2363__auto____6349)];
        if(or__3824__auto____6350) {
          return or__3824__auto____6350
        }else {
          var or__3824__auto____6351 = cljs.core._invoke["_"];
          if(or__3824__auto____6351) {
            return or__3824__auto____6351
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6352 = this$;
      if(and__3822__auto____6352) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6352
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2363__auto____6353 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6354 = cljs.core._invoke[goog.typeOf(x__2363__auto____6353)];
        if(or__3824__auto____6354) {
          return or__3824__auto____6354
        }else {
          var or__3824__auto____6355 = cljs.core._invoke["_"];
          if(or__3824__auto____6355) {
            return or__3824__auto____6355
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6356 = this$;
      if(and__3822__auto____6356) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6356
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2363__auto____6357 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6358 = cljs.core._invoke[goog.typeOf(x__2363__auto____6357)];
        if(or__3824__auto____6358) {
          return or__3824__auto____6358
        }else {
          var or__3824__auto____6359 = cljs.core._invoke["_"];
          if(or__3824__auto____6359) {
            return or__3824__auto____6359
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6360 = this$;
      if(and__3822__auto____6360) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6360
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2363__auto____6361 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6362 = cljs.core._invoke[goog.typeOf(x__2363__auto____6361)];
        if(or__3824__auto____6362) {
          return or__3824__auto____6362
        }else {
          var or__3824__auto____6363 = cljs.core._invoke["_"];
          if(or__3824__auto____6363) {
            return or__3824__auto____6363
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6364 = this$;
      if(and__3822__auto____6364) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6364
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2363__auto____6365 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6366 = cljs.core._invoke[goog.typeOf(x__2363__auto____6365)];
        if(or__3824__auto____6366) {
          return or__3824__auto____6366
        }else {
          var or__3824__auto____6367 = cljs.core._invoke["_"];
          if(or__3824__auto____6367) {
            return or__3824__auto____6367
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6368 = this$;
      if(and__3822__auto____6368) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6368
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2363__auto____6369 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6370 = cljs.core._invoke[goog.typeOf(x__2363__auto____6369)];
        if(or__3824__auto____6370) {
          return or__3824__auto____6370
        }else {
          var or__3824__auto____6371 = cljs.core._invoke["_"];
          if(or__3824__auto____6371) {
            return or__3824__auto____6371
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6372 = this$;
      if(and__3822__auto____6372) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6372
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2363__auto____6373 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6374 = cljs.core._invoke[goog.typeOf(x__2363__auto____6373)];
        if(or__3824__auto____6374) {
          return or__3824__auto____6374
        }else {
          var or__3824__auto____6375 = cljs.core._invoke["_"];
          if(or__3824__auto____6375) {
            return or__3824__auto____6375
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6376 = this$;
      if(and__3822__auto____6376) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6376
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2363__auto____6377 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6378 = cljs.core._invoke[goog.typeOf(x__2363__auto____6377)];
        if(or__3824__auto____6378) {
          return or__3824__auto____6378
        }else {
          var or__3824__auto____6379 = cljs.core._invoke["_"];
          if(or__3824__auto____6379) {
            return or__3824__auto____6379
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6380 = this$;
      if(and__3822__auto____6380) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6380
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2363__auto____6381 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6382 = cljs.core._invoke[goog.typeOf(x__2363__auto____6381)];
        if(or__3824__auto____6382) {
          return or__3824__auto____6382
        }else {
          var or__3824__auto____6383 = cljs.core._invoke["_"];
          if(or__3824__auto____6383) {
            return or__3824__auto____6383
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6384 = this$;
      if(and__3822__auto____6384) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6384
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2363__auto____6385 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6386 = cljs.core._invoke[goog.typeOf(x__2363__auto____6385)];
        if(or__3824__auto____6386) {
          return or__3824__auto____6386
        }else {
          var or__3824__auto____6387 = cljs.core._invoke["_"];
          if(or__3824__auto____6387) {
            return or__3824__auto____6387
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6388 = this$;
      if(and__3822__auto____6388) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6388
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2363__auto____6389 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6390 = cljs.core._invoke[goog.typeOf(x__2363__auto____6389)];
        if(or__3824__auto____6390) {
          return or__3824__auto____6390
        }else {
          var or__3824__auto____6391 = cljs.core._invoke["_"];
          if(or__3824__auto____6391) {
            return or__3824__auto____6391
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6392 = this$;
      if(and__3822__auto____6392) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6392
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2363__auto____6393 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6394 = cljs.core._invoke[goog.typeOf(x__2363__auto____6393)];
        if(or__3824__auto____6394) {
          return or__3824__auto____6394
        }else {
          var or__3824__auto____6395 = cljs.core._invoke["_"];
          if(or__3824__auto____6395) {
            return or__3824__auto____6395
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6396 = this$;
      if(and__3822__auto____6396) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6396
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2363__auto____6397 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6398 = cljs.core._invoke[goog.typeOf(x__2363__auto____6397)];
        if(or__3824__auto____6398) {
          return or__3824__auto____6398
        }else {
          var or__3824__auto____6399 = cljs.core._invoke["_"];
          if(or__3824__auto____6399) {
            return or__3824__auto____6399
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6400 = this$;
      if(and__3822__auto____6400) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6400
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2363__auto____6401 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6402 = cljs.core._invoke[goog.typeOf(x__2363__auto____6401)];
        if(or__3824__auto____6402) {
          return or__3824__auto____6402
        }else {
          var or__3824__auto____6403 = cljs.core._invoke["_"];
          if(or__3824__auto____6403) {
            return or__3824__auto____6403
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
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6408 = coll;
    if(and__3822__auto____6408) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6408
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2363__auto____6409 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6410 = cljs.core._count[goog.typeOf(x__2363__auto____6409)];
      if(or__3824__auto____6410) {
        return or__3824__auto____6410
      }else {
        var or__3824__auto____6411 = cljs.core._count["_"];
        if(or__3824__auto____6411) {
          return or__3824__auto____6411
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
    var and__3822__auto____6416 = coll;
    if(and__3822__auto____6416) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6416
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2363__auto____6417 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6418 = cljs.core._empty[goog.typeOf(x__2363__auto____6417)];
      if(or__3824__auto____6418) {
        return or__3824__auto____6418
      }else {
        var or__3824__auto____6419 = cljs.core._empty["_"];
        if(or__3824__auto____6419) {
          return or__3824__auto____6419
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
    var and__3822__auto____6424 = coll;
    if(and__3822__auto____6424) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6424
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2363__auto____6425 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6426 = cljs.core._conj[goog.typeOf(x__2363__auto____6425)];
      if(or__3824__auto____6426) {
        return or__3824__auto____6426
      }else {
        var or__3824__auto____6427 = cljs.core._conj["_"];
        if(or__3824__auto____6427) {
          return or__3824__auto____6427
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
      var and__3822__auto____6436 = coll;
      if(and__3822__auto____6436) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6436
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2363__auto____6437 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6438 = cljs.core._nth[goog.typeOf(x__2363__auto____6437)];
        if(or__3824__auto____6438) {
          return or__3824__auto____6438
        }else {
          var or__3824__auto____6439 = cljs.core._nth["_"];
          if(or__3824__auto____6439) {
            return or__3824__auto____6439
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6440 = coll;
      if(and__3822__auto____6440) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6440
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2363__auto____6441 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6442 = cljs.core._nth[goog.typeOf(x__2363__auto____6441)];
        if(or__3824__auto____6442) {
          return or__3824__auto____6442
        }else {
          var or__3824__auto____6443 = cljs.core._nth["_"];
          if(or__3824__auto____6443) {
            return or__3824__auto____6443
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
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6448 = coll;
    if(and__3822__auto____6448) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6448
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2363__auto____6449 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6450 = cljs.core._first[goog.typeOf(x__2363__auto____6449)];
      if(or__3824__auto____6450) {
        return or__3824__auto____6450
      }else {
        var or__3824__auto____6451 = cljs.core._first["_"];
        if(or__3824__auto____6451) {
          return or__3824__auto____6451
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6456 = coll;
    if(and__3822__auto____6456) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6456
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2363__auto____6457 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6458 = cljs.core._rest[goog.typeOf(x__2363__auto____6457)];
      if(or__3824__auto____6458) {
        return or__3824__auto____6458
      }else {
        var or__3824__auto____6459 = cljs.core._rest["_"];
        if(or__3824__auto____6459) {
          return or__3824__auto____6459
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
    var and__3822__auto____6464 = coll;
    if(and__3822__auto____6464) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6464
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2363__auto____6465 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6466 = cljs.core._next[goog.typeOf(x__2363__auto____6465)];
      if(or__3824__auto____6466) {
        return or__3824__auto____6466
      }else {
        var or__3824__auto____6467 = cljs.core._next["_"];
        if(or__3824__auto____6467) {
          return or__3824__auto____6467
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
      var and__3822__auto____6476 = o;
      if(and__3822__auto____6476) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6476
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2363__auto____6477 = o == null ? null : o;
      return function() {
        var or__3824__auto____6478 = cljs.core._lookup[goog.typeOf(x__2363__auto____6477)];
        if(or__3824__auto____6478) {
          return or__3824__auto____6478
        }else {
          var or__3824__auto____6479 = cljs.core._lookup["_"];
          if(or__3824__auto____6479) {
            return or__3824__auto____6479
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6480 = o;
      if(and__3822__auto____6480) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6480
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2363__auto____6481 = o == null ? null : o;
      return function() {
        var or__3824__auto____6482 = cljs.core._lookup[goog.typeOf(x__2363__auto____6481)];
        if(or__3824__auto____6482) {
          return or__3824__auto____6482
        }else {
          var or__3824__auto____6483 = cljs.core._lookup["_"];
          if(or__3824__auto____6483) {
            return or__3824__auto____6483
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
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____6488 = coll;
    if(and__3822__auto____6488) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6488
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2363__auto____6489 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6490 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2363__auto____6489)];
      if(or__3824__auto____6490) {
        return or__3824__auto____6490
      }else {
        var or__3824__auto____6491 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6491) {
          return or__3824__auto____6491
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6496 = coll;
    if(and__3822__auto____6496) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6496
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2363__auto____6497 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6498 = cljs.core._assoc[goog.typeOf(x__2363__auto____6497)];
      if(or__3824__auto____6498) {
        return or__3824__auto____6498
      }else {
        var or__3824__auto____6499 = cljs.core._assoc["_"];
        if(or__3824__auto____6499) {
          return or__3824__auto____6499
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
    var and__3822__auto____6504 = coll;
    if(and__3822__auto____6504) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6504
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2363__auto____6505 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6506 = cljs.core._dissoc[goog.typeOf(x__2363__auto____6505)];
      if(or__3824__auto____6506) {
        return or__3824__auto____6506
      }else {
        var or__3824__auto____6507 = cljs.core._dissoc["_"];
        if(or__3824__auto____6507) {
          return or__3824__auto____6507
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
    var and__3822__auto____6512 = coll;
    if(and__3822__auto____6512) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6512
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2363__auto____6513 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6514 = cljs.core._key[goog.typeOf(x__2363__auto____6513)];
      if(or__3824__auto____6514) {
        return or__3824__auto____6514
      }else {
        var or__3824__auto____6515 = cljs.core._key["_"];
        if(or__3824__auto____6515) {
          return or__3824__auto____6515
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6520 = coll;
    if(and__3822__auto____6520) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6520
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2363__auto____6521 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6522 = cljs.core._val[goog.typeOf(x__2363__auto____6521)];
      if(or__3824__auto____6522) {
        return or__3824__auto____6522
      }else {
        var or__3824__auto____6523 = cljs.core._val["_"];
        if(or__3824__auto____6523) {
          return or__3824__auto____6523
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
    var and__3822__auto____6528 = coll;
    if(and__3822__auto____6528) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6528
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2363__auto____6529 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6530 = cljs.core._disjoin[goog.typeOf(x__2363__auto____6529)];
      if(or__3824__auto____6530) {
        return or__3824__auto____6530
      }else {
        var or__3824__auto____6531 = cljs.core._disjoin["_"];
        if(or__3824__auto____6531) {
          return or__3824__auto____6531
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
    var and__3822__auto____6536 = coll;
    if(and__3822__auto____6536) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6536
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2363__auto____6537 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6538 = cljs.core._peek[goog.typeOf(x__2363__auto____6537)];
      if(or__3824__auto____6538) {
        return or__3824__auto____6538
      }else {
        var or__3824__auto____6539 = cljs.core._peek["_"];
        if(or__3824__auto____6539) {
          return or__3824__auto____6539
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6544 = coll;
    if(and__3822__auto____6544) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6544
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2363__auto____6545 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6546 = cljs.core._pop[goog.typeOf(x__2363__auto____6545)];
      if(or__3824__auto____6546) {
        return or__3824__auto____6546
      }else {
        var or__3824__auto____6547 = cljs.core._pop["_"];
        if(or__3824__auto____6547) {
          return or__3824__auto____6547
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
    var and__3822__auto____6552 = coll;
    if(and__3822__auto____6552) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6552
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2363__auto____6553 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6554 = cljs.core._assoc_n[goog.typeOf(x__2363__auto____6553)];
      if(or__3824__auto____6554) {
        return or__3824__auto____6554
      }else {
        var or__3824__auto____6555 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6555) {
          return or__3824__auto____6555
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
    var and__3822__auto____6560 = o;
    if(and__3822__auto____6560) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6560
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2363__auto____6561 = o == null ? null : o;
    return function() {
      var or__3824__auto____6562 = cljs.core._deref[goog.typeOf(x__2363__auto____6561)];
      if(or__3824__auto____6562) {
        return or__3824__auto____6562
      }else {
        var or__3824__auto____6563 = cljs.core._deref["_"];
        if(or__3824__auto____6563) {
          return or__3824__auto____6563
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
    var and__3822__auto____6568 = o;
    if(and__3822__auto____6568) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6568
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2363__auto____6569 = o == null ? null : o;
    return function() {
      var or__3824__auto____6570 = cljs.core._deref_with_timeout[goog.typeOf(x__2363__auto____6569)];
      if(or__3824__auto____6570) {
        return or__3824__auto____6570
      }else {
        var or__3824__auto____6571 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6571) {
          return or__3824__auto____6571
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
    var and__3822__auto____6576 = o;
    if(and__3822__auto____6576) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6576
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2363__auto____6577 = o == null ? null : o;
    return function() {
      var or__3824__auto____6578 = cljs.core._meta[goog.typeOf(x__2363__auto____6577)];
      if(or__3824__auto____6578) {
        return or__3824__auto____6578
      }else {
        var or__3824__auto____6579 = cljs.core._meta["_"];
        if(or__3824__auto____6579) {
          return or__3824__auto____6579
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
    var and__3822__auto____6584 = o;
    if(and__3822__auto____6584) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6584
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2363__auto____6585 = o == null ? null : o;
    return function() {
      var or__3824__auto____6586 = cljs.core._with_meta[goog.typeOf(x__2363__auto____6585)];
      if(or__3824__auto____6586) {
        return or__3824__auto____6586
      }else {
        var or__3824__auto____6587 = cljs.core._with_meta["_"];
        if(or__3824__auto____6587) {
          return or__3824__auto____6587
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
      var and__3822__auto____6596 = coll;
      if(and__3822__auto____6596) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6596
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2363__auto____6597 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6598 = cljs.core._reduce[goog.typeOf(x__2363__auto____6597)];
        if(or__3824__auto____6598) {
          return or__3824__auto____6598
        }else {
          var or__3824__auto____6599 = cljs.core._reduce["_"];
          if(or__3824__auto____6599) {
            return or__3824__auto____6599
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6600 = coll;
      if(and__3822__auto____6600) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6600
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2363__auto____6601 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6602 = cljs.core._reduce[goog.typeOf(x__2363__auto____6601)];
        if(or__3824__auto____6602) {
          return or__3824__auto____6602
        }else {
          var or__3824__auto____6603 = cljs.core._reduce["_"];
          if(or__3824__auto____6603) {
            return or__3824__auto____6603
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
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____6608 = coll;
    if(and__3822__auto____6608) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6608
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2363__auto____6609 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6610 = cljs.core._kv_reduce[goog.typeOf(x__2363__auto____6609)];
      if(or__3824__auto____6610) {
        return or__3824__auto____6610
      }else {
        var or__3824__auto____6611 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6611) {
          return or__3824__auto____6611
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
    var and__3822__auto____6616 = o;
    if(and__3822__auto____6616) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6616
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2363__auto____6617 = o == null ? null : o;
    return function() {
      var or__3824__auto____6618 = cljs.core._equiv[goog.typeOf(x__2363__auto____6617)];
      if(or__3824__auto____6618) {
        return or__3824__auto____6618
      }else {
        var or__3824__auto____6619 = cljs.core._equiv["_"];
        if(or__3824__auto____6619) {
          return or__3824__auto____6619
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
    var and__3822__auto____6624 = o;
    if(and__3822__auto____6624) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6624
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2363__auto____6625 = o == null ? null : o;
    return function() {
      var or__3824__auto____6626 = cljs.core._hash[goog.typeOf(x__2363__auto____6625)];
      if(or__3824__auto____6626) {
        return or__3824__auto____6626
      }else {
        var or__3824__auto____6627 = cljs.core._hash["_"];
        if(or__3824__auto____6627) {
          return or__3824__auto____6627
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
    var and__3822__auto____6632 = o;
    if(and__3822__auto____6632) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6632
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2363__auto____6633 = o == null ? null : o;
    return function() {
      var or__3824__auto____6634 = cljs.core._seq[goog.typeOf(x__2363__auto____6633)];
      if(or__3824__auto____6634) {
        return or__3824__auto____6634
      }else {
        var or__3824__auto____6635 = cljs.core._seq["_"];
        if(or__3824__auto____6635) {
          return or__3824__auto____6635
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
    var and__3822__auto____6640 = coll;
    if(and__3822__auto____6640) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6640
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2363__auto____6641 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6642 = cljs.core._rseq[goog.typeOf(x__2363__auto____6641)];
      if(or__3824__auto____6642) {
        return or__3824__auto____6642
      }else {
        var or__3824__auto____6643 = cljs.core._rseq["_"];
        if(or__3824__auto____6643) {
          return or__3824__auto____6643
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
    var and__3822__auto____6648 = coll;
    if(and__3822__auto____6648) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6648
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2363__auto____6649 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6650 = cljs.core._sorted_seq[goog.typeOf(x__2363__auto____6649)];
      if(or__3824__auto____6650) {
        return or__3824__auto____6650
      }else {
        var or__3824__auto____6651 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6651) {
          return or__3824__auto____6651
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6656 = coll;
    if(and__3822__auto____6656) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6656
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2363__auto____6657 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6658 = cljs.core._sorted_seq_from[goog.typeOf(x__2363__auto____6657)];
      if(or__3824__auto____6658) {
        return or__3824__auto____6658
      }else {
        var or__3824__auto____6659 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6659) {
          return or__3824__auto____6659
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6664 = coll;
    if(and__3822__auto____6664) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6664
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2363__auto____6665 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6666 = cljs.core._entry_key[goog.typeOf(x__2363__auto____6665)];
      if(or__3824__auto____6666) {
        return or__3824__auto____6666
      }else {
        var or__3824__auto____6667 = cljs.core._entry_key["_"];
        if(or__3824__auto____6667) {
          return or__3824__auto____6667
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6672 = coll;
    if(and__3822__auto____6672) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6672
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2363__auto____6673 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6674 = cljs.core._comparator[goog.typeOf(x__2363__auto____6673)];
      if(or__3824__auto____6674) {
        return or__3824__auto____6674
      }else {
        var or__3824__auto____6675 = cljs.core._comparator["_"];
        if(or__3824__auto____6675) {
          return or__3824__auto____6675
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____6680 = o;
    if(and__3822__auto____6680) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6680
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2363__auto____6681 = o == null ? null : o;
    return function() {
      var or__3824__auto____6682 = cljs.core._pr_seq[goog.typeOf(x__2363__auto____6681)];
      if(or__3824__auto____6682) {
        return or__3824__auto____6682
      }else {
        var or__3824__auto____6683 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6683) {
          return or__3824__auto____6683
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____6688 = d;
    if(and__3822__auto____6688) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6688
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2363__auto____6689 = d == null ? null : d;
    return function() {
      var or__3824__auto____6690 = cljs.core._realized_QMARK_[goog.typeOf(x__2363__auto____6689)];
      if(or__3824__auto____6690) {
        return or__3824__auto____6690
      }else {
        var or__3824__auto____6691 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6691) {
          return or__3824__auto____6691
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
    var and__3822__auto____6696 = this$;
    if(and__3822__auto____6696) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6696
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2363__auto____6697 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6698 = cljs.core._notify_watches[goog.typeOf(x__2363__auto____6697)];
      if(or__3824__auto____6698) {
        return or__3824__auto____6698
      }else {
        var or__3824__auto____6699 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6699) {
          return or__3824__auto____6699
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6704 = this$;
    if(and__3822__auto____6704) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6704
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2363__auto____6705 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6706 = cljs.core._add_watch[goog.typeOf(x__2363__auto____6705)];
      if(or__3824__auto____6706) {
        return or__3824__auto____6706
      }else {
        var or__3824__auto____6707 = cljs.core._add_watch["_"];
        if(or__3824__auto____6707) {
          return or__3824__auto____6707
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6712 = this$;
    if(and__3822__auto____6712) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6712
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2363__auto____6713 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6714 = cljs.core._remove_watch[goog.typeOf(x__2363__auto____6713)];
      if(or__3824__auto____6714) {
        return or__3824__auto____6714
      }else {
        var or__3824__auto____6715 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6715) {
          return or__3824__auto____6715
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
    var and__3822__auto____6720 = coll;
    if(and__3822__auto____6720) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6720
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2363__auto____6721 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6722 = cljs.core._as_transient[goog.typeOf(x__2363__auto____6721)];
      if(or__3824__auto____6722) {
        return or__3824__auto____6722
      }else {
        var or__3824__auto____6723 = cljs.core._as_transient["_"];
        if(or__3824__auto____6723) {
          return or__3824__auto____6723
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
    var and__3822__auto____6728 = tcoll;
    if(and__3822__auto____6728) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6728
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2363__auto____6729 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6730 = cljs.core._conj_BANG_[goog.typeOf(x__2363__auto____6729)];
      if(or__3824__auto____6730) {
        return or__3824__auto____6730
      }else {
        var or__3824__auto____6731 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6731) {
          return or__3824__auto____6731
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6736 = tcoll;
    if(and__3822__auto____6736) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6736
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____6737 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6738 = cljs.core._persistent_BANG_[goog.typeOf(x__2363__auto____6737)];
      if(or__3824__auto____6738) {
        return or__3824__auto____6738
      }else {
        var or__3824__auto____6739 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6739) {
          return or__3824__auto____6739
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
    var and__3822__auto____6744 = tcoll;
    if(and__3822__auto____6744) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6744
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2363__auto____6745 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6746 = cljs.core._assoc_BANG_[goog.typeOf(x__2363__auto____6745)];
      if(or__3824__auto____6746) {
        return or__3824__auto____6746
      }else {
        var or__3824__auto____6747 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6747) {
          return or__3824__auto____6747
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
    var and__3822__auto____6752 = tcoll;
    if(and__3822__auto____6752) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6752
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2363__auto____6753 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6754 = cljs.core._dissoc_BANG_[goog.typeOf(x__2363__auto____6753)];
      if(or__3824__auto____6754) {
        return or__3824__auto____6754
      }else {
        var or__3824__auto____6755 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6755) {
          return or__3824__auto____6755
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
    var and__3822__auto____6760 = tcoll;
    if(and__3822__auto____6760) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6760
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2363__auto____6761 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6762 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2363__auto____6761)];
      if(or__3824__auto____6762) {
        return or__3824__auto____6762
      }else {
        var or__3824__auto____6763 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6763) {
          return or__3824__auto____6763
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6768 = tcoll;
    if(and__3822__auto____6768) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6768
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2363__auto____6769 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6770 = cljs.core._pop_BANG_[goog.typeOf(x__2363__auto____6769)];
      if(or__3824__auto____6770) {
        return or__3824__auto____6770
      }else {
        var or__3824__auto____6771 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6771) {
          return or__3824__auto____6771
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
    var and__3822__auto____6776 = tcoll;
    if(and__3822__auto____6776) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6776
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2363__auto____6777 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6778 = cljs.core._disjoin_BANG_[goog.typeOf(x__2363__auto____6777)];
      if(or__3824__auto____6778) {
        return or__3824__auto____6778
      }else {
        var or__3824__auto____6779 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6779) {
          return or__3824__auto____6779
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
    var and__3822__auto____6784 = x;
    if(and__3822__auto____6784) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6784
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2363__auto____6785 = x == null ? null : x;
    return function() {
      var or__3824__auto____6786 = cljs.core._compare[goog.typeOf(x__2363__auto____6785)];
      if(or__3824__auto____6786) {
        return or__3824__auto____6786
      }else {
        var or__3824__auto____6787 = cljs.core._compare["_"];
        if(or__3824__auto____6787) {
          return or__3824__auto____6787
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
    var and__3822__auto____6792 = coll;
    if(and__3822__auto____6792) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6792
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2363__auto____6793 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6794 = cljs.core._drop_first[goog.typeOf(x__2363__auto____6793)];
      if(or__3824__auto____6794) {
        return or__3824__auto____6794
      }else {
        var or__3824__auto____6795 = cljs.core._drop_first["_"];
        if(or__3824__auto____6795) {
          return or__3824__auto____6795
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
    var and__3822__auto____6800 = coll;
    if(and__3822__auto____6800) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6800
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2363__auto____6801 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6802 = cljs.core._chunked_first[goog.typeOf(x__2363__auto____6801)];
      if(or__3824__auto____6802) {
        return or__3824__auto____6802
      }else {
        var or__3824__auto____6803 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6803) {
          return or__3824__auto____6803
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6808 = coll;
    if(and__3822__auto____6808) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6808
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2363__auto____6809 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6810 = cljs.core._chunked_rest[goog.typeOf(x__2363__auto____6809)];
      if(or__3824__auto____6810) {
        return or__3824__auto____6810
      }else {
        var or__3824__auto____6811 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6811) {
          return or__3824__auto____6811
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
    var and__3822__auto____6816 = coll;
    if(and__3822__auto____6816) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6816
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2363__auto____6817 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6818 = cljs.core._chunked_next[goog.typeOf(x__2363__auto____6817)];
      if(or__3824__auto____6818) {
        return or__3824__auto____6818
      }else {
        var or__3824__auto____6819 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6819) {
          return or__3824__auto____6819
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____6821 = x === y;
    if(or__3824__auto____6821) {
      return or__3824__auto____6821
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6822__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6823 = y;
            var G__6824 = cljs.core.first.call(null, more);
            var G__6825 = cljs.core.next.call(null, more);
            x = G__6823;
            y = G__6824;
            more = G__6825;
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
    var G__6822 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6822__delegate.call(this, x, y, more)
    };
    G__6822.cljs$lang$maxFixedArity = 2;
    G__6822.cljs$lang$applyTo = function(arglist__6826) {
      var x = cljs.core.first(arglist__6826);
      var y = cljs.core.first(cljs.core.next(arglist__6826));
      var more = cljs.core.rest(cljs.core.next(arglist__6826));
      return G__6822__delegate(x, y, more)
    };
    G__6822.cljs$lang$arity$variadic = G__6822__delegate;
    return G__6822
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6827 = null;
  var G__6827__2 = function(o, k) {
    return null
  };
  var G__6827__3 = function(o, k, not_found) {
    return not_found
  };
  G__6827 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6827__2.call(this, o, k);
      case 3:
        return G__6827__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6827
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6828 = null;
  var G__6828__2 = function(_, f) {
    return f.call(null)
  };
  var G__6828__3 = function(_, f, start) {
    return start
  };
  G__6828 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6828__2.call(this, _, f);
      case 3:
        return G__6828__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6828
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
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
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
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
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6829 = null;
  var G__6829__2 = function(_, n) {
    return null
  };
  var G__6829__3 = function(_, n, not_found) {
    return not_found
  };
  G__6829 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6829__2.call(this, _, n);
      case 3:
        return G__6829__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6829
}();
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
  var and__3822__auto____6830 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6830) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6830
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6843 = cljs.core._count.call(null, cicoll);
    if(cnt__6843 === 0) {
      return f.call(null)
    }else {
      var val__6844 = cljs.core._nth.call(null, cicoll, 0);
      var n__6845 = 1;
      while(true) {
        if(n__6845 < cnt__6843) {
          var nval__6846 = f.call(null, val__6844, cljs.core._nth.call(null, cicoll, n__6845));
          if(cljs.core.reduced_QMARK_.call(null, nval__6846)) {
            return cljs.core.deref.call(null, nval__6846)
          }else {
            var G__6855 = nval__6846;
            var G__6856 = n__6845 + 1;
            val__6844 = G__6855;
            n__6845 = G__6856;
            continue
          }
        }else {
          return val__6844
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6847 = cljs.core._count.call(null, cicoll);
    var val__6848 = val;
    var n__6849 = 0;
    while(true) {
      if(n__6849 < cnt__6847) {
        var nval__6850 = f.call(null, val__6848, cljs.core._nth.call(null, cicoll, n__6849));
        if(cljs.core.reduced_QMARK_.call(null, nval__6850)) {
          return cljs.core.deref.call(null, nval__6850)
        }else {
          var G__6857 = nval__6850;
          var G__6858 = n__6849 + 1;
          val__6848 = G__6857;
          n__6849 = G__6858;
          continue
        }
      }else {
        return val__6848
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6851 = cljs.core._count.call(null, cicoll);
    var val__6852 = val;
    var n__6853 = idx;
    while(true) {
      if(n__6853 < cnt__6851) {
        var nval__6854 = f.call(null, val__6852, cljs.core._nth.call(null, cicoll, n__6853));
        if(cljs.core.reduced_QMARK_.call(null, nval__6854)) {
          return cljs.core.deref.call(null, nval__6854)
        }else {
          var G__6859 = nval__6854;
          var G__6860 = n__6853 + 1;
          val__6852 = G__6859;
          n__6853 = G__6860;
          continue
        }
      }else {
        return val__6852
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
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6873 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6874 = arr[0];
      var n__6875 = 1;
      while(true) {
        if(n__6875 < cnt__6873) {
          var nval__6876 = f.call(null, val__6874, arr[n__6875]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6876)) {
            return cljs.core.deref.call(null, nval__6876)
          }else {
            var G__6885 = nval__6876;
            var G__6886 = n__6875 + 1;
            val__6874 = G__6885;
            n__6875 = G__6886;
            continue
          }
        }else {
          return val__6874
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6877 = arr.length;
    var val__6878 = val;
    var n__6879 = 0;
    while(true) {
      if(n__6879 < cnt__6877) {
        var nval__6880 = f.call(null, val__6878, arr[n__6879]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6880)) {
          return cljs.core.deref.call(null, nval__6880)
        }else {
          var G__6887 = nval__6880;
          var G__6888 = n__6879 + 1;
          val__6878 = G__6887;
          n__6879 = G__6888;
          continue
        }
      }else {
        return val__6878
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6881 = arr.length;
    var val__6882 = val;
    var n__6883 = idx;
    while(true) {
      if(n__6883 < cnt__6881) {
        var nval__6884 = f.call(null, val__6882, arr[n__6883]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6884)) {
          return cljs.core.deref.call(null, nval__6884)
        }else {
          var G__6889 = nval__6884;
          var G__6890 = n__6883 + 1;
          val__6882 = G__6889;
          n__6883 = G__6890;
          continue
        }
      }else {
        return val__6882
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
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6891 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6892 = this;
  if(this__6892.i + 1 < this__6892.a.length) {
    return new cljs.core.IndexedSeq(this__6892.a, this__6892.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6893 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6894 = this;
  var c__6895 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6895 > 0) {
    return new cljs.core.RSeq(coll, c__6895 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6896 = this;
  var this__6897 = this;
  return cljs.core.pr_str.call(null, this__6897)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6898 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6898.a)) {
    return cljs.core.ci_reduce.call(null, this__6898.a, f, this__6898.a[this__6898.i], this__6898.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6898.a[this__6898.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6899 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6899.a)) {
    return cljs.core.ci_reduce.call(null, this__6899.a, f, start, this__6899.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6900 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6901 = this;
  return this__6901.a.length - this__6901.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6902 = this;
  return this__6902.a[this__6902.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6903 = this;
  if(this__6903.i + 1 < this__6903.a.length) {
    return new cljs.core.IndexedSeq(this__6903.a, this__6903.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6904 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6905 = this;
  var i__6906 = n + this__6905.i;
  if(i__6906 < this__6905.a.length) {
    return this__6905.a[i__6906]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6907 = this;
  var i__6908 = n + this__6907.i;
  if(i__6908 < this__6907.a.length) {
    return this__6907.a[i__6908]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
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
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6909 = null;
  var G__6909__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6909__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6909 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6909__2.call(this, array, f);
      case 3:
        return G__6909__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6909
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6910 = null;
  var G__6910__2 = function(array, k) {
    return array[k]
  };
  var G__6910__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6910 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6910__2.call(this, array, k);
      case 3:
        return G__6910__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6910
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6911 = null;
  var G__6911__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6911__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6911 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6911__2.call(this, array, n);
      case 3:
        return G__6911__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6911
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6912 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6913 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6914 = this;
  var this__6915 = this;
  return cljs.core.pr_str.call(null, this__6915)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6916 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6917 = this;
  return this__6917.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6918 = this;
  return cljs.core._nth.call(null, this__6918.ci, this__6918.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6919 = this;
  if(this__6919.i > 0) {
    return new cljs.core.RSeq(this__6919.ci, this__6919.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6920 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6921 = this;
  return new cljs.core.RSeq(this__6921.ci, this__6921.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6922 = this;
  return this__6922.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6926__6927 = coll;
      if(G__6926__6927) {
        if(function() {
          var or__3824__auto____6928 = G__6926__6927.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6928) {
            return or__3824__auto____6928
          }else {
            return G__6926__6927.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6926__6927.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6926__6927)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6926__6927)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6933__6934 = coll;
      if(G__6933__6934) {
        if(function() {
          var or__3824__auto____6935 = G__6933__6934.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6935) {
            return or__3824__auto____6935
          }else {
            return G__6933__6934.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6933__6934.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6933__6934)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6933__6934)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6936 = cljs.core.seq.call(null, coll);
      if(s__6936 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6936)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6941__6942 = coll;
      if(G__6941__6942) {
        if(function() {
          var or__3824__auto____6943 = G__6941__6942.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6943) {
            return or__3824__auto____6943
          }else {
            return G__6941__6942.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6941__6942.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6941__6942)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6941__6942)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6944 = cljs.core.seq.call(null, coll);
      if(!(s__6944 == null)) {
        return cljs.core._rest.call(null, s__6944)
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
      var G__6948__6949 = coll;
      if(G__6948__6949) {
        if(function() {
          var or__3824__auto____6950 = G__6948__6949.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6950) {
            return or__3824__auto____6950
          }else {
            return G__6948__6949.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6948__6949.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6948__6949)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6948__6949)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
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
    var sn__6952 = cljs.core.next.call(null, s);
    if(!(sn__6952 == null)) {
      var G__6953 = sn__6952;
      s = G__6953;
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
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6954__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6955 = conj.call(null, coll, x);
          var G__6956 = cljs.core.first.call(null, xs);
          var G__6957 = cljs.core.next.call(null, xs);
          coll = G__6955;
          x = G__6956;
          xs = G__6957;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6954 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6954__delegate.call(this, coll, x, xs)
    };
    G__6954.cljs$lang$maxFixedArity = 2;
    G__6954.cljs$lang$applyTo = function(arglist__6958) {
      var coll = cljs.core.first(arglist__6958);
      var x = cljs.core.first(cljs.core.next(arglist__6958));
      var xs = cljs.core.rest(cljs.core.next(arglist__6958));
      return G__6954__delegate(coll, x, xs)
    };
    G__6954.cljs$lang$arity$variadic = G__6954__delegate;
    return G__6954
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6961 = cljs.core.seq.call(null, coll);
  var acc__6962 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6961)) {
      return acc__6962 + cljs.core._count.call(null, s__6961)
    }else {
      var G__6963 = cljs.core.next.call(null, s__6961);
      var G__6964 = acc__6962 + 1;
      s__6961 = G__6963;
      acc__6962 = G__6964;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
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
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
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
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6971__6972 = coll;
        if(G__6971__6972) {
          if(function() {
            var or__3824__auto____6973 = G__6971__6972.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6973) {
              return or__3824__auto____6973
            }else {
              return G__6971__6972.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6971__6972.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6971__6972)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6971__6972)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6974__6975 = coll;
        if(G__6974__6975) {
          if(function() {
            var or__3824__auto____6976 = G__6974__6975.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6976) {
              return or__3824__auto____6976
            }else {
              return G__6974__6975.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6974__6975.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6974__6975)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6974__6975)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
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
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6979__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6978 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6980 = ret__6978;
          var G__6981 = cljs.core.first.call(null, kvs);
          var G__6982 = cljs.core.second.call(null, kvs);
          var G__6983 = cljs.core.nnext.call(null, kvs);
          coll = G__6980;
          k = G__6981;
          v = G__6982;
          kvs = G__6983;
          continue
        }else {
          return ret__6978
        }
        break
      }
    };
    var G__6979 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6979__delegate.call(this, coll, k, v, kvs)
    };
    G__6979.cljs$lang$maxFixedArity = 3;
    G__6979.cljs$lang$applyTo = function(arglist__6984) {
      var coll = cljs.core.first(arglist__6984);
      var k = cljs.core.first(cljs.core.next(arglist__6984));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6984)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6984)));
      return G__6979__delegate(coll, k, v, kvs)
    };
    G__6979.cljs$lang$arity$variadic = G__6979__delegate;
    return G__6979
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
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
    var G__6987__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6986 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6988 = ret__6986;
          var G__6989 = cljs.core.first.call(null, ks);
          var G__6990 = cljs.core.next.call(null, ks);
          coll = G__6988;
          k = G__6989;
          ks = G__6990;
          continue
        }else {
          return ret__6986
        }
        break
      }
    };
    var G__6987 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6987__delegate.call(this, coll, k, ks)
    };
    G__6987.cljs$lang$maxFixedArity = 2;
    G__6987.cljs$lang$applyTo = function(arglist__6991) {
      var coll = cljs.core.first(arglist__6991);
      var k = cljs.core.first(cljs.core.next(arglist__6991));
      var ks = cljs.core.rest(cljs.core.next(arglist__6991));
      return G__6987__delegate(coll, k, ks)
    };
    G__6987.cljs$lang$arity$variadic = G__6987__delegate;
    return G__6987
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6995__6996 = o;
    if(G__6995__6996) {
      if(function() {
        var or__3824__auto____6997 = G__6995__6996.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6997) {
          return or__3824__auto____6997
        }else {
          return G__6995__6996.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6995__6996.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6995__6996)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6995__6996)
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
    var G__7000__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6999 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7001 = ret__6999;
          var G__7002 = cljs.core.first.call(null, ks);
          var G__7003 = cljs.core.next.call(null, ks);
          coll = G__7001;
          k = G__7002;
          ks = G__7003;
          continue
        }else {
          return ret__6999
        }
        break
      }
    };
    var G__7000 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7000__delegate.call(this, coll, k, ks)
    };
    G__7000.cljs$lang$maxFixedArity = 2;
    G__7000.cljs$lang$applyTo = function(arglist__7004) {
      var coll = cljs.core.first(arglist__7004);
      var k = cljs.core.first(cljs.core.next(arglist__7004));
      var ks = cljs.core.rest(cljs.core.next(arglist__7004));
      return G__7000__delegate(coll, k, ks)
    };
    G__7000.cljs$lang$arity$variadic = G__7000__delegate;
    return G__7000
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__7006 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__7006;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__7006
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__7008 = cljs.core.string_hash_cache[k];
  if(!(h__7008 == null)) {
    return h__7008
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____7010 = goog.isString(o);
      if(and__3822__auto____7010) {
        return check_cache
      }else {
        return and__3822__auto____7010
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7014__7015 = x;
    if(G__7014__7015) {
      if(function() {
        var or__3824__auto____7016 = G__7014__7015.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____7016) {
          return or__3824__auto____7016
        }else {
          return G__7014__7015.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7014__7015.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7014__7015)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7014__7015)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7020__7021 = x;
    if(G__7020__7021) {
      if(function() {
        var or__3824__auto____7022 = G__7020__7021.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____7022) {
          return or__3824__auto____7022
        }else {
          return G__7020__7021.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7020__7021.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7020__7021)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7020__7021)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7026__7027 = x;
  if(G__7026__7027) {
    if(function() {
      var or__3824__auto____7028 = G__7026__7027.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____7028) {
        return or__3824__auto____7028
      }else {
        return G__7026__7027.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7026__7027.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7026__7027)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7026__7027)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7032__7033 = x;
  if(G__7032__7033) {
    if(function() {
      var or__3824__auto____7034 = G__7032__7033.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____7034) {
        return or__3824__auto____7034
      }else {
        return G__7032__7033.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7032__7033.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7032__7033)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7032__7033)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__7038__7039 = x;
  if(G__7038__7039) {
    if(function() {
      var or__3824__auto____7040 = G__7038__7039.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____7040) {
        return or__3824__auto____7040
      }else {
        return G__7038__7039.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__7038__7039.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7038__7039)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7038__7039)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__7044__7045 = x;
  if(G__7044__7045) {
    if(function() {
      var or__3824__auto____7046 = G__7044__7045.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____7046) {
        return or__3824__auto____7046
      }else {
        return G__7044__7045.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__7044__7045.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7044__7045)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7044__7045)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7050__7051 = x;
  if(G__7050__7051) {
    if(function() {
      var or__3824__auto____7052 = G__7050__7051.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____7052) {
        return or__3824__auto____7052
      }else {
        return G__7050__7051.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7050__7051.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7050__7051)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7050__7051)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7056__7057 = x;
    if(G__7056__7057) {
      if(function() {
        var or__3824__auto____7058 = G__7056__7057.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____7058) {
          return or__3824__auto____7058
        }else {
          return G__7056__7057.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7056__7057.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7056__7057)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7056__7057)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7062__7063 = x;
  if(G__7062__7063) {
    if(function() {
      var or__3824__auto____7064 = G__7062__7063.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____7064) {
        return or__3824__auto____7064
      }else {
        return G__7062__7063.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7062__7063.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7062__7063)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7062__7063)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7068__7069 = x;
  if(G__7068__7069) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____7070 = null;
      if(cljs.core.truth_(or__3824__auto____7070)) {
        return or__3824__auto____7070
      }else {
        return G__7068__7069.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7068__7069.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7068__7069)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7068__7069)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7071__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7071 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7071__delegate.call(this, keyvals)
    };
    G__7071.cljs$lang$maxFixedArity = 0;
    G__7071.cljs$lang$applyTo = function(arglist__7072) {
      var keyvals = cljs.core.seq(arglist__7072);
      return G__7071__delegate(keyvals)
    };
    G__7071.cljs$lang$arity$variadic = G__7071__delegate;
    return G__7071
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__7074 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7074.push(key)
  });
  return keys__7074
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7078 = i;
  var j__7079 = j;
  var len__7080 = len;
  while(true) {
    if(len__7080 === 0) {
      return to
    }else {
      to[j__7079] = from[i__7078];
      var G__7081 = i__7078 + 1;
      var G__7082 = j__7079 + 1;
      var G__7083 = len__7080 - 1;
      i__7078 = G__7081;
      j__7079 = G__7082;
      len__7080 = G__7083;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7087 = i + (len - 1);
  var j__7088 = j + (len - 1);
  var len__7089 = len;
  while(true) {
    if(len__7089 === 0) {
      return to
    }else {
      to[j__7088] = from[i__7087];
      var G__7090 = i__7087 - 1;
      var G__7091 = j__7088 - 1;
      var G__7092 = len__7089 - 1;
      i__7087 = G__7090;
      j__7088 = G__7091;
      len__7089 = G__7092;
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
    var G__7096__7097 = s;
    if(G__7096__7097) {
      if(function() {
        var or__3824__auto____7098 = G__7096__7097.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7098) {
          return or__3824__auto____7098
        }else {
          return G__7096__7097.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7096__7097.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7096__7097)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7096__7097)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7102__7103 = s;
  if(G__7102__7103) {
    if(function() {
      var or__3824__auto____7104 = G__7102__7103.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7104) {
        return or__3824__auto____7104
      }else {
        return G__7102__7103.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7102__7103.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7102__7103)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7102__7103)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____7107 = goog.isString(x);
  if(and__3822__auto____7107) {
    return!function() {
      var or__3824__auto____7108 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7108) {
        return or__3824__auto____7108
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7107
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7110 = goog.isString(x);
  if(and__3822__auto____7110) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7110
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7112 = goog.isString(x);
  if(and__3822__auto____7112) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7112
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7117 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7117) {
    return or__3824__auto____7117
  }else {
    var G__7118__7119 = f;
    if(G__7118__7119) {
      if(function() {
        var or__3824__auto____7120 = G__7118__7119.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7120) {
          return or__3824__auto____7120
        }else {
          return G__7118__7119.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7118__7119.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7118__7119)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7118__7119)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7122 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7122) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7122
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____7125 = coll;
    if(cljs.core.truth_(and__3822__auto____7125)) {
      var and__3822__auto____7126 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7126) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7126
      }
    }else {
      return and__3822__auto____7125
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
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
    var G__7135__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7131 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7132 = more;
        while(true) {
          var x__7133 = cljs.core.first.call(null, xs__7132);
          var etc__7134 = cljs.core.next.call(null, xs__7132);
          if(cljs.core.truth_(xs__7132)) {
            if(cljs.core.contains_QMARK_.call(null, s__7131, x__7133)) {
              return false
            }else {
              var G__7136 = cljs.core.conj.call(null, s__7131, x__7133);
              var G__7137 = etc__7134;
              s__7131 = G__7136;
              xs__7132 = G__7137;
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
    var G__7135 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7135__delegate.call(this, x, y, more)
    };
    G__7135.cljs$lang$maxFixedArity = 2;
    G__7135.cljs$lang$applyTo = function(arglist__7138) {
      var x = cljs.core.first(arglist__7138);
      var y = cljs.core.first(cljs.core.next(arglist__7138));
      var more = cljs.core.rest(cljs.core.next(arglist__7138));
      return G__7135__delegate(x, y, more)
    };
    G__7135.cljs$lang$arity$variadic = G__7135__delegate;
    return G__7135
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
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
            var G__7142__7143 = x;
            if(G__7142__7143) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7144 = null;
                if(cljs.core.truth_(or__3824__auto____7144)) {
                  return or__3824__auto____7144
                }else {
                  return G__7142__7143.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7142__7143.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7142__7143)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7142__7143)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
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
    var xl__7149 = cljs.core.count.call(null, xs);
    var yl__7150 = cljs.core.count.call(null, ys);
    if(xl__7149 < yl__7150) {
      return-1
    }else {
      if(xl__7149 > yl__7150) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7149, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7151 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7152 = d__7151 === 0;
        if(and__3822__auto____7152) {
          return n + 1 < len
        }else {
          return and__3822__auto____7152
        }
      }()) {
        var G__7153 = xs;
        var G__7154 = ys;
        var G__7155 = len;
        var G__7156 = n + 1;
        xs = G__7153;
        ys = G__7154;
        len = G__7155;
        n = G__7156;
        continue
      }else {
        return d__7151
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
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7158 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7158)) {
        return r__7158
      }else {
        if(cljs.core.truth_(r__7158)) {
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
      var a__7160 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7160, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7160)
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
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
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
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7166 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7166) {
      var s__7167 = temp__3971__auto____7166;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7167), cljs.core.next.call(null, s__7167))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7168 = val;
    var coll__7169 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7169) {
        var nval__7170 = f.call(null, val__7168, cljs.core.first.call(null, coll__7169));
        if(cljs.core.reduced_QMARK_.call(null, nval__7170)) {
          return cljs.core.deref.call(null, nval__7170)
        }else {
          var G__7171 = nval__7170;
          var G__7172 = cljs.core.next.call(null, coll__7169);
          val__7168 = G__7171;
          coll__7169 = G__7172;
          continue
        }
      }else {
        return val__7168
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
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7174 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7174);
  return cljs.core.vec.call(null, a__7174)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7181__7182 = coll;
      if(G__7181__7182) {
        if(function() {
          var or__3824__auto____7183 = G__7181__7182.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7183) {
            return or__3824__auto____7183
          }else {
            return G__7181__7182.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7181__7182.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7181__7182)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7181__7182)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7184__7185 = coll;
      if(G__7184__7185) {
        if(function() {
          var or__3824__auto____7186 = G__7184__7185.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7186) {
            return or__3824__auto____7186
          }else {
            return G__7184__7185.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7184__7185.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7184__7185)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7184__7185)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7187 = this;
  return this__7187.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
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
    var G__7188__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7188 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7188__delegate.call(this, x, y, more)
    };
    G__7188.cljs$lang$maxFixedArity = 2;
    G__7188.cljs$lang$applyTo = function(arglist__7189) {
      var x = cljs.core.first(arglist__7189);
      var y = cljs.core.first(cljs.core.next(arglist__7189));
      var more = cljs.core.rest(cljs.core.next(arglist__7189));
      return G__7188__delegate(x, y, more)
    };
    G__7188.cljs$lang$arity$variadic = G__7188__delegate;
    return G__7188
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
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
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
    var G__7190__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7190 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7190__delegate.call(this, x, y, more)
    };
    G__7190.cljs$lang$maxFixedArity = 2;
    G__7190.cljs$lang$applyTo = function(arglist__7191) {
      var x = cljs.core.first(arglist__7191);
      var y = cljs.core.first(cljs.core.next(arglist__7191));
      var more = cljs.core.rest(cljs.core.next(arglist__7191));
      return G__7190__delegate(x, y, more)
    };
    G__7190.cljs$lang$arity$variadic = G__7190__delegate;
    return G__7190
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
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
    var G__7192__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7192 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7192__delegate.call(this, x, y, more)
    };
    G__7192.cljs$lang$maxFixedArity = 2;
    G__7192.cljs$lang$applyTo = function(arglist__7193) {
      var x = cljs.core.first(arglist__7193);
      var y = cljs.core.first(cljs.core.next(arglist__7193));
      var more = cljs.core.rest(cljs.core.next(arglist__7193));
      return G__7192__delegate(x, y, more)
    };
    G__7192.cljs$lang$arity$variadic = G__7192__delegate;
    return G__7192
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
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
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
    var G__7194__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7194 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7194__delegate.call(this, x, y, more)
    };
    G__7194.cljs$lang$maxFixedArity = 2;
    G__7194.cljs$lang$applyTo = function(arglist__7195) {
      var x = cljs.core.first(arglist__7195);
      var y = cljs.core.first(cljs.core.next(arglist__7195));
      var more = cljs.core.rest(cljs.core.next(arglist__7195));
      return G__7194__delegate(x, y, more)
    };
    G__7194.cljs$lang$arity$variadic = G__7194__delegate;
    return G__7194
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
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
    var G__7196__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7197 = y;
            var G__7198 = cljs.core.first.call(null, more);
            var G__7199 = cljs.core.next.call(null, more);
            x = G__7197;
            y = G__7198;
            more = G__7199;
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
    var G__7196 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7196__delegate.call(this, x, y, more)
    };
    G__7196.cljs$lang$maxFixedArity = 2;
    G__7196.cljs$lang$applyTo = function(arglist__7200) {
      var x = cljs.core.first(arglist__7200);
      var y = cljs.core.first(cljs.core.next(arglist__7200));
      var more = cljs.core.rest(cljs.core.next(arglist__7200));
      return G__7196__delegate(x, y, more)
    };
    G__7196.cljs$lang$arity$variadic = G__7196__delegate;
    return G__7196
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
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
    var G__7201__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7202 = y;
            var G__7203 = cljs.core.first.call(null, more);
            var G__7204 = cljs.core.next.call(null, more);
            x = G__7202;
            y = G__7203;
            more = G__7204;
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
    var G__7201 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7201__delegate.call(this, x, y, more)
    };
    G__7201.cljs$lang$maxFixedArity = 2;
    G__7201.cljs$lang$applyTo = function(arglist__7205) {
      var x = cljs.core.first(arglist__7205);
      var y = cljs.core.first(cljs.core.next(arglist__7205));
      var more = cljs.core.rest(cljs.core.next(arglist__7205));
      return G__7201__delegate(x, y, more)
    };
    G__7201.cljs$lang$arity$variadic = G__7201__delegate;
    return G__7201
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
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
    var G__7206__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7207 = y;
            var G__7208 = cljs.core.first.call(null, more);
            var G__7209 = cljs.core.next.call(null, more);
            x = G__7207;
            y = G__7208;
            more = G__7209;
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
    var G__7206 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7206__delegate.call(this, x, y, more)
    };
    G__7206.cljs$lang$maxFixedArity = 2;
    G__7206.cljs$lang$applyTo = function(arglist__7210) {
      var x = cljs.core.first(arglist__7210);
      var y = cljs.core.first(cljs.core.next(arglist__7210));
      var more = cljs.core.rest(cljs.core.next(arglist__7210));
      return G__7206__delegate(x, y, more)
    };
    G__7206.cljs$lang$arity$variadic = G__7206__delegate;
    return G__7206
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
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
    var G__7211__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7212 = y;
            var G__7213 = cljs.core.first.call(null, more);
            var G__7214 = cljs.core.next.call(null, more);
            x = G__7212;
            y = G__7213;
            more = G__7214;
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
    var G__7211 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7211__delegate.call(this, x, y, more)
    };
    G__7211.cljs$lang$maxFixedArity = 2;
    G__7211.cljs$lang$applyTo = function(arglist__7215) {
      var x = cljs.core.first(arglist__7215);
      var y = cljs.core.first(cljs.core.next(arglist__7215));
      var more = cljs.core.rest(cljs.core.next(arglist__7215));
      return G__7211__delegate(x, y, more)
    };
    G__7211.cljs$lang$arity$variadic = G__7211__delegate;
    return G__7211
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
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
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7216__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7216 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7216__delegate.call(this, x, y, more)
    };
    G__7216.cljs$lang$maxFixedArity = 2;
    G__7216.cljs$lang$applyTo = function(arglist__7217) {
      var x = cljs.core.first(arglist__7217);
      var y = cljs.core.first(cljs.core.next(arglist__7217));
      var more = cljs.core.rest(cljs.core.next(arglist__7217));
      return G__7216__delegate(x, y, more)
    };
    G__7216.cljs$lang$arity$variadic = G__7216__delegate;
    return G__7216
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7218__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7218 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7218__delegate.call(this, x, y, more)
    };
    G__7218.cljs$lang$maxFixedArity = 2;
    G__7218.cljs$lang$applyTo = function(arglist__7219) {
      var x = cljs.core.first(arglist__7219);
      var y = cljs.core.first(cljs.core.next(arglist__7219));
      var more = cljs.core.rest(cljs.core.next(arglist__7219));
      return G__7218__delegate(x, y, more)
    };
    G__7218.cljs$lang$arity$variadic = G__7218__delegate;
    return G__7218
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7221 = n % d;
  return cljs.core.fix.call(null, (n - rem__7221) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7223 = cljs.core.quot.call(null, n, d);
  return n - d * q__7223
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
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
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
  var v__7226 = v - (v >> 1 & 1431655765);
  var v__7227 = (v__7226 & 858993459) + (v__7226 >> 2 & 858993459);
  return(v__7227 + (v__7227 >> 4) & 252645135) * 16843009 >> 24
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
    var G__7228__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7229 = y;
            var G__7230 = cljs.core.first.call(null, more);
            var G__7231 = cljs.core.next.call(null, more);
            x = G__7229;
            y = G__7230;
            more = G__7231;
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
    var G__7228 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7228__delegate.call(this, x, y, more)
    };
    G__7228.cljs$lang$maxFixedArity = 2;
    G__7228.cljs$lang$applyTo = function(arglist__7232) {
      var x = cljs.core.first(arglist__7232);
      var y = cljs.core.first(cljs.core.next(arglist__7232));
      var more = cljs.core.rest(cljs.core.next(arglist__7232));
      return G__7228__delegate(x, y, more)
    };
    G__7228.cljs$lang$arity$variadic = G__7228__delegate;
    return G__7228
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
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
  var n__7236 = n;
  var xs__7237 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7238 = xs__7237;
      if(and__3822__auto____7238) {
        return n__7236 > 0
      }else {
        return and__3822__auto____7238
      }
    }())) {
      var G__7239 = n__7236 - 1;
      var G__7240 = cljs.core.next.call(null, xs__7237);
      n__7236 = G__7239;
      xs__7237 = G__7240;
      continue
    }else {
      return xs__7237
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7241__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7242 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7243 = cljs.core.next.call(null, more);
            sb = G__7242;
            more = G__7243;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7241 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7241__delegate.call(this, x, ys)
    };
    G__7241.cljs$lang$maxFixedArity = 1;
    G__7241.cljs$lang$applyTo = function(arglist__7244) {
      var x = cljs.core.first(arglist__7244);
      var ys = cljs.core.rest(arglist__7244);
      return G__7241__delegate(x, ys)
    };
    G__7241.cljs$lang$arity$variadic = G__7241__delegate;
    return G__7241
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7245__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7246 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7247 = cljs.core.next.call(null, more);
            sb = G__7246;
            more = G__7247;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7245 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7245__delegate.call(this, x, ys)
    };
    G__7245.cljs$lang$maxFixedArity = 1;
    G__7245.cljs$lang$applyTo = function(arglist__7248) {
      var x = cljs.core.first(arglist__7248);
      var ys = cljs.core.rest(arglist__7248);
      return G__7245__delegate(x, ys)
    };
    G__7245.cljs$lang$arity$variadic = G__7245__delegate;
    return G__7245
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
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
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7249) {
    var fmt = cljs.core.first(arglist__7249);
    var args = cljs.core.rest(arglist__7249);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7252 = cljs.core.seq.call(null, x);
    var ys__7253 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7252 == null) {
        return ys__7253 == null
      }else {
        if(ys__7253 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7252), cljs.core.first.call(null, ys__7253))) {
            var G__7254 = cljs.core.next.call(null, xs__7252);
            var G__7255 = cljs.core.next.call(null, ys__7253);
            xs__7252 = G__7254;
            ys__7253 = G__7255;
            continue
          }else {
            if("\ufdd0'else") {
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
  return cljs.core.reduce.call(null, function(p1__7256_SHARP_, p2__7257_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7256_SHARP_, cljs.core.hash.call(null, p2__7257_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7261 = 0;
  var s__7262 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7262) {
      var e__7263 = cljs.core.first.call(null, s__7262);
      var G__7264 = (h__7261 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7263)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7263)))) % 4503599627370496;
      var G__7265 = cljs.core.next.call(null, s__7262);
      h__7261 = G__7264;
      s__7262 = G__7265;
      continue
    }else {
      return h__7261
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7269 = 0;
  var s__7270 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7270) {
      var e__7271 = cljs.core.first.call(null, s__7270);
      var G__7272 = (h__7269 + cljs.core.hash.call(null, e__7271)) % 4503599627370496;
      var G__7273 = cljs.core.next.call(null, s__7270);
      h__7269 = G__7272;
      s__7270 = G__7273;
      continue
    }else {
      return h__7269
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7294__7295 = cljs.core.seq.call(null, fn_map);
  if(G__7294__7295) {
    var G__7297__7299 = cljs.core.first.call(null, G__7294__7295);
    var vec__7298__7300 = G__7297__7299;
    var key_name__7301 = cljs.core.nth.call(null, vec__7298__7300, 0, null);
    var f__7302 = cljs.core.nth.call(null, vec__7298__7300, 1, null);
    var G__7294__7303 = G__7294__7295;
    var G__7297__7304 = G__7297__7299;
    var G__7294__7305 = G__7294__7303;
    while(true) {
      var vec__7306__7307 = G__7297__7304;
      var key_name__7308 = cljs.core.nth.call(null, vec__7306__7307, 0, null);
      var f__7309 = cljs.core.nth.call(null, vec__7306__7307, 1, null);
      var G__7294__7310 = G__7294__7305;
      var str_name__7311 = cljs.core.name.call(null, key_name__7308);
      obj[str_name__7311] = f__7309;
      var temp__3974__auto____7312 = cljs.core.next.call(null, G__7294__7310);
      if(temp__3974__auto____7312) {
        var G__7294__7313 = temp__3974__auto____7312;
        var G__7314 = cljs.core.first.call(null, G__7294__7313);
        var G__7315 = G__7294__7313;
        G__7297__7304 = G__7314;
        G__7294__7305 = G__7315;
        continue
      }else {
      }
      break
    }
  }else {
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
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7316 = this;
  var h__2192__auto____7317 = this__7316.__hash;
  if(!(h__2192__auto____7317 == null)) {
    return h__2192__auto____7317
  }else {
    var h__2192__auto____7318 = cljs.core.hash_coll.call(null, coll);
    this__7316.__hash = h__2192__auto____7318;
    return h__2192__auto____7318
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7319 = this;
  if(this__7319.count === 1) {
    return null
  }else {
    return this__7319.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7320 = this;
  return new cljs.core.List(this__7320.meta, o, coll, this__7320.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7321 = this;
  var this__7322 = this;
  return cljs.core.pr_str.call(null, this__7322)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7323 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7324 = this;
  return this__7324.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7325 = this;
  return this__7325.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7326 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7327 = this;
  return this__7327.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7328 = this;
  if(this__7328.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7328.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7329 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7330 = this;
  return new cljs.core.List(meta, this__7330.first, this__7330.rest, this__7330.count, this__7330.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7331 = this;
  return this__7331.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7332 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7333 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7334 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7335 = this;
  return new cljs.core.List(this__7335.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7336 = this;
  var this__7337 = this;
  return cljs.core.pr_str.call(null, this__7337)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7338 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7339 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7340 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7341 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7342 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7343 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7344 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7345 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7346 = this;
  return this__7346.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7347 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7351__7352 = coll;
  if(G__7351__7352) {
    if(function() {
      var or__3824__auto____7353 = G__7351__7352.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7353) {
        return or__3824__auto____7353
      }else {
        return G__7351__7352.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7351__7352.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7351__7352)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7351__7352)
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
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7354__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7354 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7354__delegate.call(this, x, y, z, items)
    };
    G__7354.cljs$lang$maxFixedArity = 3;
    G__7354.cljs$lang$applyTo = function(arglist__7355) {
      var x = cljs.core.first(arglist__7355);
      var y = cljs.core.first(cljs.core.next(arglist__7355));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7355)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7355)));
      return G__7354__delegate(x, y, z, items)
    };
    G__7354.cljs$lang$arity$variadic = G__7354__delegate;
    return G__7354
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7356 = this;
  var h__2192__auto____7357 = this__7356.__hash;
  if(!(h__2192__auto____7357 == null)) {
    return h__2192__auto____7357
  }else {
    var h__2192__auto____7358 = cljs.core.hash_coll.call(null, coll);
    this__7356.__hash = h__2192__auto____7358;
    return h__2192__auto____7358
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7359 = this;
  if(this__7359.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7359.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7360 = this;
  return new cljs.core.Cons(null, o, coll, this__7360.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7361 = this;
  var this__7362 = this;
  return cljs.core.pr_str.call(null, this__7362)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7363 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7364 = this;
  return this__7364.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7365 = this;
  if(this__7365.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7365.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7366 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7367 = this;
  return new cljs.core.Cons(meta, this__7367.first, this__7367.rest, this__7367.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7368 = this;
  return this__7368.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7369 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7369.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7374 = coll == null;
    if(or__3824__auto____7374) {
      return or__3824__auto____7374
    }else {
      var G__7375__7376 = coll;
      if(G__7375__7376) {
        if(function() {
          var or__3824__auto____7377 = G__7375__7376.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7377) {
            return or__3824__auto____7377
          }else {
            return G__7375__7376.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7375__7376.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7375__7376)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7375__7376)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7381__7382 = x;
  if(G__7381__7382) {
    if(function() {
      var or__3824__auto____7383 = G__7381__7382.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7383) {
        return or__3824__auto____7383
      }else {
        return G__7381__7382.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7381__7382.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7381__7382)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7381__7382)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7384 = null;
  var G__7384__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7384__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7384 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7384__2.call(this, string, f);
      case 3:
        return G__7384__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7384
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7385 = null;
  var G__7385__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7385__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7385 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7385__2.call(this, string, k);
      case 3:
        return G__7385__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7385
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7386 = null;
  var G__7386__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7386__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7386 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7386__2.call(this, string, n);
      case 3:
        return G__7386__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7386
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7398 = null;
  var G__7398__2 = function(this_sym7389, coll) {
    var this__7391 = this;
    var this_sym7389__7392 = this;
    var ___7393 = this_sym7389__7392;
    if(coll == null) {
      return null
    }else {
      var strobj__7394 = coll.strobj;
      if(strobj__7394 == null) {
        return cljs.core._lookup.call(null, coll, this__7391.k, null)
      }else {
        return strobj__7394[this__7391.k]
      }
    }
  };
  var G__7398__3 = function(this_sym7390, coll, not_found) {
    var this__7391 = this;
    var this_sym7390__7395 = this;
    var ___7396 = this_sym7390__7395;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7391.k, not_found)
    }
  };
  G__7398 = function(this_sym7390, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7398__2.call(this, this_sym7390, coll);
      case 3:
        return G__7398__3.call(this, this_sym7390, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7398
}();
cljs.core.Keyword.prototype.apply = function(this_sym7387, args7388) {
  var this__7397 = this;
  return this_sym7387.call.apply(this_sym7387, [this_sym7387].concat(args7388.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7407 = null;
  var G__7407__2 = function(this_sym7401, coll) {
    var this_sym7401__7403 = this;
    var this__7404 = this_sym7401__7403;
    return cljs.core._lookup.call(null, coll, this__7404.toString(), null)
  };
  var G__7407__3 = function(this_sym7402, coll, not_found) {
    var this_sym7402__7405 = this;
    var this__7406 = this_sym7402__7405;
    return cljs.core._lookup.call(null, coll, this__7406.toString(), not_found)
  };
  G__7407 = function(this_sym7402, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7407__2.call(this, this_sym7402, coll);
      case 3:
        return G__7407__3.call(this, this_sym7402, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7407
}();
String.prototype.apply = function(this_sym7399, args7400) {
  return this_sym7399.call.apply(this_sym7399, [this_sym7399].concat(args7400.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7409 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7409
  }else {
    lazy_seq.x = x__7409.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7410 = this;
  var h__2192__auto____7411 = this__7410.__hash;
  if(!(h__2192__auto____7411 == null)) {
    return h__2192__auto____7411
  }else {
    var h__2192__auto____7412 = cljs.core.hash_coll.call(null, coll);
    this__7410.__hash = h__2192__auto____7412;
    return h__2192__auto____7412
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7413 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7414 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7415 = this;
  var this__7416 = this;
  return cljs.core.pr_str.call(null, this__7416)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7417 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7418 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7419 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7420 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7421 = this;
  return new cljs.core.LazySeq(meta, this__7421.realized, this__7421.x, this__7421.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7422 = this;
  return this__7422.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7423 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7423.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7424 = this;
  return this__7424.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7425 = this;
  var ___7426 = this;
  this__7425.buf[this__7425.end] = o;
  return this__7425.end = this__7425.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7427 = this;
  var ___7428 = this;
  var ret__7429 = new cljs.core.ArrayChunk(this__7427.buf, 0, this__7427.end);
  this__7427.buf = null;
  return ret__7429
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7430 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7430.arr[this__7430.off], this__7430.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7431 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7431.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7432 = this;
  if(this__7432.off === this__7432.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7432.arr, this__7432.off + 1, this__7432.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7433 = this;
  return this__7433.arr[this__7433.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7434 = this;
  if(function() {
    var and__3822__auto____7435 = i >= 0;
    if(and__3822__auto____7435) {
      return i < this__7434.end - this__7434.off
    }else {
      return and__3822__auto____7435
    }
  }()) {
    return this__7434.arr[this__7434.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7436 = this;
  return this__7436.end - this__7436.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
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
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7437 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7438 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7439 = this;
  return cljs.core._nth.call(null, this__7439.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7440 = this;
  if(cljs.core._count.call(null, this__7440.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7440.chunk), this__7440.more, this__7440.meta)
  }else {
    if(this__7440.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7440.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7441 = this;
  if(this__7441.more == null) {
    return null
  }else {
    return this__7441.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7442 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7443 = this;
  return new cljs.core.ChunkedCons(this__7443.chunk, this__7443.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7444 = this;
  return this__7444.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7445 = this;
  return this__7445.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7446 = this;
  if(this__7446.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7446.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
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
    var G__7450__7451 = s;
    if(G__7450__7451) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7452 = null;
        if(cljs.core.truth_(or__3824__auto____7452)) {
          return or__3824__auto____7452
        }else {
          return G__7450__7451.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7450__7451.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7450__7451)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7450__7451)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7455 = [];
  var s__7456 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7456)) {
      ary__7455.push(cljs.core.first.call(null, s__7456));
      var G__7457 = cljs.core.next.call(null, s__7456);
      s__7456 = G__7457;
      continue
    }else {
      return ary__7455
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7461 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7462 = 0;
  var xs__7463 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7463) {
      ret__7461[i__7462] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7463));
      var G__7464 = i__7462 + 1;
      var G__7465 = cljs.core.next.call(null, xs__7463);
      i__7462 = G__7464;
      xs__7463 = G__7465;
      continue
    }else {
    }
    break
  }
  return ret__7461
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7473 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7474 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7475 = 0;
      var s__7476 = s__7474;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7477 = s__7476;
          if(and__3822__auto____7477) {
            return i__7475 < size
          }else {
            return and__3822__auto____7477
          }
        }())) {
          a__7473[i__7475] = cljs.core.first.call(null, s__7476);
          var G__7480 = i__7475 + 1;
          var G__7481 = cljs.core.next.call(null, s__7476);
          i__7475 = G__7480;
          s__7476 = G__7481;
          continue
        }else {
          return a__7473
        }
        break
      }
    }else {
      var n__2527__auto____7478 = size;
      var i__7479 = 0;
      while(true) {
        if(i__7479 < n__2527__auto____7478) {
          a__7473[i__7479] = init_val_or_seq;
          var G__7482 = i__7479 + 1;
          i__7479 = G__7482;
          continue
        }else {
        }
        break
      }
      return a__7473
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7490 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7491 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7492 = 0;
      var s__7493 = s__7491;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7494 = s__7493;
          if(and__3822__auto____7494) {
            return i__7492 < size
          }else {
            return and__3822__auto____7494
          }
        }())) {
          a__7490[i__7492] = cljs.core.first.call(null, s__7493);
          var G__7497 = i__7492 + 1;
          var G__7498 = cljs.core.next.call(null, s__7493);
          i__7492 = G__7497;
          s__7493 = G__7498;
          continue
        }else {
          return a__7490
        }
        break
      }
    }else {
      var n__2527__auto____7495 = size;
      var i__7496 = 0;
      while(true) {
        if(i__7496 < n__2527__auto____7495) {
          a__7490[i__7496] = init_val_or_seq;
          var G__7499 = i__7496 + 1;
          i__7496 = G__7499;
          continue
        }else {
        }
        break
      }
      return a__7490
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7507 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7508 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7509 = 0;
      var s__7510 = s__7508;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7511 = s__7510;
          if(and__3822__auto____7511) {
            return i__7509 < size
          }else {
            return and__3822__auto____7511
          }
        }())) {
          a__7507[i__7509] = cljs.core.first.call(null, s__7510);
          var G__7514 = i__7509 + 1;
          var G__7515 = cljs.core.next.call(null, s__7510);
          i__7509 = G__7514;
          s__7510 = G__7515;
          continue
        }else {
          return a__7507
        }
        break
      }
    }else {
      var n__2527__auto____7512 = size;
      var i__7513 = 0;
      while(true) {
        if(i__7513 < n__2527__auto____7512) {
          a__7507[i__7513] = init_val_or_seq;
          var G__7516 = i__7513 + 1;
          i__7513 = G__7516;
          continue
        }else {
        }
        break
      }
      return a__7507
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7521 = s;
    var i__7522 = n;
    var sum__7523 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7524 = i__7522 > 0;
        if(and__3822__auto____7524) {
          return cljs.core.seq.call(null, s__7521)
        }else {
          return and__3822__auto____7524
        }
      }())) {
        var G__7525 = cljs.core.next.call(null, s__7521);
        var G__7526 = i__7522 - 1;
        var G__7527 = sum__7523 + 1;
        s__7521 = G__7525;
        i__7522 = G__7526;
        sum__7523 = G__7527;
        continue
      }else {
        return sum__7523
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
      if("\ufdd0'else") {
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
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7532 = cljs.core.seq.call(null, x);
      if(s__7532) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7532)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7532), concat.call(null, cljs.core.chunk_rest.call(null, s__7532), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7532), concat.call(null, cljs.core.rest.call(null, s__7532), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7536__delegate = function(x, y, zs) {
      var cat__7535 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7534 = cljs.core.seq.call(null, xys);
          if(xys__7534) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7534)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7534), cat.call(null, cljs.core.chunk_rest.call(null, xys__7534), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7534), cat.call(null, cljs.core.rest.call(null, xys__7534), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7535.call(null, concat.call(null, x, y), zs)
    };
    var G__7536 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7536__delegate.call(this, x, y, zs)
    };
    G__7536.cljs$lang$maxFixedArity = 2;
    G__7536.cljs$lang$applyTo = function(arglist__7537) {
      var x = cljs.core.first(arglist__7537);
      var y = cljs.core.first(cljs.core.next(arglist__7537));
      var zs = cljs.core.rest(cljs.core.next(arglist__7537));
      return G__7536__delegate(x, y, zs)
    };
    G__7536.cljs$lang$arity$variadic = G__7536__delegate;
    return G__7536
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
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
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
    var G__7538__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7538 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7538__delegate.call(this, a, b, c, d, more)
    };
    G__7538.cljs$lang$maxFixedArity = 4;
    G__7538.cljs$lang$applyTo = function(arglist__7539) {
      var a = cljs.core.first(arglist__7539);
      var b = cljs.core.first(cljs.core.next(arglist__7539));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7539)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7539))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7539))));
      return G__7538__delegate(a, b, c, d, more)
    };
    G__7538.cljs$lang$arity$variadic = G__7538__delegate;
    return G__7538
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
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
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
  var args__7581 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7582 = cljs.core._first.call(null, args__7581);
    var args__7583 = cljs.core._rest.call(null, args__7581);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7582)
      }else {
        return f.call(null, a__7582)
      }
    }else {
      var b__7584 = cljs.core._first.call(null, args__7583);
      var args__7585 = cljs.core._rest.call(null, args__7583);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7582, b__7584)
        }else {
          return f.call(null, a__7582, b__7584)
        }
      }else {
        var c__7586 = cljs.core._first.call(null, args__7585);
        var args__7587 = cljs.core._rest.call(null, args__7585);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7582, b__7584, c__7586)
          }else {
            return f.call(null, a__7582, b__7584, c__7586)
          }
        }else {
          var d__7588 = cljs.core._first.call(null, args__7587);
          var args__7589 = cljs.core._rest.call(null, args__7587);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7582, b__7584, c__7586, d__7588)
            }else {
              return f.call(null, a__7582, b__7584, c__7586, d__7588)
            }
          }else {
            var e__7590 = cljs.core._first.call(null, args__7589);
            var args__7591 = cljs.core._rest.call(null, args__7589);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7582, b__7584, c__7586, d__7588, e__7590)
              }else {
                return f.call(null, a__7582, b__7584, c__7586, d__7588, e__7590)
              }
            }else {
              var f__7592 = cljs.core._first.call(null, args__7591);
              var args__7593 = cljs.core._rest.call(null, args__7591);
              if(argc === 6) {
                if(f__7592.cljs$lang$arity$6) {
                  return f__7592.cljs$lang$arity$6(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592)
                }else {
                  return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592)
                }
              }else {
                var g__7594 = cljs.core._first.call(null, args__7593);
                var args__7595 = cljs.core._rest.call(null, args__7593);
                if(argc === 7) {
                  if(f__7592.cljs$lang$arity$7) {
                    return f__7592.cljs$lang$arity$7(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594)
                  }else {
                    return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594)
                  }
                }else {
                  var h__7596 = cljs.core._first.call(null, args__7595);
                  var args__7597 = cljs.core._rest.call(null, args__7595);
                  if(argc === 8) {
                    if(f__7592.cljs$lang$arity$8) {
                      return f__7592.cljs$lang$arity$8(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596)
                    }else {
                      return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596)
                    }
                  }else {
                    var i__7598 = cljs.core._first.call(null, args__7597);
                    var args__7599 = cljs.core._rest.call(null, args__7597);
                    if(argc === 9) {
                      if(f__7592.cljs$lang$arity$9) {
                        return f__7592.cljs$lang$arity$9(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598)
                      }else {
                        return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598)
                      }
                    }else {
                      var j__7600 = cljs.core._first.call(null, args__7599);
                      var args__7601 = cljs.core._rest.call(null, args__7599);
                      if(argc === 10) {
                        if(f__7592.cljs$lang$arity$10) {
                          return f__7592.cljs$lang$arity$10(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600)
                        }else {
                          return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600)
                        }
                      }else {
                        var k__7602 = cljs.core._first.call(null, args__7601);
                        var args__7603 = cljs.core._rest.call(null, args__7601);
                        if(argc === 11) {
                          if(f__7592.cljs$lang$arity$11) {
                            return f__7592.cljs$lang$arity$11(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602)
                          }else {
                            return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602)
                          }
                        }else {
                          var l__7604 = cljs.core._first.call(null, args__7603);
                          var args__7605 = cljs.core._rest.call(null, args__7603);
                          if(argc === 12) {
                            if(f__7592.cljs$lang$arity$12) {
                              return f__7592.cljs$lang$arity$12(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604)
                            }else {
                              return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604)
                            }
                          }else {
                            var m__7606 = cljs.core._first.call(null, args__7605);
                            var args__7607 = cljs.core._rest.call(null, args__7605);
                            if(argc === 13) {
                              if(f__7592.cljs$lang$arity$13) {
                                return f__7592.cljs$lang$arity$13(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606)
                              }else {
                                return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606)
                              }
                            }else {
                              var n__7608 = cljs.core._first.call(null, args__7607);
                              var args__7609 = cljs.core._rest.call(null, args__7607);
                              if(argc === 14) {
                                if(f__7592.cljs$lang$arity$14) {
                                  return f__7592.cljs$lang$arity$14(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608)
                                }else {
                                  return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608)
                                }
                              }else {
                                var o__7610 = cljs.core._first.call(null, args__7609);
                                var args__7611 = cljs.core._rest.call(null, args__7609);
                                if(argc === 15) {
                                  if(f__7592.cljs$lang$arity$15) {
                                    return f__7592.cljs$lang$arity$15(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608, o__7610)
                                  }else {
                                    return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608, o__7610)
                                  }
                                }else {
                                  var p__7612 = cljs.core._first.call(null, args__7611);
                                  var args__7613 = cljs.core._rest.call(null, args__7611);
                                  if(argc === 16) {
                                    if(f__7592.cljs$lang$arity$16) {
                                      return f__7592.cljs$lang$arity$16(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608, o__7610, p__7612)
                                    }else {
                                      return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608, o__7610, p__7612)
                                    }
                                  }else {
                                    var q__7614 = cljs.core._first.call(null, args__7613);
                                    var args__7615 = cljs.core._rest.call(null, args__7613);
                                    if(argc === 17) {
                                      if(f__7592.cljs$lang$arity$17) {
                                        return f__7592.cljs$lang$arity$17(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608, o__7610, p__7612, q__7614)
                                      }else {
                                        return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608, o__7610, p__7612, q__7614)
                                      }
                                    }else {
                                      var r__7616 = cljs.core._first.call(null, args__7615);
                                      var args__7617 = cljs.core._rest.call(null, args__7615);
                                      if(argc === 18) {
                                        if(f__7592.cljs$lang$arity$18) {
                                          return f__7592.cljs$lang$arity$18(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608, o__7610, p__7612, q__7614, r__7616)
                                        }else {
                                          return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608, o__7610, p__7612, q__7614, r__7616)
                                        }
                                      }else {
                                        var s__7618 = cljs.core._first.call(null, args__7617);
                                        var args__7619 = cljs.core._rest.call(null, args__7617);
                                        if(argc === 19) {
                                          if(f__7592.cljs$lang$arity$19) {
                                            return f__7592.cljs$lang$arity$19(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608, o__7610, p__7612, q__7614, r__7616, s__7618)
                                          }else {
                                            return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608, o__7610, p__7612, q__7614, r__7616, s__7618)
                                          }
                                        }else {
                                          var t__7620 = cljs.core._first.call(null, args__7619);
                                          var args__7621 = cljs.core._rest.call(null, args__7619);
                                          if(argc === 20) {
                                            if(f__7592.cljs$lang$arity$20) {
                                              return f__7592.cljs$lang$arity$20(a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608, o__7610, p__7612, q__7614, r__7616, s__7618, t__7620)
                                            }else {
                                              return f__7592.call(null, a__7582, b__7584, c__7586, d__7588, e__7590, f__7592, g__7594, h__7596, i__7598, j__7600, k__7602, l__7604, m__7606, n__7608, o__7610, p__7612, q__7614, r__7616, s__7618, t__7620)
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
    var fixed_arity__7636 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7637 = cljs.core.bounded_count.call(null, args, fixed_arity__7636 + 1);
      if(bc__7637 <= fixed_arity__7636) {
        return cljs.core.apply_to.call(null, f, bc__7637, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7638 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7639 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7640 = cljs.core.bounded_count.call(null, arglist__7638, fixed_arity__7639 + 1);
      if(bc__7640 <= fixed_arity__7639) {
        return cljs.core.apply_to.call(null, f, bc__7640, arglist__7638)
      }else {
        return f.cljs$lang$applyTo(arglist__7638)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7638))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7641 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7642 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7643 = cljs.core.bounded_count.call(null, arglist__7641, fixed_arity__7642 + 1);
      if(bc__7643 <= fixed_arity__7642) {
        return cljs.core.apply_to.call(null, f, bc__7643, arglist__7641)
      }else {
        return f.cljs$lang$applyTo(arglist__7641)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7641))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7644 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7645 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7646 = cljs.core.bounded_count.call(null, arglist__7644, fixed_arity__7645 + 1);
      if(bc__7646 <= fixed_arity__7645) {
        return cljs.core.apply_to.call(null, f, bc__7646, arglist__7644)
      }else {
        return f.cljs$lang$applyTo(arglist__7644)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7644))
    }
  };
  var apply__6 = function() {
    var G__7650__delegate = function(f, a, b, c, d, args) {
      var arglist__7647 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7648 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7649 = cljs.core.bounded_count.call(null, arglist__7647, fixed_arity__7648 + 1);
        if(bc__7649 <= fixed_arity__7648) {
          return cljs.core.apply_to.call(null, f, bc__7649, arglist__7647)
        }else {
          return f.cljs$lang$applyTo(arglist__7647)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7647))
      }
    };
    var G__7650 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7650__delegate.call(this, f, a, b, c, d, args)
    };
    G__7650.cljs$lang$maxFixedArity = 5;
    G__7650.cljs$lang$applyTo = function(arglist__7651) {
      var f = cljs.core.first(arglist__7651);
      var a = cljs.core.first(cljs.core.next(arglist__7651));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7651)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7651))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7651)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7651)))));
      return G__7650__delegate(f, a, b, c, d, args)
    };
    G__7650.cljs$lang$arity$variadic = G__7650__delegate;
    return G__7650
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
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7652) {
    var obj = cljs.core.first(arglist__7652);
    var f = cljs.core.first(cljs.core.next(arglist__7652));
    var args = cljs.core.rest(cljs.core.next(arglist__7652));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
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
    var G__7653__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7653 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7653__delegate.call(this, x, y, more)
    };
    G__7653.cljs$lang$maxFixedArity = 2;
    G__7653.cljs$lang$applyTo = function(arglist__7654) {
      var x = cljs.core.first(arglist__7654);
      var y = cljs.core.first(cljs.core.next(arglist__7654));
      var more = cljs.core.rest(cljs.core.next(arglist__7654));
      return G__7653__delegate(x, y, more)
    };
    G__7653.cljs$lang$arity$variadic = G__7653__delegate;
    return G__7653
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
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
        var G__7655 = pred;
        var G__7656 = cljs.core.next.call(null, coll);
        pred = G__7655;
        coll = G__7656;
        continue
      }else {
        if("\ufdd0'else") {
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
      var or__3824__auto____7658 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7658)) {
        return or__3824__auto____7658
      }else {
        var G__7659 = pred;
        var G__7660 = cljs.core.next.call(null, coll);
        pred = G__7659;
        coll = G__7660;
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
    var G__7661 = null;
    var G__7661__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7661__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7661__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7661__3 = function() {
      var G__7662__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7662 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7662__delegate.call(this, x, y, zs)
      };
      G__7662.cljs$lang$maxFixedArity = 2;
      G__7662.cljs$lang$applyTo = function(arglist__7663) {
        var x = cljs.core.first(arglist__7663);
        var y = cljs.core.first(cljs.core.next(arglist__7663));
        var zs = cljs.core.rest(cljs.core.next(arglist__7663));
        return G__7662__delegate(x, y, zs)
      };
      G__7662.cljs$lang$arity$variadic = G__7662__delegate;
      return G__7662
    }();
    G__7661 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7661__0.call(this);
        case 1:
          return G__7661__1.call(this, x);
        case 2:
          return G__7661__2.call(this, x, y);
        default:
          return G__7661__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7661.cljs$lang$maxFixedArity = 2;
    G__7661.cljs$lang$applyTo = G__7661__3.cljs$lang$applyTo;
    return G__7661
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7664__delegate = function(args) {
      return x
    };
    var G__7664 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7664__delegate.call(this, args)
    };
    G__7664.cljs$lang$maxFixedArity = 0;
    G__7664.cljs$lang$applyTo = function(arglist__7665) {
      var args = cljs.core.seq(arglist__7665);
      return G__7664__delegate(args)
    };
    G__7664.cljs$lang$arity$variadic = G__7664__delegate;
    return G__7664
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
      var G__7672 = null;
      var G__7672__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7672__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7672__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7672__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7672__4 = function() {
        var G__7673__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7673 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7673__delegate.call(this, x, y, z, args)
        };
        G__7673.cljs$lang$maxFixedArity = 3;
        G__7673.cljs$lang$applyTo = function(arglist__7674) {
          var x = cljs.core.first(arglist__7674);
          var y = cljs.core.first(cljs.core.next(arglist__7674));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7674)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7674)));
          return G__7673__delegate(x, y, z, args)
        };
        G__7673.cljs$lang$arity$variadic = G__7673__delegate;
        return G__7673
      }();
      G__7672 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7672__0.call(this);
          case 1:
            return G__7672__1.call(this, x);
          case 2:
            return G__7672__2.call(this, x, y);
          case 3:
            return G__7672__3.call(this, x, y, z);
          default:
            return G__7672__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7672.cljs$lang$maxFixedArity = 3;
      G__7672.cljs$lang$applyTo = G__7672__4.cljs$lang$applyTo;
      return G__7672
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7675 = null;
      var G__7675__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7675__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7675__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7675__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7675__4 = function() {
        var G__7676__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7676 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7676__delegate.call(this, x, y, z, args)
        };
        G__7676.cljs$lang$maxFixedArity = 3;
        G__7676.cljs$lang$applyTo = function(arglist__7677) {
          var x = cljs.core.first(arglist__7677);
          var y = cljs.core.first(cljs.core.next(arglist__7677));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7677)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7677)));
          return G__7676__delegate(x, y, z, args)
        };
        G__7676.cljs$lang$arity$variadic = G__7676__delegate;
        return G__7676
      }();
      G__7675 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7675__0.call(this);
          case 1:
            return G__7675__1.call(this, x);
          case 2:
            return G__7675__2.call(this, x, y);
          case 3:
            return G__7675__3.call(this, x, y, z);
          default:
            return G__7675__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7675.cljs$lang$maxFixedArity = 3;
      G__7675.cljs$lang$applyTo = G__7675__4.cljs$lang$applyTo;
      return G__7675
    }()
  };
  var comp__4 = function() {
    var G__7678__delegate = function(f1, f2, f3, fs) {
      var fs__7669 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7679__delegate = function(args) {
          var ret__7670 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7669), args);
          var fs__7671 = cljs.core.next.call(null, fs__7669);
          while(true) {
            if(fs__7671) {
              var G__7680 = cljs.core.first.call(null, fs__7671).call(null, ret__7670);
              var G__7681 = cljs.core.next.call(null, fs__7671);
              ret__7670 = G__7680;
              fs__7671 = G__7681;
              continue
            }else {
              return ret__7670
            }
            break
          }
        };
        var G__7679 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7679__delegate.call(this, args)
        };
        G__7679.cljs$lang$maxFixedArity = 0;
        G__7679.cljs$lang$applyTo = function(arglist__7682) {
          var args = cljs.core.seq(arglist__7682);
          return G__7679__delegate(args)
        };
        G__7679.cljs$lang$arity$variadic = G__7679__delegate;
        return G__7679
      }()
    };
    var G__7678 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7678__delegate.call(this, f1, f2, f3, fs)
    };
    G__7678.cljs$lang$maxFixedArity = 3;
    G__7678.cljs$lang$applyTo = function(arglist__7683) {
      var f1 = cljs.core.first(arglist__7683);
      var f2 = cljs.core.first(cljs.core.next(arglist__7683));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7683)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7683)));
      return G__7678__delegate(f1, f2, f3, fs)
    };
    G__7678.cljs$lang$arity$variadic = G__7678__delegate;
    return G__7678
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
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7684__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7684 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7684__delegate.call(this, args)
      };
      G__7684.cljs$lang$maxFixedArity = 0;
      G__7684.cljs$lang$applyTo = function(arglist__7685) {
        var args = cljs.core.seq(arglist__7685);
        return G__7684__delegate(args)
      };
      G__7684.cljs$lang$arity$variadic = G__7684__delegate;
      return G__7684
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7686__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7686 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7686__delegate.call(this, args)
      };
      G__7686.cljs$lang$maxFixedArity = 0;
      G__7686.cljs$lang$applyTo = function(arglist__7687) {
        var args = cljs.core.seq(arglist__7687);
        return G__7686__delegate(args)
      };
      G__7686.cljs$lang$arity$variadic = G__7686__delegate;
      return G__7686
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7688__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7688 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7688__delegate.call(this, args)
      };
      G__7688.cljs$lang$maxFixedArity = 0;
      G__7688.cljs$lang$applyTo = function(arglist__7689) {
        var args = cljs.core.seq(arglist__7689);
        return G__7688__delegate(args)
      };
      G__7688.cljs$lang$arity$variadic = G__7688__delegate;
      return G__7688
    }()
  };
  var partial__5 = function() {
    var G__7690__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7691__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7691 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7691__delegate.call(this, args)
        };
        G__7691.cljs$lang$maxFixedArity = 0;
        G__7691.cljs$lang$applyTo = function(arglist__7692) {
          var args = cljs.core.seq(arglist__7692);
          return G__7691__delegate(args)
        };
        G__7691.cljs$lang$arity$variadic = G__7691__delegate;
        return G__7691
      }()
    };
    var G__7690 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7690__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7690.cljs$lang$maxFixedArity = 4;
    G__7690.cljs$lang$applyTo = function(arglist__7693) {
      var f = cljs.core.first(arglist__7693);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7693));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7693)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7693))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7693))));
      return G__7690__delegate(f, arg1, arg2, arg3, more)
    };
    G__7690.cljs$lang$arity$variadic = G__7690__delegate;
    return G__7690
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7694 = null;
      var G__7694__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7694__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7694__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7694__4 = function() {
        var G__7695__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7695 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7695__delegate.call(this, a, b, c, ds)
        };
        G__7695.cljs$lang$maxFixedArity = 3;
        G__7695.cljs$lang$applyTo = function(arglist__7696) {
          var a = cljs.core.first(arglist__7696);
          var b = cljs.core.first(cljs.core.next(arglist__7696));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7696)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7696)));
          return G__7695__delegate(a, b, c, ds)
        };
        G__7695.cljs$lang$arity$variadic = G__7695__delegate;
        return G__7695
      }();
      G__7694 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7694__1.call(this, a);
          case 2:
            return G__7694__2.call(this, a, b);
          case 3:
            return G__7694__3.call(this, a, b, c);
          default:
            return G__7694__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7694.cljs$lang$maxFixedArity = 3;
      G__7694.cljs$lang$applyTo = G__7694__4.cljs$lang$applyTo;
      return G__7694
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7697 = null;
      var G__7697__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7697__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7697__4 = function() {
        var G__7698__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7698 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7698__delegate.call(this, a, b, c, ds)
        };
        G__7698.cljs$lang$maxFixedArity = 3;
        G__7698.cljs$lang$applyTo = function(arglist__7699) {
          var a = cljs.core.first(arglist__7699);
          var b = cljs.core.first(cljs.core.next(arglist__7699));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7699)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7699)));
          return G__7698__delegate(a, b, c, ds)
        };
        G__7698.cljs$lang$arity$variadic = G__7698__delegate;
        return G__7698
      }();
      G__7697 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7697__2.call(this, a, b);
          case 3:
            return G__7697__3.call(this, a, b, c);
          default:
            return G__7697__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7697.cljs$lang$maxFixedArity = 3;
      G__7697.cljs$lang$applyTo = G__7697__4.cljs$lang$applyTo;
      return G__7697
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7700 = null;
      var G__7700__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7700__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7700__4 = function() {
        var G__7701__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7701 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7701__delegate.call(this, a, b, c, ds)
        };
        G__7701.cljs$lang$maxFixedArity = 3;
        G__7701.cljs$lang$applyTo = function(arglist__7702) {
          var a = cljs.core.first(arglist__7702);
          var b = cljs.core.first(cljs.core.next(arglist__7702));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7702)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7702)));
          return G__7701__delegate(a, b, c, ds)
        };
        G__7701.cljs$lang$arity$variadic = G__7701__delegate;
        return G__7701
      }();
      G__7700 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7700__2.call(this, a, b);
          case 3:
            return G__7700__3.call(this, a, b, c);
          default:
            return G__7700__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7700.cljs$lang$maxFixedArity = 3;
      G__7700.cljs$lang$applyTo = G__7700__4.cljs$lang$applyTo;
      return G__7700
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
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7718 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7726 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7726) {
        var s__7727 = temp__3974__auto____7726;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7727)) {
          var c__7728 = cljs.core.chunk_first.call(null, s__7727);
          var size__7729 = cljs.core.count.call(null, c__7728);
          var b__7730 = cljs.core.chunk_buffer.call(null, size__7729);
          var n__2527__auto____7731 = size__7729;
          var i__7732 = 0;
          while(true) {
            if(i__7732 < n__2527__auto____7731) {
              cljs.core.chunk_append.call(null, b__7730, f.call(null, idx + i__7732, cljs.core._nth.call(null, c__7728, i__7732)));
              var G__7733 = i__7732 + 1;
              i__7732 = G__7733;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7730), mapi.call(null, idx + size__7729, cljs.core.chunk_rest.call(null, s__7727)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7727)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7727)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7718.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7743 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7743) {
      var s__7744 = temp__3974__auto____7743;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7744)) {
        var c__7745 = cljs.core.chunk_first.call(null, s__7744);
        var size__7746 = cljs.core.count.call(null, c__7745);
        var b__7747 = cljs.core.chunk_buffer.call(null, size__7746);
        var n__2527__auto____7748 = size__7746;
        var i__7749 = 0;
        while(true) {
          if(i__7749 < n__2527__auto____7748) {
            var x__7750 = f.call(null, cljs.core._nth.call(null, c__7745, i__7749));
            if(x__7750 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7747, x__7750)
            }
            var G__7752 = i__7749 + 1;
            i__7749 = G__7752;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7747), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7744)))
      }else {
        var x__7751 = f.call(null, cljs.core.first.call(null, s__7744));
        if(x__7751 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7744))
        }else {
          return cljs.core.cons.call(null, x__7751, keep.call(null, f, cljs.core.rest.call(null, s__7744)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7778 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7788 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7788) {
        var s__7789 = temp__3974__auto____7788;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7789)) {
          var c__7790 = cljs.core.chunk_first.call(null, s__7789);
          var size__7791 = cljs.core.count.call(null, c__7790);
          var b__7792 = cljs.core.chunk_buffer.call(null, size__7791);
          var n__2527__auto____7793 = size__7791;
          var i__7794 = 0;
          while(true) {
            if(i__7794 < n__2527__auto____7793) {
              var x__7795 = f.call(null, idx + i__7794, cljs.core._nth.call(null, c__7790, i__7794));
              if(x__7795 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7792, x__7795)
              }
              var G__7797 = i__7794 + 1;
              i__7794 = G__7797;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7792), keepi.call(null, idx + size__7791, cljs.core.chunk_rest.call(null, s__7789)))
        }else {
          var x__7796 = f.call(null, idx, cljs.core.first.call(null, s__7789));
          if(x__7796 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7789))
          }else {
            return cljs.core.cons.call(null, x__7796, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7789)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7778.call(null, 0, coll)
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
          var and__3822__auto____7883 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7883)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7883
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7884 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7884)) {
            var and__3822__auto____7885 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7885)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7885
            }
          }else {
            return and__3822__auto____7884
          }
        }())
      };
      var ep1__4 = function() {
        var G__7954__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7886 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7886)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7886
            }
          }())
        };
        var G__7954 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7954__delegate.call(this, x, y, z, args)
        };
        G__7954.cljs$lang$maxFixedArity = 3;
        G__7954.cljs$lang$applyTo = function(arglist__7955) {
          var x = cljs.core.first(arglist__7955);
          var y = cljs.core.first(cljs.core.next(arglist__7955));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7955)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7955)));
          return G__7954__delegate(x, y, z, args)
        };
        G__7954.cljs$lang$arity$variadic = G__7954__delegate;
        return G__7954
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
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
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
          var and__3822__auto____7898 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7898)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7898
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7899 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7899)) {
            var and__3822__auto____7900 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7900)) {
              var and__3822__auto____7901 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7901)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7901
              }
            }else {
              return and__3822__auto____7900
            }
          }else {
            return and__3822__auto____7899
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7902 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7902)) {
            var and__3822__auto____7903 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7903)) {
              var and__3822__auto____7904 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7904)) {
                var and__3822__auto____7905 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7905)) {
                  var and__3822__auto____7906 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7906)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7906
                  }
                }else {
                  return and__3822__auto____7905
                }
              }else {
                return and__3822__auto____7904
              }
            }else {
              return and__3822__auto____7903
            }
          }else {
            return and__3822__auto____7902
          }
        }())
      };
      var ep2__4 = function() {
        var G__7956__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7907 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7907)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7753_SHARP_) {
                var and__3822__auto____7908 = p1.call(null, p1__7753_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7908)) {
                  return p2.call(null, p1__7753_SHARP_)
                }else {
                  return and__3822__auto____7908
                }
              }, args)
            }else {
              return and__3822__auto____7907
            }
          }())
        };
        var G__7956 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7956__delegate.call(this, x, y, z, args)
        };
        G__7956.cljs$lang$maxFixedArity = 3;
        G__7956.cljs$lang$applyTo = function(arglist__7957) {
          var x = cljs.core.first(arglist__7957);
          var y = cljs.core.first(cljs.core.next(arglist__7957));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7957)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7957)));
          return G__7956__delegate(x, y, z, args)
        };
        G__7956.cljs$lang$arity$variadic = G__7956__delegate;
        return G__7956
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
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
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
          var and__3822__auto____7927 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7927)) {
            var and__3822__auto____7928 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7928)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7928
            }
          }else {
            return and__3822__auto____7927
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7929 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7929)) {
            var and__3822__auto____7930 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7930)) {
              var and__3822__auto____7931 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7931)) {
                var and__3822__auto____7932 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7932)) {
                  var and__3822__auto____7933 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7933)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7933
                  }
                }else {
                  return and__3822__auto____7932
                }
              }else {
                return and__3822__auto____7931
              }
            }else {
              return and__3822__auto____7930
            }
          }else {
            return and__3822__auto____7929
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7934 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7934)) {
            var and__3822__auto____7935 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7935)) {
              var and__3822__auto____7936 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7936)) {
                var and__3822__auto____7937 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7937)) {
                  var and__3822__auto____7938 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7938)) {
                    var and__3822__auto____7939 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7939)) {
                      var and__3822__auto____7940 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7940)) {
                        var and__3822__auto____7941 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7941)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7941
                        }
                      }else {
                        return and__3822__auto____7940
                      }
                    }else {
                      return and__3822__auto____7939
                    }
                  }else {
                    return and__3822__auto____7938
                  }
                }else {
                  return and__3822__auto____7937
                }
              }else {
                return and__3822__auto____7936
              }
            }else {
              return and__3822__auto____7935
            }
          }else {
            return and__3822__auto____7934
          }
        }())
      };
      var ep3__4 = function() {
        var G__7958__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7942 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7942)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7754_SHARP_) {
                var and__3822__auto____7943 = p1.call(null, p1__7754_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7943)) {
                  var and__3822__auto____7944 = p2.call(null, p1__7754_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7944)) {
                    return p3.call(null, p1__7754_SHARP_)
                  }else {
                    return and__3822__auto____7944
                  }
                }else {
                  return and__3822__auto____7943
                }
              }, args)
            }else {
              return and__3822__auto____7942
            }
          }())
        };
        var G__7958 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7958__delegate.call(this, x, y, z, args)
        };
        G__7958.cljs$lang$maxFixedArity = 3;
        G__7958.cljs$lang$applyTo = function(arglist__7959) {
          var x = cljs.core.first(arglist__7959);
          var y = cljs.core.first(cljs.core.next(arglist__7959));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7959)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7959)));
          return G__7958__delegate(x, y, z, args)
        };
        G__7958.cljs$lang$arity$variadic = G__7958__delegate;
        return G__7958
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
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7960__delegate = function(p1, p2, p3, ps) {
      var ps__7945 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7755_SHARP_) {
            return p1__7755_SHARP_.call(null, x)
          }, ps__7945)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7756_SHARP_) {
            var and__3822__auto____7950 = p1__7756_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7950)) {
              return p1__7756_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7950
            }
          }, ps__7945)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7757_SHARP_) {
            var and__3822__auto____7951 = p1__7757_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7951)) {
              var and__3822__auto____7952 = p1__7757_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7952)) {
                return p1__7757_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7952
              }
            }else {
              return and__3822__auto____7951
            }
          }, ps__7945)
        };
        var epn__4 = function() {
          var G__7961__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7953 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7953)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7758_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7758_SHARP_, args)
                }, ps__7945)
              }else {
                return and__3822__auto____7953
              }
            }())
          };
          var G__7961 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7961__delegate.call(this, x, y, z, args)
          };
          G__7961.cljs$lang$maxFixedArity = 3;
          G__7961.cljs$lang$applyTo = function(arglist__7962) {
            var x = cljs.core.first(arglist__7962);
            var y = cljs.core.first(cljs.core.next(arglist__7962));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7962)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7962)));
            return G__7961__delegate(x, y, z, args)
          };
          G__7961.cljs$lang$arity$variadic = G__7961__delegate;
          return G__7961
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
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7960 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7960__delegate.call(this, p1, p2, p3, ps)
    };
    G__7960.cljs$lang$maxFixedArity = 3;
    G__7960.cljs$lang$applyTo = function(arglist__7963) {
      var p1 = cljs.core.first(arglist__7963);
      var p2 = cljs.core.first(cljs.core.next(arglist__7963));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7963)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7963)));
      return G__7960__delegate(p1, p2, p3, ps)
    };
    G__7960.cljs$lang$arity$variadic = G__7960__delegate;
    return G__7960
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
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
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
        var or__3824__auto____8044 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8044)) {
          return or__3824__auto____8044
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____8045 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8045)) {
          return or__3824__auto____8045
        }else {
          var or__3824__auto____8046 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8046)) {
            return or__3824__auto____8046
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8115__delegate = function(x, y, z, args) {
          var or__3824__auto____8047 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8047)) {
            return or__3824__auto____8047
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8115 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8115__delegate.call(this, x, y, z, args)
        };
        G__8115.cljs$lang$maxFixedArity = 3;
        G__8115.cljs$lang$applyTo = function(arglist__8116) {
          var x = cljs.core.first(arglist__8116);
          var y = cljs.core.first(cljs.core.next(arglist__8116));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8116)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8116)));
          return G__8115__delegate(x, y, z, args)
        };
        G__8115.cljs$lang$arity$variadic = G__8115__delegate;
        return G__8115
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
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
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
        var or__3824__auto____8059 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8059)) {
          return or__3824__auto____8059
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____8060 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8060)) {
          return or__3824__auto____8060
        }else {
          var or__3824__auto____8061 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8061)) {
            return or__3824__auto____8061
          }else {
            var or__3824__auto____8062 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8062)) {
              return or__3824__auto____8062
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____8063 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8063)) {
          return or__3824__auto____8063
        }else {
          var or__3824__auto____8064 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8064)) {
            return or__3824__auto____8064
          }else {
            var or__3824__auto____8065 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____8065)) {
              return or__3824__auto____8065
            }else {
              var or__3824__auto____8066 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____8066)) {
                return or__3824__auto____8066
              }else {
                var or__3824__auto____8067 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8067)) {
                  return or__3824__auto____8067
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8117__delegate = function(x, y, z, args) {
          var or__3824__auto____8068 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8068)) {
            return or__3824__auto____8068
          }else {
            return cljs.core.some.call(null, function(p1__7798_SHARP_) {
              var or__3824__auto____8069 = p1.call(null, p1__7798_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8069)) {
                return or__3824__auto____8069
              }else {
                return p2.call(null, p1__7798_SHARP_)
              }
            }, args)
          }
        };
        var G__8117 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8117__delegate.call(this, x, y, z, args)
        };
        G__8117.cljs$lang$maxFixedArity = 3;
        G__8117.cljs$lang$applyTo = function(arglist__8118) {
          var x = cljs.core.first(arglist__8118);
          var y = cljs.core.first(cljs.core.next(arglist__8118));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8118)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8118)));
          return G__8117__delegate(x, y, z, args)
        };
        G__8117.cljs$lang$arity$variadic = G__8117__delegate;
        return G__8117
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
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
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
        var or__3824__auto____8088 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8088)) {
          return or__3824__auto____8088
        }else {
          var or__3824__auto____8089 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8089)) {
            return or__3824__auto____8089
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8090 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8090)) {
          return or__3824__auto____8090
        }else {
          var or__3824__auto____8091 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8091)) {
            return or__3824__auto____8091
          }else {
            var or__3824__auto____8092 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8092)) {
              return or__3824__auto____8092
            }else {
              var or__3824__auto____8093 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8093)) {
                return or__3824__auto____8093
              }else {
                var or__3824__auto____8094 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8094)) {
                  return or__3824__auto____8094
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8095 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8095)) {
          return or__3824__auto____8095
        }else {
          var or__3824__auto____8096 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8096)) {
            return or__3824__auto____8096
          }else {
            var or__3824__auto____8097 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8097)) {
              return or__3824__auto____8097
            }else {
              var or__3824__auto____8098 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8098)) {
                return or__3824__auto____8098
              }else {
                var or__3824__auto____8099 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8099)) {
                  return or__3824__auto____8099
                }else {
                  var or__3824__auto____8100 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8100)) {
                    return or__3824__auto____8100
                  }else {
                    var or__3824__auto____8101 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8101)) {
                      return or__3824__auto____8101
                    }else {
                      var or__3824__auto____8102 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8102)) {
                        return or__3824__auto____8102
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
        var G__8119__delegate = function(x, y, z, args) {
          var or__3824__auto____8103 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8103)) {
            return or__3824__auto____8103
          }else {
            return cljs.core.some.call(null, function(p1__7799_SHARP_) {
              var or__3824__auto____8104 = p1.call(null, p1__7799_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8104)) {
                return or__3824__auto____8104
              }else {
                var or__3824__auto____8105 = p2.call(null, p1__7799_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8105)) {
                  return or__3824__auto____8105
                }else {
                  return p3.call(null, p1__7799_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8119 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8119__delegate.call(this, x, y, z, args)
        };
        G__8119.cljs$lang$maxFixedArity = 3;
        G__8119.cljs$lang$applyTo = function(arglist__8120) {
          var x = cljs.core.first(arglist__8120);
          var y = cljs.core.first(cljs.core.next(arglist__8120));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8120)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8120)));
          return G__8119__delegate(x, y, z, args)
        };
        G__8119.cljs$lang$arity$variadic = G__8119__delegate;
        return G__8119
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
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8121__delegate = function(p1, p2, p3, ps) {
      var ps__8106 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7800_SHARP_) {
            return p1__7800_SHARP_.call(null, x)
          }, ps__8106)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7801_SHARP_) {
            var or__3824__auto____8111 = p1__7801_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8111)) {
              return or__3824__auto____8111
            }else {
              return p1__7801_SHARP_.call(null, y)
            }
          }, ps__8106)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7802_SHARP_) {
            var or__3824__auto____8112 = p1__7802_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8112)) {
              return or__3824__auto____8112
            }else {
              var or__3824__auto____8113 = p1__7802_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8113)) {
                return or__3824__auto____8113
              }else {
                return p1__7802_SHARP_.call(null, z)
              }
            }
          }, ps__8106)
        };
        var spn__4 = function() {
          var G__8122__delegate = function(x, y, z, args) {
            var or__3824__auto____8114 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8114)) {
              return or__3824__auto____8114
            }else {
              return cljs.core.some.call(null, function(p1__7803_SHARP_) {
                return cljs.core.some.call(null, p1__7803_SHARP_, args)
              }, ps__8106)
            }
          };
          var G__8122 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8122__delegate.call(this, x, y, z, args)
          };
          G__8122.cljs$lang$maxFixedArity = 3;
          G__8122.cljs$lang$applyTo = function(arglist__8123) {
            var x = cljs.core.first(arglist__8123);
            var y = cljs.core.first(cljs.core.next(arglist__8123));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8123)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8123)));
            return G__8122__delegate(x, y, z, args)
          };
          G__8122.cljs$lang$arity$variadic = G__8122__delegate;
          return G__8122
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
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8121 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8121__delegate.call(this, p1, p2, p3, ps)
    };
    G__8121.cljs$lang$maxFixedArity = 3;
    G__8121.cljs$lang$applyTo = function(arglist__8124) {
      var p1 = cljs.core.first(arglist__8124);
      var p2 = cljs.core.first(cljs.core.next(arglist__8124));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8124)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8124)));
      return G__8121__delegate(p1, p2, p3, ps)
    };
    G__8121.cljs$lang$arity$variadic = G__8121__delegate;
    return G__8121
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
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8143 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8143) {
        var s__8144 = temp__3974__auto____8143;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8144)) {
          var c__8145 = cljs.core.chunk_first.call(null, s__8144);
          var size__8146 = cljs.core.count.call(null, c__8145);
          var b__8147 = cljs.core.chunk_buffer.call(null, size__8146);
          var n__2527__auto____8148 = size__8146;
          var i__8149 = 0;
          while(true) {
            if(i__8149 < n__2527__auto____8148) {
              cljs.core.chunk_append.call(null, b__8147, f.call(null, cljs.core._nth.call(null, c__8145, i__8149)));
              var G__8161 = i__8149 + 1;
              i__8149 = G__8161;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8147), map.call(null, f, cljs.core.chunk_rest.call(null, s__8144)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8144)), map.call(null, f, cljs.core.rest.call(null, s__8144)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8150 = cljs.core.seq.call(null, c1);
      var s2__8151 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8152 = s1__8150;
        if(and__3822__auto____8152) {
          return s2__8151
        }else {
          return and__3822__auto____8152
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8150), cljs.core.first.call(null, s2__8151)), map.call(null, f, cljs.core.rest.call(null, s1__8150), cljs.core.rest.call(null, s2__8151)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8153 = cljs.core.seq.call(null, c1);
      var s2__8154 = cljs.core.seq.call(null, c2);
      var s3__8155 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8156 = s1__8153;
        if(and__3822__auto____8156) {
          var and__3822__auto____8157 = s2__8154;
          if(and__3822__auto____8157) {
            return s3__8155
          }else {
            return and__3822__auto____8157
          }
        }else {
          return and__3822__auto____8156
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8153), cljs.core.first.call(null, s2__8154), cljs.core.first.call(null, s3__8155)), map.call(null, f, cljs.core.rest.call(null, s1__8153), cljs.core.rest.call(null, s2__8154), cljs.core.rest.call(null, s3__8155)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8162__delegate = function(f, c1, c2, c3, colls) {
      var step__8160 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8159 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8159)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8159), step.call(null, map.call(null, cljs.core.rest, ss__8159)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7964_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7964_SHARP_)
      }, step__8160.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8162 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8162__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8162.cljs$lang$maxFixedArity = 4;
    G__8162.cljs$lang$applyTo = function(arglist__8163) {
      var f = cljs.core.first(arglist__8163);
      var c1 = cljs.core.first(cljs.core.next(arglist__8163));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8163)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8163))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8163))));
      return G__8162__delegate(f, c1, c2, c3, colls)
    };
    G__8162.cljs$lang$arity$variadic = G__8162__delegate;
    return G__8162
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
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8166 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8166) {
        var s__8167 = temp__3974__auto____8166;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8167), take.call(null, n - 1, cljs.core.rest.call(null, s__8167)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8173 = function(n, coll) {
    while(true) {
      var s__8171 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8172 = n > 0;
        if(and__3822__auto____8172) {
          return s__8171
        }else {
          return and__3822__auto____8172
        }
      }())) {
        var G__8174 = n - 1;
        var G__8175 = cljs.core.rest.call(null, s__8171);
        n = G__8174;
        coll = G__8175;
        continue
      }else {
        return s__8171
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8173.call(null, n, coll)
  }, null)
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
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8178 = cljs.core.seq.call(null, coll);
  var lead__8179 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8179) {
      var G__8180 = cljs.core.next.call(null, s__8178);
      var G__8181 = cljs.core.next.call(null, lead__8179);
      s__8178 = G__8180;
      lead__8179 = G__8181;
      continue
    }else {
      return s__8178
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8187 = function(pred, coll) {
    while(true) {
      var s__8185 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8186 = s__8185;
        if(and__3822__auto____8186) {
          return pred.call(null, cljs.core.first.call(null, s__8185))
        }else {
          return and__3822__auto____8186
        }
      }())) {
        var G__8188 = pred;
        var G__8189 = cljs.core.rest.call(null, s__8185);
        pred = G__8188;
        coll = G__8189;
        continue
      }else {
        return s__8185
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8187.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8192 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8192) {
      var s__8193 = temp__3974__auto____8192;
      return cljs.core.concat.call(null, s__8193, cycle.call(null, s__8193))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
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
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
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
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8198 = cljs.core.seq.call(null, c1);
      var s2__8199 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8200 = s1__8198;
        if(and__3822__auto____8200) {
          return s2__8199
        }else {
          return and__3822__auto____8200
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8198), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8199), interleave.call(null, cljs.core.rest.call(null, s1__8198), cljs.core.rest.call(null, s2__8199))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8202__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8201 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8201)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8201), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8201)))
        }else {
          return null
        }
      }, null)
    };
    var G__8202 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8202__delegate.call(this, c1, c2, colls)
    };
    G__8202.cljs$lang$maxFixedArity = 2;
    G__8202.cljs$lang$applyTo = function(arglist__8203) {
      var c1 = cljs.core.first(arglist__8203);
      var c2 = cljs.core.first(cljs.core.next(arglist__8203));
      var colls = cljs.core.rest(cljs.core.next(arglist__8203));
      return G__8202__delegate(c1, c2, colls)
    };
    G__8202.cljs$lang$arity$variadic = G__8202__delegate;
    return G__8202
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8213 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8211 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8211) {
        var coll__8212 = temp__3971__auto____8211;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8212), cat.call(null, cljs.core.rest.call(null, coll__8212), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8213.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8214__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8214 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8214__delegate.call(this, f, coll, colls)
    };
    G__8214.cljs$lang$maxFixedArity = 2;
    G__8214.cljs$lang$applyTo = function(arglist__8215) {
      var f = cljs.core.first(arglist__8215);
      var coll = cljs.core.first(cljs.core.next(arglist__8215));
      var colls = cljs.core.rest(cljs.core.next(arglist__8215));
      return G__8214__delegate(f, coll, colls)
    };
    G__8214.cljs$lang$arity$variadic = G__8214__delegate;
    return G__8214
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8225 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8225) {
      var s__8226 = temp__3974__auto____8225;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8226)) {
        var c__8227 = cljs.core.chunk_first.call(null, s__8226);
        var size__8228 = cljs.core.count.call(null, c__8227);
        var b__8229 = cljs.core.chunk_buffer.call(null, size__8228);
        var n__2527__auto____8230 = size__8228;
        var i__8231 = 0;
        while(true) {
          if(i__8231 < n__2527__auto____8230) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8227, i__8231)))) {
              cljs.core.chunk_append.call(null, b__8229, cljs.core._nth.call(null, c__8227, i__8231))
            }else {
            }
            var G__8234 = i__8231 + 1;
            i__8231 = G__8234;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8229), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8226)))
      }else {
        var f__8232 = cljs.core.first.call(null, s__8226);
        var r__8233 = cljs.core.rest.call(null, s__8226);
        if(cljs.core.truth_(pred.call(null, f__8232))) {
          return cljs.core.cons.call(null, f__8232, filter.call(null, pred, r__8233))
        }else {
          return filter.call(null, pred, r__8233)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8237 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8237.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8235_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8235_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8241__8242 = to;
    if(G__8241__8242) {
      if(function() {
        var or__3824__auto____8243 = G__8241__8242.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8243) {
          return or__3824__auto____8243
        }else {
          return G__8241__8242.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8241__8242.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8241__8242)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8241__8242)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
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
    var G__8244__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8244 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8244__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8244.cljs$lang$maxFixedArity = 4;
    G__8244.cljs$lang$applyTo = function(arglist__8245) {
      var f = cljs.core.first(arglist__8245);
      var c1 = cljs.core.first(cljs.core.next(arglist__8245));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8245)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8245))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8245))));
      return G__8244__delegate(f, c1, c2, c3, colls)
    };
    G__8244.cljs$lang$arity$variadic = G__8244__delegate;
    return G__8244
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
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
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
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8252 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8252) {
        var s__8253 = temp__3974__auto____8252;
        var p__8254 = cljs.core.take.call(null, n, s__8253);
        if(n === cljs.core.count.call(null, p__8254)) {
          return cljs.core.cons.call(null, p__8254, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8253)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8255 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8255) {
        var s__8256 = temp__3974__auto____8255;
        var p__8257 = cljs.core.take.call(null, n, s__8256);
        if(n === cljs.core.count.call(null, p__8257)) {
          return cljs.core.cons.call(null, p__8257, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8256)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8257, pad)))
        }
      }else {
        return null
      }
    }, null)
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
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8262 = cljs.core.lookup_sentinel;
    var m__8263 = m;
    var ks__8264 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8264) {
        var m__8265 = cljs.core._lookup.call(null, m__8263, cljs.core.first.call(null, ks__8264), sentinel__8262);
        if(sentinel__8262 === m__8265) {
          return not_found
        }else {
          var G__8266 = sentinel__8262;
          var G__8267 = m__8265;
          var G__8268 = cljs.core.next.call(null, ks__8264);
          sentinel__8262 = G__8266;
          m__8263 = G__8267;
          ks__8264 = G__8268;
          continue
        }
      }else {
        return m__8263
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
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8269, v) {
  var vec__8274__8275 = p__8269;
  var k__8276 = cljs.core.nth.call(null, vec__8274__8275, 0, null);
  var ks__8277 = cljs.core.nthnext.call(null, vec__8274__8275, 1);
  if(cljs.core.truth_(ks__8277)) {
    return cljs.core.assoc.call(null, m, k__8276, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8276, null), ks__8277, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8276, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8278, f, args) {
    var vec__8283__8284 = p__8278;
    var k__8285 = cljs.core.nth.call(null, vec__8283__8284, 0, null);
    var ks__8286 = cljs.core.nthnext.call(null, vec__8283__8284, 1);
    if(cljs.core.truth_(ks__8286)) {
      return cljs.core.assoc.call(null, m, k__8285, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8285, null), ks__8286, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8285, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8285, null), args))
    }
  };
  var update_in = function(m, p__8278, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8278, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8287) {
    var m = cljs.core.first(arglist__8287);
    var p__8278 = cljs.core.first(cljs.core.next(arglist__8287));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8287)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8287)));
    return update_in__delegate(m, p__8278, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8290 = this;
  var h__2192__auto____8291 = this__8290.__hash;
  if(!(h__2192__auto____8291 == null)) {
    return h__2192__auto____8291
  }else {
    var h__2192__auto____8292 = cljs.core.hash_coll.call(null, coll);
    this__8290.__hash = h__2192__auto____8292;
    return h__2192__auto____8292
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8293 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8294 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8295 = this;
  var new_array__8296 = this__8295.array.slice();
  new_array__8296[k] = v;
  return new cljs.core.Vector(this__8295.meta, new_array__8296, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8327 = null;
  var G__8327__2 = function(this_sym8297, k) {
    var this__8299 = this;
    var this_sym8297__8300 = this;
    var coll__8301 = this_sym8297__8300;
    return coll__8301.cljs$core$ILookup$_lookup$arity$2(coll__8301, k)
  };
  var G__8327__3 = function(this_sym8298, k, not_found) {
    var this__8299 = this;
    var this_sym8298__8302 = this;
    var coll__8303 = this_sym8298__8302;
    return coll__8303.cljs$core$ILookup$_lookup$arity$3(coll__8303, k, not_found)
  };
  G__8327 = function(this_sym8298, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8327__2.call(this, this_sym8298, k);
      case 3:
        return G__8327__3.call(this, this_sym8298, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8327
}();
cljs.core.Vector.prototype.apply = function(this_sym8288, args8289) {
  var this__8304 = this;
  return this_sym8288.call.apply(this_sym8288, [this_sym8288].concat(args8289.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8305 = this;
  var new_array__8306 = this__8305.array.slice();
  new_array__8306.push(o);
  return new cljs.core.Vector(this__8305.meta, new_array__8306, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8307 = this;
  var this__8308 = this;
  return cljs.core.pr_str.call(null, this__8308)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8309 = this;
  return cljs.core.ci_reduce.call(null, this__8309.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8310 = this;
  return cljs.core.ci_reduce.call(null, this__8310.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8311 = this;
  if(this__8311.array.length > 0) {
    var vector_seq__8312 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8311.array.length) {
          return cljs.core.cons.call(null, this__8311.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8312.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8313 = this;
  return this__8313.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8314 = this;
  var count__8315 = this__8314.array.length;
  if(count__8315 > 0) {
    return this__8314.array[count__8315 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8316 = this;
  if(this__8316.array.length > 0) {
    var new_array__8317 = this__8316.array.slice();
    new_array__8317.pop();
    return new cljs.core.Vector(this__8316.meta, new_array__8317, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8318 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8319 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8320 = this;
  return new cljs.core.Vector(meta, this__8320.array, this__8320.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8321 = this;
  return this__8321.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8322 = this;
  if(function() {
    var and__3822__auto____8323 = 0 <= n;
    if(and__3822__auto____8323) {
      return n < this__8322.array.length
    }else {
      return and__3822__auto____8323
    }
  }()) {
    return this__8322.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8324 = this;
  if(function() {
    var and__3822__auto____8325 = 0 <= n;
    if(and__3822__auto____8325) {
      return n < this__8324.array.length
    }else {
      return and__3822__auto____8325
    }
  }()) {
    return this__8324.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8326 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8326.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
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
  var cnt__8329 = pv.cnt;
  if(cnt__8329 < 32) {
    return 0
  }else {
    return cnt__8329 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8335 = level;
  var ret__8336 = node;
  while(true) {
    if(ll__8335 === 0) {
      return ret__8336
    }else {
      var embed__8337 = ret__8336;
      var r__8338 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8339 = cljs.core.pv_aset.call(null, r__8338, 0, embed__8337);
      var G__8340 = ll__8335 - 5;
      var G__8341 = r__8338;
      ll__8335 = G__8340;
      ret__8336 = G__8341;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8347 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8348 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8347, subidx__8348, tailnode);
    return ret__8347
  }else {
    var child__8349 = cljs.core.pv_aget.call(null, parent, subidx__8348);
    if(!(child__8349 == null)) {
      var node_to_insert__8350 = push_tail.call(null, pv, level - 5, child__8349, tailnode);
      cljs.core.pv_aset.call(null, ret__8347, subidx__8348, node_to_insert__8350);
      return ret__8347
    }else {
      var node_to_insert__8351 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8347, subidx__8348, node_to_insert__8351);
      return ret__8347
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8355 = 0 <= i;
    if(and__3822__auto____8355) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8355
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8356 = pv.root;
      var level__8357 = pv.shift;
      while(true) {
        if(level__8357 > 0) {
          var G__8358 = cljs.core.pv_aget.call(null, node__8356, i >>> level__8357 & 31);
          var G__8359 = level__8357 - 5;
          node__8356 = G__8358;
          level__8357 = G__8359;
          continue
        }else {
          return node__8356.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8362 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8362, i & 31, val);
    return ret__8362
  }else {
    var subidx__8363 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8362, subidx__8363, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8363), i, val));
    return ret__8362
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8369 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8370 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8369));
    if(function() {
      var and__3822__auto____8371 = new_child__8370 == null;
      if(and__3822__auto____8371) {
        return subidx__8369 === 0
      }else {
        return and__3822__auto____8371
      }
    }()) {
      return null
    }else {
      var ret__8372 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8372, subidx__8369, new_child__8370);
      return ret__8372
    }
  }else {
    if(subidx__8369 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8373 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8373, subidx__8369, null);
        return ret__8373
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
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8376 = this;
  return new cljs.core.TransientVector(this__8376.cnt, this__8376.shift, cljs.core.tv_editable_root.call(null, this__8376.root), cljs.core.tv_editable_tail.call(null, this__8376.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8377 = this;
  var h__2192__auto____8378 = this__8377.__hash;
  if(!(h__2192__auto____8378 == null)) {
    return h__2192__auto____8378
  }else {
    var h__2192__auto____8379 = cljs.core.hash_coll.call(null, coll);
    this__8377.__hash = h__2192__auto____8379;
    return h__2192__auto____8379
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8380 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8381 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8382 = this;
  if(function() {
    var and__3822__auto____8383 = 0 <= k;
    if(and__3822__auto____8383) {
      return k < this__8382.cnt
    }else {
      return and__3822__auto____8383
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8384 = this__8382.tail.slice();
      new_tail__8384[k & 31] = v;
      return new cljs.core.PersistentVector(this__8382.meta, this__8382.cnt, this__8382.shift, this__8382.root, new_tail__8384, null)
    }else {
      return new cljs.core.PersistentVector(this__8382.meta, this__8382.cnt, this__8382.shift, cljs.core.do_assoc.call(null, coll, this__8382.shift, this__8382.root, k, v), this__8382.tail, null)
    }
  }else {
    if(k === this__8382.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8382.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8432 = null;
  var G__8432__2 = function(this_sym8385, k) {
    var this__8387 = this;
    var this_sym8385__8388 = this;
    var coll__8389 = this_sym8385__8388;
    return coll__8389.cljs$core$ILookup$_lookup$arity$2(coll__8389, k)
  };
  var G__8432__3 = function(this_sym8386, k, not_found) {
    var this__8387 = this;
    var this_sym8386__8390 = this;
    var coll__8391 = this_sym8386__8390;
    return coll__8391.cljs$core$ILookup$_lookup$arity$3(coll__8391, k, not_found)
  };
  G__8432 = function(this_sym8386, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8432__2.call(this, this_sym8386, k);
      case 3:
        return G__8432__3.call(this, this_sym8386, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8432
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8374, args8375) {
  var this__8392 = this;
  return this_sym8374.call.apply(this_sym8374, [this_sym8374].concat(args8375.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8393 = this;
  var step_init__8394 = [0, init];
  var i__8395 = 0;
  while(true) {
    if(i__8395 < this__8393.cnt) {
      var arr__8396 = cljs.core.array_for.call(null, v, i__8395);
      var len__8397 = arr__8396.length;
      var init__8401 = function() {
        var j__8398 = 0;
        var init__8399 = step_init__8394[1];
        while(true) {
          if(j__8398 < len__8397) {
            var init__8400 = f.call(null, init__8399, j__8398 + i__8395, arr__8396[j__8398]);
            if(cljs.core.reduced_QMARK_.call(null, init__8400)) {
              return init__8400
            }else {
              var G__8433 = j__8398 + 1;
              var G__8434 = init__8400;
              j__8398 = G__8433;
              init__8399 = G__8434;
              continue
            }
          }else {
            step_init__8394[0] = len__8397;
            step_init__8394[1] = init__8399;
            return init__8399
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8401)) {
        return cljs.core.deref.call(null, init__8401)
      }else {
        var G__8435 = i__8395 + step_init__8394[0];
        i__8395 = G__8435;
        continue
      }
    }else {
      return step_init__8394[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8402 = this;
  if(this__8402.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8403 = this__8402.tail.slice();
    new_tail__8403.push(o);
    return new cljs.core.PersistentVector(this__8402.meta, this__8402.cnt + 1, this__8402.shift, this__8402.root, new_tail__8403, null)
  }else {
    var root_overflow_QMARK___8404 = this__8402.cnt >>> 5 > 1 << this__8402.shift;
    var new_shift__8405 = root_overflow_QMARK___8404 ? this__8402.shift + 5 : this__8402.shift;
    var new_root__8407 = root_overflow_QMARK___8404 ? function() {
      var n_r__8406 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8406, 0, this__8402.root);
      cljs.core.pv_aset.call(null, n_r__8406, 1, cljs.core.new_path.call(null, null, this__8402.shift, new cljs.core.VectorNode(null, this__8402.tail)));
      return n_r__8406
    }() : cljs.core.push_tail.call(null, coll, this__8402.shift, this__8402.root, new cljs.core.VectorNode(null, this__8402.tail));
    return new cljs.core.PersistentVector(this__8402.meta, this__8402.cnt + 1, new_shift__8405, new_root__8407, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8408 = this;
  if(this__8408.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8408.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8409 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8410 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8411 = this;
  var this__8412 = this;
  return cljs.core.pr_str.call(null, this__8412)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8413 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8414 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8415 = this;
  if(this__8415.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8416 = this;
  return this__8416.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8417 = this;
  if(this__8417.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8417.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8418 = this;
  if(this__8418.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8418.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8418.meta)
    }else {
      if(1 < this__8418.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8418.meta, this__8418.cnt - 1, this__8418.shift, this__8418.root, this__8418.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8419 = cljs.core.array_for.call(null, coll, this__8418.cnt - 2);
          var nr__8420 = cljs.core.pop_tail.call(null, coll, this__8418.shift, this__8418.root);
          var new_root__8421 = nr__8420 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8420;
          var cnt_1__8422 = this__8418.cnt - 1;
          if(function() {
            var and__3822__auto____8423 = 5 < this__8418.shift;
            if(and__3822__auto____8423) {
              return cljs.core.pv_aget.call(null, new_root__8421, 1) == null
            }else {
              return and__3822__auto____8423
            }
          }()) {
            return new cljs.core.PersistentVector(this__8418.meta, cnt_1__8422, this__8418.shift - 5, cljs.core.pv_aget.call(null, new_root__8421, 0), new_tail__8419, null)
          }else {
            return new cljs.core.PersistentVector(this__8418.meta, cnt_1__8422, this__8418.shift, new_root__8421, new_tail__8419, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8424 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8425 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8426 = this;
  return new cljs.core.PersistentVector(meta, this__8426.cnt, this__8426.shift, this__8426.root, this__8426.tail, this__8426.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8427 = this;
  return this__8427.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8428 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8429 = this;
  if(function() {
    var and__3822__auto____8430 = 0 <= n;
    if(and__3822__auto____8430) {
      return n < this__8429.cnt
    }else {
      return and__3822__auto____8430
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8431 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8431.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8436 = xs.length;
  var xs__8437 = no_clone === true ? xs : xs.slice();
  if(l__8436 < 32) {
    return new cljs.core.PersistentVector(null, l__8436, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8437, null)
  }else {
    var node__8438 = xs__8437.slice(0, 32);
    var v__8439 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8438, null);
    var i__8440 = 32;
    var out__8441 = cljs.core._as_transient.call(null, v__8439);
    while(true) {
      if(i__8440 < l__8436) {
        var G__8442 = i__8440 + 1;
        var G__8443 = cljs.core.conj_BANG_.call(null, out__8441, xs__8437[i__8440]);
        i__8440 = G__8442;
        out__8441 = G__8443;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8441)
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
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8444) {
    var args = cljs.core.seq(arglist__8444);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8445 = this;
  if(this__8445.off + 1 < this__8445.node.length) {
    var s__8446 = cljs.core.chunked_seq.call(null, this__8445.vec, this__8445.node, this__8445.i, this__8445.off + 1);
    if(s__8446 == null) {
      return null
    }else {
      return s__8446
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8447 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8448 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8449 = this;
  return this__8449.node[this__8449.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8450 = this;
  if(this__8450.off + 1 < this__8450.node.length) {
    var s__8451 = cljs.core.chunked_seq.call(null, this__8450.vec, this__8450.node, this__8450.i, this__8450.off + 1);
    if(s__8451 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8451
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8452 = this;
  var l__8453 = this__8452.node.length;
  var s__8454 = this__8452.i + l__8453 < cljs.core._count.call(null, this__8452.vec) ? cljs.core.chunked_seq.call(null, this__8452.vec, this__8452.i + l__8453, 0) : null;
  if(s__8454 == null) {
    return null
  }else {
    return s__8454
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8455 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8456 = this;
  return cljs.core.chunked_seq.call(null, this__8456.vec, this__8456.node, this__8456.i, this__8456.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8457 = this;
  return this__8457.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8458 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8458.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8459 = this;
  return cljs.core.array_chunk.call(null, this__8459.node, this__8459.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8460 = this;
  var l__8461 = this__8460.node.length;
  var s__8462 = this__8460.i + l__8461 < cljs.core._count.call(null, this__8460.vec) ? cljs.core.chunked_seq.call(null, this__8460.vec, this__8460.i + l__8461, 0) : null;
  if(s__8462 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8462
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
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
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
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
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8465 = this;
  var h__2192__auto____8466 = this__8465.__hash;
  if(!(h__2192__auto____8466 == null)) {
    return h__2192__auto____8466
  }else {
    var h__2192__auto____8467 = cljs.core.hash_coll.call(null, coll);
    this__8465.__hash = h__2192__auto____8467;
    return h__2192__auto____8467
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8468 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8469 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8470 = this;
  var v_pos__8471 = this__8470.start + key;
  return new cljs.core.Subvec(this__8470.meta, cljs.core._assoc.call(null, this__8470.v, v_pos__8471, val), this__8470.start, this__8470.end > v_pos__8471 + 1 ? this__8470.end : v_pos__8471 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8497 = null;
  var G__8497__2 = function(this_sym8472, k) {
    var this__8474 = this;
    var this_sym8472__8475 = this;
    var coll__8476 = this_sym8472__8475;
    return coll__8476.cljs$core$ILookup$_lookup$arity$2(coll__8476, k)
  };
  var G__8497__3 = function(this_sym8473, k, not_found) {
    var this__8474 = this;
    var this_sym8473__8477 = this;
    var coll__8478 = this_sym8473__8477;
    return coll__8478.cljs$core$ILookup$_lookup$arity$3(coll__8478, k, not_found)
  };
  G__8497 = function(this_sym8473, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8497__2.call(this, this_sym8473, k);
      case 3:
        return G__8497__3.call(this, this_sym8473, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8497
}();
cljs.core.Subvec.prototype.apply = function(this_sym8463, args8464) {
  var this__8479 = this;
  return this_sym8463.call.apply(this_sym8463, [this_sym8463].concat(args8464.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8480 = this;
  return new cljs.core.Subvec(this__8480.meta, cljs.core._assoc_n.call(null, this__8480.v, this__8480.end, o), this__8480.start, this__8480.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8481 = this;
  var this__8482 = this;
  return cljs.core.pr_str.call(null, this__8482)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8483 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8484 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8485 = this;
  var subvec_seq__8486 = function subvec_seq(i) {
    if(i === this__8485.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8485.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8486.call(null, this__8485.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8487 = this;
  return this__8487.end - this__8487.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8488 = this;
  return cljs.core._nth.call(null, this__8488.v, this__8488.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8489 = this;
  if(this__8489.start === this__8489.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8489.meta, this__8489.v, this__8489.start, this__8489.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8490 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8491 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8492 = this;
  return new cljs.core.Subvec(meta, this__8492.v, this__8492.start, this__8492.end, this__8492.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8493 = this;
  return this__8493.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8494 = this;
  return cljs.core._nth.call(null, this__8494.v, this__8494.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8495 = this;
  return cljs.core._nth.call(null, this__8495.v, this__8495.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8496 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8496.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
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
  var ret__8499 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8499, 0, tl.length);
  return ret__8499
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8503 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8504 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8503, subidx__8504, level === 5 ? tail_node : function() {
    var child__8505 = cljs.core.pv_aget.call(null, ret__8503, subidx__8504);
    if(!(child__8505 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8505, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8503
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8510 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8511 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8512 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8510, subidx__8511));
    if(function() {
      var and__3822__auto____8513 = new_child__8512 == null;
      if(and__3822__auto____8513) {
        return subidx__8511 === 0
      }else {
        return and__3822__auto____8513
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8510, subidx__8511, new_child__8512);
      return node__8510
    }
  }else {
    if(subidx__8511 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8510, subidx__8511, null);
        return node__8510
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8518 = 0 <= i;
    if(and__3822__auto____8518) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8518
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8519 = tv.root;
      var node__8520 = root__8519;
      var level__8521 = tv.shift;
      while(true) {
        if(level__8521 > 0) {
          var G__8522 = cljs.core.tv_ensure_editable.call(null, root__8519.edit, cljs.core.pv_aget.call(null, node__8520, i >>> level__8521 & 31));
          var G__8523 = level__8521 - 5;
          node__8520 = G__8522;
          level__8521 = G__8523;
          continue
        }else {
          return node__8520.arr
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
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8563 = null;
  var G__8563__2 = function(this_sym8526, k) {
    var this__8528 = this;
    var this_sym8526__8529 = this;
    var coll__8530 = this_sym8526__8529;
    return coll__8530.cljs$core$ILookup$_lookup$arity$2(coll__8530, k)
  };
  var G__8563__3 = function(this_sym8527, k, not_found) {
    var this__8528 = this;
    var this_sym8527__8531 = this;
    var coll__8532 = this_sym8527__8531;
    return coll__8532.cljs$core$ILookup$_lookup$arity$3(coll__8532, k, not_found)
  };
  G__8563 = function(this_sym8527, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8563__2.call(this, this_sym8527, k);
      case 3:
        return G__8563__3.call(this, this_sym8527, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8563
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8524, args8525) {
  var this__8533 = this;
  return this_sym8524.call.apply(this_sym8524, [this_sym8524].concat(args8525.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8534 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8535 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8536 = this;
  if(this__8536.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8537 = this;
  if(function() {
    var and__3822__auto____8538 = 0 <= n;
    if(and__3822__auto____8538) {
      return n < this__8537.cnt
    }else {
      return and__3822__auto____8538
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8539 = this;
  if(this__8539.root.edit) {
    return this__8539.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8540 = this;
  if(this__8540.root.edit) {
    if(function() {
      var and__3822__auto____8541 = 0 <= n;
      if(and__3822__auto____8541) {
        return n < this__8540.cnt
      }else {
        return and__3822__auto____8541
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8540.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8546 = function go(level, node) {
          var node__8544 = cljs.core.tv_ensure_editable.call(null, this__8540.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8544, n & 31, val);
            return node__8544
          }else {
            var subidx__8545 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8544, subidx__8545, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8544, subidx__8545)));
            return node__8544
          }
        }.call(null, this__8540.shift, this__8540.root);
        this__8540.root = new_root__8546;
        return tcoll
      }
    }else {
      if(n === this__8540.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8540.cnt)].join(""));
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
  var this__8547 = this;
  if(this__8547.root.edit) {
    if(this__8547.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8547.cnt) {
        this__8547.cnt = 0;
        return tcoll
      }else {
        if((this__8547.cnt - 1 & 31) > 0) {
          this__8547.cnt = this__8547.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8548 = cljs.core.editable_array_for.call(null, tcoll, this__8547.cnt - 2);
            var new_root__8550 = function() {
              var nr__8549 = cljs.core.tv_pop_tail.call(null, tcoll, this__8547.shift, this__8547.root);
              if(!(nr__8549 == null)) {
                return nr__8549
              }else {
                return new cljs.core.VectorNode(this__8547.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8551 = 5 < this__8547.shift;
              if(and__3822__auto____8551) {
                return cljs.core.pv_aget.call(null, new_root__8550, 1) == null
              }else {
                return and__3822__auto____8551
              }
            }()) {
              var new_root__8552 = cljs.core.tv_ensure_editable.call(null, this__8547.root.edit, cljs.core.pv_aget.call(null, new_root__8550, 0));
              this__8547.root = new_root__8552;
              this__8547.shift = this__8547.shift - 5;
              this__8547.cnt = this__8547.cnt - 1;
              this__8547.tail = new_tail__8548;
              return tcoll
            }else {
              this__8547.root = new_root__8550;
              this__8547.cnt = this__8547.cnt - 1;
              this__8547.tail = new_tail__8548;
              return tcoll
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
  var this__8553 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8554 = this;
  if(this__8554.root.edit) {
    if(this__8554.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8554.tail[this__8554.cnt & 31] = o;
      this__8554.cnt = this__8554.cnt + 1;
      return tcoll
    }else {
      var tail_node__8555 = new cljs.core.VectorNode(this__8554.root.edit, this__8554.tail);
      var new_tail__8556 = cljs.core.make_array.call(null, 32);
      new_tail__8556[0] = o;
      this__8554.tail = new_tail__8556;
      if(this__8554.cnt >>> 5 > 1 << this__8554.shift) {
        var new_root_array__8557 = cljs.core.make_array.call(null, 32);
        var new_shift__8558 = this__8554.shift + 5;
        new_root_array__8557[0] = this__8554.root;
        new_root_array__8557[1] = cljs.core.new_path.call(null, this__8554.root.edit, this__8554.shift, tail_node__8555);
        this__8554.root = new cljs.core.VectorNode(this__8554.root.edit, new_root_array__8557);
        this__8554.shift = new_shift__8558;
        this__8554.cnt = this__8554.cnt + 1;
        return tcoll
      }else {
        var new_root__8559 = cljs.core.tv_push_tail.call(null, tcoll, this__8554.shift, this__8554.root, tail_node__8555);
        this__8554.root = new_root__8559;
        this__8554.cnt = this__8554.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8560 = this;
  if(this__8560.root.edit) {
    this__8560.root.edit = null;
    var len__8561 = this__8560.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8562 = cljs.core.make_array.call(null, len__8561);
    cljs.core.array_copy.call(null, this__8560.tail, 0, trimmed_tail__8562, 0, len__8561);
    return new cljs.core.PersistentVector(null, this__8560.cnt, this__8560.shift, this__8560.root, trimmed_tail__8562, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8564 = this;
  var h__2192__auto____8565 = this__8564.__hash;
  if(!(h__2192__auto____8565 == null)) {
    return h__2192__auto____8565
  }else {
    var h__2192__auto____8566 = cljs.core.hash_coll.call(null, coll);
    this__8564.__hash = h__2192__auto____8566;
    return h__2192__auto____8566
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8567 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8568 = this;
  var this__8569 = this;
  return cljs.core.pr_str.call(null, this__8569)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8570 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8571 = this;
  return cljs.core._first.call(null, this__8571.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8572 = this;
  var temp__3971__auto____8573 = cljs.core.next.call(null, this__8572.front);
  if(temp__3971__auto____8573) {
    var f1__8574 = temp__3971__auto____8573;
    return new cljs.core.PersistentQueueSeq(this__8572.meta, f1__8574, this__8572.rear, null)
  }else {
    if(this__8572.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8572.meta, this__8572.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8575 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8576 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8576.front, this__8576.rear, this__8576.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8577 = this;
  return this__8577.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8578 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8578.meta)
};
cljs.core.PersistentQueueSeq;
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
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8579 = this;
  var h__2192__auto____8580 = this__8579.__hash;
  if(!(h__2192__auto____8580 == null)) {
    return h__2192__auto____8580
  }else {
    var h__2192__auto____8581 = cljs.core.hash_coll.call(null, coll);
    this__8579.__hash = h__2192__auto____8581;
    return h__2192__auto____8581
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8582 = this;
  if(cljs.core.truth_(this__8582.front)) {
    return new cljs.core.PersistentQueue(this__8582.meta, this__8582.count + 1, this__8582.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8583 = this__8582.rear;
      if(cljs.core.truth_(or__3824__auto____8583)) {
        return or__3824__auto____8583
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8582.meta, this__8582.count + 1, cljs.core.conj.call(null, this__8582.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8584 = this;
  var this__8585 = this;
  return cljs.core.pr_str.call(null, this__8585)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8586 = this;
  var rear__8587 = cljs.core.seq.call(null, this__8586.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8588 = this__8586.front;
    if(cljs.core.truth_(or__3824__auto____8588)) {
      return or__3824__auto____8588
    }else {
      return rear__8587
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8586.front, cljs.core.seq.call(null, rear__8587), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8589 = this;
  return this__8589.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8590 = this;
  return cljs.core._first.call(null, this__8590.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8591 = this;
  if(cljs.core.truth_(this__8591.front)) {
    var temp__3971__auto____8592 = cljs.core.next.call(null, this__8591.front);
    if(temp__3971__auto____8592) {
      var f1__8593 = temp__3971__auto____8592;
      return new cljs.core.PersistentQueue(this__8591.meta, this__8591.count - 1, f1__8593, this__8591.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8591.meta, this__8591.count - 1, cljs.core.seq.call(null, this__8591.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8594 = this;
  return cljs.core.first.call(null, this__8594.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8595 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8596 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8597 = this;
  return new cljs.core.PersistentQueue(meta, this__8597.count, this__8597.front, this__8597.rear, this__8597.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8598 = this;
  return this__8598.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8599 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8600 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8603 = array.length;
  var i__8604 = 0;
  while(true) {
    if(i__8604 < len__8603) {
      if(k === array[i__8604]) {
        return i__8604
      }else {
        var G__8605 = i__8604 + incr;
        i__8604 = G__8605;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8608 = cljs.core.hash.call(null, a);
  var b__8609 = cljs.core.hash.call(null, b);
  if(a__8608 < b__8609) {
    return-1
  }else {
    if(a__8608 > b__8609) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8617 = m.keys;
  var len__8618 = ks__8617.length;
  var so__8619 = m.strobj;
  var out__8620 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8621 = 0;
  var out__8622 = cljs.core.transient$.call(null, out__8620);
  while(true) {
    if(i__8621 < len__8618) {
      var k__8623 = ks__8617[i__8621];
      var G__8624 = i__8621 + 1;
      var G__8625 = cljs.core.assoc_BANG_.call(null, out__8622, k__8623, so__8619[k__8623]);
      i__8621 = G__8624;
      out__8622 = G__8625;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8622, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8631 = {};
  var l__8632 = ks.length;
  var i__8633 = 0;
  while(true) {
    if(i__8633 < l__8632) {
      var k__8634 = ks[i__8633];
      new_obj__8631[k__8634] = obj[k__8634];
      var G__8635 = i__8633 + 1;
      i__8633 = G__8635;
      continue
    }else {
    }
    break
  }
  return new_obj__8631
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8638 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8639 = this;
  var h__2192__auto____8640 = this__8639.__hash;
  if(!(h__2192__auto____8640 == null)) {
    return h__2192__auto____8640
  }else {
    var h__2192__auto____8641 = cljs.core.hash_imap.call(null, coll);
    this__8639.__hash = h__2192__auto____8641;
    return h__2192__auto____8641
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8642 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8643 = this;
  if(function() {
    var and__3822__auto____8644 = goog.isString(k);
    if(and__3822__auto____8644) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8643.keys) == null)
    }else {
      return and__3822__auto____8644
    }
  }()) {
    return this__8643.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8645 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8646 = this__8645.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8646) {
        return or__3824__auto____8646
      }else {
        return this__8645.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8645.keys) == null)) {
        var new_strobj__8647 = cljs.core.obj_clone.call(null, this__8645.strobj, this__8645.keys);
        new_strobj__8647[k] = v;
        return new cljs.core.ObjMap(this__8645.meta, this__8645.keys, new_strobj__8647, this__8645.update_count + 1, null)
      }else {
        var new_strobj__8648 = cljs.core.obj_clone.call(null, this__8645.strobj, this__8645.keys);
        var new_keys__8649 = this__8645.keys.slice();
        new_strobj__8648[k] = v;
        new_keys__8649.push(k);
        return new cljs.core.ObjMap(this__8645.meta, new_keys__8649, new_strobj__8648, this__8645.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8650 = this;
  if(function() {
    var and__3822__auto____8651 = goog.isString(k);
    if(and__3822__auto____8651) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8650.keys) == null)
    }else {
      return and__3822__auto____8651
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8673 = null;
  var G__8673__2 = function(this_sym8652, k) {
    var this__8654 = this;
    var this_sym8652__8655 = this;
    var coll__8656 = this_sym8652__8655;
    return coll__8656.cljs$core$ILookup$_lookup$arity$2(coll__8656, k)
  };
  var G__8673__3 = function(this_sym8653, k, not_found) {
    var this__8654 = this;
    var this_sym8653__8657 = this;
    var coll__8658 = this_sym8653__8657;
    return coll__8658.cljs$core$ILookup$_lookup$arity$3(coll__8658, k, not_found)
  };
  G__8673 = function(this_sym8653, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8673__2.call(this, this_sym8653, k);
      case 3:
        return G__8673__3.call(this, this_sym8653, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8673
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8636, args8637) {
  var this__8659 = this;
  return this_sym8636.call.apply(this_sym8636, [this_sym8636].concat(args8637.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8660 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8661 = this;
  var this__8662 = this;
  return cljs.core.pr_str.call(null, this__8662)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8663 = this;
  if(this__8663.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8626_SHARP_) {
      return cljs.core.vector.call(null, p1__8626_SHARP_, this__8663.strobj[p1__8626_SHARP_])
    }, this__8663.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8664 = this;
  return this__8664.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8665 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8666 = this;
  return new cljs.core.ObjMap(meta, this__8666.keys, this__8666.strobj, this__8666.update_count, this__8666.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8667 = this;
  return this__8667.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8668 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8668.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8669 = this;
  if(function() {
    var and__3822__auto____8670 = goog.isString(k);
    if(and__3822__auto____8670) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8669.keys) == null)
    }else {
      return and__3822__auto____8670
    }
  }()) {
    var new_keys__8671 = this__8669.keys.slice();
    var new_strobj__8672 = cljs.core.obj_clone.call(null, this__8669.strobj, this__8669.keys);
    new_keys__8671.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8671), 1);
    cljs.core.js_delete.call(null, new_strobj__8672, k);
    return new cljs.core.ObjMap(this__8669.meta, new_keys__8671, new_strobj__8672, this__8669.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8677 = this;
  var h__2192__auto____8678 = this__8677.__hash;
  if(!(h__2192__auto____8678 == null)) {
    return h__2192__auto____8678
  }else {
    var h__2192__auto____8679 = cljs.core.hash_imap.call(null, coll);
    this__8677.__hash = h__2192__auto____8679;
    return h__2192__auto____8679
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8680 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8681 = this;
  var bucket__8682 = this__8681.hashobj[cljs.core.hash.call(null, k)];
  var i__8683 = cljs.core.truth_(bucket__8682) ? cljs.core.scan_array.call(null, 2, k, bucket__8682) : null;
  if(cljs.core.truth_(i__8683)) {
    return bucket__8682[i__8683 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8684 = this;
  var h__8685 = cljs.core.hash.call(null, k);
  var bucket__8686 = this__8684.hashobj[h__8685];
  if(cljs.core.truth_(bucket__8686)) {
    var new_bucket__8687 = bucket__8686.slice();
    var new_hashobj__8688 = goog.object.clone(this__8684.hashobj);
    new_hashobj__8688[h__8685] = new_bucket__8687;
    var temp__3971__auto____8689 = cljs.core.scan_array.call(null, 2, k, new_bucket__8687);
    if(cljs.core.truth_(temp__3971__auto____8689)) {
      var i__8690 = temp__3971__auto____8689;
      new_bucket__8687[i__8690 + 1] = v;
      return new cljs.core.HashMap(this__8684.meta, this__8684.count, new_hashobj__8688, null)
    }else {
      new_bucket__8687.push(k, v);
      return new cljs.core.HashMap(this__8684.meta, this__8684.count + 1, new_hashobj__8688, null)
    }
  }else {
    var new_hashobj__8691 = goog.object.clone(this__8684.hashobj);
    new_hashobj__8691[h__8685] = [k, v];
    return new cljs.core.HashMap(this__8684.meta, this__8684.count + 1, new_hashobj__8691, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8692 = this;
  var bucket__8693 = this__8692.hashobj[cljs.core.hash.call(null, k)];
  var i__8694 = cljs.core.truth_(bucket__8693) ? cljs.core.scan_array.call(null, 2, k, bucket__8693) : null;
  if(cljs.core.truth_(i__8694)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8719 = null;
  var G__8719__2 = function(this_sym8695, k) {
    var this__8697 = this;
    var this_sym8695__8698 = this;
    var coll__8699 = this_sym8695__8698;
    return coll__8699.cljs$core$ILookup$_lookup$arity$2(coll__8699, k)
  };
  var G__8719__3 = function(this_sym8696, k, not_found) {
    var this__8697 = this;
    var this_sym8696__8700 = this;
    var coll__8701 = this_sym8696__8700;
    return coll__8701.cljs$core$ILookup$_lookup$arity$3(coll__8701, k, not_found)
  };
  G__8719 = function(this_sym8696, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8719__2.call(this, this_sym8696, k);
      case 3:
        return G__8719__3.call(this, this_sym8696, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8719
}();
cljs.core.HashMap.prototype.apply = function(this_sym8675, args8676) {
  var this__8702 = this;
  return this_sym8675.call.apply(this_sym8675, [this_sym8675].concat(args8676.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8703 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8704 = this;
  var this__8705 = this;
  return cljs.core.pr_str.call(null, this__8705)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8706 = this;
  if(this__8706.count > 0) {
    var hashes__8707 = cljs.core.js_keys.call(null, this__8706.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8674_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8706.hashobj[p1__8674_SHARP_]))
    }, hashes__8707)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8708 = this;
  return this__8708.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8709 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8710 = this;
  return new cljs.core.HashMap(meta, this__8710.count, this__8710.hashobj, this__8710.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8711 = this;
  return this__8711.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8712 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8712.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8713 = this;
  var h__8714 = cljs.core.hash.call(null, k);
  var bucket__8715 = this__8713.hashobj[h__8714];
  var i__8716 = cljs.core.truth_(bucket__8715) ? cljs.core.scan_array.call(null, 2, k, bucket__8715) : null;
  if(cljs.core.not.call(null, i__8716)) {
    return coll
  }else {
    var new_hashobj__8717 = goog.object.clone(this__8713.hashobj);
    if(3 > bucket__8715.length) {
      cljs.core.js_delete.call(null, new_hashobj__8717, h__8714)
    }else {
      var new_bucket__8718 = bucket__8715.slice();
      new_bucket__8718.splice(i__8716, 2);
      new_hashobj__8717[h__8714] = new_bucket__8718
    }
    return new cljs.core.HashMap(this__8713.meta, this__8713.count - 1, new_hashobj__8717, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8720 = ks.length;
  var i__8721 = 0;
  var out__8722 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8721 < len__8720) {
      var G__8723 = i__8721 + 1;
      var G__8724 = cljs.core.assoc.call(null, out__8722, ks[i__8721], vs[i__8721]);
      i__8721 = G__8723;
      out__8722 = G__8724;
      continue
    }else {
      return out__8722
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8728 = m.arr;
  var len__8729 = arr__8728.length;
  var i__8730 = 0;
  while(true) {
    if(len__8729 <= i__8730) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8728[i__8730], k)) {
        return i__8730
      }else {
        if("\ufdd0'else") {
          var G__8731 = i__8730 + 2;
          i__8730 = G__8731;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8734 = this;
  return new cljs.core.TransientArrayMap({}, this__8734.arr.length, this__8734.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8735 = this;
  var h__2192__auto____8736 = this__8735.__hash;
  if(!(h__2192__auto____8736 == null)) {
    return h__2192__auto____8736
  }else {
    var h__2192__auto____8737 = cljs.core.hash_imap.call(null, coll);
    this__8735.__hash = h__2192__auto____8737;
    return h__2192__auto____8737
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8738 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8739 = this;
  var idx__8740 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8740 === -1) {
    return not_found
  }else {
    return this__8739.arr[idx__8740 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8741 = this;
  var idx__8742 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8742 === -1) {
    if(this__8741.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8741.meta, this__8741.cnt + 1, function() {
        var G__8743__8744 = this__8741.arr.slice();
        G__8743__8744.push(k);
        G__8743__8744.push(v);
        return G__8743__8744
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8741.arr[idx__8742 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8741.meta, this__8741.cnt, function() {
          var G__8745__8746 = this__8741.arr.slice();
          G__8745__8746[idx__8742 + 1] = v;
          return G__8745__8746
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8747 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8779 = null;
  var G__8779__2 = function(this_sym8748, k) {
    var this__8750 = this;
    var this_sym8748__8751 = this;
    var coll__8752 = this_sym8748__8751;
    return coll__8752.cljs$core$ILookup$_lookup$arity$2(coll__8752, k)
  };
  var G__8779__3 = function(this_sym8749, k, not_found) {
    var this__8750 = this;
    var this_sym8749__8753 = this;
    var coll__8754 = this_sym8749__8753;
    return coll__8754.cljs$core$ILookup$_lookup$arity$3(coll__8754, k, not_found)
  };
  G__8779 = function(this_sym8749, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8779__2.call(this, this_sym8749, k);
      case 3:
        return G__8779__3.call(this, this_sym8749, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8779
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8732, args8733) {
  var this__8755 = this;
  return this_sym8732.call.apply(this_sym8732, [this_sym8732].concat(args8733.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8756 = this;
  var len__8757 = this__8756.arr.length;
  var i__8758 = 0;
  var init__8759 = init;
  while(true) {
    if(i__8758 < len__8757) {
      var init__8760 = f.call(null, init__8759, this__8756.arr[i__8758], this__8756.arr[i__8758 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8760)) {
        return cljs.core.deref.call(null, init__8760)
      }else {
        var G__8780 = i__8758 + 2;
        var G__8781 = init__8760;
        i__8758 = G__8780;
        init__8759 = G__8781;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8761 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8762 = this;
  var this__8763 = this;
  return cljs.core.pr_str.call(null, this__8763)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8764 = this;
  if(this__8764.cnt > 0) {
    var len__8765 = this__8764.arr.length;
    var array_map_seq__8766 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8765) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8764.arr[i], this__8764.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8766.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8767 = this;
  return this__8767.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8768 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8769 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8769.cnt, this__8769.arr, this__8769.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8770 = this;
  return this__8770.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8771 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8771.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8772 = this;
  var idx__8773 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8773 >= 0) {
    var len__8774 = this__8772.arr.length;
    var new_len__8775 = len__8774 - 2;
    if(new_len__8775 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8776 = cljs.core.make_array.call(null, new_len__8775);
      var s__8777 = 0;
      var d__8778 = 0;
      while(true) {
        if(s__8777 >= len__8774) {
          return new cljs.core.PersistentArrayMap(this__8772.meta, this__8772.cnt - 1, new_arr__8776, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8772.arr[s__8777])) {
            var G__8782 = s__8777 + 2;
            var G__8783 = d__8778;
            s__8777 = G__8782;
            d__8778 = G__8783;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8776[d__8778] = this__8772.arr[s__8777];
              new_arr__8776[d__8778 + 1] = this__8772.arr[s__8777 + 1];
              var G__8784 = s__8777 + 2;
              var G__8785 = d__8778 + 2;
              s__8777 = G__8784;
              d__8778 = G__8785;
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
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8786 = cljs.core.count.call(null, ks);
  var i__8787 = 0;
  var out__8788 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8787 < len__8786) {
      var G__8789 = i__8787 + 1;
      var G__8790 = cljs.core.assoc_BANG_.call(null, out__8788, ks[i__8787], vs[i__8787]);
      i__8787 = G__8789;
      out__8788 = G__8790;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8788)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8791 = this;
  if(cljs.core.truth_(this__8791.editable_QMARK_)) {
    var idx__8792 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8792 >= 0) {
      this__8791.arr[idx__8792] = this__8791.arr[this__8791.len - 2];
      this__8791.arr[idx__8792 + 1] = this__8791.arr[this__8791.len - 1];
      var G__8793__8794 = this__8791.arr;
      G__8793__8794.pop();
      G__8793__8794.pop();
      G__8793__8794;
      this__8791.len = this__8791.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8795 = this;
  if(cljs.core.truth_(this__8795.editable_QMARK_)) {
    var idx__8796 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8796 === -1) {
      if(this__8795.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8795.len = this__8795.len + 2;
        this__8795.arr.push(key);
        this__8795.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8795.len, this__8795.arr), key, val)
      }
    }else {
      if(val === this__8795.arr[idx__8796 + 1]) {
        return tcoll
      }else {
        this__8795.arr[idx__8796 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8797 = this;
  if(cljs.core.truth_(this__8797.editable_QMARK_)) {
    if(function() {
      var G__8798__8799 = o;
      if(G__8798__8799) {
        if(function() {
          var or__3824__auto____8800 = G__8798__8799.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8800) {
            return or__3824__auto____8800
          }else {
            return G__8798__8799.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8798__8799.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8798__8799)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8798__8799)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8801 = cljs.core.seq.call(null, o);
      var tcoll__8802 = tcoll;
      while(true) {
        var temp__3971__auto____8803 = cljs.core.first.call(null, es__8801);
        if(cljs.core.truth_(temp__3971__auto____8803)) {
          var e__8804 = temp__3971__auto____8803;
          var G__8810 = cljs.core.next.call(null, es__8801);
          var G__8811 = tcoll__8802.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8802, cljs.core.key.call(null, e__8804), cljs.core.val.call(null, e__8804));
          es__8801 = G__8810;
          tcoll__8802 = G__8811;
          continue
        }else {
          return tcoll__8802
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8805 = this;
  if(cljs.core.truth_(this__8805.editable_QMARK_)) {
    this__8805.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8805.len, 2), this__8805.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8806 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8807 = this;
  if(cljs.core.truth_(this__8807.editable_QMARK_)) {
    var idx__8808 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8808 === -1) {
      return not_found
    }else {
      return this__8807.arr[idx__8808 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8809 = this;
  if(cljs.core.truth_(this__8809.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8809.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8814 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8815 = 0;
  while(true) {
    if(i__8815 < len) {
      var G__8816 = cljs.core.assoc_BANG_.call(null, out__8814, arr[i__8815], arr[i__8815 + 1]);
      var G__8817 = i__8815 + 2;
      out__8814 = G__8816;
      i__8815 = G__8817;
      continue
    }else {
      return out__8814
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2310__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8822__8823 = arr.slice();
    G__8822__8823[i] = a;
    return G__8822__8823
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8824__8825 = arr.slice();
    G__8824__8825[i] = a;
    G__8824__8825[j] = b;
    return G__8824__8825
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8827 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8827, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8827, 2 * i, new_arr__8827.length - 2 * i);
  return new_arr__8827
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
    var editable__8830 = inode.ensure_editable(edit);
    editable__8830.arr[i] = a;
    return editable__8830
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8831 = inode.ensure_editable(edit);
    editable__8831.arr[i] = a;
    editable__8831.arr[j] = b;
    return editable__8831
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8838 = arr.length;
  var i__8839 = 0;
  var init__8840 = init;
  while(true) {
    if(i__8839 < len__8838) {
      var init__8843 = function() {
        var k__8841 = arr[i__8839];
        if(!(k__8841 == null)) {
          return f.call(null, init__8840, k__8841, arr[i__8839 + 1])
        }else {
          var node__8842 = arr[i__8839 + 1];
          if(!(node__8842 == null)) {
            return node__8842.kv_reduce(f, init__8840)
          }else {
            return init__8840
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8843)) {
        return cljs.core.deref.call(null, init__8843)
      }else {
        var G__8844 = i__8839 + 2;
        var G__8845 = init__8843;
        i__8839 = G__8844;
        init__8840 = G__8845;
        continue
      }
    }else {
      return init__8840
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
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8846 = this;
  var inode__8847 = this;
  if(this__8846.bitmap === bit) {
    return null
  }else {
    var editable__8848 = inode__8847.ensure_editable(e);
    var earr__8849 = editable__8848.arr;
    var len__8850 = earr__8849.length;
    editable__8848.bitmap = bit ^ editable__8848.bitmap;
    cljs.core.array_copy.call(null, earr__8849, 2 * (i + 1), earr__8849, 2 * i, len__8850 - 2 * (i + 1));
    earr__8849[len__8850 - 2] = null;
    earr__8849[len__8850 - 1] = null;
    return editable__8848
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8851 = this;
  var inode__8852 = this;
  var bit__8853 = 1 << (hash >>> shift & 31);
  var idx__8854 = cljs.core.bitmap_indexed_node_index.call(null, this__8851.bitmap, bit__8853);
  if((this__8851.bitmap & bit__8853) === 0) {
    var n__8855 = cljs.core.bit_count.call(null, this__8851.bitmap);
    if(2 * n__8855 < this__8851.arr.length) {
      var editable__8856 = inode__8852.ensure_editable(edit);
      var earr__8857 = editable__8856.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8857, 2 * idx__8854, earr__8857, 2 * (idx__8854 + 1), 2 * (n__8855 - idx__8854));
      earr__8857[2 * idx__8854] = key;
      earr__8857[2 * idx__8854 + 1] = val;
      editable__8856.bitmap = editable__8856.bitmap | bit__8853;
      return editable__8856
    }else {
      if(n__8855 >= 16) {
        var nodes__8858 = cljs.core.make_array.call(null, 32);
        var jdx__8859 = hash >>> shift & 31;
        nodes__8858[jdx__8859] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8860 = 0;
        var j__8861 = 0;
        while(true) {
          if(i__8860 < 32) {
            if((this__8851.bitmap >>> i__8860 & 1) === 0) {
              var G__8914 = i__8860 + 1;
              var G__8915 = j__8861;
              i__8860 = G__8914;
              j__8861 = G__8915;
              continue
            }else {
              nodes__8858[i__8860] = !(this__8851.arr[j__8861] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8851.arr[j__8861]), this__8851.arr[j__8861], this__8851.arr[j__8861 + 1], added_leaf_QMARK_) : this__8851.arr[j__8861 + 1];
              var G__8916 = i__8860 + 1;
              var G__8917 = j__8861 + 2;
              i__8860 = G__8916;
              j__8861 = G__8917;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8855 + 1, nodes__8858)
      }else {
        if("\ufdd0'else") {
          var new_arr__8862 = cljs.core.make_array.call(null, 2 * (n__8855 + 4));
          cljs.core.array_copy.call(null, this__8851.arr, 0, new_arr__8862, 0, 2 * idx__8854);
          new_arr__8862[2 * idx__8854] = key;
          new_arr__8862[2 * idx__8854 + 1] = val;
          cljs.core.array_copy.call(null, this__8851.arr, 2 * idx__8854, new_arr__8862, 2 * (idx__8854 + 1), 2 * (n__8855 - idx__8854));
          added_leaf_QMARK_.val = true;
          var editable__8863 = inode__8852.ensure_editable(edit);
          editable__8863.arr = new_arr__8862;
          editable__8863.bitmap = editable__8863.bitmap | bit__8853;
          return editable__8863
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8864 = this__8851.arr[2 * idx__8854];
    var val_or_node__8865 = this__8851.arr[2 * idx__8854 + 1];
    if(key_or_nil__8864 == null) {
      var n__8866 = val_or_node__8865.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8866 === val_or_node__8865) {
        return inode__8852
      }else {
        return cljs.core.edit_and_set.call(null, inode__8852, edit, 2 * idx__8854 + 1, n__8866)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8864)) {
        if(val === val_or_node__8865) {
          return inode__8852
        }else {
          return cljs.core.edit_and_set.call(null, inode__8852, edit, 2 * idx__8854 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8852, edit, 2 * idx__8854, null, 2 * idx__8854 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8864, val_or_node__8865, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8867 = this;
  var inode__8868 = this;
  return cljs.core.create_inode_seq.call(null, this__8867.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8869 = this;
  var inode__8870 = this;
  var bit__8871 = 1 << (hash >>> shift & 31);
  if((this__8869.bitmap & bit__8871) === 0) {
    return inode__8870
  }else {
    var idx__8872 = cljs.core.bitmap_indexed_node_index.call(null, this__8869.bitmap, bit__8871);
    var key_or_nil__8873 = this__8869.arr[2 * idx__8872];
    var val_or_node__8874 = this__8869.arr[2 * idx__8872 + 1];
    if(key_or_nil__8873 == null) {
      var n__8875 = val_or_node__8874.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8875 === val_or_node__8874) {
        return inode__8870
      }else {
        if(!(n__8875 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8870, edit, 2 * idx__8872 + 1, n__8875)
        }else {
          if(this__8869.bitmap === bit__8871) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8870.edit_and_remove_pair(edit, bit__8871, idx__8872)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8873)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8870.edit_and_remove_pair(edit, bit__8871, idx__8872)
      }else {
        if("\ufdd0'else") {
          return inode__8870
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8876 = this;
  var inode__8877 = this;
  if(e === this__8876.edit) {
    return inode__8877
  }else {
    var n__8878 = cljs.core.bit_count.call(null, this__8876.bitmap);
    var new_arr__8879 = cljs.core.make_array.call(null, n__8878 < 0 ? 4 : 2 * (n__8878 + 1));
    cljs.core.array_copy.call(null, this__8876.arr, 0, new_arr__8879, 0, 2 * n__8878);
    return new cljs.core.BitmapIndexedNode(e, this__8876.bitmap, new_arr__8879)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8880 = this;
  var inode__8881 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8880.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8882 = this;
  var inode__8883 = this;
  var bit__8884 = 1 << (hash >>> shift & 31);
  if((this__8882.bitmap & bit__8884) === 0) {
    return not_found
  }else {
    var idx__8885 = cljs.core.bitmap_indexed_node_index.call(null, this__8882.bitmap, bit__8884);
    var key_or_nil__8886 = this__8882.arr[2 * idx__8885];
    var val_or_node__8887 = this__8882.arr[2 * idx__8885 + 1];
    if(key_or_nil__8886 == null) {
      return val_or_node__8887.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8886)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8886, val_or_node__8887], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8888 = this;
  var inode__8889 = this;
  var bit__8890 = 1 << (hash >>> shift & 31);
  if((this__8888.bitmap & bit__8890) === 0) {
    return inode__8889
  }else {
    var idx__8891 = cljs.core.bitmap_indexed_node_index.call(null, this__8888.bitmap, bit__8890);
    var key_or_nil__8892 = this__8888.arr[2 * idx__8891];
    var val_or_node__8893 = this__8888.arr[2 * idx__8891 + 1];
    if(key_or_nil__8892 == null) {
      var n__8894 = val_or_node__8893.inode_without(shift + 5, hash, key);
      if(n__8894 === val_or_node__8893) {
        return inode__8889
      }else {
        if(!(n__8894 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8888.bitmap, cljs.core.clone_and_set.call(null, this__8888.arr, 2 * idx__8891 + 1, n__8894))
        }else {
          if(this__8888.bitmap === bit__8890) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8888.bitmap ^ bit__8890, cljs.core.remove_pair.call(null, this__8888.arr, idx__8891))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8892)) {
        return new cljs.core.BitmapIndexedNode(null, this__8888.bitmap ^ bit__8890, cljs.core.remove_pair.call(null, this__8888.arr, idx__8891))
      }else {
        if("\ufdd0'else") {
          return inode__8889
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8895 = this;
  var inode__8896 = this;
  var bit__8897 = 1 << (hash >>> shift & 31);
  var idx__8898 = cljs.core.bitmap_indexed_node_index.call(null, this__8895.bitmap, bit__8897);
  if((this__8895.bitmap & bit__8897) === 0) {
    var n__8899 = cljs.core.bit_count.call(null, this__8895.bitmap);
    if(n__8899 >= 16) {
      var nodes__8900 = cljs.core.make_array.call(null, 32);
      var jdx__8901 = hash >>> shift & 31;
      nodes__8900[jdx__8901] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8902 = 0;
      var j__8903 = 0;
      while(true) {
        if(i__8902 < 32) {
          if((this__8895.bitmap >>> i__8902 & 1) === 0) {
            var G__8918 = i__8902 + 1;
            var G__8919 = j__8903;
            i__8902 = G__8918;
            j__8903 = G__8919;
            continue
          }else {
            nodes__8900[i__8902] = !(this__8895.arr[j__8903] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8895.arr[j__8903]), this__8895.arr[j__8903], this__8895.arr[j__8903 + 1], added_leaf_QMARK_) : this__8895.arr[j__8903 + 1];
            var G__8920 = i__8902 + 1;
            var G__8921 = j__8903 + 2;
            i__8902 = G__8920;
            j__8903 = G__8921;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8899 + 1, nodes__8900)
    }else {
      var new_arr__8904 = cljs.core.make_array.call(null, 2 * (n__8899 + 1));
      cljs.core.array_copy.call(null, this__8895.arr, 0, new_arr__8904, 0, 2 * idx__8898);
      new_arr__8904[2 * idx__8898] = key;
      new_arr__8904[2 * idx__8898 + 1] = val;
      cljs.core.array_copy.call(null, this__8895.arr, 2 * idx__8898, new_arr__8904, 2 * (idx__8898 + 1), 2 * (n__8899 - idx__8898));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8895.bitmap | bit__8897, new_arr__8904)
    }
  }else {
    var key_or_nil__8905 = this__8895.arr[2 * idx__8898];
    var val_or_node__8906 = this__8895.arr[2 * idx__8898 + 1];
    if(key_or_nil__8905 == null) {
      var n__8907 = val_or_node__8906.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8907 === val_or_node__8906) {
        return inode__8896
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8895.bitmap, cljs.core.clone_and_set.call(null, this__8895.arr, 2 * idx__8898 + 1, n__8907))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8905)) {
        if(val === val_or_node__8906) {
          return inode__8896
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8895.bitmap, cljs.core.clone_and_set.call(null, this__8895.arr, 2 * idx__8898 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8895.bitmap, cljs.core.clone_and_set.call(null, this__8895.arr, 2 * idx__8898, null, 2 * idx__8898 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8905, val_or_node__8906, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8908 = this;
  var inode__8909 = this;
  var bit__8910 = 1 << (hash >>> shift & 31);
  if((this__8908.bitmap & bit__8910) === 0) {
    return not_found
  }else {
    var idx__8911 = cljs.core.bitmap_indexed_node_index.call(null, this__8908.bitmap, bit__8910);
    var key_or_nil__8912 = this__8908.arr[2 * idx__8911];
    var val_or_node__8913 = this__8908.arr[2 * idx__8911 + 1];
    if(key_or_nil__8912 == null) {
      return val_or_node__8913.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8912)) {
        return val_or_node__8913
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8929 = array_node.arr;
  var len__8930 = 2 * (array_node.cnt - 1);
  var new_arr__8931 = cljs.core.make_array.call(null, len__8930);
  var i__8932 = 0;
  var j__8933 = 1;
  var bitmap__8934 = 0;
  while(true) {
    if(i__8932 < len__8930) {
      if(function() {
        var and__3822__auto____8935 = !(i__8932 === idx);
        if(and__3822__auto____8935) {
          return!(arr__8929[i__8932] == null)
        }else {
          return and__3822__auto____8935
        }
      }()) {
        new_arr__8931[j__8933] = arr__8929[i__8932];
        var G__8936 = i__8932 + 1;
        var G__8937 = j__8933 + 2;
        var G__8938 = bitmap__8934 | 1 << i__8932;
        i__8932 = G__8936;
        j__8933 = G__8937;
        bitmap__8934 = G__8938;
        continue
      }else {
        var G__8939 = i__8932 + 1;
        var G__8940 = j__8933;
        var G__8941 = bitmap__8934;
        i__8932 = G__8939;
        j__8933 = G__8940;
        bitmap__8934 = G__8941;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8934, new_arr__8931)
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
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8942 = this;
  var inode__8943 = this;
  var idx__8944 = hash >>> shift & 31;
  var node__8945 = this__8942.arr[idx__8944];
  if(node__8945 == null) {
    var editable__8946 = cljs.core.edit_and_set.call(null, inode__8943, edit, idx__8944, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8946.cnt = editable__8946.cnt + 1;
    return editable__8946
  }else {
    var n__8947 = node__8945.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8947 === node__8945) {
      return inode__8943
    }else {
      return cljs.core.edit_and_set.call(null, inode__8943, edit, idx__8944, n__8947)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8948 = this;
  var inode__8949 = this;
  return cljs.core.create_array_node_seq.call(null, this__8948.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8950 = this;
  var inode__8951 = this;
  var idx__8952 = hash >>> shift & 31;
  var node__8953 = this__8950.arr[idx__8952];
  if(node__8953 == null) {
    return inode__8951
  }else {
    var n__8954 = node__8953.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8954 === node__8953) {
      return inode__8951
    }else {
      if(n__8954 == null) {
        if(this__8950.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8951, edit, idx__8952)
        }else {
          var editable__8955 = cljs.core.edit_and_set.call(null, inode__8951, edit, idx__8952, n__8954);
          editable__8955.cnt = editable__8955.cnt - 1;
          return editable__8955
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8951, edit, idx__8952, n__8954)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8956 = this;
  var inode__8957 = this;
  if(e === this__8956.edit) {
    return inode__8957
  }else {
    return new cljs.core.ArrayNode(e, this__8956.cnt, this__8956.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8958 = this;
  var inode__8959 = this;
  var len__8960 = this__8958.arr.length;
  var i__8961 = 0;
  var init__8962 = init;
  while(true) {
    if(i__8961 < len__8960) {
      var node__8963 = this__8958.arr[i__8961];
      if(!(node__8963 == null)) {
        var init__8964 = node__8963.kv_reduce(f, init__8962);
        if(cljs.core.reduced_QMARK_.call(null, init__8964)) {
          return cljs.core.deref.call(null, init__8964)
        }else {
          var G__8983 = i__8961 + 1;
          var G__8984 = init__8964;
          i__8961 = G__8983;
          init__8962 = G__8984;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8962
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8965 = this;
  var inode__8966 = this;
  var idx__8967 = hash >>> shift & 31;
  var node__8968 = this__8965.arr[idx__8967];
  if(!(node__8968 == null)) {
    return node__8968.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8969 = this;
  var inode__8970 = this;
  var idx__8971 = hash >>> shift & 31;
  var node__8972 = this__8969.arr[idx__8971];
  if(!(node__8972 == null)) {
    var n__8973 = node__8972.inode_without(shift + 5, hash, key);
    if(n__8973 === node__8972) {
      return inode__8970
    }else {
      if(n__8973 == null) {
        if(this__8969.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8970, null, idx__8971)
        }else {
          return new cljs.core.ArrayNode(null, this__8969.cnt - 1, cljs.core.clone_and_set.call(null, this__8969.arr, idx__8971, n__8973))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8969.cnt, cljs.core.clone_and_set.call(null, this__8969.arr, idx__8971, n__8973))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8970
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8974 = this;
  var inode__8975 = this;
  var idx__8976 = hash >>> shift & 31;
  var node__8977 = this__8974.arr[idx__8976];
  if(node__8977 == null) {
    return new cljs.core.ArrayNode(null, this__8974.cnt + 1, cljs.core.clone_and_set.call(null, this__8974.arr, idx__8976, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8978 = node__8977.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8978 === node__8977) {
      return inode__8975
    }else {
      return new cljs.core.ArrayNode(null, this__8974.cnt, cljs.core.clone_and_set.call(null, this__8974.arr, idx__8976, n__8978))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8979 = this;
  var inode__8980 = this;
  var idx__8981 = hash >>> shift & 31;
  var node__8982 = this__8979.arr[idx__8981];
  if(!(node__8982 == null)) {
    return node__8982.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8987 = 2 * cnt;
  var i__8988 = 0;
  while(true) {
    if(i__8988 < lim__8987) {
      if(cljs.core.key_test.call(null, key, arr[i__8988])) {
        return i__8988
      }else {
        var G__8989 = i__8988 + 2;
        i__8988 = G__8989;
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
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8990 = this;
  var inode__8991 = this;
  if(hash === this__8990.collision_hash) {
    var idx__8992 = cljs.core.hash_collision_node_find_index.call(null, this__8990.arr, this__8990.cnt, key);
    if(idx__8992 === -1) {
      if(this__8990.arr.length > 2 * this__8990.cnt) {
        var editable__8993 = cljs.core.edit_and_set.call(null, inode__8991, edit, 2 * this__8990.cnt, key, 2 * this__8990.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8993.cnt = editable__8993.cnt + 1;
        return editable__8993
      }else {
        var len__8994 = this__8990.arr.length;
        var new_arr__8995 = cljs.core.make_array.call(null, len__8994 + 2);
        cljs.core.array_copy.call(null, this__8990.arr, 0, new_arr__8995, 0, len__8994);
        new_arr__8995[len__8994] = key;
        new_arr__8995[len__8994 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8991.ensure_editable_array(edit, this__8990.cnt + 1, new_arr__8995)
      }
    }else {
      if(this__8990.arr[idx__8992 + 1] === val) {
        return inode__8991
      }else {
        return cljs.core.edit_and_set.call(null, inode__8991, edit, idx__8992 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8990.collision_hash >>> shift & 31), [null, inode__8991, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8996 = this;
  var inode__8997 = this;
  return cljs.core.create_inode_seq.call(null, this__8996.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8998 = this;
  var inode__8999 = this;
  var idx__9000 = cljs.core.hash_collision_node_find_index.call(null, this__8998.arr, this__8998.cnt, key);
  if(idx__9000 === -1) {
    return inode__8999
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8998.cnt === 1) {
      return null
    }else {
      var editable__9001 = inode__8999.ensure_editable(edit);
      var earr__9002 = editable__9001.arr;
      earr__9002[idx__9000] = earr__9002[2 * this__8998.cnt - 2];
      earr__9002[idx__9000 + 1] = earr__9002[2 * this__8998.cnt - 1];
      earr__9002[2 * this__8998.cnt - 1] = null;
      earr__9002[2 * this__8998.cnt - 2] = null;
      editable__9001.cnt = editable__9001.cnt - 1;
      return editable__9001
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__9003 = this;
  var inode__9004 = this;
  if(e === this__9003.edit) {
    return inode__9004
  }else {
    var new_arr__9005 = cljs.core.make_array.call(null, 2 * (this__9003.cnt + 1));
    cljs.core.array_copy.call(null, this__9003.arr, 0, new_arr__9005, 0, 2 * this__9003.cnt);
    return new cljs.core.HashCollisionNode(e, this__9003.collision_hash, this__9003.cnt, new_arr__9005)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__9006 = this;
  var inode__9007 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9006.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9008 = this;
  var inode__9009 = this;
  var idx__9010 = cljs.core.hash_collision_node_find_index.call(null, this__9008.arr, this__9008.cnt, key);
  if(idx__9010 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9008.arr[idx__9010])) {
      return cljs.core.PersistentVector.fromArray([this__9008.arr[idx__9010], this__9008.arr[idx__9010 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__9011 = this;
  var inode__9012 = this;
  var idx__9013 = cljs.core.hash_collision_node_find_index.call(null, this__9011.arr, this__9011.cnt, key);
  if(idx__9013 === -1) {
    return inode__9012
  }else {
    if(this__9011.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__9011.collision_hash, this__9011.cnt - 1, cljs.core.remove_pair.call(null, this__9011.arr, cljs.core.quot.call(null, idx__9013, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9014 = this;
  var inode__9015 = this;
  if(hash === this__9014.collision_hash) {
    var idx__9016 = cljs.core.hash_collision_node_find_index.call(null, this__9014.arr, this__9014.cnt, key);
    if(idx__9016 === -1) {
      var len__9017 = this__9014.arr.length;
      var new_arr__9018 = cljs.core.make_array.call(null, len__9017 + 2);
      cljs.core.array_copy.call(null, this__9014.arr, 0, new_arr__9018, 0, len__9017);
      new_arr__9018[len__9017] = key;
      new_arr__9018[len__9017 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__9014.collision_hash, this__9014.cnt + 1, new_arr__9018)
    }else {
      if(cljs.core._EQ_.call(null, this__9014.arr[idx__9016], val)) {
        return inode__9015
      }else {
        return new cljs.core.HashCollisionNode(null, this__9014.collision_hash, this__9014.cnt, cljs.core.clone_and_set.call(null, this__9014.arr, idx__9016 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__9014.collision_hash >>> shift & 31), [null, inode__9015])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9019 = this;
  var inode__9020 = this;
  var idx__9021 = cljs.core.hash_collision_node_find_index.call(null, this__9019.arr, this__9019.cnt, key);
  if(idx__9021 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9019.arr[idx__9021])) {
      return this__9019.arr[idx__9021 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__9022 = this;
  var inode__9023 = this;
  if(e === this__9022.edit) {
    this__9022.arr = array;
    this__9022.cnt = count;
    return inode__9023
  }else {
    return new cljs.core.HashCollisionNode(this__9022.edit, this__9022.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9028 = cljs.core.hash.call(null, key1);
    if(key1hash__9028 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9028, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9029 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__9028, key1, val1, added_leaf_QMARK___9029).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___9029)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9030 = cljs.core.hash.call(null, key1);
    if(key1hash__9030 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9030, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9031 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__9030, key1, val1, added_leaf_QMARK___9031).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___9031)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9032 = this;
  var h__2192__auto____9033 = this__9032.__hash;
  if(!(h__2192__auto____9033 == null)) {
    return h__2192__auto____9033
  }else {
    var h__2192__auto____9034 = cljs.core.hash_coll.call(null, coll);
    this__9032.__hash = h__2192__auto____9034;
    return h__2192__auto____9034
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9035 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__9036 = this;
  var this__9037 = this;
  return cljs.core.pr_str.call(null, this__9037)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9038 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9039 = this;
  if(this__9039.s == null) {
    return cljs.core.PersistentVector.fromArray([this__9039.nodes[this__9039.i], this__9039.nodes[this__9039.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__9039.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9040 = this;
  if(this__9040.s == null) {
    return cljs.core.create_inode_seq.call(null, this__9040.nodes, this__9040.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__9040.nodes, this__9040.i, cljs.core.next.call(null, this__9040.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9041 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9042 = this;
  return new cljs.core.NodeSeq(meta, this__9042.nodes, this__9042.i, this__9042.s, this__9042.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9043 = this;
  return this__9043.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9044 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9044.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__9051 = nodes.length;
      var j__9052 = i;
      while(true) {
        if(j__9052 < len__9051) {
          if(!(nodes[j__9052] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9052, null, null)
          }else {
            var temp__3971__auto____9053 = nodes[j__9052 + 1];
            if(cljs.core.truth_(temp__3971__auto____9053)) {
              var node__9054 = temp__3971__auto____9053;
              var temp__3971__auto____9055 = node__9054.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____9055)) {
                var node_seq__9056 = temp__3971__auto____9055;
                return new cljs.core.NodeSeq(null, nodes, j__9052 + 2, node_seq__9056, null)
              }else {
                var G__9057 = j__9052 + 2;
                j__9052 = G__9057;
                continue
              }
            }else {
              var G__9058 = j__9052 + 2;
              j__9052 = G__9058;
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
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9059 = this;
  var h__2192__auto____9060 = this__9059.__hash;
  if(!(h__2192__auto____9060 == null)) {
    return h__2192__auto____9060
  }else {
    var h__2192__auto____9061 = cljs.core.hash_coll.call(null, coll);
    this__9059.__hash = h__2192__auto____9061;
    return h__2192__auto____9061
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9062 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9063 = this;
  var this__9064 = this;
  return cljs.core.pr_str.call(null, this__9064)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9065 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9066 = this;
  return cljs.core.first.call(null, this__9066.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9067 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__9067.nodes, this__9067.i, cljs.core.next.call(null, this__9067.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9068 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9069 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9069.nodes, this__9069.i, this__9069.s, this__9069.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9070 = this;
  return this__9070.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9071 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9071.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9078 = nodes.length;
      var j__9079 = i;
      while(true) {
        if(j__9079 < len__9078) {
          var temp__3971__auto____9080 = nodes[j__9079];
          if(cljs.core.truth_(temp__3971__auto____9080)) {
            var nj__9081 = temp__3971__auto____9080;
            var temp__3971__auto____9082 = nj__9081.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9082)) {
              var ns__9083 = temp__3971__auto____9082;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9079 + 1, ns__9083, null)
            }else {
              var G__9084 = j__9079 + 1;
              j__9079 = G__9084;
              continue
            }
          }else {
            var G__9085 = j__9079 + 1;
            j__9079 = G__9085;
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
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9088 = this;
  return new cljs.core.TransientHashMap({}, this__9088.root, this__9088.cnt, this__9088.has_nil_QMARK_, this__9088.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9089 = this;
  var h__2192__auto____9090 = this__9089.__hash;
  if(!(h__2192__auto____9090 == null)) {
    return h__2192__auto____9090
  }else {
    var h__2192__auto____9091 = cljs.core.hash_imap.call(null, coll);
    this__9089.__hash = h__2192__auto____9091;
    return h__2192__auto____9091
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9092 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9093 = this;
  if(k == null) {
    if(this__9093.has_nil_QMARK_) {
      return this__9093.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9093.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9093.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9094 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9095 = this__9094.has_nil_QMARK_;
      if(and__3822__auto____9095) {
        return v === this__9094.nil_val
      }else {
        return and__3822__auto____9095
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9094.meta, this__9094.has_nil_QMARK_ ? this__9094.cnt : this__9094.cnt + 1, this__9094.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9096 = new cljs.core.Box(false);
    var new_root__9097 = (this__9094.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9094.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9096);
    if(new_root__9097 === this__9094.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9094.meta, added_leaf_QMARK___9096.val ? this__9094.cnt + 1 : this__9094.cnt, new_root__9097, this__9094.has_nil_QMARK_, this__9094.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9098 = this;
  if(k == null) {
    return this__9098.has_nil_QMARK_
  }else {
    if(this__9098.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9098.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9121 = null;
  var G__9121__2 = function(this_sym9099, k) {
    var this__9101 = this;
    var this_sym9099__9102 = this;
    var coll__9103 = this_sym9099__9102;
    return coll__9103.cljs$core$ILookup$_lookup$arity$2(coll__9103, k)
  };
  var G__9121__3 = function(this_sym9100, k, not_found) {
    var this__9101 = this;
    var this_sym9100__9104 = this;
    var coll__9105 = this_sym9100__9104;
    return coll__9105.cljs$core$ILookup$_lookup$arity$3(coll__9105, k, not_found)
  };
  G__9121 = function(this_sym9100, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9121__2.call(this, this_sym9100, k);
      case 3:
        return G__9121__3.call(this, this_sym9100, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9121
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9086, args9087) {
  var this__9106 = this;
  return this_sym9086.call.apply(this_sym9086, [this_sym9086].concat(args9087.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9107 = this;
  var init__9108 = this__9107.has_nil_QMARK_ ? f.call(null, init, null, this__9107.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9108)) {
    return cljs.core.deref.call(null, init__9108)
  }else {
    if(!(this__9107.root == null)) {
      return this__9107.root.kv_reduce(f, init__9108)
    }else {
      if("\ufdd0'else") {
        return init__9108
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9109 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9110 = this;
  var this__9111 = this;
  return cljs.core.pr_str.call(null, this__9111)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9112 = this;
  if(this__9112.cnt > 0) {
    var s__9113 = !(this__9112.root == null) ? this__9112.root.inode_seq() : null;
    if(this__9112.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9112.nil_val], true), s__9113)
    }else {
      return s__9113
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9114 = this;
  return this__9114.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9115 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9116 = this;
  return new cljs.core.PersistentHashMap(meta, this__9116.cnt, this__9116.root, this__9116.has_nil_QMARK_, this__9116.nil_val, this__9116.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9117 = this;
  return this__9117.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9118 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9118.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9119 = this;
  if(k == null) {
    if(this__9119.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9119.meta, this__9119.cnt - 1, this__9119.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9119.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9120 = this__9119.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9120 === this__9119.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9119.meta, this__9119.cnt - 1, new_root__9120, this__9119.has_nil_QMARK_, this__9119.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9122 = ks.length;
  var i__9123 = 0;
  var out__9124 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9123 < len__9122) {
      var G__9125 = i__9123 + 1;
      var G__9126 = cljs.core.assoc_BANG_.call(null, out__9124, ks[i__9123], vs[i__9123]);
      i__9123 = G__9125;
      out__9124 = G__9126;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9124)
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
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9127 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9128 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9129 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9130 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9131 = this;
  if(k == null) {
    if(this__9131.has_nil_QMARK_) {
      return this__9131.nil_val
    }else {
      return null
    }
  }else {
    if(this__9131.root == null) {
      return null
    }else {
      return this__9131.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9132 = this;
  if(k == null) {
    if(this__9132.has_nil_QMARK_) {
      return this__9132.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9132.root == null) {
      return not_found
    }else {
      return this__9132.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9133 = this;
  if(this__9133.edit) {
    return this__9133.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9134 = this;
  var tcoll__9135 = this;
  if(this__9134.edit) {
    if(function() {
      var G__9136__9137 = o;
      if(G__9136__9137) {
        if(function() {
          var or__3824__auto____9138 = G__9136__9137.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9138) {
            return or__3824__auto____9138
          }else {
            return G__9136__9137.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9136__9137.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9136__9137)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9136__9137)
      }
    }()) {
      return tcoll__9135.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9139 = cljs.core.seq.call(null, o);
      var tcoll__9140 = tcoll__9135;
      while(true) {
        var temp__3971__auto____9141 = cljs.core.first.call(null, es__9139);
        if(cljs.core.truth_(temp__3971__auto____9141)) {
          var e__9142 = temp__3971__auto____9141;
          var G__9153 = cljs.core.next.call(null, es__9139);
          var G__9154 = tcoll__9140.assoc_BANG_(cljs.core.key.call(null, e__9142), cljs.core.val.call(null, e__9142));
          es__9139 = G__9153;
          tcoll__9140 = G__9154;
          continue
        }else {
          return tcoll__9140
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9143 = this;
  var tcoll__9144 = this;
  if(this__9143.edit) {
    if(k == null) {
      if(this__9143.nil_val === v) {
      }else {
        this__9143.nil_val = v
      }
      if(this__9143.has_nil_QMARK_) {
      }else {
        this__9143.count = this__9143.count + 1;
        this__9143.has_nil_QMARK_ = true
      }
      return tcoll__9144
    }else {
      var added_leaf_QMARK___9145 = new cljs.core.Box(false);
      var node__9146 = (this__9143.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9143.root).inode_assoc_BANG_(this__9143.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9145);
      if(node__9146 === this__9143.root) {
      }else {
        this__9143.root = node__9146
      }
      if(added_leaf_QMARK___9145.val) {
        this__9143.count = this__9143.count + 1
      }else {
      }
      return tcoll__9144
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9147 = this;
  var tcoll__9148 = this;
  if(this__9147.edit) {
    if(k == null) {
      if(this__9147.has_nil_QMARK_) {
        this__9147.has_nil_QMARK_ = false;
        this__9147.nil_val = null;
        this__9147.count = this__9147.count - 1;
        return tcoll__9148
      }else {
        return tcoll__9148
      }
    }else {
      if(this__9147.root == null) {
        return tcoll__9148
      }else {
        var removed_leaf_QMARK___9149 = new cljs.core.Box(false);
        var node__9150 = this__9147.root.inode_without_BANG_(this__9147.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9149);
        if(node__9150 === this__9147.root) {
        }else {
          this__9147.root = node__9150
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9149[0])) {
          this__9147.count = this__9147.count - 1
        }else {
        }
        return tcoll__9148
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9151 = this;
  var tcoll__9152 = this;
  if(this__9151.edit) {
    this__9151.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9151.count, this__9151.root, this__9151.has_nil_QMARK_, this__9151.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9157 = node;
  var stack__9158 = stack;
  while(true) {
    if(!(t__9157 == null)) {
      var G__9159 = ascending_QMARK_ ? t__9157.left : t__9157.right;
      var G__9160 = cljs.core.conj.call(null, stack__9158, t__9157);
      t__9157 = G__9159;
      stack__9158 = G__9160;
      continue
    }else {
      return stack__9158
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
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9161 = this;
  var h__2192__auto____9162 = this__9161.__hash;
  if(!(h__2192__auto____9162 == null)) {
    return h__2192__auto____9162
  }else {
    var h__2192__auto____9163 = cljs.core.hash_coll.call(null, coll);
    this__9161.__hash = h__2192__auto____9163;
    return h__2192__auto____9163
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9164 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9165 = this;
  var this__9166 = this;
  return cljs.core.pr_str.call(null, this__9166)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9167 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9168 = this;
  if(this__9168.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9168.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9169 = this;
  return cljs.core.peek.call(null, this__9169.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9170 = this;
  var t__9171 = cljs.core.first.call(null, this__9170.stack);
  var next_stack__9172 = cljs.core.tree_map_seq_push.call(null, this__9170.ascending_QMARK_ ? t__9171.right : t__9171.left, cljs.core.next.call(null, this__9170.stack), this__9170.ascending_QMARK_);
  if(!(next_stack__9172 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9172, this__9170.ascending_QMARK_, this__9170.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9173 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9174 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9174.stack, this__9174.ascending_QMARK_, this__9174.cnt, this__9174.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9175 = this;
  return this__9175.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
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
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
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
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9177 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9177) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9177
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9179 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9179) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9179
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9183 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9183)) {
    return cljs.core.deref.call(null, init__9183)
  }else {
    var init__9184 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9183) : init__9183;
    if(cljs.core.reduced_QMARK_.call(null, init__9184)) {
      return cljs.core.deref.call(null, init__9184)
    }else {
      var init__9185 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9184) : init__9184;
      if(cljs.core.reduced_QMARK_.call(null, init__9185)) {
        return cljs.core.deref.call(null, init__9185)
      }else {
        return init__9185
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
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9188 = this;
  var h__2192__auto____9189 = this__9188.__hash;
  if(!(h__2192__auto____9189 == null)) {
    return h__2192__auto____9189
  }else {
    var h__2192__auto____9190 = cljs.core.hash_coll.call(null, coll);
    this__9188.__hash = h__2192__auto____9190;
    return h__2192__auto____9190
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9191 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9192 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9193 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9193.key, this__9193.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9241 = null;
  var G__9241__2 = function(this_sym9194, k) {
    var this__9196 = this;
    var this_sym9194__9197 = this;
    var node__9198 = this_sym9194__9197;
    return node__9198.cljs$core$ILookup$_lookup$arity$2(node__9198, k)
  };
  var G__9241__3 = function(this_sym9195, k, not_found) {
    var this__9196 = this;
    var this_sym9195__9199 = this;
    var node__9200 = this_sym9195__9199;
    return node__9200.cljs$core$ILookup$_lookup$arity$3(node__9200, k, not_found)
  };
  G__9241 = function(this_sym9195, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9241__2.call(this, this_sym9195, k);
      case 3:
        return G__9241__3.call(this, this_sym9195, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9241
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9186, args9187) {
  var this__9201 = this;
  return this_sym9186.call.apply(this_sym9186, [this_sym9186].concat(args9187.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9202 = this;
  return cljs.core.PersistentVector.fromArray([this__9202.key, this__9202.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9203 = this;
  return this__9203.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9204 = this;
  return this__9204.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9205 = this;
  var node__9206 = this;
  return ins.balance_right(node__9206)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9207 = this;
  var node__9208 = this;
  return new cljs.core.RedNode(this__9207.key, this__9207.val, this__9207.left, this__9207.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9209 = this;
  var node__9210 = this;
  return cljs.core.balance_right_del.call(null, this__9209.key, this__9209.val, this__9209.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9211 = this;
  var node__9212 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9213 = this;
  var node__9214 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9214, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9215 = this;
  var node__9216 = this;
  return cljs.core.balance_left_del.call(null, this__9215.key, this__9215.val, del, this__9215.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9217 = this;
  var node__9218 = this;
  return ins.balance_left(node__9218)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9219 = this;
  var node__9220 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9220, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9242 = null;
  var G__9242__0 = function() {
    var this__9221 = this;
    var this__9223 = this;
    return cljs.core.pr_str.call(null, this__9223)
  };
  G__9242 = function() {
    switch(arguments.length) {
      case 0:
        return G__9242__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9242
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9224 = this;
  var node__9225 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9225, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9226 = this;
  var node__9227 = this;
  return node__9227
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9228 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9229 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9230 = this;
  return cljs.core.list.call(null, this__9230.key, this__9230.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9231 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9232 = this;
  return this__9232.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9233 = this;
  return cljs.core.PersistentVector.fromArray([this__9233.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9234 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9234.key, this__9234.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9235 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9236 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9236.key, this__9236.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9237 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9238 = this;
  if(n === 0) {
    return this__9238.key
  }else {
    if(n === 1) {
      return this__9238.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9239 = this;
  if(n === 0) {
    return this__9239.key
  }else {
    if(n === 1) {
      return this__9239.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9240 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
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
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9245 = this;
  var h__2192__auto____9246 = this__9245.__hash;
  if(!(h__2192__auto____9246 == null)) {
    return h__2192__auto____9246
  }else {
    var h__2192__auto____9247 = cljs.core.hash_coll.call(null, coll);
    this__9245.__hash = h__2192__auto____9247;
    return h__2192__auto____9247
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9248 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9249 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9250 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9250.key, this__9250.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9298 = null;
  var G__9298__2 = function(this_sym9251, k) {
    var this__9253 = this;
    var this_sym9251__9254 = this;
    var node__9255 = this_sym9251__9254;
    return node__9255.cljs$core$ILookup$_lookup$arity$2(node__9255, k)
  };
  var G__9298__3 = function(this_sym9252, k, not_found) {
    var this__9253 = this;
    var this_sym9252__9256 = this;
    var node__9257 = this_sym9252__9256;
    return node__9257.cljs$core$ILookup$_lookup$arity$3(node__9257, k, not_found)
  };
  G__9298 = function(this_sym9252, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9298__2.call(this, this_sym9252, k);
      case 3:
        return G__9298__3.call(this, this_sym9252, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9298
}();
cljs.core.RedNode.prototype.apply = function(this_sym9243, args9244) {
  var this__9258 = this;
  return this_sym9243.call.apply(this_sym9243, [this_sym9243].concat(args9244.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9259 = this;
  return cljs.core.PersistentVector.fromArray([this__9259.key, this__9259.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9260 = this;
  return this__9260.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9261 = this;
  return this__9261.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9262 = this;
  var node__9263 = this;
  return new cljs.core.RedNode(this__9262.key, this__9262.val, this__9262.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9264 = this;
  var node__9265 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9266 = this;
  var node__9267 = this;
  return new cljs.core.RedNode(this__9266.key, this__9266.val, this__9266.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9268 = this;
  var node__9269 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9270 = this;
  var node__9271 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9271, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9272 = this;
  var node__9273 = this;
  return new cljs.core.RedNode(this__9272.key, this__9272.val, del, this__9272.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9274 = this;
  var node__9275 = this;
  return new cljs.core.RedNode(this__9274.key, this__9274.val, ins, this__9274.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9276 = this;
  var node__9277 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9276.left)) {
    return new cljs.core.RedNode(this__9276.key, this__9276.val, this__9276.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9276.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9276.right)) {
      return new cljs.core.RedNode(this__9276.right.key, this__9276.right.val, new cljs.core.BlackNode(this__9276.key, this__9276.val, this__9276.left, this__9276.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9276.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9277, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9299 = null;
  var G__9299__0 = function() {
    var this__9278 = this;
    var this__9280 = this;
    return cljs.core.pr_str.call(null, this__9280)
  };
  G__9299 = function() {
    switch(arguments.length) {
      case 0:
        return G__9299__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9299
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9281 = this;
  var node__9282 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9281.right)) {
    return new cljs.core.RedNode(this__9281.key, this__9281.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9281.left, null), this__9281.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9281.left)) {
      return new cljs.core.RedNode(this__9281.left.key, this__9281.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9281.left.left, null), new cljs.core.BlackNode(this__9281.key, this__9281.val, this__9281.left.right, this__9281.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9282, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9283 = this;
  var node__9284 = this;
  return new cljs.core.BlackNode(this__9283.key, this__9283.val, this__9283.left, this__9283.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9285 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9286 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9287 = this;
  return cljs.core.list.call(null, this__9287.key, this__9287.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9288 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9289 = this;
  return this__9289.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9290 = this;
  return cljs.core.PersistentVector.fromArray([this__9290.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9291 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9291.key, this__9291.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9292 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9293 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9293.key, this__9293.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9294 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9295 = this;
  if(n === 0) {
    return this__9295.key
  }else {
    if(n === 1) {
      return this__9295.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9296 = this;
  if(n === 0) {
    return this__9296.key
  }else {
    if(n === 1) {
      return this__9296.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9297 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9303 = comp.call(null, k, tree.key);
    if(c__9303 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9303 < 0) {
        var ins__9304 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9304 == null)) {
          return tree.add_left(ins__9304)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9305 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9305 == null)) {
            return tree.add_right(ins__9305)
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
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9308 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9308)) {
            return new cljs.core.RedNode(app__9308.key, app__9308.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9308.left, null), new cljs.core.RedNode(right.key, right.val, app__9308.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9308, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9309 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9309)) {
              return new cljs.core.RedNode(app__9309.key, app__9309.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9309.left, null), new cljs.core.BlackNode(right.key, right.val, app__9309.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9309, right.right, null))
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
    var c__9315 = comp.call(null, k, tree.key);
    if(c__9315 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9315 < 0) {
        var del__9316 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9317 = !(del__9316 == null);
          if(or__3824__auto____9317) {
            return or__3824__auto____9317
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9316, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9316, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9318 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9319 = !(del__9318 == null);
            if(or__3824__auto____9319) {
              return or__3824__auto____9319
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9318)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9318, null)
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
  var tk__9322 = tree.key;
  var c__9323 = comp.call(null, k, tk__9322);
  if(c__9323 === 0) {
    return tree.replace(tk__9322, v, tree.left, tree.right)
  }else {
    if(c__9323 < 0) {
      return tree.replace(tk__9322, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9322, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9326 = this;
  var h__2192__auto____9327 = this__9326.__hash;
  if(!(h__2192__auto____9327 == null)) {
    return h__2192__auto____9327
  }else {
    var h__2192__auto____9328 = cljs.core.hash_imap.call(null, coll);
    this__9326.__hash = h__2192__auto____9328;
    return h__2192__auto____9328
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9329 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9330 = this;
  var n__9331 = coll.entry_at(k);
  if(!(n__9331 == null)) {
    return n__9331.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9332 = this;
  var found__9333 = [null];
  var t__9334 = cljs.core.tree_map_add.call(null, this__9332.comp, this__9332.tree, k, v, found__9333);
  if(t__9334 == null) {
    var found_node__9335 = cljs.core.nth.call(null, found__9333, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9335.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9332.comp, cljs.core.tree_map_replace.call(null, this__9332.comp, this__9332.tree, k, v), this__9332.cnt, this__9332.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9332.comp, t__9334.blacken(), this__9332.cnt + 1, this__9332.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9336 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9370 = null;
  var G__9370__2 = function(this_sym9337, k) {
    var this__9339 = this;
    var this_sym9337__9340 = this;
    var coll__9341 = this_sym9337__9340;
    return coll__9341.cljs$core$ILookup$_lookup$arity$2(coll__9341, k)
  };
  var G__9370__3 = function(this_sym9338, k, not_found) {
    var this__9339 = this;
    var this_sym9338__9342 = this;
    var coll__9343 = this_sym9338__9342;
    return coll__9343.cljs$core$ILookup$_lookup$arity$3(coll__9343, k, not_found)
  };
  G__9370 = function(this_sym9338, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9370__2.call(this, this_sym9338, k);
      case 3:
        return G__9370__3.call(this, this_sym9338, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9370
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9324, args9325) {
  var this__9344 = this;
  return this_sym9324.call.apply(this_sym9324, [this_sym9324].concat(args9325.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9345 = this;
  if(!(this__9345.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9345.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9346 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9347 = this;
  if(this__9347.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9347.tree, false, this__9347.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9348 = this;
  var this__9349 = this;
  return cljs.core.pr_str.call(null, this__9349)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9350 = this;
  var coll__9351 = this;
  var t__9352 = this__9350.tree;
  while(true) {
    if(!(t__9352 == null)) {
      var c__9353 = this__9350.comp.call(null, k, t__9352.key);
      if(c__9353 === 0) {
        return t__9352
      }else {
        if(c__9353 < 0) {
          var G__9371 = t__9352.left;
          t__9352 = G__9371;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9372 = t__9352.right;
            t__9352 = G__9372;
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
  var this__9354 = this;
  if(this__9354.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9354.tree, ascending_QMARK_, this__9354.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9355 = this;
  if(this__9355.cnt > 0) {
    var stack__9356 = null;
    var t__9357 = this__9355.tree;
    while(true) {
      if(!(t__9357 == null)) {
        var c__9358 = this__9355.comp.call(null, k, t__9357.key);
        if(c__9358 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9356, t__9357), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9358 < 0) {
              var G__9373 = cljs.core.conj.call(null, stack__9356, t__9357);
              var G__9374 = t__9357.left;
              stack__9356 = G__9373;
              t__9357 = G__9374;
              continue
            }else {
              var G__9375 = stack__9356;
              var G__9376 = t__9357.right;
              stack__9356 = G__9375;
              t__9357 = G__9376;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9358 > 0) {
                var G__9377 = cljs.core.conj.call(null, stack__9356, t__9357);
                var G__9378 = t__9357.right;
                stack__9356 = G__9377;
                t__9357 = G__9378;
                continue
              }else {
                var G__9379 = stack__9356;
                var G__9380 = t__9357.left;
                stack__9356 = G__9379;
                t__9357 = G__9380;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9356 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9356, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9359 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9360 = this;
  return this__9360.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9361 = this;
  if(this__9361.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9361.tree, true, this__9361.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9362 = this;
  return this__9362.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9363 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9364 = this;
  return new cljs.core.PersistentTreeMap(this__9364.comp, this__9364.tree, this__9364.cnt, meta, this__9364.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9365 = this;
  return this__9365.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9366 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9366.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9367 = this;
  var found__9368 = [null];
  var t__9369 = cljs.core.tree_map_remove.call(null, this__9367.comp, this__9367.tree, k, found__9368);
  if(t__9369 == null) {
    if(cljs.core.nth.call(null, found__9368, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9367.comp, null, 0, this__9367.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9367.comp, t__9369.blacken(), this__9367.cnt - 1, this__9367.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9383 = cljs.core.seq.call(null, keyvals);
    var out__9384 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9383) {
        var G__9385 = cljs.core.nnext.call(null, in__9383);
        var G__9386 = cljs.core.assoc_BANG_.call(null, out__9384, cljs.core.first.call(null, in__9383), cljs.core.second.call(null, in__9383));
        in__9383 = G__9385;
        out__9384 = G__9386;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9384)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9387) {
    var keyvals = cljs.core.seq(arglist__9387);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9388) {
    var keyvals = cljs.core.seq(arglist__9388);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9392 = [];
    var obj__9393 = {};
    var kvs__9394 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9394) {
        ks__9392.push(cljs.core.first.call(null, kvs__9394));
        obj__9393[cljs.core.first.call(null, kvs__9394)] = cljs.core.second.call(null, kvs__9394);
        var G__9395 = cljs.core.nnext.call(null, kvs__9394);
        kvs__9394 = G__9395;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9392, obj__9393)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9396) {
    var keyvals = cljs.core.seq(arglist__9396);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9399 = cljs.core.seq.call(null, keyvals);
    var out__9400 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9399) {
        var G__9401 = cljs.core.nnext.call(null, in__9399);
        var G__9402 = cljs.core.assoc.call(null, out__9400, cljs.core.first.call(null, in__9399), cljs.core.second.call(null, in__9399));
        in__9399 = G__9401;
        out__9400 = G__9402;
        continue
      }else {
        return out__9400
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9403) {
    var keyvals = cljs.core.seq(arglist__9403);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9406 = cljs.core.seq.call(null, keyvals);
    var out__9407 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9406) {
        var G__9408 = cljs.core.nnext.call(null, in__9406);
        var G__9409 = cljs.core.assoc.call(null, out__9407, cljs.core.first.call(null, in__9406), cljs.core.second.call(null, in__9406));
        in__9406 = G__9408;
        out__9407 = G__9409;
        continue
      }else {
        return out__9407
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9410) {
    var comparator = cljs.core.first(arglist__9410);
    var keyvals = cljs.core.rest(arglist__9410);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9411_SHARP_, p2__9412_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9414 = p1__9411_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9414)) {
            return or__3824__auto____9414
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9412_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9415) {
    var maps = cljs.core.seq(arglist__9415);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9423 = function(m, e) {
        var k__9421 = cljs.core.first.call(null, e);
        var v__9422 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9421)) {
          return cljs.core.assoc.call(null, m, k__9421, f.call(null, cljs.core._lookup.call(null, m, k__9421, null), v__9422))
        }else {
          return cljs.core.assoc.call(null, m, k__9421, v__9422)
        }
      };
      var merge2__9425 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9423, function() {
          var or__3824__auto____9424 = m1;
          if(cljs.core.truth_(or__3824__auto____9424)) {
            return or__3824__auto____9424
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9425, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9426) {
    var f = cljs.core.first(arglist__9426);
    var maps = cljs.core.rest(arglist__9426);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9431 = cljs.core.ObjMap.EMPTY;
  var keys__9432 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9432) {
      var key__9433 = cljs.core.first.call(null, keys__9432);
      var entry__9434 = cljs.core._lookup.call(null, map, key__9433, "\ufdd0'cljs.core/not-found");
      var G__9435 = cljs.core.not_EQ_.call(null, entry__9434, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9431, key__9433, entry__9434) : ret__9431;
      var G__9436 = cljs.core.next.call(null, keys__9432);
      ret__9431 = G__9435;
      keys__9432 = G__9436;
      continue
    }else {
      return ret__9431
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9440 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9440.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9441 = this;
  var h__2192__auto____9442 = this__9441.__hash;
  if(!(h__2192__auto____9442 == null)) {
    return h__2192__auto____9442
  }else {
    var h__2192__auto____9443 = cljs.core.hash_iset.call(null, coll);
    this__9441.__hash = h__2192__auto____9443;
    return h__2192__auto____9443
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9444 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9445 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9445.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9466 = null;
  var G__9466__2 = function(this_sym9446, k) {
    var this__9448 = this;
    var this_sym9446__9449 = this;
    var coll__9450 = this_sym9446__9449;
    return coll__9450.cljs$core$ILookup$_lookup$arity$2(coll__9450, k)
  };
  var G__9466__3 = function(this_sym9447, k, not_found) {
    var this__9448 = this;
    var this_sym9447__9451 = this;
    var coll__9452 = this_sym9447__9451;
    return coll__9452.cljs$core$ILookup$_lookup$arity$3(coll__9452, k, not_found)
  };
  G__9466 = function(this_sym9447, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9466__2.call(this, this_sym9447, k);
      case 3:
        return G__9466__3.call(this, this_sym9447, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9466
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9438, args9439) {
  var this__9453 = this;
  return this_sym9438.call.apply(this_sym9438, [this_sym9438].concat(args9439.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9454 = this;
  return new cljs.core.PersistentHashSet(this__9454.meta, cljs.core.assoc.call(null, this__9454.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9455 = this;
  var this__9456 = this;
  return cljs.core.pr_str.call(null, this__9456)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9457 = this;
  return cljs.core.keys.call(null, this__9457.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9458 = this;
  return new cljs.core.PersistentHashSet(this__9458.meta, cljs.core.dissoc.call(null, this__9458.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9459 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9460 = this;
  var and__3822__auto____9461 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9461) {
    var and__3822__auto____9462 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9462) {
      return cljs.core.every_QMARK_.call(null, function(p1__9437_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9437_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9462
    }
  }else {
    return and__3822__auto____9461
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9463 = this;
  return new cljs.core.PersistentHashSet(meta, this__9463.hash_map, this__9463.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9464 = this;
  return this__9464.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9465 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9465.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9467 = cljs.core.count.call(null, items);
  var i__9468 = 0;
  var out__9469 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9468 < len__9467) {
      var G__9470 = i__9468 + 1;
      var G__9471 = cljs.core.conj_BANG_.call(null, out__9469, items[i__9468]);
      i__9468 = G__9470;
      out__9469 = G__9471;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9469)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9489 = null;
  var G__9489__2 = function(this_sym9475, k) {
    var this__9477 = this;
    var this_sym9475__9478 = this;
    var tcoll__9479 = this_sym9475__9478;
    if(cljs.core._lookup.call(null, this__9477.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9489__3 = function(this_sym9476, k, not_found) {
    var this__9477 = this;
    var this_sym9476__9480 = this;
    var tcoll__9481 = this_sym9476__9480;
    if(cljs.core._lookup.call(null, this__9477.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9489 = function(this_sym9476, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9489__2.call(this, this_sym9476, k);
      case 3:
        return G__9489__3.call(this, this_sym9476, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9489
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9473, args9474) {
  var this__9482 = this;
  return this_sym9473.call.apply(this_sym9473, [this_sym9473].concat(args9474.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9483 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9484 = this;
  if(cljs.core._lookup.call(null, this__9484.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9485 = this;
  return cljs.core.count.call(null, this__9485.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9486 = this;
  this__9486.transient_map = cljs.core.dissoc_BANG_.call(null, this__9486.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9487 = this;
  this__9487.transient_map = cljs.core.assoc_BANG_.call(null, this__9487.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9488 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9488.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9492 = this;
  var h__2192__auto____9493 = this__9492.__hash;
  if(!(h__2192__auto____9493 == null)) {
    return h__2192__auto____9493
  }else {
    var h__2192__auto____9494 = cljs.core.hash_iset.call(null, coll);
    this__9492.__hash = h__2192__auto____9494;
    return h__2192__auto____9494
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9495 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9496 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9496.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9522 = null;
  var G__9522__2 = function(this_sym9497, k) {
    var this__9499 = this;
    var this_sym9497__9500 = this;
    var coll__9501 = this_sym9497__9500;
    return coll__9501.cljs$core$ILookup$_lookup$arity$2(coll__9501, k)
  };
  var G__9522__3 = function(this_sym9498, k, not_found) {
    var this__9499 = this;
    var this_sym9498__9502 = this;
    var coll__9503 = this_sym9498__9502;
    return coll__9503.cljs$core$ILookup$_lookup$arity$3(coll__9503, k, not_found)
  };
  G__9522 = function(this_sym9498, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9522__2.call(this, this_sym9498, k);
      case 3:
        return G__9522__3.call(this, this_sym9498, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9522
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9490, args9491) {
  var this__9504 = this;
  return this_sym9490.call.apply(this_sym9490, [this_sym9490].concat(args9491.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9505 = this;
  return new cljs.core.PersistentTreeSet(this__9505.meta, cljs.core.assoc.call(null, this__9505.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9506 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9506.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9507 = this;
  var this__9508 = this;
  return cljs.core.pr_str.call(null, this__9508)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9509 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9509.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9510 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9510.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9511 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9512 = this;
  return cljs.core._comparator.call(null, this__9512.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9513 = this;
  return cljs.core.keys.call(null, this__9513.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9514 = this;
  return new cljs.core.PersistentTreeSet(this__9514.meta, cljs.core.dissoc.call(null, this__9514.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9515 = this;
  return cljs.core.count.call(null, this__9515.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9516 = this;
  var and__3822__auto____9517 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9517) {
    var and__3822__auto____9518 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9518) {
      return cljs.core.every_QMARK_.call(null, function(p1__9472_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9472_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9518
    }
  }else {
    return and__3822__auto____9517
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9519 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9519.tree_map, this__9519.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9520 = this;
  return this__9520.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9521 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9521.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9527__delegate = function(keys) {
      var in__9525 = cljs.core.seq.call(null, keys);
      var out__9526 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9525)) {
          var G__9528 = cljs.core.next.call(null, in__9525);
          var G__9529 = cljs.core.conj_BANG_.call(null, out__9526, cljs.core.first.call(null, in__9525));
          in__9525 = G__9528;
          out__9526 = G__9529;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9526)
        }
        break
      }
    };
    var G__9527 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9527__delegate.call(this, keys)
    };
    G__9527.cljs$lang$maxFixedArity = 0;
    G__9527.cljs$lang$applyTo = function(arglist__9530) {
      var keys = cljs.core.seq(arglist__9530);
      return G__9527__delegate(keys)
    };
    G__9527.cljs$lang$arity$variadic = G__9527__delegate;
    return G__9527
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9531) {
    var keys = cljs.core.seq(arglist__9531);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9533) {
    var comparator = cljs.core.first(arglist__9533);
    var keys = cljs.core.rest(arglist__9533);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9539 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9540 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9540)) {
        var e__9541 = temp__3971__auto____9540;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9541))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9539, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9532_SHARP_) {
      var temp__3971__auto____9542 = cljs.core.find.call(null, smap, p1__9532_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9542)) {
        var e__9543 = temp__3971__auto____9542;
        return cljs.core.second.call(null, e__9543)
      }else {
        return p1__9532_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9573 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9566, seen) {
        while(true) {
          var vec__9567__9568 = p__9566;
          var f__9569 = cljs.core.nth.call(null, vec__9567__9568, 0, null);
          var xs__9570 = vec__9567__9568;
          var temp__3974__auto____9571 = cljs.core.seq.call(null, xs__9570);
          if(temp__3974__auto____9571) {
            var s__9572 = temp__3974__auto____9571;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9569)) {
              var G__9574 = cljs.core.rest.call(null, s__9572);
              var G__9575 = seen;
              p__9566 = G__9574;
              seen = G__9575;
              continue
            }else {
              return cljs.core.cons.call(null, f__9569, step.call(null, cljs.core.rest.call(null, s__9572), cljs.core.conj.call(null, seen, f__9569)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9573.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9578 = cljs.core.PersistentVector.EMPTY;
  var s__9579 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9579)) {
      var G__9580 = cljs.core.conj.call(null, ret__9578, cljs.core.first.call(null, s__9579));
      var G__9581 = cljs.core.next.call(null, s__9579);
      ret__9578 = G__9580;
      s__9579 = G__9581;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9578)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9584 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9584) {
        return or__3824__auto____9584
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9585 = x.lastIndexOf("/");
      if(i__9585 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9585 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____9588 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9588) {
      return or__3824__auto____9588
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9589 = x.lastIndexOf("/");
    if(i__9589 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9589)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9596 = cljs.core.ObjMap.EMPTY;
  var ks__9597 = cljs.core.seq.call(null, keys);
  var vs__9598 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9599 = ks__9597;
      if(and__3822__auto____9599) {
        return vs__9598
      }else {
        return and__3822__auto____9599
      }
    }()) {
      var G__9600 = cljs.core.assoc.call(null, map__9596, cljs.core.first.call(null, ks__9597), cljs.core.first.call(null, vs__9598));
      var G__9601 = cljs.core.next.call(null, ks__9597);
      var G__9602 = cljs.core.next.call(null, vs__9598);
      map__9596 = G__9600;
      ks__9597 = G__9601;
      vs__9598 = G__9602;
      continue
    }else {
      return map__9596
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
    var G__9605__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9590_SHARP_, p2__9591_SHARP_) {
        return max_key.call(null, k, p1__9590_SHARP_, p2__9591_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9605 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9605__delegate.call(this, k, x, y, more)
    };
    G__9605.cljs$lang$maxFixedArity = 3;
    G__9605.cljs$lang$applyTo = function(arglist__9606) {
      var k = cljs.core.first(arglist__9606);
      var x = cljs.core.first(cljs.core.next(arglist__9606));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9606)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9606)));
      return G__9605__delegate(k, x, y, more)
    };
    G__9605.cljs$lang$arity$variadic = G__9605__delegate;
    return G__9605
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
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
    var G__9607__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9603_SHARP_, p2__9604_SHARP_) {
        return min_key.call(null, k, p1__9603_SHARP_, p2__9604_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9607 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9607__delegate.call(this, k, x, y, more)
    };
    G__9607.cljs$lang$maxFixedArity = 3;
    G__9607.cljs$lang$applyTo = function(arglist__9608) {
      var k = cljs.core.first(arglist__9608);
      var x = cljs.core.first(cljs.core.next(arglist__9608));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9608)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9608)));
      return G__9607__delegate(k, x, y, more)
    };
    G__9607.cljs$lang$arity$variadic = G__9607__delegate;
    return G__9607
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9611 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9611) {
        var s__9612 = temp__3974__auto____9611;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9612), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9612)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9615 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9615) {
      var s__9616 = temp__3974__auto____9615;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9616)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9616), take_while.call(null, pred, cljs.core.rest.call(null, s__9616)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9618 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9618.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9630 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9631 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9631)) {
        var vec__9632__9633 = temp__3974__auto____9631;
        var e__9634 = cljs.core.nth.call(null, vec__9632__9633, 0, null);
        var s__9635 = vec__9632__9633;
        if(cljs.core.truth_(include__9630.call(null, e__9634))) {
          return s__9635
        }else {
          return cljs.core.next.call(null, s__9635)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9630, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9636 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9636)) {
      var vec__9637__9638 = temp__3974__auto____9636;
      var e__9639 = cljs.core.nth.call(null, vec__9637__9638, 0, null);
      var s__9640 = vec__9637__9638;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9639)) ? s__9640 : cljs.core.next.call(null, s__9640))
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
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9652 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9653 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9653)) {
        var vec__9654__9655 = temp__3974__auto____9653;
        var e__9656 = cljs.core.nth.call(null, vec__9654__9655, 0, null);
        var s__9657 = vec__9654__9655;
        if(cljs.core.truth_(include__9652.call(null, e__9656))) {
          return s__9657
        }else {
          return cljs.core.next.call(null, s__9657)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9652, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9658 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9658)) {
      var vec__9659__9660 = temp__3974__auto____9658;
      var e__9661 = cljs.core.nth.call(null, vec__9659__9660, 0, null);
      var s__9662 = vec__9659__9660;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9661)) ? s__9662 : cljs.core.next.call(null, s__9662))
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
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
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
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9663 = this;
  var h__2192__auto____9664 = this__9663.__hash;
  if(!(h__2192__auto____9664 == null)) {
    return h__2192__auto____9664
  }else {
    var h__2192__auto____9665 = cljs.core.hash_coll.call(null, rng);
    this__9663.__hash = h__2192__auto____9665;
    return h__2192__auto____9665
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9666 = this;
  if(this__9666.step > 0) {
    if(this__9666.start + this__9666.step < this__9666.end) {
      return new cljs.core.Range(this__9666.meta, this__9666.start + this__9666.step, this__9666.end, this__9666.step, null)
    }else {
      return null
    }
  }else {
    if(this__9666.start + this__9666.step > this__9666.end) {
      return new cljs.core.Range(this__9666.meta, this__9666.start + this__9666.step, this__9666.end, this__9666.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9667 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9668 = this;
  var this__9669 = this;
  return cljs.core.pr_str.call(null, this__9669)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9670 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9671 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9672 = this;
  if(this__9672.step > 0) {
    if(this__9672.start < this__9672.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9672.start > this__9672.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9673 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9673.end - this__9673.start) / this__9673.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9674 = this;
  return this__9674.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9675 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9675.meta, this__9675.start + this__9675.step, this__9675.end, this__9675.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9676 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9677 = this;
  return new cljs.core.Range(meta, this__9677.start, this__9677.end, this__9677.step, this__9677.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9678 = this;
  return this__9678.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9679 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9679.start + n * this__9679.step
  }else {
    if(function() {
      var and__3822__auto____9680 = this__9679.start > this__9679.end;
      if(and__3822__auto____9680) {
        return this__9679.step === 0
      }else {
        return and__3822__auto____9680
      }
    }()) {
      return this__9679.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9681 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9681.start + n * this__9681.step
  }else {
    if(function() {
      var and__3822__auto____9682 = this__9681.start > this__9681.end;
      if(and__3822__auto____9682) {
        return this__9681.step === 0
      }else {
        return and__3822__auto____9682
      }
    }()) {
      return this__9681.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9683 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9683.meta)
};
cljs.core.Range;
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
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9686 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9686) {
      var s__9687 = temp__3974__auto____9686;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9687), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9687)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9694 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9694) {
      var s__9695 = temp__3974__auto____9694;
      var fst__9696 = cljs.core.first.call(null, s__9695);
      var fv__9697 = f.call(null, fst__9696);
      var run__9698 = cljs.core.cons.call(null, fst__9696, cljs.core.take_while.call(null, function(p1__9688_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9697, f.call(null, p1__9688_SHARP_))
      }, cljs.core.next.call(null, s__9695)));
      return cljs.core.cons.call(null, run__9698, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9698), s__9695))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9713 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9713) {
        var s__9714 = temp__3971__auto____9713;
        return reductions.call(null, f, cljs.core.first.call(null, s__9714), cljs.core.rest.call(null, s__9714))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9715 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9715) {
        var s__9716 = temp__3974__auto____9715;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9716)), cljs.core.rest.call(null, s__9716))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9719 = null;
      var G__9719__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9719__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9719__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9719__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9719__4 = function() {
        var G__9720__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9720 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9720__delegate.call(this, x, y, z, args)
        };
        G__9720.cljs$lang$maxFixedArity = 3;
        G__9720.cljs$lang$applyTo = function(arglist__9721) {
          var x = cljs.core.first(arglist__9721);
          var y = cljs.core.first(cljs.core.next(arglist__9721));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9721)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9721)));
          return G__9720__delegate(x, y, z, args)
        };
        G__9720.cljs$lang$arity$variadic = G__9720__delegate;
        return G__9720
      }();
      G__9719 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9719__0.call(this);
          case 1:
            return G__9719__1.call(this, x);
          case 2:
            return G__9719__2.call(this, x, y);
          case 3:
            return G__9719__3.call(this, x, y, z);
          default:
            return G__9719__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9719.cljs$lang$maxFixedArity = 3;
      G__9719.cljs$lang$applyTo = G__9719__4.cljs$lang$applyTo;
      return G__9719
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9722 = null;
      var G__9722__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9722__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9722__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9722__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9722__4 = function() {
        var G__9723__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9723 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9723__delegate.call(this, x, y, z, args)
        };
        G__9723.cljs$lang$maxFixedArity = 3;
        G__9723.cljs$lang$applyTo = function(arglist__9724) {
          var x = cljs.core.first(arglist__9724);
          var y = cljs.core.first(cljs.core.next(arglist__9724));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9724)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9724)));
          return G__9723__delegate(x, y, z, args)
        };
        G__9723.cljs$lang$arity$variadic = G__9723__delegate;
        return G__9723
      }();
      G__9722 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9722__0.call(this);
          case 1:
            return G__9722__1.call(this, x);
          case 2:
            return G__9722__2.call(this, x, y);
          case 3:
            return G__9722__3.call(this, x, y, z);
          default:
            return G__9722__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9722.cljs$lang$maxFixedArity = 3;
      G__9722.cljs$lang$applyTo = G__9722__4.cljs$lang$applyTo;
      return G__9722
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9725 = null;
      var G__9725__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9725__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9725__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9725__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9725__4 = function() {
        var G__9726__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9726 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9726__delegate.call(this, x, y, z, args)
        };
        G__9726.cljs$lang$maxFixedArity = 3;
        G__9726.cljs$lang$applyTo = function(arglist__9727) {
          var x = cljs.core.first(arglist__9727);
          var y = cljs.core.first(cljs.core.next(arglist__9727));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9727)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9727)));
          return G__9726__delegate(x, y, z, args)
        };
        G__9726.cljs$lang$arity$variadic = G__9726__delegate;
        return G__9726
      }();
      G__9725 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9725__0.call(this);
          case 1:
            return G__9725__1.call(this, x);
          case 2:
            return G__9725__2.call(this, x, y);
          case 3:
            return G__9725__3.call(this, x, y, z);
          default:
            return G__9725__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9725.cljs$lang$maxFixedArity = 3;
      G__9725.cljs$lang$applyTo = G__9725__4.cljs$lang$applyTo;
      return G__9725
    }()
  };
  var juxt__4 = function() {
    var G__9728__delegate = function(f, g, h, fs) {
      var fs__9718 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9729 = null;
        var G__9729__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9699_SHARP_, p2__9700_SHARP_) {
            return cljs.core.conj.call(null, p1__9699_SHARP_, p2__9700_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9718)
        };
        var G__9729__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9701_SHARP_, p2__9702_SHARP_) {
            return cljs.core.conj.call(null, p1__9701_SHARP_, p2__9702_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9718)
        };
        var G__9729__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9703_SHARP_, p2__9704_SHARP_) {
            return cljs.core.conj.call(null, p1__9703_SHARP_, p2__9704_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9718)
        };
        var G__9729__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9705_SHARP_, p2__9706_SHARP_) {
            return cljs.core.conj.call(null, p1__9705_SHARP_, p2__9706_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9718)
        };
        var G__9729__4 = function() {
          var G__9730__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9707_SHARP_, p2__9708_SHARP_) {
              return cljs.core.conj.call(null, p1__9707_SHARP_, cljs.core.apply.call(null, p2__9708_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9718)
          };
          var G__9730 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9730__delegate.call(this, x, y, z, args)
          };
          G__9730.cljs$lang$maxFixedArity = 3;
          G__9730.cljs$lang$applyTo = function(arglist__9731) {
            var x = cljs.core.first(arglist__9731);
            var y = cljs.core.first(cljs.core.next(arglist__9731));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9731)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9731)));
            return G__9730__delegate(x, y, z, args)
          };
          G__9730.cljs$lang$arity$variadic = G__9730__delegate;
          return G__9730
        }();
        G__9729 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9729__0.call(this);
            case 1:
              return G__9729__1.call(this, x);
            case 2:
              return G__9729__2.call(this, x, y);
            case 3:
              return G__9729__3.call(this, x, y, z);
            default:
              return G__9729__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9729.cljs$lang$maxFixedArity = 3;
        G__9729.cljs$lang$applyTo = G__9729__4.cljs$lang$applyTo;
        return G__9729
      }()
    };
    var G__9728 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9728__delegate.call(this, f, g, h, fs)
    };
    G__9728.cljs$lang$maxFixedArity = 3;
    G__9728.cljs$lang$applyTo = function(arglist__9732) {
      var f = cljs.core.first(arglist__9732);
      var g = cljs.core.first(cljs.core.next(arglist__9732));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9732)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9732)));
      return G__9728__delegate(f, g, h, fs)
    };
    G__9728.cljs$lang$arity$variadic = G__9728__delegate;
    return G__9728
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
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9735 = cljs.core.next.call(null, coll);
        coll = G__9735;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____9734 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9734) {
          return n > 0
        }else {
          return and__3822__auto____9734
        }
      }())) {
        var G__9736 = n - 1;
        var G__9737 = cljs.core.next.call(null, coll);
        n = G__9736;
        coll = G__9737;
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
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
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
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9739 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9739), s)) {
    if(cljs.core.count.call(null, matches__9739) === 1) {
      return cljs.core.first.call(null, matches__9739)
    }else {
      return cljs.core.vec.call(null, matches__9739)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9741 = re.exec(s);
  if(matches__9741 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9741) === 1) {
      return cljs.core.first.call(null, matches__9741)
    }else {
      return cljs.core.vec.call(null, matches__9741)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9746 = cljs.core.re_find.call(null, re, s);
  var match_idx__9747 = s.search(re);
  var match_str__9748 = cljs.core.coll_QMARK_.call(null, match_data__9746) ? cljs.core.first.call(null, match_data__9746) : match_data__9746;
  var post_match__9749 = cljs.core.subs.call(null, s, match_idx__9747 + cljs.core.count.call(null, match_str__9748));
  if(cljs.core.truth_(match_data__9746)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9746, re_seq.call(null, re, post_match__9749))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9756__9757 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9758 = cljs.core.nth.call(null, vec__9756__9757, 0, null);
  var flags__9759 = cljs.core.nth.call(null, vec__9756__9757, 1, null);
  var pattern__9760 = cljs.core.nth.call(null, vec__9756__9757, 2, null);
  return new RegExp(pattern__9760, flags__9759)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9750_SHARP_) {
    return print_one.call(null, p1__9750_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____9770 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9770)) {
            var and__3822__auto____9774 = function() {
              var G__9771__9772 = obj;
              if(G__9771__9772) {
                if(function() {
                  var or__3824__auto____9773 = G__9771__9772.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9773) {
                    return or__3824__auto____9773
                  }else {
                    return G__9771__9772.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9771__9772.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9771__9772)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9771__9772)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9774)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9774
            }
          }else {
            return and__3822__auto____9770
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9775 = !(obj == null);
          if(and__3822__auto____9775) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9775
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9776__9777 = obj;
          if(G__9776__9777) {
            if(function() {
              var or__3824__auto____9778 = G__9776__9777.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9778) {
                return or__3824__auto____9778
              }else {
                return G__9776__9777.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9776__9777.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9776__9777)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9776__9777)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9798 = new goog.string.StringBuffer;
  var G__9799__9800 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9799__9800) {
    var string__9801 = cljs.core.first.call(null, G__9799__9800);
    var G__9799__9802 = G__9799__9800;
    while(true) {
      sb__9798.append(string__9801);
      var temp__3974__auto____9803 = cljs.core.next.call(null, G__9799__9802);
      if(temp__3974__auto____9803) {
        var G__9799__9804 = temp__3974__auto____9803;
        var G__9817 = cljs.core.first.call(null, G__9799__9804);
        var G__9818 = G__9799__9804;
        string__9801 = G__9817;
        G__9799__9802 = G__9818;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9805__9806 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9805__9806) {
    var obj__9807 = cljs.core.first.call(null, G__9805__9806);
    var G__9805__9808 = G__9805__9806;
    while(true) {
      sb__9798.append(" ");
      var G__9809__9810 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9807, opts));
      if(G__9809__9810) {
        var string__9811 = cljs.core.first.call(null, G__9809__9810);
        var G__9809__9812 = G__9809__9810;
        while(true) {
          sb__9798.append(string__9811);
          var temp__3974__auto____9813 = cljs.core.next.call(null, G__9809__9812);
          if(temp__3974__auto____9813) {
            var G__9809__9814 = temp__3974__auto____9813;
            var G__9819 = cljs.core.first.call(null, G__9809__9814);
            var G__9820 = G__9809__9814;
            string__9811 = G__9819;
            G__9809__9812 = G__9820;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9815 = cljs.core.next.call(null, G__9805__9808);
      if(temp__3974__auto____9815) {
        var G__9805__9816 = temp__3974__auto____9815;
        var G__9821 = cljs.core.first.call(null, G__9805__9816);
        var G__9822 = G__9805__9816;
        obj__9807 = G__9821;
        G__9805__9808 = G__9822;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9798
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9824 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9824.append("\n");
  return[cljs.core.str(sb__9824)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9843__9844 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9843__9844) {
    var string__9845 = cljs.core.first.call(null, G__9843__9844);
    var G__9843__9846 = G__9843__9844;
    while(true) {
      cljs.core.string_print.call(null, string__9845);
      var temp__3974__auto____9847 = cljs.core.next.call(null, G__9843__9846);
      if(temp__3974__auto____9847) {
        var G__9843__9848 = temp__3974__auto____9847;
        var G__9861 = cljs.core.first.call(null, G__9843__9848);
        var G__9862 = G__9843__9848;
        string__9845 = G__9861;
        G__9843__9846 = G__9862;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9849__9850 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9849__9850) {
    var obj__9851 = cljs.core.first.call(null, G__9849__9850);
    var G__9849__9852 = G__9849__9850;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9853__9854 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9851, opts));
      if(G__9853__9854) {
        var string__9855 = cljs.core.first.call(null, G__9853__9854);
        var G__9853__9856 = G__9853__9854;
        while(true) {
          cljs.core.string_print.call(null, string__9855);
          var temp__3974__auto____9857 = cljs.core.next.call(null, G__9853__9856);
          if(temp__3974__auto____9857) {
            var G__9853__9858 = temp__3974__auto____9857;
            var G__9863 = cljs.core.first.call(null, G__9853__9858);
            var G__9864 = G__9853__9858;
            string__9855 = G__9863;
            G__9853__9856 = G__9864;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9859 = cljs.core.next.call(null, G__9849__9852);
      if(temp__3974__auto____9859) {
        var G__9849__9860 = temp__3974__auto____9859;
        var G__9865 = cljs.core.first.call(null, G__9849__9860);
        var G__9866 = G__9849__9860;
        obj__9851 = G__9865;
        G__9849__9852 = G__9866;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9867) {
    var objs = cljs.core.seq(arglist__9867);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9868) {
    var objs = cljs.core.seq(arglist__9868);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9869) {
    var objs = cljs.core.seq(arglist__9869);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9870) {
    var objs = cljs.core.seq(arglist__9870);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9871) {
    var objs = cljs.core.seq(arglist__9871);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9872) {
    var objs = cljs.core.seq(arglist__9872);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9873) {
    var objs = cljs.core.seq(arglist__9873);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9874) {
    var objs = cljs.core.seq(arglist__9874);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__9875) {
    var fmt = cljs.core.first(arglist__9875);
    var args = cljs.core.rest(arglist__9875);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9876 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9876, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9877 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9877, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9878 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9878, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____9879 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9879)) {
        var nspc__9880 = temp__3974__auto____9879;
        return[cljs.core.str(nspc__9880), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9881 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9881)) {
          var nspc__9882 = temp__3974__auto____9881;
          return[cljs.core.str(nspc__9882), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9883 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9883, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9885 = function(n, len) {
    var ns__9884 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9884) < len) {
        var G__9887 = [cljs.core.str("0"), cljs.core.str(ns__9884)].join("");
        ns__9884 = G__9887;
        continue
      }else {
        return ns__9884
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9885.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9885.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9885.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9885.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9885.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9885.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9886 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9886, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9888 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9889 = this;
  var G__9890__9891 = cljs.core.seq.call(null, this__9889.watches);
  if(G__9890__9891) {
    var G__9893__9895 = cljs.core.first.call(null, G__9890__9891);
    var vec__9894__9896 = G__9893__9895;
    var key__9897 = cljs.core.nth.call(null, vec__9894__9896, 0, null);
    var f__9898 = cljs.core.nth.call(null, vec__9894__9896, 1, null);
    var G__9890__9899 = G__9890__9891;
    var G__9893__9900 = G__9893__9895;
    var G__9890__9901 = G__9890__9899;
    while(true) {
      var vec__9902__9903 = G__9893__9900;
      var key__9904 = cljs.core.nth.call(null, vec__9902__9903, 0, null);
      var f__9905 = cljs.core.nth.call(null, vec__9902__9903, 1, null);
      var G__9890__9906 = G__9890__9901;
      f__9905.call(null, key__9904, this$, oldval, newval);
      var temp__3974__auto____9907 = cljs.core.next.call(null, G__9890__9906);
      if(temp__3974__auto____9907) {
        var G__9890__9908 = temp__3974__auto____9907;
        var G__9915 = cljs.core.first.call(null, G__9890__9908);
        var G__9916 = G__9890__9908;
        G__9893__9900 = G__9915;
        G__9890__9901 = G__9916;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9909 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9909.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9910 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9910.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9911 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9911.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9912 = this;
  return this__9912.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9913 = this;
  return this__9913.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9914 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9928__delegate = function(x, p__9917) {
      var map__9923__9924 = p__9917;
      var map__9923__9925 = cljs.core.seq_QMARK_.call(null, map__9923__9924) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9923__9924) : map__9923__9924;
      var validator__9926 = cljs.core._lookup.call(null, map__9923__9925, "\ufdd0'validator", null);
      var meta__9927 = cljs.core._lookup.call(null, map__9923__9925, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9927, validator__9926, null)
    };
    var G__9928 = function(x, var_args) {
      var p__9917 = null;
      if(goog.isDef(var_args)) {
        p__9917 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9928__delegate.call(this, x, p__9917)
    };
    G__9928.cljs$lang$maxFixedArity = 1;
    G__9928.cljs$lang$applyTo = function(arglist__9929) {
      var x = cljs.core.first(arglist__9929);
      var p__9917 = cljs.core.rest(arglist__9929);
      return G__9928__delegate(x, p__9917)
    };
    G__9928.cljs$lang$arity$variadic = G__9928__delegate;
    return G__9928
  }();
  atom = function(x, var_args) {
    var p__9917 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____9933 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9933)) {
    var validate__9934 = temp__3974__auto____9933;
    if(cljs.core.truth_(validate__9934.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__9935 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9935, new_value);
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
    var G__9936__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9936 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9936__delegate.call(this, a, f, x, y, z, more)
    };
    G__9936.cljs$lang$maxFixedArity = 5;
    G__9936.cljs$lang$applyTo = function(arglist__9937) {
      var a = cljs.core.first(arglist__9937);
      var f = cljs.core.first(cljs.core.next(arglist__9937));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9937)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9937))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9937)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9937)))));
      return G__9936__delegate(a, f, x, y, z, more)
    };
    G__9936.cljs$lang$arity$variadic = G__9936__delegate;
    return G__9936
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
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
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
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9938) {
    var iref = cljs.core.first(arglist__9938);
    var f = cljs.core.first(cljs.core.next(arglist__9938));
    var args = cljs.core.rest(cljs.core.next(arglist__9938));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
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
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9939 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9939.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9940 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9940.state, function(p__9941) {
    var map__9942__9943 = p__9941;
    var map__9942__9944 = cljs.core.seq_QMARK_.call(null, map__9942__9943) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9942__9943) : map__9942__9943;
    var curr_state__9945 = map__9942__9944;
    var done__9946 = cljs.core._lookup.call(null, map__9942__9944, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9946)) {
      return curr_state__9945
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9940.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
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
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9967__9968 = options;
    var map__9967__9969 = cljs.core.seq_QMARK_.call(null, map__9967__9968) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9967__9968) : map__9967__9968;
    var keywordize_keys__9970 = cljs.core._lookup.call(null, map__9967__9969, "\ufdd0'keywordize-keys", null);
    var keyfn__9971 = cljs.core.truth_(keywordize_keys__9970) ? cljs.core.keyword : cljs.core.str;
    var f__9986 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2462__auto____9985 = function iter__9979(s__9980) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9980__9983 = s__9980;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9980__9983)) {
                        var k__9984 = cljs.core.first.call(null, s__9980__9983);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9971.call(null, k__9984), thisfn.call(null, x[k__9984])], true), iter__9979.call(null, cljs.core.rest.call(null, s__9980__9983)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2462__auto____9985.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9986.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9987) {
    var x = cljs.core.first(arglist__9987);
    var options = cljs.core.rest(arglist__9987);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9992 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9996__delegate = function(args) {
      var temp__3971__auto____9993 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9992), args, null);
      if(cljs.core.truth_(temp__3971__auto____9993)) {
        var v__9994 = temp__3971__auto____9993;
        return v__9994
      }else {
        var ret__9995 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9992, cljs.core.assoc, args, ret__9995);
        return ret__9995
      }
    };
    var G__9996 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9996__delegate.call(this, args)
    };
    G__9996.cljs$lang$maxFixedArity = 0;
    G__9996.cljs$lang$applyTo = function(arglist__9997) {
      var args = cljs.core.seq(arglist__9997);
      return G__9996__delegate(args)
    };
    G__9996.cljs$lang$arity$variadic = G__9996__delegate;
    return G__9996
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9999 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9999)) {
        var G__10000 = ret__9999;
        f = G__10000;
        continue
      }else {
        return ret__9999
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__10001__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__10001 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10001__delegate.call(this, f, args)
    };
    G__10001.cljs$lang$maxFixedArity = 1;
    G__10001.cljs$lang$applyTo = function(arglist__10002) {
      var f = cljs.core.first(arglist__10002);
      var args = cljs.core.rest(arglist__10002);
      return G__10001__delegate(f, args)
    };
    G__10001.cljs$lang$arity$variadic = G__10001__delegate;
    return G__10001
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
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
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
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
    var k__10004 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__10004, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__10004, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____10013 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____10013) {
      return or__3824__auto____10013
    }else {
      var or__3824__auto____10014 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____10014) {
        return or__3824__auto____10014
      }else {
        var and__3822__auto____10015 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____10015) {
          var and__3822__auto____10016 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____10016) {
            var and__3822__auto____10017 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____10017) {
              var ret__10018 = true;
              var i__10019 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____10020 = cljs.core.not.call(null, ret__10018);
                  if(or__3824__auto____10020) {
                    return or__3824__auto____10020
                  }else {
                    return i__10019 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__10018
                }else {
                  var G__10021 = isa_QMARK_.call(null, h, child.call(null, i__10019), parent.call(null, i__10019));
                  var G__10022 = i__10019 + 1;
                  ret__10018 = G__10021;
                  i__10019 = G__10022;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____10017
            }
          }else {
            return and__3822__auto____10016
          }
        }else {
          return and__3822__auto____10015
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
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__10031 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__10032 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__10033 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__10034 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____10035 = cljs.core.contains_QMARK_.call(null, tp__10031.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__10033.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__10033.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__10031, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__10034.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__10032, parent, ta__10033), "\ufdd0'descendants":tf__10034.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__10033, tag, td__10032)})
    }();
    if(cljs.core.truth_(or__3824__auto____10035)) {
      return or__3824__auto____10035
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
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__10040 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__10041 = cljs.core.truth_(parentMap__10040.call(null, tag)) ? cljs.core.disj.call(null, parentMap__10040.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__10042 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__10041)) ? cljs.core.assoc.call(null, parentMap__10040, tag, childsParents__10041) : cljs.core.dissoc.call(null, parentMap__10040, tag);
    var deriv_seq__10043 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__10023_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__10023_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__10023_SHARP_), cljs.core.second.call(null, p1__10023_SHARP_)))
    }, cljs.core.seq.call(null, newParents__10042)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__10040.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__10024_SHARP_, p2__10025_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__10024_SHARP_, p2__10025_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__10043))
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
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
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
  var xprefs__10051 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____10053 = cljs.core.truth_(function() {
    var and__3822__auto____10052 = xprefs__10051;
    if(cljs.core.truth_(and__3822__auto____10052)) {
      return xprefs__10051.call(null, y)
    }else {
      return and__3822__auto____10052
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____10053)) {
    return or__3824__auto____10053
  }else {
    var or__3824__auto____10055 = function() {
      var ps__10054 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__10054) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__10054), prefer_table))) {
          }else {
          }
          var G__10058 = cljs.core.rest.call(null, ps__10054);
          ps__10054 = G__10058;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____10055)) {
      return or__3824__auto____10055
    }else {
      var or__3824__auto____10057 = function() {
        var ps__10056 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__10056) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__10056), y, prefer_table))) {
            }else {
            }
            var G__10059 = cljs.core.rest.call(null, ps__10056);
            ps__10056 = G__10059;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____10057)) {
        return or__3824__auto____10057
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____10061 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____10061)) {
    return or__3824__auto____10061
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10079 = cljs.core.reduce.call(null, function(be, p__10071) {
    var vec__10072__10073 = p__10071;
    var k__10074 = cljs.core.nth.call(null, vec__10072__10073, 0, null);
    var ___10075 = cljs.core.nth.call(null, vec__10072__10073, 1, null);
    var e__10076 = vec__10072__10073;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10074)) {
      var be2__10078 = cljs.core.truth_(function() {
        var or__3824__auto____10077 = be == null;
        if(or__3824__auto____10077) {
          return or__3824__auto____10077
        }else {
          return cljs.core.dominates.call(null, k__10074, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10076 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10078), k__10074, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10074), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10078)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10078
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10079)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10079));
      return cljs.core.second.call(null, best_entry__10079)
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
    var and__3822__auto____10084 = mf;
    if(and__3822__auto____10084) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10084
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2363__auto____10085 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10086 = cljs.core._reset[goog.typeOf(x__2363__auto____10085)];
      if(or__3824__auto____10086) {
        return or__3824__auto____10086
      }else {
        var or__3824__auto____10087 = cljs.core._reset["_"];
        if(or__3824__auto____10087) {
          return or__3824__auto____10087
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10092 = mf;
    if(and__3822__auto____10092) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10092
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2363__auto____10093 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10094 = cljs.core._add_method[goog.typeOf(x__2363__auto____10093)];
      if(or__3824__auto____10094) {
        return or__3824__auto____10094
      }else {
        var or__3824__auto____10095 = cljs.core._add_method["_"];
        if(or__3824__auto____10095) {
          return or__3824__auto____10095
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10100 = mf;
    if(and__3822__auto____10100) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10100
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____10101 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10102 = cljs.core._remove_method[goog.typeOf(x__2363__auto____10101)];
      if(or__3824__auto____10102) {
        return or__3824__auto____10102
      }else {
        var or__3824__auto____10103 = cljs.core._remove_method["_"];
        if(or__3824__auto____10103) {
          return or__3824__auto____10103
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10108 = mf;
    if(and__3822__auto____10108) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10108
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2363__auto____10109 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10110 = cljs.core._prefer_method[goog.typeOf(x__2363__auto____10109)];
      if(or__3824__auto____10110) {
        return or__3824__auto____10110
      }else {
        var or__3824__auto____10111 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10111) {
          return or__3824__auto____10111
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10116 = mf;
    if(and__3822__auto____10116) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10116
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2363__auto____10117 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10118 = cljs.core._get_method[goog.typeOf(x__2363__auto____10117)];
      if(or__3824__auto____10118) {
        return or__3824__auto____10118
      }else {
        var or__3824__auto____10119 = cljs.core._get_method["_"];
        if(or__3824__auto____10119) {
          return or__3824__auto____10119
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10124 = mf;
    if(and__3822__auto____10124) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10124
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2363__auto____10125 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10126 = cljs.core._methods[goog.typeOf(x__2363__auto____10125)];
      if(or__3824__auto____10126) {
        return or__3824__auto____10126
      }else {
        var or__3824__auto____10127 = cljs.core._methods["_"];
        if(or__3824__auto____10127) {
          return or__3824__auto____10127
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10132 = mf;
    if(and__3822__auto____10132) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10132
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2363__auto____10133 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10134 = cljs.core._prefers[goog.typeOf(x__2363__auto____10133)];
      if(or__3824__auto____10134) {
        return or__3824__auto____10134
      }else {
        var or__3824__auto____10135 = cljs.core._prefers["_"];
        if(or__3824__auto____10135) {
          return or__3824__auto____10135
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10140 = mf;
    if(and__3822__auto____10140) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10140
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2363__auto____10141 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10142 = cljs.core._dispatch[goog.typeOf(x__2363__auto____10141)];
      if(or__3824__auto____10142) {
        return or__3824__auto____10142
      }else {
        var or__3824__auto____10143 = cljs.core._dispatch["_"];
        if(or__3824__auto____10143) {
          return or__3824__auto____10143
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10146 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10147 = cljs.core._get_method.call(null, mf, dispatch_val__10146);
  if(cljs.core.truth_(target_fn__10147)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10146)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10147, args)
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
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10148 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10149 = this;
  cljs.core.swap_BANG_.call(null, this__10149.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10149.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10149.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10149.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10150 = this;
  cljs.core.swap_BANG_.call(null, this__10150.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10150.method_cache, this__10150.method_table, this__10150.cached_hierarchy, this__10150.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10151 = this;
  cljs.core.swap_BANG_.call(null, this__10151.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10151.method_cache, this__10151.method_table, this__10151.cached_hierarchy, this__10151.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10152 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10152.cached_hierarchy), cljs.core.deref.call(null, this__10152.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10152.method_cache, this__10152.method_table, this__10152.cached_hierarchy, this__10152.hierarchy)
  }
  var temp__3971__auto____10153 = cljs.core.deref.call(null, this__10152.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10153)) {
    var target_fn__10154 = temp__3971__auto____10153;
    return target_fn__10154
  }else {
    var temp__3971__auto____10155 = cljs.core.find_and_cache_best_method.call(null, this__10152.name, dispatch_val, this__10152.hierarchy, this__10152.method_table, this__10152.prefer_table, this__10152.method_cache, this__10152.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10155)) {
      var target_fn__10156 = temp__3971__auto____10155;
      return target_fn__10156
    }else {
      return cljs.core.deref.call(null, this__10152.method_table).call(null, this__10152.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10157 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10157.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10157.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10157.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10157.method_cache, this__10157.method_table, this__10157.cached_hierarchy, this__10157.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10158 = this;
  return cljs.core.deref.call(null, this__10158.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10159 = this;
  return cljs.core.deref.call(null, this__10159.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10160 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10160.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10162__delegate = function(_, args) {
    var self__10161 = this;
    return cljs.core._dispatch.call(null, self__10161, args)
  };
  var G__10162 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10162__delegate.call(this, _, args)
  };
  G__10162.cljs$lang$maxFixedArity = 1;
  G__10162.cljs$lang$applyTo = function(arglist__10163) {
    var _ = cljs.core.first(arglist__10163);
    var args = cljs.core.rest(arglist__10163);
    return G__10162__delegate(_, args)
  };
  G__10162.cljs$lang$arity$variadic = G__10162__delegate;
  return G__10162
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10164 = this;
  return cljs.core._dispatch.call(null, self__10164, args)
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
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2309__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10165 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10167, _) {
  var this__10166 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10166.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10168 = this;
  var and__3822__auto____10169 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10169) {
    return this__10168.uuid === other.uuid
  }else {
    return and__3822__auto____10169
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10170 = this;
  var this__10171 = this;
  return cljs.core.pr_str.call(null, this__10171)
};
cljs.core.UUID;
// Input 10
goog.provide("helloworld.graph");
goog.require("cljs.core");
helloworld.graph.line_height = 250;
helloworld.graph.line = function line(context, x1, y1, x2, y2) {
  var G__6189__6190 = context;
  G__6189__6190.beginPath();
  G__6189__6190.moveTo(x1, y1);
  G__6189__6190.lineTo(x2, y2);
  G__6189__6190.stroke();
  return G__6189__6190
};
helloworld.graph.arc = function arc(context, x, y, r, s, e) {
  var G__6193__6194 = context;
  G__6193__6194.beginPath();
  G__6193__6194.arc(x, y, r, Math.PI * s, Math.PI * e, true);
  G__6193__6194.stroke();
  return G__6193__6194
};
helloworld.graph.figure = cljs.core.PersistentArrayMap.fromArrays(["h", "e", "l", "o", "w", "r", "d"], [cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([helloworld.graph.arc, 0, 0, 100, 0.35, 1.65], true), cljs.core.PersistentVector.fromArray([helloworld.graph.arc, 0, 0, 100, 1.35, 0.65], true), cljs.core.PersistentVector.fromArray([helloworld.graph.line, -100, 0, 100, 0], true)], true), cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([helloworld.graph.arc, 
0, 0, 100, 1.75, 0.25], true), cljs.core.PersistentVector.fromArray([helloworld.graph.line, -100, 0, 50, 0], true)], true), cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([helloworld.graph.arc, 0, 0, 100, 1.5, 0.25], true)], true), cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([helloworld.graph.arc, 0, 0, 100, 0, 2], true)], true), cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([helloworld.graph.arc, 0, 0, 100, 0.35, 
1.65], true), cljs.core.PersistentVector.fromArray([helloworld.graph.arc, 0, 0, 100, 1.35, 0.65], true), cljs.core.PersistentVector.fromArray([helloworld.graph.arc, -50, 38, 50, 0.48, 0], true), cljs.core.PersistentVector.fromArray([helloworld.graph.arc, 50, 38, 50, 1, 0.52], true)], true), cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([helloworld.graph.line, -70, -87, -70, 100], true), cljs.core.PersistentVector.fromArray([helloworld.graph.arc, -30, -30, 70, 0.7, 1.3], 
true), cljs.core.PersistentVector.fromArray([helloworld.graph.line, -15, 37, 30, 100], true)], true), cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([helloworld.graph.line, -30, -95, -30, 95], true), cljs.core.PersistentVector.fromArray([helloworld.graph.arc, 0, 0, 100, 0.7, 1.3], true)], true)]);
helloworld.graph.unknown = cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([helloworld.graph.line, -100, -100, 100, 100], true), cljs.core.PersistentVector.fromArray([helloworld.graph.line, -100, 100, 100, -100], true)], true);
helloworld.graph.draw_figure = function draw_figure(context, p__6195) {
  var vec__6203__6205 = p__6195;
  var vec__6204__6206 = cljs.core.nth.call(null, vec__6203__6205, 0, null);
  var op__6207 = cljs.core.nth.call(null, vec__6204__6206, 0, null);
  var args__6208 = cljs.core.nthnext.call(null, vec__6204__6206, 1);
  var r__6209 = cljs.core.nthnext.call(null, vec__6203__6205, 1);
  cljs.core.apply.call(null, op__6207, context, args__6208);
  if(cljs.core.truth_(r__6209)) {
    return draw_figure.call(null, context, r__6209)
  }else {
    return null
  }
};
helloworld.graph.draw_line = function draw_line(context, p__6210) {
  var vec__6215__6216 = p__6210;
  var c__6217 = cljs.core.nth.call(null, vec__6215__6216, 0, null);
  var r__6218 = cljs.core.nthnext.call(null, vec__6215__6216, 1);
  helloworld.graph.draw_figure.call(null, context, cljs.core._lookup.call(null, helloworld.graph.figure, c__6217, helloworld.graph.unknown));
  if(cljs.core.truth_(r__6218)) {
    context.translate(250, 0);
    return draw_line.call(null, context, r__6218)
  }else {
    return null
  }
};
helloworld.graph.draw_text = function draw_text(context, x, y, p__6219) {
  var vec__6226__6227 = p__6219;
  var line__6228 = cljs.core.nth.call(null, vec__6226__6227, 0, null);
  var r__6229 = cljs.core.nthnext.call(null, vec__6226__6227, 1);
  var G__6230__6231 = context;
  G__6230__6231.setTransform(1, 0, 0, 1, x, y);
  helloworld.graph.draw_line.call(null, G__6230__6231, line__6228);
  G__6230__6231;
  if(cljs.core.truth_(r__6229)) {
    return draw_text.call(null, context, x, y + helloworld.graph.line_height, r__6229)
  }else {
    return null
  }
};
// Input 11
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
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
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
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
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__10178 = s;
      var limit__10179 = limit;
      var parts__10180 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__10179, 1)) {
          return cljs.core.conj.call(null, parts__10180, s__10178)
        }else {
          var temp__3971__auto____10181 = cljs.core.re_find.call(null, re, s__10178);
          if(cljs.core.truth_(temp__3971__auto____10181)) {
            var m__10182 = temp__3971__auto____10181;
            var index__10183 = s__10178.indexOf(m__10182);
            var G__10184 = s__10178.substring(index__10183 + cljs.core.count.call(null, m__10182));
            var G__10185 = limit__10179 - 1;
            var G__10186 = cljs.core.conj.call(null, parts__10180, s__10178.substring(0, index__10183));
            s__10178 = G__10184;
            limit__10179 = G__10185;
            parts__10180 = G__10186;
            continue
          }else {
            return cljs.core.conj.call(null, parts__10180, s__10178)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
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
  var index__10190 = s.length;
  while(true) {
    if(index__10190 === 0) {
      return""
    }else {
      var ch__10191 = cljs.core._lookup.call(null, s, index__10190 - 1, null);
      if(function() {
        var or__3824__auto____10192 = cljs.core._EQ_.call(null, ch__10191, "\n");
        if(or__3824__auto____10192) {
          return or__3824__auto____10192
        }else {
          return cljs.core._EQ_.call(null, ch__10191, "\r")
        }
      }()) {
        var G__10193 = index__10190 - 1;
        index__10190 = G__10193;
        continue
      }else {
        return s.substring(0, index__10190)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__10197 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3824__auto____10198 = cljs.core.not.call(null, s__10197);
    if(or__3824__auto____10198) {
      return or__3824__auto____10198
    }else {
      var or__3824__auto____10199 = cljs.core._EQ_.call(null, "", s__10197);
      if(or__3824__auto____10199) {
        return or__3824__auto____10199
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__10197)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__10206 = new goog.string.StringBuffer;
  var length__10207 = s.length;
  var index__10208 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__10207, index__10208)) {
      return buffer__10206.toString()
    }else {
      var ch__10209 = s.charAt(index__10208);
      var temp__3971__auto____10210 = cljs.core._lookup.call(null, cmap, ch__10209, null);
      if(cljs.core.truth_(temp__3971__auto____10210)) {
        var replacement__10211 = temp__3971__auto____10210;
        buffer__10206.append([cljs.core.str(replacement__10211)].join(""))
      }else {
        buffer__10206.append(ch__10209)
      }
      var G__10212 = index__10208 + 1;
      index__10208 = G__10212;
      continue
    }
    break
  }
};
// Input 12
goog.provide("helloworld.canvas");
goog.require("cljs.core");
goog.require("clojure.string");
goog.require("clojure.string");
helloworld.canvas.log = function() {
  var log__delegate = function(msg) {
    return console.log(clojure.string.join.call(null, " ", msg))
  };
  var log = function(var_args) {
    var msg = null;
    if(goog.isDef(var_args)) {
      msg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, msg)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__6137) {
    var msg = cljs.core.seq(arglist__6137);
    return log__delegate(msg)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
helloworld.canvas.get_canvas = function get_canvas() {
  var canvas__6139 = document.getElementById("canvas");
  canvas__6139.width = document.width;
  canvas__6139.height = document.height;
  canvasW = canvas__6139.width;
  heightW = canvas__6139.height;
  return canvas__6139
};
helloworld.canvas.get_context = function get_context() {
  var context__6141 = helloworld.canvas.get_canvas.call(null).getContext("2d");
  context__6141.strokeStyle = "#00FF00";
  context__6141.lineWidth = 2;
  context__6141.lineCap = "butt";
  return context__6141
};
// Input 13
goog.provide("helloworld.core");
goog.require("cljs.core");
goog.require("clojure.string");
goog.require("helloworld.canvas");
goog.require("helloworld.graph");
goog.require("clojure.string");
helloworld.core.main = function main() {
  return helloworld.graph.draw_text.call(null, helloworld.canvas.get_context.call(null), 150, 150, clojure.string.split_lines.call(null, "hello\nworld"))
};
goog.exportSymbol("helloworld.core.main", helloworld.core.main);
