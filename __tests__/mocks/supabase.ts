import { jest } from "@jest/globals";
import { createClient } from "@supabase/supabase-js";
import { AuthError, AuthResponse, Session, User } from "@supabase/supabase-js";

// Mock response type
export type MockResponse<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: {
        message: string;
        status?: number;
      };
    };

type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
};

type GetSessionResponse = Promise<{
  data: { session: AuthSession | null };
  error: null;
}>;

type SignInResponse = Promise<{
  data: { user: User | null; session: AuthSession | null };
  error: AuthError | null;
}>;

type SignOutResponse = Promise<{
  error: AuthError | null;
}>;

// Create a mock Supabase client
export const mockSupabase = {
  auth: {
    getSession: jest.fn<() => GetSessionResponse>().mockImplementation(() =>
      Promise.resolve({
        data: { session: null },
        error: null,
      })
    ),

    signInWithPassword: jest
      .fn<
        (credentials: { email: string; password: string }) => SignInResponse
      >()
      .mockImplementation(() =>
        Promise.resolve({
          data: {
            user: null,
            session: null,
          },
          error: null,
        })
      ),

    signOut: jest.fn<() => SignOutResponse>().mockImplementation(() =>
      Promise.resolve({
        error: null,
      })
    ),

    onAuthStateChange: jest.fn(),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: {
          id: "123",
          email: "test@example.com",
          role: "doctor",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      })
    ),
    insert: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        data,
        error: null,
      })
    ),
    upsert: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        data,
        error: null,
      })
    ),
    update: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        data,
        error: null,
      })
    ),
    delete: jest.fn().mockImplementation(() =>
      Promise.resolve({
        data: null,
        error: null,
      })
    ),
  }),
};

// Mock the createClient function
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => mockSupabase),
}));
