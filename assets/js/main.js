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
  
  // CountAPI namespace and key for view counter
  countApiNamespace: 'akuna23matata-github-io',
  countApiKey: 'visits'
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

// ==================== View Counter (CountAPI) ====================
class ViewCounter {
  constructor() {
    this.viewCountElement = document.getElementById('viewCount');
    this.init();
  }
  
  async init() {
    try {
      const count = await this.getAndIncrementCount();
      this.displayCount(count);
    } catch (error) {
      console.error('Failed to fetch view count:', error);
      this.viewCountElement.textContent = '—';
    }
  }
  
  async getAndIncrementCount() {
    // Using CountAPI to track visits
    const url = `https://api.countapi.xyz/hit/${CONFIG.countApiNamespace}/${CONFIG.countApiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.value;
    } catch (error) {
      // Fallback: try to just get the count without incrementing
      const getUrl = `https://api.countapi.xyz/get/${CONFIG.countApiNamespace}/${CONFIG.countApiKey}`;
      const response = await fetch(getUrl);
      const data = await response.json();
      return data.value || 0;
    }
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

// ==================== Initialize Everything ====================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  window.themeSwitcher = new ThemeSwitcher();
  window.viewCounter = new ViewCounter();
  window.weatherDisplay = new WeatherDisplay();
  window.sidebarNav = new SidebarNavigation();
  
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
