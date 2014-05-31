/** @jsx React.DOM */

var Story = React.createClass({

    getInitialState: function() {
		var config = this.props.config;
		var configMode = this.props.configMode;
		return {
			data: this.props.data,
			view: new ViewState(this, config, configMode),
		}
	},

	redraw: function(view) {
		this.setState({view: view});
	},

	getViewState: function() {
		return this.state.view;
	},

	reconfigure: function(config) {
		this.state.view.reconfigure(config);
		this.state.view.update();
	},

	update: function(data) {
		this.setState({data: data});
	},

	componentDidUpdate: function() {
		var focusNodeId = this.state.view.focusNodeId;
		if (!focusNodeId)
			return;
		focusNodeId = focusNodeId.replace(/\./, '\\.');
		var node = this.getDOMNode().querySelector("#"+focusNodeId);
		if (node) node.scrollIntoView();
		// prevent refocusing on update
		this.state.view.focusNodeId = null;
	},

	render: function() {
		var story = this.state.data;
		var view = this.state.view;

		var chapter = view.getSelectedChapter(story.chapters);
		var chapterComponent;
		if (chapter) {
			chapterComponent = 
				<Chapter 
					key={chapter.label} 
					story={story}
					data={chapter}
					view={view} />;
		} else {
			var firstOne = _.first(story.chapters);
			chapterComponent = 
				<ChapterLink chapter={firstOne} view={view}>
					[read]
				</ChapterLink>
		}

		var showSettings = function() {
			var name = 'showStorySettings';
			return view.displaySettings(!view[name]);
		}

		var warnings = story.chapters.warnings;
		warnings = _.map(warnings, function(msg) {
			return <p className='error'><em>{msg}</em></p>;
		});

		return (
			<div className='story'>
				<h1 className='story-title'>
					<ChapterLink view={view} 
						active={!chapter} 
						chapter={null}>
						{story.storyTitle}
					</ChapterLink>
					{renderIf(this.props.editURL)(
					<a className='story-settings' 
						href={this.props.editURL}>
						[edit]
					</a>)}
					<a className='story-settings' 
						onClick={showSettings}
						href='x'> [settings]
					</a>
				</h1>
				{renderIf(view.showStorySettings)(
					<StorySettings view={view} config={view.config} />
				)}
				{renderIf(!view.config.hideSynopsis)(
					<em>{story.synopsis}</em>
				)}
				<hr />
				{renderIf(!view.config.hideChapterIndex)(
					<div>
						<div>{warnings}</div>
						<ChapterIndex
							data={story.chapters}
							view={this.state.view} />
					</div>
				)}
				{chapterComponent}
				<div className="spacing"></div>
			</div>
		);
	}
});

var StorySettings = React.createClass({

	createHandler: function(optionName) {
		return function() {
			var node = this.refs[optionName].getDOMNode();
			var config = { }; 
			config[optionName] = node.checked;
			this.props.view.reconfigure(config);
		}.bind(this);
	},

	render: function() {
		var view = this.props.view;
		var config = this.props.config;
		var scrollToView = this.createHandler('scrollToView');
		var rememberSubscenes = this.createHandler('rememberSubscenes');
		return (
			<form className='story-settings'>
				<fieldset>
					<legend>Settings</legend>
					<label>
						<input ref='scrollToView' 
							defaultChecked={config.scrollToView}
							onClick={scrollToView} 
							type='checkbox' />
						Scroll to view
					</label>
					<br />
					<label>
						<input ref='rememberSubscenes'
							defaultChecked={config.rememberSubscenes}
							onClick={rememberSubscenes} 
							type='checkbox' />
						Remember subscenes
					</label>
					<br />
					<input 
						onClick={view.displaySettings.bind(view, false)}
						name='close' 
						type='button' 
						value='close' />
				</fieldset>
			</form>
		);
	}
});

var ChapterLink = React.createClass({
	render: function() {
		var view = this.props.view;
		var chapter = this.props.chapter;
		var className = cl({ active: this.props.active });
		var handler = view.selectChapter.bind(view, chapter);
		return (
			<a className={className}
				href='#' 
				onClick={handler}>
				{this.props.children || chapter && chapter.title}
			</a>
		)
	}
});

