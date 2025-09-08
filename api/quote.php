<?php
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

// Simple honeypot anti-spam
if (!empty($_POST['website'])) {
  json_response(['ok' => true]);
}

// Sanitize inputs (length + basic filtering)
$name = substr(trim($_POST['name'] ?? ''), 0, 200);
$email = substr(trim($_POST['email'] ?? ''), 0, 200);
$phone = substr(trim($_POST['phone'] ?? ''), 0, 60);
$message = substr(trim($_POST['message'] ?? ''), 0, 5000);
$items = substr(trim($_POST['items'] ?? ''), 0, 1000);
$dates = substr(trim($_POST['dates'] ?? ''), 0, 200);
$source = substr(trim($_POST['source'] ?? 'web'), 0, 40);
$estimate = substr(trim($_POST['estimate'] ?? ''), 0, 40);
$period = substr(trim($_POST['period'] ?? ($_POST['periode'] ?? '')), 0, 80);

// Validate email to avoid header injection + ensure reply address sanity
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  json_response(['ok' => false, 'error' => 'invalid_email'], 400);
}

// Rate limit: 1 request per 60s per IP, max 10/day
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rate = read_json('quote_rate.json', []);
$now = time();
$rec = $rate[$ip] ?? ['recent' => [], 'day' => 0, 'day_ts' => $now];
// purge old recent (>60s)
$rec['recent'] = array_values(array_filter($rec['recent'], fn($t) => ($now - $t) < 60));
// reset day window
if ($now - ($rec['day_ts'] ?? 0) > 86400) { $rec['day'] = 0; $rec['day_ts'] = $now; }
if (count($rec['recent']) >= 0 && !empty($rec['recent']) && ($now - end($rec['recent'])) < 60) {
  json_response(['ok' => false, 'error' => 'too_many_requests'], 429);
}
if (($rec['day'] ?? 0) >= 10) {
  json_response(['ok' => false, 'error' => 'too_many_requests'], 429);
}
// record
$rec['recent'][] = $now;
$rec['day'] = ($rec['day'] ?? 0) + 1;
$rate[$ip] = $rec;
write_json('quote_rate.json', $rate);

// Persist to CSV for audit/export
$row = [
  '_header' => ['timestamp','name','email','phone','message','items','dates','period','estimate_eur','source','ip'],
  date('c'), $name, $email, $phone, $message, $items, $dates, $period, $estimate, $source, $_SERVER['REMOTE_ADDR'] ?? ''
];
append_csv('quotes.csv', $row);

// Notify by mail (best-effort)
mail_send_quote([
  'name' => $name,
  'email' => $email,
  'phone' => $phone,
  'message' => $message,
  'items' => $items,
  'dates' => $dates,
  'period' => $period,
  'estimate' => $estimate
]);

json_response(['ok' => true]);
