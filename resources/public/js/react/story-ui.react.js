/** @jsx React.DOM */

(function(root) {

/* imports */
var cl = storemi.cl;
var intercalate = storemi.intercalate;
var History = storemi.History;
var Bindings = storemi.Bindings;
var UrlFor = storemi.UrlFor;
var renderIf = storemi.renderIf;

var Story = root.Story = React.createClass({displayName: 'Story',

    getInitialState: function() {
		var data = this.props.data;
		return {
			data: data,
			view: new ViewState(this, {
				paths: this.props.paths,
				config: this.props.config,
				configMode: this.props.configMode,
				chapterId: data["chapter-id"],
				sceneId: data["scene-id"],
				jumpToSource: this.props.jumpToSource,
			}),
		}
	},

	redraw: function(view) {
		if (this.isMounted())
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
		var chapter =
			view.getSelectedChapter(story.chapters);

		var chapterComponent;
		if (chapter) {
			chapterComponent =
				Chapter(
					{key:chapter.label,
					story:story,
					data:chapter,
					view:view} );
		} else {
			var firstOne = _.first(story.chapters);
			chapterComponent =
				ChapterLink( {chapter:firstOne, view:view}, 
					"[read]"
				)
		}

		var showSettings = function() {
			var name = 'showStorySettings';
			return view.displaySettings(!view[name]);
		}

		var warnings;
		var chapters = story.chapters;
		if (chapters) {
			warnings = chapters.warnings;
			warnings = _.map(warnings, function(msg) {
				return React.DOM.p( {className:"error"}, React.DOM.em(null, msg));
			});
		}
		var editURL = view.urlfor('edit-story');

		return (
			React.DOM.div( {className:"story"}, 
				React.DOM.h1( {className:"story-title"}, 
					ChapterLink( {view:view,
						href:view.urlfor('story'),
						active:!chapter,
						chapter:{}}, 
						story.storyTitle
					),
					renderIf(editURL)(
					React.DOM.a( {className:"story-settings",
						href:editURL}, 
						"[edit]"
					)),
					React.DOM.a( {className:"story-settings",
						onClick:showSettings,
						href:"x"},  " [settings]"
					)
				),
				renderIf(view.showStorySettings)(
					StorySettings( {view:view, config:view.config} )
				),
				renderIf(!view.config.hideSynopsis)(
					React.DOM.em(null, story.synopsis)
				),
				React.DOM.hr(null ),
				renderIf(!view.config.hideWarnings)(
						React.DOM.div(null, warnings)
				),
				React.DOM.div( {className:"chapter-history"}, 
					React.DOM.a( {href:"#",
						className:cl({invisible: !view.hasPrevious()}),
						onClick:view.backChapter.bind(view)}, 
						"[back]"
					),
					React.DOM.span(null ),
					React.DOM.a( {href:"#",
						style:{"float": "right"},
						className:cl({invisible: !view.hasNext()}),
						onClick:view.forwardChapter.bind(view)}, 
						"[forward]"
					)
				),
				renderIf(!view.config.hideChapterIndex)(
					ChapterIndex(
						{data:story.chapters,
						view:this.state.view} )
				),
				chapterComponent
			)
		);
	}
});

var StorySettings = React.createClass({displayName: 'StorySettings',

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
			React.DOM.form( {className:"story-settings"}, 
				React.DOM.fieldset(null, 
					React.DOM.legend(null, "Settings"),
					React.DOM.label(null, 
						React.DOM.input( {ref:"scrollToView",
							defaultChecked:config.scrollToView,
							onClick:scrollToView,
							type:"checkbox"} ),
						"Scroll to view"
					),
					React.DOM.br(null ),
					React.DOM.label(null, 
						React.DOM.input( {ref:"rememberSubscenes",
							defaultChecked:config.rememberSubscenes,
							onClick:rememberSubscenes,
							type:"checkbox"} ),
						"Remember subscenes"
					),
					React.DOM.br(null ),
					React.DOM.input(
						{onClick:view.displaySettings.bind(view, false),
						name:"close",
						type:"button",
						value:"close"} )
				)
			)
		);
	}
});

