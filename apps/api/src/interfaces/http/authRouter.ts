import { Router } from "express";

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

const createCookieOptions = (authService) => ({
  httpOnly: true,
  maxAge: authService.sessionTtlSeconds * 1000,
  path: "/",
  sameSite: "lax",
  secure: authService.cookieSecure,
});

export const createAuthRouter = (authService, stateService) => {
  const router = Router();

  router.get("/me", (request, response) => {
    const user = authService.verifyToken(request.cookies?.[authService.cookieName]);
    if (!user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    response.json({ user });
  });

  router.post("/login", asyncRoute(async (request, response) => {
    const { token, user } = await authService.login(request.body || {});
    response.cookie(authService.cookieName, token, createCookieOptions(authService));
    response.json({ user });
  }));

  router.post("/register", asyncRoute(async (request, response) => {
    const { token, user } = await authService.register(request.body || {});
    await stateService.createProfileState(user.username);
    response.cookie(authService.cookieName, token, createCookieOptions(authService));
    response.status(201).json({ user });
  }));

  router.post("/logout", (_request, response) => {
    response.clearCookie(authService.cookieName, { path: "/" });
    response.status(204).end();
  });

  return router;
};