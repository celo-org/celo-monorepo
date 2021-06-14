"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("@celo/utils/lib/address");
var celo_provider_1 = require("../providers/celo-provider");
// Random private keys
var PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
var ACCOUNT_ADDRESS1 = address_1.privateKeyToAddress(PRIVATE_KEY1);
var PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc';
var ACCOUNT_ADDRESS2 = address_1.privateKeyToAddress(PRIVATE_KEY2);
// These tests verify the signTransaction WITHOUT the ParamsPopulator
describe('CeloProvider', function () {
    var mockCallback;
    var mockProvider;
    var celoProvider;
    var interceptedByCeloProvider = [
        'eth_sendTransaction',
        'eth_signTransaction',
        'eth_sign',
        'personal_sign',
        'eth_signTypedData',
    ];
    beforeEach(function () {
        mockCallback = jest.fn(function (payload, callback) {
            var response = {
                jsonrpc: payload.jsonrpc,
                id: Number(payload.id),
                result: {
                    params: payload.params,
                    method: payload.method,
                },
            };
            callback(null, response);
        });
        mockProvider = {
            host: '',
            connected: true,
            send: mockCallback,
            supportsSubscriptions: function () { return true; },
            disconnect: function () { return true; },
        };
        celoProvider = new celo_provider_1.CeloProvider(mockProvider);
    });
    describe("when celo provider don't have any local account", function () {
        interceptedByCeloProvider.forEach(function (method) {
            test("fowards the call to '" + method + "' to the original provider", function (done) {
                var payload = {
                    id: 0,
                    jsonrpc: '2.0',
                    method: method,
                    params: ['1', '2'],
                };
                var callback = function (_error, _result) {
                    expect(mockCallback.mock.calls.length).toBe(1);
                    expect(mockCallback.mock.calls[0][0].method).toBe(method);
                    done();
                };
                celoProvider.send(payload, callback);
            });
        });
    });
    describe('when celo provider has a local account', function () {
        function paramsForMethod(method, from, to) {
            var tx = {
                from: from,
                to: to,
                value: '1',
                nonce: 0,
                gas: 10,
                gasPrice: 99,
                feeCurrency: '0x124356',
                gatewayFeeRecipient: '0x1234',
                gatewayFee: '0x5678',
                data: '0xabcdef',
                chainId: 1,
            };
            switch (method) {
                case 'eth_sendTransaction':
                case 'eth_signTransaction':
                    return [tx];
                case 'eth_sign':
                    return [from, '0x01'];
                case 'personal_sign':
                    return ['0x01', from];
                case 'eth_signTypedData':
                    return [
                        from,
                        {
                            types: {
                                EIP712Domain: [
                                    { name: 'name', type: 'string' },
                                    { name: 'version', type: 'string' },
                                    { name: 'chainId', type: 'uint256' },
                                    { name: 'verifyingContract', type: 'address' },
                                ],
                            },
                            primaryType: 'Mail',
                            domain: {
                                name: 'Ether Mail',
                                version: '1',
                                chainId: 1,
                                verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
                            },
                            message: {
                                from: {
                                    name: 'Cow',
                                    wallet: from,
                                },
                                to: {
                                    name: 'Bob',
                                    wallet: to,
                                },
                                contents: 'Hello, Bob!',
                            },
                        },
                    ];
                default: {
                    return [];
                }
            }
        }
        beforeEach(function () {
            celoProvider.addAccount(PRIVATE_KEY1);
        });
        describe('but tries to use it with a different account', function () {
            interceptedByCeloProvider.forEach(function (method) {
                test("fowards the call to '" + method + "' to the original provider", function (done) {
                    var payload = {
                        id: 0,
                        jsonrpc: '2.0',
                        method: method,
                        params: paramsForMethod(method, ACCOUNT_ADDRESS2, ACCOUNT_ADDRESS1),
                    };
                    var callback = function (_error, _result) {
                        expect(mockCallback.mock.calls.length).toBe(1);
                        expect(mockCallback.mock.calls[0][0].method).toBe(method);
                        done();
                    };
                    celoProvider.send(payload, callback);
                });
            });
        });
        describe('using that account', function () {
            test("call 'send' with 'eth_sendTransaction' signs and send a eth_sendRawTransaction to the original provider", function (done) {
                var payload = {
                    id: 0,
                    jsonrpc: '2.0',
                    method: 'eth_sendTransaction',
                    params: paramsForMethod('eth_sendTransaction', ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2),
                };
                var callback = function (_error, _result) {
                    expect(mockCallback.mock.calls.length).toBe(1);
                    expect(mockCallback.mock.calls[0][0].method).toBe('eth_sendRawTransaction');
                    done();
                };
                celoProvider.send(payload, callback);
            });
            test.todo("call 'send' with 'eth_signTypedData' signs the message and don't call the original provider");
            interceptedByCeloProvider
                .filter(function (x) { return x !== 'eth_sendTransaction' && x !== 'eth_signTypedData'; })
                .forEach(function (method) {
                test("call 'send' with '" + method + "' signs the message and don't call the original provider", function (done) {
                    var payload = {
                        id: 0,
                        jsonrpc: '2.0',
                        method: method,
                        params: paramsForMethod(method, ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2),
                    };
                    var callback = function (error, result) {
                        expect(error).toBeNull();
                        expect(result).not.toBeFalsy();
                        expect(mockCallback.mock.calls.length).toBe(0);
                        done();
                    };
                    celoProvider.send(payload, callback);
                });
            });
        });
    });
});
//# sourceMappingURL=celo-provider.test.js.map