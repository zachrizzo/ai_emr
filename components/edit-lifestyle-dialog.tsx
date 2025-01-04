import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Lifestyle } from '@/types'

interface EditLifestyleDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdateLifestyle: (lifestyle: Lifestyle) => void
  lifestyle: Lifestyle | null
  patientId: string
}

export function EditLifestyleDialog({
  isOpen,
  onClose,
  onUpdateLifestyle,
  lifestyle,
  patientId
}: EditLifestyleDialogProps) {
  const [editingLifestyle, setEditingLifestyle] = useState<Lifestyle | null>(null)

  useEffect(() => {
    if (isOpen) {
      setEditingLifestyle(lifestyle || {
        id: '',
        patient_id: patientId,
        smoking_status: '',
        alcohol_use: '',
        drug_use: '',
        diet_preferences: '',
        exercise_frequency: '',
        exercise_type: '',
        stress_level: '',
        sleep_duration_hours: 0,
        sleep_quality: '',
        mental_health_status: '',
        occupation: '',
        work_hours_per_week: 0,
        exposure_to_toxins: false,
        hobbies_and_interests: '',
        social_support_level: '',
        screen_time_hours: 0,
        hydration_level: '',
        notes: ''
      })
    }
  }, [isOpen, lifestyle, patientId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingLifestyle) {
      onUpdateLifestyle(editingLifestyle)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lifestyle Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="smoking_status">Smoking Status</Label>
              <Select
                value={editingLifestyle?.smoking_status || ''}
                onValueChange={(value) => setEditingLifestyle(prev => ({ ...prev!, smoking_status: value }))}
              >
                <SelectTrigger id="smoking_status">
                  <SelectValue placeholder="Select smoking status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Current Smoker">Current Smoker</SelectItem>
                  <SelectItem value="Former Smoker">Former Smoker</SelectItem>
                  <SelectItem value="Never Smoked">Never Smoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alcohol_use">Alcohol Use</Label>
              <Select
                value={editingLifestyle?.alcohol_use || ''}
                onValueChange={(value) => setEditingLifestyle(prev => ({ ...prev!, alcohol_use: value }))}
              >
                <SelectTrigger id="alcohol_use">
                  <SelectValue placeholder="Select alcohol use" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Occasionally">Occasionally</SelectItem>
                  <SelectItem value="Never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="drug_use">Drug Use</Label>
              <Textarea
                id="drug_use"
                value={editingLifestyle?.drug_use || ''}
                onChange={(e) => setEditingLifestyle(prev => ({ ...prev!, drug_use: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diet_preferences">Diet Preferences</Label>
              <Input
                id="diet_preferences"
                value={editingLifestyle?.diet_preferences || ''}
                onChange={(e) => setEditingLifestyle(prev => ({ ...prev!, diet_preferences: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exercise_frequency">Exercise Frequency</Label>
              <Select
                value={editingLifestyle?.exercise_frequency || ''}
                onValueChange={(value) => setEditingLifestyle(prev => ({ ...prev!, exercise_frequency: value }))}
              >
                <SelectTrigger id="exercise_frequency">
                  <SelectValue placeholder="Select exercise frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Rarely">Rarely</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exercise_type">Exercise Type</Label>
              <Input
                id="exercise_type"
                value={editingLifestyle?.exercise_type || ''}
                onChange={(e) => setEditingLifestyle(prev => ({ ...prev!, exercise_type: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stress_level">Stress Level</Label>
              <Select
                value={editingLifestyle?.stress_level || ''}
                onValueChange={(value) => setEditingLifestyle(prev => ({ ...prev!, stress_level: value }))}
              >
                <SelectTrigger id="stress_level">
                  <SelectValue placeholder="Select stress level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleep_duration_hours">Sleep Duration (hours)</Label>
              <Input
                id="sleep_duration_hours"
                type="number"
                step="0.1"
                value={editingLifestyle?.sleep_duration_hours || ''}
                onChange={(e) => setEditingLifestyle(prev => ({ ...prev!, sleep_duration_hours: parseFloat(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleep_quality">Sleep Quality</Label>
              <Select
                value={editingLifestyle?.sleep_quality || ''}
                onValueChange={(value) => setEditingLifestyle(prev => ({ ...prev!, sleep_quality: value }))}
              >
                <SelectTrigger id="sleep_quality">
                  <SelectValue placeholder="Select sleep quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mental_health_status">Mental Health Status</Label>
              <Input
                id="mental_health_status"
                value={editingLifestyle?.mental_health_status || ''}
                onChange={(e) => setEditingLifestyle(prev => ({ ...prev!, mental_health_status: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={editingLifestyle?.occupation || ''}
                onChange={(e) => setEditingLifestyle(prev => ({ ...prev!, occupation: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_hours_per_week">Work Hours per Week</Label>
              <Input
                id="work_hours_per_week"
                type="number"
                value={editingLifestyle?.work_hours_per_week || ''}
                onChange={(e) => setEditingLifestyle(prev => ({ ...prev!, work_hours_per_week: parseInt(e.target.value) }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="exposure_to_toxins"
                checked={editingLifestyle?.exposure_to_toxins || false}
                onCheckedChange={(checked) => setEditingLifestyle(prev => ({ ...prev!, exposure_to_toxins: checked }))}
              />
              <Label htmlFor="exposure_to_toxins">Exposure to Toxins</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hobbies_and_interests">Hobbies and Interests</Label>
              <Textarea
                id="hobbies_and_interests"
                value={editingLifestyle?.hobbies_and_interests || ''}
                onChange={(e) => setEditingLifestyle(prev => ({ ...prev!, hobbies_and_interests: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_support_level">Social Support Level</Label>
              <Select
                value={editingLifestyle?.social_support_level || ''}
                onValueChange={(value) => setEditingLifestyle(prev => ({ ...prev!, social_support_level: value }))}
              >
                <SelectTrigger id="social_support_level">
                  <SelectValue placeholder="Select social support level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Strong">Strong</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Weak">Weak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="screen_time_hours">Screen Time (hours per day)</Label>
              <Input
                id="screen_time_hours"
                type="number"
                step="0.1"
                value={editingLifestyle?.screen_time_hours || ''}
                onChange={(e) => setEditingLifestyle(prev => ({ ...prev!, screen_time_hours: parseFloat(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hydration_level">Hydration Level</Label>
              <Select
                value={editingLifestyle?.hydration_level || ''}
                onValueChange={(value) => setEditingLifestyle(prev => ({ ...prev!, hydration_level: value }))}
              >
                <SelectTrigger id="hydration_level">
                  <SelectValue placeholder="Select hydration level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Adequate">Adequate</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="col-span-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={editingLifestyle?.notes || ''}
              onChange={(e) => setEditingLifestyle(prev => ({ ...prev!, notes: e.target.value }))}
              className="h-32"
            />
          </div>
          <Button type="submit" className="w-full">Save Lifestyle Information</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

