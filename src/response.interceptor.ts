/* eslint-disable prettier/prettier */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getReasonPhrase } from 'http-status-codes';
import { instanceToPlain } from 'class-transformer';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();
    const skipDefaultResponse = this.reflector.get<boolean>(
      'skipDefaultResponse',
      context.getHandler(),
    );

    if (skipDefaultResponse) {
      return next.handle();
    }

    return next.handle().pipe(
      map((originalData: any) => {
        if (request.method === 'DELETE') {
          const statusCode: number = response.statusCode;
          return {
            code: statusCode,
            message: 'Data berhasil dihapus.',
          };
        }
        if (request.method === 'POST') {
          const statusCode: number = response.statusCode;
          return {
            code: statusCode,
            message: 'Data berhasil ditambahkan.',
            data: instanceToPlain(originalData) || null,
          };
        }
        if (request.method === 'GET') {
          const statusCode: number = response.statusCode;
          return {
            code: statusCode,
            message: 'Data berhasil diambil.',
            data: instanceToPlain(originalData) || null,
          };
        }
        if (request.method === 'PATCH') {
          const statusCode: number = response.statusCode;
          return {
            code: statusCode,
            message: 'Data berhasil diedit.',
            data: instanceToPlain(originalData) || null,
          };
        }

        if (
          originalData &&
          originalData.code &&
          originalData.message &&
          'data' in originalData
        ) {
          return originalData;
        }

        const statusCode: number = response.statusCode;
        const message: string = getReasonPhrase(statusCode);
        const data = instanceToPlain(originalData) || null;

        return {
          code: statusCode,
          message: message,
          data,
        };
      }),
    );
  }
}