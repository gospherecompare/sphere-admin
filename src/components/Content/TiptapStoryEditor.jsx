import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";

const EDITOR_SURFACE_CLASS_NAME =
  "mb-0 min-h-[420px] w-full overflow-auto border-0 bg-white px-4 py-4 text-[15px] leading-7 text-slate-800 outline-none " +
  "[&_a]:font-semibold [&_a]:text-blue-700 [&_a]:underline [&_a]:underline-offset-4 " +
  "[&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:bg-blue-50 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-slate-700 " +
  "[&_h2]:mt-7 [&_h2]:text-[24px] [&_h2]:font-black [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&_h2]:text-slate-950 " +
  "[&_h3]:mt-6 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-slate-900 " +
  "[&_img]:my-6 [&_img]:w-full [&_img]:rounded-2xl [&_img]:bg-slate-100 [&_img]:object-cover " +
  "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 " +
  "[&_p]:my-4 [&_strong]:font-bold [&_strong]:text-slate-950 " +
  "[&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm " +
  "[&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 " +
  "[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold " +
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6";

const plainTextToEditorHtml = (text) =>
  String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p>${paragraph
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;")
          .replace(/\n/g, "<br />")}</p>`,
    )
    .join("");

const TiptapStoryEditor = forwardRef(function TiptapStoryEditor(
  {
    value,
    onChange,
    normalizeContent,
    className = "",
  },
  ref,
) {
  const editorInstanceRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const lastKnownValueRef = useRef("");

  const normalizeValue = useCallback(
    (input) =>
      typeof normalizeContent === "function"
        ? normalizeContent(input)
        : String(input || ""),
    [normalizeContent],
  );

  const rememberSelection = useCallback((instance = editorInstanceRef.current) => {
    if (!instance) return null;

    const { from, to } = instance.state.selection;
    const nextSelection = { from, to };
    savedSelectionRef.current = nextSelection;
    return nextSelection;
  }, []);

  const clearSavedSelection = useCallback(() => {
    savedSelectionRef.current = null;
  }, []);

  const focusSavedSelection = useCallback(
    (instance = editorInstanceRef.current) => {
      if (!instance) return false;

      const savedSelection = savedSelectionRef.current;
      if (
        savedSelection &&
        Number.isInteger(savedSelection.from) &&
        Number.isInteger(savedSelection.to)
      ) {
        instance
          .chain()
          .focus()
          .setTextSelection({
            from: savedSelection.from,
            to: savedSelection.to,
          })
          .run();
        return true;
      }

      instance.commands.focus("end");
      return true;
    },
    [],
  );

  const runWithSavedSelection = useCallback(
    (command) => {
      const instance = editorInstanceRef.current;
      if (!instance || typeof command !== "function") return false;

      focusSavedSelection(instance);
      const result = command(instance);
      rememberSelection(instance);
      return result;
    },
    [focusSavedSelection, rememberSelection],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
        HTMLAttributes: {
          rel: null,
          target: null,
        },
      }),
      Image,
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: normalizeValue(value),
    editorProps: {
      attributes: {
        class: EDITOR_SURFACE_CLASS_NAME,
      },
      handlePaste: (_view, event) => {
        const instance = editorInstanceRef.current;
        const text = event.clipboardData?.getData("text/plain");

        if (!instance || !text) return false;

        event.preventDefault();
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().insertContent(plainTextToEditorHtml(text)).run(),
        );
        return true;
      },
    },
    onCreate: ({ editor: activeEditor }) => {
      editorInstanceRef.current = activeEditor;
      const normalized = normalizeValue(activeEditor.getHTML());
      lastKnownValueRef.current = normalized;
      rememberSelection(activeEditor);
    },
    onUpdate: ({ editor: activeEditor }) => {
      const normalized = normalizeValue(activeEditor.getHTML());
      lastKnownValueRef.current = normalized;
      rememberSelection(activeEditor);
      if (typeof onChange === "function") {
        onChange(normalized);
      }
    },
    onFocus: ({ editor: activeEditor }) => {
      rememberSelection(activeEditor);
    },
    onBlur: ({ editor: activeEditor }) => {
      rememberSelection(activeEditor);
    },
    onSelectionUpdate: ({ editor: activeEditor }) => {
      rememberSelection(activeEditor);
    },
  });

  useEffect(() => {
    editorInstanceRef.current = editor || null;
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const normalized = normalizeValue(value);
    const current = normalizeValue(editor.getHTML());
    if (normalized === current || normalized === lastKnownValueRef.current) {
      lastKnownValueRef.current = normalized;
      return;
    }

    editor.commands.setContent(normalized, false);
    lastKnownValueRef.current = normalized;
    clearSavedSelection();
    rememberSelection(editor);
  }, [clearSavedSelection, editor, normalizeValue, rememberSelection, value]);

  useImperativeHandle(
    ref,
    () => ({
      clearSavedSelection,
      focusEnd: () => {
        const instance = editorInstanceRef.current;
        if (!instance) return false;
        instance.commands.focus("end");
        rememberSelection(instance);
        return true;
      },
      getSelectedText: () => {
        const instance = editorInstanceRef.current;
        if (!instance) return "";

        const activeSelection = instance.state.selection;
        const selection =
          activeSelection?.from !== activeSelection?.to
            ? activeSelection
            : savedSelectionRef.current;

        if (
          !selection ||
          !Number.isInteger(selection.from) ||
          !Number.isInteger(selection.to) ||
          selection.from === selection.to
        ) {
          return "";
        }

        return instance.state.doc
          .textBetween(selection.from, selection.to, " ", " ")
          .trim();
      },
      insertHtml: (html) => {
        if (!html) return false;
        return runWithSavedSelection((activeEditor) =>
          activeEditor.chain().insertContent(html).run(),
        );
      },
      insertText: (text) => {
        if (!text) return false;
        return runWithSavedSelection((activeEditor) =>
          activeEditor.chain().insertContent(String(text)).run(),
        );
      },
      saveSelection: () => rememberSelection(),
      setLink: (href) =>
        runWithSavedSelection((activeEditor) =>
          activeEditor
            .chain()
            .extendMarkRange("link")
            .setLink({ href: String(href || "") })
            .run(),
        ),
      setParagraph: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().setParagraph().run(),
        ),
      toggleBlockquote: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().toggleBlockquote().run(),
        ),
      toggleBold: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().toggleBold().run(),
        ),
      toggleBulletList: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().toggleBulletList().run(),
        ),
      toggleHeading: (level) =>
        runWithSavedSelection((activeEditor) =>
          activeEditor
            .chain()
            .toggleHeading({ level: Number(level) || 2 })
            .run(),
        ),
      toggleItalic: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().toggleItalic().run(),
        ),
      toggleOrderedList: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().toggleOrderedList().run(),
        ),
      toggleUnderline: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().toggleUnderline().run(),
        ),
    }),
    [clearSavedSelection, rememberSelection, runWithSavedSelection],
  );

  if (!editor) {
    return (
      <div className={className}>
        <div className={EDITOR_SURFACE_CLASS_NAME} />
      </div>
    );
  }

  return (
    <div className={className}>
      <EditorContent editor={editor} />
    </div>
  );
});

export default TiptapStoryEditor;

