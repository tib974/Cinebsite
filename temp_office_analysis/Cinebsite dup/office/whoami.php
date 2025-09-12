<?php
require_once __DIR__ . '/../lib/auth.php';
header('Content-Type: application/json');
if (is_logged_in()) {
  echo json_encode(['ok'=>true]);
} else {
  http_response_code(401);
  echo json_encode(['ok'=>false]);
}
exit;

