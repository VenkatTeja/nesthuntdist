/**
 * Purchase model events
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = require('events');

var _purchase = require('./purchase.model');

var _purchase2 = _interopRequireDefault(_purchase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PurchaseEvents = new _events.EventEmitter();

// Set max event listeners (0 == unlimited)
PurchaseEvents.setMaxListeners(0);

// Model events
var events = {
  save: 'save',
  remove: 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  _purchase2.default.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function (doc) {
    PurchaseEvents.emit(event + ':' + doc._id, doc);
    PurchaseEvents.emit(event, doc);
  };
}

exports.default = PurchaseEvents;
//# sourceMappingURL=purchase.events.js.map
