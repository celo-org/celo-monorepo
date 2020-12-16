"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var LockEvent;
(function (LockEvent) {
    LockEvent["Unlock"] = "unlock";
})(LockEvent || (LockEvent = {}));
// Lock which can be used to ensure mutual exclusion in concurrent code.
//
// This lock is non-reentrant, and attempting to acquire it while holding the lock will result in a deadlock.
var Lock = /** @class */ (function () {
    function Lock() {
        this.locked = false;
        this.emitter = new events_1.EventEmitter();
    }
    // Attempt to acquire the lock without blocking.
    // @returns {boolean} True if the lock was acquired.
    Lock.prototype.tryAcquire = function () {
        if (!this.locked) {
            this.locked = true;
            return true;
        }
        return false;
    };
    // Acquire the lock, blocking until the lock is available.
    Lock.prototype.acquire = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // Attempt to grab the lock without waiting.
            if (_this.tryAcquire()) {
                resolve();
                return;
            }
            // Wait for an event emitted when releasing the lock.
            var callback = function () {
                try {
                    if (_this.tryAcquire()) {
                        _this.emitter.removeListener(LockEvent.Unlock, callback);
                        resolve();
                    }
                }
                catch (error) {
                    reject(error);
                }
            };
            _this.emitter.on(LockEvent.Unlock, callback);
        });
    };
    // Release the lock such that another caller can acquire it.
    // If not locked, calling this method has no effect.
    Lock.prototype.release = function () {
        if (this.locked) {
            this.locked = false;
            this.emitter.emit(LockEvent.Unlock);
        }
    };
    return Lock;
}());
exports.Lock = Lock;
//# sourceMappingURL=lock.js.map