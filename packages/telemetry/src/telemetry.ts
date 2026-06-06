import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

export interface TelemetryConfig {
  otlpEndpoint: string;
  serviceName: string;
  serviceVersion?: string;
}

export function initTelemetry(config: TelemetryConfig): void {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({ url: config.otlpEndpoint }),
    instrumentations: [getNodeAutoInstrumentations()],
    serviceName: config.serviceName,
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk.shutdown().finally(() => process.exit(0));
  });
}
