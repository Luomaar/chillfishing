// ============================================================================
//  screens.js — ЭКРАНЫ: init-функции и обработка действий
//  Логика и отрисовка. Данные — в content/.
// ============================================================================
        function initTalents() {
            gameState = "TALENTS";
            
            // Вычищаем все кнопки из памяти, кроме статус-бара
            buttons = [];
            clearButtons();

            // Кнопка возврата на предыдущий экран (использует сохраненный gearReturnState)
            addButton(20, 540, 160, 45, "⬅ Назад", () => {
                if (gearReturnState === "FISHING" || gearReturnState === "FISHING_WAIT") {
                    gameState = "FISHING"; initFishingZone();
                } else if (gearReturnState === "SHOP") {
                    gameState = "SHOP"; initShop();
                } else if (gearReturnState === "HUB") {
                    gameState = "HUB"; initHub();
                } else if (gearReturnState === "BAG") {
                    gameState = "BAG"; initBag();
                } else if (gearReturnState === "GEAR_NEW") {
                    gameState = "GEAR_NEW"; initGearNew();
                } else if (gearReturnState === "TAVERN") {
                    gameState = "TAVERN"; initTavern();
                } else {
                    gameState = "MAP"; initMap();
                }
            }, true, "#111166");
        }

        // --- ЭКРАН ВЗАИМОДЕЙСТВИЯ С NPC СТАРОСТОЙ (РЕДКИЕ КВЕСТЫ) ---
        function initElderDialog() {
            clearButtons();
            
            // Кнопка возврата обратно на улицу Хаба
            addButton(20, 540, 160, 45, "⬅ Выйти на улицу", () => { 
                gameState = "HUB"; 
                initHub(); 
            }, true, "#111166");

            // Проверяем наличие таланта "Доверие Гильдии" (bigBag)
            if (talents.bigBag === true) {
                let step = questProgress.chainRareElder;
                if (step <= 3) {
                    let qData = questDatabase.rareElder[step];
                    
                    // Считаем, сколько нужной рыбы/предметов сейчас в сумке
                    let totalFound = 0;
                    inventory.forEach(slot => {
                        if (slot && slot.name === qData.target) totalFound += (slot.count || 1);
                    });
                    
                    let hasEnough = (totalFound >= qData.count);

                    // Если предметов хватает — зажигаем зеленую кнопку сдачи редкого квеста
                    let actionLabel = hasEnough ? "✅ Сдать поручение старосте" : `🔒 Нужно: ${qData.count} шт.`;
                    addButton(450, 465, 310, 45, actionLabel, () => {
                        if (hasEnough) {
                            let neededToRemove = qData.count;
                            for (let i = inventory.length - 1; i >= 0; i--) {
                                if (inventory[i] && inventory[i].name === qData.target) {
                                    if (inventory[i].count && inventory[i].count > neededToRemove) {
                                        inventory[i].count -= neededToRemove; neededToRemove = 0;
                                    } else {
                                        neededToRemove -= (inventory[i].count || 1); inventory.splice(i, 1);
                                    }
                                }
                                if (neededToRemove <= 0) break;
                            }

                            // Учитываем бонус "Мастера Контрактов" (Путь 4), если он вкачан
                            let questBonusMultiplier = 1.0 + ((talents.questMaster || 0) * 0.03);
                            coins += Math.floor(qData.gold * questBonusMultiplier);
                            totalEarned += Math.floor(qData.gold * questBonusMultiplier);
                            addPlayerXP(Math.floor(qData.xp * questBonusMultiplier));

                            questProgress.chainRareElder++;
                            saveGame();
                            initElderDialog();
                        }
                    }, hasEnough, "#225522");
                }
            }
        }


