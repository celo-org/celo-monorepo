"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function appendPath(baseUrl, path) {
    var lastChar = baseUrl[baseUrl.length - 1];
    if (lastChar === '/') {
        return baseUrl + path;
    }
    return baseUrl + '/' + path;
}
exports.appendPath = appendPath;
exports.StringBase = {
    appendPath: appendPath,
};
//# sourceMappingURL=string.js.map