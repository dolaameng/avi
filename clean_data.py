#! /usr/bin/env python

import os
from os import path 

UPLOAD_FOLDER = "avi_client/static/upload/"
IMAGE_PATCH_STORE = "avi_client/static/data/patches"
META_STORE = "avi_client/static/data/patches.json"

print "remove files in ", UPLOAD_FOLDER
for f in os.listdir(UPLOAD_FOLDER):
	os.remove(path.join(UPLOAD_FOLDER, f))
print "remove files in ", IMAGE_PATCH_STORE
for f in os.listdir(IMAGE_PATCH_STORE):
	os.remove(path.join(IMAGE_PATCH_STORE, f))
print "remove file ", META_STORE
os.remove(META_STORE)