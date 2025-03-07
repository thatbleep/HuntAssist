document.addEventListener('DOMContentLoaded', () => {
    const isPopout = window.location.pathname.includes('popout.html');
    
    if (isPopout) {
        if (typeof setupTabs === 'function') {
            setupTabs();
        } else {
            setupPopoutTabs();
        }
        
        initializeDropdownMenu();
        
        const showDetailsToggle = document.getElementById('showDetailsToggle');
        if (showDetailsToggle) {
            showDetailsToggle.addEventListener('change', (e) => {
                const showDetails = e.target.checked;
                
                const geoInfoElements = document.querySelectorAll('.geo-info');
                geoInfoElements.forEach(element => {
                    if (showDetails) {
                        element.classList.remove('hidden');
                    } else {
                        element.classList.add('hidden');
                    }
                });
                
                const sourcesInfoElements = document.querySelectorAll('.sources-info');
                sourcesInfoElements.forEach(element => {
                    if (showDetails) {
                        element.classList.remove('hidden');
                    } else {
                        element.classList.add('hidden');
                    }
                });
            });
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const activeTab = urlParams.get('tab') || 'history';
        const inputData = {};
        
        ['iocInput', 'b64Input', 'headerInput', 'jwtInput'].forEach(field => {
            const value = urlParams.get(field);
            if (value) {
                inputData[field] = decodeURIComponent(value);
            }
        });
        
        setTimeout(() => {
            const tabToActivate = document.querySelector(`.tab[data-view="${activeTab}"]`);
            if (tabToActivate) {
                tabToActivate.click();
            } else {
                const dropdownItem = document.querySelector(`.dropdown-item[data-view="${activeTab}"]`);
                if (dropdownItem) {
                    dropdownItem.click();
                }
            }
            
            Object.keys(inputData).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = inputData[fieldId];
                }
            });
        }, 100);
    } else {
        setupPopoutButton();
    }
});

function initializeDropdownMenu() {
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
    
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.more-menu')) {
            const dropdowns = document.querySelectorAll('.more-dropdown');
            dropdowns.forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    });
    
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const dropdowns = document.querySelectorAll('.more-dropdown');
            dropdowns.forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        });
    });
}

function setupPopoutTabs() {
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
function setupPopoutButton() {
    const popoutBtn = document.getElementById('popoutBtn');
    if (!popoutBtn) return;
    
    popoutBtn.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab.active, .dropdown-item.active');
        if (!activeTab) return;
        
        const activeView = activeTab.dataset.view;
        
        const inputData = {};
        
        if (activeView === 'search') {
            const iocInput = document.getElementById('iocInput');
            if (iocInput && iocInput.value.trim()) {
                inputData.iocInput = encodeURIComponent(iocInput.value);
            }
        } else if (activeView === 'base64') {
            const b64Input = document.getElementById('b64Input');
            if (b64Input && b64Input.value.trim()) {
                inputData.b64Input = encodeURIComponent(b64Input.value);
            }
        } else if (activeView === 'headers') {
            const headerInput = document.getElementById('headerInput');
            if (headerInput && headerInput.value.trim()) {
                inputData.headerInput = encodeURIComponent(headerInput.value);
            }
        } else if (activeView === 'jwt') {
            const jwtInput = document.getElementById('jwtInput');
            if (jwtInput && jwtInput.value.trim()) {
                inputData.jwtInput = encodeURIComponent(jwtInput.value);
            }
        }
        
        let popoutUrl = chrome.runtime.getURL('src/pages/popout.html') + `?tab=${activeView}`;
        
        Object.keys(inputData).forEach(key => {
            popoutUrl += `&${key}=${inputData[key]}`;
        });
        
        chrome.windows.create({
            url: popoutUrl,
            type: 'popup',
            width: 700,
            height: 800,
            left: Math.round((screen.width - 600) / 2),
            top: Math.round((screen.height - 700) / 2)
        });
        
        window.close();
    });
}