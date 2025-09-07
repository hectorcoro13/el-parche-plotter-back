import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ExcludepasswordInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => this.exludePassword(data)));
  }
  private exludePassword(data: any): unknown {
    if (!data) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((element) => this.exludePassword(element));
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = data;
    return rest;
  }
}
