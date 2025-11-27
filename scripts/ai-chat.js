// AI Chat and Analysis System
class AIChatSystem {
    constructor() {
        this.conversations = new Map();
        this.analysisHistory = new Map();
        this.isAnalyzing = false;
    }

    // Инициализация чата для пользователя
    initializeUserChat(userEmail) {
        if (!this.conversations.has(userEmail)) {
            this.conversations.set(userEmail, [
                {
                    role: 'assistant',
                    content: `Привет! Я ваш AI-нутрициолог. Я могу помочь вам с:

• 📊 Анализом питательной ценности продуктов
• 🍽️ Рекомендациями по здоровому питанию
• 📈 Советами по достижению ваших целей
• 🥗 Рецептами полезных блюд
• 🔍 Объяснением пищевых компонентов

Что вас интересует сегодня?`,
                    timestamp: new Date().toISOString()
                }
            ]);
        }
        return this.conversations.get(userEmail);
    }

    // Отправка сообщения в AI чат
    async sendMessage(userEmail, message, messageType = 'text') {
        if (this.isAnalyzing) {
            throw new Error('Пожалуйста, дождитесь завершения текущего анализа');
        }

        this.isAnalyzing = true;
        
        try {
            const conversation = this.conversations.get(userEmail) || this.initializeUserChat(userEmail);
            
            // Добавляем сообщение пользователя
            conversation.push({
                role: 'user',
                content: message,
                type: messageType,
                timestamp: new Date().toISOString()
            });

            // Получаем ответ от AI
            const aiResponse = await this.generateAIResponse(conversation, userEmail);
            
            // Добавляем ответ AI
            conversation.push({
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date().toISOString()
            });

            // Сохраняем обновленную беседу
            this.conversations.set(userEmail, conversation);

            return aiResponse;

        } catch (error) {
            console.error('AI chat error:', error);
            throw new Error('Ошибка при общении с AI. Пожалуйста, попробуйте позже.');
        } finally {
            this.isAnalyzing = false;
        }
    }

    // Генерация ответа AI (эмуляция GPT-4)
    async generateAIResponse(conversation, userEmail) {
        // В реальном приложении здесь будет вызов OpenAI API
        // Для демонстрации используем эмуляцию
        
        const lastMessage = conversation[conversation.length - 1].content.toLowerCase();
        const userContext = await this.getUserContext(userEmail);

        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Ответы на основе ключевых слов
        if (lastMessage.includes('калори') || lastMessage.includes('калорий')) {
            return this.getCalorieResponse(lastMessage, userContext);
        } else if (lastMessage.includes('рецепт') || lastMessage.includes('приготовить')) {
            return this.getRecipeResponse(lastMessage);
        } else if (lastMessage.includes('белк') || lastMessage.includes('протеин')) {
            return this.getProteinResponse(lastMessage);
        } else if (lastMessage.includes('углевод') || lastMessage.includes('сахар')) {
            return this.getCarbsResponse(lastMessage);
        } else if (lastMessage.includes('жир') || lastMessage.includes('липид')) {
            return this.getFatResponse(lastMessage);
        } else if (lastMessage.includes('диет') || lastMessage.includes('похуд')) {
            return this.getDietResponse(lastMessage, userContext);
        } else if (lastMessage.includes('здороров') || lastMessage.includes('польз')) {
            return this.getHealthResponse(lastMessage);
        } else {
            return this.getGeneralNutritionResponse(lastMessage);
        }
    }

    // Контекст пользователя для персонализированных ответов
    async getUserContext(userEmail) {
        try {
            const user = await SkanerXEDatabase.getUser(userEmail);
            const analyses = await SkanerXEDatabase.getUserAnalyses(userEmail, 10);
            
            return {
                totalAnalyses: analyses.length,
                recentFoods: analyses.slice(0, 5).map(a => a.dish_name),
                averageCalories: analyses.length > 0 ? 
                    analyses.reduce((sum, a) => sum + a.calories, 0) / analyses.length : 0,
                preferences: this.detectPreferences(analyses)
            };
        } catch (error) {
            return {
                totalAnalyses: 0,
                recentFoods: [],
                averageCalories: 0,
                preferences: []
            };
        }
    }

    // Определение пищевых предпочтений
    detectPreferences(analyses) {
        const preferences = {
            highProtein: 0,
            lowCarb: 0,
            vegetarian: 0,
            highCalorie: 0
        };

        analyses.forEach(analysis => {
            if (analysis.protein > 20) preferences.highProtein++;
            if (analysis.carbs < 30) preferences.lowCarb++;
            if (analysis.dish_name.toLowerCase().includes('салат') || 
                analysis.dish_name.toLowerCase().includes('овощ')) preferences.vegetarian++;
            if (analysis.calories > 400) preferences.highCalorie++;
        });

        return Object.entries(preferences)
            .filter(([_, count]) => count > analyses.length * 0.3)
            .map(([pref]) => pref);
    }

