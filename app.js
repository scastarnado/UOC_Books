// Constants
const genres = [
    'Ficció',
    'No-ficció',
    'Ciència-ficció',
    'Fantasia',
    'Misteri',
    'Thriller',
    'Romàntic',
    'Històric',
    'Biografies',
    'Assaig'
];

const languages = [
    'Català',
    'Castellà',
    'Anglès',
    'Francès',
    'Alemany'
];

const formats = [
    'Llibre',
    'Àudio'
];

const authors = [
    'Maria Barbal', 'Mercè Rodoreda', 'Joan Margarit', 'Jaume Cabré',
    'Albert Sánchez Piñol', 'Carme Riera', 'Gabriel García Márquez',
    'Isabel Allende', 'Jordi Sierra i Fabra', 'Laura Esquivel',
    'Carlos Ruiz Zafón', 'Arturo Pérez-Reverte', 'Rosa Montero',
    'Almudena Grandes', 'Javier Marías', 'Eduardo Mendoza',
    'Manuel Rivas', 'Bernardo Atxaga', 'Dolores Redondo',
    'Carmen Laforet', 'Ana María Matute', 'Miguel Delibes'
];

const bookTitles = [
    'Pedra de tartera', 'La plaça del Diamant', 'El vol de la senyora',
    'Les veus del Pamano', 'La pell freda', 'Temps d\'una espera',
    'Cent anys de solitud', 'La casa dels esperits', 'Marina',
    'Com aigua per xocolata', 'L\'ombra del vent', 'El capità Alatriste',
    'La ridícula idea de no tornar-te a veure', 'Episodis d\'una guerra interminable',
    'Així em plau', 'L\'art de volar', 'La meitat del món',
    'Obabakoak', 'Tot això et donaré', 'Nada', 'Primera memòria',
    'El camí', 'La veritat sobre el cas Harry Quebert', 'L\'últim hivern',
    'La catedral del mar', 'Els hereus de la terra', 'Patria',
    'El temps entre costures', 'La templanza', 'Sira'
];

// Book cover images
const bookCovers = [
    'media/gnome.png',
    'media/red_woods.png',
    'media/sand.png',
    'media/ice.png',
];

const BOOKS_TO_GENERATE = 100;

