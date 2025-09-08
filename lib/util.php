<?php
require_once __DIR__ . '/config.php';

function data_path($name) {
  return rtrim(DATA_DIR, '/').'/'.$name;
}

function read_json($name, $default = []) {
  $file = data_path($name);
  if (!file_exists($file)) return $default;
  $raw = @file_get_contents($file);
  if ($raw === false || $raw === '') return $default;
  $data = json_decode($raw, true);
  return is_array($data) ? $data : $default;
}

function write_json($name, $data) {
  $file = data_path($name);
  $dir = dirname($file);
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  $fp = fopen($file, 'c+');
  if (!$fp) return false;
  // lock file
  if (!flock($fp, LOCK_EX)) { fclose($fp); return false; }
  ftruncate($fp, 0);
  fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  return true;
}

function append_csv($name, $row) {
  $file = data_path($name);
  $dir = dirname($file);
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  $fp = fopen($file, file_exists($file) ? 'a' : 'w');
  if (!$fp) return false;
  if (ftell($fp) === 0 && isset($row['_header']) && is_array($row['_header'])) {
    fputcsv($fp, $row['_header']);
  }
  if (isset($row['_header'])) unset($row['_header']);
  fputcsv($fp, $row);
  fclose($fp);
  return true;
}

function slugify($text) {
  $text = strtolower(trim($text));
  $text = iconv('UTF-8', 'ASCII//TRANSLIT', $text);
  $text = preg_replace('~[^a-z0-9]+~', '-', $text);
  $text = trim($text, '-');
  return $text ?: substr(md5(uniqid('', true)), 0, 8);
}

function json_response($payload, $status = 200) {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
  echo json_encode($payload, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  exit;
}

