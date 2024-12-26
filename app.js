const API_KEY = import.meta.env.VITE_BOOKS_API; // Use environment variable

// Analyze Input with Compromise.js for Emotion and Themes
const analyzeInput = (input) => {
    console.log('Original Input:', input); // Log the raw input

    const doc = nlp(input); // Process input using Compromise.js

    // Extract nouns for themes
    const themes = doc.nouns().out('array'); 
    console.log('Extracted Themes (Nouns):', themes); // Log extracted themes (nouns)

    // Detect emotions based on adjectives
    const emotions = doc.adjectives().out('array');
    console.log('Extracted Emotions (Adjectives):', emotions); // Log extracted emotions (adjectives)

    // Combine themes and emotions into one query string
    let query = themes.join(' '); // Start with themes

    if (emotions.length > 0) {
        query += ` ${emotions.join(' ')}`; // Append emotions
    }

    console.log('Final Processed Query:', query.trim() || input); // Log the final query

    return query.trim() || input; // Fallback to the original input
};

// Search Books Function
const searchBooks = async (query, genre, sort, language) => {
    try {
        // Construct URL with processed query
        let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;

        // Add Genre Filter
        if (genre) {
            url += `+subject:${encodeURIComponent(genre)}`;
        }

        // Filter for Books Only
        url += '&printType=books';

        // Language Filter
        if (language) {
            url += `&langRestrict=${language}`;
        }

        // Apply Sorting
        if (sort === 'newest') {
            url += '&orderBy=newest';
        } else if (sort === 'relevance') {
            url += '&orderBy=relevance';
        }

        // API Key and Limits
        url += '&maxResults=20';
        url += `&key=${API_KEY}`;

        console.log('Fetching books from URL:', url); // Log API URL

        // Fetch Data
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        console.log('Books API Response:', data); // Log full API response

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

    console.log('Displaying books:', books); // Log all books being displayed

    books.slice(0, 25).forEach((book, index) => {
        const bookInfo = book.volumeInfo;
        const thumbnail = bookInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover';
        const title = bookInfo.title || 'No Title';
        const author = bookInfo.authors?.join(', ') || 'Unknown';
        const description = bookInfo.description || 'No description available.';
        const publishedDate = bookInfo.publishedDate || 'Unknown';
        const infoLink = bookInfo.infoLink || '#';

        console.log(`Book ${index + 1}:`, {
            title,
            author,
            description,
            publishedDate,
            infoLink,
        }); // Log each book's details

        // Create Book Card
        const bookElement = document.createElement('div');
        bookElement.classList.add('book');
        bookElement.innerHTML = `
            <img src="${thumbnail}" alt="Book Cover" />
            <h3>${title}</h3>
        `;

        // Open Modal Event
        bookElement.addEventListener('click', () => {
            openModal(title, author, publishedDate, description, infoLink);
        });

        resultsContainer.appendChild(bookElement);
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

    console.log('Modal Opened:', { title, author, date, description });
};

// Close Modal
const closeModal = () => {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
    console.log('Modal Closed');
};

// Handle Search Function
const handleSearch = async () => {
    const query = document.getElementById('quoteInput').value.trim();
    const genre = document.getElementById('genre').value;
    const sort = document.getElementById('sort').value;

    if (!query) {
        alert('Please enter a quote or description!');
        return;
    }

    // Analyze input using NLP (Compromise.js)
    const processedQuery = analyzeInput(query); // Apply NLP analysis

    console.log('Search Triggered:', { query, processedQuery, genre, sort });

    const books = await searchBooks(processedQuery, genre, sort);
    displayBooks(books);

    // Smooth Scroll to Results
    document.getElementById('results-container').scrollIntoView({ behavior: 'smooth' });
};

// Event Listeners
document.getElementById('searchButton').addEventListener('click', handleSearch);
document.getElementById('quoteInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

// Filter Change Listeners
document.getElementById('genre').addEventListener('change', handleSearch);
document.getElementById('sort').addEventListener('change', handleSearch);
