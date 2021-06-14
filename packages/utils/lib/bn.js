"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function compareBN(a, b) {
    if (a.eq(b)) {
        return 0;
    }
    else if (a.lt(b)) {
        return -1;
    }
    else {
        return 1;
    }
}
exports.compareBN = compareBN;
//# sourceMappingURL=bn.js.map