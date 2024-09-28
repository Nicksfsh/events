document.addEventListener('DOMContentLoaded', () => {
    const eventsGrid = document.getElementById('events-grid');
    const searchInput = document.getElementById('search');
    const searchError = document.getElementById('search-error');
    const registerModal = document.getElementById('register-modal');
    const registerForm = document.getElementById('register-form');
    const registerError = document.getElementById('register-error');
    const participantModal = document.getElementById('view-modal');
    const participantSearchInput = document.getElementById('participant-search');
    const participantSearchButton = document.getElementById('participant-search-button');
    const participantSearchError = document.getElementById('participant-search-error');
    const participantsGrid = document.getElementById('participants-grid');
    const participantsStatistics = document.getElementById('participants-statistics');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const firstPageButton = document.getElementById('first-page');
    const lastPageButton = document.getElementById('last-page');
    const pageInfo = document.getElementById('page-info');
    const locationSelect = document.getElementById('location');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const applyFiltersButton = document.getElementById('apply-filters');
    const clearFiltersButton = document.getElementById('clear-filters');
    const viewModal = document.getElementById('view-modal');
    const closeViewBtn = document.querySelector('.close-view-btn');

    async function loadLocations() {
        try {
            const response = await fetch('/api/events/locations');
            const data = await response.json();
            data.locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location.locationName;
                option.text = location.locationName;
                locationSelect.add(option);
            });
        } catch (error) {
            console.error('Error loading locations:', error);
        }
    }

    loadLocations();

    clearFiltersButton.addEventListener('click', () => {

        searchInput.value = '';
        searchError.textContent = '';

        locationSelect.selectedIndex = 0;

        startDateInput.value = '';
        endDateInput.value = '';

        loadEvents();
    });

    let currentPage = 1;
    const eventsPerPage = 8;
    let totalPages = 1;

    const clearRegisterForm = () => {
        document.getElementById('fullName').value = '';
        document.getElementById('email').value = '';
        document.getElementById('dateOfBirth').value = '';
        const checkedRadio = document.querySelector('input[name="source"]:checked');
        if (checkedRadio) {
            checkedRadio.checked = false;
        }
        registerError.textContent = '';
    };


    const updatePageInfo = (currentPage, totalPages) => {
        pageInfo.textContent = `Сторінка ${currentPage} з ${totalPages}`;
    };

    const loadEvents = async (page = 1, query = '', location = '', startDate = '', endDate = '') => {
        try {
            const response = await fetch(`/api/events?page=${page}&limit=${eventsPerPage}&query=${query}&location=${location}&startDate=${startDate}&endDate=${endDate}`);
            const data = await response.json();
            renderEvents(data.events);
            totalPages = Math.ceil(data.totalEvents / eventsPerPage);
            updatePagination(data.totalEvents, page);
            updatePageInfo(page, totalPages);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    applyFiltersButton.addEventListener('click', async () => {
        const location = locationSelect.value;
        const startDate = startDateInput.value ? new Date(startDateInput.value).toISOString().slice(0, 10) : '';
        const endDate = endDateInput.value ? new Date(endDateInput.value).toISOString().slice(0, 10) : '';

        try {
            const response = await fetch(`/api/events?limit=${eventsPerPage}&query=${searchInput.value}&location=${location}&startDate=${startDate}&endDate=${endDate}`);
            const data = await response.json();
            totalPages = Math.ceil(data.totalEvents / eventsPerPage);
        } catch (error) {
            console.error('Error fetching total events for pagination:', error);
        }
        currentPage = 1;  // Reset to first page when applying filters
        loadEvents(1, searchInput.value, location, startDate, endDate); // Load first page with filters
    });


    const renderEvents = (events) => {
        eventsGrid.innerHTML = '';
        if (events.length === 0) {
            eventsGrid.innerHTML = '<p class="no-events-message">Такого заходу немає, уточніть запит</p>';
            return;
        }
        events.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.classList.add('event-card');
            eventCard.innerHTML = `
            <img alt="${event.name}" src="${event.image}" title="${event.name}">
            <h2>${event.name}</h2>
            <p>${event.addressLocality}</p>
            <p>${new Date(event.startDate).toLocaleDateString('uk-UA')} ${new Date(event.startDate).toLocaleTimeString('uk-UA')}</p>
            <p>${event.locationName}</p>
            <div class="event-card-footer">
                <a href="#" class="register-btn" data-eventid="${event._id}">Register</a>
                <a href="#" class="view-btn" data-eventid="${event._id}">View</a>
                <div data-source="${event.url}" class="source-btn">Інформація отримана з karabas.com</div>
            </div>
        `;

            eventsGrid.appendChild(eventCard);
            document.querySelector('.register-btn').addEventListener('click', function (event) {
                event.preventDefault();
                const eventId = this.getAttribute('data-eventid');
            });
        });
        addEventListeners();
    };


    const updatePagination = (totalEvents, page) => {
        totalPages = Math.ceil(totalEvents / eventsPerPage);
        pageInfo.textContent = `Сторінка ${page} з ${totalPages}`;
        prevPageButton.disabled = page <= 1;
        nextPageButton.disabled = page >= totalPages;
        firstPageButton.disabled = page <= 1;
        lastPageButton.disabled = page >= totalPages;
    };


    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        if (query.length < 3) {
            searchError.textContent = 'Показано всі активні заходи';
            loadEvents(1, '');
        } else {
            searchError.textContent = '';
            loadEvents(1, query);
        }
    });

    const addEventListeners = () => {
        document.querySelectorAll('.register-btn').forEach(button => {
            button.addEventListener('click', event => {
                event.preventDefault();
                const eventId = button.getAttribute('data-eventid');
                document.getElementById('event-id').value = eventId;
                clearRegisterForm();
                registerModal.style.display = 'flex';
            });
        });


        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', event => {
                event.preventDefault();
                const eventId = button.getAttribute('data-eventid');
                document.getElementById('participant-event-id').value = eventId;
                document.getElementById('participant-search-error').textContent = '';
                document.getElementById('participant-search').value = '';
                loadParticipants(eventId);
                participantModal.style.display = 'flex';
            });
        });

    };

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const eventId = document.getElementById('event-id').value;
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const dateOfBirth = document.getElementById('dateOfBirth').value;
        const source = document.querySelector('input[name="source"]:checked').value;

        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 16) {
            document.getElementById('register-error').textContent = 'Ви не можете реєструватись самі, вам ще немає 16 років';
        } else {
            try {
                const response = await fetch('/api/registrations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        eventId,
                        fullName,
                        email,
                        dateOfBirth,
                        source
                    })
                });

                let data = {};
                try {
                    data = await response.json();
                } catch (jsonError) {
                    data.message = await response.text();
                }
                if (response.ok && data.existing === true) {

                    registerError.textContent = 'Цей учасник вже зареєстрований на цей захід';
                    return
                }
                if (response.ok) {
                    registerModal.style.display = 'none';
                    registerForm.reset();
                } else {

                    if (response.existing === true) {
                        registerError.textContent = data.message || 'Цей учасник вже зареєстрований на цей захід';
                    } else {
                        registerError.textContent = 'Помилка при реєстрації. Будь ласка, спробуйте ще раз.';
                    }
                }
            } catch (error) {
                console.error('Error registering for event:', error);
                registerError.textContent = 'Помилка при реєстрації. Будь ласка, спробуйте ще раз.';
            }
        }
    });


    participantSearchButton.addEventListener('click', async () => {
        const query = participantSearchInput.value.trim();
        const eventId = document.getElementById('participant-event-id').value;
        if (query.length < 3) {
            participantSearchError.textContent = 'Треба ввести щонайменше три символи';
            loadParticipants(eventId); // Load participants without filtering
        } else {
            participantSearchError.textContent = '';
            loadParticipants(eventId, query);
        }
    });


    viewModal.addEventListener('show', async (event) => {
        const eventId = document.getElementById('participant-event-id').value;

        loadParticipants(eventId);
    });


    closeViewBtn.addEventListener('click', () => {
        participantSearchError.textContent = '';
        participantsGrid.innerHTML = '';
        participantSearchInput.value = '';
    });

    const loadParticipants = async (eventId, query = '') => {
        try {
            const response = await fetch(`/api/registrations/participants?eventId=${eventId}&query=${query}`);
            const data = await response.json();
            if (data.participants.length === 0) {
                if (query) {
                    participantSearchError.textContent = 'Учасника з таким ім\'ям не знайдено';
                }
                participantsGrid.innerHTML = '';
            } else {
                participantSearchError.textContent = query.length < 3 ? 'Треба ввести щонайменше три символи' : '';
                renderStatistics(data.participants)
                renderParticipants(data.participants);
            }
        } catch (error) {
            console.error('Error loading participants:', error);
            participantSearchError.textContent = 'Помилка при завантаженні учасників';
        }
    };


    const renderStatistics = (participants) => {

        const numberPerDate = [];

        participants.forEach(item => {
            const existingEntry = numberPerDate.find(entry =>
                entry.regDate.slice(0, 10) === item.regDate.slice(0, 10)
            );

            if (existingEntry) {
                existingEntry.numberOfParticipants++;
            } else {
                numberPerDate.push({
                    regDate: item.regDate,
                    numberOfParticipants: 1,
                    percent: 0
                });
            }
        });

        const maxParticipants = Math.max(...numberPerDate.map(entry => entry.numberOfParticipants));

        numberPerDate.forEach(entry => {
            entry.percent = Math.round((entry.numberOfParticipants / maxParticipants) * 100);
        });

        participantsStatistics.innerHTML = '';
        numberPerDate.forEach(date => {

            const participantPerDayBar = document.createElement('div');

            const bar = document.createElement('div');
            bar.classList.add('item');
            bar.style.height = date.percent + '%';
            bar.textContent = date.numberOfParticipants;
            const item = document.createElement('div');
            item.classList.add('item');

            const timestamp = new Date(date.regDate);
            const month = timestamp.getUTCMonth() + 1;
            const day = timestamp.getUTCDate();

            const registrationDate = `${day}.${month.toString().padStart(2, '0')}`;

            const dateElement = document.createElement('div');
            dateElement.classList.add('item-date');
            dateElement.textContent = registrationDate;

            participantPerDayBar.appendChild(bar);
            participantPerDayBar.appendChild(dateElement);

            participantsStatistics.appendChild(participantPerDayBar);
        });
    };


    const renderParticipants = (participants) => {
        participantsGrid.innerHTML = '';
        participants.forEach(participant => {
            const participantCard = document.createElement('div');
            participantCard.classList.add('participant-card');
            participantCard.innerHTML = `
                <h3>${participant.fullName}</h3>
                <p>${participant.email}</p>
            `;
            participantsGrid.appendChild(participantCard);
        });
    };

    document.querySelector('.close-btn').addEventListener('click', () => {
        registerModal.style.display = 'none';
    });

    document.querySelector('.close-view-btn').addEventListener('click', () => {
        participantModal.style.display = 'none';
    });

    window.addEventListener('click', event => {
        if (event.target === registerModal) {
            registerModal.style.display = 'none';
        }
        if (event.target === participantModal) {
            participantModal.style.display = 'none';
        }
    });


    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadEvents(currentPage, searchInput.value, locationSelect.value, startDateInput.value, endDateInput.value);
        }
    });


    nextPageButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadEvents(currentPage, searchInput.value, locationSelect.value, startDateInput.value, endDateInput.value);
        }
    });

    const goToFirstPage = () => {
        currentPage = 1;
        loadEvents(currentPage, searchInput.value, locationSelect.value, startDateInput.value, endDateInput.value);
    };


    const goToLastPage = async () => {
        try {
            const response = await fetch(`/api/events?limit=${eventsPerPage}&query=${searchInput.value}&location=${locationSelect.value}&startDate=${startDateInput.value}&endDate=${endDateInput.value}`);
            const data = await response.json();
            const totalEvents = data.totalEvents;
            totalPages = Math.ceil(totalEvents / eventsPerPage);
            currentPage = totalPages;
            loadEvents(currentPage, searchInput.value, locationSelect.value, startDateInput.value, endDateInput.value);
        } catch (error) {
            console.error('Error fetching total events for last page:', error);
        }
    };

    firstPageButton.addEventListener('click', goToFirstPage);

    lastPageButton.addEventListener('click', goToLastPage);


    loadEvents();
});
