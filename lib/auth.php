<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/util.php';

// Harden session cookie
if (session_status() === PHP_SESSION_NONE) {
  $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
  session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => $secure,
    'httponly' => true,
    'samesite' => 'Lax'
  ]);
  session_start();
}

function is_logged_in() {
  return !empty($_SESSION['admin_logged']) && $_SESSION['admin_logged'] === true;
}

function require_login() {
  if (!is_logged_in()) {
    header('Location: ' . ADMIN_BASE_PATH . '/login.php');
    exit;
  }
  // Session checks: inactivity timeout + UA/IP binding
  $maxIdle = 30 * 60; // 30 minutes
  $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
  $ipPrefix = preg_replace('~(\d+\.\d+\.\d+)\..*~', '$1', $ip);
  if (!isset($_SESSION['ua']) || !isset($_SESSION['ip_prefix'])) {
    logout(); header('Location: ' . ADMIN_BASE_PATH . '/login.php'); exit;
  }
  if ($_SESSION['ua'] !== $ua || $_SESSION['ip_prefix'] !== $ipPrefix) {
    logout(); header('Location: ' . ADMIN_BASE_PATH . '/login.php'); exit;
  }
  if (!isset($_SESSION['last_active'])) $_SESSION['last_active'] = time();
  if (time() - $_SESSION['last_active'] > $maxIdle) {
    logout(); header('Location: ' . ADMIN_BASE_PATH . '/login.php'); exit;
  }
  $_SESSION['last_active'] = time();
}

function try_login($username, $password) {
  // Rate limiting by IP
  $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
  if (!login_allowed($ip)) { return false; }

  if ($username !== ADMIN_USER) { record_login_failure($ip); return false; }
  $hash = get_admin_hash();
  if (!$hash) return false;
  if (password_verify($password, $hash)) {
    $_SESSION['admin_logged'] = true;
    $_SESSION['admin_user'] = ADMIN_USER;
    $_SESSION['ua'] = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $_SESSION['ip_prefix'] = preg_replace('~(\d+\.\d+\.\d+)\..*~', '$1', $_SERVER['REMOTE_ADDR'] ?? '');
    $_SESSION['last_active'] = time();
    session_regenerate_id(true);
    reset_login_counter($ip);
    return true;
  }
  record_login_failure($ip);
  return false;
}

function logout() {
  $_SESSION = [];
  if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
      $params['path'], $params['domain'], $params['secure'], $params['httponly']
    );
  }
  session_destroy();
}

// CSRF helpers
function csrf_token() {
  if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
  }
  return $_SESSION['csrf_token'];
}

function verify_csrf($token) {
  return is_string($token) && isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function require_csrf() {
  $tok = $_POST['csrf'] ?? '';
  if (!verify_csrf($tok)) {
    http_response_code(400);
    echo 'Requête invalide (CSRF). Réessayez.';
    exit;
  }
}

// Login rate limiting (file-based)
function login_allowed($ip) {
  $data = read_json('login_attempts.json', []);
  $now = time();
  // Clean old attempts
  foreach ($data as $k => $v) {
    if (($v['blocked_until'] ?? 0) < $now - 3600 && ($v['last'] ?? 0) < $now - 3600) {
      unset($data[$k]);
    }
  }
  $rec = $data[$ip] ?? ['count' => 0, 'last' => 0, 'blocked_until' => 0];
  if ($rec['blocked_until'] > $now) { return false; }
  write_json('login_attempts.json', $data);
  return true;
}

function record_login_failure($ip) {
  $data = read_json('login_attempts.json', []);
  $now = time();
  $rec = $data[$ip] ?? ['count' => 0, 'last' => 0, 'blocked_until' => 0];
  // Reset window if last attempt >10min ago
  if ($now - ($rec['last'] ?? 0) > 600) { $rec['count'] = 0; }
  $rec['count'] = ($rec['count'] ?? 0) + 1;
  $rec['last'] = $now;
  if ($rec['count'] >= 5) {
    $rec['blocked_until'] = $now + 900; // 15 minutes block
    $rec['count'] = 0;
  }
  $data[$ip] = $rec;
  write_json('login_attempts.json', $data);
}

function reset_login_counter($ip) {
  $data = read_json('login_attempts.json', []);
  unset($data[$ip]);
  write_json('login_attempts.json', $data);
}
