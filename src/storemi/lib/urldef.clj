(ns storemi.lib.urldef
  (:require
    [clojure.string :as string]))

(defn error [msg]
  (throw (Error. msg)))

(defn join-paths [args]
  (->> args
       (clojure.string/join "/")
       (str "/")))

(defn keyword-str? [s]
  (= (first s) \:))

(defn destruct-url [url]
  (->> (string/split url #"/")
       (filter (comp not empty?))
       (map (fn [path]
              (if (keyword-str? path)
                (read-string path)
                path)))))

(defn substitute [m col]
  (join-paths 
    (for [x col]
      (cond 
        (-> x keyword? not) x
        ;(-> x m not) 
        ;(throw (Error. (str "Missing x for " x)))
        :else (m x)))))

(defn make-keyed-url-fn [args]
  (fn [& params]
    (let [[m end] (split-with #(not= % :/) params)
          m (apply hash-map m)]
      (apply 
        str [(substitute m args) "/" (-> end next first)]))))

(defn key->sym [k]
  (-> k name symbol))

; "/testing/:xyz/asdf"
; "testing" :xyz "asdf"

(defn make-url-fn [args]
  (fn [& vals]
    (let [keys (filter keyword? args)
          m (zipmap keys vals)]
      (substitute m args))))

(defn symname [name suffix]
  (-> (str name "-" suffix) symbol))


(def path-suffix "path")
(def keyed-suffix "with")

(defn resolve-var [sym]
  (let [v (-> sym resolve deref)]
    (if-not v
      (error (str "Not found: " sym))
      v)))

(defmacro defurl 
  ([name base url]
   `(defurl ~name
      (str ~(symname base path-suffix) ~url)))
     ;(str (resolve-var (symname base path-suffix)) url)
  ([name url]
   `(do
      (def ~name
        (~make-url-fn (~destruct-url ~url)))
      ;(def ~(symname name keyed-suffix)
        ;~(make-keyed-url-fn (destruct-url url)))
      (def ~(symname name path-suffix) 
        ~url))))







