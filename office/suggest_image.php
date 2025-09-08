<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/imageproc.php';
require_once __DIR__ . '/../lib/search_image.php';

header('Content-Type: application/json; charset=utf-8');

$slug = strtolower(trim($_GET['slug'] ?? $_POST['slug'] ?? ''));
$name = trim($_GET['name'] ?? $_POST['name'] ?? '');
$ref  = trim($_GET['ref'] ?? $_POST['ref'] ?? '');
if ($slug === '' && $name === '' && $ref === '') {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'missing_params']);
  exit;
}

$roots = [ 'assets/products', 'assets/uploads', 'assets/realisations', 'assets' ];
$tokens = array_values(array_filter(preg_split('~[^a-z0-9]+~i', strtolower($name.' '.$ref))));

$cands = [];
foreach ($roots as $root){
  $absRoot = __DIR__ . '/../' . $root;
  if (!is_dir($absRoot)) continue;
  $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($absRoot, FilesystemIterator::SKIP_DOTS));
  foreach ($it as $file){
    $rel = str_replace(__DIR__.'/../', '', $file->getPathname());
    if (!preg_match('~\.(jpe?g|png|webp|avif)$~i', $rel)) continue;
    $base = strtolower(pathinfo($rel, PATHINFO_FILENAME));
    $score = 0;
    if ($slug !== ''){
      if (strpos($base, $slug) === 0) $score += 50;
      if (strpos($base, $slug) !== false) $score += 30;
      similar_text($slug, $base, $pct);
      $score += intval($pct);
    }
    foreach ($tokens as $t){ if ($t && strpos($base, $t) !== false) $score += 10; }
    if (strpos($rel, 'assets/products') === 0) $score += 5;
    if ($score > 0){
      $cands[] = [ 'path'=>$rel, 'score'=>$score ];
    }
  }
}

usort($cands, function($a,$b){ return ($b['score'] <=> $a['score']) ?: strcmp($a['path'],$b['path']); });
$cands = array_slice($cands, 0, 12);

// Attach best variant and preview
foreach ($cands as &$c){
  $best = imageproc_best_variant($c['path']);
  $c['best'] = $best;
}
unset($c);

// Optionally merge web results
$wantWeb = !empty($_GET['web'] ?? $_POST['web'] ?? '') ? true : false;
if ($wantWeb){
  $q = $ref ?: ($slug ?: $name);
  $pol = get_image_policy();
  $domains = $pol['allowed_domains'] ?? [];
  $q2 = $q.' png';
  if (!empty($domains)){
    // apply site: filters
    $siteQ = ' (' . implode(' OR ', array_map(fn($d)=>'site:'.$d, $domains)) . ')';
    $q2 .= $siteQ;
  }
  $web = image_search_web($q2, 12, ['exact'=>true,'transparent'=>true]);
  foreach ($web as $w){
    $url = $w['url'] ?? '';
    if (!empty($domains) && $url){
      $h = strtolower(parse_url($url, PHP_URL_HOST) ?: '');
      $allowed = false; foreach($domains as $d){ $d=strtolower(trim($d)); if($h===$d || preg_match('~(^|\.)'.preg_quote($d,'~').'$/i',$h)){ $allowed=true; break; } }
      if(!$allowed) continue;
    }
    $cands[] = ['path'=>$url, 'score'=>999, 'best'=>$url, 'web'=>true, 'thumb'=>$w['thumb']];
  }
}

echo json_encode(['ok'=>true, 'items'=>$cands]);
exit;
