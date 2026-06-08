export class RevokeUserCommand {
  constructor(
    public readonly callerUserId: string,
    public readonly targetUserId: string,
  ) {}
}
