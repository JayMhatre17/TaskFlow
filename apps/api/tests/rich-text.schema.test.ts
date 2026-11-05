import { describe, expect, it } from "vitest";
import { getSchema } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import {
  extractRichTextPlainText,
  normalizeRichTextDocument,
  projectRichTextDocumentSchema,
  richTextDocumentSchema,
  taskRichTextDocumentSchema,
} from "../src/schema/rich-text.schema.js";

const text = (value: string, marks?: unknown[]) => ({
  type: "text",
  text: value,
  ...(marks ? { marks } : {}),
});

const paragraph = (value: string) => ({
  type: "paragraph",
  content: [text(value)],
});

const document = (...content: unknown[]) => ({ version: 1, type: "doc", content });

const installedTiptapSchema = getSchema([
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  TableKit,
  Image,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
]);

describe("TaskFlow rich-text document schema", () => {
  it("accepts the supported Tiptap nodes, marks, attributes, and envelope", () => {
    const result = richTextDocumentSchema.safeParse(
      document(
        {
          type: "heading",
          attrs: { level: 2, textAlign: "center" },
          content: [
            text("Styled", [
              { type: "bold" },
              { type: "italic" },
              { type: "underline" },
              { type: "strike" },
              {
                type: "link",
                attrs: {
                  href: "https://example.com/docs",
                  target: "_blank",
                  rel: "noopener noreferrer nofollow",
                  class: null,
                  title: null,
                },
              },
            ]),
          ],
        },
        { type: "bulletList", content: [{ type: "listItem", content: [paragraph("Bullet")] }] },
        {
          type: "orderedList",
          attrs: { start: 3, type: "a" },
          content: [{ type: "listItem", content: [paragraph("Numbered")] }],
        },
        { type: "blockquote", content: [paragraph("Quoted")] },
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                { type: "tableHeader", attrs: { colspan: 1, rowspan: 1, colwidth: null }, content: [paragraph("Header")] },
                { type: "tableCell", content: [paragraph("Value")] },
              ],
            },
          ],
        },
        { type: "image", attrs: { src: "https://cdn.example.com/image.png", alt: "Diagram", title: null } },
        { type: "paragraph", attrs: { textAlign: "right" }, content: [{ type: "hardBreak" }] },
      ),
    );

    expect(result.success).toBe(true);
  });

  it("rejects unsupported nodes, marks, attributes, versions, and heading levels", () => {
    expect(richTextDocumentSchema.safeParse(document({ type: "codeBlock", content: [] })).success).toBe(false);
    expect(richTextDocumentSchema.safeParse(document({ type: "paragraph", attrs: { style: "color:red" } })).success).toBe(false);
    expect(richTextDocumentSchema.safeParse(document({ type: "paragraph", content: [text("x", [{ type: "highlight" }])] })).success).toBe(false);
    expect(richTextDocumentSchema.safeParse(document({ type: "heading", attrs: { level: 4 } })).success).toBe(false);
    expect(richTextDocumentSchema.safeParse({ version: 2, type: "doc", content: [] }).success).toBe(false);
    expect(richTextDocumentSchema.safeParse({ version: 1, type: "doc", content: [], extra: true }).success).toBe(false);
  });

  it.each(["javascript:alert(1)", "data:text/html,hello", "//example.com/path", "https://user:pass@example.com/"])(
    "rejects unsafe link URL %s",
    (href) => {
      expect(
        richTextDocumentSchema.safeParse(
          document({ type: "paragraph", content: [text("link", [{ type: "link", attrs: { href } }])] }),
        ).success,
      ).toBe(false);
    },
  );

  it.each(["data:image/png;base64,AAAA", "http://cdn.example.com/image.png", "//cdn.example.com/image.png", "not a url"])(
    "rejects unsafe image source %s",
    (src) => {
      expect(richTextDocumentSchema.safeParse(document({ type: "image", attrs: { src } })).success).toBe(false);
    },
  );

  it("rejects malformed and non-rectangular tables", () => {
    expect(richTextDocumentSchema.safeParse(document({ type: "table", content: [{ type: "tableRow", content: [] }] })).success).toBe(false);

    const table = {
      type: "table",
      content: [
        { type: "tableRow", content: [{ type: "tableCell", content: [paragraph("A")] }, { type: "tableCell", content: [paragraph("B")] }] },
        { type: "tableRow", content: [{ type: "tableCell", content: [paragraph("C")] }] },
      ],
    };
    expect(richTextDocumentSchema.safeParse(document(table)).success).toBe(false);
  });

  it("accepts representative JSON serialized by the installed Tiptap extensions", () => {
    const tiptapJson = installedTiptapSchema
      .nodeFromJSON({
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [text("Heading")] },
          {
            type: "paragraph",
            content: [text("Link", [{ type: "link", attrs: { href: "https://example.com" } }])],
          },
          { type: "image", attrs: { src: "https://cdn.example.com/image.png" } },
          {
            type: "table",
            content: [
              {
                type: "tableRow",
                content: [
                  { type: "tableHeader", content: [{ type: "paragraph" }] },
                  { type: "tableCell", content: [{ type: "paragraph" }] },
                ],
              },
            ],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  paragraph("List item"),
                  { type: "image", attrs: { src: "https://cdn.example.com/list-image.png" } },
                ],
              },
            ],
          },
        ],
      })
      .toJSON();

    const generatedParagraph = tiptapJson.content?.[1];
    const generatedLink = generatedParagraph?.content?.[0]?.marks?.[0];
    expect(generatedLink?.attrs).toMatchObject({
      title: null,
      target: "_blank",
      rel: "noopener noreferrer nofollow",
      class: null,
    });
    expect(tiptapJson.content?.[2]?.attrs).toMatchObject({ width: null, height: null });
    expect(tiptapJson.content?.[3]?.content?.[0]?.content?.[0]?.attrs).toMatchObject({
      colspan: 1,
      rowspan: 1,
      colwidth: null,
      align: null,
    });

    expect(projectRichTextDocumentSchema.safeParse({ version: 1, ...tiptapJson }).success).toBe(true);
    expect(taskRichTextDocumentSchema.safeParse({ version: 1, ...tiptapJson }).success).toBe(true);
  });

  it("matches Tiptap's paragraph-first list-item content rule", () => {
    const valid = document({
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            paragraph("First paragraph"),
            { type: "heading", attrs: { level: 3 }, content: [text("Following block")] },
            { type: "orderedList", content: [{ type: "listItem", content: [paragraph("Nested item")] }] },
          ],
        },
      ],
    });
    expect(richTextDocumentSchema.safeParse(valid).success).toBe(true);

    expect(
      richTextDocumentSchema.safeParse(
        document({ type: "bulletList", content: [{ type: "listItem", content: [{ type: "heading", attrs: { level: 1 } }] }] }),
      ).success,
    ).toBe(false);
    expect(
      richTextDocumentSchema.safeParse(
        document({ type: "bulletList", content: [{ type: "listItem", content: [{ type: "orderedList", content: [{ type: "listItem", content: [paragraph("Nested")] }] }] }] }),
      ).success,
    ).toBe(false);
  });

  it("validates bounded image dimensions, table alignment, and link titles", () => {
    expect(
      richTextDocumentSchema.safeParse(
        document(
          { type: "image", attrs: { src: "https://cdn.example.com/image.png", width: 640, height: 480 } },
          { type: "table", content: [{ type: "tableRow", content: [{ type: "tableCell", attrs: { align: "center" }, content: [paragraph("Cell")] }] }] },
          { type: "paragraph", content: [text("link", [{ type: "link", attrs: { href: "mailto:help@example.com", title: "Email support" } }])] },
        ),
      ).success,
    ).toBe(true);

    expect(richTextDocumentSchema.safeParse(document({ type: "image", attrs: { src: "https://cdn.example.com/i.png", width: 0 } })).success).toBe(false);
    expect(richTextDocumentSchema.safeParse(document({ type: "image", attrs: { src: "https://cdn.example.com/i.png", height: 10_001 } })).success).toBe(false);
    expect(richTextDocumentSchema.safeParse(document({ type: "image", attrs: { src: "https://cdn.example.com/i.png", decoding: "async" } })).success).toBe(false);
    expect(richTextDocumentSchema.safeParse(document({ type: "table", content: [{ type: "tableRow", content: [{ type: "tableCell", attrs: { align: "justify" }, content: [paragraph("Cell")] }] }] })).success).toBe(false);
  });

  it("enforces serialized byte limits separately for project and task documents", () => {
    const oversized = document(...Array.from({ length: 5_000 }, () => ({ type: "paragraph" })));
    expect(projectRichTextDocumentSchema.safeParse(oversized).success).toBe(false);
    expect(taskRichTextDocumentSchema.safeParse(oversized).success).toBe(false);
  });

  it("counts UTF-8 bytes rather than JavaScript UTF-16 code units", () => {
    const makeImages = (title: string) =>
      document(...Array.from({ length: 70 }, () => ({
        type: "image",
        attrs: { src: "https://cdn.example.com/i.png", title },
      })));

    expect(projectRichTextDocumentSchema.safeParse(makeImages("a".repeat(500))).success).toBe(true);
    expect(projectRichTextDocumentSchema.safeParse(makeImages("é".repeat(500))).success).toBe(false);
  });

  it("enforces the existing project and task rendered-text limits", () => {
    expect(projectRichTextDocumentSchema.safeParse(document(paragraph("a".repeat(1_000)))).success).toBe(true);
    expect(projectRichTextDocumentSchema.safeParse(document(paragraph("a".repeat(1_001)))).success).toBe(false);
    expect(taskRichTextDocumentSchema.safeParse(document(paragraph("a".repeat(2_000)))).success).toBe(true);
    expect(taskRichTextDocumentSchema.safeParse(document(paragraph("a".repeat(2_001)))).success).toBe(false);
    expect(projectRichTextDocumentSchema.safeParse(document(paragraph("😀".repeat(1_000)))).success).toBe(true);
    expect(projectRichTextDocumentSchema.safeParse(document(paragraph("😀".repeat(1_001)))).success).toBe(false);
  });

  it("includes image alt text in rendered-text length limits", () => {
    expect(
      projectRichTextDocumentSchema.safeParse(
        document({ type: "image", attrs: { src: "https://cdn.example.com/i.png", alt: "a".repeat(1_000) } }),
      ).success,
    ).toBe(true);
    expect(
      projectRichTextDocumentSchema.safeParse(
        document({ type: "image", attrs: { src: "https://cdn.example.com/i.png", alt: "a".repeat(1_001) } }),
      ).success,
    ).toBe(false);
    expect(
      taskRichTextDocumentSchema.safeParse(
        document({ type: "image", attrs: { src: "https://cdn.example.com/i.png", alt: "a".repeat(1_500) } }),
      ).success,
    ).toBe(true);
  });

  it("normalizes empty text documents to null but preserves image-only and table-only documents", () => {
    expect(normalizeRichTextDocument(document(), "project")).toBeNull();
    expect(normalizeRichTextDocument(document(paragraph("  \n ")), "task")).toBeNull();
    expect(normalizeRichTextDocument(document({ type: "image", attrs: { src: "https://cdn.example.com/i.png" } }), "project")).not.toBeNull();
    expect(
      normalizeRichTextDocument(
        document({ type: "table", content: [{ type: "tableRow", content: [{ type: "tableCell", content: [{ type: "paragraph" }] }] }] }),
        "task",
      ),
    ).not.toBeNull();
    expect(normalizeRichTextDocument(null, "project")).toBeNull();
  });

  it("extracts a plain-text projection with readable block and table separators", () => {
    const validDocument = richTextDocumentSchema.parse(
      document(
        { type: "heading", attrs: { level: 1 }, content: [text("Title")] },
        { type: "bulletList", content: [{ type: "listItem", content: [paragraph("First"), paragraph("Second")] }] },
        { type: "table", content: [{ type: "tableRow", content: [{ type: "tableCell", content: [paragraph("Cell A")] }, { type: "tableCell", content: [paragraph("Cell B")] }] }] },
        { type: "image", attrs: { src: "https://cdn.example.com/i.png", alt: "Chart" } },
      ),
    );

    expect(extractRichTextPlainText(validDocument)).toBe("Title\nFirst\nSecond\nCell A\tCell B\nChart");
  });
});
