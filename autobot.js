const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

async function runAutoBot() {
    // 1. 檢查環境變量中是否存在金鑰
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("⚠️ [環境提示] 未檢測到 GEMINI_API_KEY 環境金鑰。打包階段跳過生成。");
        return; 
    }

    // 從命令列參數中獲取需要生成的文章篇數
    const args = process.argv.slice(2);
    let maxPosts = parseInt(args[0], 10) || 1;
    console.log(`🤖 收到發文指令，本次任務嘗試批量生成: ${maxPosts} 篇文章`);

    // 2. 初始化 Gemini 客戶端
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // 將所有詞庫與圖片庫路徑對齊至新架構的 src 目錄下
    const jsonPath = path.join(__dirname, 'src', 'keywords.json');   
    const imagesPath = path.join(__dirname, 'src', 'images.txt'); 
    
    // 3. 檢查並讀取 JSON 關鍵詞文本
    if (!fs.existsSync(jsonPath)) {
        console.warn(`⚠️ 未找到詞庫文件: ${jsonPath}，跳過本次生成。`);
        return;
    }
    
    let keywords = [];
    try {
        keywords = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } catch (e) {
        console.error("⚠️ 讀取或解析 keywords.json 失敗，請檢查JSON語法:", e.message);
        return;
    }
    
    if (!Array.isArray(keywords) || keywords.length === 0) {
        console.warn("⚠️ 關鍵詞庫為空或格式非陣列，請及時補充新選題！");
        return;
    }

    // 調整生成數量
    if (maxPosts > keywords.length) {
        console.log(`💡 提示：輸入的數量 ${maxPosts} 大於詞庫剩餘詞量 ${keywords.length}，將生成現存的全部文章。`);
        maxPosts = keywords.length;
    }

    // 循環批量生成
    for (let currentLoop = 0; currentLoop < maxPosts; currentLoop++) {
        console.log(`\n------------------ 正在處理第 ${currentLoop + 1} / ${maxPosts} 篇 ------------------`);

        // 4. 提取並準備隨機圖片連結
        let selectedImages = [];
        if (fs.existsSync(imagesPath)) {
            try {
                const allImages = fs.readFileSync(imagesPath, 'utf-8')
                    .split(/\r?\n/)
                    .map(line => line.trim()) 
                    .filter(line => line.length > 0 && line.startsWith('http'));

                if (allImages.length >= 2) {
                    const shuffled = allImages.sort(() => 0.5 - Math.random());
                    selectedImages = shuffled.slice(0, 2);
                    console.log(`圖片配給成功: 1. ${selectedImages[0]} | 2. ${selectedImages[1]}`);
                } else if (allImages.length === 1) {
                    selectedImages = [allImages[0], allImages[0]];
                }
            } catch (e) {
                console.error("⚠️ 讀取 images.txt 失敗，本篇生成將不帶插圖:", e.message);
            }
        }

        // 5. 彈出並消費第一個關鍵詞
        const currentTopic = keywords.shift();
        console.log(`當前推文選題確定: [ ${currentTopic} ]`);

        // 手動提取香港時間的 年、月、日
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('zh-HK', {
            timeZone: 'Asia/Hong_Kong',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const parts = formatter.formatToParts(now);
        const year = parts.find(p => p.type === 'year').value;
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        
        const todayStr = `${year}-${month}-${day}`; 
        const randomId = Math.floor(100 + Math.random() * 900); 

        // 6. 構造圖片指導 Prompt
        let imagePromptInstruction = '';
        if (selectedImages.length === 2) {
            imagePromptInstruction = `
    4. 【插圖嵌入要求】：
       請在撰寫文章正文時，將以下兩個圖片連結【嚴格、自然地】嵌入到不同的二級標題（##）或段落之間，提升排版豐富度。
       必須使用標準的 Markdown 圖片格式，且必須補充具有 SEO 價值、使用繁體中文的 alt 描述（嚴禁包含中文百分號或特殊字元）。
       
       圖片連結 1：${selectedImages[0]}
       圖片連結 2：${selectedImages[1]}
       
       例如嵌入格式：![DeepSeek 香港企業應用架構演示](${selectedImages[0]})
            `;
        }

        // 7. 構造 SEO Prompt 模板（降低 AI 痕跡）
        const prompt = `
    你是熟悉 DeepSeek 與 API 開發的技術寫作者。請針對主題 "${currentTopic}" 撰寫一篇【香港繁體中文】實用教程，字數 900-1500 字。
    
    【輸出格式】：
    1. 將主題 "${currentTopic}" 翻譯為簡短英文 slug（小寫、連字符分隔），用於 URL。
    2. 嚴格按以下 Markdown 頭部輸出，直接以 --- 開頭，不要包裹 \`\`\`markdown：

    ---
    title: "${currentTopic}"
    description: "用一句話概括本文解決的具體問題與適用場景，40-80 字，禁止套用模板句。"
    date: ${todayStr}
    generated: true
    tags: ["posts"]
    layout: "layouts/post.njk"
    permalink: "/posts/${todayStr}-你的英文slug-${randomId}/index.html"
    ---

    【正文要求】：
    - 禁止以「身為一名」「今日我們將深入探討」等自介開頭；直接進入問題或步驟。
    - 禁止虛構「官方」「權威入口」「站群」「SEO 爆款」等表述；DeepSeek 相關入口請寫 chat.deepseek.com 或平台公開名稱。
    - 禁止在正文第一行使用 # 一級標題；從 ## 二級標題或短引言開始。
    - 多用步驟清單、表格、代碼示例；每個 ## 段落要有可執行信息，避免空泛形容。
    - description 必須針對本文獨立撰寫，不得包含「專業技術解析與香港本地化實操指南」字樣。
    ${imagePromptInstruction}
        `;

        // 智能抗併發自動重試機制
        let response;
        let retryCount = 0;
        const maxRetries = 3;
        const delay = (ms) => new Promise(res => setTimeout(res, ms));

        while (retryCount < maxRetries) {
            try {
                console.log(`正在連接 Gemini API 生產高質量繁體內容... (嘗試第 ${retryCount + 1} 次)`);
                
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });

                if (response && response.text) {
                    console.log("🎉 Gemini API 響應成功！已順利拿到繁體正文。");
                    break; 
                } else {
                    throw new Error("Gemini 返回內容為空");
                }
            } catch (error) {
                retryCount++;
                const errMsg = error.message.toLowerCase();
                if (errMsg.includes('503') || errMsg.includes('unavailable') || errMsg.includes('429')) {
                    if (retryCount < maxRetries) {
                        console.warn(`⚠️ Google 服務器正值流量高峰 (503/429)。原地等待 5 秒後自動重試...`);
                        await delay(5000); 
                    }
                } else {
                    throw error;
                }
            }
        }

        if (!response || !response.text) {
            console.error(`❌ 連續重試 ${maxRetries} 次後 Gemini API 依然處於高載狀態，將本期選題塞回詞庫，跳過本篇。`);
            keywords.unshift(currentTopic);
            continue; 
        }

        try {
            let articleContent = response.text;
            articleContent = articleContent.replace(/permalink:\s*["']?\/posts\/([^"'\n]+)["']?/g, 'permalink: "/posts/$1"');

            const fileName = `${todayStr}-post-${randomId}-${currentLoop}.md`;
            const outputDir = path.join(__dirname, 'src', 'posts'); 
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            fs.writeFileSync(path.join(outputDir, fileName), articleContent, 'utf-8');
            console.log(`✅ 第 ${currentLoop + 1} 篇文章已成功寫入本地磁碟: src/posts/${fileName}`);

        } catch (error) {
            console.error(`❌ 第 ${currentLoop + 1} 篇文章寫入磁碟時遭遇錯誤:`, error.message);
            keywords.unshift(currentTopic);
        }
    }

    try {
        fs.writeFileSync(jsonPath, JSON.stringify(keywords, null, 2), 'utf-8');
        console.log(`\n📉 詞庫整體更新完畢！剩餘可用關鍵詞數: ${keywords.length}`);
    } catch (e) {
        console.error("❌ 回寫 keywords.json 失敗:", e.message);
    }
}

runAutoBot();