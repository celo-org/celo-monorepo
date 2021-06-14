"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/utils/lib/address");
var local_signer_1 = require("./signers/local-signer");
var wallet_1 = require("./wallet");
var LocalWallet = /** @class */ (function (_super) {
    __extends(LocalWallet, _super);
    function LocalWallet() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Register the private key as signer account
     * @param privateKey account private key
     */
    LocalWallet.prototype.addAccount = function (privateKey) {
        // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
        privateKey = address_1.normalizeAddressWith0x(privateKey);
        var accountAddress = address_1.normalizeAddressWith0x(address_1.privateKeyToAddress(privateKey));
        if (this.hasAccount(accountAddress)) {
            return;
        }
        this.addSigner(accountAddress, new local_signer_1.LocalSigner(privateKey));
    };
    return LocalWallet;
}(wallet_1.WalletBase));
exports.LocalWallet = LocalWallet;
//# sourceMappingURL=local-wallet.js.map