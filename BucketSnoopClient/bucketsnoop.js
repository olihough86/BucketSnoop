function getItemByName(anArray, name) {
    for (var i = 0; i < anArray.length; i += 1) {
        if (anArray[i].name === name) {
            return anArray[i];
        }
    }
}

function parseBucketName(bucket) {
    if (/[a-zA-Z0-9-\.]*\.(s3|s3-.*).amazonaws.com/g.test(bucket.hostname)) {
        bucketName = bucket.hostname.replace(/\.(s3|s3-.*)\.amazonaws\.com/g, '');
        return bucketName;
    }
    if (/(s3|s3-)[a-zA-Z0-9-]*.amazonaws.com\/[a-zA-Z0-9-\.]*\/.*/g.test(bucket.hostname + bucket.pathname)) {
        a = bucket.pathname.split("/");
        bucketName = a[1];
        return bucketName;
    }
    return false;
}

function logHeaders(requestDetails) {
    var server = getItemByName(requestDetails.responseHeaders, "Server");
    if (server && requestDetails.statusCode !== 404 && server.value == "AmazonS3" && requestDetails.url.search("amazonaws.com")!== -1) {
        
        var bucket = new URL(requestDetails.url);
        bucketName = parseBucketName(bucket);
        
        if (bucketName) {
            if (!localStorage.getItem(bucketName)) {
                localStorage.setItem(bucketName, 1);
                var msg = {
                    "type": 1,
                    "bucketName": bucketName
                }
                socket.send(JSON.stringify(msg));
            }
        }
    }
    if (server && requestDetails.statusCode !== 404 && server.value == "AmazonS3" && requestDetails.url.search("amazonaws.com") === -1) {
        var url = new URL(requestDetails.url);
        
        if (url) {
            if (!localStorage.getItem(url.hostname)) {
                localStorage.setItem(url.hostname, 1);
                var msg = {
                    "type": 2,
                    "bucketHost": url.hostname
                }
                socket.send(JSON.stringify(msg));
            }
        }
    }
  }

localStorage.clear(); 

const socket = new WebSocket('ws://127.0.0.1:9000');

socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
});
  
browser.webRequest.onHeadersReceived.addListener(
    logHeaders,
    {urls: ["<all_urls>"]},
    ["responseHeaders"]
);