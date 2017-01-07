<?php
  if (is_file('lib/class.phpmailer.php')) {
    require_once("lib/class.phpmailer.php");
  }

  if (is_file('lib/class.smtp.php')) {
    require_once("lib/class.smtp.php");
  }

  $http_host = $_SERVER['HTTP_HOST'];

  if ( substr($http_host, 0, 4)=='www.') {
    $host_name = substr($http_host, 4);
  } else {
    $host_name = $http_host;
  }

  define ('HTTP_SERVER', 'http://' . $http_host . '/');
  define ('HOST_NAME', $host_name);

  $post = array( 
    'host_name'     => HOST_NAME,
    'host_dir'      => HTTP_SERVER,
    );

  if (!empty($_POST["user_form"])) {
    $post['user_form'] = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
  }

  if (!empty($_POST["email"])) {
    $post['user_email'] = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
  }

  if (!empty($_POST["name"])) {
    $post['user_name'] = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
  }

  if (!empty($_POST["phone"])) {
    $post['user_phone'] = filter_input(INPUT_POST,'phone', FILTER_SANITIZE_STRING);
  }

  if (!empty($_POST["message"])) {
    $post['user_message'] = filter_input(INPUT_POST, 'message', FILTER_SANITIZE_STRING);
  }

  // Insert form data into html
  $patterns = array();
  $replacements = array();
  foreach ($post as $key => $value) {
    $patterns[] = '/\{%' . $key .  '\%}/i'; // varible => {$varible}
    $replacements[] = $value;
  }

  // html template
  $body = '';
  if (is_file('html_template.html')) {
    $html_template = file_get_contents('html_template.html');
    $body = preg_replace($patterns, $replacements, $html_template);  
    $body = preg_replace('/\{%(.+)%\}/', '', $body); // remove all beetween "{% %}"
  }

  // If mailer not supported html
  $altBody = '';
  if (is_file('no_html.html')) {
    $no_html_template = file_get_contents('no_html.html');
    $altBody = preg_replace($patterns, $replacements, $no_html_template);
    $altBody = preg_replace('/\{%(.+)%\}/', '', $altBody); // remove all beetween "{% %}"
  }
  $mail = new PHPMailer();

  $mail->CharSet      = 'UTF-8';

  //if mail is SMTP
  /*
  $mail->isSMTP();
  $mail->Host         = 'smtp.server.com';
  $mail->SMTPAuth     = true;
  $mail->SMTPSecure   = 'ssl';
  $mail->Port         = 465;
  $mail->Username     = 'name@mail.com';
  $mail->Password     = 'password';
  */

  $mail->IsSendmail();

  $from = 'no-reply@tagopen.com';
  $to = "Artem2431@gmail.com";
  $mail->SetFrom($from, HOST_NAME);
  $mail->AddAddress($to, 'Name Surname');

  $mail->isHTML(false);

  $mail->Subject      = "Новая заявка с сайта";
  $mail->Body         = $body;
  $mail->AltBody      = $altBody;

  if(!$mail->send()) {
    echo 'Что-то пошло не так. ' . $mail->ErrorInfo;
    return false;
  } else {
    echo 'Сообщение отправлено';
    return true;
  }

?>