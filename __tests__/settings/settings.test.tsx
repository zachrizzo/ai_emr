import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import SettingsPage from '@/app/settings/page'
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

describe('Settings Page', () => {
    const mockSettings = {
        notifications: {
            email: true,
            sms: false,
            desktop: true
        },
        theme: 'light',
        language: 'en',
        timezone: 'UTC'
    }

    beforeEach(() => {
        jest.clearAllMocks()

        // Mock Supabase responses
        mockSupabase.from.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                data: [mockSettings],
                error: null
            }),
            update: jest.fn().mockResolvedValue({
                data: null,
                error: null
            })
        })
    })

    it('renders settings interface', async () => {
        render(<SettingsPage />)

        await waitFor(() => {
            expect(screen.getByText('Settings')).toBeInTheDocument()
            expect(screen.getByRole('tab', { name: /notifications/i })).toBeInTheDocument()
            expect(screen.getByRole('tab', { name: /appearance/i })).toBeInTheDocument()
            expect(screen.getByRole('tab', { name: /account/i })).toBeInTheDocument()
        })
    })

    it('loads and displays user settings', async () => {
        render(<SettingsPage />)

        await waitFor(() => {
            // Check notification settings
            const emailSwitch = screen.getByLabelText(/email notifications/i)
            const smsSwitch = screen.getByLabelText(/sms notifications/i)
            const desktopSwitch = screen.getByLabelText(/desktop notifications/i)

            expect(emailSwitch).toBeChecked()
            expect(smsSwitch).not.toBeChecked()
            expect(desktopSwitch).toBeChecked()

            // Check theme setting
            expect(screen.getByLabelText(/theme/i)).toHaveValue('light')

            // Check language setting
            expect(screen.getByLabelText(/language/i)).toHaveValue('en')
        })
    })

    it('updates notification settings', async () => {
        render(<SettingsPage />)

        await waitFor(() => {
            const emailSwitch = screen.getByLabelText(/email notifications/i)
            fireEvent.click(emailSwitch)
        })

        await waitFor(() => {
            expect(mockSupabase.from).toHaveBeenCalledWith('user_settings')
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Success',
                description: expect.stringContaining('updated')
            }))
        })
    })

    it('updates theme settings', async () => {
        render(<SettingsPage />)

        await waitFor(() => {
            const themeSelect = screen.getByLabelText(/theme/i)
            fireEvent.change(themeSelect, { target: { value: 'dark' } })
        })

        await waitFor(() => {
            expect(mockSupabase.from).toHaveBeenCalledWith('user_settings')
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Success',
                description: expect.stringContaining('updated')
            }))
        })
    })

    it('updates language settings', async () => {
        render(<SettingsPage />)

        await waitFor(() => {
            const languageSelect = screen.getByLabelText(/language/i)
            fireEvent.change(languageSelect, { target: { value: 'es' } })
        })

        await waitFor(() => {
            expect(mockSupabase.from).toHaveBeenCalledWith('user_settings')
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Success',
                description: expect.stringContaining('updated')
            }))
        })
    })

    it('handles error when saving settings', async () => {
        mockSupabase.from.mockReturnValueOnce({
            update: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Failed to update settings' }
            })
        })

        render(<SettingsPage />)

        await waitFor(() => {
            const emailSwitch = screen.getByLabelText(/email notifications/i)
            fireEvent.click(emailSwitch)
        })

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Error',
                variant: 'destructive'
            }))
        })
    })

    it('switches between settings tabs', async () => {
        render(<SettingsPage />)

        // Click Appearance tab
        await waitFor(() => {
            fireEvent.click(screen.getByRole('tab', { name: /appearance/i }))
            expect(screen.getByLabelText(/theme/i)).toBeInTheDocument()
        })

        // Click Account tab
        await waitFor(() => {
            fireEvent.click(screen.getByRole('tab', { name: /account/i }))
            expect(screen.getByText(/account settings/i)).toBeInTheDocument()
        })

        // Click back to Notifications tab
        await waitFor(() => {
            fireEvent.click(screen.getByRole('tab', { name: /notifications/i }))
            expect(screen.getByLabelText(/email notifications/i)).toBeInTheDocument()
        })
    })
})
