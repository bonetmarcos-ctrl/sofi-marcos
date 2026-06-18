export const notFoundMiddleware = (_request, response) => {
  response.status(404).json({ error: "Not found" });
};

export const errorMiddleware = (error, _request, response, _next) => {
  const statusCode = error.statusCode || 500;
  response.status(statusCode).json({
    error: error.message || "Unexpected error",
    details: error.details,
  });
};