/**
 * Kyte PHP IntelliSense for Monaco Editor
 * Provides autocomplete suggestions based on actual Kyte PHP framework code
 */

export function registerKytePhpIntelliSense(monaco) {
    // Register completion provider for PHP and php-snippet
    const completionProvider = {
        triggerCharacters: ['>', '$'],
        provideCompletionItems: (model, position) => {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });

            const suggestions = [];

            // $this-> completion
            if (textUntilPosition.endsWith('$this->')) {
                suggestions.push(
                    // User object (deprecated but still available)
                    {
                        label: 'user',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Current authenticated user object (KyteUser). Deprecated - use $this->api->user instead.',
                        detail: 'ModelObject',
                        insertText: 'user',
                    },
                    // Account object (deprecated but still available)
                    {
                        label: 'account',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Account object for the current user. Deprecated - use $this->api->account instead.',
                        detail: 'ModelObject',
                        insertText: 'account',
                    },
                    // Session object (deprecated but still available)
                    {
                        label: 'session',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Session object of current session. Deprecated - use $this->api->session instead.',
                        detail: 'ModelObject',
                        insertText: 'session',
                    },
                    // API reference (recommended)
                    {
                        label: 'api',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Reference to instantiated Api object. Access user, account, session, app, field, value, etc.',
                        detail: 'Api',
                        insertText: 'api',
                    },
                    // Model definition
                    {
                        label: 'model',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Model definition array containing name and struct',
                        detail: 'array',
                        insertText: 'model',
                    },
                    // Response reference
                    {
                        label: 'response',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Reference to response array that will be returned by API',
                        detail: 'array',
                        insertText: 'response',
                    },
                    // Date format
                    {
                        label: 'dateformat',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Date time format string (e.g., Y/m/d)',
                        detail: 'string',
                        insertText: 'dateformat',
                    },
                    // Controller properties
                    {
                        label: 'allowableActions',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: "List of allowable actions. Values: 'new', 'update', 'get', 'delete'",
                        detail: 'array',
                        insertText: 'allowableActions',
                    },
                    {
                        label: 'cascadeDelete',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Flag to determine if delete should cascade. Default is true.',
                        detail: 'bool',
                        insertText: 'cascadeDelete',
                    },
                    {
                        label: 'getFKTables',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Whether to load foreign key tables in responses. Default is true.',
                        detail: 'bool',
                        insertText: 'getFKTables',
                    },
                    {
                        label: 'getExternalTables',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Whether to load external tables in responses. Default is false.',
                        detail: 'bool',
                        insertText: 'getExternalTables',
                    },
                    {
                        label: 'requireAuth',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Whether authentication is required. Default is true.',
                        detail: 'bool',
                        insertText: 'requireAuth',
                    },
                    {
                        label: 'requireAccount',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Whether account scoping is required. Default is true.',
                        detail: 'bool',
                        insertText: 'requireAccount',
                    },
                    {
                        label: 'failOnNull',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Whether to throw exception when object is not found. Default is false.',
                        detail: 'bool',
                        insertText: 'failOnNull',
                    }
                );
            }

            // $this->api-> completion
            if (textUntilPosition.endsWith('$this->api->')) {
                suggestions.push(
                    {
                        label: 'user',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Current authenticated user object (KyteUser)',
                        detail: 'ModelObject',
                        insertText: 'user',
                    },
                    {
                        label: 'account',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Account object (KyteAccount)',
                        detail: 'ModelObject',
                        insertText: 'account',
                    },
                    {
                        label: 'session',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Session object',
                        detail: 'ModelObject',
                        insertText: 'session',
                    },
                    {
                        label: 'app',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Application object',
                        detail: 'ModelObject',
                        insertText: 'app',
                    },
                    {
                        label: 'field',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'The field parameter from URL (e.g., /Model/field/value)',
                        detail: 'string|null',
                        insertText: 'field',
                    },
                    {
                        label: 'value',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'The value parameter from URL (e.g., /Model/field/value)',
                        detail: 'string|null',
                        insertText: 'value',
                    },
                    {
                        label: 'model',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'The model name from HTTP request',
                        detail: 'string|null',
                        insertText: 'model',
                    },
                    {
                        label: 'data',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'The request data array',
                        detail: 'array|null',
                        insertText: 'data',
                    },
                    {
                        label: 'page_size',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Page size for pagination',
                        detail: 'int|null',
                        insertText: 'page_size',
                    },
                    {
                        label: 'page_num',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Current page number',
                        detail: 'int',
                        insertText: 'page_num',
                    },
                    {
                        label: 'total_count',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Total record count',
                        detail: 'int|null',
                        insertText: 'total_count',
                    }
                );
            }

            // $this->user-> completion
            if (textUntilPosition.match(/\$this->(user|api->user)->$/)) {
                suggestions.push(
                    {
                        label: 'id',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'User ID (auto-increment primary key)',
                        detail: 'int',
                        insertText: 'id',
                    },
                    {
                        label: 'name',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'User full name',
                        detail: 'string',
                        insertText: 'name',
                    },
                    {
                        label: 'email',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'User email address',
                        detail: 'string',
                        insertText: 'email',
                    },
                    {
                        label: 'username',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Username (optional)',
                        detail: 'string|null',
                        insertText: 'username',
                    },
                    {
                        label: 'lastLogin',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Last login timestamp',
                        detail: 'int|null',
                        insertText: 'lastLogin',
                    },
                    {
                        label: 'language',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'User preferred language (e.g., en, es, ja, ko)',
                        detail: 'string|null',
                        insertText: 'language',
                    },
                    {
                        label: 'kyte_account',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Account ID foreign key',
                        detail: 'int',
                        insertText: 'kyte_account',
                    },
                    {
                        label: 'created_by',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'User ID who created this record',
                        detail: 'int|null',
                        insertText: 'created_by',
                    },
                    {
                        label: 'date_created',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Creation timestamp',
                        detail: 'int|null',
                        insertText: 'date_created',
                    },
                    {
                        label: 'modified_by',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'User ID who last modified this record',
                        detail: 'int|null',
                        insertText: 'modified_by',
                    },
                    {
                        label: 'date_modified',
                        kind: monaco.languages.CompletionItemKind.Property,
                        documentation: 'Last modification timestamp',
                        detail: 'int|null',
                        insertText: 'date_modified',
                    }
                );
            }

            // new ModelObject() completion
            if (textUntilPosition.match(/new\s+(\\Kyte\\Core\\)?ModelObject\($/)) {
                suggestions.push({
                    label: 'ModelObject($model)',
                    kind: monaco.languages.CompletionItemKind.Constructor,
                    documentation: 'Create new ModelObject instance for single record operations',
                    detail: '(string $model)',
                    insertText: '${1:ModelName})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                });
            }

            // ModelObject methods
            if (textUntilPosition.match(/\$\w+->$/)) {
                const varMatch = textUntilPosition.match(/\$(\w+)->$/);
                if (varMatch) {
                    const varName = varMatch[1];
                    // Suggest ModelObject methods for typical variable names
                    if (['obj', 'object', 'item', 'record', 'model'].some(name => varName.toLowerCase().includes(name))) {
                        suggestions.push(
                            {
                                label: 'create',
                                kind: monaco.languages.CompletionItemKind.Method,
                                documentation: 'Create new record in database',
                                detail: '(array $params, ModelObject $user = null): void',
                                insertText: 'create(${1:\\$data}, ${2:\\$this->user})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            },
                            {
                                label: 'retrieve',
                                kind: monaco.languages.CompletionItemKind.Method,
                                documentation: 'Retrieve single record from database',
                                detail: '(string $field, mixed $value, array $conditions = null): bool',
                                insertText: 'retrieve(${1:\'id\'}, ${2:\\$value})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            },
                            {
                                label: 'save',
                                kind: monaco.languages.CompletionItemKind.Method,
                                documentation: 'Update existing record in database',
                                detail: '(array $params, ModelObject $user = null): void',
                                insertText: 'save(${1:\\$data}, ${2:\\$this->user})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            },
                            {
                                label: 'delete',
                                kind: monaco.languages.CompletionItemKind.Method,
                                documentation: 'Soft delete record (sets deleted=1)',
                                detail: '(string $field, mixed $value, ModelObject $user = null): void',
                                insertText: 'delete(${1:null}, ${2:null}, ${3:\\$this->user})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            },
                            {
                                label: 'purge',
                                kind: monaco.languages.CompletionItemKind.Method,
                                documentation: 'Hard delete record (permanent removal)',
                                detail: '(string $field, mixed $value): void',
                                insertText: 'purge(${1:null}, ${2:null})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            },
                            {
                                label: 'getAllParams',
                                kind: monaco.languages.CompletionItemKind.Method,
                                documentation: 'Get all parameters as associative array',
                                detail: '(string $dateformat = null): array',
                                insertText: 'getAllParams()',
                            },
                            {
                                label: 'getParam',
                                kind: monaco.languages.CompletionItemKind.Method,
                                documentation: 'Get single parameter value',
                                detail: '(string $key): mixed',
                                insertText: 'getParam(${1:\'field_name\'})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            },
                            {
                                label: 'populate',
                                kind: monaco.languages.CompletionItemKind.Method,
                                documentation: 'Populate object with data array',
                                detail: '(array $data = null): void',
                                insertText: 'populate(${1:\\$data})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            }
                        );
                    }
                }
            }

            // new Model() completion
            if (textUntilPosition.match(/new\s+(\\Kyte\\Core\\)?Model\($/)) {
                suggestions.push({
                    label: 'Model($model)',
                    kind: monaco.languages.CompletionItemKind.Constructor,
                    documentation: 'Create new Model instance for collection operations',
                    detail: '(string $model, int $page_size = null, int $page_num = null)',
                    insertText: '${1:ModelName})',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                });
            }

            // Environment variables
            if (textUntilPosition.endsWith('KYTE_APP_ENV[')) {
                suggestions.push({
                    label: "'KEY_NAME'",
                    kind: monaco.languages.CompletionItemKind.Constant,
                    documentation: 'Access application environment variable',
                    detail: 'Access app-specific env variable (e.g., STRIPE_KEY, API_SECRET)',
                    insertText: "'${1:KEY_NAME}']",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                });
            }

            return { suggestions };
        }
    };

    // Register for both 'php' and 'php-snippet' languages
    monaco.languages.registerCompletionItemProvider('php', completionProvider);
    monaco.languages.registerCompletionItemProvider('php-snippet', completionProvider);
}
