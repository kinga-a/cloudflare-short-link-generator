export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // 处理首页 - 显示创建页面
        if (path === '/') {
            return handleHomePage();
        }

        // 处理统计页面
        if (path === '/stats') {
            return handleStatsPage();
        }

        // 处理API路由
        if (path.startsWith('/api/')) {
            return handleAPI(request, env, path);
        }

        // 处理短链接访问
        if (path.length > 1) {
            return handleShortLink(request, env, path.substring(1));
        }

        return new Response('未找到页面', { status: 404 });
    }
};

// 生成随机短码
function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 检查字符串是否为有效URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// 处理首页
function handleHomePage() {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔗短链接生成器</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 100%;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .form-group { margin-bottom: 20px; }
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        textarea, input[type="text"], select {
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="checkbox"] { width: auto; padding: 0; margin: 0; }
        textarea { min-height: 120px; resize: vertical; }
        textarea:focus, input[type="text"]:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .result { margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px; display: none; }
        .result.show { display: block; }
        .short-link {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            word-break: break-all;
            font-family: monospace;
        }
        .copy-btn {
            background: #4caf50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 10px;
        }
        .loading { display: none; text-align: center; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔗 短链接生成器</h1>
        <form id="linkForm">
            <div class="form-group">
                <label for="content">输入长链接或任意文本内容：</label>
                <textarea id="content" placeholder="请输入要缩短的URL或文本内容..." required></textarea>
            </div>
            
            <div class="form-group">
                <label for="customCode">自定义短码（可选）：</label>
                <input type="text" id="customCode" placeholder="留空则自动生成" maxlength="20">
            </div>
            
            <div class="form-group">
                <label for="expiration">链接有效期：</label>
                <select id="expiration">
                    <option value="never">永不过期</option>
                    <option value="10m">10分钟</option>
                    <option value="30m">30分钟</option>
                    <option value="1h">1小时</option>
                    <option value="24h">24小时</option>
                    <option value="7d">7天</option>
                    <option value="30d">30天</option>
                </select>
            </div>
            
            <div class="form-group">
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <input type="checkbox" id="rawDisplay" style="margin-right: 8px;">
                    <label for="rawDisplay" style="margin: 0; cursor: pointer;">显示原始内容</label>
                </div>
                <small style="display: block; color: #666; margin-left: 24px;">
                    启用后，文本内容将以纯文本形式显示，而不是格式化页面
                </small>
            </div>
            
            <button type="submit" class="btn">生成短链接</button>
            
            <div class="loading"><p>正在生成...</p></div>
        </form>
        
        <div id="result" class="result">
            <h3>生成成功！</h3>
            <div class="short-link">
                <span id="shortUrl"></span>
                <button class="copy-btn" onclick="copyToClipboard()">复制</button>
            </div>
            <p>点击短链接访问原始内容</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <a href="/stats" style="color: #667eea; text-decoration: none;">📊 查看统计数据</a>
        </div>
    </div>

    <script>
        document.getElementById('linkForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const content = document.getElementById('content').value;
            const customCode = document.getElementById('customCode').value;
            const expiration = document.getElementById('expiration').value;
            const rawDisplay = document.getElementById('rawDisplay').checked;
            const loading = document.querySelector('.loading');
            const result = document.getElementById('result');
            
            loading.style.display = 'block';
            result.classList.remove('show');
            
            try {
                const response = await fetch('/api/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, customCode, expiration, rawDisplay })
                });
                const data = await response.json();
                if (data.success) {
                    document.getElementById('shortUrl').textContent = data.shortUrl;
                    result.classList.add('show');
                } else {
                    alert('生成失败：' + data.error);
                }
            } catch (error) {
                alert('网络错误：' + error.message);
            } finally {
                loading.style.display = 'none';
            }
        });
        
        function copyToClipboard() {
            const shortUrl = document.getElementById('shortUrl').textContent;
            navigator.clipboard.writeText(shortUrl).then(() => alert('已复制到剪贴板！'));
        }
    </script>
