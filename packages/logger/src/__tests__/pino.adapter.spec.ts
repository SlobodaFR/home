import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRootLogger, mockChildLogger } = vi.hoisted(() => {
  const mockChildLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
  const mockRootLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnValue(mockChildLogger),
  };
  return { mockRootLogger, mockChildLogger };
});

vi.mock('pino', () => ({
  default: vi.fn().mockReturnValue(mockRootLogger),
}));

vi.mock('@opentelemetry/api', () => ({
  trace: { getActiveSpan: vi.fn() },
}));

import { trace } from '@opentelemetry/api';
import { createPinoLogger } from '../adapters/pino.adapter.js';

describe('createPinoLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(trace.getActiveSpan).mockReturnValue(undefined);
  });

  it('should return a LoggerPort', () => {
    const logger = createPinoLogger();

    expect(logger).toHaveProperty('debug');
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('warn');
    expect(logger).toHaveProperty('error');
    expect(logger).toHaveProperty('child');
  });

  it('should call pino child with bindings and return a LoggerPort', () => {
    const logger = createPinoLogger();
    const child = logger.child({ service: 'payments' });

    expect(mockRootLogger.child).toHaveBeenCalledWith({ service: 'payments' });
    child.info('hello from child');
    expect(mockChildLogger.info).toHaveBeenCalledWith(expect.any(Object), 'hello from child');
  });

  it('should inject traceId and spanId when an OTel span is active', () => {
    vi.mocked(trace.getActiveSpan).mockReturnValue({
      spanContext: () => ({ traceId: 'trace-abc', spanId: 'span-xyz', traceFlags: 1 }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const logger = createPinoLogger();
    logger.info('with-span');

    expect(mockRootLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ traceId: 'trace-abc', spanId: 'span-xyz' }),
      'with-span',
    );
  });

  it('should not include trace fields when no OTel span is active', () => {
    vi.mocked(trace.getActiveSpan).mockReturnValue(undefined);

    const logger = createPinoLogger();
    logger.info('no-span');

    expect(mockRootLogger.info).toHaveBeenCalledWith(
      expect.not.objectContaining({ traceId: expect.anything() }),
      'no-span',
    );
  });
});
