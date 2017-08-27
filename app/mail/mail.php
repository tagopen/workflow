<?php

  if (is_file('lib/class.phpmailer.php')) {
    require_once("lib/class.phpmailer.php");
  }
  
  if (is_file('lib/class.smtp.php')) {
    require_once("lib/class.smtp.php");
  }
  
  if (is_file('lib/newsletter.php')) {
    require_once("lib/newsletter.php");
  }

  $http_host = $_SERVER["HTTP_HOST"];
  $body = "";
  $post_data = array();

  if ( substr($http_host, 0, 4)=="www.") {
    $host_name = substr($http_host, 4);
  } else {
    $host_name = $http_host;
  }
  if (isset($_SERVER["HTTP_REFERER"])) {
    $http_referer = $_SERVER["HTTP_REFERER"];
  } else {
    $http_referer = "";
  }
  define ("HTTP_SERVER", "http://" . $http_host . "/");
  define ("HOST_NAME", $host_name);
  define ("HTTP_REFERER", $http_referer);
  $post = array( 
    "host_name"     => HOST_NAME,
    "host_dir"      => HTTP_SERVER,
    "host_referer"  => HTTP_REFERER
  );

  $_POST = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);

  if (!$_POST) {
    echo "Форма пустая!";
    exit;
  }
  
  //header("Content-Type: text/html; charset=utf-8");
  //var_dump($_POST);
  //exit;

  if ( (!empty($_POST["form"])) && (isset($_POST["form"])) ) {
    $post["user_form"] = $_POST["form"];
    $body .= "Форма: " . $post["user_form"] . chr(10) . chr(13);
    $post_data["Форма:"] = $post["user_form"];
  }

  if ( (!empty($_POST["email"])) && (isset($_POST["email"])) ) {
    $post["user_email"] = $_POST["email"];
    $body .= "Email: " . $post["user_email"] . chr(10) . chr(13);
    $post_data["Email:"] = $post["user_email"];
  }

  if ( (!empty($_POST["phone"])) && (isset($_POST["phone"])) ) {
    $post["user_phone"] = $_POST["phone"];
    $body .= "Телефон: " . $post["user_phone"] . chr(10) . chr(13);
    $post_data["Телефон:"] = $post["user_phone"];
  }

  if ( (!empty($_POST["name"])) && (isset($_POST["name"])) ) {
    $post["user_name"] = $_POST["name"];
    $body .= "Имя: " . $post["user_name"] . chr(10) . chr(13);
    $post_data["Имя:"] = $post["user_name"];
  }

  if ( (!empty($_POST["message"])) && (isset($_POST["message"])) ) {
    $post["user_message"] = $_POST["message"];
    $body .= "Сообщение: " . $post["user_message"] . chr(10) . chr(13);
    $post_data["Сообщение:"] = $post["user_message"];
  }

  if ( (!empty($_POST["method"])) && (isset($_POST["method"])) ) {
    $post["user_method"] = $_POST["method"];
    $body .= "Как связаться: " . $post["user_method"] . chr(10) . chr(13);
    $post_data["Как связаться:"] = $post["user_method"];
  }

  if ( (!empty($_POST["time"])) && (isset($_POST["time"])) ) {
    $post["user_time"] = $_POST["time"];
    $body .= "Удобное время: " . $post["user_time"] . chr(10) . chr(13);
    $post_data["Удобное время:"] = $post["user_time"];
  }

  if ( !empty($_POST["period"])  && (isset($_POST["period"])) ) {
    if (is_array($_POST['period'])) {
      $post["period"] = implode(", ", $_POST["period"]);
    } else {
      $post["period"] = $_POST["period"];
    }
    $body .= "Когда позвонить: " . $post["period"] . chr(10) . chr(13);
    $post_data["Когда позвонить:"] = $post["period"];
  }

  if ( !empty($_POST["material"])  && (isset($_POST["material"])) ) {
    if (is_array($_POST['material'])) {
      $post["material"] = implode(", ", $_POST["material"]);
    } else {
      $post["material"] = $_POST["material"];
    }
    $body .= "Чем зашивать: " . $post["material"] . chr(10) . chr(13);
    $post_data["Чем зашивать:"] = $post["material"];
  }

  if ( (!empty($_POST["range1"])) && (isset($_POST["range1"])) ) {
    $post["user_range1"] = $_POST["range1"];
    $body .= "Длина ворот: " . $post["user_range1"] . chr(10) . chr(13);
    $post_data["Длина ворот:"] = $post["user_range1"];
  }

  if ( (!empty($_POST["range2"])) && (isset($_POST["range2"])) ) {
    $post["user_range2"] = $_POST["range2"];
    $body .= "Высота ворот: " . $post["user_range2"] . chr(10) . chr(13);
    $post_data["Высота ворот:"] = $post["user_range2"];
  }

  $body .= "Форма отправлена с сайта: " . $post["host_referer"];
  $post_data["Форма отправлена с сайта:"] = $post["host_referer"];

  $mail = new PHPMailer();
  $mail->CharSet = "UTF-8";
  $mail->IsSendmail();

  $from = "no-repeat@" . HOST_NAME;
  $mail->SetFrom($from, HOST_NAME);
  $mail->AddAddress("Artem2431@gmail.com");
  $mail->AddAddress("Marchik88@rambler.ru");
  $mail->isHTML(true);
  $mail->Subject      = HOST_NAME;
  $NewsLetterClass    = new NewsLetterClass();
  $mail->Body         = $NewsLetterClass->generateHTMLLetter($post_data);
  $mail->AltBody      = $body;

  if(!$mail->send()) {
    echo "Что-то пошло не так. " . $mail->ErrorInfo;
    return false;
  } else {
    header("Location: ../success.html");
    return true;
  }
?>
