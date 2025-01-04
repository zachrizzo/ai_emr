import { useState } from 'react'
import { Task } from '@/types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Pencil, Trash2, CheckCircle } from 'lucide-react'
import { TaskDetails } from './task-details'

interface TaskItemProps {
  task: Task
  onUpdate: (task: Task) => void
  onDelete: (taskId: string) => void
  onComplete: (taskId: string) => void
}

export function TaskItem({ task, onUpdate, onDelete, onComplete }: TaskItemProps) {
  const [showDetails, setShowDetails] = useState(false)

  const priorityColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500'
  }

  const statusColors = {
    'Pending': 'bg-gray-500',
    'In Progress': 'bg-blue-500',
    'Completed': 'bg-green-500',
    'Overdue': 'bg-red-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {task.title}
          <div>
            <Button variant="ghost" size="icon" onClick={() => setShowDetails(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
            {task.status !== 'Completed' && (
              <Button variant="ghost" size="icon" onClick={() => onComplete(task.id)}>
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>Due: {new Date(task.dueDate).toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
          <Badge className={statusColors[task.status]}>{task.status}</Badge>
        </div>
        <Progress value={task.progress} className="w-full" />
      </CardContent>
      <CardFooter>
        <div className="flex justify-between items-center w-full">
          <span>Assignee: {task.assignee}</span>
          <span>Category: {task.category}</span>
        </div>
      </CardFooter>
      {showDetails && (
        <TaskDetails
          task={task}
          onUpdate={onUpdate}
          onClose={() => setShowDetails(false)}
        />
      )}
    </Card>
  )
}

