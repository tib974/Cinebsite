<?php
require_once __DIR__ . '/lib/util.php';
$slug = strtolower(trim($_GET['slug'] ?? ''));
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$origin = $scheme . '://' . $host;
$product = null;
$cat = read_json('catalog.json', []);
foreach ($cat as $it) {
  if (strtolower($it['slug'] ?? '') === $slug) { $product = $it; break; }
}
$title = $product ? ($product['name'].' — CinéB') : 'Produit — CinéB';
$desc = $product ? ($product['description'] ?: 'Location de matériel audiovisuel') : 'Location de matériel audiovisuel';
$img  = $product ? ($product['image'] ?: 'assets/logooo.png') : 'assets/logooo.png';
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php echo htmlspecialchars($title); ?></title>
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="manifest" href="manifest.webmanifest">
  <meta name="theme-color" content="#6b37d4">
  <meta name="description" content="<?php echo htmlspecialchars($desc); ?>">
  <link rel="canonical" href="<?php echo htmlspecialchars($origin . '/produit.php?slug=' . rawurlencode($slug)); ?>">
  <meta property="og:title" content="<?php echo htmlspecialchars($title); ?>">
  <meta property="og:description" content="<?php echo htmlspecialchars($desc); ?>">
  <meta property="og:type" content="website">
  <meta property="og:url" content="<?php echo htmlspecialchars($origin . '/produit.php?slug=' . rawurlencode($slug)); ?>">
  <meta property="og:image" content="<?php echo htmlspecialchars((preg_match('#^https?://#',$img)? $img : $origin.'/'.ltrim($img,'/'))); ?>">
  <link rel="stylesheet" href="theme-poppins.css">
  <script defer src="js/config.js"></script>
  <script defer src="js/seo.js"></script>
  <script defer src="js/nav.js"></script>
  <script defer src="js/product.js"></script>
  <script defer src="js/analytics.js"></script>
  <script>window.history.replaceState(null,'',location.pathname+'?slug=<?php echo rawurlencode($slug); ?>');</script>
  <script type="application/ld+json">
  <?php
    $ld = [
      '@context' => 'https://schema.org',
      '@type' => 'BreadcrumbList',
      'itemListElement' => [
        ['@type'=>'ListItem','position'=>1,'name'=>'Accueil','item'=>'/'],
        ['@type'=>'ListItem','position'=>2,'name'=>'Packs & Matériel','item'=>'/packs.html'],
        ['@type'=>'ListItem','position'=>3,'name'=>$product['name'] ?? 'Produit','item'=>'/produit.php?slug='.($slug)]
      ]
    ];
    echo json_encode($ld, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  ?>
  </script>
</head>
<body>
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <header class="header">
    <div class="container">
      <a class="brand" href="index.html" aria-label="Retour à l’accueil">
        <img src="assets/logo.webp" alt="CinéB" class="logo" width="1024" height="1024" decoding="async" fetchpriority="high">
      </a>
      <button class="btn ghost nav-toggle" aria-label="Ouvrir le menu" aria-controls="navMain" aria-expanded="false">Menu</button>
      <nav id="navMain" class="nav-center" role="navigation" aria-label="Navigation principale">
        <a href="services.html">Services</a>
        <a href="packs.html">Packs & Matériel</a>
        <a href="realisations.html">Réalisations</a>
        <a href="calendrier.html">Calendrier</a>
        <a href="apropos.html">À propos</a>
      </nav>
      <div class="nav-cta">
        <a class="btn ghost" href="calendrier.html" title="Voir ma sélection">Voir ma sélection</a>
        <a class="btn" href="contact.html">Contact / Devis</a>
      </div>
    </div>
  </header>

  <main id="contenu" class="container">
    <div class="edge-full">
      <div class="edge-inner">
        <div class="card product-card" style="padding:20px;max-width:1000px;margin:0 auto">
          <div class="product-grid" style="display:grid;grid-template-columns:300px 1fr;gap:6px;align-items:start">
        <style>
          @media (max-width: 768px) { .product-grid { grid-template-columns: 1fr !important; } }
          .product-grid .media{ margin:0 auto }
          .product-grid .price{ font-size:1.2em }
          .product-grid .actions{ display:flex; gap:10px; flex-wrap:wrap; align-items:center }
        </style>
        <div class="media">
          <img id="productImage" src="<?php echo htmlspecialchars($img); ?>" alt="<?php echo htmlspecialchars($product['name'] ?? ''); ?>" loading="lazy">
        </div>
        <div style="margin-top:0"><div id="productCalendar"></div></div>
        <div>
          <div class="actions" style="margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <button id="addToCartBtn" type="button" class="btn ghost">Ajouter à la sélection</button>
            <a id="reserveBtn" href="calendrier.html" class="btn">Réserver / Voir les disponibilités</a>
          </div>
          <h1 id="productName" class="section-title" style="margin-top:0"><?php echo htmlspecialchars($product['name'] ?? 'Chargement...'); ?></h1>
          <div id="productPrice" class="price" style="font-size:1.2em;margin:10px 0"></div>
          <div id="priceEstimate" class="muted" style="margin:6px 0"></div>
          <div id="productAvailability" class="muted" style="margin:12px 0"></div>
          <div id="productDescription" class="muted" style="margin:12px 0"><?php echo htmlspecialchars($product['description'] ?? ''); ?></div>
          <div id="productIncludes" style="margin-top:20px"></div>
        </div>
        </div>
        </div>
      </div>
    </div>
  </main>

  <footer class="footer">© CinéB — La Réunion</footer>
</body>
</html>
