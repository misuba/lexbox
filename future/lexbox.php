<?php
require 'Slim/Slim.php';
\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim(array(
  'mode' => 'development',
  'debug' => true
));

$app->get('/', function() {
  
});

$app->run();

?>