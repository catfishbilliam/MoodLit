const API_KEY = 'AIzaSyCkFdrDb2GAryNOrQT6s3kEyioQfvtQkVk';
const OPENAI_API_KEY = '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';

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
                        content: 'You are a helpful assistant that extracts keywords and topics from text.'
                    },
                    {
                        role: 'user',
                        content: `Extract up to 5 keywords or short phrases that describe the main themes or topics from this text: "${text}".`
                    }
                ],
                max_tokens: 50,
                temperature: 0.3
            })
        });

        if (!response.ok) throw new Error('Failed to fetch keywords from ChatGPT API');

        const data = await response.json();
        const result = data.choices[0].message.content.trim();

        console.log(`Extracted Keywords: "${result}"`);
        return result || text; // Fallback to full input if empty
    } catch (error) {
        console.error('Error extracting keywords with ChatGPT:', error);
        return text; // Fallback to input if API fails
    }
};

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
        url += `&key=${API_KEY}`;

        console.log(`API Request URL: ${url}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        console.log('API Response:', data);

        const currentYear = new Date().getFullYear();
        const filteredBooks = (data.items || []).filter(book => {
            const publishedDate = book.volumeInfo.publishedDate || '';
            const year = parseInt(publishedDate.split('-')[0]);
            return year && year >= (currentYear - 15);
        });

        console.log(`Filtered Books (Last 15 Years): ${filteredBooks.length}`);
        return filteredBooks.length > 0 ? filteredBooks : data.items || [];
    } catch (error) {
        console.error('Error fetching books:', error);
        return [];
    }
};

const displayBooks = (books) => {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    console.log(`Books Found: ${books.length}`);
    books.slice(0, 15).forEach((book) => {
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

const closeModal = () => {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
};

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

document.getElementById('searchButton').addEventListener('click', handleSearch);
document.getElementById('quoteInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
});
document.getElementById('genre').addEventListener('change', handleSearch);
document.getElementById('sort').addEventListener('change', handleSearch);
document.getElementById('language')?.addEventListener('change', handleSearch);
