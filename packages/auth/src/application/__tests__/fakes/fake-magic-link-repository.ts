import { MagicLink } from '../../../domain/index.js';
import type { MagicLinkRepository } from '../../ports/index.js';

export class FakeMagicLinkRepository implements MagicLinkRepository {
  private readonly magicLinks = new Map<string, MagicLink>();

  async findByTokenHash(hash: string): Promise<MagicLink | undefined> {
    const link = [...this.magicLinks.values()].find((l) => l.snapshot().tokenHash === hash);
    return link ? MagicLink.fromSnapshot(link.snapshot()) : undefined;
  }

  async save(magicLink: MagicLink): Promise<void> {
    this.magicLinks.set(magicLink.snapshot().id, magicLink);
  }

  getAll(): ReadonlyArray<MagicLink> {
    return [...this.magicLinks.values()];
  }
}