var ChapterIndex = React.createClass({
	render: function() {
		var view = this.props.view;
		var chapters = this.props.data;
		var selChapter = view.getSelectedChapter(chapters);

		var contents = _.map(chapters, function(chapter) {
			var active = selChapter && selChapter.label == chapter.label;
			return (
				<li>
					<ChapterLink chapter={chapter} 
						active={active} 
						view={view} />
				</li>
			);
		});

		return (
			<ul>{contents}</ul>
		);
	}
});

var SceneIndex = React.createClass({
	render: function() {
		var view = this.props.view;
		var chapter = this.props.chapter;
		var scenes = this.props.data;

		var selScene = view.getSelectedScene(chapter);
		var contents = _.map(scenes, function(scene) {
			var handler = view.selectScene.bind(view, chapter, scene);
			var className = cl({
				active: selScene && selScene.label == scene.label
			});
			return (
				<li><a href={scene.label} 
						onClick={handler}
						className={className}>
						{scene.title}
				</a></li>
		)});

		return (
			<div>
				<p>Scenes:</p>
				<ul>{contents}</ul>
			</div>
		);
	}
});

var Chapter = React.createClass({

	statics: {
		selector: function(chapter) {
			if (chapter)
				return "ch-"+chapter.label;
		}
	},

    render: function() {
		var chapter = this.props.data;
		var view = this.props.view;

		var scene = view.getSelectedScene(chapter);
		//scene || (scene = _.first(chapter.scenes));

		var sceneComponent;
		if (scene) sceneComponent = 
				<Scene 
					key={scene.label}
					story={this.props.story}
					chapter={chapter}
					data={scene}
					view={view} />;

		var warnings;
		if (chapter.scenes) {
			warnings = _.map(chapter.scenes.warnings, function(err) {
				return <p><em className='error'>{err}</em></p>
			});
		}

        return (
			<div id={Chapter.selector(chapter)}>
                <h2>{chapter.title}</h2>
				{renderIf(!view.config.hideSceneIndex)(
					<div>
						<div>{warnings}</div>
						<SceneIndex 
							chapter={chapter}
							data={chapter.scenes}
							view={view} /> 
					</div>
					)}
				<br />
				{sceneComponent}
            </div>
        );
    }
});

var SceneLink = React.createClass({
	render: function() {
		var classes = cl('scene-link', {
			active: this.props.active
		});
		return (
			<a  href='x' 
				onClick={this.props.onClick} 
				className={classes}>
				{this.props.children}
			</a>
		);
	}
});

