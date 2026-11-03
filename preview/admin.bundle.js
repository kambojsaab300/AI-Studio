var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "../node_modules/react/cjs/react.development.js"(exports, module) {
    "use strict";
    if (true) {
      (function() {
        "use strict";
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === "function") {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(new Error());
        }
        var ReactVersion = "18.3.1";
        var REACT_ELEMENT_TYPE = Symbol.for("react.element");
        var REACT_PORTAL_TYPE = Symbol.for("react.portal");
        var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
        var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
        var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
        var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
        var REACT_CONTEXT_TYPE = Symbol.for("react.context");
        var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
        var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
        var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
        var REACT_MEMO_TYPE = Symbol.for("react.memo");
        var REACT_LAZY_TYPE = Symbol.for("react.lazy");
        var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
        var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
        var FAUX_ITERATOR_SYMBOL = "@@iterator";
        function getIteratorFn(maybeIterable) {
          if (maybeIterable === null || typeof maybeIterable !== "object") {
            return null;
          }
          var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
          if (typeof maybeIterator === "function") {
            return maybeIterator;
          }
          return null;
        }
        var ReactCurrentDispatcher = {
          /**
           * @internal
           * @type {ReactComponent}
           */
          current: null
        };
        var ReactCurrentBatchConfig = {
          transition: null
        };
        var ReactCurrentActQueue = {
          current: null,
          // Used to reproduce behavior of `batchedUpdates` in legacy mode.
          isBatchingLegacy: false,
          didScheduleLegacyUpdate: false
        };
        var ReactCurrentOwner = {
          /**
           * @internal
           * @type {ReactComponent}
           */
          current: null
        };
        var ReactDebugCurrentFrame = {};
        var currentExtraStackFrame = null;
        function setExtraStackFrame(stack) {
          {
            currentExtraStackFrame = stack;
          }
        }
        {
          ReactDebugCurrentFrame.setExtraStackFrame = function(stack) {
            {
              currentExtraStackFrame = stack;
            }
          };
          ReactDebugCurrentFrame.getCurrentStack = null;
          ReactDebugCurrentFrame.getStackAddendum = function() {
            var stack = "";
            if (currentExtraStackFrame) {
              stack += currentExtraStackFrame;
            }
            var impl = ReactDebugCurrentFrame.getCurrentStack;
            if (impl) {
              stack += impl() || "";
            }
            return stack;
          };
        }
        var enableScopeAPI = false;
        var enableCacheElement = false;
        var enableTransitionTracing = false;
        var enableLegacyHidden = false;
        var enableDebugTracing = false;
        var ReactSharedInternals = {
          ReactCurrentDispatcher,
          ReactCurrentBatchConfig,
          ReactCurrentOwner
        };
        {
          ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
          ReactSharedInternals.ReactCurrentActQueue = ReactCurrentActQueue;
        }
        function warn(format) {
          {
            {
              for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
              }
              printWarning("warn", format, args);
            }
          }
        }
        function error(format) {
          {
            {
              for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
              }
              printWarning("error", format, args);
            }
          }
        }
        function printWarning(level, format, args) {
          {
            var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
            var stack = ReactDebugCurrentFrame2.getStackAddendum();
            if (stack !== "") {
              format += "%s";
              args = args.concat([stack]);
            }
            var argsWithFormat = args.map(function(item) {
              return String(item);
            });
            argsWithFormat.unshift("Warning: " + format);
            Function.prototype.apply.call(console[level], console, argsWithFormat);
          }
        }
        var didWarnStateUpdateForUnmountedComponent = {};
        function warnNoop(publicInstance, callerName) {
          {
            var _constructor = publicInstance.constructor;
            var componentName = _constructor && (_constructor.displayName || _constructor.name) || "ReactClass";
            var warningKey = componentName + "." + callerName;
            if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
              return;
            }
            error("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.", callerName, componentName);
            didWarnStateUpdateForUnmountedComponent[warningKey] = true;
          }
        }
        var ReactNoopUpdateQueue = {
          /**
           * Checks whether or not this composite component is mounted.
           * @param {ReactClass} publicInstance The instance we want to test.
           * @return {boolean} True if mounted, false otherwise.
           * @protected
           * @final
           */
          isMounted: function(publicInstance) {
            return false;
          },
          /**
           * Forces an update. This should only be invoked when it is known with
           * certainty that we are **not** in a DOM transaction.
           *
           * You may want to call this when you know that some deeper aspect of the
           * component's state has changed but `setState` was not called.
           *
           * This will not invoke `shouldComponentUpdate`, but it will invoke
           * `componentWillUpdate` and `componentDidUpdate`.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {?function} callback Called after component is updated.
           * @param {?string} callerName name of the calling function in the public API.
           * @internal
           */
          enqueueForceUpdate: function(publicInstance, callback, callerName) {
            warnNoop(publicInstance, "forceUpdate");
          },
          /**
           * Replaces all of the state. Always use this or `setState` to mutate state.
           * You should treat `this.state` as immutable.
           *
           * There is no guarantee that `this.state` will be immediately updated, so
           * accessing `this.state` after calling this method may return the old value.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {object} completeState Next state.
           * @param {?function} callback Called after component is updated.
           * @param {?string} callerName name of the calling function in the public API.
           * @internal
           */
          enqueueReplaceState: function(publicInstance, completeState, callback, callerName) {
            warnNoop(publicInstance, "replaceState");
          },
          /**
           * Sets a subset of the state. This only exists because _pendingState is
           * internal. This provides a merging strategy that is not available to deep
           * properties which is confusing. TODO: Expose pendingState or don't use it
           * during the merge.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {object} partialState Next partial state to be merged with state.
           * @param {?function} callback Called after component is updated.
           * @param {?string} Name of the calling function in the public API.
           * @internal
           */
          enqueueSetState: function(publicInstance, partialState, callback, callerName) {
            warnNoop(publicInstance, "setState");
          }
        };
        var assign = Object.assign;
        var emptyObject = {};
        {
          Object.freeze(emptyObject);
        }
        function Component(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        Component.prototype.isReactComponent = {};
        Component.prototype.setState = function(partialState, callback) {
          if (typeof partialState !== "object" && typeof partialState !== "function" && partialState != null) {
            throw new Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
          }
          this.updater.enqueueSetState(this, partialState, callback, "setState");
        };
        Component.prototype.forceUpdate = function(callback) {
          this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
        };
        {
          var deprecatedAPIs = {
            isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
            replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
          };
          var defineDeprecationWarning = function(methodName, info) {
            Object.defineProperty(Component.prototype, methodName, {
              get: function() {
                warn("%s(...) is deprecated in plain JavaScript React classes. %s", info[0], info[1]);
                return void 0;
              }
            });
          };
          for (var fnName in deprecatedAPIs) {
            if (deprecatedAPIs.hasOwnProperty(fnName)) {
              defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
            }
          }
        }
        function ComponentDummy() {
        }
        ComponentDummy.prototype = Component.prototype;
        function PureComponent(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
        pureComponentPrototype.constructor = PureComponent;
        assign(pureComponentPrototype, Component.prototype);
        pureComponentPrototype.isPureReactComponent = true;
        function createRef() {
          var refObject = {
            current: null
          };
          {
            Object.seal(refObject);
          }
          return refObject;
        }
        var isArrayImpl = Array.isArray;
        function isArray(a) {
          return isArrayImpl(a);
        }
        function typeName(value) {
          {
            var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
            var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            return type;
          }
        }
        function willCoercionThrow(value) {
          {
            try {
              testStringCoercion(value);
              return false;
            } catch (e) {
              return true;
            }
          }
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkKeyStringCoercion(value) {
          {
            if (willCoercionThrow(value)) {
              error("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", typeName(value));
              return testStringCoercion(value);
            }
          }
        }
        function getWrappedName(outerType, innerType, wrapperName) {
          var displayName = outerType.displayName;
          if (displayName) {
            return displayName;
          }
          var functionName = innerType.displayName || innerType.name || "";
          return functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName;
        }
        function getContextName(type) {
          return type.displayName || "Context";
        }
        function getComponentNameFromType(type) {
          if (type == null) {
            return null;
          }
          {
            if (typeof type.tag === "number") {
              error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.");
            }
          }
          if (typeof type === "function") {
            return type.displayName || type.name || null;
          }
          if (typeof type === "string") {
            return type;
          }
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_CONTEXT_TYPE:
                var context = type;
                return getContextName(context) + ".Consumer";
              case REACT_PROVIDER_TYPE:
                var provider = type;
                return getContextName(provider._context) + ".Provider";
              case REACT_FORWARD_REF_TYPE:
                return getWrappedName(type, type.render, "ForwardRef");
              case REACT_MEMO_TYPE:
                var outerName = type.displayName || null;
                if (outerName !== null) {
                  return outerName;
                }
                return getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return getComponentNameFromType(init(payload));
                } catch (x) {
                  return null;
                }
              }
            }
          }
          return null;
        }
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var RESERVED_PROPS = {
          key: true,
          ref: true,
          __self: true,
          __source: true
        };
        var specialPropKeyWarningShown, specialPropRefWarningShown, didWarnAboutStringRefs;
        {
          didWarnAboutStringRefs = {};
        }
        function hasValidRef(config) {
          {
            if (hasOwnProperty.call(config, "ref")) {
              var getter = Object.getOwnPropertyDescriptor(config, "ref").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.ref !== void 0;
        }
        function hasValidKey(config) {
          {
            if (hasOwnProperty.call(config, "key")) {
              var getter = Object.getOwnPropertyDescriptor(config, "key").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.key !== void 0;
        }
        function defineKeyPropWarningGetter(props, displayName) {
          var warnAboutAccessingKey = function() {
            {
              if (!specialPropKeyWarningShown) {
                specialPropKeyWarningShown = true;
                error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            }
          };
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: true
          });
        }
        function defineRefPropWarningGetter(props, displayName) {
          var warnAboutAccessingRef = function() {
            {
              if (!specialPropRefWarningShown) {
                specialPropRefWarningShown = true;
                error("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            }
          };
          warnAboutAccessingRef.isReactWarning = true;
          Object.defineProperty(props, "ref", {
            get: warnAboutAccessingRef,
            configurable: true
          });
        }
        function warnIfStringRefCannotBeAutoConverted(config) {
          {
            if (typeof config.ref === "string" && ReactCurrentOwner.current && config.__self && ReactCurrentOwner.current.stateNode !== config.__self) {
              var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);
              if (!didWarnAboutStringRefs[componentName]) {
                error('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', componentName, config.ref);
                didWarnAboutStringRefs[componentName] = true;
              }
            }
          }
        }
        var ReactElement = function(type, key, ref, self, source, owner, props) {
          var element = {
            // This tag allows us to uniquely identify this as a React Element
            $$typeof: REACT_ELEMENT_TYPE,
            // Built-in properties that belong on the element
            type,
            key,
            ref,
            props,
            // Record the component responsible for creating this element.
            _owner: owner
          };
          {
            element._store = {};
            Object.defineProperty(element._store, "validated", {
              configurable: false,
              enumerable: false,
              writable: true,
              value: false
            });
            Object.defineProperty(element, "_self", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: self
            });
            Object.defineProperty(element, "_source", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: source
            });
            if (Object.freeze) {
              Object.freeze(element.props);
              Object.freeze(element);
            }
          }
          return element;
        };
        function createElement2(type, config, children) {
          var propName;
          var props = {};
          var key = null;
          var ref = null;
          var self = null;
          var source = null;
          if (config != null) {
            if (hasValidRef(config)) {
              ref = config.ref;
              {
                warnIfStringRefCannotBeAutoConverted(config);
              }
            }
            if (hasValidKey(config)) {
              {
                checkKeyStringCoercion(config.key);
              }
              key = "" + config.key;
            }
            self = config.__self === void 0 ? null : config.__self;
            source = config.__source === void 0 ? null : config.__source;
            for (propName in config) {
              if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                props[propName] = config[propName];
              }
            }
          }
          var childrenLength = arguments.length - 2;
          if (childrenLength === 1) {
            props.children = children;
          } else if (childrenLength > 1) {
            var childArray = Array(childrenLength);
            for (var i = 0; i < childrenLength; i++) {
              childArray[i] = arguments[i + 2];
            }
            {
              if (Object.freeze) {
                Object.freeze(childArray);
              }
            }
            props.children = childArray;
          }
          if (type && type.defaultProps) {
            var defaultProps = type.defaultProps;
            for (propName in defaultProps) {
              if (props[propName] === void 0) {
                props[propName] = defaultProps[propName];
              }
            }
          }
          {
            if (key || ref) {
              var displayName = typeof type === "function" ? type.displayName || type.name || "Unknown" : type;
              if (key) {
                defineKeyPropWarningGetter(props, displayName);
              }
              if (ref) {
                defineRefPropWarningGetter(props, displayName);
              }
            }
          }
          return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
        }
        function cloneAndReplaceKey(oldElement, newKey) {
          var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);
          return newElement;
        }
        function cloneElement(element, config, children) {
          if (element === null || element === void 0) {
            throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + element + ".");
          }
          var propName;
          var props = assign({}, element.props);
          var key = element.key;
          var ref = element.ref;
          var self = element._self;
          var source = element._source;
          var owner = element._owner;
          if (config != null) {
            if (hasValidRef(config)) {
              ref = config.ref;
              owner = ReactCurrentOwner.current;
            }
            if (hasValidKey(config)) {
              {
                checkKeyStringCoercion(config.key);
              }
              key = "" + config.key;
            }
            var defaultProps;
            if (element.type && element.type.defaultProps) {
              defaultProps = element.type.defaultProps;
            }
            for (propName in config) {
              if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                if (config[propName] === void 0 && defaultProps !== void 0) {
                  props[propName] = defaultProps[propName];
                } else {
                  props[propName] = config[propName];
                }
              }
            }
          }
          var childrenLength = arguments.length - 2;
          if (childrenLength === 1) {
            props.children = children;
          } else if (childrenLength > 1) {
            var childArray = Array(childrenLength);
            for (var i = 0; i < childrenLength; i++) {
              childArray[i] = arguments[i + 2];
            }
            props.children = childArray;
          }
          return ReactElement(element.type, key, ref, self, source, owner, props);
        }
        function isValidElement(object) {
          return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
        }
        var SEPARATOR = ".";
        var SUBSEPARATOR = ":";
        function escape(key) {
          var escapeRegex = /[=:]/g;
          var escaperLookup = {
            "=": "=0",
            ":": "=2"
          };
          var escapedString = key.replace(escapeRegex, function(match) {
            return escaperLookup[match];
          });
          return "$" + escapedString;
        }
        var didWarnAboutMaps = false;
        var userProvidedKeyEscapeRegex = /\/+/g;
        function escapeUserProvidedKey(text) {
          return text.replace(userProvidedKeyEscapeRegex, "$&/");
        }
        function getElementKey(element, index) {
          if (typeof element === "object" && element !== null && element.key != null) {
            {
              checkKeyStringCoercion(element.key);
            }
            return escape("" + element.key);
          }
          return index.toString(36);
        }
        function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
          var type = typeof children;
          if (type === "undefined" || type === "boolean") {
            children = null;
          }
          var invokeCallback = false;
          if (children === null) {
            invokeCallback = true;
          } else {
            switch (type) {
              case "string":
              case "number":
                invokeCallback = true;
                break;
              case "object":
                switch (children.$$typeof) {
                  case REACT_ELEMENT_TYPE:
                  case REACT_PORTAL_TYPE:
                    invokeCallback = true;
                }
            }
          }
          if (invokeCallback) {
            var _child = children;
            var mappedChild = callback(_child);
            var childKey = nameSoFar === "" ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;
            if (isArray(mappedChild)) {
              var escapedChildKey = "";
              if (childKey != null) {
                escapedChildKey = escapeUserProvidedKey(childKey) + "/";
              }
              mapIntoArray(mappedChild, array, escapedChildKey, "", function(c) {
                return c;
              });
            } else if (mappedChild != null) {
              if (isValidElement(mappedChild)) {
                {
                  if (mappedChild.key && (!_child || _child.key !== mappedChild.key)) {
                    checkKeyStringCoercion(mappedChild.key);
                  }
                }
                mappedChild = cloneAndReplaceKey(
                  mappedChild,
                  // Keep both the (mapped) and old keys if they differ, just as
                  // traverseAllChildren used to do for objects as children
                  escapedPrefix + // $FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
                  (mappedChild.key && (!_child || _child.key !== mappedChild.key) ? (
                    // $FlowFixMe Flow incorrectly thinks existing element's key can be a number
                    // eslint-disable-next-line react-internal/safe-string-coercion
                    escapeUserProvidedKey("" + mappedChild.key) + "/"
                  ) : "") + childKey
                );
              }
              array.push(mappedChild);
            }
            return 1;
          }
          var child;
          var nextName;
          var subtreeCount = 0;
          var nextNamePrefix = nameSoFar === "" ? SEPARATOR : nameSoFar + SUBSEPARATOR;
          if (isArray(children)) {
            for (var i = 0; i < children.length; i++) {
              child = children[i];
              nextName = nextNamePrefix + getElementKey(child, i);
              subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
            }
          } else {
            var iteratorFn = getIteratorFn(children);
            if (typeof iteratorFn === "function") {
              var iterableChildren = children;
              {
                if (iteratorFn === iterableChildren.entries) {
                  if (!didWarnAboutMaps) {
                    warn("Using Maps as children is not supported. Use an array of keyed ReactElements instead.");
                  }
                  didWarnAboutMaps = true;
                }
              }
              var iterator = iteratorFn.call(iterableChildren);
              var step;
              var ii = 0;
              while (!(step = iterator.next()).done) {
                child = step.value;
                nextName = nextNamePrefix + getElementKey(child, ii++);
                subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
              }
            } else if (type === "object") {
              var childrenString = String(children);
              throw new Error("Objects are not valid as a React child (found: " + (childrenString === "[object Object]" ? "object with keys {" + Object.keys(children).join(", ") + "}" : childrenString) + "). If you meant to render a collection of children, use an array instead.");
            }
          }
          return subtreeCount;
        }
        function mapChildren(children, func, context) {
          if (children == null) {
            return children;
          }
          var result = [];
          var count = 0;
          mapIntoArray(children, result, "", "", function(child) {
            return func.call(context, child, count++);
          });
          return result;
        }
        function countChildren(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        }
        function forEachChildren(children, forEachFunc, forEachContext) {
          mapChildren(children, function() {
            forEachFunc.apply(this, arguments);
          }, forEachContext);
        }
        function toArray(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        }
        function onlyChild(children) {
          if (!isValidElement(children)) {
            throw new Error("React.Children.only expected to receive a single React element child.");
          }
          return children;
        }
        function createContext2(defaultValue) {
          var context = {
            $$typeof: REACT_CONTEXT_TYPE,
            // As a workaround to support multiple concurrent renderers, we categorize
            // some renderers as primary and others as secondary. We only expect
            // there to be two concurrent renderers at most: React Native (primary) and
            // Fabric (secondary); React DOM (primary) and React ART (secondary).
            // Secondary renderers store their context values on separate fields.
            _currentValue: defaultValue,
            _currentValue2: defaultValue,
            // Used to track how many concurrent renderers this context currently
            // supports within in a single renderer. Such as parallel server rendering.
            _threadCount: 0,
            // These are circular
            Provider: null,
            Consumer: null,
            // Add these to use same hidden class in VM as ServerContext
            _defaultValue: null,
            _globalName: null
          };
          context.Provider = {
            $$typeof: REACT_PROVIDER_TYPE,
            _context: context
          };
          var hasWarnedAboutUsingNestedContextConsumers = false;
          var hasWarnedAboutUsingConsumerProvider = false;
          var hasWarnedAboutDisplayNameOnConsumer = false;
          {
            var Consumer = {
              $$typeof: REACT_CONTEXT_TYPE,
              _context: context
            };
            Object.defineProperties(Consumer, {
              Provider: {
                get: function() {
                  if (!hasWarnedAboutUsingConsumerProvider) {
                    hasWarnedAboutUsingConsumerProvider = true;
                    error("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?");
                  }
                  return context.Provider;
                },
                set: function(_Provider) {
                  context.Provider = _Provider;
                }
              },
              _currentValue: {
                get: function() {
                  return context._currentValue;
                },
                set: function(_currentValue) {
                  context._currentValue = _currentValue;
                }
              },
              _currentValue2: {
                get: function() {
                  return context._currentValue2;
                },
                set: function(_currentValue2) {
                  context._currentValue2 = _currentValue2;
                }
              },
              _threadCount: {
                get: function() {
                  return context._threadCount;
                },
                set: function(_threadCount) {
                  context._threadCount = _threadCount;
                }
              },
              Consumer: {
                get: function() {
                  if (!hasWarnedAboutUsingNestedContextConsumers) {
                    hasWarnedAboutUsingNestedContextConsumers = true;
                    error("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?");
                  }
                  return context.Consumer;
                }
              },
              displayName: {
                get: function() {
                  return context.displayName;
                },
                set: function(displayName) {
                  if (!hasWarnedAboutDisplayNameOnConsumer) {
                    warn("Setting `displayName` on Context.Consumer has no effect. You should set it directly on the context with Context.displayName = '%s'.", displayName);
                    hasWarnedAboutDisplayNameOnConsumer = true;
                  }
                }
              }
            });
            context.Consumer = Consumer;
          }
          {
            context._currentRenderer = null;
            context._currentRenderer2 = null;
          }
          return context;
        }
        var Uninitialized = -1;
        var Pending = 0;
        var Resolved = 1;
        var Rejected = 2;
        function lazyInitializer(payload) {
          if (payload._status === Uninitialized) {
            var ctor = payload._result;
            var thenable = ctor();
            thenable.then(function(moduleObject2) {
              if (payload._status === Pending || payload._status === Uninitialized) {
                var resolved = payload;
                resolved._status = Resolved;
                resolved._result = moduleObject2;
              }
            }, function(error2) {
              if (payload._status === Pending || payload._status === Uninitialized) {
                var rejected = payload;
                rejected._status = Rejected;
                rejected._result = error2;
              }
            });
            if (payload._status === Uninitialized) {
              var pending = payload;
              pending._status = Pending;
              pending._result = thenable;
            }
          }
          if (payload._status === Resolved) {
            var moduleObject = payload._result;
            {
              if (moduleObject === void 0) {
                error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?", moduleObject);
              }
            }
            {
              if (!("default" in moduleObject)) {
                error("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))", moduleObject);
              }
            }
            return moduleObject.default;
          } else {
            throw payload._result;
          }
        }
        function lazy(ctor) {
          var payload = {
            // We use these fields to store the result.
            _status: Uninitialized,
            _result: ctor
          };
          var lazyType = {
            $$typeof: REACT_LAZY_TYPE,
            _payload: payload,
            _init: lazyInitializer
          };
          {
            var defaultProps;
            var propTypes;
            Object.defineProperties(lazyType, {
              defaultProps: {
                configurable: true,
                get: function() {
                  return defaultProps;
                },
                set: function(newDefaultProps) {
                  error("React.lazy(...): It is not supported to assign `defaultProps` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                  defaultProps = newDefaultProps;
                  Object.defineProperty(lazyType, "defaultProps", {
                    enumerable: true
                  });
                }
              },
              propTypes: {
                configurable: true,
                get: function() {
                  return propTypes;
                },
                set: function(newPropTypes) {
                  error("React.lazy(...): It is not supported to assign `propTypes` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                  propTypes = newPropTypes;
                  Object.defineProperty(lazyType, "propTypes", {
                    enumerable: true
                  });
                }
              }
            });
          }
          return lazyType;
        }
        function forwardRef2(render) {
          {
            if (render != null && render.$$typeof === REACT_MEMO_TYPE) {
              error("forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).");
            } else if (typeof render !== "function") {
              error("forwardRef requires a render function but was given %s.", render === null ? "null" : typeof render);
            } else {
              if (render.length !== 0 && render.length !== 2) {
                error("forwardRef render functions accept exactly two parameters: props and ref. %s", render.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined.");
              }
            }
            if (render != null) {
              if (render.defaultProps != null || render.propTypes != null) {
                error("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?");
              }
            }
          }
          var elementType = {
            $$typeof: REACT_FORWARD_REF_TYPE,
            render
          };
          {
            var ownName;
            Object.defineProperty(elementType, "displayName", {
              enumerable: false,
              configurable: true,
              get: function() {
                return ownName;
              },
              set: function(name) {
                ownName = name;
                if (!render.name && !render.displayName) {
                  render.displayName = name;
                }
              }
            });
          }
          return elementType;
        }
        var REACT_MODULE_REFERENCE;
        {
          REACT_MODULE_REFERENCE = Symbol.for("react.module.reference");
        }
        function isValidElementType(type) {
          if (typeof type === "string" || typeof type === "function") {
            return true;
          }
          if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden || type === REACT_OFFSCREEN_TYPE || enableScopeAPI || enableCacheElement || enableTransitionTracing) {
            return true;
          }
          if (typeof type === "object" && type !== null) {
            if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
            // types supported by any Flight configuration anywhere since
            // we don't know which Flight build this will end up being used
            // with.
            type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== void 0) {
              return true;
            }
          }
          return false;
        }
        function memo(type, compare) {
          {
            if (!isValidElementType(type)) {
              error("memo: The first argument must be a component. Instead received: %s", type === null ? "null" : typeof type);
            }
          }
          var elementType = {
            $$typeof: REACT_MEMO_TYPE,
            type,
            compare: compare === void 0 ? null : compare
          };
          {
            var ownName;
            Object.defineProperty(elementType, "displayName", {
              enumerable: false,
              configurable: true,
              get: function() {
                return ownName;
              },
              set: function(name) {
                ownName = name;
                if (!type.name && !type.displayName) {
                  type.displayName = name;
                }
              }
            });
          }
          return elementType;
        }
        function resolveDispatcher() {
          var dispatcher = ReactCurrentDispatcher.current;
          {
            if (dispatcher === null) {
              error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
            }
          }
          return dispatcher;
        }
        function useContext2(Context) {
          var dispatcher = resolveDispatcher();
          {
            if (Context._context !== void 0) {
              var realContext = Context._context;
              if (realContext.Consumer === Context) {
                error("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?");
              } else if (realContext.Provider === Context) {
                error("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
              }
            }
          }
          return dispatcher.useContext(Context);
        }
        function useState22(initialState) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useState(initialState);
        }
        function useReducer(reducer, initialArg, init) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useReducer(reducer, initialArg, init);
        }
        function useRef3(initialValue) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useRef(initialValue);
        }
        function useEffect4(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useEffect(create, deps);
        }
        function useInsertionEffect(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useInsertionEffect(create, deps);
        }
        function useLayoutEffect(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useLayoutEffect(create, deps);
        }
        function useCallback3(callback, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useCallback(callback, deps);
        }
        function useMemo4(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useMemo(create, deps);
        }
        function useImperativeHandle(ref, create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useImperativeHandle(ref, create, deps);
        }
        function useDebugValue(value, formatterFn) {
          {
            var dispatcher = resolveDispatcher();
            return dispatcher.useDebugValue(value, formatterFn);
          }
        }
        function useTransition() {
          var dispatcher = resolveDispatcher();
          return dispatcher.useTransition();
        }
        function useDeferredValue(value) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useDeferredValue(value);
        }
        function useId() {
          var dispatcher = resolveDispatcher();
          return dispatcher.useId();
        }
        function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
        }
        var disabledDepth = 0;
        var prevLog;
        var prevInfo;
        var prevWarn;
        var prevError;
        var prevGroup;
        var prevGroupCollapsed;
        var prevGroupEnd;
        function disabledLog() {
        }
        disabledLog.__reactDisabledLog = true;
        function disableLogs() {
          {
            if (disabledDepth === 0) {
              prevLog = console.log;
              prevInfo = console.info;
              prevWarn = console.warn;
              prevError = console.error;
              prevGroup = console.group;
              prevGroupCollapsed = console.groupCollapsed;
              prevGroupEnd = console.groupEnd;
              var props = {
                configurable: true,
                enumerable: true,
                value: disabledLog,
                writable: true
              };
              Object.defineProperties(console, {
                info: props,
                log: props,
                warn: props,
                error: props,
                group: props,
                groupCollapsed: props,
                groupEnd: props
              });
            }
            disabledDepth++;
          }
        }
        function reenableLogs() {
          {
            disabledDepth--;
            if (disabledDepth === 0) {
              var props = {
                configurable: true,
                enumerable: true,
                writable: true
              };
              Object.defineProperties(console, {
                log: assign({}, props, {
                  value: prevLog
                }),
                info: assign({}, props, {
                  value: prevInfo
                }),
                warn: assign({}, props, {
                  value: prevWarn
                }),
                error: assign({}, props, {
                  value: prevError
                }),
                group: assign({}, props, {
                  value: prevGroup
                }),
                groupCollapsed: assign({}, props, {
                  value: prevGroupCollapsed
                }),
                groupEnd: assign({}, props, {
                  value: prevGroupEnd
                })
              });
            }
            if (disabledDepth < 0) {
              error("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
            }
          }
        }
        var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
        var prefix;
        function describeBuiltInComponentFrame(name, source, ownerFn) {
          {
            if (prefix === void 0) {
              try {
                throw Error();
              } catch (x) {
                var match = x.stack.trim().match(/\n( *(at )?)/);
                prefix = match && match[1] || "";
              }
            }
            return "\n" + prefix + name;
          }
        }
        var reentry = false;
        var componentFrameCache;
        {
          var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
          componentFrameCache = new PossiblyWeakMap();
        }
        function describeNativeComponentFrame(fn, construct) {
          if (!fn || reentry) {
            return "";
          }
          {
            var frame = componentFrameCache.get(fn);
            if (frame !== void 0) {
              return frame;
            }
          }
          var control;
          reentry = true;
          var previousPrepareStackTrace = Error.prepareStackTrace;
          Error.prepareStackTrace = void 0;
          var previousDispatcher;
          {
            previousDispatcher = ReactCurrentDispatcher$1.current;
            ReactCurrentDispatcher$1.current = null;
            disableLogs();
          }
          try {
            if (construct) {
              var Fake = function() {
                throw Error();
              };
              Object.defineProperty(Fake.prototype, "props", {
                set: function() {
                  throw Error();
                }
              });
              if (typeof Reflect === "object" && Reflect.construct) {
                try {
                  Reflect.construct(Fake, []);
                } catch (x) {
                  control = x;
                }
                Reflect.construct(fn, [], Fake);
              } else {
                try {
                  Fake.call();
                } catch (x) {
                  control = x;
                }
                fn.call(Fake.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (x) {
                control = x;
              }
              fn();
            }
          } catch (sample) {
            if (sample && control && typeof sample.stack === "string") {
              var sampleLines = sample.stack.split("\n");
              var controlLines = control.stack.split("\n");
              var s = sampleLines.length - 1;
              var c = controlLines.length - 1;
              while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                c--;
              }
              for (; s >= 1 && c >= 0; s--, c--) {
                if (sampleLines[s] !== controlLines[c]) {
                  if (s !== 1 || c !== 1) {
                    do {
                      s--;
                      c--;
                      if (c < 0 || sampleLines[s] !== controlLines[c]) {
                        var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                        if (fn.displayName && _frame.includes("<anonymous>")) {
                          _frame = _frame.replace("<anonymous>", fn.displayName);
                        }
                        {
                          if (typeof fn === "function") {
                            componentFrameCache.set(fn, _frame);
                          }
                        }
                        return _frame;
                      }
                    } while (s >= 1 && c >= 0);
                  }
                  break;
                }
              }
            }
          } finally {
            reentry = false;
            {
              ReactCurrentDispatcher$1.current = previousDispatcher;
              reenableLogs();
            }
            Error.prepareStackTrace = previousPrepareStackTrace;
          }
          var name = fn ? fn.displayName || fn.name : "";
          var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
          {
            if (typeof fn === "function") {
              componentFrameCache.set(fn, syntheticFrame);
            }
          }
          return syntheticFrame;
        }
        function describeFunctionComponentFrame(fn, source, ownerFn) {
          {
            return describeNativeComponentFrame(fn, false);
          }
        }
        function shouldConstruct(Component2) {
          var prototype = Component2.prototype;
          return !!(prototype && prototype.isReactComponent);
        }
        function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
          if (type == null) {
            return "";
          }
          if (typeof type === "function") {
            {
              return describeNativeComponentFrame(type, shouldConstruct(type));
            }
          }
          if (typeof type === "string") {
            return describeBuiltInComponentFrame(type);
          }
          switch (type) {
            case REACT_SUSPENSE_TYPE:
              return describeBuiltInComponentFrame("Suspense");
            case REACT_SUSPENSE_LIST_TYPE:
              return describeBuiltInComponentFrame("SuspenseList");
          }
          if (typeof type === "object") {
            switch (type.$$typeof) {
              case REACT_FORWARD_REF_TYPE:
                return describeFunctionComponentFrame(type.render);
              case REACT_MEMO_TYPE:
                return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                } catch (x) {
                }
              }
            }
          }
          return "";
        }
        var loggedTypeFailures = {};
        var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
        function setCurrentlyValidatingElement(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
            } else {
              ReactDebugCurrentFrame$1.setExtraStackFrame(null);
            }
          }
        }
        function checkPropTypes(typeSpecs, values, location, componentName, element) {
          {
            var has = Function.call.bind(hasOwnProperty);
            for (var typeSpecName in typeSpecs) {
              if (has(typeSpecs, typeSpecName)) {
                var error$1 = void 0;
                try {
                  if (typeof typeSpecs[typeSpecName] !== "function") {
                    var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                    err.name = "Invariant Violation";
                    throw err;
                  }
                  error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                } catch (ex) {
                  error$1 = ex;
                }
                if (error$1 && !(error$1 instanceof Error)) {
                  setCurrentlyValidatingElement(element);
                  error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error$1);
                  setCurrentlyValidatingElement(null);
                }
                if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                  loggedTypeFailures[error$1.message] = true;
                  setCurrentlyValidatingElement(element);
                  error("Failed %s type: %s", location, error$1.message);
                  setCurrentlyValidatingElement(null);
                }
              }
            }
          }
        }
        function setCurrentlyValidatingElement$1(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              setExtraStackFrame(stack);
            } else {
              setExtraStackFrame(null);
            }
          }
        }
        var propTypesMisspellWarningShown;
        {
          propTypesMisspellWarningShown = false;
        }
        function getDeclarationErrorAddendum() {
          if (ReactCurrentOwner.current) {
            var name = getComponentNameFromType(ReactCurrentOwner.current.type);
            if (name) {
              return "\n\nCheck the render method of `" + name + "`.";
            }
          }
          return "";
        }
        function getSourceInfoErrorAddendum(source) {
          if (source !== void 0) {
            var fileName = source.fileName.replace(/^.*[\\\/]/, "");
            var lineNumber = source.lineNumber;
            return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
          }
          return "";
        }
        function getSourceInfoErrorAddendumForProps(elementProps) {
          if (elementProps !== null && elementProps !== void 0) {
            return getSourceInfoErrorAddendum(elementProps.__source);
          }
          return "";
        }
        var ownerHasKeyUseWarning = {};
        function getCurrentComponentErrorInfo(parentType) {
          var info = getDeclarationErrorAddendum();
          if (!info) {
            var parentName = typeof parentType === "string" ? parentType : parentType.displayName || parentType.name;
            if (parentName) {
              info = "\n\nCheck the top-level render call using <" + parentName + ">.";
            }
          }
          return info;
        }
        function validateExplicitKey(element, parentType) {
          if (!element._store || element._store.validated || element.key != null) {
            return;
          }
          element._store.validated = true;
          var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
          if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
            return;
          }
          ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
          var childOwner = "";
          if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
            childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
          }
          {
            setCurrentlyValidatingElement$1(element);
            error('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);
            setCurrentlyValidatingElement$1(null);
          }
        }
        function validateChildKeys(node, parentType) {
          if (typeof node !== "object") {
            return;
          }
          if (isArray(node)) {
            for (var i = 0; i < node.length; i++) {
              var child = node[i];
              if (isValidElement(child)) {
                validateExplicitKey(child, parentType);
              }
            }
          } else if (isValidElement(node)) {
            if (node._store) {
              node._store.validated = true;
            }
          } else if (node) {
            var iteratorFn = getIteratorFn(node);
            if (typeof iteratorFn === "function") {
              if (iteratorFn !== node.entries) {
                var iterator = iteratorFn.call(node);
                var step;
                while (!(step = iterator.next()).done) {
                  if (isValidElement(step.value)) {
                    validateExplicitKey(step.value, parentType);
                  }
                }
              }
            }
          }
        }
        function validatePropTypes(element) {
          {
            var type = element.type;
            if (type === null || type === void 0 || typeof type === "string") {
              return;
            }
            var propTypes;
            if (typeof type === "function") {
              propTypes = type.propTypes;
            } else if (typeof type === "object" && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
            // Inner props are checked in the reconciler.
            type.$$typeof === REACT_MEMO_TYPE)) {
              propTypes = type.propTypes;
            } else {
              return;
            }
            if (propTypes) {
              var name = getComponentNameFromType(type);
              checkPropTypes(propTypes, element.props, "prop", name, element);
            } else if (type.PropTypes !== void 0 && !propTypesMisspellWarningShown) {
              propTypesMisspellWarningShown = true;
              var _name = getComponentNameFromType(type);
              error("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", _name || "Unknown");
            }
            if (typeof type.getDefaultProps === "function" && !type.getDefaultProps.isReactClassApproved) {
              error("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
            }
          }
        }
        function validateFragmentProps(fragment) {
          {
            var keys = Object.keys(fragment.props);
            for (var i = 0; i < keys.length; i++) {
              var key = keys[i];
              if (key !== "children" && key !== "key") {
                setCurrentlyValidatingElement$1(fragment);
                error("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", key);
                setCurrentlyValidatingElement$1(null);
                break;
              }
            }
            if (fragment.ref !== null) {
              setCurrentlyValidatingElement$1(fragment);
              error("Invalid attribute `ref` supplied to `React.Fragment`.");
              setCurrentlyValidatingElement$1(null);
            }
          }
        }
        function createElementWithValidation(type, props, children) {
          var validType = isValidElementType(type);
          if (!validType) {
            var info = "";
            if (type === void 0 || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
              info += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
            }
            var sourceInfo = getSourceInfoErrorAddendumForProps(props);
            if (sourceInfo) {
              info += sourceInfo;
            } else {
              info += getDeclarationErrorAddendum();
            }
            var typeString;
            if (type === null) {
              typeString = "null";
            } else if (isArray(type)) {
              typeString = "array";
            } else if (type !== void 0 && type.$$typeof === REACT_ELEMENT_TYPE) {
              typeString = "<" + (getComponentNameFromType(type.type) || "Unknown") + " />";
              info = " Did you accidentally export a JSX literal instead of a component?";
            } else {
              typeString = typeof type;
            }
            {
              error("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", typeString, info);
            }
          }
          var element = createElement2.apply(this, arguments);
          if (element == null) {
            return element;
          }
          if (validType) {
            for (var i = 2; i < arguments.length; i++) {
              validateChildKeys(arguments[i], type);
            }
          }
          if (type === REACT_FRAGMENT_TYPE) {
            validateFragmentProps(element);
          } else {
            validatePropTypes(element);
          }
          return element;
        }
        var didWarnAboutDeprecatedCreateFactory = false;
        function createFactoryWithValidation(type) {
          var validatedFactory = createElementWithValidation.bind(null, type);
          validatedFactory.type = type;
          {
            if (!didWarnAboutDeprecatedCreateFactory) {
              didWarnAboutDeprecatedCreateFactory = true;
              warn("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.");
            }
            Object.defineProperty(validatedFactory, "type", {
              enumerable: false,
              get: function() {
                warn("Factory.type is deprecated. Access the class directly before passing it to createFactory.");
                Object.defineProperty(this, "type", {
                  value: type
                });
                return type;
              }
            });
          }
          return validatedFactory;
        }
        function cloneElementWithValidation(element, props, children) {
          var newElement = cloneElement.apply(this, arguments);
          for (var i = 2; i < arguments.length; i++) {
            validateChildKeys(arguments[i], newElement.type);
          }
          validatePropTypes(newElement);
          return newElement;
        }
        function startTransition(scope, options) {
          var prevTransition = ReactCurrentBatchConfig.transition;
          ReactCurrentBatchConfig.transition = {};
          var currentTransition = ReactCurrentBatchConfig.transition;
          {
            ReactCurrentBatchConfig.transition._updatedFibers = /* @__PURE__ */ new Set();
          }
          try {
            scope();
          } finally {
            ReactCurrentBatchConfig.transition = prevTransition;
            {
              if (prevTransition === null && currentTransition._updatedFibers) {
                var updatedFibersCount = currentTransition._updatedFibers.size;
                if (updatedFibersCount > 10) {
                  warn("Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table.");
                }
                currentTransition._updatedFibers.clear();
              }
            }
          }
        }
        var didWarnAboutMessageChannel = false;
        var enqueueTaskImpl = null;
        function enqueueTask(task) {
          if (enqueueTaskImpl === null) {
            try {
              var requireString = ("require" + Math.random()).slice(0, 7);
              var nodeRequire = module && module[requireString];
              enqueueTaskImpl = nodeRequire.call(module, "timers").setImmediate;
            } catch (_err) {
              enqueueTaskImpl = function(callback) {
                {
                  if (didWarnAboutMessageChannel === false) {
                    didWarnAboutMessageChannel = true;
                    if (typeof MessageChannel === "undefined") {
                      error("This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning.");
                    }
                  }
                }
                var channel = new MessageChannel();
                channel.port1.onmessage = callback;
                channel.port2.postMessage(void 0);
              };
            }
          }
          return enqueueTaskImpl(task);
        }
        var actScopeDepth = 0;
        var didWarnNoAwaitAct = false;
        function act(callback) {
          {
            var prevActScopeDepth = actScopeDepth;
            actScopeDepth++;
            if (ReactCurrentActQueue.current === null) {
              ReactCurrentActQueue.current = [];
            }
            var prevIsBatchingLegacy = ReactCurrentActQueue.isBatchingLegacy;
            var result;
            try {
              ReactCurrentActQueue.isBatchingLegacy = true;
              result = callback();
              if (!prevIsBatchingLegacy && ReactCurrentActQueue.didScheduleLegacyUpdate) {
                var queue = ReactCurrentActQueue.current;
                if (queue !== null) {
                  ReactCurrentActQueue.didScheduleLegacyUpdate = false;
                  flushActQueue(queue);
                }
              }
            } catch (error2) {
              popActScope(prevActScopeDepth);
              throw error2;
            } finally {
              ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
            }
            if (result !== null && typeof result === "object" && typeof result.then === "function") {
              var thenableResult = result;
              var wasAwaited = false;
              var thenable = {
                then: function(resolve, reject) {
                  wasAwaited = true;
                  thenableResult.then(function(returnValue2) {
                    popActScope(prevActScopeDepth);
                    if (actScopeDepth === 0) {
                      recursivelyFlushAsyncActWork(returnValue2, resolve, reject);
                    } else {
                      resolve(returnValue2);
                    }
                  }, function(error2) {
                    popActScope(prevActScopeDepth);
                    reject(error2);
                  });
                }
              };
              {
                if (!didWarnNoAwaitAct && typeof Promise !== "undefined") {
                  Promise.resolve().then(function() {
                  }).then(function() {
                    if (!wasAwaited) {
                      didWarnNoAwaitAct = true;
                      error("You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);");
                    }
                  });
                }
              }
              return thenable;
            } else {
              var returnValue = result;
              popActScope(prevActScopeDepth);
              if (actScopeDepth === 0) {
                var _queue = ReactCurrentActQueue.current;
                if (_queue !== null) {
                  flushActQueue(_queue);
                  ReactCurrentActQueue.current = null;
                }
                var _thenable = {
                  then: function(resolve, reject) {
                    if (ReactCurrentActQueue.current === null) {
                      ReactCurrentActQueue.current = [];
                      recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                    } else {
                      resolve(returnValue);
                    }
                  }
                };
                return _thenable;
              } else {
                var _thenable2 = {
                  then: function(resolve, reject) {
                    resolve(returnValue);
                  }
                };
                return _thenable2;
              }
            }
          }
        }
        function popActScope(prevActScopeDepth) {
          {
            if (prevActScopeDepth !== actScopeDepth - 1) {
              error("You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. ");
            }
            actScopeDepth = prevActScopeDepth;
          }
        }
        function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
          {
            var queue = ReactCurrentActQueue.current;
            if (queue !== null) {
              try {
                flushActQueue(queue);
                enqueueTask(function() {
                  if (queue.length === 0) {
                    ReactCurrentActQueue.current = null;
                    resolve(returnValue);
                  } else {
                    recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                  }
                });
              } catch (error2) {
                reject(error2);
              }
            } else {
              resolve(returnValue);
            }
          }
        }
        var isFlushing = false;
        function flushActQueue(queue) {
          {
            if (!isFlushing) {
              isFlushing = true;
              var i = 0;
              try {
                for (; i < queue.length; i++) {
                  var callback = queue[i];
                  do {
                    callback = callback(true);
                  } while (callback !== null);
                }
                queue.length = 0;
              } catch (error2) {
                queue = queue.slice(i + 1);
                throw error2;
              } finally {
                isFlushing = false;
              }
            }
          }
        }
        var createElement$1 = createElementWithValidation;
        var cloneElement$1 = cloneElementWithValidation;
        var createFactory = createFactoryWithValidation;
        var Children = {
          map: mapChildren,
          forEach: forEachChildren,
          count: countChildren,
          toArray,
          only: onlyChild
        };
        exports.Children = Children;
        exports.Component = Component;
        exports.Fragment = REACT_FRAGMENT_TYPE;
        exports.Profiler = REACT_PROFILER_TYPE;
        exports.PureComponent = PureComponent;
        exports.StrictMode = REACT_STRICT_MODE_TYPE;
        exports.Suspense = REACT_SUSPENSE_TYPE;
        exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;
        exports.act = act;
        exports.cloneElement = cloneElement$1;
        exports.createContext = createContext2;
        exports.createElement = createElement$1;
        exports.createFactory = createFactory;
        exports.createRef = createRef;
        exports.forwardRef = forwardRef2;
        exports.isValidElement = isValidElement;
        exports.lazy = lazy;
        exports.memo = memo;
        exports.startTransition = startTransition;
        exports.unstable_act = act;
        exports.useCallback = useCallback3;
        exports.useContext = useContext2;
        exports.useDebugValue = useDebugValue;
        exports.useDeferredValue = useDeferredValue;
        exports.useEffect = useEffect4;
        exports.useId = useId;
        exports.useImperativeHandle = useImperativeHandle;
        exports.useInsertionEffect = useInsertionEffect;
        exports.useLayoutEffect = useLayoutEffect;
        exports.useMemo = useMemo4;
        exports.useReducer = useReducer;
        exports.useRef = useRef3;
        exports.useState = useState22;
        exports.useSyncExternalStore = useSyncExternalStore;
        exports.useTransition = useTransition;
        exports.version = ReactVersion;
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== "undefined" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === "function") {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(new Error());
        }
      })();
    }
  }
});