var ChapterLink = React.createClass({displayName: 'ChapterLink',
	render: function() {
		var view = this.props.view;
		var chapter = this.props.chapter;
		var className = cl({ active: this.props.active });
		var handler = view.selectChapter.bind(view, chapter);
		var href = this.props.href ||
			view.urlfor('chapter', chapter && chapter.label);
		return (
			React.DOM.a( {className:className,
				href:href,
				onClick:handler}, 
				this.props.children || chapter && chapter.title
			)
		)
	}
});

var ChapterIndex = React.createClass({displayName: 'ChapterIndex',
	render: function() {
		var view = this.props.view;
		var chapters = this.props.data;
		var selChapter = view.getSelectedChapter(chapters);
		var jumpToSource = view.jumpToSource;

		var contents = _.map(chapters, function(chapter) {
			var active = selChapter && selChapter.label == chapter.label;
			return (
				React.DOM.li( {key:chapter.label}, 
					ChapterLink(
						{chapter:chapter,
						active:active,
						view:view} ),
					renderIf(jumpToSource) (
						React.DOM.a( {onClick:function() {
								jumpToSource(chapter.lineno)
								return false;
							},
							className:"jump-source",
							href:"#"}, 
							"**"
						)
					)
				)
			);
		});

		return (
			React.DOM.ul(null, contents)
		);
	}
});

var SceneIndex = React.createClass({displayName: 'SceneIndex',
	render: function() {
		var view = this.props.view;
		var chapter = this.props.chapter;
		var scenes = this.props.data;

		var jumpToSource = view.jumpToSource;
		var selScene = view.getSelectedScene(chapter);
		var contents = _.map(scenes, function(scene) {

			var handler = view.selectScene.bind(view, chapter, scene);
			var className = cl({
				active: selScene && selScene.label == scene.label
			});
			var href =
				view.urlfor('scene', chapter.label, scene.label);
			return (
				React.DOM.li(null, 
					React.DOM.a( {href:href,
						onClick:handler,
						className:className}, 
						scene.title
					),
					renderIf(jumpToSource) (
						React.DOM.a( {onClick:function() {
								jumpToSource(scene.lineno)
								return false;
							},
							className:"jump-source",
							href:"#"}, 
							"***"
						)
					)
				)
		)});

		return (
			React.DOM.div(null, 
				React.DOM.p(null, "Scenes:"),
				React.DOM.ul(null, contents)
			)
		);
	}
});

var Chapter = React.createClass({displayName: 'Chapter',

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
		scene || (scene = _.first(chapter.scenes));

		var sceneComponent;
		if (scene) sceneComponent =
				Scene(
					{key:scene.label,
					story:this.props.story,
					chapter:chapter,
					data:scene,
					view:view} );

		var warnings;
		if (chapter.scenes) {
			warnings = _.map(chapter.scenes.warnings, function(err) {
				return React.DOM.p(null, React.DOM.em( {className:"error"}, err))
			});
		}

        return (
			React.DOM.div( {id:Chapter.selector(chapter)}, 
                React.DOM.h2(null, chapter.title),
				renderIf(!view.config.hideWarnings)(
					React.DOM.div(null, warnings)
				),
				renderIf(!view.config.hideSceneIndex)(
					SceneIndex(
						{chapter:chapter,
						data:chapter.scenes,
						view:view} )
					),
				React.DOM.br(null ),
				sceneComponent
            )
        );
    }
});

var SceneLink = React.createClass({displayName: 'SceneLink',
	render: function() {
		var classes = cl('scene-link', {
			active: this.props.active
		});
		return (
			React.DOM.a(  {href:this.props.href,
				onClick:this.props.onClick,
				className:classes}, 
				this.props.children
			)
		);
	}
});

