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
// NOTE: removing this import results in `yarn build` failures in Dockerfiles
// after the move to node 10. This allows types to be inferred without
// referencing '@celo/utils/node_modules/bignumber.js'
require("bignumber.js");
var BaseWrapper_1 = require("./BaseWrapper");
/**
 * ERC-20 contract for Celo native currency.
 */
var GoldTokenWrapper = /** @class */ (function (_super) {
    __extends(GoldTokenWrapper, _super);
    function GoldTokenWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         * Querying allowance.
         * @param from Account who has given the allowance.
         * @param to Address of account to whom the allowance was given.
         * @returns Amount of allowance.
         */
        _this.allowance = BaseWrapper_1.proxyCall(_this.contract.methods.allowance, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Returns the name of the token.
         * @returns Name of the token.
         */
        _this.name = BaseWrapper_1.proxyCall(_this.contract.methods.name, undefined, function (a) { return a.toString(); });
        /**
         * Returns the three letter symbol of the token.
         * @returns Symbol of the token.
         */
        _this.symbol = BaseWrapper_1.proxyCall(_this.contract.methods.symbol, undefined, function (a) { return a.toString(); });
        /**
         * Returns the number of decimals used in the token.
         * @returns Number of decimals.
         */
        _this.decimals = BaseWrapper_1.proxyCall(_this.contract.methods.decimals, undefined, BaseWrapper_1.valueToInt);
        /**
         * Returns the total supply of the token, that is, the amount of tokens currently minted.
         * @returns Total supply.
         */
        _this.totalSupply = BaseWrapper_1.proxyCall(_this.contract.methods.totalSupply, undefined, BaseWrapper_1.valueToBigNumber);
        /**
         * Approve a user to transfer Celo Gold on behalf of another user.
         * @param spender The address which is being approved to spend Celo Gold.
         * @param value The amount of Celo Gold approved to the spender.
         * @return True if the transaction succeeds.
         */
        _this.approve = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.approve);
        /**
         * Increases the allowance of another user.
         * @param spender The address which is being approved to spend Celo Gold.
         * @param value The increment of the amount of Celo Gold approved to the spender.
         * @returns true if success.
         */
        _this.increaseAllowance = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.increaseAllowance, BaseWrapper_1.tupleParser(BaseWrapper_1.stringIdentity, BaseWrapper_1.valueToString));
        /**
         * Decreases the allowance of another user.
         * @param spender The address which is being approved to spend Celo Gold.
         * @param value The decrement of the amount of Celo Gold approved to the spender.
         * @returns true if success.
         */
        _this.decreaseAllowance = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.decreaseAllowance);
        /**
         * Transfers Celo Gold from one address to another with a comment.
         * @param to The address to transfer Celo Gold to.
         * @param value The amount of Celo Gold to transfer.
         * @param comment The transfer comment
         * @return True if the transaction succeeds.
         */
        _this.transferWithComment = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.transferWithComment);
        /**
         * Transfers Celo Gold from one address to another.
         * @param to The address to transfer Celo Gold to.
         * @param value The amount of Celo Gold to transfer.
         * @return True if the transaction succeeds.
         */
        _this.transfer = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.transfer);
        /**
         * Transfers Celo Gold from one address to another on behalf of a user.
         * @param from The address to transfer Celo Gold from.
         * @param to The address to transfer Celo Gold to.
         * @param value The amount of Celo Gold to transfer.
         * @return True if the transaction succeeds.
         */
        _this.transferFrom = BaseWrapper_1.proxySend(_this.kit, _this.contract.methods.transferFrom);
        /**
         * Gets the balance of the specified address.
         * @param owner The address to query the balance of.
         * @return The balance of the specified address.
         */
        _this.balanceOf = function (account) { return _this.kit.web3.eth.getBalance(account).then(BaseWrapper_1.valueToBigNumber); };
        return _this;
    }
    return GoldTokenWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.GoldTokenWrapper = GoldTokenWrapper;
//# sourceMappingURL=GoldTokenWrapper.js.map