// ==========================================
// ЛОГИКА ИНТЕЛЛЕКТУАЛЬНОГО ПОИСКА ЦЕНТРОВ
// ==========================================

let searchTimeout = null;

if (searchInput) {
    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        const filter = searchFilter.value;

        if (query.length < 2) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }

        searchTimeout = setTimeout(() => {
            fetch(`/api/map/search?query=${encodeURIComponent(query)}&filter=${filter}`)
                .then(res => res.json())
                .then(data => {
                    searchResults.innerHTML = '';

                    if (data.length === 0) {
                        searchResults.innerHTML = '<div class="search-result-item"><p style="text-align:center;">Ничего не найдено</p></div>';
                        searchResults.style.display = 'block';
                        return;
                    }

                    data.forEach(center => {
                        const item = document.createElement('div');
                        item.className = 'search-result-item';
                        item.innerHTML = `
                                <h4>${center.name}</h4>
                                <p>📍 ${center.locationInfo}</p>
                            `;

                        item.addEventListener('click', () => {
                            searchResults.style.display = 'none';
                            searchInput.value = '';
                            openFullView(center);
                        });

                        searchResults.appendChild(item);
                    });

                    searchResults.style.display = 'block';
                })
                .catch(err => console.error("Ошибка поиска:", err));
        }, 300);
    });
}

// Закрываем выпадающий список поиска, если кликнули мимо него
document.addEventListener('click', function (e) {
    if (searchResults && !e.target.closest('.search-container')) {
        searchResults.style.display = 'none';
    }
});