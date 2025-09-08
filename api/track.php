<?php
require_once __DIR__ . '/../lib/util.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo 'method_not_allowed';
  exit;
}

$input = file_get_contents('php://input');
parse_str($input, $data);

$ts = date('c');
$path = substr($data['path'] ?? ($_SERVER['HTTP_REFERER'] ?? ''), 0, 200);
$ref = substr($data['ref'] ?? '', 0, 200);
$ua  = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 200);
$ip  = $_SERVER['REMOTE_ADDR'] ?? '';

append_csv('analytics.csv', [
  '_header' => ['timestamp','path','referrer','ip','ua'],
  $ts, $path, $ref, $ip, $ua
]);

header('Content-Type: text/plain');
echo 'ok';
exit;

