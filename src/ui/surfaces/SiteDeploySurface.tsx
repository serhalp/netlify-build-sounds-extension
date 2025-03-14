import { useEffect } from "react";
import {
  Card,
  CardLoader,
  CardTitle,
  DecorativeIcon,
  SiteDeploySurface,
} from "@netlify/sdk/ui/react/components";
import { useNetlifySDK } from "@netlify/sdk/ui/react";

import { trpc } from "../trpc";
import { defaultSettings, SoundFile } from "../../config";
import { playSound } from "../lib/audio";

export const SiteDeploy = () => {
  const {
    context: { deployId },
  } = useNetlifySDK();

  if (!deployId) {
    console.warn("Expected deployId in SiteDeploySurface context");
    return null;
  }

  const deployStatusQuery = trpc.deploy.status.useQuery({ deployId });
  const accountSettingsQuery = trpc.teamSettings.query.useQuery();
  const siteSettingsQuery = trpc.siteSettings.query.useQuery();

  const deployState = deployStatusQuery.data?.state ?? "other";

  const shouldPlaySoundOnStart =
    siteSettingsQuery.data?.enableBuildStartSounds === true ||
    accountSettingsQuery.data?.enableBuildStartSounds === true ||
    defaultSettings.enableBuildStartSounds;
  const shouldPlaySoundOnSuccess =
    siteSettingsQuery.data?.enableBuildSuccessSounds === true ||
    accountSettingsQuery.data?.enableBuildSuccessSounds === true ||
    defaultSettings.enableBuildSuccessSounds;
  const shouldPlaySoundOnFailure =
    siteSettingsQuery.data?.enableBuildFailureSounds === true ||
    accountSettingsQuery.data?.enableBuildFailureSounds === true ||
    defaultSettings.enableBuildFailureSounds;

  // TODO(serhalp) Somehow skip playing a sound on initial deploy state load, only on subsequent changes
  useEffect(() => {
    if (deployState === "started" && shouldPlaySoundOnStart) {
      playSound(SoundFile.Start);
    } else if (deployState === "success" && shouldPlaySoundOnSuccess) {
      playSound(SoundFile.Success);
    } else if (deployState === "failure" && shouldPlaySoundOnFailure) {
      playSound(SoundFile.Failure);
    }
  }, [deployState]);

  if (
    deployStatusQuery.isLoading ||
    accountSettingsQuery.isLoading ||
    siteSettingsQuery.isLoading
  ) {
    return <CardLoader />;
  }

  return (
    <SiteDeploySurface>
      <Card>
        <CardTitle>Configuration</CardTitle>
        {shouldPlaySoundOnStart ? (
          <div>
            <DecorativeIcon name="eye-open" /> Will play sound on{" "}
            <strong>build start</strong>
          </div>
        ) : null}
        {shouldPlaySoundOnSuccess ? (
          <div>
            <DecorativeIcon name="eye-open" /> Will play sound on{" "}
            <strong>build success</strong>
          </div>
        ) : null}
        {shouldPlaySoundOnFailure ? (
          <div>
            <DecorativeIcon name="eye-open" /> Will play sound on{" "}
            <strong>build failure</strong>
          </div>
        ) : null}
      </Card>
      <Card>
        <CardTitle>Live data</CardTitle>
        <div>Current state: {deployState}</div>
      </Card>
    </SiteDeploySurface>
  );
};
