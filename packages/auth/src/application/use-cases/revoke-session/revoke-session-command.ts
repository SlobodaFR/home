export class RevokeSessionCommand {
  constructor(public readonly refreshToken: string) {}
}
