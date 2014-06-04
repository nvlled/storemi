(ns storemi.common
  (:require
    [clojure.java.io :as io]))

(defn resource [path]
  (let [file (io/file (str "resources/" path))]
    (if (.exists file)
      file
      (io/resource path))))

(defn with-resource [path f]
  (let [file (io/file (str "resources/" path))
        file (if (.exists file)
               file
               (io/resource path))]
    (when file
      (with-open [res (io/reader file)]
        (f res)))))

(defn read-resource [path]
  (with-resource path #(slurp %)))

(defn read-int [n defval]
  (try
    (if (integer? n)
      n
      (-> n read-string int)) 
    (catch Exception e defval)))

(defn find-with-val [col k v]
  (let [pred 
        (fn [obj]
          (= v (get obj k)))]
    (->> col
         (filter pred)
         first)))

(defn trim-slash2 [s]
  (let [is-slash #(= % \/)
        not-slash #(not= % \/)]
    (->> 
      s
      (drop-while is-slash)
      (take-while not-slash)
      (apply str))))

(defn cons-apply [coll first-fn rest-fn]
  (cons (first-fn (first coll))
        (map rest-fn (rest coll))))

(defn trim-leading-slash [s]
  (if (instance? String s)
    (apply 
      str 
      (if (= (first s) \/)
        (rest s)
        s))
    s))

(defn trim-trailing-slash [s]
  (if (instance? String s)
    (apply
      str
      (if (= (last s) \/)
        (pop (vec s))
        s))
    s))

(defn trim-slash [s]
  (->> (str s)
       trim-leading-slash
       trim-trailing-slash
       (apply str)))

(defn with-base [base-url & paths]
  (clojure.string/join 
    "/" (cons-apply 
          (cons base-url paths)
          trim-trailing-slash
          trim-slash)))

(defn has-trailing [s]
  (= (peek (vec s)) \/))

(defn unix-time []
  (.getTime (java.util.Date.)))

(defn throttle [f millis]
  (let [expr (atom (future))]
    (fn [& args]
      (future-cancel @expr)
      (reset!
        expr
        (future (Thread/sleep millis) (apply f args))))))

