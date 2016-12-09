/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/projects              ->  index
 * POST    /api/projects              ->  create
 * GET     /api/projects/:id          ->  show
 * PUT     /api/projects/:id          ->  upsert
 * PATCH   /api/projects/:id          ->  patch
 * DELETE  /api/projects/:id          ->  destroy
 */

'use strict';

import jsonpatch from 'fast-json-patch';
import Project from './project.model';
import AWS from 'aws-sdk';
import fs from 'fs';

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if(entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function(entity) {
    try {
      jsonpatch.apply(entity, patches, /*validate*/ true);
    } catch(err) {
      return Promise.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function(entity) {
    if(entity) {
      return entity.remove()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if(!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Projects
export function index(req, res) {
  return Project.Project.find().exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a list of My Projects
export function myProjects(req, res) {
  return Project.Project.find({builder:req.params.id}).populate('type').exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Project from the DB
export function show(req, res) {
  return Project.Project.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Project in the DB
export function create(req, res) {
  var body = req.body.data;
  var total = body.type.rps.base + body.type.rps.devCharges + body.type.rps.others;
  body.type.rps.total = total;
  var imagesInt = body.imagesInt;  
  var imagesExt = body.imagesExt;
  return Project.ProjectType.create(body.type)
    .then(function(projectType){
      body.type = projectType._id;
      body.builder = req.user._id;
      var newProject = new Project.Project(body);

      newProject.imagesInt = [
        'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesInt/'+newProject._id+'_1.jpg',
        'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesInt/'+newProject._id+'_2.jpg'
      ];
      newProject.imagesExt = [
        'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesExt/'+newProject._id+'_1.jpg',
        'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesExt/'+newProject._id+'_2.jpg'
      ];
      newProject.brochure = 'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/brochure/'+newProject._id+'.jpg';
      newProject.offers.pic = 'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/offer/'+newProject._id+'.jpg';
      
      newProject.save()
      .then(respondWithResult(res, 201))
      .catch(handleError(res));
    })
    .catch(handleError(res));
  // return Project.Project.create(req.body)
  //   .then(respondWithResult(res, 201))
  //   .catch(handleError(res));
}

// Upserts the given Project in the DB at the specified ID
export function upsert(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Project.Project.findOneAndUpdate(req.params.id, req.body, {upsert: true, setDefaultsOnInsert: true, runValidators: true}).exec()

    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Project in the DB
export function patch(req, res) {
  if(req.body.data._id) {
    delete req.body._id;
  }
  return Project.Project.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body.data))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function uploadfile(req, res) {
  AWS.config.update({accessKeyId: process.env.CELLAR_ADDON_KEY_ID, secretAccessKey: process.env.CELLAR_ADDON_KEY_SECRET});
  var ep = new AWS.Endpoint(process.env.CELLAR_ADDON_HOST);
  var s3 = new AWS.S3({
   endpoint: ep, 
   signatureVersion: 'v2'
  });
  var body = fs.createReadStream(req.files.file.path);
  fs.rename(req.files.file.path,req.files.file.path+'.jpg',function(err){
    if ( err )console.log('ERROR: ' + err);

    body.path=body.path+'.jpg';
    var params = {Bucket: process.env.BUCKET, Key: req.body.key, Body: body, ACL: 'public-read'};
    var request = s3.putObject(params).on('httpUploadProgress', function(progress) {
      console.log(progress);
    }).send(function(err,data){
      console.log(err);
      if (err) return handleError(res, {message:"Unable to upload image. Try again & Check your internet!"});
      return res.send(200);
    }); 
  }) 

}

// Deletes a Project from the DB
export function destroy(req, res) {
  return Project.Project.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
