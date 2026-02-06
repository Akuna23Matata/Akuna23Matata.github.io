/**
 * Main JavaScript for VS Code-themed Personal Website
 * Handles: Theme switching, View counter, Weather, Sidebar navigation
 */

// ==================== Configuration ====================
const CONFIG = {
  // OpenWeatherMap API (free tier - get your key at openweathermap.org)
  // Replace with your own API key
  weatherApiKey: 'YOUR_OPENWEATHERMAP_API_KEY',
  
  // Location for weather (UC Merced coordinates)
  weatherLat: 37.3636,
  weatherLon: -120.4252,
  
  // CounterAPI.dev configuration
  // IMPORTANT: This API key is visible in client-side code
  // Anyone can see and potentially abuse it
  counterApiKey: 'ut_OiyaO4mYIlgdf38eCsQiURaI3XiVKXuQRAhgHpS3',
  counterTeam: 'zhibo-hous-team-2791',
  counterName: 'first-counter-2791'
};

// ==================== Theme Switcher ====================
class ThemeSwitcher {
  constructor() {
    this.themeSelector = document.getElementById('themeSelector');
    this.themeMenu = document.getElementById('themeMenu');
    this.currentThemeSpan = document.getElementById('currentTheme');
    this.themeItems = document.querySelectorAll('.theme-item');
    
    this.init();
  }
  
  init() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.setTheme(savedTheme);
    
    // Toggle menu on click
    this.themeSelector?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.themeMenu?.classList.toggle('visible');
    });
    
    // Theme item clicks
    this.themeItems.forEach(item => {
      item.addEventListener('click', () => {
        const theme = item.dataset.theme;
        this.setTheme(theme);
        this.themeMenu?.classList.remove('visible');
      });
    });
    
    // Close menu on outside click
    document.addEventListener('click', () => {
      this.themeMenu?.classList.remove('visible');
    });
  }
  
  setTheme(theme) {
    // Update body attribute
    document.body.setAttribute('data-theme', theme);
    
    // Update active state in menu
    this.themeItems.forEach(item => {
      item.classList.toggle('active', item.dataset.theme === theme);
      const icon = item.querySelector('svg, i');
      if (icon) {
        if (item.dataset.theme === theme) {
          icon.setAttribute('data-lucide', 'check');
          icon.classList.remove('hidden-icon');
        } else {
          icon.setAttribute('data-lucide', 'circle');
          icon.classList.add('hidden-icon');
        }
      }
    });
    
    // Update display text
    const themeNames = {
      'dark': 'Dark',
      'light': 'Light',
      'high-contrast': 'High Contrast'
    };
    if (this.currentThemeSpan) {
      this.currentThemeSpan.textContent = themeNames[theme] || 'Dark';
    }
    
    // Save preference
    localStorage.setItem('theme', theme);
    
    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// ==================== View Counter (CounterAPI.dev) ====================
// SECURITY NOTE: The API key is visible in client-side JavaScript
// This means anyone can see and potentially abuse it
// CounterAPI.dev should have rate limiting to prevent abuse
// For sensitive applications, use server-side tracking instead

class ViewCounter {
  constructor() {
    this.viewCountElement = document.getElementById('viewCount');
    this.init();
  }
  
  async init() {
    // Set a timeout to avoid hanging
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    // Check if API key is configured
    if (!CONFIG.counterApiKey || CONFIG.counterApiKey === 'YOUR_API_KEY') {
      console.warn('CounterAPI.dev API key not configured');
      const localCount = this.getLocalCount();
      if (localCount > 0) {
        this.displayCount(localCount);
      } else {
        this.viewCountElement.textContent = '—';
      }
      return;
    }
    
    try {
      const count = await Promise.race([this.getAndIncrementCount(), timeout]);
      if (count !== null && count !== undefined && count >= 0) {
        this.displayCount(count);
        return;
      }
    } catch (error) {
      console.warn('CounterAPI increment failed:', error);
    }
    
    // Try to get without incrementing
    try {
      const getCount = await Promise.race([this.getCountOnly(), timeout]);
      if (getCount !== null && getCount !== undefined && getCount >= 0) {
        this.displayCount(getCount);
        return;
      }
    } catch (error) {
      console.warn('CounterAPI get failed:', error);
    }
    
    // Use localStorage as fallback
    const localCount = this.getLocalCount();
    if (localCount > 0) {
      this.displayCount(localCount);
    } else {
      // Show placeholder instead of hanging on "Loading..."
      this.viewCountElement.textContent = '—';
    }
  }
  
  async getAndIncrementCount() {
    // Using CounterAPI.dev to track visits
    const url = `https://api.counterapi.dev/v2/${CONFIG.counterTeam}/${CONFIG.counterName}/up`;
    
    try {
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Authorization': `Bearer ${CONFIG.counterApiKey}`
        }
      });
      if (!response.ok) {
        console.warn('CounterAPI response not ok:', response.status);
        return null;
      }
      const data = await response.json();
      // CounterAPI.dev returns the count in different formats depending on version
      const count = data.count || data.value || data;
      if (count !== undefined && count !== null) {
        // Store in localStorage as backup
        localStorage.setItem('viewCount', count.toString());
        return count;
      }
      return null;
    } catch (error) {
      console.warn('CounterAPI increment failed:', error);
      return null;
    }
  }
  
  async getCountOnly() {
    const getUrl = `https://api.counterapi.dev/v2/${CONFIG.counterTeam}/${CONFIG.counterName}`;
    try {
      const response = await fetch(getUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Authorization': `Bearer ${CONFIG.counterApiKey}`
        }
      });
      if (!response.ok) {
        console.warn('CounterAPI get response not ok:', response.status);
        return null;
      }
      const data = await response.json();
      const count = data.count || data.value || data;
      if (count !== undefined && count !== null) {
        localStorage.setItem('viewCount', count.toString());
        return count;
      }
      return null;
    } catch (error) {
      console.warn('CounterAPI get failed:', error);
      return null;
    }
  }
  
  getLocalCount() {
    const stored = localStorage.getItem('viewCount');
    if (stored) {
      const count = parseInt(stored, 10);
      return isNaN(count) ? 0 : count;
    }
    return 0;
  }
  
  displayCount(count) {
    if (this.viewCountElement) {
      // Format number (e.g., 1200 -> 1.2k)
      const formatted = this.formatNumber(count);
      this.viewCountElement.textContent = `${formatted} views`;
    }
  }
  
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'm';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
}

