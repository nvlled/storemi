/** @jsx React.DOM */

var ImagePanel = React.createClass({displayName: 'ImagePanel',

    getInitialState: function() {
		return {
			data: this.props.data,
			index: -1,
		};
	},

	switchOption: function(index) {
		this.setState({index: index});
	},

	update: function(data) {
		this.setState({data: data});
	},

	removeImage: function(label) {
		var scriptEditor = this.props.scriptEditor;
		scriptEditor.removeImage(label);
	},

	addImage: function(label, path) {
		var scriptEditor = this.props.scriptEditor;
		scriptEditor.addImage(label, path);
	},

	render: function() {
		var options = ["Your images", "URL"];
		options = _.map(options, function(opt, i) {
			return (
				React.DOM.label(null, 
					React.DOM.input( {type:"radio", 
						onClick:this.switchOption.bind(this, i),
						name:"image-add-option"} ),
					opt
				)
			)
		}.bind(this));
		var index = this.state.index;

		var images = this.state.data.figures;
		return (
			React.DOM.div(null, 
				LabeledImages( 
					{images:images, 
					removeImage:this.removeImage}),
				React.DOM.div(null, 
					"Select method:",
					options
				),
				React.DOM.div(null, 
					[
						ImageAddByUser( 
							{listUserImages:this.props.listUserImages,
							uploader:this.props.uploader, 
							addImage:this.addImage} ),
						ImageAddByURL( 
							{addImage:this.addImage} )
					][index]
				)
			)
		);
	}
});

var LabeledImages = React.createClass({displayName: 'LabeledImages',
	render: function() {
		var images = this.props.images;
		var rows = _.map(images, function(path, label) {
			var removeImage = this.props.removeImage;
			var onClick = _.partial(removeImage, label);
			return (
				React.DOM.tr(null, 
					React.DOM.td(null, React.DOM.img( {className:"thumbnail", src:path} )),
					React.DOM.td(null, React.DOM.span(null, label)),
					React.DOM.td(null, React.DOM.a( {href:path} , path)),
					React.DOM.td(null, React.DOM.a( {href:"#", onClick:onClick}, "[x]"))
				)
			);
		}.bind(this));
		return (
			React.DOM.div(null, 
				React.DOM.h4(null, "Labeled Images"),
				renderIf(rows.length > 0)(
				React.DOM.table(null, 
					React.DOM.tr(null, 
						React.DOM.th(null, "Preview"),
						React.DOM.th(null, "Label"),
						React.DOM.th(null, "Path")
					),
					React.DOM.tbody(null, rows)
				)
				,
				React.DOM.p( {className:"centered"}, React.DOM.em(null, "(no images)"))
				)
			)
		);
	}
});

var ImageUploader = React.createClass({displayName: 'ImageUploader',

	getInitialState: function() {
		return {
			status: "idle",
			errorMsg: "",
			percentCompleted: "",
		};
	},

	upload: function() {
		var uploader = this.props.uploader;
		var form = this.refs['upload-form'].getDOMNode();
		uploader.send(form, this);
		this.setState({status: "uploading"});
	},

	success: function(e) {
		console.log(e, "tadah");
		this.setState({status: "idle"});
		var form = this.refs['upload-form'].getDOMNode();
		var imgPath = e.responseText;
		this.props.insertNewImage(imgPath);
		form.reset();
	},

	fail: function(e) {
		console.log("failed", e);
		this.setState({
			status: "failed",
			errorMsg: "Upload failed",
		});
	},

	progress: function(e) {
		if (e.lengthComputable) {
			var p = e.loaded / e.total * 100;
			this.setState({
				percentCompleted: p.toFixed(0) + "%"
			});
		}
	},

	render: function() {
		var status = this.state.status;
		var completed = this.state.percentCompleted;

		var text = status == "uploading" 
			? "Uploading... " + completed
			: "Upload";
		return (
			React.DOM.div( {className:"image-uploader"}, 
				React.DOM.h4(null, "Upload image"),
				React.DOM.form( {ref:"upload-form"}, 
					React.DOM.input( {name:"image-data",type:"file"} ),
					React.DOM.input( 
						{onClick:this.upload,
						type:"button", 
						value:text}),
					renderIf(status == "failed")(
						React.DOM.span( {className:"error"}, 
							this.state.errorMsg
						)
					)
				)
			)
		);
	}
});

var ImageAddByUser = React.createClass({displayName: 'ImageAddByUser',
	getInitialState: function() {
		return {
			images: [],
			selectedImage: "",
		}
	},

	componentDidMount: function() {
		this.props.listUserImages(function(images) {
			this.setState({images: images});
		}.bind(this));
	},

	insertNewImage: function(path) {
		var images = this.state.images;
		images.push(path);
		this.setState({images: images});
	},

	addImage: function() {
		var label = this.refs.label.getDOMNode();
		var path = this.state.selectedImage;
		console.log("->", label, path);
		if (label.value.length > 0 && path.length > 0)
			this.props.addImage(label.value, path);
		label.value = "";
	},

	selectImage: function(img) {
		this.setState({selectedImage: img});
	},

	render: function() {

		if (!this.props.uploader)
			return React.DOM.em(null, "(uploading has been disabled)")

		var images = this.state.images;
		var rows = _.map(images, function(path) {
			var onClick = this.selectImage.bind(this, path);
			return (
				React.DOM.tr(null, 
					React.DOM.td(null, React.DOM.img( {className:"thumbnail", src:path} )),
					React.DOM.td(null, React.DOM.a( {href:path} , path)),
					React.DOM.td(null, 
						React.DOM.input( {name:"image-browser", 
							onClick:onClick,
							type:"radio"} )
					)
				)
			);
		}.bind(this));
		return (
			React.DOM.div(null, 
				React.DOM.h4(null, "Uploaded Images"),
				renderIf(rows.length > 0)(
				React.DOM.table(null, 
					React.DOM.tr(null, 
						React.DOM.th(null, "Preview"),
						React.DOM.th(null, "Path")
					),
					React.DOM.tbody(null, rows)
				)
				,
				React.DOM.p( {className:"centered"}, React.DOM.em(null, "(no images)"))
				),
				React.DOM.label(null, "Label: " ),
				React.DOM.input( {ref:"label", size:4} ),
				React.DOM.input( {ref:"path",
					onClick:this.addImage,
					type:"button", 
					value:"Add image"} ),
				ImageUploader( 
					{insertNewImage:this.insertNewImage,
					uploader:this.props.uploader} )
			)
		);
	}
});


var ImageAddByURL = React.createClass({displayName: 'ImageAddByURL',

	addImage: function() {
		var label = this.refs.label.getDOMNode();
		var path = this.refs.path.getDOMNode();
		if (label.value.length > 0 && path.value.length > 0)
			this.props.addImage(label.value, path.value);
		path.value = label.value = "";
	},

	render: function() {
		return (
			React.DOM.div( {className:"url-browser"}, 
				React.DOM.p(null, "Enter url:  ",  React.DOM.input( {ref:"path"})),
				React.DOM.label(null, "Label: " ),
				React.DOM.input( {ref:"label", size:4} ),
				React.DOM.input( {type:"button", 
					onClick:this.addImage,
					value:"Add image"} )
			)
		);
	}
});





