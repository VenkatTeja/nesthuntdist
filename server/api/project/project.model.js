'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

var ProjectSchema = new Schema({
  name: String,
  info: String,
  status: Number, // Status : 0 - completed, 1 - ongoing, 2-upcoming
  type: { type: Schema.Types.ObjectId, ref: "ProjectType" }, // Land/Flat/Villa
  legalBy: String, // Is Legal Cleared?
  techBy: String, // Is Technical Cleared?
  approvals: { dtcp: Boolean, cmda: Boolean, lpa: Boolean, panchayath: Boolean },
  images: [String],
  location: { lat: String, lng: String, name: String },
  brochure: String,
  offers: [String],
  offerPic: String,
  mailId: String,
  builder: { type: Schema.Types.ObjectId, ref: "User" },
  createdOn: { type: Date, default: Date.now() }

});

var Project = _mongoose2.default.model('Project', ProjectSchema);

var ProjectTypeSchema = new _mongoose2.default.Schema({
  project: { type: Schema.Types.ObjectId, ref: "Project" },
  type: Number, // Land-1, Flat-2, Villa-3, 4-Row House

  nUnits: Number,
  nUnsold: Number,

  lSize: { min: Number, max: Number },
  bSize: { min: Number, max: Number },
  budget: { min: Number, max: Number },
  rps: { base: Number, devCharges: Number, others: Number, total: Number }, // Rate per square feet

  // Plot
  layoutNo: String,

  //flat, villa
  uds: Number,

  // Villa,rowhouse, flat
  progress: Number
});

var ProjectType = _mongoose2.default.model('ProjectType', ProjectTypeSchema);

exports.default = { Project: Project, ProjectType: ProjectType };
//# sourceMappingURL=project.model.js.map
