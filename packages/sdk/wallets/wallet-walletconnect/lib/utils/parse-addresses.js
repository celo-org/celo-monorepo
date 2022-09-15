"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAddress = void 0;
var utils_1 = require("@celo/utils");
function invalidChain(chain) {
    return chain !== 'celo' && chain !== 'eip155';
}
// celo:0x123
function parseShortNameAddress(addressLike) {
    var _a = __read(addressLike.split(':'), 2), celo = _a[0], address = _a[1];
    if (invalidChain(celo) || !utils_1.AddressUtils.isValidAddress(address)) {
        throw new Error('Invalid short name address');
    }
    // default to mainnet
    return { address: address, networkId: '42220' };
}
// <address>@<chain>:<network_id>
// 0x123@celo:1234
// 0x123@eip155:1234
function parseCaip50Address(addressLike) {
    var _a = __read(addressLike.split(/[@:]/), 3), address = _a[0], chain = _a[1], networkId = _a[2];
    if (!utils_1.AddressUtils.isValidAddress(address) || invalidChain(chain)) {
        throw new Error("Invalid CAIP50 address " + address);
    }
    return { address: address, networkId: networkId };
}
// <chain>:<network_id>:<address>
// celo:1234:0x123
// eip155:1234:0x123
function parseCaip10Address(addressLike) {
    var _a = __read(addressLike.split(':'), 3), chain = _a[0], networkId = _a[1], address = _a[2];
    if (!utils_1.AddressUtils.isValidAddress(address) || invalidChain(chain)) {
        throw new Error("Invalid CAIP10 address " + address);
    }
    return { address: address, networkId: networkId };
}
function parseAddress(addressLike) {
    var e_1, _a;
    var lastError = null;
    try {
        for (var _b = __values([parseCaip10Address, parseCaip50Address, parseShortNameAddress]), _c = _b.next(); !_c.done; _c = _b.next()) {
            var parse = _c.value;
            try {
                return parse(addressLike);
            }
            catch (e) {
                lastError = e;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    throw lastError;
}
exports.parseAddress = parseAddress;
//# sourceMappingURL=parse-addresses.js.map