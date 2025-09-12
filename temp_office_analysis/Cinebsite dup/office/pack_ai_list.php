<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';

header('Content-Type: application/json; charset=utf-8');
$slug = strtolower(trim($_GET['slug'] ?? ''));
if ($slug===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'missing_slug']); exit; }
$prefix = 'ai-pack-'.$slug.'-';
$dir = __DIR__ . '/../assets/uploads';
$items = [];
if (is_dir($dir)){
  $it = new DirectoryIterator($dir);
  foreach ($it as $f){ if($f->isDot()) continue; $n=$f->getFilename(); if(strpos($n,$prefix)===0){ $items[] = 'assets/uploads/'.$n; } }
}
sort($items);
echo json_encode(['ok'=>true,'items'=>$items]);
exit;

