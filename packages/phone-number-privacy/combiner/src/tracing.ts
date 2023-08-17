import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { Resource } from '@opentelemetry/resources'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

const options = {
  tags: [],
  endpoint: process.env.TRACER_ENDPOINT,
}

// Optionally register instrumentation libraries
registerInstrumentations({
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        startIncomingSpanHook: (req) => {
          delete req.headers.traceparent
          delete req.headers[`x-cloud-trace-context`]
          delete req.headers[`grpc-trace-bin`]

          return {}
        },
      },
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
})

const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.TRACING_SERVICE_NAME,
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
