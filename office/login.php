<?php
require_once __DIR__ . '/../lib/auth.php';

if (is_logged_in()) {
  header('Location: ' . ADMIN_BASE_PATH . '/');
  exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!verify_csrf($_POST['csrf'] ?? '')) {
    $error = 'Session expirée. Veuillez réessayer.';
  } else {
    $u = $_POST['username'] ?? '';
    $p = $_POST['password'] ?? '';
    if (try_login($u, $p)) {
      header('Location: ' . ADMIN_BASE_PATH . '/');
      exit;
    } else {
      $error = 'Identifiants invalides ou trop de tentatives. Patientez puis réessayez.';
    }
  }
}
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connexion — Admin CinéB</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#0f0f12; color:#eaeaea; display:flex; align-items:center; justify-content:center; height:100vh; margin:0 }
    .card { width: 320px; background:#17181c; border:1px solid #2a2b2f; border-radius:12px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,.4) }
    input, button { width:100%; padding:10px; border-radius:8px; border:1px solid #2a2b2f; background:#0f1013; color:#eaeaea }
    button { background:#6a4bc7; border:none; cursor:pointer; font-weight:700 }
    h1 { font-size:1.2rem; margin:0 0 10px }
    .muted { color:#a0a3a8; font-size:.9rem }
    .error { color:#ff8a8a; margin:8px 0 }
    .brand { display:flex; align-items:center; gap:10px; margin-bottom:8px; font-weight:800 }
  </style>
  <meta name="robots" content="noindex, nofollow">
  <meta http-equiv="X-Robots-Tag" content="noindex, nofollow">
  <link rel="icon" href="../favicon.ico">
  <link rel="stylesheet" href="../theme-poppins.css">
  <script>if(top!==self) top.location=self.location;</script>
  <noscript><style>body{display:block}</style></noscript>
  </head>
<body>
  <div class="card">
    <div class="brand">CinéB — Admin</div>
    <h1>Connexion</h1>
    <?php if($error): ?><div class="error"><?php echo htmlspecialchars($error); ?></div><?php endif; ?>
    <form method="post">
      <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
      <label class="muted">Utilisateur</label>
      <input name="username" required autofocus value="<?php echo htmlspecialchars(ADMIN_USER); ?>">
      <div style="height:8px"></div>
      <label class="muted">Mot de passe</label>
      <input name="password" type="password" required>
      <div style="height:14px"></div>
      <button type="submit">Entrer</button>
    </form>
    <div class="muted" style="margin-top:10px">URL confidentielle — Ne pas partager</div>
  </div>
</body>
</html>
