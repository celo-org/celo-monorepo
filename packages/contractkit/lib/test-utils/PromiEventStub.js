"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
function promiEventSpy() {
    var _a;
    var ee = new events_1.EventEmitter();
    var pe = (_a = {
            // Not sure why this is failing right now
            // @ts-ignore
            finally: function () {
                throw new Error('not implemented');
            },
            catch: function () {
                throw new Error('not implemented');
            },
            then: function () {
                throw new Error('not implemented');
            },
            on: (function (event, listener) { return ee.on(event, listener); }),
            once: (function (event, listener) { return ee.once(event, listener); })
        },
        _a[Symbol.toStringTag] = 'Not Implemented',
        _a.emitter = ee,
        _a.resolveHash = function (hash) {
            ee.emit('transactionHash', hash);
        },
        _a.resolveReceipt = function (receipt) {
            ee.emit('receipt', receipt);
        },
        _a.rejectHash = function (error) {
            ee.emit('error', error, false);
        },
        _a.rejectReceipt = function (receipt, error) {
            ee.emit('error', error, receipt);
        },
        _a);
    return pe;
}
exports.promiEventSpy = promiEventSpy;
//# sourceMappingURL=PromiEventStub.js.map