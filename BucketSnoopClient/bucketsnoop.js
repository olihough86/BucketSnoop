// OK, Yes there is a lot of repeated code going on. I don't code for a living.
// I will refactor it eventually, maybe.

// Function to open the WebSocket connection to the server, retry every 5seconds if server dies
function openSocket(websocketlocation) {
    socket = new WebSocket(websocketlocation);
    socket.onclose = function() {
        setTimeout(function(){openSocket(websocketlocation)}, 5000);
    };
}

// Finds a value by name in an array
function getItemByName(anArray, name) {
    for (var i = 0; i < anArray.length; i += 1) {
        if (anArray[i].name === name) {
            return anArray[i];
        }
    }
}
// Parse bucket names from URLs (Azure is server side only)
function parseBucketName(bucket) {
    // Amazon S3 - <bucket>.s3.amazonaws.com
    if (/[a-zA-Z0-9-\.]*\.(s3|s3-.*).amazonaws.com/g.test(bucket.hostname)) {
        bucketName = bucket.hostname.replace(/\.(s3|s3-.*)\.amazonaws\.com/g, '');
        return bucketName;
    }
    // Amazon S3 - s3.amazonaws.com/<bucket> || s3-<region>.amazonaws.com/<bucket>
    if (/(s3-[a-zA-Z0-9-]*|s3)\.([a-zA-Z0-9-]*\.com|[a-zA-Z0-9-]*\.amazonaws\.com)\/.*/g.test(bucket.hostname + bucket.pathname)) {
        a = bucket.pathname.split("/");
        bucketName = a[1];
        return bucketName;
    }
    // Google - <bucket>.storage.googleapis.com
    if (/[a-zA-Z0-9-\.]*\.storage\.googleapis\.com/g.test(bucket.hostname)) {
        bucketName = bucket.hostname.replace(/\.storage\.googleapis\.com/g, '');
        return bucketName;
    }
    // Google - storage.googleapiscom/<bucket>
    if (/storage.googleapis.com\/[a-zA-Z0-9-\.]*/g.test(bucket.hostname + bucket.pathname)) {
        a = bucket.pathname.split("/");
        bucketName = a[1];
        return bucketName;
    }
    // return false if parsing fails
    return false;
}
// Magic starts here
function bucketSnoop(requestDetails) {
    if (!requestDetails.originUrl) {
        requestDetails.originUrl = requestDetails.url;
    }
    var server = getItemByName(requestDetails.responseHeaders, "Server");
    var serverLower = getItemByName(requestDetails.responseHeaders, "server");

    if (serverLower) {
        server = serverLower;
    }
    // send name of parsed S3 bucket to server
    if (server && requestDetails.statusCode !== 404 && server.value == "AmazonS3" && requestDetails.url.search("amazonaws.com")!== -1) {
        
        var url = new URL(requestDetails.url);
        bucketName = parseBucketName(url);
        console.log(requestDetails.originUrl)
        if (bucketName) {
            if (!localStorage.getItem(bucketName + "-AWS")) {
                localStorage.setItem(bucketName + "-AWS", 1);
                var msg = {
                    "type": 1,
                    "bucketName": bucketName,
                    "originUrl": requestDetails.originUrl
                }
                socket.send(JSON.stringify(msg));
            }
        }
    }
    // Send hostname of CNAME'd S3 bucket to server
    if (server && requestDetails.statusCode !== 404 && server.value == "AmazonS3" && requestDetails.url.search("amazonaws.com") === -1) {
        var url = new URL(requestDetails.url);
        
        if (url) {
            if (!localStorage.getItem(url.hostname)) {
                localStorage.setItem(url.hostname, 1);
                var msg = {
                    "type": 2,
                    "bucketHost": url.hostname,
                    "originUrl": requestDetails.originUrl
                }
                socket.send(JSON.stringify(msg));
            }
        }
    }
    // Send hostname and path of Azure blob container to server
    if (server && requestDetails.statusCode !== 404 && server.value == "Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0" && requestDetails.url.search("blob.core.windows.net") !== -1) {
        var url = new URL(requestDetails.url);

        if (url) {
            if (!localStorage.getItem(url.hostname)) {
                localStorage.setItem(url.hostname, 1);
                var path = url.pathname.split('/');
                var msg = {
                    "type": 3,
                    "azureContainer": url.hostname + "/" + path[1],
                    "originUrl": requestDetails.originUrl
                }
                socket.send(JSON.stringify(msg));
            }
        }
    }
    // Send name of parsed Google bucket to server
    if (server && requestDetails.statusCode !== 404 && server.value == "UploadServer" && requestDetails.url.search("storage.googleapis.com") !== -1) {
        var url = new URL(requestDetails.url);
        bucketName = parseBucketName(url);

        if(bucketName) {
            if (!localStorage.getItem(bucketName + "-Google")) {
                localStorage.setItem(bucketName + "-Google", 1);
                var msg = {
                    "type": 4,
                    "googleBucket": bucketName,
                    "originUrl": requestDetails.originUrl
                }
                socket.send(JSON.stringify(msg));
            }
        }
    }
    // Send hostname of a CNAME'd Google bucket to server
    if (server && requestDetails.statusCode !== 404 && server.value == "UploadServer" && requestDetails.url.search("storage.googleapis.com") === -1) {
        var url = new URL(requestDetails.url);

        if (url) {
            if (!localStorage.getItem(url.hostname)) {
                localStorage.setItem(url.hostname, 1);
                var msg = {
                    "type": 5,
                    "bucketHost": url.hostname,
                    "originUrl": requestDetails.originUrl
                }
                socket.send(JSON.stringify(msg));
            }
        }
    }

  }

// For now clear local storage each time we load the extention.
localStorage.clear();

// Create socket connection
openSocket('ws://127.0.0.1:9000');

// listener
browser.webRequest.onCompleted.addListener(
    bucketSnoop,
    {urls: ["<all_urls>"]},
    ["responseHeaders"]
);