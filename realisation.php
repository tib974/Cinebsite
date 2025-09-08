<?php
require_once __DIR__ . '/lib/util.php';
$slug = strtolower(trim($_GET['id'] ?? ''));
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$origin = $scheme . '://' . $host;
$item = null;
$reals = read_json('realisations.json', []);
foreach ($reals as $it) { if (strtolower($it['slug'] ?? '') === $slug) { $item = $it; break; } }
$title = $item ? ($item['title'].' — CinéB') : 'Réalisation — CinéB';
$desc = $item ? ($item['description'] ?: 'Projet réalisé') : 'Projet réalisé';
$img  = $item ? ($item['image'] ?: 'assets/logooo.png') : 'assets/logooo.png';
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
  <link rel="canonical" href="<?php echo htmlspecialchars($origin . '/realisation.php?id=' . rawurlencode($slug)); ?>">
  <meta property="og:title" content="<?php echo htmlspecialchars($title); ?>">
  <meta property="og:description" content="<?php echo htmlspecialchars($desc); ?>">
  <meta property="og:type" content="article">
  <meta property="og:url" content="<?php echo htmlspecialchars($origin . '/realisation.php?id=' . rawurlencode($slug)); ?>">
  <meta property="og:image" content="<?php echo htmlspecialchars((preg_match('#^https?://#',$img)? $img : $origin.'/'.ltrim($img,'/'))); ?>">
  <link rel="stylesheet" href="theme-poppins.css">
  <script defer src="js/config.js"></script>
  <script defer src="js/seo.js"></script>
  <script defer src="js/nav.js"></script>
  <script defer src="js/realisation.js"></script>
  <script defer src="js/analytics.js"></script>
  <script>window.history.replaceState(null,'',location.pathname+'?id=<?php echo rawurlencode($slug); ?>');</script>
  <script type="application/ld+json">
  <?php
    $ld = [
      '@context' => 'https://schema.org',
      '@type' => 'BreadcrumbList',
      'itemListElement' => [
        ['@type'=>'ListItem','position'=>1,'name'=>'Accueil','item'=>'/'],
        ['@type'=>'ListItem','position'=>2,'name'=>'Réalisations','item'=>'/realisations.html'],
        ['@type'=>'ListItem','position'=>3,'name'=>$item['title'] ?? 'Réalisation','item'=>'/realisation.php?id='.($slug)]
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
        <a class="btn" href="contact.html">Contact / Devis</a>
      </div>
    </div>
  </header>

  <main id="contenu" class="container">
    <div id="real" class="card" style="padding:20px;max-width:900px;margin:0 auto"></div>
  </main>

  <footer class="footer">© CinéB — La Réunion</footer>
</body>
</html>
