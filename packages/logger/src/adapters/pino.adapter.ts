import pino from 'pino';
import { trace } from '@opentelemetry/api';
import type { LoggerPort } from '../logger.port.js';

function otelContext(): object {
  const span = trace.getActiveSpan();
  if (!span) return {};
  const ctx = span.spanContext();
  return { traceId: ctx.traceId, spanId: ctx.spanId };
}

function wrap(instance: pino.Logger): LoggerPort {
  return {
    debug: (msg, data) => instance.debug({ ...otelContext(), ...data }, msg),
    info: (msg, data) => instance.info({ ...otelContext(), ...data }, msg),
    warn: (msg, data) => instance.warn({ ...otelContext(), ...data }, msg),
    error: (msg, err, data) => instance.error({ ...otelContext(), ...data, err }, msg),
    child: (bindings) => wrap(instance.child(bindings)),
  };
}

export function createPinoLogger(options?: { level?: string }): LoggerPort {
  return wrap(pino({ level: options?.level ?? 'info' }));
}