// ==================== Citation Counter ====================
class CitationCounter {
  constructor() {
    this.citationElement = document.getElementById('citationCount');
    this.scholarId = this.getScholarId();
    this.init();
  }
  
  getScholarId() {
    // Try to get from a data attribute or config
    const dataElement = document.getElementById('scholarIdData');
    if (dataElement) {
      return dataElement.textContent.trim();
    }
    return null;
  }
  
  async init() {
    if (!this.scholarId || this.scholarId === 'YOUR_GOOGLE_SCHOLAR_ID') {
      // Show infinity symbol when Scholar ID is not configured
      this.citationElement.textContent = '∞ Citations';
      return;
    }
    
    try {
      const citations = await this.fetchCitations();
      if (citations !== null && citations !== undefined && citations >= 0) {
        this.displayCitations(citations);
        // Cache the result
        localStorage.setItem('citationCount', citations.toString());
        localStorage.setItem('citationCountTime', Date.now().toString());
      } else {
        // Try to use cached value if recent (less than 24 hours old)
        const cached = this.getCachedCitations();
        if (cached > 0) {
          this.displayCitations(cached);
        } else {
          // Show infinity symbol when fetch fails and no valid cache
          this.citationElement.textContent = '∞ Citations';
        }
      }
    } catch (error) {
      console.error('Failed to fetch citations:', error);
      const cached = this.getCachedCitations();
      if (cached > 0) {
        this.displayCitations(cached);
      } else {
        // Show infinity symbol when fetch fails and no valid cache
        this.citationElement.textContent = '∞ Citations';
      }
    }
  }
  
