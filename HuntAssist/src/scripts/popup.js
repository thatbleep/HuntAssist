const features = [
  {
    category: "Context Menu Search",
    description: "Quickly search for suspicious indicators across multiple threat intelligence platforms",
    icon: '<img src="../assets/images/magnifyingglass.png" alt="Search" width="24" height="24">',
    items: [
      { name: "AbuseIPDB", description: "Check IP addresses and domains for reported abuse" },
      { name: "AlienVault OTX", description: "Search for IOCs in Open Threat Exchange" },
      { name: "VirusTotal", description: "Analyze suspicious files, domains, IPs and URLs" },
      { name: "Shodan", description: "Search for exposed devices and vulnerabilities" },
      { name: "Scamalytics", description: "Check IP addresses for fraud risk" },
      { name: "IP Geolocation", description: "Get detailed geographic location data for IPs" }
    ]
  },
  {
    category: "Manual Search",
    description: "Directly search for indicators of compromise without leaving the extension",
    icon: '<img src="../assets/images/magnifyingglass.png" alt="Manual Search" width="24" height="24">',
    items: [
      { name: "Auto-detection", description: "Automatically detect the type of indicator (IP, Domain, Hash, URL)" },
      { name: "Multi-source Selection", description: "Choose specific intelligence sources to search across" },
      { name: "Custom Type Selection", description: "Manually specify the indicator type for ambiguous queries" }
    ]
  },
  {
    category: "Email Analysis",
    description: "Analyze email headers to trace message paths and verify authenticity",
    icon: '<img src="../assets/images/email.png" alt="Email" width="24" height="24">',
    items: [
      { name: "Email Header Parser", description: "Parse and analyze email headers to trace message path and verify authenticity" }
    ]
  },
  {
    category: "Encode/Decode",
    description: "Convert text to and from Base64 encoding",
    icon: '<img src="../assets/images/convert.png" alt="Convert" width="24" height="24">',
    items: [
      { name: "Base64 Encode", description: "Convert text to Base64 format" },
      { name: "Base64 Decode", description: "Convert Base64 back to plain text" },
      { name: "JWT Decoder", description: "Decode and inspect JSON Web Tokens (JWT)" }
    ]
  }
];

let activeFilters = new Set(['all']);
let currentHistory = [];
let showDetails = true;
let searchSources = [];
let selectedType = 'auto';
let selectedSource = 'all';
let selectedSources = new Set(['all']);
let ignoreNextStorageEvent = false;
let pendingDeletions = new Set();

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    
    const allTabElements = [...tabs, ...dropdownItems];
    
    allTabElements.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.view === 'cyberchef') {
                chrome.tabs.create({ url: "https://gchq.github.io/CyberChef/" });
                return;
            }

            allTabElements.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            
            tab.classList.add('active');
            const viewId = `${tab.dataset.view}View`;
            document.getElementById(viewId).classList.add('active');

            if (tab.dataset.view !== 'search') {
                const searchResults = document.getElementById('searchResults');
                if (searchResults) {
                    searchResults.style.display = 'none';
                }
            }

            if (tab.classList.contains('dropdown-item')) {
                const dropdowns = document.querySelectorAll('.more-dropdown');
                dropdowns.forEach(dropdown => {
                    dropdown.style.display = 'none';
                });
            }
        });
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.more-menu')) {
            const dropdowns = document.querySelectorAll('.more-dropdown');
            dropdowns.forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    });

    const moreButtons = document.querySelectorAll('.more-btn');
    moreButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const dropdown = button.nextElementSibling;
            const isVisible = dropdown.style.display === 'block';

            document.querySelectorAll('.more-dropdown').forEach(d => {
                d.style.display = 'none';
            });

            dropdown.style.display = isVisible ? 'none' : 'block';
        });
    });
}

