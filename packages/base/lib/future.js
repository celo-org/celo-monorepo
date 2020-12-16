"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// A Future is like an exernally fulfillable (resolvable) promise
var Future = /** @class */ (function () {
    function Future() {
        var _this = this;
        this._finished = false;
        this._error = null;
        this.promise = new Promise(function (resolve, reject) {
            _this._resolve = resolve;
            _this._reject = reject;
        });
    }
    Object.defineProperty(Future.prototype, "finished", {
        get: function () {
            return this._finished;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Future.prototype, "error", {
        get: function () {
            return this._error;
        },
        enumerable: true,
        configurable: true
    });
    Future.prototype.resolve = function (value) {
        this._finished = true;
        this._error = null;
        this._resolve(value);
    };
    Future.prototype.reject = function (error) {
        this._finished = true;
        this._error = error;
        this._reject(error);
    };
    Future.prototype.wait = function () {
        return this.promise;
    };
    Future.prototype.asPromise = function () {
        return this.promise;
    };
    return Future;
}());
exports.Future = Future;
function toFuture(p) {
    var future = new Future();
    return pipeToFuture(p, future);
}
exports.toFuture = toFuture;
function pipeToFuture(p, future) {
    p.then(future.resolve.bind(future)).catch(future.reject.bind(future));
    return future;
}
exports.pipeToFuture = pipeToFuture;
//# sourceMappingURL=future.js.map