const searchSources = [
  {
    id: "aipdb",
    name: "AbuseIPDB",
    types: ["IP"],
    getUrl: (type, query) => `https://www.abuseipdb.com/check/${encodeURIComponent(query)}`
  },
  {
    id: "otx",
    name: "OTX",
    types: ["IP", "Domain", "Hash"],
    getUrl: (type, query) => {
      const baseUrl = "https://otx.alienvault.com/indicator/";
      let typeUrl;
      if (type === "Hash") {
        typeUrl = "file";
        return `${baseUrl}${typeUrl}/${encodeURIComponent(query)}`;
      } else {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
        const isIP = ipv4Regex.test(query) || ipv6Regex.test(query);
        typeUrl = isIP ? "ip" : "hostname";
        return `${baseUrl}${typeUrl}/${isIP ? query : encodeURIComponent(query)}`;
      }
    }
  },
  {
    id: "vt",
    name: "VirusTotal",
    types: ["IP", "Domain", "Hash", "URL"],
    getUrl: (type, query) => {
      if (type === "URL") {
        const encodedUrl = btoa(query).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return `https://www.virustotal.com/gui/url/${encodedUrl}/detection`;
      } else {
        return `https://www.virustotal.com/gui/search/${encodeURIComponent(query)}`;
      }
    }
  },
  {
    id: "shodan",
    name: "Shodan",
    types: ["IP"],
    getUrl: (type, query) => `https://www.shodan.io/search?query=${encodeURIComponent(query)}`
  },
  {
    id: "ipgeolocation",
    name: "IP Geolocation",
    types: ["IP"],
    getUrl: (type, query) => `https://ip-api.com/${encodeURIComponent(query)}`
  },
  {
    id: "scamalytics",
    name: "Scamalytics",
    types: ["IP"],
    getUrl: (type, query) => `https://scamalytics.com/ip/${encodeURIComponent(query)}`
  },
  {
    id: "urlscan",
    name: "URLScan.io",
    types: ["URL"],
    getUrl: (type, query) => {
      const extractDomainOrIP = (url) => {
        let domain = url.replace(/^(https?:\/\/)/, '');
        domain = domain.split('/')[0];
        domain = domain.split(':')[0];
        return domain;
      };
      
      const domainOrIP = extractDomainOrIP(query);
      return `https://urlscan.io/search/#${encodeURIComponent(domainOrIP)}`;
    }
  },
  {
    id: "hybridanalysis",
    name: "Hybrid Analysis",
    types: ["Hash", "Domain"],
    getUrl: (type, query) => `https://www.hybrid-analysis.com/search?query=${encodeURIComponent(query)}`
  }
];

function createContextMenu() {
  chrome.contextMenus.create({
    id: "securitySearchParent",
    title: "Search IOCs",
    contexts: ["selection", "link"]
  });

  chrome.contextMenus.create({
    id: "urlSearchParent",
    title: "Analyze URL",
    contexts: ["link"]
  });

  const categories = ["IP", "Domain", "Hash", "URL"];

  categories.forEach(category => {
    const parentId = `category_${category}`;
    chrome.contextMenus.create({
      id: parentId,
      parentId: "securitySearchParent",
      title: category,
      contexts: ["selection", "link"]
    });

    chrome.contextMenus.create({
      id: `all_${category}`,
      parentId: parentId,
      title: "All",
      contexts: ["selection", "link"]
    });

    searchSources.forEach(source => {
      if (source.types.includes(category)) {
        chrome.contextMenus.create({
          id: `${source.id}_${category}`,
          parentId: parentId,
          title: source.name,
          contexts: ["selection", "link"]
        });
      }
    });
  });

  const urlSources = searchSources.filter(source => source.types.includes("URL"));
  
  chrome.contextMenus.create({
    id: "all_URL_link",
    parentId: "urlSearchParent",
    title: "All URL Sources",
    contexts: ["link"]
  });

  urlSources.forEach(source => {
    chrome.contextMenus.create({
      id: `${source.id}_URL_link`,
      parentId: "urlSearchParent",
      title: source.name,
      contexts: ["link"]
    });
  });
}

