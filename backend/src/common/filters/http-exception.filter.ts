import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Some library errors (e.g. body-parser PayloadTooLargeError, malformed JSON) carry a
    // numeric status but aren't HttpExceptions — surface them honestly instead of a 500.
    const libStatus =
      (exception as { status?: number; statusCode?: number })?.status ??
      (exception as { statusCode?: number })?.statusCode;
    const libMessage = (exception as { message?: string })?.message;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : typeof libStatus === 'number'
          ? libStatus
          : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException
        ? exception.getResponse()
        : typeof libStatus === 'number' && libMessage
          ? libMessage
          : 'Internal server error';

    const { message, error } =
      typeof payload === 'string'
        ? { message: payload, error: HttpStatus[status] }
        : (payload as { message: string | string[]; error?: string });

    response.status(status).json({
      statusCode: status,
      error: error ?? HttpStatus[status],
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
