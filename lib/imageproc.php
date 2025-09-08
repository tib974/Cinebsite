<?php
require_once __DIR__ . '/util.php';

function imageproc_has($bin){ return is_string($bin) && trim($bin)!=='' && !empty(shell_exec('command -v '.escapeshellarg($bin).' 2>/dev/null')); }

function imageproc_abs($rel){
  $rel = ltrim($rel, '/');
  return __DIR__ . '/../' . $rel;
}

function imageproc_best_candidates($rel){
  $base = preg_replace('~\.[^.]+$~', '', $rel);
  return [
    $base.'-nobg.avif',
    $base.'-nobg.webp',
    $base.'-nobg.png',
    $base.'.avif',
    $base.'.webp',
    $rel
  ];
}

function imageproc_best_variant($rel){
  foreach (imageproc_best_candidates($rel) as $cand){
    if (file_exists(imageproc_abs($cand))) return $cand;
  }
  return $rel;
}

function imageproc_remove_bg($rel){
  $abs = imageproc_abs($rel);
  $base = preg_replace('~\.[^.]+$~', '', $rel);
  $outRel = $base.'-nobg.png';
  $outAbs = imageproc_abs($outRel);
  if (file_exists($outAbs)) return $outRel;
  if (!imageproc_has('rembg')) return $rel;
  // if webp input, convert to png first (requires dwebp)
  if (preg_match('~\.webp$~i', $rel) && imageproc_has('dwebp')){
    $tmp = imageproc_abs($base.'.tmp-rmbg.png');
    @unlink($tmp);
    shell_exec('dwebp '.escapeshellarg($abs).' -o '.escapeshellarg($tmp).' 2>/dev/null');
    if (file_exists($tmp)){
      shell_exec('rembg i '.escapeshellarg($tmp).' '.escapeshellarg($outAbs).' 2>/dev/null');
      @unlink($tmp);
      if (file_exists($outAbs) && filesize($outAbs)>0) return $outRel;
    }
  }
  // default
  shell_exec('rembg i '.escapeshellarg($abs).' '.escapeshellarg($outAbs).' 2>/dev/null');
  if (file_exists($outAbs) && filesize($outAbs)>0) return $outRel;
  @unlink($outAbs);
  return $rel;
}

function imageproc_to_webp($srcRel, $outRel, $width = null){
  $srcAbs = imageproc_abs($srcRel); $outAbs = imageproc_abs($outRel);
  if (file_exists($outAbs)) return true;
  if (imageproc_has('cwebp')){
    $cmd = 'cwebp -q 82 ' . ($width? ('-resize '.intval($width).' 0 ') : '') . escapeshellarg($srcAbs) . ' -o ' . escapeshellarg($outAbs) . ' 2>/dev/null';
    shell_exec($cmd); return file_exists($outAbs);
  }
  if (imageproc_has('magick')){ shell_exec('magick '.escapeshellarg($srcAbs).' '.($width?('-resize '.intval($width).'x '):'').' '.escapeshellarg($outAbs).' 2>/dev/null'); return file_exists($outAbs); }
  return false;
}

function imageproc_to_avif($srcRel, $outRel, $width = null){
  $srcAbs = imageproc_abs($srcRel); $outAbs = imageproc_abs($outRel);
  if (file_exists($outAbs)) return true;
  if (imageproc_has('avifenc')){
    if ($width && imageproc_has('magick')){
      $tmp = imageproc_abs(preg_replace('~\.[^.]+$~','',$srcRel).'.tmp-w'.$width.'.png');
      @unlink($tmp);
      shell_exec('magick '.escapeshellarg($srcAbs).' -resize '.intval($width).'x '.escapeshellarg($tmp).' 2>/dev/null');
      shell_exec('avifenc --min 20 --max 45 --jobs 4 '.escapeshellarg($tmp).' '.escapeshellarg($outAbs).' 2>/dev/null');
      @unlink($tmp);
      return file_exists($outAbs);
    }
    shell_exec('avifenc --min 20 --max 45 --jobs 4 '.escapeshellarg($srcAbs).' '.escapeshellarg($outAbs).' 2>/dev/null');
    return file_exists($outAbs);
  }
  if (imageproc_has('magick')){ shell_exec('magick '.escapeshellarg($srcAbs).' '.($width?('-resize '.intval($width).'x '):'').' '.escapeshellarg($outAbs).' 2>/dev/null'); return file_exists($outAbs); }
  return false;
}

function imageproc_optimize_png($rel){
  $abs = imageproc_abs($rel);
  if (!file_exists($abs)) return false;
  if (imageproc_has('oxipng')){ shell_exec('oxipng -o 4 --strip all -q '.escapeshellarg($abs).' 2>/dev/null'); return true; }
  if (imageproc_has('optipng')){ shell_exec('optipng -o2 -quiet '.escapeshellarg($abs).' 2>/dev/null'); return true; }
  return false;
}

function imageproc_generate_responsive($rel){
  $base = preg_replace('~\.[^.]+$~', '', $rel);
  $src = file_exists(imageproc_abs($base.'-nobg.png')) ? $base.'-nobg.png' : $rel;
  foreach ([320,640,960,1280] as $w){
    imageproc_to_webp($src, $base.'-w'.$w.'.webp', $w);
    imageproc_to_avif($src, $base.'-w'.$w.'.avif', $w);
  }
}

