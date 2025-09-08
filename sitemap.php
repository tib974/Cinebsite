<?php
require_once __DIR__ . '/lib/util.php';
header('Content-Type: application/xml; charset=utf-8');
$base = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off' ? 'https://' : 'http://') . $_SERVER['HTTP_HOST'];
$urls = [
  $base.'/index.html',
  $base.'/packs.html',
  $base.'/realisations.html',
  $base.'/calendrier.html',
  $base.'/contact.html',
  $base.'/apropos.html'
];
$cat = read_json('catalog.json', []);
foreach($cat as $it){ if(!empty($it['slug'])) $urls[] = $base.'/produit.php?slug='.rawurlencode($it['slug']); }
$reals = read_json('realisations.json', []);
foreach($reals as $it){ if(!empty($it['slug'])) $urls[] = $base.'/realisation.php?id='.rawurlencode($it['slug']); }
echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
echo "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
foreach(array_unique($urls) as $u){
  echo "  <url><loc>".htmlspecialchars($u, ENT_XML1)."</loc></url>\n";
}
echo "</urlset>\n";
