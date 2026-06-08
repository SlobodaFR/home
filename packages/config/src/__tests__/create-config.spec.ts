import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createConfig } from '../create-config';

describe('createConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return typed config when env is valid', () => {
    process.env['APP_PORT'] = '3000';
    process.env['APP_NAME'] = 'my-app';

    const schema = z.object({ APP_PORT: z.coerce.number(), APP_NAME: z.string() });

    const config = createConfig(schema);

    expect(config).toEqual({ APP_PORT: 3000, APP_NAME: 'my-app' });
  });

  it('should throw with readable message when required var is missing', () => {
    delete process.env['APP_PORT'];

    const schema = z.object({ APP_PORT: z.coerce.number() });

    expect(() => createConfig(schema)).toThrow('Invalid configuration');
  });

  it('should list all violations when multiple env vars are invalid', () => {
    process.env['APP_PORT'] = 'not-a-number';
    process.env['APP_NAME'] = '';

    const schema = z.object({
      APP_PORT: z.coerce.number().positive(),
      APP_NAME: z.string().min(1),
    });

    expect(() => createConfig(schema)).toThrowError(
      expect.objectContaining({ message: expect.stringContaining('APP_PORT') }),
    );
  });
});
