import type { MagicLink } from '../../domain/index';

export interface MagicLinkRepository {
  findByTokenHash(hash: string): Promise<MagicLink | undefined>;
  save(magicLink: MagicLink): Promise<void>;
}
