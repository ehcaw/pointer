import { Image as TiptapImage } from "@tiptap/extension-image";
import { normalizeConvexImageUrl } from "@/lib/tiptap-utils";

export const Image = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) => {
          const src = element.getAttribute("src");
          return src ? normalizeConvexImageUrl(src) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.src) {
            return {};
          }
          return {
            src: normalizeConvexImageUrl(attributes.src),
          };
        },
      },
    };
  },
});
