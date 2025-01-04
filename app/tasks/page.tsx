import { TaskManagement } from '@/components/task-management/task-management'

export default function TasksPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Task Management</h1>
      <TaskManagement />
    </div>
  )
}

