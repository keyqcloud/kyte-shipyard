/**
 * Kyte Language Selector Component
 *
 * Reusable language selector that can be embedded in:
 * - User settings pages
 * - Navigation bars
 * - Any page requiring language switching
 *
 * Features:
 * - Dropdown or button-based UI
 * - Updates user preference via API
 * - Automatically reloads translations
 * - Persists language selection to session/cookies
 *
 * Usage:
 *   // Dropdown in user settings
 *   const selector = new KyteLanguageSelector({
 *     container: '#language-settings',
 *     kyte: _ks,
 *     i18n: kyteI18n,
 *     style: 'dropdown',
 *     showLabel: true,
 *     updateUserPreference: true
 *   });
 *
 *   // Compact button in navbar
 *   const navSelector = new KyteLanguageSelector({
 *     container: '#navbar-language',
 *     kyte: _ks,
 *     i18n: kyteI18n,
 *     style: 'compact',
 *     showLabel: false
 *   });
 *
 * @package Kyte
 * @version 4.0.0
 * @license MIT
 */

class KyteLanguageSelector {
    /**
     * Constructor
     *
     * @param {Object} options - Configuration options
     * @param {string} options.container - CSS selector for container element
     * @param {Kyte} options.kyte - Kyte SDK instance
     * @param {KyteI18n} options.i18n - KyteI18n instance
     * @param {string} options.style - UI style: 'dropdown', 'buttons', 'compact' (default: 'dropdown')
     * @param {boolean} options.showLabel - Show "Language:" label (default: true)
     * @param {boolean} options.updateUserPreference - Update user preference via API (default: true)
     * @param {function} options.onChange - Callback when language changes
     */
    constructor(options) {
        // Validate required options
        if (!options.container) {
            throw new Error('KyteLanguageSelector: container option is required');
        }
        if (!options.kyte) {
            throw new Error('KyteLanguageSelector: kyte SDK instance is required');
        }
        if (!options.i18n) {
            throw new Error('KyteLanguageSelector: i18n instance is required');
        }

        this.container = document.querySelector(options.container);
        if (!this.container) {
            throw new Error(`KyteLanguageSelector: container '${options.container}' not found`);
        }

        this.kyte = options.kyte;
        this.i18n = options.i18n;
        this.style = options.style || 'dropdown';
        this.showLabel = options.showLabel !== false;
        this.updateUserPreference = options.updateUserPreference !== false;
        this.onChange = options.onChange || null;

        this.languages = [
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'ja', name: '日本語', flag: '🇯🇵' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'ko', name: '한국어', flag: '🇰🇷' }
        ];

        this.currentLanguage = this.i18n.getCurrentLanguage();

