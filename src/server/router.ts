import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { procedure, router } from "./trpc.js";
import { teamSettingsSchema } from "../schema/team-configuration.js";
import { siteSettingsSchema } from "../schema/site-configuration.js";

interface Deploy extends Record<string, unknown> {
  state:
    | "new"
    | "pending_review"
    | "accepted"
    | "rejected"
    | "enqueued"
    | "building"
    | "uploading"
    | "uploaded"
    | "preparing"
    | "prepared"
    | "processing"
    | "ready"
    | "error"
    | "retrying";
}

const getSimplifiedDeployState = (
  deploy: Deploy | null,
): "started" | "success" | "failure" | "other" => {
  if (deploy == null) return "other";

  // TODO(serhalp) Confirm these guesses of deploy state semantics
  switch (deploy.state) {
    case "processing":
    case "building":
    case "preparing":
    case "prepared":
    case "retrying":
      return "started";
    case "ready":
      return "success";
    case "error":
    case "rejected":
      return "failure";
    default:
      // new, uploading, uploaded, pending_review, accepted, rejected, enqueued
      return "other";
  }
};

const BUILD_EVENT_HANDLER_ENABLED_ENV_VAR =
  "NETLIFY_BUILD_SOUNDS_EXTENSION_ENABLED";

export const appRouter = router({
  teamSettings: {
    query: procedure.query(async ({ ctx: { teamId, client } }) => {
      if (!teamId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "teamId is required",
        });
      }
      const teamConfig = await client.getTeamConfiguration(teamId);
      if (!teamConfig) {
        return;
      }
      const result = teamSettingsSchema.safeParse(teamConfig.config);
      if (!result.success) {
        console.warn(
          "Failed to parse team settings",
          JSON.stringify(result.error, null, 2),
        );
      }
      return result.data;
    }),

    mutate: procedure
      .input(teamSettingsSchema)
      .mutation(async ({ ctx: { teamId, client }, input }) => {
        if (!teamId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "teamId is required",
          });
        }

        try {
          const existingConfig = await client.getTeamConfiguration(teamId);
          if (!existingConfig) {
            await client.createTeamConfiguration(teamId, input);
          } else {
            await client.updateTeamConfiguration(teamId, {
              ...(existingConfig?.config || {}),
              ...input,
            });
          }
        } catch (e) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save team configuration",
            cause: e,
          });
        }
      }),
  },

  siteSettings: {
    query: procedure.query(async ({ ctx: { teamId, siteId, client } }) => {
      if (!teamId || !siteId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Both teamId and siteId are required",
        });
      }
      const siteConfig = await client.getSiteConfiguration(teamId, siteId);
      if (!siteConfig) {
        return;
      }
      const result = siteSettingsSchema.safeParse(siteConfig.config);
      if (!result.success) {
        console.warn(
          "Failed to parse site settings",
          JSON.stringify(result.error, null, 2),
        );
      }
      return result.data;
    }),

    mutate: procedure
      .input(siteSettingsSchema)
      .mutation(async ({ ctx: { teamId, siteId, client }, input }) => {
        if (!teamId || !siteId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Both teamId and siteId are required",
          });
        }

        try {
          const existingConfig = await client.getSiteConfiguration(
            teamId,
            siteId,
          );
          if (!existingConfig) {
            await client.createSiteConfiguration(teamId, siteId, input);
          } else {
            await client.updateSiteConfiguration(teamId, siteId, {
              ...(existingConfig?.config || {}),
              ...input,
            });
          }
        } catch (e) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save site configuration",
            cause: e,
          });
        }
      }),
  },

  deploy: {
    status: procedure
      .input(z.object({ deployId: z.string() }))
      .query(async ({ ctx: { client }, input: { deployId } }) => {
        if (!deployId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "deployId is required",
          });
        }
        // FIXME(serhalp) `Deploy` type from SDK is `any`. Fix and remove this.
        const deploy = (await client.getDeploy(deployId)) as null | Deploy;

        // TODO(serhalp) Throw on `null` deploy? Is this expected?
        return {
          state: getSimplifiedDeployState(deploy),
        };
      }),
  },

  buildEventHandler: {
    status: procedure.query(async ({ ctx: { teamId, siteId, client } }) => {
      if (!teamId || !siteId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Both teamId and siteId are required",
        });
      }
      const envVars = await client.getEnvironmentVariables({
        accountId: teamId,
        siteId,
      });

      const enabledVar = envVars
        .find((val) => val.key === BUILD_EVENT_HANDLER_ENABLED_ENV_VAR)
        ?.values.find((val) => val.context === "all");

      return {
        enabled: !!enabledVar,
      };
    }),
    enable: procedure.mutation(async ({ ctx: { teamId, siteId, client } }) => {
      if (!teamId || !siteId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Both teamId and siteId are required",
        });
      }

      try {
        await client.createOrUpdateVariable({
          accountId: teamId,
          siteId,
          key: BUILD_EVENT_HANDLER_ENABLED_ENV_VAR,
          value: "true",
        });

        console.log(
          `Build event handler enabled for team ${teamId}, site ${siteId}`,
        );

        return {
          success: true,
          message: "Build event handler enabled successfully",
        };
      } catch (error) {
        console.error(
          `Failed to enable build event handler: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to enable build event handler",
          cause: error,
        });
      }
    }),
    disable: procedure.mutation(async ({ ctx: { teamId, siteId, client } }) => {
      if (!teamId || !siteId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "teamId and siteId are required",
        });
      }

      try {
        await client.deleteEnvironmentVariable({
          accountId: teamId,
          siteId,
          key: BUILD_EVENT_HANDLER_ENABLED_ENV_VAR,
        });
        console.log(
          `Build event handler disabled for team ${teamId}, site ${siteId}`,
        );
        return {
          success: true,
          message: "Build event handler disabled successfully",
        };
      } catch (error) {
        console.error(
          `Failed to disable build event handler for site ${siteId} and team ${teamId}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to disable build event handler",
          cause: error,
        });
      }
    }),
  },
});

export type AppRouter = typeof appRouter;
