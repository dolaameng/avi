from flask import request, Flask, redirect, url_for, render_template
import json
from werkzeug import secure_filename

from skimage import io, img_as_ubyte
import numpy as np 
from os import path 
import os, json, uuid
import matplotlib.pyplot as plt 


app = Flask(__name__)

canvas_width = 600
canvas_height = 600

DEFECT_TYPES = ["scuff", "scratch", "no-defect"]
UPLOAD_FOLDER = "static/upload/"
DATA_STORE = "static/data/"
IMAGE_PATCH_STORE = "static/data/patches"
META_STORE = "static/data/patches.json"
META_HEADER = ["image_id", "patch_id", "row", "col", "nr", "nc", "defect"]
if not path.exists(UPLOAD_FOLDER):
	os.makedirs(UPLOAD_FOLDER)
if not path.exists(DATA_STORE):
	os.makedirs(DATA_STORE)
if not path.exists(IMAGE_PATCH_STORE):
	os.makedirs(IMAGE_PATCH_STORE)
if not path.exists(META_STORE):
	meta = {}
else:
	meta = json.load(open(META_STORE))


@app.route('/upload', methods=["POST"])
def upload():
	f = request.files['image-file']
	fname = secure_filename(f.filename)
	f.save(path.join(UPLOAD_FOLDER, fname))
	return redirect(url_for("analyze", image_id = fname, 
		canvas_width=canvas_width, canvas_height=canvas_height, 
		defect_types=DEFECT_TYPES, image_description=fname))

@app.route("/analyze", methods=["GET"])
def analyze():
	image_id = request.args.get("image_id", "")
	image_description = request.args.get("image_description", "")
	
	return render_template("analyze.html",
		canvas_width = canvas_width, canvas_height = canvas_height,
		image_id = image_id, defect_types = DEFECT_TYPES, image_description=image_description)

@app.route("/analyze-roi", methods=["POST"])
def analyze_roi():
	image_id = request.form["image_id"]
	row = int(request.form["row"])
	col = int(request.form["col"])
	nr = int(request.form["nr"])
	nc = int(request.form["nc"])
	
	img = io.imread(path.join(UPLOAD_FOLDER, image_id))
	print "analyze ROI", row, col, nr, nc, image_id
	if len(img.shape) == 2:
		img_patch = img[row:(row+nr), col:(col+nc)]
	else:
		img_patch = img[row:(row+nr), col:(col+nc), :]
	
	patch_id = "%s_%s" % (uuid.uuid4(), image_id)
	print "patch_id:", patch_id
	io.imsave(path.join(IMAGE_PATCH_STORE, patch_id), img_patch)
	##plt.imshow(img_patch, cmap = plt.cm.gray)
	##plt.show()
	defect = "scuff"
	meta[patch_id] = dict(zip(META_HEADER, [image_id, patch_id, row, col, nr, nc, defect]))
	json.dump(meta, open(META_STORE, "w"))

	
	return json.dumps({"defects": [{"type": "scratch", "probability": 0.5}]
						, "patch_id": patch_id});

@app.route("/patches", methods=["GET"])
def view_patches():
	headers = ["patch"] + META_HEADER
	patches = [[row[f] for f in META_HEADER] for row in meta.values()]
	return render_template("patches.html", headers = headers, patches = patches)

@app.route("/feedback", methods=["POST"])
def feedback():
	patch_id = request.form["patch_id"]
	defect = request.form["defect_type"]
	print "feedback:", patch_id, defect
	meta[patch_id]["defect"] = defect 
	json.dump(meta, open(META_STORE, "w"))
	return json.dumps({"patch_id": patch_id, "defect_type": defect})


if __name__ == '__main__':
	app.run(debug = True, port = 5001)