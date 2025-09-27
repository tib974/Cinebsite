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

router.get('/', (req, res, next) => {
  try {
    const products = getAllProducts();
    const packs = getAllPacks();
    const quotes = listQuotes({ status: 'pending' });
    res.render('dashboard', {
      activePage: 'dashboard',
      title: 'Tableau de bord',
      csrfToken: res.locals.csrfToken,
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
    res.render('products', {
      activePage: 'products',
      title: 'Produits',
      csrfToken: res.locals.csrfToken,
      products,
    });
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
    res.render('product-detail', {
      activePage: 'products',
      title: `Produit · ${product.name}`,
      csrfToken: res.locals.csrfToken,
      product,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/packs', (_req, res, next) => {
  try {
    const packs = getAllPacks();
    const products = getAllProducts();
    res.render('packs', {
      activePage: 'packs',
      title: 'Packs',
      csrfToken: res.locals.csrfToken,
      packs,
      products,
    });
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
    res.render('pack-detail', {
      activePage: 'packs',
      title: `Pack · ${pack.name}`,
      csrfToken: res.locals.csrfToken,
      pack,
      products,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/quotes', (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : null;
    const allowedStatuses = ['pending', 'validated', 'archived'];
    const filterStatus = status && allowedStatuses.includes(status) ? status : null;
    const quotes = listQuotes(filterStatus ? { status: filterStatus } : undefined);
    res.render('quotes', {
      activePage: 'quotes',
      title: 'Demandes de devis',
      csrfToken: res.locals.csrfToken,
      quotes,
      query: req.query,
    });
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
    res.render('quote-detail', {
      activePage: 'quotes',
      title: `Demande · #${quote.id}`,
      csrfToken: res.locals.csrfToken,
      quote,
      availability,
    });
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

    let items = [];
    const productIds = Array.isArray(req.body.itemProductId)
      ? req.body.itemProductId
      : req.body.itemProductId
        ? [req.body.itemProductId]
        : [];
    const quantities = Array.isArray(req.body.itemQuantity)
      ? req.body.itemQuantity
      : req.body.itemQuantity
        ? [req.body.itemQuantity]
        : [];

    if (productIds.length > 0) {
      items = productIds.map((productId, index) => ({
        productId: Number(productId),
        quantity: Number(quantities[index] || 1),
      }));
    }
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

    const itemNames = Array.isArray(req.body.itemName)
      ? req.body.itemName
      : req.body.itemName
        ? [req.body.itemName]
        : [];

    if (itemNames.length > 0) {
      const itemTypes = Array.isArray(req.body.itemType) ? req.body.itemType : [req.body.itemType];
      const itemIds = Array.isArray(req.body.itemId) ? req.body.itemId : [req.body.itemId];
      const itemQuantities = Array.isArray(req.body.itemQuantity) ? req.body.itemQuantity : [req.body.itemQuantity];
      const itemUnitPrices = Array.isArray(req.body.itemUnitPrice) ? req.body.itemUnitPrice : [req.body.itemUnitPrice];

      const items = itemNames.map((name, index) => ({
        name,
        itemType: itemTypes[index] || 'product',
        itemId: Number(itemIds[index] || 0),
        quantity: Number(itemQuantities[index] || 1),
        unitPrice: Number(itemUnitPrices[index] || 0),
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
