<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';

header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method_not_allowed']); exit; }
if (!verify_csrf($_POST['csrf'] ?? '')) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad_csrf']); exit; }
$path = trim($_POST['path'] ?? '');
if ($path==='' || !preg_match('~^assets/uploads/ai-pack-[a-z0-9_-]+-~i',$path)){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'invalid_path']); exit; }
$abs = __DIR__ . '/../' . $path;
if (file_exists($abs)) @unlink($abs);
echo json_encode(['ok'=>true]);
exit;

