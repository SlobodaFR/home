import type { EmailPort } from '../../application/index';

interface SentLink {
  to: string;
  link: string;
}

export class InMemoryEmailPort implements EmailPort {
  private readonly sentLinks: SentLink[] = [];

  async sendMagicLink(to: string, link: string): Promise<void> {
    this.sentLinks.push({ to, link });
  }

  getSentLinks(): ReadonlyArray<SentLink> {
    return [...this.sentLinks];
  }
}
