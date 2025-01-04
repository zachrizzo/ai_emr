import { render, screen, waitFor } from '../utils/test-utils'
import PatientPortalDashboard from '../../app/patient-portal/page'
import { toast } from '@/components/ui/use-toast'
import { mockSupabase } from '../mocks/supabase'
import '../mocks/supabase'

// Mock UserContext
jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        user: {
            id: '123',
            email: 'patient@example.com',
            organization_id: '456'
        }
    })
}))

// Mock toast components
jest.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({
        toast: jest.fn(),
        toasts: [],
        dismiss: jest.fn()
    }),
    toast: jest.fn()
}))

jest.mock('@/components/ui/toast', () => ({
    ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ToastViewport: () => null,
    Toast: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ToastTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ToastDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ToastClose: () => null,
}))

// Mock components
jest.mock('@/components/ui/card', () => ({
    Card: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mocked-card">{children}</div>
    ),
    CardHeader: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mocked-card-header">{children}</div>
    ),
    CardContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mocked-card-content">{children}</div>
    ),
    CardTitle: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mocked-card-title">{children}</div>
    ),
}))

describe('Patient Portal Dashboard', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks()

        // Reset the mock implementation
        mockSupabase.from.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                data: [
                    {
                        id: '1',
                        full_name: 'John Doe',
                        email: 'john@example.com',
                        phone: '123-456-7890'
                    }
                ],
                error: null
            })
        })
    })

    it('renders the dashboard', () => {
        render(<PatientPortalDashboard />)
        expect(screen.getByTestId('mocked-card-title')).toHaveTextContent('Patient Portal Dashboard')
    })

    it('renders patient list after loading', async () => {
        render(<PatientPortalDashboard />)

        // Wait for the loading state to resolve and patient data to be loaded
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument()
        }, { timeout: 3000 })
    })

    it('displays patient selection section', () => {
        render(<PatientPortalDashboard />)
        expect(screen.getByText('Select a Patient:')).toBeInTheDocument()
        expect(screen.getByTestId('mocked-card')).toBeInTheDocument()
    })

    it('handles error when fetching patients fails', async () => {
        // Mock the error response
        mockSupabase.from.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce({
                data: null,
                error: { message: 'Failed to fetch patients' }
            })
        })

        render(<PatientPortalDashboard />)

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Error',
                variant: 'destructive',
            }))
        })
    })
})
