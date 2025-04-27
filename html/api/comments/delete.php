<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: DELETE');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include models
require_once '../models/PostgresComment.php';

// Start session to check authentication
session_start();

// Check if user is logged in
if(!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Please login to manage comments']);
    exit;
}

// Process request
$data = json_decode(file_get_contents("php://input"));

// Validate input
if(!isset($data->id)) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing comment ID']);
    exit;
}

// Initialize comment object
$comment = new PostgresComment();
$comment->id = $data->id;

// Check if comment exists
if(!$comment->read_single()) {
    http_response_code(404);
    echo json_encode(['message' => 'Comment not found']);
    exit;
}

// Check if user is admin or the owner of the comment
$is_admin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
$is_owner = $comment->user_id == $_SESSION['user_id'];

if(!$is_admin && !$is_owner) {
    http_response_code(403);
    echo json_encode(['message' => 'You do not have permission to delete this comment']);
    exit;
}

// Delete comment
if($comment->delete()) {
    http_response_code(200);
    echo json_encode([
        'message' => 'Comment deleted successfully'
    ]);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to delete comment']);
}
?>