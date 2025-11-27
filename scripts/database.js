// GitHub Database Manager
class GitHubDatabase {
    constructor() {
        this.baseURL = 'https://api.github.com/repos';
        this.owner = 'YOUR_GITHUB_USERNAME'; // Заменить на ваш username
        this.repo = 'SkanerXE'; // Заменить на название репозитория
        this.token = 'YOUR_GITHUB_TOKEN'; // Заменить на ваш GitHub token
        this.branch = 'main';
        
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 минут
    }

    // Генерация уникального ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Хеширование пароля
    hashPassword(password) {
        return CryptoJS.SHA256(password + 'skanerxe_salt_2024').toString();
    }

    // API запрос к GitHub
    async githubRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}/${this.owner}/${this.repo}/contents/Database/${endpoint}`;
        
        const headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        try {
            const config = {
                method: method,
                headers: headers
            };

            if (data && (method === 'PUT' || method === 'POST')) {
                config.body = JSON.stringify(data);
            }

            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('GitHub API request failed:', error);
            // Fallback to localStorage
            return this.localStorageFallback(endpoint, method, data);
        }
    }

    // Fallback на localStorage если GitHub недоступен
    localStorageFallback(endpoint, method, data) {
        const key = `skanerxe_${endpoint.replace('.json', '')}`;
        
        if (method === 'GET') {
            const cached = localStorage.getItem(key);
            return cached ? { content: btoa(unescape(encodeURIComponent(cached))) } : { content: '' };
        } else if (method === 'PUT') {
            localStorage.setItem(key, data.content ? decodeURIComponent(escape(atob(data.content))) : '{}');
            return { commit: { sha: 'local' } };
        }
    }

    // Чтение JSON файла из GitHub
    async readFile(filename) {
        const cacheKey = `file_${filename}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await this.githubRequest(filename);
            
            if (response.content) {
                const content = JSON.parse(decodeURIComponent(escape(atob(response.content))));
                this.cache.set(cacheKey, {
                    data: content,
                    timestamp: Date.now(),
                    sha: response.sha
                });
                return content;
            } else {
                // Файл не существует, создаем пустой
                const emptyData = this.getEmptyData(filename);
                await this.writeFile(filename, emptyData);
                return emptyData;
            }
        } catch (error) {
            console.error(`Error reading ${filename}:`, error);
            const localData = localStorage.getItem(`skanerxe_${filename.replace('.json', '')}`);
            return localData ? JSON.parse(localData) : this.getEmptyData(filename);
        }
    }

    // Запись JSON файла в GitHub
    async writeFile(filename, data) {
        try {
            const cacheKey = `file_${filename}`;
            const cached = this.cache.get(cacheKey);
            const content = JSON.stringify(data, null, 2);
            
            const payload = {
                message: `Update ${filename}`,
                content: btoa(unescape(encodeURIComponent(content))),
                branch: this.branch
            };

            if (cached && cached.sha) {
                payload.sha = cached.sha;
            }

            const response = await this.githubRequest(filename, 'PUT', payload);
            
            // Обновляем кэш
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now(),
                sha: response.content.sha
            });

            // Сохраняем в localStorage как backup
            localStorage.setItem(`skanerxe_${filename.replace('.json', '')}`, content);
            
            return true;
        } catch (error) {
            console.error(`Error writing ${filename}:`, error);
            // Fallback to localStorage
            localStorage.setItem(`skanerxe_${filename.replace('.json', '')}`, JSON.stringify(data, null, 2));
            return false;
        }
    }

    // Получение пустых данных для файлов
    getEmptyData(filename) {
        const emptyData = {
            'users.json': {
                'admin@skanerxe.ru': {
                    password: this.hashPassword('admin123'),
                    balance: 0,
                    free_requests: 999,
                    is_admin: true,
                    created_at: new Date().toISOString(),
                    last_login: new Date().toISOString(),
                    settings: {
                        theme: 'light',
                        notifications: true
                    }
                }
            },
            'analyses.json': {},
            'payments.json': {},
            'settings.json': {
                min_payment: 50,
                analysis_cost: 1,
                recalc_cost: 1,
                bonuses: {
                    100: 5,
                    500: 30,
                    1000: 70
                }
            }
        };
        
        return emptyData[filename] || {};
    }

    // Работа с пользователями
    async getUser(email) {
        const users = await this.readFile('users.json');
        return users[email] || null;
    }

    async createUser(email, password) {
        const users = await this.readFile('users.json');
        
        if (users[email]) {
            throw new Error('Пользователь с таким email уже существует');
        }

        users[email] = {
            password: this.hashPassword(password),
            balance: 0,
            free_requests: 10,
            is_admin: false,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            settings: {
                theme: 'light',
                notifications: true
            },
            stats: {
                total_analyses: 0,
                total_calories: 0,
                joined_days: 1
            }
        };

        await this.writeFile('users.json', users);
        return users[email];
    }

    async updateUser(email, updates) {
        const users = await this.readFile('users.json');
        
        if (!users[email]) {
            throw new Error('Пользователь не найден');
        }

        users[email] = { ...users[email], ...updates };
        await this.writeFile('users.json', users);
        return users[email];
    }

    // Работа с анализами
    async addAnalysis(userEmail, analysisData) {
        const analyses = await this.readFile('analyses.json');
        const analysisId = this.generateId();
        
        analyses[analysisId] = {
            id: analysisId,
            user_email: userEmail,
            ...analysisData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        await this.writeFile('analyses.json', analyses);
        return analysisId;
    }

    async getUserAnalyses(userEmail, limit = 50) {
        const analyses = await this.readFile('analyses.json');
        const userAnalyses = Object.values(analyses)
            .filter(analysis => analysis.user_email === userEmail)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);

        return userAnalyses;
    }

    async updateAnalysis(analysisId, updates) {
        const analyses = await this.readFile('analyses.json');
        
        if (!analyses[analysisId]) {
            throw new Error('Анализ не найден');
        }

        analyses[analysisId] = {
            ...analyses[analysisId],
            ...updates,
            updated_at: new Date().toISOString()
        };

        await this.writeFile('analyses.json', analyses);
        return analyses[analysisId];
    }

    // Работа с платежами
    async createPayment(userEmail, amount, description = 'Пополнение баланса') {
        const payments = await this.readFile('payments.json');
        const paymentId = this.generateId();
        
        payments[paymentId] = {
            id: paymentId,
            user_email: userEmail,
            amount: amount,
            description: description,
            status: 'pending',
            created_at: new Date().toISOString(),
            robokassa_id: `rk_${paymentId}`
        };

        await this.writeFile('payments.json', payments);
        return payments[paymentId];
    }

    async updatePayment(paymentId, updates) {
        const payments = await this.readFile('payments.json');
        
        if (!payments[paymentId]) {
            throw new Error('Платеж не найден');
        }

        payments[paymentId] = {
            ...payments[paymentId],
            ...updates,
            updated_at: new Date().toISOString()
        };

        await this.writeFile('payments.json', payments);
        return payments[paymentId];
    }

    async getPendingPayments(userEmail) {
        const payments = await this.readFile('payments.json');
        return Object.values(payments)
            .filter(payment => payment.user_email === userEmail && payment.status === 'pending')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Настройки системы
    async getSettings() {
        return await this.readFile('settings.json');
    }

    async updateSettings(updates) {
        const settings = await this.readFile('settings.json');
        const newSettings = { ...settings, ...updates };
        await this.writeFile('settings.json', newSettings);
        return newSettings;
    }

    // Статистика
    async getStats() {
        const [users, analyses, payments] = await Promise.all([
            this.readFile('users.json'),
            this.readFile('analyses.json'),
            this.readFile('payments.json')
        ]);

        const totalUsers = Object.keys(users).length;
        const totalAnalyses = Object.keys(analyses).length;
        const totalBalance = Object.values(users).reduce((sum, user) => sum + user.balance, 0);
        const pendingPayments = Object.values(payments).filter(p => p.status === 'pending').length;

        return {
            total_users: totalUsers,
            total_analyses: totalAnalyses,
            total_balance: totalBalance,
            pending_payments: pendingPayments
        };
    }

    // Очистка старых данных (для админа)
    async cleanupOldData(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const analyses = await this.readFile('analyses.json');
        const payments = await this.readFile('payments.json');

        // Удаляем старые анализы
        const cleanedAnalyses = Object.fromEntries(
            Object.entries(analyses).filter(([_, analysis]) => 
                new Date(analysis.created_at) > cutoffDate
            )
        );

        // Удаляем завершенные платежи старше 7 дней
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const cleanedPayments = Object.fromEntries(
            Object.entries(payments).filter(([_, payment]) => 
                payment.status === 'pending' || new Date(payment.created_at) > weekAgo
            )
        );

        await Promise.all([
            this.writeFile('analyses.json', cleanedAnalyses),
            this.writeFile('payments.json', cleanedPayments)
        ]);

        return {
            analyses_removed: Object.keys(analyses).length - Object.keys(cleanedAnalyses).length,
            payments_removed: Object.keys(payments).length - Object.keys(cleanedPayments).length
        };
    }
}

// Создаем глобальный экземпляр базы данных
window.SkanerXEDatabase = new GitHubDatabase();
