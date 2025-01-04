'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    CheckSquare,
    Table as TableIcon,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Undo,
    Redo,
    Highlighter
} from 'lucide-react'

interface TipTapEditorProps {
    content: string
    onChange: (content: string) => void
    editable?: boolean
    placeholder?: string
}

export function TipTapEditor({
    content,
    onChange,
    editable = true,
    placeholder = 'Start typing your note...'
}: TipTapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3]
                }
            }),
            Placeholder.configure({
                placeholder
            }),
            Highlight,
            TaskList,
            TaskItem.configure({
                nested: true
            }),
            Table.configure({
                resizable: true
            }),
            TableRow,
            TableCell,
            TableHeader
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        }
    })

    if (!editor) return null

    return (
        <div className="border rounded-lg">
            <div className="border-b p-2 flex flex-wrap gap-1">
                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 1 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                    <Heading1 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 2 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    <Heading2 className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('heading', { level: 3 })}
                    onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                    <Heading3 className="h-4 w-4" />
                </Toggle>
                <div className="w-px h-6 bg-border mx-1" />
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bold')}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('italic')}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('strike')}
                    onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                >
                    <Strikethrough className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('highlight')}
                    onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
                >
                    <Highlighter className="h-4 w-4" />
                </Toggle>
                <div className="w-px h-6 bg-border mx-1" />
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bulletList')}
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('orderedList')}
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('taskList')}
                    onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
                >
                    <CheckSquare className="h-4 w-4" />
                </Toggle>
                <div className="w-px h-6 bg-border mx-1" />
                <Toggle
                    size="sm"
                    pressed={editor.isActive('blockquote')}
                    onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <Quote className="h-4 w-4" />
                </Toggle>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    disabled={editor.isActive('table')}
                >
                    <TableIcon className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo className="h-4 w-4" />
                </Button>
            </div>
            <EditorContent editor={editor} className="prose prose-sm max-w-none p-4" />
        </div>
    )
}
