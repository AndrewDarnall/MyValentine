// Get elements
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const gifContainer = document.getElementById('gifContainer');
const buttonsContainer = document.querySelector('.buttons-container');

// Track if the user has clicked yes
let hasClickedYes = false;

// Function to move the No button away from the mouse
function moveNoButton(event) {
    if (hasClickedYes) return; // Don't move if yes has been clicked
    
    const buttonRect = noBtn.getBoundingClientRect();
    const containerRect = buttonsContainer.getBoundingClientRect();
    
    // Calculate the center of the button
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    
    // Calculate distance from mouse to button center
    const distanceX = event.clientX - buttonCenterX;
    const distanceY = event.clientY - buttonCenterY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    // Threshold distance to trigger movement (in pixels)
    const threshold = 150;
    
    if (distance < threshold) {
        // Calculate new position
        // Move in opposite direction from mouse
        const angle = Math.atan2(distanceY, distanceX);
        const moveDistance = 100; // Distance to move away
        
        // Calculate new position relative to container
        let newX = buttonCenterX - containerRect.left - Math.cos(angle) * moveDistance;
        let newY = buttonCenterY - containerRect.top - Math.sin(angle) * moveDistance;
        
        // Add some randomness to make it more playful
        newX += (Math.random() - 0.5) * 50;
        newY += (Math.random() - 0.5) * 50;
        
        // Ensure button stays within reasonable bounds
        const maxX = containerRect.width - buttonRect.width;
        const maxY = containerRect.height - buttonRect.height;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(-20, Math.min(newY, 20)); // Keep it relatively centered vertically
        
        // Apply the new position
        noBtn.style.left = newX + 'px';
        noBtn.style.top = newY + 'px';
    }
}

// Function to handle Yes button click
function handleYesClick() {
    hasClickedYes = true;
    
    // Hide the buttons
    buttonsContainer.style.display = 'none';
    
    // Show the gif and success message
    gifContainer.classList.remove('hidden');
    
    // Optional: Add confetti effect or additional animations
    createHearts();
}

// Function to create floating hearts animation
function createHearts() {
    const container = document.querySelector('.container');
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.innerHTML = '💖';
            heart.style.position = 'fixed';
            heart.style.fontSize = (Math.random() * 30 + 20) + 'px';
            heart.style.left = (Math.random() * 100) + '%';
            heart.style.top = '100%';
            heart.style.opacity = '1';
            heart.style.pointerEvents = 'none';
            heart.style.zIndex = '1000';
            heart.style.transition = 'all 3s ease-out';
            
            document.body.appendChild(heart);
            
            // Animate the heart
            setTimeout(() => {
                heart.style.top = '-10%';
                heart.style.opacity = '0';
                heart.style.transform = 'translateX(' + ((Math.random() - 0.5) * 200) + 'px) rotate(' + (Math.random() * 360) + 'deg)';
            }, 10);
            
            // Remove the heart after animation
            setTimeout(() => {
                heart.remove();
            }, 3000);
        }, i * 100);
    }
}

// Event listeners
yesBtn.addEventListener('click', handleYesClick);

// Add mousemove listener to the entire document for better tracking
document.addEventListener('mousemove', moveNoButton);

// Prevent No button from being clicked accidentally
noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // Button will move away before click can register effectively
});