function populateFeatureList() {
  const featureList = document.getElementById('featureList');
  
  features.forEach(featureCategory => {
    const categorySection = document.createElement('div');
    categorySection.className = 'feature-category';
    
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header';
    categoryHeader.innerHTML = `
      <span class="category-icon">${featureCategory.icon}</span>
      <h2>${featureCategory.category}</h2>
    `;
    
    const featureGrid = document.createElement('div');
    featureGrid.className = 'feature-grid';
    
    featureCategory.items.forEach(item => {
      const featureCard = document.createElement('div');
      featureCard.className = 'feature-card';
      featureCard.innerHTML = `
        <h3>${item.name}</h3>
        <p>${item.description}</p>
      `;
      featureGrid.appendChild(featureCard);
    });
    
    categorySection.appendChild(categoryHeader);
    categorySection.appendChild(featureGrid);
    featureList.appendChild(categorySection);
  });
}

function loadHistory() {
    const historyList = document.getElementById('historyList');
    const currentHeight = historyList.offsetHeight;
    historyList.style.height = `${currentHeight}px`;
    historyList.innerHTML = '';

    chrome.storage.local.get('searchHistory', (result) => {
        currentHistory = result.searchHistory || [];
        
        const filteredHistory = currentHistory.filter(entry => {
            if (activeFilters.has('all')) return true;
            return activeFilters.has(entry.type);
        });
        filteredHistory.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.style.opacity = '0';
            item.dataset.id = entry.id;
            
            const content = document.createElement('div');
            content.className = 'history-content';
            
            const query = document.createElement('div');
            query.className = 'history-query';
            
            const maxQueryLength = 75;
            const fullQuery = entry.query;
            const truncatedQuery = fullQuery.length > maxQueryLength 
                ? fullQuery.substring(0, maxQueryLength) + '...'
                : fullQuery;
            
            query.textContent = truncatedQuery;
            query.title = 'Click to expand';
            query.dataset.fullQuery = fullQuery;
            
            query.addEventListener('click', (e) => {
                const isExpanded = query.classList.contains('expanded');
                query.classList.toggle('expanded');
                query.textContent = isExpanded ? truncatedQuery : fullQuery;
            });
            
            const details = document.createElement('div');
            details.className = 'history-details';
            details.setAttribute('data-type', entry.type);
            
            const detailsText = document.createElement('span');
            detailsText.textContent = `${new Date(entry.timestamp).toLocaleString()}`;
            details.appendChild(detailsText);
            
            const actions = document.createElement('div');
            actions.className = 'history-actions';
            
            const actionButtons = [
                { 
                    icon: '<img src="../assets/images/magnifyingglass.png" alt="Search" width="14" height="14" onerror="console.error(\'Failed to load:\', this.src)">', 
                    title: 'Search Again', 
                    onClick: () => repeatSearch(entry) 
                },
                { 
                    icon: '<img src="../assets/images/note.png" alt="Note" width="14" height="14" onerror="console.error(\'Failed to load:\', this.src)">', 
                    title: entry.note ? 'Edit Note' : 'Add Note', 
                    onClick: () => editNote(entry) 
                },
                { 
                    icon: '<img src="../assets/images/trash.png" alt="Delete" width="14" height="14" onerror="console.error(\'Failed to load:\', this.src)">', 
                    title: 'Delete', 
                    onClick: () => deleteHistoryEntry(entry.id) 
                }
            ];
            
            actionButtons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = 'history-action-btn';
                btn.innerHTML = button.icon;
                btn.title = button.title;
                btn.onclick = button.onClick;
                actions.appendChild(btn);
            });
            
            details.appendChild(actions);
            
            content.appendChild(query);
            content.appendChild(details);
            
            // Add Sources information below the timestamp line
            const sourcesInfo = document.createElement('div');
            sourcesInfo.className = `sources-info ${!showDetails ? 'hidden' : ''}`;
            
            const sourcesTag = document.createElement('div');
            sourcesTag.className = 'sources-tag';
            sourcesTag.innerHTML = `
                <span>Source(s): ${entry.source}</span>
            `;
            sourcesInfo.appendChild(sourcesTag);
            content.appendChild(sourcesInfo);
            
            if (entry.type === 'IP' && entry.geoData) {
                const geoInfo = document.createElement('div');
                geoInfo.className = `geo-info ${!showDetails ? 'hidden' : ''}`;
                
                if (entry.geoData.city && entry.geoData.region && entry.geoData.country) {
                    const locationTag = document.createElement('div');
                    locationTag.className = 'geo-tag';
                    locationTag.innerHTML = `
                        <img src="../assets/images/pin.png" alt="Location" width="14" height="14" title="Location">
                        <span>${entry.geoData.city}, ${entry.geoData.region}, ${entry.geoData.country}</span>
                    `;
                    geoInfo.appendChild(locationTag);
                }
                
                if (entry.geoData.isp) {
                    const ispTag = document.createElement('div');
                    ispTag.className = 'geo-tag';
                    ispTag.innerHTML = `
                        <img src="../assets/images/globe.png" alt="ISP" width="14" height="14" title="Internet Service Provider">
                        <span>${entry.geoData.isp}</span>
                    `;
                    geoInfo.appendChild(ispTag);
                }
                
                content.appendChild(geoInfo);
            }
            
            if (entry.type === 'Domain' && entry.domainInfo) {
                const domainInfo = document.createElement('div');
                domainInfo.className = `geo-info ${!showDetails ? 'hidden' : ''}`;
                
                if (entry.domainInfo.registrar) {
                    const registrarTag = document.createElement('div');
                    registrarTag.className = 'geo-tag';
                    registrarTag.innerHTML = `
                        <img src="../assets/images/registrar.png" alt="Registrar" width="14" height="14" title="Registrar">
                        <span>${entry.domainInfo.registrar}</span>
                    `;
                    domainInfo.appendChild(registrarTag);
                }

                const regDateTag = document.createElement('div');
                regDateTag.className = 'geo-tag';

                if (entry.domainInfo.registrationDate) {
                    const regDate = new Date(entry.domainInfo.registrationDate);
                    const age = entry.domainInfo.age;
                    let ageText = '';
                    if (age.years > 0) {
                        ageText = `${age.years} year${age.years !== 1 ? 's' : ''}`;
                        if (age.days > 0) {
                            ageText += ` and ${age.days} day${age.days !== 1 ? 's' : ''}`;
                        }
                    } else {
                        ageText = `${age.days} day${age.days !== 1 ? 's' : ''}`;
                    }
                    
                    regDateTag.innerHTML = `
                        <img src="../assets/images/calendar.png" alt="Registration" width="14" height="14" title="Registration Date">
                        <span>${regDate.toLocaleDateString()} (${ageText})</span>
                    `;
                    domainInfo.appendChild(regDateTag);
                }
                
                content.appendChild(domainInfo);
            }
            
            if (entry.note) {
                const noteDisplay = document.createElement('div');
                noteDisplay.className = 'history-note';
                
                const maxLength = 100;
                const fullNote = 'Note: ' + entry.note;
                const truncatedNote = fullNote.length > maxLength 
                    ? fullNote.substring(0, maxLength) + '...'
                    : fullNote;
                
                noteDisplay.textContent = truncatedNote;
                noteDisplay.title = 'Click to expand';
                noteDisplay.dataset.fullNote = fullNote;
                
                noteDisplay.addEventListener('click', (e) => {
                    const isExpanded = noteDisplay.classList.contains('expanded');
                    noteDisplay.classList.toggle('expanded');
                    noteDisplay.textContent = isExpanded ? truncatedNote : fullNote;
                });
                
                content.appendChild(noteDisplay);
            }
            
            item.appendChild(content);
            historyList.appendChild(item);
        });
        historyList.offsetHeight;
        historyList.style.height = `${historyList.scrollHeight}px`;
        requestAnimationFrame(() => {
            const items = historyList.querySelectorAll('.history-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '1';
                }, index * 20);
            });
        });
        setTimeout(() => {
            historyList.style.height = 'auto';
        }, 150);
    });
}

