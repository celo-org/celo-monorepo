"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function isContact(contactOrNumber) {
    if (typeof contactOrNumber === 'object') {
        return 'recordID' in contactOrNumber;
    }
    return false;
}
exports.isContact = isContact;
//# sourceMappingURL=contacts.js.map