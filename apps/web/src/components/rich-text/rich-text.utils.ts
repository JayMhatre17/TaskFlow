import type { JSONContent } from "@tiptap/core";
import type {
  RichTextBlockNode,
  RichTextDocument,
  RichTextInlineNode,
  RichTextMark,
} from "@/lib/api/rich-text.types";

export function legacyTextToRichText(text: string | null | undefined): RichTextDocument | null {
  if (!text) return null;

  return {
    version: 1,
    type: "doc",
    content: text.split(/\r\n?|\n/).map((line) => ({
      type: "paragraph" as const,
      ...(line ? { content: [{ type: "text" as const, text: line }] } : {}),
    })),
  };
}

export function toEditorJson(document: RichTextDocument | null | undefined): JSONContent {
  if (!document || document.content.length === 0) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  return {
    type: "doc",
    content: document.content as unknown as JSONContent[],
  };
}

export function fromEditorJson(value: JSONContent): RichTextDocument | null {
  if (value.type !== "doc" || !Array.isArray(value.content)) return null;

  const document: RichTextDocument = {
    version: 1,
    type: "doc",
    content: value.content as RichTextBlockNode[],
  };

  return document.content.some(hasMeaningfulContent) ? document : null;
}

export function sanitizeRichTextDocument(document: RichTextDocument): RichTextDocument {
  return {
    version: 1,
    type: "doc",
    content: document.content.flatMap((node) => {
      const safeNode = sanitizeBlock(node);
      return safeNode ? [safeNode] : [];
    }),
  };
}

export function isSafeRichTextLinkUrl(value: string): boolean {
  if (value.trim() !== value || /[\u0000-\u001f\u007f]/.test(value)) return false;

  try {
    const url = new URL(value);
    return (
      ["http:", "https:", "mailto:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function isSafeRichTextImageUrl(value: string): boolean {
  if (value.trim() !== value || /[\u0000-\u001f\u007f]/.test(value)) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function hasMeaningfulContent(node: RichTextBlockNode): boolean {
  switch (node.type) {
    case "image":
    case "table":
      return true;
    case "paragraph":
    case "heading":
      return (node.content ?? []).some(
        (inline) => inline.type === "text" && inline.text.trim().length > 0,
      );
    case "bulletList":
    case "orderedList":
      return node.content.some((item) => item.content.some(hasMeaningfulContent));
    case "blockquote":
      return node.content.some(hasMeaningfulContent);
  }
}

function sanitizeInline(node: RichTextInlineNode): RichTextInlineNode {
  if (node.type === "hardBreak") return node;

  const marks = node.marks?.flatMap((mark): RichTextMark[] => {
    if (mark.type !== "link") return [mark];
    if (!isSafeRichTextLinkUrl(mark.attrs.href)) return [];
    return [{
      ...mark,
      attrs: { ...mark.attrs, target: "_blank", rel: "noopener noreferrer" },
    }];
  });

  return { ...node, ...(marks ? { marks } : {}) };
}

function sanitizeBlock(node: RichTextBlockNode): RichTextBlockNode | null {
  switch (node.type) {
    case "image":
      return isSafeRichTextImageUrl(node.attrs.src) ? node : null;
    case "paragraph":
    case "heading":
      return { ...node, content: node.content?.map(sanitizeInline) };
    case "bulletList":
    case "orderedList":
      return {
        ...node,
        content: node.content.map((item) => ({
          ...item,
          content: item.content.flatMap((child) => {
            const safeChild = sanitizeBlock(child);
            return safeChild ? [safeChild] : [];
          }) as [Extract<RichTextBlockNode, { type: "paragraph" }>, ...RichTextBlockNode[]],
        })),
      };
    case "blockquote":
      {
        const content = node.content.flatMap((child) => {
          const safeChild = sanitizeBlock(child);
          return safeChild ? [safeChild] : [];
        });
        return content.length ? { ...node, content } : null;
      }
    case "table":
      return {
        ...node,
        content: node.content.map((row) => ({
          ...row,
          content: row.content.map((cell) => ({
            ...cell,
            content: (() => {
              const content = cell.content.flatMap((child) => {
                const safeChild = sanitizeBlock(child);
                return safeChild ? [safeChild] : [];
              });
              return content.length ? content : [{ type: "paragraph" as const }];
            })(),
          })),
        })),
      };
  }
}
