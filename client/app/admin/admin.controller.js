'use strict';

export default class AdminController {
  /*@ngInject*/
  constructor(User, $http) {
    // Use the User $resource to fetch all users
    this.users = User.query();
    this.$http = $http;
  }

  populate(){
  	this.$http.post('/api/projects/addJson');
  }
  delete(user) {
    user.$remove();
    this.users.splice(this.users.indexOf(user), 1);
  }
}
