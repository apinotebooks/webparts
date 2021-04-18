/*! (c) Andrea Giammarchi @webreflection ISC */
(function () {

  var Lie = typeof Promise === 'function' ? Promise : function (fn) {
    var queue = [],
        resolved = 0,
        value;
    fn(function ($) {
      value = $;
      resolved = 1;
      queue.splice(0).forEach(then);
    });
    return {
      then: then
    };

    function then(fn) {
      return resolved ? setTimeout(fn, 0, value) : queue.push(fn), this;
    }
  };

  var attributesObserver = (function (whenDefined, MutationObserver) {
    var attributeChanged = function attributeChanged(records) {
      for (var i = 0, length = records.length; i < length; i++) {
        dispatch(records[i]);
      }
    };

    var dispatch = function dispatch(_ref) {
      var target = _ref.target,
          attributeName = _ref.attributeName,
          oldValue = _ref.oldValue;
      target.attributeChangedCallback(attributeName, oldValue, target.getAttribute(attributeName));
    };

    return function (target, is) {
      var attributeFilter = target.constructor.observedAttributes;

      if (attributeFilter) {
        whenDefined(is).then(function () {
          new MutationObserver(attributeChanged).observe(target, {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: attributeFilter
          });

          for (var i = 0, length = attributeFilter.length; i < length; i++) {
            if (target.hasAttribute(attributeFilter[i])) dispatch({
              target: target,
              attributeName: attributeFilter[i],
              oldValue: null
            });
          }
        });
      }

      return target;
    };
  });

  var _self = self,
      document = _self.document,
      MutationObserver = _self.MutationObserver,
      Set = _self.Set,
      WeakMap = _self.WeakMap;

  var elements = function elements(element) {
    return 'querySelectorAll' in element;
  };

  var filter = [].filter;
  var qsaObserver = (function (options) {
    var live = new WeakMap();

    var callback = function callback(records) {
      var query = options.query;

      if (query.length) {
        for (var i = 0, length = records.length; i < length; i++) {
          loop(filter.call(records[i].addedNodes, elements), true, query);
          loop(filter.call(records[i].removedNodes, elements), false, query);
        }
      }
    };

    var drop = function drop(elements) {
      for (var i = 0, length = elements.length; i < length; i++) {
        live["delete"](elements[i]);
      }
    };

    var flush = function flush() {
      callback(observer.takeRecords());
    };

    var loop = function loop(elements, connected, query) {
      var set = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : new Set();

      var _loop = function _loop(_selectors, _element, i, length) {
        // guard against repeated elements within nested querySelectorAll results
        if (!set.has(_element = elements[i])) {
          set.add(_element);

          if (connected) {
            for (var q, m = matches(_element), _i = 0, _length = query.length; _i < _length; _i++) {
              if (m.call(_element, q = query[_i])) {
                if (!live.has(_element)) live.set(_element, new Set());
                _selectors = live.get(_element); // guard against selectors that were handled already

                if (!_selectors.has(q)) {
                  _selectors.add(q);

                  options.handle(_element, connected, q);
                }
              }
            }
          } // guard against elements that never became live
          else if (live.has(_element)) {
              _selectors = live.get(_element);
              live["delete"](_element);

              _selectors.forEach(function (q) {
                options.handle(_element, connected, q);
              });
            }

          loop(querySelectorAll(_element), connected, query, set);
        }

        selectors = _selectors;
        element = _element;
      };

      for (var selectors, element, i = 0, length = elements.length; i < length; i++) {
        _loop(selectors, element, i);
      }
    };

    var matches = function matches(element) {
      return element.matches || element.webkitMatchesSelector || element.msMatchesSelector;
    };

    var parse = function parse(elements) {
      var connected = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      loop(elements, connected, options.query);
    };

    var querySelectorAll = function querySelectorAll(root) {
      return query.length ? root.querySelectorAll(query) : query;
    };

    var observer = new MutationObserver(callback);
    var root = options.root || document;
    var query = options.query;
    observer.observe(root, {
      childList: true,
      subtree: true
    });
    parse(querySelectorAll(root));
    return {
      drop: drop,
      flush: flush,
      observer: observer,
      parse: parse
    };
  });

  var _self$1 = self,
      document$1 = _self$1.document,
      Map = _self$1.Map,
      MutationObserver$1 = _self$1.MutationObserver,
      Object = _self$1.Object,
      Set$1 = _self$1.Set,
      WeakMap$1 = _self$1.WeakMap,
      Element = _self$1.Element,
      HTMLElement = _self$1.HTMLElement,
      Node = _self$1.Node,
      Error = _self$1.Error,
      TypeError = _self$1.TypeError,
      Reflect = _self$1.Reflect;
  var Promise$1 = self.Promise || Lie;
  var defineProperty = Object.defineProperty,
      keys = Object.keys,
      getOwnPropertyNames = Object.getOwnPropertyNames,
      setPrototypeOf = Object.setPrototypeOf;
  var legacy = !self.customElements;

  var expando = function expando(element) {
    var key = keys(element);
    var value = [];
    var length = key.length;

    for (var i = 0; i < length; i++) {
      value[i] = element[key[i]];
      delete element[key[i]];
    }

    return function () {
      for (var _i = 0; _i < length; _i++) {
        element[key[_i]] = value[_i];
      }
    };
  };

  if (legacy) {
    var HTMLBuiltIn = function HTMLBuiltIn() {
      var constructor = this.constructor;
      if (!classes.has(constructor)) throw new TypeError('Illegal constructor');
      var is = classes.get(constructor);
      if (override) return augment(override, is);
      var element = createElement.call(document$1, is);
      return augment(setPrototypeOf(element, constructor.prototype), is);
    };

    var createElement = document$1.createElement;
    var classes = new Map();
    var defined = new Map();
    var prototypes = new Map();
    var registry = new Map();
    var query = [];

    var handle = function handle(element, connected, selector) {
      var proto = prototypes.get(selector);

      if (connected && !proto.isPrototypeOf(element)) {
        var redefine = expando(element);
        override = setPrototypeOf(element, proto);

        try {
          new proto.constructor();
        } finally {
          override = null;
          redefine();
        }
      }

      var method = "".concat(connected ? '' : 'dis', "connectedCallback");
      if (method in proto) element[method]();
    };

    var _qsaObserver = qsaObserver({
      query: query,
      handle: handle
    }),
        parse = _qsaObserver.parse;

    var override = null;

    var whenDefined = function whenDefined(name) {
      if (!defined.has(name)) {
        var _,
            $ = new Lie(function ($) {
          _ = $;
        });

        defined.set(name, {
          $: $,
          _: _
        });
      }

      return defined.get(name).$;
    };

    var augment = attributesObserver(whenDefined, MutationObserver$1);
    defineProperty(self, 'customElements', {
      configurable: true,
      value: {
        define: function define(is, Class) {
          if (registry.has(is)) throw new Error("the name \"".concat(is, "\" has already been used with this registry"));
          classes.set(Class, is);
          prototypes.set(is, Class.prototype);
          registry.set(is, Class);
          query.push(is);
          whenDefined(is).then(function () {
            parse(document$1.querySelectorAll(is));
          });

          defined.get(is)._(Class);
        },
        get: function get(is) {
          return registry.get(is);
        },
        whenDefined: whenDefined
      }
    });
    defineProperty(HTMLBuiltIn.prototype = HTMLElement.prototype, 'constructor', {
      value: HTMLBuiltIn
    });
    defineProperty(self, 'HTMLElement', {
      configurable: true,
      value: HTMLBuiltIn
    });
    defineProperty(document$1, 'createElement', {
      configurable: true,
      value: function value(name, options) {
        var is = options && options.is;
        var Class = is ? registry.get(is) : registry.get(name);
        return Class ? new Class() : createElement.call(document$1, name);
      }
    }); // in case ShadowDOM is used through a polyfill, to avoid issues
    // with builtin extends within shadow roots

    if (!('isConnected' in Node.prototype)) defineProperty(Node.prototype, 'isConnected', {
      configurable: true,
      get: function get() {
        return !(this.ownerDocument.compareDocumentPosition(this) & this.DOCUMENT_POSITION_DISCONNECTED);
      }
    });
  } else {
    try {
      var LI = function LI() {
        return self.Reflect.construct(HTMLLIElement, [], LI);
      };

      LI.prototype = HTMLLIElement.prototype;
      var is = 'extends-li';
      self.customElements.define('extends-li', LI, {
        'extends': 'li'
      });
      legacy = document$1.createElement('li', {
        is: is
      }).outerHTML.indexOf(is) < 0;
      var _self$customElements = self.customElements,
          get = _self$customElements.get,
          _whenDefined = _self$customElements.whenDefined;
      defineProperty(self.customElements, 'whenDefined', {
        configurable: true,
        value: function value(is) {
          var _this = this;

          return _whenDefined.call(this, is).then(function (Class) {
            return Class || get.call(_this, is);
          });
        }
      });
    } catch (o_O) {
      legacy = !legacy;
    }
  }

  if (legacy) {
    var parseShadow = function parseShadow(element) {
      var _shadowRoots$get = shadowRoots.get(element),
          parse = _shadowRoots$get.parse,
          root = _shadowRoots$get.root;

      parse(root.querySelectorAll(this), element.isConnected);
    };

    var customElements = self.customElements;
    var attachShadow = Element.prototype.attachShadow;
    var _createElement = document$1.createElement;
    var define = customElements.define,
        _get = customElements.get;

    var _ref = Reflect || {
      construct: function construct(HTMLElement) {
        return HTMLElement.call(this);
      }
    },
        construct = _ref.construct;

    var shadowRoots = new WeakMap$1();
    var shadows = new Set$1();

    var _classes = new Map();

    var _defined = new Map();

    var _prototypes = new Map();

    var _registry = new Map();

    var shadowed = [];
    var _query = [];

    var getCE = function getCE(is) {
      return _registry.get(is) || _get.call(customElements, is);
    };

    var _handle = function _handle(element, connected, selector) {
      var proto = _prototypes.get(selector);

      if (connected && !proto.isPrototypeOf(element)) {
        var redefine = expando(element);
        _override = setPrototypeOf(element, proto);

        try {
          new proto.constructor();
        } finally {
          _override = null;
          redefine();
        }
      }

      var method = "".concat(connected ? '' : 'dis', "connectedCallback");
      if (method in proto) element[method]();
    };

    var _qsaObserver2 = qsaObserver({
      query: _query,
      handle: _handle
    }),
        _parse = _qsaObserver2.parse;

    var _qsaObserver3 = qsaObserver({
      query: shadowed,
      handle: function handle(element, connected) {
        if (shadowRoots.has(element)) {
          if (connected) shadows.add(element);else shadows["delete"](element);
          if (_query.length) parseShadow.call(_query, element);
        }
      }
    }),
        parseShadowed = _qsaObserver3.parse;

    var _whenDefined2 = function _whenDefined2(name) {
      if (!_defined.has(name)) {
        var _,
            $ = new Promise$1(function ($) {
          _ = $;
        });

        _defined.set(name, {
          $: $,
          _: _
        });
      }

      return _defined.get(name).$;
    };

    var _augment = attributesObserver(_whenDefined2, MutationObserver$1);

    var _override = null;
    getOwnPropertyNames(self).filter(function (k) {
      return /^HTML/.test(k);
    }).forEach(function (k) {
      var HTMLElement = self[k];

      function HTMLBuiltIn() {
        var constructor = this.constructor;
        if (!_classes.has(constructor)) throw new TypeError('Illegal constructor');

        var _classes$get = _classes.get(constructor),
            is = _classes$get.is,
            tag = _classes$get.tag;

        if (is) {
          if (_override) return _augment(_override, is);

          var element = _createElement.call(document$1, tag);

          element.setAttribute('is', is);
          return _augment(setPrototypeOf(element, constructor.prototype), is);
        } else return construct.call(this, HTMLElement, [], constructor);
      }


      defineProperty(HTMLBuiltIn.prototype = HTMLElement.prototype, 'constructor', {
        value: HTMLBuiltIn
      });
      defineProperty(self, k, {
        value: HTMLBuiltIn
      });
    });
    defineProperty(document$1, 'createElement', {
      configurable: true,
      value: function value(name, options) {
        var is = options && options.is;

        if (is) {
          var Class = _registry.get(is);

          if (Class && _classes.get(Class).tag === name) return new Class();
        }

        var element = _createElement.call(document$1, name);

        if (is) element.setAttribute('is', is);
        return element;
      }
    });
    if (attachShadow) defineProperty(Element.prototype, 'attachShadow', {
      configurable: true,
      value: function value() {
        var root = attachShadow.apply(this, arguments);

        var _qsaObserver4 = qsaObserver({
          query: _query,
          root: root,
          handle: _handle
        }),
            parse = _qsaObserver4.parse;

        shadowRoots.set(this, {
          root: root,
          parse: parse
        });
        return root;
      }
    });
    defineProperty(customElements, 'get', {
      configurable: true,
      value: getCE
    });
    defineProperty(customElements, 'whenDefined', {
      configurable: true,
      value: _whenDefined2
    });
    defineProperty(customElements, 'define', {
      configurable: true,
      value: function value(is, Class, options) {
        if (getCE(is)) throw new Error("'".concat(is, "' has already been defined as a custom element"));
        var selector;
        var tag = options && options["extends"];

        _classes.set(Class, tag ? {
          is: is,
          tag: tag
        } : {
          is: '',
          tag: is
        });

        if (tag) {
          selector = "".concat(tag, "[is=\"").concat(is, "\"]");

          _prototypes.set(selector, Class.prototype);

          _registry.set(is, Class);

          _query.push(selector);
        } else {
          define.apply(customElements, arguments);
          shadowed.push(selector = is);
        }

        _whenDefined2(is).then(function () {
          if (tag) {
            _parse(document$1.querySelectorAll(selector));

            shadows.forEach(parseShadow, [selector]);
          } else parseShadowed(document$1.querySelectorAll(selector));
        });

        _defined.get(is)._(Class);
      }
    });
  }

}());

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
}