function createNotification(title, message) {
  chrome.notifications.create({
      type: "basic",
      iconUrl: "icon48.png", 
      title: title,
      message: message
  });
}

function handleSearch(source, type, query, validateOnly) {
    let isValidQuery = false;
    let validationQuery = query;
    
    if (type === "URL") {
        validationQuery = query.replace(/^https?:\/\//, '');
    }
    
    if (source.types.includes(type)) {
        switch (type) {
            case "IP":
                const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                const ipv6Regex = /^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
                isValidQuery = ipv4Regex.test(validationQuery) || ipv6Regex.test(validationQuery);
                break;
            case "Domain":
                const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
                isValidQuery = domainRegex.test(validationQuery);
                break;
            case "Hash":
                const hashRegex = /^(?:[a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$/;
                isValidQuery = hashRegex.test(validationQuery);
                break;
            case "URL":
                const urlRegex = /^(?:(?:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}))(?::\d{1,5})?(?:\/[^\s]*)?$/i;
                isValidQuery = urlRegex.test(validationQuery);
                break;
        }
    }

    if (isValidQuery) {
        if (!validateOnly) {
            chrome.tabs.create({ url: source.getUrl(type, query) });
        }
        return true;
    } else if (!validateOnly) {
        let errorMessage = `Invalid ${type} format. `;
        switch (type) {
            case "IP":
                errorMessage += "Expected format: IPv4 (xxx.xxx.xxx.xxx) or IPv6 (2001:db8::1234:5678)";
                break;
            case "Domain":
                errorMessage += "Expected format: example.com or sub.example.com";
                break;
            case "Hash":
                errorMessage += "Expected MD5 (32), SHA-1 (40), or SHA-256 (64) hash";
                break;
            case "URL":
                errorMessage += "Expected format: [http(s)://]domain.com[:port][/path]";
                break;
        }
        createNotification("Invalid Input", errorMessage);
        return false;
    }
    return false;
}

async function getIPGeolocation(ip) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,isp`);
    const data = await response.json();
    if (data.status === 'success') {
      return {
        countryCode: data.countryCode,
        country: data.country,
        region: data.regionName,
        city: data.city,
        isp: data.isp
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching IP geolocation:', error);
    return null;
  }
}

async function getDomainInfo(domain) {
  try {
    const bootstrapResponse = await fetch(`https://rdap.org/domain/${domain}`);
    if (!bootstrapResponse.ok) return null;
    
    const data = await bootstrapResponse.json();
    let registrationDate = null;
    if (data.events) {
      const registrationEvent = data.events.find(event => 
        event.eventAction === 'registration' || 
        event.eventAction === 'created'
      );
      if (registrationEvent) {
        registrationDate = new Date(registrationEvent.eventDate);
      }
    }
    let registrar = null;
    if (data.entities) {
      const registrarEntity = data.entities.find(entity => 
        entity.roles && entity.roles.includes('registrar')
      );
      if (registrarEntity && registrarEntity.vcardArray) {
        const fnEntry = registrarEntity.vcardArray[1].find(entry => entry[0] === 'fn');
        if (fnEntry) {
          registrar = fnEntry[3];
        }
      }
    }
    
    if (registrationDate) {
      const now = new Date();
      const ageInDays = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
      const ageInYears = Math.floor(ageInDays / 365);
      const remainingDays = ageInDays % 365;
      
      return {
        registrationDate: registrationDate.toISOString(),
        registrar: registrar,
        age: {
          years: ageInYears,
          days: remainingDays
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching domain info:', error);
    return null;
  }
}

async function saveToHistory(query, type, source) {
  let geoData = null;
  let domainInfo = null;
  
  if (type === "IP") {
    geoData = await getIPGeolocation(query);
  } else if (type === "Domain") {
    domainInfo = await getDomainInfo(query);
  }

  const historyEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    query: query,
    type: type,
    source: source,
    note: '',
    geoData: geoData,
    domainInfo: domainInfo
  };

  const result = await chrome.storage.local.get('searchHistory');
  const history = result.searchHistory || [];
  history.unshift(historyEntry);

  if (history.length > 100) {
    history.pop();
  }

  try {
    await chrome.storage.local.set({ searchHistory: history });
  } catch (error) {
    console.error("Error saving to history:", error);
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith("securitySearchParent") || 
      info.menuItemId.startsWith("urlSearchParent") || 
      info.menuItemId.startsWith("category_")) return;

  const query = info.selectionText ? info.selectionText.trim() : 
                info.linkUrl ? info.linkUrl.trim() : null;

  if (!query) return;

  if (info.menuItemId.endsWith('_URL_link')) {
    const [sourceId, _, _link] = info.menuItemId.split('_');
    
    if (sourceId === "all") {
      let validSources = [];
      searchSources.forEach(source => {
        if (source.types.includes("URL")) {
          if (handleSearch(source, "URL", query, true)) {
            validSources.push(source);
          }
        }
      });
      
      if (validSources.length > 0) {
        saveToHistory(query, "URL", "All");
        validSources.forEach(source => {
          chrome.tabs.create({ url: source.getUrl("URL", query) });
        });
      }
    } else {
      const source = searchSources.find(s => s.id === sourceId && s.types.includes("URL"));
      if (source && handleSearch(source, "URL", query, false)) {
        saveToHistory(query, "URL", source.name);
      }
    }
    return;
  }

  const [sourceId, category] = info.menuItemId.split('_');
  let notificationShown = false;

  if (sourceId === "all") {
    let validSources = [];
    searchSources.forEach(source => {
      if (source.types.includes(category)) {
        if (handleSearch(source, category, query, true)) {
          validSources.push(source);
        }
      }
    });
    
    if (validSources.length > 0) {
      saveToHistory(query, category, "All");
      validSources.forEach(source => {
        chrome.tabs.create({ url: source.getUrl(category, query) });
      });
    }
  } else {
    const source = searchSources.find(s => s.id === sourceId && s.types.includes(category));
    if (source && handleSearch(source, category, query, false)) {
      saveToHistory(query, category, source.name);
    }
  }
});

chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'repeatSearch') {
    const entry = message.entry;
    
    if (entry.source === 'All') {
      const sourcesToSearch = searchSources.filter(source => source.types.includes(entry.type));
      
      if (sourcesToSearch.length > 0) {
        sourcesToSearch.forEach(source => {
          chrome.tabs.create({ url: source.getUrl(entry.type, entry.query) });
        });
      } else {
        console.error(`No search sources found for type: ${entry.type}`);
      }
    } else {
      if (entry.source.includes(',')) {
        const sourceNames = entry.source.split(',').map(s => s.trim());
        let foundSources = false;
        
        sourceNames.forEach(sourceName => {
          const source = searchSources.find(s => s.name === sourceName);
          if (source) {
            chrome.tabs.create({ url: source.getUrl(entry.type, entry.query) });
            foundSources = true;
          } else {
            console.error(`Search source not found: ${sourceName}`);
          }
        });
        
        if (!foundSources) {
          console.error(`None of the search sources were found: ${entry.source}`);
        }
      } else {
        const source = searchSources.find(s => s.name === entry.source);
        if (source) {
          chrome.tabs.create({ url: source.getUrl(entry.type, entry.query) });
        } else {
          console.error(`Search source not found: ${entry.source}`);
        }
      }
    }
    return true;
  } else if (message.action === 'getSearchSources') {
    sendResponse({ sources: searchSources });
    return true;
  } else if (message.action === 'manualSearch') {
    const { query, type, sourceId, sourceIds } = message;
    
    if (!query) {
      sendResponse({ error: "Please enter a query" });
      return true;
    }
    
    let detectedType = type;
    if (type === 'auto') {
      detectedType = detectIOCType(query);
    }
    
    if (!detectedType) {
      createNotification("Detection Failed", "Could not automatically detect the IOC type. Please select a type manually.");
      sendResponse({ error: "Could not automatically detect the IOC type. Please select a type manually." });
      return true;
    }
    
    if (sourceIds && sourceIds.length > 0 && !sourceIds.includes('all')) {
      let validSources = [];
      let invalidSources = [];
      
      sourceIds.forEach(id => {
        const source = searchSources.find(s => s.id === id);
        if (source && source.types.includes(detectedType)) {
          if (handleSearch(source, detectedType, query, true)) {
            validSources.push(source);
          } else {
            invalidSources.push(source);
          }
        } else if (source) {
          invalidSources.push(source);
        }
      });

      if (validSources.length > 0) {
        const sourceNames = validSources.map(s => s.name).join(', ');
        saveToHistory(query, detectedType, sourceNames);
        
        validSources.forEach(source => {
          chrome.tabs.create({ url: source.getUrl(detectedType, query) });
        });
        
        sendResponse({ 
          success: true, 
          detectedType: detectedType,
          validCount: validSources.length,
          invalidCount: invalidSources.length
        });
      } else {
        let errorMsg;
        if (invalidSources.length > 0) {
          const sourceNames = invalidSources.map(s => s.name).join(', ');
          errorMsg = `The selected sources (${sourceNames}) do not support ${detectedType} searches or the format is invalid.`;
        } else {
          errorMsg = `The provided input does not appear to be a valid ${detectedType}.`;
        }
        createNotification("Invalid Input", errorMsg);
        sendResponse({ error: errorMsg });
      }
      return true;
    }
    
    if (sourceId === 'all') {
      let validSources = [];
      searchSources.forEach(source => {
        if (source.types.includes(detectedType)) {
          if (handleSearch(source, detectedType, query, true)) {
            validSources.push(source);
          }
        }
      });
      
      if (validSources.length > 0) {
        saveToHistory(query, detectedType, "All");
        validSources.forEach(source => {
          chrome.tabs.create({ url: source.getUrl(detectedType, query) });
        });
        sendResponse({ success: true, detectedType: detectedType });
      } else {
        const errorMsg = `The provided input does not appear to be a valid ${detectedType}.`;
        createNotification("Invalid Input", errorMsg);
        sendResponse({ error: errorMsg });
      }
    } else {
      const source = searchSources.find(s => s.id === sourceId);
      if (source && source.types.includes(detectedType)) {
        if (handleSearch(source, detectedType, query, false)) {
          saveToHistory(query, detectedType, source.name);
          sendResponse({ success: true, detectedType: detectedType });
        } else {
          sendResponse({ error: `Invalid ${detectedType} format` });
        }
      } else {
        const errorMsg = `The selected source does not support ${detectedType} searches.`;
        createNotification("Invalid Source", errorMsg);
        sendResponse({ error: errorMsg });
      }
    }
    return true;
  }
});

function detectIOCType(query) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  const hashRegex = /^(?:[a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$/;
  const urlRegex = /^(?:(?:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}))(?::\d{1,5})?(?:\/[^\s]*)?$/i;
  
  const cleanedQuery = query.replace(/^https?:\/\//, '');
  
  if (ipv4Regex.test(query) || ipv6Regex.test(query)) {
    return "IP";
  } else if (hashRegex.test(query)) {
    return "Hash";
  } else if (domainRegex.test(cleanedQuery)) {
    return "Domain";
  } else if (urlRegex.test(cleanedQuery)) {
    return "URL";
  }
  
  return null;
}