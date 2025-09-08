<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/imageproc.php';

header('Content-Type: application/json; charset=utf-8');

$path = trim($_GET['path'] ?? $_POST['path'] ?? '');
$opt  = !empty($_GET['opt'] ?? $_POST['opt'] ?? '');
if ($path === ''){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'missing_path']);
  exit;
}

if ($opt){
  $best = imageproc_process_all($path);
  imageproc_update_manifest_entry($path);
} else {
  $best = imageproc_best_variant($path);
}

echo json_encode(['ok'=>true,'best'=>$best]);
exit;

