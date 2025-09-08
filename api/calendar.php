<?php
require_once __DIR__ . '/../lib/util.php';

// Calendar data format: array of entries with keys:
// - date (YYYY-MM-DD) OR date_from/date_to
// - item_slug (optional)
// - status (e.g., 'blocked' or 'reserved')
// Only public fields are returned.

$data = read_json('calendar.json', []);

// Optional filtering by item slug: ?item=slug
$item = isset($_GET['item']) ? trim((string)$_GET['item']) : '';
if ($item !== '') {
  $data = array_values(array_filter($data, function($r) use ($item) {
    return !empty($r['item_slug']) && strtolower($r['item_slug']) === strtolower($item);
  }));
}

// Public API: do not include personal info
foreach ($data as &$r) {
  unset($r['client_name'], $r['client_email'], $r['notes']);
}
unset($r);

json_response(['ok' => true, 'data' => $data]);

