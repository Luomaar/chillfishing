// ============================================================================
//  main.js — ЦИКЛ ИГРЫ, ВВОД И ЗАПУСК
//  Логика и отрисовка. Данные — в content/.
// ============================================================================
        function update() {
            if (gameState === "FISHING_WAIT") {
                fishingTimer += 1/60; 

                if (eventTriggerTime !== -1 && !hasEventTriggered && fishingTimer >= eventTriggerTime) {
                    hasEventTriggered = true; 

                    let minGold = 3, maxGold = 6;
                    if (currentZone.id === 2) { minGold = 7; maxGold = 12; }
                    else if (currentZone.id === 3) { minGold = 13; maxGold = 25; }
                    else if (currentZone.id === 4) { minGold = 26; maxGold = 48; }
                    else if (currentZone.id === 5) { minGold = 49; maxGold = 62; }
                    else if (currentZone.id === 6) { minGold = 63; maxGold = 100; }
                    
                    let foundGold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;

                    const eventsPool = [
                        { text: "Леска слегка дернулась... Кажется, там кто-то есть.", type: "text", weight: 7 },
                        { text: "Вдали из воды на мгновение выпрыгнула серебристая рыбешка.", type: "text", weight: 7 },
                        { text: "Стайка крошечных мальков проплыла прямо у ваших ног.", type: "text", weight: 7 },
                        { text: "С ближайшего дерева в воду бесшумно упал сухой лист.", type: "text", weight: 7 },
                        { text: "Вода здесь кристально чистая, видно колыхание водорослей.", type: "text", weight: 7 },
                        { text: "Над поплавком лениво зависла яркая стрекоза.", type: "text", weight: 7 },
                        { text: "Где-то на глубине промелькнула большая таинственная тень.", type: "text", weight: 7 },
                        { text: "🧚 Вы замечаете, как вдали над камышами беззвучно пролетает крошечная фея.", type: "text", weight: 10 },
                        
                        { text: "🌫 Накатил густой туман... Клёв затягивается!", type: "fog", weight: 6 },
                        { text: "🌧 Над водоёмом пошёл дождь — рыба пуглива и сопротивляется сильнее.", type: "weather", val: 1, weight: 7 },
                        { text: "💨 Налетел порывистый ветер — заброс вышел неточным.", type: "weather", val: 1, weight: 7 },
                        { text: "⛈ Гроза! Вода бурлит, рыба сопротивляется отчаянно.", type: "weather", val: 2, weight: 4 },
                        { text: "Старый проплывающий деревянный башмак зацепил поплавок. Пустяки.", type: "text", weight: 6 },
                        
                        { text: `💰 В бликах воды на мели вы замечаете золотой блеск на дне. Потянувшись рукой, вы нащупали ${foundGold} монет(ы)!`, type: "gold", val: foundGold, weight: 7, isPositive: true },
                        { text: "🧚✨ К вам близко подлетела крошечная фея и зачаровала удочку! Следующий бросок будет максимальным!", type: "fairy_buff", weight: 6, isPositive: true },
                        { text: "🔲 Удачный заброс! Следующий бросок получит +3 к силе.", type: "bonus", val: 3, weight: 3, isPositive: true },
                        { text: "✨ Благословение Водяного! Сила подсечки увеличена на +4!", type: "bonus", val: 4, weight: 2, isPositive: true }
                    ];

                    let totalWeight = 0;
                    eventsPool.forEach(ev => totalWeight += ev.weight);
                    
                    let randomRoll = Math.random() * totalWeight;
                    let weightCounter = 0;
                    let chosenEvent = null;

                    for (let i = 0; i < eventsPool.length; i++) {
                        weightCounter += eventsPool[i].weight;
                        if (randomRoll <= weightCounter) {
                            chosenEvent = eventsPool[i];
                            break;
                        }
                    }

                    if (chosenEvent) {
                        eventLogText = chosenEvent.text;
                        if (chosenEvent.isPositive) isPositiveEventActive = true;
                        if (chosenEvent.type === "fog") { fishingWaitTime += 2.0; }
                        if (chosenEvent.type === "weather") {
                            activeWeatherPenalty = chosenEvent.val;
                            if (chosenEvent.val >= 2) fishingWaitTime += 1.5;
                        }
                        if (chosenEvent.type === "bonus") { activeEventModifier = chosenEvent.val; }
                        if (chosenEvent.type === "gold") { coins += chosenEvent.val; saveGame(); }
                        if (chosenEvent.type === "fairy_buff") { guaranteedMaxRoll = true; }
                    }
                }

                if (fishingTimer >= fishingWaitTime) {
                    triggerBite();
                }
            }

            // --- ОБРАБОТКА АНИМАЦИИ КРУЧЕНИЯ КУБИКОВ ---
            if (gameState === "BATTLE" && battleStatus === "ROLLING") {
                if (diceAnimTimer > 0) {
                    diceAnimTimer--;

                    if (diceAnimTimer % 4 === 0) {
                        let pSides = 6;
                        if (paperdoll.rod) {
                            let parts = paperdoll.rod.dice.split('d');
                            pSides = parseInt(parts[1]) || 6; 
                        }
                        playerDiceValues = [];
                        for(let i=0; i<playerDiceCount; i++) {
                            playerDiceValues.push(Math.floor(Math.random() * pSides) + 1);
                        }

                        let fSides = 4;
                        if (currentZone) {
                            let parts = currentZone.dice.split('d');
                            fSides = parseInt(parts[1]) || 4;
                        }
                        fishDiceValues = [];
                        for(let i=0; i<fishDiceCount; i++) {
                            fishDiceValues.push(Math.floor(Math.random() * fSides) + 1);
                        }
                    }

                    if (diceAnimTimer === 0) {
                        let rodDice = paperdoll.rod ? paperdoll.rod.dice : "1d6";
                        let pRoll = 0;

                        let critChance = (talents.critCast || 0) * 0.01
                            + ((paperdoll.gloves && paperdoll.gloves.critBonus) || 0)
                            + ((paperdoll.head && paperdoll.head.critBonus) || 0)
                            + ((paperdoll.line && paperdoll.line.critBonus) || 0);
                        let isCrit = (Math.random() < critChance);

                        if (guaranteedMaxRoll || isCrit) {
                            let parts = rodDice.split('d');
                            pRoll = parseInt(parts[0]) * parseInt(parts[1]); 
                            if (isCrit && !guaranteedMaxRoll) {
                                battleLog = "🎯 КРИТИЧЕСКАЯ ПОДСЕЧКА! Вы идеально рванули удилище! ";
                            }
                        } else {
                            let parts = rodDice.split('d');
                            let count = parseInt(parts[0]);
                            let sides = parseInt(parts[1]);
                            
                            let rerollChance = (talents.rerollOnes || 0) * 0.01; 

                            for(let i = 0; i < count; i++) {
                                let die = Math.floor(Math.random() * sides) + 1;
                                if (die === 1 && Math.random() < rerollChance) {
                                    die = Math.floor(Math.random() * sides) + 1; 
                                }
                                pRoll += die;
                            }
                        }
                        
                        let lineBonus = paperdoll.line ? paperdoll.line.bonus : 0;
                        let glovesBonus = (paperdoll.gloves && paperdoll.gloves.rollBonus) ? paperdoll.gloves.rollBonus : 0;
                        let strongHandBonus = (talents.strongHand || talents.godOfFishing) ? 1 : 0; 
                        
                        playerRollResult = pRoll + lineBonus + glovesBonus + activeEventModifier + strongHandBonus + quietCastBonus;
                        if (quietCastBonus > 0) quietCastBonus = 0;

                        let fRoll = rollDiceStr(currentZone.dice);
                        // Сопротивление рыбы: сложность зоны + шаг редкости (свой для каждой локации).
                        // Легендарку нельзя вытащить слабой снастью: её отсекает ещё и допуск удочки (rarityCap).
                        let fishRank = checkRarityRank(activeFish.rarity);
                        const rankSteps = (currentZone && currentZone.rankSteps) ? currentZone.rankSteps : [0, 1, 2, 3, 4, 5];
                        const zoneDifficulty = (currentZone && currentZone.difficulty) || 0;
                        let weatherPenalty = activeWeatherPenalty;
                        let weatherIgnored = false;
                        if (weatherPenalty > 0 && Math.random() < gearWeatherResist()) {
                            weatherPenalty = 0;
                            weatherIgnored = true;
                        }
                        fishRollResult = fRoll + zoneDifficulty + rankSteps[fishRank] + weatherPenalty;

                        if (playerRollResult > fishRollResult) {
                            battleStatus = "WON";
                            battleLog = (isCrit ? "🎯 " : "") + `Хороший улов! Вы поймали: ${activeFish.name}!`;
                            addItemToInventory(JSON.parse(JSON.stringify(activeFish)));

                            // Двойной улов: шанс мгновенного второго заброса тем же снаряжением
                            const doubleChance = gearDoubleCatchChance();
                            if (doubleChance > 0 && Math.random() < doubleChance) {
                                const secondFish = instantSecondCatch();
                                if (secondFish && addItemToInventory(JSON.parse(JSON.stringify(secondFish)))) {
                                    battleLog += ` 🎣 Двойной улов — вторая рыба: ${secondFish.name}!`;
                                } else {
                                    battleLog += " 🎣 Двойной крючок: вторая рыба сорвалась...";
                                }
                            }

                            // Тихий заброс: шанс получить +3 к следующему броску
                            if (Math.random() < gearQuietCastChance()) {
                                quietCastBonus = 3;
                                battleLog += " 🌊 Тихий заброс: следующий бросок +3.";
                            }
                            if (weatherIgnored) battleLog += " 🌤 Погодное чутьё помогло!";
                            
                            if (!caughtFishList.includes(activeFish.name)) {
                                caughtFishList.push(activeFish.name);
                                let discoveryXP = activeFish.price || 1;
                                addPlayerXP(discoveryXP);
                                eventLogText = `✨ ОТКРЫТ НОВЫЙ ВИД! Получено +${discoveryXP} XP за исследование Топей!`;
                            } else {
                                eventLogText = "";
                            }

                            // Редкий лут: иногда в улове путается чужая сумка
                            if (Math.random() < 0.01) {
                                const pouch = { name: "Плетёный мешочек", type: "bag", icon: "👝", price: 60, slots: 4, rarity: "обычная", count: 1, desc: "Небольшой мешочек из ивовых прутьев. Добавляет 4 ячейки к рюкзаку." };
                                if (addItemToInventory(pouch)) {
                                    eventLogText = (eventLogText ? eventLogText + " " : "") + "👝 В улове запутался чей-то мешочек!";
                                }
                            }

                            if (currentZone.id === 1) stats.zone1Catch++;
                            if (fishRank >= 2 && (currentZone.id === 1 || currentZone.id === 2)) stats.rarePlusCatch++;
                            if (currentZone.id === 3 && activeFish.name === "ЯЗЬ") stats.yazCaughtInZone3 = true;
                            if (fishRank >= 3 && currentZone.id === 4) stats.veryRarePlusZone4Catch++;
                            if (!stats.zonesFished) stats.zonesFished = {};
                            stats.zonesFished[currentZone.id] = (stats.zonesFished[currentZone.id] || 0) + 1;
                            
                            saveGame();
                            showStatusTimer = 120;
                            clearButtons();
                        } 
                        else if (playerRollResult < fishRollResult) {
                            const gripChance = gearSecondChance();
                            if (!secondChanceUsed && gripChance > 0 && Math.random() < gripChance) {
                                // «Подстраховка»: рыба почти сошла, но вы успели подхватить — даём один переброс
                                secondChanceUsed = true;
                                battleStatus = "TIE";
                                battleLog = "🐟 Рыба почти сошла с крючка, но вы успели подхватить! Тяните сильнее!";
                                clearButtons();
                                addButton(310, 420, 180, 45, "💪 Тянуть сильнее!", () => { executeBattleRoll(); }, true, "#aa0000");
                            } else {
                                battleStatus = "LOST";
                                battleLog = `${activeFish.name} яростно сопротивляется... Сорвалась!`;
                                showStatusTimer = 120;
                                clearButtons();
                            }
                        } 
                        else {
                            if (talents.invincible || talents.godOfFishing) {
                                battleStatus = "WON";
                                battleLog = "🛡️ Ничья! Но вы всё равно удержали добычу в руках! Поймана рыбка!";
                                addItemToInventory(JSON.parse(JSON.stringify(activeFish)));
                                saveGame();
                                showStatusTimer = 120;
                                clearButtons();
                            } else {
                                battleStatus = "TIE";
                                battleLog = `Силы равны! Леска натянута до предела! Жми сильнее!`;
                                clearButtons();
                                addButton(310, 420, 180, 45, "💪 Тянуть сильнее!", () => { executeBattleRoll(); }, true, "#aa0000");
                            }
                        }
                    }
                }
            }

            if (gameState === "BATTLE" && battleStatus !== "WAIT" && battleStatus !== "TIE" && battleStatus !== "ROLLING") {
                if (showStatusTimer > 0) {
                    showStatusTimer--;
                    if (showStatusTimer <= 0) {
                        gameState = "FISHING";
                        initFishingZone();
                    }
                }
            }
        } // <--- КОНЕЦ ФУНКЦИИ UPDATE()

        // --- ВСПОМОГАТЕЛЬНАЯ ОТРИСОВКА ГОР И ЛЕСОВ ---
        function mainLoop() {
            update();
            draw();
            requestAnimationFrame(mainLoop);
        }


        initIntro();
        mainLoop();
