<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: DELETE');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include models
require_once '../models/PostgresLike.php';

// Start session to check authentication
session_start();

// Check if user is logged in
if(!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Please login to unlike content']);
    exit;
}

// Process request
$data = json_decode(file_get_contents("php://input"));

// Validate input
if(!isset($data->content_type) || !isset($data->content_id)) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

// Initialize like object
$like = new PostgresLike();
$like->content_type = $data->content_type;
$like->content_id = $data->content_id;
$like->user_id = $_SESSION['user_id'];

// Check if user has liked this content
if(!$like->has_user_liked()) {
    http_response_code(400);
    echo json_encode(['message' => 'You have not liked this content']);
    exit;
}

// Delete like (unlike)
if($like->delete()) {
    // Get updated like count
    $like_count = $like->count_by_content();
    
    http_response_code(200);
    echo json_encode([
        'message' => 'Content unliked successfully',
        'likeCount' => $like_count
    ]);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to unlike content']);
}
?>