// ../node_modules/react/index.js
var require_react = __commonJS({
  "../node_modules/react/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_development();
    }
  }
});

// src/AdminApp.jsx
var import_react33 = __toESM(require_react());

// src/context/AdminContext.jsx
var import_react = __toESM(require_react());

// src/api/client.js
var ApiQueryBuilder = class {
  constructor(apiUrl, table, token) {
    this.apiUrl = apiUrl;
    this.table = table;
    this.token = token;
    this.params = new URLSearchParams();
    this._isSingle = false;
    this._isCount = false;
    this._isHead = false;
  }
  select(columns = "*", options = {}) {
    this.params.set("select", columns);
    if (options && options.count) {
      this._isCount = true;
      this.params.set("count", options.count);
    }
    if (options && options.head) {
      this._isHead = true;
      this.params.set("head", "true");
    }
    return this;
  }
  order(column, { ascending = true } = {}) {
    this.params.set("order", `${column}.${ascending ? "asc" : "desc"}`);
    return this;
  }
  limit(n) {
    this.params.set("limit", String(n));
    return this;
  }
  range(from, to) {
    this.params.set("offset", String(from));
    this.params.set("limit", String(to - from + 1));
    return this;
  }
  eq(column, value) {
    this.params.append(column, `eq.${value}`);
    return this;
  }
  neq(column, value) {
    this.params.append(column, `neq.${value}`);
    return this;
  }
  is(column, value) {
    this.params.append(column, `is.${value}`);
    return this;
  }
  in(column, values) {
    const list = Array.isArray(values) ? values.join(",") : values;
    this.params.append(column, `in.(${list})`);
    return this;
  }
  single() {
    this._isSingle = true;
    return this;
  }
  async _fetch(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      "Bypass-Tunnel-Reminder": "true",
      ...this.token ? { "Authorization": `Bearer ${this.token}` } : {}
    };
    if (this._isSingle) {
      headers["Accept"] = "application/vnd.pgrst.object+json";
    }
    try {
      const res = await fetch(url, { ...options, headers });
      let countVal = 0;
      const contentRange = res.headers.get("content-range") || res.headers.get("Content-Range");
      if (contentRange) {
        const parts = contentRange.split("/");
        if (parts.length > 1)
          countVal = parseInt(parts[1], 10) || 0;
      } else {
        const totalHdr = res.headers.get("x-total-count") || res.headers.get("X-Total-Count");
        if (totalHdr)
          countVal = parseInt(totalHdr, 10) || 0;
      }
      if (!res.ok) {
        const text = await res.text();
        let errObj;
        try {
          errObj = JSON.parse(text);
        } catch {
          errObj = { message: text };
        }
        return { data: null, error: errObj, count: 0 };
      }
      const data = await res.json();
      if (countVal === 0 && Array.isArray(data))
        countVal = data.length;
      return {
        data: this._isSingle && Array.isArray(data) ? data[0] || null : data,
        error: null,
        count: countVal
      };
    } catch (err) {
      return { data: null, error: { message: err.message }, count: 0 };
    }
  }
  then(resolve, reject) {
    const url = `${this.apiUrl}/rest/v1/${this.table}?${this.params.toString()}`;
    return this._fetch(url, { method: "GET" }).then(resolve, reject);
  }
  async insert(data) {
    const url = `${this.apiUrl}/rest/v1/${this.table}`;
    return this._fetch(url, { method: "POST", body: JSON.stringify(data) });
  }
  async update(data) {
    const url = `${this.apiUrl}/rest/v1/${this.table}?${this.params.toString()}`;
    return this._fetch(url, { method: "PATCH", body: JSON.stringify(data) });
  }
  async delete() {
    const url = `${this.apiUrl}/rest/v1/${this.table}?${this.params.toString()}`;
    return this._fetch(url, { method: "DELETE" });
  }
};
function createClient(apiUrl = "https://aistudio.runasp.net", apiKey = "") {
  let token = "";
  let currentUser = null;
  try {
    token = localStorage.getItem("aistudio_token") || "";
    const saved = localStorage.getItem("aistudio_user");
    if (saved)
      currentUser = JSON.parse(saved);
  } catch {
  }
  const authListeners = /* @__PURE__ */ new Set();
  return {
    apiUrl,
    auth: {
      async signInWithPassword({ email, password }) {
        try {
          const res = await fetch(`${apiUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Bypass-Tunnel-Reminder": "true" },
            body: JSON.stringify({ email, password })
          });
          const json = await res.json();
          if (!res.ok)
            return { data: null, error: { message: json.error || "Login fail hua." } };
          token = json.access_token;
          currentUser = json.user;
          try {
            localStorage.setItem("aistudio_token", token);
            localStorage.setItem("aistudio_user", JSON.stringify(currentUser));
          } catch {
          }
          authListeners.forEach((cb) => cb("SIGNED_IN", { user: currentUser, access_token: token }));
          return { data: { user: currentUser, session: { access_token: token, user: currentUser } }, error: null };
        } catch (err) {
          return { data: null, error: { message: err.message } };
        }
      },
      async signInAnonymously() {
        const guestEmail = `guest_${Date.now()}@aistudio.local`;
        return this.signUp({ email: guestEmail, password: "Guest@123456" });
      },
      async signUp({ email, password }) {
        try {
          const res = await fetch(`${apiUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Bypass-Tunnel-Reminder": "true" },
            body: JSON.stringify({ email, password })
          });
          const json = await res.json();
          if (!res.ok)
            return { data: null, error: { message: json.error || "Signup fail hua." } };
          token = json.access_token;
          currentUser = json.user;
          try {
            localStorage.setItem("aistudio_token", token);
            localStorage.setItem("aistudio_user", JSON.stringify(currentUser));
          } catch {
          }
          authListeners.forEach((cb) => cb("SIGNED_IN", { user: currentUser, access_token: token }));
          return { data: { user: currentUser, session: { access_token: token, user: currentUser } }, error: null };
        } catch (err) {
          return { data: null, error: { message: err.message } };
        }
      },
      async signOut() {
        token = "";
        currentUser = null;
        try {
          localStorage.removeItem("aistudio_token");
          localStorage.removeItem("aistudio_user");
        } catch {
        }
        authListeners.forEach((cb) => cb("SIGNED_OUT", null));
        return { error: null };
      },
      async getSession() {
        if (token && currentUser)
          return { data: { session: { access_token: token, user: currentUser } }, error: null };
        return { data: { session: null }, error: null };
      },
      async getUser() {
        return { data: { user: currentUser }, error: null };
      },
      onAuthStateChange(callback) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => authListeners.delete(callback)
            }
          }
        };
      }
    },
    from(table) {
      return new ApiQueryBuilder(apiUrl, table, token);
    },
    async rpc(functionName, params = {}) {
      try {
        const res = await fetch(`${apiUrl}/rest/v1/rpc/${functionName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Bypass-Tunnel-Reminder": "true",
            ...token ? { "Authorization": `Bearer ${token}` } : {}
          },
          body: JSON.stringify(params || {})
        });
        const text = await res.text();
        if (!res.ok) {
          let errObj;
          try {
            errObj = JSON.parse(text);
          } catch {
            errObj = { message: text };
          }
          return { data: null, error: errObj };
        }
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
        return { data, error: null };
      } catch (err) {
        return { data: null, error: { message: err.message } };
      }
    },
    channel(name) {
      const ch = { name, on() {
        return ch;
      }, subscribe() {
        return ch;
      } };
      return ch;
    },
    removeChannel() {
    }
  };
}

// src/api/config.js
var API_URL = "https://aistudio.runasp.net";
var API_KEY = "aistudio_admin_local_key";
var CLOUDINARY_CLOUD_NAME = "draaqjcre";
var CLOUDINARY_UPLOAD_PRESET = "ml_default";
var CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
var GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
var REFRESH_MS = 2e3;
var API = {
  IS_ADMIN: "is_ai_studio_admin",
  CREATE_TASK: "upload_ai_studio_task",
  SET_WORKER_TOOLS: "ai_studio_set_worker_tools",
  SET_WORKER_TASK_TYPES: "ai_studio_set_worker_task_types",
  RELEASE_TASKS: "ai_studio_release_tasks",
  CLEAR_FAILED: "ai_studio_clear_failed",
  GET_CATALOG: "get_task_catalog",
  GET_CONFIG: "get_worker_config",
  GET_PROMPTS: "get_task_prompts",
  GET_FAMILY_ROLES: "get_family_roles",
  GET_APPS: "get_app_list"
};
var TABLES = {
  TASKS: "ai_studio_tasks",
  WORKERS: "ai_studio_workers",
  WORKER_LOAD: "ai_studio_worker_load",
  SETTINGS: "ai_studio_settings",
  SECRETS: "ai_studio_secrets",
  MODELS: "ai_studio_models",
  PROMPTS: "ai_studio_prompts",
  LOG: "ai_studio_action_log",
  TOOLS: "ai_studio_tools",
  TOOL_TYPES: "ai_studio_tool_types",
  WORKER_TOOLS: "ai_studio_worker_tools",
  CATALOG: "ai_studio_task_catalog",
  FAMILY_ROLES: "ai_studio_family_roles",
  APPS: "ai_studio_apps",
  APP_TASKS: "ai_studio_app_tasks"
};

// src/constants/formDefaults.js
var INPUT_LABEL = {
  face: "Face reference",
  style: "Style / outfit reference",
  input: "Input photo"
};
var INPUT_COLUMN = {
  face: "face_image_url",
  style: "style_image_url",
  input: "input_image_url"
};
var EMPTY_TYPE = {
  label: "",
  output: "text",
  kind: "text",
  inputs: [],
  labels: {},
  optional: [],
  extras: false,
  promptRequired: false,
  faceCheck: false
};
var TASK_TYPES = {};
var typeOf = (k) => TASK_TYPES[k] || EMPTY_TYPE;
var CUSTOMER_KINDS = [];
var FAMILY_ROLES = [];
function toTaskType(r) {
  return {
    label: r.label,
    output: r.output,
    kind: r.output,
    inputs: r.inputs || [],
    labels: r.labels || {},
    optional: r.optional || [],
    extras: !!r.extras,
    promptRequired: !!r.prompt_required,
    family: !!r.family,
    perPhoto: !!r.per_photo,
    faceCheck: !!r.face_check,
    angles: r.angles || null
  };
}
function setTaskTypes(rows) {
  Object.keys(TASK_TYPES).forEach((k) => delete TASK_TYPES[k]);
  (rows || []).filter((r) => r.enabled).forEach((r) => {
    TASK_TYPES[r.task_type] = toTaskType(r);
  });
  CUSTOMER_KINDS = (rows || []).filter((r) => r.enabled && r.customer_visible).map((r) => r.task_type);
}
function setFamilyRoles(roles) {
  FAMILY_ROLES = roles || [];
}
var labelFor = (type, key) => type?.labels?.[key] || INPUT_LABEL[key];
var EMPTY_FORM = {
  task_type: "image_to_image_prompt",
  model: "gemini-3.1-flash-image-preview",
  prompt: "",
  aspect_ratio: "4:5",
  image_size: "2K",
  face_image_url: "",
  style_image_url: "",
  input_image_url: "",
  extra_image_urls: "",
  family_urls: ["", "", "", "", "", ""],
  conversation_id: "",
  user_id: "weargen_user_1",
  batch_count: 1
};

// src/constants/models.js
var MODEL_CAPS = {};
var capsOf = (id) => MODEL_CAPS[id] || { kind: "text", label: "", aspects: [], sizes: [] };
function setModelCaps(rows) {
  MODEL_CAPS = {};
  (rows || []).filter((r) => r.kind).forEach((r) => {
    MODEL_CAPS[r.model_id] = {
      kind: r.kind,
      label: r.label || r.model_id,
      aspects: r.aspects || [],
      sizes: r.sizes || []
    };
  });
}

// src/context/AdminContext.jsx
var AdminContext = (0, import_react.createContext)(null);
function AdminProvider({ children }) {
  const [sb, setSb] = (0, import_react.useState)(null);
  const [session, setSession] = (0, import_react.useState)(null);
  const [isAdmin, setIsAdmin] = (0, import_react.useState)(false);
  const [screen, setScreen] = (0, import_react.useState)("task");
  const [msg, setMsg] = (0, import_react.useState)("");
  const [catalog, setCatalog] = (0, import_react.useState)([]);
  const [apps, setApps] = (0, import_react.useState)([]);
  const [appTasks, setAppTasks] = (0, import_react.useState)([]);
  const [models, setModels] = (0, import_react.useState)([]);
  const [prompts, setPrompts] = (0, import_react.useState)({});
  const [workers, setWorkers] = (0, import_react.useState)([]);
  const [workerLoad, setWorkerLoad] = (0, import_react.useState)([]);
  const [liveTasks, setLiveTasks] = (0, import_react.useState)([]);
  const [cfg, setCfg] = (0, import_react.useState)({});
  const screenRef = (0, import_react.useRef)(screen);
  screenRef.current = screen;
  (0, import_react.useEffect)(() => {
    const client = createClient(API_URL, API_KEY);
    setSb(client);
    client.auth.getSession().then(({ data }) => {
      setSession(data?.session || null);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, sess) => {
      setSession(sess || null);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);
  (0, import_react.useEffect)(() => {
    if (!sb || !session) {
      setIsAdmin(false);
      return;
    }
    sb.rpc(API.IS_ADMIN).then(({ data, error }) => {
      setIsAdmin(!error && !!data);
    });
  }, [sb, session]);
  const loadCatalog = (0, import_react.useCallback)(async () => {
    if (!sb || !isAdmin)
      return;
    const [cat, appsData, linksData, rolesData] = await Promise.all([
      sb.from(TABLES.CATALOG).select("*").order("sort"),
      sb.from(TABLES.APPS).select("*"),
      sb.from(TABLES.APP_TASKS).select("*"),
      sb.from(TABLES.FAMILY_ROLES).select("*").order("sort")
    ]);
    if (cat.data) {
      setCatalog(cat.data);
      setTaskTypes(cat.data);
    }
    if (appsData.data)
      setApps(appsData.data);
    if (linksData.data)
      setAppTasks(linksData.data);
    if (rolesData.data)
      setFamilyRoles(rolesData.data);
  }, [sb, isAdmin]);
  const loadConfig = (0, import_react.useCallback)(async () => {
    if (!sb || !isAdmin)
      return;
    const [s, k, m, pr] = await Promise.all([
      sb.from(TABLES.SETTINGS).select("*").eq("id", 1).single(),
      sb.from(TABLES.SECRETS).select("imgbb_api_key, brevo_api_key").eq("id", 1).single(),
      sb.from(TABLES.MODELS).select("*").order("model_id"),
      sb.from(TABLES.PROMPTS).select("*")
    ]);
    if (s.data)
      setCfg({ ...s.data, imgbb_api_key: k.data?.imgbb_api_key || "", brevo_api_key: k.data?.brevo_api_key || "" });
    if (m.data) {
      setModels(m.data);
      setModelCaps(m.data);
    }
    if (pr.data) {
      setPrompts(Object.fromEntries(pr.data.map((r) => [r.task_type, r])));
    }
  }, [sb, isAdmin]);
  const loadWorkers = (0, import_react.useCallback)(async () => {
    if (!sb || !isAdmin)
      return;
    const [w, l] = await Promise.all([
      sb.from(TABLES.WORKERS).select("*").order("worker_id"),
      sb.from(TABLES.WORKER_LOAD).select("*")
    ]);
    if (w.data)
      setWorkers(w.data);
    if (l.data)
      setWorkerLoad(l.data);
  }, [sb, isAdmin]);
  const syncLiveTasks = (0, import_react.useCallback)(async () => {
    if (!sb || !isAdmin)
      return;
    try {
      const { data } = await sb.from(TABLES.TASKS).select("id,task_type,model,prompt,aspect_ratio,image_size,status,error,output_image_url,worker_id,app_id,created_at,finished_at,duration_ms,process_ms").order("id", { ascending: false }).limit(20);
      if (data && data.length) {
        setLiveTasks((prev) => {
          const byId = new Map(data.map((d) => [d.id, d]));
          if (prev.length === 0)
            return data.slice().reverse();
          const updated = prev.map((t) => byId.get(t.id) || t);
          for (const d of data.slice().reverse()) {
            if (!updated.some((u) => u.id === d.id))
              updated.push(d);
          }
          return updated.slice(-50);
        });
      }
    } catch (err) {
      console.warn("syncLiveTasks error:", err);
    }
  }, [sb, isAdmin]);
  (0, import_react.useEffect)(() => {
    if (!isAdmin)
      return;
    loadCatalog();
    loadConfig();
    loadWorkers();
    syncLiveTasks();
  }, [isAdmin, loadCatalog, loadConfig, loadWorkers, syncLiveTasks]);
  (0, import_react.useEffect)(() => {
    if (!sb || !isAdmin)
      return;
    const timer = setInterval(() => {
      loadWorkers();
      if (screenRef.current === "task")
        syncLiveTasks();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [sb, isAdmin, loadWorkers, syncLiveTasks]);
  const value = {
    sb,
    session,
    email: session?.user?.email || "admin@aistudio.local",
    isAdmin,
    screen,
    setScreen,
    msg,
    setMsg,
    catalog,
    apps,
    appTasks,
    models,
    prompts,
    setPrompts,
    workers,
    workerLoad,
    liveTasks,
    setLiveTasks,
    cfg,
    setCfg,
    loadCatalog,
    loadConfig,
    loadWorkers,
    syncLiveTasks
  };
  return /* @__PURE__ */ import_react.default.createElement(AdminContext.Provider, { value }, children);
}
function useAdmin() {
  const ctx = (0, import_react.useContext)(AdminContext);
  if (!ctx)
    throw new Error("useAdmin must be used within an AdminProvider");
  return ctx;
}

// src/components/layout/Header.jsx
var import_react4 = __toESM(require_react());

// ../node_modules/lucide-react/dist/esm/createLucideIcon.mjs
var import_react2 = __toESM(require_react(), 1);

// ../node_modules/lucide-react/dist/esm/defaultAttributes.mjs
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

// ../node_modules/lucide-react/dist/esm/createLucideIcon.mjs
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var createLucideIcon = (iconName, iconNode) => {
  const Component = (0, import_react2.forwardRef)(
    ({ color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, children, ...rest }, ref) => (0, import_react2.createElement)(
      "svg",
      {
        ref,
        ...defaultAttributes,
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        className: `lucide lucide-${toKebabCase(iconName)}`,
        ...rest
      },
      [
        ...iconNode.map(([tag, attrs]) => (0, import_react2.createElement)(tag, attrs)),
        ...(Array.isArray(children) ? children : [children]) || []
      ]
    )
  );
  Component.displayName = `${iconName}`;
  return Component;
};
var createLucideIcon$1 = createLucideIcon;

// ../node_modules/lucide-react/dist/esm/icons/alert-circle.mjs
var AlertCircle = createLucideIcon$1("AlertCircle", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
  ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/arrow-left.mjs
var ArrowLeft = createLucideIcon$1("ArrowLeft", [
  ["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
  ["path", { d: "M19 12H5", key: "x3x0zl" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/arrow-up-right.mjs
var ArrowUpRight = createLucideIcon$1("ArrowUpRight", [
  ["path", { d: "M7 7h10v10", key: "1tivn9" }],
  ["path", { d: "M7 17 17 7", key: "1vkiza" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/camera.mjs
var Camera = createLucideIcon$1("Camera", [
  [
    "path",
    {
      d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
      key: "1tc9qg"
    }
  ],
  ["circle", { cx: "12", cy: "13", r: "3", key: "1vg3eu" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/check-circle-2.mjs
var CheckCircle2 = createLucideIcon$1("CheckCircle2", [
  [
    "path",
    {
      d: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
      key: "14v8dr"
    }
  ],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/check-square.mjs
var CheckSquare = createLucideIcon$1("CheckSquare", [
  ["polyline", { points: "9 11 12 14 22 4", key: "19ybtz" }],
  [
    "path",
    {
      d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
      key: "1jnkn4"
    }
  ]
]);

// ../node_modules/lucide-react/dist/esm/icons/check.mjs
var Check = createLucideIcon$1("Check", [
  ["polyline", { points: "20 6 9 17 4 12", key: "10jjfj" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/chevron-down.mjs
var ChevronDown = createLucideIcon$1("ChevronDown", [
  ["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/chevron-right.mjs
var ChevronRight = createLucideIcon$1("ChevronRight", [
  ["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/chevron-up.mjs
var ChevronUp = createLucideIcon$1("ChevronUp", [
  ["path", { d: "m18 15-6-6-6 6", key: "153udz" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/code.mjs
var Code = createLucideIcon$1("Code", [
  ["polyline", { points: "16 18 22 12 16 6", key: "z7tu5w" }],
  ["polyline", { points: "8 6 2 12 8 18", key: "1eg1df" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/copy.mjs
var Copy = createLucideIcon$1("Copy", [
  [
    "rect",
    {
      width: "14",
      height: "14",
      x: "8",
      y: "8",
      rx: "2",
      ry: "2",
      key: "17jyea"
    }
  ],
  [
    "path",
    {
      d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
      key: "zix9uf"
    }
  ]
]);

// ../node_modules/lucide-react/dist/esm/icons/database.mjs
var Database = createLucideIcon$1("Database", [
  ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3", key: "msslwz" }],
  ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5", key: "1wlel7" }],
  ["path", { d: "M3 12A9 3 0 0 0 21 12", key: "mv7ke4" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/download.mjs
var Download = createLucideIcon$1("Download", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "7 10 12 15 17 10", key: "2ggqvy" }],
  ["line", { x1: "12", x2: "12", y1: "15", y2: "3", key: "1vk2je" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/external-link.mjs
var ExternalLink = createLucideIcon$1("ExternalLink", [
  [
    "path",
    {
      d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
      key: "a6xqqp"
    }
  ],
  ["polyline", { points: "15 3 21 3 21 9", key: "mznyad" }],
  ["line", { x1: "10", x2: "21", y1: "14", y2: "3", key: "18c3s4" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/eye.mjs
var Eye = createLucideIcon$1("Eye", [
  [
    "path",
    { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z", key: "rwhkz3" }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/grid.mjs
var Grid = createLucideIcon$1("Grid", [
  [
    "rect",
    {
      width: "18",
      height: "18",
      x: "3",
      y: "3",
      rx: "2",
      ry: "2",
      key: "1m3agn"
    }
  ],
  ["line", { x1: "3", x2: "21", y1: "9", y2: "9", key: "1vqk6q" }],
  ["line", { x1: "3", x2: "21", y1: "15", y2: "15", key: "o2sbyz" }],
  ["line", { x1: "9", x2: "9", y1: "3", y2: "21", key: "13tij5" }],
  ["line", { x1: "15", x2: "15", y1: "3", y2: "21", key: "1hpv9i" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/image.mjs
var Image2 = createLucideIcon$1("Image", [
  [
    "rect",
    {
      width: "18",
      height: "18",
      x: "3",
      y: "3",
      rx: "2",
      ry: "2",
      key: "1m3agn"
    }
  ],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/info.mjs
var Info = createLucideIcon$1("Info", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 16v-4", key: "1dtifu" }],
  ["path", { d: "M12 8h.01", key: "e9boi3" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/layers.mjs
var Layers = createLucideIcon$1("Layers", [
  ["polygon", { points: "12 2 2 7 12 12 22 7 12 2", key: "1b0ttc" }],
  ["polyline", { points: "2 17 12 22 22 17", key: "imjtdl" }],
  ["polyline", { points: "2 12 12 17 22 12", key: "5dexcv" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/link.mjs
var Link = createLucideIcon$1("Link", [
  [
    "path",
    {
      d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
      key: "1cjeqo"
    }
  ],
  [
    "path",
    {
      d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
      key: "19qd67"
    }
  ]
]);

// ../node_modules/lucide-react/dist/esm/icons/loader-2.mjs
var Loader2 = createLucideIcon$1("Loader2", [
  ["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/log-in.mjs
var LogIn = createLucideIcon$1("LogIn", [
  ["path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", key: "u53s6r" }],
  ["polyline", { points: "10 17 15 12 10 7", key: "1ail0h" }],
  ["line", { x1: "15", x2: "3", y1: "12", y2: "12", key: "v6grx8" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/log-out.mjs
var LogOut = createLucideIcon$1("LogOut", [
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }],
  ["polyline", { points: "16 17 21 12 16 7", key: "1gabdz" }],
  ["line", { x1: "21", x2: "9", y1: "12", y2: "12", key: "1uyos4" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/mail.mjs
var Mail = createLucideIcon$1("Mail", [
  [
    "rect",
    { width: "20", height: "16", x: "2", y: "4", rx: "2", key: "18n3k1" }
  ],
  ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7", key: "1ocrg3" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/pause.mjs
var Pause = createLucideIcon$1("Pause", [
  ["rect", { width: "4", height: "16", x: "6", y: "4", key: "iffhe4" }],
  ["rect", { width: "4", height: "16", x: "14", y: "4", key: "sjin7j" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/pencil.mjs
var Pencil = createLucideIcon$1("Pencil", [
  [
    "path",
    { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z", key: "5qss01" }
  ],
  ["path", { d: "m15 5 4 4", key: "1mk7zo" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/play.mjs
var Play = createLucideIcon$1("Play", [
  ["polygon", { points: "5 3 19 12 5 21 5 3", key: "191637" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/plus.mjs
var Plus = createLucideIcon$1("Plus", [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/refresh-cw.mjs
var RefreshCw = createLucideIcon$1("RefreshCw", [
  [
    "path",
    { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }
  ],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  [
    "path",
    { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }
  ],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/rotate-ccw.mjs
var RotateCcw = createLucideIcon$1("RotateCcw", [
  [
    "path",
    { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }
  ],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/save.mjs
var Save = createLucideIcon$1("Save", [
  [
    "path",
    {
      d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
      key: "1owoqh"
    }
  ],
  ["polyline", { points: "17 21 17 13 7 13 7 21", key: "1md35c" }],
  ["polyline", { points: "7 3 7 8 15 8", key: "8nz8an" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/search.mjs
var Search = createLucideIcon$1("Search", [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["path", { d: "m21 21-4.3-4.3", key: "1qie3q" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/send.mjs
var Send = createLucideIcon$1("Send", [
  ["path", { d: "m22 2-7 20-4-9-9-4Z", key: "1q3vgg" }],
  ["path", { d: "M22 2 11 13", key: "nzbqef" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/settings.mjs
var Settings = createLucideIcon$1("Settings", [
  [
    "path",
    {
      d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
      key: "1qme2f"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/shield-check.mjs
var ShieldCheck = createLucideIcon$1("ShieldCheck", [
  ["path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", key: "3xmgem" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/shield.mjs
var Shield = createLucideIcon$1("Shield", [
  ["path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", key: "3xmgem" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/sliders-horizontal.mjs
var SlidersHorizontal = createLucideIcon$1("SlidersHorizontal", [
  ["line", { x1: "21", x2: "14", y1: "4", y2: "4", key: "obuewd" }],
  ["line", { x1: "10", x2: "3", y1: "4", y2: "4", key: "1q6298" }],
  ["line", { x1: "21", x2: "12", y1: "12", y2: "12", key: "1iu8h1" }],
  ["line", { x1: "8", x2: "3", y1: "12", y2: "12", key: "ntss68" }],
  ["line", { x1: "21", x2: "16", y1: "20", y2: "20", key: "14d8ph" }],
  ["line", { x1: "12", x2: "3", y1: "20", y2: "20", key: "m0wm8r" }],
  ["line", { x1: "14", x2: "14", y1: "2", y2: "6", key: "14e1ph" }],
  ["line", { x1: "8", x2: "8", y1: "10", y2: "14", key: "1i6ji0" }],
  ["line", { x1: "16", x2: "16", y1: "18", y2: "22", key: "1lctlv" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/sliders.mjs
var Sliders = createLucideIcon$1("Sliders", [
  ["line", { x1: "4", x2: "4", y1: "21", y2: "14", key: "1p332r" }],
  ["line", { x1: "4", x2: "4", y1: "10", y2: "3", key: "gb41h5" }],
  ["line", { x1: "12", x2: "12", y1: "21", y2: "12", key: "hf2csr" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "3", key: "1kfi7u" }],
  ["line", { x1: "20", x2: "20", y1: "21", y2: "16", key: "1lhrwl" }],
  ["line", { x1: "20", x2: "20", y1: "12", y2: "3", key: "16vvfq" }],
  ["line", { x1: "2", x2: "6", y1: "14", y2: "14", key: "1uebub" }],
  ["line", { x1: "10", x2: "14", y1: "8", y2: "8", key: "1yglbp" }],
  ["line", { x1: "18", x2: "22", y1: "16", y2: "16", key: "1jxqpz" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/smartphone.mjs
var Smartphone = createLucideIcon$1("Smartphone", [
  [
    "rect",
    {
      width: "14",
      height: "20",
      x: "5",
      y: "2",
      rx: "2",
      ry: "2",
      key: "1yt0o3"
    }
  ],
  ["path", { d: "M12 18h.01", key: "mhygvu" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/sparkles.mjs
var Sparkles = createLucideIcon$1("Sparkles", [
  [
    "path",
    {
      d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",
      key: "17u4zn"
    }
  ],
  ["path", { d: "M5 3v4", key: "bklmnn" }],
  ["path", { d: "M19 17v4", key: "iiml17" }],
  ["path", { d: "M3 5h4", key: "nem4j1" }],
  ["path", { d: "M17 19h4", key: "lbex7p" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/square.mjs
var Square = createLucideIcon$1("Square", [
  [
    "rect",
    { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }
  ]
]);

// ../node_modules/lucide-react/dist/esm/icons/terminal.mjs
var Terminal = createLucideIcon$1("Terminal", [
  ["polyline", { points: "4 17 10 11 4 5", key: "akl6gq" }],
  ["line", { x1: "12", x2: "20", y1: "19", y2: "19", key: "q2wloq" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/trash-2.mjs
var Trash2 = createLucideIcon$1("Trash2", [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/upload.mjs
var Upload = createLucideIcon$1("Upload", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "17 8 12 3 7 8", key: "t8dd8p" }],
  ["line", { x1: "12", x2: "12", y1: "3", y2: "15", key: "widbto" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/users.mjs
var Users = createLucideIcon$1("Users", [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75", key: "1da9ce" }]
]);

// ../node_modules/lucide-react/dist/esm/icons/wrench.mjs
var Wrench = createLucideIcon$1("Wrench", [
  [
    "path",
    {
      d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
      key: "cbrjhi"
    }
  ]
]);

// ../node_modules/lucide-react/dist/esm/icons/x.mjs
var X = createLucideIcon$1("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]);

// src/components/layout/NavTabs.jsx
var import_react3 = __toESM(require_react());
var TABS = [
  { id: "task", label: "Studio", icon: "\u{1F3A8}" },
  { id: "apps", label: "Apps & Clients", icon: "\u{1F4F1}" },
  { id: "builder", label: "Tool Builder", icon: "\u{1F6E0}\uFE0F" },
  { id: "tools", label: "Tools", icon: "\u26A1" },
  { id: "workers", label: "Workers", icon: "\u2699\uFE0F" },
  { id: "features", label: "Catalog", icon: "\u{1F4CB}" }
];
function NavTabs({ activeTab, onChangeTab }) {
  return /* @__PURE__ */ import_react3.default.createElement("nav", { className: "flex items-center gap-1 bg-[#0e111c] border border-white/10 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl shadow-inner" }, TABS.map((tab) => {
    const active = activeTab === tab.id;
    return /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        key: tab.id,
        type: "button",
        onClick: () => onChangeTab(tab.id),
        className: `px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all ${active ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20 font-extrabold" : "text-stone-400 hover:text-white"}`
      },
      /* @__PURE__ */ import_react3.default.createElement("span", null, tab.icon),
      /* @__PURE__ */ import_react3.default.createElement("span", null, tab.label)
    );
  }));
}

