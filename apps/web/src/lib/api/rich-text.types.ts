export type RichTextAlignment = "left" | "center" | "right" | "justify";

export type RichTextMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "underline" }
  | { type: "strike" }
  | {
      type: "link";
      attrs: {
        href: string;
        target?: "_blank" | "_self" | null;
        rel?:
          | "noopener noreferrer"
          | "noopener noreferrer nofollow"
          | "nofollow"
          | "ugc"
          | "sponsored"
          | null;
        class?: null;
        title?: string | null;
      };
    };

export type RichTextInlineNode =
  | { type: "text"; text: string; marks?: RichTextMark[] }
  | { type: "hardBreak" };

export type RichTextParagraphNode = {
  type: "paragraph";
  attrs?: { textAlign?: RichTextAlignment | null };
  content?: RichTextInlineNode[];
};

export type RichTextHeadingNode = {
  type: "heading";
  attrs: { level: 1 | 2 | 3; textAlign?: RichTextAlignment | null };
  content?: RichTextInlineNode[];
};

export type RichTextListItemNode = {
  type: "listItem";
  content: [RichTextParagraphNode, ...RichTextBlockNode[]];
};

export type RichTextListNode =
  | { type: "bulletList"; content: RichTextListItemNode[] }
  | {
      type: "orderedList";
      attrs?: { start?: number; type?: "1" | "a" | "A" | "i" | "I" | null };
      content: RichTextListItemNode[];
    };

export type RichTextTableCellNode = {
  type: "tableCell" | "tableHeader";
  attrs?: {
    colspan?: 1;
    rowspan?: 1;
    colwidth?: null;
    align?: "left" | "center" | "right" | null;
  };
  content: RichTextBlockNode[];
};

export type RichTextBlockNode =
  | RichTextParagraphNode
  | RichTextHeadingNode
  | RichTextListNode
  | { type: "blockquote"; content: RichTextBlockNode[] }
  | { type: "table"; content: Array<{ type: "tableRow"; content: RichTextTableCellNode[] }> }
  | {
      type: "image";
      attrs: {
        src: string;
        alt?: string | null;
        title?: string | null;
        width?: number | null;
        height?: number | null;
      };
    };

export type RichTextDocument = { version: 1; type: "doc"; content: RichTextBlockNode[] };

export type DescriptionInput =
  | { description?: string; descriptionContent?: never }
  | { description?: never; descriptionContent?: RichTextDocument | null };
