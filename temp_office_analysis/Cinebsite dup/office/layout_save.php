<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';

// Accept raw JSON body and write to data/layout.json
$raw = file_get_contents('php://input');
$j = json_decode($raw, true);
if (!is_array($j)) {
  http_response_code(400);
  header('Content-Type: application/json');
  echo json_encode(['ok'=>false,'error'=>'invalid_json']);
  exit;
}

// Basic shape check (not strict)
if (!isset($j['default']) && count($j)===0) {
  http_response_code(400);
  header('Content-Type: application/json');
  echo json_encode(['ok'=>false,'error'=>'empty_layout']);
  exit;
}

// Write atomically
$path = data_path('layout.json');
$tmp = $path.'.tmp';
// Versioning: backup current if exists
if (file_exists($path)) {
  $ts = date('Ymd-His');
  @copy($path, data_path('layout-'.$ts.'.json'));
}
file_put_contents($tmp, json_encode($j, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT));
@rename($tmp, $path);

header('Content-Type: application/json');
echo json_encode(['ok'=>true]);
exit;
