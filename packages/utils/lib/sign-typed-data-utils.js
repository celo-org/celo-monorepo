"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = require("bignumber.js");
var ethereumjs_util_1 = require("ethereumjs-util");
var web3_eth_abi_1 = __importDefault(require("web3-eth-abi"));
/**
 * Generates the EIP712 Typed Data hash for signing
 * @param   typedData An object that conforms to the EIP712TypedData interface
 * @return  A Buffer containing the hash of the typed data.
 */
function generateTypedDataHash(typedData) {
    return ethereumjs_util_1.sha3(Buffer.concat([
        Buffer.from('1901', 'hex'),
        structHash('EIP712Domain', typedData.domain, typedData.types),
        structHash(typedData.primaryType, typedData.message, typedData.types),
    ]));
}
exports.generateTypedDataHash = generateTypedDataHash;
function findDependencies(primaryType, types, found) {
    if (found === void 0) { found = []; }
    if (found.includes(primaryType) || types[primaryType] === undefined) {
        return found;
    }
    found.push(primaryType);
    for (var _i = 0, _a = types[primaryType]; _i < _a.length; _i++) {
        var field = _a[_i];
        for (var _b = 0, _c = findDependencies(field.type, types, found); _b < _c.length; _b++) {
            var dep = _c[_b];
            if (!found.includes(dep)) {
                found.push(dep);
            }
        }
    }
    return found;
}
function encodeType(primaryType, types) {
    var deps = findDependencies(primaryType, types);
    deps = deps.filter(function (d) { return d !== primaryType; });
    deps = [primaryType].concat(deps.sort());
    var result = '';
    for (var _i = 0, deps_1 = deps; _i < deps_1.length; _i++) {
        var dep = deps_1[_i];
        result += dep + "(" + types[dep].map(function (_a) {
            var name = _a.name, type = _a.type;
            return type + " " + name;
        }).join(',') + ")";
    }
    return result;
}
function encodeData(primaryType, data, types) {
    var encodedTypes = ['bytes32'];
    var encodedValues = [typeHash(primaryType, types)];
    for (var _i = 0, _a = types[primaryType]; _i < _a.length; _i++) {
        var field = _a[_i];
        var value = data[field.name];
        if (field.type === 'string' || field.type === 'bytes') {
            var hashValue = ethereumjs_util_1.sha3(value);
            encodedTypes.push('bytes32');
            encodedValues.push(hashValue);
        }
        else if (types[field.type] !== undefined) {
            encodedTypes.push('bytes32');
            var hashValue = ethereumjs_util_1.sha3(
            // tslint:disable-next-line:no-unnecessary-type-assertion
            encodeData(field.type, value, types));
            encodedValues.push(hashValue);
        }
        else if (field.type.lastIndexOf(']') === field.type.length - 1) {
            throw new Error('Arrays currently unimplemented in encodeData');
        }
        else {
            encodedTypes.push(field.type);
            var normalizedValue = normalizeValue(field.type, value);
            encodedValues.push(normalizedValue);
        }
    }
    // @ts-ignore
    return web3_eth_abi_1.default.encodeParameters(encodedTypes, encodedValues);
}
function normalizeValue(type, value) {
    var normalizedValue = type === 'uint256' && bignumber_js_1.BigNumber.isBigNumber(value) ? value.toString() : value;
    return normalizedValue;
}
function typeHash(primaryType, types) {
    return ethereumjs_util_1.sha3(encodeType(primaryType, types));
}
function structHash(primaryType, data, types) {
    return ethereumjs_util_1.sha3(encodeData(primaryType, data, types));
}
exports.structHash = structHash;
//# sourceMappingURL=sign-typed-data-utils.js.map