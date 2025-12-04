/**
 * API client for backend endpoints
 * Handles authentication and balance requests
 */

const API_BASE_URL = (() => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3333';
  try {
    const urlObj = new URL(url);
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

export interface SignupRequest {
  username: string;
  email: string;
  name: string;
  pass: string;
}

export interface SignupResponse {
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
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao fazer login. Tente novamente.');
  }
}

/**
 * Performs signup request to backend
 * Includes timeout and network error handling
 */
export async function signup(
  username: string,
  email: string,
  name: string,
  password: string
): Promise<SignupResponse> {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/v1/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          name,
          pass: password,
        } as SignupRequest),
      },
      DEFAULT_TIMEOUT_MS
    );

    if (!response.ok) {
      const error: ErrorResponse = await response.json().catch(() => ({
        error: 'Erro ao criar conta',
      }));

      if (response.status === 409) {
        const lowerError = error.error.toLowerCase();
        if (lowerError.includes('username')) {
          throw new Error('Username já está em uso');
        }
        if (lowerError.includes('email')) {
          throw new Error('Email já está em uso');
        }
        throw new Error(error.error || 'Usuário ou email já existe');
      }

      throw new Error(error.error || 'Erro ao criar conta');
    }

    return response.json() as Promise<SignupResponse>;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao criar conta. Tente novamente.');
  }
}

/**
 * Fetches account balance from backend
 * If accountCode is provided, fetches balance for that specific account
 * Otherwise, fetches balance for the user's default account
 *
 * @param accountCode - Account code in format "XXXX-X" (optional). If not provided, returns default account balance
 * @returns Account balance as a number
 */
export async function getBalance(accountCode?: string): Promise<number> {
  const token = sessionStorage.getItem('auth_token');

  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  const url = new URL(`${API_BASE_URL}/v1/balance`);
  if (accountCode) {
    url.searchParams.set('account_code', accountCode);
  }

  try {
    const response = await fetchWithTimeout(
      url.toString(),
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
    if (error instanceof Error) {
      throw error;
    }
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

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'TRANSFER'
  | 'INITIAL_BALANCE';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  originAccountId: string | null;
  destinationAccountId: string | null;
  userId: string | null;
  createdAt: string;
}

export type TransactionsResponse = Transaction[];

/**
 * Performs deposit request to backend
 * The account can be identified by accountCode or automatically from the JWT token
 * @param amount - Deposit amount (0.01 to 999999.99)
 * @param accountCode - Optional account code in format "XXXX-X" to deposit to specific account
 * @returns Deposit response with account ID and new balance
 */
export async function deposit(
  amount: number,
  accountCode?: string
): Promise<DepositResponse> {
  const token = sessionStorage.getItem('auth_token');

  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  const body: {
    type: string;
    amount: number;
    accountCode?: string;
  } = {
    type: 'deposit',
    amount,
  };

  if (accountCode) {
    body.accountCode = accountCode;
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
        body: JSON.stringify(body),
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

    if (!data || typeof data !== 'object' || !data.destination) {
      throw new Error('Resposta inválida do servidor');
    }

    if (typeof data.destination.balance !== 'number' || !data.destination.id) {
      throw new Error('Dados de resposta inválidos');
    }

    return data as DepositResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao realizar depósito. Tente novamente.');
  }
}

/**
 * Performs withdraw request to backend
 * The account can be identified by accountCode or automatically from the JWT token
 * @param amount - Withdraw amount (0.01 to 999999.99)
 * @param accountCode - Optional account code in format "XXXX-X" to withdraw from specific account
 * @returns Withdraw response with account ID and new balance
 */
export async function withdraw(
  amount: number,
  accountCode?: string
): Promise<WithdrawResponse> {
  const token = sessionStorage.getItem('auth_token');

  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  const body: {
    type: string;
    amount: number;
    accountCode?: string;
  } = {
    type: 'withdraw',
    amount,
  };

  if (accountCode) {
    body.accountCode = accountCode;
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
        body: JSON.stringify(body),
      },
      DEFAULT_TIMEOUT_MS
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Não autenticado');
      }

      if (response.status === 400) {
        const error: ErrorResponse = await response.json().catch(() => ({
          error: 'Erro na requisição',
        }));
        const errorMessage = error.error || 'Erro na requisição';

        const lowerMessage = errorMessage.toLowerCase();
        if (
          lowerMessage.includes('insufficient funds') ||
          lowerMessage === 'saldo insuficiente' ||
          lowerMessage.includes('saldo insuficiente')
        ) {
          throw new Error('Saldo insuficiente para saque');
        }

        throw new Error(errorMessage);
      }

      const error: ErrorResponse = await response.json().catch(() => ({
        error: 'Erro ao realizar saque',
      }));
      throw new Error(error.error || 'Erro ao realizar saque');
    }

    const data = await response.json();

    if (!data || typeof data !== 'object' || !data.origin) {
      throw new Error('Resposta inválida do servidor');
    }

    if (typeof data.origin.balance !== 'number' || !data.origin.id) {
      throw new Error('Dados de resposta inválidos');
    }

    return data as WithdrawResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao realizar saque. Tente novamente.');
  }
}

