let currentBook = null;
let currentUser = null;
let currentPage = 1;
let totalPages = 50;
let bookmarks = [];
let highlights = [];
let comments = [];
let readingStartTime = Date.now();
let sessionStartPage = 1;
let selectedText = null;
let selectionRange = null;
let lastScrollTime = 0;
const SCROLL_COOLDOWN = 800; // milliseconds between page changes

// Lorem Ipsum text 
const loremContent = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel mollis dolor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Maecenas iaculis molestie velit, vitae volutpat augue condimentum in. Ut in sapien sed leo lobortis tempor. Duis quis tortor scelerisque, vulputate orci at, posuere lacus. Curabitur dapibus, turpis efficitur vulputate malesuada, justo neque maximus lacus, sed rhoncus urna arcu nec est. Quisque interdum elit eu pretium auctor. Interdum et malesuada fames ac ante ipsum primis in faucibus. Maecenas sed imperdiet est. Vestibulum nec euismod massa. Duis vestibulum massa sed lacus feugiat faucibus. Aliquam vitae orci lacus.`;

function initializeReadingPage() {
    // Agafar usuari actual
    currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) {
        window.location.href = 'login.html';
        return;
    }

    // Agafar llibre actual amb la url
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    if (!bookId) {
        alert('Llibre no trobat');
        window.location.href = 'index.html';
        return;
    }

    const books = JSON.parse(localStorage.getItem('books') || '[]');
    currentBook = books.find(b => b.id == bookId);

    if (!currentBook) {
        alert('Llibre no trobat');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('bookTitleHeader').textContent = currentBook.title;

    totalPages = currentBook.pages;

    // Set book status to "reading" when opening
    const bookStatuses = JSON.parse(localStorage.getItem(`bookStatuses_${currentUser.id}`) || '{}');
    if (!bookStatuses[currentBook.id] || bookStatuses[currentBook.id] === 'want-to-read') {
        bookStatuses[currentBook.id] = 'reading';
        localStorage.setItem(`bookStatuses_${currentUser.id}`, JSON.stringify(bookStatuses));
    }

    loadProgress();

    loadBookmarks();
    loadHighlights();
    loadComments();
    loadSettings();

    generatePages();

    setupTextSelection();

    updateProgress();

    startReadingTimer();
}

function generatePages() {
    const pagesContainer = document.getElementById('pagesContainer');
    const isTwoColumn = localStorage.getItem(`twoColumn_${currentUser.id}`) === 'true';

    // En mode de dues columnes, assegurar que comencem en pàgina senar
    if (isTwoColumn && currentPage % 2 === 0) {
        currentPage = Math.max(1, currentPage - 1);
    }

    if (isTwoColumn) {
        pagesContainer.classList.remove('single-page');
    } else {
        pagesContainer.classList.add('single-page');
    }

    pagesContainer.innerHTML = '';

    const pagesToShow = isTwoColumn ? 2 : 1;

    for (let i = 0; i < pagesToShow; i++) {
        const pageNum = currentPage + i;
        if (pageNum > totalPages) break;

        const page = document.createElement('div');
        page.className = 'page';
        page.id = `page${pageNum}`;
        page.dataset.pageNumber = pageNum;

        // Simular capitols cada deu pagines
        if (pageNum === 1 || pageNum % 10 === 1) {
            const chapter = document.createElement('h2');
            chapter.textContent = `Capítol ${Math.ceil(pageNum / 10)}`;
            page.appendChild(chapter);
        }

        const paragraphs = loremContent.split('\n\n');
        paragraphs.forEach((para, idx) => {
            if (para.trim()) {
                const p = document.createElement('p');
                p.textContent = para;
                p.dataset.pageNumber = pageNum;
                p.dataset.paragraphIndex = idx;
                page.appendChild(p);
            }
        });

        const pageNumber = document.createElement('div');
        pageNumber.className = 'page-number';
        pageNumber.textContent = `Pàgina ${pageNum}`;
        page.appendChild(pageNumber);

        pagesContainer.appendChild(page);
    }

    applyHighlights();

    document.getElementById('readingContent').scrollTop = 0;
}

// Setup text selection handler
function setupTextSelection() {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
}

function handleTextSelection(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Show highlight toolbar
        const toolbar = document.getElementById('highlightToolbar');
        toolbar.style.left = `${rect.left + window.scrollX}px`;
        toolbar.style.top = `${rect.bottom + window.scrollY + 10}px`;
        toolbar.classList.add('active');

        // Save selection
        selectionRange = range;
    } else {
        hideHighlightToolbar();
    }
}

// Hide highlight toolbar
function hideHighlightToolbar() {
    document.getElementById('highlightToolbar').classList.remove('active');
    selectionRange = null;
}

// Highlight selected text
function highlightText(color) {
    if (!selectionRange) return;

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (!selectedText) return;

    // Get page and paragraph info
    let container = selectionRange.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement;
    }

    const page = container.closest('.page');
    if (!page) return;

    const pageNum = parseInt(page.dataset.pageNumber);
    const paragraphIndex = parseInt(container.dataset.paragraphIndex || 0);

    // Create highlight span
    const span = document.createElement('span');
    span.className = `highlight ${color}`;
    span.dataset.highlightId = Date.now();

    try {
        selectionRange.surroundContents(span);
    } catch (e) {
        // If selection spans multiple nodes, use different approach
        console.log('Complex selection, skipping highlight');
        hideHighlightToolbar();
        return;
    }

    // Save highlight
    const highlight = {
        id: parseInt(span.dataset.highlightId),
        bookId: currentBook.id,
        pageNum: pageNum,
        paragraphIndex: paragraphIndex,
        text: selectedText,
        color: color,
        startOffset: selectionRange.startOffset,
        endOffset: selectionRange.endOffset,
        date: new Date().toISOString()
    };

    highlights.push(highlight);
    saveHighlights();

    // Clear selection
    selection.removeAllRanges();
    hideHighlightToolbar();
}

// Remove highlight
function removeHighlight() {
    if (!selectionRange) return;

    const selection = window.getSelection();
    let container = selectionRange.commonAncestorContainer;

    if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement;
    }

    // Check if it's a highlight span
    if (container.classList && container.classList.contains('highlight')) {
        const highlightId = parseInt(container.dataset.highlightId);

        // Remove from array
        highlights = highlights.filter(h => h.id !== highlightId);
        saveHighlights();

        // Remove from DOM
        const text = document.createTextNode(container.textContent);
        container.parentNode.replaceChild(text, container);
    }

    selection.removeAllRanges();
    hideHighlightToolbar();
}

// Apply saved highlights
function applyHighlights() {
    highlights.forEach(highlight => {
        if (highlight.pageNum === currentPage || (highlight.pageNum === currentPage + 1)) {
            const page = document.querySelector(`.page[data-page-number="${highlight.pageNum}"]`);
            if (!page) return;

            const paragraphs = page.querySelectorAll('p');
            const targetP = paragraphs[highlight.paragraphIndex];
            if (!targetP) return;

            // Find and highlight the text
            const textContent = targetP.textContent;
            const highlightText = highlight.text;
            const startIndex = textContent.indexOf(highlightText);

            if (startIndex !== -1) {
                const beforeText = textContent.substring(0, startIndex);
                const afterText = textContent.substring(startIndex + highlightText.length);

                targetP.innerHTML = '';
                targetP.appendChild(document.createTextNode(beforeText));

                const span = document.createElement('span');
                span.className = `highlight ${highlight.color}`;
                span.dataset.highlightId = highlight.id;
                span.textContent = highlightText;
                targetP.appendChild(span);

                targetP.appendChild(document.createTextNode(afterText));
            }
        }
    });
}

// Add comment to selected text
function addComment() {
    if (!selectionRange) return;

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (!selectedText) {
        alert('Si us plau, selecciona text primer');
        return;
    }

    const commentText = prompt('Escriu el teu comentari:');
    if (!commentText) return;

    // Get page info
    let container = selectionRange.commonAncestorContainer;
    if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement;
    }

    const page = container.closest('.page');
    if (!page) return;

    const pageNum = parseInt(page.dataset.pageNumber);

    const comment = {
        id: Date.now(),
        bookId: currentBook.id,
        pageNum: pageNum,
        text: selectedText,
        comment: commentText,
        date: new Date().toISOString()
    };

    comments.push(comment);
    saveComments();

    alert('Comentari desat!');

    selection.removeAllRanges();
    hideHighlightToolbar();
}

function toggleBookmark() {
    const bookmarkIcon = document.querySelector('.bookmark-icon');

    if (bookmarks.includes(currentPage)) {
        bookmarks = bookmarks.filter(p => p !== currentPage);
        if (bookmarkIcon) bookmarkIcon.classList.remove('active');
    } else {
        bookmarks.push(currentPage);
        if (bookmarkIcon) bookmarkIcon.classList.add('active');
    }

    saveBookmarks();
    updateBookmarkMarkers();
}

// Actualitzar marcadors de pagina
function updateBookmarkMarkers() {
    const container = document.getElementById('bookmarksContainer');
    container.innerHTML = '';

    bookmarks.forEach(page => {
        const marker = document.createElement('div');
        marker.className = 'bookmark-marker';
        marker.style.left = `${(page / totalPages) * 100}%`;
        marker.onclick = () => goToPage(page);
        marker.title = `Pàgina ${page}`;
        container.appendChild(marker);
    });
}

function goToPage(page) {
    currentPage = Math.max(1, Math.min(page, totalPages));
    generatePages();
    updateProgress();
    saveProgress();
}

function nextPage() {
    const isTwoColumn = localStorage.getItem(`twoColumn_${currentUser.id}`) === 'true';
    const increment = isTwoColumn ? 2 : 1;

    if (currentPage < totalPages) {
        currentPage = Math.min(totalPages, currentPage + increment);
        generatePages();
        updateProgress();
        saveProgress();
    }
}

function previousPage() {
    const isTwoColumn = localStorage.getItem(`twoColumn_${currentUser.id}`) === 'true';
    const decrement = isTwoColumn ? 2 : 1;

    if (currentPage > 1) {
        currentPage = Math.max(1, currentPage - decrement);
        generatePages();
        updateProgress();
        saveProgress();
    }
}

function updateProgress() {
    const progress = (currentPage / totalPages) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('pageInfo').textContent = `Pàgina ${currentPage} de ${totalPages}`;
    updateBookmarkMarkers();
}

function toggleSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.toggle('active');

    if (modal.classList.contains('active')) {
        loadSettingsToForm();
        updateObjectivesDisplay();
    }
}

function toggleComments() {
    const modal = document.getElementById('commentsModal');
    modal.classList.toggle('active');

    if (modal.classList.contains('active')) {
        displayComments();
    }
}

function displayComments() {
    const container = document.getElementById('commentsListContainer');

    if (comments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Encara no tens comentaris. Selecciona text i afegeix un comentari!</p>';
        return;
    }

    container.innerHTML = comments.map(comment => {
        const date = new Date(comment.date).toLocaleDateString('ca-ES');
        return `
            <div class="comment-box">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong style="color: var(--primary-blue);">Pàgina ${comment.pageNum}</strong>
                    <span style="font-size: 12px; color: #666;">${date}</span>
                </div>
                <div style="background-color: white; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                    <em>"${comment.text}"</em>
                </div>
                <div class="comment-text">${comment.comment}</div>
                <div class="comment-actions">
                    <button class="toolbar-btn" onclick="goToPage(${comment.pageNum})">Anar a la pàgina</button>
                    <button class="toolbar-btn" onclick="deleteComment(${comment.id})">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteComment(commentId) {
    if (confirm('Estàs segur que vols eliminar aquest comentari?')) {
        comments = comments.filter(c => c.id !== commentId);
        saveComments();
        displayComments();
    }
}

