'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var VisitSchema = new _mongoose2.default.Schema({
  from: { lat: String, lng: String, name: String },
  to: { lat: String, lng: String, name: String },
  time: Date,
  nPeople: Number,
  user: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'User' },
  project: { type: _mongoose2.default.Schema.Types.ObjectId, ref: 'Project' },
  createdOn: { type: Date, default: Date.now() }
});

exports.default = _mongoose2.default.model('Visit', VisitSchema);
//# sourceMappingURL=visit.model.js.map
