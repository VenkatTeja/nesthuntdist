'use strict';

import angular from 'angular';

export default class SignupController {

  /*@ngInject*/
  constructor(Auth, $state) {
    this.Auth = Auth;
    this.$state = $state;
  }

  register(form) {
    this.submitted = true;

    if(form.$valid) {
      return this.Auth.createUser({
        username: this.user.username,
        email: this.user.email,
        password: this.user.password,
        role: this.user.role
      })
        .then((user,user2) => {
          // Account created, redirect to home
          console.log(user, user2);
          this.$state.go('profile',{'id':user._id});
        })
        .catch(err => {
          err = err.data;
          this.errors = {};
          // Update validity of form fields that match the mongoose errors
          angular.forEach(err.errors, (error, field) => {
            form[field].$setValidity('mongoose', false);
            this.errors[field] = error.message;
          });
        });
    }
  }
}
