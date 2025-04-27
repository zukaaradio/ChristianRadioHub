/**
 * Engagement features (likes and comments) for Christian radio platform
 */

// API URLs
const LIKE_API_URL = '/api/likes';
const COMMENT_API_URL = '/api/comments';

/**
 * Likes functionality
 */
const EngagementLikes = {
    /**
     * Get like info (count and whether current user has liked)
     * @param {string} contentType - Type of content (show, stream, etc)
     * @param {number} contentId - ID of the content
     * @returns {Promise} - Contains like count and hasLiked status
     */
    getLikeInfo: async function(contentType, contentId) {
        try {
            const response = await fetch(`${LIKE_API_URL}/info.php?content_type=${contentType}&content_id=${contentId}`);
            if (!response.ok) {
                throw new Error('Failed to get like info');
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting like info:', error);
            return { likeCount: 0, hasLiked: false };
        }
    },
    
    /**
     * Like content
     * @param {string} contentType - Type of content (show, stream, etc)
     * @param {number} contentId - ID of the content
     * @returns {Promise} - Contains like info and status
     */
    likeContent: async function(contentType, contentId) {
        try {
            const response = await fetch(`${LIKE_API_URL}/add.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content_type: contentType, content_id: contentId }),
                credentials: 'include'
            });
            
            if (response.status === 401) {
                showLoginPrompt();
                return null;
            }
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to like content');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error liking content:', error);
            showNotification(error.message || 'Failed to like content', 'error');
            return null;
        }
    },
    
    /**
     * Unlike content
     * @param {string} contentType - Type of content (show, stream, etc)
     * @param {number} contentId - ID of the content
     * @returns {Promise} - Contains like count and status
     */
    unlikeContent: async function(contentType, contentId) {
        try {
            const response = await fetch(`${LIKE_API_URL}/remove.php`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content_type: contentType, content_id: contentId }),
                credentials: 'include'
            });
            
            if (response.status === 401) {
                showLoginPrompt();
                return null;
            }
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to unlike content');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error unliking content:', error);
            showNotification(error.message || 'Failed to unlike content', 'error');
            return null;
        }
    },
    
    /**
     * Initialize like button for a content
     * @param {string} buttonId - ID of the like button element
     * @param {string} countId - ID of the like count element
     * @param {string} contentType - Type of content (show, stream, etc)
     * @param {number} contentId - ID of the content
     */
    initLikeButton: function(buttonId, countId, contentType, contentId) {
        const likeButton = document.getElementById(buttonId);
        const likeCount = document.getElementById(countId);
        
        if (!likeButton || !likeCount) return;
        
        // Get initial like info
        this.getLikeInfo(contentType, contentId).then(info => {
            likeCount.textContent = info.likeCount;
            if (info.hasLiked) {
                likeButton.classList.add('liked');
                likeButton.innerHTML = '<i class="fas fa-heart"></i> Liked';
            } else {
                likeButton.classList.remove('liked');
                likeButton.innerHTML = '<i class="far fa-heart"></i> Like';
            }
        });
        
        // Add click event
        likeButton.addEventListener('click', async () => {
            const isLiked = likeButton.classList.contains('liked');
            
            if (isLiked) {
                // Unlike
                const result = await this.unlikeContent(contentType, contentId);
                if (result) {
                    likeCount.textContent = result.likeCount;
                    likeButton.classList.remove('liked');
                    likeButton.innerHTML = '<i class="far fa-heart"></i> Like';
                }
            } else {
                // Like
                const result = await this.likeContent(contentType, contentId);
                if (result) {
                    likeCount.textContent = result.likeCount;
                    likeButton.classList.add('liked');
                    likeButton.innerHTML = '<i class="fas fa-heart"></i> Liked';
                }
            }
        });
    }
};

/**
 * Comments functionality
 */
const EngagementComments = {
    /**
     * Get comments for content
     * @param {string} contentType - Type of content (show, stream, etc)
     * @param {number} contentId - ID of the content
     * @param {boolean} withReplies - Whether to include hierarchical replies
     * @returns {Promise} - Contains comments array
     */
    getComments: async function(contentType, contentId, withReplies = true) {
        try {
            const response = await fetch(
                `${COMMENT_API_URL}/read.php?content_type=${contentType}&content_id=${contentId}&with_replies=${withReplies}`
            );
            if (!response.ok) {
                throw new Error('Failed to get comments');
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting comments:', error);
            return [];
        }
    },
    
    /**
     * Add a comment
     * @param {string} contentType - Type of content (show, stream, etc)
     * @param {number} contentId - ID of the content
     * @param {string} commentText - The comment text
     * @param {number|null} parentId - Optional parent comment ID for replies
     * @returns {Promise} - Contains the new comment
     */
    addComment: async function(contentType, contentId, commentText, parentId = null) {
        try {
            const comment = {
                content_type: contentType,
                content_id: contentId,
                comment_text: commentText
            };
            
            if (parentId) {
                comment.parent_id = parentId;
            }
            
            const response = await fetch(`${COMMENT_API_URL}/add.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(comment),
                credentials: 'include'
            });
            
            if (response.status === 401) {
                showLoginPrompt();
                return null;
            }
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add comment');
            }
            
            const result = await response.json();
            showNotification(result.message, 'success');
            return result.comment;
        } catch (error) {
            console.error('Error adding comment:', error);
            showNotification(error.message || 'Failed to add comment', 'error');
            return null;
        }
    },
    
    /**
     * Delete a comment
     * @param {number} commentId - ID of the comment to delete
     * @returns {Promise} - Contains status of deletion
     */
    deleteComment: async function(commentId) {
        try {
            const response = await fetch(`${COMMENT_API_URL}/delete.php`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: commentId }),
                credentials: 'include'
            });
            
            if (response.status === 401) {
                showLoginPrompt();
                return null;
            }
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete comment');
            }
            
            const result = await response.json();
            showNotification(result.message, 'success');
            return true;
        } catch (error) {
            console.error('Error deleting comment:', error);
            showNotification(error.message || 'Failed to delete comment', 'error');
            return false;
        }
    },
    
    /**
     * Render a single comment
     * @param {Object} comment - The comment object
     * @param {boolean} isReply - Whether this is a reply to another comment
     * @returns {string} - HTML for the comment
     */
    renderComment: function(comment, isReply = false) {
        const replyClass = isReply ? 'comment-reply' : '';
        const deleteButton = comment.userId === currentUserId || isAdmin ? 
            `<button class="delete-comment" data-id="${comment.id}">Delete</button>` : '';
        
        let repliesHtml = '';
        if (comment.replies && comment.replies.length > 0) {
            repliesHtml = '<div class="comment-replies">';
            comment.replies.forEach(reply => {
                repliesHtml += this.renderComment(reply, true);
            });
            repliesHtml += '</div>';
        }
        
        return `
            <div class="comment ${replyClass}" id="comment-${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">${comment.fullName || comment.username}</div>
                    <div class="comment-date">${formatDate(comment.createdAt)}</div>
                </div>
                <div class="comment-body">
                    ${comment.commentText}
                </div>
                <div class="comment-actions">
                    <button class="reply-button" data-id="${comment.id}">Reply</button>
                    ${deleteButton}
                </div>
                <div class="reply-form-container" id="reply-form-${comment.id}" style="display: none;">
                    <form class="reply-form" data-parent="${comment.id}">
                        <textarea required placeholder="Write a reply..."></textarea>
                        <button type="submit">Post Reply</button>
                        <button type="button" class="cancel-reply">Cancel</button>
                    </form>
                </div>
                ${repliesHtml}
            </div>
        `;
    },
    
    /**
     * Initialize comments section for content
     * @param {string} containerId - ID of the comments container element
     * @param {string} contentType - Type of content (show, stream, etc)
     * @param {number} contentId - ID of the content
     */
    initComments: async function(containerId, contentType, contentId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Create comments UI structure
        container.innerHTML = `
            <div class="comments-header">
                <h3>Comments</h3>
            </div>
            <div class="comment-form-container">
                <form id="comment-form">
                    <textarea id="comment-text" required placeholder="Share your thoughts in a respectful way..."></textarea>
                    <button type="submit">Post Comment</button>
                </form>
            </div>
            <div class="comments-list" id="comments-list"></div>
        `;
        
        const commentsList = document.getElementById('comments-list');
        const commentForm = document.getElementById('comment-form');
        
        // Load comments
        const comments = await this.getComments(contentType, contentId, true);
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">Be the first to comment!</p>';
        } else {
            let commentsHtml = '';
            comments.forEach(comment => {
                commentsHtml += this.renderComment(comment);
            });
            commentsList.innerHTML = commentsHtml;
            
            // Add event listeners for reply buttons
            document.querySelectorAll('.reply-button').forEach(button => {
                button.addEventListener('click', () => {
                    const commentId = button.getAttribute('data-id');
                    const replyForm = document.getElementById(`reply-form-${commentId}`);
                    replyForm.style.display = 'block';
                });
            });
            
            // Add event listeners for cancel reply buttons
            document.querySelectorAll('.cancel-reply').forEach(button => {
                button.addEventListener('click', () => {
                    const form = button.closest('.reply-form-container');
                    form.style.display = 'none';
                });
            });
            
            // Add event listeners for reply form submissions
            document.querySelectorAll('.reply-form').forEach(form => {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const parentId = parseInt(form.getAttribute('data-parent'));
                    const textarea = form.querySelector('textarea');
                    const replyText = textarea.value.trim();
                    
                    if (replyText) {
                        const result = await this.addComment(contentType, contentId, replyText, parentId);
                        if (result) {
                            // Reload comments to show new reply with proper threading
                            this.initComments(containerId, contentType, contentId);
                        }
                    }
                });
            });
            
            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-comment').forEach(button => {
                button.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to delete this comment?')) {
                        const commentId = parseInt(button.getAttribute('data-id'));
                        const result = await this.deleteComment(commentId);
                        if (result) {
                            // Reload comments to reflect deletion
                            this.initComments(containerId, contentType, contentId);
                        }
                    }
                });
            });
        }
        
        // Add event listener for main comment form
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const textarea = document.getElementById('comment-text');
            const commentText = textarea.value.trim();
            
            if (commentText) {
                const result = await this.addComment(contentType, contentId, commentText);
                if (result) {
                    textarea.value = '';
                    
                    // If status is pending, show a message but don't add to list yet
                    if (result.status === 'pending') {
                        const pendingMsg = document.createElement('div');
                        pendingMsg.className = 'pending-comment-notice';
                        pendingMsg.innerHTML = 'Your comment has been submitted and is awaiting approval.';
                        commentForm.appendChild(pendingMsg);
                        
                        // Remove message after a few seconds
                        setTimeout(() => {
                            pendingMsg.remove();
                        }, 5000);
                    } else {
                        // Reload comments to show the new one
                        this.initComments(containerId, contentType, contentId);
                    }
                }
            }
        });
    }
};

/**
 * Helper function to format dates
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

/**
 * Show login prompt
 */
function showLoginPrompt() {
    showNotification('Please log in to participate', 'warning');
    
    // Optionally, redirect to login page
    // window.location.href = '/admin/login.html';
}

/**
 * Show notification to user
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning)
 */
function showNotification(message, type = 'info') {
    // Check if notifications container exists
    let container = document.getElementById('notifications-container');
    
    if (!container) {
        // Create container if it doesn't exist
        container = document.createElement('div');
        container.id = 'notifications-container';
        document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Add close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.classList.add('hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}