        this.render();
        this.attachEventListeners();
    }

    /**
     * Get current language object
     *
     * @returns {Object} Language object with code, name, flag
     */
    getCurrentLanguageObject() {
        return this.languages.find(lang => lang.code === this.currentLanguage) || this.languages[0];
    }

    /**
     * Render the selector UI based on style
     */
    render() {
        switch (this.style) {
            case 'dropdown':
                this.renderDropdown();
                break;
            case 'buttons':
                this.renderButtons();
                break;
            case 'compact':
                this.renderCompact();
                break;
            default:
                this.renderDropdown();
        }
    }

    /**
     * Render dropdown style selector
     */
    renderDropdown() {
        const currentLang = this.getCurrentLanguageObject();

        let html = '<div class="kyte-language-selector kyte-lang-dropdown">';

        if (this.showLabel) {
            html += '<label class="form-label">Language / 言語 / Idioma / 언어</label>';
        }

        html += '<select class="form-select kyte-lang-select">';

        this.languages.forEach(lang => {
            const selected = lang.code === this.currentLanguage ? 'selected' : '';
            html += `<option value="${lang.code}" ${selected}>
                ${lang.flag} ${lang.name}
            </option>`;
        });

        html += '</select>';
        html += '</div>';

        this.container.innerHTML = html;
    }

    /**
     * Render button style selector
     */
    renderButtons() {
        let html = '<div class="kyte-language-selector kyte-lang-buttons">';

        if (this.showLabel) {
            html += '<div class="form-label mb-2">Language / 言語 / Idioma / 언어</div>';
        }

        html += '<div class="btn-group" role="group">';

        this.languages.forEach(lang => {
            const active = lang.code === this.currentLanguage ? 'active' : '';
            html += `<button type="button"
                class="btn btn-outline-primary kyte-lang-btn ${active}"
                data-lang="${lang.code}"
                title="${lang.name}">
                ${lang.flag} ${lang.name}
            </button>`;
        });

        html += '</div>';
        html += '</div>';

        this.container.innerHTML = html;
    }

    /**
     * Render compact style selector (for navbar)
     */
    renderCompact() {
        const currentLang = this.getCurrentLanguageObject();

        let html = `
        <div class="kyte-language-selector kyte-lang-compact dropdown">
            <button class="btn btn-link dropdown-toggle" type="button"
                id="kyteLanguageDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                ${currentLang.flag} ${currentLang.code.toUpperCase()}
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="kyteLanguageDropdown">
        `;

        this.languages.forEach(lang => {
            const active = lang.code === this.currentLanguage ? 'active' : '';
            html += `<li>
                <a class="dropdown-item kyte-lang-option ${active}" href="#" data-lang="${lang.code}">
                    ${lang.flag} ${lang.name}
                </a>
            </li>`;
        });

        html += `
            </ul>
        </div>
        `;

        this.container.innerHTML = html;
    }

    /**
     * Attach event listeners based on style
     */
    attachEventListeners() {
        if (this.style === 'dropdown') {
            const select = this.container.querySelector('.kyte-lang-select');
            if (select) {
                select.addEventListener('change', (e) => {
                    this.changeLanguage(e.target.value);
                });
            }
        } else if (this.style === 'buttons') {
            const buttons = this.container.querySelectorAll('.kyte-lang-btn');
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const lang = e.currentTarget.getAttribute('data-lang');
                    this.changeLanguage(lang);
                });
            });
        } else if (this.style === 'compact') {
            const options = this.container.querySelectorAll('.kyte-lang-option');
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    const lang = e.currentTarget.getAttribute('data-lang');
                    this.changeLanguage(lang);
                });
            });
        }
    }

    /**
     * Change language
     *
     * @param {string} langCode - Language code (en, ja, es, ko)
     */
    async changeLanguage(langCode) {
        // Validate language code
        if (!this.languages.find(lang => lang.code === langCode)) {
            console.error(`KyteLanguageSelector: Invalid language code '${langCode}'`);
            return;
        }

        // Skip if already current language
        if (langCode === this.currentLanguage) {
            return;
        }

        try {
            // Update user preference via API (if enabled and user is logged in)
            if (this.updateUserPreference && this.kyte.sessionToken && this.kyte.sessionToken !== '0') {
                await this.updateUserLanguagePreference(langCode);
            }

            // Update i18n library
            await this.i18n.setLanguage(langCode);

            // Update current language
            this.currentLanguage = langCode;

            // Store in session storage for persistence
            sessionStorage.setItem('kyte_language', langCode);

            // Re-render selector to update UI
            this.render();
            this.attachEventListeners();

            // Translate DOM automatically
            this.i18n.translateDOM();

            // Call custom onChange callback
            if (this.onChange && typeof this.onChange === 'function') {
                this.onChange(langCode);
            }

            // Trigger custom event
            window.dispatchEvent(new CustomEvent('kyteLanguageSelectorChanged', {
                detail: { language: langCode }
            }));

            // Show success message
            console.log(`Language changed to: ${langCode}`);

        } catch (error) {
            console.error('KyteLanguageSelector: Failed to change language', error);
            alert('Failed to change language. Please try again.');
        }
    }

    /**
     * Update user language preference via API
     *
     * @param {string} langCode - Language code
     * @returns {Promise<void>}
     */
    updateUserLanguagePreference(langCode) {
        return new Promise((resolve, reject) => {
            // Get current user ID from Kyte response
            const userId = this.kyte.getCookie('accountIdx');

            if (!userId || userId === '0') {
                // No user logged in, skip API update
                resolve();
                return;
            }

            // Update user language preference
            this.kyte.put('KyteUser', 'id', userId,
                { language: langCode },
                null, // formdata
                [], // headers
                (response) => {
                    console.log('User language preference updated successfully');
                    resolve();
                },
                (error) => {
                    console.error('Failed to update user language preference:', error);
                    // Don't reject - continue with language change even if API fails
                    resolve();
                }
            );
        });
    }

    /**
     * Get language name from code
     *
     * @param {string} code - Language code
     * @returns {string} Language name
     */
    static getLanguageName(code) {
        const languages = {
            'en': 'English',
            'ja': '日本語',
            'es': 'Español',
            'ko': '한국어'
        };
        return languages[code] || code;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KyteLanguageSelector;
}

// Global instance helper
if (typeof window !== 'undefined') {
    window.KyteLanguageSelector = KyteLanguageSelector;
}
