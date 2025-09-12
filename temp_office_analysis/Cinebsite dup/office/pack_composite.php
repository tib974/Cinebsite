<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/imageproc.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method_not_allowed']); exit; }
if (!verify_csrf($_POST['csrf'] ?? '')) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad_csrf']); exit; }

$slug = strtolower(trim($_POST['slug'] ?? ''));
if ($slug===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'missing_slug']); exit; }

$items = read_json('catalog.json', []);
$pack = null; foreach($items as $it){ if (strtolower($it['slug']??'')===$slug){ $pack=$it; break; } }
if (!$pack || ($pack['type']??'')!=='pack'){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'not_a_pack']); exit; }

$includes = array_values(array_filter(array_map('trim', explode(',', (string)($pack['includes']??'')))));
if (!$includes){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'pack_has_no_includes']); exit; }

// Map slugs to images
$pmap = [];
foreach ($items as $it){ $pmap[strtolower($it['slug']??'')] = trim($it['image']??''); }
$components = [];
foreach ($includes as $s){ $img=$pmap[strtolower($s)]??''; if($img) $components[]=$img; }
if (!$components){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'no_component_images']); exit; }

$out = imageproc_compose_pack($slug, array_slice($components,0,6), ['bg'=>'#f4f6f9','tile'=>'3x2','size'=>'420x420+30+30']);
if (!$out){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'compose_failed']); exit; }

// Update pack image
foreach ($items as &$it){ if (strtolower($it['slug']??'')===$slug){ $it['image']=$out; break; } }
unset($it); write_json('catalog.json', $items);

echo json_encode(['ok'=>true,'path'=>$out]);
exit;

