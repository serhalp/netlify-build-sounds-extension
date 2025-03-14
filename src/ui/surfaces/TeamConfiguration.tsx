import {
  Card,
  CardLoader,
  CardTitle,
  Checkbox,
  Form,
  TeamConfigurationSurface,
} from "@netlify/sdk/ui/react/components";

import { trpc } from "../trpc";
import { teamSettingsSchema } from "../../schema/team-configuration";
import { defaultSettings } from "../../config";
import { BrowserPermissions } from "../components/BrowserPermissions";

export const TeamConfiguration = () => {
  const trpcUtils = trpc.useUtils();
  const teamSettingsQuery = trpc.teamSettings.query.useQuery();
  const teamSettingsMutation = trpc.teamSettings.mutate.useMutation({
    onSuccess: async () => {
      await trpcUtils.teamSettings.query.invalidate();
    },
  });

  if (teamSettingsQuery.isLoading) {
    return <CardLoader />;
  }

  return (
    <TeamConfigurationSurface>
      <Card>
        <CardTitle>Permissions</CardTitle>
        <BrowserPermissions />
      </Card>
      <Card>
        <CardTitle>Configuration</CardTitle>
        <Form
          defaultValues={teamSettingsQuery.data ?? defaultSettings}
          schema={teamSettingsSchema}
          onSubmit={teamSettingsMutation.mutateAsync}
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
    </TeamConfigurationSurface>
  );
};
