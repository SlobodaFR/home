export class PromoteUserCommand {
  constructor(
    public readonly callerUserId: string,
    public readonly targetUserId: string,
  ) {}
}
