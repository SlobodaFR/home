import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmtpEmailAdapter } from '../smtp-email-adapter';

const mockSendMail = vi.hoisted(() => vi.fn());

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: mockSendMail,
    }),
  },
}));

describe('SmtpEmailAdapter', () => {
  let adapter: SmtpEmailAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new SmtpEmailAdapter({ host: 'localhost', port: 1025 });
  });

  it('should send magic link via SMTP when called', async () => {
    // Given
    const to = 'user@example.com';
    const link = 'https://example.com/auth/magic?token=abc123';
    mockSendMail.mockResolvedValue({ messageId: 'msg-1' });

    // When
    await adapter.sendMagicLink(to, link);

    // Then
    expect(mockSendMail).toHaveBeenCalledOnce();
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to,
        html: expect.stringContaining(link),
      }),
    );
  });
});