// src/components/layout/Header.jsx
function Header() {
  const { sb, email, screen, setScreen } = useAdmin();
  const handleLogout = async () => {
    if (sb?.auth)
      await sb.auth.signOut();
  };
  return /* @__PURE__ */ import_react4.default.createElement("header", { className: "border-b border-slate-800/80 bg-[#080b12]/90 backdrop-blur-md sticky top-0 z-40 transition-colors" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "max-w-7xl mx-auto px-4 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center gap-2.5 sm:gap-3" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center shadow-lg shadow-amber-400/20" }, /* @__PURE__ */ import_react4.default.createElement(Shield, { className: "w-4 h-4 sm:w-5 sm:h-5 text-slate-950 font-black" })), /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ import_react4.default.createElement("h1", { className: "font-extrabold text-sm sm:text-base tracking-tight text-white" }, "AI Studio"), /* @__PURE__ */ import_react4.default.createElement("span", { className: "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30" }, "Admin")), /* @__PURE__ */ import_react4.default.createElement("p", { className: "text-[10px] sm:text-[11px] text-slate-400 hidden sm:block" }, "Production Model Fleet & API Console")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full", title: "Connected to .NET Core 9 API on MonsterASP" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" }), /* @__PURE__ */ import_react4.default.createElement("span", { className: "text-[10px] sm:text-[11px] font-mono font-semibold" }, "Live"))), /* @__PURE__ */ import_react4.default.createElement(NavTabs, { activeTab: screen, onChangeTab: setScreen }), /* @__PURE__ */ import_react4.default.createElement("div", { className: "flex items-center gap-2 shrink-0" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "text-stone-400 text-[11px] font-mono hidden lg:inline max-w-[140px] truncate", title: email }, email), /* @__PURE__ */ import_react4.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleLogout,
      className: "h-7 sm:h-8 px-2.5 sm:px-3 bg-stone-900 hover:bg-rose-500/20 text-stone-300 hover:text-rose-400 border border-white/10 rounded-lg sm:rounded-xl text-xs font-semibold flex items-center gap-1 transition-all",
      title: "Sign out"
    },
    /* @__PURE__ */ import_react4.default.createElement(LogOut, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react4.default.createElement("span", { className: "hidden sm:inline" }, "Logout")
  ))));
}

// src/components/common/Toast.jsx
var import_react5 = __toESM(require_react());
function Toast({ message, type = "info", onClose }) {
  if (!message)
    return null;
  const isSuccess = type === "success";
  const isError = type === "error";
  return /* @__PURE__ */ import_react5.default.createElement("div", { className: "max-w-7xl mx-auto px-4 lg:px-8 mt-3 animate-fadeIn" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: `text-xs rounded-xl px-4 py-2.5 flex items-center justify-between shadow-lg border ${isSuccess ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200" : isError ? "bg-rose-500/15 border-rose-500/30 text-rose-200" : "bg-amber-400/10 border-amber-400/30 text-amber-200"}` }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "flex items-center gap-2" }, isSuccess ? /* @__PURE__ */ import_react5.default.createElement(CheckCircle2, { className: "w-4 h-4 text-emerald-400 shrink-0" }) : /* @__PURE__ */ import_react5.default.createElement(AlertCircle, { className: "w-4 h-4 shrink-0" }), /* @__PURE__ */ import_react5.default.createElement("span", null, message)), onClose && /* @__PURE__ */ import_react5.default.createElement(
    "button",
    {
      type: "button",
      onClick: onClose,
      className: "text-white/60 hover:text-white font-bold ml-2 transition-colors"
    },
    /* @__PURE__ */ import_react5.default.createElement(X, { className: "w-3.5 h-3.5" })
  )));
}

// src/components/studio/StudioScreen.jsx
var import_react17 = __toESM(require_react());

// src/components/studio/ToolCatalogBar.jsx
var import_react6 = __toESM(require_react());

// src/constants/categories.js
var TOOL_CATEGORIES = [
  { id: "all", label: "All Tools", icon: "\u2728" },
  { id: "fashion", label: "Fashion & Apparel", icon: "\u{1F457}" },
  { id: "catalog", label: "Product & E-Commerce", icon: "\u{1F4E6}" },
  { id: "tryon", label: "Virtual Try-On", icon: "\u{1F48E}" },
  { id: "portrait", label: "Portraits & Wedding", icon: "\u{1F4F8}" },
  { id: "arch", label: "Spaces & Interior", icon: "\u{1F3E0}" },
  { id: "vision", label: "AI Vision & Chat", icon: "\u{1F441}\uFE0F" }
];
function getToolCategory(taskType) {
  if ([
    "batch_model_to_garment",
    "suit_studio",
    "saree_lehenga_studio",
    "ghost_mannequin",
    "outfit_change",
    "outfit_change_ref",
    "man_shirt",
    "man_suit",
    "man_jeans",
    "man_shorts",
    "man_shoes",
    "shirt_change",
    "suit_change",
    "woman_shoes"
  ].includes(taskType))
    return "fashion";
  if ([
    "combo_5pose_studio",
    "luxury_product_podium",
    "food_photography_studio",
    "festival_sale_banner",
    "product_angles",
    "product_catalog",
    "product_scene",
    "mockup",
    "sticker_logo",
    "poster_text"
  ].includes(taskType))
    return "catalog";
  if ([
    "jewellery_tryon",
    "watch_sunglasses_tryon",
    "virtual_tryon",
    "man_glasses",
    "woman_glasses",
    "woman_earrings",
    "woman_nose_pin"
  ].includes(taskType))
    return "tryon";
  if ([
    "prewedding_studio",
    "bridal_makeup_studio",
    "couple_photo",
    "family_photo",
    "hair_salon_studio",
    "hair_change",
    "face_swap",
    "pose_change"
  ].includes(taskType))
    return "portrait";
  if ([
    "room_interior_redesign",
    "house_exterior_paint",
    "kids_milestone_studio"
  ].includes(taskType))
    return "arch";
  if ([
    "chat",
    "photo_read",
    "product_tag",
    "ocr_text",
    "moderation_check"
  ].includes(taskType))
    return "vision";
  return "utility";
}

// src/components/studio/ToolCatalogBar.jsx
function ToolCatalogBar({ catalog, selectedTaskType, onSelectTaskType }) {
  const [search, setSearch] = (0, import_react6.useState)("");
  const [selectedCategory, setSelectedCategory] = (0, import_react6.useState)("all");
  const [showCatalog, setShowCatalog] = (0, import_react6.useState)(false);
  const activeList = (catalog || []).filter((c) => c.enabled);
  const filteredTools = activeList.filter((t) => {
    const cat = getToolCategory(t.task_type);
    const matchesCategory = selectedCategory === "all" || cat === selectedCategory;
    const matchesSearch = !search || (t.label || "").toLowerCase().includes(search.toLowerCase()) || (t.task_type || "").toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  return /* @__PURE__ */ import_react6.default.createElement("section", { className: "bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("h2", { className: "text-sm sm:text-base font-extrabold text-white flex items-center gap-2" }, /* @__PURE__ */ import_react6.default.createElement("span", null, "Select AI Studio Tool"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full" }, activeList.length, " Active Tools")), /* @__PURE__ */ import_react6.default.createElement("p", { className: "text-xs text-slate-400 mt-0.5" }, "Choose an e-commerce, try-on, portrait, or styling workflow")), /* @__PURE__ */ import_react6.default.createElement("div", { className: "flex items-center gap-2 w-full sm:w-auto" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "relative flex-1 sm:w-64" }, /* @__PURE__ */ import_react6.default.createElement(Search, { className: "w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }), /* @__PURE__ */ import_react6.default.createElement(
    "input",
    {
      type: "text",
      value: search,
      onChange: (e) => setSearch(e.target.value),
      placeholder: "Search tools (e.g. suit, garment)...",
      className: "w-full h-8 sm:h-9 bg-[#080b12] border border-slate-800 rounded-xl pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
    }
  )), /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowCatalog(!showCatalog),
      className: `h-8 sm:h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${showCatalog ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20" : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60"}`
    },
    /* @__PURE__ */ import_react6.default.createElement(SlidersHorizontal, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react6.default.createElement("span", { className: "hidden sm:inline" }, showCatalog ? "Minimize Tools" : "Show All Tools"),
    /* @__PURE__ */ import_react6.default.createElement("span", null, "(", filteredTools.length, ")"),
    showCatalog ? /* @__PURE__ */ import_react6.default.createElement(ChevronUp, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ import_react6.default.createElement(ChevronDown, { className: "w-3.5 h-3.5" })
  ))), showCatalog && /* @__PURE__ */ import_react6.default.createElement("div", { className: "pt-3.5 border-t border-slate-800/80 space-y-3 animate-fadeIn" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" }, TOOL_CATEGORIES.map((cat) => {
    const count = cat.id === "all" ? activeList.length : activeList.filter((c) => getToolCategory(c.task_type) === cat.id).length;
    const active = selectedCategory === cat.id;
    return /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        key: cat.id,
        type: "button",
        onClick: () => setSelectedCategory(cat.id),
        className: `whitespace-nowrap px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${active ? "bg-amber-400 text-slate-950 font-bold shadow-sm" : "bg-[#080b12] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"}`
      },
      /* @__PURE__ */ import_react6.default.createElement("span", null, cat.icon),
      /* @__PURE__ */ import_react6.default.createElement("span", null, cat.label),
      /* @__PURE__ */ import_react6.default.createElement("span", { className: `text-[10px] px-1.5 py-0.2 rounded-full font-mono ${active ? "bg-black/20 text-black font-bold" : "bg-white/5 text-slate-500"}` }, count)
    );
  })), /* @__PURE__ */ import_react6.default.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1" }, filteredTools.map((t) => {
    const isSelected = selectedTaskType === t.task_type;
    const category = getToolCategory(t.task_type);
    const catObj = TOOL_CATEGORIES.find((c) => c.id === category) || TOOL_CATEGORIES[0];
    return /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        key: t.task_type,
        type: "button",
        onClick: () => onSelectTaskType(t.task_type),
        className: `p-2.5 sm:p-3 rounded-xl text-left border transition-all flex flex-col justify-between space-y-2 relative overflow-hidden group ${isSelected ? "bg-amber-400/15 border-amber-400 text-white shadow-md shadow-amber-400/10 ring-1 ring-amber-400/40" : "bg-[#080b12] hover:bg-slate-800/80 border-slate-800/80 text-slate-300 hover:border-slate-700"}`
      },
      /* @__PURE__ */ import_react6.default.createElement("div", { className: "flex items-center justify-between w-full" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-lg sm:text-xl" }, catObj.icon), /* @__PURE__ */ import_react6.default.createElement("span", { className: `text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${isSelected ? "bg-amber-400 text-slate-950 font-extrabold" : "bg-slate-800 text-slate-400"}` }, t.output === "image" ? "Photo" : "Text")),
      /* @__PURE__ */ import_react6.default.createElement("p", { className: `text-xs font-bold line-clamp-2 leading-tight ${isSelected ? "text-amber-300" : "text-slate-200 group-hover:text-white"}` }, t.label),
      /* @__PURE__ */ import_react6.default.createElement("div", { className: "flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 border-t border-white/5 w-full" }, /* @__PURE__ */ import_react6.default.createElement("span", null, t.inputs?.length ? `${t.inputs.length} slots` : "Prompt"), isSelected ? /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-amber-400 font-bold flex items-center gap-0.5" }, /* @__PURE__ */ import_react6.default.createElement(Check, { className: "w-3 h-3" }), " Active") : /* @__PURE__ */ import_react6.default.createElement("span", { className: "text-slate-600 group-hover:text-slate-400" }, "Select \u2192"))
    );
  }))));
}

// src/components/studio/GenerationSettings.jsx
var import_react8 = __toESM(require_react());

// src/components/common/InfoTip.jsx
var import_react7 = __toESM(require_react());
function InfoTip({ text, className = "" }) {
  const [open, setOpen] = (0, import_react7.useState)(false);
  const tipRef = (0, import_react7.useRef)(null);
  (0, import_react7.useEffect)(() => {
    if (!open)
      return;
    const handleOutside = (e) => {
      if (tipRef.current && !tipRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [open]);
  if (!text)
    return null;
  return /* @__PURE__ */ import_react7.default.createElement(
    "span",
    {
      ref: tipRef,
      className: `relative inline-flex items-center align-middle ${className}`,
      onMouseEnter: () => setOpen(true),
      onMouseLeave: () => setOpen(false)
    },
    /* @__PURE__ */ import_react7.default.createElement(
      "button",
      {
        type: "button",
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        },
        className: "w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-400 focus:outline-none transition-colors",
        "aria-label": "Info details"
      },
      /* @__PURE__ */ import_react7.default.createElement(Info, { className: "w-3.5 h-3.5" })
    ),
    open && /* @__PURE__ */ import_react7.default.createElement(
      "div",
      {
        role: "tooltip",
        className: "absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 sm:w-64 p-2.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-[11px] leading-relaxed text-slate-200 pointer-events-none animate-fadeIn"
      },
      /* @__PURE__ */ import_react7.default.createElement("div", { className: "font-sans font-normal text-left" }, text),
      /* @__PURE__ */ import_react7.default.createElement("div", { className: "absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" })
    )
  );
}

// src/components/studio/GenerationSettings.jsx
function GenerationSettings({ form, setForm, type, caps, modelOptions }) {
  const isImage = type.output === "image";
  return /* @__PURE__ */ import_react8.default.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "space-y-1.5" }, /* @__PURE__ */ import_react8.default.createElement("label", { className: "block text-xs font-bold text-slate-200" }, "Engine / Model", /* @__PURE__ */ import_react8.default.createElement(InfoTip, { text: "Choose which Gemini multimodal vision or image generation model processes this task." })), /* @__PURE__ */ import_react8.default.createElement(
    "select",
    {
      value: form.model,
      onChange: (e) => setForm({ ...form, model: e.target.value }),
      className: "h-9 w-full bg-[#080b12] border border-slate-800 rounded-xl px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400 transition-colors"
    },
    modelOptions.map((id) => /* @__PURE__ */ import_react8.default.createElement("option", { key: id, value: id }, id, " ", id === "gemini-3.1-flash-image-preview" ? "(Recommended \u2022 2K/4K)" : ""))
  )), isImage && /* @__PURE__ */ import_react8.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1" }, /* @__PURE__ */ import_react8.default.createElement("div", null, /* @__PURE__ */ import_react8.default.createElement("label", { className: "block text-[11px] font-bold text-slate-400 mb-1" }, "Aspect Ratio", /* @__PURE__ */ import_react8.default.createElement(InfoTip, { text: "Controls width-to-height proportion (1:1 Square, 4:5 Portrait, 9:16 Story)." })), /* @__PURE__ */ import_react8.default.createElement("div", { className: "flex flex-wrap gap-1" }, (caps?.aspects?.length ? caps.aspects : ["1:1", "4:5", "9:16", "16:9"]).slice(0, 5).map((a) => /* @__PURE__ */ import_react8.default.createElement(
    "button",
    {
      key: a,
      type: "button",
      onClick: () => setForm({ ...form, aspect_ratio: a }),
      className: `px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${form.aspect_ratio === a ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`
    },
    a
  )))), /* @__PURE__ */ import_react8.default.createElement("div", null, /* @__PURE__ */ import_react8.default.createElement("label", { className: "block text-[11px] font-bold text-slate-400 mb-1" }, "Resolution Size", /* @__PURE__ */ import_react8.default.createElement(InfoTip, { text: "Output image resolution quality (1K Standard, 2K Crisp, 4K Ultra-HD)." })), /* @__PURE__ */ import_react8.default.createElement(
    "select",
    {
      value: form.image_size,
      onChange: (e) => setForm({ ...form, image_size: e.target.value }),
      disabled: !caps?.sizes?.length,
      className: "h-8 w-full bg-slate-900 border border-slate-800 rounded-lg px-2 text-xs text-slate-200 font-mono disabled:opacity-40 focus:outline-none focus:border-amber-400"
    },
    (caps?.sizes?.length ? caps.sizes : ["1K", "2K", "4K"]).map((s) => /* @__PURE__ */ import_react8.default.createElement("option", { key: s, value: s }, s || "Default"))
  )), /* @__PURE__ */ import_react8.default.createElement("div", null, /* @__PURE__ */ import_react8.default.createElement("label", { className: "block text-[11px] font-bold text-slate-400 mb-1" }, "Batch Count", /* @__PURE__ */ import_react8.default.createElement(InfoTip, { text: "Number of parallel image variations to generate concurrently (1-4 photos)." })), /* @__PURE__ */ import_react8.default.createElement(
    "input",
    {
      type: "number",
      min: 1,
      max: 10,
      value: form.batch_count,
      onChange: (e) => setForm({ ...form, batch_count: Math.min(10, Math.max(1, Number(e.target.value) || 1)) }),
      className: "h-8 w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
    }
  ))));
}

// src/components/studio/PhotoSlotGrid.jsx
var import_react9 = __toESM(require_react());

// src/api/uploadService.js
function compressFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Photo padh nahi paayi"));
      img.onload = () => {
        const k = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * k);
        c.height = Math.round(img.naturalHeight * k);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
async function uploadFile(file) {
  if (!file)
    throw new Error("File missing hai");
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET || "ml_default");
    const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      if (data.secure_url)
        return data.secure_url;
    }
  } catch (e) {
    console.warn("Cloudinary raw upload error, trying compressed upload...", e);
  }
  try {
    const dataUrl = await compressFile(file);
    const fd = new FormData();
    fd.append("file", dataUrl);
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET || "ml_default");
    const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      if (data.secure_url)
        return data.secure_url;
    }
  } catch (e) {
    console.warn("Cloudinary compressed upload failed, generating guaranteed instant local data link...", e);
  }
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Photo read error"));
    r.readAsDataURL(file);
  });
}

