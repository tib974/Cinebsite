import express from 'express';
import { z } from 'zod';

import {
  getAllPacks,
  getPackById,
  getPackBySlug,
  createPack,
  updatePack,
  deletePack,
  setPackItems,
} from '../../services/packsService.js';
import { getAllProducts } from '../../services/productsService.js';
import { requireAuthApi } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router = express.Router();

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const packSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  dailyPrice: z.coerce.number().min(0).default(0),
  imageUrl: z.string().url().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1).default(1),
      })
    )
    .optional()
    .default([]),
});

router.get('/', (_req, res) => {
  res.json(getAllPacks());
});

router.get('/slug/:slug', (req, res) => {
  const pack = getPackBySlug(req.params.slug);
  if (!pack) {
    res.status(404).json({ error: 'Pack introuvable' });
    return;
  }
  res.json(pack);
});

router.get('/:id', (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const pack = getPackById(id);
  if (!pack) {
    res.status(404).json({ error: 'Pack introuvable' });
    return;
  }
  res.json(pack);
});

router.post('/', requireAuthApi, validateBody(packSchema), (req, res) => {
  const data = req.validatedBody;
  const pack = createPack({
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    dailyPrice: data.dailyPrice,
    imageUrl: data.imageUrl ?? null,
  });
  if (data.items.length > 0) {
    setPackItems(pack.id, data.items.map((item) => ({ ...item, productId: Number(item.productId) })));
  }
  res.status(201).json(getPackById(pack.id));
});

router.put('/:id', requireAuthApi, validateBody(packSchema), (req, res) => {
  const existing = getPackById(Number(req.params.id));
  if (!existing) {
    res.status(404).json({ error: 'Pack introuvable' });
    return;
  }
  const data = req.validatedBody;
  const pack = updatePack(Number(req.params.id), {
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    dailyPrice: data.dailyPrice,
    imageUrl: data.imageUrl ?? null,
  });
  setPackItems(pack.id, data.items.map((item) => ({ ...item, productId: Number(item.productId) })));
  res.json(getPackById(pack.id));
});

router.delete('/:id', requireAuthApi, (req, res) => {
  const existing = getPackById(Number(req.params.id));
  if (!existing) {
    res.status(404).json({ error: 'Pack introuvable' });
    return;
  }
  deletePack(Number(req.params.id));
  res.status(204).send();
});

router.get('/:id/items/options', requireAuthApi, (_req, res) => {
  res.json(getAllProducts());
});

export default router;
