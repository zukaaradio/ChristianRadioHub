<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include models
require_once '../models/PostgresComment.php';

// Process request - using GET parameters
if(!isset($_GET['content_type']) || !isset($_GET['content_id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

// Initialize comment object
$comment = new PostgresComment();
$comment->content_type = $_GET['content_type'];
$comment->content_id = $_GET['content_id'];

// Check if we want a hierarchical view with replies
$with_replies = isset($_GET['with_replies']) && $_GET['with_replies'] === 'true';

// Get comments
if($with_replies) {
    $result = $comment->read_by_content_with_replies();
} else {
    $result = $comment->read_by_content();
}

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
    
    // Structure as a threaded hierarchy if requested
    if($with_replies) {
        $threaded_comments = array();
        $comment_map = array();
        
        // First, map all comments by their ID
        foreach($comments_arr as $comment) {
            $comment['replies'] = array();
            $comment_map[$comment['id']] = $comment;
        }
        
        // Now build the hierarchy
        foreach($comments_arr as $comment) {
            if($comment['parentId'] === null) {
                // This is a top-level comment
                $threaded_comments[] = &$comment_map[$comment['id']];
            } else {
                // This is a reply, add it to its parent
                $comment_map[$comment['parentId']]['replies'][] = &$comment_map[$comment['id']];
            }
        }
        
        // Return structured comments
        http_response_code(200);
        echo json_encode($threaded_comments);
    } else {
        // Return flat list
        http_response_code(200);
        echo json_encode($comments_arr);
    }
    
} else {
    // No comments found
    http_response_code(200);
    echo json_encode(array());
}
?>