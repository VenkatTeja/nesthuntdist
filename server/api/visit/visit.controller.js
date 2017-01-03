/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/visits              ->  index
 * POST    /api/visits              ->  create
 * GET     /api/visits/:id          ->  show
 * PUT     /api/visits/:id          ->  upsert
 * PATCH   /api/visits/:id          ->  patch
 * DELETE  /api/visits/:id          ->  destroy
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.index = index;
exports.show = show;
exports.create = create;
exports.upsert = upsert;
exports.patch = patch;
exports.destroy = destroy;

var _fastJsonPatch = require('fast-json-patch');

var _fastJsonPatch2 = _interopRequireDefault(_fastJsonPatch);

var _visit = require('./visit.model');

var _visit2 = _interopRequireDefault(_visit);

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

// Gets a list of Visits
function index(req, res) {
  return _visit2.default.find({ user: req.user._id }).populate('project').exec().then(respondWithResult(res)).catch(handleError(res));
}

// Gets a single Visit from the DB
function show(req, res) {
  return _visit2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

// Creates a new Visit in the DB
function create(req, res) {
  req.body.user = req.user._id;
  var date = new Date();
  if (req.body.time == '10-11am') {
    req.body.time = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0, 0, 0);
  } else if (req.body.time == '1-2pm') {
    req.body.time = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 13, 0, 0, 0);
  } else if (req.body.time == '4-5pm') {
    req.body.time = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 16, 0, 0, 0);
  } else return res.send(400, { message: 'Incorrect time' });

  if (date > req.body.time) req.body.time.setDate(req.body.time.getDate() + 1);

  return _visit2.default.create(req.body).then(respondWithResult(res, 201)).catch(handleError(res));
}

// Upserts the given Visit in the DB at the specified ID
function upsert(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return _visit2.default.findOneAndUpdate(req.params.id, req.body, { upsert: true, setDefaultsOnInsert: true, runValidators: true }).exec().then(respondWithResult(res)).catch(handleError(res));
}

// Updates an existing Visit in the DB
function patch(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  return _visit2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(patchUpdates(req.body)).then(respondWithResult(res)).catch(handleError(res));
}

// Deletes a Visit from the DB
function destroy(req, res) {
  return _visit2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(removeEntity(res)).catch(handleError(res));
}
//# sourceMappingURL=visit.controller.js.map
