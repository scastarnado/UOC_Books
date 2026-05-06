let currentUser = null;
let currentManagingBook = null;

window.addEventListener('load', () => {
    currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!currentUser.id) {
        window.location.href = 'login.html';
        return;
    }

    loadUserProfile();
    loadBookshelves();
    loadCollections();
    loadTags();
    loadActivity();
});

function loadUserProfile() {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    updateStats();
}

function updateStats() {
    const bookStatuses = JSON.parse(localStorage.getItem(`bookStatuses_${currentUser.id}`) || '{}');

    const reading = Object.values(bookStatuses).filter(s => s === 'reading').length;
    const wantToRead = Object.values(bookStatuses).filter(s => s === 'want-to-read').length;
    const completed = Object.values(bookStatuses).filter(s => s === 'completed').length;

    const collections = JSON.parse(localStorage.getItem(`collections_${currentUser.id}`) || '[]');

    document.getElementById('booksRead').textContent = completed;
    document.getElementById('booksReading').textContent = reading;
    document.getElementById('booksToRead').textContent = wantToRead;
    document.getElementById('totalCollections').textContent = collections.length;
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
    });

    const tabMap = {
        'bookshelves': 'bookshelvesTab',
        'collections': 'collectionsTab',
        'tags': 'tagsTab',
        'activity': 'activityTab'
    };

    document.getElementById(tabMap[tabName]).classList.add('active');
    event.target.classList.add('active');

    // Reload data for that tab
    if (tabName === 'bookshelves') loadBookshelves();
    if (tabName === 'collections') loadCollections();
    if (tabName === 'tags') loadTags();
    if (tabName === 'activity') loadActivity();
}

// Load bookshelves
function loadBookshelves() {
    const books = JSON.parse(localStorage.getItem('books') || '[]');
    const bookStatuses = JSON.parse(localStorage.getItem(`bookStatuses_${currentUser.id}`) || '{}');

    const readingBooks = books.filter(b => bookStatuses[b.id] === 'reading');
    const wantToReadBooks = books.filter(b => bookStatuses[b.id] === 'want-to-read');
    const completedBooks = books.filter(b => bookStatuses[b.id] === 'completed');
    const pausedBooks = books.filter(b => bookStatuses[b.id] === 'paused');

    displayShelfBooks(readingBooks, 'readingShelf', true); // true = isReadingShelf
    displayShelfBooks(wantToReadBooks, 'wantToReadShelf', false);
    displayShelfBooks(completedBooks, 'completedShelf', false);
    displayShelfBooks(pausedBooks, 'pausedShelf', false);

    document.getElementById('readingCount').textContent = `${readingBooks.length} llibres`;
    document.getElementById('wantToReadCount').textContent = `${wantToReadBooks.length} llibres`;
    document.getElementById('completedCount').textContent = `${completedBooks.length} llibres`;
    document.getElementById('pausedCount').textContent = `${pausedBooks.length} llibres`;
}

function displayShelfBooks(books, shelfId, isReadingShelf = false) {
    const shelf = document.getElementById(shelfId);
    shelf.innerHTML = '';

    if (books.length === 0) {
        shelf.innerHTML = '<p class="empty-shelf">No hi ha llibres en aquesta prestatgeria</p>';
        return;
    }

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';

        const stars = '★'.repeat(Math.floor(book.rating)) + '☆'.repeat(5 - Math.floor(book.rating));

        // Si és la secció de lectura, redirigeix a reading.html; si no, a book-details.html
        const primaryAction = isReadingShelf
            ? `<button class="btn-small btn-primary-action" onclick="continueReading(${book.id})">Continuar llegint</button>`
            : `<button class="btn-small" onclick="viewBookDetails(${book.id})">Veure</button>`;

        bookCard.innerHTML = `
            <div class="book-cover" onclick="${isReadingShelf ? `continueReading(${book.id})` : `viewBookDetails(${book.id})`}" style="cursor: pointer;"></div>
            <div class="book-title" onclick="${isReadingShelf ? `continueReading(${book.id})` : `viewBookDetails(${book.id})`}" style="cursor: pointer;">${book.title}</div>
            <div class="book-author">${book.author}</div>
            <div class="book-rating">
                <span class="stars">${stars}</span>
                <span class="rating-value">${book.rating}/5⭐</span>
            </div>
            <div class="book-actions">
                ${primaryAction}
                <button class="btn-small" onclick="manageBook(${book.id})">Organitza</button>
            </div>
        `;

        shelf.appendChild(bookCard);
    });
}

