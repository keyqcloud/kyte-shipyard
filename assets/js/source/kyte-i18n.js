/**
 * Kyte Internationalization (i18n) Library
 *
 * Frontend translation support for multi-language applications.
 * Supports: English (en), Japanese (ja), Spanish (es), Korean (ko)
 *
 * Usage:
 *   // Initialize
 *   const i18n = new KyteI18n('en', '/assets/i18n/');
 *   await i18n.init();
 *
 *   // Translate
 *   i18n.t('error.not_found');  // "Record not found"
 *   i18n.t('success.created', {model: 'User'});  // "User created successfully"
 *
 *   // Auto-translate DOM elements
 *   i18n.translateDOM();
 *
 *   // Change language
 *   await i18n.setLanguage('ja');
 *
 * HTML Integration:
 *   <span data-i18n="error.not_found"></span>
 *   <input type="text" data-i18n-placeholder="validation.email" />
 *   <button data-i18n="action.confirm_delete" data-i18n-params='{"item":"User"}'></button>
 *
 * @package Kyte
 * @version 4.0.0
 * @license MIT
 */

class KyteI18n {
    /**
     * Constructor
     *
     * @param {string} language - Initial language code (en, ja, es, ko)
     * @param {string} translationPath - Path to translation JSON files
     */
    constructor(language = 'en', translationPath = '/assets/i18n/') {
        this.currentLanguage = language;
        this.translationPath = translationPath;
        this.translations = {};
        this.loadedLanguages = {};
        this.supportedLanguages = ['en', 'ja', 'es', 'ko'];
        this.fallbackLanguage = 'en';
        this.initialized = false;
    }

    /**
     * Initialize i18n system
     * Detects browser language and loads translations
     *
     * @param {string|null} userPreference - Optional user language preference
     * @returns {Promise<boolean>}
     */
    async init(userPreference = null) {
        try {
            // Determine language: user preference > browser > fallback
            let targetLanguage = userPreference || this.detectBrowserLanguage();

            // Validate language
            if (!this.supportedLanguages.includes(targetLanguage)) {
                console.warn(`KyteI18n: Unsupported language '${targetLanguage}', falling back to '${this.fallbackLanguage}'`);
                targetLanguage = this.fallbackLanguage;
            }

            this.currentLanguage = targetLanguage;

            // Load translation file
            await this.loadTranslations(targetLanguage);

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('KyteI18n: Initialization failed', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Detect browser language from navigator
     *
     * @returns {string} Detected language code
     */
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage || 'en';

        // Extract primary language code (en-US -> en, ja-JP -> ja)
        const langCode = browserLang.split('-')[0].toLowerCase();

        // Return if supported, otherwise fallback
        return this.supportedLanguages.includes(langCode) ? langCode : this.fallbackLanguage;
    }

    /**
     * Get current language
     *
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get supported languages
     *
     * @returns {Array<string>} List of supported language codes
     */
    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }

    /**
     * Set/change current language
     *
     * @param {string} lang - Language code (en, ja, es, ko)
     * @returns {Promise<boolean>}
     */
    async setLanguage(lang) {
        // Validate language
        if (!this.supportedLanguages.includes(lang)) {
            console.error(`KyteI18n: Unsupported language '${lang}'`);
            return false;
        }

        // Skip if already current language
        if (lang === this.currentLanguage) {
            return true;
        }

        try {
            // Load new language translations
            await this.loadTranslations(lang);

            this.currentLanguage = lang;

            // Re-translate DOM if initialized
            if (this.initialized) {
                this.translateDOM();
            }

            // Trigger custom event for language change
            window.dispatchEvent(new CustomEvent('kyteLanguageChanged', {
                detail: { language: lang }
            }));

            return true;
        } catch (error) {
            console.error(`KyteI18n: Failed to set language to '${lang}'`, error);
            return false;
        }
    }

    /**
     * Translate a key with optional parameter substitution
     *
     * @param {string} key - Translation key (e.g., 'error.not_found')
     * @param {Object} params - Optional parameters for substitution
     * @returns {string} Translated string
     */
    t(key, params = {}) {
        // Get translation or fallback to key
        let text = this.translations[key] || key;

        // If not found and not in English, try English fallback
        if (text === key && this.currentLanguage !== this.fallbackLanguage) {
            if (this.loadedLanguages[this.fallbackLanguage]) {
                text = this.loadedLanguages[this.fallbackLanguage][key] || key;
            }
        }

        // Substitute parameters
        if (Object.keys(params).length > 0) {
            Object.keys(params).forEach(paramKey => {
                const regex = new RegExp(`\\{${paramKey}\\}`, 'g');
                text = text.replace(regex, params[paramKey]);
            });
        }

        return text;
    }

    /**
     * Check if a translation key exists
     *
     * @param {string} key - Translation key
     * @returns {boolean}
     */
    has(key) {
        return this.translations.hasOwnProperty(key);
    }

    /**
     * Load translations from JSON file
     *
     * @param {string} lang - Language code
     * @returns {Promise<void>}
     */
    async loadTranslations(lang) {
        // Check cache first
        if (this.loadedLanguages[lang]) {
            this.translations = this.loadedLanguages[lang];
            return;
        }

        try {
            const url = `${this.translationPath}${lang}.json`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const translations = await response.json();

            // Cache and set as current
            this.loadedLanguages[lang] = translations;
            this.translations = translations;

        } catch (error) {
            console.error(`KyteI18n: Failed to load translations for '${lang}'`, error);

            // Fallback to English if not already trying English
            if (lang !== this.fallbackLanguage) {
                console.warn(`KyteI18n: Falling back to '${this.fallbackLanguage}'`);
                await this.loadTranslations(this.fallbackLanguage);
            } else {
                // If English also fails, use empty object
                this.translations = {};
            }
        }
    }

    /**
     * Automatically translate DOM elements with data-i18n attributes
     *
     * Supports:
     *   - data-i18n: Translates textContent
     *   - data-i18n-placeholder: Translates placeholder attribute
     *   - data-i18n-title: Translates title attribute
     *   - data-i18n-params: JSON object with substitution parameters
     *
     * @param {HTMLElement|null} root - Root element to search (default: document.body)
     */
    translateDOM(root = null) {
        if (!this.initialized) {
            console.warn('KyteI18n: Cannot translate DOM before initialization');
            return;
        }

        const container = root || document.body;

        // Translate text content (data-i18n)
        const textElements = container.querySelectorAll('[data-i18n]');
        textElements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const paramsAttr = element.getAttribute('data-i18n-params');
            const params = paramsAttr ? JSON.parse(paramsAttr) : {};

            element.textContent = this.t(key, params);
        });

