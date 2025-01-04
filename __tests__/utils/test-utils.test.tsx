import React from 'react'
import { render } from './test-utils'

describe('Custom render', () => {
    it('renders children correctly', () => {
        const TestComponent = () => <div data-testid="test">Test Content</div>
        const { getByTestId } = render(<TestComponent />)
        expect(getByTestId('test')).toBeInTheDocument()
        expect(getByTestId('test')).toHaveTextContent('Test Content')
    })
})
