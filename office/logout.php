<?php
require_once __DIR__ . '/../lib/auth.php';
logout();
header('Location: ' . ADMIN_BASE_PATH . '/login.php');
exit;