// Глобальные переменные для хранения позиции мыши (убедись, что они есть в начале файла)
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    let rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Добавлена жесткая проверка, чтобы игра не падала, если зона еще не выбрана
    if (gameState === "HUB" && currentZone && currentZone === zones[0]) {
        draw();
    }
});

        canvas.addEventListener('click', (e) => {
            let rect = canvas.getBoundingClientRect();
            mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
            mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
            // НОВОЕ: Глобальная проверка клика по центральной зоне уровня на верхней панели!
            // Координаты зоны: X от 300 до 510, Y от 10 до 50 пикселей (работает на любом экране)
            if (mouseX >= 300 && mouseX <= 510 && mouseY >= 10 && mouseY <= 50) {
                if (gameState !== "TALENTS" && gameState !== "INTRO") {
                    gearReturnState = gameState; // запоминаем откуда пришли
                    gameState = "TALENTS";
                    initTalents(); // открываем древо
                    return; // прерываем клик, чтобы он не прожался под панель
                }
            }

            // 1. СНАЧАЛА ПРОВЕРЯЕМ СТАНДАРТНЫЕ КНОПКИ (Назад, Продать и т.д.)
            for (let i = 0; i < buttons.length; i++) {
                let b = buttons[i];
                if (mouseX >= b.x && mouseX <= b.x + b.w &&
                    mouseY >= b.y && mouseY <= b.y + b.h) {
                    if (b.active) b.callback();
                    return; // Клик успешно отработал по кнопке, выходим!
                }
            }

            // 2. ИСПРАВЛЕНО: Блокировку ставим строго ТУТ. Кнопки выше уже проверились,
            // а клики по ячейкам рюкзака ниже мы временно игнорируем.
            // НОВОЕ: Логика кликов по ячейкам инвентаря на экране BAG
            if (gameState === "BAG") {
                let slotSize = 56;
                let gap = 8;
                let cols = 10;
                let startX = 84;
                let startY = 175;

                // Если контекстное меню уже открыто, сначала проверяем клики по его кнопкам
                if (activeContextItem !== null) {
                    if (mouseX >= 40 && mouseX <= 760 && mouseY >= 460 && mouseY <= 510) {
                        return;
                    }
                    activeContextItem = null;
                    activeContextIndex = -1;
                    initBag();
                    return;
                }

                // Клик по слоту сумки — снять её
                for (let b = 0; b < 4; b++) {
                    let bx = 110 + b * 60;
                    let by = 92;
                    if (mouseX >= bx && mouseX <= bx + 52 && mouseY >= by && mouseY <= by + 52) {
                        let bag = equippedBags[b];
                        if (bag) {
                            let capacityAfter = maxInventorySlots - (bag.slots || 0);
                            if (inventory.length <= capacityAfter) {
                                equippedBags[b] = null;
                                recalcInventoryCapacity();
                                inventory.push(bag);
                                saveGame();
                                initBag();
                            } else {
                                gameAlert("🎒 Не хватает места, чтобы снять эту сумку. Освободите ячейки.");
                            }
                        }
                        return;
                    }
                }

                // Проверяем клики по сетке ячеек (страница bagPage)
                for (let s = 0; s < BAG_PAGE_SIZE; s++) {
                    let idx = bagPage * BAG_PAGE_SIZE + s;
                    if (idx >= maxInventorySlots) continue;
                    let row = Math.floor(s / cols);
                    let col = s % cols;
                    let slotX = startX + col * (slotSize + gap);
                    let slotY = startY + row * (slotSize + gap);

                    if (mouseX >= slotX && mouseX <= slotX + slotSize &&
                        mouseY >= slotY && mouseY <= slotY + slotSize) {
                        
                        if (inventory[idx]) {
                            activeContextItem = inventory[idx];
                            activeContextIndex = idx;
                            openContextActions(inventory[idx], idx);
                        }
                        return;
                    }
                }
                return; // Прерываем дальнейшие проверки карты/хабов
            }

            // Логика кликов по витрине магазина (товары берутся из SHOP_STOCK)
            if (gameState === "SHOP") {
                let slotSize = 56;
                let gapX = 8;
                let gapY = 8;
                let startX = 84;
                let startY = 92;
                let cols = 10;

                if (activeShopItem !== null) {
                    if (mouseY >= 465 && mouseY <= 505) return;
                    activeShopItem = null;
                    initShop();
                    return;
                }

                for (let i = 0; i < SHOP_PAGE_SIZE; i++) {
                    let stockItem = SHOP_STOCK[shopPage * SHOP_PAGE_SIZE + i];
                    if (!stockItem) continue;
                    let slotX = startX + (i % cols) * (slotSize + gapX);
                    let slotY = startY + Math.floor(i / cols) * (slotSize + gapY);

                    if (mouseX >= slotX && mouseX <= slotX + slotSize &&
                        mouseY >= slotY && mouseY <= slotY + slotSize) {
                        activeShopItem = stockItem;
                        openShopContext(stockItem);
                        return;
                    }
                }
                return; 
            }

            // 3. Проверка кликов по точкам локаций на Глобальной карте
            if (gameState === "MAP") {
                for (let z of zones) {
                    let dist = Math.sqrt((mouseX - z.x)**2 + (mouseY - z.y)**2);
                    if (dist <= 35) {
                        // Закрытые локации не открываются вообще: ни хаб, ни лавка, ни доска заданий
                        const zoneAccess = checkZoneAccess(z.id);
                        if (!zoneAccess.allowed) {
                            gameAlert(`🔒 «${z.name}» пока закрыта. ${zoneAccess.msg}`);
                            return;
                        }
                        currentZone = z;
                        gameState = "HUB"; 
                        initHub();         
                        return;
                    }
                }
            }

            // 4. Проверка кликов по интерактивным зданиям внутри визуального Хаба
            if (gameState === "HUB") {
                let clickedObj = null;
                for (let obj of hubObjects) {
                    if (mouseX >= obj.x && mouseX <= obj.x + obj.w &&
                        mouseY >= obj.y && mouseY <= obj.y + obj.h) {
                        clickedObj = obj;
                        break;
                    }
                }

                if (clickedObj) {
                    buttons = []; 
                    clearButtons(); // Очищаем старые кнопки нижнего меню хаба

                    // --- ЛОГИКА ДЛЯ ЛОКАЦИИ БОЛОТО НОВИЧКОВ ---
                    if (currentZone.id === 1) {
                        if (clickedObj.id === "elder_house") {
                            gameState = "ELDER"; initElderDialog();
                        } else if (clickedObj.id === "tavern") {
                            gameState = "TAVERN"; initTavern();
                        } else if (clickedObj.id === "shop") {
                            gameState = "SHOP"; initShop();
                        } else if (clickedObj.id === "dock") {
                            gameState = "FISHING"; initFishingZone();
                        }
                    } 
                    // --- ЛОГИКА ДЛЯ ЛОКАЦИИ ШКОЛЬНЫЙ ПРУД ---
                    else if (currentZone.id === 2) {
                        if (clickedObj.id === "school_administration") {
                            initPondBoard("school", "chains");
                        } else if (clickedObj.id === "village_administration") {
                            initPondBoard("village", "chains");
                        } else if (clickedObj.id === "zavhoz_shop") {
                            gameState = "SHOP";
                            initShop();
                        } else if (clickedObj.id === "director_office") {
                            if (pondState().phase < 2) {
                                gameAlert("🚪 Кабинет Директора. Дверь заперта: директор примет вас только после того, как в пруду произойдут перемены.");
                                initHub();
                            } else {
                                initPondBoard("director", "chains");
                            }
                        } else if (clickedObj.id === "school_dock") {
                            let access = checkZoneAccess(currentZone.id);
                            if (access.allowed) {
                                gameState = "FISHING"; initFishingZone();
                            } else {
                                gameAlert("🔒 Доступ закрыт! " + access.msg);
                                initHub();
                            }
                        }
                    }
                    return;
                }
            }

            // 5. НОВОЕ: Обработка снятия предметов на экране GEAR_NEW
            if (gameState === "GEAR_NEW") {
                let slotSize = 64;
                let startY = 120;

                // Координаты слотов одежды (Левая колонка X = 40)
                let clothTypes = ["head", "cloak", "gloves", "boots"];
                clothTypes.forEach((slotId, idx) => {
                    let x = 40;
                    let y = startY + idx * 90;
                    if (mouseX >= x && mouseX <= x + slotSize && mouseY >= y && mouseY <= y + slotSize) {
                        let item = paperdoll[slotId];
                        if (item) {
                            if (inventory.length < maxInventorySlots) {
                                inventory.push(item);      // кладем вещь в сумку
                                paperdoll[slotId] = null;  // освобождаем слот на кукле
                                saveGame();
                                initGearNew();
                            } else {
                                gameAlert("Инвентарь полон! Сначала освободите место.");
                            }
                        }
                    }
                });

                // Координаты слотов снастей (Правая колонка X = 560)
                let tackleTypes = ["rod", "line", "hook", "bait"];
                tackleTypes.forEach((slotId, idx) => {
                    let x = 560;
                    let y = startY + idx * 90;
                    if (mouseX >= x && mouseX <= x + slotSize && mouseY >= y && mouseY <= y + slotSize) {
                        let item = paperdoll[slotId];
                        if (item) {
                            // Проверка свободного места в рюкзаке
                            if (inventory.length < maxInventorySlots) {
                                inventory.push(item);
                                paperdoll[slotId] = null;
                                saveGame();
                                initGearNew();
                            } else {
                                gameAlert("Инвентарь полон! Освободите место.");
                            }
                        }
                    }
                });
            }

            // --- ОБРАБОТКА КЛИКОВ ПО ЗВЕЗДАМ НА ЭКРАНЕ TALENTS ---
            if (gameState === "TALENTS") {
                let freePoints = (playerLevel - 1) - talentPointsSpent;

                talentNodes.forEach(node => {
                    let dist = Math.sqrt((mouseX - node.x)**2 + (mouseY - node.y)**2);
                    let radius = (node.type === "minor") ? 13 : 18;
                    
                    if (dist <= radius) {
                        let currentVal = talents[node.id] || 0;

                        if (node.type === "minor" && currentVal >= node.max) return;
                        if ((node.type === "major" || node.type === "final") && talents[node.id] === true) return;

                        if (freePoints <= 0) {
                            gameAlert("🌟 Недостаточно Очков Мастерства! Повышайте уровень персонажа, ловя рыбу и сдавая квесты.");
                            return;
                        }

                        // ПРОВЕРКА ОТКРЫТИЯ ПРОДВИНУТЫХ ВЕТОК (Условия Логических Мостов)
                        if (node.path === 4 && (!talents.bigBag || !talents.floatSlot)) {
                            gameAlert("🔒 Путь Изобилия заблокирован! Требуется активировать Великие таланты 1-го и 2-го путей: 'Доверие Гильдии' и 'Рыбацкие уловки'.");
                            return;
                        }
                        if (node.path === 5 && (!talents.floatSlot || !talents.strongHand)) {
                            gameAlert("🔒 Путь Фортуны заблокирован! Требуется активировать Великие таланты 2-го и 3-го путей: 'Рыбацкие уловки' и 'Крепкая рука'.");
                            return;
                        }

                        // ПРОВЕРКА РАЗБЛОКИРОВКИ ВЕЛИКИХ ТАЛАНТОВ ВНУТРИ СВОИХ ВЕТОК
                        if (node.type === "major") {
                            if (node.path === 1 && (talents.fastHand < 5 || talents.goodBait < 5)) {
                                gameAlert("🔒 Заблокировано! Требуется полностью прокачать 'Быстрая рука' (5/5) и 'Приманка' (5/5)."); return;
                            }
                            if (node.path === 2 && (talents.goodDiscount < 5 || talents.critCast < 5)) {
                                gameAlert("🔒 Заблокировано! Требуется полностью прокачать 'Выгода' (5/5) и 'Точный заброс' (5/5)."); return;
                            }
                            if (node.path === 3 && (talents.merchantVein < 5 || talents.rerollOnes < 5)) {
                                gameAlert("🔒 Заблокировано! Требуется полностью прокачать 'Купеческая жила' (5/5) и 'Контроль натяга' (5/5)."); return;
                            }
                            if (node.path === 4 && (talents.questMaster < 5 || talents.baitSaver < 5)) {
                                gameAlert("🔒 Заблокировано! Требуется полностью прокачать 'Мастер Контрактов' (5/5) и 'Экономный ловец' (5/5)."); return;
                            }
                            if (node.path === 5 && (talents.valuableCatch < 5 || talents.luckyEvents < 5)) {
                                gameAlert("🔒 Заблокировано! Требуется полностью прокачать 'Охотник за Ценностями' (5/5) и 'Призыв Удачи' (5/5)."); return;
                            }
                        }

                        // ПРОВЕРКА РАЗБЛОКИРОВКИ УЛЬТИМАТИВНОГО ФИНАЛА
                        if (node.type === "final") {
                            if (!talents.bigBag || !talents.floatSlot || !talents.strongHand || !talents.flawlessReputation || !talents.invincible) {
                                gameAlert("🔒 Заблокировано Королевской Печатью! Чтобы стать Богом Рыбалки, вы должны изучить все 5 Великих талантов созвездия (звезды ★)!");
                                return;
                            }
                        }

                        // Если все условия соблюдены — начисляем талант
                        if (node.type === "minor") {
                            talents[node.id] = (talents[node.id] || 0) + 1;
                        } else {
                            if (node.id === "bigBag" && !talents.bigBag) { baseInventorySlots += 4; recalcInventoryCapacity(); }
                            talents[node.id] = true;
                        }

                        talentPointsSpent++; 
                        createSparkles(node.x, node.y, 20); 
                        saveGame(); 
                    }
                });
            }


        });

        // --- ВСТУПЛЕНИЕ: три коротких экрана, без брифинга и без цифр ---
        const INTRO_PAGES = [
            {
                title: "📦 Коробка на шкафу",
                paragraphs: [
                    "Во время очередной уборки ты краем глаза замечаешь коробку на шкафу. Ты уже и не помнишь, что там.",
                    "Положив коробку на пол и открыв, ты видишь разные фотографии и памятные вещи. Там лежит и фотоальбом: плотная картонная обложка, погнутые уголки.",
                    "Ты листаешь страницы, и тебя охватывает ностальгия. С фотографий глядит подросток с корявой удочкой в руках. Лицо светится от счастья, расплывшись в широкой улыбке, а на травке под ногами лежит пара карасиков."
                ]
            },
            {
                title: "🎣 Мостки",
                paragraphs: [
                    "Лето. Туман над водой, мостки скрипят под ногами. Дед молчит, ты молчишь — и это лучшее утро на свете.",
                    "«Рыба суеты не любит, — говорил он. — Люди, кстати, тоже».",
                    "Ты закрываешь альбом и понимаешь: тебе хочется туда вернуться."
                ]
            },
            {
                title: "🏚 Дом",
                paragraphs: [
                    "Через день ты стоишь у знакомого крыльца. Дверь не заперта, в доме тихо.",
                    "На гвозде — удочка. На столе — кружка и записка: «Ушёл за большой рыбой. Не жди — вернусь с уловом».",
                    "Ты берёшь удочку в руки и вспоминаешь, как это делается."
                ]
            }
        ];

        function introButtons() {
            clearButtons();
            const isLast = introPage >= INTRO_PAGES.length - 1;
            addButton(300, 500, 200, 45, isLast ? "В путь" : "Далее", () => {
                if (isLast) {
                    gameState = "MAP";
                    initMap();
                } else {
                    introPage++;
                    introButtons();
                }
            }, true, "#0000aa");
        }

        function initIntro() {
            if (loadGame()) {
                gameState = "MAP";
                initMap();
                return;
            }
            gameState = "INTRO";
            introPage = 0;
            introButtons();
        }

        function initMap() {
            gameState = "MAP";
            
            // ЖЕСТКАЯ ПОДСТРАХОВКА: полностью вычищаем массивы при выходе на карту,
            // чтобы никакие "хвосты" кнопок из других экранов не ехали за нами
            buttons = [];
            clearButtons();
            
            hubObjects = []; 
            activeContextItem = null;
            activeContextIndex = -1;
            
            // ИСПРАВЛЕНО: Теперь кнопка железно вызывает НОВУЮ куклу персонажа initGearNew!
            addButton(40, 530, 150, 45, "🛡️ Снаряжение", () => { 
                gameState = "GEAR_NEW";
                initGearNew(); 
            });
            
            addButton(210, 530, 150, 45, "🎒 Инвентарь", () => { 
                gameState = "BAG";
                initBag(); 
            });
            
            addButton(655, 530, 130, 45, "🗑 Сброс", () => {
                if (Date.now() < resetArmedUntil) {
                    resetGame();
                } else {
                    resetArmedUntil = Date.now() + 5000;
                    gameAlert("⚠️ Сброс прогресса! Нажмите «🗑 Сброс» ещё раз в течение 5 секунд, чтобы подтвердить.");
                }
            }, true, "#881111");
        }

        // --- ПОЛНОСТЬЮ СБАЛАНСИРОВАННАЯ КАРТА СОЗВЕЗДИЯ (ОБНОВЛЕННЫЕ ОПИСАНИЯ) ---
        let pondTab = "school";        // school | village | director
        let pondSub = "chains";        // chains | sides | contracts | rare
        let pondPage = 0;
        let pondActiveQuest = null;    // выбранная карточка
        let pondFlash = "";
        let pondFlashUntil = 0;
        let pondDetailPage = 0;

        const POND_PAGE_SIZE = 5;

        const POND_SUBTABS = [
            { id: "chains", label: "📖 Цепочки" },
            { id: "sides", label: "📌 Поручения" },
            { id: "contracts", label: "📜 Контракты" },
            { id: "rare", label: "★ Редкие" }
        ];

        const POND_FACTIONS = [
            { id: "school", label: "🏫 Школа" },
            { id: "village", label: "🏛 Сельсовет" },
            { id: "director", label: "🎓 Директор" }
        ];

        function initHub() {
            gameState = "HUB";
            clearButtons();
            
            // Навигационная панель внизу экрана
            addButton(20, 530, 180, 45, "⬅ На Карту", () => { initMap(); });
            addButton(215, 530, 180, 45, "🛡️ Снаряжение", () => {
                gearReturnState = "HUB"; 
                gameState = "GEAR_NEW";
                initGearNew();
            });
            addButton(410, 530, 180, 45, "🎒 Инвентарь", () => {
                gearReturnState = "HUB";
                gameState = "BAG";
                initBag();
            });

            // Динамическое переключение объектов в зависимости от водоема
            if (currentZone && currentZone.id === 2) {
                // --- ХАБ ЛОКАЦИИ 2: ШКОЛЬНЫЙ ПРУД ---
                hubObjects = [
                    { id: "school_administration", x: 30, y: 130, w: 200, h: 160, name: "Крыльцо школы (Заказы обучения)" },
                    { id: "village_administration", x: 250, y: 110, w: 210, h: 180, name: "Сельсовет (Заказы общины)" },
                    { id: "zavhoz_shop", x: 600, y: 150, w: 170, h: 140, name: "Каморка завхоза Михалыча" },
                    { id: "director_office", x: 50, y: 320, w: 110, h: 90, name: "Кабинет Директора Школы" },
                    { id: "school_dock", x: 480, y: 410, w: 160, h: 110, name: "Рыболовный причал у стадиона" }
                ];
            } else {
                // --- ДЕФОЛТНЫЙ ХАБ ЛОКАЦИИ 1: БОЛОТО НОВИЧКОВ ---
                hubObjects = [
                    { id: "elder_house", x: 40, y: 220, w: 100, h: 120, name: "Дом Деревенского Старосты" },
                    { id: "tavern", x: 165, y: 140, w: 220, h: 210, name: "Таверна 'Хромая лягушка'" },
                    { id: "shop", x: 605, y: 130, w: 180, h: 160, name: "Лавка купца" },
                    { id: "dock", x: 475, y: 410, w: 160, h: 110, name: "Рыболовный причал" }
                ];
            }
        }

        // --- ИНИЦИАЛИЗАЦИЯ ТАВЕРНЫ ---
        function initTavern() {
            gameState = "TAVERN";
            
            buttons = [];
            clearButtons();

            // 1. Нижняя навигационная панель управления (Y = 540)
            addButton(20, 540, 160, 45, "⬅ Выйти в Хаб", () => { 
                activeQuestItem = null;
                gameState = "HUB";
                initHub(); 
            }, true, "#111166");

            // Инициализация случайного повторяющегося контракта
            if (!questProgress.repeatedSeed || questProgress.repeatedSeed === 0) {
                questProgress.repeatedSeed = Math.floor(Math.random() * repeatedQuestsPool.length) + 1;
                saveGame();
            }
            currentRepeatedQuest = repeatedQuestsPool.find(q => q.id === questProgress.repeatedSeed);

            // 2. ФОРМИРУЕМ ПАКЕТ ЛИСТОВОК ДЛЯ ОТОБРАЖЕНИЯ НА ДОСКЕ (Максимум 6)
            let activeBoardQuests = [];

            // Слот 0: Кулинария
            let culStep = questProgress.chainCulinary;
            if (culStep <= 5) activeBoardQuests.push({ type: "culinary", step: culStep, data: questDatabase.culinary[culStep] });
            else activeBoardQuests.push({ completed: true, label: "🥣 Кулинария\n[Выполнено]" });

            // Слот 1: Археология
            let hisStep = questProgress.chainHistory;
            if (hisStep <= 5) activeBoardQuests.push({ type: "history", step: hisStep, data: questDatabase.history[hisStep] });
            else activeBoardQuests.push({ completed: true, label: "🏛 Археология\n[Выполнено]" });

            // Слот 2: Застава (Сюжет)
            let globStep = questProgress.chainGlobal;
            if (globStep <= 2) activeBoardQuests.push({ type: "global", step: globStep, data: questDatabase.global[globStep] });
            else activeBoardQuests.push({ completed: true, label: "🔓 Застава\n[Открыта]" });

            // Слот 3: Одиночные поручения
            let availableSide = questDatabase.sides.find(q => !questProgress.completedSides.includes(q.id));
            if (availableSide) activeBoardQuests.push({ type: "side", data: availableSide });
            else activeBoardQuests.push({ completed: true, label: "📌 Поручения\n[Выполнено]" });

            // Слот 4: Повторяющийся бесконечный контракт
            if (currentRepeatedQuest) activeBoardQuests.push({ type: "repeated", data: currentRepeatedQuest });

            // Слот 5: СКРЫТЫЙ МИФИЧЕСКИЙ СЛОТ (Только при открытом таланте «Безупречная репутация»)
            if (talents.flawlessReputation === true) {
                let mythStep = questProgress.chainMythic;
                if (mythStep <= 3) {
                    activeBoardQuests.push({ type: "mythic", step: mythStep, data: questDatabase.mythic[mythStep] });
                } else {
                    activeBoardQuests.push({ completed: true, label: "👑 Босс повержен!\nВы — Легенда!" });
                }
            }

            // 3. ГЕНЕРАЦИЯ КНОПОК КЛИКОВ (Строгая сетка 3х2 БЕЗ СДВИГОВ И ЦЕНТРИРОВАНИЯ)
            let paperW = 220; 
            let paperH = 165; 
            let startX = 45;
            let startY = 110; 
            let gapX = 25;
            let gapY = 25;    

            activeBoardQuests.forEach((quest, idx) => {
                let row = Math.floor(idx / 3); // Строка 0 (индексы 0,1,2) или Строка 1 (индексы 3,4,5)
                let col = idx % 3;             // Столбец 0, 1 или 2
                
                let btnX = startX + col * (paperW + gapX); // ИСПРАВЛЕНО: Сдвиг убран, нижний ряд идет вровень с верхним!
                let btnY = startY + row * (paperH + gapY);

                addButton(btnX, btnY, paperW, paperH, "", () => {
                    if (quest.completed) return;
                    activeQuestItem = quest;
                    openQuestContext(quest);
                }, true, "rgba(0,0,0,0)");
            });
        }

        function openQuestContext(quest) {
            clearButtons();
            
            // ИСПРАВЛЕНО: Теперь кнопка ведет не в Хаб, а возвращает обратно к доске объявлений таверны!
            addButton(20, 540, 210, 45, "⬅ К доске объявлений", () => { 
                activeQuestItem = null;
                initTavern(); // Плавный возврат к 5 листовкам
            }, true, "#111166");

            if (!quest || quest.completed || !quest.data) return;
            let qData = quest.data;

            let totalFoundInBag = 0;
            inventory.forEach(slot => {
                if (slot && slot.name === qData.target) {
                    totalFoundInBag += (slot.count || 1);
                }
            });

            let hasEnoughFish = (totalFoundInBag >= qData.count);

            // Предметные награды: проверяем, хватит ли места в сумке
            const rewardItems = Array.isArray(qData.rewardItems) ? qData.rewardItems : [];
            let rewardSlotsNeeded = 0;
            rewardItems.forEach(it => {
                const stackable = it.maxStack && it.maxStack > 1;
                const hasStack = stackable && inventory.some(s => s && s.name === it.name && (s.count || 1) < (s.maxStack || it.maxStack));
                if (!hasStack) rewardSlotsNeeded++;
            });
            let hasRewardSpace = (inventory.length + rewardSlotsNeeded <= maxInventorySlots);
            // При сдаче цель исчезает из сумки — эти слоты освободятся
            if (!hasRewardSpace && hasEnoughFish) {
                let freedSlots = 0, stillNeeded = qData.count;
                for (const slot of inventory) {
                    if (slot && slot.name === qData.target) {
                        const have = slot.count || 1;
                        if (have <= stillNeeded) { freedSlots++; stillNeeded -= have; }
                    }
                    if (stillNeeded <= 0) break;
                }
                hasRewardSpace = (inventory.length - freedSlots + rewardSlotsNeeded <= maxInventorySlots);
            }

            // Кнопки управления сделкой в правом нижнем углу
            addButton(435, 465, 140, 35, "❌ Отмена", () => {
                activeQuestItem = null;
                initTavern(); 
            }, true, "#444444");

            let actionLabel = !hasEnoughFish ? "🔒 Сдать задание" : (!hasRewardSpace ? "🎒 Нет места" : "✅ Сдать задание");
            
            addButton(590, 465, 170, 35, actionLabel, () => {
                if (hasEnoughFish && hasRewardSpace) {
                    let neededToRemove = qData.count;

                    for (let i = inventory.length - 1; i >= 0; i--) {
                        if (inventory[i] && inventory[i].name === qData.target) {
                            if (inventory[i].count && inventory[i].count > neededToRemove) {
                                inventory[i].count -= neededToRemove;
                                neededToRemove = 0;
                            } else {
                                neededToRemove -= (inventory[i].count || 1);
                                inventory.splice(i, 1);
                            }
                        }
                        if (neededToRemove <= 0) break; 
                    }

                    // Высчитываем бонус таланта "Мастер Контрактов": НОВЫЙ БАЛАНС: +3% за уровень (макс +15%)
                    let questBonusMultiplier = 1.0 + ((talents.questMaster || 0) * 0.03);

                    let finalGoldReward = Math.floor(qData.gold * questBonusMultiplier);
                    let finalXPReward = Math.floor(qData.xp * questBonusMultiplier);

                    coins += finalGoldReward;
                    totalEarned += finalGoldReward;
                    addPlayerXP(finalXPReward); // Начисляем увеличенный опыт персонажу!

                    // Предметные награды задания
                    rewardItems.forEach(tpl => {
                        const rewardItem = JSON.parse(JSON.stringify(tpl));
                        if (!addItemToInventory(rewardItem)) {
                            gameAlert(`🎒 Награда «${rewardItem.name}» не поместилась в сумку.`);
                        }
                    });


                    if (quest.type === "culinary") questProgress.chainCulinary++;
                    else if (quest.type === "history") questProgress.chainHistory++;
                    else if (quest.type === "global") questProgress.chainGlobal++;
                    else if (quest.type === "side") questProgress.completedSides.push(qData.id);
                    else if (quest.type === "repeated") questProgress.repeatedSeed = 0;
                    else if (quest.type === "mythic") questProgress.chainMythic++; // НОВОЕ: Прогресс мифической цепочки!

                    activeQuestItem = null;
                    saveGame();
                    initTavern(); 
                }
            }, hasEnoughFish, "#225522");
        }


        function questRewardText(q) {
            if (!q || !Array.isArray(q.rewardItems) || !q.rewardItems.length) return "";
            const parts = q.rewardItems.map(it => (it.count && it.count > 1) ? `${it.name} ×${it.count}` : it.name);
            let text = "🎁 Награда: " + parts.join(", ");
            if (text.length > 82) text = text.slice(0, 80) + "…";
            return text;
        }

        function initShop() {
            gameState = "SHOP";

            // У каждой локации свой ассортимент
            SHOP_STOCK = (currentZone && currentZone.id === 2) ? POND_SHOP_STOCK : SWAMP_SHOP_STOCK;
            shopPage = 0;
            
            buttons = []; 
            clearButtons(); 

            // Навигационная панель управления в самом низу экрана (Y = 545)
            addButton(20, 545, 120, 40, "⬅ В Хаб", () => { 
                activeShopItem = null;
                gameState = "HUB"; 
                initHub(); 
            }, true, "#111166");
            
            addButton(155, 545, 140, 40, "🛡️ Снаряжение", () => {
                gearReturnState = "SHOP"; 
                gameState = "GEAR_NEW";
                initGearNew();
            });
            addButton(310, 545, 140, 40, "🎒 Инвентарь", () => {
                gearReturnState = "SHOP";
                gameState = "BAG";
                initBag();
            });

            // Листание витрины (при необходимости): 30 товаров на страницу
            const shopPages = Math.max(1, Math.ceil(SHOP_STOCK.length / SHOP_PAGE_SIZE));
            if (shopPage >= shopPages) shopPage = 0;
            if (shopPages > 1) {
                addButton(250, 470, 34, 26, "◀", () => {
                    shopPage = (shopPage - 1 + shopPages) % shopPages;
                    activeShopItem = null;
                    initShop();
                }, true, "#333355");
                addButton(480, 470, 34, 26, "▶", () => {
                    shopPage = (shopPage + 1) % shopPages;
                    activeShopItem = null;
                    initShop();
                }, true, "#333355");
            }
        }

        function openShopContext(shopItem) {
            clearButtons();

            // Кнопка 1: Отмена покупки
            addButton(225, 465, 140, 35, "❌ Отмена", () => {
                activeShopItem = null;
                initShop();
            }, true, "#444444");

            // Скидка таланта «Выгода» (+3% за уровень) — считается в одном месте
            let shopDiscount = (talents.goodDiscount || 0) * 0.03;
            let finalCost = Math.max(1, Math.round(shopItem.cost * (1 - shopDiscount)));
            let canAfford = (coins >= finalCost);

            addButton(385, 465, 190, 35, `🛒 Купить за ${finalCost}🪙`, () => {
                if (coins < finalCost) return;
                let itemClone = JSON.parse(JSON.stringify(shopItem.itemData));
                // Продажная стоимость купленного предмета — не выше 60% цены покупки
                itemClone.price = Math.max(0, Math.min(itemClone.price || 0, Math.floor(finalCost * 0.6)));
                if (addItemToInventory(itemClone)) {
                    coins -= finalCost;
                    if (shopItem.type === "rod" && !ownedRods.includes(shopItem.itemData.id)) {
                        ownedRods.push(shopItem.itemData.id);
                    }
                    activeShopItem = null;
                    saveGame();
                    initShop();
                } else {
                    gameAlert("🎒 Ваша сумка забита! Свободных ячеек нет.");
                    activeShopItem = null;
                    initShop();
                }
            }, canAfford, "#225522");
        }


        function initGearNew() {
            clearButtons();
            
            // Умная навигация: возвращаемся строго в предыдущую локацию
            addButton(20, 540, 150, 45, "⬅ Назад", () => { 
                if (gearReturnState === "FISHING") { gameState = "FISHING"; initFishingZone(); }
                else if (gearReturnState === "SHOP") { gameState = "SHOP"; initShop(); }
                else if (gearReturnState === "HUB") { gameState = "HUB"; initHub(); }
                else if (gearReturnState === "PONDBOARD") { gameState = "PONDBOARD"; pondRebuildButtons(); }
                else { initMap(); }
            }, true, "#111166");
            
            addButton(630, 540, 150, 45, "🎒 В Инвентарь", () => { 
                gameState = "BAG";
                initBag(); 
            }, true, "#333399");
        }

        function initBag() {
            clearButtons();
            
            addButton(20, 540, 150, 45, "⬅ Назад", () => { 
                if (gearReturnState === "FISHING") { gameState = "FISHING"; initFishingZone(); }
                else if (gearReturnState === "SHOP") { gameState = "SHOP"; initShop(); }
                else if (gearReturnState === "HUB") { gameState = "HUB"; initHub(); }
                else if (gearReturnState === "PONDBOARD") { gameState = "PONDBOARD"; pondRebuildButtons(); }
                else { initMap(); }
            }, true, "#111166");
            
            addButton(185, 540, 150, 45, "🛡️ Снаряжение", () => {
                gameState = "GEAR_NEW";
                initGearNew();
            }, true, "#333399");

            // Листание сумки, если ячеек больше одной страницы
            const bagPages = Math.max(1, Math.ceil(maxInventorySlots / BAG_PAGE_SIZE));
            if (bagPage >= bagPages) bagPage = 0;
            if (bagPages > 1) {
                addButton(600, 366, 40, 26, "◀", () => {
                    bagPage = (bagPage - 1 + bagPages) % bagPages;
                    activeContextItem = null;
                    activeContextIndex = -1;
                    initBag();
                }, true, "#333355");
                addButton(700, 366, 40, 26, "▶", () => {
                    bagPage = (bagPage + 1) % bagPages;
                    activeContextItem = null;
                    activeContextIndex = -1;
                    initBag();
                }, true, "#333355");
            }
        }

        function openContextActions(item, index) {
            clearButtons();

            // Если режим подтверждения удаления активен
            if (isDeleteConfirmationActive) {
                addButton(40, 465, 340, 35, "❌ Ой, стоп! Оставить вещь", () => {
                    isDeleteConfirmationActive = false;
                    openContextActions(item, index);
                }, true, "#444444");

                addButton(410, 465, 340, 35, "🗑 Да, уничтожить навсегда", () => {
                    inventory.splice(index, 1);
                    isDeleteConfirmationActive = false;
                    activeContextItem = null;
                    activeContextIndex = -1;
                    saveGame();
                    initBag();
                }, true, "#881111");
                return;
            }

            // --- СТАНДАРТНОЕ МЕНЮ ДЕЙСТВИЙ ---
            addButton(40, 465, 140, 35, "❌ Отмена", () => {
                activeContextItem = null;
                activeContextIndex = -1;
                isDeleteConfirmationActive = false;
                initBag();
            }, true, "#444444");

            // Проверяем тип предмета
            let isEquippable = (item.type === "rod" || item.type === "line" || item.type === "hook" ||
                                item.type === "head" || item.type === "cloak" || item.type === "gloves" || item.type === "boots");
            let isBait = (item.type === "bait");
            let isChum = (item.type === "chum");
            let isBag = (item.type === "bag");

            // ДИНАМИЧЕСКАЯ КНОПКА 2: Надеть снасть ИЛИ Использовать расходник
            if (isBait) {
                // ИСПРАВЛЕНО: Умное насаживание червяков со сложением стаков и защитой от потери предметов!
                addButton(195, 465, 170, 35, `🪱 Насадить все (х${item.count})`, () => {
                    // Проверяем, есть ли уже наживка на кукле
                    if (paperdoll.bait) {
                        // Если на кукле надет такой же Жалкий червяк — просто СУММИРУЕМ их!
                        if (paperdoll.bait.name === item.name) {
                            paperdoll.bait.count += item.count;
                            inventory.splice(index, 1); // удаляем пачку из сумки, так как она вся ушла в плюс
                        } else {
                            // Если на кукле была ДРУГАЯ наживка, пытаемся вернуть её в сумку
                            if (inventory.length < maxInventorySlots) {
                                let oldBait = JSON.parse(JSON.stringify(paperdoll.bait));
                                paperdoll.bait = { 
                                    name: item.name, type: "bait", icon: item.icon, 
                                    timeMod: item.timeMod, count: item.count, desc: item.desc 
                                };
                                inventory[index] = oldBait; // старую наживку кладем на место новой
                            } else {
                                gameAlert("🎒 Инвентарь полон! Некуда снять текущую наживку с удочки.");
                                return;
                            }
                        }
                    } else {
                        // Если слот наживки пуст — просто насаждаем всю пачку
                        paperdoll.bait = { 
                            name: item.name, type: "bait", icon: item.icon, 
                            timeMod: item.timeMod, count: item.count, desc: item.desc 
                        };
                        inventory.splice(index, 1);
                    }
                    
                    activeContextItem = null; 
                    activeContextIndex = -1;
                    saveGame(); 
                    initBag();
                }, true, "#225522");

            } else if (isChum) {
                // Прикорм под конкретную редкость: заряды и редкость берём из предмета
                let chumRarity = item.chumRarity || "редкая";
                let chumChance = Math.min(0.50, (item.chumChance || 0.10) + gearChumChanceBonus());
                let chumCharges = (item.chumCharges || 3) + gearChumChargeBonus();
                addButton(195, 465, 170, 35, "🥫 Активировать (+3 заброса)", () => {
                    if (activeChum && activeChum.rarity === chumRarity) {
                        activeChum.charges += chumCharges;
                        activeChum.chance = Math.max(activeChum.chance, chumChance);
                    } else {
                        activeChum = { rarity: chumRarity, chance: chumChance, charges: chumCharges };
                    }
                    
                    item.count--;
                    if (item.count <= 0) {
                        inventory.splice(index, 1);
                    }
                    
                    // Переключаем текст в специальный статус успешного применения
                    eventLogText = `🥫 Вы бросили прикорм в воду! Рыба ранга «${chumRarity}» почуяла угощение.`;
                    
                    activeContextItem = null; 
                    activeContextIndex = -1;
                    saveGame(); 
                    initBag();
                }, true, "#442266");

            } else if (isBag) {
                addButton(195, 465, 170, 35, "👜 Вставить в сумку", () => {
                    const freeSlot = equippedBags.indexOf(null);
                    if (freeSlot < 0) {
                        gameAlert("🎒 Все четыре слота под сумки заняты. Снимите одну из сумок.");
                        return;
                    }
                    equippedBags[freeSlot] = item;
                    inventory.splice(index, 1);
                    recalcInventoryCapacity();
                    activeContextItem = null;
                    activeContextIndex = -1;
                    saveGame();
                    initBag();
                }, true, "#225522");

            } else {
                // Обычная кнопка экипировки для Удочек и Лесок
                addButton(195, 465, 170, 35, "🛡️ Надеть", () => {
                    let slotId = item.type;
                    let oldItem = paperdoll[slotId];
                    paperdoll[slotId] = item;
                    if (oldItem) { inventory[index] = oldItem; } 
                    else { inventory.splice(index, 1); }
                    activeContextItem = null; activeContextIndex = -1;
                    saveGame(); initBag();
                }, isEquippable, "#225522");
            }

            // Кнопка 3: Продажа с учетом таланта "Купеческая жила" (+3% за уровень)
            let isSalable = (item.price !== undefined && item.price !== null && item.price > 0);
            
            let merchantMultiplier = 1.0 + ((talents.merchantVein || 0) * 0.03) + ((paperdoll.cloak && paperdoll.cloak.sellBonus) ? paperdoll.cloak.sellBonus : 0);
            let finalPrice = Math.floor((item.price || 0) * (item.count || 1) * merchantMultiplier);

            let sellLabel = isSalable ? `💰 Продать (${finalPrice}🪙)` : "💰 Не продается";

            addButton(380, 465, 170, 35, sellLabel, () => {
                coins += finalPrice;
                totalEarned += finalPrice;
                inventory.splice(index, 1);
                activeContextItem = null; activeContextIndex = -1;
                saveGame();
                initBag();
            }, isSalable, "#aaaa00");

            // Кнопка 4: Выбросить
            let isDestroyable = true;
            if (item.id === 0 && item.type === "rod" && !paperdoll.rod) { isDestroyable = false; }

            addButton(565, 465, 170, 35, "🗑 Выбросить", () => {
                isDeleteConfirmationActive = true;
                openContextActions(item, index);
            }, isDestroyable, "#881111");
        }
