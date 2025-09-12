<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';

$type = $_GET['type'] ?? '';
$map = [
  'quotes' => 'quotes.csv',
];
if (!isset($map[$type])) { http_response_code(404); echo 'Fichier introuvable'; exit; }
$file = data_path($map[$type]);
if (!file_exists($file)) { http_response_code(404); echo 'Fichier introuvable'; exit; }

header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="'.$map[$type].'"');
header('Cache-Control: no-store');
readfile($file);
exit;

