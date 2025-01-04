import React from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { ToastProvider } from '@/components/ui/toast'

// Mock UI components
jest.mock('@/components/ui/card', () => ({
    Card: ({ children, className }: { children: React.ReactNode, className?: string }) => (
        <div data-testid="mocked-card" className={className}>{children}</div>
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
    CardFooter: ({ children, className }: { children: React.ReactNode, className?: string }) => (
        <div data-testid="mocked-card-footer" className={className}>{children}</div>
    ),
}))

// Mock recharts
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mocked-responsive-container">{children}</div>
    ),
    LineChart: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mocked-line-chart">{children}</div>
    ),
    Line: () => <div data-testid="mocked-line" />,
    XAxis: () => <div data-testid="mocked-xaxis" />,
    YAxis: () => <div data-testid="mocked-yaxis" />,
    CartesianGrid: () => <div data-testid="mocked-cartesian-grid" />,
    Tooltip: () => <div data-testid="mocked-tooltip" />,
}))

// Mock Overview component
jest.mock('../../components/overview', () => ({
    Overview: () => <div data-testid="mocked-overview">Mocked Overview</div>
}))

// Mock toast functionality
jest.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({
        toast: jest.fn(),
        toasts: [],
        dismiss: jest.fn(),
    }),
    toast: jest.fn(),
}))

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <ToastProvider>
            {children}
        </ToastProvider>
    )
}

const customRender = (
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => rtlRender(ui, { wrapper: AllTheProviders, ...options })

// re-export everything
export * from '@testing-library/react'
export { customRender as render }
