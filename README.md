# BucketSnoop
A Firefox extension and WebSocket handler that checks s3 buckets while your browse. All the checks are passive, I'm not a fan of just throwing files into storage that isn't mine, it's easy enough to check manually with aws cli.

### THIS PROJECT WILL PROBABLY NEVER BE FINISHED, THOUGH A TOTAL REWRITE IN GO-LANG WILL BE DONE AT SOME POINT
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

If a S3 bucket can be parsed it will;

* Try to pull the bucket ACL and list the permissions
* Check if objects can be listed with auth
* Check if objects can be listed without auth

If a bucket name is not parsed it will;

* Highlight that the host is pointed in some way to S3

If an Azure blob container can be parsed it will;

* Check if the blobs can be listed

If a Google Cloud bucket can be parsed it will;

* Try to pull the bucket ACL (ACL parsing not yet finished)
* Check if objects can be listed

URIs are cached in local storage to avoid repeat requests, currently this is cleared each time the add-on is reloaded.
