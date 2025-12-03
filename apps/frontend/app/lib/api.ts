/**
 * API client for backend endpoints
 * Handles authentication and balance requests
 */

// Validate API URL to prevent injection attacks
// Backend runs on port 3001 by default (see apps/backend/src/index.ts)
const API_BASE_URL = (() => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3333';
  try {
    const urlObj = new URL(url);
    // Only allow http/https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
    return url;
  } catch {
    if (import.meta.env.DEV) {
      console.warn('Invalid API URL, using default:', url);
    }
    return 'http://localhost:3333';
  }
})();

/**
 * Default timeout for API requests (10 seconds)
 */
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Creates a fetch request with timeout support
 * @param url - Request URL
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 10000ms)
 * @returns Promise that resolves to Response or rejects with timeout error
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'Requisição expirou. Verifique sua conexão e tente novamente.'
      );
    }
    // Re-throw network errors with user-friendly message
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Erro de conexão. Verifique sua internet e tente novamente.'
      );
    }
    throw error;
  }
}

export interface LoginRequest {
  username: string;
  pass: string;
}

export interface LoginResponse {
  token: string;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}

/**
 * Performs login request to backend
 * Includes timeout and network error handling
 */
export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/v1/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          pass: password,
        } as LoginRequest),
      },
      DEFAULT_TIMEOUT_MS
    );

    if (!response.ok) {
      const error: ErrorResponse = await response.json().catch(() => ({
        error: 'Erro ao fazer login',
      }));
      throw new Error(error.error || 'Erro ao fazer login');
    }

    return response.json() as Promise<LoginResponse>;
  } catch (error) {
    // Re-throw with user-friendly message if it's already an Error
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for unexpected errors
    throw new Error('Erro ao fazer login. Tente novamente.');
  }
}

/**
 * Fetches account balance from backend
 * The account ID is extracted from the JWT token on the backend, not from parameters.
 * The accountId parameter is kept for API compatibility but is not used.
 *
 * @param accountId - Unused parameter (kept for API compatibility)
 * @returns Account balance as a number
 */
export async function getBalance(_accountId: string): Promise<number> {
  const token = sessionStorage.getItem('auth_token');

  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/v1/balance`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      DEFAULT_TIMEOUT_MS
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Não autenticado');
      }

      if (response.status === 404) {
        // Account not found returns 0
        return 0;
      }

      const error: ErrorResponse = await response.json().catch(() => ({
        error: 'Erro ao buscar saldo',
      }));
      throw new Error(error.error || 'Erro ao buscar saldo');
    }

    const balance = await response.json();
    return typeof balance === 'number' ? balance : 0;
  } catch (error) {
    // Re-throw with user-friendly message if it's already an Error
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for unexpected errors
    throw new Error('Erro ao buscar saldo. Tente novamente.');
  }
}

export interface DepositResponse {
  destination: {
    id: string;
    balance: number;
  };
}

export interface WithdrawResponse {
  origin: {
    id: string;
    balance: number;
  };
}

/**
 * Performs deposit request to backend
 * The account is automatically identified from the JWT token
 * @param amount - Deposit amount (0.01 to 999999.99)
 * @returns Deposit response with account ID and new balance
 */
export async function deposit(amount: number): Promise<DepositResponse> {
  const token = sessionStorage.getItem('auth_token');

  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/v1/event`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'deposit',
          amount,
        }),
      },
      DEFAULT_TIMEOUT_MS
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Não autenticado');
      }

      const error: ErrorResponse = await response.json().catch(() => ({
        error: 'Erro ao realizar depósito',
      }));
      throw new Error(error.error || 'Erro ao realizar depósito');
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object' || !data.destination) {
      throw new Error('Resposta inválida do servidor');
    }

    if (typeof data.destination.balance !== 'number' || !data.destination.id) {
      throw new Error('Dados de resposta inválidos');
    }

    return data as DepositResponse;
  } catch (error) {
    // Re-throw with user-friendly message if it's already an Error
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for unexpected errors
    throw new Error('Erro ao realizar depósito. Tente novamente.');
  }
}