async function deleteHistoryEntry(id) {

  const itemToRemove = document.querySelector(`.history-item[data-id="${id}"]`);

  pendingDeletions.add(id);

  if (itemToRemove) {
    itemToRemove.style.opacity = '0';
    itemToRemove.style.maxHeight = '0';
    itemToRemove.style.overflow = 'hidden';
    itemToRemove.style.marginBottom = '0';
    itemToRemove.style.paddingTop = '0';
    itemToRemove.style.paddingBottom = '0';
    itemToRemove.style.transition = 'all 0.3s ease-out';

    setTimeout(() => {
      if (itemToRemove.parentNode) {
        itemToRemove.parentNode.removeChild(itemToRemove);
      }
    }, 300);
  }

  ignoreNextStorageEvent = true;

  const result = await chrome.storage.local.get('searchHistory');
  const history = result.searchHistory || [];
  const updatedHistory = history.filter(entry => entry.id !== id);
  await chrome.storage.local.set({ searchHistory: updatedHistory });

  currentHistory = currentHistory.filter(entry => entry.id !== id);
}

async function repeatSearch(entry) {
  try {
    showSearchStatus(`Repeating search for ${entry.query}...`, 'info');
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Search request timed out')), 5000);
    });
    
    const searchPromise = new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'repeatSearch',
        entry: entry
      }, response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
    
    await Promise.race([searchPromise, timeoutPromise]);
    showSearchStatus(`Search repeated for ${entry.query}`, 'success');
  } catch (error) {
    console.error('Error in repeatSearch:', error);
    showSearchStatus(`Error repeating search: ${error.message || 'Unknown error'}`, 'error');
  }
}

