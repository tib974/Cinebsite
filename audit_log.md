# Journal d'Audit - CinéB

Ce document recense les problèmes de sécurité, de performance et de maintenabilité identifiés lors de l'audit non destructif du projet. Chaque problème est accompagné d'une description du risque et d'un patch `diff -u` pour le corriger.

## Problème n°1 : Politique de Sécurité de Contenu (CSP) trop permissive

- **Fichier concerné :** `.htaccess`
- **Risque :** Élevé. L'utilisation de `unsafe-inline` pour les directives `script-src` et `style-src` autorise l'exécution de scripts et de styles directement insérés dans le code HTML. Cela expose le site à des attaques de type Cross-Site Scripting (XSS), où un attaquant pourrait injecter du code malveillant dans les pages.
- **Correctif proposé :** L'idéal est de supprimer tous les scripts et styles "en ligne" pour les placer dans des fichiers externes. Si cela n'est pas possible à court terme, une solution est d'utiliser des "nonces" ou des "hashes" pour autoriser spécifiquement chaque script ou style en ligne. Le patch ci-dessous est un exemple de renforcement, mais une analyse plus poussée sera nécessaire pour lister tous les scripts et styles.

```diff
--- a/.htaccess
+++ b/.htaccess
@@ -6,7 +6,7 @@
   Header set Referrer-Policy "strict-origin-when-cross-origin"
   Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
   Header set X-Permitted-Cross-Domain-Policies "none"
-  # CSP: permet le JSON-LD inline et styles inline, bloque les objects, force HTTPS en upgrade
-  Header set Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src https://calendly.com https://www.youtube.com https://player.vimeo.com; connect-src 'self' https:; frame-ancestors 'self'"
+  # CSP: politique renforcée, nécessite de déplacer les scripts/styles inline
+  Header set Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests; img-src 'self' data: blob: https:; script-src 'self'; style-src 'self'; font-src 'self' data:; frame-src https://calendly.com https://www.youtube.com https://player.vimeo.com; connect-src 'self' https:; frame-ancestors 'self'"
 </IfModule>
 
 <IfModule mod_expires.c>

```

## Problème n°2 : Vulnérabilité XSS dans `api/quote.php`

- **Fichier concerné :** `api/quote.php`
- **Risque :** Élevé. Les données envoyées par l'utilisateur via le formulaire de devis sont enregistrées et potentiellement affichées (email, export CSV) sans être neutralisées. Un attaquant peut soumettre du code HTML ou JavaScript malveillant, qui sera exécuté par la victime (administrateur) à l'ouverture de l'email ou du fichier CSV.
- **Correctif proposé :** Neutraliser les caractères spéciaux HTML pour toutes les entrées utilisateur avant de les sauvegarder ou de les envoyer par email, en utilisant la fonction `htmlspecialchars`. L'adresse email n'est pas modifiée pour ne pas invalider la vérification `filter_var`.

```diff
--- a/api/quote.php
+++ b/api/quote.php
@@ -11,15 +11,15 @@
 }
 
 // Sanitize inputs (length + basic filtering)
-$name = substr(trim($_POST['name'] ?? ''), 0, 200);
+$name = htmlspecialchars(substr(trim($_POST['name'] ?? ''), 0, 200), ENT_QUOTES, 'UTF-8');
 $email = substr(trim($_POST['email'] ?? ''), 0, 200);
-$phone = substr(trim($_POST['phone'] ?? ''), 0, 60);
-$message = substr(trim($_POST['message'] ?? ''), 0, 5000);
-$items = substr(trim($_POST['items'] ?? ''), 0, 1000);
-$dates = substr(trim($_POST['dates'] ?? ''), 0, 200);
-$source = substr(trim($_POST['source'] ?? 'web'), 0, 40);
-$estimate = substr(trim($_POST['estimate'] ?? ''), 0, 40);
-$period = substr(trim($_POST['period'] ?? ($_POST['periode'] ?? '')), 0, 80);
+$phone = htmlspecialchars(substr(trim($_POST['phone'] ?? ''), 0, 60), ENT_QUOTES, 'UTF-8');
+$message = htmlspecialchars(substr(trim($_POST['message'] ?? ''), 0, 5000), ENT_QUOTES, 'UTF-8');
+$items = htmlspecialchars(substr(trim($_POST['items'] ?? ''), 0, 1000), ENT_QUOTES, 'UTF-8');
+$dates = htmlspecialchars(substr(trim($_POST['dates'] ?? ''), 0, 200), ENT_QUOTES, 'UTF-8');
+$source = htmlspecialchars(substr(trim($_POST['source'] ?? 'web'), 0, 40), ENT_QUOTES, 'UTF-8');
+$estimate = htmlspecialchars(substr(trim($_POST['estimate'] ?? ''), 0, 40), ENT_QUOTES, 'UTF-8');
+$period = htmlspecialchars(substr(trim($_POST['period'] ?? ($_POST['periode'] ?? '')), 0, 80), ENT_QUOTES, 'UTF-8');
 
 // Validate email to avoid header injection + ensure reply address sanity
 if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {

```

## Problème n°3 : Condition de course (Race Condition) dans `api/quote.php`

