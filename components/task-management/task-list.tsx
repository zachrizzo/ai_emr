import { Task } from '@/types'
import { TaskItem } from './task-item'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface TaskListProps {
  tasks: Task[]
  onUpdateTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onCompleteTask: (taskId: string) => void
}

export function TaskList({ tasks, onUpdateTask, onDeleteTask, onCompleteTask }: TaskListProps) {
  return (
    <div>
      <div className="mb-4 flex space-x-2">
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Search tasks..." className="w-[200px]" />
      </div>
      <div className="space-y-4">
        {tasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            onUpdate={onUpdateTask} 
            onDelete={onDeleteTask}
            onComplete={onCompleteTask}
          />
        ))}
      </div>
    </div>
  )
}

