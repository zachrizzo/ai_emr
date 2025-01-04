import { useState } from 'react'
import { Task } from '@/types'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface CreateTaskFormProps {
  onAddTask: (task: Task) => void
  onCancel: () => void
}

export function CreateTaskForm({ onAddTask, onCancel }: CreateTaskFormProps) {
  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    title: '',
    details: '',
    dueDate: '',
    priority: 'medium',
    assignee: '',
    category: '',
    tags: [],
    status: 'Pending',
    progress: 0,
    comments: [],
    attachments: []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddTask({ ...newTask, id: Date.now().toString() } as Task)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="details">Details</Label>
        <Textarea
          id="details"
          value={newTask.details}
          onChange={(e) => setNewTask({ ...newTask, details: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={newTask.dueDate}
          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={newTask.priority}
          onValueChange={(value) => setNewTask({ ...newTask, priority: value as 'low' | 'medium' | 'high' })}
        >
          <SelectTrigger id="priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="assignee">Assignee</Label>
        <Input
          id="assignee"
          value={newTask.assignee}
          onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={newTask.category}
          onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Create Task</Button>
      </div>
    </form>
  )
}

