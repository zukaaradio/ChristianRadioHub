<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Start session to check authentication
session_start();

// Check if user is logged in
if(!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit;
}

// Check if OpenAI API key is configured
$apiKey = getenv('OPENAI_API_KEY');

if(!$apiKey) {
    http_response_code(404);
    echo json_encode(['message' => 'OpenAI API key not configured', 'configured' => false]);
} else {
    http_response_code(200);
    echo json_encode(['message' => 'OpenAI API key is configured', 'configured' => true]);
}
?>