let storageListener = null;

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterType = btn.dataset.type;
            
            if (filterType === 'all') {
                activeFilters.clear();
                activeFilters.add('all');
                filterButtons.forEach(b => {
                    b.classList.toggle('active', b.dataset.type === 'all');
                });
            } else {
                activeFilters.delete('all');
                document.querySelector('.filter-btn[data-type="all"]').classList.remove('active');
                
                if (activeFilters.has(filterType)) {
                    activeFilters.delete(filterType);
                    btn.classList.remove('active');
                    
                    if (activeFilters.size === 0) {
                        activeFilters.add('all');
                        document.querySelector('.filter-btn[data-type="all"]').classList.add('active');
                    }
                } else {
                    activeFilters.add(filterType);
                    btn.classList.add('active');
                }
            }
            
            loadHistory();
        });
    });
}

function fetchSearchSources() {
  chrome.runtime.sendMessage({ action: 'getSearchSources' }, (response) => {
    if (response && response.sources) {
      searchSources = response.sources;
      populateSourceButtons();
    }
  });
}

function populateSourceButtons(filterType = null) {
  const sourceButtonsContainer = document.getElementById('sourceButtons');
  if (!sourceButtonsContainer) return;
  
  sourceButtonsContainer.innerHTML = '';

  const filteredSources = filterType ? 
    searchSources.filter(source => source.types.includes(filterType)) : 
    searchSources;

  filteredSources.forEach(source => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.source = source.id;
    btn.textContent = source.name;

    if (selectedSources.has(source.id)) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => {

      if (selectedSources.has('all')) {
        selectedSources.clear();
        document.querySelector('.search-source-selector .filter-btn[data-source="all"]').classList.remove('active');
      }

      if (selectedSources.has(source.id)) {
        selectedSources.delete(source.id);
        btn.classList.remove('active');

        if (selectedSources.size === 0) {
          selectedSources.add('all');
          document.querySelector('.search-source-selector .filter-btn[data-source="all"]').classList.add('active');
        }
      } else {
        selectedSources.add(source.id);
        btn.classList.add('active');
      }

      selectedSource = selectedSources.has('all') ? 'all' : Array.from(selectedSources)[0];
    });
    
    sourceButtonsContainer.appendChild(btn);
  });

  if (filteredSources.length === 0 && filterType) {
    const message = document.createElement('div');
    message.className = 'no-sources-message';
    message.textContent = `No search sources available for ${filterType} type`;
    sourceButtonsContainer.appendChild(message);

    const allSourcesBtn = document.querySelector('.search-source-selector .filter-btn[data-source="all"]');
    if (allSourcesBtn) {
      allSourcesBtn.disabled = true;
      allSourcesBtn.classList.add('disabled');
    }
  } else {

    const allSourcesBtn = document.querySelector('.search-source-selector .filter-btn[data-source="all"]');
    if (allSourcesBtn) {
      allSourcesBtn.disabled = false;
      allSourcesBtn.classList.remove('disabled');

      if (selectedSources.has('all')) {
        allSourcesBtn.classList.add('active');
      } else {
        allSourcesBtn.classList.remove('active');
      }
    }
  }
}