function initializeBooksData() {
    let books = JSON.parse(localStorage.getItem('books') || '[]');

    if (books.length === 0) {
        books = [];
        for (let i = 0; i < BOOKS_TO_GENERATE; i++) {
            const title = bookTitles[Math.floor(Math.random() * bookTitles.length)];
            const author = authors[Math.floor(Math.random() * authors.length)];
            const genre = genres[Math.floor(Math.random() * genres.length)];
            const language = languages[Math.floor(Math.random() * languages.length)];
            const format = formats[Math.floor(Math.random() * formats.length)];
            const pages = Math.floor(Math.random() * 500) + 100; // pàgines entre 100 i 600
            const year = Math.floor(Math.random() * 77) + 1950; // anys de release del llibre des de 1950 fins 2026
            const rating = (Math.random() * 4 + 1).toFixed(1); // posar minim 1 estrella
            const readTimeHours = Math.ceil(pages / 50); // posar 50 minuts com a màxim per llegir qualsevol llibre
            const coverImage = bookCovers[i % bookCovers.length]; // ciclar a través de les imatges disponibles

            // aquest serà el model de Llibre
            books.push({
                id: i + 1,
                title: title,
                author: author,
                genre: genre,
                language: language,
                format: format,
                pages: pages,
                year: year,
                rating: parseFloat(rating),
                readTime: `${readTimeHours} hores (aproximadament)`,
                readTimeValue: readTimeHours,
                edition: `${Math.floor(Math.random() * 5) + 1}a`, // edicio entre 1a i 5a
                coverImage: coverImage,
                description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel mollis dolor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Maecenas iaculis molestie velit, vitae volutpat augue condimentum in. Ut in sapien sed leo lobortis tempor. Duis quis tortor scelerisque, vulputate orci at, posuere lacus. Curabitur dapibus, turpis efficitur vulputate malesuada, justo neque maximus lacus, sed rhoncus urna arcu nec est. Quisque interdum elit eu pretium auctor. Interdum et malesuada fames ac ante ipsum primis in faucibus. Maecenas sed imperdiet est. Vestibulum nec euismod massa. Duis vestibulum massa sed lacus feugiat faucibus. Aliquam vitae orci lacus.`,
                featured: Math.random() > 0.8, // nombres aleatoris per marcar alguns llibres com a destacats
                recommended: Math.random() > 0.7 // nombres aleatoris per marcar alguns llibres com a recomanats
            });
        }

        localStorage.setItem('books', JSON.stringify(books));
    }

    return books;
}

function initializeYearFilters() {
    const currentYear = new Date().getFullYear();
    const filterYearFrom = document.getElementById('filterYearFrom');
    const filterYearTo = document.getElementById('filterYearTo');

    for (let year = currentYear; year >= 1950; year--) {
        const optionFrom = document.createElement('option');
        optionFrom.value = year;
        optionFrom.textContent = year;
        filterYearFrom.appendChild(optionFrom);

        const optionTo = document.createElement('option');
        optionTo.value = year;
        optionTo.textContent = year;
        filterYearTo.appendChild(optionTo);
    }
}

function displayBooks(books, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = '';

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.onclick = () => viewBookDetails(book.id);

        const stars = '★'.repeat(Math.floor(book.rating)) + '☆'.repeat(5 - Math.floor(book.rating));

        let tempBookTitle = book.title;
        if (book.title.length > 23) {
            tempBookTitle = book.title.substring(0, 20) + '...';
        }

        bookCard.innerHTML = `
            <div class="book-cover">
                <img src="${book.coverImage}" alt="${book.title}" onerror="this.style.display='none'">
            </div>
            <div class="book-title" title="${book.title}">${tempBookTitle}</div>
            <div class="book-author">${book.author}</div>
            <div class="book-rating">
                <span class="stars">${stars}</span>
                <span class="rating-value">${book.rating}/5⭐</span>
            </div>
        `;

        // afegir un comentari de recomanacio
        // els comentaris son aleatoris i no es basen en cap dada real
        // nomes serveixen per donar una mica de context
        if (gridId === 'recommendationsGrid' && book.recommended) {
            const recommendationReasons =
                ['Perquè t\'agrada el gènere',
                    'Perquè has llegit llibres similars',
                    'Perquè és un dels més valorats',
                    'Perquè és un dels més llegits',
                    'Perquè és una novetat que encaixa amb els teus gustos'
                ];
            const reason = recommendationReasons[Math.floor(Math.random() * recommendationReasons.length)];
            const recommendedBadge = document.createElement('div');
            recommendedBadge.className = 'recommended-badge';
            recommendedBadge.textContent = reason;
            bookCard.appendChild(recommendedBadge);
        }

        grid.appendChild(bookCard);
    });
}

function viewBookDetails(bookId) {
    window.location.href = `book-details.html?id=${bookId}`;
}

function searchBooks() {
    // buscar per titol del llibre o per autor
    // en un entorn real potser es pot afegir el isbn o altres camps
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const books = JSON.parse(localStorage.getItem('books') || '[]');

    if (!searchTerm || searchTerm.trim() === '') {
        document.querySelector('#continueReadingSection').style.display = 'block';
        document.querySelector('#recommendedSection').style.display = 'block';
        document.querySelector('#featuredSection').style.display = 'block';

        displayAllBooks(books);
        return;
    }

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm)
    );

    displayBooks(filteredBooks, 'allBooksGrid');

    document.querySelector('#continueReadingSection').style.display = 'none';
    document.querySelector('#recommendedSection').style.display = 'none';
    document.querySelector('#featuredSection').style.display = 'none';

    // Update section titles
    const sections = document.querySelectorAll('.section-title');
    if (sections.length > 0) {
        sections[sections.length - 1].textContent = `RESULTATS DE LA CERCA (${filteredBooks.length})`;
    }
}

function toggleFiltersSection() {
    const filtersSection = document.querySelector('.filters-section');
    if (filtersSection.style.display === 'none') {
        filtersSection.style.display = 'block';
    } else {
        filtersSection.style.display = 'none';
    }
}

function applyFilters() {
    const books = JSON.parse(localStorage.getItem('books') || '[]');

    const filterName = document.getElementById('filterName').value.toLowerCase();
    const filterLanguage = document.getElementById('filterLanguage').value;
    const filterGenre = document.getElementById('filterGenre').value;
    const filterYearFrom = document.getElementById('filterYearFrom').value;
    const filterYearTo = document.getElementById('filterYearTo').value;
    const filterReadTime = document.getElementById('filterReadTime').value;
    const filterAuthor = document.getElementById('filterAuthor').value.toLowerCase();
    const filterRating = document.getElementById('filterRating').value;
    const filterAudio = document.getElementById('filterAudio').checked;
    const filterBook = document.getElementById('filterBook').checked;

    let filteredBooks = books.filter(book => {
        // name
        if (filterName && !book.title.toLowerCase().includes(filterName) && !book.description.toLowerCase().includes(filterName)) {
            return false;
        }

        // language
        if (filterLanguage && book.language !== filterLanguage) {
            return false;
        }

        // genre
        if (filterGenre && book.genre !== filterGenre) {
            return false;
        }

        // year
        if (filterYearFrom && book.year < parseInt(filterYearFrom)) {
            return false;
        }
        if (filterYearTo && book.year > parseInt(filterYearTo)) {
            return false;
        }

        // read time
        if (filterReadTime) {
            const [min, max] = filterReadTime.split('-').map(v => v.replace('+', ''));
            const minHours = parseInt(min);
            const maxHours = max ? parseInt(max) : Infinity;

            if (book.readTimeValue < minHours || book.readTimeValue > maxHours) {
                return false;
            }
        }

        // author
        if (filterAuthor && !book.author.toLowerCase().includes(filterAuthor)) {
            return false;
        }

        // rating
        if (filterRating && book.rating < parseFloat(filterRating)) {
            return false;
        }

        // format
        if ((filterAudio || filterBook) && !(filterAudio && filterBook)) {
            if (filterAudio && book.format !== 'Àudio') {
                return false;
            }
            if (filterBook && book.format !== 'Llibre') {
                return false;
            }
        }

        return true;
    });

    displayBooks(filteredBooks.filter(b => b.recommended), 'recommendationsGrid');
    displayBooks(filteredBooks.filter(b => b.featured), 'featuredGrid');
    displayBooks(filteredBooks, 'allBooksGrid');

    const sections = document.querySelectorAll('.section-title');
    if (sections.length >= 3) {
        sections[0].innerHTML = `RECOMANACIONS (${filteredBooks.filter(b => b.recommended).length})`;
        sections[1].innerHTML = `DESTACATS (${filteredBooks.filter(b => b.featured).length})`;
        sections[2].innerHTML = `TOTS ELS LLIBRES (${filteredBooks.length})`;
    }
}

// mostrar tots els llibres (potser no es la millor de les idees pel rendiment) 
function displayAllBooks(books) {
    const recommended = books.filter(b => b.recommended).slice(0, 12);
    const featured = books.filter(b => b.featured).slice(0, 12);

    displayBooks(recommended, 'recommendationsGrid');
    displayBooks(featured, 'featuredGrid');
    displayBooks(books, 'allBooksGrid');
}

function loadContinueReading() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) return;

    const readingProgress = JSON.parse(localStorage.getItem(`progress_${currentUser.id}`) || '[]');

    if (readingProgress.length > 0) {
        const continueReadingSection = document.getElementById('continueReadingSection');
        const continueReadingGrid = document.getElementById('continueReadingGrid');

        const books = JSON.parse(localStorage.getItem('books') || '[]');
        const continueBooks = readingProgress
            .filter(p => p.currentPage < p.totalPages)
            .map(p => books.find(b => b.id === p.bookId))
            .filter(b => b);

        if (continueBooks.length > 0) {
            continueReadingSection.style.display = 'block';
            displayBooks(continueBooks, 'continueReadingGrid');
        }
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

window.addEventListener('load', () => {
    const currentUser = localStorage.getItem('currentUser');

    const userActions = document.querySelector('.user-actions');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        userActions.innerHTML = `
            <span style="margin-right: 15px; color: var(--primary-blue);">Hola, ${user.name}</span>
            <button class="btn" onclick="logout()">Tancar sessió</button>
        `;
        loadContinueReading();
    } else {
        userActions.innerHTML = `
            <button class="btn" onclick="window.location.href='login.html'">Registra't</button>
            <button class="btn" onclick="window.location.href='login.html'">Inicia sessió</button>
        `;
    }

    const books = initializeBooksData();
    initializeYearFilters();

    displayAllBooks(books);

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBooks();
        }
    });
});
