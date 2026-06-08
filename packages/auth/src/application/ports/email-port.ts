export interface EmailPort {
  sendMagicLink(to: string, link: string): Promise<void>;
}