/**
 * Fetches transaction history from backend
 * Returns the 20 most recent transactions for the authenticated user
 * Optionally filters by accountCode if provided
 * Transactions are automatically ordered by creation date (most recent first)
 *
 * @param accountCode - Optional account code in format "XXXX-X" to filter transactions
 * @returns Array of transactions
 */
export async function getTransactions(
  accountCode?: string
): Promise<TransactionsResponse> {
  const token = sessionStorage.getItem('auth_token');

  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  const url = new URL(`${API_BASE_URL}/v1/transactions`);
  if (accountCode) {
    url.searchParams.set('accountCode', accountCode);
  }

  try {
    const response = await fetchWithTimeout(
      url.toString(),
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
        return [];
      }

      const error: ErrorResponse = await response.json().catch(() => ({
        error: 'Erro ao buscar histórico de transações',
      }));
      throw new Error(error.error || 'Erro ao buscar histórico de transações');
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Resposta inválida do servidor');
    }

    return data as TransactionsResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao buscar histórico de transações. Tente novamente.');
  }
}

export interface AccountBalance {
  id: string;
  code: string | null;
  balance: number;
}

export type AccountsResponse = AccountBalance[];

/**
 * Fetches all bank accounts for the authenticated user
 * @returns Array of user's bank accounts
 */
export async function getAccounts(): Promise<AccountsResponse> {
  const token = sessionStorage.getItem('auth_token');

  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/v1/accounts`,
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
        return [];
      }

      const error: ErrorResponse = await response.json().catch(() => ({
        error: 'Erro ao buscar contas',
      }));
      throw new Error(error.error || 'Erro ao buscar contas');
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Resposta inválida do servidor');
    }

    return data as AccountsResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao buscar contas. Tente novamente.');
  }
}

/**
 * Creates a new bank account for the authenticated user
 * Always creates a new account, even if the user already has other accounts
 * @param initialBalance - Optional initial balance (default: 0)
 * @returns The newly created account
 */
export async function createAccount(
  initialBalance?: number
): Promise<AccountBalance> {
  const token = sessionStorage.getItem('auth_token');

  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/v1/accounts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          initialBalance: initialBalance || 0,
        }),
      },
      DEFAULT_TIMEOUT_MS
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Não autenticado');
      }

      const error: ErrorResponse = await response.json().catch(() => ({
        error: 'Erro ao criar conta',
      }));
      throw new Error(error.error || 'Erro ao criar conta');
    }

    const data = await response.json();

    if (!data || typeof data !== 'object' || !data.id) {
      throw new Error('Resposta inválida do servidor');
    }

    return data as AccountBalance;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao criar conta. Tente novamente.');
  }
}

/**
 * Fetches a bank account by its unique code
 * @param code - Account code in format "XXXX-X"
 * @returns Account information
 */
export async function getAccountByCode(code: string): Promise<AccountBalance> {
  const token = sessionStorage.getItem('auth_token');

  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/v1/accounts/${code}`,
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

      if (response.status === 400) {
        const error: ErrorResponse = await response.json().catch(() => ({
          error: 'Formato de código inválido',
        }));
        throw new Error(error.error || 'Formato de código inválido');
      }

      if (response.status === 404) {
        throw new Error('Conta não encontrada ou acesso negado');
      }

      const error: ErrorResponse = await response.json().catch(() => ({
        error: 'Erro ao buscar conta',
      }));
      throw new Error(error.error || 'Erro ao buscar conta');
    }

    const data = await response.json();

    if (!data || typeof data !== 'object' || !data.id) {
      throw new Error('Resposta inválida do servidor');
    }

    return data as AccountBalance;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao buscar conta. Tente novamente.');
  }
}
