/*
  https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node
  getNodeAutoInstrumentations (above) includes all available auto-tracing
  instrumentations for node (Knex, Express, Http, tcp, ...).
  This may lead to super-verbose traces. We can just comment the getNodeAutoInstrumentations
  line above and just add the instrumentations we care like commented lines below.
*/
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { Resource } from '@opentelemetry/resources'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
/*
  Some instrumentations included in auto-instrumentations-node:
  - https://www.npmjs.com/package/@opentelemetry/sdk-trace-web
  - https://www.npmjs.com/package/@opentelemetry/instrumentation-express
  - https://www.npmjs.com/package/@opentelemetry/instrumentation-http
  - https://www.npmjs.com/package/@opentelemetry/instrumentation-knex
*/
// import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
// import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
// import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
// import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

const options = {
  tags: [],
  endpoint: process.env.TRACER_ENDPOINT,
  // 'http://grafana-agent.grafana-agent:14268/api/traces',
}

// Optionally register automatic instrumentation libraries
registerInstrumentations({
  instrumentations: [
    getNodeAutoInstrumentations({
      // load custom configuration for http instrumentation
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: [
          /\/status/,
          /\/metrics/,
          /\/metadata\/.*/,
          /\/secrets\/.*/,
          /\/ecp\/.*/,
        ],
      },
    }),
    /*
      How to add specific instrumentations instead of the
      all-included auto-tracing getNodeAutoInstrumentations
    */
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
    // 'testing-signer-tracing',
    [SemanticResourceAttributes.SERVICE_VERSION]: '0.1.0',
  })
)

const provider = new NodeTracerProvider({
  resource,
})
const exporter = new JaegerExporter(options)
const processor = new BatchSpanProcessor(exporter)
provider.addSpanProcessor(processor)

provider.register()
