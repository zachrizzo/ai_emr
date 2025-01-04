import { render, screen, fireEvent, waitFor, act } from '../utils/test-utils'
import { useRouter } from 'next/navigation'
import DashboardPage from '../../app/dashboard/page'
import { mockSupabase } from '../mocks/supabase'
import '../mocks/supabase'
import { PostgrestQueryBuilder } from '@supabase/postgrest-js'

// Mock next/navigation
const mockRouter = {
    push: jest.fn(),
}
jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}))

// Mock UserContext
const mockUser = {
    id: '123',
    email: 'test@example.com',
    role: 'doctor',
}

jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        user: mockUser,
        setUser: jest.fn(),
    }),
}))

describe('Dashboard Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('renders dashboard content after loading', async () => {
        // Mock successful data fetch
        const mockDb = {
            url: 'mock-url',
            headers: {},
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValueOnce({
                data: mockUser,
                error: null,
            }),
            insert: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as PostgrestQueryBuilder<any, any, string, unknown>

        mockSupabase.from.mockReturnValueOnce(mockDb)

        await act(async () => {
            render(<DashboardPage />)
        })

        // First, verify loading state
        expect(screen.getByText(/loading your dashboard/i)).toBeInTheDocument()

        // Advance timers to simulate loading completion
        await act(async () => {
            jest.advanceTimersByTime(1000)
        })

        // Then wait for content to load
        await waitFor(() => {
            expect(screen.queryByText(/loading your dashboard/i)).not.toBeInTheDocument()
        })

        // Verify user information is displayed
        expect(screen.getByText(mockUser.email)).toBeInTheDocument()
        expect(screen.getByText(mockUser.role)).toBeInTheDocument()
    })

    it('handles error when fetching data', async () => {
        // Mock error response for user data fetch
        const mockDb = {
            url: 'mock-url',
            headers: {},
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValueOnce({
                data: null,
                error: { message: 'Failed to fetch data' },
            }),
            insert: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as PostgrestQueryBuilder<any, any, string, unknown>

        mockSupabase.from.mockReturnValueOnce(mockDb)

        await act(async () => {
            render(<DashboardPage />)
        })

        // First, verify loading state
        expect(screen.getByText(/loading your dashboard/i)).toBeInTheDocument()

        // Advance timers to simulate loading completion
        await act(async () => {
            jest.advanceTimersByTime(1000)
        })

        // Then wait for error message
        await waitFor(() => {
            expect(screen.queryByText(/loading your dashboard/i)).not.toBeInTheDocument()
            expect(screen.getByText(/failed to fetch data/i)).toBeInTheDocument()
        })
    })

    it('handles sign out', async () => {
        // Mock successful data fetch
        const mockDb = {
            url: 'mock-url',
            headers: {},
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValueOnce({
                data: mockUser,
                error: null,
            }),
            insert: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as PostgrestQueryBuilder<any, any, string, unknown>

        mockSupabase.from.mockReturnValueOnce(mockDb)

        await act(async () => {
            render(<DashboardPage />)
        })

        // Advance timers to simulate loading completion
        await act(async () => {
            jest.advanceTimersByTime(1000)
        })

        // Wait for content to load
        await waitFor(() => {
            expect(screen.queryByText(/loading your dashboard/i)).not.toBeInTheDocument()
        })

        const signOutButton = screen.getByRole('button', { name: /sign out/i })
        fireEvent.click(signOutButton)

        await waitFor(() => {
            expect(mockSupabase.auth.signOut).toHaveBeenCalled()
            expect(mockRouter.push).toHaveBeenCalledWith('/login')
        })
    })
})
