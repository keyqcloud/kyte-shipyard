document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    let navbar = new KyteNav("#mainnav", rootnav, null, 'Kyte Shipyard<sup>&trade;</sup><img src="/assets/images/kyte_shipyard_light.png">');
    navbar.create();

    document.addEventListener('KyteI18nReady', function() {
        const t = (key, fallback) => {
            if (window.kyteI18n) {
                let text = window.kyteI18n.t(key);
                return text === key ? fallback : text;
            }
            return fallback;
        };

        if (!_ks.isSession()) {
            location.href = "/?redir=" + encodeURIComponent(window.location);
            return;
        }

        // Date fields arrive as "YYYY/MM/DD" strings (kyte-php's default dateformat).
        // Also tolerate Unix ints / digit-strings / ISO in case server formatting shifts.
        function toDate(value) {
            if (value === null || value === undefined || value === '' || value === 0 || value === '0') return null;
            if (typeof value === 'number') {
                return new Date(value < 1e12 ? value * 1000 : value);
            }
            if (typeof value === 'string') {
                if (/^\d+$/.test(value)) return new Date(parseInt(value, 10) * 1000);
                const slash = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
                if (slash) {
                    return new Date(
                        parseInt(slash[1], 10),
                        parseInt(slash[2], 10) - 1,
                        parseInt(slash[3], 10),
                        parseInt(slash[4] || '0', 10),
                        parseInt(slash[5] || '0', 10),
                        parseInt(slash[6] || '0', 10)
                    );
                }
                const ms = Date.parse(value);
                return isNaN(ms) ? null : new Date(ms);
            }
            return null;
        }

        function formatAbsolute(date) {
            if (!date) return '';
            return date.toLocaleString();
        }

        // Intl.RelativeTimeFormat handles localization for us; locale comes from KyteI18n.
        const rtf = (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat)
            ? new Intl.RelativeTimeFormat(window.kyteI18n ? window.kyteI18n.getCurrentLanguage() : 'en', { numeric: 'auto' })
            : null;

        function formatRelative(date) {
            if (!date) return '';
            const diffMs = date.getTime() - Date.now();
            const diffSec = Math.round(diffMs / 1000);
            const absSec = Math.abs(diffSec);
            if (!rtf) return formatAbsolute(date);
            if (absSec < 60) return rtf.format(diffSec, 'second');
            if (absSec < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
            if (absSec < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
            if (absSec < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day');
            if (absSec < 86400 * 365) return rtf.format(Math.round(diffSec / (86400 * 30)), 'month');
            return rtf.format(Math.round(diffSec / (86400 * 365)), 'year');
        }

        // Inline toast — mirrors createToast() in kyte-shipyard-application-configuration.js
        // (kept local since that helper isn't exported globally). role="status" + aria-live
        // makes screen readers announce the toast on appear.
        function showMcpToast(type, message) {
            const toast = document.createElement('div');
            const isSuccess = type === 'success';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                color: white;
                font-weight: 500;
                z-index: 9999;
                max-width: 400px;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                background: ${isSuccess
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)'};
                animation: mcp-toast-slide-in 0.3s ease-out;
            `;
            toast.innerHTML = `<div style="display:flex;align-items:center;gap:0.75rem;">
                <i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}" aria-hidden="true"></i>
                <span></span>
            </div>`;
            toast.querySelector('span').textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), isSuccess ? 3000 : 5000);
        }

        function escapeHtml(s) {
            if (s === null || s === undefined) return '';
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        const SCOPE_STYLES = {
            'read':   { bg: '#e0e7ff', fg: '#3730a3', label: t('ui.mcp_tokens.scope.read', 'read') },
            'draft':  { bg: '#fef3c7', fg: '#92400e', label: t('ui.mcp_tokens.scope.draft', 'draft') },
            'commit': { bg: '#d1fae5', fg: '#065f46', label: t('ui.mcp_tokens.scope.commit', 'commit') }
        };

        function renderScopes(csv) {
            if (!csv) return '<span style="color:#cbd5e0;">—</span>';
            const scopes = String(csv).split(',').map(s => s.trim()).filter(Boolean);
            return scopes.map(scope => {
                const style = SCOPE_STYLES[scope] || { bg: '#e2e8f0', fg: '#2d3748', label: scope };
                return `<span style="display:inline-block;padding:2px 8px;margin-right:4px;border-radius:10px;background:${style.bg};color:${style.fg};font-size:0.75em;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(style.label)}</span>`;
            }).join('');
        }

        function renderTokenPrefix(prefix) {
            if (!prefix) return '<span style="color:#cbd5e0;">—</span>';
            return `<code style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:0.85em;background:#f7fafc;padding:2px 6px;border-radius:4px;color:#2d3748;">${escapeHtml(prefix)}…</code>`;
        }

        function renderApplication(data, type, row) {
            if (row.application && typeof row.application === 'object' && row.application.name) {
                return `<span style="color:#2d3748;">${escapeHtml(row.application.name)}</span>`;
            }
            return `<em style="color:#a0aec0;">${escapeHtml(t('ui.mcp_tokens.value.all_apps', 'All apps'))}</em>`;
        }

        function renderLastUsed(data, type, row) {
            const date = toDate(data);
            if (!date) {
                return `<span style="color:#cbd5e0;">${escapeHtml(t('ui.mcp_tokens.value.never', 'Never'))}</span>`;
            }
            const ip = row.last_used_ip ? `<span style="display:block;font-size:0.8em;color:#a0aec0;font-family:monospace;">${escapeHtml(row.last_used_ip)}</span>` : '';
            return `<span title="${escapeHtml(formatAbsolute(date))}">${escapeHtml(formatRelative(date))}</span>${ip}`;
        }

        function renderExpires(data, type, row) {
            const date = toDate(data);
            if (!date) {
                return `<span style="color:#cbd5e0;">${escapeHtml(t('ui.mcp_tokens.value.never', 'Never'))}</span>`;
            }
            const isPast = date.getTime() < Date.now();
            const color = isPast ? '#c53030' : '#4a5568';
            const prefix = isPast
                ? `<span style="display:inline-block;padding:1px 6px;margin-right:6px;border-radius:8px;background:#fed7d7;color:#c53030;font-size:0.7em;font-weight:700;text-transform:uppercase;">${escapeHtml(t('ui.mcp_tokens.value.expired', 'Expired'))}</span>`
                : '';
            return `${prefix}<span title="${escapeHtml(formatAbsolute(date))}" style="color:${color};">${escapeHtml(formatRelative(date))}</span>`;
        }

        function renderCreated(data) {
            const date = toDate(data);
            if (!date) return '<span style="color:#cbd5e0;">—</span>';
            return `<span style="color:#4a5568;font-size:0.9em;" title="${escapeHtml(formatAbsolute(date))}">${escapeHtml(date.toLocaleDateString())}</span>`;
        }

        function renderActions(data, type, row) {
            const id = row.id;
            const name = row.name || '';
            const prefix = row.token_prefix || '';
            return `<button type="button" class="btn btn-sm btn-outline-danger mcp-revoke-btn" data-id="${escapeHtml(String(id))}" data-name="${escapeHtml(name)}" data-prefix="${escapeHtml(prefix)}" title="${escapeHtml(t('ui.mcp_tokens.actions.revoke', 'Revoke'))}"><i class="fas fa-ban me-1"></i><span>${escapeHtml(t('ui.mcp_tokens.actions.revoke', 'Revoke'))}</span></button>`;
        }

        const colDef = [
            { 'targets': 0, 'data': 'name', 'label': t('ui.mcp_tokens.table.name', 'Name'),
              render: function(data) { return `<span style="font-weight:600;color:#2d3748;">${escapeHtml(data || '')}</span>`; } },
            { 'targets': 1, 'data': 'token_prefix', 'label': t('ui.mcp_tokens.table.token', 'Token'),
              render: function(data) { return renderTokenPrefix(data); } },
            { 'targets': 2, 'data': 'scopes', 'label': t('ui.mcp_tokens.table.scopes', 'Scopes'), 'orderable': false,
              render: function(data) { return renderScopes(data); } },
            { 'targets': 3, 'data': 'application', 'label': t('ui.mcp_tokens.table.application', 'Application'), 'orderable': false,
              render: renderApplication },
            { 'targets': 4, 'data': 'last_used_at', 'label': t('ui.mcp_tokens.table.last_used', 'Last used'),
              render: renderLastUsed },
            { 'targets': 5, 'data': 'expires_at', 'label': t('ui.mcp_tokens.table.expires', 'Expires'),
              render: renderExpires },
            { 'targets': 6, 'data': 'date_created', 'label': t('ui.mcp_tokens.table.date_created', 'Created'),
              render: function(data) { return renderCreated(data); } },
            { 'targets': 7, 'data': 'id', 'label': t('ui.mcp_tokens.table.actions', 'Actions'), 'orderable': false,
              render: renderActions }
        ];

        function syncEmptyState() {
            const $table = $('#mcp-tokens-table');
            const $container = $table.closest('.table-container');
            const $empty = $('#mcp-tokens-empty');
            const dt = $.fn.dataTable.isDataTable($table) ? $table.DataTable() : null;
            const rowCount = dt ? dt.rows().count() : 0;
            if (rowCount === 0) {
                $container.addClass('d-none');
                $empty.removeClass('d-none');
            } else {
                $container.removeClass('d-none');
                $empty.addClass('d-none');
            }
        }

        // draw.dt fires after every DataTables redraw, including the redraw that
        // happens after KyteTable's async fetch lands. initComplete alone races
        // ahead of the data fetch and would leave the empty-state card showing
        // even when rows exist.
        $(document).on('draw.dt', '#mcp-tokens-table', syncEmptyState);

        $('#pageLoaderModal').modal('show');

        // actionEdit / actionDelete left false — we render our own Revoke
        // column so we don't want KyteTable's auto-injected ⋮ kebab menu.
        const dataTable = new KyteTable(
            _ks,
            $("#mcp-tokens-table"),
            { 'name': 'KyteMCPToken', 'field': null, 'value': null },
            colDef,
            true,
            [6, 'desc'],
            false,
            false
        );
        dataTable.initComplete = function() {
            $('#pageLoaderModal').modal('hide');
        };
        dataTable.init();

        // ────────────────────────────────────────────────────────────
        // Create-token modal + reveal-token modal
        // ────────────────────────────────────────────────────────────

        const createModalEl = document.getElementById('mcp-create-modal');
        const revealModalEl = document.getElementById('mcp-reveal-modal');
        const createModal = new bootstrap.Modal(createModalEl);
        const revealModal = new bootstrap.Modal(revealModalEl);

        function populateApplicationSelect() {
            const $select = $('#mcp-create-application');
            // Strip everything except the placeholder ("All apps") so reopens stay fresh.
            $select.find('option:not(:first)').remove();
            _ks.get('Application', null, null, [], function(response) {
                if (!response || !Array.isArray(response.data)) return;
                response.data.forEach(function(app) {
                    if (!app || !app.id) return;
                    $select.append(`<option value="${escapeHtml(String(app.id))}">${escapeHtml(app.name || '#' + app.id)}</option>`);
                });
            }, function() {
                // Silent fail — dropdown still has the "All apps" default.
            });
        }

        function resetCreateForm() {
            $('#mcp-create-form')[0].reset();
            $('#mcp-create-expires-custom-wrap').addClass('d-none');
            $('#mcp-create-error').addClass('d-none').text('');
            const submit = $('#mcp-create-submit');
            submit.prop('disabled', false).text(t('ui.mcp_tokens.create.button.create', 'Create token'));
        }

        function showCreateError(msg) {
            $('#mcp-create-error').removeClass('d-none').text(msg);
        }

        // expires_at (Unix epoch seconds, or 0 for "never"). Returns null on validation error.
        function computeExpiresAt() {
            const choice = $('#mcp-create-expires').val();
            if (choice === 'never') return 0;
            if (choice === 'custom') {
                const v = $('#mcp-create-expires-custom').val();
                if (!v) {
                    showCreateError(t('ui.mcp_tokens.create.error.expires_invalid', 'Custom expiration date is invalid.'));
                    return null;
                }
                const parts = v.split('-').map(s => parseInt(s, 10));
                if (parts.length !== 3 || parts.some(isNaN)) {
                    showCreateError(t('ui.mcp_tokens.create.error.expires_invalid', 'Custom expiration date is invalid.'));
                    return null;
                }
                // End of selected day in local time, so a token chosen for "today"
                // doesn't immediately expire mid-afternoon.
                const expDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59);
                if (expDate.getTime() <= Date.now()) {
                    showCreateError(t('ui.mcp_tokens.create.error.expires_past', 'Custom expiration date must be in the future.'));
                    return null;
                }
                return Math.floor(expDate.getTime() / 1000);
            }
            const days = parseInt(choice, 10);
            if (isNaN(days)) {
                showCreateError(t('ui.mcp_tokens.create.error.expires_invalid', 'Custom expiration date is invalid.'));
                return null;
            }
            return Math.floor(Date.now() / 1000) + days * 86400;
        }

        $('#new').on('click', function(ev) {
            ev.preventDefault();
            resetCreateForm();
            populateApplicationSelect();
            createModal.show();
            // Defer focus until the modal is fully visible.
            createModalEl.addEventListener('shown.bs.modal', function focusOnce() {
                $('#mcp-create-name').trigger('focus');
                createModalEl.removeEventListener('shown.bs.modal', focusOnce);
            });
        });

        $('#mcp-create-expires').on('change', function() {
            $('#mcp-create-expires-custom-wrap').toggleClass('d-none', this.value !== 'custom');
        });

        $('#mcp-create-submit').on('click', function() {
            $('#mcp-create-error').addClass('d-none').text('');

            const name = ($('#mcp-create-name').val() || '').trim();
            if (!name) {
                showCreateError(t('ui.mcp_tokens.create.error.name_required', 'Name is required.'));
                $('#mcp-create-name').trigger('focus');
                return;
            }

            const expires_at = computeExpiresAt();
            if (expires_at === null) return;

            const payload = {
                name: name,
                scopes: 'read',
                expires_at: expires_at
            };
            const appVal = $('#mcp-create-application').val();
            if (appVal) payload.application = parseInt(appVal, 10);
            const ipAllow = ($('#mcp-create-ip-allowlist').val() || '').trim();
            if (ipAllow) payload.ip_allowlist = ipAllow;

            const $submit = $('#mcp-create-submit');
            $submit.prop('disabled', true).text(t('ui.mcp_tokens.create.button.creating', 'Creating…'));

            _ks.post('KyteMCPToken', payload, null, [], function(response) {
                const row = response && Array.isArray(response.data) ? response.data[0] : (response && response.data);
                const rawToken = row && row.raw_token;
                if (!rawToken) {
                    showCreateError(t('ui.mcp_tokens.create.error.failed', 'Failed to create token.'));
                    $submit.prop('disabled', false).text(t('ui.mcp_tokens.create.button.create', 'Create token'));
                    return;
                }
                createModal.hide();
                $('#mcp-reveal-token').val(rawToken);
                revealModal.show();
            }, function(err) {
                const msg = (err && err.responseJSON && err.responseJSON.message)
                    || (err && err.message)
                    || (typeof err === 'string' ? err : t('ui.mcp_tokens.create.error.failed', 'Failed to create token.'));
                showCreateError(msg);
                $submit.prop('disabled', false).text(t('ui.mcp_tokens.create.button.create', 'Create token'));
            });
        });

        // Copy-to-clipboard with a graceful fallback for older browsers / non-secure contexts.
        $('#mcp-reveal-copy').on('click', function() {
            const $btn = $(this);
            const tokenInput = document.getElementById('mcp-reveal-token');
            const value = tokenInput.value;

            const flashCopied = () => {
                const original = $btn.html();
                $btn.html(`<i class="fas fa-check me-1"></i><span>${escapeHtml(t('ui.mcp_tokens.reveal.copied', 'Copied!'))}</span>`);
                setTimeout(() => $btn.html(original), 1500);
            };

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(value).then(flashCopied).catch(() => {
                    tokenInput.select();
                    document.execCommand('copy');
                    flashCopied();
                });
            } else {
                tokenInput.select();
                document.execCommand('copy');
                flashCopied();
            }
        });

        $('#mcp-reveal-done').on('click', function() {
            revealModal.hide();
            // Clear the displayed raw token from DOM so it can't be re-grabbed via inspector.
            $('#mcp-reveal-token').val('');
            // Refresh the table so the new token row appears. KyteTable.draw() refetches.
            dataTable.draw();
        });

        // ────────────────────────────────────────────────────────────
        // Revoke-token confirmation modal
        // ────────────────────────────────────────────────────────────

        const revokeModalEl = document.getElementById('mcp-revoke-modal');
        const revokeModal = new bootstrap.Modal(revokeModalEl);
        let revokePending = null; // { id, name, prefix }

        // Delegate so the handler survives DataTables redraws.
        $('#mcp-tokens-table').on('click', '.mcp-revoke-btn', function() {
            const $btn = $(this);
            revokePending = {
                id: $btn.data('id'),
                name: $btn.data('name') || '',
                prefix: $btn.data('prefix') || ''
            };
            $('#mcp-revoke-name').text(revokePending.name);
            $('#mcp-revoke-prefix').text(revokePending.prefix ? revokePending.prefix + '…' : '');
            $('#mcp-revoke-error').addClass('d-none').text('');
            const $confirm = $('#mcp-revoke-confirm');
            $confirm.prop('disabled', false).text(t('ui.mcp_tokens.revoke.button.confirm', 'Revoke token'));
            revokeModal.show();
        });

        $('#mcp-revoke-confirm').on('click', function() {
            if (!revokePending || !revokePending.id) return;
            const $confirm = $(this);
            $confirm.prop('disabled', true).text(t('ui.mcp_tokens.revoke.button.confirming', 'Revoking…'));
            $('#mcp-revoke-error').addClass('d-none').text('');

            _ks.delete('KyteMCPToken', 'id', revokePending.id, [], function() {
                revokePending = null;
                revokeModal.hide();
                dataTable.draw();
                showMcpToast('success', t('ui.mcp_tokens.revoke.success', 'Token revoked.'));
            }, function(err) {
                const msg = (err && err.responseJSON && err.responseJSON.message)
                    || (err && err.message)
                    || (typeof err === 'string' ? err : t('ui.mcp_tokens.revoke.error.failed', 'Failed to revoke token.'));
                $('#mcp-revoke-error').removeClass('d-none').text(msg);
                $confirm.prop('disabled', false).text(t('ui.mcp_tokens.revoke.button.confirm', 'Revoke token'));
            });
        });

        revokeModalEl.addEventListener('hidden.bs.modal', function() {
            revokePending = null;
        });

        // Default focus to Cancel on a destructive-action confirmation, so a user
        // pressing Enter from a stale focus doesn't accidentally confirm.
        revokeModalEl.addEventListener('shown.bs.modal', function() {
            const cancel = revokeModalEl.querySelector('.modal-footer .btn-secondary');
            if (cancel) cancel.focus();
        });

        // ────────────────────────────────────────────────────────────
        // Connect AI Assistant wizard
        // ────────────────────────────────────────────────────────────

        const connectModalEl = document.getElementById('mcp-connect-modal');
        const connectModal = new bootstrap.Modal(connectModalEl);

        function setWizardStep(step) {
            connectModalEl.querySelectorAll('.wizard-step').forEach(el => {
                el.classList.toggle('d-none', String(el.dataset.step) !== String(step));
            });
            connectModalEl.querySelectorAll('.wizard-footer').forEach(el => {
                el.classList.toggle('d-none', String(el.dataset.step) !== String(step));
            });
        }

        function todayISODate() {
            const d = new Date();
            const pad = n => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        }

        function buildMcpJsonSnippet(kyteUrl) {
            const config = {
                mcpServers: {
                    kyte: {
                        type: 'http',
                        url: kyteUrl.replace(/\/+$/, '') + '/mcp',
                        headers: {
                            Authorization: 'Bearer ${KYTE_APP_KEY}'
                        }
                    }
                }
            };
            return JSON.stringify(config, null, 2);
        }

        function buildNpxSnippet(kyteUrl) {
            return 'npx @kyte/claude-assistant init \\\n  --url ' + kyteUrl.replace(/\/+$/, '');
        }

        // Inject a tiny "Copy" button into a snippet block. Idempotent.
        function ensureSnippetCopy($block, getText) {
            if ($block.find('.snippet-copy').length) return;
            const label = t('ui.mcp_tokens.reveal.copy', 'Copy');
            const $btn = $(`<button type="button" class="snippet-copy" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"><i class="fas fa-copy" aria-hidden="true"></i></button>`);
            $btn.on('click', function(ev) {
                ev.stopPropagation();
                copyToClipboard(getText(), $btn);
            });
            $block.append($btn);
        }

        function copyToClipboard(value, $btn) {
            const flash = () => {
                if (!$btn) return;
                const original = $btn.html();
                $btn.html(`<i class="fas fa-check"></i> ${escapeHtml(t('ui.mcp_tokens.reveal.copied', 'Copied!'))}`);
                setTimeout(() => $btn.html(original), 1500);
            };
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(value).then(flash).catch(() => {
                    fallbackCopy(value);
                    flash();
                });
            } else {
                fallbackCopy(value);
                flash();
            }
        }

        function fallbackCopy(value) {
            const ta = document.createElement('textarea');
            ta.value = value;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e) { /* swallow */ }
            document.body.removeChild(ta);
        }

        // Bound to the page-header button AND the empty-state CTA. Both routes
        // open the same wizard; the empty-state CTA exists so first-time users
        // (zero tokens, header buttons easy to miss) have a clear path to mint
        // their first token.
        $('#connect-assistant, #empty-connect-assistant').on('click', function(ev) {
            ev.preventDefault();
            $('#mcp-connect-error').addClass('d-none').text('');
            $('#mcp-connect-token').val('');
            const $mint = $('#mcp-connect-mint');
            $mint.prop('disabled', false).text(t('ui.mcp_tokens.connect.button.mint', 'Mint Token & Continue'));
            setWizardStep(1);
            // Reset to first tab.
            const firstTab = document.getElementById('tab-claude-code-tab');
            if (firstTab && bootstrap.Tab) bootstrap.Tab.getOrCreateInstance(firstTab).show();
            connectModal.show();
        });

        // Focus the primary CTA on each step so keyboard users land somewhere useful.
        connectModalEl.addEventListener('shown.bs.modal', function() {
            const mintBtn = document.getElementById('mcp-connect-mint');
            if (mintBtn && !mintBtn.closest('.wizard-footer').classList.contains('d-none')) {
                mintBtn.focus();
            }
        });

        $('#mcp-connect-mint').on('click', function() {
            $('#mcp-connect-error').addClass('d-none').text('');
            const $mint = $(this);
            $mint.prop('disabled', true).text(t('ui.mcp_tokens.create.button.creating', 'Creating…'));

            const payload = {
                name: 'Claude Code – ' + todayISODate(),
                scopes: 'read',
                expires_at: Math.floor(Date.now() / 1000) + 30 * 86400
            };

            _ks.post('KyteMCPToken', payload, null, [], function(response) {
                const row = response && Array.isArray(response.data) ? response.data[0] : (response && response.data);
                const rawToken = row && row.raw_token;
                if (!rawToken) {
                    $('#mcp-connect-error').removeClass('d-none').text(t('ui.mcp_tokens.create.error.failed', 'Failed to create token.'));
                    $mint.prop('disabled', false).text(t('ui.mcp_tokens.connect.button.mint', 'Mint Token & Continue'));
                    return;
                }

                const kyteUrl = (_ks && _ks.url) ? _ks.url : 'https://your-kyte-instance.example.com';
                const jsonSnippet = buildMcpJsonSnippet(kyteUrl);
                const npxSnippet = buildNpxSnippet(kyteUrl);

                $('#mcp-connect-token').val(rawToken);

                const $jsonBlock = $('#mcp-connect-jsonsnippet').text(jsonSnippet);
                ensureSnippetCopy($jsonBlock, () => jsonSnippet);

                const $npxBlock = $('#mcp-connect-npxsnippet').text(npxSnippet);
                ensureSnippetCopy($npxBlock, () => npxSnippet);

                setWizardStep(2);
                // Land focus on the token copy button — most likely next action.
                document.getElementById('mcp-connect-copy-token').focus();
            }, function(err) {
                const msg = (err && err.responseJSON && err.responseJSON.message)
                    || (err && err.message)
                    || (typeof err === 'string' ? err : t('ui.mcp_tokens.create.error.failed', 'Failed to create token.'));
                $('#mcp-connect-error').removeClass('d-none').text(msg);
                $mint.prop('disabled', false).text(t('ui.mcp_tokens.connect.button.mint', 'Mint Token & Continue'));
            });
        });

        $('#mcp-connect-copy-token').on('click', function() {
            copyToClipboard(document.getElementById('mcp-connect-token').value, $(this));
        });

        $('#mcp-connect-done').on('click', function() {
            connectModal.hide();
        });

        // Clear sensitive content + refresh table when the wizard fully closes.
        connectModalEl.addEventListener('hidden.bs.modal', function() {
            $('#mcp-connect-token').val('');
            $('#mcp-connect-jsonsnippet').empty();
            $('#mcp-connect-npxsnippet').empty();
            // Only refresh if the user actually got to step 2 (token was minted).
            // Cheap heuristic: check whether step 2 was visible just before close.
            // The hidden.bs.modal handler runs after step state was last set; we
            // want to refresh in either path since cancel-from-step-1 is a no-op
            // for the table but a refresh is cheap and harmless.
            dataTable.draw();
        });
    });
});