function toggleNightMode() {
    const isNightMode = document.getElementById('nightModeToggle').checked;
    const container = document.getElementById('readingContainer');

    if (isNightMode) {
        container.classList.add('night-mode');
    } else {
        container.classList.remove('night-mode');
    }

    localStorage.setItem(`nightMode_${currentUser.id}`, isNightMode);
}

// Change font size
function changeFontSize() {
    const fontSize = document.getElementById('fontSizeSelect').value;
    const pages = document.querySelectorAll('.page p');

    pages.forEach(p => {
        p.style.fontSize = `${fontSize}px`;
    });

    localStorage.setItem(`fontSize_${currentUser.id}`, fontSize);
}

// Toggle two column layout
function toggleTwoColumn() {
    const isTwoColumn = document.getElementById('twoColumnToggle').checked;
    localStorage.setItem(`twoColumn_${currentUser.id}`, isTwoColumn);

    // Si activem dues columnes, assegurar que estem en pàgina senar
    if (isTwoColumn && currentPage % 2 === 0) {
        currentPage = Math.max(1, currentPage - 1);
    }

    generatePages();
}

// Load settings to form
function loadSettingsToForm() {
    const settings = JSON.parse(localStorage.getItem(`settings_${currentUser.id}`) || '{}');

    document.getElementById('pagesPerDay').value = settings.pagesPerDay || 0;
    document.getElementById('minutesPerDay').value = settings.minutesPerDay || 0;
    document.getElementById('finishByDate').value = settings.finishByDate || '';
    document.getElementById('dailyStreakToggle').checked = settings.dailyStreak || false;
}

