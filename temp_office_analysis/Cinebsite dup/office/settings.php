<?php
require_once __DIR__ . '/../lib/auth.php';
require_login();
require_once __DIR__ . '/../lib/util.php';
require_once __DIR__ . '/../lib/config.php';
require_once __DIR__ . '/../lib/imageproc.php';

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  require_csrf();
  if (isset($_POST['action']) && $_POST['action']==='optimize_all') {
    // Process all images server-side (best-effort)
    $roots = [ __DIR__.'/../assets/products', __DIR__.'/../assets/realisations', __DIR__.'/../assets/uploads' ];
    $count = 0;
    foreach ($roots as $root){
      if (!is_dir($root)) continue;
      $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
      foreach ($it as $file){
        $rel = str_replace(__DIR__.'/../','', $file->getPathname());
        if (!preg_match('~\.(jpe?g|png|webp|avif)$~i', $rel)) continue;
        imageproc_process_all($rel); imageproc_update_manifest_entry($rel); $count++;
      }
    }
    imageproc_build_manifest();
    $msg = 'Optimisation des images effectuée (traitées: '.$count.').';
  }
  if (isset($_POST['action']) && $_POST['action']==='save_image_search') {
    $prov = $_POST['provider'] ?? 'none';
    $bing = trim($_POST['bing_key'] ?? '');
    $gkey = trim($_POST['google_key'] ?? '');
    $gcx  = trim($_POST['google_cx'] ?? '');
    $lic  = trim($_POST['license'] ?? '');
    $gr   = trim($_POST['google_rights'] ?? '');
    set_image_search_config(['provider'=>$prov,'bing_key'=>$bing,'google_key'=>$gkey,'google_cx'=>$gcx,'license'=>$lic,'google_rights'=>$gr]);
    $msg = ($msg? $msg.' ' : '').'Recherche d\'images: paramètres enregistrés.';
  }
  if (isset($_POST['action']) && $_POST['action']==='assign_web') {
    require_once __DIR__ . '/../lib/search_image.php';
    $items = read_json('catalog.json', []);
    $updated = 0; $assigned = 0;
    foreach ($items as &$it){
      $slug = strtolower(trim($it['slug'] ?? ''));
      $name = trim($it['name'] ?? '');
      if ($slug==='') continue;
      $cur = trim($it['image'] ?? '');
      if ($cur) continue; // only missing
      $q = $slug ?: $name;
      $res = image_search_web($q.' png', 5, ['exact'=>true,'transparent'=>true]);
      if (!$res) continue;
      // fetch first result
      $first = $res[0];
      $url = $first['url'] ?? '';
      if (!$url) continue;
      // download
      $ch = curl_init(); curl_setopt($ch, CURLOPT_URL, $url); curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); curl_setopt($ch, CURLOPT_TIMEOUT, 12); curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); curl_setopt($ch, CURLOPT_USERAGENT, 'CinebImageFetcher/1.0');
      $data = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); $ct = curl_getinfo($ch, CURLINFO_CONTENT_TYPE); curl_close($ch);
      if ($code<200||$code>=300||!$data||!preg_match('~image/(png|jpeg|webp|avif)~i',$ct)) continue;
      $ext='.png'; if(stripos($ct,'jpeg')!==false)$ext='.jpg'; elseif(stripos($ct,'webp')!==false)$ext='.webp'; elseif(stripos($ct,'avif')!==false)$ext='.avif';
      $uploadsDir = __DIR__ . '/../assets/uploads'; if(!is_dir($uploadsDir)) @mkdir($uploadsDir,0775,true);
      $namef = substr(md5($url.microtime(true)),0,12); $rel = 'assets/uploads/web-'.$namef.$ext; $abs = __DIR__ . '/../' . $rel; file_put_contents($abs, $data);
      if (!file_exists($abs) || filesize($abs)<=0) continue;
      $best = imageproc_process_all($rel); imageproc_update_manifest_entry($rel);
      $it['image'] = $best; $assigned++; $updated++;
    }
    unset($it);
    write_json('catalog.json', $items);
    $msg = ($msg? $msg.' ' : '').'Attribution web: '.$assigned.' images importées.';
  }
  if (isset($_POST['action']) && $_POST['action']==='assign_images') {
    // Auto-assign the best matching image to products missing or suboptimal images
    $items = read_json('catalog.json', []);
    $updated = 0; $assigned = 0;
    $roots = [ 'assets/products', 'assets/uploads', 'assets/realisations', 'assets' ];
    foreach ($items as &$it){
      $slug = strtolower(trim($it['slug'] ?? ''));
      $name = trim($it['name'] ?? '');
      if ($slug==='') continue;
      // Skip if image present but already best variant
      $cur = trim($it['image'] ?? '');
      $curBest = $cur? imageproc_best_variant($cur) : '';
      if ($cur && $curBest === $cur) continue;
      // Find suggestions
      $tokens = array_values(array_filter(preg_split('~[^a-z0-9]+~i', strtolower($name))));
      $bestPath = '';
      $bestScore = 0;
      foreach ($roots as $root){
        $absRoot = __DIR__ . '/../' . $root;
        if (!is_dir($absRoot)) continue;
        $itFiles = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($absRoot, FilesystemIterator::SKIP_DOTS));
        foreach ($itFiles as $file){
          $rel = str_replace(__DIR__.'/../', '', $file->getPathname());
          if (!preg_match('~\.(jpe?g|png|webp|avif)$~i', $rel)) continue;
          $base = strtolower(pathinfo($rel, PATHINFO_FILENAME));
          $score = 0;
          if ($slug !== ''){
            if (strpos($base, $slug) === 0) $score += 50;
            if (strpos($base, $slug) !== false) $score += 30;
            similar_text($slug, $base, $pct);
            $score += intval($pct);
          }
          foreach ($tokens as $t){ if ($t && strpos($base, $t) !== false) $score += 10; }
          if (strpos($rel, 'assets/products') === 0) $score += 5;
          if ($score > $bestScore){ $bestScore=$score; $bestPath=$rel; }
        }
      }
      if ($bestPath){ $it['image'] = imageproc_best_variant($bestPath); $assigned++; }
      $updated++;
    }
    unset($it);
    write_json('catalog.json', $items);
    $msg = 'Attribution auto des images terminée (traités: '.$updated.', assignés: '.$assigned.').';
  }
  if (isset($_POST['action']) && $_POST['action']==='save_image_policy') {
    $enf = !empty($_POST['enforce_domains']);
    $domains = trim($_POST['allowed_domains'] ?? '');
    set_image_policy(['enforce_domains'=>$enf,'allowed_domains'=>$domains]);
    $msg = ($msg? $msg.' ' : '').'Politique d\'images mise à jour.';
  }
  if (isset($_POST['action']) && $_POST['action']==='save_ai') {
    $prov = $_POST['ai_provider'] ?? 'none';
    $oa = trim($_POST['openai_key'] ?? '');
    $st = trim($_POST['stability_key'] ?? '');
    set_ai_config(['provider'=>$prov,'openai_key'=>$oa,'stability_key'=>$st]);
    $msg = ($msg? $msg.' ' : '').'Génération IA: paramètres enregistrés.';
  }
  if (isset($_POST['new_password']) && $_POST['new_password'] !== '') {
    if (strlen($_POST['new_password']) < 6) {
      $msg = 'Le mot de passe doit contenir au moins 6 caractères.';
    } else {
      set_admin_password($_POST['new_password']);
      $msg = 'Mot de passe mis à jour.';
    }
  }
  if (isset($_POST['mail_to']) && $_POST['mail_to'] !== '') {
    set_mail_to($_POST['mail_to']);
    $msg = ($msg ? $msg.' ' : '') . 'Adresse email mise à jour.';
  }
}

