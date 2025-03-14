import { z } from "zod";

export const siteSettingsSchema = z.object({
  enableBuildStartSounds: z.boolean(),
  enableBuildSuccessSounds: z.boolean(),
  enableBuildFailureSounds: z.boolean(),
});
