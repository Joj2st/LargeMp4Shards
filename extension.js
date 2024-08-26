//popup.js
// 测试网站haokan视频

// 发送HEAD请求
async function getContentLength(url){
    let  headers = {
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
    }
    return await fetch(url, {
        method: 'HEAD',
        headers: headers,
        credentials: 'include'
    }).then(response => {
        // 获取响应头
        const headers = new Headers(response.headers);
        // 打印响应头
        // console.log('Response Headers:', Object.fromEntries(headers.entries()));
        // 处理响应头信息
        const contentLength = headers.get('content-length');
        console.log('Content-Length:', contentLength);
        // 其他响应头信息
        const contentType = headers.get('content-type');
        const contentRange = headers.get('content-range');
        console.log('Content-Type:', contentType);
        console.log('contentRange-Type:', contentRange);

        return contentLength
    })
}
async function getChunkVideo(range) {
    let  headers = {
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
    }
    headers.Range = range
    return await fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
    }).then(response => {
        // 获取响应头
        const headers = new Headers(response.headers);
        // 处理响应头信息
        const contentType = headers.get('content-type');
        const contentRange = headers.get('content-range');
        console.log(response.status)
        console.log('Content-Type:', contentType);
        console.log('contentRange-Type:', contentRange);

        return response.arrayBuffer()
    })
}

async function mergeChunks(chunks) {
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
const chunk_size = 1024 * 1024 * 5;

async function main(url) {
    // 1.获取视频的长度
    const contentLength = await getContentLength(url);
    // const contentLength = 14912460;
    // 2.计算片数
    const chunks = Math.ceil(contentLength / chunk_size);
    // 3 range: bytes=0-chunk_size
    // 3. 初始化二进制数组
    const arrayBufferArray = new Array(chunks).fill(null);

    for (let i = 0; i < chunks; i++) {
        const startRange = i * chunk_size;
        const endRange = Math.min(startRange + chunk_size - 1, contentLength - 1);
        const range = `bytes=${startRange}-${endRange}`;
        console.log(`Downloading chunk ${i + 1}/${chunks}: ${startRange}-${endRange}`);
        // 4 下载chunk
        arrayBufferArray[i] = await getChunkVideo(range)
    }
    // 合并chunk
    const mergedBuffer = mergeChunks(arrayBufferArray);
    const blob = new Blob([mergedBuffer], {type: 'video/mp4'});
    const burl = URL.createObjectURL(blob,{type:"video/mp4"});
    await chrome.downloads.download(
        {
            url:burl,
            fileName:"sss.mp4",
            saveAs:true
        }
    )
}
const url = "https://vdept3.bdstatic.com/mda-pmf42v2xr4y63tvv/360p/h264/1702695198373981602/mda-pmf42v2xr4y63tvv.mp4?v_from_s=hkapp-haokan-nanjing&auth_key=1724604980-0-0-c3975ecaa0dce8718a71b3f653554ae6&bcevod_channel=searchbox_feed&cr=0&cd=0&pd=1&pt=3&logid=3380792822&vid=6110530314679680336&klogid=3380792822&abtest=87345_1";

main(url).then(r => {})
// main()