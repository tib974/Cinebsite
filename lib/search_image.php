<?php
require_once __DIR__ . '/config.php';

function http_get_json($url, $headers = []){
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_TIMEOUT, 8);
  curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
  if (!empty($headers)) curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  $out = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($code>=200 && $code<300){ $j = json_decode($out, true); return is_array($j)? $j: null; }
  return null;
}

function image_search_web($query, $limit = 8, $opts = []){
  $cfg = get_image_search_config();
  $prov = $cfg['provider'] ?? 'none';
  $items = [];
  $exact = !empty($opts['exact']);
  $transparent = !empty($opts['transparent']);
  $size = $opts['size'] ?? 'Large';
  $q = trim($query);
  if ($exact && $q!=='') $q = '"'.str_replace('"','\"',$q).'"';
  if ($prov === 'bing' && !empty($cfg['bing_key'])){
    $params = [
      'q' => $q,
      'count' => max(1,min(50,$limit)),
      'safeSearch' => 'Strict',
      'imageType' => $transparent? 'Transparent':'Photo',
      'size' => $size
    ];
    if (!empty($cfg['license'])){ $params['license'] = $cfg['license']; }
    $url = 'https://api.bing.microsoft.com/v7.0/images/search?'.http_build_query($params);
    $j = http_get_json($url, ['Ocp-Apim-Subscription-Key: '.$cfg['bing_key']]);
    if ($j && !empty($j['value'])){
      foreach ($j['value'] as $v){
        $items[] = [
          'url' => $v['contentUrl'] ?? '',
          'thumb' => $v['thumbnailUrl'] ?? '',
          'width' => $v['width'] ?? 0,
          'height' => $v['height'] ?? 0,
          'contentType' => $v['encodingFormat'] ?? '',
          'source' => 'bing'
        ];
      }
    }
  } elseif ($prov === 'google' && !empty($cfg['google_key']) && !empty($cfg['google_cx'])){
    $params = [
      'key' => $cfg['google_key'],
      'cx' => $cfg['google_cx'],
      'searchType' => 'image',
      'q' => $q,
      'num' => max(1,min(10,$limit)),
    ];
    if ($transparent) $params['imgColorType'] = 'trans';
    if (!empty($cfg['google_rights'])) $params['rights'] = $cfg['google_rights'];
    $url = 'https://www.googleapis.com/customsearch/v1?'.http_build_query($params);
    $j = http_get_json($url);
    if ($j && !empty($j['items'])){
      foreach ($j['items'] as $it){
        $p = $it['image'] ?? [];
        $items[] = [
          'url' => $it['link'] ?? '',
          'thumb' => $it['image']['thumbnailLink'] ?? '',
          'width' => $p['width'] ?? 0,
          'height' => $p['height'] ?? 0,
          'contentType' => $p['mime'] ?? '',
          'source' => 'google'
        ];
      }
    }
  }
  return $items;
}
