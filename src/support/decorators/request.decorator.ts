import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type RequestInput<Q = any, P = any, B = any> = {
  query: Q;
  params: P;
  body: B;
};

export const Request = createParamDecorator((_, ctx: ExecutionContext): RequestInput => {
  const request = ctx.switchToHttp().getRequest();

  const { query, params, body } = request;

  return { query, params, body };
});
