'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlock from '@tiptap/extension-code-block'
import { Button } from "@/components/ui/button"
import { Bold, Italic, List, ListOrdered, Heading2, Strikethrough, Code, CheckSquare, Quote } from 'lucide-react'
import { useEffect } from 'react'

interface TipTapEditorProps {
    content: string
    onChange: (content: string) => void
    editable?: boolean
    placeholder?: string
}

// Helper function to convert HTML to markdown-like format
function htmlToMarkdown(html: string): string {
    return html
        .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
        .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
        .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        .replace(/<s>(.*?)<\/s>/g, '~~$1~~')
        .replace(/<ul>(.*?)<\/ul>/g, (_, list) =>
            list.replace(/<li>(.*?)<\/li>/g, '- $1\n')
        )
        .replace(/<ol>(.*?)<\/ol>/g, (_, list) => {
            let counter = 1
            return list.replace(/<li>(.*?)<\/li>/g, () => `${counter++}. $1\n`)
        })
        .replace(/<div class="task-list-item"><input type="checkbox"[^>]*>(.*?)<\/div>/g, '- [ ] $1\n')
        .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1\n')
        .replace(/<pre><code>(.*?)<\/code><\/pre>/g, '```\n$1\n```\n')
        .replace(/<p>(.*?)<\/p>/g, '$1\n')
        .replace(/&nbsp;/g, ' ')
        .trim()
}

// Helper function to convert markdown to HTML
function markdownToHtml(markdown: string): string {
    return markdown
        .split('\n')
        .map(line => {
            if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`
            if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`
            if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`
            if (line.startsWith('- [ ] ')) return `<div class="task-list-item"><input type="checkbox" disabled>${line.slice(6)}</div>`
            if (line.startsWith('- ')) return `<ul><li>${line.slice(2)}</li></ul>`
            if (line.match(/^\d+\. /)) return `<ol><li>${line.replace(/^\d+\. /, '')}</li></ol>`
            if (line.startsWith('> ')) return `<blockquote>${line.slice(2)}</blockquote>`
            if (line.startsWith('```')) return line.endsWith('```') ? `<pre><code>${line.slice(3, -3)}</code></pre>` : line
            return line ? `<p>${line}</p>` : ''
        })
        .join('\n')
}

export function TipTapEditor({ content, onChange, editable = true, placeholder }: TipTapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Highlight,
            TaskList,
            TaskItem.configure({
                nested: true,
                HTMLAttributes: {
                    class: 'flex items-start my-2',
                },
            }),
            CodeBlock.configure({
                HTMLAttributes: {
                    class: 'rounded-md bg-muted p-4 font-mono text-sm',
                },
            }),
        ],
        content: markdownToHtml(content),
        editable,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
            const markdown = htmlToMarkdown(html)
            onChange(markdown)
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none min-h-[100px] px-4',
            },
        },
    })

    useEffect(() => {
        if (editor && content !== htmlToMarkdown(editor.getHTML())) {
            editor.commands.setContent(markdownToHtml(content), false)
        }
    }, [content, editor])

    if (!editor) {
        return null
    }

    return (
        <div className="rounded-md">
            <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/5">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'bg-muted' : ''}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'bg-muted' : ''}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'bg-muted' : ''}
                    title="Strikethrough"
                >
                    <Strikethrough className="h-3.5 w-3.5" />
                </Button>
                <div className="w-px h-3.5 bg-border mx-1" />
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
                    title="Heading (##)"
                >
                    <Heading2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'bg-muted' : ''}
                    title="Bullet List (-)"
                >
                    <List className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'bg-muted' : ''}
                    title="Numbered List (1.)"
                >
                    <ListOrdered className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    className={editor.isActive('taskList') ? 'bg-muted' : ''}
                    title="Task List (- [ ])"
                >
                    <CheckSquare className="h-3.5 w-3.5" />
                </Button>
                <div className="w-px h-3.5 bg-border mx-1" />
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive('blockquote') ? 'bg-muted' : ''}
                    title="Quote (>)"
                >
                    <Quote className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
                    title="Code Block (```)"
                >
                    <Code className="h-3.5 w-3.5" />
                </Button>
            </div>
            <EditorContent editor={editor} className="p-3" />
            {placeholder && !content && (
                <div className="absolute top-0 left-0 p-4 text-gray-400 pointer-events-none">
                    {placeholder}
                </div>
            )}
        </div>
    )
}
