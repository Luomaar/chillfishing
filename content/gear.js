// ============================================================================
//  gear.js — СНАРЯЖЕНИЕ И АССОРТИМЕНТ ЛАВОК
//  Только данные. Логику и отрисовку не добавлять: они в js/.
// ============================================================================
        const gearOptions = {
            rods: [
                { id: 0, name: "Самодельная удочка", dice: "1d6", cost: 0, desc: "Кубик 1d6" },
                { id: 1, name: "Обычная удочка", dice: "2d4", cost: 25, desc: "Кубики 2d4" },
                { id: 2, name: "Крепкая удочка", dice: "2d6", cost: 100, desc: "Кубики 2d6" },
                { id: 3, name: "Продвинутая удочка", dice: "4d4", cost: 250, desc: "Кубики 4d4" },
                { id: 4, name: "Профессиональная удочка", dice: "2d12", cost: 500, desc: "Кубики 2d12" }
            ],
            lines: [
                { id: 0, name: "Самодельная леска", bonus: 1, cost: 10, desc: "+1 к броску" },
                { id: 1, name: "Обычная леска", bonus: 2, cost: 50, desc: "+2 к броску" },
                { id: 2, name: "Крепкая леска", bonus: 3, cost: 150, desc: "+3 к броску" },
                { id: 3, name: "Продвинутая леска", bonus: 4, cost: 250, desc: "+4 к броску" },
                { id: 4, name: "Профессиональная леска", bonus: 5, cost: 500, desc: "+5 к броску" }
            ],
            baits: [
                { id: 0, name: "Наживка новичка", timeMod: 1, cost: 10, desc: "-1 сек. клёва" },
                { id: 1, name: "Наживка любителя", timeMod: 2, cost: 50, desc: "-2 сек. клёва" },
                { id: 2, name: "Наживка знатока", timeMod: 3, cost: 150, desc: "-3 сек. клёва" },
                { id: 3, name: "Наживка опытного", timeMod: 4, cost: 250, desc: "-4 сек. клёва" },
                { id: 4, name: "Наживка профессионала", timeMod: 5, cost: 500, desc: "-5 сек. клёва" }
            ],
            inventoryUpgrades: [
                { slots: 2, cost: 50 },
                { slots: 4, cost: 150 },
                { slots: 6, cost: 250 },
                { slots: 8, cost: 350 },
                { slots: 10, cost: 450 }
            ]
        };

        // --- СТРУКТУРА ЭКИПИРОВКИ (КУКЛА ПЕРСОНАЖА И СНАСТИ) ---

    // ==========================================================================
    // === АССОРТИМЕНТ ЛАВОК
    // ==========================================================================
        const SWAMP_SHOP_STOCK = [
            // --- УДОЧКИ: кубик + допуск по редкости ---
            { key: "rod_0", name: "Самодельная удочка", cost: 1, type: "rod", rarity: "обычная", itemData: { id: 0, name: "Самодельная удочка", dice: "1d4", rarityCap: 0, type: "rod", icon: "🎣", price: 0, desc: "Старая дедушкина удочка. Бросает кубик 1d4 и годится только для обычной рыбы." } },
            { key: "rod_1", name: "Обычная удочка", cost: 150, type: "rod", rarity: "необычная", itemData: { id: 1, name: "Обычная удочка", dice: "2d4", rarityCap: 2, type: "rod", icon: "🎣", price: 12, desc: "Добротное удилище из гибкого орешника. Кубики 2d4, допуск — до «редкой»." } },
            { key: "rod_2", name: "Крепкая удочка", cost: 450, type: "rod", rarity: "редкая", itemData: { id: 2, name: "Крепкая удочка", dice: "3d3", rarityCap: 3, type: "rod", icon: "🎣", price: 45, desc: "Удилище из молодого ясеня с тройным поводком. Кубики 3d3, допуск — до «очень редкой»." } },
            { key: "rod_3", name: "Продвинутая удочка", cost: 900, type: "rod", rarity: "очень редкая", itemData: { id: 3, name: "Продвинутая удочка", dice: "2d6", rarityCap: 5, type: "rod", icon: "🎣", price: 110, desc: "Коленчатая удочка с латунными кольцами из Рыбграда. Кубики 2d6 и допуск до самой «легендарной»." } },

            // --- ЛЕСКИ ---
            { key: "line_0", name: "Самодельная леска", cost: 50, type: "line", rarity: "обычная", itemData: { id: 0, name: "Самодельная леска", bonus: 1, type: "line", icon: "🧵", price: 5, desc: "Скрученная вручную из конского волоса. Добавляет +1 к результату броска." } },
            { key: "line_1", name: "Плетёная леска", cost: 220, type: "line", rarity: "необычная", itemData: { id: 1, name: "Плетёная леска", bonus: 2, quietCastChance: 0.08, type: "line", icon: "🧵", price: 30, desc: "Сплетена из трёх жил болотного шелкопряда. +2 к броску и 8% шанс на «тихий заброс» (+3 к следующему)." } },

            // --- КРЮЧКИ ---
            { key: "hook_0", name: "Самодельный крючок", cost: 40, type: "hook", rarity: "обычная", itemData: { id: 0, name: "Самодельный крючок", type: "hook", nonCommonWeightBonus: 0.10, icon: "🪝", price: 15, desc: "Грубо выкован из старой иглы. На 10% увеличивает шанс поклёвки рыбы ранга НЕОБЫЧНАЯ и выше." } },
            { key: "hook_1", name: "Медная блесна", cost: 120, type: "hook", rarity: "необычная", itemData: { id: 1, name: "Медная блесна", type: "hook", nonCommonWeightBonus: 0.12, icon: "✨", price: 40, desc: "Кусок меди на крючке, отполированный до блеска. +12% к шансу поймать рыбу рангом выше обычной." } },
            { key: "hook_2", name: "Кованый крючок", cost: 220, type: "hook", rarity: "редкая", itemData: { id: 2, name: "Кованый крючок", type: "hook", nonCommonWeightBonus: 0.15, icon: "🪝", price: 70, desc: "Выкован деревенским кузнецом из обломка косы. +15% к шансу поймать рыбу рангом выше обычной." } },
            { key: "hook_3", name: "Двойной крючок", cost: 380, type: "hook", rarity: "очень редкая", itemData: { id: 3, name: "Двойной крючок", type: "hook", nonCommonWeightBonus: 0.12, doubleCatchChance: 0.01, icon: "🪝", price: 130, desc: "Два жала на одном цевье. +12% к шансу поймать рыбу рангом выше обычной и 1% шанс на двойной улов." } },
            { key: "hook_4", name: "Крючок с зазубриной", cost: 20, type: "hook", rarity: "обычная", itemData: { id: 4, name: "Крючок с зазубриной", type: "hook", nonCommonWeightBonus: 0.05, icon: "🪝", price: 8, desc: "Простой крючок с насечкой. +5% к шансу поймать рыбу рангом выше обычной." } },

            // --- ОДЕЖДА ---
            { key: "head_0", name: "Шляпа рыбака", cost: 150, type: "head", rarity: "необычная", itemData: { name: "Шляпа рыбака", type: "head", icon: "👒", price: 60, waitBonus: 0.10, desc: "Широкополая шляпа из просмолённого войлока. Клёв наступает на 10% быстрее." } },
            { key: "head_1", name: "Вязаная шапка", cost: 70, type: "head", rarity: "обычная", itemData: { name: "Вязаная шапка", type: "head", icon: "🧢", price: 25, waitBonus: 0.05, desc: "Тёплая шапка грубой вязки. Голова не мёрзнет, клёв наступает на 5% быстрее." } },
            { key: "head_2", name: "Ученический колпак", cost: 90, type: "head", rarity: "обычная", itemData: { name: "Ученический колпак", type: "head", icon: "🎓", price: 40, xpBonus: 0.03, desc: "Колпак из Академии с кисточкой. +3% к получаемому опыту." } },
            { key: "cloak_0", name: "Плащ болотника", cost: 250, type: "cloak", rarity: "редкая", itemData: { name: "Плащ болотника", type: "cloak", icon: "🧥", price: 100, sellBonus: 0.05, desc: "Плотный плащ, пропитанный воском и болотной смолой. +5% к цене продажи." } },
            { key: "cloak_1", name: "Брезентовый плащ", cost: 120, type: "cloak", rarity: "обычная", itemData: { name: "Брезентовый плащ", type: "cloak", icon: "🧥", price: 40, sellBonus: 0.03, desc: "Простая брезентовая накидка. Купцы чуть охотнее дают цену: +3% к продаже." } },
            { key: "gloves_0", name: "Кожаные перчатки", cost: 200, type: "gloves", rarity: "необычная", itemData: { name: "Кожаные перчатки", type: "gloves", icon: "🧤", price: 80, rollBonus: 1, desc: "Перчатки из свиной кожи с двойной ладонью. Дают +1 к броску." } },
            { key: "gloves_1", name: "Шерстяные перчатки", cost: 90, type: "gloves", rarity: "обычная", itemData: { name: "Шерстяные перчатки", type: "gloves", icon: "🧤", price: 30, critBonus: 0.01, desc: "Тёплые шерстяные перчатки. Пальцы не скользят: +1% к шансу критической подсечки." } },
            { key: "boots_0", name: "Сапоги-скороходы", cost: 300, type: "boots", rarity: "редкая", itemData: { name: "Сапоги-скороходы", type: "boots", icon: "🥾", price: 120, rareWeightBonus: 0.10, desc: "Сапоги на толстой подошве с заговорёнными каблуками. Рыба ранга «редкая» и выше попадается на 10% чаще." } },
            { key: "boots_1", name: "Сапоги болотника", cost: 150, type: "boots", rarity: "обычная", itemData: { name: "Сапоги болотника", type: "boots", icon: "🥾", price: 50, rareWeightBonus: 0.05, desc: "Простые непромокаемые сапоги. Рыба ранга «редкая» и выше попадается на 5% чаще." } },
            { key: "boots_2", name: "Латаные сапоги", cost: 90, type: "boots", rarity: "обычная", itemData: { name: "Латаные сапоги", type: "boots", icon: "🥾", price: 35, rareWeightBonus: 0.03, desc: "Старые сапоги в заплатках. Рыба ранга «редкая» и выше попадается на 3% чаще." } },
            { key: "head_3", name: "Шапка болотника", cost: 180, type: "head", rarity: "обычная", itemData: { name: "Шапка болотника", type: "head", icon: "🧢", price: 60, weatherResist: 0.15, desc: "Плотная шапка с наушниками. В дождь и ветер работается легче: 15% шанс не заметить непогоду." } },
            { key: "gloves_2", name: "Рукавицы бережливого", cost: 160, type: "gloves", rarity: "обычная", itemData: { name: "Рукавицы бережливого", type: "gloves", icon: "🧤", price: 50, baitSaveChance: 0.10, desc: "Кожаные рукавицы с крепким хватом. 10% шанс не потратить наживку или прикорм." } },

            // --- НАЖИВКИ ---
            { key: "bait_0", name: "Жалкий червяк (x20)", cost: 6, type: "bait", rarity: "обычная", itemData: { name: "Жалкий червяк", type: "bait", icon: "🪱", price: 0, count: 20, maxStack: 100, timeMod: 0.10, desc: "Обычный дождевой червь. Ускоряет клёв на 10%. Пачка на 20 забросов, стакается до 100 шт." } },
            { key: "bait_1", name: "Мотыль (x20)", cost: 10, type: "bait", rarity: "обычная", itemData: { name: "Мотыль", type: "bait", icon: "🦟", price: 0, count: 20, maxStack: 100, timeMod: 0.15, desc: "Мелкий болотный мотыль. Ускоряет клёв на 15%. Пачка на 20 забросов." } },
            { key: "bait_2", name: "Жирный червяк (x20)", cost: 14, type: "bait", rarity: "необычная", itemData: { name: "Жирный червяк", type: "bait", icon: "🪱", price: 0, count: 20, maxStack: 100, timeMod: 0.20, desc: "Откормленный на болотной тине червяк. Ускоряет клёв на 20%. Пачка на 20 забросов." } },
            { key: "bait_3", name: "Пиявка (x20)", cost: 19, type: "bait", rarity: "редкая", itemData: { name: "Пиявка", type: "bait", icon: "🐛", price: 0, count: 20, maxStack: 100, timeMod: 0.25, desc: "Жирная болотная пиявка. Ускоряет клёв на 25%. Пачка на 20 забросов." } },

            // --- ПРИКОРМ ---
            { key: "chum_0", name: "Скудный прикорм", cost: 2, type: "chum", rarity: "обычная", itemData: { name: "Скудный прикорм", type: "chum", icon: "🥫", price: 1, count: 1, maxStack: 10, chumRarity: "редкая", chumChance: 0.10, chumCharges: 3, desc: "Болотная прикормка. 10% шанс, что поклёвка будет рыбой ранга «редкая». Хватает на 3 заброса." } },
            { key: "chum_1", name: "Богатый прикорм", cost: 4, type: "chum", rarity: "редкая", itemData: { name: "Богатый прикорм", type: "chum", icon: "🍯", price: 1, count: 1, maxStack: 10, chumRarity: "очень редкая", chumChance: 0.10, chumCharges: 3, desc: "Прикормка с болотным мёдом. 10% шанс, что поклёвка будет рыбой ранга «очень редкая». Хватает на 3 заброса." } },

            // --- СУМКИ ---
            { key: "bag_0", name: "Холщовая сумка", cost: 400, type: "bag", rarity: "необычная", itemData: { name: "Холщовая сумка", type: "bag", icon: "👜", price: 150, slots: 6, desc: "Плотная холщовая сумка с ремнём через плечо. Добавляет 6 ячеек к рюкзаку." } }
        ];

        const POND_SHOP_STOCK = [
            // --- УДОЧКИ ---
            { key: "p_rod_0", name: "Удочка завхоза", cost: 1200, type: "rod", rarity: "необычная", itemData: { id: 10, name: "Удочка завхоза", dice: "3d4", rarityCap: 5, type: "rod", icon: "🎣", price: 250, desc: "Списана со склада как «не подлежит ремонту». Михалыч знает, что это значит: 3d4 и допуск до легендарной." } },
            { key: "p_rod_1", name: "Школьная удочка", cost: 2200, type: "rod", rarity: "редкая", itemData: { id: 11, name: "Школьная удочка", dice: "4d4", rarityCap: 5, type: "rod", icon: "🎣", price: 450, desc: "Учебное пособие кружка ихтиологии, списанное после ревизии. Кубики 4d4." } },
            { key: "p_rod_2", name: "Академическая удочка", cost: 3500, type: "rod", rarity: "очень редкая", itemData: { id: 12, name: "Академическая удочка", dice: "3d6", rarityCap: 5, type: "rod", icon: "🎣", price: 700, desc: "Собрана из списанных приборов и одной очень удачной пружины. Кубики 3d6." } },
            { key: "p_rod_3", name: "Удочка ректора", cost: 5000, type: "rod", rarity: "мифическая", itemData: { id: 13, name: "Удочка ректора", dice: "2d12", rarityCap: 5, type: "rod", icon: "🎣", price: 1100, desc: "Подарочная, с гербом Академии на комле. Кубики 2d12 и вид, внушающий уважение рыбе." } },

            // --- ЛЕСКИ ---
            { key: "p_line_0", name: "Леска с поплавком", cost: 1200, type: "line", rarity: "необычная", itemData: { id: 10, name: "Леска с поплавком", bonus: 2, critBonus: 0.02, type: "line", icon: "🧵", price: 180, desc: "К леске привязан лакированный поплавок. +2 к броску и +2% к критической подсечке." } },
            { key: "p_line_1", name: "Леска ихтиолога", cost: 1800, type: "line", rarity: "редкая", itemData: { id: 11, name: "Леска ихтиолога", bonus: 2, secondChance: 0.03, type: "line", icon: "🧵", price: 300, desc: "Тонкая, но злая. +2 к броску и 3% шанс удержать рыбу, которая уже почти сошла с крючка." } },
            { key: "p_line_2", name: "Леска Академии", cost: 2500, type: "line", rarity: "очень редкая", itemData: { id: 12, name: "Леска Академии", bonus: 2, rarityUpChance: 0.04, type: "line", icon: "🧵", price: 700, desc: "Плетена из волокна, которое младшекурсникам трогать запрещено. +2 к броску и 4% шанс, что на крючке окажется рыба рангом выше." } },
            { key: "p_line_3", name: "Тихая леска", cost: 1500, type: "line", rarity: "необычная", itemData: { id: 13, name: "Тихая леска", bonus: 2, quietCastChance: 0.12, type: "line", icon: "🧵", price: 400, desc: "Леска, которая почти не тревожит воду. +2 к броску и 12% шанс на «тихий заброс» (+3 к следующему)." } },

            // --- КРЮЧКИ ---
            { key: "p_hook_0", name: "Крючок Михалыча", cost: 400, type: "hook", rarity: "обычная", itemData: { id: 10, name: "Крючок Михалыча", type: "hook", nonCommonWeightBonus: 0.18, icon: "🪝", price: 120, desc: "Завхоз клянётся, что гнул его лично. +18% к шансу поймать рыбу рангом выше обычной." } },
            { key: "p_hook_1", name: "Крючок-тройник", cost: 650, type: "hook", rarity: "необычная", itemData: { id: 11, name: "Крючок-тройник", type: "hook", nonCommonWeightBonus: 0.20, icon: "🪝", price: 180, desc: "Три жала, один характер. +20% к шансу поймать рыбу рангом выше обычной." } },
            { key: "p_hook_2", name: "Крючок ихтиолога", cost: 800, type: "hook", rarity: "необычная", itemData: { id: 12, name: "Крючок ихтиолога", type: "hook", nonCommonWeightBonus: 0.22, icon: "🪝", price: 220, desc: "Из нержавеющей стали, с насечкой под палец. +22% к шансу поймать рыбу рангом выше обычной." } },
            { key: "p_hook_3", name: "Академический крючок", cost: 1200, type: "hook", rarity: "редкая", itemData: { id: 13, name: "Академический крючок", type: "hook", nonCommonWeightBonus: 0.20, icon: "🪝", price: 420, desc: "С гравировкой кафедры. +20% к шансу поймать рыбу рангом выше обычной." } },
            { key: "p_hook_4", name: "Золотой крючок", cost: 1800, type: "hook", rarity: "очень редкая", itemData: { id: 14, name: "Золотой крючок", type: "hook", nonCommonWeightBonus: 0.22, icon: "🪝", price: 650, desc: "Позолочен по прихоти ректора. +22% к шансу поймать рыбу рангом выше обычной." } },
            { key: "p_hook_5", name: "Крючок-близнец", cost: 2500, type: "hook", rarity: "редкая", itemData: { id: 15, name: "Крючок-близнец", type: "hook", nonCommonWeightBonus: 0.10, doubleCatchChance: 0.02, icon: "🪝", price: 700, desc: "Два жала смотрят в одну сторону. +10% к шансу поймать рыбу рангом выше обычной и 2% шанс на двойной улов." } },

            // --- ОДЕЖДА ---
            { key: "p_head_0", name: "Фуражка завхоза", cost: 1200, type: "head", rarity: "редкая", itemData: { name: "Фуражка завхоза", type: "head", icon: "🧢", price: 320, waitBonus: 0.12, desc: "С кокардой и вечным запахом склада. Клёв наступает на 12% быстрее." } },
            { key: "p_head_1", name: "Панама ихтиолога", cost: 700, type: "head", rarity: "необычная", itemData: { name: "Панама ихтиолога", type: "head", icon: "👒", price: 180, waitBonus: 0.08, desc: "Выцветшая панама с полями. Клёв наступает на 8% быстрее." } },
            { key: "p_head_2", name: "Шляпа ректора", cost: 1500, type: "head", rarity: "редкая", itemData: { name: "Шляпа ректора", type: "head", icon: "🎩", price: 400, xpBonus: 0.05, desc: "Академическая шляпа с кисточкой. +5% к получаемому опыту." } },
            { key: "p_cloak_0", name: "Плащ Академии", cost: 1100, type: "cloak", rarity: "редкая", itemData: { name: "Плащ Академии", type: "cloak", icon: "🧥", price: 300, sellBonus: 0.08, desc: "Тёмно-синий плащ с гербом. +8% к цене продажи." } },
            { key: "p_cloak_1", name: "Дождевик Михалыча", cost: 700, type: "cloak", rarity: "обычная", itemData: { name: "Дождевик Михалыча", type: "cloak", icon: "🧥", price: 180, sellBonus: 0.06, weatherResist: 0.15, desc: "Клеёнчатый дождевик, пахнет рыбой и хозяйственным мылом. +6% к продаже и 15% шанс не заметить непогоду." } },
            { key: "p_cloak_2", name: "Мантия выпускника", cost: 1300, type: "cloak", rarity: "необычная", itemData: { name: "Мантия выпускника", type: "cloak", icon: "🧥", price: 350, xpBonus: 0.04, desc: "Парадная мантия с золотой нитью. +4% к получаемому опыту." } },
            { key: "p_gloves_0", name: "Перчатки ихтиолога", cost: 1000, type: "gloves", rarity: "редкая", itemData: { name: "Перчатки ихтиолога", type: "gloves", icon: "🧤", price: 280, rollBonus: 1, critBonus: 0.02, desc: "Прорезиненные перчатки с двойной ладонью. +1 к броску и +2% к криту." } },
            { key: "p_gloves_1", name: "Рабочие рукавицы", cost: 600, type: "gloves", rarity: "обычная", itemData: { name: "Рабочие рукавицы", type: "gloves", icon: "🧤", price: 150, rollBonus: 1, baitSaveChance: 0.10, desc: "Брезентовые рукавицы со склада. +1 к броску и 10% шанс сэкономить наживку." } },
            { key: "p_gloves_2", name: "Перчатки лаборанта", cost: 800, type: "gloves", rarity: "необычная", itemData: { name: "Перчатки лаборанта", type: "gloves", icon: "🧤", price: 200, critBonus: 0.03, desc: "Тонкие перчатки для точных работ. +3% к шансу критической подсечки." } },
            { key: "p_boots_0", name: "Сапоги-болотоходы", cost: 1400, type: "boots", rarity: "редкая", itemData: { name: "Сапоги-болотоходы", type: "boots", icon: "🥾", price: 380, rareWeightBonus: 0.12, desc: "Высокие сапоги с двойной подошвой. Рыба ранга «редкая» и выше попадается на 12% чаще." } },
            { key: "p_boots_1", name: "Резиновые сапоги", cost: 800, type: "boots", rarity: "обычная", itemData: { name: "Резиновые сапоги", type: "boots", icon: "🥾", price: 200, rareWeightBonus: 0.08, desc: "Простые, но непромокаемые. Рыба ранга «редкая» и выше попадается на 8% чаще." } },
            { key: "p_boots_2", name: "Ботинки академика", cost: 900, type: "boots", rarity: "необычная", itemData: { name: "Ботинки академика", type: "boots", icon: "🥾", price: 220, xpBonus: 0.03, desc: "Начищенные ботинки на мягкой подошве. +3% к получаемому опыту." } },

            // --- НАЖИВКИ ---
            { key: "p_bait_0", name: "Опарыш (x20)", cost: 45, type: "bait", rarity: "обычная", itemData: { name: "Опарыш", type: "bait", icon: "🐛", price: 0, count: 20, maxStack: 100, timeMod: 0.20, desc: "Жирный опарыш со склада. Ускоряет клёв на 20%. Пачка на 20 забросов." } },
            { key: "p_bait_1", name: "Мотыль отборный (x20)", cost: 60, type: "bait", rarity: "обычная", itemData: { name: "Мотыль отборный", type: "bait", icon: "🦟", price: 0, count: 20, maxStack: 100, timeMod: 0.25, desc: "Крупный мотыль, отобранный вручную. Ускоряет клёв на 25%." } },
            { key: "p_bait_2", name: "Ручейник (x20)", cost: 78, type: "bait", rarity: "необычная", itemData: { name: "Ручейник", type: "bait", icon: "🐌", price: 0, count: 20, maxStack: 100, timeMod: 0.30, desc: "Личинка ручейника в домике. Ускоряет клёв на 30%." } },
            { key: "p_bait_3", name: "Кальмар (x20)", cost: 98, type: "bait", rarity: "редкая", itemData: { name: "Кальмар", type: "bait", icon: "🦑", price: 0, count: 20, maxStack: 100, timeMod: 0.35, desc: "Нарезанный кальмар из столовой. Ускоряет клёв на 35%." } },
            { key: "p_bait_4", name: "Секретный состав (x20)", cost: 86, type: "bait", rarity: "очень редкая", itemData: { name: "Секретный состав", type: "bait", icon: "🧪", price: 0, count: 20, maxStack: 100, timeMod: 0.32, desc: "Бутылочка без этикетки из кабинета ихтиологии. Ускоряет клёв на 32%." } },
            { key: "p_bait_5", name: "Приманка Михалыча (x20)", cost: 98, type: "bait", rarity: "мифическая", itemData: { name: "Приманка Михалыча", type: "bait", icon: "🍯", price: 0, count: 20, maxStack: 100, timeMod: 0.35, desc: "Рецепт завхоза, который он унесёт с собой. Ускоряет клёв на 35%." } },

            // --- ПРИКОРМ ---
            { key: "p_chum_0", name: "Прикорм завхоза", cost: 10, type: "chum", rarity: "необычная", itemData: { name: "Прикорм завхоза", type: "chum", icon: "🥫", price: 3, count: 1, maxStack: 10, chumRarity: "очень редкая", chumChance: 0.15, chumCharges: 3, desc: "Смесь из столовых отходов. 15% шанс, что поклёвка будет рыбой ранга «очень редкая»." } },
            { key: "p_chum_1", name: "Прикорм ихтиолога", cost: 12, type: "chum", rarity: "редкая", itemData: { name: "Прикорм ихтиолога", type: "chum", icon: "🧪", price: 5, count: 1, maxStack: 10, chumRarity: "мифическая", chumChance: 0.08, chumCharges: 3, desc: "Пахнет лабораторией. 8% шанс, что поклёвка будет рыбой ранга «мифическая»." } },
            { key: "p_chum_2", name: "Прикорм Академии", cost: 24, type: "chum", rarity: "очень редкая", itemData: { name: "Прикорм Академии", type: "chum", icon: "🍯", price: 10, count: 1, maxStack: 10, chumRarity: "легендарная", chumChance: 0.04, chumCharges: 3, desc: "Запечатанная банка с гербом. 4% шанс, что поклёвка будет легендарной рыбой." } },

            // --- СУМКИ ---
            { key: "p_bag_0", name: "Сумка ихтиолога", cost: 500, type: "bag", rarity: "обычная", itemData: { name: "Сумка ихтиолога", type: "bag", icon: "👝", price: 180, slots: 8, desc: "Брезентовая сумка с отделениями для пробирок. +8 ячеек." } },
            { key: "p_bag_1", name: "Сумка Академии", cost: 800, type: "bag", rarity: "необычная", itemData: { name: "Сумка Академии", type: "bag", icon: "👜", price: 300, slots: 10, desc: "Фирменная сумка с гербом. +10 ячеек." } },
            { key: "p_bag_2", name: "Завхозная сумка", cost: 1400, type: "bag", rarity: "редкая", itemData: { name: "Завхозная сумка", type: "bag", icon: "👜", price: 500, slots: 12, desc: "Сшита из старого брезента и хранит запах склада. +12 ячеек." } },
            { key: "p_bag_3", name: "Сумка ректора", cost: 2200, type: "bag", rarity: "очень редкая", itemData: { name: "Сумка ректора", type: "bag", icon: "👜", price: 800, slots: 14, desc: "Кожаная, с тиснением. Внутри — отделение для диплома. +14 ячеек." } }
        ];


    // ==========================================================================
    // === ПРЕДМЕТЫ И ЗОНЫ
    // ==========================================================================
