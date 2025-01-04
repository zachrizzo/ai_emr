import { render, screen, fireEvent, waitFor, act } from '../utils/test-utils'
import { useRouter } from 'next/navigation'
import LoginPage from '../../app/login/page'
import { mockSupabase } from '../mocks/supabase'
import { toast } from '@/components/ui/use-toast'
import { AuthError } from '@supabase/supabase-js'

// Mock next/navigation
const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
}
jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    useSearchParams: () => ({
        get: jest.fn().mockReturnValue(null)
    })
}))

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
    toast: jest.fn(),
}))

// Mock UserContext
jest.mock('@/contexts/UserContext', () => ({
    useUser: () => ({
        setUser: jest.fn(),
    }),
}))

describe('Login Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: null },
            error: null
        })
    })

    it('renders login form', () => {
        render(<LoginPage />)
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText('Password')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('toggles password visibility', () => {
        render(<LoginPage />)
        const passwordInput = screen.getByLabelText('Password')
        const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })

        expect(passwordInput).toHaveAttribute('type', 'password')
        fireEvent.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'text')
        fireEvent.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('validates required fields', async () => {
        render(<LoginPage />)
        const submitButton = screen.getByRole('button', { name: /sign in/i })

        await act(async () => {
            fireEvent.click(submitButton)
        })

        await waitFor(() => {
            expect(screen.getByText('Email is required')).toBeInTheDocument()
            expect(screen.getByText('Password is required')).toBeInTheDocument()
        })
    })

    it('handles successful login', async () => {
        const mockUser = {
            id: '123',
            email: 'test@example.com',
            role: 'doctor',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        const mockSession = {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Date.now() + 3600,
            expires_in: 3600,
            token_type: 'bearer',
            user: mockUser
        }

        mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
            data: {
                user: mockUser,
                session: mockSession
            },
            error: null
        })

        render(<LoginPage />)

        await act(async () => {
            fireEvent.change(screen.getByLabelText(/email/i), {
                target: { value: 'test@example.com' },
            })
            fireEvent.change(screen.getByLabelText('Password'), {
                target: { value: 'password123' },
            })
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
        })

        await waitFor(() => {
            expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard')
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Login Successful',
                description: 'You have been logged in successfully.',
            }))
        })
    })

    it('handles login error', async () => {
        mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('Invalid credentials'))

        render(<LoginPage />)

        await act(async () => {
            fireEvent.change(screen.getByLabelText(/email/i), {
                target: { value: 'test@example.com' },
            })
            fireEvent.change(screen.getByLabelText('Password'), {
                target: { value: 'wrongpassword' },
            })
            fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
        })

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Error',
                description: 'Invalid credentials',
                variant: 'destructive',
            }))
        })
    })

    it('redirects to dashboard if already authenticated', async () => {
        const mockUser = {
            id: '123',
            email: 'test@example.com',
            role: 'doctor',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        const mockSession = {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Date.now() + 3600,
            expires_in: 3600,
            token_type: 'bearer',
            user: mockUser
        }

        mockSupabase.auth.getSession.mockResolvedValueOnce({
            data: { session: mockSession },
            error: null
        })

        render(<LoginPage />)

        await waitFor(() => {
            expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard')
        })
    })
})
