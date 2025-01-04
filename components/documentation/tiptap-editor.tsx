'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'

interface TipTapEditorProps {
    content: string
    onChange: (content: string) => void
    editable?: boolean
    placeholder?: string
}

export default function TipTapEditor({
    content,
    onChange,
    editable = true,
    placeholder = 'Start typing...'
}: TipTapEditorProps) {
    const editor = useEditor({
        extensions: [StarterKit],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: cn(
                    'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl m-5 focus:outline-none',
                    'min-h-[150px] w-full max-w-full'
                ),
            },
        },
    })

    return (
        <div className="w-full">
            <EditorContent editor={editor} />
        </div>
    )
}
