export class MagicLinkExpiredError extends Error {
  constructor() {
    super('Magic link has expired');
  }
}

export class MagicLinkAlreadyUsedError extends Error {
  constructor() {
    super('Magic link has already been used');
  }
}

export class MagicLinkInvalidError extends Error {
  constructor() {
    super('Magic link token is invalid');
  }
}

export interface MagicLinkSnapshot {
  id: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export class MagicLink {
  private constructor(
    private readonly _id: string,
    private readonly _email: string,
    private readonly _tokenHash: string,
    private readonly _expiresAt: Date,
    private readonly _usedAt: Date | undefined,
    private readonly _createdAt: Date,
  ) {}

  static create(id: string, email: string, tokenHash: string, expiresAt: Date): MagicLink {
    return new MagicLink(id, email, tokenHash, expiresAt, undefined, new Date());
  }

  static fromSnapshot(snapshot: MagicLinkSnapshot): MagicLink {
    return new MagicLink(
      snapshot.id,
      snapshot.email,
      snapshot.tokenHash,
      snapshot.expiresAt,
      snapshot.usedAt,
      snapshot.createdAt,
    );
  }

  verify(tokenHash: string): void {
    if (this._usedAt) throw new MagicLinkAlreadyUsedError();
    if (this._expiresAt < new Date()) throw new MagicLinkExpiredError();
    if (this._tokenHash !== tokenHash) throw new MagicLinkInvalidError();
  }

  consume(): MagicLink {
    return new MagicLink(
      this._id,
      this._email,
      this._tokenHash,
      this._expiresAt,
      new Date(),
      this._createdAt,
    );
  }

  snapshot(): MagicLinkSnapshot {
    return {
      id: this._id,
      email: this._email,
      tokenHash: this._tokenHash,
      expiresAt: this._expiresAt,
      ...(this._usedAt ? { usedAt: this._usedAt } : {}),
      createdAt: this._createdAt,
    };
  }
}
