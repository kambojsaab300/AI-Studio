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
        function createContext(defaultValue) {
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
        function useContext(Context) {
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
        function useState2(initialState) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useState(initialState);
        }
        function useReducer(reducer, initialArg, init) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useReducer(reducer, initialArg, init);
        }
        function useRef2(initialValue) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useRef(initialValue);
        }
        function useEffect2(create, deps) {
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
        function useCallback2(callback, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useCallback(callback, deps);
        }
        function useMemo(create, deps) {
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
        function checkPropTypes(typeSpecs, values, location2, componentName, element) {
          {
            var has = Function.call.bind(hasOwnProperty);
            for (var typeSpecName in typeSpecs) {
              if (has(typeSpecs, typeSpecName)) {
                var error$1 = void 0;
                try {
                  if (typeof typeSpecs[typeSpecName] !== "function") {
                    var err = Error((componentName || "React class") + ": " + location2 + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                    err.name = "Invariant Violation";
                    throw err;
                  }
                  error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location2, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                } catch (ex) {
                  error$1 = ex;
                }
                if (error$1 && !(error$1 instanceof Error)) {
                  setCurrentlyValidatingElement(element);
                  error("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location2, typeSpecName, typeof error$1);
                  setCurrentlyValidatingElement(null);
                }
                if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
                  loggedTypeFailures[error$1.message] = true;
                  setCurrentlyValidatingElement(element);
                  error("Failed %s type: %s", location2, error$1.message);
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
        exports.createContext = createContext;
        exports.createElement = createElement$1;
        exports.createFactory = createFactory;
        exports.createRef = createRef;
        exports.forwardRef = forwardRef2;
        exports.isValidElement = isValidElement;
        exports.lazy = lazy;
        exports.memo = memo;
        exports.startTransition = startTransition;
        exports.unstable_act = act;
        exports.useCallback = useCallback2;
        exports.useContext = useContext;
        exports.useDebugValue = useDebugValue;
        exports.useDeferredValue = useDeferredValue;
        exports.useEffect = useEffect2;
        exports.useId = useId;
        exports.useImperativeHandle = useImperativeHandle;
        exports.useInsertionEffect = useInsertionEffect;
        exports.useLayoutEffect = useLayoutEffect;
        exports.useMemo = useMemo;
        exports.useReducer = useReducer;
        exports.useRef = useRef2;
        exports.useState = useState2;
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

// app/AI Studio Worker.jsx
var import_react2 = __toESM(require_react());

// ../node_modules/lucide-react/dist/esm/createLucideIcon.mjs
var import_react = __toESM(require_react(), 1);

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
  const Component = (0, import_react.forwardRef)(
    ({ color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, children, ...rest }, ref) => (0, import_react.createElement)(
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
        ...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)),
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

// ../node_modules/lucide-react/dist/esm/icons/cpu.mjs
var Cpu = createLucideIcon$1("Cpu", [
  [
    "rect",
    { x: "4", y: "4", width: "16", height: "16", rx: "2", key: "1vbyd7" }
  ],
  ["rect", { x: "9", y: "9", width: "6", height: "6", key: "o3kz5p" }],
  ["path", { d: "M15 2v2", key: "13l42r" }],
  ["path", { d: "M15 20v2", key: "15mkzm" }],
  ["path", { d: "M2 15h2", key: "1gxd5l" }],
  ["path", { d: "M2 9h2", key: "1bbxkp" }],
  ["path", { d: "M20 15h2", key: "19e6y8" }],
  ["path", { d: "M20 9h2", key: "19tzq7" }],
  ["path", { d: "M9 2v2", key: "165o2o" }],
  ["path", { d: "M9 20v2", key: "i2bqo8" }]
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

// app/AI Studio Worker.jsx
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
function getEffectiveApiUrl(providedUrl) {
  if (typeof window !== "undefined") {
    const queryApi = new URLSearchParams(window.location.search).get("api");
    if (queryApi) {
      try {
        localStorage.setItem("aistudio_api_url", queryApi);
      } catch {
      }
      return queryApi.replace(/\/$/, "");
    }
    try {
      const savedApi = localStorage.getItem("aistudio_api_url");
      if (savedApi) {
        if (savedApi.includes("trycloudflare.com")) {
          try {
            localStorage.removeItem("aistudio_api_url");
          } catch {
          }
        } else {
          return (savedApi === "http://aistudio.runasp.net" ? "https://aistudio.runasp.net" : savedApi).replace(/\/$/, "");
        }
      }
    } catch {
    }
    if (providedUrl) {
      return providedUrl.replace(/\/$/, "");
    }
  }
  return (providedUrl || "https://aistudio.runasp.net").replace(/\/$/, "");
}
function createClient(apiUrl = "https://aistudio.runasp.net", apiKey = "") {
  const url = getEffectiveApiUrl(apiUrl);
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
    apiUrl: url,
    auth: {
      async signInWithPassword({ email, password }) {
        try {
          const res = await fetch(`${url}/api/auth/login`, {
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
          const res = await fetch(`${url}/api/auth/signup`, {
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
      return new ApiQueryBuilder(url, table, token);
    },
    async rpc(functionName, params = {}) {
      try {
        const res = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
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
      const ch = {
        name,
        on() {
          return ch;
        },
        subscribe() {
          return ch;
        }
      };
      return ch;
    },
    removeChannel() {
    }
  };
}
var API_URL = "https://aistudio.runasp.net";
var USE_REALTIME = location.protocol !== "blob:";
var API_KEY = "aistudio_worker_local_key";
function everyMs(fn, delayOf) {
  let t;
  const tick = () => {
    fn();
    t = setTimeout(tick, delayOf());
  };
  t = setTimeout(tick, delayOf());
  return () => clearTimeout(t);
}
var GEMINI_KEY_STORAGE = "gemini_api_key";
var GEMINI_API_KEY = "";
var validGeminiKey = (k) => /^AIza[0-9A-Za-z_-]{30,}$/.test((k || "").trim());
var RUNTIME = {
  match_model: "gemini-3-flash-preview",
  match_threshold: 70,
  // face score below this -> generate again
  match_retries: 2,
  gemini_base: "https://generativelanguage.googleapis.com/v1beta/models",
  imgbb_upload_url: "https://api.imgbb.com/1/upload",
  stale_ms: 10 * 60 * 1e3,
  // a stuck task older than this can be picked again
  heartbeat_ms: 5e3,
  // "I am alive" every 5 s (and reads the paused flag)
  fallback_ms: 2e3,
  // polls & fetches new tasks from DB every 2 s!
  image_max_side: 2048,
  image_quality: 0.85,
  model_caps: {}
  // filled from ai_studio_models (kind, label, aspects, sizes)
};
function applyRuntime(d) {
  RUNTIME = {
    match_model: d.match_model || RUNTIME.match_model,
    match_threshold: d.match_threshold ?? RUNTIME.match_threshold,
    match_retries: d.match_retries ?? RUNTIME.match_retries,
    gemini_base: d.gemini_base || RUNTIME.gemini_base,
    imgbb_upload_url: d.imgbb_upload_url || RUNTIME.imgbb_upload_url,
    stale_ms: (d.stale_min ?? 10) * 60 * 1e3,
    heartbeat_ms: (d.heartbeat_sec ?? 5) * 1e3,
    fallback_ms: (d.fallback_sec ?? 2) * 1e3,
    image_max_side: d.image_max_side ?? RUNTIME.image_max_side,
    image_quality: d.image_quality ?? RUNTIME.image_quality,
    model_caps: d.model_caps || RUNTIME.model_caps
  };
}
var DEFAULT_SETTINGS = { task_concurrency: 20, gemini_concurrency: 8, photos_per_task_max: 50, max_attempts: 2, retry_delay_sec: 30, task_timeout_sec: 300, budget_left: null, disabled_models: [], cloudinary_enabled: true, cloudinary_cloud_name: "draaqjcre", cloudinary_upload_preset: "ml_default", imgbb_enabled: false, imgbb_api_key: "", worker_recycle_after_tasks: 50 };
var API = {
  REGISTER_WORKER: "register_ai_studio_worker",
  // GET a worker id: worker_1, worker_2 ...
  HEARTBEAT: "worker_heartbeat",
  // "I am alive". Returns paused (true / false)
  RELEASE_WORKER: "worker_release",
  // tab closing: give my tasks back
  GET_PENDING: "get_pending_for_worker",
  // GET the tasks that are ready to run for this worker's tools
  CLAIM_TASK: "claim_ai_studio_task",
  // take ONE task (only one worker gets it)
  SAVE_RESULT: "worker_complete_task",
  // UPLOAD my result (or failure) for my task
  GET_CONFIG: "get_worker_config",
  // GET limits, upload settings and keys
  GET_PROMPTS: "get_task_prompts",
  // GET the task prompts (from the ai_studio_prompts table)
  GET_CATALOG: "get_task_catalog",
  // GET the task types: names, photo slots, rules (from ai_studio_task_catalog)
  GET_FAMILY_ROLES: "get_family_roles",
  // GET the family photo roles, in order (from ai_studio_family_roles)
  AUTO_PAUSE: "worker_auto_pause",
  // pause myself (too many failures, bad key)
  TAKE_BUDGET: "worker_budget_take"
  // use one Gemini call from today's budget
};
var TABLES = {
  TASKS: "ai_studio_tasks",
  // GET my tasks
  WORKERS: "ai_studio_workers",
  // realtime: is my pause flag changed?
  SETTINGS: "ai_studio_settings",
  // GET the limits (one row)
  PROMPTS: "ai_studio_prompts",
  // realtime: prompt changed
  CATALOG: "ai_studio_task_catalog",
  // realtime: task type changed
  FAMILY_ROLES: "ai_studio_family_roles",
  // realtime: family role changed
  MODELS: "ai_studio_models"
  // realtime: model changed
};
var TASK_TYPES = {};
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
    faceCheck: !!r.face_check,
    edit: !!r.edit,
    transparentOut: !!r.transparent,
    angles: r.angles || null,
    family: !!r.family,
    perPhoto: !!r.per_photo
  };
}
function setTaskTypes(rows) {
  Object.keys(TASK_TYPES).forEach((k) => delete TASK_TYPES[k]);
  (rows || []).forEach((r) => {
    TASK_TYPES[r.task_type] = toTaskType(r);
  });
}
var INPUT_LABEL = { face: "Face reference", style: "Style / outfit reference", input: "Input photo" };
var INPUT_COLUMN = { face: "face_image_url", style: "style_image_url", input: "input_image_url" };
var labelFor = (type, key) => type.labels?.[key] || INPUT_LABEL[key];
var loadApiClient = () => Promise.resolve({ createClient });
var createLimiter = (max) => {
  let active = 0;
  const queue = [];
  const cap = () => typeof max === "function" ? max() : max;
  const next = () => {
    if (active >= cap() || queue.length === 0)
      return;
    active++;
    const { task, resolve, reject } = queue.shift();
    task().then(resolve, reject).finally(() => {
      active--;
      next();
    });
  };
  return (task) => new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    next();
  });
};
var inputCache = /* @__PURE__ */ new Map();
function cleanTaskCache(task) {
  if (!task)
    return;
  const urls = [
    task.input_image_url,
    task.face_image_url,
    task.style_image_url,
    ...task.extra_image_urls || []
  ].filter(Boolean);
  for (const u of urls) {
    inputCache.delete(u);
  }
}
function purgeAllMemory() {
  inputCache.clear();
  if (typeof window !== "undefined" && window.gc) {
    try {
      window.gc();
    } catch {
    }
  }
}
function getMemoryStats() {
  if (typeof window !== "undefined" && window.performance && window.performance.memory) {
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = window.performance.memory;
    return {
      usedMB: Math.round(usedJSHeapSize / (1024 * 1024)),
      totalMB: Math.round(totalJSHeapSize / (1024 * 1024)),
      limitMB: Math.round(jsHeapSizeLimit / (1024 * 1024)),
      supported: true
    };
  }
  return {
    usedMB: 0,
    totalMB: 0,
    limitMB: 0,
    cacheCount: inputCache.size,
    supported: false
  };
}
async function urlToBase64(url) {
  if (!url)
    return "";
  if (inputCache.has(url))
    return inputCache.get(url);
  if (typeof url === "string" && url.startsWith("data:")) {
    const parts = url.split(",");
    const b642 = parts[1] || parts[0];
    inputCache.set(url, b642);
    return b642;
  }
  const blob = await (await fetch(url)).blob();
  const b64 = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  inputCache.set(url, b64);
  if (inputCache.size > 20)
    inputCache.delete(inputCache.keys().next().value);
  return b64;
}
async function uploadDataUrlToCloudinary(dataUrl, cfg) {
  const fd = new FormData();
  fd.append("file", dataUrl);
  fd.append("upload_preset", cfg.cloudinary_upload_preset);
  const url = `https://api.cloudinary.com/v1_1/${cfg.cloudinary_cloud_name}/image/upload`;
  const data = await (await fetch(url, { method: "POST", body: fd })).json();
  if (!data.secure_url)
    throw new Error(data.error?.message || "Cloudinary upload failed");
  return data.secure_url;
}
async function uploadToImgbb(dataUrl, key) {
  if (!key)
    throw new Error("ImgBB key nahi di");
  const fd = new FormData();
  fd.append("key", key);
  fd.append("image", dataUrl.split(",")[1]);
  const data = await (await fetch(RUNTIME.imgbb_upload_url, { method: "POST", body: fd })).json();
  if (!data.success)
    throw new Error(data.error?.message || "ImgBB upload failed");
  return data.data.url;
}
var FAMILY_ROLES = [];
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
    throw new Error(`Is kaam ka prompt DB mein nahi ya band hai: ${task.task_type}`);
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
  if (task.angle)
    text += `
Camera angle for this photo: ${task.angle}.`;
  if (TASK_TYPES[task.task_type].output === "image")
    text += `
Aspect ratio: ${task.aspect_ratio}.`;
  return text;
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load nahi hui"));
    img.src = src;
  });
}
async function compositeEdit(photoB64, maskB64, generatedDataUrl) {
  const [photo, mask, gen] = await Promise.all([
    loadImage(`data:image/jpeg;base64,${photoB64}`),
    loadImage(`data:image/jpeg;base64,${maskB64}`),
    loadImage(generatedDataUrl)
  ]);
  const w = photo.naturalWidth;
  const h = photo.naturalHeight;
  const pixelsOf = (img) => {
    const c2 = document.createElement("canvas");
    c2.width = w;
    c2.height = h;
    const x = c2.getContext("2d", { willReadFrequently: true });
    x.drawImage(img, 0, 0, w, h);
    const data = x.getImageData(0, 0, w, h).data;
    c2.width = 0;
    c2.height = 0;
    img.src = "";
    return data;
  };
  const orig = pixelsOf(photo);
  const edited = pixelsOf(gen);
  const maskPx = pixelsOf(mask);
  const out = new ImageData(w, h);
  for (let i = 0; i < orig.length; i += 4) {
    const a = maskPx[i] / 255;
    for (let k = 0; k < 3; k++)
      out.data[i + k] = orig[i + k] * (1 - a) + edited[i + k] * a;
    out.data[i + 3] = 255;
  }
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d").putImageData(out, 0, 0);
  const result = c.toDataURL("image/jpeg", 0.92);
  c.width = 0;
  c.height = 0;
  return result;
}
async function shrinkDataUrl(dataUrl) {
  const img = await loadImage(dataUrl);
  const k = Math.min(1, RUNTIME.image_max_side / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const result = c.toDataURL("image/jpeg", RUNTIME.image_quality);
  c.width = 0;
  c.height = 0;
  img.src = "";
  return result;
}
async function knockoutWhite(dataUrl) {
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < px.data.length; i += 4) {
    const min = Math.min(px.data[i], px.data[i + 1], px.data[i + 2]);
    if (min >= 240)
      px.data[i + 3] = 0;
    else if (min >= 215)
      px.data[i + 3] = Math.round((240 - min) / 25 * 255);
  }
  ctx.putImageData(px, 0, 0);
  const result = c.toDataURL("image/png");
  c.width = 0;
  c.height = 0;
  img.src = "";
  return result;
}
async function callAiStudio(task, inputs, apiKey, promptRow) {
  let type = TASK_TYPES[task.task_type];
  if (!type && sbRef.current) {
    await loadSettings(sbRef.current);
    type = TASK_TYPES[task.task_type];
  }
  if (!type)
    throw new Error(`Task type galat hai: ${task.task_type}`);
  const isImage = type.output === "image";
  if (isImage) {
    const caps = RUNTIME.model_caps[task.model];
    if (!caps || caps.kind !== "image")
      throw new Error(`Image model nahi hai: ${task.model}`);
    if (!caps.aspects.includes(task.aspect_ratio))
      throw new Error(`${task.model} mein aspect ratio ${task.aspect_ratio} support nahi`);
    if (task.image_size && !caps.sizes.includes(task.image_size))
      throw new Error(`${task.model} mein size ${task.image_size} support nahi`);
  }
  const parts = [{ text: instructionFor(task, promptRow) }];
  for (const key of ["face", "style", "input"]) {
    if (inputs[key])
      parts.push({ inlineData: { mimeType: "image/jpeg", data: inputs[key] } });
  }
  for (const extra of inputs.extras || []) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: extra } });
  }
  const contents = [
    ...(task.history || []).flatMap((h) => [
      { role: "user", parts: [{ text: h.prompt }] },
      { role: "model", parts: [{ text: h.output_text }] }
    ]),
    { role: "user", parts }
  ];
  const body = { contents };
  if (isImage) {
    body.generationConfig = {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: task.aspect_ratio, ...task.image_size ? { imageSize: task.image_size } : {} }
    };
  }
  const url = `${RUNTIME.gemini_base}/${task.model}:generateContent?key=${apiKey}`;
  let data = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      data = await res.json();
      if (!res.ok) {
        const err = new Error(data.error?.message || `HTTP ${res.status}`);
        if ([400, 401, 403, 404].includes(res.status))
          err.retry = false;
        throw err;
      }
      break;
    } catch (err) {
      if (err.retry === false || attempt === 4)
        throw err;
      await new Promise((r) => setTimeout(r, 1e3 * 2 ** attempt));
    }
  }
  if (data.promptFeedback?.blockReason)
    throw new Error(`Prompt block hua: ${data.promptFeedback.blockReason}`);
  const cand = data.candidates?.[0];
  const finish = cand?.finishReason ? ` (finishReason: ${cand.finishReason})` : "";
  if (isImage) {
    const imgPart = cand?.content?.parts?.find((p) => p.inlineData);
    if (!imgPart)
      throw new Error(`Image nahi aayi${finish}`);
    const mimeType = imgPart.inlineData.mimeType || "image/png";
    return { image: { dataUrl: `data:${mimeType};base64,${imgPart.inlineData.data}`, mimeType } };
  }
  const text = (cand?.content?.parts || []).map((p) => p.text || "").join("").trim();
  if (!text)
    throw new Error(`Text nahi aaya${finish}`);
  return { text };
}
async function checkFaceMatch(faceB64, outputB64, apiKey) {
  const body = {
    contents: [{ role: "user", parts: [
      { text: 'IMAGE 1 and IMAGE 2: are they the same person (same face)? Return only JSON: {"score": <0-100>}, where 100 = identical face.' },
      { inlineData: { mimeType: "image/jpeg", data: faceB64 } },
      { inlineData: { mimeType: "image/jpeg", data: outputB64 } }
    ] }],
    generationConfig: { responseMimeType: "application/json" }
  };
  try {
    const res = await fetch(`${RUNTIME.gemini_base}/${RUNTIME.match_model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    const score = Number(JSON.parse(text).score);
    return Number.isFinite(score) ? score : null;
  } catch {
    return null;
  }
}
var withTimeout = (promise, ms) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Timeout: ${ms / 1e3} second se zyada chala`)), ms);
  promise.then(
    (value) => {
      clearTimeout(timer);
      resolve(value);
    },
    (err) => {
      clearTimeout(timer);
      reject(err);
    }
  );
});
function AiStudioWorker() {
  const [apiKey, setApiKey] = (0, import_react2.useState)(API_KEY);
  const [customApiUrl, setCustomApiUrl] = (0, import_react2.useState)(() => getEffectiveApiUrl(API_URL));
  const [aiStudioKey, setAiStudioKey] = (0, import_react2.useState)(() => {
    const first = (localStorage.getItem(GEMINI_KEY_STORAGE) || "").trim();
    if (validGeminiKey(first))
      return first;
    return (localStorage.getItem("ai_studio_api_key") || "").trim();
  });
  const [keyDraft, setKeyDraft] = (0, import_react2.useState)("");
  const [keyMsg, setKeyMsg] = (0, import_react2.useState)("");
  const saveGeminiKey = () => {
    const k = keyDraft.trim();
    if (!validGeminiKey(k))
      return setKeyMsg("Key galat hai. AIza se shuru honi chahiye.");
    localStorage.setItem(GEMINI_KEY_STORAGE, k);
    setAiStudioKey(k);
    setKeyDraft("");
    setKeyMsg("");
  };
  const [sb, setSb] = (0, import_react2.useState)(null);
  const [workerId, setWorkerId] = (0, import_react2.useState)("");
  const [paused, setPaused] = (0, import_react2.useState)(false);
  const [drain, setDrain] = (0, import_react2.useState)(false);
  const [settings, setSettings] = (0, import_react2.useState)(DEFAULT_SETTINGS);
  const [myTasks, setMyTasks] = (0, import_react2.useState)([]);
  const [logs, setLogs] = (0, import_react2.useState)([]);
  const MAX_LOGS = 30;
  const log = (0, import_react2.useCallback)((text) => {
    setLogs((prev) => {
      if (prev.length >= MAX_LOGS) {
        return [
          { t: (/* @__PURE__ */ new Date()).toLocaleTimeString(), text },
          { t: (/* @__PURE__ */ new Date()).toLocaleTimeString(), text: "\u26A1 [Auto-Clear] 30 logs limit reached: Screen logs reset ho gaye" }
        ];
      }
      return [{ t: (/* @__PURE__ */ new Date()).toLocaleTimeString(), text }, ...prev];
    });
  }, []);
  (0, import_react2.useEffect)(() => {
    if (logs.length >= 30) {
      const timer = setTimeout(() => {
        setLogs([
          { t: (/* @__PURE__ */ new Date()).toLocaleTimeString(), text: "\u26A1 [Auto-Clear] 30 logs pure ho gaye: Screen logs auto-clear ho gaye" }
        ]);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [logs.length]);
  const [running, setRunning] = (0, import_react2.useState)(0);
  const [refreshIntervalSec, setRefreshIntervalSec] = (0, import_react2.useState)(() => Math.round(RUNTIME.fallback_ms / 1e3) || 2);
  const [nextDbSec, setNextDbSec] = (0, import_react2.useState)(() => Math.round(RUNTIME.fallback_ms / 1e3) || 2);
  const [lastDbFetch, setLastDbFetch] = (0, import_react2.useState)("");
  const [memStats, setMemStats] = (0, import_react2.useState)(() => getMemoryStats());
  (0, import_react2.useEffect)(() => {
    const checkMemory = () => {
      const stats = getMemoryStats();
      setMemStats(stats);
      if (stats.supported && stats.usedMB > 150 || inputCache.size > 20) {
        const countBefore = inputCache.size;
        const ramBefore = stats.usedMB;
        purgeAllMemory();
        const newStats = getMemoryStats();
        setMemStats(newStats);
        log(`[Auto-RAM Purge] RAM ${ramBefore}MB high tha. Caches saaf hue (${countBefore} items). RAM ab: ${newStats.usedMB || "OK"}MB`);
      }
    };
    const timer = setInterval(checkMemory, 3e3);
    return () => clearInterval(timer);
  }, [log]);
  const sbRef2 = (0, import_react2.useRef)(null);
  const workerIdRef = (0, import_react2.useRef)("");
  const pausedRef = (0, import_react2.useRef)(false);
  const drainRef = (0, import_react2.useRef)(false);
  const failStreakRef = (0, import_react2.useRef)(0);
  const sessionTasksDoneRef = (0, import_react2.useRef)(0);
  const [sessionTasksDone, setSessionTasksDone] = (0, import_react2.useState)(0);
  const settingsRef = (0, import_react2.useRef)(DEFAULT_SETTINGS);
  const promptsRef = (0, import_react2.useRef)({});
  const seenLimitRef = (0, import_react2.useRef)(null);
  const kickRef = (0, import_react2.useRef)(() => {
  });
  const refreshRef = (0, import_react2.useRef)(() => {
  });
  const inFlight = (0, import_react2.useRef)(/* @__PURE__ */ new Set());
  const retryAfterMap = (0, import_react2.useRef)(/* @__PURE__ */ new Map());
  const connectingRef = (0, import_react2.useRef)(false);
  const taskLimiter = (0, import_react2.useRef)(createLimiter(() => settingsRef.current.task_concurrency)).current;
  const geminiLimiter = (0, import_react2.useRef)(createLimiter(() => settingsRef.current.gemini_concurrency)).current;
  sbRef2.current = sb;
  (0, import_react2.useEffect)(() => {
    if (!sb)
      return;
    const timer = setInterval(() => {
      setNextDbSec((prev) => prev > 1 ? prev - 1 : refreshIntervalSec);
    }, 1e3);
    return () => clearInterval(timer);
  }, [sb, refreshIntervalSec]);
  (0, import_react2.useEffect)(() => {
    const timer = setInterval(() => setLogs([]), 10 * 60 * 1e3);
    return () => clearInterval(timer);
  }, []);
  const [myTab, setMyTab] = (0, import_react2.useState)("pending");
  const [myPage, setMyPage] = (0, import_react2.useState)(0);
  const [myRows, setMyRows] = (0, import_react2.useState)([]);
  const [myCounts, setMyCounts] = (0, import_react2.useState)({});
  const MY_PAGE_SIZE = 10;
  const loadMyTasks = (0, import_react2.useCallback)(async (tab, page) => {
    const client = sbRef2.current;
    if (!client || !workerIdRef.current)
      return;
    const from = page * MY_PAGE_SIZE;
    const { data, error, count } = await client.from(TABLES.TASKS).select("id, task_type, model, status, error, output_text, output_image_url, imgbb_image_urls, face_match_score, batch_count, created_at", { count: "exact" }).eq("worker_id", workerIdRef.current).eq("status", tab).order("id", { ascending: false }).range(from, from + MY_PAGE_SIZE - 1);
    if (error)
      return log("Tasks load error: " + error.message);
    setMyRows(data || []);
    setMyCounts((prev) => ({ ...prev, [tab]: count ?? 0 }));
  }, [log]);
  const pickTab = (tab) => {
    setMyTab(tab);
    setMyPage(0);
    loadMyTasks(tab, 0);
  };
  const goPage = (page) => {
    setMyPage(page);
    loadMyTasks(myTab, page);
  };
  refreshRef.current = () => {
  };
  const loadSettings2 = async (client) => {
    const { data: catalog } = await client.rpc(API.GET_CATALOG);
    if (catalog)
      setTaskTypes(catalog);
    const { data: roles } = await client.rpc(API.GET_FAMILY_ROLES);
    if (roles)
      FAMILY_ROLES = roles;
    const { data, error } = await client.rpc(API.GET_CONFIG, { p_worker_id: workerIdRef.current });
    if (error || !data)
      return;
    settingsRef.current = data;
    applyRuntime(data);
    setSettings(data);
    const fbSec = data?.fallback_sec || Math.round(RUNTIME.fallback_ms / 1e3) || 2;
    setRefreshIntervalSec(fbSec);
    setNextDbSec(fbSec);
    const { data: prompts } = await client.rpc(API.GET_PROMPTS, { p_worker_id: workerIdRef.current });
    if (prompts)
      promptsRef.current = Object.fromEntries(prompts.map((p) => [p.task_type, p]));
    kickRef.current();
  };
  const claim = async (id) => {
    const { data, error } = await sbRef2.current.rpc(API.CLAIM_TASK, { p_id: id, p_worker_id: workerIdRef.current });
    if (error)
      throw error;
    return (data || []).length > 0;
  };
  const complete = async (id, patch) => {
    const { data, error } = await sbRef2.current.rpc(API.SAVE_RESULT, { p_id: id, p_worker_id: workerIdRef.current, p_patch: patch });
    if (error)
      throw error;
    if (!data || data.length === 0)
      log(`Task #${id}: ownership nahi mili, result save nahi hua`);
  };
  const takeCall = async () => {
    const { data, error } = await sbRef2.current.rpc(API.TAKE_BUDGET, { p_worker_id: workerIdRef.current, p_calls: 1 });
    if (error)
      throw error;
    if (!data)
      throw new Error("Aaj ka Gemini budget khatam");
  };
  const askModel = (task, inputs) => geminiLimiter(async () => {
    await takeCall();
    return callAiStudio(task, inputs, GEMINI_API_KEY, promptsRef.current[task.task_type]);
  });
  const checkFace = (faceB64, outB64) => geminiLimiter(async () => {
    await takeCall();
    return checkFaceMatch(faceB64, outB64, GEMINI_API_KEY);
  });
  const makePhoto = async (task, inputs) => {
    let best = null;
    for (let attempt = 0; attempt <= RUNTIME.match_retries; attempt++) {
      const { image: generated } = await askModel(task, inputs);
      const type = TASK_TYPES[task.task_type];
      const image = type.edit ? { dataUrl: await compositeEdit(inputs.face, inputs.style, generated.dataUrl), mimeType: "image/jpeg" } : type.transparentOut ? { dataUrl: await knockoutWhite(generated.dataUrl), mimeType: "image/png" } : generated;
      const score2 = inputs.face && TASK_TYPES[task.task_type].faceCheck ? await checkFace(inputs.face, image.dataUrl.split(",")[1]) : null;
      if (!best || (score2 ?? 0) > (best.score ?? 0))
        best = { image, score: score2 };
      if (score2 === null || score2 >= RUNTIME.match_threshold)
        break;
    }
    const cfg = settingsRef.current;
    const isTransparent = TASK_TYPES[task.task_type].transparentOut;
    let fullDataUrl = best.image.dataUrl;
    let compressedDataUrl = isTransparent ? fullDataUrl : await shrinkDataUrl(fullDataUrl);
    if (!cfg.cloudinary_enabled && !cfg.imgbb_enabled) {
      fullDataUrl = null;
      compressedDataUrl = null;
      best = null;
      throw new Error("Admin ne upload band kar rakha hai");
    }
    let cloud = null;
    let imgbb = null;
    const uploads = [];
    if (cfg.cloudinary_enabled)
      uploads.push(uploadDataUrlToCloudinary(compressedDataUrl, cfg).then((u) => {
        cloud = u;
      }).catch(() => {
      }));
    if (cfg.imgbb_enabled)
      uploads.push(uploadToImgbb(fullDataUrl, cfg.imgbb_api_key).then((u) => {
        imgbb = u;
      }).catch(() => {
      }));
    await Promise.all(uploads);
    const score = best.score;
    fullDataUrl = null;
    compressedDataUrl = null;
    if (best.image)
      best.image.dataUrl = null;
    best = null;
    if (!cloud && !imgbb)
      throw new Error("Upload nahi hua: dono service fail");
    return { cloud, imgbb, score };
  };
  const autoPause = async (reason) => {
    if (pausedRef.current)
      return;
    pausedRef.current = true;
    setPaused(true);
    if (sbRef2.current && workerIdRef.current) {
      try {
        await sbRef2.current.rpc(API.AUTO_PAUSE, { p_worker_id: workerIdRef.current, p_reason: reason });
      } catch (err) {
        console.warn("AutoPause error:", err);
      }
    }
    log("Worker khud pause ho gaya: " + reason);
  };
  const failTask = async (task, err) => {
    const msg = err?.message || "Unknown error";
    const keyProblem = /HTTP 40[13]|API key|API_KEY|PERMISSION_DENIED/i.test(msg);
    const isValidationError = /chahiye|Task type galat|DB mein nahi|Prompt khali/i.test(msg);
    const cfg = settingsRef.current;
    const attempts = (task.attempts || 0) + 1;
    if (keyProblem) {
      log(`Task #${task.id} warning: Key problem (${msg.slice(0, 70)})`);
    }
    if (!keyProblem && !isValidationError && attempts < cfg.max_attempts) {
      const delaySec = cfg.retry_delay_sec || 30;
      const nextRun = new Date(Date.now() + delaySec * 1e3).toISOString();
      retryAfterMap.current.set(task.id, Date.now() + delaySec * 1e3);
      await complete(task.id, { status: "pending", attempts, next_run_at: nextRun, error: msg });
      log(`Task #${task.id}: fail, ${delaySec} second baad dobara (${attempts}/${cfg.max_attempts}): ${msg}`);
    } else {
      retryAfterMap.current.delete(task.id);
      await complete(task.id, { status: "failed", attempts, error: msg });
      log(`Task #${task.id}: fail: ${msg}`);
    }
  };
  const onTaskCompletedSuccess = () => {
    failStreakRef.current = 0;
    sessionTasksDoneRef.current += 1;
    const currentDone = sessionTasksDoneRef.current;
    setSessionTasksDone(currentDone);
    const recycleLimit = Number(settingsRef.current.worker_recycle_after_tasks) || 50;
    if (currentDone >= recycleLimit) {
      log(`[Auto-Recycle] ${currentDone}/${recycleLimit} tasks complete ho gaye! Logs aur cache clear karke fresh page reload hoga...`);
      setLogs([]);
      purgeAllMemory();
      sessionTasksDoneRef.current = 0;
      setSessionTasksDone(0);
      setTimeout(() => {
        if (inFlight.current.size === 0) {
          window.location.reload();
        }
      }, 1200);
    }
  };
  const processTask = async (task) => {
    const client = sbRef2.current;
    let inputs = {};
    try {
      let type = TASK_TYPES[task.task_type];
      if (!type) {
        console.log(`[Worker] Unknown task_type ${task.task_type}, refreshing catalog from database...`);
        await loadSettings2(client);
        type = TASK_TYPES[task.task_type];
      }
      if (!type)
        throw new Error(`Task type galat hai: ${task.task_type}`);
      for (const key of type.inputs) {
        if (type.optional?.includes(key))
          continue;
        if (!task[INPUT_COLUMN[key]])
          throw new Error(`${labelFor(type, key)} chahiye`);
      }
      if (type.promptRequired && !(task.prompt || "").trim())
        throw new Error("Prompt chahiye");
      let history = [];
      if (task.task_type === "chat" && task.conversation_id) {
        const { data: waiting, error: waitErr } = await client.from(TABLES.TASKS).select("id").eq("conversation_id", task.conversation_id).lt("id", task.id).in("status", ["pending", "processing"]).limit(1);
        if (waitErr)
          throw waitErr;
        if (waiting?.length) {
          await complete(task.id, { status: "pending" });
          log(`Task #${task.id}: pichhle message ka wait`);
          return;
        }
        const { data, error } = await client.from(TABLES.TASKS).select("prompt, output_text").eq("conversation_id", task.conversation_id).eq("status", "done").lt("id", task.id).order("id", { ascending: true });
        if (error)
          throw error;
        history = data || [];
      }
      inputs = {};
      const keys = type.inputs;
      const loaded = await Promise.all(keys.map((k) => urlToBase64(task[INPUT_COLUMN[k]])));
      keys.forEach((k, i) => {
        inputs[k] = loaded[i];
      });
      if (type.extras && !type.perPhoto && task.extra_image_urls?.length) {
        inputs.extras = await Promise.all(task.extra_image_urls.filter(Boolean).map(urlToBase64));
      }
      if (type.output === "text") {
        const result = await askModel({ ...task, history }, inputs);
        await complete(task.id, { status: "done", output_text: result.text });
        onTaskCompletedSuccess();
        log(`Task #${task.id}: text tayyar`);
        return;
      }
      if (type.perPhoto) {
        const maxBatch = settingsRef.current?.photos_per_task_max || 50;
        const photosIn = (task.extra_image_urls || []).filter(Boolean).slice(0, maxBatch);
        const done = await Promise.allSettled(photosIn.map(async (url) => {
          const b64 = await urlToBase64(url);
          return makePhoto(task, { extras: [b64] });
        }));
        const made = done.filter((r) => r.status === "fulfilled").map((r) => r.value);
        if (made.length === 0)
          throw new Error(done[0]?.reason?.message || "Koi photo nahi bani");
        const cloudOut = made.map((p) => p.cloud).filter(Boolean);
        const imgbbOut = made.map((p) => p.imgbb).filter(Boolean);
        await complete(task.id, {
          status: "done",
          output_image_url: cloudOut[0] || imgbbOut[0] || null,
          output_image_urls: cloudOut,
          imgbb_image_urls: imgbbOut,
          face_match_score: null
        });
        onTaskCompletedSuccess();
        log(`Task #${task.id}: ${made.length} / ${photosIn.length} photo bani`);
        return;
      }
      const count = Math.min(Math.max(task.batch_count || 1, 1), settingsRef.current.photos_per_task_max);
      const settled = await Promise.allSettled(Array.from({ length: count }, (_, idx) => makePhoto(type.angles ? { ...task, angle: type.angles[idx % type.angles.length] } : task, inputs)));
      const photos = settled.filter((r) => r.status === "fulfilled").map((r) => r.value);
      const failedPhotos = settled.filter((r) => r.status === "rejected");
      if (photos.length === 0)
        throw new Error(failedPhotos[0]?.reason?.message || "Koi photo nahi bani");
      if (failedPhotos.length)
        log(`Task #${task.id}: ${failedPhotos.length} photo fail, ${photos.length} save hui`);
      const cloudUrls = photos.map((p) => p.cloud).filter(Boolean);
      const imgbbUrls = photos.map((p) => p.imgbb).filter(Boolean);
      const scores = photos.map((p) => p.score).filter((s) => s != null);
      await complete(task.id, {
        status: "done",
        output_image_url: cloudUrls[0] || imgbbUrls[0] || null,
        output_image_urls: cloudUrls,
        imgbb_image_urls: imgbbUrls,
        face_match_score: scores.length ? Math.max(...scores) : null
      });
      onTaskCompletedSuccess();
      log(`Task #${task.id}: ${photos.length} photo (Cloudinary ${cloudUrls.length}, ImgBB ${imgbbUrls.length})`);
    } catch (err) {
      await failTask(task, err);
    } finally {
      cleanTaskCache(task);
      if (inputs) {
        for (const k in inputs) {
          inputs[k] = null;
        }
        inputs = null;
      }
    }
  };
  const kick = async () => {
    const client = sbRef2.current;
    if (!client || !workerIdRef.current || pausedRef.current || drainRef.current)
      return;
    if (!Object.keys(TASK_TYPES).length)
      return;
    if (!Object.keys(RUNTIME.model_caps).length)
      return;
    if (settingsRef.current.budget_left === 0)
      return;
    if (inFlight.current.size >= (settingsRef.current.task_concurrency || 1))
      return;
    setLastDbFetch((/* @__PURE__ */ new Date()).toLocaleTimeString());
    setNextDbSec(refreshIntervalSec);
    try {
      const stale = new Date(Date.now() - RUNTIME.stale_ms).toISOString();
      const { data, error } = await client.rpc(API.GET_PENDING, { p_worker_id: workerIdRef.current, p_stale_before: stale, p_limit: 40 });
      if (error)
        throw error;
      for (const task of data || []) {
        if (inFlight.current.has(task.id))
          continue;
        if (retryAfterMap.current.has(task.id) && Date.now() < retryAfterMap.current.get(task.id))
          continue;
        if ((settingsRef.current.disabled_models || []).includes(task.model))
          continue;
        inFlight.current.add(task.id);
        setRunning(inFlight.current.size);
        taskLimiter(async () => {
          try {
            if (!pausedRef.current && await claim(task.id)) {
              log(`Task #${task.id} mila (${task.task_type}, ${task.model})`);
              await withTimeout(processTask({ ...task, status: "processing" }), (settingsRef.current.task_timeout_sec || 300) * 1e3);
            }
          } catch (err) {
            if (/^Timeout:/.test(err.message))
              await failTask(task, err);
            else
              log("Claim error: " + err.message);
          } finally {
            inFlight.current.delete(task.id);
            setRunning(inFlight.current.size);
            if (drainRef.current && inFlight.current.size === 0)
              log("Drain complete: ab is tab ko band kar sakte ho");
          }
        });
      }
    } catch (err) {
      log("Pending error: " + err.message);
    }
  };
  kickRef.current = kick;
  const refreshAll = async () => {
    const c = sbRef2.current;
    if (c)
      await loadSettings2(c);
    loadMyTasks(myTab, myPage);
    kickRef.current();
  };
  const connect = async (overrideUrl) => {
    if (connectingRef.current || sbRef2.current)
      return;
    connectingRef.current = true;
    try {
      const targetUrl = typeof overrideUrl === "string" ? overrideUrl : customApiUrl || API_URL;
      const lib = await loadApiClient();
      const client = lib.createClient(targetUrl, apiKey);
      log(`Connecting to ${client.apiUrl}...`);
      const wanted = sessionStorage.getItem("ai_studio_worker_id");
      const { data, error } = await client.rpc(API.REGISTER_WORKER, { p_wanted: wanted });
      if (error)
        throw error;
      sessionStorage.setItem("ai_studio_worker_id", data);
      workerIdRef.current = data;
      sbRef2.current = client;
      setWorkerId(data);
      await loadSettings2(client);
      setSb(client);
      log(`Connected as ${data}`);
    } catch (err) {
      sbRef2.current = null;
      log("Connect error: " + err.message);
    } finally {
      connectingRef.current = false;
    }
  };
  (0, import_react2.useEffect)(() => {
    if (!sb)
      return;
    const heartbeat = async () => {
      const w = workerIdRef.current;
      if (!w)
        return;
      const { data, error } = await sb.rpc(API.HEARTBEAT, { p_worker_id: w });
      if (error)
        return;
      const isPaused = !!data?.paused;
      drainRef.current = !!data?.drain;
      setDrain(!!data?.drain);
      pausedRef.current = isPaused;
      setPaused(isPaused);
    };
    let refreshTimer = null;
    const scheduleRefresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshRef.current();
        kickRef.current();
      }, 3e3);
    };
    heartbeat();
    refreshRef.current();
    kickRef.current();
    const stopHb = everyMs(heartbeat, () => RUNTIME.heartbeat_ms);
    const stopFb = everyMs(() => {
      refreshRef.current();
      kickRef.current();
    }, () => RUNTIME.fallback_ms);
    let channel = null;
    if (USE_REALTIME)
      try {
        channel = sb.channel("ai-studio-worker-" + workerIdRef.current).on("postgres_changes", { event: "INSERT", schema: "public", table: TABLES.TASKS }, () => scheduleRefresh()).on("postgres_changes", { event: "UPDATE", schema: "public", table: TABLES.WORKERS }, (payload) => {
          if (payload.new?.worker_id !== workerIdRef.current)
            return;
          const limit = payload.new.task_limit ?? null;
          if (limit !== seenLimitRef.current) {
            seenLimitRef.current = limit;
            loadSettings2(sb);
          }
          const isPaused = !!payload.new.paused;
          drainRef.current = !!payload.new.drain;
          setDrain(!!payload.new.drain);
          pausedRef.current = isPaused;
          setPaused(isPaused);
          if (!isPaused)
            kickRef.current();
        }).on("postgres_changes", { event: "UPDATE", schema: "public", table: TABLES.SETTINGS }, () => loadSettings2(sb)).on("postgres_changes", { event: "*", schema: "public", table: TABLES.PROMPTS }, () => loadSettings2(sb)).on("postgres_changes", { event: "*", schema: "public", table: TABLES.CATALOG }, () => loadSettings2(sb)).on("postgres_changes", { event: "*", schema: "public", table: TABLES.FAMILY_ROLES }, () => loadSettings2(sb)).on("postgres_changes", { event: "*", schema: "public", table: TABLES.MODELS }, () => loadSettings2(sb)).subscribe();
      } catch (err) {
        log("Realtime band hai, timer se chalega: " + err.message);
      }
    const release = () => {
      const w = workerIdRef.current;
      if (!w)
        return;
      const targetUrl = sbRef2.current?.apiUrl || API_URL;
      fetch(`${targetUrl}/rest/v1/rpc/${API.RELEASE_WORKER}`, {
        method: "POST",
        keepalive: true,
        headers: { "Bypass-Tunnel-Reminder": "true", apikey: apiKey, Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ p_worker_id: w })
      });
    };
    window.addEventListener("pagehide", release);
    return () => {
      stopHb();
      stopFb();
      clearTimeout(refreshTimer);
      if (channel)
        sb.removeChannel(channel);
      window.removeEventListener("pagehide", release);
    };
  }, [sb, apiKey]);
  (0, import_react2.useEffect)(() => {
    const tryConnect = () => {
      if (!sbRef2.current)
        connect();
    };
    tryConnect();
    const t = setInterval(tryConnect, 15e3);
    return () => clearInterval(t);
  }, []);
  const status = !sb ? "Offline" : paused ? "Paused (admin)" : "Live";
  const statusStyle = !sb ? "bg-stone-800 text-stone-300 border-white/10" : paused ? "bg-rose-500/10 text-rose-300 border-rose-500/30" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
  return /* @__PURE__ */ import_react2.default.createElement("div", { className: "min-h-screen bg-stone-950 text-stone-100 p-4 sm:p-6 space-y-5" }, /* @__PURE__ */ import_react2.default.createElement("header", { className: "flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center" }, /* @__PURE__ */ import_react2.default.createElement(Cpu, { className: "w-5 h-5 text-stone-950" })), /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement("h1", { className: "text-lg font-extrabold" }, "AI Studio ", /* @__PURE__ */ import_react2.default.createElement("span", { className: "text-yellow-300" }, "Worker")), /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-[11px] text-stone-400" }, "Task uthata hai, model chalata hai, photo ImgBB + Cloudinary par upload karke save karta hai"))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex items-center gap-2 text-xs" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 border border-white/10 text-xs font-mono", title: "Worker auto-recycle limit from DB" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "text-stone-400" }, "Tasks:"), /* @__PURE__ */ import_react2.default.createElement("strong", { className: "text-yellow-300" }, sessionTasksDone, "/", settings.worker_recycle_after_tasks || 50)), /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-white/10 text-xs font-mono" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: `w-2 h-2 rounded-full ${memStats.usedMB > 150 ? "bg-rose-500 animate-ping" : memStats.usedMB > 80 ? "bg-amber-400" : "bg-emerald-400"}` }), /* @__PURE__ */ import_react2.default.createElement("span", null, "RAM: ", /* @__PURE__ */ import_react2.default.createElement("strong", { className: memStats.usedMB > 150 ? "text-rose-400" : "text-stone-200" }, memStats.supported ? `${memStats.usedMB} MB` : "Normal")), /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        purgeAllMemory();
        const fresh = getMemoryStats();
        setMemStats(fresh);
        log("RAM & Cache memory saaf kar di gayi");
      },
      title: "RAM aur Caches abhi saaf karein",
      className: "ml-1 text-[10px] text-yellow-300 hover:text-yellow-200 underline font-sans font-bold"
    },
    "Purge"
  )), /* @__PURE__ */ import_react2.default.createElement("button", { onClick: refreshAll, title: "Refresh", className: "h-9 w-9 flex items-center justify-center rounded-xl border border-white/10 bg-stone-900 text-stone-300" }, /* @__PURE__ */ import_react2.default.createElement(RefreshCw, { className: "w-4 h-4" })), !sb && /* @__PURE__ */ import_react2.default.createElement("button", { onClick: connect, disabled: !!sb, className: "h-9 px-4 rounded-xl bg-yellow-400 text-stone-950 font-black disabled:opacity-40" }, "Connect"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "font-mono font-bold text-yellow-300" }, workerId || "\u2014"), /* @__PURE__ */ import_react2.default.createElement("span", { className: `px-2.5 py-1 rounded-lg border font-bold ${statusStyle}` }, status))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "bg-stone-900 border border-yellow-400/20 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex items-center gap-2 flex-1 min-w-[300px]" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "flex items-center gap-1.5 font-bold text-yellow-300 text-xs whitespace-nowrap" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-pulse" }), "API Endpoint:"), /* @__PURE__ */ import_react2.default.createElement(
    "input",
    {
      type: "text",
      value: customApiUrl,
      onChange: (e) => {
        const val = e.target.value.trim();
        setCustomApiUrl(val);
        try {
          localStorage.setItem("aistudio_api_url", val);
        } catch {
        }
      },
      placeholder: "https://aistudio.runasp.net",
      className: "flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-yellow-400"
    }
  ), /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => connect(customApiUrl),
      className: "px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold rounded-xl transition-all text-xs"
    },
    "Save & Connect"
  )), /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex items-center gap-2 text-[11px] text-stone-400" }, /* @__PURE__ */ import_react2.default.createElement("span", null, "Default:"), /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        const u = "https://aistudio.runasp.net";
        setCustomApiUrl(u);
        try {
          localStorage.setItem("aistudio_api_url", u);
        } catch {
        }
        connect(u);
      },
      className: "font-mono text-yellow-300 hover:underline font-bold"
    },
    "https://aistudio.runasp.net"
  ))), /* @__PURE__ */ import_react2.default.createElement("section", { className: "grid gap-3 grid-cols-2 sm:grid-cols-6" }, [
    ["Abhi chal rahe", running],
    ["Done", myCounts.done ?? "\u2014"],
    ["Failed", myCounts.failed ?? "\u2014"],
    ["Ek saath tasks", settings.task_concurrency],
    ["Memory (RAM)", memStats.supported ? `${memStats.usedMB} MB` : `${inputCache.size} Cache`],
    ["Recycle (Done/Limit)", `${sessionTasksDone} / ${settings.worker_recycle_after_tasks || 50}`]
  ].map(([label, value]) => /* @__PURE__ */ import_react2.default.createElement("div", { key: label, className: "bg-stone-900 border border-white/10 rounded-2xl p-4" }, /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-[11px] text-stone-400" }, label), /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-2xl font-extrabold font-mono text-stone-100" }, value)))), /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-[11px] text-stone-500" }, "Upload: ", settings.cloudinary_enabled ? "Cloudinary ON" : "Cloudinary OFF", " \xB7 ", settings.imgbb_enabled ? "ImgBB ON" : "ImgBB OFF", " (admin se)"), /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-[11px] text-stone-500" }, "Model calls ek saath: ", settings.gemini_concurrency, " \xB7 Photos per task: ", settings.photos_per_task_max, " \xB7 Limits settings table se aati hain"), drain && /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-xs text-sky-200 bg-sky-500/10 border border-sky-500/30 rounded-xl px-3 py-2" }, "Drain mode: naya task nahi lega, chal rahe tasks khatam honge."), settings.budget_left != null && /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-[11px] text-stone-400" }, "Aaj ka bacha Gemini budget: ", settings.budget_left), settings.disabled_models?.length > 0 && /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-[11px] text-stone-400" }, "Band models: ", settings.disabled_models.join(", ")), !paused && /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", onClick: () => autoPause("Worker ne khud pause kiya (screen se)"), className: "h-9 px-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs font-bold" }, "Pause karo (naya task mat lo)"), paused && /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-xs text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2 flex items-center gap-2" }, /* @__PURE__ */ import_react2.default.createElement(AlertCircle, { className: "w-4 h-4" }), " Ye worker pause hai. Naya task nahi lega, jo chal raha hai wo complete hoga. Wapas chalu karne ke liye admin ke Workers screen se Resume karein."), /* @__PURE__ */ import_react2.default.createElement("section", { className: "space-y-3" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2" }, /* @__PURE__ */ import_react2.default.createElement("h2", { className: "text-sm font-extrabold flex items-center gap-2" }, /* @__PURE__ */ import_react2.default.createElement(Image2, { className: "w-4 h-4 text-yellow-300" }), " Is worker ke tasks"), /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex gap-1.5" }, [["pending", "Pending"], ["processing", "Processing"], ["done", "Completed"], ["failed", "Failed"]].map(([key, label]) => /* @__PURE__ */ import_react2.default.createElement("button", { key, type: "button", onClick: () => pickTab(key), className: `h-8 px-3 rounded-lg text-xs font-bold border ${myTab === key ? "bg-yellow-400 text-stone-950 border-yellow-300" : "bg-stone-900 border-white/10 text-stone-300"}` }, label, myCounts[key] != null ? ` (${myCounts[key]})` : "")))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "overflow-x-auto bg-stone-900 border border-white/10 rounded-2xl" }, /* @__PURE__ */ import_react2.default.createElement("table", { className: "w-full text-xs" }, /* @__PURE__ */ import_react2.default.createElement("thead", { className: "text-left text-stone-400" }, /* @__PURE__ */ import_react2.default.createElement("tr", null, /* @__PURE__ */ import_react2.default.createElement("th", { className: "p-2" }, "#"), /* @__PURE__ */ import_react2.default.createElement("th", { className: "p-2" }, "Kaam"), /* @__PURE__ */ import_react2.default.createElement("th", { className: "p-2" }, "Model"), /* @__PURE__ */ import_react2.default.createElement("th", { className: "p-2" }, "Result"), /* @__PURE__ */ import_react2.default.createElement("th", { className: "p-2" }, "Error"))), /* @__PURE__ */ import_react2.default.createElement("tbody", null, myRows.map((t) => /* @__PURE__ */ import_react2.default.createElement("tr", { key: t.id, className: "border-t border-white/5 align-top" }, /* @__PURE__ */ import_react2.default.createElement("td", { className: "p-2 font-mono text-yellow-300" }, "#", t.id), /* @__PURE__ */ import_react2.default.createElement("td", { className: "p-2" }, TASK_TYPES[t.task_type]?.label || t.task_type), /* @__PURE__ */ import_react2.default.createElement("td", { className: "p-2 font-mono text-stone-400" }, t.model), /* @__PURE__ */ import_react2.default.createElement("td", { className: "p-2" }, t.output_image_url && /* @__PURE__ */ import_react2.default.createElement("a", { href: t.output_image_url, target: "_blank", rel: "noreferrer", className: "text-emerald-300 underline mr-2" }, "Photo"), t.output_text && /* @__PURE__ */ import_react2.default.createElement("span", { className: "text-stone-200" }, t.output_text.slice(0, 120)), !t.output_image_url && !t.output_text && "\u2014"), /* @__PURE__ */ import_react2.default.createElement("td", { className: "p-2 text-rose-300" }, t.error || "")))))), myRows.length === 0 && /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-center text-xs text-stone-500 py-6" }, myCounts[myTab] == null ? "Upar se tab chunein" : "Is tab mein koi task nahi."), myCounts[myTab] > MY_PAGE_SIZE && /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex items-center justify-between text-xs" }, /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", disabled: myPage === 0, onClick: () => goPage(myPage - 1), className: "h-8 px-3 rounded-lg border border-white/10 bg-stone-900 disabled:opacity-40" }, "Pichhla"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "font-mono text-stone-400" }, "Page ", myPage + 1, " / ", Math.ceil(myCounts[myTab] / MY_PAGE_SIZE)), /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", disabled: (myPage + 1) * MY_PAGE_SIZE >= myCounts[myTab], onClick: () => goPage(myPage + 1), className: "h-8 px-3 rounded-lg border border-white/10 bg-stone-900 disabled:opacity-40" }, "Agla"))), /* @__PURE__ */ import_react2.default.createElement("section", { className: "bg-stone-900 border border-white/10 rounded-2xl p-4 space-y-3" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react2.default.createElement("h2", { className: "text-xs font-extrabold flex items-center gap-2" }, /* @__PURE__ */ import_react2.default.createElement(CheckCircle2, { className: "w-4 h-4 text-emerald-400" }), " Console & Activity Log"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "text-[10px] text-stone-400 font-mono" }, "(", logs.length, "/30 max)"), logs.length > 0 && /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      type: "button",
      onClick: () => setLogs([]),
      className: "text-[10px] text-stone-400 hover:text-yellow-300 underline font-mono ml-1",
      title: "Abhi log saaf karein"
    },
    "Clear"
  )), /* @__PURE__ */ import_react2.default.createElement("div", { className: "flex flex-wrap items-center gap-2 font-mono text-[11px]" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-pulse" }), "DB Refresh: Har ", refreshIntervalSec, "s me"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "px-2.5 py-1 rounded-lg bg-stone-800 border border-white/10 text-stone-300 font-semibold" }, "Agla DB fetch: ", /* @__PURE__ */ import_react2.default.createElement("span", { className: "text-yellow-300 font-bold font-mono" }, nextDbSec, "s")), /* @__PURE__ */ import_react2.default.createElement("span", { className: "px-2.5 py-1 rounded-lg bg-stone-800 border border-white/10 text-stone-300 font-semibold", title: "Auto-purges cache when task ends or high RAM" }, "RAM: ", /* @__PURE__ */ import_react2.default.createElement("span", { className: "text-emerald-300 font-bold font-mono" }, memStats.supported ? `${memStats.usedMB} MB` : "Safe")), /* @__PURE__ */ import_react2.default.createElement("span", { className: "px-2.5 py-1 rounded-lg bg-stone-800 border border-white/10 text-stone-300 font-semibold", title: "Tasks before auto-recycle and fresh reload" }, "Auto-Recycle: ", /* @__PURE__ */ import_react2.default.createElement("span", { className: "text-yellow-300 font-bold font-mono" }, sessionTasksDone, "/", settings.worker_recycle_after_tasks || 50)), lastDbFetch && /* @__PURE__ */ import_react2.default.createElement("span", { className: "text-stone-400 text-[10px]" }, "(Aakhri fetch: ", lastDbFetch, ")"))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "max-h-56 overflow-auto space-y-1 font-mono text-[11px] text-stone-300" }, logs.map((l, i) => /* @__PURE__ */ import_react2.default.createElement("p", { key: i }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "text-stone-500" }, l.t), " ", l.text)), logs.length === 0 && /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-stone-500" }, "Connect karo to log yahan aayega."))), running > 0 && /* @__PURE__ */ import_react2.default.createElement("p", { className: "text-[10px] text-stone-500 flex items-center gap-1" }, /* @__PURE__ */ import_react2.default.createElement(RefreshCw, { className: "w-3 h-3 animate-spin" }), " ", running, " task chal rahe hain"));
}
export {
  AiStudioWorker as default
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