var Scene = React.createClass({

	statics: {
		selector: function(scene) {
			if (scene)
				return "sc-"+scene.label;
		}
	},

	subsceneHandler: function(subscene) {
		var view = this.props.view;
		return view.selectSubscene.bind(
			this.props.view, 
			this.props.chapter, 
			this.props.data, 
			subscene
		);
	},

	chapterHandler: function(toChapter) {
		var view = this.props.view;
		return view.selectChapter.bind(
			this.props.view, 
			toChapter
		);
	},

    createSceneLink: function(elem, mappings, subscene) {
        var label = elem.label;
        var toScene = {label: mappings[label] || ""};
		var active = subscene && 
			toScene.label == subscene.label ;
        return (
			<SceneLink 
				onClick={this.subsceneHandler(toScene)}
				active={active}>
				{elem.text}
			</SceneLink>
        );
    },

    createChapterLink: function(elem, mappings) {
        var label = elem.label;
        var toChapter = {label: mappings[label] || "nope"};
        return (
            <a className='chapter-link'
                href='x' 
                onClick={this.chapterHandler(toChapter)}>
                {elem.text}
            </a>
        );
    },

    createImage: function(elem, mappings) {
        var label = elem.label;
        var url = mappings[label] || "";
        return <img src={url} />
    },

    createInput: function(elem, mappings, subscene) {
		var view = this.props.view;
        var label = elem.label;
        var toScene = {label: mappings[label] || ""};
        var key = elem.text;
		var story = this.props.story;

		var active = subscene && 
			toScene.label == subscene.label ;

		var noVal = "XXXXX";
		var value = view.bindings.get(key) ||
			story.defaultBindings[key] || noVal;

		var handler = function() {
			var input = this.refs.input.getDOMNode();
			var value = input.value = 
				(input.value || story.defaultBindings[key]) || noVal;
			view.bindings.set(key, value); 
			input.blur();
			this.subsceneHandler(toScene)();
			return false;
		}.bind(this);

		var onKeyUp = function(e) {
            if (e.keyCode == 13)  {
				this.refs.link.getDOMNode().click();
            }
		}.bind(this);

        return (
            <span className="game-input">
                <input 
                    ref="input"
                    defaultValue={value}
                    onKeyUp={onKeyUp} />
				<SceneLink ref='link' 
					onClick={handler}
					active={active}>
                    [{elem.buttonVal}]
				</SceneLink>
            </span>
        );

    },

	createVar: function(elem, mappings) {
		return (
			<b className="game-var">
				{
					this.props.view.bindings.get(elem.text) ||
					this.props.story.defaultBindings[elem.text]
				}
			</b>
		);
	},

	br: function() { return <br /> },

	componentDidMount: function() {
		console.log(document.querySelector(".scene-title"));
	},

	renderContents: function(scene) {
		var chapter = this.props.chapter;
		var view = this.props.view;
		var story = this.props.story;
		var mappings = _.extend(story.mappings, scene.mappings);
		var subscene = view.getSubscene(chapter, scene);
		return _.map(scene.contents, function(elem) {
			if (typeof elem === "string") {
				return intercalate(elem.split("\n"), this.br);
			}

			switch (elem.name) {
				case "LINK":
					return this.createSceneLink(elem, mappings, subscene);
				case "CHAP":
					return this.createChapterLink(elem, mappings);
				case "IMG":
					return this.createImage(elem, mappings);
				case "INPUT":
					return this.createInput(elem, mappings, subscene);
				case "VAR":
					return this.createVar(elem, mappings)
				default: return JSON.stringify(elem);
			}
		}.bind(this));
	},

	render: function() {
		var chapter = this.props.chapter;
		var scene = this.props.data;
		var view = this.props.view;
		var subscene = view.getSubscene(chapter, scene);

		var subsceneComponent;
		if (subscene) subsceneComponent = 
				<Scene 
					key={scene.label}
					story={this.props.story}
					chapter={chapter} 
					data={subscene} 
					view={view} />
		
		var contents = this.renderContents(scene);

		return (
			<div id={Scene.selector(scene)} className="scene">
				<h3 className="scene-title">{scene.title} 
					<a href={"#"+scene.label} name={scene.label}> # </a>
				</h3>
                <p>{contents}</p>
				{subsceneComponent}
			</div>
		);
	}
});

// ------------------------------------------------------------

function intercalate(xs, e) {
    if (xs.length == 1)
        return xs;

    if (typeof e !== "function")
        e = _.constant(e);

    var ys = [];
    ys.push(xs[0]);
    for (var i = 1; i < xs.length; i++) {
        ys.push(e());
        ys.push(xs[i]);
    }
    return ys;
}

/** map = {className: bool, ...} */
function cl(/* class1, class2, ..., map */) {
	var classNames = _.initial(arguments);
	var opt = _.last(arguments);
	var more = [];
	if (typeof opt === "string") {
		more = [opt];
	} else {
		more = _.reduce(opt, function(acc, include, className) {
			if (include)
				acc.push(className);
			return acc;
		}, []);
	}

	return classNames.concat(more).join(" ");
}

function renderIf(yes) {
	return function(component) {
		if (yes) return component;
	}
}

function toDisplayStyle(visible) {
    return {
        display: visible ? "inherit" : "none",
    }
}

