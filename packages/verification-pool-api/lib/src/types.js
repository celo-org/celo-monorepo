"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MessageState;
(function (MessageState) {
    MessageState[MessageState["DISPATCHING"] = 0] = "DISPATCHING";
    MessageState[MessageState["ASSIGNED"] = 1] = "ASSIGNED";
    MessageState[MessageState["SENT"] = 2] = "SENT";
    MessageState[MessageState["EXPIRED"] = 3] = "EXPIRED";
    MessageState[MessageState["REWARDED"] = 4] = "REWARDED";
})(MessageState = exports.MessageState || (exports.MessageState = {}));
var TokenType;
(function (TokenType) {
    TokenType["GOLD"] = "gold";
    TokenType["DOLLAR"] = "dollar";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
//# sourceMappingURL=types.js.map