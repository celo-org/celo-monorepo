"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Web3Utils = __importStar(require("web3-utils"));
var address_1 = require("./address");
var signatureUtils_1 = require("./signatureUtils");
describe('signatures', function () {
    it('should sign appropriately with a hash of a message', function () {
        var pKey = '0x62633f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2';
        var address = address_1.privateKeyToAddress(pKey);
        var messageHash = Web3Utils.soliditySha3({ type: 'string', value: 'identifier' });
        var signature = signatureUtils_1.signMessageWithoutPrefix(messageHash, pKey, address);
        var serializedSig = signatureUtils_1.serializeSignature(signature);
        signatureUtils_1.parseSignatureWithoutPrefix(messageHash, serializedSig, address);
    });
    it('should sign appropriately with just the message', function () {
        var pKey = '0x62633f7c9583780a7d3904a2f55d792707c345f21de1bacb2d389934d82796b2';
        var address = address_1.privateKeyToAddress(pKey);
        var message = 'mymessage';
        var signature = signatureUtils_1.signMessage(message, pKey, address);
        var serializedSig = signatureUtils_1.serializeSignature(signature);
        signatureUtils_1.parseSignature(message, serializedSig, address);
    });
});
//# sourceMappingURL=signatureUtils.test.js.map