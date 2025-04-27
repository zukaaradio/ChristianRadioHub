/**
 * Integration of player and engagement features
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get current stream ID for engagement
    let currentStreamId = null;
    
    // Initialize engagement once stream is loaded
    const originalFetchCurrentStream = window.fetchCurrentStream;
    
    if (originalFetchCurrentStream) {
        // Override fetchCurrentStream to integrate engagement
        window.fetchCurrentStream = async function() {
            const result = await originalFetchCurrentStream();
            
            if (result && result.stream && result.stream.id) {
                currentStreamId = result.stream.id;
                initializeStreamEngagement(currentStreamId);
            }
            
            return result;
        };
    }
    
    // Use the DOMContentLoaded event to initialize player engagement
    initializePlayerEngagement();
});

/**
 * Initialize the engagement features for the stream
 * @param {number} streamId - The ID of the current stream
 */
function initializeStreamEngagement(streamId) {
    // Check if the engagement container exists
    const engagementContainer = document.getElementById('stream-engagement');
    
    if (!engagementContainer) {
        // Create the engagement elements
        const playerContainer = document.querySelector('.player-container');
        
        if (playerContainer) {
            // Create engagement container
            const container = document.createElement('div');
            container.id = 'stream-engagement';
            container.className = 'stream-engagement';
            
            // Create like button and count
            container.innerHTML = `
                <div class="engagement-bar">
                    <button id="stream-like-button" class="like-button">
                        <i class="far fa-heart"></i> Like
                    </button>
                    <div class="like-count">
                        <i class="fas fa-heart"></i>
                        <span id="stream-like-count">0</span> likes
                    </div>
                </div>
                <div id="stream-comments-toggle" class="comments-toggle">
                    <button>
                        <i class="far fa-comments"></i> Show Comments
                    </button>
                </div>
                <div id="stream-comments-section" class="comments-section" style="display: none;">
                    <!-- Comments will be loaded here -->
                </div>
            `;
            
            // Insert after player
            playerContainer.parentNode.insertBefore(container, playerContainer.nextSibling);
            
            // Initialize like button
            EngagementLikes.initLikeButton(
                'stream-like-button', 
                'stream-like-count', 
                'stream', 
                streamId
            );
            
            // Add toggle for comments section
            const commentsToggle = document.getElementById('stream-comments-toggle');
            const commentsSection = document.getElementById('stream-comments-section');
            
            commentsToggle.querySelector('button').addEventListener('click', () => {
                if (commentsSection.style.display === 'none') {
                    commentsSection.style.display = 'block';
                    commentsToggle.querySelector('button').innerHTML = '<i class="fas fa-comments"></i> Hide Comments';
                    
                    // Initialize comments when shown
                    EngagementComments.initComments(
                        'stream-comments-section', 
                        'stream', 
                        streamId
                    );
                } else {
                    commentsSection.style.display = 'none';
                    commentsToggle.querySelector('button').innerHTML = '<i class="far fa-comments"></i> Show Comments';
                }
            });
        }
    }
}

/**
 * Initialize player engagement features
 */
function initializePlayerEngagement() {
    // Add "Now Playing" sharing section to player
    const playerInfo = document.querySelector('.player-info');
    
    if (playerInfo) {
        // Create sharing element
        const sharingElement = document.createElement('div');
        sharingElement.className = 'player-sharing';
        sharingElement.innerHTML = `
            <button id="share-now-playing" class="share-button">
                <i class="fas fa-share-alt"></i> Share
            </button>
            <div class="sharing-popup" id="sharing-popup" style="display: none;">
                <div class="sharing-header">Share Now Playing</div>
                <div class="sharing-options">
                    <a href="#" class="share-facebook"><i class="fab fa-facebook-f"></i> Facebook</a>
                    <a href="#" class="share-twitter"><i class="fab fa-twitter"></i> Twitter</a>
                    <a href="#" class="share-whatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                    <button class="copy-link"><i class="fas fa-link"></i> Copy Link</button>
                </div>
            </div>
        `;
        
        playerInfo.appendChild(sharingElement);
        
        // Add event listeners for sharing
        const shareButton = document.getElementById('share-now-playing');
        const sharingPopup = document.getElementById('sharing-popup');
        
        // Toggle sharing popup
        shareButton.addEventListener('click', () => {
            if (sharingPopup.style.display === 'none') {
                sharingPopup.style.display = 'block';
                
                // Position the popup
                const buttonRect = shareButton.getBoundingClientRect();
                sharingPopup.style.top = `${buttonRect.bottom + window.scrollY + 10}px`;
                sharingPopup.style.left = `${buttonRect.left + window.scrollX}px`;
                
                // Close when clicking elsewhere
                document.addEventListener('click', closePopupOnClickOutside);
            } else {
                sharingPopup.style.display = 'none';
                document.removeEventListener('click', closePopupOnClickOutside);
            }
        });
        
        // Handle closing popup when clicking outside
        function closePopupOnClickOutside(event) {
            if (!sharingPopup.contains(event.target) && event.target !== shareButton) {
                sharingPopup.style.display = 'none';
                document.removeEventListener('click', closePopupOnClickOutside);
            }
        }
        
        // Handle sharing options
        const facebookShare = sharingPopup.querySelector('.share-facebook');
        const twitterShare = sharingPopup.querySelector('.share-twitter');
        const whatsappShare = sharingPopup.querySelector('.share-whatsapp');
        const copyLink = sharingPopup.querySelector('.copy-link');
        
        facebookShare.addEventListener('click', (e) => {
            e.preventDefault();
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(getNowPlayingText());
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`, '_blank');
        });
        
        twitterShare.addEventListener('click', (e) => {
            e.preventDefault();
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(getNowPlayingText());
            window.open(`https://twitter.com/intent/tweet?text=${title}&url=${url}`, '_blank');
        });
        
        whatsappShare.addEventListener('click', (e) => {
            e.preventDefault();
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(getNowPlayingText());
            window.open(`https://api.whatsapp.com/send?text=${title} ${url}`, '_blank');
        });
        
        copyLink.addEventListener('click', () => {
            const textToCopy = `${getNowPlayingText()} - Listen live at: ${window.location.href}`;
            
            // Copy to clipboard
            navigator.clipboard.writeText(textToCopy).then(() => {
                showNotification('Link copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                showNotification('Failed to copy link', 'error');
            });
            
            // Close popup
            sharingPopup.style.display = 'none';
            document.removeEventListener('click', closePopupOnClickOutside);
        });
    }
}

/**
 * Get formatted text of what's currently playing
 * @returns {string} - Now playing text
 */
function getNowPlayingText() {
    const nowPlayingElement = document.querySelector('.now-playing');
    const streamTitle = document.querySelector('.stream-title');
    
    let text = 'Grace Waves Christian Radio';
    
    if (streamTitle && streamTitle.textContent) {
        text = streamTitle.textContent.trim();
    }
    
    if (nowPlayingElement && nowPlayingElement.textContent) {
        const nowPlaying = nowPlayingElement.textContent.trim();
        if (nowPlaying && nowPlaying !== 'Now Playing...') {
            text += ` - ${nowPlaying}`;
        }
    }
    
    return text;
}