  async fetchCitations() {
    // Using a CORS proxy to fetch Google Scholar data
    // Note: This is a public proxy service - for production, use your own proxy or API
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const scholarUrl = `https://scholar.google.com/citations?user=${this.scholarId}&hl=en`;
    
    try {
      const response = await fetch(proxyUrl + encodeURIComponent(scholarUrl), {
        method: 'GET',
        headers: { 'Accept': 'text/html' }
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const html = await response.text();
      // Parse citations from Google Scholar HTML
      // Look for pattern like "Cited by 128" or similar
      const citedByMatch = html.match(/Cited by\s*(\d+)/i);
      if (citedByMatch && citedByMatch[1]) {
        return parseInt(citedByMatch[1], 10);
      }
      
      // Alternative pattern: look for citation count in meta or structured data
      const citationMatch = html.match(/"citation_count":(\d+)/i) || 
                           html.match(/Citations[^:]*:\s*(\d+)/i);
      if (citationMatch && citationMatch[1]) {
        return parseInt(citationMatch[1], 10);
      }
      
      return null;
    } catch (error) {
      console.warn('Citation fetch failed:', error);
      return null;
    }
  }
  
  getCachedCitations() {
    const cachedTime = localStorage.getItem('citationCountTime');
    if (cachedTime) {
      const age = Date.now() - parseInt(cachedTime, 10);
      // Use cache if less than 24 hours old
      if (age < 24 * 60 * 60 * 1000) {
        const cached = localStorage.getItem('citationCount');
        if (cached) {
          const count = parseInt(cached, 10);
          return isNaN(count) ? 0 : count;
        }
      }
    }
    return 0;
  }
  
  displayCitations(count) {
    if (this.citationElement) {
      const formatted = this.formatNumber(count);
      this.citationElement.textContent = `${formatted} Citations`;
    }
  }
  
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'm';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
}

// ==================== Weather Display ====================
class WeatherDisplay {
  constructor() {
    this.weatherText = document.getElementById('weatherText');
    this.init();
  }
  
  async init() {
    // Check if we have a valid API key
    if (CONFIG.weatherApiKey === 'YOUR_OPENWEATHERMAP_API_KEY') {
      // Use placeholder if no API key configured
      this.displayWeather({ temp: 72, description: 'Sunny' });
      return;
    }
    
    try {
      const weather = await this.fetchWeather();
      this.displayWeather(weather);
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      this.weatherText.textContent = '—';
    }
  }
  
  async fetchWeather() {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${CONFIG.weatherLat}&lon=${CONFIG.weatherLon}&appid=${CONFIG.weatherApiKey}&units=imperial`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      temp: Math.round(data.main.temp),
      description: data.weather[0].main
    };
  }
  
  displayWeather(weather) {
    if (this.weatherText) {
      this.weatherText.textContent = `${weather.temp}°F ${weather.description}`;
    }
  }
}

// ==================== Sidebar Navigation ====================
class SidebarNavigation {
  constructor() {
    this.fileItems = document.querySelectorAll('.file-item.file');
    this.sections = document.querySelectorAll('.section');
    this.scrollContent = document.querySelector('.scroll-content');
    
    this.init();
  }
  
  init() {
    // Click handling for file items
    this.fileItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.scrollToSection(section);
        this.setActiveItem(item);
        // Update URL hash without triggering scroll
        history.pushState(null, '', `#${section}`);
      });
    });
    
    // Handle initial hash on page load
    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      setTimeout(() => {
        this.scrollToSection(hash);
        const activeItem = Array.from(this.fileItems).find(item => item.dataset.section === hash);
        if (activeItem) {
          this.setActiveItem(activeItem);
        }
      }, 100);
    }
    
    // Handle browser back/forward navigation
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        this.scrollToSection(hash);
        const activeItem = Array.from(this.fileItems).find(item => item.dataset.section === hash);
        if (activeItem) {
          this.setActiveItem(activeItem);
        }
      }
    });
    
    // Update active item on scroll
    this.scrollContent?.addEventListener('scroll', () => {
      this.updateActiveOnScroll();
    });
  }
  
  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section && this.scrollContent) {
      // Account for title bar (32px) + tab bar (35px) + some extra padding
      const offsetTop = section.offsetTop - 100;
      this.scrollContent.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }
  
  setActiveItem(activeItem) {
    this.fileItems.forEach(item => {
      item.classList.remove('active');
    });
    activeItem.classList.add('active');
    
    // Update tab name to match selected file
    const tabName = document.querySelector('.tab-name');
    const fileName = activeItem.querySelector('.file-name')?.textContent;
    if (tabName && fileName) {
      tabName.textContent = fileName;
    }
  }
  
  updateActiveOnScroll() {
    if (!this.scrollContent) return;
    
    const scrollTop = this.scrollContent.scrollTop;
    let currentSection = null;
    
    this.sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (scrollTop >= sectionTop) {
        currentSection = section.id;
      }
    });
    
    if (currentSection) {
      this.fileItems.forEach(item => {
        const isActive = item.dataset.section === currentSection;
        item.classList.toggle('active', isActive);
      });
    }
  }
}

// ==================== Update Current Date ====================
function updateCurrentDate() {
  const dateElement = document.getElementById('currentDate');
  if (dateElement) {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
  }
}

// ==================== Initialize Everything ====================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  window.themeSwitcher = new ThemeSwitcher();
  window.viewCounter = new ViewCounter();
  window.weatherDisplay = new WeatherDisplay();
  window.sidebarNav = new SidebarNavigation();
  window.citationCounter = new CitationCounter();
  
  // Update current date
  updateCurrentDate();
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
