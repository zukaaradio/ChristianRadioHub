<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include user model
require_once 'models/PostgresUser.php';

// Process registration
$data = json_decode(file_get_contents("php://input"));

// Validate input
if(!isset($data->username) || !isset($data->password) || !isset($data->full_name)) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

// Initialize user object
$user = new PostgresUser();

// Check if username already exists
$user->username = $data->username;
if($user->read_by_username()) {
    http_response_code(409);
    echo json_encode(['message' => 'Username already exists']);
    exit;
}

// Set user properties
$user->username = $data->username;
$user->password = password_hash($data->password, PASSWORD_DEFAULT);
$user->full_name = $data->full_name;
$user->role = isset($data->role) ? $data->role : 'user'; // Default to 'user' role

// Create the user
if($user->create()) {
    // Start session
    session_start();
    
    // Set session variables
    $_SESSION['user_id'] = $user->id;
    $_SESSION['username'] = $user->username;
    $_SESSION['full_name'] = $user->full_name;
    $_SESSION['role'] = $user->role;
    
    // Create token for client
    $token = bin2hex(random_bytes(32));
    $_SESSION['token'] = $token;
    
    // Success response
    http_response_code(201);
    echo json_encode([
        'message' => 'User created successfully',
        'token' => $token,
        'user' => [
            'id' => $user->id,
            'username' => $user->username,
            'fullName' => $user->full_name,
            'role' => $user->role
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to create user']);
}
?>