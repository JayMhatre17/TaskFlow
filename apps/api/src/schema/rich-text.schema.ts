import { z } from "zod";

export const RICH_TEXT_VERSION = 1 as const;

export const RICH_TEXT_LIMITS = {
  project: { maxSerializedBytes: 64 * 1024, maxRenderedTextLength: 1_000 },
  task: { maxSerializedBytes: 128 * 1024, maxRenderedTextLength: 2_000 },
} as const;

const alignments = ["left", "center", "right", "justify"] as const;
const alignmentSchema = z.enum(alignments);

export type RichTextAlignment = (typeof alignments)[number];
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
        rel?: "noopener noreferrer" | "noopener noreferrer nofollow" | "nofollow" | "ugc" | "sponsored" | null;
        class?: null;
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
export type RichTextBulletListNode = { type: "bulletList"; content: RichTextListItemNode[] };
export type RichTextOrderedListNode = {
  type: "orderedList";
  attrs?: { start?: number; type?: "1" | "a" | "A" | "i" | "I" | null };
  content: RichTextListItemNode[];
};
export type RichTextListNode = RichTextBulletListNode | RichTextOrderedListNode;
export type RichTextImageNode = {
  type: "image";
  attrs: {
    src: string;
    alt?: string | null;
    title?: string | null;
    width?: number | null;
    height?: number | null;
  };
};
export type RichTextTableCellNode = {
  type: "tableCell" | "tableHeader";
  attrs?: { colspan?: 1; rowspan?: 1; colwidth?: null; align?: "left" | "center" | "right" | null };
  content: RichTextBlockNode[];
};
export type RichTextBlockNode =
  | RichTextParagraphNode
  | RichTextHeadingNode
  | RichTextListNode
  | { type: "blockquote"; content: RichTextBlockNode[] }
  | { type: "table"; content: Array<{ type: "tableRow"; content: RichTextTableCellNode[] }> }
  | RichTextImageNode;
export type RichTextDocument = { version: 1; type: "doc"; content: RichTextBlockNode[] };

let blockNodeSchema: z.ZodType<RichTextBlockNode>;

const markSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }).strict(),
  z.object({ type: z.literal("italic") }).strict(),
  z.object({ type: z.literal("underline") }).strict(),
  z.object({ type: z.literal("strike") }).strict(),
  z
    .object({
      type: z.literal("link"),
      attrs: z
        .object({
          href: z.string().min(1).max(2_048),
          target: z.enum(["_blank", "_self"]).nullable().optional(),
          rel: z
            .enum([
              "noopener noreferrer",
              "noopener noreferrer nofollow",
              "nofollow",
              "ugc",
              "sponsored",
            ])
            .nullable()
            .optional(),
          class: z.null().optional(),
          title: z.string().max(500).nullable().optional(),
        })
        .strict(),
    })
    .strict()
    .superRefine((mark, context) => {
      if (!isSafeLinkHref(mark.attrs.href)) {
        context.addIssue({ code: "custom", path: ["attrs", "href"], message: "Link URL must use http, https, or mailto" });
      }
    }),
]);

const marksSchema = z
  .array(markSchema)
  .max(5)
  .superRefine((marks, context) => {
    const types = marks.map((mark) => mark.type);
    if (new Set(types).size !== types.length) {
      context.addIssue({ code: "custom", message: "A mark may appear only once on a text node" });
    }
  });

const textNodeSchema = z
  .object({
    type: z.literal("text"),
    text: z.string().min(1),
    marks: marksSchema.optional(),
  })
  .strict();

const hardBreakNodeSchema = z.object({ type: z.literal("hardBreak") }).strict();

const inlineNodeSchema = z.discriminatedUnion("type", [textNodeSchema, hardBreakNodeSchema]);

const paragraphNodeSchema = z
  .object({
    type: z.literal("paragraph"),
    attrs: z
      .object({ textAlign: alignmentSchema.nullable().optional() })
      .strict()
      .optional(),
    content: z.array(inlineNodeSchema).optional(),
  })
  .strict();

const headingNodeSchema = z
  .object({
    type: z.literal("heading"),
    attrs: z
      .object({
        level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        textAlign: alignmentSchema.nullable().optional(),
      })
      .strict(),
    content: z.array(inlineNodeSchema).optional(),
  })
  .strict();

