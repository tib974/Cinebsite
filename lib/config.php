<?php
// Global configuration for CinéB local backend

// Admin account
define('ADMIN_USER', 'artboy');

// File where the hashed password is stored. If it doesn't exist, a default will be created.
define('ADMIN_PASS_FILE', __DIR__ . '/../data/admin.pass');

// Default initial password (only used to bootstrap the hash file if missing)
define('ADMIN_BOOTSTRAP_PASSWORD', 'cineb25');

// Data directory
define('DATA_DIR', __DIR__ . '/../data');

// Public email recipient for quotes (can be changed later in the admin)
define('MAIL_TO_FILE', __DIR__ . '/../data/mail_to.txt');
define('DEFAULT_MAIL_TO', 'grondin.thibaut@gmail.com');

// Site info
define('SITE_NAME', 'CinéB');

// Admin base path (folder name). To change the admin URL, rename the folder and update this if needed.
define('ADMIN_BASE_PATH', '/office');

// Ensure data directory exists
if (!is_dir(DATA_DIR)) {
  @mkdir(DATA_DIR, 0775, true);
}

// Ensure admin password hash exists
if (!file_exists(ADMIN_PASS_FILE)) {
  $hash = password_hash(ADMIN_BOOTSTRAP_PASSWORD, PASSWORD_DEFAULT);
  file_put_contents(ADMIN_PASS_FILE, $hash . "\n");
}

// Ensure mail_to file exists
if (!file_exists(MAIL_TO_FILE)) {
  file_put_contents(MAIL_TO_FILE, DEFAULT_MAIL_TO . "\n");
}

function get_admin_hash() {
  $hash = trim(@file_get_contents(ADMIN_PASS_FILE) ?: '');
  return $hash;
}

function set_admin_password($newPassword) {
  $hash = password_hash($newPassword, PASSWORD_DEFAULT);
  file_put_contents(ADMIN_PASS_FILE, $hash . "\n");
  return true;
}

function get_mail_to() {
  $to = trim(@file_get_contents(MAIL_TO_FILE) ?: DEFAULT_MAIL_TO);
  return $to;
}

function set_mail_to($to) {
  file_put_contents(MAIL_TO_FILE, trim($to) . "\n");
  return true;
}

// Image search provider configuration (stored in data/image_search.json)
function get_image_search_config() {
  $file = data_path('image_search.json');
  if (!file_exists($file)) return ['provider'=>'none','bing_key'=>'','google_key'=>'','google_cx'=>'','license'=>'','google_rights'=>''];
  $raw = @file_get_contents($file);
  $j = json_decode($raw, true);
  if (!is_array($j)) $j = [];
  return array_merge(['provider'=>'none','bing_key'=>'','google_key'=>'','google_cx'=>'','license'=>'','google_rights'=>''], $j);
}
function set_image_search_config($cfg) {
  if (!is_array($cfg)) return false;
  $file = data_path('image_search.json');
  @file_put_contents($file, json_encode([
    'provider' => $cfg['provider'] ?? 'none',
    'bing_key' => $cfg['bing_key'] ?? '',
    'google_key' => $cfg['google_key'] ?? '',
    'google_cx' => $cfg['google_cx'] ?? '',
    'license' => $cfg['license'] ?? '',
    'google_rights' => $cfg['google_rights'] ?? ''
  ], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
  return true;
}

// Image policy (domains, enforcement)
function get_image_policy(){
  $file = data_path('image_policy.json');
  $def = ['enforce_domains'=>false,'allowed_domains'=>[]];
  if (!file_exists($file)) return $def;
  $raw = @file_get_contents($file); $j=json_decode($raw,true); if(!is_array($j)) return $def;
  if (!isset($j['allowed_domains']) || !is_array($j['allowed_domains'])) $j['allowed_domains']=[];
  $j['allowed_domains'] = array_values(array_filter(array_map('trim', $j['allowed_domains'])));
  $j['enforce_domains'] = !empty($j['enforce_domains']);
  return $j;
}
function set_image_policy($arr){
  if(!is_array($arr)) return false;
  $out = ['enforce_domains'=> !empty($arr['enforce_domains']),'allowed_domains'=>[]];
  if (!empty($arr['allowed_domains'])){
    if (is_string($arr['allowed_domains'])){
      $list = preg_split('~[\r\n,]+~', $arr['allowed_domains']);
    } else { $list = $arr['allowed_domains']; }
    $out['allowed_domains'] = array_values(array_filter(array_map('trim', $list)));
  }
  @file_put_contents(data_path('image_policy.json'), json_encode($out, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
  return true;
}

// AI generation provider
function get_ai_config(){
  $file = data_path('ai_config.json');
  $def = ['provider'=>'none','openai_key'=>'','stability_key'=>'','hf_key'=>'','hf_model'=>'stabilityai/sdxl-turbo'];
  if (!file_exists($file)) return $def;
  $raw=@file_get_contents($file); $j=json_decode($raw,true); if(!is_array($j)) return $def; return array_merge($def,$j);
}
function set_ai_config($cfg){
  if(!is_array($cfg)) return false;
  $out=[
    'provider'=>$cfg['provider']??'none',
    'openai_key'=>$cfg['openai_key']??'',
    'stability_key'=>$cfg['stability_key']??'',
    'hf_key'=>$cfg['hf_key']??'',
    'hf_model'=>$cfg['hf_model']??'stabilityai/sdxl-turbo'
  ];
  @file_put_contents(data_path('ai_config.json'), json_encode($out, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
  return true;
}
