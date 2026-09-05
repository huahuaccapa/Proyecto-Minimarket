import { Router } from "express";

import { randomUUID } from "node:crypto";

import { persistStore, store } from "../../data/store.js";

import { requireRole } from "../../middlewares/auth.js";

import { HttpError, required, response } from "../../utils/http.js";

const router = Router();

const config = {
  categories: {
    collection: "categories",

    singular: "categoría",
  },

  brands: {
    collection: "brands",

    singular: "marca",
  },
};

for (const [path, options] of Object.entries(config)) {
  router.get(`/${path}`, (req, res) => {
    response(res, store[options.collection]);
  });

  router.post(`/${path}`, requireRole("Administrador"), (req, res) => {
    required(req.body, ["name"]);

    const name = String(req.body.name).trim();

    if (
      store[options.collection].some(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      throw new HttpError(409, `La ${options.singular} ya existe`);
    }

    const item = {
      id: randomUUID(),

      name,

      description: String(req.body.description || "").trim(),

      active: req.body.active ?? true,

      createdAt: new Date().toISOString(),
    };

    store[options.collection].unshift(item);

    persistStore();

    response(
      res,
      item,
      `${options.singular[0].toUpperCase()}${options.singular.slice(1)} creada`,
      201,
    );
  });

  router.put(`/${path}/:id`, requireRole("Administrador"), (req, res) => {
    const index = store[options.collection].findIndex(
      (item) => item.id === req.params.id,
    );

    if (index === -1) {
      throw new HttpError(404, `${options.singular} no encontrada`);
    }

    const name = String(
      req.body.name ?? store[options.collection][index].name,
    ).trim();

    if (
      store[options.collection].some(
        (item, position) =>
          position !== index && item.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      throw new HttpError(409, `La ${options.singular} ya existe`);
    }

    store[options.collection][index] = {
      ...store[options.collection][index],

      ...req.body,

      name,

      updatedAt: new Date().toISOString(),
    };

    persistStore();

    response(
      res,
      store[options.collection][index],
      `${options.singular} actualizada`,
    );
  });
}

export default router;
