/**
 * Visit model events
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = require('events');

var _visit = require('./visit.model');

var _visit2 = _interopRequireDefault(_visit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var VisitEvents = new _events.EventEmitter();

// Set max event listeners (0 == unlimited)
VisitEvents.setMaxListeners(0);

// Model events
var events = {
  save: 'save',
  remove: 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  _visit2.default.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function (doc) {
    VisitEvents.emit(event + ':' + doc._id, doc);
    VisitEvents.emit(event, doc);
  };
}

exports.default = VisitEvents;
//# sourceMappingURL=visit.events.js.map
