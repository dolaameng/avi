from decaf.scripts.imagenet import DecafNet
from os import path
from skimage import color, img_as_ubyte
import cPickle

class AVIClassifier(object):
    def __init__(self, decaf_folder = None, classifer_file = None):
        if decaf_folder is None:
            decaf_folder = '../models/imagenet_pretrained/'
        if classifer_file is None:
            classifer_file = "../models/lg_classifier_public"
        self.net = DecafNet(path.join(decaf_folder, 'imagenet.decafnet.epoch90'),
                            path.join(decaf_folder, 'imagenet.decafnet.meta'))
        self.feat_layer = 'fc6_cudanet_out'
        self.classifier = cPickle.load(open(classifer_file, "r"))
    def predict(self, img):
        im = img_as_ubyte(color.rgb2gray(img))
        scores = self.net.classify(im, center_only = True)
        feats = self.net.feature(self.feat_layer).flatten()
        defect_probs = self.classifier.predict_proba(feats)
        return sorted(zip(self.classifier.classes_, defect_probs[0]), key = lambda (cls, prob): prob, reverse=True)
    def class_names(self):
    	return self.classifier.classes_