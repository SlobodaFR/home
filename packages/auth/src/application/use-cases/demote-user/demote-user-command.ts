export class DemoteUserCommand {
  constructor(
    public readonly callerUserId: string,
    public readonly targetUserId: string,
  ) {}
}
