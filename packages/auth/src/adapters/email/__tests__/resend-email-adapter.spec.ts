import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResendEmailAdapter } from '../resend-email-adapter';

const mockSend = vi.fn();

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

describe('ResendEmailAdapter', () => {
  let adapter: ResendEmailAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new ResendEmailAdapter('test-api-key');
  });

  it('should send magic link via Resend when called', async () => {
    // Given
    const to = 'user@example.com';
    const link = 'https://example.com/auth/magic?token=abc123';
    mockSend.mockResolvedValue({ data: { id: 'email-id-1' }, error: null });

    // When
    await adapter.sendMagicLink(to, link);

    // Then
    expect(mockSend).toHaveBeenCalledOnce();
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to,
        html: expect.stringContaining(link),
      }),
    );
  });
});
