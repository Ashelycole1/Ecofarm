import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define routes that should be protected
const isProtectedRoute = createRouteMatcher([
  '/', // Protect the main dashboard
  '/api/(.*)', // Protect API routes
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
