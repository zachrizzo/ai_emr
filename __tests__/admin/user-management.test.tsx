import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import { UserManagement } from '@/components/admin/user-management'
import { toast } from '@/components/ui/use-toast'
import { mockSupabase } from '../mocks/supabase'
import '../mocks/supabase'

// Mock UserContext
jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        user: {
            id: '123',
            email: 'admin@example.com',
            role: 'admin',
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

// Mock confirm dialog
jest.mock('@/components/confirm-dialog', () => ({
    ConfirmDialog: ({ children, onConfirm }: { children: React.ReactNode; onConfirm: () => void }) => (
        <div>
            {children}
            <button onClick={onConfirm}>Confirm</button>
        </div>
    ),
}))

describe('UserManagement', () => {
    const mockUsers = [
        {
            id: '1',
            email: 'user1@example.com',
            role: 'doctor',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
        },
        {
            id: '2',
            email: 'user2@example.com',
            role: 'nurse',
            status: 'active',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
        }
    ]

    beforeEach(() => {
        jest.clearAllMocks()

        // Mock Supabase responses
        mockSupabase.from.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                data: mockUsers,
                error: null
            }),
            update: jest.fn().mockResolvedValue({
                data: null,
                error: null
            }),
            delete: jest.fn().mockResolvedValue({
                data: null,
                error: null
            })
        })
    })

    it('renders user management interface', async () => {
        render(<UserManagement organizationId="456" />)

        await waitFor(() => {
            expect(screen.getByText('Create User')).toBeInTheDocument()
            expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument()
            expect(screen.getByText('user1@example.com')).toBeInTheDocument()
            expect(screen.getByText('user2@example.com')).toBeInTheDocument()
        })
    })

    it('opens create user dialog when Create User button is clicked', async () => {
        render(<UserManagement organizationId="456" />)

        await waitFor(() => {
            fireEvent.click(screen.getByText('Create User'))
            expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
            expect(screen.getByLabelText('Email')).toBeInTheDocument()
            expect(screen.getByLabelText('Role')).toBeInTheDocument()
        })
    })

    it('handles user role update', async () => {
        render(<UserManagement organizationId="456" />)

        await waitFor(() => {
            const roleSelect = screen.getAllByRole('combobox')[1] // First one is role filter
            fireEvent.change(roleSelect, { target: { value: 'admin' } })
        })

        await waitFor(() => {
            expect(mockSupabase.from).toHaveBeenCalledWith('users')
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Success',
                description: expect.stringContaining('updated')
            }))
        })
    })

    it('handles user deletion', async () => {
        render(<UserManagement organizationId="456" />)

        await waitFor(() => {
            const deleteButton = screen.getByRole('button', { name: /delete/i })
            fireEvent.click(deleteButton)
        })

        // Confirm deletion in the modal
        await waitFor(() => {
            const confirmButton = screen.getByText('Confirm')
            fireEvent.click(confirmButton)
        })

        await waitFor(() => {
            expect(mockSupabase.from).toHaveBeenCalledWith('users')
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Success',
                description: expect.stringContaining('deleted')
            }))
        })
    })

    it('handles error when fetching users fails', async () => {
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Failed to fetch users' }
            })
        })

        render(<UserManagement organizationId="456" />)

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Error',
                variant: 'destructive'
            }))
        })
    })

    it('filters users by search term', async () => {
        render(<UserManagement organizationId="456" />)

        await waitFor(() => {
            const searchInput = screen.getByPlaceholderText('Search users...')
            fireEvent.change(searchInput, { target: { value: 'user1' } })
        })

        await waitFor(() => {
            expect(screen.getByText('user1@example.com')).toBeInTheDocument()
            expect(screen.queryByText('user2@example.com')).not.toBeInTheDocument()
        })
    })

    it('filters users by role', async () => {
        render(<UserManagement organizationId="456" />)

        await waitFor(() => {
            const roleFilter = screen.getAllByRole('combobox')[0]
            fireEvent.change(roleFilter, { target: { value: 'doctor' } })
        })

        await waitFor(() => {
            expect(screen.getByText('user1@example.com')).toBeInTheDocument()
            expect(screen.queryByText('user2@example.com')).not.toBeInTheDocument()
        })
    })
})
