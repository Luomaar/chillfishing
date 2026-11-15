// ============================================================================
//  draw.js — ОТРИСОВКА: интерфейс, карта, хаб, draw()
//  Логика и отрисовка. Данные — в content/.
// ============================================================================
        function drawTextWithShadow(text, x, y, font, color, maxLineWidth = 700, lineHeight = 22) {
            ctx.font = font;
            ctx.textAlign = "left";

            // ЗАЩИТА ОТ ЗАВИСАНИЯ: Если текст пустой, равен null или undefined, превращаем его в пустую строку
            if (!text) text = ""; 
            
            // На всякий случай переводим в строку, если передали число
            text = text.toString(); 

            let words = text.split(" ");
            let lines = [];
            let currentLine = "";

            for (let i = 0; i < words.length; i++) {
                let testLine = currentLine + words[i] + " ";
                let metrics = ctx.measureText(testLine);
                let testWidth = metrics.width;

                if (testWidth > maxLineWidth && i > 0) {
                    lines.push(currentLine);
                    currentLine = words[i] + " ";
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine); 

            for (let j = 0; j < lines.length; j++) {
                let lineY = y + (j * lineHeight);

                ctx.fillStyle = "#000000";
                ctx.fillText(lines[j], x - 1, lineY - 1);
                ctx.fillText(lines[j], x + 1, lineY - 1);
                ctx.fillText(lines[j], x - 1, lineY + 1);
                ctx.fillText(lines[j], x + 1, lineY + 1);

                ctx.fillStyle = color;
                ctx.fillText(lines[j], x, lineY);
            }
        }

        function drawWindow(x, y, w, h, title = "") {
            ctx.fillStyle = "#000088";
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
            
            if (title) {
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 16px 'Courier New'";
                ctx.fillText(title, x + 15, y + 25);
                ctx.beginPath();
                ctx.moveTo(x + 4, y + 35);
                ctx.lineTo(x + w - 4, y + 35);
                ctx.stroke();
            }
        }

        function drawPixelBackground(type) {
            if (type === "INTRO") {
                ctx.fillStyle = "#112233"; ctx.fillRect(0,0,800,600);
                ctx.fillStyle = "#1a334d"; for(let i=0; i<600; i+=40){ ctx.fillRect(0,i,800,20); }
            } else if (type === "MAP") {
                ctx.fillStyle = "#336633"; ctx.fillRect(0,0,800,600); 
                ctx.fillStyle = "#1f3d7a"; ctx.fillRect(0,380,800,220);
                ctx.strokeStyle = "rgba(255,255,255,0.05)";
                ctx.lineWidth = 2;
                for(let i=0; i<800; i+=32) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,600); ctx.stroke(); }
                for(let j=0; j<600; j+=32) { ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(800,j); ctx.stroke(); }
            } else if (type === "BATTLE") {
                ctx.fillStyle = "#111122"; ctx.fillRect(0,0,800,600);
                ctx.fillStyle = "#222244"; ctx.fillRect(0,180,800,150); 
            }
        }

        function drawButtons() {
            buttons.forEach(btn => {
                // Если кнопка неактивна — красим её в темно-серый цвет
                if (!btn.active) ctx.fillStyle = "#2d3436";
                else ctx.fillStyle = btn.color;
                
                ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
                
                // Полностью прозрачные кнопки-«зоны клика» рамку не рисуют
                if (btn.color === "rgba(0,0,0,0)") return;
                
                // Рамка заблокированной кнопки тоже становится тусклой
                ctx.strokeStyle = btn.active ? "#ffffff" : "#636e72";
                ctx.lineWidth = 2;
                ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
                
                // Текст заблокированной кнопки делаем серым
                ctx.fillStyle = btn.active ? "#ffffff" : "#636e72";
                ctx.font = "bold 12px 'Courier New'";
                ctx.textAlign = "center";
                ctx.fillText(btn.text, btn.x + btn.w/2, btn.y + btn.h/2 + 5);
            });
            ctx.textAlign = "left"; // сброс
        }

        function drawUIPanel() {
            // Рисуем верхнюю синюю статус-панель
            drawWindow(15, 10, 770, 40);
            
            ctx.font = "bold 12px system-ui";
            
            // --- ЛЕВАЯ ЧАСТЬ: Вместимость сумки ---
            ctx.textAlign = "left";
            ctx.fillStyle = "#000000";
            ctx.fillText(`🎒 Сумка: ${inventory.length} / ${maxInventorySlots} ячеек`, 36, 35);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(`🎒 Сумка: ${inventory.length} / ${maxInventorySlots} ячеек`, 35, 35);
            
            // --- ЦЕНТРАЛЬНАЯ ЧАСТЬ: Уровень и зеленая полоса Опыта (XP) ---
            ctx.textAlign = "center";
            let reqXP = getRequiredXP(playerLevel);
            let xpText = `🌟 Ур. ${playerLevel} [${Math.floor(playerXP)} / ${reqXP} XP]`;
            
            ctx.fillStyle = "#000000";
            ctx.fillText(xpText, 401, 35);
            ctx.fillStyle = "#85e085"; // Салатовый цвет для текста опыта
            ctx.fillText(xpText, 400, 35);

            // Шкала опыта в виде тонкой зеленой полосочки на нижнем ранте окна
            let barW = 200;
            let barH = 4;
            let barX = 400 - barW / 2;
            let barY = 42;
            let fillW = (playerXP / reqXP) * barW;
            if (fillW > barW) fillW = barW;

            ctx.fillStyle = "#1b1d26"; ctx.fillRect(barX, barY, barW, barH); // фон полоски
            ctx.fillStyle = "#4cd137"; ctx.fillRect(barX, barY, fillW, barH); // заполнение

            // --- ПОДСКАЗКА О НАЛИЧИИ ОЧКОВ МАСТЕРСТВА ---
            // Объявляем переменную talentPointsSpent, если она еще не создана
            if (typeof talentPointsSpent === 'undefined') talentPointsSpent = 0;
            let freePoints = (playerLevel - 1) - talentPointsSpent;
            
            if (freePoints > 0) {
                ctx.textAlign = "left";
                let pulseX = Math.sin(Date.now() / 150) * 4;
                
                ctx.fillStyle = "#000000";
                ctx.fillText(`⬅️ [Вкачать таланты! Очков: ${freePoints}]`, 511 + pulseX, 35);
                ctx.fillStyle = "#f1c40f"; 
                ctx.fillText(`⬅️ [Вкачать таланты! Очков: ${freePoints}]`, 510 + pulseX, 35);
            }

            // --- ПРАВАЯ ЧАСТЬ: Золото игрока ---
            ctx.textAlign = "right";
            ctx.fillStyle = "#000000";
            ctx.fillText(`🪙 Золото: ${coins}`, 744, 35);
            ctx.fillStyle = "#ffff00";
            ctx.fillText(`🪙 Золото: ${coins}`, 745, 35);
            
            ctx.textAlign = "left"; // Железный сброс выравнивания
        }

        // --- ФУНКЦИЯ ОБНОВЛЕНИЯ СОСТОЯНИЙ (ИСПРАВЛЕНА СИНТАКСИЧЕСКАЯ ОШИБКА) ---
        function drawMountains() {
            const peaks = [
                {x: 50, w: 90, h: 70}, {x: 120, w: 110, h: 90}, {x: 210, w: 100, h: 75},
                {x: 290, w: 120, h: 100}, {x: 390, w: 110, h: 85}, {x: 480, w: 130, h: 110},
                {x: 590, w: 120, h: 95}, {x: 690, w: 100, h: 80}, {x: 760, w: 80, h: 65}
            ];
            for (let m of peaks) {
                ctx.fillStyle = "#485460";
                ctx.beginPath();
                ctx.moveTo(m.x - m.w/2, m.h);
                ctx.lineTo(m.x, 0);
                ctx.lineTo(m.x + m.w/2, m.h);
                ctx.fill();

                ctx.fillStyle = "#2f3640";
                ctx.beginPath();
                ctx.moveTo(m.x, 0);
                ctx.lineTo(m.x + m.w/2, m.h);
                ctx.lineTo(m.x, m.h);
                ctx.fill();

                ctx.fillStyle = "#dcdde1";
                ctx.beginPath();
                ctx.moveTo(m.x, 0);
                ctx.lineTo(m.x - m.w * 0.18, m.h * 0.35);
                ctx.lineTo(m.x, m.h * 0.28);
                ctx.lineTo(m.x + m.w * 0.18, m.h * 0.35);
                ctx.fill();
            }
        }

        function drawTree(x, y) {
            ctx.fillStyle = "#1b3019";
            ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#2d5428";
            ctx.beginPath(); ctx.arc(x - 2, y - 2, 4, 0, Math.PI * 2); ctx.fill();
        }

        // --- ОСНОВНАЯ ФУНКЦИЯ ОТРИСОВКИ КАРТЫ ---
        function drawMap() {
            let time = Date.now() * 0.002;

            let oceanGrad = ctx.createLinearGradient(0, 200, 0, 600);
            oceanGrad.addColorStop(0, "#122a4a");
            oceanGrad.addColorStop(1, "#071224");
            ctx.fillStyle = oceanGrad;
            ctx.fillRect(0, 0, 800, 600);

            ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
            ctx.lineWidth = 2;
            for (let y = 430; y < 580; y += 30) {
                ctx.beginPath();
                for (let x = 0; x <= 800; x += 40) {
                    let waveY = y + Math.sin(time + x * 0.02 + y) * 3;
                    if (x === 0) ctx.moveTo(x, waveY);
                    else ctx.lineTo(x, waveY);
                }
                ctx.stroke();
            }

            ctx.fillStyle = "#264e28";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(800, 0);
            ctx.lineTo(800, 360);
            ctx.bezierCurveTo(550, 460, 250, 460, 0, 340);
            ctx.closePath();
            ctx.fill();

            let landGrad = ctx.createLinearGradient(0, 0, 0, 400);
            landGrad.addColorStop(0, "rgba(20, 50, 20, 0.5)");
            landGrad.addColorStop(1, "rgba(60, 120, 50, 0.1)");
            ctx.fillStyle = landGrad;
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            let steps = 40;
            for (let i = 0; i <= steps; i++) {
                let t = i / steps;
                let bx = Math.pow(1-t, 3)*800 + 3*Math.pow(1-t,2)*t*550 + 3*(1-t)*t*t*250 + t*t*t*0;
                let by = Math.pow(1-t, 3)*360 + 3*Math.pow(1-t,2)*t*460 + 3*(1-t)*t*t*460 + t*t*t*340;
                let waveOffset = Math.sin(time * 2.5 + i * 0.4) * 2;
                
                if (i === 0) {
                    ctx.moveTo(bx, by + waveOffset);
                } else {
                    ctx.lineTo(bx, by + waveOffset);
                }
            }
            ctx.stroke();

            drawMountains();

            ctx.fillStyle = "#2d3b22";
            ctx.beginPath();
            ctx.ellipse(120, 280, 50, 30, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#435732";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = "#1a2512";
            ctx.fillRect(100, 275, 2, 7); ctx.fillRect(108, 270, 2, 9);
            ctx.fillRect(135, 285, 2, 6); ctx.fillRect(142, 280, 2, 8);

            ctx.strokeStyle = "#3877ab";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(660, 80);
            ctx.quadraticCurveTo(610, 140, 510, 200);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(510, 200);
            ctx.quadraticCurveTo(420, 280, 320, 380);
            ctx.stroke();

            ctx.fillStyle = "#2e6f9e";
            ctx.beginPath(); ctx.ellipse(510, 200, 32, 20, -0.2, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = "#347ba8";
            ctx.beginPath(); ctx.ellipse(300, 220, 20, 12, 0.3, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = "#e2b872"; ctx.fillRect(535, 175, 14, 10);
            ctx.fillStyle = "#a83232";
            ctx.beginPath(); ctx.moveTo(533, 175); ctx.lineTo(542, 168); ctx.lineTo(551, 175); ctx.fill();

            ctx.fillStyle = "#d0c3aa"; ctx.fillRect(265, 210, 12, 9);
            ctx.fillStyle = "#4a6fa5"; ctx.fillRect(268, 206, 6, 4);

            ctx.fillStyle = "#8c6747"; ctx.fillRect(305, 375, 30, 5); ctx.fillRect(315, 375, 5, 16);
            ctx.fillStyle = "#c29b68"; ctx.fillRect(290, 358, 10, 8);
            ctx.fillStyle = "#9e3d3d"; ctx.fillRect(289, 355, 12, 4);
            ctx.fillStyle = "#c29b68"; ctx.fillRect(335, 358, 10, 8);
            ctx.fillStyle = "#3d7e9e"; ctx.fillRect(334, 355, 12, 4);

            const trees = [
                [70, 220], [85, 215], [95, 225], [75, 235], [90, 240],
                [220, 130], [235, 125], [250, 135], [230, 145], [265, 130],
                [620, 230], [635, 220], [650, 235], [630, 250], [665, 245]
            ];
            for (let t of trees) drawTree(t[0], t[1]);

            ctx.strokeStyle = "rgba(133, 112, 83, 0.7)";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(270, 220); ctx.quadraticCurveTo(280, 290, 305, 360); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(280, 215); ctx.lineTo(475, 195); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(260, 225); ctx.lineTo(170, 270); ctx.stroke();
            ctx.setLineDash([]);

            ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            for (let i = 0; i < zones.length - 1; i++) {
                ctx.beginPath();
                ctx.moveTo(zones[i].x, zones[i].y);
                ctx.lineTo(zones[i+1].x, zones[i+1].y);
                ctx.stroke();
            }
            ctx.setLineDash([]);

            for (let z of zones) {
                let access = checkZoneAccess(z.id);
                
                ctx.beginPath();
                ctx.arc(z.x, z.y, 24, 0, Math.PI * 2);
                if (access.allowed) {
                    ctx.fillStyle = "rgba(76, 209, 55, 0.3)";
                    ctx.strokeStyle = "#4cd137";
                } else {
                    ctx.fillStyle = "rgba(232, 65, 24, 0.3)";
                    ctx.strokeStyle = "#e84118";
                }
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(z.x, z.y, 16, 0, Math.PI * 2);
                ctx.fillStyle = access.allowed ? "#2e86de" : "#353b48";
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.font = "13px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(access.allowed ? "⚓" : "🔒", z.x, z.y);

                ctx.font = "bold 11px 'Courier New', monospace";
                let textWidth = ctx.measureText(z.name).width;
                
                ctx.fillStyle = "rgba(10, 10, 20, 0.85)";
                ctx.fillRect(z.x - textWidth / 2 - 6, z.y + 24, textWidth + 12, 18);
                ctx.strokeStyle = access.allowed ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 80, 80, 0.4)";
                ctx.lineWidth = 1;
                ctx.strokeRect(z.x - textWidth / 2 - 6, z.y + 24, textWidth + 12, 18);

                ctx.fillStyle = access.allowed ? "#ffffff" : "#aaaaaa";
                ctx.fillText(z.name, z.x, z.y + 33);
            }

            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";

            drawUIPanel();
            drawButtons();
        }

        function drawSwampHub() {
            // Земля
            ctx.fillStyle = "#3e4a32";
            ctx.fillRect(0, 0, 800, 420);
            
            // Вода (болото)
            ctx.fillStyle = "#2a3b32";
            ctx.fillRect(0, 420, 800, 180);

            // Кувшинки на воде для атмосферы
            ctx.fillStyle = "#4caf50";
            ctx.beginPath(); ctx.ellipse(100, 460, 20, 8, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(650, 520, 15, 6, 0, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(700, 450, 25, 10, 0, 0, Math.PI*2); ctx.fill();

            // --- ДЕКОРАТИВНЫЕ ДОМИКИ (просто антураж) ---
            ctx.fillStyle = "#5c4836"; ctx.fillRect(40, 220, 80, 70); // Стены дома 1
            ctx.fillStyle = "#33271d"; ctx.beginPath(); ctx.moveTo(30, 220); ctx.lineTo(80, 170); ctx.lineTo(130, 220); ctx.fill(); // Крыша
            ctx.fillStyle = "#d4b872"; ctx.fillRect(60, 250, 20, 25); // Светящееся окно

            ctx.fillStyle = "#4a5c43"; ctx.fillRect(650, 260, 90, 80); // Стены дома 2
            ctx.fillStyle = "#2b3626"; ctx.beginPath(); ctx.moveTo(630, 260); ctx.lineTo(695, 200); ctx.lineTo(760, 260); ctx.fill();

            // --- ИНТЕРАКТИВНЫЕ ОБЪЕКТЫ ---
            
            // 1. Таверна
            ctx.fillStyle = "#634027"; ctx.fillRect(150, 180, 140, 120);
            ctx.fillStyle = "#8a3a2e"; ctx.beginPath(); ctx.moveTo(130, 180); ctx.lineTo(220, 120); ctx.lineTo(310, 180); ctx.fill(); // Красная крыша
            ctx.fillStyle = "#26150a"; ctx.fillRect(200, 250, 40, 50); // Дверь
            // Вывеска таверны
            ctx.fillStyle = "#c78634"; ctx.fillRect(160, 200, 30, 30);
            ctx.fillStyle = "#fff"; ctx.font = "16px 'system-ui'"; ctx.fillText("🍺", 165, 222);

            // 2. Лавка Торговца
            ctx.fillStyle = "#476161"; ctx.fillRect(500, 150, 110, 100);
            ctx.fillStyle = "#223333"; ctx.beginPath(); ctx.moveTo(480, 150); ctx.lineTo(555, 100); ctx.lineTo(630, 150); ctx.fill(); // Темная крыша
            // Полосатый навес
            ctx.fillStyle = "#c23a3a"; ctx.fillRect(490, 150, 130, 20); 
            ctx.fillStyle = "#e0e0e0"; ctx.fillRect(510, 150, 20, 20); 
            ctx.fillRect(550, 150, 20, 20);
            ctx.fillRect(590, 150, 20, 20);
            // Вывеска
            ctx.fillStyle = "#d4af37"; ctx.beginPath(); ctx.arc(555, 130, 15, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#000"; ctx.font = "16px 'system-ui'"; ctx.fillText("💰", 546, 136);

            // 3. Причал и Лодка
            ctx.fillStyle = "#4a3525"; // Доски причала
            ctx.fillRect(380, 380, 60, 100);
            ctx.fillStyle = "#291b11"; // Щели между досками
            ctx.fillRect(380, 400, 60, 2);
            ctx.fillRect(380, 420, 60, 2);
            ctx.fillRect(380, 440, 60, 2);
            ctx.fillRect(380, 460, 60, 2);

            // Лодка
            ctx.fillStyle = "#705139"; 
            ctx.beginPath(); ctx.ellipse(480, 450, 50, 20, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#402d1f"; // Внутри лодки
            ctx.beginPath(); ctx.ellipse(480, 450, 40, 12, 0, 0, Math.PI*2); ctx.fill();
            // Весло
            ctx.strokeStyle = "#b58e72"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(480, 450); ctx.lineTo(510, 490); ctx.stroke();
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (gameState === "INTRO") {
                drawPixelBackground("INTRO");
                const introCurrent = INTRO_PAGES[Math.min(introPage, INTRO_PAGES.length - 1)];
                drawWindow(50, 50, 700, 400, introCurrent.title);

                // Разбиваем текст на строки заранее, чтобы отцентрировать блок по вертикали
                const introBlocks = introCurrent.paragraphs.map(p => wrapGameText(p, 620, "bold 15px 'Courier New'"));
                let introTotal = 0;
                introBlocks.forEach(block => { introTotal += block.length * 23 + 16; });
                introTotal -= 16;

                let introY = 50 + (400 - introTotal) / 2 + 12;
                introBlocks.forEach(block => {
                    block.forEach(line => {
                        ctx.font = "bold 15px 'Courier New'";
                        ctx.fillStyle = "#000000";
                        ctx.fillText(line, 79, introY - 1);
                        ctx.fillText(line, 81, introY - 1);
                        ctx.fillText(line, 79, introY + 1);
                        ctx.fillText(line, 81, introY + 1);
                        ctx.fillStyle = "#ffffff";
                        ctx.fillText(line, 80, introY);
                        introY += 23;
                    });
                    introY += 16;
                });

                ctx.font = "13px 'Courier New'";
                ctx.fillStyle = "#8899bb";
                ctx.textAlign = "right";
                ctx.fillText(`${introPage + 1} / ${INTRO_PAGES.length}`, 720, 432);
                ctx.textAlign = "left";

                drawButtons();
            }

            else if (gameState === "MAP") {
                drawMap();
            }

            else if (gameState === "SHOP") {
                ctx.fillStyle = "#110b18"; ctx.fillRect(0,0,800,600); 
                
                // 1. Окно лавки
                const shopTitle = (currentZone && currentZone.id === 2)
                    ? "🛒 Лавка Михалыча — Школьный пруд"
                    : "🛒 Лавка купца — Болото Топей";
                drawWindow(15, 50, 770, 470, shopTitle);

                // 2. Витрина: 10 колонок, до 4 рядов
                let slotSize = 56;
                let gapX = 8;
                let gapY = 8;
                let startX = 84;
                let startY = 92;
                let cols = 10;

                let hoveredItem = null;
                let shopDiscount = (talents.goodDiscount || 0) * 0.03;
                const shopPages = Math.max(1, Math.ceil(SHOP_STOCK.length / SHOP_PAGE_SIZE));
                const capNames = ["обычная", "необычная", "редкая", "очень редкая", "мифическая", "легендарная"];
                const pageStart = shopPage * SHOP_PAGE_SIZE;
                const visibleCount = Math.max(0, Math.min(SHOP_PAGE_SIZE, SHOP_STOCK.length - pageStart));

                for (let i = 0; i < visibleCount; i++) {
                    let stockItem = SHOP_STOCK[pageStart + i];
                    let col = i % cols;
                    let row = Math.floor(i / cols);
                    let slotX = startX + col * (slotSize + gapX);
                    let slotY = startY + row * (slotSize + gapY);

                    ctx.fillStyle = "#1e172a";
                    ctx.fillRect(slotX, slotY, slotSize, slotSize);

                    ctx.strokeStyle = "#3a3f4d";
                    if (stockItem.rarity === "обычная") ctx.strokeStyle = "#9d9d9d";
                    if (stockItem.rarity === "необычная") ctx.strokeStyle = "#1eff00";
                    if (stockItem.rarity === "редкая") ctx.strokeStyle = "#0070dd";
                    if (stockItem.rarity === "очень редкая") ctx.strokeStyle = "#a335ee";
                    if (stockItem.rarity === "мифическая") ctx.strokeStyle = "#ff8000";
                    if (stockItem.rarity === "легендарная") ctx.strokeStyle = "#e6cc80";
                    ctx.lineWidth = 3;

                    ctx.font = "26px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(stockItem.itemData.icon, slotX + slotSize/2, slotY + slotSize/2 - 5);
                    ctx.textBaseline = "alphabetic";

                    let finalCost = Math.max(1, Math.round(stockItem.cost * (1 - shopDiscount)));
                    ctx.font = "bold 9px system-ui";
                    ctx.fillStyle = "#ffd75e";
                    ctx.textAlign = "right";
                    ctx.fillText(`${finalCost}🪙`, slotX + slotSize - 4, slotY + slotSize - 5);

                    if (mouseX >= slotX && mouseX <= slotX + slotSize &&
                        mouseY >= slotY && mouseY <= slotY + slotSize) {
                        hoveredItem = stockItem;
                        ctx.strokeStyle = "#f1c40f";
                        ctx.lineWidth = 3;
                    }
                    ctx.strokeRect(slotX, slotY, slotSize, slotSize);
                }
                ctx.textAlign = "left";

                if (shopPages > 1) {
                    ctx.textAlign = "center";
                    drawTextWithShadow(`Стр. ${shopPage + 1} / ${shopPages}`, 400, 330, "bold 11px system-ui", "#9aa7bd");
                    ctx.textAlign = "left";
                }

                // 3. Панель описания / подтверждения
                let panelItem = activeShopItem || hoveredItem;
                drawWindow(30, 344, 740, 111, activeShopItem ? "⚙️ Подтверждение покупки" : "📖 Описание товара");

                if (panelItem) {
                    let rColor = "#ffffff";
                    if (panelItem.rarity === "необычная") rColor = "#1eff00";
                    if (panelItem.rarity === "редкая") rColor = "#0070dd";
                    if (panelItem.rarity === "очень редкая") rColor = "#a335ee";
                    if (panelItem.rarity === "мифическая") rColor = "#ff8000";
                    if (panelItem.rarity === "легендарная") rColor = "#e6cc80";

                    let panelCost = Math.max(1, Math.round(panelItem.cost * (1 - shopDiscount)));
                    drawTextWithShadow(panelItem.name, 45, 397, "bold 14px system-ui", rColor, 700);

                    let meta = `Тип: ${panelItem.type.toUpperCase()}   ·   Цена: ${panelCost}🪙`;
                    if (shopDiscount > 0) meta += " (со скидкой)";
                    if (panelItem.type === "rod") {
                        if (panelItem.itemData.rarityOnly) {
                            meta += `   ·   Кубы: ${panelItem.itemData.dice}   ·   ловит ТОЛЬКО «${panelItem.itemData.rarityOnly}»`;
                        } else {
                            meta += `   ·   Кубы: ${panelItem.itemData.dice}   ·   допуск до «${capNames[rodRarityCap(panelItem.itemData)]}»`;
                        }
                    }
                    if (panelItem.type === "bag") meta += `   ·   +${panelItem.itemData.slots} ячеек`;
                    drawTextWithShadow(meta, 45, 417, "bold 11px system-ui", "#cfd8e3", 700);
                    drawTextWithShadow(panelItem.itemData.desc, 45, 437, "11px system-ui", "#ffffff", 700, 16);
                } else {
                    drawTextWithShadow("Наведите курсор на товар — здесь появятся характеристики и описание.", 45, 397, "12px system-ui", "#8fa0b8", 700);
                    drawTextWithShadow("Снасти надеваются в «Снаряжении»; наживка и прикорм расходуются на рыбалке; сумки — в «Инвентаре».", 45, 422, "11px system-ui", "#6f7f96", 700);
                }

                drawUIPanel();
                drawButtons();
            }

            else if (gameState === "GEAR_NEW") {
                ctx.fillStyle = "#0f1412"; ctx.fillRect(0,0,800,600); 
                
                drawWindow(20, 60, 240, 450, "🛡️ Экипировка Героя");
                drawWindow(540, 60, 240, 450, "🎣 Рыболовные Снасти");
                drawWindow(280, 60, 240, 450, "✨ Действующие Эффекты");

                let slotSize = 64;
                let startY = 120;
                let hoveredSlotItem = null;

                // --- 1. ОДЕЖДА (ЛЕВАЯ КОЛОНКА) ---
                let clothSlots = [
                    { id: "head", label: "Голова", icon: "🪖" },
                    { id: "cloak", label: "Накидка", icon: "🧥" },
                    { id: "gloves", label: "Перчатки", icon: "🧤" },
                    { id: "boots", label: "Сапоги", icon: "🥾" }
                ];

                clothSlots.forEach((slot, idx) => {
                    let x = 40;
                    let y = startY + idx * 90;
                    
                    ctx.fillStyle = "#1b1d26"; ctx.fillRect(x, y, slotSize, slotSize);
                    ctx.strokeStyle = "#3a3f4d"; ctx.lineWidth = 2; ctx.strokeRect(x, y, slotSize, slotSize);
                    
                    let item = paperdoll[slot.id];
                    if (item) {
                        ctx.font = "28px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                        ctx.fillText(item.icon, x + slotSize/2, y + slotSize/2 + 2);
                        drawTextWithShadow(item.name, x + 75, y + 25, "bold 12px system-ui", "#ffffff");
                        drawTextWithShadow("[Клик: Снять]", x + 75, y + 45, "10px system-ui", "#aaaaaa");
                        
                        if (mouseX >= x && mouseX <= x + slotSize && mouseY >= y && mouseY <= y + slotSize) {
                            hoveredSlotItem = item;
                            ctx.strokeStyle = "#f1c40f"; ctx.strokeRect(x, y, slotSize, slotSize);
                        }
                    } else {
                        ctx.font = "24px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                        ctx.fillStyle = "rgba(255,255,255,0.15)";
                        ctx.fillText(slot.icon, x + slotSize/2, y + slotSize/2 + 2);
                        drawTextWithShadow(slot.label, x + 75, y + 35, "12px system-ui", "#555566");
                    }
                });

                // --- 2. СНАСТИ (ПРАВАЯ КОЛОНКА) ---
                let tackleSlots = [
                    { id: "rod", label: "Удочка", icon: "🎣" },
                    { id: "line", label: "Леска", icon: "🧵" },
                    { id: "hook", label: "Крючок", icon: "🪝" },
                    { id: "bait", label: "Наживка", icon: "🪱" }
                ];

                tackleSlots.forEach((slot, idx) => {
                    let x = 560;
                    let y = startY + idx * 90;
                    
                    ctx.fillStyle = "#1b1d26"; ctx.fillRect(x, y, slotSize, slotSize);
                    ctx.strokeStyle = "#3a3f4d"; ctx.lineWidth = 2; ctx.strokeRect(x, y, slotSize, slotSize);
                    
                    let item = paperdoll[slot.id];
                    ctx.textAlign = "left"; // Жестко фиксируем выравнивание влево для текста снастей
                    if (item) {
                        ctx.font = "28px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                        ctx.fillText(item.icon, x + slotSize/2, y + slotSize/2 + 2);
                        
                        // ИСПРАВЛЕНО: Текст теперь выводится СПРАВА от ячеек (x + 75), как в одежде
                        // Дописываем количество червяков прямо к названию снасти на кукле
                        let baitCountText = item.count ? ` (х${item.count})` : "";
                        drawTextWithShadow(item.name + baitCountText, x + 75, y + 25, "bold 12px system-ui", "#ffffff");
                        drawTextWithShadow("[Клик: Снять]", x + 75, y + 45, "10px system-ui", "#aaaaaa");
                        
                        if (mouseX >= x && mouseX <= x + slotSize && mouseY >= y && mouseY <= y + slotSize) {
                            hoveredSlotItem = item;
                            ctx.textAlign = "center";
                            ctx.strokeStyle = "#f1c40f"; ctx.strokeRect(x, y, slotSize, slotSize);
                        }
                    } else {
                        ctx.font = "24px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                        ctx.fillStyle = "rgba(255,255,255,0.15)";
                        ctx.fillText(slot.icon, x + slotSize/2, y + slotSize/2 + 2);
                        drawTextWithShadow(slot.label, x + 75, y + 35, "12px system-ui", "#555566");
                    }
                });
                ctx.textAlign = "left"; // сброс

                // --- 3. ВЫВОД ЭФФЕКТОВ (ЦЕНТР) ---
                let currentRodDice = paperdoll.rod ? paperdoll.rod.dice : "Нет";
                let currentLineBonus = paperdoll.line ? paperdoll.line.bonus : 0;
                let currentBaitTime = paperdoll.bait ? paperdoll.bait.timeMod : 0;
                let currentHeadTime = (paperdoll.head && paperdoll.head.waitBonus) ? paperdoll.head.waitBonus : 0;
                let totalSpeedBonus = currentBaitTime + currentHeadTime;
                let capNames = ["обычная", "необычная", "редкая", "очень редкая", "мифическая", "легендарная"];
                let currentRodCap = rodRarityCap(paperdoll.rod);

                drawTextWithShadow(`• Кубы удилища:`, 295, 120, "bold 12px system-ui", "#ffffff");
                drawTextWithShadow(`  ${currentRodDice}`, 295, 140, "bold 14px system-ui", "#ffff00");
                let rodCapLine = (paperdoll.rod && paperdoll.rod.rarityOnly)
                    ? `  ловит ТОЛЬКО «${paperdoll.rod.rarityOnly}»`
                    : `  допуск до «${capNames[currentRodCap]}»`;
                drawTextWithShadow(rodCapLine, 295, 160, "11px system-ui", "#88ccff");
                
                drawTextWithShadow(`• Модификатор лески:`, 295, 185, "bold 12px system-ui", "#ffffff");
                drawTextWithShadow(`  +${currentLineBonus} к броску`, 295, 203, "bold 13px system-ui", currentLineBonus > 0 ? "#88ff88" : "#aaaaaa");
                let lineExtras = [];
                if (paperdoll.line && paperdoll.line.critBonus) lineExtras.push(`крит +${Math.round(paperdoll.line.critBonus * 100)}%`);
                if (paperdoll.line && paperdoll.line.secondChance) lineExtras.push(`удержать ${Math.round(paperdoll.line.secondChance * 100)}%`);
                if (paperdoll.line && paperdoll.line.rarityUpChance) lineExtras.push(`ранг выше ${Math.round(paperdoll.line.rarityUpChance * 100)}%`);
                if (paperdoll.line && paperdoll.line.quietCastChance) lineExtras.push(`тихий заброс ${Math.round(paperdoll.line.quietCastChance * 100)}%`);
                if (lineExtras.length) drawTextWithShadow(`  ${lineExtras.join(" · ")}`, 295, 221, "11px system-ui", "#88ff88");
                
                drawTextWithShadow(`• Скорость клёва:`, 295, 243, "bold 12px system-ui", "#ffffff");
                drawTextWithShadow(`  -${Math.round(totalSpeedBonus * 100)}% времени клёва`, 295, 263, "bold 13px system-ui", totalSpeedBonus > 0 ? "#88ff88" : "#aaaaaa");

                drawTextWithShadow(`• Одежда:`, 295, 288, "bold 12px system-ui", "#ffffff");
                let clothLines = [];
                if (paperdoll.head) {
                    if (paperdoll.head.waitBonus) clothLines.push(`👒 -${Math.round(paperdoll.head.waitBonus * 100)}% времени клёва`);
                    if (paperdoll.head.xpBonus) clothLines.push(`🎓 +${Math.round(paperdoll.head.xpBonus * 100)}% к опыту`);
                    if (paperdoll.head.weatherResist) clothLines.push(`🌧 +${Math.round(paperdoll.head.weatherResist * 100)}% к погоде`);
                    if (paperdoll.head.chumChanceBonus) clothLines.push(`🥫 +${Math.round(paperdoll.head.chumChanceBonus * 100)}% к прикорму`);
                    if (paperdoll.head.chumChargeBonus) clothLines.push(`🥫 +${paperdoll.head.chumChargeBonus} заряд прикорма`);
                }
                if (paperdoll.gloves) {
                    if (paperdoll.gloves.rollBonus) clothLines.push(`🧤 +${paperdoll.gloves.rollBonus} к броску`);
                    if (paperdoll.gloves.critBonus) clothLines.push(`🎯 +${Math.round(paperdoll.gloves.critBonus * 100)}% крит`);
                    if (paperdoll.gloves.secondChance) clothLines.push(`🎯 удержать ${Math.round(paperdoll.gloves.secondChance * 100)}%`);
                    if (paperdoll.gloves.rarityUpChance) clothLines.push(`🎯 ранг выше ${Math.round(paperdoll.gloves.rarityUpChance * 100)}%`);
                    if (paperdoll.gloves.baitSaveChance) clothLines.push(`🪱 +${Math.round(paperdoll.gloves.baitSaveChance * 100)}% сэкономить наживку`);
                    if (paperdoll.gloves.baitEffectBonus) clothLines.push(`🪱 +${Math.round(paperdoll.gloves.baitEffectBonus * 100)}% к наживке`);
                    if (paperdoll.gloves.chumChanceBonus) clothLines.push(`🥫 +${Math.round(paperdoll.gloves.chumChanceBonus * 100)}% к прикорму`);
                }
                if (paperdoll.cloak) {
                    if (paperdoll.cloak.sellBonus) clothLines.push(`🧥 +${Math.round(paperdoll.cloak.sellBonus * 100)}% к продаже`);
                    if (paperdoll.cloak.xpBonus) clothLines.push(`🧥 +${Math.round(paperdoll.cloak.xpBonus * 100)}% к опыту`);
                    if (paperdoll.cloak.secondChance) clothLines.push(`🧥 удержать ${Math.round(paperdoll.cloak.secondChance * 100)}%`);
                    if (paperdoll.cloak.rarityUpChance) clothLines.push(`🧥 ранг выше ${Math.round(paperdoll.cloak.rarityUpChance * 100)}%`);
                    if (paperdoll.cloak.weatherResist) clothLines.push(`🌧 +${Math.round(paperdoll.cloak.weatherResist * 100)}% к погоде`);
                    if (paperdoll.cloak.baitSaveChance) clothLines.push(`🪱 +${Math.round(paperdoll.cloak.baitSaveChance * 100)}% сэкономить наживку`);
                    if (paperdoll.cloak.baitEffectBonus) clothLines.push(`🪱 +${Math.round(paperdoll.cloak.baitEffectBonus * 100)}% к наживке`);
                    if (paperdoll.cloak.chumChanceBonus) clothLines.push(`🥫 +${Math.round(paperdoll.cloak.chumChanceBonus * 100)}% к прикорму`);
                    if (paperdoll.cloak.chumChargeBonus) clothLines.push(`🥫 +${paperdoll.cloak.chumChargeBonus} заряд прикорма`);
                }
                if (paperdoll.boots) {
                    if (paperdoll.boots.rareWeightBonus) clothLines.push(`🥾 +${Math.round(paperdoll.boots.rareWeightBonus * 100)}% вес «редкая+»`);
                    if (paperdoll.boots.xpBonus) clothLines.push(`🥾 +${Math.round(paperdoll.boots.xpBonus * 100)}% к опыту`);
                    if (paperdoll.boots.secondChance) clothLines.push(`🥾 удержать ${Math.round(paperdoll.boots.secondChance * 100)}%`);
                    if (paperdoll.boots.rarityUpChance) clothLines.push(`🥾 ранг выше ${Math.round(paperdoll.boots.rarityUpChance * 100)}%`);
                }
                if (!clothLines.length) clothLines.push("ничего не надето");
                clothLines.forEach((line, i) => {
                    drawTextWithShadow(line, 295, 300 + i * 20, "11px system-ui", clothLines[0] === "ничего не надето" ? "#777788" : "#88ff88");
                });

                // --- TOOLTIP ДЛЯ КУКЛЫ ---
                if (hoveredSlotItem) {
                    let tipW = 280; let tipH = 110;
                    let tipX = mouseX + 15; let tipY = mouseY + 15;
                    if (tipX + tipW > 800) tipX = mouseX - tipW - 15;
                    
                    ctx.fillStyle = "rgba(10, 15, 30, 0.95)"; ctx.fillRect(tipX, tipY, tipW, tipH);
                    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.strokeRect(tipX, tipY, tipW, tipH);
                    
                    drawTextWithShadow(hoveredSlotItem.name, tipX + 12, tipY + 22, "bold 12px system-ui", "#ffff00", tipW - 24);
                    drawTextWithShadow(hoveredSlotItem.desc || "Предмет экипировки.", tipX + 12, tipY + 45, "11px system-ui", "#ffffff", tipW - 24, 16);
                }

                drawUIPanel();
                drawButtons();
            }

// --- ОТРИСОВКА ХАБА ---
            else if (gameState === "HUB") {
                if (currentZone && currentZone.id === 2) {
                    // ==================== ОТРИСОВКА ХАБА 2: ШКОЛЬНЫЙ ПРУД ====================
                    // Газон и береговая линия
                    ctx.fillStyle = "#4a6b36"; ctx.fillRect(0, 0, 800, 420); // Светло-зеленая трава у школы
                    ctx.fillStyle = "#34495e"; ctx.fillRect(0, 420, 800, 180); // Глубокая синяя вода пруда

                    // 1. ДВУХЭТАЖНОЕ ЗДАНИЕ ШКОЛЫ (Слева)
                    ctx.fillStyle = "#bdc581"; ctx.fillRect(30, 130, 200, 160); // Желтый советский кирпич
                    ctx.fillStyle = "#718093"; ctx.fillRect(30, 120, 200, 10);  // Плоская шиферная крыша
                    // Школьные окна
                    ctx.fillStyle = "#dff9fb";
                    for(let r=0; r<2; r++) {
                        for(let c=0; c<3; c++) {
                            ctx.fillRect(45 + c*55, 145 + r*50, 35, 30);
                        }
                    }
                    // Главное парадное крыльцо (Кликабельная зона администрации школы)
                    ctx.fillStyle = "#95afc0"; ctx.fillRect(100, 240, 60, 50);
                    ctx.fillStyle = "#535c68"; ctx.fillRect(115, 255, 30, 35); // Дверь

                    // 2. ЗДАНИЕ СЕЛЬСОВЕТА (По центру)
                    ctx.fillStyle = "#ca6f1e"; ctx.fillRect(250, 110, 210, 140); // Красный кирпич общины
                    ctx.fillStyle = "#78281f"; ctx.beginPath(); ctx.moveTo(230, 110); ctx.lineTo(355, 50); ctx.lineTo(480, 110); ctx.fill(); // Двухскатная крыша
                    // Окна Сельсовета
                    ctx.fillStyle = "#f9e79f"; ctx.fillRect(275, 140, 40, 40); ctx.fillRect(345, 140, 40, 40);
                    ctx.fillStyle = "#1f3a24"; ctx.fillRect(345, 200, 40, 50); // Парадная дверь

                    // 3. КАМОРКА ЗАВХОЗА МИХАЛЫЧА (Справа)
                    ctx.fillStyle = "#4a3b32"; ctx.fillRect(600, 150, 170, 120); // Старый деревянный сруб
                    ctx.fillStyle = "#2c1d11"; ctx.beginPath(); ctx.moveTo(585, 150); ctx.lineTo(685, 100); ctx.lineTo(785, 150); ctx.fill();
                    // Вывеска хозблока
                    ctx.fillStyle = "#f1c40f"; ctx.fillRect(620, 180, 30, 20);
                    ctx.fillStyle = "#000"; ctx.font = "12px sans-serif"; ctx.fillText("🧹", 628, 195);

                    // 4. ПРИСТРОЙКА: КАБИНЕТ ДИРЕКТОРА (Отдельное крыло школы)
                    ctx.fillStyle = "#aaa69d"; ctx.fillRect(50, 320, 110, 90); // Серые бетонные блоки
                    ctx.fillStyle = "#2c3e50"; ctx.fillRect(85, 360, 35, 50); // Строгая дубовая дверь директора

                    // 5. ШКОЛЬНЫЙ ПРИЧАЛ (Мосток уходящий в воду)
                    ctx.fillStyle = "#5d4037"; ctx.fillRect(530, 410, 50, 110); // Свежий деревянный настил
                    ctx.fillStyle = "#3e2723"; ctx.fillRect(530, 430, 50, 4);   // Разделительные насечки досок
                    ctx.fillRect(530, 460, 50, 4); ctx.fillRect(530, 490, 50, 4);
                } else {
                    // ==================== ОРИГИНАЛЬНАЯ ОТРИСОВКА ХАБА 1: БОЛОТО ====================
                    ctx.fillStyle = "#3e4a3d"; ctx.fillRect(0, 0, 800, 600);
                    ctx.fillStyle = "#2c3e35"; ctx.fillRect(0, 400, 800, 200);

                    ctx.fillStyle = "#4cd137";
                    ctx.fillRect(80, 440, 40, 12); ctx.fillRect(640, 460, 50, 12); ctx.fillRect(680, 530, 30, 8);

                    // Домик соседа старосты
                    ctx.fillStyle = "#4a3b32"; ctx.fillRect(40, 260, 90, 80);
                    ctx.fillStyle = "#f39c12"; ctx.fillRect(75, 290, 20, 25);
                    ctx.fillStyle = "#7f8c8d"; ctx.fillRect(105, 240, 12, 30);
                    ctx.fillStyle = "#702c24"; ctx.beginPath(); ctx.moveTo(30, 260); ctx.lineTo(85, 220); ctx.lineTo(140, 260); ctx.fill();

                    // Таверна
                    ctx.fillStyle = "#5e483a"; ctx.fillRect(165, 200, 220, 150);
                    ctx.fillStyle = "#1a110b"; ctx.fillRect(250, 290, 50, 60);
                    ctx.fillStyle = "#c0392b"; ctx.beginPath(); ctx.moveTo(145, 200); ctx.lineTo(275, 140); ctx.lineTo(405, 200); ctx.fill();
                    ctx.font = "24px Arial"; ctx.fillText("🍺", 220, 250);

                    // Лавка купца
                    ctx.fillStyle = "#34495e"; ctx.fillRect(605, 180, 180, 110);
                    ctx.fillStyle = "#2c3e50"; ctx.beginPath(); ctx.moveTo(590, 180); ctx.lineTo(695, 130); ctx.lineTo(800, 180); ctx.fill();
                    let stripeWidth = 180 / 6;
                    for (let s = 0; s < 6; s++) {
                        ctx.fillStyle = (s % 2 === 0) ? "#e74c3c" : "#ffffff";
                        ctx.fillRect(605 + s * stripeWidth, 180, stripeWidth, 25);
                    }
                    ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(695, 155, 14, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = "#ffffff"; ctx.font = "bold 12px 'Courier New'"; ctx.fillText("1", 691, 159);

                    // Старый причал
                    ctx.fillStyle = "#3e2723"; ctx.fillRect(475, 410, 25, 100); ctx.fillRect(610, 410, 25, 100);
                    ctx.fillStyle = "#5d4037"; ctx.beginPath(); ctx.ellipse(555, 490, 80, 25, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = "#3e2723"; ctx.lineWidth = 3; ctx.stroke();
                }

                // --- ОБЩАЯ СИСТЕМА ДЛЯ ПОДСВЕТКИ ХОВЕРА ЗДАННЫЙ (РАБОТАЕТ ДЛЯ ОБОИХ ХАБОВ) ---
                let hoveredObj = null;
                for (let obj of hubObjects) {
                    if (mouseX >= obj.x && mouseX <= obj.x + obj.w &&
                        mouseY >= obj.y && mouseY <= obj.y + obj.h) {
                        hoveredObj = obj;
                    }
                }

                if (hoveredObj) {
                    ctx.strokeStyle = "#f1c40f";
                    ctx.lineWidth = 4;
                    ctx.strokeRect(hoveredObj.x, hoveredObj.y, hoveredObj.w, hoveredObj.h);

                    let txtW = ctx.measureText(hoveredObj.name).width + 30;
                    ctx.fillStyle = "rgba(0,0,0,0.85)";
                    ctx.fillRect(mouseX + 15, mouseY - 35, txtW, 30);
                    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1;
                    ctx.strokeRect(mouseX + 15, mouseY - 35, txtW, 30);
                    
                    ctx.textAlign = "left";
                    drawTextWithShadow(hoveredObj.name, mouseX + 30, mouseY - 15, "bold 12px system-ui", "#ffffff");
                }

                drawUIPanel();
                drawButtons();
            }
            
            // --- ОТРИСОВКА ТАВЕРНЫ ---
            else if (gameState === "TAVERN") {
                // Красивый глубокий деревянно-коричневый фон таверны
                ctx.fillStyle = "#16100c"; ctx.fillRect(0,0,800,600); 
                
                // Главное большое синее окно таверны
                drawWindow(15, 40, 770, 480, "🍺 Таверна 'Хромая лягушка' — Доска Заказов");

                // Раздвинули коричневый деревянный стенд-доску на максимум (Высота h = 390)
                ctx.fillStyle = "#2d1e18"; ctx.fillRect(30, 95, 740, 390);
                ctx.strokeStyle = "#4a3124"; ctx.lineWidth = 4; ctx.strokeRect(30, 95, 740, 390);

                let paperW = 220;
                let paperH = 165; // Просторная высота карточек
                let startX = 45;
                let startY = 110;
                let gapX = 25;
                let gapY = 25;

                // Формируем точно такой же пакет данных для отрисовки графики на холсте
                let boardQuests = [];
                let culStep = questProgress.chainCulinary;
                if (culStep <= 5) boardQuests.push({ type: "culinary", data: questDatabase.culinary[culStep] });
                else boardQuests.push({ completed: true, label: "🥣 Кулинария\n[Выполнено]" });

                let hisStep = questProgress.chainHistory;
                if (hisStep <= 5) boardQuests.push({ type: "history", data: questDatabase.history[hisStep] });
                else boardQuests.push({ completed: true, label: "🏛 Археология\n[Выполнено]" });

                let globStep = questProgress.chainGlobal;
                if (globStep <= 2) boardQuests.push({ type: "global", data: questDatabase.global[globStep] });
                else boardQuests.push({ completed: true, label: "🔓 Застава\n[Открыта]" });

                let availableSide = questDatabase.sides.find(q => !questProgress.completedSides.includes(q.id));
                if (availableSide) boardQuests.push({ type: "side", data: availableSide });
                else boardQuests.push({ completed: true, label: "📌 Поручения\n[Выполнено]" });

                if (currentRepeatedQuest) boardQuests.push({ type: "repeated", data: currentRepeatedQuest });

                // НОВОЕ: Отрисовка 6-й ячейки при купленном таланте
                if (talents.flawlessReputation === true) {
                    let mythStep = questProgress.chainMythic;
                    if (mythStep <= 3) boardQuests.push({ type: "mythic", data: questDatabase.mythic[mythStep] });
                    else boardQuests.push({ completed: true, label: "👑 Цепочка Мифов\n[Завершена!]" });
                }

                // Рендеринг карточек (Размер сетки динамически расширен до boardQuests.length)
                for (let i = 0; i < boardQuests.length; i++) {
                    let q = boardQuests[i];
                    let row = Math.floor(i / 3);
                    let col = i % 3;
                    
                    let pX = startX + col * (paperW + gapX); // ИСПРАВЛЕНО: Ряды выровнены ровно друг под другом!
                    let pY = startY + row * (paperH + gapY);

                    // Уникальная мифическая заливка для 6-го слота (глубокий тёмно-пурпурный цвет)
                    if (q.type === "mythic") {
                        ctx.fillStyle = "#1e1026";
                    } else {
                        ctx.fillStyle = q.completed ? "#3d3228" : "#f1ebd9";
                    }
                    ctx.fillRect(pX, pY, paperW, paperH);
                    
                    // Золотая переливающаяся рамка для мифического квеста
                    if (q.type === "mythic") {
                        ctx.strokeStyle = "#d4af37";
                        ctx.lineWidth = 3;
                    } else {
                        ctx.strokeStyle = q.completed ? "#261c14" : "#cbbfa8";
                        ctx.lineWidth = 2;
                    }
                    ctx.strokeRect(pX, pY, paperW, paperH);

                    // Заклепка-гвоздик
                    ctx.fillStyle = q.type === "mythic" ? "#d4af37" : "#7f8c8d";
                    ctx.fillRect(pX + paperW/2 - 3, pY + 3, 6, 3);

                    if (q.completed) {
                        ctx.fillStyle = "#7f6050"; ctx.font = "bold 11px system-ui"; ctx.textAlign = "center";
                        let lines = q.label.split("\n");
                        ctx.fillText(lines[0], pX + paperW/2, pY + 70);
                        ctx.fillText(lines[1], pX + paperW/2, pY + 90);
                    } else if (q.data) {
                        ctx.textAlign = "left";

                        // Категория квеста
                        ctx.font = "bold 9px system-ui";
                        let catName = "КОНТРАКТ";
                        ctx.fillStyle = "#8a6242";
                        if (q.type === "culinary") catName = "🥣 ТАВЕРНА";
                        if (q.type === "history") catName = "🏛 РАСКОПКИ";
                        if (q.type === "global") catName = "👑 СЮЖЕТ";
                        if (q.type === "side") catName = "📌 ПОРУЧЕНИЕ";
                        if (q.type === "mythic") { catName = "✨ МИФИЧЕСКИЙ"; ctx.fillStyle = "#e0aaff"; }
                        ctx.fillText(catName, pX + 12, pY + 18);

                        // Награда в верхнем углу
                        ctx.textAlign = "right";
                        ctx.fillStyle = q.type === "mythic" ? "#ffff00" : "#8a6242";
                        ctx.fillText(`${q.data.gold}🪙`, pX + paperW - 12, pY + 18);

                        // Линия под шапкой
                        ctx.fillStyle = q.type === "mythic" ? "rgba(212, 175, 55, 0.3)" : "rgba(138, 98, 66, 0.15)";
                        ctx.fillRect(pX + 10, pY + 24, paperW - 20, 1);

                        // Название контракта по центру
                        ctx.textAlign = "center"; 
                        ctx.fillStyle = q.type === "mythic" ? "#ffffff" : "#1e120b"; 
                        ctx.font = "bold 11px system-ui";
                        let shortName = q.data.name.replace("📜 ", "").replace("📌 ", "").replace("👑 ", "");
                        if (shortName.length > 20) shortName = shortName.substring(0, 18) + "...";
                        ctx.fillText(shortName, pX + paperW/2, pY + 44);

                        // Иконка цели
                        ctx.font = "24px Arial";
                        let fishRef = fishDatabase[1].find(f => f.name === q.data.target);
                        ctx.fillText(fishRef ? fishRef.icon : "⚔️", pX + paperW/2, pY + 82);

                        // Требование по количеству
                        ctx.fillStyle = q.type === "mythic" ? "#ff99bb" : "#aa0000"; 
                        ctx.font = "bold 10px system-ui";
                        ctx.fillText(`Надо: ${q.data.count} шт.`, pX + paperW/2, pY + 114);

                        // Маленькая интерактивная подсказка
                        ctx.fillStyle = q.type === "mythic" ? "#b388ff" : "#7f6050"; 
                        ctx.font = "italic 9px system-ui";
                        ctx.fillText("Нажмите для деталей...", pX + paperW/2, pY + 145);
                    }

                    // Легкий фокус при наведении мыши
                    if (!q.completed && mouseX >= pX && mouseX <= pX + paperW &&
                        mouseY >= pY && mouseY <= pY + paperH) {
                        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.strokeRect(pX, pY, paperW, paperH);
                    }
                }

                // --- ОТРИСОВКА СВИТКА-ПЕРГАМЕНТА ПРИ КЛИКЕ НА КВЕСТ ---
                if (activeQuestItem !== null && activeQuestItem.data) {
                    let qData = activeQuestItem.data;
                    ctx.textAlign = "left";
                    
                    // Рисуем всплывающее JRPG окно в виде старинного свитка
                    ctx.fillStyle = "#f3e8c9"; ctx.fillRect(20, 75, 760, 435);
                    ctx.strokeStyle = "#5c3d2e"; ctx.lineWidth = 4; ctx.strokeRect(20, 75, 760, 435);
                    ctx.strokeStyle = "#8a6242"; ctx.lineWidth = 1; ctx.strokeRect(25, 80, 750, 425); 
                    
                    ctx.fillStyle = "#1e120b"; ctx.font = "bold 16px system-ui";
                    const cleanQuestName = String(qData.name).replace(/^(📜|📌|👑)\s*/, "");
                    ctx.fillText(`📜 Заказ: ${cleanQuestName}`, 45, 115);
                    
                    ctx.fillStyle = "rgba(92, 61, 46, 0.2)"; ctx.fillRect(45, 128, 710, 2); 

                    // ЧИСТЫЕ ЧЕРНИЛА БЕЗ ТЕНИ: Алгоритм разбиения и автопереноса лора на пергаменте
                    ctx.font = "bold 14px system-ui";
                    ctx.fillStyle = "#2d1e18"; 
                    
                    let words = qData.desc.split(" ");
                    let lines = [];
                    let currentLine = "";
                    let maxLineWidth = 700;
                    let textY = 160;
                    let lineHeight = 22;

                    for (let n = 0; n < words.length; n++) {
                        let testLine = currentLine + words[n] + " ";
                        let metrics = ctx.measureText(testLine);
                        if (metrics.width > maxLineWidth && n > 0) {
                            lines.push(currentLine);
                            currentLine = words[n] + " ";
                        } else {
                            currentLine = testLine;
                        }
                    }
                    lines.push(currentLine);

                    for (let k = 0; k < lines.length; k++) {
                        ctx.fillText(lines[k], 45, textY + (k * lineHeight));
                    }
                    
                    let totalInBag = 0;
                    inventory.forEach(s => { if (s && s.name === qData.target) totalInBag += (s.count || 1); });
                    
                    let statusColor = (totalInBag >= qData.count) ? "#1b5e20" : "#b71c1c"; 
                    
                    ctx.font = "bold 13px system-ui";
                    ctx.fillStyle = statusColor;
                    ctx.fillText(`Цель: Сдать ${qData.target} — ${qData.count} шт. (У вас в рюкзаке: ${totalInBag} шт.)`, 45, 442);
                    
                    const rewardText = questRewardText(qData);
                    if (rewardText) {
                        ctx.font = "bold 11px system-ui";
                        ctx.fillStyle = "#1b5e20";
                        ctx.fillText(rewardText, 45, 466);
                    }

                    ctx.fillStyle = "#795548";
                    ctx.fillText(`Награда за контракт: ${qData.gold} золотых монет 🪙  (+${qData.xp} XP)`, 45, 490);
                }

                drawUIPanel();
                drawButtons();
            }

            else if (gameState === "PONDBOARD") {
                drawPondScreen();
            }

            else if (gameState === "TALENTS") {
                // Космический глубокий фон
                ctx.fillStyle = "#05060a"; ctx.fillRect(0,0,800,600);
                
                // Главное рамное JRPG-окно
                drawWindow(15, 60, 770, 465, "🌌 Древо Пассивных Навыков — Путь Рыбака");

                let freePoints = (playerLevel - 1) - talentPointsSpent;
                ctx.textAlign = "center";
                if (freePoints > 0) {
                    drawTextWithShadow(`У вас есть нераспределенные Очки Мастерства: ${freePoints}`, 400, 115, "bold 13px system-ui", "#ffff00");
                } else {
                    drawTextWithShadow(`Все Очки Мастерства распределены. Следующее очко на новом уровне!`, 400, 115, "12px system-ui", "#aaaaaa");
                }

                // Центральная точка исхождения базовых веток
                let centerX = 400, centerY = 300;
                let glowAlpha = 0.25 + Math.sin(Date.now() / 150) * 0.1;
                ctx.lineWidth = 4;

                // --- ОТРИСОВКА НЕОНОВЫХ СВЯЗЕЙ ПУТЕЙ ---
                // 1 Путь (Зеленый)
                ctx.strokeStyle = (talents.fastHand > 0) ? "rgba(46, 204, 113, 0.9)" : `rgba(46, 204, 113, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(340, 340); ctx.stroke();
                ctx.strokeStyle = (talents.goodBait > 0) ? "rgba(46, 204, 113, 0.9)" : `rgba(46, 204, 113, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(340, 340); ctx.lineTo(280, 380); ctx.stroke();
                ctx.strokeStyle = (talents.bigBag) ? "rgba(46, 204, 113, 1.0)" : `rgba(46, 204, 113, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(280, 380); ctx.lineTo(220, 420); ctx.stroke();

                // 2 Путь (Синий)
                ctx.strokeStyle = (talents.goodDiscount > 0) ? "rgba(52, 152, 219, 0.9)" : `rgba(52, 152, 219, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(400, 370); ctx.stroke();
                ctx.strokeStyle = (talents.critCast > 0) ? "rgba(52, 152, 219, 0.9)" : `rgba(52, 152, 219, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(400, 370); ctx.lineTo(400, 440); ctx.stroke();
                ctx.strokeStyle = (talents.floatSlot) ? "rgba(52, 152, 219, 1.0)" : `rgba(52, 152, 219, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(400, 440); ctx.lineTo(400, 510); ctx.stroke();

                // 3 Путь (Красный)
                ctx.strokeStyle = (talents.merchantVein > 0) ? "rgba(231, 76, 60, 0.9)" : `rgba(231, 76, 60, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(460, 340); ctx.stroke();
                ctx.strokeStyle = (talents.rerollOnes > 0) ? "rgba(231, 76, 60, 0.9)" : `rgba(231, 76, 60, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(460, 340); ctx.lineTo(520, 380); ctx.stroke();
                ctx.strokeStyle = (talents.strongHand) ? "rgba(231, 76, 60, 1.0)" : `rgba(231, 76, 60, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(520, 380); ctx.lineTo(580, 420); ctx.stroke();

                // 4 Путь (Оранжевый - Уходит вверх)
                ctx.strokeStyle = (talents.questMaster > 0) ? "rgba(230, 126, 34, 0.9)" : `rgba(230, 126, 34, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(340, 260); ctx.stroke();
                ctx.strokeStyle = (talents.baitSaver > 0) ? "rgba(230, 126, 34, 0.9)" : `rgba(230, 126, 34, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(340, 260); ctx.lineTo(280, 220); ctx.stroke();
                ctx.strokeStyle = (talents.flawlessReputation) ? "rgba(230, 126, 34, 1.0)" : `rgba(230, 126, 34, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(280, 220); ctx.lineTo(220, 180); ctx.stroke();

                // 5 Путь (Фиолетовый - Уходит вверх)
                ctx.strokeStyle = (talents.valuableCatch > 0) ? "rgba(155, 89, 182, 0.9)" : `rgba(155, 89, 182, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(460, 260); ctx.stroke();
                ctx.strokeStyle = (talents.luckyEvents > 0) ? "rgba(155, 89, 182, 0.9)" : `rgba(155, 89, 182, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(460, 260); ctx.lineTo(520, 220); ctx.stroke();
                ctx.strokeStyle = (talents.invincible) ? "rgba(155, 89, 182, 1.0)" : `rgba(155, 89, 182, ${glowAlpha})`;
                ctx.beginPath(); ctx.moveTo(520, 220); ctx.lineTo(580, 180); ctx.stroke();

                // ОТРЕСОВКА ЦЕНТРАЛЬНОГО СТАРТОВОГО ЯДРА
                let corePulse = 16 + Math.sin(Date.now() / 100) * 2;
                let coreGrad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, corePulse);
                coreGrad.addColorStop(0, "#ffffff"); coreGrad.addColorStop(0.4, "#f1c40f"); coreGrad.addColorStop(1, "rgba(241, 196, 15, 0)");
                ctx.fillStyle = coreGrad; ctx.beginPath(); ctx.arc(centerX, centerY, corePulse, 0, Math.PI*2); ctx.fill();
                drawTextWithShadow("СТАРТ", centerX, centerY + 3, "bold 9px system-ui", "#111122");

                // ОТРЕСОВКА ЗВЕЗД-НОД
                let hoveredNode = null;
                talentNodes.forEach(node => {
                    let currentVal = talents[node.id] || 0;
                    let isUnlocked = (node.type === "minor" && currentVal > 0) || ((node.type === "major" || node.type === "final") && talents[node.id] === true);
                    let radius = (node.type === "minor") ? 13 : 18;

                    if (isUnlocked) {
                        ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.beginPath(); ctx.arc(node.x, node.y, radius + 6, 0, Math.PI*2); ctx.fill();
                    }
                    ctx.fillStyle = isUnlocked ? "#ffffff" : "#12141c";
                    ctx.beginPath(); ctx.arc(node.x, node.y, radius, 0, Math.PI*2); ctx.fill();

                    let edgeColor = "#2ecc71";
                    if (node.path === 2) edgeColor = "#3498db"; if (node.path === 3) edgeColor = "#e74c3c";
                    if (node.path === 4) edgeColor = "#e67e22"; if (node.path === 5) edgeColor = "#9b59b2";
                    if (node.path === 6) edgeColor = "#f1c40f";

                    ctx.strokeStyle = edgeColor; ctx.lineWidth = (node.type === "minor") ? 2 : 3;
                    ctx.beginPath(); ctx.arc(node.x, node.y, radius, 0, Math.PI*2); ctx.stroke(); // Метод ctx.stroke() исправлен!

                    ctx.font = (node.type === "minor") ? "bold 10px system-ui" : "bold 13px Arial";
                    ctx.fillStyle = isUnlocked ? "#111122" : "#ffffff";
                    ctx.textAlign = "center"; ctx.textBaseline = "middle";
                    let insideLabel = (node.type === "minor") ? `${currentVal}` : (node.type === "final" ? "👑" : "★");
                    ctx.fillText(insideLabel, node.x, node.y + (node.type === "minor" ? 1 : 0));
                    ctx.textBaseline = "alphabetic";

                    let dist = Math.sqrt((mouseX - node.x)**2 + (mouseY - node.y)**2);
                    if (dist <= radius + 2) {
                        hoveredNode = node; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(node.x, node.y, radius + 3, 0, Math.PI*2); ctx.stroke();
                    }
                });

                // ОТРЕСОВКА ТУЛТИПА ОПИСАНИЯ (ВСЕГДА ПОВЕРХ ВСЕГО)
                if (hoveredNode) {
                    let currentVal = talents[hoveredNode.id] || 0;
                    let tipW = 340, tipH = 160;
                    let tipX = mouseX + 15, tipY = mouseY + 15;
                    if (tipX + tipW > 800) tipX = mouseX - tipW - 15;
                    if (tipY + tipH > 600) tipY = mouseY - tipH - 15;

                    ctx.fillStyle = "rgba(6, 7, 12, 0.98)"; ctx.fillRect(tipX, tipY, tipW, tipH);
                    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.strokeRect(tipX, tipY, tipW, tipH);

                    ctx.textAlign = "left";
                    drawTextWithShadow(hoveredNode.name, tipX + 15, tipY + 25, "bold 13px system-ui", "#ffffff", tipW - 30);
                    
                    let pText = hoveredNode.type === "minor" ? `Прогресс: ${currentVal} / ${hoveredNode.max}` : (talents[hoveredNode.id] === true ? "[Изучено]" : "[Заблокировано]");
                    let pColor = currentVal === hoveredNode.max || talents[hoveredNode.id] === true ? "#88ff88" : "#f1c40f";
                    drawTextWithShadow(pText, tipX + 15, tipY + 45, "bold 11px system-ui", pColor, tipW - 30);
                    
                    ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(tipX + 12, tipY + 55); ctx.lineTo(tipX + tipW - 12, tipY + 55); ctx.stroke();
                    
                    drawTextWithShadow(hoveredNode.desc, tipX + 15, tipY + 75, "11px system-ui", "#e0e0e0", tipW - 30, 16);
                }

                ctx.textAlign = "left";
                drawUIPanel();
                drawButtons();
            }


            else if (gameState === "FISHING" || gameState === "FISHING_WAIT") {
                draw16BitWater(currentZone);
                
                drawWindow(130, 80, 540, 320, `⚓ Водоём: ${currentZone.name}`);
                
                ctx.fillStyle = "#fff";
                ctx.font = "14px 'system-ui'";
                
                let access = checkZoneAccess(currentZone.id);
                if (!access.allowed) {
                    ctx.fillStyle = "#ff5555";
                    ctx.fillText("ДОСТУП ЗАКРЫТ:", 160, 150);
                    ctx.fillText(access.msg, 160, 180);
                } else {
                    ctx.fillStyle = "#88ff88";
                    ctx.fillText("Условия выполнены. Можно забрасывать удочку.", 160, 140);
                    
                    // --- НАШ НОВЫЙ БЕЗОПАСНЫЙ БЛОК ХАРАКТЕРИСТИК ---
                    ctx.fillStyle = "#fff";
                    ctx.fillText(`Кубы сопротивления рыбы здесь: ${currentZone.dice}`, 160, 175);
                    
                    if (paperdoll.rod) {
                        ctx.fillText(`Ваше удилище бросает: ${paperdoll.rod.dice}`, 160, 205);
                    } else {
                        ctx.fillStyle = "#ff5555";
                        ctx.fillText(`Ваше удилище: НЕ ЭКИПИРОВАНО!`, 160, 205);
                        ctx.fillStyle = "#fff";
                    }

                    if (paperdoll.line) ctx.fillText(`Эффект лески: +${paperdoll.line.bonus}`, 160, 230);
                    else ctx.fillText(`Эффект лески: нет`, 160, 230);

                    if (paperdoll.bait) ctx.fillText(`Эффект наживки: -${paperdoll.bait.timeMod} сек. клёва`, 160, 255);
                    else ctx.fillText(`Эффект наживки: нет`, 160, 255);
                    // --- КОНЕЦ БЛОКА ---

                    if (gameState === "FISHING_WAIT") {
                        drawTextWithShadow("Поплавок коснулся воды. Ожидание...", 160, 290, "bold 13px system-ui", "#ffffff");
                        drawTextWithShadow("Ожидание поклёвки...", 290, 325, "bold 16px system-ui", "#ffff00");
                        
                        let bobberX = 398;
                        let bobberY = 345 + Math.sin(Date.now() / 200) * 4;
                        
                        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
                        ctx.lineWidth = 1;
                        let rippleRadius = 8 + (Math.sin(Date.now() / 150) * 3);
                        ctx.beginPath();
                        ctx.ellipse(bobberX + 8, bobberY + 20, rippleRadius * 1.5, rippleRadius * 0.5, 0, 0, Math.PI * 2);
                        ctx.stroke();

                        ctx.fillStyle = "#ff2222"; ctx.fillRect(bobberX, bobberY, 16, 12);
                        ctx.fillStyle = "#ffffff"; ctx.fillRect(bobberX, bobberY + 12, 16, 8);

                        if (hasEventTriggered && isPositiveEventActive && Math.random() < 0.1) {
                            createSparkles(bobberX + 8, bobberY, 2);
                        }

                        if (hasEventTriggered && eventLogText !== "") {
                            drawTextWithShadow(eventLogText, 50, 495, "bold 14px system-ui", "#ffff00", 700, 20);
                        }
                    }
                }

                if (inventory.length >= maxInventorySlots) {
                    ctx.fillStyle = "#ff3333";
                    ctx.fillText("Ваша сумка забита! Продайте рыбу в магазине.", 160, 285);
                }

                updateAndDrawParticles();

                drawUIPanel();
                drawButtons();
            }

            else if (gameState === "BATTLE") {
                // Фоновое окно боя (подстраивается под цвет текущей зоны)
                ctx.fillStyle = (currentZone && currentZone.color) ? currentZone.color : "#111122"; 
                ctx.fillRect(0,0,800,600);
                
                // 1. Окно персонажа (Левое)
                drawWindow(40, 90, 240, 160, "🧙 Вы");
                drawTextWithShadow(`Снаряжение на кукле:`, 55, 145, "bold 11px system-ui", "#aaaaaa");
                
                let rName = paperdoll.rod ? paperdoll.rod.name : "Нет удочки";
                let rDice = paperdoll.rod ? paperdoll.rod.dice : "0d0";
                drawTextWithShadow(`• ${rName} (${rDice})`, 55, 170, "bold 11px system-ui", "#ffff00");
                
                if (paperdoll.line) {
                    drawTextWithShadow(`• Леска: +${paperdoll.line.bonus} к силе`, 55, 195, "bold 11px system-ui", "#88ff88");
                } else {
                    drawTextWithShadow(`• Леска: нет бонуса`, 55, 195, "bold 11px system-ui", "#aaaaaa");
                }
                
                if (paperdoll.bait) {
                    drawTextWithShadow(`• Наживка: ${paperdoll.bait.name}`, 55, 220, "bold 11px system-ui", "#a335ee");
                } else {
                    drawTextWithShadow(`• Наживка: нет`, 55, 220, "bold 11px system-ui", "#aaaaaa");
                }

                // 2. Окно Рыбы (Правое)
                drawWindow(520, 90, 240, 160, "🐟 Добыча на крючке");
                if (activeFish) {
                    let rColor = "#ffffff";
                    if (activeFish.rarity === "необычная") rColor = "#1eff00";
                    if (activeFish.rarity === "редкая") rColor = "#0070dd";
                    if (activeFish.rarity === "очень редкая") rColor = "#a335ee";
                    if (activeFish.rarity === "мифическая") rColor = "#ff8000";
                    if (activeFish.rarity === "легендарная") rColor = "#e6cc80";

                    drawTextWithShadow(activeFish.name, 535, 145, "bold 13px system-ui", rColor, 210);
                    drawTextWithShadow(`Ранг: ${activeFish.rarity.toUpperCase()}`, 535, 170, "bold 10px system-ui", "#aaaaaa");
                    
                    let fishBonus = checkRarityRank(activeFish.rarity);
                    const uiSteps = (currentZone && currentZone.rankSteps) ? currentZone.rankSteps : [0, 1, 2, 3, 4, 5];
                    const uiDiff = (currentZone && currentZone.difficulty) || 0;
                    let zoneDice = (currentZone && currentZone.dice) ? currentZone.dice : "1d4";
                    drawTextWithShadow(`Сопротивление: ${zoneDice} (+${uiDiff + uiSteps[fishBonus]})`, 535, 205, "bold 11px system-ui", "#ff5555");
                }

                // 3. Главное текстовое лог-окно по центру
                drawWindow(40, 270, 720, 130, "⚔️ Ход Сражения");
                drawTextWithShadow(battleLog, 60, 320, "bold 13px system-ui", "#ffffff", 680);

                // Если активен прикорм, выводим индикатор прямо в лог-окошке
                if (activeChum && activeChum.charges > 0) {
                    drawTextWithShadow(`🥫 Прикорм на «${activeChum.rarity}» (зарядов: ${activeChum.charges})`, 60, 375, "bold 11px system-ui", "#ff8000");
                }

                // --- ОТРИСОВКА КРУТЯЩИХСЯ КУБИКОВ ОНЛАЙН ---
                if (battleStatus === "ROLLING") {
                    // Рисуем СИНИЕ кубики игрока
                    playerDiceValues.forEach((val, idx) => {
                        let x = 70 + idx * 45;
                        let y = 335 + Math.sin(Date.now() / 50 + idx) * 3; 
                        ctx.fillStyle = "#0055ff"; ctx.fillRect(x, y, 28, 28);
                        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.strokeRect(x, y, 28, 28);
                        drawTextWithShadow(val.toString(), x + 9, y + 19, "bold 14px system-ui", "#ffffff");
                    });

                    // Рисуем КРАСНЫЕ кубики рыбы
                    fishDiceValues.forEach((val, idx) => {
                        let x = 550 + idx * 45;
                        let y = 335 + Math.sin(Date.now() / 50 + idx + 5) * 3;
                        ctx.fillStyle = "#cc0000"; ctx.fillRect(x, y, 28, 28);
                        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.strokeRect(x, y, 28, 28);
                        drawTextWithShadow(val.toString(), x + 9, y + 19, "bold 14px system-ui", "#ffffff");
                    });
                }

                // Вывод результатов после окончания вращения костей
                if (playerRollResult !== null && fishRollResult !== null && battleStatus !== "ROLLING") {
                    drawTextWithShadow(`Ваш бросок: ${playerRollResult}`, 60, 350, "bold 14px system-ui", "#5588ff");
                    drawTextWithShadow(`Бросок рыбы: ${fishRollResult}`, 530, 350, "bold 14px system-ui", "#ff5555");
                }

                // ИСПРАВЛЕНО: Если это первая поимка рыбы, выводим сочное золотое уведомление 
                // строго на свободное место в самом низу окна боя (Y = 382) под бросками кубиков
                if (playerRollResult !== null && battleStatus !== "ROLLING" && eventLogText !== "") {
                    drawTextWithShadow(eventLogText, 60, 382, "bold 12px system-ui", "#ffff00", 680);
                }


                drawUIPanel();
                drawButtons();
            }

            else if (gameState === "BAG") {
                ctx.fillStyle = "#0c0d14"; ctx.fillRect(0,0,800,600); // Темно-стальной фон рюкзака WoW
                
                ctx.textAlign = "left"; 
                drawWindow(15, 50, 770, 470, `🎒 Походная сумка рыболова [${inventory.length}/${maxInventorySlots}]`);

                let slotSize = 56;
                let gap = 8;
                let cols = 10;
                let startX = 84;
                let startY = 175;

                let hoveredFish = null;
                const bagPages = Math.max(1, Math.ceil(maxInventorySlots / BAG_PAGE_SIZE));
                if (bagPage >= bagPages) bagPage = 0;

                // --- Слоты под сумки ---
                drawTextWithShadow("Сумки:", 38, 118, "bold 12px system-ui", "#ffffff");
                for (let b = 0; b < 4; b++) {
                    let bx = 110 + b * 60;
                    let by = 92;
                    let bag = equippedBags[b];
                    ctx.fillStyle = "#1b1d26";
                    ctx.fillRect(bx, by, 52, 52);
                    ctx.strokeStyle = bag ? "#33bb66" : "rgba(80,90,110,0.6)";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(bx, by, 52, 52);
                    ctx.textAlign = "center"; ctx.textBaseline = "middle";
                    if (bag) {
                        ctx.font = "26px Arial"; ctx.fillStyle = "#ffffff";
                        ctx.fillText(bag.icon || "👜", bx + 26, by + 24);
                        ctx.font = "bold 9px system-ui"; ctx.fillStyle = "#9ff5a8";
                        ctx.fillText(`+${bag.slots}`, bx + 26, by + 47);
                        if (mouseX >= bx && mouseX <= bx + 52 && mouseY >= by && mouseY <= by + 52) {
                            hoveredFish = bag;
                            ctx.strokeStyle = "#f1c40f";
                            ctx.strokeRect(bx, by, 52, 52);
                        }
                    } else {
                        ctx.font = "20px Arial"; ctx.fillStyle = "rgba(255,255,255,0.12)";
                        ctx.fillText("👜", bx + 26, by + 26);
                    }
                    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
                }
                drawTextWithShadow(`База: ${baseInventorySlots} + сумки: ${bagSlotsBonus()} = ${maxInventorySlots} ячеек`, 380, 118, "bold 12px system-ui", "#cfd8e3", 380);

                // --- Сетка предметов ---
                for (let s = 0; s < BAG_PAGE_SIZE; s++) {
                    let idx = bagPage * BAG_PAGE_SIZE + s;
                    let row = Math.floor(s / cols);
                    let col = s % cols;
                    let slotX = startX + col * (slotSize + gap);
                    let slotY = startY + row * (slotSize + gap);
                    let inCapacity = idx < maxInventorySlots;

                    ctx.fillStyle = inCapacity ? "#1b1d26" : "#12131a";
                    ctx.fillRect(slotX, slotY, slotSize, slotSize);
                    
                    ctx.strokeStyle = inCapacity ? "#3a3f4d" : "rgba(60,68,84,0.4)";
                    ctx.lineWidth = 2;

                    if (inCapacity && inventory[idx]) {
                        let fish = inventory[idx];
                        if (fish.rarity === "обычная") ctx.strokeStyle = "#9d9d9d";      
                        if (fish.rarity === "необычная") ctx.strokeStyle = "#1eff00";    
                        if (fish.rarity === "редкая") ctx.strokeStyle = "#0070dd";       
                        if (fish.rarity === "очень редкая") ctx.strokeStyle = "#a335ee"; 
                        if (fish.rarity === "мифическая") ctx.strokeStyle = "#ff8000";   
                        if (fish.rarity === "легендарная") ctx.strokeStyle = "#e6cc80";  

                        ctx.font = "26px Arial";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(fish.icon || "🐟", slotX + slotSize/2, slotY + slotSize/2 + 2);
                        ctx.textBaseline = "alphabetic"; 

                        // Отображение количества предметов в стаке
                        if (fish.count && fish.count > 1) {
                            ctx.font = "bold 11px system-ui";
                            ctx.textAlign = "right";
                            
                            ctx.fillStyle = "#000000";
                            ctx.fillText(`x${fish.count}`, slotX + slotSize - 4, slotY + slotSize - 4);
                            ctx.fillText(`x${fish.count}`, slotX + slotSize - 6, slotY + slotSize - 4);
                            ctx.fillText(`x${fish.count}`, slotX + slotSize - 5, slotY + slotSize - 3);
                            ctx.fillText(`x${fish.count}`, slotX + slotSize - 5, slotY + slotSize - 5);
                            
                            ctx.fillStyle = "#ffffff";
                            ctx.fillText(`x${fish.count}`, slotX + slotSize - 5, slotY + slotSize - 5);
                            ctx.textAlign = "left"; 
                        }

                        if (mouseX >= slotX && mouseX <= slotX + slotSize &&
                            mouseY >= slotY && mouseY <= slotY + slotSize) {
                            hoveredFish = fish; 
                            ctx.strokeStyle = "#f1c40f";
                            ctx.lineWidth = 4;
                        }
                    }
                    ctx.strokeRect(slotX, slotY, slotSize, slotSize);
                }

                // Подсказка по сумкам
                if (activeContextItem === null) {
                    drawTextWithShadow("Клик по надетой сумке — снять её. Сумки покупаются в лавке, выдаются за задания и иногда попадаются в улове.", 40, 432, "11px system-ui", "#6f7f96", 730);
                }

                // Индикатор прикорма в рюкзаке
                if (activeContextItem === null && activeChum && activeChum.charges > 0) {
                    ctx.textAlign = "left";
                    drawTextWithShadow(`🥫 Прикорм на «${activeChum.rarity}»: ${Math.round(activeChum.chance * 100)}%, ещё ${activeChum.charges} заброс(а).`, 40, 374, "bold 12px system-ui", "#ff8000", 550);
                }

                // Страницы рюкзака
                if (bagPages > 1) {
                    ctx.textAlign = "center";
                    drawTextWithShadow(`Стр. ${bagPage + 1} / ${bagPages}`, 670, 386, "bold 11px system-ui", "#9aa7bd");
                    ctx.textAlign = "left";
                }

                // Всплывающее меню действий
                if (activeContextItem !== null) {
                    ctx.textAlign = "left";
                    drawWindow(20, 415, 760, 100, "⚙️ Меню Действий");
                    
                    if (isDeleteConfirmationActive) {
                        drawTextWithShadow(`⚠️ ВНИМАНИЕ: Вы действительно хотите уничтожить "${activeContextItem.name}" НАВСЕГДА?`, 25, 402, "bold 12px system-ui", "#ff3333", 750);
                    } else {
                        drawTextWithShadow(`Выбран предмет: ${activeContextItem.name}`, 25, 402, "bold 13px system-ui", "#ffff00", 750);
                    }
                    
                    let sIdx = activeContextIndex - bagPage * BAG_PAGE_SIZE;
                    if (sIdx >= 0 && sIdx < BAG_PAGE_SIZE) {
                        let row = Math.floor(sIdx / cols);
                        let col = sIdx % cols;
                        let selX = startX + col * (slotSize + gap);
                        let selY = startY + row * (slotSize + gap);
                        ctx.strokeStyle = "#ffff00";
                        ctx.lineWidth = 4;
                        ctx.strokeRect(selX, selY, slotSize, slotSize);
                    }
                }

                drawUIPanel();
                drawButtons();

                // Окно описания WoW Tooltip (рисуется на самом верхнем слое)
                if (hoveredFish) {
                    let tipW = 320; let tipH = 150;
                    let tipX = mouseX + 15; let tipY = mouseY + 15;

                    if (tipX + tipW > 800) tipX = mouseX - tipW - 15;
                    if (tipY + tipH > 600) tipY = mouseY - tipH - 15;

                    ctx.fillStyle = "rgba(0, 0, 100, 0.95)"; ctx.fillRect(tipX, tipY, tipW, tipH);
                    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.strokeRect(tipX + 1, tipY + 1, tipW - 2, tipH - 2);

                    let rColor = "#ffffff";
                    if (hoveredFish.rarity === "необычная") rColor = "#1eff00";
                    if (hoveredFish.rarity === "редкая") rColor = "#0070dd";
                    if (hoveredFish.rarity === "очень редкая") rColor = "#a335ee";
                    if (hoveredFish.rarity === "мифическая") rColor = "#ff8000";
                    if (hoveredFish.rarity === "легендарная") rColor = "#e6cc80";

                    let currentRarity = hoveredFish.rarity || "обычная";
                    ctx.textAlign = "left";
                    drawTextWithShadow(hoveredFish.name, tipX + 15, tipY + 25, "bold 12px system-ui", rColor, tipW - 30);
                    drawTextWithShadow(`Ранг: ${currentRarity.toUpperCase()}`, tipX + 15, tipY + 45, "bold 11px system-ui", "#aaaaaa", tipW - 30);
                    
                    let priceText = (hoveredFish.price !== undefined && hoveredFish.price > 0) ? `${hoveredFish.price} 🪙` : "Не продается";
                    drawTextWithShadow(`Цена: ${priceText}`, tipX + 15, tipY + 65, "bold 12px system-ui", "#ffff00", tipW - 30);
                    
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(tipX + 10, tipY + 75); ctx.lineTo(tipX + tipW - 10, tipY + 75); ctx.stroke();

                    let displayDesc = hoveredFish.desc || "Рыболовная снасть или болотный улов.";
                    drawTextWithShadow(displayDesc, tipX + 15, tipY + 95, "11px system-ui", "#ffffff", tipW - 30, 16);
                }
            }

            else if (gameState === "ELDER") {
                // Уютный тёмно-зеленый бревенчатый фон избушки
                ctx.fillStyle = "#111812"; ctx.fillRect(0,0,800,600);
                
                drawWindow(15, 40, 770, 480, "🏡 Изба Деревенского Старосты");

                ctx.fillStyle = "#fff";
                ctx.font = "bold 15px 'Courier New'";

                // Ситуация 1: У игрока НЕТ таланта "Доверие Гильдии"
                if (talents.bigBag !== true) {
                    ctx.fillText("Староста недовольно откладывает в сторону курительную трубку:", 45, 120);
                    
                    ctx.fillStyle = "#ff5555";
                    ctx.font = "14px system-ui";
                    let closedText = "«А, городской... Работу ищешь? В таверне народ поспрашивай, там всегда кому руки нужны. А свои поручения я даю только проверенным людям — тем, за кого поручилась Гильдия рыболовов. Принесёшь патент — приходи, поговорим по-настоящему».";
                    drawTextWithShadow(closedText, 45, 160, "bold 14px system-ui", "#e8c46a", 700, 24);
                } 
                // Ситуация 2: Талант есть, выводим редкую цепочку
                else {
                    let step = questProgress.chainRareElder;
                    if (step <= 3) {
                        let qData = questDatabase.rareElder[step];
                        
                        ctx.fillStyle = "#85e085";
                        ctx.fillText(`📜 РЕДКИЙ КОНТРАКТ ГИЛЬДИИ: Этап ${step} из 3`, 45, 110);
                        
                        ctx.fillStyle = "#ffffff";
                        ctx.fillText(`Задание: ${qData.name}`, 45, 135);
                        
                        ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fillRect(45, 148, 710, 2);

                        // Описание лора редкого квеста от Старосты
                        drawTextWithShadow(qData.desc, 45, 175, "bold 13px system-ui", "#f1ebd9", 700, 22);

                        // Вывод прогресса по рыбе в рюкзаке
                        let totalFound = 0;
                        inventory.forEach(s => { if (s && s.name === qData.target) totalFound += (s.count || 1); });
                        let statusColor = (totalFound >= qData.count) ? "#88ff88" : "#ff5555";
                        
                        drawTextWithShadow(`Требование: Собрать ${qData.target} — ${qData.count} шт. (В наличии: ${totalFound} шт.)`, 45, 410, "bold 12px system-ui", statusColor);
                        drawTextWithShadow(`Награда: ${qData.gold} 🪙  (+${qData.xp} XP)`, 45, 435, "bold 12px system-ui", "#ffff00");
                    } else {
                        // Цепочка полностью завершена
                        ctx.fillStyle = "#ffff00";
                        ctx.fillText("👑 ВСЕ РЕДКИЕ ПОРУЧЕНИЯ СТАРОСТЫ ВЫПОЛНЕНЫ!", 45, 150);
                        drawTextWithShadow("«Ты доказал делом, что достоин имени своего великого дедушки. Болото спит спокойно благодаря твоим навыкам!»", 45, 190, "italic 14px system-ui", "#ffffff", 700, 22);
                    }
                }

                drawUIPanel();
                drawButtons();
            }


            drawGameToasts();
        } // <--- ЭТО СТРОГАЯ ЗАКРЫВАЮЩАЯ СКОБКА ФУНКЦИИ DRAW(). НИЖЕ НИКАКОГО ЛИШНЕГО КОДА!