var Scene = React.createClass({displayName: 'Scene',

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
		var chapter = this.props.chapter;
		var view = this.props.view;
		var href =
			view.urlfor('scene', chapter.label, toScene.label);
        return (
			SceneLink(
				{href:href,
				toScene:toScene,
				chapter:this.props.chapter,
				onClick:this.subsceneHandler(toScene),
				active:active}, 
				elem.text
			)
        );
    },

    createChapterLink: function(elem, mappings) {
        var label = elem.label;
        var toChapter = {label: mappings[label] || "nope"};
		var href =
			this.props.view.urlfor('chapter', toChapter.label);
        return (
            React.DOM.a( {className:"chapter-link",
                href:href,
                onClick:this.chapterHandler(toChapter)}, 
                elem.text
            )
        );
    },

    createImage: function(elem, mappings) {
        var label = elem.label;
        var url = mappings[label] || "";
        return React.DOM.img( {src:url} )
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

		var chapter = this.props.chapter;
		var href =
			view.urlfor('scene', chapter.label, toScene.label);
        return (
            React.DOM.span( {className:"game-input"}, 
                React.DOM.input(
                    {ref:"input",
                    defaultValue:value,
                    onKeyUp:onKeyUp} ),
				SceneLink( {ref:"link",
					href:href,
					toScene:toScene,
					chapter:this.props.chapter,
					onClick:handler,
					active:active}, 
                    "[",elem.buttonVal,"]"
				)
            )
        );

    },

	createVar: function(elem, mappings) {
		return (
			React.DOM.b( {className:"game-var"}, 
				
					this.props.view.bindings.get(elem.text) ||
					this.props.story.defaultBindings[elem.text]
				
			)
		);
	},

	br: function() { return React.DOM.br(null ) },

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
				Scene(
					{key:scene.label,
					story:this.props.story,
					chapter:chapter,
					data:subscene,
					view:view} )

		var contents = this.renderContents(scene);

		return (
			React.DOM.div( {id:Scene.selector(scene), className:"scene"}, 
				React.DOM.h3( {className:"scene-title"}, scene.title,
					React.DOM.a( {href:"#"+scene.label, name:scene.label},  " # " )
				),
                React.DOM.p(null, contents),
				subsceneComponent
			)
		);
	}
});

function ViewState(component, opts) {
	this.bindings = new Bindings();
	this.component = component;
	this.selectedScene = {};
	this.subscenes = {};
	this.setConfigMode(opts.configMode);
	this.showStorySettings = false;
	this.chapterHist= new History(5, null);
	this._urlfor = new UrlFor(opts.paths);
	this.jumpToSource = opts.jumpToSource;

	this.config = _.extend({
		scrollToView: true,
		rememberSubscenes: false,
		hideSceneIndex: false,
		hideChapterIndex: false,
		hideSynopsis: false,
	}, opts.config);
	this.config = this.configMode(this.config);

	var ch = {label: opts.chapterId};
	var sc = {label: opts.sceneId};
	this.selectChapter(ch);
	this.selectScene(ch, sc);
}

ViewState.prototype = {

	urlfor: function(name /* args ...*/) {
		var that = this._urlfor;
		return that.get.apply(that, arguments);
	},

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

	backChapter: function() {
		this.chapterHist.back();
		return this.update();
	},

	forwardChapter: function() {
		this.chapterHist.forward();
		return this.update();
	},

	hasPrevious: function() {
		return this.chapterHist.hasPrevious();
	},

	hasNext: function() {
		return this.chapterHist.hasNext();
	},

	setChapter: function(chapter) {
		var hist = this.chapterHist;
		if (!chapter.label)
			hist.goHome();
		else
			hist.visit(chapter, function(a, b) {
				if (a && b)
					return a.label == b.label;
				return a == b;
			});
	},

	selectChapter: function(chapter) {
		this.setScene(chapter, _.first(chapter.scenes));
		this.setChapter(chapter);
		return this.update(Chapter.selector(chapter));
	},

	// TODO: Change parameter to story
	getSelectedChapter: function(chapters) {
		var chapter = this.chapterHist.get();
		if (chapter) {
			var label = chapter.label;
			return _.findWhere(chapters, {label: label});
		}
	},

	setScene: function(chapter, scene) {
		this._clearSubscene(chapter, scene);
		this.selectedScene[chapter.label] = scene;
	},

	selectScene: function(chapter, scene) {
		this.setScene(chapter, scene);
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

	currentChapter: function() {
		return this.chapterHist.get();
	},

	atHome: function() {
		return this.chapterHist.atHome;
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
			if (!scene)
				scene = this.selectedScene[chapter.label];
			if (scene)
				this.subscene(chapter)[scene.label] = null;
		}
	},

}

})(this);
