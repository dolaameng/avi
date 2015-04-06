import flask
from flask import request
import json

from skimage import io, img_as_ubyte
import numpy as np 

app = flask.Flask(__name__)

DEFECT_TYPES = ["scuff", "scratch", "no-defect"]

@app.route("/analyze", methods=["GET"])
def analyze():
	canvas_width = 600
	canvas_height = 600
	image_id = request.args.get("image_id", "")
	defects = [
		  {'type':'scuff', 'probability':0.5}
		, {'type': 'dent', 'probability': 0.3}
		, {'type': 'defect-free', 'probability': 0.1} 
	]
	return flask.render_template("analyze.html",
		canvas_width = canvas_width, canvas_height = canvas_height,
		image_id = image_id, defects = defects, defect_types = DEFECT_TYPES)


if __name__ == '__main__':
	app.run(debug = True, port = 5001)