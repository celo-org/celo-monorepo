"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var fs_1 = require("fs");
var pdef = JSON.parse(fs_1.readFileSync('./package.json', 'utf-8'));
describe('Base package', function () {
    // @celo/base is built on the premise of having absolutely no dependencies, no exceptions made
    it('Should have an explicitly defined empty dependencies property', function () {
        chai_1.assert.isObject(pdef);
        chai_1.assert.property(pdef, 'dependencies');
        chai_1.assert.isEmpty(pdef.dependencies);
    });
});
//# sourceMappingURL=package.test.js.map