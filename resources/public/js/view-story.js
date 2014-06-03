
window.addEventListener("load", function() {
	var data = JSON.parse(selv(document, "#story-script"));

	var storyComponent = Story({ 
		paths: getPaths(),
		data: data,
		configMode: readingMode,
	});

	React.renderComponent(
		storyComponent,
		document.getElementById("contents")
	);
});

function getPaths() {
	return JSON.parse(selv(document, "#paths"));
}

function sel(node, selector) {
	console.assert(node);
	return node.querySelector(selector);
}

function sela(node, selector) {
	console.assert(node);
	return node.querySelectorAll(selector);
}

function selv(node, selector) {
	var node = node.querySelector(selector);
	if (node)
		return node.value;
}


function fetchStoryData(url, fn) {
	var req = new XMLHttpRequest();
	req.open("GET", url);
	req.send();

	req.onload = function() {
		fn(req.responseText);
	}
}




