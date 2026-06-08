export class ListUsersCommand {
  constructor(
    public readonly callerUserId: string,
    public readonly offset: number = 0,
    public readonly limit: number = 20,
  ) {}
}
