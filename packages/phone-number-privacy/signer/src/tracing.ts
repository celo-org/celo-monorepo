import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { Resource } from '@opentelemetry/resources'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node')
//import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
//import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
//import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
//import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

const options = {
  tags: [],
  endpoint: process.env.TRACER_ENDPOINT,
  //'http://grafana-agent.grafana-agent:14268/api/traces',
}

// Optionally register automatic instrumentation libraries
registerInstrumentations({
  instrumentations: [
    getNodeAutoInstrumentations(),
    // Express instrumentation expects HTTP layer to be instrumented
    // new HttpInstrumentation({
    //   ignoreIncomingPaths: [
    //     /\/status/,
    //     /\/metrics/,
    //     /\/metadata\/.*/,
    //     /\/secrets\/.*/,
    //     /\/ecp\/.*/,
    //   ],
    // }),
    // new ExpressInstrumentation(),
    // new KnexInstrumentation(),
  ],
})

const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.TRACING_SERVICE_NAME,
    //'testing-signer-tracing',
    [SemanticResourceAttributes.SERVICE_VERSION]: '0.1.0',
  })
)

const provider = new NodeTracerProvider({
  resource: resource,
})
const exporter = new JaegerExporter(options)
const processor = new BatchSpanProcessor(exporter)
provider.addSpanProcessor(processor)

provider.register()
