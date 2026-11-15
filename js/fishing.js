// ============================================================================
//  fishing.js — ЛОВЛЯ И БОЙ
//  Логика и отрисовка. Данные — в content/.
// ============================================================================
        function initFishingZone() {
            clearButtons();
            
            // Левая кнопка "⬅ На карту" — стоит идеально ровно (X = 20)
            addButton(20, 530, 165, 45, "⬅ На карту", () => { initMap(); });
            
            // Правая кнопка "🎒 Инвентарь" — сдвигаем кликабельную зону в правый угол (X = 615, ширина 165)
            addButton(615, 530, 165, 45, "🎒 Инвентарь", () => {
                gearReturnState = "FISHING";
                gameState = "BAG"; // Переключаем на наш новый экран сумки
                initBag();
            });
            
            // Объявляем проверку открытия водоёма
            let access = checkZoneAccess(currentZone.id);
            
            // Проверяем, надета ли удочка в слот куклы
            let isRodEquipped = (paperdoll.rod !== null && paperdoll.rod !== undefined);
            
            // Центральная кнопка "🎣 Забросить удочку" — центрируем зону (X = 290, ширина 220)
            addButton(290, 530, 220, 45, "🎣 Забросить удочку", () => {
                fishingTimer = 0;
                activeEventModifier = 0; 
                activeWeatherPenalty = 0;
                eventLogText = ""; 
                guaranteedMaxRoll = false; 

                // Высчитываем шанс сохранения расходников от таланта "Экономный ловец" (Путь 4)
                let saveBaitChance = Math.min(0.6, (talents.baitSaver || 0) * 0.04 + gearBaitSaveChance());
                let shouldSaveBait = (Math.random() < saveBaitChance);

                // 1. МЕХАНИКА НАЖИВКИ: Списываем червяка, ЕСЛИ не сработал спас-бросок таланта
                if (paperdoll.bait && paperdoll.bait.count) {
                    if (shouldSaveBait) {
                        eventLogText = "🪱 Наживка осталась на крючке — рука не дрогнула.";
                    } else {
                        paperdoll.bait.count--;
                        if (paperdoll.bait.count <= 0) paperdoll.bait = null;
                    }
                }

                // 2. МЕХАНИКА ПРИКОРМА: Уменьшаем заряды, ЕСЛИ не сработал спас-бросок
                if (activeChum && activeChum.charges > 0) {
                    if (shouldSaveBait) {
                        if (eventLogText === "") {
                            eventLogText = "🥫 Прикорм не размыло течением.";
                        } else {
                            eventLogText = "✨ Невероятная экономность! Сохранены и наживка, и прикорм!";
                        }
                    } else {
                        activeChum.charges--;
                        if (activeChum.charges <= 0) activeChum = null;
                    }
                }
                
                saveGame();

                // 3. МЕХАНИКА СКОРОСТИ: Базовое время + эффект наживки и шляпы
                let baitMod = paperdoll.bait ? paperdoll.bait.timeMod * (1 + gearBaitEffectBonus()) : 0;
                let headMod = (paperdoll.head && paperdoll.head.waitBonus) ? paperdoll.head.waitBonus : 0;
                let baseWait = (6 + Math.random() * 2) * Math.max(0.4, 1 - baitMod - headMod);

                // Применяем талант "Быстрая рука" (Путь 1): -0.3 сек за каждый уровень
                let fastHandBonus = (talents.fastHand || 0) * 0.3;
                baseWait -= fastHandBonus;

                // Ультимативный бонус "Бога Рыбалки": еще -0.5 сек
                if (talents.godOfFishing) baseWait -= 0.5;

                fishingWaitTime = Math.max(1.5, baseWait); // Защита: клёв не может быть быстрее 1.5 сек

                hasEventTriggered = false;
                isPositiveEventActive = false;
                
                if (Math.random() < 0.50) { eventTriggerTime = 0.5; } 
                else { eventTriggerTime = -1; }
                
                gameState = "FISHING_WAIT";
                createSplash(406, 355, "#aadaff", 18);
                clearButtons();
            }, access.allowed && inventory.length < maxInventorySlots && isRodEquipped);
        }

        // Пул улова с учётом этапа, сюжетных предметов и допуска удочки.
        // Используется и в основном забросе, и в «двойном улове».
        function buildCatchPool(zoneId) {
            let pool = fishDatabase[zoneId];
            if (zoneId === 2) {
                const pondPhaseNow = pondState().phase;
                const filtered = pool.filter(f => (f.phase || 1) <= pondPhaseNow);
                if (filtered.length) pool = filtered;

                const questNeeds = activePondNeeds();
                pool = pool.filter(f => {
                    if (!f.questOnly) return true;
                    const need = questNeeds[f.name] || 0;
                    return need > 0 && pondCountInBag(f.name) < need;
                });
            }

            // Болото: сюжетные «уникальные» предметы — только под доступное задание
            if (zoneId === 1) {
                const swampNeeds = activeSwampNeeds();
                pool = pool.filter(f => {
                    if (!f.questOnly) return true;
                    const need = swampNeeds[f.name] || 0;
                    return need > 0 && pondCountInBag(f.name) < need;
                });
            }

            const rodCap = rodRarityCap(paperdoll.rod);
            let allowedByRod;
            if (paperdoll.rod && paperdoll.rod.rarityOnly) {
                allowedByRod = pool.filter(f => f.rarity === paperdoll.rod.rarityOnly);
            } else {
                allowedByRod = pool.filter(f => checkRarityRank(f.rarity) <= rodCap);
            }
            if (allowedByRod.length) pool = allowedByRod;
            return pool;
        }

        // «Двойной улов»: мгновенный второй заброс тем же снаряжением.
        // Возвращает вторую рыбу или null, если она сошла.
        function instantSecondCatch() {
            const pool = buildCatchPool(currentZone.id);
            if (!pool.length) return null;
            const totalW = pool.reduce((s, f) => s + f.weight, 0);
            let roll = Math.random() * totalW;
            let fish = pool[pool.length - 1];
            for (const f of pool) {
                roll -= f.weight;
                if (roll <= 0) { fish = f; break; }
            }
            const rodDice = paperdoll.rod ? paperdoll.rod.dice : "1d6";
            const player = rollDiceStr(rodDice)
                + (paperdoll.line && paperdoll.line.bonus ? paperdoll.line.bonus : 0)
                + (paperdoll.gloves && paperdoll.gloves.rollBonus ? paperdoll.gloves.rollBonus : 0)
                + ((talents.strongHand || talents.godOfFishing) ? 1 : 0);
            const steps = (currentZone && currentZone.rankSteps) ? currentZone.rankSteps : [0, 1, 2, 3, 4, 5];
            const fishRoll = rollDiceStr(currentZone.dice)
                + ((currentZone && currentZone.difficulty) || 0)
                + steps[checkRarityRank(fish.rarity)]
                + activeWeatherPenalty;
            return player > fishRoll ? fish : null;
        }

        // Какие предметы нужны активным заданиям Болота прямо сейчас.
        // Сюжетные «уникальные» вещи попадаются только под доступное задание.
        function activeSwampNeeds() {
            const needs = {};
            if (!currentZone || currentZone.id !== 1) return needs;
            const add = (q) => {
                if (!q) return;
                needs[q.target] = Math.max(needs[q.target] || 0, q.count || 1);
            };
            const chains = [
                ["culinary", "chainCulinary"],
                ["history", "chainHistory"],
                ["global", "chainGlobal"],
                ["mythic", "chainMythic"],
                ["rareElder", "chainRareElder"]
            ];
            for (const [key, prop] of chains) {
                if (key === "mythic" && !talents.flawlessReputation) continue;
                const step = questProgress[prop] || 1;
                add(questDatabase[key] && questDatabase[key][step]);
            }
            questDatabase.sides.forEach(q => {
                if (questProgress.completedSides.indexOf(q.id) < 0) add(q);
            });
            if (questProgress.repeatedSeed) {
                add(repeatedQuestsPool.find(q => q.id === questProgress.repeatedSeed));
            }
            return needs;
        }

        function triggerBite() {
            gameState = "BATTLE";
            battleLog = "Что-то клюнуло! Потяни удилище!";
            battleStatus = "WAIT";
            playerRollResult = null;
            fishRollResult = null;

            let pool = buildCatchPool(currentZone.id);

            let totalWeight = 0;
            
            // Расчет бонусов на ценную рыбу (Необычная+)
            // Крючок даёт фиксированный процент к весу «необычной+» рыбы (старые сейвы — по имени).
            let hookWeightBonus = 0;
            if (paperdoll.hook) {
                hookWeightBonus = paperdoll.hook.nonCommonWeightBonus;
                if (hookWeightBonus === undefined) hookWeightBonus = (paperdoll.hook.name === "Самодельный крючок") ? 0.10 : 0;
            }
            let hookBonusMultiplier = 1.0 + hookWeightBonus;
            let bootsBonusMultiplier = 1.0 + (paperdoll.boots && paperdoll.boots.rareWeightBonus ? paperdoll.boots.rareWeightBonus : 0);

            // Считаем проценты по новому балансу: "Приманка" (2% за ур.) + "Охотник за Ценностями" (2% за ур.)
            let minorTalentBonusPercent = ((talents.goodBait || 0) * 0.02) + ((talents.valuableCatch || 0) * 0.02); // Макс: +20%
                        
            // Добавляем +5% от Бога Рыбалки
            if (talents.godOfFishing) minorTalentBonusPercent += 0.05;

            let talentMultiplier = 1.0 + minorTalentBonusPercent;

            let tempPool = pool.map(fish => {
                let modifiedWeight = fish.weight;
                const rank = checkRarityRank(fish.rarity);
                
                // Ценная рыба (необычная+) ловится чаще от крючка и талантов,
                // а «редкая+» — ещё и от сапог.
                if (rank >= 1) {
                    modifiedWeight *= hookBonusMultiplier;
                    modifiedWeight *= talentMultiplier;
                }
                if (rank >= 2) modifiedWeight *= bootsBonusMultiplier;
                return { fishRef: fish, weight: modifiedWeight };
            });

            tempPool.forEach(item => totalWeight += item.weight);

            // Прикорм: с шансом подсовывает рыбу конкретной редкости (если удочка её допускает).
            let forcedFish = null;
            if (activeChum && activeChum.charges > 0) {
                const targetPool = pool.filter(f => f.rarity === activeChum.rarity);
                if (targetPool.length && Math.random() < activeChum.chance) {
                    const targetWeight = targetPool.reduce((s, f) => s + f.weight, 0);
                    let roll = Math.random() * targetWeight;
                    forcedFish = targetPool[targetPool.length - 1];
                    for (const f of targetPool) {
                        roll -= f.weight;
                        if (roll <= 0) { forcedFish = f; break; }
                    }
                }
            }

            if (forcedFish) {
                activeFish = forcedFish;
            } else {
                let randomWeightNum = Math.random() * totalWeight;
                let weightCounter = 0;
                activeFish = pool[0];
                for (let i = 0; i < tempPool.length; i++) {
                    weightCounter += tempPool[i].weight;
                    if (randomWeightNum <= weightCounter) {
                        activeFish = tempPool[i].fishRef;
                        break;
                    }
                }
            }

            // Процентный бонус снаряжения: шанс, что рыба окажется рангом выше
            const rarityUp = gearRarityUpChance();
            if (rarityUp > 0 && Math.random() < rarityUp) {
                const curRank = checkRarityRank(activeFish.rarity);
                const higher = pool.filter(f => checkRarityRank(f.rarity) === curRank + 1);
                if (higher.length) {
                    const higherWeight = higher.reduce((s, f) => s + f.weight, 0);
                    let roll = Math.random() * higherWeight;
                    let picked = higher[higher.length - 1];
                    for (const f of higher) {
                        roll -= f.weight;
                        if (roll <= 0) { picked = f; break; }
                    }
                    activeFish = picked;
                    eventLogText = "✨ Чутьё подсказывает: на крючке рыба покрупнее!";
                }
            }

            secondChanceUsed = false;
            clearButtons();
            addButton(320, 420, 160, 45, "⚔ Подсечь!", () => {
                executeBattleRoll();
            });
        }

        function executeBattleRoll() {
            // Узнаем количество кубов игрока из надетой удочки
            if (paperdoll.rod) {
                playerDiceCount = parseInt(paperdoll.rod.dice.split('d')[0]);
            } else {
                playerDiceCount = 1;
            }
            // Узнаем количество кубов рыбы из локации
            fishDiceCount = parseInt(currentZone.dice.split('d')[0]);

            // Включаем таймер анимации вращения кубиков на 60 кадров (1 секунда)
            diceAnimTimer = 60;
            battleStatus = "ROLLING"; 
            battleLog = "Кости брошены! Судьба решается...";
            
            clearButtons(); // Блокируем интерфейс на время кручения кубов
        }
