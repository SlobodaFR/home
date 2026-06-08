import { Resend } from 'resend';
import type { EmailPort } from '../../application/ports/email-port';

export class ResendEmailAdapter implements EmailPort {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async sendMagicLink(to: string, link: string): Promise<void> {
    await this.resend.emails.send({
      from: 'noreply@home.app',
      to,
      subject: 'Your magic link',
      html: `<p>Click <a href="${link}">here</a> to sign in.</p>`,
    });
  }
}
