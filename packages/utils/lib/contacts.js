"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Web3Utils = __importStar(require("web3-utils"));
// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
var contacts_1 = require("@celo/base/lib/contacts");
exports.getContactPhoneNumber = contacts_1.getContactPhoneNumber;
exports.isContact = contacts_1.isContact;
exports.getContactNameHash = function (contact) {
    if (!contact) {
        throw new Error('Invalid contact');
    }
    return Web3Utils.keccak256(contact.displayName || '');
};
//# sourceMappingURL=contacts.js.map