// Save settings
function saveSettings() {
    const settings = {
        pagesPerDay: parseInt(document.getElementById('pagesPerDay').value) || 0,
        minutesPerDay: parseInt(document.getElementById('minutesPerDay').value) || 0,
        finishByDate: document.getElementById('finishByDate').value,
        dailyStreak: document.getElementById('dailyStreakToggle').checked
    };

    localStorage.setItem(`settings_${currentUser.id}`, JSON.stringify(settings));
    alert('Configuració desada!');
}

// Load settings
function loadSettings() {
    const nightMode = localStorage.getItem(`nightMode_${currentUser.id}`) === 'true';
    const fontSize = localStorage.getItem(`fontSize_${currentUser.id}`) || '16';
    const isTwoColumn = localStorage.getItem(`twoColumn_${currentUser.id}`) === 'true';

    document.getElementById('nightModeToggle').checked = nightMode;
    document.getElementById('fontSizeSelect').value = fontSize;
    document.getElementById('twoColumnToggle').checked = isTwoColumn;

    if (nightMode) {
        document.getElementById('readingContainer').classList.add('night-mode');
    }

    // Apply font size
    setTimeout(() => {
        const pages = document.querySelectorAll('.page p');
        pages.forEach(p => {
            p.style.fontSize = `${fontSize}px`;
        });
    }, 100);
}

