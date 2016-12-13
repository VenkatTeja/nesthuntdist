'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.index = index;
exports.create = create;
exports.show = show;
exports.destroy = destroy;
exports.editBuilderProfile = editBuilderProfile;
exports.changePassword = changePassword;
exports.me = me;
exports.authCallback = authCallback;

var _user = require('./user.model');

var _user2 = _interopRequireDefault(_user);

var _environment = require('../../config/environment');

var _environment2 = _interopRequireDefault(_environment);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function (err) {
    return res.status(statusCode).json(err);
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    return res.status(statusCode).send(err);
  };
}

/**
 * Get list of users
 * restriction: 'admin'
 */
function index(req, res) {
  return _user2.default.find({}, '-salt -password').exec().then(function (users) {
    res.status(200).json(users);
  }).catch(handleError(res));
}

/**
 * Creates a new user
 */
function create(req, res) {
  var newUser = new _user2.default(req.body);
  newUser.provider = 'local';

  if (newUser.role == 'admin') return res.send(400, { message: "Bad Request" });
  newUser.loanEstimate = (0.3 * newUser.income - newUser.currentEmi) * 120;
  newUser.save().then(function (user) {
    var token = _jsonwebtoken2.default.sign({ _id: user._id }, _environment2.default.secrets.session, {
      expiresIn: 60 * 60 * 5
    });
    res.json({ token: token, _id: user._id });
  }).catch(validationError(res));
}

/**
 * Get a single user
 */
function show(req, res, next) {
  var userId = req.params.id;

  return _user2.default.findById(userId).exec().then(function (user) {
    if (!user) {
      return res.status(404).end();
    }
    res.json(user.profile);
  }).catch(function (err) {
    return next(err);
  });
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
function destroy(req, res) {
  return _user2.default.findByIdAndRemove(req.params.id).exec().then(function () {
    res.status(204).end();
  }).catch(handleError(res));
}

/* editBuilderProfile */
function editBuilderProfile(req, res) {
  var body = req.body.data;
  var key = ["name", "lastname", "regPhone", "regAddress", "cin", "website"];
  for (var i = 0; i < 6; ++i) {
    if (body.hasOwnProperty(key[i])) {
      if (_validator2.default.isEmpty(body[key[i]])) return res.send(400, { message: key + " is empty" });
    }
  }if (!_validator2.default.isLength(body.regPhone, { min: 10, max: 10 })) return res.send(400, { message: "Phone number 10 digits only" });
  if (!_validator2.default.isInt(body.regPhone)) return res.send(400, { message: "Phone number is number only" });
  if (!_validator2.default.isLength(body.cin, { min: 21, max: 21 })) return res.send(400, { message: "CIN 21 digits only" });
  // Checks passed

  return _user2.default.findById(req.user._id).exec().then(function (user) {
    console.log(user, 22243);
    user.name = body.name;
    user.lastname = body.lastname;
    user.cin = body.cin;
    user.regPhone = body.regPhone;
    user.regAddress = body.regAddress;
    user.website = body.website;

    user.save().then(function () {
      res.status(204).end();
    }).catch(validationError(res));
  }).catch(validationError(res));
}
/**
 * Change a users password
 */
function changePassword(req, res) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  return _user2.default.findById(userId).exec().then(function (user) {
    if (user.authenticate(oldPass)) {
      user.password = newPass;
      return user.save().then(function () {
        res.status(204).end();
      }).catch(validationError(res));
    } else {
      return res.status(403).end();
    }
  });
}

/**
 * Get my info
 */
function me(req, res, next) {
  var userId = req.user._id;

  return _user2.default.findOne({ _id: userId }, '-salt -password').exec().then(function (user) {
    // don't ever give out the password or salt
    if (!user) {
      return res.status(401).end();
    }
    res.json(user);
  }).catch(function (err) {
    return next(err);
  });
}

/**
 * Authentication callback
 */
function authCallback(req, res) {
  res.redirect('/');
}
//# sourceMappingURL=user.controller.js.map
