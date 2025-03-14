import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  DecorativeIcon,
} from "@netlify/sdk/ui/react/components";

import {
  hasUserEnabledAudioPermissions,
  promptUserToEnableAudioPermissions,
} from "../lib/audio";

export const BrowserPermissions = () => {
  const [needsAudioPermissions, setNeedsAudioPermissions] = useState(
    !hasUserEnabledAudioPermissions(),
  );

  useEffect(() => {
    promptUserToEnableAudioPermissions();
  }, []);

  const handleClickCheckAgain = (): void => {
    setNeedsAudioPermissions(!hasUserEnabledAudioPermissions());
  };

  return (
    <>
      <Alert type={needsAudioPermissions ? "error" : "info"}>
        This Extension requires audio permissions to play sounds.
      </Alert>
      <div>
        Browser audio permissions:{" "}
        {needsAudioPermissions ? (
          <>
            <DecorativeIcon name="warning-round" />{" "}
            <strong> not granted</strong>
            <div>
              You must manually grant audio autoplay permissions in your
              browser.
            </div>
            <div>
              <Button onClick={handleClickCheckAgain}>Check again</Button>
            </div>
          </>
        ) : (
          <>
            <DecorativeIcon name="checkmark" /> <strong>granted</strong>
          </>
        )}
      </div>
    </>
  );
};
