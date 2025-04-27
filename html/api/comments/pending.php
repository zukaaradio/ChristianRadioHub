<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
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

// Initialize comment object
$comment = new PostgresComment();

// Get pending comments
$result = $comment->read_pending();

// Check if any comments exist
$num = $result->rowCount();

if($num > 0) {
    // Comments array
    $comments_arr = array();
    
    // Retrieve table contents
    while($row = $result->fetch()) {
        $comment_item = array(
            'id' => $row['id'],
            'contentType' => $row['content_type'],
            'contentId' => $row['content_id'],
            'userId' => $row['user_id'],
            'username' => $row['username'],
            'fullName' => $row['full_name'],
            'commentText' => $row['comment_text'],
            'status' => $row['status'],
            'parentId' => $row['parent_id'],
            'createdAt' => $row['created_at']
        );
        
        // Push to array
        array_push($comments_arr, $comment_item);
    }
    
    // Return comments
    http_response_code(200);
    echo json_encode($comments_arr);
    
} else {
    // No pending comments found
    http_response_code(200);
    echo json_encode(array());
}
?>