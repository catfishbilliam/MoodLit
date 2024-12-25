const API_KEY = 'BOOKS_API'; // Updated API key variable

// Search Books Function
const searchBooks = async (query, genre, sort) => {
    try {
        let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;

        // Apply Genre Filter
        if (genre) {
            url += `+subject:${encodeURIComponent(genre)}`;
        }

        // Apply Sorting
        if (sort === 'newest') {
            url += '&orderBy=newest';
        } else if (sort === 'relevance') {
            url += '&orderBy=relevance';
        }

        url += `&key=${API_KEY}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching books:', error);
        return [];
    }
};

// Display Books in Grid
const displayBooks = (books) => {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    books.slice(0, 10).forEach((book, index) => {
        const bookInfo = book.volumeInfo;
        const thumbnail = bookInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover';
        const title = bookInfo.title || 'No Title';
        const author = bookInfo.authors?.join(', ') || 'Unknown';
        const description = bookInfo.description || 'No description available.';
        const publishedDate = bookInfo.publishedDate || 'Unknown';
        const infoLink = bookInfo.infoLink || '#';

        const bookElement = document.createElement('div');
        bookElement.classList.add('book');
        bookElement.innerHTML = `
            <img src="${thumbnail}" alt="Book Cover" />
            <h3>${title}</h3>
        `;

        // Add Click Event to Open Modal
        bookElement.addEventListener('click', () => {
            openModal(title, author, publishedDate, description, infoLink);
        });

        resultsContainer.appendChild(bookElement);

        // GSAP Animation for Book Cards
        gsap.from(bookElement, {
            duration: 0.8,
            opacity: 0,
            scale: 0.5,
            y: 30,
            delay: index * 0.1,
            ease: "power2.out"
        });
    });
};

// Open Modal
const openModal = (title, author, date, description, link) => {
    const modal = document.getElementById('modal');
    const modalOverlay = document.getElementById('modal-overlay');

    modal.innerHTML = `
        <span class="modal-close" id="modal-close">&times;</span>
        <div class="modal-content">
            <h3>${title}</h3>
            <p><strong>Author:</strong> ${author}</p>
            <p><strong>Published:</strong> ${date}</p>
            <p>${description}</p>
            <a href="${link}" target="_blank">More Info</a>
        </div>
    `;

    modal.style.display = 'block';
    modalOverlay.style.display = 'block';

    // Close Modal
    document.getElementById('modal-close').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
};

// Close Modal
const closeModal = () => {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
};

// Handle Search with NLP.js
const handleSearch = async () => {
    const query = document.getElementById('quoteInput').value.trim();
    const genre = document.getElementById('genre').value;
    const sort = document.getElementById('sort').value;

    if (!query) {
        alert('Please enter a quote or description!');
        return;
    }

    const books = await searchBooks(query, genre, sort);
    displayBooks(books);

    // Smooth scroll to results
    document.getElementById('results-container').scrollIntoView({ behavior: 'smooth' });
};

// Event Listeners
document.getElementById('searchButton').addEventListener('click', handleSearch);
document.getElementById('quoteInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSearch(); // Trigger search
    }
});

// Filter Change Listeners
document.getElementById('genre').addEventListener('change', handleSearch);
document.getElementById('sort').addEventListener('change', handleSearch);
