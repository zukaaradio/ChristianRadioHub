<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include user model
require_once 'models/User.php';

// Process login
$data = json_decode(file_get_contents("php://input"));

// Validate input
if(!isset($data->username) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

// Initialize user object
$user = new User();
$user->username = $data->username;

// Verify user exists
if($user->read_by_username()) {
    // Verify password
    if(password_verify($data->password, $user->password)) {
        // Start session
        session_start();
        
        // Set session variables
        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['fullName'] = $user->fullName;
        $_SESSION['role'] = $user->role;
        
        // Create token for client
        $token = bin2hex(random_bytes(32));
        $_SESSION['token'] = $token;
        
        // Success response
        http_response_code(200);
        echo json_encode([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'fullName' => $user->fullName,
                'role' => $user->role
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid credentials']);
    }
} else {
    http_response_code(401);
    echo json_encode(['message' => 'Invalid credentials']);
}
?>