    // Ответы на тему калорий
    getCalorieResponse(message, context) {
        const responses = [
            `📊 **Информация о калориях:**\n\n` +
            `Средняя калорийность ваших последних блюд: ${Math.round(context.averageCalories)} ккал\n\n` +
            `**Совет:** Для поддержания веса взрослому человеку обычно требуется 2000-2500 ккал в день. ` +
            `Для похудения - на 300-500 ккал меньше.`,

            `🔥 **Управление калориями:**\n\n` +
            `• Фрукты и овощи: 30-70 ккал/100г\n` +
            `• Постное мясо: 150-200 ккал/100г\n` +
            `• Крупы: 100-130 ккал/100г\n` +
            `• Орехи: 500-700 ккал/100г\n\n` +
            `Рекомендую обращать внимание на питательную ценность, а не только на калории!`,

            `💡 **Калорийность популярных продуктов:**\n\n` +
            `• Яблоко: 52 ккал\n` +
            `• Банан: 89 ккал\n` +
            `• Куриная грудка: 165 ккал\n` +
            `• Лосось: 208 ккал\n` +
            `• Рис: 130 ккал\n` +
            `• Авокадо: 160 ккал\n\n` +
            `Нужна информация о конкретном продукте?`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Ответы с рецептами
    getRecipeResponse(message) {
        const recipes = {
            breakfast: `🍳 **Полезный завтрак:**\n\n` +
                      `**Омлет с овощами (300 ккал)**\n` +
                      `• 2 яйца\n• Помидор\n• Перец\n• Шпинат\n• Лук\n• 1 ч.л. оливкового масла\n\n` +
                      `Приготовление: обжарить овощи, добавить взбитые яйца, готовить на среднем огне.`,

            lunch: `🥗 **Легкий обед:**\n\n` +
                   `**Салат с курицей (350 ккал)**\n` +
                   `• 150г куриной грудки\n• Салат айсберг\n• Огурец\n• Помидор\n• 1 ст.л. оливкового масла\n• Лимонный сок\n\n` +
                   `Курицу приготовить на гриле, смешать с овощами, заправить маслом и соком.`,

            dinner: `🍲 **Ужин:**\n\n` +
                    `**Запеченная рыба с овощами (400 ккал)**\n` +
                    `• 200г белой рыбы\n• Брокколи\n• Морковь\n• Цукини\n• Чеснок\n• Специи\n\n` +
                    `Запекать в духовке при 180°C 25-30 минут.`
        };

        if (message.includes('завтрак')) return recipes.breakfast;
        if (message.includes('обед')) return recipes.lunch;
        if (message.includes('ужин')) return recipes.dinner;

        return Object.values(recipes)[Math.floor(Math.random() * Object.values(recipes).length)];
    }

    // Ответы про белки
    getProteinResponse(message) {
        return `💪 **Белки в питании:**\n\n` +
               `Белки необходимы для:\n` +
               `• Роста и восстановления мышц\n` +
               `• Поддержания иммунной системы\n` +
               `• Создания ферментов и гормонов\n\n` +
               `**Источники белка:**\n` +
               `• Животные: курица, рыба, яйца, молочные продукты\n` +
               `• Растительные: бобовые, тофу, орехи, киноа\n\n` +
               `Рекомендуемая норма: 1.2-1.6г на кг веса для активных людей.`;
    }

    // Ответы про углеводы
    getCarbsResponse(message) {
        return `🍚 **Углеводы:**\n\n` +
               `**Простые углеводы** (быстрая энергия):\n` +
               `• Сахар, мед, фрукты, белый хлеб\n\n` +
               `**Сложные углеводы** (долгая энергия):\n` +
               `• Цельнозерновые, овощи, бобовые\n\n` +
               `**Совет:** Отдавайте предпочтение сложным углеводам - они обеспечивают стабильную энергию и содержат клетчатку.`;
    }

    // Ответы про жиры
    getFatResponse(message) {
        return `🥑 **Жиры в питании:**\n\n` +
               `**Полезные жиры:**\n` +
               `• Оливковое масло\n• Авокадо\n• Орехи\n• Жирная рыба\n\n` +
               `**Насыщенные жиры** (ограничить):\n` +
               `• Красное мясо\n• Сливочное масло\n• Сыр\n\n` +
               `Жиры необходимы для усвоения витаминов и здоровья мозга!`;
    }

    // Ответы про диеты
    getDietResponse(message, context) {
        return `🎯 **Рекомендации по питанию:**\n\n` +
               `Основы здорового питания:\n` +
               `• Ешьте разнообразные продукты\n• Контролируйте размер порций\n• Пейте достаточно воды\n• Ограничьте обработанные продукты\n\n` +
               `На основе ваших ${context.totalAnalyses} анализов, рекомендую обратить внимание на ${context.preferences.includes('highCalorie') ? 'более легкие варианты' : 'сбалансированное питание'}.`;
    }

    // Общие ответы о здоровье
    getHealthResponse(message) {
        return `🌿 **Здоровое питание:**\n\n` +
               `Ключевые принципы:\n` +
               `1. Баланс - все группы продуктов\n` +
               `2. Разнообразие - разные цвета на тарелке\n` +
               `3. Умеренность - контроль порций\n` +
               `4. Регулярность - 3-5 приемов пищи в день\n\n` +
               `Помните: здоровое питание - это образ жизни, а не временная диета!`;
    }

    // Общие ответы о питании
    getGeneralNutritionResponse(message) {
        const responses = [
            `📚 **Интересный факт о питании:**\n\n` +
            `Знаете ли вы, что цвет продуктов часто указывает на их питательные свойства? ` +
            `Красные продукты богаты ликопином, зеленые - хлорофиллом, оранжевые - бета-каротином!`,

            `💡 **Совет по питанию:**\n\n` +
            `Старайтесь включать в каждый прием пищи белки, полезные жиры и сложные углеводы. ` +
            `Это обеспечит стабильную энергию и насыщение на долгое время.`,

            `🌱 **О пользе клетчатки:**\n\n` +
            `Клетчатка улучшает пищеварение, контролирует уровень сахара в крови и помогает поддерживать здоровый вес. ` +
            `Источники: овощи, фрукты, цельнозерновые, бобовые.`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    // AI анализ изображения еды
    async analyzeFoodImage(imageData, userEmail) {
        if (this.isAnalyzing) {
            throw new Error('Анализ уже выполняется');
        }

        this.isAnalyzing = true;

        try {
            // Эмуляция AI анализа изображения
            // В реальном приложении здесь будет вызов Computer Vision API
            
            await new Promise(resolve => setTimeout(resolve, 3000));

            const analysisResult = this.generateFoodAnalysis(imageData);
            const analysisId = await SkanerXEDatabase.addAnalysis(userEmail, analysisResult);

            // Обновляем статистику пользователя
            const user = await SkanerXEDatabase.getUser(userEmail);
            await SkanerXEDatabase.updateUser(userEmail, {
                stats: {
                    ...user.stats,
                    total_analyses: (user.stats.total_analyses || 0) + 1,
                    total_calories: (user.stats.total_calories || 0) + analysisResult.calories
                }
            });

            return { analysisId, ...analysisResult };

        } catch (error) {
            console.error('Food analysis error:', error);
            throw new Error('Ошибка при анализе изображения');
        } finally {
            this.isAnalyzing = false;
        }
    }

    // Генерация анализа еды (эмуляция AI)
    generateFoodAnalysis(imageData) {
        const dishes = [
            {
                name: 'Салат овощной',
                type: 'vegetarian',
                health: 'healthy',
                baseWeight: 300,
                baseCalories: 180,
                ingredients: [
                    { name: 'помидоры', weight: 120, calories: 22 },
                    { name: 'огурцы', weight: 100, calories: 15 },
                    { name: 'лук', weight: 30, calories: 12 },
                    { name: 'масло оливковое', weight: 15, calories: 133 }
                ]
            },
            {
                name: 'Куриный суп с лапшой',
                type: 'meat',
                health: 'balanced', 
                baseWeight: 400,
                baseCalories: 250,
                ingredients: [
                    { name: 'куриный бульон', weight: 250, calories: 25 },
                    { name: 'курица', weight: 100, calories: 165 },
                    { name: 'лапша', weight: 50, calories: 60 }
                ]
            },
            {
                name: 'Паста карбонара',
                type: 'meat',
                health: 'high_calorie',
                baseWeight: 350,
                baseCalories: 450,
                ingredients: [
                    { name: 'паста', weight: 200, calories: 260 },
                    { name: 'бекон', weight: 80, calories: 160 },
                    { name: 'сыр пармезан', weight: 30, calories: 30 }
                ]
            },
            {
                name: 'Омлет с овощами',
                type: 'vegetarian', 
                health: 'healthy',
                baseWeight: 250,
                baseCalories: 280,
                ingredients: [
                    { name: 'яйца', weight: 120, calories: 186 },
                    { name: 'помидоры', weight: 80, calories: 15 },
                    { name: 'перец', weight: 50, calories: 13 }
                ]
            }
        ];

        const dish = dishes[Math.floor(Math.random() * dishes.length)];
        const weight = dish.baseWeight + Math.floor(Math.random() * 200) - 100;
        const ratio = weight / dish.baseWeight;

        const totalCalories = Math.round(dish.baseCalories * ratio);
        const protein = Math.round((dish.ingredients.reduce((sum, ing) => sum + (ing.name.includes('кури') || ing.name.includes('яйц') ? ing.weight * 0.2 : ing.weight * 0.05), 0) * ratio));
        const fat = Math.round((dish.ingredients.reduce((sum, ing) => sum + (ing.name.includes('масл') || ing.name.includes('бекон') ? ing.weight * 0.8 : ing.weight * 0.02), 0) * ratio));
        const carbs = Math.round((dish.ingredients.reduce((sum, ing) => sum + (ing.name.includes('паст') || ing.name.includes('лапш') ? ing.weight * 0.25 : ing.weight * 0.05), 0) * ratio));

        return {
            dish_name: dish.name,
            dish_type: dish.type,
            health_level: dish.health,
            weight: weight,
            calories: totalCalories,
            protein: protein,
            fat: fat,
            carbs: carbs,
            bread_units: Math.round((carbs / 12) * 10) / 10,
            ingredients: dish.ingredients.map(ing => ({
                name: ing.name,
                weight_grams: Math.round(ing.weight * ratio),
                calories: Math.round(ing.calories * ratio)
            })),
            analysis_confidence: 85 + Math.floor(Math.random() * 15),
            recommendations: this.generateRecommendations(dish, totalCalories, weight)
        };
    }

    // Генерация рекомендаций
    generateRecommendations(dish, calories, weight) {
        const recommendations = {
            healthy: [
                'Отличный выбор! Это блюдо хорошо сбалансировано и содержит много питательных веществ.',
                'Рекомендуется сочетать с цельнозерновым хлебом для дополнительной клетчатки.',
                'Идеально для поддержания здорового образа жизни.'
            ],
            balanced: [
                'Сбалансированное блюдо, подходит для ежедневного рациона.',
                'Можно добавить свежие овощи для увеличения витаминной ценности.',
                'Хорошее соотношение белков, жиров и углеводов.'
            ],
            high_calorie: [
                'Энергетически насыщенное блюдо, рекомендуется для активного дня.',
                'Сочетайте с легким салатом для лучшего баланса питания.',
                'Обратите внимание на размер порции при контроле веса.'
            ]
        };

        const baseRecs = recommendations[dish.health] || recommendations.balanced;
        const randomRec = baseRecs[Math.floor(Math.random() * baseRecs.length)];

        let calorieNote = '';
        if (calories > 400) {
            calorieNote = ' Это достаточно калорийное блюдо, учитывайте его в своем дневном рационе.';
        } else if (calories < 200) {
            calorieNote = ' Легкое блюдо, можно дополнить другими продуктами для полноценного приема пищи.';
        }

        return randomRec + calorieNote;
    }

    // Пересчет анализа с новым весом
    async recalculateAnalysis(analysisId, newWeight, userEmail) {
        const analysis = await SkanerXEDatabase.readFile('analyses.json').then(data => data[analysisId]);
        
        if (!analysis) {
            throw new Error('Анализ не найден');
        }

        const ratio = newWeight / analysis.weight;
        
        const recalculated = {
            ...analysis,
            weight: newWeight,
            calories: Math.round(analysis.calories * ratio),
            protein: Math.round(analysis.protein * ratio * 10) / 10,
            fat: Math.round(analysis.fat * ratio * 10) / 10,
            carbs: Math.round(analysis.carbs * ratio * 10) / 10,
            bread_units: Math.round(analysis.bread_units * ratio * 10) / 10,
            ingredients: analysis.ingredients.map(ing => ({
                ...ing,
                weight_grams: Math.round(ing.weight_grams * ratio),
                calories: Math.round(ing.calories * ratio)
            })),
            updated_at: new Date().toISOString(),
            recalculated: true
        };

        const newAnalysisId = await SkanerXEDatabase.addAnalysis(userEmail, recalculated);
        return { analysisId: newAnalysisId, ...recalculated };
    }

    // Получение истории чата
    getChatHistory(userEmail) {
        return this.conversations.get(userEmail) || this.initializeUserChat(userEmail);
    }

    // Очистка истории чата
    clearChatHistory(userEmail) {
        this.conversations.delete(userEmail);
        this.initializeUserChat(userEmail);
    }
}

// Создаем глобальный экземпляр AI системы
window.SkanerXEAIChat = new AIChatSystem();
