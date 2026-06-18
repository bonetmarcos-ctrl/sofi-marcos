import { Router } from "express";

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

export const createStateRouter = (stateService, requireAuth) => {
  const router = Router();

  const ownerId = (request) => request.user?.username;

  router.get("/health", (_request, response) => {
    response.json({ ok: true, service: "sofi-marqui-api" });
  });

  router.use(requireAuth);

  router.get("/state", asyncRoute(async (request, response) => {
    response.json(await stateService.getUserState(ownerId(request)));
  }));

  router.put("/state", asyncRoute(async (request, response) => {
    response.json(await stateService.replaceState(request.body, ownerId(request)));
  }));

  router.post("/state/reset", asyncRoute(async (request, response) => {
    response.json(await stateService.resetState(ownerId(request)));
  }));

  router.get("/:collection", asyncRoute(async (request, response) => {
    response.json(await stateService.list(request.params.collection, ownerId(request)));
  }));

  router.post("/:collection", asyncRoute(async (request, response) => {
    const item = await stateService.create(request.params.collection, request.body, ownerId(request));
    response.status(201).json(item);
  }));

  router.put("/:collection/:id", asyncRoute(async (request, response) => {
    response.json(await stateService.update(request.params.collection, request.params.id, request.body, ownerId(request)));
  }));

  router.delete("/:collection/:id", asyncRoute(async (request, response) => {
    response.json(await stateService.remove(request.params.collection, request.params.id, ownerId(request)));
  }));

  return router;
};