// src/components/studio/PhotoSlotGrid.jsx
function PhotoSlotGrid({ type, form, setForm, onSetMsg }) {
  if (!type.inputs || type.inputs.length === 0)
    return null;
  const [uploadingSlot, setUploadingSlot] = (0, import_react9.useState)(null);
  const handleFileUpload = async (e, col) => {
    const file = e.target.files?.[0];
    if (!file)
      return;
    setUploadingSlot(col);
    if (onSetMsg)
      onSetMsg("Photo upload ho rahi hai...");
    try {
      const url = await uploadFile(file);
      setForm((prev) => ({ ...prev, [col]: url }));
      if (onSetMsg)
        onSetMsg("Photo successfully upload ho gayi!");
    } catch (err) {
      if (onSetMsg)
        onSetMsg("Upload error: " + err.message);
    } finally {
      setUploadingSlot(null);
    }
  };
  const handleUrlChange = (col, value) => {
    setForm((prev) => ({ ...prev, [col]: value.trim() }));
  };
  const handleClear = (col) => {
    setForm((prev) => ({ ...prev, [col]: "" }));
  };
  return /* @__PURE__ */ import_react9.default.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react9.default.createElement("label", { className: "text-xs font-bold text-slate-200 flex items-center gap-2" }, /* @__PURE__ */ import_react9.default.createElement("span", null, "Required Photo References (", type.inputs.length, " Slots)"), /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-mono" }, "Upload File ya Direct URL"))), /* @__PURE__ */ import_react9.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3.5" }, type.inputs.map((key) => {
    const col = INPUT_COLUMN[key];
    const val = form[col] || "";
    const isOptional = type.optional?.includes(key);
    const isUploading = uploadingSlot === col;
    return /* @__PURE__ */ import_react9.default.createElement("div", { key, className: "bg-[#080b12] border border-slate-800 rounded-2xl p-3.5 space-y-3 transition-colors hover:border-slate-700" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "flex items-center justify-between text-xs" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "font-bold text-slate-200 flex items-center gap-1.5" }, /* @__PURE__ */ import_react9.default.createElement(Image2, { className: "w-3.5 h-3.5 text-amber-400" }), /* @__PURE__ */ import_react9.default.createElement("span", null, labelFor(type, key)), !isOptional ? /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-amber-400 font-bold" }, "*") : /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-slate-500 font-mono text-[10px]" }, "(Opt)")), val && /* @__PURE__ */ import_react9.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleClear(col),
        className: "text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors",
        title: "Clear photo"
      },
      /* @__PURE__ */ import_react9.default.createElement(X, { className: "w-3.5 h-3.5" }),
      /* @__PURE__ */ import_react9.default.createElement("span", null, "Remove")
    )), val ? /* @__PURE__ */ import_react9.default.createElement("div", { className: "relative rounded-xl overflow-hidden bg-black/80 border border-slate-700/80 aspect-video flex items-center justify-center group" }, /* @__PURE__ */ import_react9.default.createElement(
      "img",
      {
        src: val,
        alt: key,
        className: "w-full h-full object-contain",
        onError: (e) => {
          e.target.style.display = "none";
        }
      }
    ), /* @__PURE__ */ import_react9.default.createElement("div", { className: "absolute bottom-2 left-2 flex items-center gap-1 bg-black/80 backdrop-blur-sm text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30" }, /* @__PURE__ */ import_react9.default.createElement(Check, { className: "w-3 h-3" }), /* @__PURE__ */ import_react9.default.createElement("span", null, "Photo Active")), /* @__PURE__ */ import_react9.default.createElement(
      "a",
      {
        href: val,
        target: "_blank",
        rel: "noreferrer",
        className: "absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-400 hover:text-black",
        title: "Open in new tab"
      },
      /* @__PURE__ */ import_react9.default.createElement(ExternalLink, { className: "w-3.5 h-3.5" })
    )) : (
      /* Upload File Drop Area */
      /* @__PURE__ */ import_react9.default.createElement("label", { className: `flex flex-col items-center justify-center p-4 border border-dashed rounded-xl cursor-pointer transition-all ${isUploading ? "border-amber-400 bg-amber-400/10" : "border-slate-800 hover:border-amber-400/80 bg-slate-900/30 hover:bg-slate-900/60"}` }, /* @__PURE__ */ import_react9.default.createElement(Upload, { className: `w-5 h-5 mb-1 ${isUploading ? "text-amber-400 animate-bounce" : "text-slate-400 group-hover:text-amber-400"}` }), /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-xs font-semibold text-slate-300" }, isUploading ? "Uploading photo..." : "Click to Upload Image File"), /* @__PURE__ */ import_react9.default.createElement("span", { className: "text-[10px] text-slate-500 mt-0.5" }, "JPG, PNG, WEBP from device"), /* @__PURE__ */ import_react9.default.createElement(
        "input",
        {
          type: "file",
          accept: "image/*",
          disabled: isUploading,
          onChange: (e) => handleFileUpload(e, col),
          className: "hidden"
        }
      ))
    ), /* @__PURE__ */ import_react9.default.createElement("div", { className: "space-y-1 pt-0.5" }, /* @__PURE__ */ import_react9.default.createElement("label", { className: "text-[10px] font-mono text-slate-400 flex items-center gap-1" }, /* @__PURE__ */ import_react9.default.createElement(Link, { className: "w-3 h-3 text-slate-400" }), /* @__PURE__ */ import_react9.default.createElement("span", null, "Direct Image URL (Paste link):")), /* @__PURE__ */ import_react9.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react9.default.createElement(
      "input",
      {
        type: "url",
        value: val,
        onChange: (e) => handleUrlChange(col, e.target.value),
        placeholder: "https://res.cloudinary.com/... ya direct image URL",
        className: "w-full h-8 bg-slate-900/90 border border-slate-800 focus:border-amber-400 rounded-lg px-2.5 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none transition-colors"
      }
    ))));
  })));
}

// src/components/studio/BatchUploader.jsx
var import_react10 = __toESM(require_react());
function BatchUploader({ type, form, setForm, onSetMsg }) {
  const [uploadingCount, setUploadingCount] = (0, import_react10.useState)(0);
  if (!type.extras || type.family)
    return null;
  const urls = (Array.isArray(form.extra_image_urls) ? form.extra_image_urls : String(form.extra_image_urls || "").split("\n")).map((s) => String(s || "").trim()).filter(Boolean);
  const handleBatchFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 50);
    if (!files.length)
      return;
    setUploadingCount(files.length);
    if (onSetMsg)
      onSetMsg(`${files.length} photos upload ho rahi hain...`);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        if (onSetMsg)
          onSetMsg(`Uploading ${i + 1}/${files.length} photos...`);
        uploadedUrls.push(await uploadFile(files[i]));
      }
      const combined = [...urls, ...uploadedUrls].slice(0, 50);
      setForm((prev) => ({ ...prev, extra_image_urls: combined.join("\n") }));
      if (onSetMsg)
        onSetMsg(`${combined.length} photos successfully upload ho gayi!`);
    } catch (err) {
      if (onSetMsg)
        onSetMsg("Upload error: " + err.message);
    } finally {
      setUploadingCount(0);
    }
  };
  const removePhoto = (idx) => {
    const updated = [...urls];
    updated.splice(idx, 1);
    setForm((prev) => ({ ...prev, extra_image_urls: updated.join("\n") }));
  };
  const clearAll = () => {
    setForm((prev) => ({ ...prev, extra_image_urls: "" }));
  };
  return /* @__PURE__ */ import_react10.default.createElement("div", { className: "space-y-2 bg-[#080b12] border border-amber-400/25 p-3 sm:p-4 rounded-xl" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" }, /* @__PURE__ */ import_react10.default.createElement("label", { className: "text-xs font-bold text-amber-300 flex items-center gap-1.5" }, /* @__PURE__ */ import_react10.default.createElement(Image2, { className: "w-4 h-4 text-amber-400" }), /* @__PURE__ */ import_react10.default.createElement("span", null, "Batch Model Photos Upload (1 se 50 Photos)"), /* @__PURE__ */ import_react10.default.createElement(InfoTip, { text: "Upload multiple photos in one batch. Worker will process all photos in parallel or one-by-one catalog extractions." })), /* @__PURE__ */ import_react10.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: `text-[10px] font-mono px-2 py-0.5 rounded font-bold ${urls.length > 0 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/5 text-slate-400"}` }, urls.length, "/50 Photos"), urls.length > 0 && /* @__PURE__ */ import_react10.default.createElement(
    "button",
    {
      type: "button",
      onClick: clearAll,
      className: "text-[10px] text-rose-400 hover:text-rose-300 underline font-mono ml-1"
    },
    "Clear All"
  ))), /* @__PURE__ */ import_react10.default.createElement("div", { className: "border border-dashed border-amber-400/30 rounded-xl p-4 sm:p-5 text-center space-y-2 hover:border-amber-400/60 transition-colors bg-amber-400/5" }, /* @__PURE__ */ import_react10.default.createElement(Upload, { className: "w-6 h-6 mx-auto text-amber-400" }), /* @__PURE__ */ import_react10.default.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ import_react10.default.createElement("label", { className: "cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-extrabold shadow-md shadow-amber-400/20 active:scale-98 transition-all" }, /* @__PURE__ */ import_react10.default.createElement("span", null, "Click to Select 10, 20 or up to 50 Photos"), /* @__PURE__ */ import_react10.default.createElement(
    "input",
    {
      type: "file",
      accept: "image/*",
      multiple: true,
      onChange: handleBatchFiles,
      className: "hidden"
    }
  )), /* @__PURE__ */ import_react10.default.createElement("p", { className: "text-[11px] text-slate-400" }, uploadingCount > 0 ? `Uploading ${uploadingCount} photos, kripya wait karein...` : "Mobile ya computer se saari photos ek sath select karke upload karein"))), urls.length > 0 && /* @__PURE__ */ import_react10.default.createElement("div", { className: "space-y-2 pt-1" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "flex items-center justify-between text-[11px] font-bold text-slate-300" }, /* @__PURE__ */ import_react10.default.createElement("span", null, "Uploaded Model Photos Queue:"), /* @__PURE__ */ import_react10.default.createElement("span", { className: "text-[10px] text-amber-300 font-mono" }, "Har photo ka alag garment banega")), /* @__PURE__ */ import_react10.default.createElement("div", { className: "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto pr-1" }, urls.map((url, idx) => /* @__PURE__ */ import_react10.default.createElement("div", { key: idx, className: "relative rounded-lg overflow-hidden bg-black/60 border border-slate-800 aspect-square group" }, /* @__PURE__ */ import_react10.default.createElement("img", { src: url, alt: `#${idx + 1}`, className: "w-full h-full object-cover" }), /* @__PURE__ */ import_react10.default.createElement("span", { className: "absolute bottom-1 left-1 bg-black/80 text-[9px] font-mono font-bold text-amber-300 px-1 rounded" }, "#", idx + 1), /* @__PURE__ */ import_react10.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => removePhoto(idx),
      className: "absolute top-1 right-1 w-4 h-4 bg-rose-500/90 hover:bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
      title: "Photo remove karein"
    },
    /* @__PURE__ */ import_react10.default.createElement(X, { className: "w-2.5 h-2.5" })
  ))))), /* @__PURE__ */ import_react10.default.createElement("details", { className: "text-[11px] text-slate-400 cursor-pointer pt-1" }, /* @__PURE__ */ import_react10.default.createElement("summary", { className: "hover:text-amber-300 transition-colors" }, "Direct image URLs paste karna chahein to click karein (Optional)"), /* @__PURE__ */ import_react10.default.createElement(
    "textarea",
    {
      value: form.extra_image_urls,
      onChange: (e) => setForm({ ...form, extra_image_urls: e.target.value }),
      rows: 3,
      placeholder: "https://... (ek line me ek photo link)",
      className: "mt-2 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-400"
    }
  )));
}

// src/components/studio/PromptSection.jsx
var import_react11 = __toESM(require_react());
function PromptSection({ type, form, setForm }) {
  const handleAngleToggle = (angle) => {
    const current = form.prompt.trim();
    const anglePattern = new RegExp(`\\b${angle}\\b`, "i");
    if (anglePattern.test(current)) {
      const next = current.replace(anglePattern, "").replace(/\s{2,}/g, " ").trim();
      setForm({ ...form, prompt: next });
    } else {
      const next = current ? `${current}, ${angle}` : angle;
      setForm({ ...form, prompt: next });
    }
  };
  return /* @__PURE__ */ import_react11.default.createElement("div", { className: "space-y-3" }, type.angles && type.angles.length > 0 && /* @__PURE__ */ import_react11.default.createElement("div", { className: "space-y-2 bg-[#080b12] border border-amber-400/25 p-3 sm:p-3.5 rounded-xl" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react11.default.createElement("label", { className: "text-xs font-bold text-amber-300 flex items-center gap-1.5" }, /* @__PURE__ */ import_react11.default.createElement(Camera, { className: "w-4 h-4 text-amber-400" }), /* @__PURE__ */ import_react11.default.createElement("span", null, "Angles & Poses (Click to Add to Prompt)")), /* @__PURE__ */ import_react11.default.createElement("span", { className: "text-[10px] text-slate-400 font-mono" }, "Multiple select available")), /* @__PURE__ */ import_react11.default.createElement("div", { className: "flex flex-wrap gap-1.5" }, type.angles.map((angle) => {
    const isIncluded = new RegExp(`\\b${angle}\\b`, "i").test(form.prompt);
    return /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        key: angle,
        type: "button",
        onClick: () => handleAngleToggle(angle),
        className: `px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${isIncluded ? "bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-sm" : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"}`
      },
      angle
    );
  }))), /* @__PURE__ */ import_react11.default.createElement("div", { className: "space-y-1.5" }, /* @__PURE__ */ import_react11.default.createElement("div", { className: "flex items-center justify-between text-xs" }, /* @__PURE__ */ import_react11.default.createElement("label", { className: "font-bold text-slate-200 flex items-center gap-1" }, "Creative Prompt ", type.promptRequired ? /* @__PURE__ */ import_react11.default.createElement("span", { className: "text-amber-400 font-bold" }, "*") : /* @__PURE__ */ import_react11.default.createElement("span", { className: "text-slate-500 font-mono" }, "(Opt)"), /* @__PURE__ */ import_react11.default.createElement(InfoTip, { text: "Describe colors, lighting, studio background, pose specifics, and clothing details." })), /* @__PURE__ */ import_react11.default.createElement("span", { className: "text-[11px] text-slate-500 font-mono" }, form.prompt.length, " chars")), /* @__PURE__ */ import_react11.default.createElement(
    "textarea",
    {
      value: form.prompt,
      onChange: (e) => setForm({ ...form, prompt: e.target.value }),
      rows: 3,
      placeholder: type.promptRequired ? "Describe what to generate, outfit colors, lighting, studio background..." : "Extra styling details, environment, lighting, pose specifics (optional)...",
      className: "w-full bg-[#080b12] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-sans leading-relaxed"
    }
  )));
}

// src/components/studio/ActionPanel.jsx
var import_react12 = __toESM(require_react());
function ActionPanel({ problems, isGenerating, btnFeedback, onClearFeedback, onSendTask }) {
  const hasProblems = problems && problems.length > 0;
  return /* @__PURE__ */ import_react12.default.createElement("div", { className: "space-y-3 pt-2" }, hasProblems && /* @__PURE__ */ import_react12.default.createElement("div", { className: "bg-amber-400/10 border border-amber-400/25 rounded-xl p-3 space-y-1.5 animate-fadeIn" }, /* @__PURE__ */ import_react12.default.createElement("p", { className: "text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5" }, /* @__PURE__ */ import_react12.default.createElement(AlertCircle, { className: "w-3.5 h-3.5 text-amber-400 shrink-0" }), "Task dispatch karne ke liye ye zaroori hai:"), /* @__PURE__ */ import_react12.default.createElement("div", { className: "space-y-1 pl-5" }, problems.map((p, i) => /* @__PURE__ */ import_react12.default.createElement("p", { key: i, className: "text-xs text-amber-200 list-item list-disc" }, p)))), btnFeedback && /* @__PURE__ */ import_react12.default.createElement("div", { className: `p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-lg transition-all animate-fadeIn ${btnFeedback.type === "success" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-rose-500/15 border-rose-500/30 text-rose-300"}` }, /* @__PURE__ */ import_react12.default.createElement("div", { className: "flex items-center gap-2" }, btnFeedback.type === "success" ? /* @__PURE__ */ import_react12.default.createElement(Check, { className: "w-4 h-4 text-emerald-400 shrink-0" }) : /* @__PURE__ */ import_react12.default.createElement(AlertCircle, { className: "w-4 h-4 text-rose-400 shrink-0" }), /* @__PURE__ */ import_react12.default.createElement("span", null, btnFeedback.message)), onClearFeedback && /* @__PURE__ */ import_react12.default.createElement(
    "button",
    {
      type: "button",
      onClick: onClearFeedback,
      className: "text-xs opacity-70 hover:opacity-100 font-bold ml-2"
    },
    "\u2715"
  )), /* @__PURE__ */ import_react12.default.createElement(
    "button",
    {
      type: "button",
      onClick: onSendTask,
      disabled: isGenerating || hasProblems,
      className: `w-full h-11 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all ${hasProblems ? "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-70 shadow-none" : isGenerating ? "bg-amber-400/60 text-slate-900 cursor-wait" : "bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-amber-400/20 active:scale-98"}`
    },
    isGenerating ? /* @__PURE__ */ import_react12.default.createElement(import_react12.default.Fragment, null, /* @__PURE__ */ import_react12.default.createElement(Loader2, { className: "w-4 h-4 animate-spin text-slate-950" }), /* @__PURE__ */ import_react12.default.createElement("span", null, "Dispatching Task to Queue...")) : /* @__PURE__ */ import_react12.default.createElement(import_react12.default.Fragment, null, /* @__PURE__ */ import_react12.default.createElement(Sparkles, { className: "w-4 h-4 text-slate-950" }), /* @__PURE__ */ import_react12.default.createElement("span", { className: "sm:inline hidden" }, "Generate Task & Send to Worker Fleet"), /* @__PURE__ */ import_react12.default.createElement("span", { className: "sm:hidden inline" }, "Generate Task \u26A1"), /* @__PURE__ */ import_react12.default.createElement(ArrowUpRight, { className: "w-4 h-4" }))
  ));
}

// src/components/studio/JsonConsole.jsx
var import_react13 = __toESM(require_react());

// src/utils/formatters.js
var STATUS_STYLE = {
  pending: "text-stone-300 bg-stone-800 border-white/10",
  processing: "text-sky-300 bg-sky-500/10 border-sky-500/30",
  done: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  failed: "text-rose-300 bg-rose-500/10 border-rose-500/30"
};
function copyToClipboard(text, onSuccess) {
  if (!text)
    return;
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess));
  } else {
    fallbackCopy(text, onSuccess);
  }
}
function fallbackCopy(text, onSuccess) {
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  try {
    document.execCommand("copy");
    if (onSuccess)
      onSuccess();
  } catch {
  }
  document.body.removeChild(el);
}
function formatDuration(ms) {
  if (!ms || ms < 0)
    return "\u2014";
  if (ms < 1e3)
    return `${ms}ms`;
  return `${(ms / 1e3).toFixed(1)}s`;
}
function timeAgo(isoString) {
  if (!isoString)
    return "\u2014";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return isoString;
  }
}

// src/components/studio/JsonConsole.jsx
function JsonConsole({ row, preview, onSendTask }) {
  const [tab, setTab] = (0, import_react13.useState)("payload");
  const [copied, setCopied] = (0, import_react13.useState)(false);
  const apiPayload = JSON.stringify(row, null, 2);
  const modelPayload = JSON.stringify(preview, null, 2);
  const curlSnippet = `# 1. cURL API Call (MonsterASP / .NET Core):
curl -X POST "${API_URL}/rest/v1/rpc/upload_ai_studio_task" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ p_payload: row }, null, 2)}'`;
  const sampleResponse = JSON.stringify({
    id: 38,
    status: "done",
    output_image_url: "https://res.cloudinary.com/draaqjcre/image/upload/v1730000000/generated_output.jpg",
    face_match_score: 98.4,
    duration_ms: 3420,
    worker_id: "worker_01"
  }, null, 2);
  const activeContent = tab === "payload" ? apiPayload : tab === "model" ? modelPayload : tab === "curl" ? curlSnippet : sampleResponse;
  const handleCopy = () => {
    copyToClipboard(activeContent, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    });
  };
  return /* @__PURE__ */ import_react13.default.createElement("section", { className: "bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4 shadow-xl" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react13.default.createElement("div", { className: "w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center" }, /* @__PURE__ */ import_react13.default.createElement(Code, { className: "w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" })), /* @__PURE__ */ import_react13.default.createElement("div", null, /* @__PURE__ */ import_react13.default.createElement("h3", { className: "text-xs sm:text-sm font-bold text-white" }, "Live API Payload"), /* @__PURE__ */ import_react13.default.createElement("p", { className: "text-[10px] text-slate-400 font-mono hidden sm:block" }, "JSON & Model cURL"))), /* @__PURE__ */ import_react13.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleCopy,
      className: "h-7 sm:h-8 px-2.5 sm:px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg sm:rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all"
    },
    copied ? /* @__PURE__ */ import_react13.default.createElement(Check, { className: "w-3.5 h-3.5 text-emerald-400" }) : /* @__PURE__ */ import_react13.default.createElement(Copy, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react13.default.createElement("span", null, copied ? "Copied!" : "Copy")
  )), /* @__PURE__ */ import_react13.default.createElement("div", { className: "flex items-center gap-1 bg-[#080b12] p-1 rounded-xl border border-slate-800 text-[11px] font-mono" }, [
    { id: "payload", label: "1. Task JSON" },
    { id: "model", label: "2. Gemini Body" },
    { id: "curl", label: "3. cURL" },
    { id: "response", label: "4. Output Schema" }
  ].map((t) => /* @__PURE__ */ import_react13.default.createElement(
    "button",
    {
      key: t.id,
      type: "button",
      onClick: () => setTab(t.id),
      className: `flex-1 py-1 px-1.5 rounded-lg text-center font-bold transition-all truncate ${tab === t.id ? "bg-amber-400 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`
    },
    t.label
  ))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react13.default.createElement("pre", { className: "bg-[#080b12] border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[360px] sm:max-h-[420px] scrollbar-thin leading-relaxed selection:bg-emerald-500/30" }, /* @__PURE__ */ import_react13.default.createElement("code", null, activeContent))), /* @__PURE__ */ import_react13.default.createElement("div", { className: "space-y-1.5 pt-1" }, /* @__PURE__ */ import_react13.default.createElement(
    "button",
    {
      type: "button",
      onClick: onSendTask,
      className: "w-full h-8 sm:h-9 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
    },
    /* @__PURE__ */ import_react13.default.createElement(Send, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react13.default.createElement("span", null, "Test This Payload")
  )));
}

// src/components/history/TaskHistory.jsx
var import_react16 = __toESM(require_react());

// src/components/common/StatusBadge.jsx
var import_react14 = __toESM(require_react());
function StatusBadge({ status, className = "" }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return /* @__PURE__ */ import_react14.default.createElement("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold capitalize border ${style} ${className}` }, /* @__PURE__ */ import_react14.default.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${status === "done" ? "bg-emerald-400" : status === "processing" ? "bg-sky-400 animate-pulse" : status === "failed" ? "bg-rose-400" : "bg-stone-400"}` }), /* @__PURE__ */ import_react14.default.createElement("span", null, status || "pending"));
}

// src/components/history/TaskModal.jsx
var import_react15 = __toESM(require_react());
function TaskModal({ task, onClose }) {
  if (!task)
    return null;
  const isImage = !!task.output_image_url;
  return /* @__PURE__ */ import_react15.default.createElement("div", { className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn" }, /* @__PURE__ */ import_react15.default.createElement("div", { className: "bg-[#0b0e17] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" }, /* @__PURE__ */ import_react15.default.createElement("div", { className: "p-4 sm:p-5 border-b border-white/10 flex items-center justify-between" }, /* @__PURE__ */ import_react15.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react15.default.createElement("span", { className: "font-mono text-sm sm:text-base font-extrabold text-amber-400" }, "Task #", task.id), /* @__PURE__ */ import_react15.default.createElement(StatusBadge, { status: task.status }), /* @__PURE__ */ import_react15.default.createElement("span", { className: "text-xs font-mono text-slate-400 hidden sm:inline" }, task.task_type)), /* @__PURE__ */ import_react15.default.createElement(
    "button",
    {
      type: "button",
      onClick: onClose,
      className: "w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
    },
    /* @__PURE__ */ import_react15.default.createElement(X, { className: "w-4 h-4" })
  )), /* @__PURE__ */ import_react15.default.createElement("div", { className: "p-4 sm:p-5 overflow-y-auto space-y-4" }, task.error && /* @__PURE__ */ import_react15.default.createElement("div", { className: "bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs flex items-center gap-2" }, /* @__PURE__ */ import_react15.default.createElement(AlertCircle, { className: "w-4 h-4 shrink-0 text-rose-400" }), /* @__PURE__ */ import_react15.default.createElement("span", null, task.error)), task.output_image_url && /* @__PURE__ */ import_react15.default.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ import_react15.default.createElement("div", { className: "flex items-center justify-between text-xs font-bold text-slate-300" }, /* @__PURE__ */ import_react15.default.createElement("span", null, "Generated Output Image"), /* @__PURE__ */ import_react15.default.createElement(
    "a",
    {
      href: task.output_image_url,
      download: `task_${task.id}_output.jpg`,
      target: "_blank",
      rel: "noreferrer",
      className: "px-3 py-1 bg-amber-400 text-slate-950 rounded-lg text-xs font-extrabold flex items-center gap-1 hover:bg-amber-300 transition-colors"
    },
    /* @__PURE__ */ import_react15.default.createElement(Download, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react15.default.createElement("span", null, "Download Full HD")
  )), /* @__PURE__ */ import_react15.default.createElement("div", { className: "rounded-xl overflow-hidden bg-black/60 border border-slate-800 flex items-center justify-center p-2" }, /* @__PURE__ */ import_react15.default.createElement(
    "img",
    {
      src: task.output_image_url,
      alt: `Task #${task.id}`,
      className: "max-h-96 object-contain rounded-lg"
    }
  ))), task.output_text && /* @__PURE__ */ import_react15.default.createElement("div", { className: "space-y-1.5" }, /* @__PURE__ */ import_react15.default.createElement("span", { className: "text-xs font-bold text-slate-300" }, "Output Text"), /* @__PURE__ */ import_react15.default.createElement("pre", { className: "bg-black/50 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed" }, task.output_text)), /* @__PURE__ */ import_react15.default.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs" }, /* @__PURE__ */ import_react15.default.createElement("div", { className: "bg-slate-900/60 border border-slate-800 rounded-xl p-2.5" }, /* @__PURE__ */ import_react15.default.createElement("span", { className: "text-[10px] text-slate-400 block font-mono" }, "Model"), /* @__PURE__ */ import_react15.default.createElement("span", { className: "font-mono font-bold text-slate-200" }, task.model || "\u2014")), /* @__PURE__ */ import_react15.default.createElement("div", { className: "bg-slate-900/60 border border-slate-800 rounded-xl p-2.5" }, /* @__PURE__ */ import_react15.default.createElement("span", { className: "text-[10px] text-slate-400 block font-mono" }, "Duration"), /* @__PURE__ */ import_react15.default.createElement("span", { className: "font-mono font-bold text-slate-200" }, formatDuration(task.duration_ms))), /* @__PURE__ */ import_react15.default.createElement("div", { className: "bg-slate-900/60 border border-slate-800 rounded-xl p-2.5" }, /* @__PURE__ */ import_react15.default.createElement("span", { className: "text-[10px] text-slate-400 block font-mono" }, "Worker ID"), /* @__PURE__ */ import_react15.default.createElement("span", { className: "font-mono font-bold text-amber-300" }, task.worker_id || "fleet")), /* @__PURE__ */ import_react15.default.createElement("div", { className: "bg-slate-900/60 border border-slate-800 rounded-xl p-2.5" }, /* @__PURE__ */ import_react15.default.createElement("span", { className: "text-[10px] text-slate-400 block font-mono" }, "Created"), /* @__PURE__ */ import_react15.default.createElement("span", { className: "font-mono font-bold text-slate-200" }, timeAgo(task.created_at)))), /* @__PURE__ */ import_react15.default.createElement("div", { className: "space-y-1.5" }, /* @__PURE__ */ import_react15.default.createElement("span", { className: "text-xs font-bold text-slate-400 flex items-center gap-1.5" }, /* @__PURE__ */ import_react15.default.createElement(Terminal, { className: "w-3.5 h-3.5 text-amber-400" }), /* @__PURE__ */ import_react15.default.createElement("span", null, "Complete Database Payload Row")), /* @__PURE__ */ import_react15.default.createElement("pre", { className: "bg-[#050810] border border-slate-800/80 rounded-xl p-3 text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-48 scrollbar-thin" }, /* @__PURE__ */ import_react15.default.createElement("code", null, JSON.stringify(task, null, 2)))))));
}

// src/components/history/TaskHistory.jsx
var PAGE_SIZE = 10;
function TaskHistory() {
  const { sb, isAdmin, liveTasks } = useAdmin();
  const [tab, setTab] = (0, import_react16.useState)("pending");
  const [page, setPage] = (0, import_react16.useState)(0);
  const [rows, setRows] = (0, import_react16.useState)([]);
  const [counts, setCounts] = (0, import_react16.useState)({});
  const [search, setSearch] = (0, import_react16.useState)("");
  const [loading, setLoading] = (0, import_react16.useState)(false);
  const [selectedTask, setSelectedTask] = (0, import_react16.useState)(null);
  const loadTasksForTab = (0, import_react16.useCallback)(async (currentTab, currentPage) => {
    if (!sb || !isAdmin)
      return;
    setLoading(true);
    try {
      const start = currentPage * PAGE_SIZE;
      const res = await sb.from(TABLES.TASKS).select("id,task_type,model,prompt,aspect_ratio,image_size,status,error,output_image_url,input_image_url,face_image_url,style_image_url,worker_id,app_id,created_at,finished_at,duration_ms,process_ms", { count: "exact" }).eq("status", currentTab).order("id", { ascending: false }).range(start, start + PAGE_SIZE - 1);
      if (res.data)
        setRows(res.data);
      if (res.count != null) {
        setCounts((prev) => ({ ...prev, [currentTab]: res.count }));
      }
    } catch (err) {
      console.warn("loadTasksForTab error:", err);
    } finally {
      setLoading(false);
    }
  }, [sb, isAdmin]);
  (0, import_react16.useEffect)(() => {
    loadTasksForTab(tab, page);
  }, [tab, page, loadTasksForTab]);
  const handleTabChange = (newTab) => {
    setTab(newTab);
    setPage(0);
  };
  const filteredRows = rows.filter((r) => {
    if (!search)
      return true;
    const q = search.toLowerCase();
    return String(r.id).includes(q) || (r.task_type || "").toLowerCase().includes(q) || (r.model || "").toLowerCase().includes(q) || (r.prompt || "").toLowerCase().includes(q);
  });
  const totalCount = counts[tab] || filteredRows.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  return /* @__PURE__ */ import_react16.default.createElement("section", { className: "bg-[#0b0e17] border border-white/[0.08] rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl" }, /* @__PURE__ */ import_react16.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ import_react16.default.createElement("div", null, /* @__PURE__ */ import_react16.default.createElement("h2", { className: "text-sm sm:text-base font-extrabold text-white" }, "Tasks & Results Database History"), /* @__PURE__ */ import_react16.default.createElement("p", { className: "text-xs text-stone-400" }, "Search and audit all completed, processing, and pending fleet tasks")), /* @__PURE__ */ import_react16.default.createElement("div", { className: "flex flex-wrap items-center gap-1.5" }, [
    ["pending", "Pending"],
    ["processing", "Processing"],
    ["done", "Completed"],
    ["failed", "Failed"]
  ].map(([key, label]) => {
    const active = tab === key;
    const count = counts[key];
    return /* @__PURE__ */ import_react16.default.createElement(
      "button",
      {
        key,
        type: "button",
        onClick: () => handleTabChange(key),
        className: `h-8 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${active ? "bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20" : "bg-stone-900 hover:bg-stone-800 text-stone-300 border border-white/5"}`
      },
      /* @__PURE__ */ import_react16.default.createElement("span", null, label),
      count != null && /* @__PURE__ */ import_react16.default.createElement("span", { className: `text-[10px] px-1.5 py-0.2 rounded-full font-mono ${active ? "bg-black/20 text-black font-bold" : "bg-white/10 text-stone-400"}` }, count)
    );
  }), /* @__PURE__ */ import_react16.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => loadTasksForTab(tab, page),
      className: "h-8 w-8 rounded-xl bg-stone-900 hover:bg-stone-800 border border-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-colors",
      title: "Refresh Table"
    },
    /* @__PURE__ */ import_react16.default.createElement(RefreshCw, { className: `w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}` })
  ))), /* @__PURE__ */ import_react16.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react16.default.createElement(Search, { className: "w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" }), /* @__PURE__ */ import_react16.default.createElement(
    "input",
    {
      type: "text",
      value: search,
      onChange: (e) => setSearch(e.target.value),
      placeholder: "Search tasks by ID, tool slug, model, or prompt...",
      className: "w-full h-8 sm:h-9 bg-stone-950 border border-white/10 rounded-xl pl-8 pr-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
    }
  )), /* @__PURE__ */ import_react16.default.createElement("div", { className: "overflow-x-auto rounded-2xl border border-white/5 bg-stone-950/60" }, /* @__PURE__ */ import_react16.default.createElement("table", { className: "w-full text-left text-xs" }, /* @__PURE__ */ import_react16.default.createElement("thead", null, /* @__PURE__ */ import_react16.default.createElement("tr", { className: "border-b border-white/5 text-[11px] font-mono text-stone-400 uppercase bg-white/[0.02]" }, /* @__PURE__ */ import_react16.default.createElement("th", { className: "p-3" }, "ID"), /* @__PURE__ */ import_react16.default.createElement("th", { className: "p-3" }, "Tool"), /* @__PURE__ */ import_react16.default.createElement("th", { className: "p-3" }, "Model"), /* @__PURE__ */ import_react16.default.createElement("th", { className: "p-3" }, "Output / Result"), /* @__PURE__ */ import_react16.default.createElement("th", { className: "p-3" }, "Score"), /* @__PURE__ */ import_react16.default.createElement("th", { className: "p-3" }, "Duration"), /* @__PURE__ */ import_react16.default.createElement("th", { className: "p-3" }, "Status"), /* @__PURE__ */ import_react16.default.createElement("th", { className: "p-3 text-right" }, "Inspect"))), /* @__PURE__ */ import_react16.default.createElement("tbody", { className: "divide-y divide-white/5" }, filteredRows.length === 0 ? /* @__PURE__ */ import_react16.default.createElement("tr", null, /* @__PURE__ */ import_react16.default.createElement("td", { colSpan: 8, className: "p-8 text-center text-stone-500 font-mono text-xs" }, loading ? "Tasks load ho rahe hain..." : "Is tab mein koi task nahi mila.")) : filteredRows.map((r) => /* @__PURE__ */ import_react16.default.createElement("tr", { key: r.id, className: "hover:bg-white/[0.02] transition-colors group" }, /* @__PURE__ */ import_react16.default.createElement("td", { className: "p-3 font-mono font-bold text-amber-400" }, "#", r.id), /* @__PURE__ */ import_react16.default.createElement("td", { className: "p-3 font-medium text-stone-200" }, /* @__PURE__ */ import_react16.default.createElement("div", { className: "font-semibold text-xs text-white" }, r.task_type), /* @__PURE__ */ import_react16.default.createElement("div", { className: "text-[10px] text-stone-400 font-mono truncate max-w-[160px]" }, r.prompt || "\u2014")), /* @__PURE__ */ import_react16.default.createElement("td", { className: "p-3 font-mono text-[11px] text-stone-400" }, r.model || "\u2014"), /* @__PURE__ */ import_react16.default.createElement("td", { className: "p-3" }, r.output_image_url ? /* @__PURE__ */ import_react16.default.createElement(
    "a",
    {
      href: r.output_image_url,
      target: "_blank",
      rel: "noreferrer",
      className: "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold transition-colors"
    },
    /* @__PURE__ */ import_react16.default.createElement(Image2, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react16.default.createElement("span", null, "View Photo")
  ) : r.output_text ? /* @__PURE__ */ import_react16.default.createElement("span", { className: "font-mono text-[11px] text-stone-300 line-clamp-1 max-w-[200px]", title: r.output_text }, r.output_text) : /* @__PURE__ */ import_react16.default.createElement("span", { className: "text-stone-600" }, "\u2014")), /* @__PURE__ */ import_react16.default.createElement("td", { className: "p-3 font-mono text-stone-400" }, r.face_match_score != null ? `${r.face_match_score}%` : "\u2014"), /* @__PURE__ */ import_react16.default.createElement("td", { className: "p-3 font-mono text-stone-400" }, formatDuration(r.duration_ms)), /* @__PURE__ */ import_react16.default.createElement("td", { className: "p-3" }, /* @__PURE__ */ import_react16.default.createElement(StatusBadge, { status: r.status })), /* @__PURE__ */ import_react16.default.createElement("td", { className: "p-3 text-right" }, /* @__PURE__ */ import_react16.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setSelectedTask(r),
      className: "h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white inline-flex items-center justify-center transition-colors",
      title: "Inspect payload"
    },
    /* @__PURE__ */ import_react16.default.createElement(Eye, { className: "w-3.5 h-3.5" })
  ))))))), totalPages > 1 && /* @__PURE__ */ import_react16.default.createElement("div", { className: "flex items-center justify-between text-xs pt-1" }, /* @__PURE__ */ import_react16.default.createElement(
    "button",
    {
      type: "button",
      disabled: page === 0,
      onClick: () => setPage((p) => Math.max(0, p - 1)),
      className: "h-8 px-3 rounded-xl border border-white/10 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 transition-colors"
    },
    "Previous"
  ), /* @__PURE__ */ import_react16.default.createElement("span", { className: "font-mono text-stone-400" }, "Page ", page + 1, " of ", totalPages), /* @__PURE__ */ import_react16.default.createElement(
    "button",
    {
      type: "button",
      disabled: page + 1 >= totalPages,
      onClick: () => setPage((p) => p + 1),
      className: "h-8 px-3 rounded-xl border border-white/10 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 transition-colors"
    },
    "Next"
  )), selectedTask && /* @__PURE__ */ import_react16.default.createElement(TaskModal, { task: selectedTask, onClose: () => setSelectedTask(null) }));
}

