---
title: "DeepSeek 提示詞入門：減少空泛回答與幻覺"
description: "用角色、任務、輸出格式三要素撰寫 DeepSeek 提示詞，並透過 Few-Shot 與約束條件降低幻覺與格式錯誤。"
date: 2026-06-27
updated: 2026-07-02
featured: true
coverImage: "/static/posts/deepseek-prompt-cover.svg"
tags: ["posts"]
layout: "layouts/post.njk"
permalink: "/posts/deepseek-prompt-basics/index.html"
---

提示詞寫得好不好，差別往往在於模型是否清楚知道「要做什麼、按什麼格式輸出、哪些內容不能編造」。接入 API 時若遇到格式錯誤或 429，請搭配 [密鑰與限流指南](/posts/deepseek-api-key-and-limits/) 一併排查。

## 三要素模板

![DeepSeek 提示詞三要素結構](/static/posts/deepseek-prompt-step.svg)

每次寫 Prompt 至少包含：

1. **角色**：你希望模型扮演什麼身份（例如：資深 Python 工程師）
2. **任務**：具體要完成什麼（例如：把以下 JSON 轉成 Markdown 表格）
3. **輸出格式**：列點、表格、JSON、字數上限等

示例：

```
你是資深技術文件編輯。請把以下 API 錯誤說明改寫為繁體中文 FAQ。
要求：
- 使用 ## 作為每題標題
- 每題回答不超過 80 字
- 不確定的內容標註「需官方確認」
```

## 減少幻覺的約束

- 要求「僅根據提供的材料回答，材料不足時明確說不知道」
- 需要引用時，指定「逐條對應原文段落」
- 對數字、日期、法規類內容，要求標註來源或寫「待核實」

## Few-Shot 示例

給 1–2 個輸入輸出示例，比長篇描述更有效。例如做分類任務：

```
輸入：登入時出現 503
輸出：{"type":"server","action":"retry_later"}

輸入：API 返回 401
輸出：{"type":"auth","action":"check_api_key"}
```

## 常見問題與修正

| 問題 | 原因 | 修正 |
|------|------|------|
| 回答太長 | 未限制字數 | 加入「不超過 N 字」 |
| 格式混亂 | 未指定格式 | 要求 JSON / Markdown 模板 |
| 自行補充不存在的功能 | 缺少边界 | 加入「不得臆測未提供的信息」 |
| 繁簡混用 | 未指定語言 | 明確寫「使用香港繁體中文」 |

## 迭代方式

1. 先用短 Prompt 測試能否完成任務
2. 看輸出差異，再補充約束
3. 固定可用的 Prompt 存成模板，避免每次從零寫起

好的提示詞不是越長越好，而是约束清楚、示例具體、边界明確。離線驗證 Prompt 可試 [Ollama 本地部署](/posts/deepseek-ollama-local-setup/)；API 調用不穩時見 [重試與熔斷策略](/posts/deepseek-api-retry-guide/)。

## 相關教程

- [API 密鑰、限流與 429](/posts/deepseek-api-key-and-limits/)
- [503/429 重試與熔斷策略](/posts/deepseek-api-retry-guide/)
- [網頁版登入失敗排查](/posts/deepseek-web-login-troubleshoot/)
- [Ollama 本地部署 DeepSeek](/posts/deepseek-ollama-local-setup/)
