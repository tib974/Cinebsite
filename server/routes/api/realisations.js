import { Router } from 'express';

import { listRealisations, getRealisationBySlug } from '../../services/realisationsService.js';

const router = Router();

router.get('/', (_req, res, next) => {
  try {
    const items = listRealisations();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get('/slug/:slug', (req, res, next) => {
  try {
    const { slug } = req.params;
    const item = getRealisationBySlug(slug);
    if (!item) {
      res.status(404).json({ error: 'Realisation not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

export default router;
