<?php
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/csv_import.php';

// Try to read catalog.json; if missing, import from CSV as bootstrap
$data = read_json('catalog.json', null);
if ($data === null) {
  $csv = __DIR__ . '/../data/catalogfdf.csv';
  $imported = import_catalog_from_csv($csv);
  $data = is_array($imported) ? $imported : [];
  write_json('catalog.json', $data);
}

json_response(['ok' => true, 'data' => $data]);

