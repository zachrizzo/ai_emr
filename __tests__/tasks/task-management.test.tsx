import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import { TaskManagement } from '@/components/task-management/task-management'
import { Task } from '@/types'

// Mock child components
jest.mock('@/components/task-management/task-list', () => ({
    TaskList: ({ tasks, onUpdateTask, onDeleteTask, onCompleteTask }: any) => (
        <div data-testid="mocked-task-list">
            {tasks.map((task: Task) => (
                <div key={task.id} data-testid={`task-${task.id}`}>
                    <span>{task.title}</span>
                    <button onClick={() => onUpdateTask(task)}>Update</button>
                    <button onClick={() => onDeleteTask(task.id)}>Delete</button>
                    <button onClick={() => onCompleteTask(task.id)}>Complete</button>
                </div>
            ))}
        </div>
    ),
}))

jest.mock('@/components/task-management/create-task-form', () => ({
    CreateTaskForm: ({ onAddTask, onCancel }: any) => (
        <div data-testid="mocked-create-task-form">
            <button onClick={() => onAddTask({ id: '123', title: 'New Task', status: 'Todo', assignee: 'currentUser' })}>
                Add Task
            </button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    ),
}))

jest.mock('@/components/task-management/calendar', () => ({
    Calendar: ({ tasks }: any) => <div data-testid="mocked-calendar">{tasks.length} tasks</div>,
}))

jest.mock('@/components/task-management/reporting-analytics', () => ({
    ReportingAnalytics: ({ tasks }: any) => <div data-testid="mocked-analytics">{tasks.length} tasks</div>,
}))

describe('TaskManagement', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders task management interface', () => {
        render(<TaskManagement />)
        expect(screen.getByText('Task Management')).toBeInTheDocument()
        expect(screen.getByText('Create New Task')).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /my tasks/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /team tasks/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /calendar/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument()
    })

    it('shows create task form when create button is clicked', () => {
        render(<TaskManagement />)
        fireEvent.click(screen.getByText('Create New Task'))
        expect(screen.getByTestId('mocked-create-task-form')).toBeInTheDocument()
    })

    it('adds a new task', async () => {
        render(<TaskManagement />)
        fireEvent.click(screen.getByText('Create New Task'))
        fireEvent.click(screen.getByText('Add Task'))

        await waitFor(() => {
            const taskList = screen.getByTestId('mocked-task-list')
            expect(taskList).toBeInTheDocument()
            expect(screen.getByTestId('task-123')).toBeInTheDocument()
        })
    })

    it('switches between tabs', () => {
        render(<TaskManagement />)

        // Click team tasks tab
        fireEvent.click(screen.getByRole('tab', { name: /team tasks/i }))
        expect(screen.getByTestId('mocked-task-list')).toBeInTheDocument()

        // Click calendar tab
        fireEvent.click(screen.getByRole('tab', { name: /calendar/i }))
        expect(screen.getByTestId('mocked-calendar')).toBeInTheDocument()

        // Click analytics tab
        fireEvent.click(screen.getByRole('tab', { name: /analytics/i }))
        expect(screen.getByTestId('mocked-analytics')).toBeInTheDocument()
    })

    it('completes a task', async () => {
        render(<TaskManagement />)

        // Add a task first
        fireEvent.click(screen.getByText('Create New Task'))
        fireEvent.click(screen.getByText('Add Task'))

        // Complete the task
        await waitFor(() => {
            fireEvent.click(screen.getByText('Complete'))
        })

        // Verify task is completed (it should be filtered out from My Tasks view)
        expect(screen.queryByTestId('task-123')).not.toBeInTheDocument()
    })

    it('deletes a task', async () => {
        render(<TaskManagement />)

        // Add a task first
        fireEvent.click(screen.getByText('Create New Task'))
        fireEvent.click(screen.getByText('Add Task'))

        // Delete the task
        await waitFor(() => {
            fireEvent.click(screen.getByText('Delete'))
        })

        // Verify task is deleted
        expect(screen.queryByTestId('task-123')).not.toBeInTheDocument()
    })
})
