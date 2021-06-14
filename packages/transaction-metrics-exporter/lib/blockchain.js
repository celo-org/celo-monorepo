"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var contractkit_1 = require("@celo/contractkit");
var block_explorer_1 = require("@celo/contractkit/lib/explorer/block-explorer");
var log_explorer_1 = require("@celo/contractkit/lib/explorer/log-explorer");
var future_1 = require("@celo/utils/lib/future");
var logger_1 = require("@celo/utils/lib/logger");
var task_1 = require("@celo/utils/lib/task");
var metrics_1 = require("./metrics");
var EMPTY_INPUT = 'empty_input';
var NO_METHOD_ID = 'no_method_id';
var NOT_WHITELISTED_ADDRESS = 'not_whitelisted_address';
var UNKNOWN_METHOD = 'unknown_method';
function metricExporterWithRestart(providerUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var kit, reason, maybeKit, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    console.log('MetricExporter: Start');
                    kit = contractkit_1.newKit(providerUrl);
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 6];
                    console.log('MetricExporter: Run Start');
                    return [4 /*yield*/, runMetricExporter(kit)];
                case 2:
                    reason = _a.sent();
                    if (!(reason.reason === 'not-listening')) return [3 /*break*/, 4];
                    console.error('MetricExporter: Web3 Not listening... retrying');
                    return [4 /*yield*/, newListeningKit(providerUrl)];
                case 3:
                    maybeKit = _a.sent();
                    if (maybeKit != null) {
                        kit = maybeKit;
                    }
                    else {
                        console.error('MetricExporter: Retry failed. Exiting');
                    }
                    return [3 /*break*/, 5];
                case 4:
                    console.error('MetricExporter: Error %s', reason.reason);
                    console.error(reason.error);
                    process.exit(1);
                    _a.label = 5;
                case 5: return [3 /*break*/, 1];
                case 6: return [3 /*break*/, 8];
                case 7:
                    err_1 = _a.sent();
                    console.error('MetricExporter: Unexpected error %s', err_1.message);
                    console.error(err_1);
                    process.exit(1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports.metricExporterWithRestart = metricExporterWithRestart;
function runMetricExporter(kit) {
    return __awaiter(this, void 0, void 0, function () {
        var blockProcessor, provider, subscription, listeningWatcher, endReason, endExporter;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, newBlockHeaderProcessor(kit)];
                case 1:
                    blockProcessor = _a.sent();
                    provider = kit.web3.currentProvider;
                    return [4 /*yield*/, kit.web3.eth.subscribe('newBlockHeaders')];
                case 2:
                    subscription = _a.sent();
                    subscription.on('data', blockProcessor);
                    listeningWatcher = task_1.conditionWatcher({
                        name: 'check:kit:isListening',
                        logger: logger_1.consoleLogger,
                        timeInBetweenMS: 5000,
                        initialDelayMS: 5000,
                        pollCondition: function () { return __awaiter(_this, void 0, void 0, function () {
                            var error_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, kit.isListening()];
                                    case 1: return [2 /*return*/, !(_a.sent())];
                                    case 2:
                                        error_1 = _a.sent();
                                        console.error(error_1);
                                        return [2 /*return*/, true];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); },
                        onSuccess: function () { return endExporter({ reason: 'not-listening' }); },
                    });
                    provider.on('error', (function (error) { return endExporter({ reason: 'connection-error', error: error }); }));
                    subscription.on('error', function (error) { return endExporter({ reason: 'subscription-error', error: error }); });
                    endReason = new future_1.Future();
                    endExporter = function (reason) {
                        listeningWatcher.stop();
                        subscription.unsubscribe();
                        provider.removeAllListeners('error');
                        provider.disconnect();
                        endReason.resolve(reason);
                    };
                    return [2 /*return*/, endReason.asPromise()];
            }
        });
    });
}
exports.runMetricExporter = runMetricExporter;
function newListeningKit(providerUrl) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                return [2 /*return*/, task_1.tryObtainValueWithRetries({
                        name: 'createValidKit',
                        logger: logger_1.consoleLogger,
                        maxAttemps: 10,
                        timeInBetweenMS: 5000,
                        tryGetValue: function () {
                            var kit = contractkit_1.newKit(providerUrl);
                            return kit.isListening().then(function (isOk) { return (isOk ? kit : null); });
                        },
                    }).onValue()];
            }
            catch (_b) {
                return [2 /*return*/, null];
            }
            return [2 /*return*/];
        });
    });
}
var logEvent = function (name, details) {
    return console.log(JSON.stringify(__assign({ event: name }, details)));
};
function newBlockHeaderProcessor(kit) {
    return __awaiter(this, void 0, void 0, function () {
        function toMethodId(txInput, isKnownCall) {
            var methodId;
            if (txInput === '0x') {
                methodId = EMPTY_INPUT;
            }
            else if (txInput.startsWith('0x')) {
                methodId = isKnownCall ? txInput.slice(0, 10) : UNKNOWN_METHOD;
            }
            else {
                // pretty much should never get here
                methodId = NO_METHOD_ID;
            }
            return methodId;
        }
        function toTxMap(parsedBlock) {
            var parsedTxMap = new Map();
            parsedBlock.parsedTx.forEach(function (ptx) {
                parsedTxMap.set(ptx.tx.hash, ptx);
            });
            return parsedTxMap;
        }
        var blockExplorer, logExplorer;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, block_explorer_1.newBlockExplorer(kit)];
                case 1:
                    blockExplorer = _a.sent();
                    return [4 /*yield*/, log_explorer_1.newLogExplorer(kit)];
                case 2:
                    logExplorer = _a.sent();
                    return [2 /*return*/, function (header) { return __awaiter(_this, void 0, void 0, function () {
                            var block, previousBlock, blockTime, parsedBlock, parsedTxMap, _i, _a, tx, parsedTx, receipt, labels, _b, _c, event_1;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        metrics_1.Counters.blockheader.inc({ miner: header.miner });
                                        return [4 /*yield*/, blockExplorer.fetchBlock(header.number)];
                                    case 1:
                                        block = _d.sent();
                                        return [4 /*yield*/, blockExplorer.fetchBlock(header.number - 1)];
                                    case 2:
                                        previousBlock = _d.sent();
                                        blockTime = Number(block.timestamp) - Number(previousBlock.timestamp);
                                        logEvent('RECEIVED_BLOCK', __assign(__assign({}, block), { blockTime: blockTime }));
                                        parsedBlock = blockExplorer.parseBlock(block);
                                        parsedTxMap = toTxMap(parsedBlock);
                                        _i = 0, _a = parsedBlock.block.transactions;
                                        _d.label = 3;
                                    case 3:
                                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                                        tx = _a[_i];
                                        parsedTx = parsedTxMap.get(tx.hash);
                                        logEvent('RECEIVED_TRANSACTION', tx);
                                        return [4 /*yield*/, kit.web3.eth.getTransactionReceipt(tx.hash)];
                                    case 4:
                                        receipt = _d.sent();
                                        logEvent('RECEIVED_TRANSACTION_RECEIPT', receipt);
                                        labels = {
                                            to: parsedTx ? tx.to : NOT_WHITELISTED_ADDRESS,
                                            methodId: toMethodId(tx.input, parsedTx != null),
                                            status: receipt.status.toString(),
                                        };
                                        metrics_1.Counters.transaction.inc(labels);
                                        metrics_1.Counters.transactionGasUsed.observe(labels, receipt.gasUsed);
                                        metrics_1.Counters.transactionLogs.inc(labels, (receipt.logs || []).length);
                                        if (parsedTx) {
                                            metrics_1.Counters.parsedTransaction.inc({
                                                contract: parsedTx.callDetails.contract,
                                                function: parsedTx.callDetails.function,
                                            });
                                            logEvent('RECEIVED_PARSED_TRANSACTION', __assign(__assign({}, parsedTx.callDetails), { hash: tx.hash }));
                                            for (_b = 0, _c = logExplorer.getKnownLogs(receipt); _b < _c.length; _b++) {
                                                event_1 = _c[_b];
                                                metrics_1.Counters.transactionParsedLogs.inc({
                                                    contract: parsedTx.callDetails.contract,
                                                    function: parsedTx.callDetails.function,
                                                    log: event_1.event,
                                                });
                                                // @ts-ignore We want to rename event => eventName to avoid overwriting
                                                event_1.eventName = event_1.event;
                                                delete event_1.event;
                                                logEvent('RECEIVED_PARSED_LOG', event_1);
                                            }
                                        }
                                        _d.label = 5;
                                    case 5:
                                        _i++;
                                        return [3 /*break*/, 3];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        }); }];
            }
        });
    });
}
//# sourceMappingURL=blockchain.js.map