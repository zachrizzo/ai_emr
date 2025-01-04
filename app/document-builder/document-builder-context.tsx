'use client'

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback
} from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import type { User } from '@/types/user'
import { useUser } from '@/contexts/UserContext'

export interface Element {
  id: string
  type: 'staticText' | 'text' | 'checkbox' | 'dropdown' | 'radio'
  label: string
  description: string
  value: string
  options: string[]
  layout: 'full' | 'half'
}

export interface DocumentTemplate {
  id: string
  name: string
  description: string
  content: Element[]
  tags: string[]
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
}

interface DocumentBuilderContextType {
  templates: DocumentTemplate[]
  currentTemplate: DocumentTemplate | null
  isLoading: boolean
  addElement: (element: Omit<Element, 'id'>) => void
  updateElement: (id: string, updates: Partial<Element>) => void
  removeElement: (id: string) => void
  moveElement: (dragIndex: number, hoverIndex: number) => void
  saveTemplate: (name: string, description: string, tags: string[]) => Promise<void>
  loadTemplate: (id: string) => Promise<void>
  createNewTemplate: () => Promise<DocumentTemplate>
  fetchTemplates: () => Promise<void>
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (value: boolean) => void
}

const DocumentBuilderContext = createContext<DocumentBuilderContextType | undefined>(undefined)

export function DocumentBuilderProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<DocumentTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const fetchTemplates = useCallback(async () => {
    if (!user?.id || !user?.organization_id) {
      setIsLoading(false)
      return
    }

    try {
      console.log('Fetching templates for organization:', user)
      setIsLoading(true)
      const { data, error } = await supabase
        .from('document_templates')
        .select(`
          id,
          name,
          description,
          content,
          tags,
          version,
          created_by,
          last_updated_by,
          organization_id,
          is_active,
          created_at,
          updated_at
        `)
        .eq('organization_id', user.organization_id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching templates:', error)
        throw error
      }

      console.log('Fetched templates:', data)
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchTemplates().catch(error => console.error('Error in useEffect:', error))
  }, [fetchTemplates])

  const addElement = useCallback((element: Omit<Element, 'id'>) => {
    setCurrentTemplate(prevTemplate => {
      if (!prevTemplate) return null
      const newElement: Element = {
        ...element,
        id: uuidv4(),
        value: '',
        options: [],
        layout: 'full',
      }
      return {
        ...prevTemplate,
        content: [...prevTemplate.content, newElement]
      }
    })
    setHasUnsavedChanges(true)
  }, [])

  const updateElement = useCallback((id: string, updates: Partial<Element>) => {
    setCurrentTemplate(prevTemplate => {
      if (!prevTemplate) return null
      return {
        ...prevTemplate,
        content: prevTemplate.content.map(el =>
          el.id === id ? { ...el, ...updates } : el
        )
      }
    })
    setHasUnsavedChanges(true)
  }, [])

  const removeElement = useCallback((id: string) => {
    setCurrentTemplate(prevTemplate => {
      if (!prevTemplate) return null
      return {
        ...prevTemplate,
        content: prevTemplate.content.filter(el => el.id !== id)
      }
    })
    setHasUnsavedChanges(true)
  }, [])

  const moveElement = useCallback((dragIndex: number, hoverIndex: number) => {
    setCurrentTemplate(prevTemplate => {
      if (!prevTemplate) return null
      const newElements = [...prevTemplate.content]
      const [removed] = newElements.splice(dragIndex, 1)
      newElements.splice(hoverIndex, 0, removed)
      return { ...prevTemplate, content: newElements }
    })
    setHasUnsavedChanges(true)
  }, [])

  const saveTemplate = useCallback(async (name: string, description: string, tags: string[]) => {
    if (!user?.id || !user?.organization_id || !supabase || !currentTemplate) {
      throw new Error('Missing required data')
    }

    const updates = {
      name,
      description,
      tags,
      content: currentTemplate.content,
      updated_at: new Date().toISOString(),
      organization_id: user.organization_id
    }

    try {
      const { error } = await supabase
        .from('document_templates')
        .upsert({
          id: currentTemplate.id,
          ...updates,
          created_by: user.id,
          created_at: currentTemplate.created_at || new Date().toISOString()
        })

      if (error) throw error

      setCurrentTemplate(prev => prev ? { ...prev, ...updates } : null)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error saving template:', error)
      throw error
    }
  }, [currentTemplate, user])

  useEffect(() => {
    const autoSave = async () => {
      if (
        hasUnsavedChanges &&
        currentTemplate &&
        user?.id
      ) {
        try {
          await saveTemplate(
            currentTemplate.name,
            currentTemplate.description,
            currentTemplate.tags
          )
        } catch (error) {
          console.error('Error auto-saving template:', error)
        }
      }
    }

    autoSave()
  }, [hasUnsavedChanges, currentTemplate, user?.id, saveTemplate])

  const loadTemplate = useCallback(async (id: string) => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setCurrentTemplate(data)
    } catch (error) {
      console.error('Error loading template:', error)
      throw error
    }
  }, [])

  const createNewTemplate = useCallback(async () => {
    if (!user?.id || !user?.organization_id) {
      throw new Error('No user session')
    }

    const newTemplate: DocumentTemplate = {
      id: uuidv4(),
      name: 'Untitled Template',
      description: '',
      content: [],
      tags: [],
      version: 1,
      is_active: true,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('document_templates')
      .insert([{ ...newTemplate, organization_id: user.organization_id }])

    if (error) throw error

    setCurrentTemplate(newTemplate)
    return newTemplate
  }, [user])

  const contextValue: DocumentBuilderContextType = {
    templates,
    currentTemplate,
    isLoading,
    addElement,
    updateElement,
    removeElement,
    moveElement,
    saveTemplate,
    loadTemplate,
    createNewTemplate,
    fetchTemplates,
    hasUnsavedChanges,
    setHasUnsavedChanges,
  }

  return (
    <DocumentBuilderContext.Provider value={contextValue}>
      {children}
    </DocumentBuilderContext.Provider>
  )
}

export function useDocumentBuilder() {
  const context = useContext(DocumentBuilderContext)
  if (context === undefined) {
    throw new Error('useDocumentBuilder must be used within a DocumentBuilderProvider')
  }
  return context
}

