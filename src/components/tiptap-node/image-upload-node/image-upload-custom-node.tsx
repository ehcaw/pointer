import { Plugin } from "prosemirror-state";

// Remove the hooks usage from this function since it's not a React component
function UploadPlugin() {
  // For now, return a basic plugin without upload functionality
  // The upload functionality should be handled by a proper React component
  return new Plugin({
    props: {
      handlePaste() {
        return false;
      },
      handleDrop() {
        return false;
      },
    },
  });
}

export default UploadPlugin;