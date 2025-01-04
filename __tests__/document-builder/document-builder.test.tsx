import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import DocumentBuilderPage from '@/app/document-builder/page'
import { toast } from '@/components/ui/use-toast'
import { mockSupabase } from '../mocks/supabase'
import '../mocks/supabase'

// Mock UserContext
jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        user: {
            id: '123',
            email: 'test@example.com',
            organization_id: '456'
        }
    })
}))

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({
        toast: jest.fn(),
        toasts: [],
        dismiss: jest.fn()
    }),
    toast: jest.fn()
}))

// Mock dialog component
jest.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
    DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock data grid component
jest.mock('@/components/ui/data-grid', () => ({
    DataGrid: ({ data, onEdit, onDelete }: any) => (
        <div data-testid="mocked-data-grid">
            {data.map((item: any) => (
                <div key={item.id} data-testid={`template-${item.id}`}>
                    <span>{item.name}</span>
                    <span>{item.description}</span>
                    <span>{item.tags.join(', ')}</span>
                    <button onClick={() => onEdit(item)}>Edit</button>
                    <button onClick={() => onDelete([item.id])}>Delete</button>
                </div>
            ))}
        </div>
    )
}))

// Mock next/navigation
const mockRouter = {
    push: jest.fn()
}
jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter
}))

describe('Document Builder Page', () => {
    const mockTemplates = [
        {
            id: '1',
            name: 'Test Template 1',
            description: 'Test Description 1',
            tags: ['medical', 'report'],
            updated_at: new Date().toISOString()
        },
        {
            id: '2',
            name: 'Test Template 2',
            description: 'Test Description 2',
            tags: ['consent', 'form'],
            updated_at: new Date().toISOString()
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()

        // Mock Supabase responses
        mockSupabase.from.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                data: mockTemplates,
                error: null
            }),
            delete: jest.fn().mockResolvedValue({
                data: null,
                error: null
            })
        })
    })

    it('renders document builder interface', async () => {
        render(<DocumentBuilderPage />)

        await waitFor(() => {
            expect(screen.getByText('Document Templates')).toBeInTheDocument()
            expect(screen.getByText('New Template')).toBeInTheDocument()
            expect(screen.getByText('Assign Template')).toBeInTheDocument()
            expect(screen.getByTestId('mocked-data-grid')).toBeInTheDocument()
        })
    })

    it('displays templates in the grid', async () => {
        render(<DocumentBuilderPage />)

        await waitFor(() => {
            expect(screen.getByText('Test Template 1')).toBeInTheDocument()
            expect(screen.getByText('Test Template 2')).toBeInTheDocument()
            expect(screen.getByText('medical, report')).toBeInTheDocument()
            expect(screen.getByText('consent, form')).toBeInTheDocument()
        })
    })

    it('handles template deletion', async () => {
        render(<DocumentBuilderPage />)

        await waitFor(() => {
            const deleteButton = screen.getAllByText('Delete')[0]
            fireEvent.click(deleteButton)
        })

        await waitFor(() => {
            expect(mockSupabase.from).toHaveBeenCalledWith('document_templates')
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Success',
                description: expect.stringContaining('deleted')
            }))
        })
    })

    it('handles template editing navigation', async () => {
        render(<DocumentBuilderPage />)

        await waitFor(() => {
            const editButton = screen.getAllByText('Edit')[0]
            fireEvent.click(editButton)
        })

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith('/document-builder/1')
        })
    })

    it('handles error when fetching templates fails', async () => {
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Failed to fetch templates' }
            })
        })

        render(<DocumentBuilderPage />)

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Error',
                variant: 'destructive'
            }))
        })
    })

    it('opens new template dialog', async () => {
        render(<DocumentBuilderPage />)

        await waitFor(() => {
            fireEvent.click(screen.getByText('New Template'))
            expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
            expect(screen.getByLabelText('Template Name')).toBeInTheDocument()
            expect(screen.getByLabelText('Template Description')).toBeInTheDocument()
        })
    })

    it('opens assign template dialog', async () => {
        render(<DocumentBuilderPage />)

        await waitFor(() => {
            fireEvent.click(screen.getByText('Assign Template'))
            expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
            expect(screen.getByLabelText('Select Users')).toBeInTheDocument()
            expect(screen.getByLabelText('Select Templates')).toBeInTheDocument()
        })
    })
})
