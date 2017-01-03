'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

var PurchaseSchema = new Schema({
  buyer: { type: Schema.Types.ObjectId, ref: 'User' },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  loanReq: String,
  propertyType: String,

  // Bank details
  bank: { bankCode: String,
    branchCode: String,
    accountNo: String,
    accountType: String,
    since: String,
    isPrimary: String,
    isMicrcode: String
  },

  // Reference
  reference: { name: String,
    relation: String,
    address1: String,
    address2: String,
    address3: String,
    city: String,
    country: String,
    state: String,
    pincode: String,
    email: String,
    mobile: String,
    phone: String
  }
});

exports.default = _mongoose2.default.model('Purchase', PurchaseSchema);
//# sourceMappingURL=purchase.model.js.map
