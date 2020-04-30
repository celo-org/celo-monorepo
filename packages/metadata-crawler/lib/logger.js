"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bunyan_1 = require("bunyan");
// @ts-ignore
var bunyan_debug_stream_1 = __importDefault(require("bunyan-debug-stream"));
var bunyan_gke_stackdriver_1 = require("bunyan-gke-stackdriver");
var env_1 = require("./env");
var logLevel = env_1.fetchEnvOrDefault('LOG_LEVEL', 'debug');
var logFormat = env_1.fetchEnvOrDefault('LOG_FORMAT', 'human');
var stream;
switch (logFormat) {
    case 'stackdriver':
        stream = bunyan_gke_stackdriver_1.createStream(bunyan_1.levelFromName[logLevel]);
        break;
    case 'json':
        stream = { stream: process.stdout, level: logLevel };
        break;
    default:
        stream = { level: logLevel, stream: bunyan_debug_stream_1.default() };
        break;
}
exports.logger = bunyan_1.createLogger({
    name: 'metadata-crawler',
    serializers: bunyan_1.stdSerializers,
    streams: [stream],
});
//# sourceMappingURL=logger.js.map