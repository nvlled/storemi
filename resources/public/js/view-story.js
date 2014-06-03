
window.addEventListener("load", function() {
	var data = JSON.parse(storemi.selv(document, "#story-script"));

	var storyComponent = Story({ 
		paths: storemi.getPaths(),
		data: data,
		configMode: storemi.readingMode,
	});

	React.renderComponent(
		storyComponent,
		document.getElementById("contents")
	);
});