/*
 * File: iframeResizer.js
 * Desc: Force iframes to size to content.
 * Requires: iframeResizer.contentWindow.js to be loaded into the target frame.
 * Doc: https://github.com/davidjbradshaw/iframe-resizer
 * Author: David J. Bradshaw - dave@bradshaw.net
 * Contributor: Jure Mav - jure.mav@gmail.com
 * Contributor: Reed Dadoune - reed@dadoune.com
 */

var iframeResizer = createCommonjsModule(function (module) {
(function (undefined$1) {
  if (typeof window === 'undefined') return // don't run for server side render

  var count = 0,
    logEnabled = false,
    hiddenCheckEnabled = false,
    msgHeader = 'message',
    msgHeaderLen = msgHeader.length,
    msgId = '[iFrameSizer]', // Must match iframe msg ID
    msgIdLen = msgId.length,
    pagePosition = null,
    requestAnimationFrame = window.requestAnimationFrame,
    resetRequiredMethods = {
      max: 1,
      scroll: 1,
      bodyScroll: 1,
      documentElementScroll: 1
    },
    settings = {},
    timer = null,
    defaults = {
      autoResize: true,
      bodyBackground: null,
      bodyMargin: null,
      bodyMarginV1: 8,
      bodyPadding: null,
      checkOrigin: true,
      inPageLinks: false,
      enablePublicMethods: true,
      heightCalculationMethod: 'bodyOffset',
      id: 'iFrameResizer',
      interval: 32,
      log: false,
      maxHeight: Infinity,
      maxWidth: Infinity,
      minHeight: 0,
      minWidth: 0,
      mouseEvents: true,
      resizeFrom: 'parent',
      scrolling: false,
      sizeHeight: true,
      sizeWidth: false,
      warningTimeout: 5000,
      tolerance: 0,
      widthCalculationMethod: 'scroll',
      onClose: function () {
        return true
      },
      onClosed: function () {},
      onInit: function () {},
      onMessage: function () {
        warn('onMessage function not defined');
      },
      onMouseEnter: function () {},
      onMouseLeave: function () {},
      onResized: function () {},
      onScroll: function () {
        return true
      }
    };

  function getMutationObserver() {
    return (
      window.MutationObserver ||
      window.WebKitMutationObserver ||
      window.MozMutationObserver
    )
  }

  function addEventListener(el, evt, func) {
    el.addEventListener(evt, func, false);
  }

  function removeEventListener(el, evt, func) {
    el.removeEventListener(evt, func, false);
  }

  function setupRequestAnimationFrame() {
    var vendors = ['moz', 'webkit', 'o', 'ms'];
    var x;

    // Remove vendor prefixing if prefixed and break early if not
    for (x = 0; x < vendors.length && !requestAnimationFrame; x += 1) {
      requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    }

    if (!requestAnimationFrame) {
      log('setup', 'RequestAnimationFrame not supported');
    } else {
      // Firefox extension content-scripts have a globalThis object that is not the same as window.
      // Binding `requestAnimationFrame` to window allows the function to work and prevents errors
      // being thrown when run in that context, and should be a no-op in every other context.
      requestAnimationFrame = requestAnimationFrame.bind(window);
    }
  }

  function getMyID(iframeId) {
    var retStr = 'Host page: ' + iframeId;

    if (window.top !== window.self) {
      // eslint-disable-next-line unicorn/prefer-ternary
      if (window.parentIFrame && window.parentIFrame.getId) {
        retStr = window.parentIFrame.getId() + ': ' + iframeId;
      } else {
        retStr = 'Nested host page: ' + iframeId;
      }
    }

    return retStr
  }

  function formatLogHeader(iframeId) {
    return msgId + '[' + getMyID(iframeId) + ']'
  }

  function isLogEnabled(iframeId) {
    return settings[iframeId] ? settings[iframeId].log : logEnabled
  }

  function log(iframeId, msg) {
    output('log', iframeId, msg, isLogEnabled(iframeId));
  }

  function info(iframeId, msg) {
    output('info', iframeId, msg, isLogEnabled(iframeId));
  }

  function warn(iframeId, msg) {
    output('warn', iframeId, msg, true);
  }

  function output(type, iframeId, msg, enabled) {
    if (true === enabled && 'object' === typeof window.console) {
      // eslint-disable-next-line no-console
      console[type](formatLogHeader(iframeId), msg);
    }
  }

  function iFrameListener(event) {
    function resizeIFrame() {
      function resize() {
        setSize(messageData);
        setPagePosition(iframeId);
        on('onResized', messageData);
      }

      ensureInRange('Height');
      ensureInRange('Width');

      syncResize(resize, messageData, 'init');
    }

    function processMsg() {
      var data = msg.substr(msgIdLen).split(':');
      var height = data[1] ? parseInt(data[1], 10) : 0;
      var iframe = settings[data[0]] && settings[data[0]].iframe;
      var compStyle = getComputedStyle(iframe);

      return {
        iframe: iframe,
        id: data[0],
        height: height + getPaddingEnds(compStyle) + getBorderEnds(compStyle),
        width: data[2],
        type: data[3]
      }
    }

    function getPaddingEnds(compStyle) {
      if (compStyle.boxSizing !== 'border-box') {
        return 0
      }
      var top = compStyle.paddingTop ? parseInt(compStyle.paddingTop, 10) : 0;
      var bot = compStyle.paddingBottom
        ? parseInt(compStyle.paddingBottom, 10)
        : 0;
      return top + bot
    }

    function getBorderEnds(compStyle) {
      if (compStyle.boxSizing !== 'border-box') {
        return 0
      }
      var top = compStyle.borderTopWidth
        ? parseInt(compStyle.borderTopWidth, 10)
        : 0;
      var bot = compStyle.borderBottomWidth
        ? parseInt(compStyle.borderBottomWidth, 10)
        : 0;
      return top + bot
    }

    function ensureInRange(Dimension) {
      var max = Number(settings[iframeId]['max' + Dimension]),
        min = Number(settings[iframeId]['min' + Dimension]),
        dimension = Dimension.toLowerCase(),
        size = Number(messageData[dimension]);

      log(iframeId, 'Checking ' + dimension + ' is in range ' + min + '-' + max);

      if (size < min) {
        size = min;
        log(iframeId, 'Set ' + dimension + ' to min value');
      }

      if (size > max) {
        size = max;
        log(iframeId, 'Set ' + dimension + ' to max value');
      }

      messageData[dimension] = '' + size;
    }

    function isMessageFromIFrame() {
      function checkAllowedOrigin() {
        function checkList() {
          var i = 0,
            retCode = false;

          log(
            iframeId,
            'Checking connection is from allowed list of origins: ' +
              checkOrigin
          );

          for (; i < checkOrigin.length; i++) {
            if (checkOrigin[i] === origin) {
              retCode = true;
              break
            }
          }
          return retCode
        }

        function checkSingle() {
          var remoteHost = settings[iframeId] && settings[iframeId].remoteHost;
          log(iframeId, 'Checking connection is from: ' + remoteHost);
          return origin === remoteHost
        }

        return checkOrigin.constructor === Array ? checkList() : checkSingle()
      }

      var origin = event.origin,
        checkOrigin = settings[iframeId] && settings[iframeId].checkOrigin;

      if (checkOrigin && '' + origin !== 'null' && !checkAllowedOrigin()) {
        throw new Error(
          'Unexpected message received from: ' +
            origin +
            ' for ' +
            messageData.iframe.id +
            '. Message was: ' +
            event.data +
            '. This error can be disabled by setting the checkOrigin: false option or by providing of array of trusted domains.'
        )
      }

      return true
    }

    function isMessageForUs() {
      return (
        msgId === ('' + msg).substr(0, msgIdLen) &&
        msg.substr(msgIdLen).split(':')[0] in settings
      ) // ''+Protects against non-string msg
    }

    function isMessageFromMetaParent() {
      // Test if this message is from a parent above us. This is an ugly test, however, updating
      // the message format would break backwards compatibity.
      var retCode = messageData.type in { true: 1, false: 1, undefined: 1 };

      if (retCode) {
        log(iframeId, 'Ignoring init message from meta parent page');
      }

      return retCode
    }

    function getMsgBody(offset) {
      return msg.substr(msg.indexOf(':') + msgHeaderLen + offset)
    }

    function forwardMsgFromIFrame(msgBody) {
      log(
        iframeId,
        'onMessage passed: {iframe: ' +
          messageData.iframe.id +
          ', message: ' +
          msgBody +
          '}'
      );

      on('onMessage', {
        iframe: messageData.iframe,
        message: JSON.parse(msgBody)
      });

      log(iframeId, '--');
    }

    function getPageInfo() {
      var bodyPosition = document.body.getBoundingClientRect(),
        iFramePosition = messageData.iframe.getBoundingClientRect();

      return JSON.stringify({
        iframeHeight: iFramePosition.height,
        iframeWidth: iFramePosition.width,
        clientHeight: Math.max(
          document.documentElement.clientHeight,
          window.innerHeight || 0
        ),
        clientWidth: Math.max(
          document.documentElement.clientWidth,
          window.innerWidth || 0
        ),
        offsetTop: parseInt(iFramePosition.top - bodyPosition.top, 10),
        offsetLeft: parseInt(iFramePosition.left - bodyPosition.left, 10),
        scrollTop: window.pageYOffset,
        scrollLeft: window.pageXOffset,
        documentHeight: document.documentElement.clientHeight,
        documentWidth: document.documentElement.clientWidth,
        windowHeight: window.innerHeight,
        windowWidth: window.innerWidth
      })
    }

    function sendPageInfoToIframe(iframe, iframeId) {
      function debouncedTrigger() {
        trigger('Send Page Info', 'pageInfo:' + getPageInfo(), iframe, iframeId);
      }
      debounceFrameEvents(debouncedTrigger, 32, iframeId);
    }

    function startPageInfoMonitor() {
      function setListener(type, func) {
        function sendPageInfo() {
          if (settings[id]) {
            sendPageInfoToIframe(settings[id].iframe, id);
          } else {
            stop();
          }
        }
['scroll', 'resize'].forEach(function (evt) {
          log(id, type + evt + ' listener for sendPageInfo');
          func(window, evt, sendPageInfo);
        });
      }

      function stop() {
        setListener('Remove ', removeEventListener);
      }

      function start() {
        setListener('Add ', addEventListener);
      }

      var id = iframeId; // Create locally scoped copy of iFrame ID

      start();

      if (settings[id]) {
        settings[id].stopPageInfo = stop;
      }
    }

    function stopPageInfoMonitor() {
      if (settings[iframeId] && settings[iframeId].stopPageInfo) {
        settings[iframeId].stopPageInfo();
        delete settings[iframeId].stopPageInfo;
      }
    }

    function checkIFrameExists() {
      var retBool = true;

      if (null === messageData.iframe) {
        warn(iframeId, 'IFrame (' + messageData.id + ') not found');
        retBool = false;
      }
      return retBool
    }

    function getElementPosition(target) {
      var iFramePosition = target.getBoundingClientRect();

      getPagePosition(iframeId);

      return {
        x: Math.floor(Number(iFramePosition.left) + Number(pagePosition.x)),
        y: Math.floor(Number(iFramePosition.top) + Number(pagePosition.y))
      }
    }

    function scrollRequestFromChild(addOffset) {
      /* istanbul ignore next */ // Not testable in Karma
      function reposition() {
        pagePosition = newPosition;
        scrollTo();
        log(iframeId, '--');
      }

      function calcOffset() {
        return {
          x: Number(messageData.width) + offset.x,
          y: Number(messageData.height) + offset.y
        }
      }

      function scrollParent() {
        if (window.parentIFrame) {
          window.parentIFrame['scrollTo' + (addOffset ? 'Offset' : '')](
            newPosition.x,
            newPosition.y
          );
        } else {
          warn(
            iframeId,
            'Unable to scroll to requested position, window.parentIFrame not found'
          );
        }
      }

      var offset = addOffset
          ? getElementPosition(messageData.iframe)
          : { x: 0, y: 0 },
        newPosition = calcOffset();

      log(
        iframeId,
        'Reposition requested from iFrame (offset x:' +
          offset.x +
          ' y:' +
          offset.y +
          ')'
      );

      if (window.top !== window.self) {
        scrollParent();
      } else {
        reposition();
      }
    }

    function scrollTo() {
      if (false !== on('onScroll', pagePosition)) {
        setPagePosition(iframeId);
      } else {
        unsetPagePosition();
      }
    }

    function findTarget(location) {
      function jumpToTarget() {
        var jumpPosition = getElementPosition(target);

        log(
          iframeId,
          'Moving to in page link (#' +
            hash +
            ') at x: ' +
            jumpPosition.x +
            ' y: ' +
            jumpPosition.y
        );
        pagePosition = {
          x: jumpPosition.x,
          y: jumpPosition.y
        };

        scrollTo();
        log(iframeId, '--');
      }

      function jumpToParent() {
        if (window.parentIFrame) {
          window.parentIFrame.moveToAnchor(hash);
        } else {
          log(
            iframeId,
            'In page link #' +
              hash +
              ' not found and window.parentIFrame not found'
          );
        }
      }

      var hash = location.split('#')[1] || '',
        hashData = decodeURIComponent(hash),
        target =
          document.getElementById(hashData) ||
          document.getElementsByName(hashData)[0];

      if (target) {
        jumpToTarget();
      } else if (window.top !== window.self) {
        jumpToParent();
      } else {
        log(iframeId, 'In page link #' + hash + ' not found');
      }
    }

    function onMouse(event) {
      var mousePos = {};

      if (Number(messageData.width) === 0 && Number(messageData.height) === 0) {
        var data = getMsgBody(9).split(':');
        mousePos = {
          x: data[1],
          y: data[0]
        };
      } else {
        mousePos = {
          x: messageData.width,
          y: messageData.height
        };
      }

      on(event, {
        iframe: messageData.iframe,
        screenX: Number(mousePos.x),
        screenY: Number(mousePos.y),
        type: messageData.type
      });
    }

    function on(funcName, val) {
      return chkEvent(iframeId, funcName, val)
    }

    function actionMsg() {
      if (settings[iframeId] && settings[iframeId].firstRun) firstRun();

      switch (messageData.type) {
        case 'close':
          closeIFrame(messageData.iframe);
          break

        case 'message':
          forwardMsgFromIFrame(getMsgBody(6));
          break

        case 'mouseenter':
          onMouse('onMouseEnter');
          break

        case 'mouseleave':
          onMouse('onMouseLeave');
          break

        case 'autoResize':
          settings[iframeId].autoResize = JSON.parse(getMsgBody(9));
          break

        case 'scrollTo':
          scrollRequestFromChild(false);
          break

        case 'scrollToOffset':
          scrollRequestFromChild(true);
          break

        case 'pageInfo':
          sendPageInfoToIframe(
            settings[iframeId] && settings[iframeId].iframe,
            iframeId
          );
          startPageInfoMonitor();
          break

        case 'pageInfoStop':
          stopPageInfoMonitor();
          break

        case 'inPageLink':
          findTarget(getMsgBody(9));
          break

        case 'reset':
          resetIFrame(messageData);
          break

        case 'init':
          resizeIFrame();
          on('onInit', messageData.iframe);
          break

        default:
          if (
            Number(messageData.width) === 0 &&
            Number(messageData.height) === 0
          ) {
            warn(
              'Unsupported message received (' +
                messageData.type +
                '), this is likely due to the iframe containing a later ' +
                'version of iframe-resizer than the parent page'
            );
          } else {
            resizeIFrame();
          }
      }
    }

    function hasSettings(iframeId) {
      var retBool = true;

      if (!settings[iframeId]) {
        retBool = false;
        warn(
          messageData.type +
            ' No settings for ' +
            iframeId +
            '. Message was: ' +
            msg
        );
      }

      return retBool
    }

    function iFrameReadyMsgReceived() {
      // eslint-disable-next-line no-restricted-syntax, guard-for-in
      for (var iframeId in settings) {
        trigger(
          'iFrame requested init',
          createOutgoingMsg(iframeId),
          settings[iframeId].iframe,
          iframeId
        );
      }
    }

    function firstRun() {
      if (settings[iframeId]) {
        settings[iframeId].firstRun = false;
      }
    }

    var msg = event.data,
      messageData = {},
      iframeId = null;

    if ('[iFrameResizerChild]Ready' === msg) {
      iFrameReadyMsgReceived();
    } else if (isMessageForUs()) {
      messageData = processMsg();
      iframeId = messageData.id;
      if (settings[iframeId]) {
        settings[iframeId].loaded = true;
      }

      if (!isMessageFromMetaParent() && hasSettings(iframeId)) {
        log(iframeId, 'Received: ' + msg);

        if (checkIFrameExists() && isMessageFromIFrame()) {
          actionMsg();
        }
      }
    } else {
      info(iframeId, 'Ignored: ' + msg);
    }
  }

  function chkEvent(iframeId, funcName, val) {
    var func = null,
      retVal = null;

    if (settings[iframeId]) {
      func = settings[iframeId][funcName];

      if ('function' === typeof func) {
        retVal = func(val);
      } else {
        throw new TypeError(
          funcName + ' on iFrame[' + iframeId + '] is not a function'
        )
      }
    }

    return retVal
  }

  function removeIframeListeners(iframe) {
    var iframeId = iframe.id;
    delete settings[iframeId];
  }

  function closeIFrame(iframe) {
    var iframeId = iframe.id;
    if (chkEvent(iframeId, 'onClose', iframeId) === false) {
      log(iframeId, 'Close iframe cancelled by onClose event');
      return
    }
    log(iframeId, 'Removing iFrame: ' + iframeId);

    try {
      // Catch race condition error with React
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    } catch (error) {
      warn(error);
    }

    chkEvent(iframeId, 'onClosed', iframeId);
    log(iframeId, '--');
    removeIframeListeners(iframe);
  }

  function getPagePosition(iframeId) {
    if (null === pagePosition) {
      pagePosition = {
        x:
          window.pageXOffset !== undefined$1
            ? window.pageXOffset
            : document.documentElement.scrollLeft,
        y:
          window.pageYOffset !== undefined$1
            ? window.pageYOffset
            : document.documentElement.scrollTop
      };
      log(
        iframeId,
        'Get page position: ' + pagePosition.x + ',' + pagePosition.y
      );
    }
  }

  function setPagePosition(iframeId) {
    if (null !== pagePosition) {
      window.scrollTo(pagePosition.x, pagePosition.y);
      log(
        iframeId,
        'Set page position: ' + pagePosition.x + ',' + pagePosition.y
      );
      unsetPagePosition();
    }
  }

  function unsetPagePosition() {
    pagePosition = null;
  }

  function resetIFrame(messageData) {
    function reset() {
      setSize(messageData);
      trigger('reset', 'reset', messageData.iframe, messageData.id);
    }

    log(
      messageData.id,
      'Size reset requested by ' +
        ('init' === messageData.type ? 'host page' : 'iFrame')
    );
    getPagePosition(messageData.id);
    syncResize(reset, messageData, 'reset');
  }

  function setSize(messageData) {
    function setDimension(dimension) {
      if (!messageData.id) {
        log('undefined', 'messageData id not set');
        return
      }
      messageData.iframe.style[dimension] = messageData[dimension] + 'px';
      log(
        messageData.id,
        'IFrame (' +
          iframeId +
          ') ' +
          dimension +
          ' set to ' +
          messageData[dimension] +
          'px'
      );
    }

    function chkZero(dimension) {
      // FireFox sets dimension of hidden iFrames to zero.
      // So if we detect that set up an event to check for
      // when iFrame becomes visible.

      /* istanbul ignore next */ // Not testable in PhantomJS
      if (!hiddenCheckEnabled && '0' === messageData[dimension]) {
        hiddenCheckEnabled = true;
        log(iframeId, 'Hidden iFrame detected, creating visibility listener');
        fixHiddenIFrames();
      }
    }

    function processDimension(dimension) {
      setDimension(dimension);
      chkZero(dimension);
    }

    var iframeId = messageData.iframe.id;

    if (settings[iframeId]) {
      if (settings[iframeId].sizeHeight) {
        processDimension('height');
      }
      if (settings[iframeId].sizeWidth) {
        processDimension('width');
      }
    }
  }

  function syncResize(func, messageData, doNotSync) {
    /* istanbul ignore if */ // Not testable in PhantomJS
    if (
      doNotSync !== messageData.type &&
      requestAnimationFrame &&
      // including check for jasmine because had trouble getting spy to work in unit test using requestAnimationFrame
      !window.jasmine
    ) {
      log(messageData.id, 'Requesting animation frame');
      requestAnimationFrame(func);
    } else {
      func();
    }
  }

  function trigger(calleeMsg, msg, iframe, id, noResponseWarning) {
    function postMessageToIFrame() {
      var target = settings[id] && settings[id].targetOrigin;
      log(
        id,
        '[' +
          calleeMsg +
          '] Sending msg to iframe[' +
          id +
          '] (' +
          msg +
          ') targetOrigin: ' +
          target
      );
      iframe.contentWindow.postMessage(msgId + msg, target);
    }

    function iFrameNotFound() {
      warn(id, '[' + calleeMsg + '] IFrame(' + id + ') not found');
    }

    function chkAndSend() {
      if (
        iframe &&
        'contentWindow' in iframe &&
        null !== iframe.contentWindow
      ) {
        // Null test for PhantomJS
        postMessageToIFrame();
      } else {
        iFrameNotFound();
      }
    }

    function warnOnNoResponse() {
      function warning() {
        if (settings[id] && !settings[id].loaded && !errorShown) {
          errorShown = true;
          warn(
            id,
            'IFrame has not responded within ' +
              settings[id].warningTimeout / 1000 +
              ' seconds. Check iFrameResizer.contentWindow.js has been loaded in iFrame. This message can be ignored if everything is working, or you can set the warningTimeout option to a higher value or zero to suppress this warning.'
          );
        }
      }

      if (
        !!noResponseWarning &&
        settings[id] &&
        !!settings[id].warningTimeout
      ) {
        settings[id].msgTimeout = setTimeout(
          warning,
          settings[id].warningTimeout
        );
      }
    }

    var errorShown = false;

    id = id || iframe.id;

    if (settings[id]) {
      chkAndSend();
      warnOnNoResponse();
    }
  }

  function createOutgoingMsg(iframeId) {
    return (
      iframeId +
      ':' +
      settings[iframeId].bodyMarginV1 +
      ':' +
      settings[iframeId].sizeWidth +
      ':' +
      settings[iframeId].log +
      ':' +
      settings[iframeId].interval +
      ':' +
      settings[iframeId].enablePublicMethods +
      ':' +
      settings[iframeId].autoResize +
      ':' +
      settings[iframeId].bodyMargin +
      ':' +
      settings[iframeId].heightCalculationMethod +
      ':' +
      settings[iframeId].bodyBackground +
      ':' +
      settings[iframeId].bodyPadding +
      ':' +
      settings[iframeId].tolerance +
      ':' +
      settings[iframeId].inPageLinks +
      ':' +
      settings[iframeId].resizeFrom +
      ':' +
      settings[iframeId].widthCalculationMethod +
      ':' +
      settings[iframeId].mouseEvents
    )
  }

  function setupIFrame(iframe, options) {
    function setLimits() {
      function addStyle(style) {
        if (
          Infinity !== settings[iframeId][style] &&
          0 !== settings[iframeId][style]
        ) {
          iframe.style[style] = settings[iframeId][style] + 'px';
          log(
            iframeId,
            'Set ' + style + ' = ' + settings[iframeId][style] + 'px'
          );
        }
      }

      function chkMinMax(dimension) {
        if (
          settings[iframeId]['min' + dimension] >
          settings[iframeId]['max' + dimension]
        ) {
          throw new Error(
            'Value for min' +
              dimension +
              ' can not be greater than max' +
              dimension
          )
        }
      }

      chkMinMax('Height');
      chkMinMax('Width');

      addStyle('maxHeight');
      addStyle('minHeight');
      addStyle('maxWidth');
      addStyle('minWidth');
    }

    function newId() {
      var id = (options && options.id) || defaults.id + count++;
      if (null !== document.getElementById(id)) {
        id += count++;
      }
      return id
    }

    function ensureHasId(iframeId) {
      if ('' === iframeId) {
        // eslint-disable-next-line no-multi-assign
        iframe.id = iframeId = newId();
        logEnabled = (options || {}).log;
        log(
          iframeId,
          'Added missing iframe ID: ' + iframeId + ' (' + iframe.src + ')'
        );
      }

      return iframeId
    }

    function setScrolling() {
      log(
        iframeId,
        'IFrame scrolling ' +
          (settings[iframeId] && settings[iframeId].scrolling
            ? 'enabled'
            : 'disabled') +
          ' for ' +
          iframeId
      );
      iframe.style.overflow =
        false === (settings[iframeId] && settings[iframeId].scrolling)
          ? 'hidden'
          : 'auto';
      switch (settings[iframeId] && settings[iframeId].scrolling) {
        case 'omit':
          break

        case true:
          iframe.scrolling = 'yes';
          break

        case false:
          iframe.scrolling = 'no';
          break

        default:
          iframe.scrolling = settings[iframeId]
            ? settings[iframeId].scrolling
            : 'no';
      }
    }

    // The V1 iFrame script expects an int, where as in V2 expects a CSS
    // string value such as '1px 3em', so if we have an int for V2, set V1=V2
    // and then convert V2 to a string PX value.
    function setupBodyMarginValues() {
      if (
        'number' ===
          typeof (settings[iframeId] && settings[iframeId].bodyMargin) ||
        '0' === (settings[iframeId] && settings[iframeId].bodyMargin)
      ) {
        settings[iframeId].bodyMarginV1 = settings[iframeId].bodyMargin;
        settings[iframeId].bodyMargin =
          '' + settings[iframeId].bodyMargin + 'px';
      }
    }

    function checkReset() {
      // Reduce scope of firstRun to function, because IE8's JS execution
      // context stack is borked and this value gets externally
      // changed midway through running this function!!!
      var firstRun = settings[iframeId] && settings[iframeId].firstRun,
        resetRequertMethod =
          settings[iframeId] &&
          settings[iframeId].heightCalculationMethod in resetRequiredMethods;

      if (!firstRun && resetRequertMethod) {
        resetIFrame({ iframe: iframe, height: 0, width: 0, type: 'init' });
      }
    }

    function setupIFrameObject() {
      if (settings[iframeId]) {
        settings[iframeId].iframe.iFrameResizer = {
          close: closeIFrame.bind(null, settings[iframeId].iframe),

          removeListeners: removeIframeListeners.bind(
            null,
            settings[iframeId].iframe
          ),

          resize: trigger.bind(
            null,
            'Window resize',
            'resize',
            settings[iframeId].iframe
          ),

          moveToAnchor: function (anchor) {
            trigger(
              'Move to anchor',
              'moveToAnchor:' + anchor,
              settings[iframeId].iframe,
              iframeId
            );
          },

          sendMessage: function (message) {
            message = JSON.stringify(message);
            trigger(
              'Send Message',
              'message:' + message,
              settings[iframeId].iframe,
              iframeId
            );
          }
        };
      }
    }

    // We have to call trigger twice, as we can not be sure if all
    // iframes have completed loading when this code runs. The
    // event listener also catches the page changing in the iFrame.
    function init(msg) {
      function iFrameLoaded() {
        trigger('iFrame.onload', msg, iframe, undefined$1, true);
        checkReset();
      }

      function createDestroyObserver(MutationObserver) {
        if (!iframe.parentNode) {
          return
        }

        var destroyObserver = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            var removedNodes = Array.prototype.slice.call(mutation.removedNodes); // Transform NodeList into an Array
            removedNodes.forEach(function (removedNode) {
              if (removedNode === iframe) {
                closeIFrame(iframe);
              }
            });
          });
        });
        destroyObserver.observe(iframe.parentNode, {
          childList: true
        });
      }

      var MutationObserver = getMutationObserver();
      if (MutationObserver) {
        createDestroyObserver(MutationObserver);
      }

      addEventListener(iframe, 'load', iFrameLoaded);
      trigger('init', msg, iframe, undefined$1, true);
    }

    function checkOptions(options) {
      if ('object' !== typeof options) {
        throw new TypeError('Options is not an object')
      }
    }

    function copyOptions(options) {
      // eslint-disable-next-line no-restricted-syntax
      for (var option in defaults) {
        if (Object.prototype.hasOwnProperty.call(defaults, option)) {
          settings[iframeId][option] = Object.prototype.hasOwnProperty.call(
            options,
            option
          )
            ? options[option]
            : defaults[option];
        }
      }
    }

    function getTargetOrigin(remoteHost) {
      return '' === remoteHost ||
        null !== remoteHost.match(/^(about:blank|javascript:|file:\/\/)/)
        ? '*'
        : remoteHost
    }

    function depricate(key) {
      var splitName = key.split('Callback');

      if (splitName.length === 2) {
        var name =
          'on' + splitName[0].charAt(0).toUpperCase() + splitName[0].slice(1);
        this[name] = this[key];
        delete this[key];
        warn(
          iframeId,
          "Deprecated: '" +
            key +
            "' has been renamed '" +
            name +
            "'. The old method will be removed in the next major version."
        );
      }
    }

    function processOptions(options) {
      options = options || {};
      settings[iframeId] = {
        firstRun: true,
        iframe: iframe,
        remoteHost: iframe.src && iframe.src.split('/').slice(0, 3).join('/')
      };

      checkOptions(options);
      Object.keys(options).forEach(depricate, options);
      copyOptions(options);

      if (settings[iframeId]) {
        settings[iframeId].targetOrigin =
          true === settings[iframeId].checkOrigin
            ? getTargetOrigin(settings[iframeId].remoteHost)
            : '*';
      }
    }

    function beenHere() {
      return iframeId in settings && 'iFrameResizer' in iframe
    }

    var iframeId = ensureHasId(iframe.id);

    if (!beenHere()) {
      processOptions(options);
      setScrolling();
      setLimits();
      setupBodyMarginValues();
      init(createOutgoingMsg(iframeId));
      setupIFrameObject();
    } else {
      warn(iframeId, 'Ignored iFrame, already setup.');
    }
  }

  function debouce(fn, time) {
    if (null === timer) {
      timer = setTimeout(function () {
        timer = null;
        fn();
      }, time);
    }
  }

  var frameTimer = {};
  function debounceFrameEvents(fn, time, frameId) {
    if (!frameTimer[frameId]) {
      frameTimer[frameId] = setTimeout(function () {
        frameTimer[frameId] = null;
        fn();
      }, time);
    }
  }

  // Not testable in PhantomJS
  /* istanbul ignore next */

  function fixHiddenIFrames() {
    function checkIFrames() {
      function checkIFrame(settingId) {
        function chkDimension(dimension) {
          return (
            '0px' ===
            (settings[settingId] && settings[settingId].iframe.style[dimension])
          )
        }

        function isVisible(el) {
          return null !== el.offsetParent
        }

        if (
          settings[settingId] &&
          isVisible(settings[settingId].iframe) &&
          (chkDimension('height') || chkDimension('width'))
        ) {
          trigger(
            'Visibility change',
            'resize',
            settings[settingId].iframe,
            settingId
          );
        }
      }

      Object.keys(settings).forEach(function (key) {
        checkIFrame(key);
      });
    }

    function mutationObserved(mutations) {
      log(
        'window',
        'Mutation observed: ' + mutations[0].target + ' ' + mutations[0].type
      );
      debouce(checkIFrames, 16);
    }

    function createMutationObserver() {
      var target = document.querySelector('body'),
        config = {
          attributes: true,
          attributeOldValue: false,
          characterData: true,
          characterDataOldValue: false,
          childList: true,
          subtree: true
        },
        observer = new MutationObserver(mutationObserved);

      observer.observe(target, config);
    }

    var MutationObserver = getMutationObserver();
    if (MutationObserver) {
      createMutationObserver();
    }
  }

  function resizeIFrames(event) {
    function resize() {
      sendTriggerMsg('Window ' + event, 'resize');
    }

    log('window', 'Trigger event: ' + event);
    debouce(resize, 16);
  }

  // Not testable in PhantomJS
  /* istanbul ignore next */
  function tabVisible() {
    function resize() {
      sendTriggerMsg('Tab Visable', 'resize');
    }

    if ('hidden' !== document.visibilityState) {
      log('document', 'Trigger event: Visiblity change');
      debouce(resize, 16);
    }
  }

  function sendTriggerMsg(eventName, event) {
    function isIFrameResizeEnabled(iframeId) {
      return (
        settings[iframeId] &&
        'parent' === settings[iframeId].resizeFrom &&
        settings[iframeId].autoResize &&
        !settings[iframeId].firstRun
      )
    }

    Object.keys(settings).forEach(function (iframeId) {
      if (isIFrameResizeEnabled(iframeId)) {
        trigger(eventName, event, settings[iframeId].iframe, iframeId);
      }
    });
  }

  function setupEventListeners() {
    addEventListener(window, 'message', iFrameListener);

    addEventListener(window, 'resize', function () {
      resizeIFrames('resize');
    });

    addEventListener(document, 'visibilitychange', tabVisible);

    addEventListener(document, '-webkit-visibilitychange', tabVisible);
  }

  function factory() {
    function init(options, element) {
      function chkType() {
        if (!element.tagName) {
          throw new TypeError('Object is not a valid DOM element')
        } else if ('IFRAME' !== element.tagName.toUpperCase()) {
          throw new TypeError(
            'Expected <IFRAME> tag, found <' + element.tagName + '>'
          )
        }
      }

      if (element) {
        chkType();
        setupIFrame(element, options);
        iFrames.push(element);
      }
    }

    function warnDeprecatedOptions(options) {
      if (options && options.enablePublicMethods) {
        warn(
          'enablePublicMethods option has been removed, public methods are now always available in the iFrame'
        );
      }
    }

    var iFrames;

    setupRequestAnimationFrame();
    setupEventListeners();

    return function iFrameResizeF(options, target) {
      iFrames = []; // Only return iFrames past in on this call

      warnDeprecatedOptions(options);

      switch (typeof target) {
        case 'undefined':
        case 'string':
          Array.prototype.forEach.call(
            document.querySelectorAll(target || 'iframe'),
            init.bind(undefined$1, options)
          );
          break

        case 'object':
          init(options, target);
          break

        default:
          throw new TypeError('Unexpected data type (' + typeof target + ')')
      }

      return iFrames
    }
  }

  function createJQueryPublicMethod($) {
    if (!$.fn) {
      info('', 'Unable to bind to jQuery, it is not fully loaded.');
    } else if (!$.fn.iFrameResize) {
      $.fn.iFrameResize = function $iFrameResizeF(options) {
        function init(index, element) {
          setupIFrame(element, options);
        }

        return this.filter('iframe').each(init).end()
      };
    }
  }

  if (window.jQuery) {
    createJQueryPublicMethod(window.jQuery);
  }

  if (typeof undefined$1 === 'function' && undefined$1.amd) {
    undefined$1([], factory);
  } else {
    // Node for browserfy
    module.exports = factory();
  }
  window.iFrameResize = window.iFrameResize || factory();
})();
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
function loadDefaultSettings(opts, el) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return {
        // We fall back to a specific starboard package version on jsdelivr, but ideally one would always specify their own URL that is locked to a specific version.
        src: (_b = (_a = opts.src) !== null && _a !== void 0 ? _a : el.getAttribute("src")) !== null && _b !== void 0 ? _b : "starboard-notebook-iframe-src-not-set",
        autoResize: (_c = opts.autoResize) !== null && _c !== void 0 ? _c : true,
        inPageLinks: (_d = opts.inPageLinks) !== null && _d !== void 0 ? _d : true,
        sandbox: (_f = (_e = opts.sandbox) !== null && _e !== void 0 ? _e : el.getAttribute("sandbox")) !== null && _f !== void 0 ? _f : "allow-scripts allow-modals allow-same-origin allow-pointer-lock allow-top-navigation-by-user-activation allow-forms allow-downloads",
        debug: (_g = opts.debug) !== null && _g !== void 0 ? _g : false,
        onNotebookReadySignalMessage: (_h = opts.onNotebookReadySignalMessage) !== null && _h !== void 0 ? _h : function () { },
        onContentUpdateMessage: (_j = opts.onContentUpdateMessage) !== null && _j !== void 0 ? _j : function () { },
        onSaveMessage: (_k = opts.onSaveMessage) !== null && _k !== void 0 ? _k : function () { },
        onMessage: (_l = opts.onMessage) !== null && _l !== void 0 ? _l : function () { },
        notebookContent: opts.notebookContent,
        notebookContainer: opts.notebookContainer,
        notebookVariables: opts.notebookVariables,
        notebookEditMode: opts.notebookEditMode || "edit"
    };
}
class StarboardNotebookIFrame extends HTMLIFrameElement {
    constructor(opts = {}) {
        super();
        this.notebookEditMode = "edit";
        // The version of starboard-wrap
        this.version = "0.2.3";
        this._notebookContent = "";
        this.constructorOptions = opts;
    }
    get notebookContent() {
        return this._notebookContent;
    }
    set notebookContent(content) {
        this._notebookContent = content;
    }
    connectedCallback() {
        this.options = loadDefaultSettings(this.constructorOptions, this);
        const checkOrigin = [new URL(this.options.src).origin];
        this.sandbox.value = this.options.sandbox;
        this.src = this.options.src;
        this.frameBorder = "0";
        this.notebookContent = this.options.notebookContent || "";
        this.notebookVariables = this.options.notebookVariables || {};
        this.notebookEditMode = this.options.notebookEditMode || "edit";
        iframeResizer({
            autoResize: this.options.autoResize,
            inPageLinks: this.options.inPageLinks,
            checkOrigin: checkOrigin,
            log: this.options.debug,
            onMessage: async (data) => {
                const msg = data.message;
                if (msg.type === "NOTEBOOK_READY_SIGNAL") {
                    if (this.notebookContent) {
                        const content = this.notebookContent;
                        const variables = this.notebookVariables;
                        this.sendMessage({
                            type: "NOTEBOOK_SET_INIT_DATA", payload: { content: content, variables: variables, editMode: this.notebookEditMode }
                        });
                    }
                    else {
                        this.notebookContent = msg.payload.content;
                    }
                    this.options.onNotebookReadySignalMessage(msg.payload);
                }
                else if (msg.type === "NOTEBOOK_CONTENT_UPDATE") {
                    this.notebookContent = msg.payload.content;
                    this.options.onContentUpdateMessage(msg.payload);
                }
                else if (msg.type === "NOTEBOOK_SAVE_REQUEST") {
                    this.notebookContent = msg.payload.content;
                    this.options.onSaveMessage(msg.payload);
                }
                this.options.onMessage(msg);
            },
            onReady: () => { },
        }, this);
    }
    sendMessage(message) {
        this.iFrameResizer.sendMessage(message);
    }
    sendCustomMessage(message) {
        this.sendMessage(message);
    }
    dispose() {
        this.iFrameResizer.close();
    }
}
customElements.define('starboard-notebook-iframe', StarboardNotebookIFrame, { extends: 'iframe' });

export { StarboardNotebookIFrame };
