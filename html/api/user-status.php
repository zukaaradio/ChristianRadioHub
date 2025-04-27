<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Start session
session_start();

// Check if user is logged in
if(isset($_SESSION['user_id'])) {
    // User is logged in
    http_response_code(200);
    echo json_encode([
        'loggedIn' => true,
        'userId' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'fullName' => $_SESSION['full_name'] ?? $_SESSION['username'],
        'role' => $_SESSION['role'] ?? 'user'
    ]);
} else {
    // User is not logged in
    http_response_code(200);
    echo json_encode([
        'loggedIn' => false
    ]);
}
?>