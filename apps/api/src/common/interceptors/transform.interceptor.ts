import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Envelope<T> {
  success: true;
  data: T;
  meta: { requestId: string };
}

/** Wrap every successful response in the uniform `{ success, data, meta }` envelope. */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Envelope<T>> {
    const req = context.switchToHttp().getRequest<{ id?: string }>();
    const requestId = req.id ?? randomUUID();

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        meta: { requestId },
      })),
    );
  }
}
