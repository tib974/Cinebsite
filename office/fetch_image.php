<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/imageproc.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method_not_allowed']); exit; }
if (!verify_csrf($_POST['csrf'] ?? '')) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad_csrf']); exit; }

$url = trim($_POST['url'] ?? '');
$opt = !empty($_POST['opt'] ?? '');
if ($url===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'missing_url']); exit; }
if (!preg_match('~^https://~i', $url)){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'only_https']); exit; }

// Enforce allowed domains if configured
$pol = get_image_policy();
if (!empty($pol['enforce_domains']) && !empty($pol['allowed_domains'])){
  $host = strtolower(parse_url($url, PHP_URL_HOST) ?: '');
  $ok = false;
  foreach ($pol['allowed_domains'] as $d){
    $d = strtolower(trim($d)); if($d==='') continue;
    if ($host === $d || preg_match('~(^|\.)'.preg_quote($d, '~').'$/i', $host)) { $ok=true; break; }
  }
  if (!$ok){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'domain_not_allowed']); exit; }
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 12);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'CinebImageFetcher/1.0');
$data = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$ct = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$len = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
curl_close($ch);
if ($code<200 || $code>=300 || !$data){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'fetch_failed']); exit; }
if ($len>0 && $len > 5*1024*1024){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'too_big']); exit; }
if (!preg_match('~image/(png|jpeg|webp|avif)~i', $ct)){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'invalid_type']); exit; }

$ext = '.png';
if (stripos($ct,'jpeg')!==false) $ext='.jpg';
elseif (stripos($ct,'webp')!==false) $ext='.webp';
elseif (stripos($ct,'avif')!==false) $ext='.avif';

$uploadsDir = __DIR__ . '/../assets/uploads';
if (!is_dir($uploadsDir)) @mkdir($uploadsDir, 0775, true);
$name = substr(md5($url.microtime(true)),0,12);
$rel = 'assets/uploads/web-'.$name.$ext;
$abs = __DIR__ . '/../' . $rel;
file_put_contents($abs, $data);

if (!file_exists($abs) || filesize($abs)<=0){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'write_failed']); exit; }

$best = $rel;
if ($opt){ $best = imageproc_process_all($rel); imageproc_update_manifest_entry($rel); }

echo json_encode(['ok'=>true,'path'=>$best]);
exit;