function scrollViewTo(container, node, step) {
    var d = node.offsetTop - container.scrollTop;
    step = step || d;
    if (d != 0) { // normalize
        d = Math.abs(d)/d;
    }

    var x = 20, lastOffset;
    var timerId = setInterval(function() {
        container.scrollTop += d*(step - container.offsetTop);
        if (lastOffset == container.scrollTop || 
            Math.abs(container.scrollTop - node.offsetTop) < x)
            clearInterval(timerId);
        lastOffset = container.scrollTop;
    }, 10);
}

function Bindings() {
	this.env = Bindings.getStorage();
	this.listeners = {};
}

Bindings.KEYNAME = "__bindings"; // TODO: set to context path instead
Bindings.getStorage = function() {
	var key = Bindings.KEYNAME;
	if (localStorage[key]) {
		return JSON.parse(localStorage[key]);
	} else {
		localStorage[key] = "{}";
		return {};
	}
}

Bindings.prototype.persist = function() {
	localStorage[Bindings.KEYNAME] = JSON.stringify(this.env);
}

Bindings.prototype.set = function(key, value) {
	this.env[key] = value;
	this.persist();
	_.each(this.listeners[key], function(fn) {
		fn(value);
	});
}

//Bindings.prototype.subscribe = function(key, fn) {
//	var m = this.listeners[key];
//	if (!m) {
//		m = this.listeners[key] = [];
//	}
//	m.push(fn);
//}

Bindings.prototype.get = function(key) {
	return this.env[key];
}

function ViewState(component, config, mode) {
	this.bindings = new Bindings();
	this.component = component;
	this.selectedChapter = null;
	this.selectedScene = {};
	this.subscenes = {};
	this.setConfigMode(mode);
	this.showStorySettings = false;

	this.config = _.extend({
		scrollToView: true,
		rememberSubscenes: false,
		hideSceneIndex: false,
		hideChapterIndex: false,
		hideSynopsis: false,
	}, config);
}

ViewState.prototype = {
	setConfigMode: function(mode) {
		this.configMode = mode || _.identity;
	},

	update: function(focusNodeId) {
		if (this.config.scrollToView)
			this.focusNodeId = focusNodeId;
		this.reconfigure(this.configMode(this.config));
		this.component.redraw(this);
		return false
	},

	displaySettings: function(yep) {
		this.showStorySettings = yep;
		return this.update();
	},
	
	reconfigure: function(config) {
		this.config = _.extend(this.config, config);
	},

	reconfigureOption: function(optionName, value) {
		var config = {};
		config[optionName] = value;
		return this.reconfigure(config);
	},

	selectChapter: function(chapter) {
		this._clearSubscene(chapter, 
			this.getSelectedScene(chapter));
		this.selectedChapter = chapter;
		return this.update(Chapter.selector(chapter));
	},

	// TODO: Change parameter to story
	getSelectedChapter: function(chapters) {
		if (this.selectedChapter) {
			var label = this.selectedChapter.label;
			return _.findWhere(chapters, {label: label});
		}
	},

	selectScene: function(chapter, scene) {
		this._clearSubscene(chapter, scene);
		this.selectedScene[chapter.label] = scene;
		return this.update(Scene.selector(scene));
	},

	getSelectedScene: function(chapter) {
		if (!chapter)
			return;
		var scene = this.selectedScene[chapter.label];
		if (scene)
			return _.findWhere(chapter.scenes, {label: scene.label});
		return _.first(chapter.scenes);
	},

	subscene: function(chapter) {
		if (!this.subscenes[chapter.label])
			this.subscenes[chapter.label] = {};
		return this.subscenes[chapter.label];
	},

	selectSubscene: function(chapter, scene, subscene) {
		this._clearSubscene(chapter, subscene);
		this.subscene(chapter)[scene.label] = subscene;
		return this.update(Scene.selector(subscene));
	},

	getSubscene: function(chapter, scene) {
		var subscene = this.subscene(chapter)[scene.label];
		if (subscene)
			return _.findWhere(chapter.scenes, {label: subscene.label});
	},

	_clearSubscene: function(chapter, scene) {
		if (!this.config.rememberSubscenes) {
			if (scene)
				this.subscene(chapter)[scene.label] = null;
		}
	},

}








