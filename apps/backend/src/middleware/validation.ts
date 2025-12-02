import { ZodError, loginSchema } from '@lw-financial/shared';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function validateLogin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> {
  try {
    const body = request.body as unknown;

    // Verificar se o corpo está vazio ou não existe
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      reply.status(400).send({
        error: 'Request body is required',
      });
      return false;
    }

    loginSchema.parse(body);
    return true;
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      // Filtrar mensagens duplicadas e melhorar formatação
      const errorMessages = error.errors
        .map((err) => {
          const path = err.path.join('.');
          return path ? `${path}: ${err.message}` : err.message;
        })
        .filter(
          (msg: string, index: number, self: string[]) =>
            self.indexOf(msg) === index
        );

      const errorMessage =
        errorMessages.length > 0
          ? errorMessages.join(', ')
          : 'Invalid request format';

      reply.status(400).send({
        error: errorMessage,
      });
    } else {
      reply.status(400).send({
        error:
          error instanceof Error ? error.message : 'Invalid request format',
      });
    }
    return false;
  }
}