?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Paramètres — Admin CinéB</title>
  <link rel="icon" href="../favicon.ico">
  <meta name="robots" content="noindex, nofollow">
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0f0f12;color:#eaeaea;margin:0}
    header{padding:14px 18px;border-bottom:1px solid #2a2b2f}
    .wrap{padding:18px;max-width:720px}
    .card{background:#17181c;border:1px solid #2a2b2f;border-radius:12px;padding:16px;margin-bottom:16px}
    input,button{width:100%;padding:10px;border-radius:8px;border:1px solid #2a2b2f;background:#0f1013;color:#eaeaea}
    button{background:#6a4bc7;border:none;font-weight:700;cursor:pointer}
    .muted{color:#a0a3a8}
  </style>
</head>
<body>
  <header><a href="<?php echo ADMIN_BASE_PATH; ?>/" style="color:#fff;text-decoration:none">← Retour</a></header>
  <div class="wrap">
    <?php if($msg): ?><div class="card" style="border-color:#2f8147;background:#142318">✅ <?php echo htmlspecialchars($msg); ?></div><?php endif; ?>

    <div class="card">
      <h2>Mot de passe admin</h2>
      <form method="post">
        <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
        <label class="muted">Nouveau mot de passe</label>
        <input name="new_password" type="password" placeholder="••••••">
        <div style="height:10px"></div>
        <button type="submit">Mettre à jour</button>
      </form>
  </div>

    <div class="card">
      <h2>Optimisation des images</h2>
      <p class="muted">Détourage, conversions AVIF/WebP, variantes responsives et manifeste.</p>
      <form method="post" onsubmit="return confirm('Lancer l\'optimisation de toutes les images ?');">
        <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
        <input type="hidden" name="action" value="optimize_all">
        <button type="submit" class="btn">Optimiser toutes les images</button>
      </form>
      <p class="muted">Astuce: vous pouvez aussi optimiser à l’upload (case cochée par défaut dans le catalogue).</p>
      <form method="post" style="margin-top:10px" onsubmit="return confirm('Associer automatiquement les meilleures images aux produits ?');">
        <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
        <input type="hidden" name="action" value="assign_images">
        <button type="submit" class="btn">Assigner automatiquement des images (catalogue)</button>
      </form>
    </div>

    <div class="card">
      <h2>Images — mode strict & domaines autorisés</h2>
      <?php $pol = get_image_policy(); ?>
      <form method="post">
        <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
        <input type="hidden" name="action" value="save_image_policy">
        <label class="muted" style="display:flex;align-items:center;gap:8px"><input type="checkbox" name="enforce_domains" <?php echo $pol['enforce_domains']?'checked':''; ?>> N'autoriser l'import que depuis ces domaines</label>
        <label class="muted">Domaines autorisés (un par ligne)</label>
        <textarea name="allowed_domains" rows="4" placeholder="ex:\nsony.com\ncanon.fr\nnikonimglib.com"><?php echo htmlspecialchars(implode("\n", $pol['allowed_domains']??[])); ?></textarea>
        <div style="height:10px"></div>
        <button type="submit">Enregistrer</button>
      </form>
      <p class="muted">Conseil: ajoutez les domaines officiels des fabricants. Avec la Recherche Web filtrée par licence en haut, cela réduit fortement les risques légaux.</p>
    </div>

    <div class="card">
      <h2>Génération d’images (IA)</h2>
      <?php $aicfg = get_ai_config(); ?>
      <form method="post">
        <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
        <input type="hidden" name="action" value="save_ai">
        <label class="muted">Fournisseur IA</label>
        <select name="ai_provider">
          <option value="none" <?php echo $aicfg['provider']==='none'?'selected':''; ?>>Aucun</option>
          <option value="openai" <?php echo $aicfg['provider']==='openai'?'selected':''; ?>>OpenAI (Images)</option>
          <option value="stability" <?php echo $aicfg['provider']==='stability'?'selected':''; ?>>Stability.AI</option>
          <option value="huggingface" <?php echo $aicfg['provider']==='huggingface'?'selected':''; ?>>Hugging Face Inference API</option>
        </select>
        <label class="muted">OpenAI API Key</label>
        <input name="openai_key" value="<?php echo htmlspecialchars($aicfg['openai_key']); ?>" placeholder="sk-...">
        <label class="muted">Stability API Key</label>
        <input name="stability_key" value="<?php echo htmlspecialchars($aicfg['stability_key']); ?>" placeholder="...">
        <label class="muted">Hugging Face API Key</label>
        <input name="hf_key" value="<?php echo htmlspecialchars($aicfg['hf_key'] ?? ''); ?>" placeholder="hf_...">
        <label class="muted">HF Model (ex: stabilityai/sdxl-turbo)</label>
        <input name="hf_model" value="<?php echo htmlspecialchars($aicfg['hf_model'] ?? 'stabilityai/sdxl-turbo'); ?>">
        <div style="height:10px"></div>
        <button type="submit">Enregistrer</button>
      </form>
      <p class="muted">Usage: générez des images “studio” photoréalistes des packs. Vérifiez les CGU du fournisseur. Généralement l’usage commercial est autorisé, mais les prompts ne doivent pas enfreindre de marques/droits.</p>
    </div>

    <div class="card">
      <h2>Recherche d’images (Web)</h2>
      <?php $icfg = get_image_search_config(); ?>
      <form method="post">
        <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
        <input type="hidden" name="action" value="save_image_search">
        <label class="muted">Fournisseur</label>
        <select name="provider">
          <option value="none" <?php echo $icfg['provider']==='none'?'selected':''; ?>>Aucun</option>
          <option value="bing" <?php echo $icfg['provider']==='bing'?'selected':''; ?>>Bing Image Search</option>
          <option value="google" <?php echo $icfg['provider']==='google'?'selected':''; ?>>Google CSE (images)</option>
        </select>
        <label class="muted">Bing API Key</label>
        <input name="bing_key" value="<?php echo htmlspecialchars($icfg['bing_key']); ?>" placeholder="Clé API Bing...">
        <label class="muted">Google API Key</label>
        <input name="google_key" value="<?php echo htmlspecialchars($icfg['google_key']); ?>" placeholder="Clé API Google...">
        <label class="muted">Google CSE CX</label>
        <input name="google_cx" value="<?php echo htmlspecialchars($icfg['google_cx']); ?>" placeholder="ID du moteur (cx)...">
        <label class="muted">Licence (Bing)</label>
        <select name="license">
          <?php $L=[''=>'(Sans filtre)','Public'=>'Domaine public','Share'=>'Libre de partager (non commercial)','ShareCommercially'=>'Libre de partager commercialement','Modify'=>'Libre de modifier (non commercial)','ModifyCommercially'=>'Libre de modifier commercialement']; foreach($L as $k=>$v){ echo '<option value="'.htmlspecialchars($k).'" '.(($icfg['license']??'')===$k?'selected':'').'>'.htmlspecialchars($v)."</option>"; } ?>
        </select>
        <label class="muted">Droits (Google)</label>
        <input name="google_rights" value="<?php echo htmlspecialchars($icfg['google_rights']); ?>" placeholder="ex: cc_publicdomain|cc_attribute">
        <div style="height:10px"></div>
        <button type="submit">Enregistrer</button>
      </form>
      <p class="muted">Activez un fournisseur pour permettre la suggestion/import d’images depuis le web (transparents/PNG lorsque possible).</p>
      <form method="post" style="margin-top:10px" onsubmit="return confirm('Chercher et assigner des images web pour les éléments sans image ?');">
        <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
        <input type="hidden" name="action" value="assign_web">
        <button type="submit" class="btn">Assigner depuis le web (manquants)</button>
      </form>
    </div>

    <div class="card">
      <h2>Notifications email</h2>
      <form method="post">
        <input type="hidden" name="csrf" value="<?php echo htmlspecialchars(csrf_token()); ?>">
        <label class="muted">Recevoir les devis sur</label>
        <input name="mail_to" type="email" required value="<?php echo htmlspecialchars(get_mail_to()); ?>">
        <div style="height:10px"></div>
        <button type="submit">Enregistrer</button>
      </form>
      <p class="muted">Astuce: vous pouvez mettre une adresse de groupe (ex: reservations@votre-domaine) qui transfère vers les personnes concernées.</p>
    </div>

    <div class="card">
      <h2>URL de l’administration</h2>
      <p class="muted">Pour changer l’URL secrète, renommez le dossier <code>office</code> et mettez à jour la constante <code>ADMIN_BASE_PATH</code> dans <code>lib/config.php</code>. Exemple: <code>/desk</code>.</p>
    </div>
  </div>
</body>
</html>
