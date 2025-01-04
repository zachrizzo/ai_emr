'use client'

import { useState } from 'react'
import { Task } from '@/types'
import { TaskList } from './task-list'
import { CreateTaskForm } from './create-task-form'
import { Calendar } from './calendar'
import { ReportingAnalytics } from './reporting-analytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  const addTask = (newTask: Task) => {
    setTasks([...tasks, newTask])
    setShowCreateForm(false)
  }

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task))
  }

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const completeTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: 'Completed', progress: 100 } : task
    ))
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Task Management</h1>
      <Button onClick={() => setShowCreateForm(true)} className="mb-4">Create New Task</Button>
      {showCreateForm && <CreateTaskForm onAddTask={addTask} onCancel={() => setShowCreateForm(false)} />}
      <Tabs defaultValue="myTasks">
        <TabsList>
          <TabsTrigger value="myTasks">My Tasks</TabsTrigger>
          <TabsTrigger value="teamTasks">Team Tasks</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="myTasks">
          <TaskList 
            tasks={tasks.filter(task => task.assignee === 'currentUser')} 
            onUpdateTask={updateTask} 
            onDeleteTask={deleteTask} 
            onCompleteTask={completeTask}
          />
        </TabsContent>
        <TabsContent value="teamTasks">
          <TaskList 
            tasks={tasks.filter(task => task.assignee !== 'currentUser')} 
            onUpdateTask={updateTask} 
            onDeleteTask={deleteTask} 
            onCompleteTask={completeTask}
          />
        </TabsContent>
        <TabsContent value="calendar">
          <Calendar tasks={tasks} />
        </TabsContent>
        <TabsContent value="analytics">
          <ReportingAnalytics tasks={tasks} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

