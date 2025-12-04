/**
 * Unit tests for getTransactions API function
 * Tests getTransactions() function with mocked fetch and sessionStorage
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  getTransactions,
  type Transaction,
  type TransactionsResponse,
} from '../../app/lib/api';

const originalFetch = global.fetch;
const originalSessionStorage = global.sessionStorage;

describe('getTransactions API function', () => {
  let mockSessionStorage: Storage;

  beforeEach(() => {
    mockSessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;

    Object.defineProperty(global, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });

    global.fetch = (() => {}) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Object.defineProperty(global, 'sessionStorage', {
      value: originalSessionStorage,
      writable: true,
    });
  });

  describe('Happy path - successful transactions fetch', () => {
    test('should successfully fetch transactions', async () => {
      const mockToken = 'test-token-123';
      const mockTransactions: TransactionsResponse = [
        {
          id: 'tx-123',
          type: 'DEPOSIT',
          amount: '100.50',
          originAccountId: null,
          destinationAccountId: 'account-123',
          userId: 'user-123',
          createdAt: '2025-12-03T14:30:00.000Z',
        },
        {
          id: 'tx-456',
          type: 'WITHDRAW',
          amount: '50.00',
          originAccountId: 'account-123',
          destinationAccountId: null,
          userId: 'user-123',
          createdAt: '2025-12-03T10:15:00.000Z',
        },
      ];

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify(mockTransactions), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const result = await getTransactions();

      expect(result).toEqual(mockTransactions);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('tx-123');
      expect(result[0].type).toBe('DEPOSIT');
    });

    test('should return empty array when no transactions', async () => {
      const mockToken = 'test-token-123';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const result = await getTransactions();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    test('should handle multiple transactions correctly', async () => {
      const mockToken = 'test-token-123';
      const mockTransactions: TransactionsResponse = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `tx-${i}`,
          type: i % 2 === 0 ? 'DEPOSIT' : 'WITHDRAW',
          amount: `${(i + 1) * 10}.00`,
          originAccountId: i % 2 === 0 ? null : 'account-123',
          destinationAccountId: i % 2 === 0 ? 'account-123' : null,
          userId: 'user-123',
          createdAt: new Date(2025, 11, 3, 10 - i, 0).toISOString(),
        })
      );

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify(mockTransactions), {
          status: 200,
        });
      };

      const result = await getTransactions();

      expect(result).toHaveLength(10);
      expect(result[0].type).toBe('DEPOSIT');
      expect(result[1].type).toBe('WITHDRAW');
    });

    test('should send Authorization header with token', async () => {
      const mockToken = 'test-token-123';
      let capturedHeaders: HeadersInit | undefined;

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async (url, options) => {
        capturedHeaders = options?.headers as HeadersInit;
        return new Response(JSON.stringify([]), { status: 200 });
      };

      await getTransactions();

      expect(capturedHeaders).toBeDefined();
      const headers = capturedHeaders as Record<string, string>;
      expect(headers['Authorization']).toBe(`Bearer ${mockToken}`);
      expect(headers['Content-Type']).toBe('application/json');
    });

    test('should call correct endpoint URL', async () => {
      const mockToken = 'test-token-123';
      let capturedUrl: string | null = null;

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async (url, _options) => {
        capturedUrl = url as string;
        return new Response(JSON.stringify([]), { status: 200 });
      };

      await getTransactions();

      expect(capturedUrl).toBeTruthy();
      expect(capturedUrl).toContain('/v1/transactions');
    });
  });

  describe('Error cases - authentication', () => {
    test('should throw error when token is not found', async () => {
      mockSessionStorage.getItem = () => null;

      await expect(getTransactions()).rejects.toThrow(
        'Token de autenticação não encontrado'
      );
    });

    test('should throw error when token is empty string', async () => {
      mockSessionStorage.getItem = () => '';

      await expect(getTransactions()).rejects.toThrow(
        'Token de autenticação não encontrado'
      );
    });

    test('should throw error on 401 Unauthorized', async () => {
      const mockToken = 'invalid-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
        });
      };

      await expect(getTransactions()).rejects.toThrow('Não autenticado');
    });

    test('should throw error on 403 Forbidden', async () => {
      const mockToken = 'forbidden-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
        });
      };

      await expect(getTransactions()).rejects.toThrow('Não autenticado');
    });
  });

  describe('Error cases - server responses', () => {
    test('should return empty array on 404 Not Found', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
        });
      };

      const result = await getTransactions();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    test('should throw error on 500 Internal Server Error', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(
          JSON.stringify({ error: 'Internal Server Error' }),
          {
            status: 500,
          }
        );
      };

      await expect(getTransactions()).rejects.toThrow('Internal Server Error');
    });

    test('should throw generic error when error response is not JSON', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response('Internal Server Error', { status: 500 });
      };

      await expect(getTransactions()).rejects.toThrow(
        'Erro ao buscar histórico de transações'
      );
    });

    test('should throw error when response is not an array', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify({ transactions: [] }), {
          status: 200,
        });
      };

      await expect(getTransactions()).rejects.toThrow(
        'Resposta inválida do servidor'
      );
    });

    test('should throw error when response is null', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify(null), {
          status: 200,
        });
      };

      await expect(getTransactions()).rejects.toThrow(
        'Resposta inválida do servidor'
      );
    });

    test('should throw error when response is a string', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify('invalid'), {
          status: 200,
        });
      };

      await expect(getTransactions()).rejects.toThrow(
        'Resposta inválida do servidor'
      );
    });
  });

  describe('Error cases - network errors', () => {
    test('should handle network timeout', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        const error = new Error('AbortError');
        error.name = 'AbortError';
        throw error;
      };

      await expect(getTransactions()).rejects.toThrow('Requisição expirou');
    });

    test('should handle network connection errors', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        throw new TypeError('Failed to fetch');
      };

      await expect(getTransactions()).rejects.toThrow('Erro de conexão');
    });

    test('should handle generic fetch errors', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        throw new Error('Network error');
      };

      await expect(getTransactions()).rejects.toThrow('Network error');
    });
  });

  describe('Transaction data validation', () => {
    test('should handle transactions with all fields', async () => {
      const mockToken = 'test-token';
      const mockTransaction: Transaction = {
        id: 'tx-123',
        type: 'TRANSFER',
        amount: '100.50',
        originAccountId: 'account-1',
        destinationAccountId: 'account-2',
        userId: 'user-123',
        createdAt: '2025-12-03T14:30:00.000Z',
      };

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify([mockTransaction]), {
          status: 200,
        });
      };

      const result = await getTransactions();

      expect(result[0]).toEqual(mockTransaction);
      expect(result[0].type).toBe('TRANSFER');
      expect(result[0].originAccountId).toBe('account-1');
      expect(result[0].destinationAccountId).toBe('account-2');
    });

    test('should handle transactions with null optional fields', async () => {
      const mockToken = 'test-token';
      const mockTransaction: Transaction = {
        id: 'tx-123',
        type: 'DEPOSIT',
        amount: '100.50',
        originAccountId: null,
        destinationAccountId: null,
        userId: null,
        createdAt: '2025-12-03T14:30:00.000Z',
      };

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify([mockTransaction]), {
          status: 200,
        });
      };

      const result = await getTransactions();

      expect(result[0].originAccountId).toBeNull();
      expect(result[0].destinationAccountId).toBeNull();
      expect(result[0].userId).toBeNull();
    });

    test('should handle all transaction types correctly', async () => {
      const mockToken = 'test-token';
      const mockTransactions: TransactionsResponse = [
        {
          id: 'tx-1',
          type: 'DEPOSIT',
          amount: '100.00',
          originAccountId: null,
          destinationAccountId: 'account-1',
          userId: 'user-1',
          createdAt: '2025-12-03T14:30:00.000Z',
        },
        {
          id: 'tx-2',
          type: 'WITHDRAW',
          amount: '50.00',
          originAccountId: 'account-1',
          destinationAccountId: null,
          userId: 'user-1',
          createdAt: '2025-12-03T13:30:00.000Z',
        },
        {
          id: 'tx-3',
          type: 'TRANSFER',
          amount: '25.00',
          originAccountId: 'account-1',
          destinationAccountId: 'account-2',
          userId: 'user-1',
          createdAt: '2025-12-03T12:30:00.000Z',
        },
      ];

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify(mockTransactions), {
          status: 200,
        });
      };

      const result = await getTransactions();

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('DEPOSIT');
      expect(result[1].type).toBe('WITHDRAW');
      expect(result[2].type).toBe('TRANSFER');
    });
  });
});
