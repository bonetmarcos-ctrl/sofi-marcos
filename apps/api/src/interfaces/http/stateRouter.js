import { Router } from "express";

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

export const createStateRouter = (stateService, requireAuth) => {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({ ok: true, service: "sofi-marqui-api" });
  });

  router.use(requireAuth);

  router.get("/state", asyncRoute(async (_request, response) => {
    response.json(await stateService.getState());
  }));

  router.put("/state", asyncRoute(async (request, response) => {
    response.json(await stateService.replaceState(request.body));
  }));

  router.post("/state/reset", asyncRoute(async (_request, response) => {
    response.json(await stateService.resetState());
  }));

  router.get("/:collection", asyncRoute(async (request, response) => {
    response.json(await stateService.list(request.params.collection));
  }));

  router.post("/:collection", asyncRoute(async (request, response) => {
    const item = await stateService.create(request.params.collection, request.body);
    response.status(201).json(item);
  }));

  router.put("/:collection/:id", asyncRoute(async (request, response) => {
    response.json(await stateService.update(request.params.collection, request.params.id, request.body));
  }));

  router.delete("/:collection/:id", asyncRoute(async (request, response) => {
    response.json(await stateService.remove(request.params.collection, request.params.id));
  }));

  return router;
};