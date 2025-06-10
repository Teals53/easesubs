import { createTRPCRouter } from "@/server/api/trpc";
import { authRouter } from "@/server/api/routers/auth";
import { productRouter } from "@/server/api/routers/product";
import { cartRouter } from "@/server/api/routers/cart";
import { orderRouter } from "@/server/api/routers/order";
import { userRouter } from "@/server/api/routers/user";
import { adminRouter } from "@/server/api/routers/admin";
import { paymentRouter } from "@/server/api/routers/payment";
import { ticketRouter } from "@/server/api/routers/ticket";
import { reviewRouter } from "@/server/api/routers/review";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  product: productRouter,
  cart: cartRouter,
  order: orderRouter,
  user: userRouter,
  admin: adminRouter,
  payment: paymentRouter,
  ticket: ticketRouter,
  review: reviewRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
