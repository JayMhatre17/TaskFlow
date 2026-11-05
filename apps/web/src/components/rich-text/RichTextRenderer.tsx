"use client";

import { useEffect, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { RichTextDocument } from "@/lib/api/rich-text.types";
import { sanitizeRichTextDocument, toEditorJson } from "./rich-text.utils";
import { richTextExtensions } from "./rich-text-extensions";
import { richTextContentClassName } from "./rich-text.styles";

type RichTextRendererProps = {
  content: RichTextDocument;
  label?: string;
};

const RichTextRenderer = ({ content, label = "Description" }: RichTextRendererProps) => {
  const safeContent = useMemo(() => sanitizeRichTextDocument(content), [content]);
  const editor = useEditor({
    extensions: richTextExtensions,
    content: toEditorJson(safeContent),
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: richTextContentClassName,
        "aria-label": label,
        "data-rich-text-renderer": "true",
      },
    },
  });

  useEffect(() => {
    editor?.commands.setContent(toEditorJson(safeContent), { emitUpdate: false });
  }, [editor, safeContent]);

  if (!editor) return null;
  return <EditorContent editor={editor} />;
};

export default RichTextRenderer;
