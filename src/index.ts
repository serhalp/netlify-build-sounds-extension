// Documentation: https://sdk.netlify.com/docs
import { NetlifyExtension } from "@netlify/sdk";

const extension = new NetlifyExtension();

// extension.addBuildEventHandler("onPreBuild", () => {
//   // If the build event handler is not enabled, return early
//   if (!process.env["NETLIFY_BUILD_SOUNDS_EXTENSION_ENABLED"]) {
//     return true;
//   }
//   console.log("Hello there.");
// });
//
export { extension };
