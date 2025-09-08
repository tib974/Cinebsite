<?php
require_once __DIR__ . '/util.php';

function csv_to_array($csvPath) {
  if (!file_exists($csvPath)) return [];
  $rows = [];
  if (($fp = fopen($csvPath, 'r')) !== false) {
    $headers = fgetcsv($fp);
    if (!$headers) { fclose($fp); return []; }
    $headers = array_map('trim', $headers);
    while (($data = fgetcsv($fp)) !== false) {
      if (count(array_filter($data, fn($v)=>trim((string)$v) !== '')) === 0) continue;
      $row = [];
      foreach ($headers as $i => $h) {
        $row[$h] = isset($data[$i]) ? trim((string)$data[$i]) : '';
      }
      $rows[] = $row;
    }
    fclose($fp);
  }
  return $rows;
}

function import_catalog_from_csv($csvPath) {
  $rows = csv_to_array($csvPath);
  if (!$rows) return [];
  $normalized = [];
  foreach ($rows as $r) {
    $normalized[] = [
      'type' => strtolower($r['type'] ?? ''),
      'category' => $r['category'] ?? '',
      'name' => $r['name'] ?? '',
      'slug' => strtolower(trim($r['slug'] ?? '')) ?: slugify($r['name'] ?? ''),
      'price_eur_day' => $r['price_eur_day'] ?? ($r['price'] ?? ''),
      'image' => $r['image'] ?? '',
      'featured' => strtoupper(trim($r['featured'] ?? '')) === 'TRUE',
      'includes' => $r['includes'] ?? '',
      'description' => $r['description'] ?? ''
    ];
  }
  return $normalized;
}

function import_realisations_from_csv($csvPath) {
  $rows = csv_to_array($csvPath);
  if (!$rows) return [];
  $normalized = [];
  foreach ($rows as $r) {
    $normalized[] = [
      'title' => $r['title'] ?? '',
      'slug' => strtolower(trim($r['slug'] ?? '')) ?: slugify($r['title'] ?? ''),
      'image' => $r['image'] ?? ($r['image_url'] ?? ''),
      'url' => $r['url'] ?? ($r['lien'] ?? ''),
      'date' => $r['date'] ?? '',
      'tags' => $r['tags'] ?? '',
      'featured' => strtoupper(trim($r['featured'] ?? '')) === 'TRUE',
      'description' => $r['description'] ?? ''
    ];
  }
  return $normalized;
}

