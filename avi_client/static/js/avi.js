var avi = {
	image_id: ""


	, init: function () {
		//initialization of member variables
		avi.image_id = $("#image-canvas").data("image-id");
		console.log("IMAGEID:", avi.image_id);

		// wireup event listener

		// draw - images and rectangle, if any
		if (avi.image_id != "") {
			avi.draw_image_canvas();
		}
	}
	, draw_image_canvas: function () {
		console.log("drawing image canvas");
		//TODO
	}
};

$(function () {
	avi.init();
});