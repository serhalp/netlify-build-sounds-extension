import { z } from "zod";

export const teamSettingsSchema = z.object({
  enableBuildStartSounds: z.boolean(),
  enableBuildSuccessSounds: z.boolean(),
  enableBuildFailureSounds: z.boolean(),
});
