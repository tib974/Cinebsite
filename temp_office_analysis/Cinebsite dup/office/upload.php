<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/imageproc.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false,'error'=>'method_not_allowed']);
  exit;
}

if (!verify_csrf($_POST['csrf'] ?? '')) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'bad_csrf']);
  exit;
}

if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'no_file']);
  exit;
}

$f = $_FILES['file'];
if ($f['error'] !== UPLOAD_ERR_OK) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'upload_error']);
  exit;
}

// Validate type & size
$allowed = ['image/jpeg'=>'.jpg','image/png'=>'.png','image/webp'=>'.webp'];
$type = mime_content_type($f['tmp_name']);
if (!isset($allowed[$type])) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'invalid_type']);
  exit;
}
if ($f['size'] > 2*1024*1024) { // 2MB
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'too_big']);
  exit;
}

$uploadsDir = __DIR__ . '/../assets/uploads';
if (!is_dir($uploadsDir)) { @mkdir($uploadsDir, 0775, true); }

$name = preg_replace('~[^a-zA-Z0-9_-]+~','-', pathinfo($f['name'], PATHINFO_FILENAME));
if ($name==='') { $name = substr(md5(uniqid('',true)),0,8); }
$ext = $allowed[$type];
$destRel = 'assets/uploads/' . $name . '-' . substr(md5(uniqid('',true)),0,6) . $ext;
$destAbs = __DIR__ . '/../' . $destRel;

if (!move_uploaded_file($f['tmp_name'], $destAbs)) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'move_failed']);
  exit;
}
$best = $destRel;
if (!empty($_POST['opt']) && $_POST['opt'] === '1') {
  try {
    $best = imageproc_process_all($destRel);
    imageproc_update_manifest_entry($destRel);
  } catch (Exception $e) { /* ignore, keep original */ }
}
echo json_encode(['ok'=>true,'path'=>$best]);
exit;
