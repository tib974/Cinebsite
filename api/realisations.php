<?php
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/csv_import.php';

$data = read_json('realisations.json', null);
if ($data === null) {
  $csv = __DIR__ . '/../data/realisations.csv';
  $imported = import_realisations_from_csv($csv);
  $data = is_array($imported) ? $imported : [];
  write_json('realisations.json', $data);
}

json_response(['ok' => true, 'data' => $data]);

