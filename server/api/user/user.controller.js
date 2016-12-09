'use strict';

import User from './user.model';
import config from '../../config/environment';
import jwt from 'jsonwebtoken';
import validator from 'validator';

function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function(err) {
    return res.status(statusCode).json(err);
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    return res.status(statusCode).send(err);
  };
}

/**
 * Get list of users
 * restriction: 'admin'
 */
export function index(req, res) {
  return User.find({}, '-salt -password').exec()
    .then(users => {
      res.status(200).json(users);
    })
    .catch(handleError(res));
}

/**
 * Creates a new user
 */
export function create(req, res) {
  var newUser = new User(req.body);
  newUser.provider = 'local';

  if(newUser.role=='admin')
    return res.send(400,{message:"Bad Request"});
  newUser.loanEstimate = ((0.3*newUser.income)-newUser.currentEmi)*120;
  newUser.save()
    .then(function(user) {
      var token = jwt.sign({ _id: user._id }, config.secrets.session, {
        expiresIn: 60 * 60 * 5
      });
      res.json({ token:token, _id:user._id });
    })
    .catch(validationError(res));
}

/**
 * Get a single user
 */
export function show(req, res, next) {
  var userId = req.params.id;

  return User.findById(userId).exec()
    .then(user => {
      if(!user) {
        return res.status(404).end();
      }
      res.json(user.profile);
    })
    .catch(err => next(err));
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
export function destroy(req, res) {
  return User.findByIdAndRemove(req.params.id).exec()
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
}


/* editBuilderProfile */
export function editBuilderProfile(req, res){
  var body = req.body.data;
  var key = ["name", "lastname", "regPhone", "regAddress", "cin", "website"];
  for(var i=0;i<6;++i)
    if(body.hasOwnProperty(key[i])){
      if(validator.isEmpty(body[key[i]]))
        return res.send(400,{message: key+" is empty"});
    }
  if(!validator.isLength(body.regPhone, {min:10,max:10}))
    return res.send(400,{message: "Phone number 10 digits only"});
  if(!validator.isInt(body.regPhone))
    return res.send(400,{message: "Phone number is number only"});
  if(!validator.isLength(body.cin, {min:21,max:21}))
    return res.send(400,{message: "CIN 21 digits only"});
  // Checks passed

  return User.findById(req.user._id).exec()
    .then(function(user){
      console.log(user,22243);
      user.name = body.name;
      user.lastname = body.lastname;
      user.cin = body.cin;
      user.regPhone = body.regPhone;
      user.regAddress = body.regAddress;
      user.website = body.website;

      user.save().then(()=>{
        res.status(204).end();
      })
      .catch(validationError(res));
    })
    .catch(validationError(res));
}
/**
 * Change a users password
 */
export function changePassword(req, res) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  return User.findById(userId).exec()
    .then(user => {
      if(user.authenticate(oldPass)) {
        user.password = newPass;
        return user.save()
          .then(() => {
            res.status(204).end();
          })
          .catch(validationError(res));
      } else {
        return res.status(403).end();
      }
    });
}

/**
 * Get my info
 */
export function me(req, res, next) {
  var userId = req.user._id;

  return User.findOne({ _id: userId }, '-salt -password').exec()
    .then(user => { // don't ever give out the password or salt
      if(!user) {
        return res.status(401).end();
      }
      res.json(user);
    })
    .catch(err => next(err));
}

/**
 * Authentication callback
 */
export function authCallback(req, res) {
  res.redirect('/');
}
