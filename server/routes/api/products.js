import express from 'express';
import { z } from 'zod';

import {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../services/productsService.js';
import { requireAuthApi } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router = express.Router();

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  featured: z.boolean().optional().default(false),
  dailyPrice: z.coerce.number().min(0).default(0),
  imageUrl: z.string().url().optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
});

router.get('/', (req, res) => {
  const products = getAllProducts();
  const { featured, category } = req.query;

  let filtered = products;

  if (typeof featured !== 'undefined') {
    const wantFeatured = featured === '1' || featured === 'true';
    filtered = filtered.filter((product) => product.featured === wantFeatured);
  }

  if (typeof category === 'string' && category.trim().length > 0) {
    const normalized = category.trim().toLowerCase();
    filtered = filtered.filter((product) => (product.category || '').toLowerCase() === normalized);
  }

  res.json(filtered);
});

router.get('/slug/:slug', (req, res) => {
  const product = getProductBySlug(req.params.slug);
  if (!product) {
    res.status(404).json({ error: 'Produit introuvable' });
    return;
  }
  res.json(product);
});

router.get('/:id', (req, res) => {
  const product = getProductById(Number(req.params.id));
  if (!product) {
    res.status(404).json({ error: 'Produit introuvable' });
    return;
  }
  res.json(product);
});

router.post('/', requireAuthApi, validateBody(productSchema), (req, res) => {
  const data = req.validatedBody;
  const product = createProduct({
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    category: data.category ?? null,
    featured: data.featured ? 1 : 0,
    dailyPrice: data.dailyPrice,
    imageUrl: data.imageUrl ?? null,
    stock: data.stock,
  });
  res.status(201).json(product);
});

router.put('/:id', requireAuthApi, validateBody(productSchema), (req, res) => {
  const existing = getProductById(Number(req.params.id));
  if (!existing) {
    res.status(404).json({ error: 'Produit introuvable' });
    return;
  }
  const data = req.validatedBody;
  const product = updateProduct(Number(req.params.id), {
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    category: data.category ?? null,
    featured: data.featured ? 1 : 0,
    dailyPrice: data.dailyPrice,
    imageUrl: data.imageUrl ?? null,
    stock: data.stock,
  });
  res.json(product);
});

router.delete('/:id', requireAuthApi, (req, res) => {
  const existing = getProductById(Number(req.params.id));
  if (!existing) {
    res.status(404).json({ error: 'Produit introuvable' });
    return;
  }
  deleteProduct(Number(req.params.id));
  res.status(204).send();
});

export default router;
