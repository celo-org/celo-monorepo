"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable: no-console
const uuid_1 = require("uuid");
// This allows us to differentiate parallel instantiations of this function
const prefix = uuid_1.v4().slice(0, 8);
const logger = {
    debug: (...args) => console.debug(`${prefix}::`, ...args),
    info: (...args) => console.info(`${prefix}::`, ...args),
    warn: (...args) => console.warn(`${prefix}::`, ...args),
    error: (...args) => console.error(`${prefix}::`, ...args),
};
exports.default = logger;
//# sourceMappingURL=logger.js.map