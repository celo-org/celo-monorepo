"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = __importStar(require("dotenv"));
if (process.env.CONFIG) {
    dotenv.config({ path: process.env.CONFIG });
}
function fetchEnv(name) {
    if (process.env[name] === undefined || process.env[name] === '') {
        console.error("ENV var '" + name + "' was not defined");
        throw new Error("ENV var '" + name + "' was not defined");
    }
    return process.env[name];
}
exports.fetchEnv = fetchEnv;
function fetchEnvOrDefault(name, defaultValue) {
    return process.env[name] === undefined || process.env[name] === ''
        ? defaultValue
        : process.env[name];
}
exports.fetchEnvOrDefault = fetchEnvOrDefault;
//# sourceMappingURL=env.js.map