/** @jsx React.DOM */

var ImagePanel = React.createClass({

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
				<label>
					<input type='radio' 
						onClick={this.switchOption.bind(this, i)}
						name='image-add-option' />
					{opt}
				</label>
			)
		}.bind(this));
		var index = this.state.index;

		var images = this.state.data.figures;
		return (
			<div>
				<LabeledImages 
					images={images} 
					removeImage={this.removeImage}/>
				<div>
					Select method:
					{options}
				</div>
				<div>
					{[
						<ImageAddByUser 
							listUserImages={this.props.listUserImages}
							uploader={this.props.uploader} 
							addImage={this.addImage} />,
						<ImageAddByURL 
							addImage={this.addImage} />
					][index]}
				</div>
			</div>
		);
	}
});

var LabeledImages = React.createClass({
	render: function() {
		var images = this.props.images;
		var rows = _.map(images, function(path, label) {
			var removeImage = this.props.removeImage;
			var onClick = _.partial(removeImage, label);
			return (
				<tr>
					<td><img className='thumbnail' src={path} /></td>
					<td><span>{label}</span></td>
					<td><a href={path} >{path}</a></td>
					<td><a href='#' onClick={onClick}>[x]</a></td>
				</tr>
			);
		}.bind(this));
		return (
			<div>
				<h4>Labeled Images</h4>
				<table>
					<tr>
						<th>Preview</th>
						<th>Label</th>
						<th>Path</th>
					</tr>
					<tbody>{rows}</tbody>
				</table>
			</div>
		);
	}
});

var ImageUploader = React.createClass({

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
			<div className="image-uploader">
				<h4>Upload image</h4>
				<form ref='upload-form'>
					<input name='image-data'type='file' />
					<input 
						onClick={this.upload}
						type='button' 
						value={text}/>
					{renderIf(status == "failed")(
						<span className="error">
							{this.state.errorMsg}
						</span>
					)}
				</form>
			</div>
		);
	}
});

var ImageAddByUser = React.createClass({
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
			return <em>(uploading has been disabled)</em>

		var images = this.state.images;
		var rows = _.map(images, function(path) {
			var onClick = this.selectImage.bind(this, path);
			return (
				<tr>
					<td><img className='thumbnail' src={path} /></td>
					<td><a href={path} >{path}</a></td>
					<td>
						<input name='image-browser' 
							onClick={onClick}
							type='radio' />
					</td>
				</tr>
			);
		}.bind(this));
		return (
			<div>
				<h4>Uploaded Images</h4>
				<table>
					<tr>
						<th>Preview</th>
						<th>Path</th>
					</tr>
					<tbody>{rows}</tbody>
				</table>
				<label>Label: </label>
				<input ref='label' size={4} />
				<input ref='path'
					onClick={this.addImage}
					type='button' 
					value='Add image' />
				{renderIf(this.props.upload)(
				<ImageUploader 
					insertNewImage={this.insertNewImage}
					uploader={this.props.uploader} />
				)}
			</div>
		);
	}
});


var ImageAddByURL = React.createClass({

	addImage: function() {
		var label = this.refs.label.getDOMNode();
		var path = this.refs.path.getDOMNode();
		if (label.value.length > 0 && path.value.length > 0)
			this.props.addImage(label.value, path.value);
		path.value = label.value = "";
	},

	render: function() {
		return (
			<div className='url-browser'>
				<p>Enter url:  <input ref='path'/></p>
				<label>Label: </label>
				<input ref='label' size={4} />
				<input type='button' 
					onClick={this.addImage}
					value='Add image' />
			</div>
		);
	}
});





