'use client'

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback
} from 'react'
import { supabase } from '@/utils/supabase-config'
import { v4 as uuidv4 } from 'uuid'
import type { User } from '@/types/user'
import { useUser } from '@/contexts/UserContext'
import { Element, ElementType } from './types'

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
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<DocumentTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { user } = useUser()

  const fetchTemplates = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!userData?.organization_id) {
        throw new Error('No organization found for user')
      }

      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('organization_id', userData.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const loadTemplate = useCallback(async (id: string) => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!userData?.organization_id) {
        throw new Error('No organization found for user')
      }

      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', id)
        .eq('organization_id', userData.organization_id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Template not found')

      setCurrentTemplate(data)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error loading template:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const saveTemplate = useCallback(async (name: string, description: string, tags: string[]) => {
    if (!user?.id || !currentTemplate) return

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!userData?.organization_id) {
        throw new Error('No organization found for user')
      }

      const { error } = await supabase
        .from('document_templates')
        .upsert({
          ...currentTemplate,
          name,
          description,
          tags,
          organization_id: userData.organization_id,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      setHasUnsavedChanges(false)

      // Update current template locally instead of fetching
      setCurrentTemplate(prev => prev ? {
        ...prev,
        name,
        description,
        tags,
        updated_at: new Date().toISOString()
      } : null)

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

  const createNewTemplate = useCallback(async () => {
    if (!user?.id) {
      throw new Error('No user session')
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      throw new Error('No organization found for user')
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
      .insert([{ ...newTemplate, organization_id: userData.organization_id }])

    if (error) throw error

    setCurrentTemplate(newTemplate)
    return newTemplate
  }, [user])

  const value = {
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
    setHasUnsavedChanges
  }

  return (
    <DocumentBuilderContext.Provider value={value}>
      {children}
    </DocumentBuilderContext.Provider>
  )
}

export function useDocumentBuilder() {
  const context = useContext(DocumentBuilderContext)
  if (!context) {
    throw new Error('useDocumentBuilder must be used within a DocumentBuilderProvider')
  }
  return context
}

