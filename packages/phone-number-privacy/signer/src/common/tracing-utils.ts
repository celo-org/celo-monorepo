import opentelemetry, { SpanStatusCode } from '@opentelemetry/api'

const tracer = opentelemetry.trace.getTracer('signer-tracer')

export function traceAsyncFunction<A>(traceName: string, fn: () => Promise<A>): Promise<A> {
  return tracer.startActiveSpan(traceName, async (span) => {
    try {
      const res = await fn()
      span.setStatus({ code: SpanStatusCode.OK })
      return res
    } catch (err: any) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : undefined,
      })
      throw err
    } finally {
      span.end()
    }
  })
}
