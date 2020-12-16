"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getErrorMessage(error) {
    // This replacement is because when the error reaches here, it's been wrapped
    // by Error: multiple times
    var errorMsg = error.message || error.name || 'unknown';
    errorMsg = errorMsg.replace(/Error:/g, '');
    if (error.stack) {
        errorMsg += ' in ' + error.stack.substring(0, 100);
    }
    return errorMsg;
}
exports.getErrorMessage = getErrorMessage;
//# sourceMappingURL=displayFormatting.js.map