// Google Books API Key
const API_KEY = 'AIzaSyCkFdrDb2GAryNOrQT6s3kEyioQfvtQkVk';

// Extract Keywords using Compromise.js (NLP)
const extractKeywords = (text) => {
    console.log(`Raw Input: "${text}"`); // Log raw input text

    // Process input with Compromise.js
    const doc = nlp(text);

    // Extract meaningful parts of speech
    const nouns = doc.nouns().out('array'); // Subjects or objects
    const adjectives = doc.adjectives().out('array'); // Descriptors
    const verbs = doc.verbs().out('array'); // Actions

    // Combine and prioritize keywords
    const keywords = [...nouns, ...adjectives, ...verbs];
    const result = keywords.slice(0, 5).join(' ') || text; // Fallback to input if no keywords

    console.log(`Extracted Keywords: "${result}"`); // Log extracted keywords
    return result;
};

// Search Books Function
const searchBooks = async (query, genre, sort, language) => {
    try {
        // Construct base URL with query
        let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;

        // Apply Genre Filter
        if (genre) {
            url += `+subject:${encodeURIComponent(genre)}`;
        }

        // Filter for History without Artifacts or Documents
        if (genre === 'history') {
            url += `+-subject:manuscripts+-subject:documents`;
        }

        // Restrict to Books Only (Exclude Magazines)
        url += '&printType=books';

        // Language Filter
        if (language) {
            url += `&langRestrict=${language}`;
        }

        // Sorting Filter
        if (sort === 'newest') {
            url += '&orderBy=newest'; // Most recent
        } else if (sort === 'relevance') {
            url += '&orderBy=relevance'; // Most relevant
        }

        // Set Max Results
        url += '&maxResults=40'; // Fetch more results initially for filtering
        url += `&key=${API_KEY}`; // Add API Key

        console.log(`API Request URL: ${url}`); // Log the final API request URL

        // Fetch Data from API
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        console.log('API Response:', data); // Log API response

        // Filter results by publication date (last 10 years)
        const currentYear = new Date().getFullYear();
        const filteredBooks = (data.items || []).filter(book => {
            const publishedDate = book.volumeInfo.publishedDate || '';
            const year = parseInt(publishedDate.split('-')[0]); // Extract year from date
            return year && year >= (currentYear - 15); // Only include books within 10 years
        });

        console.log(`Filtered Books (Last 10 Years): ${filteredBooks.length}`); // Log filtered books
        return filteredBooks;
    } catch (error) {
        console.error('Error fetching books:', error);
        return [];
    }
};

// Display Books in Grid
const displayBooks = (books) => {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = ''; // Clear previous results

    // Log the number of books returned
    console.log(`Books Found: ${books.length}`);

    // Loop through each book and display it
    books.slice(0, 15).forEach((book) => {
        const bookInfo = book.volumeInfo;

        // Extract book details with fallbacks
        const thumbnail = bookInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover';
        const title = bookInfo.title || 'No Title';
        const author = bookInfo.authors?.join(', ') || 'Unknown';
        const description = bookInfo.description || 'No description available.';
        const publishedDate = bookInfo.publishedDate || 'Unknown';
        const infoLink = bookInfo.infoLink || '#';

        // Create book element
        const bookElement = document.createElement('div');
        bookElement.classList.add('book');
        bookElement.innerHTML = `
            <img src="${thumbnail}" alt="Book Cover" />
            <h3>${title}</h3>
            <p><strong>Published:</strong> ${publishedDate}</p>
        `;

        // Add click event to open modal
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

    // Populate modal content
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

    // Close modal event
    document.getElementById('modal-close').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
};

// Close Modal
const closeModal = () => {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
};

// Handle Search
const handleSearch = async () => {
    const input = document.getElementById('quoteInput').value.trim(); // Get user input
    const genre = document.getElementById('genre').value; // Genre filter
    const sort = document.getElementById('sort').value; // Sorting filter
    const language = document.getElementById('language')?.value || ''; // Language filter

    // Validate input
    if (!input) {
        alert('Please enter a quote or description!');
        return;
    }

    // Extract Keywords from Input using NLP
    const query = extractKeywords(input);

    // Fetch books based on keywords
    const books = await searchBooks(query, genre, sort, language);
    displayBooks(books);

    // Smooth scroll to results
    document.getElementById('results-container').scrollIntoView({ behavior: 'smooth' });
};

// Event Listeners
document.getElementById('searchButton').addEventListener('click', handleSearch);
document.getElementById('quoteInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSearch(); // Trigger search on Enter
    }
});

// Filter Change Listeners
document.getElementById('genre').addEventListener('change', handleSearch);
document.getElementById('sort').addEventListener('change', handleSearch);
document.getElementById('language')?.addEventListener('change', handleSearch);
