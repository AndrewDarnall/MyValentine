// Get elements
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const gifContainer = document.getElementById('gifContainer');
const buttonsContainer = document.querySelector('.buttons-container');

// Track if the user has clicked yes
let hasClickedYes = false;

let noBtnPinned = false;
let noBtnPlaceholder = null;
let lastMoveAt = 0;
let panicOffTimer = null;

let mobileAttempts = 0;
let toastTimer = null;
const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

const pageLoadedAt = performance.now();
const EDGE_INSET_PX = 12; // keep fully inside viewport (prevents clipping)

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function distanceToRect(x, y, rect) {
    const dx = Math.max(rect.left - x, 0, x - rect.right);
    const dy = Math.max(rect.top - y, 0, y - rect.bottom);
    return Math.sqrt(dx * dx + dy * dy);
}

function pinNoButtonToViewport() {
    if (isCoarsePointer) return; // Cursor-escape is desktop-first.
    if (noBtnPinned) return;

    const rect = noBtn.getBoundingClientRect();

    // Keep a slot in the flex layout so the Yes/No start separated.
    // Then move the actual button to <body> so flex layout can't affect it.
    noBtnPlaceholder = document.createElement('div');
    noBtnPlaceholder.style.width = rect.width + 'px';
    noBtnPlaceholder.style.height = rect.height + 'px';
    noBtnPlaceholder.style.flex = '0 0 auto';
    noBtnPlaceholder.setAttribute('aria-hidden', 'true');

    if (noBtn.parentElement) {
        noBtn.parentElement.replaceChild(noBtnPlaceholder, noBtn);
    }
    document.body.appendChild(noBtn);

    noBtn.style.position = 'fixed';
    noBtn.style.left = rect.left + 'px';
    noBtn.style.top = rect.top + 'px';
    noBtn.style.margin = '0';

    noBtnPinned = true;
    keepNoButtonInBounds();
}

function keepNoButtonInBounds() {
    if (!noBtnPinned) return;
    const rect = noBtn.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - EDGE_INSET_PX;
    const maxY = window.innerHeight - rect.height - EDGE_INSET_PX;

    const currentLeft = parseFloat(noBtn.style.left || rect.left);
    const currentTop = parseFloat(noBtn.style.top || rect.top);

    noBtn.style.left = clamp(currentLeft, EDGE_INSET_PX, Math.max(EDGE_INSET_PX, maxX)) + 'px';
    noBtn.style.top = clamp(currentTop, EDGE_INSET_PX, Math.max(EDGE_INSET_PX, maxY)) + 'px';
}

function showMobileToast(message) {
    const container = document.querySelector('.container');
    if (!container) return;

    let toast = document.getElementById('mobileToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'mobileToast';
        toast.className = 'mobile-toast';
        toast.setAttribute('aria-live', 'polite');
        container.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.remove('show');
    // Force reflow so the animation re-triggers.
    // eslint-disable-next-line no-unused-expressions
    toast.offsetHeight;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1200);
}

function handleMobileNoAttempt() {
    if (hasClickedYes) return;

    mobileAttempts += 1;
    noBtn.classList.add('panic');
    setTimeout(() => noBtn.classList.remove('panic'), 420);

    const messages = [
        "Nice try 😅",
        "No is feeling shy…",
        "That button is slippery!",
        "Ok ok… how about Yes?",
    ];

    showMobileToast(messages[Math.min(mobileAttempts - 1, messages.length - 1)]);

    const labels = [
        'No',
        'Nope 🙈',
        'Still no?',
        '…really?',
        "Okay fine 😳",
    ];
    noBtn.textContent = labels[Math.min(mobileAttempts, labels.length - 1)];

    // Give the Yes button a little extra encouragement.
    yesBtn.classList.add('pulse');
    setTimeout(() => yesBtn.classList.remove('pulse'), 650);

    // After a few tries on mobile, retire the No option gracefully.
    if (mobileAttempts >= 4) {
        noBtn.style.opacity = '0';
        noBtn.style.transform = 'translateY(12px) scale(0.98)';
        setTimeout(() => {
            noBtn.style.display = 'none';
        }, 220);
    }
}