function setupSearchTypeButtons() {
  const typeButtons = document.querySelectorAll('.search-type-selector .filter-btn');
  const searchBtn = document.getElementById('searchBtn');
  
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.type;

      selectedSources.clear();
      selectedSources.add('all');

      if (selectedType === 'auto') {
        populateSourceButtons();

        const allSourcesBtn = document.querySelector('.search-source-selector .filter-btn[data-source="all"]');
        if (allSourcesBtn) {
          allSourcesBtn.style.display = 'inline-flex';
          allSourcesBtn.classList.add('active');
          selectedSource = 'all';
        }

        if (searchBtn) {
          searchBtn.disabled = false;
          searchBtn.classList.remove('disabled');
        }
      } else {
        populateSourceButtons(selectedType);

        const compatibleSources = searchSources.filter(source => source.types.includes(selectedType));
        const allSourcesBtn = document.querySelector('.search-source-selector .filter-btn[data-source="all"]');

        if (searchBtn) {
          if (compatibleSources.length === 0) {
            searchBtn.disabled = true;
            searchBtn.classList.add('disabled');
          } else {
            searchBtn.disabled = false;
            searchBtn.classList.remove('disabled');
          }
        }
        
        if (allSourcesBtn) {

          allSourcesBtn.classList.add('active');
          selectedSource = 'all';

          if (compatibleSources.length === 0) {
            allSourcesBtn.disabled = true;
            allSourcesBtn.classList.add('disabled');
          } else {
            allSourcesBtn.disabled = false;
            allSourcesBtn.classList.remove('disabled');
          }
        }
      }
    });
  });
}

function setupSearchButton() {
  const searchBtn = document.getElementById('searchBtn');
  const iocInput = document.getElementById('iocInput');
  
  if (!searchBtn || !iocInput) return;
  
  searchBtn.addEventListener('click', () => {
    const query = iocInput.value.trim();
    if (!query) return;

    if (selectedType !== 'auto') {
      const compatibleSources = searchSources.filter(source => 
        source.types.includes(selectedType)
      );
      
      if (compatibleSources.length === 0) {
        showSearchStatus(`No search sources available for ${selectedType} type`, 'error');
        return;
      }
    }

    if (!selectedSources.has('all') && selectedType !== 'auto') {

      const selectedSourcesArray = Array.from(selectedSources);
      const compatibleSelectedSources = selectedSourcesArray.filter(sourceId => {
        const source = searchSources.find(s => s.id === sourceId);
        return source && source.types.includes(selectedType);
      });
      
      if (compatibleSelectedSources.length === 0) {
        showSearchStatus(`None of the selected sources support ${selectedType} searches`, 'error');
        return;
      }
    }

    showSearchStatus('Searching...', 'neutral');

    chrome.runtime.sendMessage({
      action: 'manualSearch',
      query: query,
      type: selectedType,
      sourceId: selectedSource,
      sourceIds: Array.from(selectedSources)
    }, (response) => {
      if (response && response.success) {
        showSearchStatus(`Search initiated for ${response.detectedType}: ${query}`, 'success');
      } else if (response && response.error) {
        showSearchStatus(response.error, 'error');
      }
    });
  });
}

function showSearchStatus(message, type = 'neutral') {
  const resultsContainer = document.getElementById('searchResults');
  const statusContainer = document.getElementById('searchStatus');
  
  if (!resultsContainer || !statusContainer) return;
  
  resultsContainer.style.display = 'block';
  statusContainer.textContent = message;

  statusContainer.className = '';

  if (type === 'error') {
    statusContainer.classList.add('search-error');
  } else if (type === 'success') {
    statusContainer.classList.add('search-success');
  }

  if (type === 'success') {
    setTimeout(() => {
      resultsContainer.style.display = 'none';
    }, 5000);
  }
}

