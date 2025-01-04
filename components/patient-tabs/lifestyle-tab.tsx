import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lifestyle } from '@/types'
import { createClient } from '@supabase/supabase-js'
import { toast } from "@/components/ui/use-toast"
import { EditLifestyleDialog } from '@/components/edit-lifestyle-dialog'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Lifestyle {
  id?: string;
  patient_id: string;
  smoking_status: string;
  alcohol_use: string;
  drug_use: string;
  diet_preferences: string;
  exercise_frequency: string;
  exercise_type: string;
  stress_level: string;
  sleep_duration_hours: number;
  sleep_quality: string;
  mental_health_status: string;
  occupation: string;
  work_hours_per_week: number;
  exposure_to_toxins: boolean;
  hobbies_and_interests: string;
  social_support_level: string;
  screen_time_hours: number;
  hydration_level: string;
  notes: string;
}

interface LifestyleTabProps {
  patientId: string
}

export function LifestyleTab({ patientId }: LifestyleTabProps) {
  const [lifestyle, setLifestyle] = useState<Lifestyle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingLifestyle, setIsEditingLifestyle] = useState(false)

  useEffect(() => {
    fetchLifestyle()
  }, [patientId])

  const fetchLifestyle = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('lifestyle')
        .select('*')
        .eq('patient_id', patientId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No lifestyle record found, which is okay
          setLifestyle(null)
        } else {
          throw error
        }
      } else {
        setLifestyle(data)
      }
    } catch (error) {
      console.error("Error fetching lifestyle information:", error)
      toast({
        title: "Error",
        description: "Failed to fetch lifestyle information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateLifestyle = async (updatedLifestyle: Omit<Lifestyle, 'id' | 'patient_id'>) => {
    try {
      // Validate and limit sleep_duration_hours and screen_time_hours
      const validatedLifestyle = {
        ...updatedLifestyle,
        sleep_duration_hours: Math.min(Math.max(0, Number(updatedLifestyle.sleep_duration_hours)), 99.99),
        screen_time_hours: Math.min(Math.max(0, Number(updatedLifestyle.screen_time_hours)), 99.99),
      };

      const { data, error } = await supabase
        .from('lifestyle')
        .upsert({ 
          ...validatedLifestyle, 
          patient_id: patientId,
          id: lifestyle?.id // Include existing id if available
        })
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setLifestyle(data[0])
        toast({
          title: "Success",
          description: "Lifestyle information updated successfully.",
        })
      } else {
        throw new Error("No data returned after upsert")
      }
    } catch (error) {
      console.error("Error updating lifestyle information:", error)
      toast({
        title: "Error",
        description: "Failed to update lifestyle information. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) return <div>Loading lifestyle information...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Lifestyle Information</CardTitle>
          <Button onClick={() => setIsEditingLifestyle(true)}>
            {lifestyle ? 'Edit Lifestyle' : 'Add Lifestyle'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {lifestyle ? (
          <div className="grid grid-cols-2 gap-4">
            <p><strong>Smoking Status:</strong> {lifestyle.smoking_status}</p>
            <p><strong>Alcohol Use:</strong> {lifestyle.alcohol_use}</p>
            <p><strong>Drug Use:</strong> {lifestyle.drug_use}</p>
            <p><strong>Diet Preferences:</strong> {lifestyle.diet_preferences}</p>
            <p><strong>Exercise Frequency:</strong> {lifestyle.exercise_frequency}</p>
            <p><strong>Exercise Type:</strong> {lifestyle.exercise_type}</p>
            <p><strong>Stress Level:</strong> {lifestyle.stress_level}</p>
            <p><strong>Sleep Duration:</strong> {lifestyle.sleep_duration_hours.toFixed(2)} hours</p>
            <p><strong>Sleep Quality:</strong> {lifestyle.sleep_quality}</p>
            <p><strong>Mental Health Status:</strong> {lifestyle.mental_health_status}</p>
            <p><strong>Occupation:</strong> {lifestyle.occupation}</p>
            <p><strong>Work Hours per Week:</strong> {lifestyle.work_hours_per_week}</p>
            <p><strong>Exposure to Toxins:</strong> {lifestyle.exposure_to_toxins ? 'Yes' : 'No'}</p>
            <p><strong>Hobbies and Interests:</strong> {lifestyle.hobbies_and_interests}</p>
            <p><strong>Social Support Level:</strong> {lifestyle.social_support_level}</p>
            <p><strong>Screen Time:</strong> {lifestyle.screen_time_hours.toFixed(2)} hours per day</p>
            <p><strong>Hydration Level:</strong> {lifestyle.hydration_level}</p>
            <p><strong>Additional Notes:</strong> {lifestyle.notes}</p>
          </div>
        ) : (
          <p>No lifestyle information available.</p>
        )}
      </CardContent>
      <EditLifestyleDialog
        isOpen={isEditingLifestyle}
        onClose={() => setIsEditingLifestyle(false)}
        onUpdateLifestyle={handleUpdateLifestyle}
        lifestyle={lifestyle}
        patientId={patientId}
      />
    </Card>
  )
}

