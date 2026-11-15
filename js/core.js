// ============================================================================
//  core.js — ЯДРО: состояние, сохранения, кнопки, уведомления, утилиты
//  Логика и отрисовка. Данные — в content/.
// ============================================================================
// ============================================================================
//  game.js — ЛОГИКА И ОТРИСОВКА
// ----------------------------------------------------------------------------
//  Данные (предметы, квесты, снаряжение) лежат в content.js и подключаются
//  раньше этого файла. Общая глобальная область: все имена видны обоим файлам.
// ============================================================================
        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        // --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ СОСТОЯНИЯ ---
        let gameState = "INTRO"; 
        let gearReturnState = "MAP";
        let hubObjects = []; 
        let coins = 0;
        let totalEarned = 0;
        let inventory = [];
        let maxInventorySlots = 12;
        let baseInventorySlots = 12;   // базовая сумка (улучшается талантом)
        let equippedBags = [null, null, null, null]; // 4 слота под купленные/найденные сумки
        let bagPage = 0;
        const BAG_PAGE_SIZE = 30;      // 10 колонок × 3 ряда на страницу
        let inventoryScrollIndex = 0;

        let viewRodIndex = 0;   
        let viewLineIndex = 0;  
        let viewBaitIndex = 0;  

        // --- ПЕРЕМЕННЫЕ АНИМАЦИИ КУБИКОВ ---
        let diceAnimTimer = 0;        
        let playerDiceValues = [];    
        let fishDiceValues = [];      
        let playerDiceCount = 1;      
        let fishDiceCount = 1;        

        // --- СИСТЕМА СЛУЧАЙНЫХ СОБЫТИЙ ---
        let eventLogText = "Воды спокойны. Ждем поклёвки..."; 
        let activeEventModifier = 0;                          
        let activeWeatherPenalty = 0;   // погода: +к сопротивлению рыбы на текущий заброс
        let hasEventTriggered = false;
        let isPositiveEventActive = false;                    
        let eventTriggerTime = -1;                            
        let guaranteedMaxRoll = false;                        

        let stats = {
            zone1Catch: 0,
            rarePlusCatch: 0, 
            yazCaughtInZone3: false,
            veryRarePlusZone4Catch: 0,
            zonesFished: {}   // { id зоны: сколько рыб поймано } — нужно для открытия Океана
        };

        let introPage = 0;
        let currentZone = null;
        let fishingTimer = 0;
        let fishingWaitTime = 0;
        let activeFish = null;
        let battleLog = "";
        let playerRollResult = null;
        let fishRollResult = null;
        let battleStatus = ""; 
        let secondChanceUsed = false; // «подстраховка»: один шанс удержать рыбу за бой
        let quietCastBonus = 0;       // «тихий заброс»: +3 к следующему броску
        let showStatusTimer = 0;

        // --- ГЛОБАЛЬНАЯ СИСТЕМА КВЕСТОВ (ПЕРЕМЕННЫЕ СОСТОЯНИЯ) ---
        let activeQuestItem = null;      // Какая листовка сейчас выбрана на доске объявлений
        let activeQuestIndex = -1;       // Индекс выбранного квеста на экране (0-4)
        let currentRepeatedQuest = null; // Текущий случайно выбранный контракт на доске

        let questProgress = {
            chainCulinary: 1, // Шаг кулинарной цепочки (1-5)
            chainHistory: 1,  // Шаг исследовательской цепочки (1-5)
            chainGlobal: 1,   // Шаг сюжетного перехода (1-2)
            chainMythic: 1,   // НОВОЕ: Шаг мифической цепочки "Безупречной репутации" (1-3)
            chainRareElder: 1, // Шаг редкой цепочки Старосты (1-3)
            completedSides: [], // Список ID выполненных самостоятельных квестов
            repeatedSeed: 0    // ID текущего случайного контракта из пула 20 штук
        };

        // --- СИСТЕМА УРОВНЕЙ И ОПЫТА (XP) ---
        let playerLevel = 1;
        // --- СОСТОЯНИЕ ПРОКАЧКИ ТАЛАНТОВ (5 ПУТЕЙ) ---
        let talents = {
            // 1 Путь: Мастерство ловли
            fastHand: 0, goodBait: 0, bigBag: false,
            // 2 Путь: Хитроумные снасти
            goodDiscount: 0, critCast: 0, floatSlot: false,
            // 3 Путь: Тяжелая атлетика
            merchantVein: 0, rerollOnes: 0, strongHand: false,
            // 4 Путь: Путь Изобилия
            questMaster: 0, baitSaver: 0, flawlessReputation: false,
            // 5 Путь: Путь Фортуны
            valuableCatch: 0, luckyEvents: 0, invincible: false,
            // Финал
            godOfFishing: false
        };
        let talentPointsSpent = 0;

        let playerXP = 0;
        let caughtFishList = []; // Список уникальных имен рыб, пойманных хотя бы один раз


        // --- ДЛЯ КОНТЕКСТНОГО МЕНЮ МАГАЗИНА ---
        let activeShopItem = null;        // какой товар сейчас выбран в лавке купца

        
        // Исправлено: Объявляем переменные контекстного меню СТРОГО один раз
        let activeContextItem = null; 
        let activeContextIndex = -1;
        let isDeleteConfirmationActive = false; 

        // --- БАЗА ДАННЫХ СНАРЯЖЕНИЯ И ЦЕН ---
        let paperdoll = {
            head: null,
            cloak: null,
            boots: null,
            gloves: null,
            rod: { id: 0, name: "Самодельная удочка", dice: "1d4", rarityCap: 0, type: "rod", icon: "🎣", price: 1, desc: "Старая дедушкина удочка. Бросает кубик 1d4 и годится только для обычной рыбы. Стоит сущие копейки." },
            line: null,
            hook: null,
            bait: null
        };

        // --- МЕХАНИКА ВРЕМЕННЫХ БАФФОВ ---
        let activeBaitCharges = 0; // Временная подстраховка
        let activeChum = null; // { rarity, chance, charges } — прикорм под конкретную редкость

        let ownedRods = [0];
        let ownedLines = [];
        let ownedBaits = [];
        let currentInvUpgradeIdx = 0;

        // --- АССОРТИМЕНТ ЛАВКИ КУПЦА (Болото новичков) ---
        // Единый источник правды: витрина, клики и покупка берут товар отсюда.
        let SHOP_STOCK = SWAMP_SHOP_STOCK;
        const SHOP_PAGE_SIZE = 40;
        let shopPage = 0;


        // --- БАЗА ДАННЫХ РЫБ ПО ВОДОЁМАМ ---
        let particles = [];

        function addParticle(x, y, vx, vy, color, size, life) {
            particles.push({ x, y, vx, vy, color, size, life, maxLife: life });
        }

        function createSplash(x, y, color = "#aadaff", count = 12) {
            for (let i = 0; i < count; i++) {
                let angle = Math.random() * Math.PI * 2;
                let speed = 1 + Math.random() * 3;
                addParticle(
                    x, y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed - 1.5,
                    color,
                    Math.floor(2 + Math.random() * 3),
                    20 + Math.random() * 20
                );
            }
        }

        function createSparkles(x, y, count = 10) {
            const colors = ["#ffff00", "#ffffff", "#ffaa00", "#88ffff"];
            for (let i = 0; i < count; i++) {
                let color = colors[Math.floor(Math.random() * colors.length)];
                addParticle(
                    x + (Math.random() - 0.5) * 40,
                    y + (Math.random() - 0.5) * 40,
                    (Math.random() - 0.5) * 1.5,
                    -Math.random() * 2 - 0.5,
                    color,
                    Math.floor(2 + Math.random() * 3),
                    30 + Math.random() * 25
                );
            }
        }

        function updateAndDrawParticles() {
            for (let i = particles.length - 1; i >= 0; i--) {
                let p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life--;

                let alpha = p.life / p.maxLife;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, alpha);
                ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
                ctx.globalAlpha = 1.0;

                if (p.life <= 0) {
                    particles.splice(i, 1);
                }
            }
        }

        // --- ОТРЕСОВКА ВОДЫ ---
        function draw16BitWater(zone) {
            let bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
            if (zone.id === 1) { 
                bgGrad.addColorStop(0, "#1a2e22");
                bgGrad.addColorStop(0.5, "#2a4a35");
                bgGrad.addColorStop(1, "#0d1a12");
            } else if (zone.id === 6) { 
                bgGrad.addColorStop(0, "#0a152d");
                bgGrad.addColorStop(0.4, "#132c58");
                bgGrad.addColorStop(1, "#040914");
            } else { 
                bgGrad.addColorStop(0, "#192841");
                bgGrad.addColorStop(0.5, "#254668");
                bgGrad.addColorStop(1, "#0e1a2b");
            }
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 800, 600);

            let time = Date.now() * 0.003;
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
            ctx.beginPath();
            ctx.moveTo(0, 360);
            for (let x = 0; x <= 800; x += 20) {
                let y = 360 + Math.sin(time + x * 0.02) * 6;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(800, 600);
            ctx.lineTo(0, 600);
            ctx.fill();

            ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
            ctx.beginPath();
            ctx.moveTo(0, 375);
            for (let x = 0; x <= 800; x += 15) {
                let y = 375 + Math.sin(-time * 1.5 + x * 0.03) * 8;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(800, 600);
            ctx.lineTo(0, 600);
            ctx.fill();
        }

        function addItemToInventory(item) {
            // Если предмет стакающийся (имеет лимит maxStack)
            if (item.maxStack && item.maxStack > 1) {
                // Ищем в инвентаре точно такой же предмет, у которого текущий стак меньше лимита
                for (let i = 0; i < inventory.length; i++) {
                    if (inventory[i] && inventory[i].name === item.name && inventory[i].count < inventory[i].maxStack) {
                        // Добавляем количество к существующему стаку
                        let spaceLeft = inventory[i].maxStack - inventory[i].count;
                        if (item.count <= spaceLeft) {
                            inventory[i].count += item.count;
                            return true; // Всё успешно уместилось в старый слот!
                        } else {
                            inventory[i].count = inventory[i].maxStack;
                            item.count -= spaceLeft; // Уменьшаем остаток и продолжаем искать следующий слот
                        }
                    }
                }
            }

            // Если предмет не стакается или старые слоты забиты, ищем свободную ячейку
            if (inventory.length < maxInventorySlots) {
                // Записываем дефолтный count = 1 для обычных рыб, если не указан
                if (item.count === undefined) item.count = 1;
                inventory.push(item);
                return true;
            }

            return false; // Сумка полностью забита!
        }


        // --- СУМКИ И ВМЕСТИМОСТЬ РЮКЗАКА ---
        function bagSlotsBonus() {
            return equippedBags.reduce((sum, bag) => sum + (bag && bag.slots ? bag.slots : 0), 0);
        }

        function recalcInventoryCapacity() {
            maxInventorySlots = baseInventorySlots + bagSlotsBonus();
        }


        // --- СИСТЕМА СОХРАНЕНИЯ ---
        function saveGame() {
            // ЗАЩИТНЫЙ ФИЛЬТР: Если игра по какой-то причине пытается сохранить пустой уровень 
            // или сбросить опыт в процессе перезагрузки страницы, мы принудительно вытаскиваем 
            // последнее валидное значение из памяти, блокируя баг обнуления!
            if (playerLevel === undefined || playerLevel === 0) {
                let backupData = localStorage.getItem("fantasy_fishing_save");
                if (backupData) {
                    try {
                        let parsedBackup = JSON.parse(backupData);
                        if (parsedBackup.playerLevel) playerLevel = parsedBackup.playerLevel;
                        if (parsedBackup.playerXP) playerXP = parsedBackup.playerXP;
                        if (parsedBackup.caughtFishList) caughtFishList = parsedBackup.caughtFishList;
                    } catch(e) { console.error(e); }
                }
            }

            const saveData = {
                coins, 
                totalEarned, 
                inventory, 
                maxInventorySlots, 
                baseInventorySlots,
                equippedBags,
                activeChum, 
                activeChumCharges: activeChum ? activeChum.charges : 0,
                questProgress,
                paperdoll, 
                talents,
                talentPointsSpent,
                currentInvUpgradeIdx, 
                stats,
                // Намертво запечатываем проверенные данные опыта в хранилище браузера
                playerLevel: playerLevel || 1, 
                playerXP: playerXP || 0, 
                caughtFishList: caughtFishList || []
            };
            localStorage.setItem("fantasy_fishing_save", JSON.stringify(saveData));
        }

        function loadGame() {
            const data = localStorage.getItem("fantasy_fishing_save");
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    coins = parsed.coins || 0;
                    totalEarned = parsed.totalEarned || 0;
                    inventory = parsed.inventory || [];
                    maxInventorySlots = parsed.maxInventorySlots || 12;
                    // Сумки: старые сейвы сохраняют свою вместимость как базовую
                    baseInventorySlots = (parsed.baseInventorySlots !== undefined)
                        ? parsed.baseInventorySlots
                        : (parsed.maxInventorySlots || 12);
                    equippedBags = Array.isArray(parsed.equippedBags) ? parsed.equippedBags.slice(0, 4) : [];
                    while (equippedBags.length < 4) equippedBags.push(null);
                    recalcInventoryCapacity();
                    activeChum = parsed.activeChum || null;
                    if (!activeChum && parsed.activeChumCharges > 0) {
                        // Старый сейв: прикорм был без привязки к редкости
                        activeChum = { rarity: "редкая", chance: 0.10, charges: parsed.activeChumCharges };
                    }
                    currentInvUpgradeIdx = parsed.currentInvUpgradeIdx || 0;
                    stats = parsed.stats || { zone1Catch: 0, rarePlusCatch: 0, yazCaughtInZone3: false, veryRarePlusZone4Catch: 0 };

                    // ИСПРАВЛЕНО: Жесткое и безусловное вытаскивание опыта из памяти LocalStorage
                    playerLevel = parsed.playerLevel !== undefined ? parsed.playerLevel : 1;
                    playerXP = parsed.playerXP !== undefined ? parsed.playerXP : 0;
                    caughtFishList = parsed.caughtFishList || [];

                    if (parsed.questProgress) questProgress = parsed.questProgress;
                    pondState(); // подтягиваем дефолты квестов Школьного пруда для старых сохранений

                    // Загружаем куклу персонажа
                    if (parsed.paperdoll) {
                        paperdoll = parsed.paperdoll;
                    }
                    // Таланты и потраченные очки (иначе дерево сбрасывалось при перезагрузке)
                    if (parsed.talents) talents = Object.assign({}, talents, parsed.talents);
                    talentPointsSpent = parsed.talentPointsSpent || 0;
                    return true;
                } catch(e) {
                    console.error("Ошибка загрузки файла сохранения", e);
                }
            }
            return false;
        }

        function resetGame() {
            localStorage.removeItem("fantasy_fishing_save");
            location.reload();
        }

        // --- ДВИЖОК ИНТЕРАКТИВНЫХ КНОПОК ---
        let buttons = [];

        function clearButtons() { buttons = []; }
        function addButton(x, y, w, h, text, callback, active = true, color = "#111166") {
            // ИСПРАВЛЕНО: Блокируем старый мусор строго по координатам Y из прошлых уроков.
            // Новые кнопки внизу экрана (на y = 465 и y = 545) этот фильтр больше не тронет!
            if (gameState === "SHOP" && (y === 175 || y === 305)) {
                if (text.includes("Купить за")) {
                    return; // Сжигаем фантомы
                }
            }

            buttons.push({ x, y, w, h, text, callback, active, color });
        }

        // --- ВНУТРИИГРОВЫЕ УВЕДОМЛЕНИЯ (полная замена системных alert) ---
        let gameToasts = [];
        let resetArmedUntil = 0;

        function gameAlert(message) {
            const text = String(message);
            gameToasts.push({ text: text, born: Date.now(), life: 4200 + Math.min(5000, text.length * 14) });
            if (gameToasts.length > 3) gameToasts.shift();
        }

        function wrapGameText(text, maxW, font) {
            ctx.font = font;
            const lines = [];
            String(text).split("\n").forEach(par => {
                if (par === "") { lines.push(""); return; }
                let cur = "";
                par.split(" ").forEach(w => {
                    const test = cur ? cur + " " + w : w;
                    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
                    else { cur = test; }
                });
                if (cur) lines.push(cur);
            });
            return lines;
        }

        function drawGameToasts() {
            const now = Date.now();
            gameToasts = gameToasts.filter(t => now - t.born < t.life);
            if (!gameToasts.length) return;

            const font = "bold 12px system-ui";
            const maxW = 616;
            const boxW = 660;
            const x = (800 - boxW) / 2;
            let bottom = 520;

            for (let i = gameToasts.length - 1; i >= 0; i--) {
                const t = gameToasts[i];
                let lines = wrapGameText(t.text, maxW, font);
                if (lines.length > 6) { lines = lines.slice(0, 6); lines[5] = lines[5] + " …"; }
                const h = lines.length * 17 + 24;
                bottom -= h + 8;
                const y = bottom;

                const age = now - t.born;
                const alpha = age > t.life - 700 ? Math.max(0, (t.life - age) / 700) : 1;

                ctx.globalAlpha = alpha;
                ctx.fillStyle = "rgba(8, 14, 26, 0.94)";
                ctx.fillRect(x, y, boxW, h);
                ctx.strokeStyle = "#e8c46a";
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, boxW, h);

                ctx.textAlign = "left";
                ctx.font = font;
                ctx.fillStyle = "#f6ecd6";
                lines.forEach((ln, li) => ctx.fillText(ln, x + 20, y + 22 + li * 17));
                ctx.globalAlpha = 1;
            }
            ctx.textAlign = "left";
        }

        function checkRarityRank(rarity) {
            if (rarity === "обычная") return 0;
            if (rarity === "необычная") return 1;
            if (rarity === "редкая") return 2;
            if (rarity === "очень редкая") return 3;
            if (rarity === "мифическая") return 4;
            if (rarity === "легендарная") return 5;
            return 0;
        }

        // Допуск удочки: максимальный ранг редкости, который она вообще способна зацепить.
        // Стартовая — только обычная рыба, легендарки требуют топовой снасти локации.
        function rodRarityCap(rod) {
            if (!rod) return 0;
            if (rod.rarityOnly) return checkRarityRank(rod.rarityOnly);
            if (typeof rod.rarityCap === "number") return rod.rarityCap;
            // Совместимость со старыми сейвами: определяем допуск по названию/кубику.
            const legacyCaps = {
                "Самодельная удочка": 0,
                "Обычная удочка": 1,
                "Крепкая удочка": 2,
                "Продвинутая удочка": 4,
                "Дубовая удочка": 5,
                "Профессиональная удочка": 5
            };
            if (rod.name && legacyCaps[rod.name] !== undefined) return legacyCaps[rod.name];
            if (rod.dice === "4d4" || rod.dice === "2d12") return 5;
            return 1;
        }

        function checkZoneAccess(zoneId) {
            if (zoneId === 1) return { allowed: true };
            if (zoneId === 2) {
                // Заставу у пруда держит магический барьер; печать мага ставят в таверне на Болоте
                let allowed = questProgress.chainGlobal > 2;
                return { allowed, msg: "Заставу у пруда перекрывает магический барьер — без печати мага стража не пропустит. Печать ставят в таверне на Болоте." };
            }
            if (zoneId === 3) {
                let allowed = stats.rarePlusCatch >= 10 || (questProgress && questProgress.academyOpen === true);
                return { allowed, msg: "К озеру у академии подходят только с именем. Прославьтесь редким уловом — и там вас узнают." };
            }
            if (zoneId === 4) {
                let allowed = stats.yazCaughtInZone3;
                return { allowed, msg: "В горы ведёт старая тропа, а её показывают лишь тому, кто выловил язя в озере у академии." };
            }
            if (zoneId === 5) {
                let allowed = stats.veryRarePlusZone4Catch >= 3;
                return { allowed, msg: "В порт берут не всякого: сначала покажите себя на горной воде." };
            }
            if (zoneId === 6) {
                // Океан открывается тому, кто узнал все воды: поймал рыбу в каждой предыдущей зоне
                let zf = stats.zonesFished || {};
                let allowed = [1, 2, 3, 4, 5].every(id => (zf[id] || 0) > 0);
                return { allowed, msg: "Океан ждёт тех, кто узнал все воды. Вы ещё не прошли весь путь." };
            }
            return { allowed: false };
        }

        function rollDiceStr(diceStr) {
            let parts = diceStr.split('d');
            let count = parseInt(parts[0]);
            let sides = parseInt(parts[1]);
            let total = 0;
            for(let i = 0; i < count; i++) {
                total += Math.floor(Math.random() * sides) + 1;
            }
            return total;
        }

        // Функция расчета опыта, необходимого для перехода на СЛЕДУЮЩИЙ уровень
        function getRequiredXP(level) {
            return level * 100 + (level - 1) * 75; // 1 ур: 100 XP, 2 ур: 275 XP, 3 ур: 500 XP...
        }

        // Бонус к опыту от надетой одежды (например, «Ученический колпак» +3%)
        function gearXpMultiplier() {
            let bonus = 0;
            ["head", "cloak", "gloves", "boots"].forEach(slot => {
                const it = paperdoll[slot];
                if (it && it.xpBonus) bonus += it.xpBonus;
            });
            return 1 + bonus;
        }

        // Процентные бонусы снаряжения: шанс удержать рыбу при проигрыше броска
        function gearSecondChance() {
            let chance = 0;
            ["line", "gloves", "cloak", "boots"].forEach(slot => {
                const it = paperdoll[slot];
                if (it && it.secondChance) chance += it.secondChance;
            });
            return Math.min(0.25, chance);
        }

        // Процентные бонусы снаряжения: шанс, что попадётся рыба на ранг выше
        function gearRarityUpChance() {
            let chance = 0;
            ["line", "gloves", "cloak", "boots", "head"].forEach(slot => {
                const it = paperdoll[slot];
                if (it && it.rarityUpChance) chance += it.rarityUpChance;
            });
            return Math.min(0.20, chance);
        }

        // Двойной улов: шанс, что после успеха клюнет ещё одна рыба (двойной крючок)
        function gearDoubleCatchChance() {
            return Math.min(0.10, (paperdoll.hook && paperdoll.hook.doubleCatchChance) || 0);
        }

        // Тихий заброс: шанс получить +3 к следующему броску
        function gearQuietCastChance() {
            let chance = 0;
            ["line", "head", "cloak"].forEach(slot => {
                const it = paperdoll[slot];
                if (it && it.quietCastChance) chance += it.quietCastChance;
            });
            return Math.min(0.30, chance);
        }

        // Погодное чутьё: шанс игнорировать штраф погоды
        function gearWeatherResist() {
            let chance = 0;
            ["head", "cloak"].forEach(slot => {
                const it = paperdoll[slot];
                if (it && it.weatherResist) chance += it.weatherResist;
            });
            return Math.min(0.50, chance);
        }

        // Бережливость: шанс не потратить наживку или прикорм
        function gearBaitSaveChance() {
            let chance = 0;
            ["gloves", "cloak"].forEach(slot => {
                const it = paperdoll[slot];
                if (it && it.baitSaveChance) chance += it.baitSaveChance;
            });
            return Math.min(0.80, chance);
        }

        // Билд «расходники»: усиливает эффект наживки
        function gearBaitEffectBonus() {
            let bonus = 0;
            ["gloves", "cloak", "head"].forEach(slot => {
                const it = paperdoll[slot];
                if (it && it.baitEffectBonus) bonus += it.baitEffectBonus;
            });
            return Math.min(0.60, bonus);
        }

        // Билд «расходники»: добавляет шанс прикорму
        function gearChumChanceBonus() {
            let bonus = 0;
            ["head", "cloak", "gloves"].forEach(slot => {
                const it = paperdoll[slot];
                if (it && it.chumChanceBonus) bonus += it.chumChanceBonus;
            });
            return Math.min(0.10, bonus);
        }

        // Билд «расходники»: добавляет заряды прикорму
        function gearChumChargeBonus() {
            let bonus = 0;
            ["head", "cloak", "gloves"].forEach(slot => {
                const it = paperdoll[slot];
                if (it && it.chumChargeBonus) bonus += it.chumChargeBonus;
            });
            return Math.min(3, Math.round(bonus));
        }

        // Функция безопасного начисления опыта с автоматическим Level Up
        function addPlayerXP(amount) {
            if (amount <= 0) return;
            amount = Math.max(1, Math.floor(amount * gearXpMultiplier()));
            playerXP += amount;

            // Цикл на случай, если опыта привалило сразу на несколько уровней
            while (playerXP >= getRequiredXP(playerLevel)) {
                playerXP -= getRequiredXP(playerLevel);
                playerLevel++;
                
                // Эпический визуальный эффект левелапа на экране!
                createSparkles(400, 300, 40); 
                
                // Дописываем уведомление в боевой лог, если игрок качнулся прямо во время битвы
                if (gameState === "BATTLE") {
                    battleLog += ` ✨ ВЫ ПОВЫСИЛИ УРОВЕНЬ ДО ${playerLevel}! Очко мастерства получено!`;
                }
            }
            saveGame();
        }

        // --- ИНИЦИАЛИЗАЦИЯ ЭКРАНА "ПУТЬ РЫБАКА" ---