// src/utils/taskHelpers.js
function familyOrderText(task) {
  const keys = task.family_role_keys || FAMILY_ROLES.map((r) => r.role_key);
  const names = Object.fromEntries(FAMILY_ROLES.map((r) => [r.role_key, r.prompt_text || r.role_key]));
  const present = keys.filter((_, i) => (task.extra_image_urls || [])[i]);
  return `Photo order: ${present.map((k, i) => `IMAGE ${i + 1} = ${names[k] || k}`).join(", ")}.`;
}
function instructionFor(task, p) {
  const userPrompt = (task.prompt || "").trim();
  if (task.task_type === "chat")
    return userPrompt;
  if (task.task_type === "photo_read")
    return userPrompt || "Describe this photo in detail.";
  if (!p || !p.enabled)
    return "<prompt DB mein nahi ya band hai>";
  const parts = [
    task.system_text || p.system_text,
    p.role_text,
    userPrompt ? `Prompt: "${userPrompt}"` : "",
    p.negative_text ? `[NEGATIVE CONSTRAINTS]: ${p.negative_text}` : ""
  ];
  let text = parts.filter(Boolean).join("\n");
  if (task.task_type === "family_photo")
    text += `
${familyOrderText(task)}`;
  if (typeOf(task.task_type)?.output === "image")
    text += `
Aspect ratio: ${task.aspect_ratio}.`;
  return text;
}
function rowFromForm(f) {
  const type = typeOf(f.task_type);
  const isImage = type.output === "image";
  return {
    task_type: f.task_type,
    model: f.model,
    prompt: f.prompt.trim() || null,
    aspect_ratio: isImage ? f.aspect_ratio : null,
    image_size: isImage && capsOf(f.model).sizes.length ? f.image_size : null,
    face_image_url: type.inputs.includes("face") ? f.face_image_url.trim() : null,
    style_image_url: type.inputs.includes("style") ? f.style_image_url.trim() : null,
    input_image_url: type.inputs.includes("input") ? f.input_image_url.trim() : null,
    extra_image_urls: type.family ? (Array.isArray(f.family_urls) ? f.family_urls : []).map((s) => String(s || "").trim()) : type.extras ? (Array.isArray(f.extra_image_urls) ? f.extra_image_urls : String(f.extra_image_urls || "").split("\n")).map((s) => String(s || "").trim()).filter(Boolean) : null,
    conversation_id: f.task_type === "chat" ? f.conversation_id.trim() || null : null,
    user_id: f.user_id.trim() || "weargen_user_1",
    batch_count: isImage ? Math.min(10, Math.max(1, Number(f.batch_count) || 1)) : 1
  };
}
function requestPreview(row, prompts) {
  const type = typeOf(row.task_type);
  const isImage = type.output === "image";
  const img = (url) => ({ inlineData: { mimeType: "image/jpeg", data: url ? `<base64 of ${url}>` : "<MISSING>" } });
  const parts = [{ text: instructionFor(row, prompts[row.task_type]) }];
  for (const key of ["face", "style", "input"]) {
    if (type.inputs.includes(key))
      parts.push(img(row[INPUT_COLUMN[key]]));
  }
  if (type.extras)
    (row.extra_image_urls || []).filter(Boolean).forEach((u) => parts.push(img(u)));
  const contents = [];
  if (row.task_type === "chat" && row.conversation_id) {
    contents.push({ role: "user", parts: [{ text: `<finished earlier messages of conversation "${row.conversation_id}" are added here>` }] });
  }
  contents.push({ role: "user", parts });
  const body = { contents };
  if (isImage) {
    body.generationConfig = {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: row.aspect_ratio, ...row.image_size ? { imageSize: row.image_size } : {} }
    };
  }
  return {
    method: "POST",
    url: `${GEMINI_BASE}/${row.model}:generateContent?key=<AI_STUDIO_KEY>`,
    body
  };
}
function problemsFor(f, row, prompts) {
  const p = [];
  const type = typeOf(f.task_type);
  const caps = capsOf(f.model);
  if (!["chat", "photo_read"].includes(f.task_type) && prompts && prompts[f.task_type] && prompts[f.task_type].enabled === false) {
    p.push("Is kaam ka prompt DB mein band hai (Prompts section dekho)");
  }
  if (caps && caps.kind && type && type.kind && caps.kind !== type.kind) {
    p.push("Is task type ke liye ye model nahi chalega");
  }
  for (const key of type.inputs || []) {
    if (!type.optional?.includes(key) && !row[INPUT_COLUMN[key]]) {
      p.push(`${labelFor(type, key)} chahiye`);
    }
  }
  if (type.promptRequired && !row.prompt)
    p.push("Creative prompt zaroori hai");
  if (type.family && (row.extra_image_urls || []).filter(Boolean).length < 2) {
    p.push("Parivar ki kam se kam 2 photos chahiye");
  }
  if (type.extras && !type.family && (!row.extra_image_urls || row.extra_image_urls.length === 0)) {
    p.push("Kam se kam 1 photo upload karein (1 se 50 photos tak)");
  }
  if (type.output === "image" && caps && caps.kind === "image") {
    if (caps.aspects && caps.aspects.length > 0 && row.aspect_ratio && !caps.aspects.includes(row.aspect_ratio)) {
      p.push("Aspect ratio is model mein support nahi");
    }
    if (row.image_size && caps.sizes && caps.sizes.length > 0 && !caps.sizes.includes(row.image_size)) {
      p.push("Size is model mein support nahi");
    }
    if (row.batch_count < 1 || row.batch_count > 10) {
      p.push("Batch 1 se 10 ke beech hona chahiye");
    }
  }
  return p;
}

// src/components/studio/StudioScreen.jsx
function StudioScreen() {
  const { sb, catalog, models, prompts, syncLiveTasks, setLiveTasks, setMsg } = useAdmin();
  const [form, setForm] = (0, import_react17.useState)(EMPTY_FORM);
  const [mobileTab, setMobileTab] = (0, import_react17.useState)("studio");
  const [isGenerating, setIsGenerating] = (0, import_react17.useState)(false);
  const [btnFeedback, setBtnFeedback] = (0, import_react17.useState)(null);
  const type = typeOf(form.task_type);
  const modelOptions = (0, import_react17.useMemo)(() => {
    return Object.keys(MODEL_CAPS).filter((id) => capsOf(id).kind === type.kind);
  }, [type.kind, models]);
  const caps = capsOf(form.model) || capsOf(modelOptions[0]);
  const row = (0, import_react17.useMemo)(() => rowFromForm(form), [form]);
  const problems = (0, import_react17.useMemo)(() => problemsFor(form, row, prompts), [form, row, prompts]);
  const preview = (0, import_react17.useMemo)(() => requestPreview(row, prompts), [row, prompts]);
  const handleSelectTaskType = (taskType) => {
    const t = typeOf(taskType);
    const validModels = Object.keys(MODEL_CAPS).filter((id) => capsOf(id).kind === t.kind);
    const model = validModels[0] || "gemini-3.1-flash-image-preview";
    const c = capsOf(model);
    setForm((prev) => ({
      ...prev,
      task_type: taskType,
      model,
      aspect_ratio: c.kind === "image" ? c.aspects?.includes(prev.aspect_ratio) ? prev.aspect_ratio : c.aspects?.[0] || "4:5" : prev.aspect_ratio,
      image_size: c.sizes?.length ? c.sizes?.includes(prev.image_size) ? prev.image_size : c.sizes[1] || c.sizes[0] : ""
    }));
  };
  const handleSendTask = async () => {
    if (problems.length) {
      const errText = problems.join(", ");
      setBtnFeedback({ type: "error", message: errText });
      setMsg("Pehle ye theek karo: " + errText);
      return;
    }
    setIsGenerating(true);
    setBtnFeedback(null);
    try {
      const { data, error } = await sb.rpc(API.CREATE_TASK, { p_payload: row });
      if (error) {
        const errText = "Task nahi bana: " + (error.message || JSON.stringify(error));
        setBtnFeedback({ type: "error", message: errText });
        setMsg(errText);
        return;
      }
      const taskId = typeof data === "number" ? data : data?.[0]?.id || data?.id || Array.isArray(data) && data[0] || data;
      const successMsg = `\u26A1 Task #${taskId} queue mein successfully dispatch ho gaya! Worker ise process karega.`;
      setBtnFeedback({ type: "success", message: successMsg });
      setMsg(successMsg);
      const newTaskObj = {
        id: taskId,
        app_id: row.app_id || "weargen",
        task_type: row.task_type,
        model: row.model,
        prompt: row.prompt,
        aspect_ratio: row.aspect_ratio,
        image_size: row.image_size,
        status: "pending",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        extra_image_urls: row.extra_image_urls,
        face_image_url: row.face_image_url,
        style_image_url: row.style_image_url,
        input_image_url: row.input_image_url
      };
      setLiveTasks((list) => [newTaskObj, ...list.filter((x) => x.id !== taskId)].slice(0, 50));
      setForm((f) => ({ ...f, prompt: "" }));
      setTimeout(syncLiveTasks, 500);
      setTimeout(syncLiveTasks, 2e3);
      setTimeout(() => setBtnFeedback(null), 8e3);
    } catch (err) {
      const errText = "Send error: " + err.message;
      setBtnFeedback({ type: "error", message: errText });
      setMsg(errText);
    } finally {
      setIsGenerating(false);
    }
  };
  const category = getToolCategory(form.task_type);
  return /* @__PURE__ */ import_react17.default.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ import_react17.default.createElement(
    ToolCatalogBar,
    {
      catalog,
      selectedTaskType: form.task_type,
      onSelectTaskType: handleSelectTaskType
    }
  ), /* @__PURE__ */ import_react17.default.createElement("div", { className: "flex lg:hidden bg-[#0e1320] p-1 rounded-xl border border-slate-800 text-xs font-bold" }, /* @__PURE__ */ import_react17.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setMobileTab("studio"),
      className: `flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${mobileTab === "studio" ? "bg-amber-400 text-slate-950 font-extrabold shadow-sm" : "text-slate-400"}`
    },
    /* @__PURE__ */ import_react17.default.createElement(Sliders, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react17.default.createElement("span", null, "Tool Inputs")
  ), /* @__PURE__ */ import_react17.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setMobileTab("json"),
      className: `flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${mobileTab === "json" ? "bg-amber-400 text-slate-950 font-extrabold shadow-sm" : "text-slate-400"}`
    },
    /* @__PURE__ */ import_react17.default.createElement(Terminal, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react17.default.createElement("span", null, "Live JSON Payload")
  )), /* @__PURE__ */ import_react17.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" }, /* @__PURE__ */ import_react17.default.createElement("div", { className: `lg:col-span-7 bg-[#0e1320] border border-slate-800/80 rounded-2xl p-5 space-y-5 shadow-xl ${mobileTab === "studio" ? "block" : "hidden lg:block"}` }, /* @__PURE__ */ import_react17.default.createElement("div", { className: "border-b border-slate-800/80 pb-3.5 flex items-start justify-between gap-3" }, /* @__PURE__ */ import_react17.default.createElement("div", null, /* @__PURE__ */ import_react17.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react17.default.createElement("span", { className: "text-xl" }, "\u2728"), /* @__PURE__ */ import_react17.default.createElement("h3", { className: "text-sm sm:text-base font-extrabold text-white" }, type.label || form.task_type), /* @__PURE__ */ import_react17.default.createElement("span", { className: "text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 capitalize font-bold" }, category)), /* @__PURE__ */ import_react17.default.createElement("p", { className: "text-xs text-slate-400 mt-1" }, catalog.find((c) => c.task_type === form.task_type)?.hint || "Configure model parameters, upload references, and send task to fleet.")), /* @__PURE__ */ import_react17.default.createElement("span", { className: "text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold shrink-0" }, type.output === "image" ? "Image Out" : "Text Out")), /* @__PURE__ */ import_react17.default.createElement(
    GenerationSettings,
    {
      form,
      setForm,
      type,
      caps,
      modelOptions
    }
  ), /* @__PURE__ */ import_react17.default.createElement(
    PhotoSlotGrid,
    {
      type,
      form,
      setForm,
      onSetMsg: setMsg
    }
  ), /* @__PURE__ */ import_react17.default.createElement(
    BatchUploader,
    {
      type,
      form,
      setForm,
      onSetMsg: setMsg
    }
  ), /* @__PURE__ */ import_react17.default.createElement(
    PromptSection,
    {
      type,
      form,
      setForm
    }
  ), /* @__PURE__ */ import_react17.default.createElement(
    ActionPanel,
    {
      problems,
      isGenerating,
      btnFeedback,
      onClearFeedback: () => setBtnFeedback(null),
      onSendTask: handleSendTask
    }
  )), /* @__PURE__ */ import_react17.default.createElement("div", { className: `lg:col-span-5 lg:sticky lg:top-20 ${mobileTab === "json" ? "block" : "hidden lg:block"}` }, /* @__PURE__ */ import_react17.default.createElement(
    JsonConsole,
    {
      row,
      preview,
      onSendTask: handleSendTask
    }
  ))), /* @__PURE__ */ import_react17.default.createElement(TaskHistory, null));
}

// src/components/apps/AppsDashboard.jsx
var import_react22 = __toESM(require_react());

// src/components/apps/AppCreateModal.jsx
var import_react18 = __toESM(require_react());
function AppCreateModal({ isOpen, onClose, onCreated }) {
  const { sb, catalog, loadCatalog, setMsg } = useAdmin();
  const [appId, setAppId] = (0, import_react18.useState)("");
  const [label, setLabel] = (0, import_react18.useState)("");
  const [enabled, setEnabled] = (0, import_react18.useState)(true);
  const [assignAll, setAssignAll] = (0, import_react18.useState)(true);
  const [loading, setLoading] = (0, import_react18.useState)(false);
  if (!isOpen)
    return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanId = appId.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const cleanLabel = label.trim();
    if (!cleanId)
      return setMsg("App ID / Slug zaroori hai (e.g. myntra_studio)");
    if (!cleanLabel)
      return setMsg("App Display Label zaroori hai");
    setLoading(true);
    try {
      const { error: appErr } = await sb.from(TABLES.APPS).insert({
        app_id: cleanId,
        label: cleanLabel,
        enabled,
        sort: 50,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (appErr)
        throw appErr;
      if (assignAll && catalog && catalog.length > 0) {
        const batchRows = catalog.map((tool) => ({
          app_id: cleanId,
          task_type: tool.task_type
        }));
        try {
          await sb.from(TABLES.APP_TASKS).insert(batchRows);
        } catch (batchErr) {
          console.warn("Batch assign warning:", batchErr);
        }
      }
      await loadCatalog();
      setMsg(`\u2728 App "${cleanLabel}" successfully ban gayi!`);
      if (onCreated)
        onCreated(cleanId);
      onClose();
    } catch (err) {
      setMsg("App create error: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ import_react18.default.createElement("div", { className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" }, /* @__PURE__ */ import_react18.default.createElement("div", { className: "bg-[#0e1320] border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl" }, /* @__PURE__ */ import_react18.default.createElement("div", { className: "flex items-center justify-between border-b border-slate-800 pb-3" }, /* @__PURE__ */ import_react18.default.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ import_react18.default.createElement("div", { className: "w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center" }, /* @__PURE__ */ import_react18.default.createElement(Plus, { className: "w-4 h-4 text-amber-400" })), /* @__PURE__ */ import_react18.default.createElement("div", null, /* @__PURE__ */ import_react18.default.createElement("h3", { className: "text-sm font-extrabold text-white" }, "Create New Client App"), /* @__PURE__ */ import_react18.default.createElement("p", { className: "text-[11px] text-slate-400" }, "Deploy a dedicated app workspace (e.g. WearGen, Zara)"))), /* @__PURE__ */ import_react18.default.createElement(
    "button",
    {
      type: "button",
      onClick: onClose,
      className: "w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
    },
    /* @__PURE__ */ import_react18.default.createElement(X, { className: "w-3.5 h-3.5" })
  )), /* @__PURE__ */ import_react18.default.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" }, /* @__PURE__ */ import_react18.default.createElement("div", null, /* @__PURE__ */ import_react18.default.createElement("label", { className: "block text-xs font-bold text-slate-300 mb-1" }, "App ID / Unique Slug *"), /* @__PURE__ */ import_react18.default.createElement(
    "input",
    {
      type: "text",
      required: true,
      value: appId,
      onChange: (e) => setAppId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_")),
      placeholder: "e.g. zara_studio, myntra_app",
      className: "w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
    }
  ), /* @__PURE__ */ import_react18.default.createElement("span", { className: "text-[10px] text-slate-500 font-mono mt-0.5 block" }, "Lowercase alphanumeric and underscores only")), /* @__PURE__ */ import_react18.default.createElement("div", null, /* @__PURE__ */ import_react18.default.createElement("label", { className: "block text-xs font-bold text-slate-300 mb-1" }, "Display Name / Label *"), /* @__PURE__ */ import_react18.default.createElement(
    "input",
    {
      type: "text",
      required: true,
      value: label,
      onChange: (e) => setLabel(e.target.value),
      placeholder: "e.g. Zara E-Commerce Studio",
      className: "w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
    }
  )), /* @__PURE__ */ import_react18.default.createElement("div", { className: "space-y-2 pt-1 border-t border-slate-800" }, /* @__PURE__ */ import_react18.default.createElement("label", { className: "flex items-center gap-2 text-xs text-slate-200 cursor-pointer" }, /* @__PURE__ */ import_react18.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: assignAll,
      onChange: (e) => setAssignAll(e.target.checked),
      className: "rounded border-slate-700 text-amber-400 focus:ring-amber-400"
    }
  ), /* @__PURE__ */ import_react18.default.createElement("span", null, "Assign all ", catalog.length, " AI Studio tools to this app by default")), /* @__PURE__ */ import_react18.default.createElement("label", { className: "flex items-center gap-2 text-xs text-slate-200 cursor-pointer" }, /* @__PURE__ */ import_react18.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: enabled,
      onChange: (e) => setEnabled(e.target.checked),
      className: "rounded border-slate-700 text-amber-400 focus:ring-amber-400"
    }
  ), /* @__PURE__ */ import_react18.default.createElement("span", null, "Enable app immediately for worker fleet"))), /* @__PURE__ */ import_react18.default.createElement("div", { className: "pt-2 flex items-center justify-end gap-2 border-t border-slate-800" }, /* @__PURE__ */ import_react18.default.createElement(
    "button",
    {
      type: "button",
      onClick: onClose,
      className: "h-9 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
    },
    "Cancel"
  ), /* @__PURE__ */ import_react18.default.createElement(
    "button",
    {
      type: "submit",
      disabled: loading,
      className: "h-9 px-5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-98 transition-all disabled:opacity-50"
    },
    loading ? /* @__PURE__ */ import_react18.default.createElement(Loader2, { className: "w-3.5 h-3.5 animate-spin text-slate-950" }) : /* @__PURE__ */ import_react18.default.createElement(Plus, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react18.default.createElement("span", null, "Create App")
  )))));
}

// src/components/apps/AppToolMatrix.jsx
var import_react19 = __toESM(require_react());
function AppToolMatrix({ app, onClose }) {
  const { sb, catalog, appTasks, loadCatalog, setMsg } = useAdmin();
  const [search, setSearch] = (0, import_react19.useState)("");
  const [selectedCat, setSelectedCat] = (0, import_react19.useState)("all");
  const [updating, setUpdating] = (0, import_react19.useState)(false);
  const appId = app.app_id;
  const assignedTaskTypes = new Set(
    appTasks.filter((l) => l.app_id === appId).map((l) => l.task_type)
  );
  const toggleTool = async (taskType, isAssigned) => {
    try {
      if (isAssigned) {
        await sb.from(TABLES.APP_TASKS).delete().eq("app_id", appId).eq("task_type", taskType);
      } else {
        await sb.from(TABLES.APP_TASKS).insert({ app_id: appId, task_type: taskType });
      }
      loadCatalog();
    } catch (err) {
      setMsg("Tool toggle error: " + err.message);
    }
  };
  const handleAssignAll = async () => {
    setUpdating(true);
    try {
      const toAdd = catalog.filter((t) => !assignedTaskTypes.has(t.task_type)).map((t) => ({ app_id: appId, task_type: t.task_type }));
      if (toAdd.length > 0) {
        await sb.from(TABLES.APP_TASKS).insert(toAdd);
      }
      loadCatalog();
      setMsg(`Saare ${catalog.length} tools "${app.label}" ko assign kar diye gaye!`);
    } catch (err) {
      setMsg("Assign all error: " + err.message);
    } finally {
      setUpdating(false);
    }
  };
  const handleUnassignAll = async () => {
    if (!window.confirm(`Kya aap pakka "${app.label}" se saare tools unassign karna chahte hain?`))
      return;
    setUpdating(true);
    try {
      await sb.from(TABLES.APP_TASKS).delete().eq("app_id", appId);
      loadCatalog();
      setMsg(`Saare tools "${app.label}" se unassign ho gaye.`);
    } catch (err) {
      setMsg("Unassign all error: " + err.message);
    } finally {
      setUpdating(false);
    }
  };
  const filteredTools = catalog.filter((t) => {
    const cat = getToolCategory(t.task_type);
    const matchesCat = selectedCat === "all" || cat === selectedCat;
    const matchesSearch = !search || (t.label || "").toLowerCase().includes(search.toLowerCase()) || (t.task_type || "").toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });
  return /* @__PURE__ */ import_react19.default.createElement("section", { className: "bg-[#0e1320] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl animate-fadeIn" }, /* @__PURE__ */ import_react19.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5" }, /* @__PURE__ */ import_react19.default.createElement("div", null, /* @__PURE__ */ import_react19.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react19.default.createElement(Layers, { className: "w-5 h-5 text-amber-400" }), /* @__PURE__ */ import_react19.default.createElement("h3", { className: "text-sm sm:text-base font-extrabold text-white" }, "Tool Permissions for App: ", /* @__PURE__ */ import_react19.default.createElement("span", { className: "text-amber-300 font-mono" }, app.label)), /* @__PURE__ */ import_react19.default.createElement("span", { className: "text-[10px] font-mono font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2 py-0.5 rounded-full" }, assignedTaskTypes.size, " / ", catalog.length, " Assigned")), /* @__PURE__ */ import_react19.default.createElement("p", { className: "text-xs text-slate-400 mt-1" }, "Turn on or off specific tools this client app is allowed to use.")), /* @__PURE__ */ import_react19.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react19.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleAssignAll,
      disabled: updating,
      className: "h-8 px-3 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-bold transition-all disabled:opacity-50"
    },
    "Assign All (",
    catalog.length,
    ")"
  ), /* @__PURE__ */ import_react19.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleUnassignAll,
      disabled: updating,
      className: "h-8 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all disabled:opacity-50"
    },
    "Unassign All"
  ), onClose && /* @__PURE__ */ import_react19.default.createElement(
    "button",
    {
      type: "button",
      onClick: onClose,
      className: "h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors ml-2"
    },
    "Close Matrix"
  ))), /* @__PURE__ */ import_react19.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ import_react19.default.createElement("div", { className: "flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" }, TOOL_CATEGORIES.map((cat) => {
    const count = cat.id === "all" ? catalog.length : catalog.filter((c) => getToolCategory(c.task_type) === cat.id).length;
    const active = selectedCat === cat.id;
    return /* @__PURE__ */ import_react19.default.createElement(
      "button",
      {
        key: cat.id,
        type: "button",
        onClick: () => setSelectedCat(cat.id),
        className: `whitespace-nowrap px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${active ? "bg-amber-400 text-slate-950 font-bold shadow-sm" : "bg-[#080b12] text-slate-400 hover:text-white border border-slate-800"}`
      },
      /* @__PURE__ */ import_react19.default.createElement("span", null, cat.icon),
      /* @__PURE__ */ import_react19.default.createElement("span", null, cat.label),
      /* @__PURE__ */ import_react19.default.createElement("span", { className: `text-[10px] px-1 rounded-full font-mono ${active ? "bg-black/20 text-black font-bold" : "text-slate-500"}` }, count)
    );
  })), /* @__PURE__ */ import_react19.default.createElement("div", { className: "relative w-full sm:w-60" }, /* @__PURE__ */ import_react19.default.createElement(Search, { className: "w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }), /* @__PURE__ */ import_react19.default.createElement(
    "input",
    {
      type: "text",
      value: search,
      onChange: (e) => setSearch(e.target.value),
      placeholder: "Search tool slug...",
      className: "w-full h-8 bg-[#080b12] border border-slate-800 rounded-xl pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
    }
  ))), /* @__PURE__ */ import_react19.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[460px] overflow-y-auto pr-1" }, filteredTools.map((t) => {
    const isAssigned = assignedTaskTypes.has(t.task_type);
    return /* @__PURE__ */ import_react19.default.createElement(
      "div",
      {
        key: t.task_type,
        onClick: () => toggleTool(t.task_type, isAssigned),
        className: `p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none ${isAssigned ? "bg-amber-400/10 border-amber-400/40 text-white" : "bg-[#080b12] border-slate-800/80 text-slate-400 hover:border-slate-700"}`
      },
      /* @__PURE__ */ import_react19.default.createElement("div", { className: "pt-0.5 shrink-0" }, isAssigned ? /* @__PURE__ */ import_react19.default.createElement(CheckSquare, { className: "w-4 h-4 text-amber-400" }) : /* @__PURE__ */ import_react19.default.createElement(Square, { className: "w-4 h-4 text-slate-600" })),
      /* @__PURE__ */ import_react19.default.createElement("div", { className: "space-y-0.5 overflow-hidden" }, /* @__PURE__ */ import_react19.default.createElement("p", { className: `text-xs font-bold truncate ${isAssigned ? "text-amber-200" : "text-slate-300"}` }, t.label), /* @__PURE__ */ import_react19.default.createElement("p", { className: "font-mono text-[10px] text-slate-500 truncate" }, t.task_type))
    );
  })));
}

// src/components/apps/AppWorkspaceView.jsx
var import_react21 = __toESM(require_react());

