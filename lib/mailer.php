<?php
require_once __DIR__ . '/config.php';

function mail_send_quote($payload) {
  // Prevent header injection in any user-provided header values
  $safe = function($v){ return preg_replace('/[\r\n]+/', ' ', trim((string)$v)); };
  $to = get_mail_to();
  $subject = '[CinéB] Nouvelle demande de devis';
  $lines = [];
  $lines[] = 'Nouvelle demande reçue:';
  $lines[] = '';
  $lines[] = '• Nom: ' . ($payload['name'] ?? '');
  $lines[] = '• Email: ' . ($payload['email'] ?? '');
  if (!empty($payload['phone'])) $lines[] = '• Téléphone: ' . $payload['phone'];
  if (!empty($payload['items'])) $lines[] = '• Matériel: ' . $payload['items'];
  if (!empty($payload['dates'])) $lines[] = '• Dates: ' . $payload['dates'];
  if (!empty($payload['period'])) $lines[] = '• Période: ' . $payload['period'];
  if (!empty($payload['estimate'])) $lines[] = '• Estimation: ~' . $payload['estimate'] . '€';
  $lines[] = '';
  $lines[] = 'Message:';
  $lines[] = trim($payload['message'] ?? '');
  $lines[] = '';
  $lines[] = '— Envoi automatique CinéB';
  $body = implode("\n", $lines);

  $headers = [];
  $from = 'no-reply@cineb.local';
  $headers[] = 'From: ' . $from;
  if (!empty($payload['email']) && filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
    $headers[] = 'Reply-To: ' . $safe($payload['email']);
  }
  $headers[] = 'Content-Type: text/plain; charset=UTF-8';

  $ok = @mail($to, $subject, $body, implode("\r\n", $headers));
  if (!$ok) {
    // Fallback: log to file, do not fail the request
    $log = '['.date('c').'] mail to '.$to.'\n'.$subject.'\n'.$body."\n\n";
    file_put_contents(data_path('mail.log'), $log, FILE_APPEND);
  }
  return true;
}
