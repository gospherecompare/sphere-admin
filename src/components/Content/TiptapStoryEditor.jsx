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
  "mx-auto mb-0 min-h-[560px] w-full max-w-[880px] overflow-auto border-0 bg-white px-7 py-8 text-[16px] leading-8 text-slate-800 outline-none md:px-10 " +
  "[&_a]:font-semibold [&_a]:text-blue-700 [&_a]:underline [&_a]:underline-offset-4 " +
  "[&_blockquote]:my-6 [&_blockquote]:rounded-[24px] [&_blockquote]:border-l-4 [&_blockquote]:border-[#5B34E6] [&_blockquote]:bg-[#F6F3FF] [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-slate-700 " +
  "[&_code]:rounded-md [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.92em] [&_code]:text-slate-700 " +
  "[&_h2]:mt-8 [&_h2]:text-[30px] [&_h2]:font-black [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&_h2]:text-slate-950 " +
  "[&_h3]:mt-6 [&_h3]:text-[22px] [&_h3]:font-bold [&_h3]:text-slate-900 " +
  "[&_img]:my-6 [&_img]:mx-auto [&_img]:block [&_img]:w-auto [&_img]:max-w-[220px] sm:[&_img]:max-w-[280px] [&_img]:rounded-2xl [&_img]:bg-slate-100 [&_img]:object-cover " +
  "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 " +
  "[&_p]:my-4 [&_p]:text-[16px] [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-[22px] [&_pre]:border [&_pre]:border-slate-200 [&_pre]:bg-[#0F172A] [&_pre]:px-5 [&_pre]:py-4 [&_pre]:text-[14px] [&_pre]:leading-7 [&_pre]:text-slate-100 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_strong]:font-bold [&_strong]:text-slate-950 " +
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

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getSelectionPlainText = (editor, selection) => {
  if (!editor || !selection || selection.empty) return "";

  return String(
    editor.state.doc.textBetween(
      selection.from,
      selection.to,
      "\n",
      "\n",
    ) || "",
  );
};

const buildListHtmlFromText = (text, type = "bullet") => {
  const normalizedLines = String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((line) => String(line || "").trim())
    .filter(Boolean);

  if (normalizedLines.length < 2) return "";

  const tag = type === "ordered" ? "ol" : "ul";

  return `<${tag}>${normalizedLines
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("")}</${tag}>`;
};

const TiptapStoryEditor = forwardRef(function TiptapStoryEditor(
  {
    value,
    onChange,
    onEditorStateChange,
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
      if (typeof onEditorStateChange === "function") {
        onEditorStateChange({
          canRedo: instance.can().chain().focus().redo().run(),
          canUndo: instance.can().chain().focus().undo().run(),
          hasSelection: !instance.state.selection.empty,
          isBlockquote: instance.isActive("blockquote"),
          isBold: instance.isActive("bold"),
          isBulletList: instance.isActive("bulletList"),
          isCodeBlock: instance.isActive("codeBlock"),
          isEmpty: instance.isEmpty,
          isFocused: instance.isFocused,
          isH2: instance.isActive("heading", { level: 2 }),
          isH3: instance.isActive("heading", { level: 3 }),
          isItalic: instance.isActive("italic"),
          isLink: instance.isActive("link"),
          isOrderedList: instance.isActive("orderedList"),
          isParagraph: instance.isActive("paragraph"),
          isStrike: instance.isActive("strike"),
          isUnderline: instance.isActive("underline"),
        });
      }
      return result;
    },
    [focusSavedSelection, onEditorStateChange, rememberSelection],
  );

  const emitEditorState = useCallback(
    (instance = editorInstanceRef.current) => {
      if (!instance || typeof onEditorStateChange !== "function") return;

      onEditorStateChange({
        canRedo: instance.can().chain().focus().redo().run(),
        canUndo: instance.can().chain().focus().undo().run(),
        hasSelection: !instance.state.selection.empty,
        isBlockquote: instance.isActive("blockquote"),
        isBold: instance.isActive("bold"),
        isBulletList: instance.isActive("bulletList"),
        isCodeBlock: instance.isActive("codeBlock"),
        isEmpty: instance.isEmpty,
        isFocused: instance.isFocused,
        isH2: instance.isActive("heading", { level: 2 }),
        isH3: instance.isActive("heading", { level: 3 }),
        isItalic: instance.isActive("italic"),
        isLink: instance.isActive("link"),
        isOrderedList: instance.isActive("orderedList"),
        isParagraph: instance.isActive("paragraph"),
        isStrike: instance.isActive("strike"),
        isUnderline: instance.isActive("underline"),
      });
    },
    [onEditorStateChange],
  );

  const toggleListWithSelectionSupport = useCallback(
    (type = "bullet") =>
      runWithSavedSelection((activeEditor) => {
        const selection = activeEditor.state.selection;
        const selectedText = getSelectionPlainText(activeEditor, selection);
        const listHtml = buildListHtmlFromText(selectedText, type);

        if (listHtml) {
          return activeEditor
            .chain()
            .deleteSelection()
            .insertContent(listHtml)
            .run();
        }

        return type === "ordered"
          ? activeEditor.chain().toggleOrderedList().run()
          : activeEditor.chain().toggleBulletList().run();
      }),
    [runWithSavedSelection],
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
      emitEditorState(activeEditor);
    },
    onUpdate: ({ editor: activeEditor }) => {
      const normalized = normalizeValue(activeEditor.getHTML());
      lastKnownValueRef.current = normalized;
      rememberSelection(activeEditor);
      if (typeof onChange === "function") {
        onChange(normalized);
      }
      emitEditorState(activeEditor);
    },
    onFocus: ({ editor: activeEditor }) => {
      rememberSelection(activeEditor);
      emitEditorState(activeEditor);
    },
    onBlur: ({ editor: activeEditor }) => {
      rememberSelection(activeEditor);
      emitEditorState(activeEditor);
    },
    onSelectionUpdate: ({ editor: activeEditor }) => {
      rememberSelection(activeEditor);
      emitEditorState(activeEditor);
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
    emitEditorState(editor);
  }, [
    clearSavedSelection,
    editor,
    emitEditorState,
    normalizeValue,
    rememberSelection,
    value,
  ]);

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
      redo: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().focus().redo().run(),
        ),
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
      toggleBulletList: () => toggleListWithSelectionSupport("bullet"),
      toggleCodeBlock: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().toggleCodeBlock().run(),
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
      toggleOrderedList: () => toggleListWithSelectionSupport("ordered"),
      toggleStrike: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().toggleStrike().run(),
        ),
      toggleUnderline: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().toggleUnderline().run(),
        ),
      undo: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().focus().undo().run(),
        ),
      unsetLink: () =>
        runWithSavedSelection((activeEditor) =>
          activeEditor.chain().focus().extendMarkRange("link").unsetLink().run(),
        ),
    }),
    [
      clearSavedSelection,
      rememberSelection,
      runWithSavedSelection,
      toggleListWithSelectionSupport,
    ],
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