// src/api/appService.js
var AppService = class {
  constructor(client) {
    this.client = client;
    this._appCache = /* @__PURE__ */ new Map();
    this._toolsCache = /* @__PURE__ */ new Map();
  }
  /**
   * List all registered and active client apps (e.g. weargen, ppp, etc.)
   */
  async listApps() {
    try {
      const { data, error } = await this.client.from(TABLES.APPS).select("*").order("sort");
      if (!error && Array.isArray(data) && data.length > 0) {
        return { data, error: null };
      }
      const rpcRes = await this.client.rpc(API.GET_APPS);
      if (!rpcRes.error && Array.isArray(rpcRes.data)) {
        return { data: rpcRes.data, error: null };
      }
      return { data: [], error: error || rpcRes.error };
    } catch (err) {
      return { data: [], error: { message: err.message } };
    }
  }
  /**
   * Get single App details along with assigned tool task_types
   */
  async getApp(appId) {
    if (!appId) {
      return { data: null, error: { message: "appId parameter is required" } };
    }
    try {
      const [appRes, linksRes] = await Promise.all([
        this.client.from(TABLES.APPS).select("*").eq("app_id", appId).single(),
        this.client.from(TABLES.APP_TASKS).select("task_type").eq("app_id", appId)
      ]);
      if (appRes.error) {
        const { data: all } = await this.listApps();
        const found = all?.find((a) => a.app_id === appId);
        if (found) {
          const taskTypes2 = found.task_types || [];
          const result2 = { ...found, task_types: taskTypes2 };
          this._appCache.set(appId, result2);
          return { data: result2, error: null };
        }
        return { data: null, error: appRes.error };
      }
      const taskTypes = linksRes.data ? linksRes.data.map((l) => l.task_type) : [];
      const result = {
        ...appRes.data,
        task_types: taskTypes
      };
      this._appCache.set(appId, result);
      return { data: result, error: null };
    } catch (err) {
      return { data: null, error: { message: err.message } };
    }
  }
  /**
   * Get only the Catalog tools assigned to this specific App
   */
  async getAppTools(appId) {
    try {
      const [appRes, catRes] = await Promise.all([
        this.getApp(appId),
        this.client.from(TABLES.CATALOG).select("*").order("sort")
      ]);
      if (appRes.error)
        return { data: [], error: appRes.error };
      if (catRes.error)
        return { data: [], error: catRes.error };
      const assignedSet = new Set(appRes.data.task_types || []);
      const assignedCatalog = (catRes.data || []).filter(
        (item) => item.enabled && assignedSet.has(item.task_type)
      );
      this._toolsCache.set(appId, assignedCatalog);
      return { data: assignedCatalog, error: null };
    } catch (err) {
      return { data: [], error: { message: err.message } };
    }
  }
  /**
   * Strict API-Level Validation:
   * Checks if the app is active and if the requested tool is assigned to it
   */
  async validateTaskForApp(appId, taskType) {
    if (!appId) {
      return { valid: false, error: "App ID is required" };
    }
    if (!taskType) {
      return { valid: false, error: "Task type (AI tool) is required" };
    }
    const { data: app, error } = await this.getApp(appId);
    if (error || !app) {
      return { valid: false, error: `App "${appId}" not found in system` };
    }
    if (!app.enabled) {
      return { valid: false, error: `App "${app.label || appId}" is currently disabled by Admin` };
    }
    const allowed = Array.isArray(app.task_types) && app.task_types.includes(taskType);
    if (!allowed) {
      return {
        valid: false,
        error: `Tool "${taskType}" is not assigned to App "${app.label || appId}". Please assign it in Admin > Apps dashboard.`
      };
    }
    return { valid: true, app };
  }
  /**
   * Core API: Submit Task for an App
   * Enforces app_id, validates permissions, and dispatches to queue
   */
  async createTask(appId, rawPayload) {
    try {
      const taskType = rawPayload?.task_type;
      const check = await this.validateTaskForApp(appId, taskType);
      if (!check.valid) {
        return { success: false, taskId: null, error: { message: check.error } };
      }
      const payload = {
        ...rawPayload,
        app_id: appId,
        user_id: rawPayload.user_id || `${appId}_client_user`,
        status: "pending",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { data, error } = await this.client.rpc(API.CREATE_TASK, { p_payload: payload });
      if (error) {
        const { data: insData, error: insErr } = await this.client.from(TABLES.TASKS).insert(payload);
        if (insErr) {
          return { success: false, taskId: null, error: insErr };
        }
        const newId = Array.isArray(insData) && insData[0] ? insData[0].id : null;
        return { success: true, taskId: newId, error: null };
      }
      const taskId = typeof data === "number" ? data : data?.id || (Array.isArray(data) ? data[0]?.id : null);
      return { success: true, taskId, data, error: null };
    } catch (err) {
      return { success: false, taskId: null, error: { message: err.message } };
    }
  }
  /**
   * Fetch all tasks generated by this specific App
   */
  async listTasks(appId, { limit = 50, offset = 0, status = null } = {}) {
    if (!appId) {
      return { data: [], error: { message: "appId parameter is required" } };
    }
    try {
      let query = this.client.from(TABLES.TASKS).select("*").eq("app_id", appId).order("id", { ascending: false }).range(offset, offset + limit - 1);
      if (status) {
        query = query.eq("status", status);
      }
      const { data, error, count } = await query;
      return { data: data || [], error, count };
    } catch (err) {
      return { data: [], error: { message: err.message } };
    }
  }
  /**
   * Fetch a single task by ID, verifying app ownership
   */
  async getTask(appId, taskId, { columns = "*" } = {}) {
    if (!appId || !taskId) {
      return { data: null, error: { message: "appId and taskId are required" } };
    }
    try {
      const { data, error } = await this.client.from(TABLES.TASKS).select(columns).eq("id", taskId).eq("app_id", appId).single();
      return { data, error };
    } catch (err) {
      return { data: null, error: { message: err.message } };
    }
  }
  /**
   * Client Poller Helper (Optimized with lean column projection):
   * Polls only status, error, and output image to reduce network payload by 90%
   */
  async pollTaskUntilComplete(appId, taskId, { intervalMs = 2e3, maxSeconds = 180, onProgress } = {}) {
    const start = Date.now();
    const timeoutMs = maxSeconds * 1e3;
    const leanColumns = "id,app_id,task_type,status,error,output_image_url,duration_ms,process_ms";
    while (Date.now() - start < timeoutMs) {
      const { data: task, error } = await this.getTask(appId, taskId, { columns: leanColumns });
      if (error || !task) {
        throw new Error(error?.message || "Task not found");
      }
      if (typeof onProgress === "function") {
        onProgress(task);
      }
      if (task.status === "completed") {
        return task;
      }
      if (task.status === "failed") {
        throw new Error(task.error || "Task execution failed on worker");
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(`Polling timed out after ${maxSeconds} seconds`);
  }
  /**
   * Generate ready-to-run API snippets for external apps (React, Node, Python, cURL)
   */
  getApiSnippets(appId, taskType = "text_to_image", samplePayload = {}) {
    const apiUrl = this.client.apiUrl || "https://aistudio.runasp.net";
    const token = "YOUR_API_KEY_OR_TOKEN";
    const payloadObj = {
      app_id: appId,
      task_type: taskType,
      prompt: samplePayload.prompt || "Professional studio photoshoot, sharp focus",
      model: samplePayload.model || "gemini-2.5-flash-image",
      aspect_ratio: samplePayload.aspect_ratio || "1:1",
      input_image_url: samplePayload.input_image_url || null,
      user_id: `${appId}_user_1`,
      ...samplePayload
    };
    const jsonStr = JSON.stringify({ p_payload: payloadObj }, null, 2);
    return {
      curl: `curl -X POST "${apiUrl}/rest/v1/rpc/upload_ai_studio_task" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '${jsonStr.replace(/'/g, "'\\''")}'`,
      javascript: `// External Web or Node.js Client
async function runStudioTask() {
  const response = await fetch("${apiUrl}/rest/v1/rpc/upload_ai_studio_task", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer ${token}"
    },
    body: JSON.stringify({
      p_payload: ${JSON.stringify(payloadObj, null, 6)}
    })
  });

  const taskId = await response.json();
  console.log("Task Submitted! Task ID:", taskId);

  // Poll task status:
  const taskRes = await fetch("${apiUrl}/rest/v1/ai_studio_tasks?id=eq." + taskId + "&app_id=eq.${appId}");
  const taskData = await taskRes.json();
  console.log("Status:", taskData[0]?.status, "Result Image:", taskData[0]?.output_image_url);
}`,
      python: `import requests, time

API_URL = "${apiUrl}"
TOKEN = "${token}"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# 1. Create Task for App "${appId}"
payload = {
    "p_payload": ${JSON.stringify(payloadObj, null, 4).replace(/null/g, "None")}
}

res = requests.post(f"{API_URL}/rest/v1/rpc/upload_ai_studio_task", json=payload, headers=HEADERS)
task_id = res.json()
print(f"Task Created! ID: {task_id}")

# 2. Poll until completed
for _ in range(30):
    time.sleep(2)
    poll_res = requests.get(f"{API_URL}/rest/v1/ai_studio_tasks?id=eq.{task_id}&app_id=eq.${appId}", headers=HEADERS)
    task = poll_res.json()[0]
    print(f"Task status: {task['status']}")
    if task['status'] == 'completed':
        print(f"Success! Output Image: {task['output_image_url']}")
        break
    elif task['status'] == 'failed':
        print(f"Failed: {task['error']}")
        break`
    };
  }
};
function createAppService(client) {
  return new AppService(client);
}

// src/components/apps/AppApiModal.jsx
var import_react20 = __toESM(require_react());
function AppApiModal({ isOpen, onClose, appId, appLabel, selectedTool, samplePayload }) {
  if (!isOpen)
    return null;
  const [activeTab, setActiveTab] = (0, import_react20.useState)("curl");
  const [copied, setCopied] = (0, import_react20.useState)(false);
  const [testResult, setTestResult] = (0, import_react20.useState)(null);
  const [testing, setTesting] = (0, import_react20.useState)(false);
  const taskType = selectedTool?.task_type || "text_to_image";
  const toolLabel = selectedTool?.label || "Text to Image";
  const payloadObj = {
    app_id: appId,
    task_type: taskType,
    prompt: samplePayload?.prompt || "Professional fashion studio photoshoot, ultra realistic, 4k",
    model: samplePayload?.model || "gemini-2.5-flash-image",
    aspect_ratio: samplePayload?.aspect_ratio || "1:1",
    image_size: samplePayload?.image_size || "1K",
    input_image_url: samplePayload?.input_image_url || null,
    face_image_url: samplePayload?.face_image_url || null,
    extra_image_urls: samplePayload?.extra_image_urls || null,
    user_id: `${appId}_api_user`,
    batch_count: 1
  };
  const endpointUrl = `${API_URL}/rest/v1/rpc/upload_ai_studio_task`;
  const tasksUrl = `${API_URL}/rest/v1/ai_studio_tasks?id=eq.{TASK_ID}&app_id=eq.${appId}`;
  const snippets = {
    curl: `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${API_KEY}" \\
  -d '${JSON.stringify({ p_payload: payloadObj }, null, 2)}'`,
    js: `// \u26A1 Universal JavaScript / Node.js / React Client
async function generateWithApp() {
  const API_URL = "${API_URL}";
  const API_KEY = "${API_KEY}";

  // 1. Submit AI Generation Task for App: "${appId}"
  const res = await fetch(\`\${API_URL}/rest/v1/rpc/upload_ai_studio_task\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${API_KEY}\`
    },
    body: JSON.stringify({
      p_payload: ${JSON.stringify(payloadObj, null, 6)}
    })
  });

  const taskId = await res.json();
  console.log("\u26A1 Task Created Successfully! Task ID:", taskId);

  // 2. Poll Task Status until Worker completes it
  const checkStatus = async () => {
    const poll = await fetch(\`\${API_URL}/rest/v1/ai_studio_tasks?id=eq.\${taskId}&app_id=eq.${appId}\`, {
      headers: { "Authorization": \`Bearer \${API_KEY}\` }
    });
    const tasks = await poll.json();
    const task = tasks[0];

    if (task?.status === "completed") {
      console.log("\u{1F389} Result Image URL:", task.output_image_url);
      return task.output_image_url;
    } else if (task?.status === "failed") {
      console.error("\u274C Generation Failed:", task.error);
      return null;
    } else {
      console.log("\u23F3 Processing... status:", task?.status);
      setTimeout(checkStatus, 2000);
    }
  };

  checkStatus();
}`,
    python: `import requests, time

API_URL = "${API_URL}"
API_KEY = "${API_KEY}"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# 1. Dispatch Task to App "${appId}"
payload = {
    "p_payload": ${JSON.stringify(payloadObj, null, 4).replace(/null/g, "None")}
}

print("Submitting task to ${appLabel} API...")
response = requests.post(f"{API_URL}/rest/v1/rpc/upload_ai_studio_task", json=payload, headers=HEADERS)
task_id = response.json()
print(f"Task dispatched successfully! ID: {task_id}")

# 2. Poll result
for i in range(60):
    time.sleep(2)
    poll = requests.get(f"{API_URL}/rest/v1/ai_studio_tasks?id=eq.{task_id}&app_id=eq.${appId}", headers=HEADERS)
    tasks = poll.json()
    if tasks:
        task = tasks[0]
        status = task.get("status")
        print(f"Status check #{i+1}: {status}")
        if status == "completed":
            print(f"Result Image: {task.get('output_image_url')}")
            break
        elif status == "failed":
            print(f"Failed: {task.get('error')}")
            break`,
    json: JSON.stringify({
      endpoint: endpointUrl,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      payload: {
        p_payload: payloadObj
      }
    }, null, 2)
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const handleTestPing = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_URL}/rest/v1/ai_studio_apps?app_id=eq.${appId}&select=*`, {
        headers: { "Authorization": `Bearer ${API_KEY}` }
      });
      const data = await res.json();
      if (res.ok && data.length > 0) {
        setTestResult({
          success: true,
          message: `\u2705 API Connected! App "${data[0].label}" is active and ready on MonsterASP.`
        });
      } else {
        setTestResult({
          success: false,
          message: `\u26A0\uFE0F API Connected but App "${appId}" returned: ${JSON.stringify(data)}`
        });
      }
    } catch (err) {
      setTestResult({ success: false, message: `\u274C Connection error: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };
  return /* @__PURE__ */ import_react20.default.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" }, /* @__PURE__ */ import_react20.default.createElement("div", { className: "bg-[#0e1320] border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" }, /* @__PURE__ */ import_react20.default.createElement("div", { className: "p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#080b12]" }, /* @__PURE__ */ import_react20.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react20.default.createElement("div", { className: "w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400" }, /* @__PURE__ */ import_react20.default.createElement(Terminal, { className: "w-5 h-5" })), /* @__PURE__ */ import_react20.default.createElement("div", null, /* @__PURE__ */ import_react20.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react20.default.createElement("h3", { className: "text-base font-extrabold text-white" }, appLabel, " \u2022 API Integration & Developer SDK"), /* @__PURE__ */ import_react20.default.createElement("span", { className: "text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold" }, "app_id: ", appId)), /* @__PURE__ */ import_react20.default.createElement("p", { className: "text-xs text-slate-400 mt-0.5" }, "Is API endpoint ko aap kisi bhi external app, mobile app, website ya backend script se directly call kar sakte hain."))), /* @__PURE__ */ import_react20.default.createElement(
    "button",
    {
      type: "button",
      onClick: onClose,
      className: "w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
    },
    /* @__PURE__ */ import_react20.default.createElement(X, { className: "w-4 h-4" })
  )), /* @__PURE__ */ import_react20.default.createElement("div", { className: "px-5 py-3 bg-[#0a0d17] border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs" }, /* @__PURE__ */ import_react20.default.createElement("div", { className: "flex flex-wrap items-center gap-2 font-mono text-[11px]" }, /* @__PURE__ */ import_react20.default.createElement("span", { className: "bg-slate-900 text-slate-300 px-2 py-1 rounded-lg border border-slate-800" }, "POST /rest/v1/rpc/upload_ai_studio_task"), /* @__PURE__ */ import_react20.default.createElement("span", { className: "bg-amber-400/10 text-amber-300 px-2 py-1 rounded-lg border border-amber-400/20" }, "Active Tool: ", toolLabel)), /* @__PURE__ */ import_react20.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleTestPing,
      disabled: testing,
      className: "h-7 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border border-slate-800 transition-colors disabled:opacity-50"
    },
    /* @__PURE__ */ import_react20.default.createElement(Play, { className: "w-3 h-3 text-emerald-400" }),
    /* @__PURE__ */ import_react20.default.createElement("span", null, testing ? "Testing..." : "Test API Ping")
  )), testResult && /* @__PURE__ */ import_react20.default.createElement("div", { className: `px-5 py-2.5 text-xs font-mono border-b ${testResult.success ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-rose-500/10 text-rose-300 border-rose-500/20"}` }, testResult.message), /* @__PURE__ */ import_react20.default.createElement("div", { className: "flex items-center justify-between px-5 pt-4 bg-[#0e1320]" }, /* @__PURE__ */ import_react20.default.createElement("div", { className: "flex items-center gap-1 bg-[#080b12] p-1 rounded-xl border border-slate-800 text-xs font-bold" }, [
    { id: "curl", label: "cURL" },
    { id: "js", label: "JavaScript / Node" },
    { id: "python", label: "Python (requests)" },
    { id: "json", label: "REST Schema" }
  ].map((t) => /* @__PURE__ */ import_react20.default.createElement(
    "button",
    {
      key: t.id,
      type: "button",
      onClick: () => setActiveTab(t.id),
      className: `px-3 py-1.5 rounded-lg transition-all ${activeTab === t.id ? "bg-amber-400 text-slate-950 font-extrabold shadow-sm" : "text-slate-400 hover:text-white"}`
    },
    t.label
  ))), /* @__PURE__ */ import_react20.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleCopy,
      className: "h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-800 transition-colors"
    },
    copied ? /* @__PURE__ */ import_react20.default.createElement(import_react20.default.Fragment, null, /* @__PURE__ */ import_react20.default.createElement(Check, { className: "w-3.5 h-3.5 text-emerald-400" }), /* @__PURE__ */ import_react20.default.createElement("span", { className: "text-emerald-400" }, "Copied!")) : /* @__PURE__ */ import_react20.default.createElement(import_react20.default.Fragment, null, /* @__PURE__ */ import_react20.default.createElement(Copy, { className: "w-3.5 h-3.5 text-slate-400" }), /* @__PURE__ */ import_react20.default.createElement("span", null, "Copy Code"))
  )), /* @__PURE__ */ import_react20.default.createElement("div", { className: "p-5 flex-1 overflow-y-auto" }, /* @__PURE__ */ import_react20.default.createElement("pre", { className: "bg-[#05070c] border border-slate-800/90 rounded-2xl p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre selection:bg-amber-400 selection:text-black" }, snippets[activeTab]), /* @__PURE__ */ import_react20.default.createElement("div", { className: "mt-4 bg-[#080b12] border border-slate-800/70 rounded-2xl p-4 space-y-2 text-xs" }, /* @__PURE__ */ import_react20.default.createElement("h4", { className: "font-bold text-slate-200 flex items-center gap-1.5" }, /* @__PURE__ */ import_react20.default.createElement(ShieldCheck, { className: "w-4 h-4 text-amber-400" }), /* @__PURE__ */ import_react20.default.createElement("span", null, "API Level Security & Validation")), /* @__PURE__ */ import_react20.default.createElement("ul", { className: "text-slate-400 space-y-1 list-disc list-inside leading-relaxed text-[11px]" }, /* @__PURE__ */ import_react20.default.createElement("li", null, "Har request me ", /* @__PURE__ */ import_react20.default.createElement("code", { className: "text-amber-300" }, 'app_id: "', appId, '"'), " mandatory hai."), /* @__PURE__ */ import_react20.default.createElement("li", null, "API backend verify karta hai ki ", /* @__PURE__ */ import_react20.default.createElement("code", { className: "text-amber-300" }, taskType), " tool is app ko assigned hai ya nahi."), /* @__PURE__ */ import_react20.default.createElement("li", null, "Task generate hone ke baad real-time status check karne ke liye: ", /* @__PURE__ */ import_react20.default.createElement("code", { className: "text-slate-300" }, "GET /rest/v1/ai_studio_tasks?id=eq.{id}&app_id=eq.", appId))))), /* @__PURE__ */ import_react20.default.createElement("div", { className: "p-4 border-t border-slate-800 bg-[#080b12] flex items-center justify-between" }, /* @__PURE__ */ import_react20.default.createElement("span", { className: "text-[11px] text-slate-400 font-mono" }, "Host: ", API_URL), /* @__PURE__ */ import_react20.default.createElement(
    "button",
    {
      type: "button",
      onClick: onClose,
      className: "h-8 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
    },
    "Close"
  ))));
}

// src/components/apps/AppWorkspaceView.jsx
function AppWorkspaceView({ app }) {
  const { sb, catalog, appTasks, models, prompts, syncLiveTasks, setLiveTasks, setMsg } = useAdmin();
  const appId = app.app_id;
  const appService = (0, import_react21.useMemo)(() => createAppService(sb), [sb]);
  const [apiModalOpen, setApiModalOpen] = (0, import_react21.useState)(false);
  const assignedTypes = (0, import_react21.useMemo)(() => {
    return new Set(appTasks.filter((l) => l.app_id === appId).map((l) => l.task_type));
  }, [appTasks, appId]);
  const assignedTools = (0, import_react21.useMemo)(() => {
    return catalog.filter((t) => assignedTypes.has(t.task_type));
  }, [catalog, assignedTypes]);
  const [selectedTaskType, setSelectedTaskType] = (0, import_react21.useState)(() => {
    return assignedTools[0]?.task_type || "image_to_image_prompt";
  });
  const [form, setForm] = (0, import_react21.useState)(() => ({
    ...EMPTY_FORM,
    task_type: assignedTools[0]?.task_type || "image_to_image_prompt"
  }));
  const [toolSearch, setToolSearch] = (0, import_react21.useState)("");
  const [isGenerating, setIsGenerating] = (0, import_react21.useState)(false);
  const [btnFeedback, setBtnFeedback] = (0, import_react21.useState)(null);
  const [selectedHistoryTask, setSelectedHistoryTask] = (0, import_react21.useState)(null);
  const type = typeOf(form.task_type);
  const modelOptions = (0, import_react21.useMemo)(() => {
    return Object.keys(MODEL_CAPS).filter((id) => capsOf(id).kind === type.kind);
  }, [type.kind, models]);
  const caps = capsOf(form.model) || capsOf(modelOptions[0]);
  const row = (0, import_react21.useMemo)(() => {
    const base = rowFromForm(form);
    return {
      ...base,
      app_id: appId
      // STAMPED WITH THIS APP'S ID
    };
  }, [form, appId]);
  const problems = (0, import_react21.useMemo)(() => problemsFor(form, row, prompts), [form, row, prompts]);
  const preview = (0, import_react21.useMemo)(() => requestPreview(row, prompts), [row, prompts]);
  const handleSelectTool = (taskType) => {
    setSelectedTaskType(taskType);
    const t = typeOf(taskType);
    const validModels = Object.keys(MODEL_CAPS).filter((id) => capsOf(id).kind === t.kind);
    const model = validModels[0] || "gemini-3.1-flash-image-preview";
    const c = capsOf(model);
    setForm((prev) => ({
      ...prev,
      task_type: taskType,
      model,
      aspect_ratio: c.kind === "image" ? c.aspects?.includes(prev.aspect_ratio) ? prev.aspect_ratio : c.aspects?.[0] || "4:5" : prev.aspect_ratio,
      image_size: c.sizes?.length ? c.sizes?.includes(prev.image_size) ? prev.image_size : c.sizes[1] || c.sizes[0] : ""
    }));
  };
  const handleSendTask = async () => {
    if (problems.length) {
      const errText = problems.join(", ");
      setBtnFeedback({ type: "error", message: errText });
      setMsg("Pehle ye theek karo: " + errText);
      return;
    }
    setIsGenerating(true);
    setBtnFeedback(null);
    try {
      const { success, taskId, error } = await appService.createTask(appId, row);
      if (!success || error) {
        const errText = "API Error: " + (error?.message || JSON.stringify(error));
        setBtnFeedback({ type: "error", message: errText });
        setMsg(errText);
        return;
      }
      const successMsg = `\u26A1 Task #${taskId} dispatch ho gaya for App "${app.label}"!`;
      setBtnFeedback({ type: "success", message: successMsg });
      setMsg(successMsg);
      const newTaskObj = {
        id: taskId,
        app_id: appId,
        task_type: row.task_type,
        model: row.model,
        prompt: row.prompt,
        aspect_ratio: row.aspect_ratio,
        image_size: row.image_size,
        status: "pending",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        extra_image_urls: row.extra_image_urls,
        face_image_url: row.face_image_url,
        style_image_url: row.style_image_url,
        input_image_url: row.input_image_url
      };
      setLiveTasks((list) => [newTaskObj, ...list.filter((x) => x.id !== taskId)].slice(0, 50));
      setForm((f) => ({ ...f, prompt: "" }));
      setTimeout(syncLiveTasks, 500);
      setTimeout(syncLiveTasks, 2e3);
      setTimeout(() => setBtnFeedback(null), 8e3);
    } catch (err) {
      const errText = "Send error: " + err.message;
      setBtnFeedback({ type: "error", message: errText });
      setMsg(errText);
    } finally {
      setIsGenerating(false);
    }
  };
  const displayedTools = assignedTools.filter((t) => {
    return !toolSearch || (t.label || "").toLowerCase().includes(toolSearch.toLowerCase()) || (t.task_type || "").toLowerCase().includes(toolSearch.toLowerCase());
  });
  return /* @__PURE__ */ import_react21.default.createElement("div", { className: "space-y-6 animate-fadeIn" }, /* @__PURE__ */ import_react21.default.createElement("div", { className: "bg-gradient-to-r from-amber-400/10 via-[#0e1320] to-[#0e1320] border border-amber-400/30 rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl" }, /* @__PURE__ */ import_react21.default.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ import_react21.default.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ import_react21.default.createElement("span", { className: "text-2xl" }, "\u{1F680}"), /* @__PURE__ */ import_react21.default.createElement("h2", { className: "text-base sm:text-lg font-black text-white" }, app.label, " Workspace"), /* @__PURE__ */ import_react21.default.createElement("span", { className: "text-xs font-mono font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full" }, "app_id: ", app.app_id)), /* @__PURE__ */ import_react21.default.createElement("p", { className: "text-xs text-slate-300" }, "Aap is waqt ", /* @__PURE__ */ import_react21.default.createElement("span", { className: "text-amber-300 font-bold" }, app.label), " ke environment mein kaam kar rahe hain. Yahan sirf is app ko assign kiye gaye tools dikhenge aur generate hone wale tasks isi app ke account mein save honge.")), /* @__PURE__ */ import_react21.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react21.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setApiModalOpen(true),
      className: "h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-400/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors",
      title: "View API Endpoints and Code Integration"
    },
    /* @__PURE__ */ import_react21.default.createElement(Terminal, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react21.default.createElement("span", null, "API & SDK \u26A1")
  ), /* @__PURE__ */ import_react21.default.createElement("div", { className: "bg-[#080b12] border border-slate-800 rounded-xl px-3 py-1.5 text-center" }, /* @__PURE__ */ import_react21.default.createElement("span", { className: "text-[10px] text-slate-400 font-mono block" }, "Assigned Tools"), /* @__PURE__ */ import_react21.default.createElement("span", { className: "text-sm font-extrabold text-amber-300 font-mono" }, assignedTools.length, " Active")))), assignedTools.length === 0 ? /* @__PURE__ */ import_react21.default.createElement("div", { className: "bg-[#0e1320] border border-slate-800 rounded-2xl p-8 text-center space-y-3" }, /* @__PURE__ */ import_react21.default.createElement("p", { className: "text-sm text-amber-300 font-bold" }, "Is App ko abhi koi tool assign nahi kiya gaya hai."), /* @__PURE__ */ import_react21.default.createElement("p", { className: "text-xs text-slate-400" }, 'Upar "Manage Assigned Tools" tab mein ja kar tools assign karein.')) : (
    /* Tools Grid & Live Execution Engine */
    /* @__PURE__ */ import_react21.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" }, /* @__PURE__ */ import_react21.default.createElement("div", { className: "lg:col-span-5 bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl" }, /* @__PURE__ */ import_react21.default.createElement("div", { className: "flex items-center justify-between border-b border-slate-800 pb-2.5" }, /* @__PURE__ */ import_react21.default.createElement("span", { className: "text-xs font-bold text-slate-200" }, "Assigned Tools (", assignedTools.length, ")"), /* @__PURE__ */ import_react21.default.createElement("span", { className: "text-[10px] text-amber-300 font-mono" }, "Click tool to run")), /* @__PURE__ */ import_react21.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react21.default.createElement(Search, { className: "w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }), /* @__PURE__ */ import_react21.default.createElement(
      "input",
      {
        type: "text",
        value: toolSearch,
        onChange: (e) => setToolSearch(e.target.value),
        placeholder: "Filter tools in this app...",
        className: "w-full h-8 bg-[#080b12] border border-slate-800 rounded-xl pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
      }
    )), /* @__PURE__ */ import_react21.default.createElement("div", { className: "space-y-1.5 max-h-[600px] overflow-y-auto pr-1" }, displayedTools.map((t) => {
      const isSelected = form.task_type === t.task_type;
      const cat = getToolCategory(t.task_type);
      const catObj = TOOL_CATEGORIES.find((c) => c.id === cat) || TOOL_CATEGORIES[0];
      return /* @__PURE__ */ import_react21.default.createElement(
        "button",
        {
          key: t.task_type,
          type: "button",
          onClick: () => handleSelectTool(t.task_type),
          className: `w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${isSelected ? "bg-amber-400/15 border-amber-400 text-white shadow-md shadow-amber-400/10" : "bg-[#080b12] hover:bg-slate-800/60 border-slate-800/80 text-slate-300"}`
        },
        /* @__PURE__ */ import_react21.default.createElement("div", { className: "flex items-center gap-2.5 overflow-hidden" }, /* @__PURE__ */ import_react21.default.createElement("span", { className: "text-base shrink-0" }, catObj.icon), /* @__PURE__ */ import_react21.default.createElement("div", { className: "truncate" }, /* @__PURE__ */ import_react21.default.createElement("p", { className: `text-xs font-bold truncate ${isSelected ? "text-amber-300" : "text-slate-200"}` }, t.label), /* @__PURE__ */ import_react21.default.createElement("p", { className: "font-mono text-[10px] text-slate-500 truncate" }, t.task_type))),
        isSelected && /* @__PURE__ */ import_react21.default.createElement("span", { className: "text-[10px] font-mono text-amber-400 font-bold bg-amber-400/20 px-1.5 py-0.5 rounded shrink-0" }, "Active")
      );
    }))), /* @__PURE__ */ import_react21.default.createElement("div", { className: "lg:col-span-7 bg-[#0e1320] border border-slate-800/80 rounded-2xl p-5 space-y-5 shadow-xl" }, /* @__PURE__ */ import_react21.default.createElement("div", { className: "border-b border-slate-800/80 pb-3 flex items-start justify-between gap-3" }, /* @__PURE__ */ import_react21.default.createElement("div", null, /* @__PURE__ */ import_react21.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react21.default.createElement("h3", { className: "text-base font-extrabold text-white" }, type.label || form.task_type), /* @__PURE__ */ import_react21.default.createElement("span", { className: "text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold" }, type.output === "image" ? "Image Out" : "Text Out")), /* @__PURE__ */ import_react21.default.createElement("p", { className: "text-xs text-slate-400 mt-1" }, catalog.find((c) => c.task_type === form.task_type)?.hint || "Configure references and run task directly under this client app."))), /* @__PURE__ */ import_react21.default.createElement(
      GenerationSettings,
      {
        form,
        setForm,
        type,
        caps,
        modelOptions
      }
    ), /* @__PURE__ */ import_react21.default.createElement(
      PhotoSlotGrid,
      {
        type,
        form,
        setForm,
        onSetMsg: setMsg
      }
    ), /* @__PURE__ */ import_react21.default.createElement(
      BatchUploader,
      {
        type,
        form,
        setForm,
        onSetMsg: setMsg
      }
    ), /* @__PURE__ */ import_react21.default.createElement(
      PromptSection,
      {
        type,
        form,
        setForm
      }
    ), /* @__PURE__ */ import_react21.default.createElement(
      ActionPanel,
      {
        problems,
        isGenerating,
        btnFeedback,
        onClearFeedback: () => setBtnFeedback(null),
        onSendTask: handleSendTask
      }
    )))
  ), /* @__PURE__ */ import_react21.default.createElement(
    AppApiModal,
    {
      isOpen: apiModalOpen,
      onClose: () => setApiModalOpen(false),
      appId,
      appLabel: app.label,
      selectedTool: type,
      samplePayload: row
    }
  ));
}

