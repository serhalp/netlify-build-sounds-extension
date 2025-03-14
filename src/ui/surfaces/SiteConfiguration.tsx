import {
  Button,
  Card,
  CardLoader,
  CardTitle,
  Checkbox,
  Form,
  SiteConfigurationSurface,
} from "@netlify/sdk/ui/react/components";

import { trpc } from "../trpc";
import { siteSettingsSchema } from "../../schema/site-configuration.js";
import { defaultSettings } from "../../config";
import { BrowserPermissions } from "../components/BrowserPermissions.js";

export const SiteConfiguration = () => {
  const trpcUtils = trpc.useUtils();

  const siteSettingsQuery = trpc.siteSettings.query.useQuery();
  const siteSettingsMutation = trpc.siteSettings.mutate.useMutation({
    onSuccess: async () => {
      await trpcUtils.siteSettings.query.invalidate();
    },
  });

  const buildEventHandlerEnabledForSite =
    trpc.buildEventHandler.status.useQuery();

  const enableBuildEventHandlerForSite =
    trpc.buildEventHandler.enable.useMutation({
      onSuccess: async () => {
        await trpcUtils.buildEventHandler.status.invalidate();
      },
    });

  const disableBuildEventHandlerForSite =
    trpc.buildEventHandler.disable.useMutation({
      onSuccess: async () => {
        await trpcUtils.buildEventHandler.status.invalidate();
      },
    });

  if (
    buildEventHandlerEnabledForSite.isLoading ||
    siteSettingsQuery.isLoading
  ) {
    return <CardLoader />;
  }

  return (
    <SiteConfigurationSurface>
      <Card>
        <CardTitle>Permissions</CardTitle>
        <BrowserPermissions />
      </Card>
      <Card>
        {buildEventHandlerEnabledForSite.data?.enabled ? (
          <>
            <CardTitle>Disable for site</CardTitle>
            <Button
              className="tw-mt-4"
              loading={disableBuildEventHandlerForSite.isPending}
              onClick={() => disableBuildEventHandlerForSite.mutate()}
              variant="danger"
            >
              Disable
            </Button>
          </>
        ) : (
          <>
            <CardTitle>Enable for site</CardTitle>

            <Button
              className="tw-mt-4"
              loading={enableBuildEventHandlerForSite.isPending}
              onClick={() => enableBuildEventHandlerForSite.mutate()}
            >
              Enable
            </Button>
          </>
        )}
      </Card>
      {buildEventHandlerEnabledForSite.data?.enabled && (
        <Card>
          <CardTitle>Configuration</CardTitle>

          <p>
            These site configuration settings will override global extension
            settings.
          </p>

          <Form
            defaultValues={siteSettingsQuery.data ?? defaultSettings}
            schema={siteSettingsSchema}
            onSubmit={siteSettingsMutation.mutateAsync}
          >
            <Checkbox
              name="enableBuildStartSounds"
              label="Build start"
              helpText="Play a sound when a build starts"
            />
            <Checkbox
              name="enableBuildSuccessSounds"
              label="Build success"
              helpText="Play a sound when a build succeeds"
            />
            <Checkbox
              name="enableBuildFailureSounds"
              label="Build failure"
              helpText="Play a sound when a build fails"
            />
          </Form>
        </Card>
      )}
    </SiteConfigurationSurface>
  );
};
