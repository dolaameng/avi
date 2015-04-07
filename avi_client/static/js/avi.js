var avi = {
	  image_url: ""
	, image_id: ""
	, image_canvas: null
	, image: null
	, roi_startpoint: null
	, roi_endpoint: null
	, ismove : false



	, init: function () {
		//initialization of member variables
		avi.image_id = $("#image-canvas").data("image-id");
		if (avi.image_id != "")
			avi.image_url = "/static/upload/"+avi.image_id;
		avi.image_canvas = document.querySelector("#image-canvas");
		console.log("IMAGEID:", avi.image_url);
		console.log("Image Canvas Dim:", avi.image_canvas.width, avi.image_canvas.height);

		// wireup event listener
		avi.image_canvas.addEventListener("mousedown", avi.image_canvas_mousedown, false);
		avi.image_canvas.addEventListener("mouseup", avi.image_canvas_mouseup, false);
		avi.image_canvas.addEventListener("mousemove", avi.image_canvas_mousemove, false);
		document.querySelector("#analyze-button").addEventListener("click", avi.anaylize_button_click, false);
		document.querySelector("#feedback-button").addEventListener("click", avi.feedback_button_click, false);
		document.querySelector("#confirm-button").addEventListener("click", avi.confirm_button_click, false);

		// draw - images and rectangle, if any
		if (avi.image_url != "") {
			avi.image = new Image();
			avi.image.onload = function () {
				avi.draw_image_canvas();
			};
			avi.image.src = avi.image_url;
		}
	}
	, draw_image_canvas: function () {
		if (avi.image == null) return;
		console.log("drawing image canvas");
		var w = avi.image_canvas.width;
		var h = avi.image_canvas.height;
		var ctx = avi.image_canvas.getContext("2d");
		ctx.clearRect(0, 0, w, h);
		ctx.drawImage(avi.image, 0, 0, w, h);

		if (avi.roi_startpoint!=null && avi.roi_endpoint!=null) {
			ctx.strokeStyle = "#ffd700";
			var roi_x = Math.min(avi.roi_startpoint.x, avi.roi_endpoint.x);
			var roi_y = Math.min(avi.roi_startpoint.y, avi.roi_endpoint.y);
			var roi_w = Math.abs(avi.roi_startpoint.x - avi.roi_endpoint.x);
			var roi_h = Math.abs(avi.roi_startpoint.y - avi.roi_endpoint.y);
			console.log("roi:", roi_x, roi_y, roi_w, roi_h);
			ctx.strokeRect(roi_x, roi_y, roi_w, roi_h);
		}
	}

	, image_canvas_mousedown: function (event) {	
		event.preventDefault();
		avi.roi_startpoint = avi.windowToCanvas(avi.image_canvas, event.clientX, event.clientY);
		avi.ismove = true;
		console.log("mousedown", avi.roi_startpoint);
	}
	, image_canvas_mouseup: function (event) {
		event.preventDefault();
		avi.roi_endpoint = avi.windowToCanvas(avi.image_canvas, event.clientX, event.clientY);
		avi.draw_image_canvas();
		avi.ismove = false;
		console.log("mouseup", avi.roi_endpoint);
	}
	, image_canvas_mousemove: function (event) {
		event.preventDefault();
		if (avi.ismove) {
			avi.roi_endpoint = avi.windowToCanvas(avi.image_canvas, event.clientX, event.clientY);
			avi.draw_image_canvas();
		}
		console.log("mousemove");
		
	}
	, windowToCanvas: function (canvas, x, y) {
		var bbox = canvas.getBoundingClientRect();
		return {
			x: x - bbox.left * (canvas.width / bbox.width),
			y: y - bbox.top * (canvas.height / bbox.height)
		};
	}

	, anaylize_button_click: function (event) {
		event.preventDefault();
		var url = window.location.href;
		var wratio = avi.image.width / avi.image_canvas.width;
		var hratio = avi.image.height / avi.image_canvas.height;
		var roi_x = Math.min(avi.roi_startpoint.x, avi.roi_endpoint.x);
		var roi_y = Math.min(avi.roi_startpoint.y, avi.roi_endpoint.y);
		var roi_w = Math.abs(avi.roi_startpoint.x - avi.roi_endpoint.x);
		var roi_h = Math.abs(avi.roi_startpoint.y - avi.roi_endpoint.y);
		if (avi.roi_startpoint == null || avi.roi_endpoint == null) {
			return;
		}
		var data = {
			  image_id: avi.image_id
			, row: parseInt(roi_y * hratio)
			, col: parseInt(roi_x * wratio)
			, nr: parseInt(roi_h * hratio)
			, nc: parseInt(roi_w * wratio)
		};
		console.log("analyze button clicked:", url, avi.image.width, avi.image.height);
		$.ajax({
			type: "POST"
			, url: "/analyze-roi"
			, data: data
			, dataType: "json"
			, success: function (data) {
				avi.update_defects(data);
			}
		});
	}
	, update_defects: function (data) {
		var defects = data.defects 
		var patch_id = data.patch_id
		console.log(defects);
		var html = "";
		for (var i = 0; i < defects.length; ++i) {
			var defect = defects[i];
			console.log(defect.type, defect.probability);
			html += "<div class=\"row\"> <div class=\"col-md-6 text-left\">" + defect.type + "</div> <div class=\"col-md-6\">" + defect.probability + "</div> </div>";
		}
		$("#defects").data("patch-id", patch_id).data("prediction", defects[0].type).html(html);
		console.log("patch_id:", $("#defects").data("patch-id"));
	}

	, feedback_button_click: function (event) {
		event.preventDefault();
		console.log("feedback button clicked");
		var wratio = avi.image.width / avi.image_canvas.width;
		var hratio = avi.image.height / avi.image_canvas.height;
		var roi_x = Math.min(avi.roi_startpoint.x, avi.roi_endpoint.x);
		var roi_y = Math.min(avi.roi_startpoint.y, avi.roi_endpoint.y);
		var roi_w = Math.abs(avi.roi_startpoint.x - avi.roi_endpoint.x);
		var roi_h = Math.abs(avi.roi_startpoint.y - avi.roi_endpoint.y);
		var data = {
			patch_id: $("#defects").data("patch-id")
			, defect_type: $("#suggested-defect-type option:selected" ).text()
			, image_id: avi.image_id
			, row: parseInt(roi_y * hratio)
			, col: parseInt(roi_x * wratio)
			, nr: parseInt(roi_h * hratio)
			, nc: parseInt(roi_w * wratio)
			, byhuman: true
		};
		$.ajax({
			type: "POST"
			, url: "/feedback"
			, data: data
			, dataType: "json"
			, success: function (data) {
				console.log("successful feedback: ", data);
			}
		});
	}
	, confirm_button_click: function (event) {
		event.preventDefault();
		console.log("confirm button clicked");
		var wratio = avi.image.width / avi.image_canvas.width;
		var hratio = avi.image.height / avi.image_canvas.height;
		var roi_x = Math.min(avi.roi_startpoint.x, avi.roi_endpoint.x);
		var roi_y = Math.min(avi.roi_startpoint.y, avi.roi_endpoint.y);
		var roi_w = Math.abs(avi.roi_startpoint.x - avi.roi_endpoint.x);
		var roi_h = Math.abs(avi.roi_startpoint.y - avi.roi_endpoint.y);
		var data = {
			patch_id: $("#defects").data("patch-id")
			, defect_type: $("#defects").data("prediction")
			, image_id: avi.image_id
			, row: parseInt(roi_y * hratio)
			, col: parseInt(roi_x * wratio)
			, nr: parseInt(roi_h * hratio)
			, nc: parseInt(roi_w * wratio)
			, byhuman: false
		};
		console.log("confirm", data);
		$.ajax({
			type: "POST"
			, url: "/feedback"
			, data: data
			, dataType: "json"
			, success: function (data) {
				console.log("successful feedback: ", data);
			}
		});
	}
};

$(function () {
	avi.init();
});