// src/components/apps/AppsDashboard.jsx
function AppsDashboard() {
  const { sb, apps, appTasks, catalog, loadCatalog, setMsg } = useAdmin();
  const [createModalOpen, setCreateModalOpen] = (0, import_react22.useState)(false);
  const [selectedApp, setSelectedApp] = (0, import_react22.useState)(null);
  const [activeSubTab, setActiveSubTab] = (0, import_react22.useState)("workspace");
  const [copiedId, setCopiedId] = (0, import_react22.useState)(null);
  const handleCopyUrl = (appId) => {
    const url = `${window.location.origin}/app/${appId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(appId);
    setTimeout(() => setCopiedId(null), 2e3);
  };
  const handleToggleApp = async (appId, currentEnabled) => {
    try {
      const { error } = await sb.from(TABLES.APPS).update({ enabled: !currentEnabled, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("app_id", appId);
      if (error)
        throw error;
      loadCatalog();
    } catch (err) {
      setMsg("App update error: " + err.message);
    }
  };
  const handleDeleteApp = async (appId, label) => {
    if (["weargen", "ppp"].includes(appId)) {
      return setMsg("Default system apps (WearGen, PPP) delete nahi ki ja sakti.");
    }
    if (!window.confirm(`Kya aap pakka App "${label}" (${appId}) ko delete karna chahte hain?`))
      return;
    try {
      await sb.from(TABLES.APP_TASKS).delete().eq("app_id", appId);
      const { error } = await sb.from(TABLES.APPS).delete().eq("app_id", appId);
      if (error)
        throw error;
      if (selectedApp?.app_id === appId)
        setSelectedApp(null);
      loadCatalog();
      setMsg(`App "${label}" delete ho gayi.`);
    } catch (err) {
      setMsg("App delete error: " + err.message);
    }
  };
  if (selectedApp) {
    return /* @__PURE__ */ import_react22.default.createElement("div", { className: "space-y-5 animate-fadeIn" }, /* @__PURE__ */ import_react22.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 bg-[#0e1320] border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl" }, /* @__PURE__ */ import_react22.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react22.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => setSelectedApp(null),
        className: "h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
      },
      /* @__PURE__ */ import_react22.default.createElement(ArrowLeft, { className: "w-3.5 h-3.5" }),
      /* @__PURE__ */ import_react22.default.createElement("span", null, "All Apps")
    ), /* @__PURE__ */ import_react22.default.createElement("div", { className: "h-4 w-px bg-slate-800 hidden sm:block" }), /* @__PURE__ */ import_react22.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react22.default.createElement("span", { className: "text-sm font-extrabold text-white" }, selectedApp.label), /* @__PURE__ */ import_react22.default.createElement("span", { className: "text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20" }, selectedApp.app_id))), /* @__PURE__ */ import_react22.default.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ import_react22.default.createElement("div", { className: "flex items-center gap-1 bg-[#080b12] p-1 rounded-xl border border-slate-800 text-xs font-bold" }, /* @__PURE__ */ import_react22.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveSubTab("workspace"),
        className: `px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeSubTab === "workspace" ? "bg-amber-400 text-slate-950 font-extrabold shadow-sm" : "text-slate-400 hover:text-white"}`
      },
      /* @__PURE__ */ import_react22.default.createElement(Play, { className: "w-3.5 h-3.5" }),
      /* @__PURE__ */ import_react22.default.createElement("span", null, "Preview Workspace")
    ), /* @__PURE__ */ import_react22.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => setActiveSubTab("matrix"),
        className: `px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeSubTab === "matrix" ? "bg-amber-400 text-slate-950 font-extrabold shadow-sm" : "text-slate-400 hover:text-white"}`
      },
      /* @__PURE__ */ import_react22.default.createElement(Settings, { className: "w-3.5 h-3.5" }),
      /* @__PURE__ */ import_react22.default.createElement("span", null, "Manage Assigned Tools")
    )), /* @__PURE__ */ import_react22.default.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ import_react22.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleCopyUrl(selectedApp.app_id),
        className: "h-8 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition-colors",
        title: "Copy Standalone URL"
      },
      copiedId === selectedApp.app_id ? /* @__PURE__ */ import_react22.default.createElement(import_react22.default.Fragment, null, /* @__PURE__ */ import_react22.default.createElement(Check, { className: "w-3.5 h-3.5 text-emerald-400" }), /* @__PURE__ */ import_react22.default.createElement("span", { className: "text-emerald-400 font-bold" }, "Copied!")) : /* @__PURE__ */ import_react22.default.createElement(import_react22.default.Fragment, null, /* @__PURE__ */ import_react22.default.createElement(Copy, { className: "w-3.5 h-3.5 text-slate-400" }), /* @__PURE__ */ import_react22.default.createElement("span", null, "Copy URL"))
    ), /* @__PURE__ */ import_react22.default.createElement(
      "a",
      {
        href: `/app/${selectedApp.app_id}`,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "h-8 px-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-400/20 transition-all"
      },
      /* @__PURE__ */ import_react22.default.createElement(ExternalLink, { className: "w-3.5 h-3.5" }),
      /* @__PURE__ */ import_react22.default.createElement("span", null, "Open Standalone Tab \u2197")
    )))), activeSubTab === "workspace" ? /* @__PURE__ */ import_react22.default.createElement(AppWorkspaceView, { app: selectedApp }) : /* @__PURE__ */ import_react22.default.createElement(AppToolMatrix, { app: selectedApp, onClose: () => setActiveSubTab("workspace") }));
  }
  return /* @__PURE__ */ import_react22.default.createElement("div", { className: "space-y-6 animate-fadeIn" }, /* @__PURE__ */ import_react22.default.createElement("div", { className: "bg-[#0e1320] border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl" }, /* @__PURE__ */ import_react22.default.createElement("div", { className: "flex items-center gap-3.5" }, /* @__PURE__ */ import_react22.default.createElement("div", { className: "w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center" }, /* @__PURE__ */ import_react22.default.createElement(Smartphone, { className: "w-5 h-5 sm:w-6 sm:h-6 text-amber-400" })), /* @__PURE__ */ import_react22.default.createElement("div", null, /* @__PURE__ */ import_react22.default.createElement("h2", { className: "text-base sm:text-lg font-black text-white flex items-center gap-2" }, /* @__PURE__ */ import_react22.default.createElement("span", null, "Apps & Client Workspaces Dashboard"), /* @__PURE__ */ import_react22.default.createElement("span", { className: "text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full" }, apps.length, " Apps")), /* @__PURE__ */ import_react22.default.createElement("p", { className: "text-xs text-slate-400 mt-0.5" }, "Create custom client apps (e.g. WearGen, Zara, Myntra), assign individual tools, and launch dedicated app workspaces."))), /* @__PURE__ */ import_react22.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react22.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setCreateModalOpen(true),
      className: "h-9 px-4 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-400/20 active:scale-98 transition-all"
    },
    /* @__PURE__ */ import_react22.default.createElement(Plus, { className: "w-4 h-4" }),
    /* @__PURE__ */ import_react22.default.createElement("span", null, "Create New App")
  ))), /* @__PURE__ */ import_react22.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" }, apps.map((app) => {
    const assignedCount = appTasks.filter((l) => l.app_id === app.app_id).length;
    const isSystem = ["weargen", "ppp"].includes(app.app_id);
    return /* @__PURE__ */ import_react22.default.createElement(
      "div",
      {
        key: app.app_id,
        className: "bg-[#0e1320] border border-slate-800/90 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl group"
      },
      /* @__PURE__ */ import_react22.default.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ import_react22.default.createElement("div", { className: "flex items-start justify-between gap-2" }, /* @__PURE__ */ import_react22.default.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ import_react22.default.createElement("div", { className: "w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center font-bold text-base text-amber-400 font-mono" }, app.label.charAt(0).toUpperCase()), /* @__PURE__ */ import_react22.default.createElement("div", null, /* @__PURE__ */ import_react22.default.createElement("h3", { className: "text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors" }, app.label), /* @__PURE__ */ import_react22.default.createElement("p", { className: "font-mono text-[10px] text-slate-400" }, "app_id: ", /* @__PURE__ */ import_react22.default.createElement("span", { className: "text-amber-400/90" }, app.app_id)))), /* @__PURE__ */ import_react22.default.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleToggleApp(app.app_id, app.enabled),
          className: `text-[10px] font-mono px-2 py-0.5 rounded-full font-bold transition-colors ${app.enabled ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/15 text-rose-300 border border-rose-500/30"}`
        },
        app.enabled ? "Active" : "Disabled"
      )), /* @__PURE__ */ import_react22.default.createElement("div", { className: "bg-[#080b12] border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs" }, /* @__PURE__ */ import_react22.default.createElement("span", { className: "text-slate-400" }, "Assigned AI Tools:"), /* @__PURE__ */ import_react22.default.createElement("span", { className: "font-mono font-extrabold text-amber-300" }, assignedCount, " / ", catalog.length, " Tools"))),
      /* @__PURE__ */ import_react22.default.createElement("div", { className: "space-y-2 pt-2 border-t border-slate-800/80" }, /* @__PURE__ */ import_react22.default.createElement(
        "a",
        {
          href: `/app/${app.app_id}`,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "w-full h-9 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-amber-400/20 active:scale-98 transition-all group-hover:brightness-105"
        },
        /* @__PURE__ */ import_react22.default.createElement(ExternalLink, { className: "w-3.5 h-3.5" }),
        /* @__PURE__ */ import_react22.default.createElement("span", null, "Open in Separate URL \u2197"),
        /* @__PURE__ */ import_react22.default.createElement(ChevronRight, { className: "w-3.5 h-3.5 ml-auto opacity-70" })
      ), /* @__PURE__ */ import_react22.default.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ import_react22.default.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            setSelectedApp(app);
            setActiveSubTab("workspace");
          },
          className: "flex-1 h-8 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800 transition-colors",
          title: "Preview Workspace inside Admin"
        },
        /* @__PURE__ */ import_react22.default.createElement(Play, { className: "w-3 h-3 text-amber-400" }),
        /* @__PURE__ */ import_react22.default.createElement("span", null, "Preview")
      ), /* @__PURE__ */ import_react22.default.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleCopyUrl(app.app_id),
          className: "h-8 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800 transition-colors",
          title: "Copy App URL"
        },
        copiedId === app.app_id ? /* @__PURE__ */ import_react22.default.createElement(Check, { className: "w-3.5 h-3.5 text-emerald-400" }) : /* @__PURE__ */ import_react22.default.createElement(Copy, { className: "w-3.5 h-3.5 text-slate-400" })
      ), /* @__PURE__ */ import_react22.default.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            setSelectedApp(app);
            setActiveSubTab("matrix");
          },
          className: "h-8 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-800 transition-colors",
          title: "Manage Tools"
        },
        /* @__PURE__ */ import_react22.default.createElement(Settings, { className: "w-3 h-3 text-slate-400" }),
        /* @__PURE__ */ import_react22.default.createElement("span", null, "Tools")
      ), !isSystem && /* @__PURE__ */ import_react22.default.createElement(
        "button",
        {
          type: "button",
          onClick: () => handleDeleteApp(app.app_id, app.label),
          className: "h-8 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors border border-rose-500/20",
          title: "Delete App"
        },
        /* @__PURE__ */ import_react22.default.createElement(Trash2, { className: "w-3.5 h-3.5" })
      )))
    );
  })), /* @__PURE__ */ import_react22.default.createElement(
    AppCreateModal,
    {
      isOpen: createModalOpen,
      onClose: () => setCreateModalOpen(false),
      onCreated: (newId) => {
        const found = apps.find((a) => a.app_id === newId);
        if (found) {
          setSelectedApp(found);
          setActiveSubTab("workspace");
        }
      }
    }
  ));
}

// src/components/builder/ToolBuilder.jsx
var import_react24 = __toESM(require_react());

// src/components/builder/SchemaPreview.jsx
var import_react23 = __toESM(require_react());
function SchemaPreview({ builderForm, inputs, labels, optional }) {
  const [tab, setTab] = (0, import_react23.useState)("catalog");
  const [copied, setCopied] = (0, import_react23.useState)(false);
  const catalogPayload = {
    task_type: builderForm.task_type || "<tool_slug>",
    label: builderForm.label || "<Display Name>",
    customer_label: builderForm.customer_label || builderForm.label || "<Customer App Name>",
    hint: builderForm.hint || "<Short hint description>",
    output: builderForm.output,
    inputs,
    labels,
    optional,
    extras: !!builderForm.hasExtras,
    prompt_required: !!builderForm.promptRequired,
    face_check: !!builderForm.faceCheck,
    family: false,
    per_photo: !!builderForm.perPhoto,
    customer_visible: true,
    enabled: !!builderForm.enabled
  };
  const promptPayload = {
    task_type: builderForm.task_type || "<tool_slug>",
    system_text: builderForm.system_text,
    role_text: builderForm.role_text,
    negative_text: builderForm.negative_text,
    enabled: builderForm.enabled
  };
  const activeContent = tab === "catalog" ? JSON.stringify(catalogPayload, null, 2) : JSON.stringify(promptPayload, null, 2);
  const handleCopy = () => {
    copyToClipboard(activeContent, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    });
  };
  return /* @__PURE__ */ import_react23.default.createElement("section", { className: "bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl" }, /* @__PURE__ */ import_react23.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3" }, /* @__PURE__ */ import_react23.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react23.default.createElement("div", { className: "w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center" }, /* @__PURE__ */ import_react23.default.createElement(Database, { className: "w-4 h-4 text-amber-400" })), /* @__PURE__ */ import_react23.default.createElement("div", null, /* @__PURE__ */ import_react23.default.createElement("h3", { className: "text-xs sm:text-sm font-bold text-white" }, "Live DB Schema Preview"), /* @__PURE__ */ import_react23.default.createElement("p", { className: "text-[10px] text-slate-400 font-mono" }, "Row inserted into SQL Server tables"))), /* @__PURE__ */ import_react23.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleCopy,
      className: "h-7 px-2.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all"
    },
    copied ? /* @__PURE__ */ import_react23.default.createElement(Check, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ import_react23.default.createElement(Copy, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react23.default.createElement("span", null, copied ? "Copied!" : "Copy Schema")
  )), /* @__PURE__ */ import_react23.default.createElement("div", { className: "flex items-center gap-1 bg-[#080b12] p-1 rounded-xl border border-slate-800 text-[11px] font-mono" }, /* @__PURE__ */ import_react23.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setTab("catalog"),
      className: `flex-1 py-1 px-2 rounded-lg text-center font-bold transition-all ${tab === "catalog" ? "bg-amber-400 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`
    },
    "1. ai_studio_task_catalog"
  ), /* @__PURE__ */ import_react23.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setTab("prompt"),
      className: `flex-1 py-1 px-2 rounded-lg text-center font-bold transition-all ${tab === "prompt" ? "bg-amber-400 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`
    },
    "2. ai_studio_prompts"
  )), /* @__PURE__ */ import_react23.default.createElement("pre", { className: "bg-[#080b12] border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-amber-300/90 overflow-x-auto max-h-[460px] scrollbar-thin leading-relaxed" }, /* @__PURE__ */ import_react23.default.createElement("code", null, activeContent)));
}

// src/components/builder/ToolBuilder.jsx
function ToolBuilder() {
  const { sb, catalog, prompts, loadCatalog, loadConfig, setMsg } = useAdmin();
  const [builderForm, setBuilderForm] = (0, import_react24.useState)({
    mode: "new",
    // 'new' | 'edit'
    selectedExisting: "",
    task_type: "",
    label: "",
    customer_label: "",
    hint: "",
    output: "image",
    // 'image' | 'text'
    category: "fashion",
    hasFace: true,
    faceLabel: "Face reference photo",
    faceCheck: true,
    hasStyle: false,
    styleLabel: "Style reference photo",
    hasInput: false,
    inputLabel: "Input photo",
    hasExtras: false,
    perPhoto: false,
    promptRequired: false,
    system_text: "You are an expert commercial photographer and studio artist.",
    role_text: "Generate a professional commercial studio shot preserving face and attire details.",
    negative_text: "blurry, low quality, distorted, extra limbs, bad lighting, watermark",
    enabled: true
  });
  const [saving, setSaving] = (0, import_react24.useState)(false);
  const [savedMsg, setSavedMsg] = (0, import_react24.useState)("");
  const handleSelectExisting = (taskType) => {
    const item = catalog.find((c) => c.task_type === taskType);
    if (!item)
      return;
    const pr = prompts[taskType] || {};
    setBuilderForm({
      mode: "edit",
      selectedExisting: taskType,
      task_type: item.task_type,
      label: item.label || "",
      customer_label: item.customer_label || item.label || "",
      hint: item.hint || "",
      output: item.output || "image",
      category: getToolCategory(item.task_type),
      hasFace: (item.inputs || []).includes("face"),
      faceLabel: item.labels?.face || "Face reference photo",
      faceCheck: !!item.face_check,
      hasStyle: (item.inputs || []).includes("style"),
      styleLabel: item.labels?.style || "Style reference photo",
      hasInput: (item.inputs || []).includes("input"),
      inputLabel: item.labels?.input || "Input photo",
      hasExtras: !!item.extras,
      perPhoto: !!item.per_photo,
      promptRequired: !!item.prompt_required,
      system_text: pr.system_text || "You are an expert commercial photographer and studio artist.",
      role_text: pr.role_text || "Generate a professional commercial studio shot.",
      negative_text: pr.negative_text || "blurry, low quality, distorted, extra limbs, bad lighting, watermark",
      enabled: item.enabled !== false
    });
  };
  const inputs = (0, import_react24.useMemo)(() => {
    const list = [];
    if (builderForm.hasFace)
      list.push("face");
    if (builderForm.hasStyle)
      list.push("style");
    if (builderForm.hasInput)
      list.push("input");
    return list;
  }, [builderForm.hasFace, builderForm.hasStyle, builderForm.hasInput]);
  const labels = (0, import_react24.useMemo)(() => {
    const map = {};
    if (builderForm.hasFace)
      map.face = builderForm.faceLabel;
    if (builderForm.hasStyle)
      map.style = builderForm.styleLabel;
    if (builderForm.hasInput)
      map.input = builderForm.inputLabel;
    return map;
  }, [builderForm.hasFace, builderForm.faceLabel, builderForm.hasStyle, builderForm.styleLabel, builderForm.hasInput, builderForm.inputLabel]);
  const optional = [];
  const handleSaveTool = async () => {
    if (!builderForm.task_type.trim())
      return setMsg("Tool Slug (task_type) zaroori hai");
    if (!builderForm.label.trim())
      return setMsg("Display Label zaroori hai");
    if (!builderForm.system_text.trim())
      return setMsg("System Prompt zaroori hai");
    if (!builderForm.role_text.trim())
      return setMsg("Role Prompt zaroori hai");
    setSaving(true);
    setSavedMsg("");
    const taskType = builderForm.task_type.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    try {
      const isExisting = catalog.some((c) => c.task_type === taskType);
      const catalogRow = {
        task_type: taskType,
        label: builderForm.label.trim(),
        customer_label: builderForm.customer_label.trim() || builderForm.label.trim(),
        hint: builderForm.hint.trim() || null,
        output: builderForm.output,
        inputs,
        labels,
        optional,
        extras: !!builderForm.hasExtras,
        prompt_required: !!builderForm.promptRequired,
        face_check: !!builderForm.faceCheck,
        family: false,
        per_photo: !!builderForm.perPhoto,
        customer_visible: true,
        enabled: !!builderForm.enabled,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (isExisting) {
        await sb.from(TABLES.CATALOG).update(catalogRow).eq("task_type", taskType);
      } else {
        const maxSort = catalog.reduce((max, c) => Math.max(max, c.sort || 0), 0);
        catalogRow.sort = maxSort + 1;
        await sb.from(TABLES.CATALOG).insert(catalogRow);
      }
      const promptRow = {
        task_type: taskType,
        system_text: builderForm.system_text.trim(),
        role_text: builderForm.role_text.trim(),
        negative_text: builderForm.negative_text.trim(),
        enabled: !!builderForm.enabled,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const hasPrompt = !!prompts[taskType];
      if (hasPrompt) {
        await sb.from(TABLES.PROMPTS).update(promptRow).eq("task_type", taskType);
      } else {
        await sb.from(TABLES.PROMPTS).insert(promptRow);
      }
      const toolRow = {
        task_type: taskType,
        tool: builderForm.output === "image" ? "image" : "chat"
      };
      try {
        await sb.from(TABLES.TOOL_TYPES).insert(toolRow);
      } catch {
      }
      if (!isExisting) {
        try {
          await sb.from(TABLES.APP_TASKS).insert({ app_id: "weargen", task_type: taskType });
        } catch {
        }
      }
      await loadCatalog();
      await loadConfig();
      setSavedMsg(`\u2728 Tool "${builderForm.label}" successfully saved to Database!`);
      setTimeout(() => setSavedMsg(""), 5e3);
    } catch (err) {
      setMsg("Tool save error: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ import_react24.default.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ import_react24.default.createElement("div", { className: "bg-[#0e1320] border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xl" }, /* @__PURE__ */ import_react24.default.createElement("div", null, /* @__PURE__ */ import_react24.default.createElement("h2", { className: "text-base sm:text-lg font-extrabold text-white flex items-center gap-2" }, /* @__PURE__ */ import_react24.default.createElement(Wrench, { className: "w-5 h-5 text-amber-400" }), /* @__PURE__ */ import_react24.default.createElement("span", null, "Interactive Tool Builder & Schema Manager")), /* @__PURE__ */ import_react24.default.createElement("p", { className: "text-xs text-slate-400 mt-0.5" }, "Design new AI workflows or modify existing tools. Saves directly to SQL Server & syncs with worker fleet.")), /* @__PURE__ */ import_react24.default.createElement("div", { className: "flex items-center gap-1.5 bg-[#080b12] p-1 rounded-xl border border-slate-800" }, /* @__PURE__ */ import_react24.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setBuilderForm((prev) => ({ ...prev, mode: "new", selectedExisting: "", task_type: "", label: "", hint: "" })),
      className: `h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${builderForm.mode === "new" ? "bg-amber-400 text-slate-950 font-extrabold shadow-sm" : "text-slate-400 hover:text-white"}`
    },
    /* @__PURE__ */ import_react24.default.createElement(Plus, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react24.default.createElement("span", null, "Create New Tool")
  ), /* @__PURE__ */ import_react24.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setBuilderForm((prev) => ({ ...prev, mode: "edit" })),
      className: `h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${builderForm.mode === "edit" ? "bg-amber-400 text-slate-950 font-extrabold shadow-sm" : "text-slate-400 hover:text-white"}`
    },
    /* @__PURE__ */ import_react24.default.createElement(Pencil, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react24.default.createElement("span", null, "Edit Existing Tool (", catalog.length, ")")
  ))), /* @__PURE__ */ import_react24.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" }, /* @__PURE__ */ import_react24.default.createElement("div", { className: "lg:col-span-7 bg-[#0e1320] border border-slate-800/80 rounded-2xl p-5 space-y-5 shadow-xl" }, builderForm.mode === "edit" && /* @__PURE__ */ import_react24.default.createElement("div", { className: "space-y-1.5 bg-amber-400/5 border border-amber-400/20 p-3 rounded-xl" }, /* @__PURE__ */ import_react24.default.createElement("label", { className: "text-xs font-bold text-amber-300" }, "Choose Existing Tool to Modify:"), /* @__PURE__ */ import_react24.default.createElement(
    "select",
    {
      value: builderForm.selectedExisting,
      onChange: (e) => handleSelectExisting(e.target.value),
      className: "w-full h-9 bg-[#080b12] border border-amber-400/30 rounded-xl px-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
    },
    /* @__PURE__ */ import_react24.default.createElement("option", { value: "" }, "-- Choose from ", catalog.length, " existing tools --"),
    catalog.map((c) => /* @__PURE__ */ import_react24.default.createElement("option", { key: c.task_type, value: c.task_type }, c.label, " (", c.task_type, ")"))
  )), /* @__PURE__ */ import_react24.default.createElement("div", { className: "space-y-3.5" }, /* @__PURE__ */ import_react24.default.createElement("h3", { className: "text-xs font-bold text-amber-400 uppercase tracking-wide border-b border-slate-800 pb-1.5" }, "1. Identifiers & Classification"), /* @__PURE__ */ import_react24.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ import_react24.default.createElement("div", null, /* @__PURE__ */ import_react24.default.createElement("label", { className: "block text-xs font-bold text-slate-300 mb-1" }, "Tool Slug / Task Type Key *"), /* @__PURE__ */ import_react24.default.createElement(
    "input",
    {
      type: "text",
      value: builderForm.task_type,
      onChange: (e) => setBuilderForm({ ...builderForm, task_type: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }),
      placeholder: "e.g. bridal_saree_studio",
      disabled: builderForm.mode === "edit",
      className: "w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 disabled:opacity-50"
    }
  )), /* @__PURE__ */ import_react24.default.createElement("div", null, /* @__PURE__ */ import_react24.default.createElement("label", { className: "block text-xs font-bold text-slate-300 mb-1" }, "Display Label *"), /* @__PURE__ */ import_react24.default.createElement(
    "input",
    {
      type: "text",
      value: builderForm.label,
      onChange: (e) => setBuilderForm({ ...builderForm, label: e.target.value }),
      placeholder: "e.g. Bridal Saree Studio",
      className: "w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
    }
  ))), /* @__PURE__ */ import_react24.default.createElement("div", null, /* @__PURE__ */ import_react24.default.createElement("label", { className: "block text-xs font-bold text-slate-300 mb-1" }, "Tool Hint / Description"), /* @__PURE__ */ import_react24.default.createElement(
    "textarea",
    {
      value: builderForm.hint,
      onChange: (e) => setBuilderForm({ ...builderForm, hint: e.target.value }),
      rows: 2,
      placeholder: "Short explanation of what this tool does...",
      className: "w-full bg-[#080b12] border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
    }
  )), /* @__PURE__ */ import_react24.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ import_react24.default.createElement("div", null, /* @__PURE__ */ import_react24.default.createElement("label", { className: "block text-xs font-bold text-slate-300 mb-1" }, "Output Modality"), /* @__PURE__ */ import_react24.default.createElement(
    "select",
    {
      value: builderForm.output,
      onChange: (e) => setBuilderForm({ ...builderForm, output: e.target.value }),
      className: "w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-amber-400"
    },
    /* @__PURE__ */ import_react24.default.createElement("option", { value: "image" }, "Image (Generates Visual Photo)"),
    /* @__PURE__ */ import_react24.default.createElement("option", { value: "text" }, "Text (Vision/Chat/Tagging)")
  )), /* @__PURE__ */ import_react24.default.createElement("div", null, /* @__PURE__ */ import_react24.default.createElement("label", { className: "block text-xs font-bold text-slate-300 mb-1" }, "Studio Category"), /* @__PURE__ */ import_react24.default.createElement(
    "select",
    {
      value: builderForm.category,
      onChange: (e) => setBuilderForm({ ...builderForm, category: e.target.value }),
      className: "w-full h-9 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-amber-400"
    },
    TOOL_CATEGORIES.filter((c) => c.id !== "all").map((cat) => /* @__PURE__ */ import_react24.default.createElement("option", { key: cat.id, value: cat.id }, cat.icon, " ", cat.label))
  )))), /* @__PURE__ */ import_react24.default.createElement("div", { className: "space-y-3 pt-2" }, /* @__PURE__ */ import_react24.default.createElement("h3", { className: "text-xs font-bold text-amber-400 uppercase tracking-wide border-b border-slate-800 pb-1.5" }, "2. Photo Reference Slots Configuration"), /* @__PURE__ */ import_react24.default.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ import_react24.default.createElement("div", { className: "p-3 bg-[#080b12] border border-slate-800 rounded-xl space-y-2" }, /* @__PURE__ */ import_react24.default.createElement("label", { className: "flex items-center gap-2 text-xs text-slate-200 font-bold cursor-pointer" }, /* @__PURE__ */ import_react24.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: builderForm.hasFace,
      onChange: (e) => setBuilderForm({ ...builderForm, hasFace: e.target.checked }),
      className: "rounded border-slate-700 text-amber-400 focus:ring-amber-400"
    }
  ), /* @__PURE__ */ import_react24.default.createElement("span", null, "Face Reference Photo Slot (`face_image_url`)")), builderForm.hasFace && /* @__PURE__ */ import_react24.default.createElement(
    "input",
    {
      type: "text",
      value: builderForm.faceLabel,
      onChange: (e) => setBuilderForm({ ...builderForm, faceLabel: e.target.value }),
      placeholder: "Label for face slot",
      className: "w-full h-8 bg-slate-900 border border-slate-800 rounded-lg px-2 text-xs text-slate-300"
    }
  )), /* @__PURE__ */ import_react24.default.createElement("div", { className: "p-3 bg-[#080b12] border border-slate-800 rounded-xl space-y-2" }, /* @__PURE__ */ import_react24.default.createElement("label", { className: "flex items-center gap-2 text-xs text-slate-200 font-bold cursor-pointer" }, /* @__PURE__ */ import_react24.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: builderForm.hasStyle,
      onChange: (e) => setBuilderForm({ ...builderForm, hasStyle: e.target.checked }),
      className: "rounded border-slate-700 text-amber-400 focus:ring-amber-400"
    }
  ), /* @__PURE__ */ import_react24.default.createElement("span", null, "Style / Outfit Reference Photo Slot (`style_image_url`)")), builderForm.hasStyle && /* @__PURE__ */ import_react24.default.createElement(
    "input",
    {
      type: "text",
      value: builderForm.styleLabel,
      onChange: (e) => setBuilderForm({ ...builderForm, styleLabel: e.target.value }),
      placeholder: "Label for style slot",
      className: "w-full h-8 bg-slate-900 border border-slate-800 rounded-lg px-2 text-xs text-slate-300"
    }
  )), /* @__PURE__ */ import_react24.default.createElement("div", { className: "p-3 bg-[#080b12] border border-slate-800 rounded-xl space-y-2" }, /* @__PURE__ */ import_react24.default.createElement("label", { className: "flex items-center gap-2 text-xs text-slate-200 font-bold cursor-pointer" }, /* @__PURE__ */ import_react24.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: builderForm.hasInput,
      onChange: (e) => setBuilderForm({ ...builderForm, hasInput: e.target.checked }),
      className: "rounded border-slate-700 text-amber-400 focus:ring-amber-400"
    }
  ), /* @__PURE__ */ import_react24.default.createElement("span", null, "Input Subject Photo Slot (`input_image_url`)")), builderForm.hasInput && /* @__PURE__ */ import_react24.default.createElement(
    "input",
    {
      type: "text",
      value: builderForm.inputLabel,
      onChange: (e) => setBuilderForm({ ...builderForm, inputLabel: e.target.value }),
      placeholder: "Label for input slot",
      className: "w-full h-8 bg-slate-900 border border-slate-800 rounded-lg px-2 text-xs text-slate-300"
    }
  )), /* @__PURE__ */ import_react24.default.createElement("div", { className: "p-3 bg-[#080b12] border border-amber-400/25 rounded-xl space-y-2" }, /* @__PURE__ */ import_react24.default.createElement("label", { className: "flex items-center gap-2 text-xs text-amber-300 font-bold cursor-pointer" }, /* @__PURE__ */ import_react24.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: builderForm.hasExtras,
      onChange: (e) => setBuilderForm({ ...builderForm, hasExtras: e.target.checked }),
      className: "rounded border-slate-700 text-amber-400 focus:ring-amber-400"
    }
  ), /* @__PURE__ */ import_react24.default.createElement("span", null, "Allow 1 to 50 Photos Multi-Upload (`extras = true`)")), builderForm.hasExtras && /* @__PURE__ */ import_react24.default.createElement("label", { className: "flex items-center gap-2 text-xs text-slate-300 cursor-pointer pl-6" }, /* @__PURE__ */ import_react24.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: builderForm.perPhoto,
      onChange: (e) => setBuilderForm({ ...builderForm, perPhoto: e.target.checked }),
      className: "rounded border-slate-700 text-amber-400"
    }
  ), /* @__PURE__ */ import_react24.default.createElement("span", null, "One result per uploaded photo (`per_photo = true`)"))))), /* @__PURE__ */ import_react24.default.createElement("div", { className: "space-y-3 pt-2" }, /* @__PURE__ */ import_react24.default.createElement("h3", { className: "text-xs font-bold text-amber-400 uppercase tracking-wide border-b border-slate-800 pb-1.5" }, "3. AI System Prompts & Negative Constraints"), /* @__PURE__ */ import_react24.default.createElement("div", { className: "space-y-2.5" }, /* @__PURE__ */ import_react24.default.createElement("div", null, /* @__PURE__ */ import_react24.default.createElement("label", { className: "block text-xs font-bold text-slate-300 mb-1" }, "System Instructions Prompt *"), /* @__PURE__ */ import_react24.default.createElement(
    "textarea",
    {
      value: builderForm.system_text,
      onChange: (e) => setBuilderForm({ ...builderForm, system_text: e.target.value }),
      rows: 2,
      className: "w-full bg-[#080b12] border border-slate-700 rounded-xl p-2.5 text-xs text-white"
    }
  )), /* @__PURE__ */ import_react24.default.createElement("div", null, /* @__PURE__ */ import_react24.default.createElement("label", { className: "block text-xs font-bold text-slate-300 mb-1" }, "Role / Extraction Prompt *"), /* @__PURE__ */ import_react24.default.createElement(
    "textarea",
    {
      value: builderForm.role_text,
      onChange: (e) => setBuilderForm({ ...builderForm, role_text: e.target.value }),
      rows: 3,
      className: "w-full bg-[#080b12] border border-slate-700 rounded-xl p-2.5 text-xs text-white"
    }
  )), /* @__PURE__ */ import_react24.default.createElement("div", null, /* @__PURE__ */ import_react24.default.createElement("label", { className: "block text-xs font-bold text-slate-300 mb-1" }, "Negative Constraints Prompt"), /* @__PURE__ */ import_react24.default.createElement(
    "textarea",
    {
      value: builderForm.negative_text,
      onChange: (e) => setBuilderForm({ ...builderForm, negative_text: e.target.value }),
      rows: 2,
      className: "w-full bg-[#080b12] border border-slate-700 rounded-xl p-2.5 text-xs text-white"
    }
  )))), savedMsg && /* @__PURE__ */ import_react24.default.createElement("div", { className: "p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn" }, /* @__PURE__ */ import_react24.default.createElement(CheckCircle2, { className: "w-4 h-4 text-emerald-400 shrink-0" }), /* @__PURE__ */ import_react24.default.createElement("span", null, savedMsg)), /* @__PURE__ */ import_react24.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleSaveTool,
      disabled: saving,
      className: "w-full h-11 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-98 transition-all disabled:opacity-50"
    },
    saving ? /* @__PURE__ */ import_react24.default.createElement(import_react24.default.Fragment, null, /* @__PURE__ */ import_react24.default.createElement(Loader2, { className: "w-4 h-4 animate-spin text-slate-950" }), /* @__PURE__ */ import_react24.default.createElement("span", null, "Saving Tool to Database...")) : /* @__PURE__ */ import_react24.default.createElement(import_react24.default.Fragment, null, /* @__PURE__ */ import_react24.default.createElement(Save, { className: "w-4 h-4 text-slate-950" }), /* @__PURE__ */ import_react24.default.createElement("span", null, "Save & Deploy Tool to Fleet"))
  )), /* @__PURE__ */ import_react24.default.createElement("div", { className: "lg:col-span-5 lg:sticky lg:top-20" }, /* @__PURE__ */ import_react24.default.createElement(
    SchemaPreview,
    {
      builderForm,
      inputs,
      labels,
      optional
    }
  ))));
}