function setupInfoTabs() {
  const infoTabs = document.querySelectorAll('.info-tab');
  const infoSections = document.querySelectorAll('.info-section');
  
  infoTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      infoTabs.forEach(t => t.classList.remove('active'));
      infoSections.forEach(s => s.classList.remove('active'));
      
      tab.classList.add('active');
      const sectionId = `${tab.dataset.infoSection}Section`;
      document.getElementById(sectionId).classList.add('active');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupFilters();
    populateFeatureList();
    fetchSearchSources();
    setupSearchTypeButtons();
    setupSearchButton();
    setupAllSourcesButton();
    setupInfoTabs();
    
    if (storageListener) {
        chrome.storage.onChanged.removeListener(storageListener);
    }
    
    storageListener = (changes, namespace) => {
        if (namespace === 'local' && changes.searchHistory) {
            if (ignoreNextStorageEvent) {

                ignoreNextStorageEvent = false;

                pendingDeletions.forEach(id => {
                    const itemToRemove = document.querySelector(`.history-item[data-id="${id}"]`);
                    if (itemToRemove) {
                        setTimeout(() => {
                            if (itemToRemove.parentNode) {
                                itemToRemove.parentNode.removeChild(itemToRemove);
                            }
                        }, 300);
                    }
                });
                pendingDeletions.clear();
            } else {

                loadHistory();
            }
        }
    };
    
    chrome.storage.onChanged.addListener(storageListener);
    
    loadHistory();

    const b64Input = document.getElementById('b64Input');
    const b64Output = document.getElementById('b64Output');
    const encodeBtn = document.getElementById('encodeBtn');
    const decodeBtn = document.getElementById('decodeBtn');
    const copyBtn = document.getElementById('copyBtn');

    encodeBtn.addEventListener('click', () => {
        try {
            const input = b64Input.value;
            const encoded = btoa(input);
            b64Output.value = encoded;
        } catch (error) {
            b64Output.value = 'Error: Invalid input for encoding';
        }
    });

    decodeBtn.addEventListener('click', () => {
        try {
            const input = b64Input.value;
            const decoded = atob(input);
            b64Output.value = decoded;
        } catch (error) {
            b64Output.value = 'Error: Invalid base64 string';
        }
    });

    copyBtn.addEventListener('click', () => {
        b64Output.select();
        navigator.clipboard.writeText(b64Output.value);
        
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = 'Copy';
        }, 1500);
    });

    const headerInput = document.getElementById('headerInput');
    const parseHeadersBtn = document.getElementById('parseHeadersBtn');
    const headerResults = document.getElementById('headerResults');
    const keyInfo = document.getElementById('keyInfo');
    const emailRoute = document.getElementById('emailRoute');

    parseHeadersBtn.addEventListener('click', () => {
        const headers = headerInput.value.trim();
        if (!headers) {
            headerResults.style.display = 'none';
            return;
        }

        const parsedHeaders = parseEmailHeaders(headers);
        displayHeaderResults(parsedHeaders);
        headerResults.style.display = 'block';
    });

    function parseAuthenticationResults(headers) {
        const auth = {
            spf: { result: 'none' },
            dkim: { result: 'none' },
            dmarc: { result: 'none' }
        };

        const authHeaders = [];
        
        if (Array.isArray(headers['authentication-results'])) {
            headers['authentication-results'].forEach(header => {
                const parts = header.split(';');
                authHeaders.push(...parts);
            });
        } else {
            Object.entries(headers).forEach(([key, value]) => {
                if (key.toLowerCase() === 'authentication-results') {
                    const lines = value.split(/[\r\n]+/);
                    lines.forEach(line => {
                        const parts = line.split(';');
                        authHeaders.push(...parts);
                    });
                }
            });
        }

        for (const header of authHeaders) {
            const cleanHeader = header.trim();

            if (cleanHeader.includes('spf=')) {
                const spfMatch = cleanHeader.match(/spf=(\w+)/i);
                if (spfMatch) {
                    auth.spf.result = spfMatch[1].toLowerCase();
                }
            }

            if (cleanHeader.includes('dkim=')) {
                const dkimMatch = cleanHeader.match(/dkim=(\w+)/i);
                if (dkimMatch) {
                    auth.dkim.result = dkimMatch[1].toLowerCase();
                }
            }

            if (cleanHeader.includes('dmarc=')) {
                const dmarcMatch = cleanHeader.match(/dmarc=(\w+)/i);
                if (dmarcMatch) {
                    auth.dmarc.result = dmarcMatch[1].toLowerCase();
                }
            }
        }

        return auth;
    }

    function parseEmailHeaders(rawHeaders) {
        const headers = {};
        const lines = rawHeaders.split(/\r?\n/);
        let currentHeader = '';
        let currentValue = '';
        
        for (let line of lines) {
            if (line.match(/^\s/)) {
                currentValue += ' ' + line.trim();
            } else {
                if (currentHeader) {
                    if (headers[currentHeader]) {
                        if (Array.isArray(headers[currentHeader])) {
                            headers[currentHeader].push(currentValue);
                        } else {
                            headers[currentHeader] = [headers[currentHeader], currentValue];
                        }
                    } else {
                        headers[currentHeader] = currentValue;
                    }
                }
                
                const match = line.match(/^([\w-]+):\s*(.*)$/i);
                if (match) {
                    currentHeader = match[1].toLowerCase();
                    currentValue = match[2].trim();
                }
            }
        }
        
        if (currentHeader) {
            if (headers[currentHeader]) {
                if (Array.isArray(headers[currentHeader])) {
                    headers[currentHeader].push(currentValue);
                } else {
                    headers[currentHeader] = [headers[currentHeader], currentValue];
                }
            } else {
                headers[currentHeader] = currentValue;
            }
        }

        return {
            subject: headers['subject'] || 'N/A',
            from: headers['from'] || 'N/A',
            to: headers['to'] || 'N/A',
            date: headers['date'] || 'N/A',
            messageId: headers['message-id'] || 'N/A',
            returnPath: headers['return-path'] || 'N/A',
            authentication: parseAuthenticationResults(headers)
        };
    }

    function displayHeaderResults(parsed) {
        const createHeaderRow = (label, value) => `
            <div class="header-row">
                <span class="header-label">${escapeHtml(label)}</span>
                <span class="header-value">${escapeHtml(value)}</span>
            </div>
        `;

        const createAuthResult = (type, auth) => {
            if (type === 'DKIM' && Array.isArray(auth)) {
                return auth.map(dk => `
                    <div class="auth-result ${getAuthClass(dk.result)}">
                        ${escapeHtml(type)}: ${escapeHtml(dk.result.toUpperCase())}
                    </div>
                `).join('');
            }
            
            return `
                <div class="auth-result ${getAuthClass(auth.result)}">
                    ${escapeHtml(type)}: ${escapeHtml(auth.result.toUpperCase())}
                </div>
            `;
        };

        const authSection = `
            <div class="header-row">
                <span class="header-label">Authentication</span>
                <span class="header-value">
                    ${createAuthResult('SPF', parsed.authentication.spf)}
                    ${createAuthResult('DKIM', parsed.authentication.dkim)}
                    ${createAuthResult('DMARC', parsed.authentication.dmarc)}
                </span>
            </div>
        `;

        const keyInfoHtml = [
            createHeaderRow('Subject', parsed.subject),
            createHeaderRow('From', parsed.from),
            createHeaderRow('To', parsed.to),
            createHeaderRow('Date', parsed.date),
            createHeaderRow('Message-ID', parsed.messageId),
            createHeaderRow('Return-Path', parsed.returnPath),
            authSection
        ].join('');

        keyInfo.innerHTML = keyInfoHtml;
    }

    function escapeHtml(unsafe) {
        if (unsafe == null) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/`/g, "&#x60;")
            .replace(/\//g, "&#x2F;");
    }

    function getAuthClass(result) {
        const safeResult = String(result).toLowerCase().trim();
        const validClasses = {
            'pass': 'auth-pass',
            'fail': 'auth-fail',
            'failed': 'auth-fail'
        };
        return validClasses[safeResult] || 'auth-neutral';
    }

    const jwtInput = document.getElementById('jwtInput');
    const jwtHeader = document.getElementById('jwtHeader');
    const jwtPayload = document.getElementById('jwtPayload');
    const decodeJwtBtn = document.getElementById('decodeJwtBtn');
    const copyJwtBtn = document.getElementById('copyJwtBtn');

    decodeJwtBtn.addEventListener('click', () => {
        try {
            const token = jwtInput.value.trim();
            const parts = token.split('.');
            
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format');
            }

            const header = JSON.parse(atob(parts[0]));
            jwtHeader.value = JSON.stringify(header, null, 2);

            const payload = JSON.parse(atob(parts[1]));
            jwtPayload.value = JSON.stringify(payload, null, 2);

            if (payload.exp) {
                const expDate = new Date(payload.exp * 1000);
                const now = new Date();
                const isExpired = now > expDate;
                
                jwtPayload.value += '\n\n// Token ' + 
                    (isExpired ? 'expired' : 'valid until') + 
                    ' ' + expDate.toLocaleString();
            }

        } catch (error) {
            jwtHeader.value = '';
            jwtPayload.value = 'Error: Invalid JWT token';
        }
    });

    copyJwtBtn.addEventListener('click', () => {
        jwtPayload.select();
        navigator.clipboard.writeText(jwtPayload.value);
        
        copyJwtBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyJwtBtn.textContent = 'Copy Payload';
        }, 1500);
    });

    const exportHistoryBtn = document.getElementById('exportHistoryBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    
    exportHistoryBtn.addEventListener('click', exportHistoryToCSV);
    clearHistoryBtn.addEventListener('click', clearHistory);

    const showDetailsToggle = document.getElementById('showDetailsToggle');
    showDetailsToggle.addEventListener('change', (e) => {
        showDetails = e.target.checked;
        
        const geoInfoElements = document.querySelectorAll('.geo-info');
        geoInfoElements.forEach(element => {
            if (showDetails) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        });
        
        // Also toggle visibility of sources info elements
        const sourcesInfoElements = document.querySelectorAll('.sources-info');
        sourcesInfoElements.forEach(element => {
            if (showDetails) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        });
    });
});

function setupAllSourcesButton() {
    const allSourcesBtn = document.querySelector('.search-source-selector .filter-btn[data-source="all"]');
    if (!allSourcesBtn) return;
    
    allSourcesBtn.addEventListener('click', () => {

        document.querySelectorAll('#sourceButtons .filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        selectedSources.clear();
        selectedSources.add('all');

        allSourcesBtn.classList.add('active');
        selectedSource = 'all';
    });
}

async function editNote(entry) {
    const currentNote = entry.note || '';
    const note = prompt('Enter note:', currentNote);
    
    if (note !== null) {
        const result = await chrome.storage.local.get('searchHistory');
        const history = result.searchHistory || [];
        
        const updatedHistory = history.map(item => {
            if (item.id === entry.id) {
                return { ...item, note: note.trim() };
            }
            return item;
        });
        
        await chrome.storage.local.set({ searchHistory: updatedHistory });
    }
}

function exportHistoryToCSV() {
    chrome.storage.local.get('searchHistory', (result) => {
        const history = result.searchHistory || [];
        
        if (history.length === 0) {
            alert('No history entries to export');
            return;
        }

        const csvRows = [];
        
        csvRows.push([
            'Timestamp',
            'Query',
            'Type',
            'Search Source',
            'Region',
            'Country',
            'ISP',
            'Note'
        ].join(','));

        history.forEach(entry => {
            const region = entry.geoData ? 
                `${entry.geoData.city || ''}, ${entry.geoData.region || ''}`.trim() : 
                '';
            const country = entry.geoData ? entry.geoData.country || '' : '';
            const isp = entry.geoData ? entry.geoData.isp || '' : '';
            const sourceName = entry.source ? `"${entry.source.replace(/"/g, '""')}"` : '""';

            const row = [
                entry.timestamp,
                `"${entry.query.replace(/"/g, '""')}"`,
                entry.type,
                sourceName,
                `"${region.replace(/"/g, '""')}"`,
                `"${country.replace(/"/g, '""')}"`,
                `"${isp.replace(/"/g, '""')}"`,
                `"${(entry.note || '').replace(/"/g, '""')}"` 
            ];
            
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.setAttribute('href', url);
        link.setAttribute('download', `huntassist-history-${timestamp}.csv`);
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
        chrome.storage.local.set({ searchHistory: [] }, () => {
            loadHistory();
        });
    }
}