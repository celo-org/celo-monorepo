"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// from http://urlregex.com/
exports.URL_REGEX = new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/);
exports.isValidUrl = function (url) { return exports.URL_REGEX.test(url); };
//# sourceMappingURL=io.js.map