// src/components/tools/ToolsScreen.jsx
var import_react25 = __toESM(require_react());
function ToolsScreen() {
  const { sb, catalog, apps, appTasks, loadCatalog, setMsg } = useAdmin();
  const [filter, setFilter] = (0, import_react25.useState)("");
  const toggleToolEnabled = async (taskType, current) => {
    const { error } = await sb.from(TABLES.CATALOG).update({
      enabled: !current,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("task_type", taskType);
    if (error)
      return setMsg("Update error: " + error.message);
    loadCatalog();
  };
  const toggleAppTask = async (appId, taskType, current) => {
    const req = !current ? sb.from(TABLES.APP_TASKS).insert({ app_id: appId, task_type: taskType }) : sb.from(TABLES.APP_TASKS).delete().eq("app_id", appId).eq("task_type", taskType);
    const { error } = await req;
    if (error)
      return setMsg("App link error: " + error.message);
    loadCatalog();
  };
  const filtered = (catalog || []).filter((c) => {
    if (!filter)
      return true;
    const q = filter.toLowerCase();
    return (c.task_type || "").toLowerCase().includes(q) || (c.label || "").toLowerCase().includes(q);
  });
  return /* @__PURE__ */ import_react25.default.createElement("section", { className: "bg-[#0b0e17] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl" }, /* @__PURE__ */ import_react25.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3" }, /* @__PURE__ */ import_react25.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react25.default.createElement("div", { className: "w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center" }, /* @__PURE__ */ import_react25.default.createElement(Layers, { className: "w-4 h-4 text-amber-400" })), /* @__PURE__ */ import_react25.default.createElement("div", null, /* @__PURE__ */ import_react25.default.createElement("h2", { className: "text-sm sm:text-base font-extrabold text-white" }, "Tools & Application Links Manager"), /* @__PURE__ */ import_react25.default.createElement("p", { className: "text-xs text-stone-400" }, "Enable/disable tools and configure customer app visibility"))), /* @__PURE__ */ import_react25.default.createElement("div", { className: "relative w-full sm:w-64" }, /* @__PURE__ */ import_react25.default.createElement(Search, { className: "w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" }), /* @__PURE__ */ import_react25.default.createElement(
    "input",
    {
      type: "text",
      value: filter,
      onChange: (e) => setFilter(e.target.value),
      placeholder: "Search tool slug or name...",
      className: "w-full h-8 sm:h-9 bg-stone-950 border border-white/10 rounded-xl pl-8 pr-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
    }
  ))), /* @__PURE__ */ import_react25.default.createElement("div", { className: "overflow-x-auto rounded-2xl border border-white/5 bg-stone-950/60" }, /* @__PURE__ */ import_react25.default.createElement("table", { className: "w-full text-left text-xs" }, /* @__PURE__ */ import_react25.default.createElement("thead", null, /* @__PURE__ */ import_react25.default.createElement("tr", { className: "border-b border-white/5 text-[11px] font-mono text-stone-400 uppercase bg-white/[0.02]" }, /* @__PURE__ */ import_react25.default.createElement("th", { className: "p-3" }, "Status"), /* @__PURE__ */ import_react25.default.createElement("th", { className: "p-3" }, "Tool Name"), /* @__PURE__ */ import_react25.default.createElement("th", { className: "p-3" }, "Task Type Slug"), /* @__PURE__ */ import_react25.default.createElement("th", { className: "p-3" }, "Modality"), /* @__PURE__ */ import_react25.default.createElement("th", { className: "p-3" }, "Linked Apps"))), /* @__PURE__ */ import_react25.default.createElement("tbody", { className: "divide-y divide-white/5" }, filtered.map((c) => {
    return /* @__PURE__ */ import_react25.default.createElement("tr", { key: c.task_type, className: "hover:bg-white/[0.02] transition-colors" }, /* @__PURE__ */ import_react25.default.createElement("td", { className: "p-3" }, /* @__PURE__ */ import_react25.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => toggleToolEnabled(c.task_type, c.enabled),
        className: `px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${c.enabled ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"}`
      },
      c.enabled ? "Enabled" : "Disabled"
    )), /* @__PURE__ */ import_react25.default.createElement("td", { className: "p-3 font-bold text-white" }, c.label), /* @__PURE__ */ import_react25.default.createElement("td", { className: "p-3 font-mono text-[11px] text-amber-400" }, c.task_type), /* @__PURE__ */ import_react25.default.createElement("td", { className: "p-3 font-mono text-[11px] text-stone-400 uppercase" }, c.output), /* @__PURE__ */ import_react25.default.createElement("td", { className: "p-3" }, /* @__PURE__ */ import_react25.default.createElement("div", { className: "flex flex-wrap gap-1.5" }, apps.map((app) => {
      const isLinked = appTasks.some((l) => l.app_id === app.app_id && l.task_type === c.task_type);
      return /* @__PURE__ */ import_react25.default.createElement(
        "button",
        {
          key: app.app_id,
          type: "button",
          onClick: () => toggleAppTask(app.app_id, c.task_type, isLinked),
          className: `px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${isLinked ? "bg-amber-400/20 text-amber-300 border border-amber-400/30" : "bg-stone-900 text-stone-500 border border-white/5"}`
        },
        app.name || app.app_id
      );
    }))));
  })))));
}

// src/components/workers/WorkersScreen.jsx
var import_react28 = __toESM(require_react());

// src/components/workers/WorkerFleet.jsx
var import_react26 = __toESM(require_react());
function WorkerFleet() {
  const { sb, workers, workerLoad, loadWorkers, setMsg } = useAdmin();
  const [view, setView] = (0, import_react26.useState)("active");
  const activeIds = new Set((workerLoad || []).map((l) => l.worker_id));
  const filtered = workers.filter((w) => {
    const isActive = activeIds.has(w.worker_id);
    if (view === "active")
      return isActive;
    if (view === "offline")
      return !isActive;
    return true;
  });
  const togglePause = async (workerId, currentPaused) => {
    const { error } = await sb.from(TABLES.WORKERS).update({ paused: !currentPaused }).eq("worker_id", workerId);
    if (error)
      return setMsg("Pause error: " + error.message);
    loadWorkers();
  };
  const cleanupTasks = async (kind, workerId = null) => {
    const who = workerId ? `Worker ${workerId}` : "Har worker";
    const what = kind === "release" ? "ke phashe tasks wapas pending karna hai" : "ke failed tasks delete karne hain";
    if (!window.confirm(`${who} ${what}. Pakka karna hai?`))
      return;
    const fn = kind === "release" ? API.RELEASE_TASKS : API.CLEAR_FAILED;
    const { data, error } = await sb.rpc(fn, { p_worker_id: workerId || null });
    if (error)
      return setMsg("Clean-up error: " + error.message);
    setMsg(`${data} task ${kind === "release" ? "wapas pending mein gaye" : "delete ho gaye"}`);
    loadWorkers();
  };
  return /* @__PURE__ */ import_react26.default.createElement("section", { className: "bg-[#0b0e17] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl" }, /* @__PURE__ */ import_react26.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ import_react26.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react26.default.createElement("div", { className: "w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center" }, /* @__PURE__ */ import_react26.default.createElement(Users, { className: "w-4 h-4 text-amber-400" })), /* @__PURE__ */ import_react26.default.createElement("div", null, /* @__PURE__ */ import_react26.default.createElement("h2", { className: "text-sm sm:text-base font-extrabold text-white flex items-center gap-2" }, /* @__PURE__ */ import_react26.default.createElement("span", null, "Worker Fleet Monitor"), /* @__PURE__ */ import_react26.default.createElement("span", { className: "text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20" }, activeIds.size, " Online")), /* @__PURE__ */ import_react26.default.createElement("p", { className: "text-xs text-stone-400" }, "Live AI background workers processing Gemini API jobs"))), /* @__PURE__ */ import_react26.default.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ import_react26.default.createElement("div", { className: "flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-white/5 text-xs font-bold" }, /* @__PURE__ */ import_react26.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setView("active"),
      className: `px-3 py-1 rounded-lg transition-all ${view === "active" ? "bg-amber-400 text-stone-950 shadow-sm" : "text-stone-400"}`
    },
    "Active (",
    activeIds.size,
    ")"
  ), /* @__PURE__ */ import_react26.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setView("all"),
      className: `px-3 py-1 rounded-lg transition-all ${view === "all" ? "bg-amber-400 text-stone-950 shadow-sm" : "text-stone-400"}`
    },
    "All (",
    workers.length,
    ")"
  )), /* @__PURE__ */ import_react26.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => cleanupTasks("release"),
      className: "h-8 px-2.5 bg-stone-900 hover:bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
    },
    /* @__PURE__ */ import_react26.default.createElement(RotateCcw, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react26.default.createElement("span", null, "Release Stuck")
  ), /* @__PURE__ */ import_react26.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => cleanupTasks("failed"),
      className: "h-8 px-2.5 bg-stone-900 hover:bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
    },
    /* @__PURE__ */ import_react26.default.createElement(Trash2, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react26.default.createElement("span", null, "Clear Failed")
  ))), /* @__PURE__ */ import_react26.default.createElement("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[500px] overflow-y-auto pr-1" }, filtered.map((w) => {
    const isActive = activeIds.has(w.worker_id);
    const load = workerLoad.find((l) => l.worker_id === w.worker_id);
    return /* @__PURE__ */ import_react26.default.createElement(
      "div",
      {
        key: w.worker_id,
        className: `p-4 rounded-2xl border transition-all space-y-3 ${isActive ? "bg-stone-950 border-white/10" : "bg-stone-950/40 border-white/5 opacity-60"}`
      },
      /* @__PURE__ */ import_react26.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react26.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react26.default.createElement("span", { className: `w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-stone-600"}` }), /* @__PURE__ */ import_react26.default.createElement("span", { className: "font-mono text-xs font-extrabold text-white" }, w.worker_id)), /* @__PURE__ */ import_react26.default.createElement("span", { className: `text-[10px] font-mono px-2 py-0.5 rounded font-bold ${w.paused ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}` }, w.paused ? "Paused" : "Active")),
      /* @__PURE__ */ import_react26.default.createElement("div", { className: "flex items-center justify-between text-xs text-stone-400 font-mono" }, /* @__PURE__ */ import_react26.default.createElement("span", null, "In-flight Tasks:"), /* @__PURE__ */ import_react26.default.createElement("span", { className: "font-bold text-amber-300" }, load?.running || 0)),
      /* @__PURE__ */ import_react26.default.createElement("div", { className: "flex items-center gap-2 pt-1 border-t border-white/5" }, /* @__PURE__ */ import_react26.default.createElement(
        "button",
        {
          type: "button",
          onClick: () => togglePause(w.worker_id, w.paused),
          className: `flex-1 h-8 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${w.paused ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30"}`
        },
        w.paused ? /* @__PURE__ */ import_react26.default.createElement(Play, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ import_react26.default.createElement(Pause, { className: "w-3.5 h-3.5" }),
        /* @__PURE__ */ import_react26.default.createElement("span", null, w.paused ? "Resume Worker" : "Pause Worker")
      ))
    );
  })));
}

// src/components/workers/SystemSettings.jsx
var import_react27 = __toESM(require_react());
function SystemSettings() {
  const { sb, cfg, setCfg, setMsg, loadConfig } = useAdmin();
  const [saving, setSaving] = (0, import_react27.useState)(false);
  const [saved, setSaved] = (0, import_react27.useState)(false);
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error: e1 } = await sb.from(TABLES.SETTINGS).update({
        task_concurrency: Number(cfg.task_concurrency),
        gemini_concurrency: Number(cfg.gemini_concurrency),
        photos_per_task_max: Number(cfg.photos_per_task_max) || 50,
        worker_recycle_after_tasks: Number(cfg.worker_recycle_after_tasks) || 50,
        task_timeout_sec: Number(cfg.task_timeout_sec) || 300,
        maintenance_on: !!cfg.maintenance_on,
        daily_gemini_budget: Number(cfg.daily_gemini_budget) || 1e3,
        cloudinary_enabled: !!cfg.cloudinary_enabled,
        imgbb_enabled: !!cfg.imgbb_enabled,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", 1);
      if (e1)
        throw e1;
      setSaved(true);
      setMsg("Fleet Settings save ho gayi hain!");
      setTimeout(() => setSaved(false), 3e3);
      loadConfig();
    } catch (err) {
      setMsg("Save error: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleSendTestMail = async () => {
    setMsg("Test mail bheja ja raha hai...");
    const { error } = await sb.rpc("ai_studio_send_test_mail");
    setMsg(error ? "Test mail error: " + error.message : "Test mail successfully sent! Check your inbox.");
  };
  return /* @__PURE__ */ import_react27.default.createElement("section", { className: "bg-[#0b0e17] border border-white/10 rounded-3xl p-5 space-y-5 shadow-2xl" }, /* @__PURE__ */ import_react27.default.createElement("div", { className: "flex items-center justify-between border-b border-white/5 pb-3" }, /* @__PURE__ */ import_react27.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react27.default.createElement("div", { className: "w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center" }, /* @__PURE__ */ import_react27.default.createElement(Sliders, { className: "w-4 h-4 text-amber-400" })), /* @__PURE__ */ import_react27.default.createElement("div", null, /* @__PURE__ */ import_react27.default.createElement("h2", { className: "text-sm sm:text-base font-extrabold text-white" }, "Worker Fleet & Cloud Settings"), /* @__PURE__ */ import_react27.default.createElement("p", { className: "text-xs text-stone-400" }, "Concurrency limits, Cloudinary / ImgBB keys, and daily quotas"))), saved && /* @__PURE__ */ import_react27.default.createElement("span", { className: "text-xs text-emerald-400 font-bold flex items-center gap-1" }, /* @__PURE__ */ import_react27.default.createElement(CheckCircle2, { className: "w-3.5 h-3.5" }), " Saved!")), /* @__PURE__ */ import_react27.default.createElement("form", { onSubmit: handleSave, className: "space-y-4" }, /* @__PURE__ */ import_react27.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5" }, /* @__PURE__ */ import_react27.default.createElement("div", null, /* @__PURE__ */ import_react27.default.createElement("label", { className: "block text-xs font-bold text-stone-300 mb-1" }, "Task Concurrency (Per Worker)"), /* @__PURE__ */ import_react27.default.createElement(
    "input",
    {
      type: "number",
      min: 1,
      max: 10,
      value: cfg.task_concurrency || 1,
      onChange: (e) => setCfg({ ...cfg, task_concurrency: e.target.value }),
      className: "w-full h-9 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs text-white font-mono"
    }
  )), /* @__PURE__ */ import_react27.default.createElement("div", null, /* @__PURE__ */ import_react27.default.createElement("label", { className: "block text-xs font-bold text-stone-300 mb-1" }, "Max Photos Per Task (Batch)"), /* @__PURE__ */ import_react27.default.createElement(
    "input",
    {
      type: "number",
      min: 1,
      max: 50,
      value: cfg.photos_per_task_max || 50,
      onChange: (e) => setCfg({ ...cfg, photos_per_task_max: e.target.value }),
      className: "w-full h-9 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs text-white font-mono"
    }
  )), /* @__PURE__ */ import_react27.default.createElement("div", null, /* @__PURE__ */ import_react27.default.createElement("label", { className: "block text-xs font-bold text-stone-300 mb-1" }, "Daily Gemini API Budget"), /* @__PURE__ */ import_react27.default.createElement(
    "input",
    {
      type: "number",
      min: 10,
      max: 1e5,
      value: cfg.daily_gemini_budget || 1e3,
      onChange: (e) => setCfg({ ...cfg, daily_gemini_budget: e.target.value }),
      className: "w-full h-9 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs text-white font-mono"
    }
  ))), /* @__PURE__ */ import_react27.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-white/5" }, /* @__PURE__ */ import_react27.default.createElement("label", { className: "flex items-center gap-2 text-xs text-stone-200 cursor-pointer p-3 bg-stone-950 rounded-xl border border-white/5" }, /* @__PURE__ */ import_react27.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: !!cfg.cloudinary_enabled,
      onChange: (e) => setCfg({ ...cfg, cloudinary_enabled: e.target.checked }),
      className: "rounded border-white/20 text-amber-400"
    }
  ), /* @__PURE__ */ import_react27.default.createElement("span", null, "Cloudinary Storage Enabled (Primary)")), /* @__PURE__ */ import_react27.default.createElement("label", { className: "flex items-center gap-2 text-xs text-stone-200 cursor-pointer p-3 bg-stone-950 rounded-xl border border-white/5" }, /* @__PURE__ */ import_react27.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: !!cfg.maintenance_on,
      onChange: (e) => setCfg({ ...cfg, maintenance_on: e.target.checked }),
      className: "rounded border-white/20 text-rose-400"
    }
  ), /* @__PURE__ */ import_react27.default.createElement("span", { className: "text-rose-300 font-bold" }, "Fleet Maintenance Mode (Stop Task Pickup)"))), /* @__PURE__ */ import_react27.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 pt-2" }, /* @__PURE__ */ import_react27.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleSendTestMail,
      className: "h-9 px-3 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors"
    },
    /* @__PURE__ */ import_react27.default.createElement(Mail, { className: "w-3.5 h-3.5 text-amber-400" }),
    /* @__PURE__ */ import_react27.default.createElement("span", null, "Send Brevo Test Mail")
  ), /* @__PURE__ */ import_react27.default.createElement(
    "button",
    {
      type: "submit",
      disabled: saving,
      className: "h-9 px-5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-400/20 active:scale-98 transition-all disabled:opacity-50"
    },
    saving ? /* @__PURE__ */ import_react27.default.createElement(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ import_react27.default.createElement(Save, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react27.default.createElement("span", null, "Save Fleet Settings")
  ))));
}

// src/components/workers/WorkersScreen.jsx
function WorkersScreen() {
  return /* @__PURE__ */ import_react28.default.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ import_react28.default.createElement(WorkerFleet, null), /* @__PURE__ */ import_react28.default.createElement(SystemSettings, null));
}

// src/components/catalog/CatalogScreen.jsx
var import_react31 = __toESM(require_react());

// src/components/catalog/CatalogViewer.jsx
var import_react29 = __toESM(require_react());
function CatalogViewer() {
  const { catalog, prompts } = useAdmin();
  const [filter, setFilter] = (0, import_react29.useState)("");
  const filtered = (catalog || []).filter((c) => {
    if (!filter)
      return true;
    const q = filter.toLowerCase();
    return (c.task_type || "").toLowerCase().includes(q) || (c.label || "").toLowerCase().includes(q) || (c.hint || "").toLowerCase().includes(q);
  });
  return /* @__PURE__ */ import_react29.default.createElement("section", { className: "bg-[#0b0e17] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl" }, /* @__PURE__ */ import_react29.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3" }, /* @__PURE__ */ import_react29.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react29.default.createElement("div", { className: "w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center" }, /* @__PURE__ */ import_react29.default.createElement(Grid, { className: "w-4 h-4 text-amber-400" })), /* @__PURE__ */ import_react29.default.createElement("div", null, /* @__PURE__ */ import_react29.default.createElement("h2", { className: "text-sm sm:text-base font-extrabold text-white" }, "Task Types Engine Specifications (", catalog.length, " Tools)"), /* @__PURE__ */ import_react29.default.createElement("p", { className: "text-xs text-stone-400" }, "All database registered workflows, slots, and modality parameters"))), /* @__PURE__ */ import_react29.default.createElement("div", { className: "relative w-full sm:w-64" }, /* @__PURE__ */ import_react29.default.createElement(Search, { className: "w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" }), /* @__PURE__ */ import_react29.default.createElement(
    "input",
    {
      type: "text",
      value: filter,
      onChange: (e) => setFilter(e.target.value),
      placeholder: "Filter tools...",
      className: "w-full h-8 sm:h-9 bg-stone-950 border border-white/10 rounded-xl pl-8 pr-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
    }
  ))), /* @__PURE__ */ import_react29.default.createElement("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-y-auto pr-1" }, filtered.map((c) => {
    const pr = prompts[c.task_type];
    return /* @__PURE__ */ import_react29.default.createElement("div", { key: c.task_type, className: "bg-stone-950 border border-white/10 rounded-2xl p-4 space-y-2.5" }, /* @__PURE__ */ import_react29.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react29.default.createElement("span", { className: "text-xs font-bold text-white" }, c.label), /* @__PURE__ */ import_react29.default.createElement("span", { className: "text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-stone-400 uppercase" }, c.output)), /* @__PURE__ */ import_react29.default.createElement("p", { className: "font-mono text-[11px] text-amber-400/90" }, c.task_type), c.hint && /* @__PURE__ */ import_react29.default.createElement("p", { className: "text-[11px] text-stone-400 line-clamp-2 leading-relaxed" }, c.hint), /* @__PURE__ */ import_react29.default.createElement("div", { className: "flex flex-wrap gap-1 pt-1 border-t border-white/5 text-[10px] font-mono" }, (c.inputs || []).map((i) => /* @__PURE__ */ import_react29.default.createElement("span", { key: i, className: "px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300" }, "slot:", i)), c.extras && /* @__PURE__ */ import_react29.default.createElement("span", { className: "px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-300" }, "1-50 batch"), c.face_check && /* @__PURE__ */ import_react29.default.createElement("span", { className: "px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" }, "face_check")));
  })));
}

// src/components/catalog/PromptManager.jsx
var import_react30 = __toESM(require_react());
function PromptManager() {
  const { sb, catalog, prompts, setPrompts, loadConfig, setMsg } = useAdmin();
  const [selectedType, setSelectedType] = (0, import_react30.useState)("image_to_image_prompt");
  const [saving, setSaving] = (0, import_react30.useState)(false);
  const [savedMsg, setSavedMsg] = (0, import_react30.useState)("");
  const currentPrompt = prompts[selectedType] || {
    task_type: selectedType,
    system_text: "",
    role_text: "",
    negative_text: "",
    enabled: true
  };
  const setField = (key, value) => {
    setPrompts((prev) => ({
      ...prev,
      [selectedType]: {
        ...currentPrompt,
        [key]: value
      }
    }));
  };
  const handleSavePrompt = async () => {
    if (!currentPrompt.system_text.trim())
      return setMsg("System text khali nahi ho sakta");
    setSaving(true);
    setSavedMsg("");
    try {
      const { error } = await sb.from(TABLES.PROMPTS).update({
        system_text: currentPrompt.system_text.trim(),
        role_text: currentPrompt.role_text.trim(),
        negative_text: currentPrompt.negative_text.trim(),
        enabled: currentPrompt.enabled,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("task_type", selectedType);
      if (error)
        throw error;
      setSavedMsg(`Saved at ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}!`);
      setTimeout(() => setSavedMsg(""), 4e3);
      loadConfig();
    } catch (err) {
      setMsg("Prompt save error: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ import_react30.default.createElement("section", { className: "bg-[#0b0e17] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl" }, /* @__PURE__ */ import_react30.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3" }, /* @__PURE__ */ import_react30.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react30.default.createElement("div", { className: "w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center" }, /* @__PURE__ */ import_react30.default.createElement(Terminal, { className: "w-4 h-4 text-amber-400" })), /* @__PURE__ */ import_react30.default.createElement("div", null, /* @__PURE__ */ import_react30.default.createElement("h2", { className: "text-sm sm:text-base font-extrabold text-white" }, "System Prompts & Negative Constraints"), /* @__PURE__ */ import_react30.default.createElement("p", { className: "text-xs text-stone-400" }, "Production AI instructions injected into Gemini image calls"))), savedMsg && /* @__PURE__ */ import_react30.default.createElement("span", { className: "text-xs text-emerald-400 font-bold flex items-center gap-1" }, /* @__PURE__ */ import_react30.default.createElement(CheckCircle2, { className: "w-3.5 h-3.5" }), " ", savedMsg)), /* @__PURE__ */ import_react30.default.createElement("div", { className: "space-y-1.5" }, /* @__PURE__ */ import_react30.default.createElement("label", { className: "text-xs font-bold text-stone-300" }, "Choose Tool to Edit Prompt:"), /* @__PURE__ */ import_react30.default.createElement(
    "select",
    {
      value: selectedType,
      onChange: (e) => {
        setSelectedType(e.target.value);
        setSavedMsg("");
      },
      className: "w-full h-9 bg-stone-950 border border-white/10 rounded-xl px-3 text-xs text-white font-mono"
    },
    catalog.map((c) => /* @__PURE__ */ import_react30.default.createElement("option", { key: c.task_type, value: c.task_type }, c.label, " (", c.task_type, ")"))
  )), /* @__PURE__ */ import_react30.default.createElement("div", { className: "space-y-3 pt-1" }, /* @__PURE__ */ import_react30.default.createElement("div", null, /* @__PURE__ */ import_react30.default.createElement("label", { className: "block text-xs font-bold text-stone-400 mb-1" }, "System Instructions Prompt"), /* @__PURE__ */ import_react30.default.createElement(
    "textarea",
    {
      value: currentPrompt.system_text || "",
      onChange: (e) => setField("system_text", e.target.value),
      rows: 2,
      className: "w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs text-white font-sans leading-relaxed"
    }
  )), /* @__PURE__ */ import_react30.default.createElement("div", null, /* @__PURE__ */ import_react30.default.createElement("label", { className: "block text-xs font-bold text-stone-400 mb-1" }, "Role / Persona Text Prompt"), /* @__PURE__ */ import_react30.default.createElement(
    "textarea",
    {
      value: currentPrompt.role_text || "",
      onChange: (e) => setField("role_text", e.target.value),
      rows: 3,
      className: "w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs text-white font-sans leading-relaxed"
    }
  )), /* @__PURE__ */ import_react30.default.createElement("div", null, /* @__PURE__ */ import_react30.default.createElement("label", { className: "block text-xs font-bold text-stone-400 mb-1" }, "Negative Constraints Prompt"), /* @__PURE__ */ import_react30.default.createElement(
    "textarea",
    {
      value: currentPrompt.negative_text || "",
      onChange: (e) => setField("negative_text", e.target.value),
      rows: 2,
      className: "w-full bg-stone-950 border border-white/10 rounded-xl p-3 text-xs text-rose-300 font-sans leading-relaxed"
    }
  )), /* @__PURE__ */ import_react30.default.createElement("div", { className: "flex items-center justify-between pt-2" }, /* @__PURE__ */ import_react30.default.createElement("label", { className: "flex items-center gap-2 text-xs text-stone-300 font-bold cursor-pointer" }, /* @__PURE__ */ import_react30.default.createElement(
    "input",
    {
      type: "checkbox",
      checked: !!currentPrompt.enabled,
      onChange: (e) => setField("enabled", e.target.checked),
      className: "rounded border-white/20 text-amber-400"
    }
  ), /* @__PURE__ */ import_react30.default.createElement("span", null, "Enable this prompt for worker execution")), /* @__PURE__ */ import_react30.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleSavePrompt,
      disabled: saving,
      className: "h-9 px-5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-400/20 active:scale-98 transition-all disabled:opacity-50"
    },
    saving ? /* @__PURE__ */ import_react30.default.createElement(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ import_react30.default.createElement(Save, { className: "w-3.5 h-3.5" }),
    /* @__PURE__ */ import_react30.default.createElement("span", null, "Save Prompt Row")
  ))));
}

// src/components/catalog/CatalogScreen.jsx
function CatalogScreen() {
  return /* @__PURE__ */ import_react31.default.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ import_react31.default.createElement(CatalogViewer, null), /* @__PURE__ */ import_react31.default.createElement(PromptManager, null));
}

// src/components/auth/LoginScreen.jsx
var import_react32 = __toESM(require_react());
function LoginScreen() {
  const { sb } = useAdmin();
  const [email, setEmail] = (0, import_react32.useState)("admin@aistudio.local");
  const [password, setPassword] = (0, import_react32.useState)("Admin@123456");
  const [loading, setLoading] = (0, import_react32.useState)(false);
  const [errorMsg, setErrorMsg] = (0, import_react32.useState)("");
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error)
        setErrorMsg(error.message || "Login fail hua. Credentials check karein.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleGuestLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await sb.auth.signInAnonymously();
      if (error)
        setErrorMsg(error.message || "Guest login fail hua.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ import_react32.default.createElement("div", { className: "min-h-screen bg-[#07080d] flex items-center justify-center p-4" }, /* @__PURE__ */ import_react32.default.createElement("div", { className: "w-full max-w-md bg-[#0e1320] border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn" }, /* @__PURE__ */ import_react32.default.createElement("div", { className: "text-center space-y-2" }, /* @__PURE__ */ import_react32.default.createElement("div", { className: "w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 mx-auto flex items-center justify-center shadow-lg shadow-amber-400/20" }, /* @__PURE__ */ import_react32.default.createElement(Shield, { className: "w-6 h-6 text-slate-950 font-black" })), /* @__PURE__ */ import_react32.default.createElement("h2", { className: "text-lg sm:text-xl font-extrabold text-white tracking-tight" }, "AI Studio Admin Fleet"), /* @__PURE__ */ import_react32.default.createElement("p", { className: "text-xs text-slate-400" }, "Sign in with authorized administrator credentials")), errorMsg && /* @__PURE__ */ import_react32.default.createElement("div", { className: "p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2" }, /* @__PURE__ */ import_react32.default.createElement(AlertCircle, { className: "w-4 h-4 shrink-0 text-rose-400" }), /* @__PURE__ */ import_react32.default.createElement("span", null, errorMsg)), /* @__PURE__ */ import_react32.default.createElement("form", { onSubmit: handleLogin, className: "space-y-4" }, /* @__PURE__ */ import_react32.default.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ import_react32.default.createElement("label", { className: "block text-xs font-bold text-slate-300" }, "Admin Email"), /* @__PURE__ */ import_react32.default.createElement(
    "input",
    {
      type: "email",
      required: true,
      value: email,
      onChange: (e) => setEmail(e.target.value),
      className: "w-full h-10 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
    }
  )), /* @__PURE__ */ import_react32.default.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ import_react32.default.createElement("label", { className: "block text-xs font-bold text-slate-300" }, "Password"), /* @__PURE__ */ import_react32.default.createElement(
    "input",
    {
      type: "password",
      required: true,
      value: password,
      onChange: (e) => setPassword(e.target.value),
      className: "w-full h-10 bg-[#080b12] border border-slate-700 rounded-xl px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
    }
  )), /* @__PURE__ */ import_react32.default.createElement(
    "button",
    {
      type: "submit",
      disabled: loading,
      className: "w-full h-11 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-98 transition-all disabled:opacity-50"
    },
    loading ? /* @__PURE__ */ import_react32.default.createElement(Loader2, { className: "w-4 h-4 animate-spin text-slate-950" }) : /* @__PURE__ */ import_react32.default.createElement(LogIn, { className: "w-4 h-4" }),
    /* @__PURE__ */ import_react32.default.createElement("span", null, "Sign In to Admin Fleet")
  )), /* @__PURE__ */ import_react32.default.createElement("div", { className: "pt-2 border-t border-slate-800 text-center" }, /* @__PURE__ */ import_react32.default.createElement(
    "button",
    {
      type: "button",
      onClick: handleGuestLogin,
      disabled: loading,
      className: "text-xs text-slate-400 hover:text-amber-300 underline font-mono transition-colors"
    },
    "Guest Admin Demo Sign In \u2192"
  ))));
}

// src/AdminApp.jsx
function AdminContent() {
  const { session, isAdmin, screen, msg, setMsg } = useAdmin();
  if (!session || !isAdmin) {
    return /* @__PURE__ */ import_react33.default.createElement(LoginScreen, null);
  }
  const renderActiveScreen = () => {
    switch (screen) {
      case "apps":
        return /* @__PURE__ */ import_react33.default.createElement(AppsDashboard, null);
      case "builder":
        return /* @__PURE__ */ import_react33.default.createElement(ToolBuilder, null);
      case "tools":
        return /* @__PURE__ */ import_react33.default.createElement(ToolsScreen, null);
      case "workers":
        return /* @__PURE__ */ import_react33.default.createElement(WorkersScreen, null);
      case "features":
        return /* @__PURE__ */ import_react33.default.createElement(CatalogScreen, null);
      case "task":
      default:
        return /* @__PURE__ */ import_react33.default.createElement(StudioScreen, null);
    }
  };
  return /* @__PURE__ */ import_react33.default.createElement("div", { className: "min-h-screen bg-[#07080d] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950" }, /* @__PURE__ */ import_react33.default.createElement(Header, null), msg && /* @__PURE__ */ import_react33.default.createElement(
    Toast,
    {
      message: msg,
      onClose: () => setMsg("")
    }
  ), /* @__PURE__ */ import_react33.default.createElement("main", { className: "flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 sm:py-6" }, renderActiveScreen()));
}
function AdminApp() {
  return /* @__PURE__ */ import_react33.default.createElement(AdminProvider, null, /* @__PURE__ */ import_react33.default.createElement(AdminContent, null));
}
var AdminApp_default = AdminApp;
export {
  AdminApp,
  AdminApp_default as default
};
/*! Bundled license information:

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
