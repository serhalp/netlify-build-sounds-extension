export const defaultSettings = {
  enableBuildStartSounds: false,
  enableBuildSuccessSounds: true,
  enableBuildFailureSounds: true,
};

export enum SoundFile {
  Start = "assets/start.m4a",
  // Success Jingle.ogg by TitanKaempfer -- https://freesound.org/s/689903/ -- License: Attribution 4.0
  Success = "assets/success.ogg",
  Failure = "assets/failure.wav",
}