function imageproc_process_all($rel){
  // remove background (if possible), create webp/avif, responsive, optimize png
  $after = imageproc_remove_bg($rel);
  $base = preg_replace('~\.[^.]+$~','',$rel);
  // Create webp/avif for original (JPG/PNG)
  if (preg_match('~\.(jpe?g|png)$~i', $rel)){
    imageproc_to_webp($rel, $base.'.webp');
    imageproc_to_avif($rel, $base.'.avif');
  }
  // Generate responsive sizes (uses -nobg if present)
  imageproc_generate_responsive($rel);
  // Optimize pngs
  if (file_exists(imageproc_abs($base.'-nobg.png'))) imageproc_optimize_png($base.'-nobg.png');
  if (preg_match('~\.png$~i', $rel)) imageproc_optimize_png($rel);
  return imageproc_best_variant($rel);
}

function imageproc_update_manifest_entry($rel){
  $manifestPath = data_path('image_manifest.json');
  $data = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : [];
  if (!is_array($data)) $data = [];
  $best = imageproc_best_variant($rel);
  // sizes strings
  $base = preg_replace('~\.[^.]+$~','',$rel);
  $sizes = ['avif'=>[], 'webp'=>[]];
  foreach ([320,640,960,1280] as $w){
    foreach (['-nobg-w'.$w.'.avif','-w'.$w.'.avif'] as $suf){ if (file_exists(imageproc_abs($base.$suf))) { $sizes['avif'][] = $base.$suf.' '.$w.'w'; break; } }
    foreach (['-nobg-w'.$w.'.webp','-w'.$w.'.webp'] as $suf){ if (file_exists(imageproc_abs($base.$suf))) { $sizes['webp'][] = $base.$suf.' '.$w.'w'; break; } }
  }
  $entry = ['best'=>$best];
  $hasSizes = (!empty($sizes['avif']) || !empty($sizes['webp']));
  if ($hasSizes) {
    $entry['sizes'] = [];
    if (!empty($sizes['avif'])) $entry['sizes']['avif'] = implode(',', $sizes['avif']);
    if (!empty($sizes['webp'])) $entry['sizes']['webp'] = implode(',', $sizes['webp']);
  }
  $data[$rel] = $entry;
  file_put_contents($manifestPath, json_encode($data, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
}

function imageproc_build_manifest(){
  $roots = [ 'assets/products', 'assets/realisations', 'assets/uploads' ];
  $out = [];
  foreach ($roots as $root){
    if (!is_dir(__DIR__.'/../'.$root)) continue;
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(__DIR__.'/../'.$root, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $file){
      $path = str_replace(__DIR__.'/../','', $file->getPathname());
      if (!preg_match('~\.(jpe?g|png|webp|avif)$~i', $path)) continue;
      $base = preg_replace('~\.[^.]+$~','',$path);
      $best = imageproc_best_variant($path);
      $sizes = ['avif'=>[], 'webp'=>[]];
      foreach ([320,640,960,1280] as $w){
        foreach (['-nobg-w'.$w.'.avif','-w'.$w.'.avif'] as $suf){ if (file_exists(imageproc_abs($base.$suf))) { $sizes['avif'][] = $base.$suf.' '.$w.'w'; break; } }
        foreach (['-nobg-w'.$w.'.webp','-w'.$w.'.webp'] as $suf){ if (file_exists(imageproc_abs($base.$suf))) { $sizes['webp'][] = $base.$suf.' '.$w.'w'; break; } }
      }
      $entry = ['best'=>$best];
      if (!empty($sizes['avif']) || !empty($sizes['webp'])){
        $entry['sizes'] = [];
        if (!empty($sizes['avif'])) $entry['sizes']['avif'] = implode(',', $sizes['avif']);
        if (!empty($sizes['webp'])) $entry['sizes']['webp'] = implode(',', $sizes['webp']);
      }
      $out[$path] = $entry;
    }
  }
  file_put_contents(data_path('image_manifest.json'), json_encode($out, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
}

// Compose a pack image from a list of component images (prefer -nobg), on studio background
function imageproc_compose_pack($slug, $components, $opts = []){
  if (!imageproc_has('magick')) return false;
  $bg = $opts['bg'] ?? '#f4f6f9';
  $tile = $opts['tile'] ?? '3x2';
  $size = $opts['size'] ?? '400x400+40+40'; // geometry WxH+X+Y
  $outRel = 'assets/products/'.preg_replace('~[^a-z0-9_-]+~','-', strtolower($slug)).'-studio.png';
  $outAbs = imageproc_abs($outRel);
  $args = [];
  foreach ($components as $rel){
    $best = imageproc_best_variant($rel);
    $base = preg_replace('~\.[^.]+$~','',$best);
    $nobg = $base.'-nobg.png';
    if (!file_exists(imageproc_abs($nobg))){ imageproc_process_all($best); }
    $use = file_exists(imageproc_abs($nobg)) ? $nobg : $best;
    $args[] = escapeshellarg(imageproc_abs($use));
  }
  if (!$args) return false;
  $cmd = 'magick montage '.implode(' ', $args).' -background '.escapeshellarg($bg).' -gravity center -geometry '.escapeshellarg($size).' -tile '.escapeshellarg($tile).' '.escapeshellarg($outAbs).' 2>/dev/null';
  shell_exec($cmd);
  if (!file_exists($outAbs) || filesize($outAbs)<=0) return false;
  imageproc_update_manifest_entry($outRel);
  return $outRel;
}
