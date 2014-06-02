(ns storemi.js
  (:require 
    [clj-rhino :as js]
    [clojure.walk :refer [keywordize-keys]]))

(def parser-scope 
  (doto (js/new-safe-scope)
    (js/eval (slurp "resources/public/js/underscore-min.js"))
    (js/eval (slurp "resources/public/js/parser.js"))))

(defn parse-script [script]
  (let [sc (js/new-scope nil parser-scope)]
    (js/set! sc "script" script)
    (-> (js/eval sc "parseScript(script)")
        js/from-js)))

(def react-scope
  (let [scripts ["resources/public/js/underscore-min.js"
                 "resources/public/js/react.min.js"
                 "resources/public/js/parser.js"
                 "resources/public/js/react/story-ui.react.js"]
        scope (js/new-scope)]
    (js/eval scope "var global = this")
    (doseq [s scripts]
      (js/eval scope (slurp s)))
    scope))

(defn render-story-component [data]
  (let [sc (js/new-scope nil react-scope)]
    (js/set! sc "data" (js/to-js data sc))
    (-> (js/eval sc "React.renderComponentToString(Story({data: data}))")
        )))



