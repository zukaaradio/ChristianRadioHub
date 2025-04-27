<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include models
require_once '../models/PostgresLike.php';

// Start session to check authentication
session_start();

// Process request - using GET parameters
if(!isset($_GET['content_type']) || !isset($_GET['content_id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

// Initialize like object
$like = new PostgresLike();
$like->content_type = $_GET['content_type'];
$like->content_id = $_GET['content_id'];

// Get like count
$like_count = $like->count_by_content();

// Check if user has liked if logged in
$has_liked = false;
if(isset($_SESSION['user_id'])) {
    $like->user_id = $_SESSION['user_id'];
    $has_liked = $like->has_user_liked();
}

// Return info
http_response_code(200);
echo json_encode([
    'likeCount' => $like_count,
    'hasLiked' => $has_liked
]);
?>