// Update objectives display
function updateObjectivesDisplay() {
    const stats = JSON.parse(localStorage.getItem(`readingStats_${currentUser.id}`) || '{}');
    const today = new Date().toDateString();
    const todayStats = stats[today] || { pages: 0, minutes: 0 };

    document.getElementById('todayPages').textContent = todayStats.pages || 0;
    document.getElementById('todayTime').textContent = `${todayStats.minutes || 0} min`;

    // Calculate streak
    const streak = calculateStreak();
    document.getElementById('currentStreak').textContent = `${streak} dies`;
}

// Calculate reading streak
function calculateStreak() {
    const stats = JSON.parse(localStorage.getItem(`readingStats_${currentUser.id}`) || '{}');
    const dates = Object.keys(stats).sort().reverse();

    if (dates.length === 0) return 0;

    let streak = 0;
    let lastDate = new Date();

    for (const dateStr of dates) {
        const date = new Date(dateStr);
        const diffDays = Math.floor((lastDate - date) / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            streak++;
            lastDate = date;
        } else {
            break;
        }
    }

    return streak;
}

function startReadingTimer() {
    setInterval(() => {
        const minutesRead = Math.floor((Date.now() - readingStartTime) / 60000);

        // Update today's stats
        const stats = JSON.parse(localStorage.getItem(`readingStats_${currentUser.id}`) || '{}');
        const today = new Date().toDateString();

        if (!stats[today]) {
            stats[today] = { pages: 0, minutes: 0 };
        }

        stats[today].minutes = minutesRead;
        stats[today].pages = currentPage - sessionStartPage;

        localStorage.setItem(`readingStats_${currentUser.id}`, JSON.stringify(stats));
    }, 60000);
}

