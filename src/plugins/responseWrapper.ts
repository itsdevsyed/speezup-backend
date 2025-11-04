// apps/backend/src/plugins/responseWrapper.ts
import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";

async function responseWrapper(fastify: FastifyInstance) {
  fastify.decorateReply("success", function (
    data: any,
    message: string = "Success",
    meta: any = {}
  ) {
    this.code(200).send({
      success: true,
      message,
      data,
      meta,
    });
  });

  fastify.decorateReply("fail", function (
    code: string,
    message: string,
    statusCode: number = 400
  ) {
    this.code(statusCode).send({
      success: false,
      error: { code, message },
    });
  });
}

// ✅ Proper default export
export default fp(responseWrapper);

// ✅ Extend Fastify types
declare module "fastify" {
  interface FastifyReply {
    success: (data: any, message?: string, meta?: any) => void;
    fail: (code: string, message: string, statusCode?: number) => void;
  }
}
