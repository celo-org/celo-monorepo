"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var base = __importStar(require("@celo/base/lib/collections"));
// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
var collections_1 = require("@celo/base/lib/collections");
exports.intersection = collections_1.intersection;
exports.notEmpty = collections_1.notEmpty;
exports.zip = collections_1.zip;
exports.zip3 = collections_1.zip3;
// BigNumber comparator
var bigNumberComparator = function (a, b) { return a.lt(b); };
function linkedListChange(sortedList, change) {
    return base.linkedListChange(sortedList, change, bigNumberComparator);
}
exports.linkedListChange = linkedListChange;
function linkedListChanges(sortedList, changeList) {
    return base.linkedListChanges(sortedList, changeList, bigNumberComparator);
}
exports.linkedListChanges = linkedListChanges;
//# sourceMappingURL=collections.js.map