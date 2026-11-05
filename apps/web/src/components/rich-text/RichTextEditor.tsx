"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import type { RichTextDocument } from "@/lib/api/rich-text.types";
import { Button } from "@/components/ui/button";
import {
  fromEditorJson,
  isSafeRichTextLinkUrl,
  toEditorJson,
} from "./rich-text.utils";
import { richTextExtensions } from "./rich-text-extensions";
import { richTextEditorContentClassName } from "./rich-text.styles";

type RichTextEditorProps = {
  initialContent: RichTextDocument | null;
  onChange: (content: RichTextDocument | null) => void;
  disabled?: boolean;
  label?: string;
};

const hasUnsupportedTablePaste = (html: string) => {
  if (!html.toLowerCase().includes("<table")) return false;
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return Array.from(parsed.querySelectorAll("td, th")).some((cell) => {
    const colspan = Number(cell.getAttribute("colspan") ?? 1);
    const rowspan = Number(cell.getAttribute("rowspan") ?? 1);
    return (
      colspan !== 1 ||
      rowspan !== 1 ||
      cell.hasAttribute("width") ||
      (cell.getAttribute("style") ?? "").toLowerCase().includes("width:")
    );
  });
};

const RichTextEditor = ({
  initialContent,
  onChange,
  disabled = false,
  label = "Description editor",
}: RichTextEditorProps) => {
  const [revision, setRevision] = useState(0);
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [linkHref, setLinkHref] = useState("");
  const selectionRef = useRef({ from: 1, to: 1 });
  const editorContent = useMemo(() => toEditorJson(initialContent), [initialContent]);
  const editor = useEditor({
    extensions: richTextExtensions,
    content: editorContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: richTextEditorContentClassName,
        role: "textbox",
        "aria-label": label,
        "aria-multiline": "true",
        "data-rich-text-editor": "true",
      },
      handlePaste: (_view, event) => {
        const html = event.clipboardData?.getData("text/html") ?? "";
        const hasImageFile = Array.from(event.clipboardData?.items ?? []).some(
          (item) => item.type.startsWith("image/"),
        );
        return hasImageFile || /<img\b/i.test(html) || hasUnsupportedTablePaste(html);
      },
      handleDrop: (_view, event) => {
        const html = event.dataTransfer?.getData("text/html") ?? "";
        const hasImageFile = Array.from(event.dataTransfer?.files ?? []).some(
          (file) => file.type.startsWith("image/"),
        );
        const blocked = hasImageFile || /<img\b/i.test(html) || hasUnsupportedTablePaste(html);
        if (blocked) event.preventDefault();
        return blocked;
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(fromEditorJson(updatedEditor.getJSON()));
      setRevision((current) => current + 1);
    },
    onCreate: ({ editor: createdEditor }) => {
      selectionRef.current = {
        from: createdEditor.state.selection.from,
        to: createdEditor.state.selection.to,
      };
    },
    onSelectionUpdate: ({ editor: updatedEditor }) => {
      selectionRef.current = {
        from: updatedEditor.state.selection.from,
        to: updatedEditor.state.selection.to,
      };
      setRevision((current) => current + 1);
    },
    onTransaction: () => setRevision((current) => current + 1),
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const toggle = (command: () => void) => (event: React.MouseEvent) => {
    event.preventDefault();
    if (!disabled) command();
  };

  const rememberSelection = () => {
    if (!editor) return;
    selectionRef.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };
  };

  const getSavedSelection = () => {
    if (!editor) return { from: 1, to: 1 };
    const lastValidPosition = Math.max(1, editor.state.doc.content.size - 1);
    const from = Math.min(Math.max(selectionRef.current.from, 1), lastValidPosition);
    const to = Math.min(
      Math.max(selectionRef.current.to, from),
      lastValidPosition,
    );
    return { from, to };
  };

  const applyBlockStyle = (value: string) => {
    if (!editor || disabled) return;
    const selection = getSavedSelection();
    const chain = editor.chain().focus().setTextSelection(selection);

    if (value === "paragraph") {
      chain.setParagraph().run();
      return;
    }

    if (value === "1" || value === "2" || value === "3") {
      chain.setHeading({ level: Number(value) as 1 | 2 | 3 }).run();
    }
  };

  const blockStyle = (() => {
    if (!editor) return "paragraph";
    const selection = editor.state.selection;
    const styles = new Set<string>();

    if (selection.empty) {
      const parent = selection.$from.parent;
      if (parent.type.name === "heading") {
        styles.add(String(parent.attrs.level));
      } else if (parent.type.name === "paragraph") {
        styles.add("paragraph");
      }
    } else {
      editor.state.doc.nodesBetween(selection.from, selection.to, (node) => {
        if (node.type.name === "heading") {
          styles.add(String(node.attrs.level));
        } else if (node.type.name === "paragraph") {
          styles.add("paragraph");
        }
      });
    }

    if (styles.size === 1) return [...styles][0];
    return styles.size > 1 ? "mixed" : "paragraph";
  })();

  const openLinkPanel = () => {
    if (!editor || disabled) return;
    setLinkHref(String(editor.getAttributes("link").href ?? ""));
    setLinkPanelOpen((open) => !open);
  };

  const applyLink = () => {
    if (!editor || !isSafeRichTextLinkUrl(linkHref)) return;
    editor
      .chain()
      .focus()
      .setTextSelection(getSavedSelection())
      .setLink({
        href: linkHref,
        target: "_blank",
        rel: "noopener noreferrer",
      })
      .run();
    setLinkPanelOpen(false);
  };

  const removeLink = () => {
    editor
      ?.chain()
      .focus()
      .setTextSelection(getSavedSelection())
      .unsetLink()
      .run();
    setLinkPanelOpen(false);
  };

  const toolbarButton = (
    labelText: string,
    icon: React.ReactNode,
    active: boolean,
    action: (event: React.MouseEvent) => void,
    isDisabled = disabled,
  ) => (
    <Button
      key={labelText}
      type="button"
      size="icon-sm"
      variant={active ? "secondary" : "ghost"}
      className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
      aria-label={labelText}
      aria-pressed={active}
      title={labelText}
      disabled={isDisabled}
      onMouseDown={(event) => {
        rememberSelection();
        event.preventDefault();
      }}
      onClick={action}
    >
      {icon}
    </Button>
  );

  const divider = <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-border" />;

  const group = (name: string, children: React.ReactNode) => (
    <div className="flex min-w-0 items-center gap-0.5 rounded-lg bg-background/70 p-0.5" role="group" aria-label={name}>
      {children}
    </div>
  );

  // Selection and command state are reflected in the compact toolbar.
  void revision;

  return (
    <div className="min-w-0 space-y-2">
      <div
        className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-xl border border-border/80 bg-muted/40 p-1.5 shadow-sm"
        role="toolbar"
        aria-label="Rich text formatting"
      >
        {group("Block style", <>
          <label className="sr-only" htmlFor={`${label.replaceAll(" ", "-")}-heading`}>Block style</label>
          <select
            id={`${label.replaceAll(" ", "-")}-heading`}
            className="h-8 w-36 max-w-full rounded-md border border-transparent bg-transparent px-2 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Block style"
            disabled={!editor || disabled}
            value={blockStyle}
            onMouseDownCapture={rememberSelection}
            onKeyDownCapture={rememberSelection}
            onChange={(event) => applyBlockStyle(event.target.value)}
          >
            <option value="paragraph">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="mixed" disabled>Mixed blocks</option>
          </select>
        </>)}
        {divider}
        {group("Text formatting", <>
          {toolbarButton("Bold", <Bold className="size-4" />, Boolean(editor?.isActive("bold")), toggle(() => editor?.chain().focus().toggleBold().run()))}
          {toolbarButton("Italic", <Italic className="size-4" />, Boolean(editor?.isActive("italic")), toggle(() => editor?.chain().focus().toggleItalic().run()))}
          {toolbarButton("Underline", <UnderlineIcon className="size-4" />, Boolean(editor?.isActive("underline")), toggle(() => editor?.chain().focus().toggleUnderline().run()))}
          {toolbarButton("Strikethrough", <Strikethrough className="size-4" />, Boolean(editor?.isActive("strike")), toggle(() => editor?.chain().focus().toggleStrike().run()))}
          {toolbarButton("Link", <Link2 className="size-4" />, Boolean(editor?.isActive("link")), toggle(openLinkPanel))}
        </>)}
        {divider}
        {group("Lists and quote", <>
          {toolbarButton("Bulleted list", <List className="size-4" />, Boolean(editor?.isActive("bulletList")), toggle(() => editor?.chain().focus().toggleBulletList().run()))}
          {toolbarButton("Numbered list", <ListOrdered className="size-4" />, Boolean(editor?.isActive("orderedList")), toggle(() => editor?.chain().focus().toggleOrderedList().run()))}
          {toolbarButton("Blockquote", <Quote className="size-4" />, Boolean(editor?.isActive("blockquote")), toggle(() => editor?.chain().focus().toggleBlockquote().run()))}
        </>)}
        {divider}
        {group("Text alignment", <>
          {toolbarButton("Align left", <AlignLeft className="size-4" />, editor?.isActive({ textAlign: "left" }) ?? false, toggle(() => editor?.chain().focus().setTextAlign("left").run()))}
          {toolbarButton("Align center", <AlignCenter className="size-4" />, editor?.isActive({ textAlign: "center" }) ?? false, toggle(() => editor?.chain().focus().setTextAlign("center").run()))}
          {toolbarButton("Align right", <AlignRight className="size-4" />, editor?.isActive({ textAlign: "right" }) ?? false, toggle(() => editor?.chain().focus().setTextAlign("right").run()))}
          {toolbarButton("Justify", <AlignJustify className="size-4" />, editor?.isActive({ textAlign: "justify" }) ?? false, toggle(() => editor?.chain().focus().setTextAlign("justify").run()))}
        </>)}
        {divider}
        {group("Insert and table controls", <>
          {toolbarButton("Insert table", <Table2 className="size-4" />, false, toggle(() => editor?.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
            disabled
            title="Image uploads will be available when managed storage is added"
            aria-label="Image upload unavailable"
          >
            <ImagePlus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Image unavailable</span>
          </Button>
          {editor?.isActive("table") && <>
            {toolbarButton("Add row", <Plus className="size-4" />, false, toggle(() => editor.chain().focus().addRowAfter().run()))}
            {toolbarButton("Delete row", <Minus className="size-4" />, false, toggle(() => editor.chain().focus().deleteRow().run()))}
            {toolbarButton("Add column", <Plus className="size-4" />, false, toggle(() => editor.chain().focus().addColumnAfter().run()))}
            {toolbarButton("Delete column", <Minus className="size-4" />, false, toggle(() => editor.chain().focus().deleteColumn().run()))}
            {toolbarButton("Delete table", <Trash2 className="size-4" />, false, toggle(() => editor.chain().focus().deleteTable().run()))}
          </>}
        </>)}
        {divider}
        {group("History and description", <>
          {toolbarButton("Undo", <Undo2 className="size-4" />, false, toggle(() => editor?.chain().focus().undo().run()), !editor || disabled || !editor.can().undo())}
          {toolbarButton("Redo", <Redo2 className="size-4" />, false, toggle(() => editor?.chain().focus().redo().run()), !editor || disabled || !editor.can().redo())}
          {toolbarButton("Clear description", <Eraser className="size-4" />, false, (event) => {
            event.preventDefault();
            if (disabled) return;
            editor?.commands.clearContent();
            onChange(null);
          })}
        </>)}
      </div>

      {linkPanelOpen && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-sm" role="group" aria-label="Set link">
          <label className="sr-only" htmlFor={`${label.replaceAll(" ", "-")}-link`}>Link URL</label>
          <input
            id={`${label.replaceAll(" ", "-")}-link`}
            type="url"
            value={linkHref}
            onChange={(event) => setLinkHref(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
            placeholder="https://example.com"
            className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
            autoComplete="url"
          />
          <Button type="button" size="sm" disabled={!isSafeRichTextLinkUrl(linkHref)} onClick={applyLink}>Apply link</Button>
          {editor?.isActive("link") && <Button type="button" size="sm" variant="outline" onClick={removeLink}>Remove link</Button>}
          <Button type="button" size="sm" variant="ghost" onClick={() => setLinkPanelOpen(false)}>Cancel</Button>
          {linkHref && !isSafeRichTextLinkUrl(linkHref) && (
            <p className="w-full text-sm text-destructive" role="alert">Use an absolute HTTP, HTTPS, or mailto URL.</p>
          )}
        </div>
      )}

      <div className="relative min-w-0 overflow-x-auto rounded-xl border border-border/80 bg-background shadow-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
        <EditorContent editor={editor} />
        {editor?.isEmpty && (
          <span className="pointer-events-none absolute left-5 top-4 text-[0.9375rem] leading-7 text-muted-foreground">
            Write a description...
          </span>
        )}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Image uploads are not available yet. Existing HTTPS image embeds remain visible.
      </p>
    </div>
  );
};

export default RichTextEditor;
