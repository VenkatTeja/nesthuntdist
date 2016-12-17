'use strict';

import mongoose from 'mongoose';
var Schema = mongoose.Schema;

var ProjectSchema = new Schema({
  name: String,
  info: String,
  status: Number, // Status : 0 - completed, 1 - ongoing, 2-upcoming
  type: {type:Schema.Types.ObjectId, ref:"ProjectType"}, // Land/Flat/Villa
  legalBy: String, // Is Legal Cleared?
  techBy: String, // Is Technical Cleared?
  approvals:{dtcp: Boolean, cmda: Boolean, lpa: Boolean, panchayath: Boolean},
  images: [String],
  location: {lat:String,lng:String, name: String},
  brochure: String,
  offers: [String],
  offerPic: String,
  mailId: String,
  builder: {type:Schema.Types.ObjectId, ref:"User"}

});

var Project = mongoose.model('Project', ProjectSchema);

var ProjectTypeSchema = new mongoose.Schema({
  project: {type:Schema.Types.ObjectId, ref:"Project"},
  type: Number, // Land-1, Flat-2, Villa-3, 4-Row House
  
  nUnits: Number,
  nUnsold: Number,

  lSize:{min:Number, max:Number},
  bSize:{min:Number, max:Number},
  budget:{min:Number, max:Number},
  rps: {base:Number, devCharges: Number, others: Number, total: Number}, // Rate per square feet

  // Plot
  layoutNo : String,

  //flat, villa
  uds:Number,

  // Villa,rowhouse, flat
  progress:Number
});

var ProjectType = mongoose.model('ProjectType', ProjectTypeSchema);

export default {Project: Project, ProjectType: ProjectType};