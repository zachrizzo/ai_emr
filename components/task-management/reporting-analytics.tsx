import { Task } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ReportingAnalyticsProps {
  tasks: Task[]
}

export function ReportingAnalytics({ tasks }: ReportingAnalyticsProps) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.status === 'Completed').length
  const overdueTasks = tasks.filter(task => task.status === 'Overdue').length
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const tasksByPriority = {
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Task Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={completionRate} className="mb-2" />
          <p>{completionRate.toFixed(2)}% of tasks completed</p>
          <p>{completedTasks} out of {totalTasks} tasks completed</p>
          <p>{overdueTasks} tasks overdue</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p>High Priority: {tasksByPriority.high}</p>
              <Progress value={(tasksByPriority.high / totalTasks) * 100} className="h-2 bg-red-200">
                <div className="h-full bg-red-500 rounded-full" />
              </Progress>
            </div>
            <div>
              <p>Medium Priority: {tasksByPriority.medium}</p>
              <Progress value={(tasksByPriority.medium / totalTasks) * 100} className="h-2 bg-yellow-200">
                <div className="h-full bg-yellow-500 rounded-full" />
              </Progress>
            </div>
            <div>
              <p>Low Priority: {tasksByPriority.low}</p>
              <Progress value={(tasksByPriority.low / totalTasks) * 100} className="h-2 bg-green-200">
                <div className="h-full bg-green-500 rounded-full" />
              </Progress>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

