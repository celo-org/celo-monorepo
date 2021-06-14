"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var io_1 = require("@celo/utils/lib/io");
var ethereumjs_util_1 = require("ethereumjs-util");
var Either_1 = require("fp-ts/lib/Either");
var t = __importStar(require("io-ts"));
var types_1 = require("./types");
// Provide the type minus the validation that the public key and address are derived from the same private key
exports.AccountClaimTypeH = t.type({
    type: t.literal(types_1.ClaimTypes.ACCOUNT),
    timestamp: types_1.TimestampType,
    address: io_1.AddressType,
    // io-ts way of defining optional key-value pair
    publicKey: t.union([t.undefined, io_1.PublicKeyType]),
});
exports.AccountClaimType = new t.Type('AccountClaimType', exports.AccountClaimTypeH.is, function (unknownValue, context) {
    return Either_1.either.chain(exports.AccountClaimTypeH.validate(unknownValue, context), function (claim) {
        if (claim.publicKey === undefined) {
            return t.success(claim);
        }
        var derivedAddress = ethereumjs_util_1.toChecksumAddress('0x' + ethereumjs_util_1.pubToAddress(Buffer.from(claim.publicKey.slice(2), 'hex'), true).toString('hex'));
        return derivedAddress === claim.address
            ? t.success(claim)
            : t.failure(claim, context, 'public key did not match the address in the claim');
    });
}, function (x) { return x; });
exports.createAccountClaim = function (address, publicKey) {
    var claim = {
        timestamp: types_1.now(),
        type: types_1.ClaimTypes.ACCOUNT,
        address: address,
        publicKey: publicKey,
    };
    var parsedClaim = exports.AccountClaimType.decode(claim);
    if (Either_1.isLeft(parsedClaim)) {
        throw new Error("A valid claim could not be created");
    }
    return parsedClaim.right;
};
//# sourceMappingURL=account.js.map