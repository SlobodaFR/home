export class GetUserCommand {
  constructor(
    public readonly callerUserId: string,
    public readonly targetUserId: string,
  ) {}
}
