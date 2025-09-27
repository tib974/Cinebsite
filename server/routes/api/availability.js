import express from 'express';
import { z } from 'zod';

import {
  getAvailability,
  updateAvailability,
} from '../../services/availabilityService.js';
import { requireAuthApi } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';

const router = express.Router();

const availabilityQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Format AAAA-MM-JJ'),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Format AAAA-MM-JJ'),
});

const availabilityUpdateSchema = z.object({
  productId: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'Format AAAA-MM-JJ'),
  qty: z.coerce.number().int().min(0),
});

router.get('/', validateQuery(availabilityQuerySchema), (req, res, next) => {
  try {
    const { start, end } = req.validatedQuery;
    const availability = getAvailability(start, end);
    res.json({ availability });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/',
  requireAuthApi,
  validateBody(availabilityUpdateSchema),
  (req, res, next) => {
    try {
      const { productId, date, qty } = req.validatedBody;
      const result = updateAvailability(productId, date, qty);
      res.json({
        productId: result.productId,
        productName: result.productName,
        date: result.date,
        stock: result.stock,
        reservedQuantity: result.reservedQuantity,
        reservedFromQuotes: result.reservedFromQuotes,
        manualReservedQuantity: result.manualReservedQuantity,
        availableQuantity: result.availableQuantity,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