- **Fichiers concernés :** `api/quote.php`, `lib/util.php`
- **Risque :** Moyen. Le système de limitation de débit lit un fichier, modifie des données en mémoire, puis réécrit le fichier. Si deux requêtes arrivent en même temps, elles peuvent lire la même valeur initiale, et la deuxième requête écrasera les modifications de la première. Cela peut rendre la limitation de débit inefficace.
- **Correctif proposé :**
    1.  Ajouter une nouvelle fonction `update_json` dans `lib/util.php` qui garantit que la lecture, la modification et l'écriture d'un fichier JSON se font de manière atomique (indivisible) grâce à un verrou.
    2.  Modifier `api/quote.php` pour utiliser cette nouvelle fonction, en lui passant la logique de mise à jour du compteur.

### Étape 3.1 : Ajout de `update_json` à `lib/util.php`

Il faut ajouter le code suivant à la fin du fichier `lib/util.php` :

```php
function update_json($name, callable $updater, $default = []) {
  $file = data_path($name);
  $dir = dirname($file);
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  $fp = fopen($file, 'c+');
  if (!$fp) return ['ok' => false, 'data' => $default];

  if (!flock($fp, LOCK_EX)) {
    fclose($fp);
    return ['ok' => false, 'data' => $default];
  }

  $raw = stream_get_contents($fp);
  $data = ($raw === false || $raw === '') ? $default : json_decode($raw, true);
  if (!is_array($data)) $data = $default;

  list($new_data, $result) = $updater($data);

  ftruncate($fp, 0);
  rewind($fp);
  fwrite($fp, json_encode($new_data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);

  return ['ok' => true, 'data' => $result];
}
```

### Étape 3.2 : Patch pour `api/quote.php`

```diff
--- a/api/quote.php
+++ b/api/quote.php
@@ -24,24 +24,22 @@
 
 // Rate limit: 1 request per 60s per IP, max 10/day
 $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
-$rate = read_json('quote_rate.json', []);
 $now = time();
-$rec = $rate[$ip] ?? ['recent' => [], 'day' => 0, 'day_ts' => $now];
-// purge old recent (>60s)
-$rec['recent'] = array_values(array_filter($rec['recent'], fn($t) => ($now - $t) < 60));
-// reset day window
-if ($now - ($rec['day_ts'] ?? 0) > 86400) { $rec['day'] = 0; $rec['day_ts'] = $now; }
-if (count($rec['recent']) >= 0 && !empty($rec['recent']) && ($now - end($rec['recent'])) < 60) {
-  json_response(['ok' => false, 'error' => 'too_many_requests'], 429);
-}
-if (($rec['day'] ?? 0) >= 10) {
-  json_response(['ok' => false, 'error' => 'too_many_requests'], 429);
-}
-// record
-$rec['recent'][] = $now;
-$rec['day'] = ($rec['day'] ?? 0) + 1;
-$rate[$ip] = $rec;
-write_json('quote_rate.json', $rate);
+
+$rate_limit_result = update_json('quote_rate.json', function($rate) use ($ip, $now) {
+  $rec = $rate[$ip] ?? ['recent' => [], 'day' => 0, 'day_ts' => $now];
+  // purge old recent (>60s)
+  $rec['recent'] = array_values(array_filter($rec['recent'], fn($t) => ($now - $t) < 60));
+  // reset day window
+  if ($now - ($rec['day_ts'] ?? 0) > 86400) { $rec['day'] = 0; $rec['day_ts'] = $now; }
+
+  if (!empty($rec['recent']) && ($now - end($rec['recent'])) < 60) return [$rate, false];
+  if (($rec['day'] ?? 0) >= 10) return [$rate, false];
+
+  $rec['recent'][] = $now;
+  $rec['day'] = ($rec['day'] ?? 0) + 1;
+  $rate[$ip] = $rec;
+  return [$rate, true];
+});
+
+if (!$rate_limit_result['ok'] || !$rate_limit_result['data']) {
+  json_response(['ok' => false, 'error' => 'too_many_requests'], 429);
+}
 
 // Persist to CSV for audit/export
 $row = [

```

## Problème n°4 : Redirection ouverte (Open Redirect) dans `office/layout.php`

- **Fichier concerné :** `office/layout.php`
- **Risque :** Moyen. Le paramètre `page` de l'URL n'est pas validé. Un attaquant peut créer un lien qui pointe vers l'éditeur de layout mais qui charge une page externe malveillante dans l'iframe, ce qui peut être utilisé pour des attaques de phishing contre un administrateur.
- **Correctif proposé :** Valider la valeur du paramètre `page` contre une liste blanche de pages autorisées avant de l'utiliser.

```diff
--- a/office/layout.php
+++ b/office/layout.php
@@ -32,7 +32,13 @@
     <div>Mise en page — Outil visuel</div>
     <div></div>
   </header>
-  <?php $initial = isset($_GET['page']) ? trim($_GET['page']) : '/index.html'; if($initial==='') $initial='/index.html'; ?>
+  <?php
+  $allowed_pages = ['/index.html', '/packs.html', '/calendrier.html', '/realisations.html', '/services.html'];
+  $initial = isset($_GET['page']) ? trim($_GET['page']) : '/index.html';
+  if (!in_array($initial, $allowed_pages, true)) {
+    $initial = '/index.html';
+  }
+  ?>
   <div class="wrap">
     <div class="card">
       <div class="group">

```
