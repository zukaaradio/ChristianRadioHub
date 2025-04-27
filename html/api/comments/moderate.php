<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: PUT');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include models
require_once '../models/PostgresComment.php';

// Start session to check authentication
session_start();

// Check if user is logged in and has admin role
if(!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['message' => 'Unauthorized. Admin privileges required']);
    exit;
}

// Process request
$data = json_decode(file_get_contents("php://input"));

// Validate input
if(!isset($data->id) || !isset($data->status) || empty($data->status)) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

// Validate status value
if(!in_array($data->status, ['approved', 'rejected'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid status value. Must be "approved" or "rejected"']);
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

// Update comment status
$comment->status = $data->status;
if($comment->update_status()) {
    http_response_code(200);
    echo json_encode([
        'message' => 'Comment status updated successfully',
        'comment' => [
            'id' => $comment->id,
            'contentType' => $comment->content_type,
            'contentId' => $comment->content_id,
            'status' => $comment->status
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to update comment status']);
}
?>