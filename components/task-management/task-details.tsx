import { useState } from 'react'
import { Task, Comment, Attachment } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

interface TaskDetailsProps {
  task: Task
  onUpdate: (task: Task) => void
  onClose: () => void
}

export function TaskDetails({ task, onUpdate, onClose }: TaskDetailsProps) {
  const [editedTask, setEditedTask] = useState<Task>(task)
  const [newComment, setNewComment] = useState('')
  const [newAttachment, setNewAttachment] = useState<Omit<Attachment, 'id'>>({ name: '', url: '', type: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(editedTask)
    onClose()
  }

  const addComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: 'currentUser', // Replace with actual user ID
        content: newComment,
        timestamp: new Date().toISOString()
      }
      setEditedTask({ ...editedTask, comments: [...editedTask.comments, comment] })
      setNewComment('')
    }
  }

  const addAttachment = () => {
    if (newAttachment.name && newAttachment.url) {
      const attachment: Attachment = {
        ...newAttachment,
        id: Date.now().toString()
      }
      setEditedTask({ ...editedTask, attachments: [...editedTask.attachments, attachment] })
      setNewAttachment({ name: '', url: '', type: '' })
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              value={editedTask.details}
              onChange={(e) => setEditedTask({ ...editedTask, details: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={editedTask.dueDate}
              onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={editedTask.priority}
              onValueChange={(value) => setEditedTask({ ...editedTask, priority: value as 'low' | 'medium' | 'high' })}
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
              value={editedTask.assignee}
              onChange={(e) => setEditedTask({ ...editedTask, assignee: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={editedTask.category}
              onChange={(e) => setEditedTask({ ...editedTask, category: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={editedTask.status}
              onValueChange={(value) => setEditedTask({ ...editedTask, status: value as Task['status'] })}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="progress">Progress</Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={editedTask.progress}
              onChange={(e) => setEditedTask({ ...editedTask, progress: parseInt(e.target.value) })}
            />
            <Progress value={editedTask.progress} className="mt-2" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Comments</h3>
            <div className="space-y-2 mb-2">
              {editedTask.comments.map(comment => (
                <div key={comment.id} className="bg-gray-100 p-2 rounded">
                  <p>{comment.content}</p>
                  <p className="text-xs text-gray-500">
                    By {comment.userId} on {new Date(comment.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
              />
              <Button type="button" onClick={addComment}>Add Comment</Button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Attachments</h3>
            <div className="space-y-2 mb-2">
              {editedTask.attachments.map(attachment => (
                <div key={attachment.id} className="flex items-center space-x-2">
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {attachment.name}
                  </a>
                  <span className="text-xs text-gray-500">({attachment.type})</span>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                value={newAttachment.name}
                onChange={(e) => setNewAttachment({ ...newAttachment, name: e.target.value })}
                placeholder="Attachment name"
              />
              <Input
                value={newAttachment.url}
                onChange={(e) => setNewAttachment({ ...newAttachment, url: e.target.value })}
                placeholder="Attachment URL"
              />
              <Input
                value={newAttachment.type}
                onChange={(e) => setNewAttachment({ ...newAttachment, type: e.target.value })}
                placeholder="Attachment type"
              />
              <Button type="button" onClick={addAttachment}>Add Attachment</Button>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Update Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

