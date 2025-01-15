'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Send, Check, X, Sparkles, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { supabase } from '@/utils/supabase-config'
import { useUser } from '@/contexts/UserContext'

interface NoteContent {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface AIAssistantProps {
  patientId?: string;
  onUpdateNote?: (content: NoteContent) => void;
}

export function AIAssistant({ patientId, onUpdateNote }: AIAssistantProps) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<NoteContent | null>(null)
  const { toast } = useToast()
  const { userData } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setSuggestion(null)

    try {
      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session')
      }

      // Get organization ID from user metadata
      const organizationId = userData.organization_id
      if (!organizationId) {
        throw new Error('No organization ID found in user profile')
      }

      console.log('Sending request with:', {
        message: query,
        patientId,
        organizationId,
        userMetadata: session.user.user_metadata
      })

      // Call the note-generator Edge Function
      const { data, error } = await supabase.functions.invoke('note-generator', {
        body: {
          message: query,
          patientId,
          currentSection: 'all',
          patientContext: {
            type: 'note_generation',
            requestType: 'full_note'
          },
          organizationId
        }
      })

      if (error) {
        console.error('Edge function error:', error)
        throw error
      }

      console.log('Received response:', data)

      // Parse the response into the correct format
      let noteContent: NoteContent = {
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
      }

      // Handle different response formats
      if (data?.response) {
        console.log('Found response in data:', data.response)
        if (typeof data.response === 'string') {
          console.log('Parsing string response')
          // Try to parse the string response
          const sections = data.response.split(/\b(SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN):/i)
          console.log('Split sections:', sections)
          sections.forEach((section: string, index: number) => {
            const cleanSection = section.trim()
            if (cleanSection) {
              console.log('Processing section:', cleanSection)
              if (cleanSection.toUpperCase() === 'SUBJECTIVE') {
                noteContent.subjective = sections[index + 1]?.trim() || ''
              } else if (cleanSection.toUpperCase() === 'OBJECTIVE') {
                noteContent.objective = sections[index + 1]?.trim() || ''
              } else if (cleanSection.toUpperCase() === 'ASSESSMENT') {
                noteContent.assessment = sections[index + 1]?.trim() || ''
              } else if (cleanSection.toUpperCase() === 'PLAN') {
                noteContent.plan = sections[index + 1]?.trim() || ''
              }
            }
          })
        } else if (typeof data.response === 'object') {
          console.log('Parsing object response')
          // Handle object response
          noteContent = {
            subjective: data.response.subjective || data.response.SUBJECTIVE || '',
            objective: data.response.objective || data.response.OBJECTIVE || '',
            assessment: data.response.assessment || data.response.ASSESSMENT || '',
            plan: data.response.plan || data.response.PLAN || ''
          }
        }
      } else if (typeof data === 'object') {
        console.log('Parsing direct data object')
        // Try to parse the direct response
        noteContent = {
          subjective: data.subjective || data.SUBJECTIVE || '',
          objective: data.objective || data.OBJECTIVE || '',
          assessment: data.assessment || data.ASSESSMENT || '',
          plan: data.plan || data.PLAN || ''
        }
      }

      console.log('Final parsed note content:', noteContent)
      if (Object.values(noteContent).every(v => !v)) {
        console.warn('No content was parsed from the response')
        toast({
          title: 'Warning',
          description: 'No content was found in the AI response. Please try again.',
          variant: 'destructive'
        })
        return
      }

      console.log('Parsed note content:', noteContent)
      setSuggestion(noteContent)

      // Animate in the content
      const container = document.getElementById('suggestion-container')
      if (container) {
        container.style.opacity = '0'
        container.style.transform = 'translateY(10px)'
        setTimeout(() => {
          container.style.opacity = '1'
          container.style.transform = 'translateY(0)'
        }, 0)
      }
    } catch (error) {
      console.error('Error generating note:', error)
      toast({
        title: 'Error',
        description: error instanceof Error
          ? error.message
          : 'Failed to generate note content. Please ensure you are logged in and try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = () => {
    if (suggestion && onUpdateNote) {
      onUpdateNote(suggestion)
      toast({
        title: 'Success ✨',
        description: 'AI suggestions applied to note',
      })
      setQuery('')
      setSuggestion(null)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-[400px] h-[600px] pointer-events-none">
      <div className="w-full h-full flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/40 rounded-xl border shadow-2xl overflow-hidden transition-all duration-500 pointer-events-auto">
        <div className="sticky top-0 px-4 py-3 border-b bg-gradient-to-r from-primary/20 via-primary/10 to-transparent flex items-center gap-2 backdrop-blur-sm z-10">
          <div className="p-2 rounded-full bg-primary/15 relative group">
            <Bot className="h-4 w-4 text-primary relative z-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[6px] group-hover:blur-[8px] transition-all duration-300" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-[11px] text-muted-foreground/80">Your medical note companion</p>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 relative">
          <div className="py-4">
            {!suggestion ? (
              <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground space-y-4">
                <div className="p-4 rounded-full bg-gradient-to-r from-primary/20 to-primary/5 relative group cursor-pointer hover:scale-105 transition-transform duration-300">
                  <Bot className="h-8 w-8 text-primary relative z-10" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                </div>
                <div className="text-center space-y-2 max-w-[280px] mx-auto">
                  <p className="text-sm font-medium bg-gradient-to-r from-primary/90 to-primary/70 bg-clip-text text-transparent">
                    How can I assist with your note today?
                  </p>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">
                    I can help generate complete notes or specific sections with clinical precision
                  </p>
                </div>
              </div>
            ) : (
              <div id="suggestion-container" className="space-y-4 transition-all duration-500 py-2">
                <div className="sticky top-0 flex justify-between items-center pb-3 border-b backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      <div className="absolute inset-0 bg-primary/20 blur-lg animate-pulse" />
                    </div>
                    <h4 className="text-sm font-medium text-primary">Generated Note</h4>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                      onClick={() => setSuggestion(null)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-200"
                      onClick={handleApprove}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                </div>

                {Object.entries(suggestion).map(([section, content], index) => {
                  console.log('Rendering section:', section, 'with content:', content)
                  return (
                    <div
                      key={section}
                      className="space-y-2"
                      style={{
                        animation: `fadeSlideIn 0.4s ease-out ${index * 0.15}s forwards`
                      }}
                    >
                      <h5 className="text-xs font-medium capitalize text-primary/80 flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-primary/60" />
                        {section}
                      </h5>
                      <div className="text-sm p-3 rounded-lg border bg-gradient-to-r from-background/80 to-muted/20 hover:shadow-md transition-all duration-300 whitespace-pre-wrap">
                        {content || 'No content for this section'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 p-3 border-t bg-gradient-to-b from-transparent to-muted/10 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex items-start gap-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me to craft your perfect note..."
              className="flex-1 min-h-[50px] max-h-[100px] resize-none text-sm bg-background/50 backdrop-blur-sm transition-all duration-300 focus:bg-background rounded-lg"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading}
              className={cn(
                "h-[50px] w-[50px] rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300 group shadow-lg",
                isLoading && "animate-pulse"
              )}
            >
              {isLoading ? (
                <div className="relative">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <div className="absolute inset-0 blur-lg bg-primary/50 animate-pulse" />
                </div>
              ) : (
                <Send className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

<style jsx global>{`
  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`}</style>