// Function to move the No button away from the mouse
function moveNoButton(event) {
    if (hasClickedYes) return; // Don't move if yes has been clicked

    // On touch/coarse pointers, use a different interaction.
    if (event && event.pointerType === 'touch') return;

    if (!noBtnPinned) pinNoButtonToViewport();
    if (!noBtnPinned) return;
    
    const buttonRect = noBtn.getBoundingClientRect();
    
    // Calculate the center of the button
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    
    // Ignore any early/phantom pointer events right after load.
    // This prevents "it runs immediately" reports on some browsers.
    const now = performance.now();
    if (now - pageLoadedAt < 350) return;

    // Trigger only when the pointer is very close to the BUTTON EDGE,
    // not the center. This feels much more "almost clickable".
    const edgeDistance = distanceToRect(event.clientX, event.clientY, buttonRect);
    const threshold = 22;

    // Prevent excessive work on high-frequency move events.
    if (now - lastMoveAt < 28) return;
    
    if (edgeDistance < threshold) {
        lastMoveAt = now;

        // Make it visibly frantic.
        noBtn.classList.add('panic');
        if (panicOffTimer) clearTimeout(panicOffTimer);
        panicOffTimer = setTimeout(() => noBtn.classList.remove('panic'), 450);

        const maxX = window.innerWidth - buttonRect.width - EDGE_INSET_PX;
        const maxY = window.innerHeight - buttonRect.height - EDGE_INSET_PX;

        // Jump far (often to the opposite side). Try a few times to land away from the cursor.
        const safeDistance = 220;
        let newLeft = 0;
        let newTop = 0;

        for (let i = 0; i < 12; i++) {
            newLeft = EDGE_INSET_PX + Math.random() * Math.max(0, maxX - EDGE_INSET_PX);
            newTop = EDGE_INSET_PX + Math.random() * Math.max(0, maxY - EDGE_INSET_PX);

            const newCenterX = newLeft + buttonRect.width / 2;
            const newCenterY = newTop + buttonRect.height / 2;
            const dx = event.clientX - newCenterX;
            const dy = event.clientY - newCenterY;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d >= safeDistance) break;
        }

        noBtn.style.left = clamp(newLeft, EDGE_INSET_PX, Math.max(EDGE_INSET_PX, maxX)) + 'px';
        noBtn.style.top = clamp(newTop, EDGE_INSET_PX, Math.max(EDGE_INSET_PX, maxY)) + 'px';
    }
}

// Function to handle Yes button click
function handleYesClick() {
    hasClickedYes = true;
    
    // Hide the buttons
    buttonsContainer.style.display = 'none';

    // Ensure the No button (fixed) is also hidden.
    noBtn.style.display = 'none';
    if (noBtnPlaceholder) noBtnPlaceholder.style.display = 'none';
    
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

// Desktop-first: pin after layout so initial positions stay separated, then it can roam.
window.addEventListener('load', () => {
    if (isCoarsePointer) return;
    requestAnimationFrame(() => pinNoButtonToViewport());
});

window.addEventListener('resize', keepNoButtonInBounds);

// Add pointer listener to the entire document for better tracking
document.addEventListener('pointermove', moveNoButton);

// Desktop: if the cursor actually makes it onto the button, it should still fail to click.
noBtn.addEventListener('pointerdown', (e) => {
    if (hasClickedYes) return;

    if (e.pointerType === 'touch' || isCoarsePointer) {
        e.preventDefault();
        handleMobileNoAttempt();
        return;
    }

    // Mouse/pen: hard-cancel the click and immediately flee.
    e.preventDefault();
    e.stopPropagation();
    moveNoButton(e);
});

// Mobile fallback: taps usually become clicks; block and use the mobile interaction.
noBtn.addEventListener('click', (e) => {
    if (!isCoarsePointer) {
        e.preventDefault();
        return;
    }
    e.preventDefault();
    handleMobileNoAttempt();
});
