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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@celo/utils");
var async_1 = require("@celo/utils/lib/async");
var collections_1 = require("@celo/utils/lib/collections");
var parsing_1 = require("@celo/utils/lib/parsing");
var address_1 = require("@celo/utils/src/address");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var cross_fetch_1 = __importDefault(require("cross-fetch"));
var base_1 = require("../base");
var identity_1 = require("../identity");
var BaseWrapper_1 = require("./BaseWrapper");
/**
 * Contract for managing identities
 */
var AttestationState;
(function (AttestationState) {
    AttestationState[AttestationState["None"] = 0] = "None";
    AttestationState[AttestationState["Incomplete"] = 1] = "Incomplete";
    AttestationState[AttestationState["Complete"] = 2] = "Complete";
})(AttestationState = exports.AttestationState || (exports.AttestationState = {}));
function parseGetCompletableAttestations(response) {
    var metadataURLs = parsing_1.parseSolidityStringArray(response[2].map(BaseWrapper_1.valueToInt), response[3]);
    return collections_1.zip3(response[0].map(BaseWrapper_1.valueToInt), response[1], metadataURLs).map(function (_a) {
        var blockNumber = _a[0], issuer = _a[1], metadataURL = _a[2];
        return ({ blockNumber: blockNumber, issuer: issuer, metadataURL: metadataURL });
    });
}
var AttestationsWrapper = /** @class */ (function (_super) {
    __extends(AttestationsWrapper, _super);
    function AttestationsWrapper() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /**
         *  Returns the time an attestation can be completable before it is considered expired
         */
        _this.attestationExpiryBlocks = BaseWrapper_1.proxyCall(_this.contract.methods.attestationExpiryBlocks, undefined, BaseWrapper_1.valueToInt);
        /**
         * Returns the attestation request fee in a given currency.
         * @param address Token address.
         * @returns The fee as big number.
         */
        _this.attestationRequestFees = BaseWrapper_1.proxyCall(_this.contract.methods.attestationRequestFees, undefined, BaseWrapper_1.valueToBigNumber);
        _this.selectIssuersWaitBlocks = BaseWrapper_1.proxyCall(_this.contract.methods.selectIssuersWaitBlocks, undefined, BaseWrapper_1.valueToInt);
        /**
         * @notice Returns the unselected attestation request for an identifier/account pair, if any.
         * @param identifier Attestation identifier (e.g. phone hash)
         * @param account Address of the account
         */
        _this.getUnselectedRequest = BaseWrapper_1.proxyCall(_this.contract.methods.getUnselectedRequest, undefined, function (res) { return ({
            blockNumber: BaseWrapper_1.valueToInt(res[0]),
            attestationsRequested: BaseWrapper_1.valueToInt(res[1]),
            attestationRequestFeeToken: res[2],
        }); });
        /**
         * @notice Waits for appropriate block numbers for before issuer can be selected
         * @param identifier Attestation identifier (e.g. phone hash)
         * @param account Address of the account
         */
        _this.waitForSelectingIssuers = function (identifier, account, timeoutSeconds, pollDurationSeconds) {
            if (timeoutSeconds === void 0) { timeoutSeconds = 120; }
            if (pollDurationSeconds === void 0) { pollDurationSeconds = 1; }
            return __awaiter(_this, void 0, void 0, function () {
                var startTime, unselectedRequest, waitBlocks, blockNumber;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            startTime = Date.now();
                            return [4 /*yield*/, this.getUnselectedRequest(identifier, account)];
                        case 1:
                            unselectedRequest = _a.sent();
                            return [4 /*yield*/, this.selectIssuersWaitBlocks()];
                        case 2:
                            waitBlocks = _a.sent();
                            if (unselectedRequest.blockNumber === 0) {
                                throw new Error('No unselectedRequest to wait for');
                            }
                            _a.label = 3;
                        case 3:
                            if (!(Date.now() - startTime < timeoutSeconds * 1000)) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.kit.web3.eth.getBlockNumber()];
                        case 4:
                            blockNumber = _a.sent();
                            if (blockNumber >= unselectedRequest.blockNumber + waitBlocks) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, async_1.sleep(pollDurationSeconds * 1000)];
                        case 5:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Returns the issuers of attestations for a phoneNumber/account combo
         * @param identifier Attestation identifier (e.g. phone hash)
         * @param account Address of the account
         */
        _this.getAttestationIssuers = BaseWrapper_1.proxyCall(_this.contract.methods.getAttestationIssuers);
        /**
         * Returns the attestation state of a phone number/account/issuer tuple
         * @param identifier Attestation identifier (e.g. phone hash)
         * @param account Address of the account
         */
        _this.getAttestationState = BaseWrapper_1.proxyCall(_this.contract.methods.getAttestationState, undefined, function (state) { return ({ attestationState: BaseWrapper_1.valueToInt(state[0]) }); });
        /**
         * Returns the attestation stats of a identifer/account pair
         * @param identifier Attestation identifier (e.g. phone hash)
         * @param account Address of the account
         */
        _this.getAttestationStat = BaseWrapper_1.proxyCall(_this.contract.methods.getAttestationStats, undefined, function (stat) { return ({ completed: BaseWrapper_1.valueToInt(stat[0]), total: BaseWrapper_1.valueToInt(stat[1]) }); });
        _this.isIssuerRunningAttestationService = function (arg) { return __awaiter(_this, void 0, void 0, function () {
            var metadata, attestationServiceURLClaim, nameClaim, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, identity_1.IdentityMetadataWrapper.fetchFromURL(this.kit, arg.metadataURL)];
                    case 1:
                        metadata = _a.sent();
                        attestationServiceURLClaim = metadata.findClaim(identity_1.ClaimTypes.ATTESTATION_SERVICE_URL);
                        if (attestationServiceURLClaim === undefined) {
                            throw new Error("No attestation service URL registered for " + arg.issuer);
                        }
                        nameClaim = metadata.findClaim(identity_1.ClaimTypes.NAME);
                        // TODO: Once we have status indicators, we should check if service is up
                        // https://github.com/celo-org/celo-monorepo/issues/1586
                        return [2 /*return*/, {
                                isValid: true,
                                result: {
                                    blockNumber: arg.blockNumber,
                                    issuer: arg.issuer,
                                    attestationServiceURL: attestationServiceURLClaim.url,
                                    name: nameClaim ? nameClaim.name : undefined,
                                },
                            }];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, { isValid: false, issuer: arg.issuer }];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        return _this;
    }
    /**
     * Returns the verified status of an identifier/account pair indicating whether the attestation
     * stats for a given pair are completed beyond a certain threshold of confidence (aka "verified")
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     * @param numAttestationsRequired Optional number of attestations required.  Will default to
     *  hardcoded value if absent.
     * @param attestationThreshold Optional threshold for fraction attestations completed. Will
     *  default to hardcoded value if absent.
     */
    AttestationsWrapper.prototype.getVerifiedStatus = function (identifier, account, numAttestationsRequired, attestationThreshold) {
        return __awaiter(this, void 0, void 0, function () {
            var attestationStats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAttestationStat(identifier, account)];
                    case 1:
                        attestationStats = _a.sent();
                        return [2 /*return*/, utils_1.AttestationUtils.isAccountConsideredVerified(attestationStats, numAttestationsRequired, attestationThreshold)];
                }
            });
        });
    };
    /**
     * Calculates the amount of StableToken required to request Attestations
     * @param attestationsRequested  The number of attestations to request
     */
    AttestationsWrapper.prototype.getAttestationFeeRequired = function (attestationsRequested) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddress, attestationFee;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.registry.addressFor(base_1.CeloContract.StableToken)];
                    case 1:
                        tokenAddress = _a.sent();
                        return [4 /*yield*/, this.contract.methods.getAttestationRequestFee(tokenAddress).call()];
                    case 2:
                        attestationFee = _a.sent();
                        return [2 /*return*/, new bignumber_js_1.default(attestationFee).times(attestationsRequested)];
                }
            });
        });
    };
    /**
     * Approves the necessary amount of StableToken to request Attestations
     * @param attestationsRequested The number of attestations to request
     */
    AttestationsWrapper.prototype.approveAttestationFee = function (attestationsRequested) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenContract, fee;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getContract(base_1.CeloContract.StableToken)];
                    case 1:
                        tokenContract = _a.sent();
                        return [4 /*yield*/, this.getAttestationFeeRequired(attestationsRequested)];
                    case 2:
                        fee = _a.sent();
                        return [2 /*return*/, tokenContract.approve(this.address, fee.toFixed())];
                }
            });
        });
    };
    /**
     * Returns an array of attestations that can be completed, along with the issuers' attestation
     * service urls
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     */
    AttestationsWrapper.prototype.getActionableAttestations = function (identifier, account) {
        return __awaiter(this, void 0, void 0, function () {
            var result, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods
                            .getCompletableAttestations(identifier, account)
                            .call()];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, async_1.concurrentMap(5, parseGetCompletableAttestations(result), this.isIssuerRunningAttestationService)];
                    case 2:
                        results = _a.sent();
                        return [2 /*return*/, results.map(function (_) { return (_.isValid ? _.result : null); }).filter(collections_1.notEmpty)];
                }
            });
        });
    };
    /**
     * Returns an array of issuer addresses that were found to not run the attestation service
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     */
    AttestationsWrapper.prototype.getNonCompliantIssuers = function (identifier, account) {
        return __awaiter(this, void 0, void 0, function () {
            var result, withAttestationServiceURLs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods
                            .getCompletableAttestations(identifier, account)
                            .call()];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, async_1.concurrentMap(5, parseGetCompletableAttestations(result), this.isIssuerRunningAttestationService)];
                    case 2:
                        withAttestationServiceURLs = _a.sent();
                        return [2 /*return*/, withAttestationServiceURLs.map(function (_) { return (_.isValid ? null : _.issuer); }).filter(collections_1.notEmpty)];
                }
            });
        });
    };
    /**
     * Completes an attestation with the corresponding code
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     * @param issuer The issuer of the attestation
     * @param code The code received by the validator
     */
    AttestationsWrapper.prototype.complete = function (identifier, account, issuer, code) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, attestationSigner, expectedSourceMessage, _a, r, s, v;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getAccounts()];
                    case 1:
                        accounts = _b.sent();
                        return [4 /*yield*/, accounts.getAttestationSigner(issuer)];
                    case 2:
                        attestationSigner = _b.sent();
                        expectedSourceMessage = utils_1.AttestationUtils.getAttestationMessageToSignFromIdentifier(identifier, account);
                        _a = utils_1.SignatureUtils.parseSignature(expectedSourceMessage, code, attestationSigner), r = _a.r, s = _a.s, v = _a.v;
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.complete(identifier, v, r, s))];
                }
            });
        });
    };
    /**
     * Given a list of issuers, finds the matching issuer for a given code
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account Address of the account
     * @param code The code received by the validator
     * @param issuers The list of potential issuers
     */
    AttestationsWrapper.prototype.findMatchingIssuer = function (identifier, account, code, issuers) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, expectedSourceMessage, _i, issuers_1, issuer, attestationSigner;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getAccounts()];
                    case 1:
                        accounts = _a.sent();
                        expectedSourceMessage = utils_1.AttestationUtils.getAttestationMessageToSignFromIdentifier(identifier, account);
                        _i = 0, issuers_1 = issuers;
                        _a.label = 2;
                    case 2:
                        if (!(_i < issuers_1.length)) return [3 /*break*/, 5];
                        issuer = issuers_1[_i];
                        return [4 /*yield*/, accounts.getAttestationSigner(issuer)];
                    case 3:
                        attestationSigner = _a.sent();
                        try {
                            utils_1.SignatureUtils.parseSignature(expectedSourceMessage, code, attestationSigner);
                            return [2 /*return*/, issuer];
                        }
                        catch (error) {
                            return [3 /*break*/, 4];
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Returns the current configuration parameters for the contract.
     * @param tokens List of tokens used for attestation fees.
     */
    AttestationsWrapper.prototype.getConfig = function (tokens) {
        return __awaiter(this, void 0, void 0, function () {
            var fees, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all(tokens.map(function (token) { return __awaiter(_this, void 0, void 0, function () {
                            var fee;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.attestationRequestFees(token)];
                                    case 1:
                                        fee = _a.sent();
                                        return [2 /*return*/, { fee: fee, address: token }];
                                }
                            });
                        }); }))];
                    case 1:
                        fees = _b.sent();
                        _a = {};
                        return [4 /*yield*/, this.attestationExpiryBlocks()];
                    case 2: return [2 /*return*/, (_a.attestationExpiryBlocks = _b.sent(),
                            _a.attestationRequestFees = fees,
                            _a)];
                }
            });
        });
    };
    /**
     * Lookup mapped wallet addresses for a given list of identifiers
     * @param identifiers Attestation identifiers (e.g. phone hashes)
     */
    AttestationsWrapper.prototype.lookupIdentifiers = function (identifiers) {
        return __awaiter(this, void 0, void 0, function () {
            var stats, matches, addresses, completed, total, result, rIndex, pIndex, pHash, numberOfMatches, matchingAddresses, mIndex, matchingAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contract.methods.batchGetAttestationStats(identifiers).call()];
                    case 1:
                        stats = _a.sent();
                        matches = stats[0].map(BaseWrapper_1.valueToInt);
                        addresses = stats[1];
                        completed = stats[2].map(BaseWrapper_1.valueToInt);
                        total = stats[3].map(BaseWrapper_1.valueToInt);
                        result = {};
                        rIndex = 0;
                        for (pIndex = 0; pIndex < identifiers.length; pIndex++) {
                            pHash = identifiers[pIndex];
                            numberOfMatches = matches[pIndex];
                            if (numberOfMatches === 0) {
                                continue;
                            }
                            matchingAddresses = {};
                            for (mIndex = 0; mIndex < numberOfMatches; mIndex++) {
                                matchingAddress = addresses[rIndex];
                                matchingAddresses[matchingAddress] = {
                                    completed: completed[rIndex],
                                    total: total[rIndex],
                                };
                                rIndex++;
                            }
                            result[pHash] = matchingAddresses;
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Requests a new attestation
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param attestationsRequested The number of attestations to request
     */
    AttestationsWrapper.prototype.request = function (identifier, attestationsRequested) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.registry.addressFor(base_1.CeloContract.StableToken)];
                    case 1:
                        tokenAddress = _a.sent();
                        return [2 /*return*/, BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.request(identifier, attestationsRequested, tokenAddress))];
                }
            });
        });
    };
    /**
     * Selects the issuers for previously requested attestations for a phone number
     * @param identifier Attestation identifier (e.g. phone hash)
     */
    AttestationsWrapper.prototype.selectIssuers = function (identifier) {
        return BaseWrapper_1.toTransactionObject(this.kit, this.contract.methods.selectIssuers(identifier));
    };
    AttestationsWrapper.prototype.revealPhoneNumberToIssuer = function (phoneNumber, account, issuer, serviceURL, salt, smsRetrieverAppSig) {
        var body = {
            account: account,
            phoneNumber: phoneNumber,
            issuer: issuer,
            salt: salt,
            smsRetrieverAppSig: smsRetrieverAppSig,
        };
        return cross_fetch_1.default(serviceURL + '/attestations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    };
    /**
     * Validates a given code by the issuer on-chain
     * @param identifier Attestation identifier (e.g. phone hash)
     * @param account The address of the account which requested attestation
     * @param issuer The address of the issuer of the attestation
     * @param code The code send by the issuer
     */
    AttestationsWrapper.prototype.validateAttestationCode = function (identifier, account, issuer, code) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, attestationSigner, expectedSourceMessage, _a, r, s, v, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getAccounts()];
                    case 1:
                        accounts = _b.sent();
                        return [4 /*yield*/, accounts.getAttestationSigner(issuer)];
                    case 2:
                        attestationSigner = _b.sent();
                        expectedSourceMessage = utils_1.AttestationUtils.getAttestationMessageToSignFromIdentifier(identifier, account);
                        _a = utils_1.SignatureUtils.parseSignature(expectedSourceMessage, code, attestationSigner), r = _a.r, s = _a.s, v = _a.v;
                        return [4 /*yield*/, this.contract.methods
                                .validateAttestationCode(identifier, account, v, r, s)
                                .call()];
                    case 3:
                        result = _b.sent();
                        return [2 /*return*/, result.toLowerCase() !== base_1.NULL_ADDRESS];
                }
            });
        });
    };
    /**
     * Gets the relevant attestation service status for a validator
     * @param validator Validator to get the attestation service status for
     */
    AttestationsWrapper.prototype.getAttestationServiceStatus = function (validator) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, hasAttestationSigner, attestationSigner, attestationServiceURL, ret, metadataURL, metadata, attestationServiceURLClaim, error_2, statusResponse, statusResponseBody, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.kit.contracts.getAccounts()];
                    case 1:
                        accounts = _a.sent();
                        return [4 /*yield*/, accounts.hasAuthorizedAttestationSigner(validator.address)];
                    case 2:
                        hasAttestationSigner = _a.sent();
                        return [4 /*yield*/, accounts.getAttestationSigner(validator.address)];
                    case 3:
                        attestationSigner = _a.sent();
                        ret = __assign(__assign({}, validator), { hasAttestationSigner: hasAttestationSigner,
                            attestationSigner: attestationSigner, attestationServiceURL: null, okStatus: false, error: null, smsProviders: [], blacklistedRegionCodes: [], rightAccount: false, metadataURL: null, state: AttestationServiceStatusState.NoAttestationSigner });
                        if (!hasAttestationSigner) {
                            return [2 /*return*/, ret];
                        }
                        return [4 /*yield*/, accounts.getMetadataURL(validator.address)];
                    case 4:
                        metadataURL = _a.sent();
                        ret.metadataURL = metadataURL;
                        if (!metadataURL) {
                            ret.state = AttestationServiceStatusState.NoMetadataURL;
                        }
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, identity_1.IdentityMetadataWrapper.fetchFromURL(this.kit, metadataURL)];
                    case 6:
                        metadata = _a.sent();
                        attestationServiceURLClaim = metadata.findClaim(identity_1.ClaimTypes.ATTESTATION_SERVICE_URL);
                        if (!attestationServiceURLClaim) {
                            ret.state = AttestationServiceStatusState.NoAttestationServiceURL;
                            return [2 /*return*/, ret];
                        }
                        attestationServiceURL = attestationServiceURLClaim.url;
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _a.sent();
                        ret.state = AttestationServiceStatusState.InvalidMetadata;
                        ret.error = error_2;
                        return [2 /*return*/, ret];
                    case 8:
                        ret.attestationServiceURL = attestationServiceURL;
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 12, , 13]);
                        return [4 /*yield*/, cross_fetch_1.default(attestationServiceURL + '/status')];
                    case 10:
                        statusResponse = _a.sent();
                        if (!statusResponse.ok) {
                            ret.state = AttestationServiceStatusState.UnreachableAttestationService;
                            return [2 /*return*/, ret];
                        }
                        ret.okStatus = true;
                        return [4 /*yield*/, statusResponse.json()];
                    case 11:
                        statusResponseBody = _a.sent();
                        ret.smsProviders = statusResponseBody.smsProviders;
                        ret.blacklistedRegionCodes = statusResponseBody.blacklistedRegionCodes;
                        ret.rightAccount = address_1.eqAddress(validator.address, statusResponseBody.accountAddress);
                        ret.state = AttestationServiceStatusState.Valid;
                        return [2 /*return*/, ret];
                    case 12:
                        error_3 = _a.sent();
                        ret.state = AttestationServiceStatusState.UnreachableAttestationService;
                        ret.error = error_3;
                        return [2 /*return*/, ret];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    return AttestationsWrapper;
}(BaseWrapper_1.BaseWrapper));
exports.AttestationsWrapper = AttestationsWrapper;
var AttestationServiceStatusState;
(function (AttestationServiceStatusState) {
    AttestationServiceStatusState["NoAttestationSigner"] = "NoAttestationSigner";
    AttestationServiceStatusState["NoMetadataURL"] = "NoMetadataURL";
    AttestationServiceStatusState["InvalidMetadata"] = "InvalidMetadata";
    AttestationServiceStatusState["NoAttestationServiceURL"] = "NoAttestationServiceURL";
    AttestationServiceStatusState["UnreachableAttestationService"] = "UnreachableAttestationService";
    AttestationServiceStatusState["Valid"] = "Valid";
})(AttestationServiceStatusState || (AttestationServiceStatusState = {}));
//# sourceMappingURL=Attestations.js.map