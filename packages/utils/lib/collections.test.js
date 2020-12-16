"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var address_1 = require("./address");
var collections_1 = require("./collections");
describe('Collection', function () {
    describe('linkedListChange', function () {
        it('singleton list', function () {
            var lst = [{ address: 'address 1', value: new bignumber_js_1.default(2) }];
            var change = { address: 'address 1', value: new bignumber_js_1.default(20) };
            var expected = {
                lesser: address_1.NULL_ADDRESS,
                greater: address_1.NULL_ADDRESS,
            };
            expect(collections_1.linkedListChange(lst, change)).toMatchObject(expected);
        });
        it('becoming greatest', function () {
            var lst = [
                { address: 'address 1', value: new bignumber_js_1.default(4) },
                { address: 'address 2', value: new bignumber_js_1.default(4) },
                { address: 'address 3', value: new bignumber_js_1.default(3) },
                { address: 'address 4', value: new bignumber_js_1.default(2) },
            ];
            var change = { address: 'address 3', value: new bignumber_js_1.default(20) };
            var expected = {
                lesser: 'address 1',
                greater: address_1.NULL_ADDRESS,
            };
            expect(collections_1.linkedListChange(lst, change)).toMatchObject(expected);
        });
        it('becoming smallest', function () {
            var lst = [
                { address: 'address 1', value: new bignumber_js_1.default(4) },
                { address: 'address 2', value: new bignumber_js_1.default(4) },
                { address: 'address 3', value: new bignumber_js_1.default(3) },
                { address: 'address 4', value: new bignumber_js_1.default(2) },
                { address: 'address 5', value: new bignumber_js_1.default(2) },
            ];
            var change = { address: 'address 3', value: new bignumber_js_1.default(1) };
            var expected = {
                lesser: address_1.NULL_ADDRESS,
                greater: 'address 5',
            };
            expect(collections_1.linkedListChange(lst, change)).toMatchObject(expected);
        });
        it('change order', function () {
            var lst = [
                { address: 'address 1', value: new bignumber_js_1.default(7) },
                { address: 'address 2', value: new bignumber_js_1.default(5) },
                { address: 'address 3', value: new bignumber_js_1.default(4) },
                { address: 'address 4', value: new bignumber_js_1.default(3) },
                { address: 'address 5', value: new bignumber_js_1.default(2) },
                { address: 'address 6', value: new bignumber_js_1.default(2) },
                { address: 'address 7', value: new bignumber_js_1.default(1) },
            ];
            var change = { address: 'address 3', value: new bignumber_js_1.default(2) };
            var expected = {
                greater: 'address 6',
                lesser: 'address 7',
            };
            expect(collections_1.linkedListChange(lst, change)).toMatchObject(expected);
        });
    });
    describe('linkedListChanges', function () {
        it('singleton list', function () {
            var lst = [{ address: 'address 1', value: new bignumber_js_1.default(2) }];
            var changes = [{ address: 'address 1', value: new bignumber_js_1.default(20) }];
            var expected = {
                lessers: ['0x0000000000000000000000000000000000000000'],
                greaters: ['0x0000000000000000000000000000000000000000'],
            };
            expect(collections_1.linkedListChanges(lst, changes)).toMatchObject(expected);
        });
        it('becoming greatest', function () {
            var lst = [
                { address: 'address 1', value: new bignumber_js_1.default(4) },
                { address: 'address 2', value: new bignumber_js_1.default(4) },
                { address: 'address 3', value: new bignumber_js_1.default(3) },
                { address: 'address 4', value: new bignumber_js_1.default(2) },
            ];
            var changes = [{ address: 'address 3', value: new bignumber_js_1.default(20) }];
            var expected = {
                lessers: ['address 1'],
                greaters: ['0x0000000000000000000000000000000000000000'],
            };
            expect(collections_1.linkedListChanges(lst, changes)).toMatchObject(expected);
        });
        it('becoming smallest', function () {
            var lst = [
                { address: 'address 1', value: new bignumber_js_1.default(4) },
                { address: 'address 2', value: new bignumber_js_1.default(4) },
                { address: 'address 3', value: new bignumber_js_1.default(3) },
                { address: 'address 4', value: new bignumber_js_1.default(2) },
                { address: 'address 5', value: new bignumber_js_1.default(2) },
            ];
            var changes = [{ address: 'address 3', value: new bignumber_js_1.default(1) }];
            var expected = {
                lessers: ['0x0000000000000000000000000000000000000000'],
                greaters: ['address 5'],
            };
            expect(collections_1.linkedListChanges(lst, changes)).toMatchObject(expected);
        });
        it('change order', function () {
            var lst = [
                { address: 'address 1', value: new bignumber_js_1.default(7) },
                { address: 'address 2', value: new bignumber_js_1.default(5) },
                { address: 'address 3', value: new bignumber_js_1.default(4) },
                { address: 'address 4', value: new bignumber_js_1.default(3) },
                { address: 'address 5', value: new bignumber_js_1.default(2) },
                { address: 'address 6', value: new bignumber_js_1.default(2) },
                { address: 'address 7', value: new bignumber_js_1.default(1) },
            ];
            var changes = [{ address: 'address 3', value: new bignumber_js_1.default(2) }];
            var expected = {
                greaters: ['address 6'],
                lessers: ['address 7'],
            };
            expect(collections_1.linkedListChanges(lst, changes)).toMatchObject(expected);
        });
        it('change order, become smallest', function () {
            var lst = [
                { address: 'address 1', value: new bignumber_js_1.default(7) },
                { address: 'address 2', value: new bignumber_js_1.default(5) },
                { address: 'address 3', value: new bignumber_js_1.default(4) },
                { address: 'address 4', value: new bignumber_js_1.default(3) },
                { address: 'address 5', value: new bignumber_js_1.default(2) },
                { address: 'address 6', value: new bignumber_js_1.default(2) },
                { address: 'address 7', value: new bignumber_js_1.default(1) },
            ];
            var changes = [
                { address: 'address 3', value: new bignumber_js_1.default(2) },
                { address: 'address 2', value: new bignumber_js_1.default(0) },
            ];
            var expected = {
                greaters: ['address 6', 'address 7'],
                lessers: ['address 7', address_1.NULL_ADDRESS],
            };
            expect(collections_1.linkedListChanges(lst, changes)).toMatchObject(expected);
        });
        it('change order, become largest', function () {
            var lst = [
                { address: 'address 1', value: new bignumber_js_1.default(7) },
                { address: 'address 2', value: new bignumber_js_1.default(5) },
                { address: 'address 3', value: new bignumber_js_1.default(4) },
                { address: 'address 4', value: new bignumber_js_1.default(3) },
                { address: 'address 5', value: new bignumber_js_1.default(2) },
                { address: 'address 6', value: new bignumber_js_1.default(2) },
                { address: 'address 7', value: new bignumber_js_1.default(1) },
            ];
            var changes = [
                { address: 'address 3', value: new bignumber_js_1.default(2) },
                { address: 'address 2', value: new bignumber_js_1.default(8) },
            ];
            var expected = {
                greaters: ['address 6', address_1.NULL_ADDRESS],
                lessers: ['address 7', 'address 1'],
            };
            expect(collections_1.linkedListChanges(lst, changes)).toMatchObject(expected);
        });
        it('change order, then replace with another', function () {
            var lst = [
                { address: 'address 1', value: new bignumber_js_1.default(7) },
                { address: 'address 2', value: new bignumber_js_1.default(5) },
                { address: 'address 3', value: new bignumber_js_1.default(4) },
                { address: 'address 4', value: new bignumber_js_1.default(3) },
                { address: 'address 5', value: new bignumber_js_1.default(2) },
                { address: 'address 6', value: new bignumber_js_1.default(2) },
                { address: 'address 7', value: new bignumber_js_1.default(1) },
            ];
            var changes = [
                { address: 'address 3', value: new bignumber_js_1.default(2) },
                { address: 'address 2', value: new bignumber_js_1.default(2) },
            ];
            var expected = {
                greaters: ['address 6', 'address 3'],
                lessers: ['address 7', 'address 7'],
            };
            expect(collections_1.linkedListChanges(lst, changes)).toMatchObject(expected);
        });
        it('change order, then replace with another again', function () {
            var lst = [
                { address: 'address 1', value: new bignumber_js_1.default(17) },
                { address: 'address 2', value: new bignumber_js_1.default(15) },
                { address: 'address 3', value: new bignumber_js_1.default(14) },
                { address: 'address 4', value: new bignumber_js_1.default(13) },
                { address: 'address 5', value: new bignumber_js_1.default(12) },
                { address: 'address 6', value: new bignumber_js_1.default(11) },
                { address: 'address 7', value: new bignumber_js_1.default(0) },
            ];
            var changes = [
                { address: 'address 3', value: new bignumber_js_1.default(2) },
                { address: 'address 2', value: new bignumber_js_1.default(1) },
                { address: 'address 4', value: new bignumber_js_1.default(3) },
            ];
            var expected = {
                greaters: ['address 6', 'address 3', 'address 6'],
                lessers: ['address 7', 'address 7', 'address 3'],
            };
            expect(collections_1.linkedListChanges(lst, changes)).toMatchObject(expected);
        });
    });
});
//# sourceMappingURL=collections.test.js.map