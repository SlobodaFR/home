export interface FeatureFlagsPort {
  isEnabled(flag: string, userId?: string): Promise<boolean>;
  getVariant(flag: string, userId?: string): Promise<string | undefined>;
}
