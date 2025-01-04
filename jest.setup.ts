import "@testing-library/jest-dom";
import React from "react";

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string): R;
    }
  }
}

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockImplementation((callback) => ({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
  root: null,
  rootMargin: "",
  thresholds: [],
  takeRecords: () => [],
}));
window.IntersectionObserver = mockIntersectionObserver;

// Increase default timeout for async tests
jest.setTimeout(30000);

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: "/",
      route: "/",
      query: {},
      asPath: "/",
    };
  },
  usePathname() {
    return "/";
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  useParams() {
    return {};
  },
}));

// Mock next/link
jest.mock("next/link", () => {
  const Link = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: any;
  }) => {
    return React.createElement("a", props, children);
  };
  return Link;
});

// Mock Supabase client
jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createClientComponentClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "123", email: "test@example.com" } },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: "123", email: "test@example.com" },
          },
        },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: "123", email: "test@example.com" } },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: () => ({
      select: jest.fn().mockResolvedValue({
        data: [
          { id: 1, title: "Test Card 1", content: "Test Content 1" },
          { id: 2, title: "Test Card 2", content: "Test Content 2" },
        ],
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));
