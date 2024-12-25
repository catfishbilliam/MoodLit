const BOOKS_KEY = 'AIzaSyCkFdrDb2GAryNOrQT6s3kEyioQfvtQkVk';
const OPENAI_API_KEY = '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';


// Extract Keywords using OpenAI GPT
const extractKeywords = async (text) => {
    console.log(`Raw Input: "${text}"`);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are an AI assistant skilled at extracting keywords and topics. Return 3-5 key themes as comma-separated values (e.g., "love, loss, friendship").' 
                    },
                    { 
                        role: 'user', 
                        content: `Extract keywords from this text: "${text}". Focus on main topics, emotions, and themes.` 
                    }
                ],
                max_tokens: 60,        // Limits the response length
                temperature: 0.2,      // Reduces randomness for consistency
                top_p: 0.9,            // Enables nucleus sampling for better diversity
                frequency_penalty: 0,  // Avoids penalizing repeated terms
                presence_penalty: 0.6  // Encourages new keywords without forcing repetition
            })
        });

        // Check response status
        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`OpenAI API Error: ${errorMessage}`);
        }

        const data = await response.json();
        const result = data.choices[0].message.content.trim();

        console.log(`Extracted Keywords: "${result}"`);
        return result || text; // Fallback to full input if no keywords
    } catch (error) {
        console.error('Error extracting keywords with ChatGPT:', error.message);
        alert('Failed to fetch keywords. Please check your network or API key.');
        return text; // Fallback to input if API fails
    }
};

// Search Books using Google Books API
const searchBooks = async (query, genre, sort, language) => {
    try {
        let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;

        if (genre) {
            url += `+subject:${encodeURIComponent(genre)}`;
        }

        if (genre === 'history') {
            url += `+-subject:manuscripts+-subject:documents`;
        }

        url += '&printType=books';

        if (language) {
            url += `&langRestrict=${language}`;
        }

        if (sort === 'newest') {
            url += '&orderBy=newest';
        } else if (sort === 'relevance') {
            url += '&orderBy=relevance';
        }

        url += '&maxResults=40';
        url += `&key=${BOOKS_KEY}`; // Fixed variable name

        console.log(`API Request URL: ${url}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch books from Google API');
        const data = await response.json();
        console.log('API Response:', data);

        const currentYear = new Date().getFullYear();
        const filteredBooks = (data.items || []).filter(book => {
            const publishedDate = book.volumeInfo.publishedDate || '';
            const year = parseInt(publishedDate.split('-')[0]);
            return year && year >= (currentYear - 25); // Last 15 years
        });

        console.log(`Filtered Books (Last 15 Years): ${filteredBooks.length}`);
        return filteredBooks.length > 0 ? filteredBooks : data.items || [];
    } catch (error) {
        console.error('Error fetching books:', error.message);
        alert('Failed to fetch books. Please try again later.');
        return [];
    }
};


// Display Books in Results Grid
const displayBooks = (books) => {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    console.log(`Books Found: ${books.length}`);
    books.forEach((book) => {
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
            <p><strong>Published:</strong> ${publishedDate}</p>
        `;

        bookElement.addEventListener('click', () => {
            openModal(title, author, publishedDate, description, infoLink);
        });

        resultsContainer.appendChild(bookElement);
    });
};

// Modal Handling
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
    const input = document.getElementById('quoteInput').value.trim();
    const genre = document.getElementById('genre').value;
    const sort = document.getElementById('sort').value;
    const language = document.getElementById('language')?.value || '';

    if (!input) {
        alert('Please enter a quote or description!');
        return;
    }

    const query = await extractKeywords(input);
    let books = await searchBooks(query, genre, sort, language);

    if (books.length === 0) {
        console.log('No results found with extracted keywords. Retrying with full input...');
        books = await searchBooks(input, genre, sort, language);
    }

    displayBooks(books);
    document.getElementById('results-container').scrollIntoView({ behavior: 'smooth' });
};

// Event Listeners
document.getElementById('searchButton').addEventListener('click', handleSearch);
