(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', './Frame', './Link', './Node', './Inspector', './Selector'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('./Frame'), require('./Link'), require('./Node'), require('./Inspector'), require('./Selector'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.Frame, global.Link, global.Node, global.Inspector, global.Selector);
    global.index = mod.exports;
  }
})(this, function (exports, _Frame, _Link, _Node, _Inspector, _Selector) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.Selector = exports.Node = exports.Link = exports.Inspector = exports.Frame = undefined;

  var _Frame2 = _interopRequireDefault(_Frame);

  var _Link2 = _interopRequireDefault(_Link);

  var _Node2 = _interopRequireDefault(_Node);

  var _Inspector2 = _interopRequireDefault(_Inspector);

  var _Selector2 = _interopRequireDefault(_Selector);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.Frame = _Frame2.default;
  exports.Inspector = _Inspector2.default;
  exports.Link = _Link2.default;
  exports.Node = _Node2.default;
  exports.Selector = _Selector2.default;
});