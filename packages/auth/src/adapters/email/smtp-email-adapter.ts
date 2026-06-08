import nodemailer from 'nodemailer';
import type { EmailPort } from '../../application/ports/email-port';

export class SmtpEmailAdapter implements EmailPort {
  private readonly transporter: nodemailer.Transporter;

  constructor(config: { host: string; port: number }) {
    this.transporter = nodemailer.createTransport(config);
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
