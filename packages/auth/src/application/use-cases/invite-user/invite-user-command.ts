export class InviteUserCommand {
  constructor(
    public readonly inviterUserId: string | undefined,
    public readonly email: string,
  ) {}
}
