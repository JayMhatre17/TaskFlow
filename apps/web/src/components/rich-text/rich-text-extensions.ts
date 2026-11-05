import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";

import { isSafeRichTextLinkUrl } from "./rich-text.utils";

const ImageWithoutInsertionRules = Image.extend({
  addInputRules() {
    return [];
  },
});

export const richTextExtensions = [
  StarterKit.configure({
    code: false,
    codeBlock: false,
    heading: { levels: [1, 2, 3] },
    horizontalRule: false,
    link: {
      autolink: false,
      openOnClick: false,
      isAllowedUri: (url) => isSafeRichTextLinkUrl(url),
      HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
    },
  }),
ImageWithoutInsertionRules.configure({
    allowBase64: false,
    resize: false,
    HTMLAttributes: {
      loading: "lazy",
      referrerpolicy: "no-referrer",
    },
  }),
  TableKit.configure({
    table: { resizable: false, lastColumnResizable: false },
  }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
];
