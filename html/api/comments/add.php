<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include models
require_once '../models/PostgresComment.php';

// Start session to check authentication
session_start();

// Check if user is logged in
if(!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Please login to comment']);
    exit;
}

// Process request
$data = json_decode(file_get_contents("php://input"));

// Validate input
if(!isset($data->content_type) || !isset($data->content_id) || !isset($data->comment_text) || empty($data->comment_text)) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

// Initialize comment object
$comment = new PostgresComment();
$comment->content_type = $data->content_type;
$comment->content_id = $data->content_id;
$comment->user_id = $_SESSION['user_id'];
$comment->comment_text = $data->comment_text;

// Set status based on system configuration (auto-approve or pending)
// For a Christian radio station, we might want to moderate comments
$comment->status = 'pending';  // Could be 'approved' for auto-approval

// Check if this is a reply to another comment
$comment->parent_id = isset($data->parent_id) ? $data->parent_id : null;

// Create comment
if($comment->create()) {
    // Get the user's name for the response
    $comment->username = $_SESSION['username'];
    $comment->full_name = $_SESSION['full_name'];
    
    http_response_code(201);
    echo json_encode([
        'message' => 'Comment added successfully. It will be visible after moderation.',
        'comment' => [
            'id' => $comment->id,
            'contentType' => $comment->content_type,
            'contentId' => $comment->content_id,
            'userId' => $comment->user_id,
            'username' => $comment->username,
            'fullName' => $comment->full_name,
            'commentText' => $comment->comment_text,
            'status' => $comment->status,
            'parentId' => $comment->parent_id,
            'createdAt' => $comment->created_at
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to add comment']);
}
?>