        // Translate placeholder attributes (data-i18n-placeholder)
        const placeholderElements = container.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const paramsAttr = element.getAttribute('data-i18n-params');
            const params = paramsAttr ? JSON.parse(paramsAttr) : {};

            element.setAttribute('placeholder', this.t(key, params));
        });

        // Translate title attributes (data-i18n-title)
        const titleElements = container.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const paramsAttr = element.getAttribute('data-i18n-params');
            const params = paramsAttr ? JSON.parse(paramsAttr) : {};

            element.setAttribute('title', this.t(key, params));
        });
    }

    /**
     * Format number according to current language locale
     *
     * @param {number} number - Number to format
     * @param {Object} options - Intl.NumberFormat options
     * @returns {string} Formatted number
     */
    formatNumber(number, options = {}) {
        const localeMap = {
            'en': 'en-US',
            'ja': 'ja-JP',
            'es': 'es-ES',
            'ko': 'ko-KR'
        };

        const locale = localeMap[this.currentLanguage] || 'en-US';
        return new Intl.NumberFormat(locale, options).format(number);
    }

    /**
     * Format date according to current language locale
     *
     * @param {Date|number} date - Date to format
     * @param {Object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date
     */
    formatDate(date, options = {}) {
        const localeMap = {
            'en': 'en-US',
            'ja': 'ja-JP',
            'es': 'es-ES',
            'ko': 'ko-KR'
        };

        const locale = localeMap[this.currentLanguage] || 'en-US';
        const dateObj = typeof date === 'number' ? new Date(date * 1000) : date;

        return new Intl.DateTimeFormat(locale, options).format(dateObj);
    }

    /**
     * Get language name in its native script
     *
     * @param {string} langCode - Language code
     * @returns {string} Native language name
     */
    static getLanguageName(langCode) {
        const languageNames = {
            'en': 'English',
            'ja': '日本語',
            'es': 'Español',
            'ko': '한국어'
        };

        return languageNames[langCode] || langCode;
    }

    /**
     * Clear translation cache
     * Useful for development/testing
     */
    clearCache() {
        this.loadedLanguages = {};
        this.translations = {};
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KyteI18n;
}

// Global instance helper
if (typeof window !== 'undefined') {
    window.KyteI18n = KyteI18n;
}