</body>
</html>`;

    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// 处理统计页面
function handleStatsPage() {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>短链接统计</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 100%;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .search-form { margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        input[type="text"] {
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .stats-result { margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px; display: none; }
        .stats-result.show { display: block; }
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e1e5e9;
        }
        .stat-item:last-child { border-bottom: none; }
        .stat-label { font-weight: 500; color: #555; }
        .stat-value { color: #333; font-family: monospace; }
        .error { color: #dc3545; text-align: center; padding: 20px; }
        .back-link {
            text-align: center;
            margin-top: 20px;
        }
        .back-link a {
            color: #667eea;
            text-decoration: none;
        }
        .back-link a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 链接统计</h1>
        <div class="search-form">
            <div class="form-group">
                <label for="shortCode">输入短码查看统计信息：</label>
                <input type="text" id="shortCode" placeholder="例如：abc123" required>
            </div>
            <button onclick="getStats()" class="btn">获取统计信息</button>
        </div>
        <div id="statsResult" class="stats-result">
            <div id="statsContent"></div>
        </div>
        <div class="back-link">
            <a href="/">← 返回生成器</a>
        </div>
    </div>

    <script>
        async function getStats() {
            const shortCode = document.getElementById('shortCode').value.trim();
            const resultDiv = document.getElementById('statsResult');
            const contentDiv = document.getElementById('statsContent');
            if (!shortCode) {
                alert('请输入短码');
                return;
            }
            try {
                const response = await fetch('/api/stats/' + shortCode);
                const data = await response.json();
                if (data.success) {
                    const stats = data.stats;
                    const createdDate = new Date(stats.createdAt).toLocaleString();
                    const expirationInfo = stats.expiresAt ? new Date(stats.expiresAt).toLocaleString() : '永不过期';
                    contentDiv.innerHTML = 
                        '<div class="stat-item"><span class="stat-label">短码：</span><span class="stat-value">' + stats.shortCode + '</span></div>' +
                        '<div class="stat-item"><span class="stat-label">总点击数：</span><span class="stat-value">' + stats.clicks + '</span></div>' +
                        '<div class="stat-item"><span class="stat-label">内容类型：</span><span class="stat-value">' + (stats.isUrl ? '网址' : '文本') + '</span></div>' +
                        '<div class="stat-item"><span class="stat-label">显示模式：</span><span class="stat-value">' + (stats.rawDisplay ? '原始内容' : '格式化页面') + '</span></div>' +
                        '<div class="stat-item"><span class="stat-label">过期时间：</span><span class="stat-value">' + expirationInfo + '</span></div>' +
                        '<div class="stat-item"><span class="stat-label">创建时间：</span><span class="stat-value">' + createdDate + '</span></div>';
                    resultDiv.classList.add('show');
                } else {
                    contentDiv.innerHTML = '<div class="error">' + data.error + '</div>';
                    resultDiv.classList.add('show');
                }
            } catch (error) {
                contentDiv.innerHTML = '<div class="error">网络错误：' + error.message + '</div>';
                resultDiv.classList.add('show');
            }
        }
        document.getElementById('shortCode').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') getStats();
        });
    </script>
</body>
</html>`;

    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// 处理API请求
async function handleAPI(request, env, path) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (path === '/api/create' && request.method === 'POST') {
        return handleCreateLink(request, env, corsHeaders);
    }

    if (path.startsWith('/api/stats/') && request.method === 'GET') {
        const shortCode = path.substring('/api/stats/'.length);
        return handleGetStats(env, shortCode, corsHeaders);
    }

    return new Response('API未找到', { status: 404, headers: corsHeaders });
}

