(ns storemi.lib.temp)

(def ^:dynamic *temp-data* nil)

(defn wrap-temp-data [handler]
  (fn [request]
    (binding [*temp-data* (atom {})]
      (handler request))))

(defn put-temp [k v]
  (when *temp-data*
    (swap! *temp-data* assoc k v))
  v)

(defmacro cache [k & [expr]]
  `(if *temp-data*
     (if-let [data# (get-temp ~k)]
       data#
       (put-temp ~k ~expr))
     ~expr))

(defn get-temp [k]
  (when *temp-data*
    (@*temp-data* k)))
