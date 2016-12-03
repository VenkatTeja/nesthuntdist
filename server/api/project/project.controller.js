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

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.index = index;
exports.myProjects = myProjects;
exports.show = show;
exports.create = create;
exports.upsert = upsert;
exports.patch = patch;
exports.destroy = destroy;

var _fastJsonPatch = require('fast-json-patch');

var _fastJsonPatch2 = _interopRequireDefault(_fastJsonPatch);

var _project = require('./project.model');

var _project2 = _interopRequireDefault(_project);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function (entity) {
    try {
      _fastJsonPatch2.default.apply(entity, patches, /*validate*/true);
    } catch (err) {
      return _promise2.default.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      return entity.remove().then(function () {
        res.status(204).end();
      });
    }
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Projects
function index(req, res) {
  return _project2.default.Project.find().exec().then(respondWithResult(res)).catch(handleError(res));
}

// Gets a list of My Projects
function myProjects(req, res) {
  return _project2.default.Project.find({ builder: req.params.id }).populate('type').exec().then(respondWithResult(res)).catch(handleError(res));
}

// Gets a single Project from the DB
function show(req, res) {
  return _project2.default.Project.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

// Creates a new Project in the DB
function create(req, res) {
  var body = req.body.data;
  var total = body.type.rps.base + body.type.rps.devCharges + body.type.rps.others;
  body.type.rps.total = total;
  return _project2.default.ProjectType.create(body.type).then(function (projectType) {
    console.log(req.user._id);
    body.type = projectType._id;
    body.builder = req.user._id;
    _project2.default.Project.create(body).then(respondWithResult(res, 201)).catch(handleError(res));
  }).catch(handleError(res));
  // return Project.Project.create(req.body)
  //   .then(respondWithResult(res, 201))
  //   .catch(handleError(res));
}

// Upserts the given Project in the DB at the specified ID
function upsert(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return _project2.default.Project.findOneAndUpdate(req.params.id, req.body, { upsert: true, setDefaultsOnInsert: true, runValidators: true }).exec().then(respondWithResult(res)).catch(handleError(res));
}

// Updates an existing Project in the DB
function patch(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return _project2.default.Project.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(patchUpdates(req.body)).then(respondWithResult(res)).catch(handleError(res));
}

// Deletes a Project from the DB
function destroy(req, res) {
  return _project2.default.Project.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(removeEntity(res)).catch(handleError(res));
}
//# sourceMappingURL=project.controller.js.map
