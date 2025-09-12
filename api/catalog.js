const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

// Cette fonction est le "handler" de la serverless function
module.exports = async (req, res) => {
  try {
    // Le chemin vers la DB doit être résolu à partir du dossier de la fonction
    const dbPath = path.resolve(process.cwd(), 'data/database.sqlite');

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READONLY
    });

    const rows = await db.all('SELECT * FROM products');
    await db.close();

    const output = rows.map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price_eur_day: p.price,
      image: p.image,
      category: p.tags,
      includes: (p.includes || '').replace(/[\\"']/g, ''),
      featured: p.featured === 1,
      type: (p.includes && p.includes !== '""') ? 'pack' : 'product',
    }));

    // Vercel attend une réponse au format JSON
    res.status(200).json({ ok: true, data: output });

  } catch (err) {
    console.error("API Error:", err.message);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
