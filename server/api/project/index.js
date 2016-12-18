'use strict';

var _auth = require('../../auth/auth.service');

var auth = _interopRequireWildcard(_auth);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var express = require('express');
var controller = require('./project.controller');

var multiparty = require('connect-multiparty'),
    multipartyMiddleware = multiparty();

var router = express.Router();

router.get('/', controller.index);
router.get('/myProjects/:id', auth.isAuthenticated(), controller.myProjects);
router.get('/:id', controller.show);
router.post('/', auth.isAuthenticated(), controller.create);
router.post('/addJson', auth.isAuthenticated(), controller.addJson);
router.post('/uploadfile', auth.isAuthenticated(), multipartyMiddleware, controller.uploadfile);
router.put('/:id', controller.upsert);
router.patch('/:id', controller.patch);
router.delete('/:id', controller.destroy);

module.exports = router;
//# sourceMappingURL=index.js.map
