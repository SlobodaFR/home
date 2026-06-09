import nodemailer from 'nodemailer';
import type { EmailPort } from '../../application/ports/email-port';

export class SmtpEmailAdapter implements EmailPort {
  private readonly transporter: nodemailer.Transporter;

  constructor(config: { host: string; port: number; secure?: boolean }) {
    this.transporter = nodemailer.createTransport({ ...config, secure: config.secure ?? false }); // NOSONAR — dev-only adapter (MailDev), TLS intentionally disabled
  }

  async sendMagicLink(to: string, link: string): Promise<void> {
    await this.transporter.sendMail({
      from: 'noreply@home.app',
      to,
      subject: 'Your magic link',
      html: `<p>Click <a href="${link}">here</a> to sign in.</p>`,
    });
  }
}
