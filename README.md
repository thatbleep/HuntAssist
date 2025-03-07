# HuntAssist

HuntAssist is a browser extension designed for security professionals, threat hunters, and incident responders. It provides instant access to multiple threat intelligence platforms and security tools directly from your browser.

## Features

### Search IOCs
Quickly search for suspicious indicators across multiple threat intelligence platforms:
- **AbuseIPDB**: Check IP addresses and domains for reported abuse
- **AlienVault OTX**: Search for IOCs in Open Threat Exchange
- **VirusTotal**: Analyze suspicious files, domains, IPs and URLs
- **Shodan**: Search for exposed devices and vulnerabilities
- **Scamalytics**: Check IP addresses for fraud risk
- **IP Geolocation**: Get detailed geographic location data for IPs
- **URLScan.io**: Analyze and scan URLs for malicious content
- **Hybrid Analysis**: Examine files and domains for malware

### Email Analysis
- **Email Header Parser**: Parse and analyze email headers to trace message path and verify authenticity with SPF, DKIM, and DMARC validation

### Encode/Decode Tools
- **Base64 Encode/Decode**: Convert text to and from Base64 format
- **JWT Decoder**: Decode and inspect JSON Web Tokens (JWT) with expiration validation

### Additional Features
- **In-extension Search**: Search for IOCs directly from the extension popup with automatic type detection
- **Search History**: Keep track of all your searches with detailed information
- **Geolocation Data**: Automatically fetches and displays geolocation data for IP addresses (city, region, country, ISP)
- **Domain Information**: Shows registration details, registrar, and age for domains
- **Note Taking**: Add notes to your search history entries
- **Export History**: Export your search history to CSV format
- **Filter History**: Filter search history by IOC type 

## How to Use

### Context Menu Search
1. Highlight any text (IP, domain, hash, or URL) on a webpage
2. Right-click and select "Search IOCs"
3. Choose the type of indicator and the intelligence platform to search

### URL Analysis
1. Right-click on any link
2. Select "Analyze URL" 
3. Choose your preferred analysis platform

### In-extension Search
1. Click the HuntAssist icon in your browser toolbar
2. Select the "Search" tab
3. Enter an IOC (IP, domain, hash, or URL)
4. Select the IOC type or use auto-detection
5. Choose your preferred search source or search across all compatible platforms
6. Click "Search" to analyze the indicator

### Tools
Access various tools from the extension popup:
- **History**: View and manage your search history
- **Search**: Directly search for IOCs without leaving the extension
- **Base64**: Encode or decode Base64 text
- **Email Headers**: Parse and analyze email headers
- **JWT Decoder**: Decode and inspect JWT tokens with expiration validation
- **CyberChef**: Quick access to the CyberChef web application

## Installation

1. Download the extension from the Chrome Web Store
2. Click "Add to Chrome" to install
3. The HuntAssist icon will appear in your browser toolbar

## Privacy

HuntAssist stores your search history locally in your browser. No data is sent to external servers except when performing searches on the selected intelligence platforms.
