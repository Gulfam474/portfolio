import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  BetweenHorizonalStart,
  BetweenVerticalStart,
  Trash2,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  className?: string;
};

export function RichTextEditor({ value, onChange, className }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const inTable = editor.isActive("table");

  return (
    <div className={cn("rounded-lg border border-border-subtle bg-background", className)}>
      <div className="flex flex-wrap gap-1 border-b border-border-subtle p-2">
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={addImage}>
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={inTable} onClick={insertTable} title="Insert table">
          <TableIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        {inTable && (
          <>
            <ToolBtn
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add column"
            >
              <BetweenVerticalStart className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add row"
            >
              <BetweenHorizonalStart className="h-3.5 w-3.5" />
            </ToolBtn>
            <ToolBtn
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete table"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </ToolBtn>
          </>
        )}
      </div>
      <EditorContent editor={editor} className="prose-dark px-3 py-2" />
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? "secondary" : "ghost"}
      className="h-8 w-8"
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );
}
