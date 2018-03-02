# BucketSnoop
A Firefox extension and WebSocket handler that checks s3 buckets while your browse.

### It works but it's nowhere near finished, use with care.

# Setup
## Server

* Probably needs Python 3, I've not even bothered testing Python 2.
* For now you need [AWS CLI](https://aws.amazon.com/cli/) installed and configured, boto3 looks in ~/.aws/credentials 

Clone the repo

```
git clone https://github.com/olihough86/BucketSnoop.git
```

Change to the /BucketSnoopServer/ directory

```
cd BucketSnoop/BucketSnoopServer/
```

create a venv

```
python3 -m venv .venv
```
activate your venv 

```
source .venv/bin/activate
```
upgrade pip

```
pip install --upgrade pip
```
install requiements 
```
pip install -r requirements
```
start server 

```
python server.py 
```


## Client
Open Firefox and go to about:debugging

Click on "Load Temporary Add-on"

Find /BucketSnoopClient/bucketsnoop.js and load it

# Usage

The client should now be loaded and connected to the server, while browsing watch the output of the server as discovered buckets are checked

If a bucket name can be parsed it will;

* Try to pull the bucket ACL and list the permissions
* Check if objects can be listed

If a bucket name is not parsed it will;

* Highlight that the host is pointed in some way to S3

If an Azure blob container cen be parse it wil;

* Check if the blobs can be listed

URIs are cached in local storage to avoid repeat requests, currently this is cleared each time the add-on is reloaded.
