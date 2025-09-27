import express from 'express';
import { z } from 'zod';

import {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuoteStatus,
  deleteQuote,
  quoteSchema,
} from '../../services/quotesService.js';
import { requireAuthApi } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router = express.Router();

const quoteStatusSchema = z.object({
  status: z.enum(['pending', 'validated', 'archived']),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

router.get('/', requireAuthApi, (req, res) => {
  const { status } = req.query;
  if (typeof status === 'string' && ['pending', 'validated', 'archived'].includes(status)) {
    res.json(getQuotes({ status }));
    return;
  }
  res.json(getQuotes());
});

router.get('/:id', requireAuthApi, (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const quote = getQuoteById(id);
  if (!quote) {
    res.status(404).json({ error: 'Demande introuvable' });
    return;
  }
  res.json(quote);
});

router.post('/', validateBody(quoteSchema), (req, res, next) => {
  try {
    const quote = createQuote(req.validatedBody);
    res.status(201).json(quote);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuthApi, validateBody(quoteStatusSchema), (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const updated = updateQuoteStatus(id, req.validatedBody.status);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuthApi, (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const existing = getQuoteById(id);
    if (!existing) {
      res.status(404).json({ error: 'Demande introuvable' });
      return;
    }
    deleteQuote(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
