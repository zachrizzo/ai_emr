'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, AlertCircle, CheckCircle2, Brain, Stethoscope, Pill, FileCode } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AIAssistantProps {
    content: string
    specialty: string
    templateType: string
    vitals: {
        bloodPressure?: string
        heartRate?: string
        temperature?: string
        respiratoryRate?: string
        oxygenSaturation?: string
    }
}

interface Suggestion {
    type: 'missing-info' | 'recommendation' | 'alert' | 'template' | 'icd10' | 'drug'
    message: string
    priority: 'low' | 'medium' | 'high'
    category: string
    code?: string
    description?: string
    action?: () => void
}

// Mock ICD-10 database - In production, this would come from an API
const ICD10_CODES = {
    'heart attack': { code: 'I21.9', description: 'Acute myocardial infarction, unspecified' },
    'diabetes': { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
    'hypertension': { code: 'I10', description: 'Essential (primary) hypertension' },
    'pneumonia': { code: 'J18.9', description: 'Pneumonia, unspecified organism' },
}

// Mock drug interactions database - In production, this would come from an API
const DRUG_INTERACTIONS = {
    'warfarin': ['aspirin', 'ibuprofen', 'naproxen'],
    'lisinopril': ['spironolactone', 'potassium supplements'],
    'metformin': ['contrast media', 'alcohol'],
}

export function AIAssistant({ content, specialty, templateType, vitals }: AIAssistantProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [icd10Suggestions, setIcd10Suggestions] = useState<Suggestion[]>([])
    const [drugInteractions, setDrugInteractions] = useState<Suggestion[]>([])

    useEffect(() => {
        analyzeContent()
    }, [content, specialty, templateType, vitals])

    const findDrugInteractions = (text: string) => {
        const interactions: Suggestion[] = []
        const lowerText = text.toLowerCase()

        Object.entries(DRUG_INTERACTIONS).forEach(([drug, interactingDrugs]) => {
            if (lowerText.includes(drug.toLowerCase())) {
                interactingDrugs.forEach(interactingDrug => {
                    if (lowerText.includes(interactingDrug.toLowerCase())) {
                        interactions.push({
                            type: 'drug',
                            message: `Potential interaction between ${drug} and ${interactingDrug}`,
                            priority: 'high',
                            category: 'drug-interaction',
                            description: `Caution: ${drug} and ${interactingDrug} may interact.`
                        })
                    }
                })
            }
        })

        return interactions
    }

    const findICD10Codes = (text: string) => {
        const codes: Suggestion[] = []
        const lowerText = text.toLowerCase()

        Object.entries(ICD10_CODES).forEach(([condition, details]) => {
            if (lowerText.includes(condition)) {
                codes.push({
                    type: 'icd10',
                    message: `Suggested ICD-10 code for "${condition}"`,
                    priority: 'medium',
                    category: 'coding',
                    code: details.code,
                    description: details.description
                })
            }
        })

        return codes
    }

    const analyzeContent = async () => {
        setIsAnalyzing(true)
        try {
            // Basic content analysis
            const newSuggestions: Suggestion[] = []

            // Check for missing vital signs
            if (templateType !== 'Mental Status Exam') {
                if (!vitals.bloodPressure) {
                    newSuggestions.push({
                        type: 'missing-info',
                        message: 'Blood pressure measurement is missing',
                        priority: 'medium',
                        category: 'vitals'
                    })
                }
            }

            // Check template completeness
            if (templateType === 'SOAP') {
                if (!content.includes('Subjective:')) {
                    newSuggestions.push({
                        type: 'missing-info',
                        message: 'Subjective section is missing from SOAP note',
                        priority: 'high',
                        category: 'template'
                    })
                }
            }

            // Medical terminology suggestions
            if (content.toLowerCase().includes('heart attack')) {
                newSuggestions.push({
                    type: 'recommendation',
                    message: 'Consider using "myocardial infarction" for more precise medical terminology',
                    priority: 'low',
                    category: 'terminology'
                })
            }

            // Critical value alerts
            if (vitals.temperature && parseFloat(vitals.temperature) > 103) {
                newSuggestions.push({
                    type: 'alert',
                    message: 'High fever detected. Consider immediate evaluation.',
                    priority: 'high',
                    category: 'vitals'
                })
            }

            // Find ICD-10 codes and drug interactions
            const foundICD10Codes = findICD10Codes(content)
            const foundDrugInteractions = findDrugInteractions(content)

            setIcd10Suggestions(foundICD10Codes)
            setDrugInteractions(foundDrugInteractions)
            setSuggestions(newSuggestions)

        } catch (error) {
            console.error('Error analyzing content:', error)
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Assistant
                    {isAnalyzing && (
                        <span className="text-sm text-muted-foreground ml-2">
                            Analyzing...
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="suggestions">
                    <TabsList>
                        <TabsTrigger value="suggestions">
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Suggestions
                        </TabsTrigger>
                        <TabsTrigger value="icd10">
                            <FileCode className="h-4 w-4 mr-2" />
                            ICD-10
                        </TabsTrigger>
                        <TabsTrigger value="drugs">
                            <Pill className="h-4 w-4 mr-2" />
                            Drug Interactions
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="suggestions">
                        <div className="space-y-4">
                            {suggestions.length === 0 ? (
                                <div className="text-center text-muted-foreground py-4">
                                    No suggestions at this time
                                </div>
                            ) : (
                                suggestions.map((suggestion, index) => (
                                    <SuggestionCard key={index} suggestion={suggestion} />
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="icd10">
                        <div className="space-y-4">
                            {icd10Suggestions.length === 0 ? (
                                <div className="text-center text-muted-foreground py-4">
                                    No ICD-10 codes detected
                                </div>
                            ) : (
                                icd10Suggestions.map((suggestion, index) => (
                                    <SuggestionCard key={index} suggestion={suggestion} />
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="drugs">
                        <div className="space-y-4">
                            {drugInteractions.length === 0 ? (
                                <div className="text-center text-muted-foreground py-4">
                                    No drug interactions detected
                                </div>
                            ) : (
                                drugInteractions.map((suggestion, index) => (
                                    <SuggestionCard key={index} suggestion={suggestion} />
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'missing-info':
                return <AlertCircle className="h-4 w-4" />
            case 'recommendation':
                return <Lightbulb className="h-4 w-4" />
            case 'alert':
                return <AlertCircle className="h-4 w-4" />
            case 'icd10':
                return <FileCode className="h-4 w-4" />
            case 'drug':
                return <Pill className="h-4 w-4" />
            default:
                return <CheckCircle2 className="h-4 w-4" />
        }
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={`flex items-start gap-3 p-3 rounded-lg ${getPriorityColor(suggestion.priority)}`}>
                        {getIcon(suggestion.type)}
                        <div>
                            <p className="font-medium">{suggestion.message}</p>
                            {suggestion.code && (
                                <p className="text-sm mt-1">Code: {suggestion.code}</p>
                            )}
                            {suggestion.description && (
                                <p className="text-sm mt-1">{suggestion.description}</p>
                            )}
                            <div className="flex gap-2 mt-2">
                                <Badge variant="secondary">
                                    {suggestion.category}
                                </Badge>
                                <Badge variant="secondary">
                                    {suggestion.type}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Priority: {suggestion.priority}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
