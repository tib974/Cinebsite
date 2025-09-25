import express from 'express';

import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/productsService.js';
import {
  getAllPacks,
  getPackById,
  createPack,
  updatePack,
  deletePack,
  setPackItems,
} from '../services/packsService.js';
import {
  listQuotes,
  getQuoteById,
  updateQuote,
  updateQuoteStatus,
  deleteQuote,
  setQuoteItems,
} from '../services/quotesService.js';
import { getAvailabilityCalendar } from '../services/availabilityService.js';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const [products, packs, quotes] = [getAllProducts(), getAllPacks(), listQuotes({ status: 'pending' })];
    res.render('dashboard', {
      activePage: 'dashboard',
      stats: {
        productCount: products.length,
        packCount: packs.length,
        pendingQuotes: quotes.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/products', (_req, res, next) => {
  try {
    const products = getAllProducts();
    res.render('products', { activePage: 'products', products });
  } catch (error) {
    next(error);
  }
});

router.get('/products/:id', (req, res, next) => {
  try {
    const product = getProductById(Number(req.params.id));
    if (!product) {
      return res.redirect('/admin/products');
    }
    res.render('product-detail', { activePage: 'products', product });
  } catch (error) {
    next(error);
  }
});

router.get('/packs', (_req, res, next) => {
  try {
    const packs = getAllPacks();
    const products = getAllProducts();
    res.render('packs', { activePage: 'packs', packs, products });
  } catch (error) {
    next(error);
  }
});

router.get('/packs/:id', (req, res, next) => {
  try {
    const pack = getPackById(Number(req.params.id));
    if (!pack) {
      return res.redirect('/admin/packs');
    }
    const products = getAllProducts();
    res.render('pack-detail', { activePage: 'packs', pack, products });
  } catch (error) {
    next(error);
  }
});

router.get('/quotes', (_req, res, next) => {
  try {
    const quotes = listQuotes();
    res.render('quotes', { activePage: 'quotes', quotes });
  } catch (error) {
    next(error);
  }
});

router.get('/quotes/:id', (req, res, next) => {
  try {
    const quote = getQuoteById(Number(req.params.id));
    if (!quote) {
      return res.redirect('/admin/quotes');
    }
    const availability = getAvailabilityCalendar({ start: quote.startDate, end: quote.endDate });
    res.render('quote-detail', { activePage: 'quotes', quote, availability });
  } catch (error) {
    next(error);
  }
});

// Actions via formulaires (POST)
router.post('/products', (req, res, next) => {
  try {
    const { name, slug, description, dailyPrice, imageUrl, stock } = req.body;
    createProduct({ name, slug, description, dailyPrice: Number(dailyPrice || 0), imageUrl, stock: Number(stock || 0) });
    res.redirect('/admin/products');
  } catch (error) {
    next(error);
  }
});

router.post('/products/:id', (req, res, next) => {
  try {
    const { name, slug, description, dailyPrice, imageUrl, stock } = req.body;
    updateProduct(Number(req.params.id), {
      name,
      slug,
      description,
      dailyPrice: Number(dailyPrice || 0),
      imageUrl,
      stock: Number(stock || 0),
    });
    res.redirect('/admin/products');
  } catch (error) {
    next(error);
  }
});

router.post('/products/:id/delete', (req, res, next) => {
  try {
    deleteProduct(Number(req.params.id));
    res.redirect('/admin/products');
  } catch (error) {
    next(error);
  }
});

router.post('/packs', (req, res, next) => {
  try {
    const { name, slug, description, dailyPrice, imageUrl } = req.body;
    createPack({ name, slug, description, dailyPrice: Number(dailyPrice || 0), imageUrl });
    res.redirect('/admin/packs');
  } catch (error) {
    next(error);
  }
});

router.post('/packs/:id', (req, res, next) => {
  try {
    const { name, slug, description, dailyPrice, imageUrl } = req.body;
    updatePack(Number(req.params.id), {
      name,
      slug,
      description,
      dailyPrice: Number(dailyPrice || 0),
      imageUrl,
    });

    const items = Array.isArray(req.body.itemProductId)
      ? req.body.itemProductId.map((productId, index) => ({
          productId: Number(productId),
          quantity: Number(req.body.itemQuantity[index] || 1),
        }))
      : [];
    setPackItems(Number(req.params.id), items.filter((item) => item.productId));

    res.redirect('/admin/packs');
  } catch (error) {
    next(error);
  }
});

router.post('/packs/:id/delete', (req, res, next) => {
  try {
    deletePack(Number(req.params.id));
    res.redirect('/admin/packs');
  } catch (error) {
    next(error);
  }
});

router.post('/quotes/:id', (req, res, next) => {
  try {
    const { customerName, email, phone, startDate, endDate, status, total, notes } = req.body;
    updateQuote(Number(req.params.id), {
      customerName,
      email,
      phone,
      startDate,
      endDate,
      status,
      total: Number(total || 0),
      notes,
    });

    if (Array.isArray(req.body.itemName)) {
      const items = req.body.itemName.map((name, index) => ({
        name,
        itemType: req.body.itemType[index],
        itemId: Number(req.body.itemId[index] || 0),
        quantity: Number(req.body.itemQuantity[index] || 1),
        unitPrice: Number(req.body.itemUnitPrice[index] || 0),
      }));
      setQuoteItems(Number(req.params.id), items);
    }

    res.redirect(`/admin/quotes/${req.params.id}`);
  } catch (error) {
    next(error);
  }
});

router.post('/quotes/:id/status', (req, res, next) => {
  try {
    updateQuoteStatus(Number(req.params.id), req.body.status);
    res.redirect('/admin/quotes');
  } catch (error) {
    next(error);
  }
});

router.post('/quotes/:id/delete', (req, res, next) => {
  try {
    deleteQuote(Number(req.params.id));
    res.redirect('/admin/quotes');
  } catch (error) {
    next(error);
  }
});

export default router;
