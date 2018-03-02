import boto3
import json
import requests
from pprint import pprint
from botocore.exceptions import ClientError
from autobahn.twisted.websocket import WebSocketServerProtocol, WebSocketServerFactory
from bs4 import BeautifulSoup

class bcolors:
	HEADER = '\033[95m'
	OKBLUE = '\033[94m'
	OKGREEN = '\033[92m'
	WARNING = '\033[93m'
	FAIL = '\033[91m'
	ENDC = '\033[0m'
	BOLD = '\033[1m'
	UNDERLINE = '\033[4m'

class MyServerProtocol(WebSocketServerProtocol):
	def onConnect(self, request):
		print("Client connecting: {0}".format(request.peer))

	def onOpen(self):
		print("WebSocket connection open.")

	def onMessage(self, payload, isBinary):
		msg = json.loads(payload.decode('utf8'))
		mtype = msg['type']
		if mtype == 1:
			bucket_name = msg['bucketName']
			processBucket(bucket_name)
		if mtype == 2:
			bucket_host = msg['bucketHost']
			getBuckedNameFromHost(bucket_host)
		if mtype == 3:
			azure_container = msg['azureContainer']
			processAzureContainer(azure_container)
	
	def onClose(self, wasClean, code, reason):
		print("WebSocket connection closed: {0}".format(reason))

def processAzureContainer(azure_container):
	print("***********************************************************")
	print("Processing Azure container: {0}".format(azure_container))
	try:
		r = requests.get('http://' + azure_container + '?restype=container&comp=list&maxresults=1')
		if r.status_code == 200:
			print(bcolors.FAIL + "Blobs Listing Allowed!" + bcolors.ENDC)
		else:
			print(bcolors.OKGREEN + "Blobs Listing Denied" + bcolors.ENDC)
	except requests.RequestException as e:
		print(e)

def processBucket(bucket_name):
	print("***********************************************************")
	print("Processing bucket: {0}".format(bucket_name))
	try:
		client = boto3.client('s3')
		bucket_acl = client.get_bucket_acl(Bucket=bucket_name)
		for p in bucket_acl['Grants']:
			if 'URI' in p['Grantee']:
				if p['Grantee']['URI'] == 'http://acs.amazonaws.com/groups/global/AllUsers':
					if p['Permission'] == 'READ' or p['Permission'] == 'READ_ACP':
						print("All Users: " + bcolors.WARNING + p['Permission'] + bcolors.ENDC)
					if p['Permission'] == 'WRITE' or p['Permission'] == 'FULL_CONTROL' or p['Permission'] == 'WRITE_ACP':
						print("All Users: " + bcolors.FAIL + p['Permission'] + bcolors.ENDC)
				if p['Grantee']['URI'] == 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers':
					if p['Permission'] == 'READ' or p['Permission'] == 'READ_ACP':
						print("Authenticated Users: " + bcolors.WARNING + p['Permission'] + bcolors.ENDC)
					if p['Permission'] == 'WRITE' or p['Permission'] == 'FULL_CONTROL' or p['Permission'] == 'WRITE_ACP':
						print("Authenticated Users: " + bcolors.FAIL + p['Permission'] + bcolors.ENDC)
	except ClientError as e:
		if e.response['Error']['Code'] == 'AccessDenied':
			print(bcolors.OKGREEN + "ACL Read Denied" + bcolors.ENDC)
	try:
		r = requests.get('http://' + bucket_name + '.s3.amazonaws.com' )
		if r.status_code == 200:
			print(bcolors.FAIL + "Object Listing Allowed!" + bcolors.ENDC)
		else:
			print(bcolors.OKGREEN + "Object Listing Denied" + bcolors.ENDC)
	except requests.RequestException as e:
		print(e)

def getBuckedNameFromHost(bucket_host):
	try:
		r = requests.get("http://" + bucket_host)
		if r.status_code == 200 and r.headers['content-type'] == 'application/xml' and r.headers['Server'] == 'AmazonS3':
			soup = BeautifulSoup(r.text, 'xml')
			processBucket(soup.Name.text)
		else:
			print(bcolors.OKBLUE + bucket_host + " points to S3 but no bucket name could be parsed" + bcolors.ENDC)			
	except requests.RequestException as e:
		print(e)


if __name__ == '__main__':
	import sys
	from twisted.python import log
	from twisted.internet import reactor

	log.startLogging(sys.stdout)
	factory = WebSocketServerFactory("ws://127.0.0.1:9000")
	factory.protocol = MyServerProtocol
	reactor.listenTCP(9000, factory)
	reactor.run()