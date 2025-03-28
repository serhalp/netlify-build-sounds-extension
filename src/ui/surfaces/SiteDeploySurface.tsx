import { useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
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
import { BrowserPermissions } from "../components/BrowserPermissions";

const POLL_INTERVAL_MS = 2000;

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

  const [hasRefetched, setHasRefetched] = useState(false);

  useEffect(() => {
    const timerId = setInterval(async () => {
      setHasRefetched(true);
      deployStatusQuery.refetch({ cancelRefetch: false });
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    // We don't want to play any sounds for the initial fetch, only for actual changes.
    if (!hasRefetched) return;

    if (deployState === "started" && shouldPlaySoundOnStart) {
      playSound(SoundFile.Start);
    } else if (deployState === "success" && shouldPlaySoundOnSuccess) {
      playSound(SoundFile.Success);
    } else if (deployState === "failure" && shouldPlaySoundOnFailure) {
      playSound(SoundFile.Failure);
    }
  }, [deployState]);

  const handleClickFakeStart = () => {
    if (shouldPlaySoundOnStart) {
      playSound(SoundFile.Start);
    }
  };
  const handleClickFakeSuccess = () => {
    if (shouldPlaySoundOnSuccess) {
      playSound(SoundFile.Success);
    }
  };
  const handleClickFakeFailure = () => {
    if (shouldPlaySoundOnFailure) {
      playSound(SoundFile.Failure);
    }
  };

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
        <CardTitle>Permissions</CardTitle>
        <BrowserPermissions />
      </Card>
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
        <CardTitle>DEBUGGING</CardTitle>
        <div>Current deploy state: {deployState}</div>
        <ButtonGroup>
          <Button onClick={handleClickFakeStart}>Fake a start event</Button>
          <Button onClick={handleClickFakeSuccess}>Fake a success event</Button>
          <Button onClick={handleClickFakeFailure}>Fake a failure event</Button>
        </ButtonGroup>
      </Card>
    </SiteDeploySurface>
  );
};
