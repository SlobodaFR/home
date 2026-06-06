export class SessionExpiredError extends Error {
  constructor() {
    super('Session has expired');
  }
}

export interface SessionSnapshot {
  id: string;
  userId: string;
  refreshHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export class Session {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _refreshHash: string,
    private readonly _expiresAt: Date,
    private readonly _createdAt: Date,
  ) {}

  static create(id: string, userId: string, refreshHash: string, expiresAt: Date): Session {
    return new Session(id, userId, refreshHash, expiresAt, new Date());
  }

  static fromSnapshot(snapshot: SessionSnapshot): Session {
    return new Session(
      snapshot.id,
      snapshot.userId,
      snapshot.refreshHash,
      snapshot.expiresAt,
      snapshot.createdAt,
    );
  }

  isExpired(): boolean {
    return this._expiresAt < new Date();
  }

  rotate(newRefreshHash: string, newExpiresAt: Date): Session {
    if (this.isExpired()) throw new SessionExpiredError();
    return new Session(this._id, this._userId, newRefreshHash, newExpiresAt, this._createdAt);
  }

  snapshot(): SessionSnapshot {
    return {
      id: this._id,
      userId: this._userId,
      refreshHash: this._refreshHash,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
    };
  }
}
