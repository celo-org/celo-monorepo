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
exports.getContactPhoneNumber = function (contact) {
    if (!contact) {
        throw new Error('Invalid contact');
    }
    if (!contact.phoneNumbers || !contact.phoneNumbers.length) {
        return null;
    }
    // TODO(Rossy) find the right phone number based on the address
    return contact.phoneNumbers[0].number;
};
exports.getContactNameHash = function (contact) {
    if (!contact) {
        throw new Error('Invalid contact');
    }
    return Web3Utils.keccak256(contact.displayName || '');
};
function isContact(contactOrNumber) {
    if (typeof contactOrNumber === 'object') {
        return 'recordID' in contactOrNumber;
    }
    return false;
}
exports.isContact = isContact;
//# sourceMappingURL=contacts.js.map