function viewBookDetails(bookId) {
    window.location.href = `book-details.html?id=${bookId}`;
}

function continueReading(bookId) {
    window.location.href = `reading.html?id=${bookId}`;
}

// gestio collecions
function loadCollections() {
    const collections = JSON.parse(localStorage.getItem(`collections_${currentUser.id}`) || '[]');
    const collectionsList = document.getElementById('collectionsList');

    collectionsList.innerHTML = '';

    if (collections.length === 0) {
        collectionsList.innerHTML = '<p class="empty-message">Encara no tens col·leccions. Crea la teva primera col·lecció</p>';
        return;
    }

    collections.forEach(collection => {
        const collectionCard = document.createElement('div');
        collectionCard.className = 'collection-card';

        const bookCount = collection.books ? collection.books.length : 0;

        collectionCard.innerHTML = `
            <div class="collection-header">
                <h3>${collection.name}</h3>
                <button class="btn-delete" onclick="deleteCollection('${collection.id}')" title="Eliminar col·lecció">
                    Eliminar
                </button>
            </div>
            <p class="collection-description">${collection.description || 'Sense descripció'}</p>
            <p class="collection-count">${bookCount} llibres</p>
            <button class="btn-small" onclick="viewCollection('${collection.id}')">Veure llibres</button>
        `;

        collectionsList.appendChild(collectionCard);
    });
}

function showCreateCollectionModal() {
    document.getElementById('createCollectionModal').classList.add('active');
    document.getElementById('collectionName').value = '';
    document.getElementById('collectionDescription').value = '';
}

function closeCreateCollectionModal() {
    document.getElementById('createCollectionModal').classList.remove('active');
}

function createCollection() {
    const name = document.getElementById('collectionName').value.trim();
    const description = document.getElementById('collectionDescription').value.trim();

    if (!name) {
        alert('Si us plau, introdueix un nom per la col·lecció');
        return;
    }

    const collections = JSON.parse(localStorage.getItem(`collections_${currentUser.id}`) || '[]');

    const newCollection = {
        id: Date.now().toString(),
        name: name,
        description: description,
        books: [],
        createdAt: new Date().toISOString()
    };

    collections.push(newCollection);
    localStorage.setItem(`collections_${currentUser.id}`, JSON.stringify(collections));

    closeCreateCollectionModal();
    loadCollections();
    updateStats();
}

function deleteCollection(collectionId) {
    if (!confirm('Estàs segur que vols eliminar aquesta col·lecció?')) {
        return;
    }

    let collections = JSON.parse(localStorage.getItem(`collections_${currentUser.id}`) || '[]');
    collections = collections.filter(c => c.id !== collectionId);
    localStorage.setItem(`collections_${currentUser.id}`, JSON.stringify(collections));

    loadCollections();
    updateStats();
}

function viewCollection(collectionId) {
    const collections = JSON.parse(localStorage.getItem(`collections_${currentUser.id}`) || '[]');
    const collection = collections.find(c => c.id === collectionId);

    if (!collection) return;

    const books = JSON.parse(localStorage.getItem('books') || '[]');
    const collectionBooks = books.filter(b => collection.books.includes(b.id));

    // For now, just show an alert. You could create a more sophisticated view
    alert(`Col·lecció: ${collection.name}\nLlibres: ${collectionBooks.map(b => b.title).join(', ') || 'Cap'}`);
}

function loadTags() {
    const tags = JSON.parse(localStorage.getItem(`tags_${currentUser.id}`) || '[]');
    const tagsList = document.getElementById('tagsList');

    tagsList.innerHTML = '';

    if (tags.length === 0) {
        tagsList.innerHTML = '<p class="empty-message">Encara no tens etiquetes. Crea la teva primera etiqueta!</p>';
        return;
    }

    tags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item';
        tagElement.style.backgroundColor = tag.color || '#3498db';

        const bookCount = tag.books ? tag.books.length : 0;

        tagElement.innerHTML = `
            <span class="tag-name">${tag.name}</span>
            <span class="tag-count">${bookCount}</span>
            <button class="tag-delete" onclick="deleteTag('${tag.id}')" title="Eliminar">×</button>
        `;

        tagsList.appendChild(tagElement);
    });
}

function showCreateTagModal() {
    document.getElementById('createTagModal').classList.add('active');
    document.getElementById('tagName').value = '';
}

