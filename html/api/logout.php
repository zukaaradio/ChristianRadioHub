<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Start session
session_start();

// Destroy session
session_destroy();

// Success response
http_response_code(200);
echo json_encode(['message' => 'Logout successful']);
?>