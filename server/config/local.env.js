'use strict';

// Use local.env.js for environment variables that will be set when the server starts locally.
// Use for your api keys, secrets, etc. This file should not be tracked by git.
//
// You will need to set these on the server you deploy to.

module.exports = {
  DOMAIN: 'http://localhost:9000',
  SESSION_SECRET: 'nesthunt-secret',

  FACEBOOK_ID: 'app-id',
  FACEBOOK_SECRET: 'secret',

  TWITTER_ID: 'app-id',
  TWITTER_SECRET: 'secret',

  GOOGLE_ID: 'app-id',
  GOOGLE_SECRET: 'secret',

  // Control debug level for modules using visionmedia/debug
  DEBUG: '',

  //Cellar
  CELLAR_ADDON_KEY_SECRET: 'eOYEwn__lG2tuQlnaswTfb3AcFu2Ax1aZTN5vQ==',
  CELLAR_ADDON_KEY_ID: 'BS_Q2KO01FR4FVGUDEFS',
  CELLAR_ADDON_HOST: 'cellar.services.clever-cloud.com',
  BUCKET: 'nesthunttest'
};
//# sourceMappingURL=local.env.js.map
