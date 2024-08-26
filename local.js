const fs = require('fs');
// const fetch = require('node-fetch');

// 发送HEAD请求
async function getContentLength(url) {
    let headers = {
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "Connection": "keep-alive",
        "Origin": "https://haokan.baidu.com",
        "Range": "bytes=0-",
        "Referer": "https://haokan.baidu.com/v?vid=6110530314679680336&tab=recommend",
        "Sec-Fetch-Dest": "video",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
        "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\""
    };
    return fetch(url, {
        method: 'HEAD',
        headers: headers,
        credentials: 'include'
    }).then(response => {
        const contentLength = response.headers.get('content-length');
        console.log('Content-Length:', contentLength);
        return contentLength;
    }).catch(err => {
        console.error('Error getting content length:', err);
    });
}

async function getChunkVideo(url, range) {
    let headers = {
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "Connection": "keep-alive",
        "Origin": "https://haokan.baidu.com",
        "Range": "bytes=0-",
        "Referer": "https://haokan.baidu.com/v?vid=6110530314679680336&tab=recommend",
        "Sec-Fetch-Dest": "video",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
        "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\""
    };
    headers['Range'] = range;
    return fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.arrayBuffer();
    }).catch(err => {
        console.error('Error fetching chunk:', err);
    });
}

function mergeChunks(chunks) {
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    const mergedBuffer = new Uint8Array(totalLength);

    let offset = 0;
    chunks.forEach(chunk => {
        mergedBuffer.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
    });

    return mergedBuffer.buffer;
}

// 分片大小10M
const chunk_size = 1024 * 1024 * 2; // 注意这里应该是10MB而不是5MB

async function main(url) {
    // 1. 获取视频的长度
    const contentLength = await getContentLength(url);
    // 2. 计算片数
    const chunks = Math.ceil(contentLength / chunk_size);
    // 3. 初始化二进制数组
    const arrayBufferArray = new Array(chunks).fill(null);

    for (let i = 0; i < chunks; i++) {
        const startRange = i * chunk_size;
        const endRange = Math.min(startRange + chunk_size - 1, contentLength - 1);
        const range = `bytes=${startRange}-${endRange}`;
        console.log(`Downloading chunk ${i + 1}/${chunks}: ${startRange}-${endRange}`);
        // 4. 下载chunk
        arrayBufferArray[i] = await getChunkVideo(url, range);
    }
    // 合并chunk
    const mergedBuffer = await mergeChunks(arrayBufferArray);

    // 本地保存视频
    fs.writeFile('haokan222.mp4', Buffer.from(mergedBuffer), (err) => {
        if (err) {
            console.error('写入文件时出错:', err);
            return;
        }
        console.log('视频文件已成功保存');
    });
}

let url = "https://vdept3.bdstatic.com/mda-qh8fup2pc3h6kb5f/cae_h264/1723203120426570881/mda-qh8fup2pc3h6kb5f.mp4?v_from_s=hkapp-haokan-nanjing&auth_key=1724612945-0-0-427fc5108415772b185fdba141c6dc18&bcevod_channel=searchbox_feed&cr=0&cd=0&pd=1&pt=3&logid=0544990983&vid=17515772854355454423&klogid=0544990983&abtest=87345_1"

main(url).catch(err => {
    console.error('An error occurred:', err);
});