function showPauseModal() {
    const modal = document.getElementById('pauseModal');
    modal.classList.add('active');

    // Update session stats
    const minutesRead = Math.floor((Date.now() - readingStartTime) / 60000);
    const pagesRead = currentPage - sessionStartPage;
    const progress = ((currentPage / totalPages) * 100).toFixed(1);

    document.getElementById('sessionTime').textContent = `${minutesRead} min`;
    document.getElementById('sessionPages').textContent = pagesRead;
    document.getElementById('bookProgress').textContent = `${progress}%`;
}

function closePauseModal() {
    document.getElementById('pauseModal').classList.remove('active');
}

function exitBook() {
    saveProgress();
    window.location.href = 'index.html';
}

function saveProgress() {
    const progress = {
        bookId: currentBook.id,
        currentPage: currentPage,
        totalPages: totalPages,
        lastRead: new Date().toISOString()
    };

    const allProgress = JSON.parse(localStorage.getItem(`progress_${currentUser.id}`) || '[]');
    const existingIndex = allProgress.findIndex(p => p.bookId === currentBook.id);

    if (existingIndex !== -1) {
        allProgress[existingIndex] = progress;
    } else {
        allProgress.push(progress);
    }

    localStorage.setItem(`progress_${currentUser.id}`, JSON.stringify(allProgress));

    // Mark as completed if on last page
    if (currentPage >= totalPages) {
        const bookStatuses = JSON.parse(localStorage.getItem(`bookStatuses_${currentUser.id}`) || '{}');
        if (bookStatuses[currentBook.id] !== 'completed') {
            bookStatuses[currentBook.id] = 'completed';
            localStorage.setItem(`bookStatuses_${currentUser.id}`, JSON.stringify(bookStatuses));
        }
    }
}

function loadProgress() {
    const allProgress = JSON.parse(localStorage.getItem(`progress_${currentUser.id}`) || '[]');
    const progress = allProgress.find(p => p.bookId === currentBook.id);

    if (progress) {
        currentPage = progress.currentPage;
        sessionStartPage = currentPage;
    }
}

function saveBookmarks() {
    localStorage.setItem(`bookmarks_${currentUser.id}_${currentBook.id}`, JSON.stringify(bookmarks));
}

function loadBookmarks() {
    bookmarks = JSON.parse(localStorage.getItem(`bookmarks_${currentUser.id}_${currentBook.id}`) || '[]');
}

function saveHighlights() {
    localStorage.setItem(`highlights_${currentUser.id}_${currentBook.id}`, JSON.stringify(highlights));
}

function loadHighlights() {
    highlights = JSON.parse(localStorage.getItem(`highlights_${currentUser.id}_${currentBook.id}`) || '[]');
}

function saveComments() {
    localStorage.setItem(`comments_${currentUser.id}_${currentBook.id}`, JSON.stringify(comments));
}

function loadComments() {
    comments = JSON.parse(localStorage.getItem(`comments_${currentUser.id}_${currentBook.id}`) || '[]');
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        nextPage();
    } else if (e.key === 'ArrowLeft') {
        previousPage();
    } else if (e.key === 'Escape') {
        const toolbar = document.getElementById('highlightToolbar');
        if (toolbar.classList.contains('active')) {
            hideHighlightToolbar();
        } else {
            showPauseModal();
        }
    }
});

const content = document.getElementById('readingContent');
// Mouse wheel for page turning
document.getElementById('readingContent').addEventListener('wheel', (e) => {
    const now = Date.now();

    // Prevent multiple rapid page changes
    if (now - lastScrollTime < SCROLL_COOLDOWN) {
        return;
    }

    if (e.deltaY > 0) {
        // scrolling down - check if at bottom of content
        if (content.scrollTop + content.clientHeight >= content.scrollHeight - 10) {
            lastScrollTime = now;
            nextPage();
        }
    } else if (e.deltaY < 0) {
        // scrolling up - check if at top of content
        if (content.scrollTop <= 10) {
            lastScrollTime = now;
            previousPage();
        }
    }
});

window.addEventListener('load', initializeReadingPage);

// Guardar progres quan l'usuari tanqui la pagina
window.addEventListener('beforeunload', () => {
    saveProgress();
});
