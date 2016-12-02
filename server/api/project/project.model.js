'use strict';

import mongoose from 'mongoose';
var Schema = mongoose.Schema;

var ProjectSchema = new Schema({
  name: String,
  info: String,
  status: Number, // Status : 0 - completed, 1 - ongoing, 2-upcoming
  type: {type:Schema.Types.ObjectId, ref:"ProjectType"}, // Land/Flat/Villa
  isLegalClr: Boolean, // Is Legal Cleared?
  isTechClr: Boolean, // Is Technical Cleared?
  approvals:{dtcp: Boolean, cmda: Boolean, lpa: Boolean, panchayath: Boolean},
  imagesInt : [String],
  imagesExt: [String],
  location: String,
  brochure: String,
  offers: {pic:String, text:String},
  mailId: String,
  builder: {type:Schema.Types.ObjectId, ref:"User"}

});

export default mongoose.model('Project', ProjectSchema);

var ProjectTypeSchema = new mongoose.Schema({
  project: {type:Schema.Types.ObjectId, ref:"Project"},
  type: Number, // Land-1, Flat-2, Villa-3
  
  // Land
  layoutNo : Number,

  // Flat
  upt: [Number], // Units per Tower
  percentUDS: Number,

  // Villa
  villaType: Number, // 1-L+B, 2-B+UDS

  num: Number,
  rps: {base:Number, devCharges: Number, others: Number, total: Number}, // Rate per square feet
  size: [Number]

});

mongoose.model('ProjectType', ProjectTypeSchema);