const imageNodeSchema = z
  .object({
    type: z.literal("image"),
    attrs: z
      .object({
        src: z.string().min(1).max(2_048),
        alt: z.string().max(2_000).nullable().optional(),
        title: z.string().max(500).nullable().optional(),
        width: z.number().int().min(1).max(10_000).nullable().optional(),
        height: z.number().int().min(1).max(10_000).nullable().optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((image, context) => {
    if (!isSafeImageSrc(image.attrs.src)) {
      context.addIssue({ code: "custom", path: ["attrs", "src"], message: "Image source must be an absolute HTTPS URL without credentials" });
    }
  });

const listItemNodeSchema: z.ZodType<RichTextListItemNode> = z.object({
  type: z.literal("listItem"),
  content: z.tuple([paragraphNodeSchema]).rest(z.lazy((): z.ZodType<RichTextBlockNode> => blockNodeSchema)),
}).strict();

const bulletListNodeSchema: z.ZodType<RichTextBulletListNode> = z
  .object({
    type: z.literal("bulletList"),
    content: z.array(listItemNodeSchema).min(1),
  })
  .strict();

const orderedListNodeSchema: z.ZodType<RichTextOrderedListNode> = z
  .object({
    type: z.literal("orderedList"),
    attrs: z
      .object({
        start: z.number().int().min(1).max(100_000).optional(),
        type: z.enum(["1", "a", "A", "i", "I"]).nullable().optional(),
      })
      .strict()
      .optional(),
    content: z.array(listItemNodeSchema).min(1),
  })
  .strict();

const tableCellAttributesSchema = z
  .object({
    colspan: z.literal(1).optional(),
    rowspan: z.literal(1).optional(),
    colwidth: z.null().optional(),
    align: z.enum(["left", "center", "right"]).nullable().optional(),
  })
  .strict()
  .optional();

const tableCellNodeSchema: z.ZodType<RichTextTableCellNode> = z
  .object({
    type: z.enum(["tableCell", "tableHeader"]),
    attrs: tableCellAttributesSchema,
    content: z.array(z.lazy((): z.ZodType<RichTextBlockNode> => blockNodeSchema)).min(1),
  })
  .strict();

const tableRowNodeSchema = z
  .object({
    type: z.literal("tableRow"),
    content: z.array(tableCellNodeSchema).min(1),
  })
  .strict();

const tableNodeSchema = z
  .object({
    type: z.literal("table"),
    content: z.array(tableRowNodeSchema).min(1),
  })
  .strict()
  .superRefine((table, context) => {
    const columnCount = table.content[0]?.content.length;
    if (columnCount === undefined) return;
    table.content.forEach((row, index) => {
      if (row.content.length !== columnCount) {
        context.addIssue({
          code: "custom",
          path: ["content", index, "content"],
          message: "Every table row must have the same number of cells",
        });
      }
    });
  });

const blockquoteNodeSchema: z.ZodType<Extract<RichTextBlockNode, { type: "blockquote" }>> = z
  .object({
    type: z.literal("blockquote"),
    content: z.array(z.lazy((): z.ZodType<RichTextBlockNode> => blockNodeSchema)).min(1),
  })
  .strict();

blockNodeSchema = z.lazy(() =>
  z.union([
    paragraphNodeSchema,
    headingNodeSchema,
    bulletListNodeSchema,
    orderedListNodeSchema,
    blockquoteNodeSchema,
    tableNodeSchema,
    imageNodeSchema,
  ]),
);

export const richTextDocumentSchema = z
  .object({
    version: z.literal(RICH_TEXT_VERSION),
    type: z.literal("doc"),
    content: z.array(blockNodeSchema),
  })
  .strict();

export type RichTextEntity = keyof typeof RICH_TEXT_LIMITS;

export function extractRichTextPlainText(document: RichTextDocument): string {
  return document.content.map(extractBlockText).join("\n");
}

export function createRichTextDocumentSchema(entity: RichTextEntity) {
  const limits = RICH_TEXT_LIMITS[entity];

  return richTextDocumentSchema.superRefine((document, context) => {
    const serializedBytes = Buffer.byteLength(JSON.stringify(document), "utf8");
    if (serializedBytes > limits.maxSerializedBytes) {
      context.addIssue({
        code: "custom",
        path: [],
        message: `Rich-text document exceeds the ${limits.maxSerializedBytes}-byte limit`,
      });
    }

    const renderedTextLength = Array.from(extractRichTextPlainText(document)).length;
    if (renderedTextLength > limits.maxRenderedTextLength) {
      context.addIssue({
        code: "custom",
        path: [],
        message: `Rendered description cannot exceed ${limits.maxRenderedTextLength} characters`,
      });
    }
  });
}

export const projectRichTextDocumentSchema = createRichTextDocumentSchema("project");
export const taskRichTextDocumentSchema = createRichTextDocumentSchema("task");

export function normalizeRichTextDocument(
  input: unknown,
  entity: RichTextEntity,
): RichTextDocument | null {
  if (input === null || input === undefined) return null;

  const document = createRichTextDocumentSchema(entity).parse(input);
  return hasMeaningfulContent(document) ? document : null;
}

function extractBlockText(node: RichTextBlockNode): string {
  switch (node.type) {
    case "paragraph":
    case "heading":
      return (node.content ?? [])
        .map((inline) => inline.type === "text" ? inline.text : "\n")
        .join("");
    case "image":
      return node.attrs.alt ?? "";
    case "bulletList":
    case "orderedList":
      return node.content.map((item) => item.content.map(extractBlockText).join("\n")).join("\n");
    case "blockquote":
      return node.content.map(extractBlockText).join("\n");
    case "table":
      return node.content
        .map((row) => row.content.map((cell) => cell.content.map(extractBlockText).join("\n")).join("\t"))
        .join("\n");
  }
}

function hasMeaningfulContent(document: RichTextDocument): boolean {
  return document.content.some(hasMeaningfulBlockContent);
}

function hasMeaningfulBlockContent(node: RichTextBlockNode): boolean {
  switch (node.type) {
    case "image":
    case "table":
      return true;
    case "paragraph":
    case "heading":
      return (node.content ?? []).some((inline) => inline.type === "text" && inline.text.trim().length > 0);
    case "bulletList":
    case "orderedList":
      return node.content.some((item) => item.content.some(hasMeaningfulBlockContent));
    case "blockquote":
      return node.content.some(hasMeaningfulBlockContent);
  }
}

function isSafeLinkHref(value: string): boolean {
  if (value.trim() !== value || /[\u0000-\u001f\u007f]/.test(value)) return false;

  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isSafeImageSrc(value: string): boolean {
  if (value.trim() !== value || /[\u0000-\u001f\u007f]/.test(value)) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}
