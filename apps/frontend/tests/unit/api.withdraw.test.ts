/**
 * Unit tests for withdraw API function
 * Tests withdraw() function with mocked fetch and sessionStorage
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { withdraw, type WithdrawResponse } from '../../app/lib/api';

const originalFetch = global.fetch;
const originalSessionStorage = global.sessionStorage;

describe('withdraw API function', () => {
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

  describe('Happy path - successful withdraw', () => {
    test('should successfully withdraw valid amount', async () => {
      const mockToken = 'test-token-123';
      const mockResponse: WithdrawResponse = {
        origin: {
          id: 'account-123',
          balance: 50.0,
        },
      };

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify(mockResponse), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const result = await withdraw(100.5);

      expect(result).toEqual(mockResponse);
      expect(result.origin.id).toBe('account-123');
      expect(result.origin.balance).toBe(50.0);
    });

    test('should send correct request body', async () => {
      const mockToken = 'test-token-123';
      let capturedBody: any = null;

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async (url, options) => {
        if (options?.body) {
          capturedBody = JSON.parse(options.body as string);
        }
        return new Response(
          JSON.stringify({
            origin: { id: 'account-123', balance: 50.0 },
          }),
          { status: 201 }
        );
      };

      await withdraw(100.5);

      expect(capturedBody).toEqual({
        type: 'withdraw',
        amount: 100.5,
      });
    });

    test('should send Authorization header with token', async () => {
      const mockToken = 'test-token-123';
      let capturedHeaders: HeadersInit | undefined;

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async (url, options) => {
        capturedHeaders = options?.headers as HeadersInit;
        return new Response(
          JSON.stringify({
            origin: { id: 'account-123', balance: 50.0 },
          }),
          { status: 201 }
        );
      };

      await withdraw(100.5);

      expect(capturedHeaders).toBeDefined();
      const headers = capturedHeaders as Record<string, string>;
      expect(headers['Authorization']).toBe(`Bearer ${mockToken}`);
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Error cases - authentication', () => {
    test('should throw error when token is not found', async () => {
      mockSessionStorage.getItem = () => null;

      await expect(withdraw(100)).rejects.toThrow(
        'Token de autenticação não encontrado'
      );
    });

    test('should throw error when token is empty string', async () => {
      mockSessionStorage.getItem = () => '';

      await expect(withdraw(100)).rejects.toThrow(
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

      await expect(withdraw(100)).rejects.toThrow('Não autenticado');
    });

    test('should throw error on 403 Forbidden', async () => {
      const mockToken = 'forbidden-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
        });
      };

      await expect(withdraw(100)).rejects.toThrow('Não autenticado');
    });
  });

  describe('Error cases - insufficient funds', () => {
    test('should throw error on 400 Bad Request with insufficient funds message', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify({ error: 'Insufficient funds' }), {
          status: 400,
        });
      };

      await expect(withdraw(100)).rejects.toThrow(
        'Saldo insuficiente para saque'
      );
    });

    test('should throw error on 400 Bad Request with saldo insuficiente message', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify({ error: 'Saldo insuficiente' }), {
          status: 400,
        });
      };

      await expect(withdraw(100)).rejects.toThrow(
        'Saldo insuficiente para saque'
      );
    });

    test('should throw generic error on 400 Bad Request with other error message', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify({ error: 'Invalid amount' }), {
          status: 400,
        });
      };

      await expect(withdraw(100)).rejects.toThrow('Invalid amount');
    });

    test('should throw generic error when 400 response is not JSON', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response('Bad Request', { status: 400 });
      };

      await expect(withdraw(100)).rejects.toThrow('Erro na requisição');
    });
  });

  describe('Error cases - server errors', () => {
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

      await expect(withdraw(100)).rejects.toThrow('Internal Server Error');
    });

    test('should throw generic error when error response is not JSON', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response('Internal Server Error', { status: 500 });
      };

      await expect(withdraw(100)).rejects.toThrow('Erro ao realizar saque');
    });

    test('should throw error when response structure is invalid', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify({ invalid: 'response' }), {
          status: 201,
        });
      };

      await expect(withdraw(100)).rejects.toThrow(
        'Resposta inválida do servidor'
      );
    });

    test('should throw error when origin data is invalid', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify({ origin: { id: '123' } }), {
          status: 201,
        });
      };

      await expect(withdraw(100)).rejects.toThrow(
        'Dados de resposta inválidos'
      );
    });

    test('should throw error when origin balance is not a number', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(
          JSON.stringify({
            origin: { id: 'account-123', balance: 'invalid' },
          }),
          { status: 201 }
        );
      };

      await expect(withdraw(100)).rejects.toThrow(
        'Dados de resposta inválidos'
      );
    });

    test('should throw error when origin id is missing', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        return new Response(JSON.stringify({ origin: { balance: 100 } }), {
          status: 201,
        });
      };

      await expect(withdraw(100)).rejects.toThrow(
        'Dados de resposta inválidos'
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

      await expect(withdraw(100)).rejects.toThrow('Requisição expirou');
    });

    test('should handle network connection errors', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        throw new TypeError('Failed to fetch');
      };

      await expect(withdraw(100)).rejects.toThrow('Erro de conexão');
    });

    test('should handle generic fetch errors', async () => {
      const mockToken = 'test-token';

      mockSessionStorage.getItem = () => mockToken;

      global.fetch = async () => {
        throw new Error('Network error');
      };

      await expect(withdraw(100)).rejects.toThrow('Network error');
    });
  });
});
