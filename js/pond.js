// ============================================================================
//  pond.js — КВЕСТЫ ПРУДА: логика доски и её отрисовка
//  Логика и отрисовка. Данные — в content/.
// ============================================================================
        function pondDefaultState() {
            return {
                phase: 1,
                chains: { school: [1, 1, 1], village: [1, 1, 1] },
                sides: [],
                contracts: { school: [], village: [] },
                rare: { school: 1, village: 1 },
                director: 1
            };
        }

        function pondState() {
            if (!questProgress.pond || typeof questProgress.pond !== "object") questProgress.pond = pondDefaultState();
            const st = questProgress.pond;
            if (typeof st.phase !== "number" || st.phase < 1) st.phase = 1;
            if (!st.chains || typeof st.chains !== "object") st.chains = pondDefaultState().chains;
            if (!Array.isArray(st.chains.school) || st.chains.school.length !== 3) st.chains.school = [1, 1, 1];
            if (!Array.isArray(st.chains.village) || st.chains.village.length !== 3) st.chains.village = [1, 1, 1];
            if (!Array.isArray(st.sides)) st.sides = [];
            if (!st.contracts || typeof st.contracts !== "object") st.contracts = { school: [], village: [] };
            if (!Array.isArray(st.contracts.school)) st.contracts.school = [];
            if (!Array.isArray(st.contracts.village)) st.contracts.village = [];
            if (!st.rare || typeof st.rare !== "object") st.rare = { school: 1, village: 1 };
            if (typeof st.rare.school !== "number") st.rare.school = 1;
            if (typeof st.rare.village !== "number") st.rare.village = 1;
            if (typeof st.director !== "number") st.director = 1;
            return st;
        }

        function pondCountInBag(name) {
            let total = 0;
            inventory.forEach(slot => { if (slot && slot.name === name) total += (slot.count || 1); });
            return total;
        }

        // Какие предметы нужны активным заданиям Пруда прямо сейчас (с учётом этапа).
        // Нужно, чтобы сюжетные «уникальные» предметы попадались только под задание.
        function activePondNeeds() {
            const needs = {};
            if (!currentZone || currentZone.id !== 2) return needs;
            const st = pondState();
            const add = (q) => {
                if (!q) return;
                if (q.phase === 2 && st.phase < 2) return;
                needs[q.target] = Math.max(needs[q.target] || 0, q.count || 1);
            };
            for (const fac of ["school", "village"]) {
                const P = POND_QUESTS[fac];
                P.chains.forEach((chain, ci) => add(chain.quests[st.chains[fac][ci] - 1]));
                P.sides.forEach(q => { if (st.sides.indexOf(q.id) < 0) add(q); });
                (st.contracts[fac] || []).forEach(id => add(P.contracts.find(q => q.id === id)));
                const rareIdx = st.rare[fac] - 1;
                if (rareIdx >= 0 && rareIdx < P.rare.length) add(P.rare[rareIdx]);
            }
            const dirIdx = st.director - 1;
            if (dirIdx >= 0 && dirIdx < POND_QUESTS.director.length) add(POND_QUESTS.director[dirIdx]);
            return needs;
        }

        function pondEnsureContracts(fac) {
            const st = pondState();
            const pool = POND_QUESTS[fac].contracts.filter(q => q.phase <= st.phase);
            let arr = st.contracts[fac].filter(id => pool.some(q => q.id === id));
            let guard = 0;
            while (arr.length < 3 && guard++ < 200) {
                const cands = pool.filter(q => arr.indexOf(q.id) < 0);
                if (!cands.length) break;
                arr.push(cands[Math.floor(Math.random() * cands.length)].id);
            }
            st.contracts[fac] = arr;
        }

        function pondQuestIcon(name) {
            const found = (fishDatabase[2] || []).find(f => f.name === name);
            return found ? found.icon : "⚔️";
        }

        // Собирает список карточек для текущей вкладки/подвкладки
        function pondBuildEntries() {
            const st = pondState();
            const list = [];

            if (pondTab === "director") {
                if (st.phase < 2) return [];
                POND_QUESTS.director.forEach((q, i) => {
                    const stepIndex = i + 1;
                    let state;
                    if (stepIndex < st.director) state = "done";
                    else if (stepIndex > st.director) state = "locked";
                    else state = (pondCountInBag(q.target) >= q.count) ? "ready" : "progress";
                    list.push({ kind: "director", faction: "director", data: q, stepIndex: stepIndex, currentStep: st.director, total: POND_QUESTS.director.length, state: state });
                });
                return list;
            }

            const fac = pondTab;

            if (pondSub === "chains") {
                POND_QUESTS[fac].chains.forEach((chain, ci) => {
                    const cur = st.chains[fac][ci];
                    const total = chain.quests.length;
                    if (cur > total) {
                        list.push({ kind: "chain", faction: fac, chain: chain, chainIndex: ci, data: chain.quests[total - 1], stepIndex: total, currentStep: total + 1, total: total, state: "done" });
                    } else {
                        const q = chain.quests[cur - 1];
                        const state = (q.phase === 2 && st.phase < 2) ? "phase" : ((pondCountInBag(q.target) >= q.count) ? "ready" : "progress");
                        list.push({ kind: "chain", faction: fac, chain: chain, chainIndex: ci, data: q, stepIndex: cur, currentStep: cur, total: total, state: state });
                    }
                });
                return list;
            }

            if (pondSub === "sides") {
                POND_QUESTS[fac].sides.forEach(q => {
                    let state;
                    if (st.sides.indexOf(q.id) >= 0) state = "done";
                    else if (q.phase === 2 && st.phase < 2) state = "phase";
                    else state = (pondCountInBag(q.target) >= q.count) ? "ready" : "progress";
                    list.push({ kind: "side", faction: fac, data: q, state: state });
                });
                return list;
            }

            if (pondSub === "contracts") {
                pondEnsureContracts(fac);
                st.contracts[fac].forEach(id => {
                    const q = POND_QUESTS[fac].contracts.find(x => x.id === id);
                    if (!q) return;
                    const state = (q.phase === 2 && st.phase < 2) ? "phase" : ((pondCountInBag(q.target) >= q.count) ? "ready" : "progress");
                    list.push({ kind: "contract", faction: fac, data: q, state: state });
                });
                return list;
            }

            // ★ Редкие цепочки — только с великим талантом «Доверие Гильдии»
            if (!talents.bigBag) {
                list.push({ kind: "rareinfo", faction: fac, data: null, state: "rare_locked" });
                return list;
            }
            POND_QUESTS[fac].rare.forEach((q, i) => {
                const stepIndex = i + 1;
                let state;
                if (stepIndex < st.rare[fac]) state = "done";
                else if (stepIndex > st.rare[fac]) state = "locked";
                else state = (q.phase === 2 && st.phase < 2) ? "phase" : ((pondCountInBag(q.target) >= q.count) ? "ready" : "progress");
                list.push({ kind: "rare", faction: fac, data: q, stepIndex: stepIndex, currentStep: st.rare[fac], total: POND_QUESTS[fac].rare.length, state: state });
            });
            return list;
        }

        function pondStatusStyle(state, entry) {
            if (state === "done") return { text: "✅ Выполнено", color: "#7bd88f" };
            if (state === "ready") return { text: "✅ Можно сдать", color: "#9ff5a8" };
            if (state === "phase") return { text: "🔒 Недоступно на данном этапе", color: "#9aa7bd" };
            if (state === "locked") return { text: "🔒 Закрыто", color: "#8899aa" };
            if (state === "rare_locked") return { text: "🔒 Недоступно", color: "#9aa7bd" };
            const have = entry && entry.data ? pondCountInBag(entry.data.target) : 0;
            const need = entry && entry.data ? entry.data.count : 0;
            return { text: "📦 " + have + " / " + need, color: "#ffcc66" };
        }

        function pondSay(msg, ms) {
            pondFlash = msg;
            pondFlashUntil = Date.now() + (ms || 5000);
        }

        // ---------------- Навигация и кнопки ----------------

        function initPondBoard(tab, sub) {
            gameState = "PONDBOARD";
            if (tab) pondTab = tab;
            if (typeof sub === "string") pondSub = sub;
            if (pondTab === "director") pondSub = "chains";
            pondPage = 0;
            pondActiveQuest = null;
            pondRebuildButtons();
        }

        function pondRebuildButtons() {
            buttons = [];
            clearButtons();

            if (pondActiveQuest) { pondDetailButtons(); return; }

            // Вкладки фракций
            POND_FACTIONS.forEach((f, i) => {
                addButton(32 + i * 250, 92, 236, 30, f.label, () => {
                    pondTab = f.id;
                    pondSub = "chains";
                    pondPage = 0;
                    pondActiveQuest = null;
                    pondRebuildButtons();
                }, true, pondTab === f.id ? "#6d4f18" : "#1a2340");
            });

            // Подвкладки категорий
            if (pondTab !== "director") {
                POND_SUBTABS.forEach((s, i) => {
                    addButton(32 + i * 182, 128, 174, 28, s.label, () => {
                        pondSub = s.id;
                        pondPage = 0;
                        pondActiveQuest = null;
                        pondRebuildButtons();
                    }, true, pondSub === s.id ? "#2f5a3a" : "#1a2340");
                });
            }

            // Карточки
            const entries = pondBuildEntries();
            const maxPage = Math.max(1, Math.ceil(entries.length / POND_PAGE_SIZE));
            if (pondPage > maxPage - 1) pondPage = maxPage - 1;
            if (pondPage < 0) pondPage = 0;

            const shown = entries.slice(pondPage * POND_PAGE_SIZE, pondPage * POND_PAGE_SIZE + POND_PAGE_SIZE);
            shown.forEach((e, i) => {
                addButton(32, 166 + i * 60, 736, 54, "", () => {
                    if (e.state === "rare_locked" || e.state === "phase") return;
                    pondActiveQuest = e;
                    pondDetailPage = 0;
                    pondRebuildButtons();
                }, true, "rgba(0,0,0,0)");
            });

            // Пагинация
            if (maxPage > 1) {
                addButton(452, 466, 58, 32, "◀", () => { if (pondPage > 0) { pondPage--; pondRebuildButtons(); } }, pondPage > 0, "#1a2340");
                addButton(700, 466, 58, 32, "▶", () => { if (pondPage < maxPage - 1) { pondPage++; pondRebuildButtons(); } }, pondPage < maxPage - 1, "#1a2340");
            }

            addButton(20, 530, 180, 45, "⬅ В хаб", () => {
                pondActiveQuest = null;
                gameState = "HUB";
                initHub();
            }, true, "#111166");

            addButton(615, 530, 165, 45, "🎒 Инвентарь", () => {
                gearReturnState = "PONDBOARD";
                gameState = "BAG";
                initBag();
            }, true, "#111166");
        }

        function pondDetailButtons() {
            const e = pondActiveQuest;

            addButton(20, 530, 190, 45, "⬅ Назад к доске", () => {
                pondActiveQuest = null;
                pondRebuildButtons();
            }, true, "#111166");

            if (!e || !e.data) return;

            // Постраничный просмотр длинных историй
            const pages = pondDetailPages(e.data);
            if (pages.length > 1) {
                addButton(320, 530, 50, 45, "◀", () => {
                    if (pondDetailPage > 0) { pondDetailPage--; pondRebuildButtons(); }
                }, pondDetailPage > 0, "#3b2a18");
                addButton(500, 530, 50, 45, "▶", () => {
                    if (pondDetailPage < pages.length - 1) { pondDetailPage++; pondRebuildButtons(); }
                }, pondDetailPage < pages.length - 1, "#3b2a18");
            }

            const canTurnIn = (e.state === "ready");
            const available = (e.state === "ready" || e.state === "progress");
            if (!available) return;

            addButton(590, 530, 190, 45, canTurnIn ? "✅ Сдать заказ" : "🔒 Сдать заказ", () => {
                if (!canTurnIn) return;
                pondTurnIn(e);
            }, canTurnIn, "#225522");
        }

        // ---------------- Сдача квеста ----------------

        function pondTurnIn(entry) {
            const q = entry.data;
            const st = pondState();
            let academyUnlocked = false;

            if (pondCountInBag(q.target) < q.count) return;

            // Предметные награды: проверяем, хватит ли места после списания цели
            const rewardItems = Array.isArray(q.rewardItems) ? q.rewardItems : [];
            let freedSlots = 0, stillNeeded = q.count;
            for (const slot of inventory) {
                if (slot && slot.name === q.target) {
                    const have = slot.count || 1;
                    if (have <= stillNeeded) { freedSlots++; stillNeeded -= have; }
                }
                if (stillNeeded <= 0) break;
            }
            if (inventory.length - freedSlots + rewardItems.length > maxInventorySlots) {
                pondSay("🎒 Нет места для награды. Освободите сумку.");
                return;
            }

            // Списываем предметы из сумки
            let need = q.count;
            for (let i = inventory.length - 1; i >= 0 && need > 0; i--) {
                const slot = inventory[i];
                if (!slot || slot.name !== q.target) continue;
                const have = slot.count || 1;
                if (have > need) { slot.count -= need; need = 0; }
                else { need -= have; inventory.splice(i, 1); }
            }

            // Награда с учётом таланта «Мастер Контрактов» (+3% за уровень)
            const mult = 1.0 + ((talents.questMaster || 0) * 0.03);
            const goldGain = Math.floor(q.gold * mult);
            const xpGain = Math.floor(q.xp * mult);
            coins += goldGain;
            totalEarned += goldGain;
            addPlayerXP(xpGain);

            // Предметные награды задания
            rewardItems.forEach(tpl => {
                const rewardItem = JSON.parse(JSON.stringify(tpl));
                if (!addItemToInventory(rewardItem)) {
                    gameAlert(`🎒 Награда «${rewardItem.name}» не поместилась в сумку.`);
                }
            });

            let phaseTriggered = false;

            if (entry.kind === "chain") {
                st.chains[entry.faction][entry.chainIndex]++;
                if (q.id === "sch_c3_3") { st.phase = 2; phaseTriggered = true; }
            } else if (entry.kind === "side") {
                if (st.sides.indexOf(q.id) < 0) st.sides.push(q.id);
            } else if (entry.kind === "contract") {
                const arr = st.contracts[entry.faction];
                const idx = arr.indexOf(q.id);
                if (idx >= 0) arr.splice(idx, 1);
                pondEnsureContracts(entry.faction);
            } else if (entry.kind === "rare") {
                st.rare[entry.faction]++;
            } else if (entry.kind === "director") {
                st.director++;
                if (q.id === "dir_4") {
                    // Рекомендательное письмо Директора открывает путь к Озеру возле академии
                    questProgress.academyOpen = true;
                    academyUnlocked = true;
                }
            }

            pondActiveQuest = null;
            saveGame();

            pondSay(`✅ «${q.name}» сдано: +${goldGain} 🪙, +${xpGain} XP`);

            if (phaseTriggered) {
                gameAlert("💥 Подземный толчок! Контур сдерживания отключён.\n\n" +
                      "Вода в пруду идёт фиолетовыми искрами. В водоёме появились новые обитатели, " +
                      "а на досках заказов открылись новые заказы.\n\n" +
                      "Завуч впала в ступор от ужаса. Бюрократия не знает, что делать.");
            }

            if (academyUnlocked) {
                gameAlert("🎓 Рекомендательное письмо с печатью Директора получено!\n\n" +
                      "Дорога к «Озеру возле академии» открыта на глобальной карте. " +
                      "Ворота Академии ждут своего рыбака.");
            }

            pondRebuildButtons();
        }

        // ---------------- Отрисовка ----------------

        function pondFit(text, maxW, font) {
            ctx.font = font;
            if (ctx.measureText(text).width <= maxW) return text;
            let t = text;
            while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
            return t + "…";
        }

        function pondWrap(text, maxW, font) {
            ctx.font = font;
            const words = String(text).split(" ");
            const lines = [];
            let cur = "";
            words.forEach(w => {
                const test = cur ? cur + " " + w : w;
                if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
                else { cur = test; }
            });
            if (cur) lines.push(cur);
            return lines;
        }

        const POND_DETAIL_MAX_LINES = 12;

        function pondDetailPages(q) {
            const bodyFont = "bold 13px system-ui";
            const lines = pondWrap("«" + q.text + "»", 700, bodyFont);
            const pages = [];
            for (let i = 0; i < lines.length; i += POND_DETAIL_MAX_LINES) {
                pages.push(lines.slice(i, i + POND_DETAIL_MAX_LINES));
            }
            return pages.length ? pages : [[""]];
        }

        function pondEntrySubtitle(e) {            if (e.kind === "chain") return `${e.chain.name} — этап ${e.stepIndex} из ${e.total}`;
            if (e.kind === "rare") return `★ Редкая цепочка — этап ${e.stepIndex} из ${e.total}`;
            if (e.kind === "director") return `Сюжетная линия Директора — этап ${e.stepIndex} из ${e.total}`;
            if (e.kind === "contract") return "Повторяющийся контракт";
            if (e.kind === "side") return e.data.giver ? e.data.giver : "Поручение";
            return "";
        }

        function drawPondBoard() {
            ctx.fillStyle = "#0a1018";
            ctx.fillRect(0, 0, 800, 600);

            const st = pondState();
            drawWindow(15, 45, 770, 468, "🏫 Доска заказов — Школьный пруд");

            ctx.textAlign = "right";
            ctx.font = "bold 12px system-ui";
            ctx.fillStyle = st.phase === 2 ? "#d9a6ff" : "#ffe9a8";
            ctx.fillText(st.phase === 2 ? "✨ Вода искрится маной" : "🌊 Вода спокойна", 755, 78);
            ctx.fillStyle = "#ffe9a8";
            ctx.fillText(`🪙 ${coins}`, 470, 78);
            ctx.textAlign = "left";

            if (pondTab === "director" && st.phase < 2) {
                ctx.font = "bold 15px system-ui";
                ctx.fillStyle = "#cfd8e6";
                ctx.fillText("🚪 Кабинет Директора закрыт.", 60, 200);
                ctx.font = "13px system-ui";
                ctx.fillStyle = "#9aa7bd";
                ctx.fillText("Директор примет вас только после того, как", 60, 232);
                ctx.fillText("в пруду произойдут перемены.", 60, 252);
                drawButtons();
                return;
            }

            const entries = pondBuildEntries();
            const shown = entries.slice(pondPage * POND_PAGE_SIZE, pondPage * POND_PAGE_SIZE + POND_PAGE_SIZE);

            if (!shown.length) {
                ctx.font = "bold 14px system-ui";
                ctx.fillStyle = "#9aa7bd";
                ctx.fillText("Здесь пока пусто.", 60, 210);
            }

            shown.forEach((e, i) => {
                const y = 166 + i * 60;
                const hover = mouseX >= 32 && mouseX <= 768 && mouseY >= y && mouseY <= y + 54;

                let bg = "#12203a";
                if (e.state === "done") bg = "#16281c";
                else if (e.state === "ready") bg = "#1c3a24";
                else if (e.state === "locked" || e.state === "phase" || e.state === "rare_locked") bg = "#171b24";

                ctx.fillStyle = bg;
                ctx.fillRect(32, y, 736, 54);
                ctx.strokeStyle = hover ? "#ffffff" : "#2b3f63";
                ctx.lineWidth = 2;
                ctx.strokeRect(32, y, 736, 54);

                if (e.kind === "rareinfo") {
                    ctx.textAlign = "left";
                    ctx.font = "bold 13px system-ui";
                    ctx.fillStyle = "#cfd8e6";
                    ctx.fillText("★ Редкие цепочки закрыты", 50, y + 23);
                    ctx.font = "11px system-ui";
                    ctx.fillStyle = "#9aa7bd";
                    ctx.fillText("Нужна рекомендация Гильдии рыболовов: её дают за верную службу.", 50, y + 42);
                    return;
                }

                // Иконка
                ctx.textAlign = "left";
                ctx.font = "22px Arial";
                ctx.fillStyle = "#ffffff";
                ctx.fillText(e.state === "phase" ? "❔" : pondQuestIcon(e.data.target), 48, y + 36);

                // Название
                const titleFont = "bold 13px system-ui";
                ctx.font = titleFont;
                ctx.fillStyle = e.state === "locked" || e.state === "phase" ? "#7c8798" : "#f2f6ff";
                ctx.fillText(pondFit(e.data.name, 430, titleFont), 84, y + 23);

                // Подзаголовок
                ctx.font = "11px system-ui";
                ctx.fillStyle = e.state === "done" ? "#7bd88f" : "#8fa3c4";
                ctx.fillText(pondFit(pondEntrySubtitle(e), 430, "11px system-ui"), 84, y + 42);

                // Награда — не показываем у недоступных заказов, чтобы не спойлерить
                if (e.state !== "phase") {
                    ctx.textAlign = "right";
                    ctx.font = "bold 12px system-ui";
                    ctx.fillStyle = "#ffd479";
                    ctx.fillText(`+${e.data.gold} 🪙  ·  +${e.data.xp} XP`, 754, y + 21);
                }

                // Статус (бейдж)
                ctx.textAlign = "right";
                const stStyle = pondStatusStyle(e.state, e);
                ctx.font = "bold 11px system-ui";
                const stW = ctx.measureText(stStyle.text).width;
                ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
                ctx.fillRect(754 - stW - 10, y + 29, stW + 14, 18);
                ctx.fillStyle = stStyle.color;
                ctx.fillText(stStyle.text, 754 - 3, y + 43);
                ctx.textAlign = "left";
            });

            // Счётчик страниц
            const maxPage = Math.max(1, Math.ceil(entries.length / POND_PAGE_SIZE));
            if (maxPage > 1) {
                ctx.textAlign = "center";
                ctx.font = "bold 12px system-ui";
                ctx.fillStyle = "#cfd8e6";
                ctx.fillText(`${pondPage + 1} / ${maxPage}`, 605, 488);
                ctx.textAlign = "left";
            }

            // Подсказка / флеш-сообщение
            ctx.font = "11px system-ui";
            if (pondFlash && Date.now() < pondFlashUntil) {
                ctx.fillStyle = "#9ff5a8";
                ctx.fillText(pondFit(pondFlash, 700, "11px system-ui"), 36, 506);
            } else {
                ctx.fillStyle = "#7c8798";
                ctx.fillText("Нажмите на заказ, чтобы прочитать историю и сдать предметы.", 36, 506);
            }

            drawButtons();
        }

        function drawPondDetail() {
            const e = pondActiveQuest;
            const q = e.data;

            const have = pondCountInBag(q.target);
            const stStyle = pondStatusStyle(e.state, e);

            ctx.fillStyle = "#f3e8c9";
            ctx.fillRect(20, 70, 760, 435);
            ctx.strokeStyle = "#5c3d2e";
            ctx.lineWidth = 4;
            ctx.strokeRect(20, 70, 760, 435);
            ctx.strokeStyle = "#8a6242";
            ctx.lineWidth = 1;
            ctx.strokeRect(25, 75, 750, 425);

            ctx.textAlign = "left";
            ctx.fillStyle = "#1e120b";
            ctx.font = "bold 17px system-ui";
            ctx.fillText("📜 " + pondFit(q.name, 700, "bold 17px system-ui"), 45, 106);

            ctx.font = "italic 12px system-ui";
            ctx.fillStyle = "#6b4a2f";
            const sub = pondEntrySubtitle(e);
            if (sub) ctx.fillText(pondFit(sub, 700, "italic 12px system-ui"), 45, 128);

            ctx.fillStyle = "rgba(92, 61, 46, 0.25)";
            ctx.fillRect(45, 138, 710, 2);

            // Основной текст истории (постранично)
            const bodyFont = "bold 13px system-ui";
            ctx.font = bodyFont;
            ctx.fillStyle = "#2d1e18";
            const pages = pondDetailPages(q);
            const pageIdx = Math.min(Math.max(0, pondDetailPage), pages.length - 1);
            const shownLines = pages[pageIdx];
            shownLines.forEach((ln, k) => ctx.fillText(ln, 45, 168 + k * 19));

            // Событие
            let extraY = 168 + shownLines.length * 19 + 8;
            if (q.event && extraY < 400) {
                ctx.font = "italic 12px system-ui";
                ctx.fillStyle = "#8a3b12";
                const evLines = pondWrap("⚡ " + q.event, 700, "italic 12px system-ui").slice(0, 2);
                evLines.forEach((ln, k) => ctx.fillText(ln, 45, extraY + k * 17));
            }

            // Индикатор страницы
            if (pages.length > 1) {
                ctx.textAlign = "center";
                ctx.font = "bold 12px system-ui";
                ctx.fillStyle = "#8a6242";
                ctx.fillText(`${pageIdx + 1} / ${pages.length}`, 440, 552);
                ctx.textAlign = "left";
            }

            // Цель и награда
            ctx.fillStyle = "rgba(92, 61, 46, 0.25)";
            ctx.fillRect(45, 440, 710, 2);

            ctx.font = "bold 13px system-ui";
            ctx.fillStyle = have >= q.count ? "#1b5e20" : "#b71c1c";
            ctx.fillText(`Цель: ${q.target} — ${q.count} шт.  (в рюкзаке: ${have})`, 45, 462);

            ctx.fillStyle = "#795548";
            ctx.font = "bold 13px system-ui";
            ctx.fillText(`Награда: ${q.gold} 🪙  ·  ${q.xp} XP`, 45, 486);

            const pondRewardText = questRewardText(q);
            if (pondRewardText) {
                ctx.fillStyle = "#1b5e20";
                ctx.font = "bold 11px system-ui";
                ctx.fillText(pondRewardText, 45, 508);
            }

            ctx.textAlign = "right";
            ctx.fillStyle = stStyle.color === "#ffcc66" ? "#8a6242" : "#1b5e20";
            ctx.fillText(stStyle.text, 750, 486);
            ctx.textAlign = "left";

            drawButtons();
        }

        function drawPondScreen() {
            ctx.fillStyle = "#0a1018";
            ctx.fillRect(0, 0, 800, 600);
            if (pondActiveQuest && pondActiveQuest.data) {
                drawPondDetail();
            } else {
                drawPondBoard();
            }
        }

// --- ИНИЦИАЛИЗАЦИЯ ХАБА ---