// 创建短链接
async function handleCreateLink(request, env, corsHeaders) {
    try {
        const { content, customCode, expiration, rawDisplay } = await request.json();

        if (!content || content.trim().length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: '内容不能为空'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let shortCode = customCode?.trim();
        if (!shortCode) {
            shortCode = generateShortCode();
            let attempts = 0;
            while (await env.LINKS_KV.get(shortCode) && attempts < 10) {
                shortCode = generateShortCode();
                attempts++;
            }
        } else {
            const existing = await env.LINKS_KV.get(shortCode);
            if (existing) {
                return new Response(JSON.stringify({
                    success: false,
                    error: '此短码已被占用，请选择其他短码'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        let expiresAt = null;
        if (expiration && expiration !== 'never') {
            const now = new Date();
            switch (expiration) {
                case '10m':
                    now.setMinutes(now.getMinutes() + 10);
                    break;
                case '30m':
                    now.setMinutes(now.getMinutes() + 30);
                    break;
                case '1h':
                    now.setHours(now.getHours() + 1);
                    break;
                case '24h':
                    now.setDate(now.getDate() + 1);
                    break;
                case '7d':
                    now.setDate(now.getDate() + 7);
                    break;
                case '30d':
                    now.setDate(now.getDate() + 30);
                    break;
                default:
                    break;
            }
            expiresAt = now.toISOString();
        }

        const linkData = {
            content: content.trim(),
            isUrl: isValidURL(content.trim()),
            rawDisplay: rawDisplay || false,
            createdAt: new Date().toISOString(),
            clicks: 0,
            expiresAt: expiresAt
        };

        await env.LINKS_KV.put(shortCode, JSON.stringify(linkData), {
            expirationTtl: expiresAt ? Math.floor((new Date(expiresAt) - new Date()) / 1000) : undefined
        });

        const shortUrl = `${new URL(request.url).origin}/${shortCode}`;

        return new Response(JSON.stringify({
            success: true,
            shortUrl: shortUrl,
            shortCode: shortCode
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('创建链接错误:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '服务器错误: ' + error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// 处理短链接访问
async function handleShortLink(request, env, shortCode) {
    try {
        const linkDataStr = await env.LINKS_KV.get(shortCode);
        if (!linkDataStr) {
            return new Response('短链接未找到', { status: 404 });
        }

        const linkData = JSON.parse(linkDataStr);

        if (linkData.expiresAt && new Date(linkData.expiresAt) < new Date()) {
            await env.LINKS_KV.delete(shortCode);
            return new Response('此链接已过期并被移除', { status: 410 });
        }

        linkData.clicks = (linkData.clicks || 0) + 1;
        await env.LINKS_KV.put(shortCode, JSON.stringify(linkData), {
            expirationTtl: linkData.expiresAt ? Math.floor((new Date(linkData.expiresAt) - new Date()) / 1000) : undefined
        });

        if (linkData.isUrl && !linkData.rawDisplay) {
            return Response.redirect(linkData.content, 302);
        }

        if (linkData.rawDisplay) {
            return new Response(linkData.content, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        } else {
            return handleTextContent(linkData.content, shortCode, linkData.clicks);
        }

    } catch (error) {
        console.error('处理短链接错误:', error);
        return new Response('服务器错误', { status: 500 });
    }
}

// 显示文本内容页面
function handleTextContent(content, shortCode, clicks) {
    const escapedContent = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>短链接内容</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #333; margin-bottom: 10px; }
        .short-code {
            background: #e3f2fd;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            font-family: monospace;
            color: #1976d2;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            margin: 20px 0;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 16px;
        }
        .stats { text-align: center; color: #666; margin-top: 20px; }
        .actions {
            text-align: center;
            margin-top: 30px;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 25px;
            display: inline-block;
            margin: 0 10px;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .copy-btn {
            background: #4caf50;
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            margin: 0 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 短链接内容</h1>
            <div class="short-code">${shortCode}</div>
        </div>
        <div class="content">${escapedContent}</div>
        <div class="stats"><p>👀 访问次数：${clicks}</p></div>
        <div class="actions">
            <button class="copy-btn" onclick="copyContent()">复制内容</button>
            <a href="/" class="btn">创建新短链接</a>
            <a href="/stats" class="btn" style="background: #28a745;">查看统计数据</a>
        </div>
    </div>
    <script>
        function copyContent() {
            const content = \`${content.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`;
            navigator.clipboard.writeText(content).then(() => alert('内容已复制到剪贴板！'));
        }
    </script>
</body>
</html>`;

    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// 获取统计信息
async function handleGetStats(env, shortCode, corsHeaders) {
    try {
        const linkDataStr = await env.LINKS_KV.get(shortCode);
        if (!linkDataStr) {
            return new Response(JSON.stringify({
                success: false,
                error: '短链接未找到'
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const linkData = JSON.parse(linkDataStr);

        if (linkData.expiresAt && new Date(linkData.expiresAt) < new Date()) {
            await env.LINKS_KV.delete(shortCode);
            return new Response(JSON.stringify({
                success: false,
                error: '此链接已过期并被移除'
            }), {
                status: 410,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            stats: {
                shortCode: shortCode,
                clicks: linkData.clicks || 0,
                createdAt: linkData.createdAt,
                expiresAt: linkData.expiresAt,
                isUrl: linkData.isUrl,
                rawDisplay: linkData.rawDisplay || false
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('获取统计信息错误:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '服务器错误: ' + error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
