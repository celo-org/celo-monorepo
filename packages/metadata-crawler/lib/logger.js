"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataLogger = exports.operationalLogger = exports.logger = void 0;
const bunyan_1 = require("bunyan");
// @ts-ignore
const bunyan_debug_stream_1 = __importDefault(require("bunyan-debug-stream"));
const bunyan_gke_stackdriver_1 = require("bunyan-gke-stackdriver");
const env_1 = require("./env");
const logLevel = (0, env_1.fetchEnvOrDefault)('LOG_LEVEL', 'debug');
const logFormat = (0, env_1.fetchEnvOrDefault)('LOG_FORMAT', 'human');
let stream;
switch (logFormat) {
    case 'stackdriver':
        stream = (0, bunyan_gke_stackdriver_1.createStream)(bunyan_1.levelFromName[logLevel]);
        break;
    case 'json':
        stream = { stream: process.stdout, level: logLevel };
        break;
    default:
        stream = { level: logLevel, stream: (0, bunyan_debug_stream_1.default)() };
        break;
}
exports.logger = (0, bunyan_1.createLogger)({
    name: 'metadata-crawler',
    serializers: bunyan_1.stdSerializers,
    streams: [stream],
});
exports.operationalLogger = exports.logger.child({ logger: 'operation' });
exports.dataLogger = exports.logger.child({ logger: 'data' });