function closeCreateTagModal() {
    document.getElementById('createTagModal').classList.remove('active');
}

function createTag() {
    const name = document.getElementById('tagName').value.trim();
    const color = document.getElementById('tagColor').value;

    if (!name) {
        alert('Si us plau, introdueix un nom per l\'etiqueta');
        return;
    }

    const tags = JSON.parse(localStorage.getItem(`tags_${currentUser.id}`) || '[]');

    const newTag = {
        id: Date.now().toString(),
        name: name,
        color: color,
        books: [],
        createdAt: new Date().toISOString()
    };

    tags.push(newTag);
    localStorage.setItem(`tags_${currentUser.id}`, JSON.stringify(tags));

    closeCreateTagModal();
    loadTags();
}

function deleteTag(tagId) {
    if (!confirm('Estàs segur que vols eliminar aquesta etiqueta?')) {
        return;
    }

    let tags = JSON.parse(localStorage.getItem(`tags_${currentUser.id}`) || '[]');
    tags = tags.filter(t => t.id !== tagId);
    localStorage.setItem(`tags_${currentUser.id}`, JSON.stringify(tags));

    loadTags();
}

// Manage book organization
function manageBook(bookId) {
    const books = JSON.parse(localStorage.getItem('books') || '[]');
    currentManagingBook = books.find(b => b.id === bookId);

    if (!currentManagingBook) return;

    document.getElementById('manageBookTitle').textContent = currentManagingBook.title;

    // Set current status
    const bookStatuses = JSON.parse(localStorage.getItem(`bookStatuses_${currentUser.id}`) || '{}');
    document.getElementById('bookStatus').value = bookStatuses[bookId] || 'want-to-read';

    // Load collections checkboxes
    const collections = JSON.parse(localStorage.getItem(`collections_${currentUser.id}`) || '[]');
    const collectionsDiv = document.getElementById('bookCollections');
    collectionsDiv.innerHTML = '';

    if (collections.length === 0) {
        collectionsDiv.innerHTML = '<p class="empty-message-small">No tens col·leccions</p>';
    } else {
        collections.forEach(collection => {
            const isInCollection = collection.books && collection.books.includes(bookId);
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" id="coll_${collection.id}" ${isInCollection ? 'checked' : ''}>
                <label for="coll_${collection.id}">${collection.name}</label>
            `;
            collectionsDiv.appendChild(checkbox);
        });
    }

    const tags = JSON.parse(localStorage.getItem(`tags_${currentUser.id}`) || '[]');
    const tagsDiv = document.getElementById('bookTags');
    tagsDiv.innerHTML = '';

    if (tags.length === 0) {
        tagsDiv.innerHTML = '<p class="empty-message-small">No tens etiquetes</p>';
    } else {
        tags.forEach(tag => {
            const hasTag = tag.books && tag.books.includes(bookId);
            const checkbox = document.createElement('div');
            checkbox.className = 'checkbox-item';
            checkbox.innerHTML = `
                <input type="checkbox" id="tag_${tag.id}" ${hasTag ? 'checked' : ''}>
                <label for="tag_${tag.id}" style="color: ${tag.color}">${tag.name}</label>
            `;
            tagsDiv.appendChild(checkbox);
        });
    }

    document.getElementById('manageBookModal').classList.add('active');
}

function closeManageBookModal() {
    document.getElementById('manageBookModal').classList.remove('active');
    currentManagingBook = null;
}

function saveBookOrganization() {
    if (!currentManagingBook) return;

    const bookId = currentManagingBook.id;

    // Save status
    const status = document.getElementById('bookStatus').value;
    const bookStatuses = JSON.parse(localStorage.getItem(`bookStatuses_${currentUser.id}`) || '{}');
    bookStatuses[bookId] = status;
    localStorage.setItem(`bookStatuses_${currentUser.id}`, JSON.stringify(bookStatuses));

    // Save collections
    let collections = JSON.parse(localStorage.getItem(`collections_${currentUser.id}`) || '[]');
    collections.forEach(collection => {
        const checkbox = document.getElementById(`coll_${collection.id}`);
        if (checkbox) {
            if (!collection.books) collection.books = [];
            const index = collection.books.indexOf(bookId);

            if (checkbox.checked && index === -1) {
                collection.books.push(bookId);
            } else if (!checkbox.checked && index !== -1) {
                collection.books.splice(index, 1);
            }
        }
    });
    localStorage.setItem(`collections_${currentUser.id}`, JSON.stringify(collections));

    let tags = JSON.parse(localStorage.getItem(`tags_${currentUser.id}`) || '[]');
    tags.forEach(tag => {
        const checkbox = document.getElementById(`tag_${tag.id}`);
        if (checkbox) {
            if (!tag.books) tag.books = [];
            const index = tag.books.indexOf(bookId);

            if (checkbox.checked && index === -1) {
                tag.books.push(bookId);
            } else if (!checkbox.checked && index !== -1) {
                tag.books.splice(index, 1);
            }
        }
    });
    localStorage.setItem(`tags_${currentUser.id}`, JSON.stringify(tags));

    closeManageBookModal();
    loadBookshelves();
    loadCollections();
    loadTags();
    updateStats();
}

function loadActivity() {
    const readingProgress = JSON.parse(localStorage.getItem(`progress_${currentUser.id}`) || '[]');
    const books = JSON.parse(localStorage.getItem('books') || '[]');

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let pagesThisMonth = 0;
    let hoursThisMonth = 0;
    let booksFinished = 0;

    readingProgress.forEach(progress => {
        // simplificat pel protip, no es comprova la data de lectura
        pagesThisMonth += progress.currentPage || 0;
        hoursThisMonth += progress.timeSpent || 0;
        if (progress.currentPage >= progress.totalPages) {
            booksFinished++;
        }
    });

    document.getElementById('pagesThisMonth').textContent = pagesThisMonth;
    document.getElementById('hoursThisMonth').textContent = Math.round(hoursThisMonth / 3600);
    document.getElementById('booksFinishedMonth').textContent = booksFinished;

    // Books by progress
    const booksByProgressDiv = document.getElementById('booksByProgress');
    booksByProgressDiv.innerHTML = '';

    const progressCategories = {
        'just-started': { label: 'Acabat de començar (0-10%)', books: [] },
        'in-progress': { label: 'En progrés (10-50%)', books: [] },
        'almost-done': { label: 'Quasi acabat (50-100%)', books: [] }
    };

    readingProgress.forEach(progress => {
        const book = books.find(b => b.id === progress.bookId);
        if (!book) return;

        const percentage = (progress.currentPage / progress.totalPages) * 100;

        if (percentage < 10) {
            progressCategories['just-started'].books.push(book);
        } else if (percentage < 50) {
            progressCategories['in-progress'].books.push(book);
        } else {
            progressCategories['almost-done'].books.push(book);
        }
    });

    Object.entries(progressCategories).forEach(([key, category]) => {
        const item = document.createElement('div');
        item.className = 'progress-category';
        item.innerHTML = `
            <p><strong>${category.label}:</strong> ${category.books.length} llibres</p>
        `;
        booksByProgressDiv.appendChild(item);
    });

    // Recent books
    const recentBooksDiv = document.getElementById('recentBooks');
    recentBooksDiv.innerHTML = '';

    const recentProgress = [...readingProgress].sort((a, b) =>
        (b.lastRead || 0) - (a.lastRead || 0)
    ).slice(0, 5);

    recentProgress.forEach(progress => {
        const book = books.find(b => b.id === progress.bookId);
        if (!book) return;

        const percentage = Math.round((progress.currentPage / progress.totalPages) * 100);

        const item = document.createElement('div');
        item.className = 'recent-book-item';
        item.style.cursor = 'pointer';
        item.style.transition = 'background-color 0.2s';

        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;" onclick="continueReading(${book.id})">
                    <p><strong>${book.title}</strong> <span style="color: #666; font-size: 12px;">- ${book.author}</span></p>
                    <p style="font-size: 12px; color: #666;">Pàgina ${progress.currentPage} de ${progress.totalPages} (${percentage}%)</p>
                    <div style="background-color: #e0e0e0; height: 6px; border-radius: 3px; margin-top: 5px;">
                        <div style="background-color: var(--primary-cyan); height: 100%; width: ${percentage}%; border-radius: 3px;"></div>
                    </div>
                </div>
                <button class="btn-small btn-primary-action" onclick="continueReading(${book.id})" style="margin-left: 15px;">
                    Continuar
                </button>
            </div>
        `;

        // Afegir hover effect
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = 'var(--light-gray)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });

        recentBooksDiv.appendChild(item);
    });

    if (recentProgress.length === 0) {
        recentBooksDiv.innerHTML = '<p class="empty-message-small">Encara no has llegit cap llibre</p>';
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}
