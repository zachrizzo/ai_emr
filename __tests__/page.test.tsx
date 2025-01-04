import { render, screen, waitFor } from './utils/test-utils'
import Page from '../app/page'

describe('Home Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders without crashing', () => {
        render(<Page />)
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('renders the main sections', async () => {
        render(<Page />)

        await waitFor(() => {
            expect(screen.getByTestId('mocked-overview')).toBeInTheDocument()
            const cards = screen.getAllByTestId('mocked-card')
            expect(cards.length).toBeGreaterThan(0)
        }, { timeout: 10000 })
    })
})
