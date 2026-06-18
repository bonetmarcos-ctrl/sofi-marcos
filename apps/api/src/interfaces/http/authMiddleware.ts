export const createRequireAuth = (authService) => (request, response, next) => {
  const token = request.cookies?.[authService.cookieName];
  const user = authService.verifyToken(token);

  if (!user) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  request.user = user;
  next();
};