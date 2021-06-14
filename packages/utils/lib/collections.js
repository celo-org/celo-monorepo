"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var address_1 = require("./address");
function zip(fn, as, bs) {
    var len = Math.min(as.length, bs.length);
    var res = [];
    for (var i = 0; i < len; i++) {
        res.push(fn(as[i], bs[i]));
    }
    return res;
}
exports.zip = zip;
function zip3(as, bs, cs) {
    var len = Math.min(as.length, bs.length, cs.length);
    var res = [];
    for (var i = 0; i < len; i++) {
        res.push([as[i], bs[i], cs[i]]);
    }
    return res;
}
exports.zip3 = zip3;
// https://stackoverflow.com/questions/43118692/typescript-filter-out-nulls-from-an-array
function notEmpty(value) {
    return value !== null && value !== undefined;
}
exports.notEmpty = notEmpty;
function intersection(arrays) {
    if (arrays.length === 0) {
        return [];
    }
    var sets = arrays.map(function (array) { return new Set(array); });
    var res = [];
    var _loop_1 = function (elem) {
        if (sets.every(function (set) { return set.has(elem); })) {
            res.push(elem);
        }
    };
    for (var _i = 0, _a = arrays[0]; _i < _a.length; _i++) {
        var elem = _a[_i];
        _loop_1(elem);
    }
    return res;
}
exports.intersection = intersection;
function upsert(sortedList, change) {
    var oldIdx = sortedList.findIndex(function (a) { return address_1.eqAddress(a.address, change.address); });
    if (oldIdx === -1) {
        throw new Error('');
    }
    sortedList.splice(oldIdx, 1);
    var newIdx = sortedList.findIndex(function (a) { return a.value.lt(change.value); });
    if (newIdx === -1) {
        sortedList.push(change);
        return sortedList.length - 1;
    }
    else {
        sortedList.splice(newIdx, 0, change);
        return newIdx;
    }
}
// Warning: sortedList is modified
function _linkedListChange(sortedList, change) {
    var idx = upsert(sortedList, change);
    var greater = idx === 0 ? address_1.NULL_ADDRESS : sortedList[idx - 1].address;
    var lesser = idx === sortedList.length - 1 ? address_1.NULL_ADDRESS : sortedList[idx + 1].address;
    return { lesser: lesser, greater: greater };
}
function linkedListChange(sortedList, change) {
    var list = sortedList.concat();
    var _a = _linkedListChange(list, change), lesser = _a.lesser, greater = _a.greater;
    return { lesser: lesser, greater: greater, list: list };
}
exports.linkedListChange = linkedListChange;
function linkedListChanges(sortedList, changeList) {
    var listClone = __spreadArrays(sortedList);
    var lessers = [];
    var greaters = [];
    for (var _i = 0, changeList_1 = changeList; _i < changeList_1.length; _i++) {
        var it_1 = changeList_1[_i];
        var _a = _linkedListChange(listClone, it_1), lesser = _a.lesser, greater = _a.greater;
        lessers.push(lesser);
        greaters.push(greater);
    }
    return { lessers: lessers, greaters: greaters, list: listClone };
}
exports.linkedListChanges = linkedListChanges;
//# sourceMappingURL=collections.js.map