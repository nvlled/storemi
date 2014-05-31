(ns storemi.lib.rule
  (:require
    [compojure.core :refer [context]]
    [compojure.route :refer [not-found]]
    [clout.core :as clout]))

;; A rule is a function that takes a request (i.e. ring request)
;; returns:
;;  a nil when the rule is satisfied. Otherwise,
;;  a map with keys as the param names that are violated
;;        and values as a string describing the violation

(def lax-rule (constantly nil))

(defn combine [rule & rules]
  (fn [request]
    ;; reverse order so the first ones takes priority
    (let [rules (reverse (cons rule rules))]
      (reduce merge (map #(% request) rules)))))

(defn one-by-one [rule & rules]
  (fn [request]
    (let [rules (cons rule rules)]
      (first
        (drop-while not (map #(% request) rules))))))

(defn enforce
  ([rule & {:keys [fail succ]}]
   (let [fail (or fail identity)
         succ (or succ identity)]
     (fn [request]
       (if-let [errors (rule request)]
         (fail (assoc request :errors errors))
         (succ request))))))

(defn coerce [enforce handler]
  (enforce lax-rule :succ handler))

(defn combine-enforcer [enforce-this enforce-that]
  (fn [rule & {:keys [fail succ]}]
    (enforce-this
      lax-rule
      :succ (enforce-that 
              rule
              :fail fail
              :succ succ))))

(defn layer [& enforcers]
  (reduce combine-enforcer
          enforcers))

(defn create-enforcer [pre-rule pre-fail]
  (fn [rule & {:keys [fail succ]}]
    (enforce
      pre-rule
      :fail pre-fail
      :succ (enforce rule :fail fail :succ succ))))

(defmacro defenforcer [name pre-rule pre-fail]
  `(def ~name (create-enforcer ~pre-rule ~pre-fail)))

(defn- join-routes [paths]
  (let [routes (map clout/route-compile paths)]
    (fn [request]
      (some #(clout/route-matches % request) routes))))

(defn- ducktape [url]
  "Clout doesn't support optional trailing slash"
  [url (str url "/*")])

(defn- make-policy [path rule & [err-handler]]
  (let [paths (ducktape path)
        err-handler (or err-handler (not-found "Access denied"))
        route-matches (join-routes paths)]
    (fn [handler]
      (fn [request]
        (let [matches (route-matches request)
              request (update-in request [:route-params] merge matches)
              errors (rule request)]
          (if (and matches errors)
            (err-handler (assoc request :errors errors))
            (handler request))))))) 

;(defn- make-policy [path rule & [handler]]
;  (let [handler 
;        (or handler (not-found (str path "denied or not found")))
;        route (clout/route-compile path)]
;    (fn [request]
;      (let [matches (clout/route-matches route request)
;            request (update-in request [:route-params] merge matches)
;            errors (rule request)]
;        (if (and matches errors)
;          (handler (assoc request :errors errors)))))))

(defmacro context-with [policies path args & routes]
  (let [handler `(context ~path ~args ~@routes)
        policy (eval '(policies path))]
    (if policy
      `(policy ~handler)
      handler)))

(defn compile-policies [& policy-defs]
  (reduce 
    (fn [result [path rule handler]]
      (assoc 
        result path (make-policy path rule handler)))
    {} policy-defs))

(defn wrap-policies [policies]
  (fn [handler]
    (fn [request]
      (->> ;; TODO: Write a threading macro that supports marking
        (-> (map #(apply make-policy %) policies)
            (concat [handler]))
        (some #(% request))))))

;(def policies
;  [["/admin" user-is-admin deny-page]
;   ["/users" logged-in login-page]])
;
;(-> handler
;    (wrap-policy policies))
;
;(guard
;  "/admin" []
;  [user-is-admin denied]
;  (GET "/" [] ...)
;  (GET "/cpanel" [] ...)
;  (GET "/thingies" [] ...))

(defn- empty-safe [x]
  (try
    (empty? x)
    (catch IllegalArgumentException e false)))

(defn has-params [param-keys]
  (fn [{params :params}]
    (reduce (fn [result pk]
              (if (empty-safe (pk params))
                (assoc result
                       pk
                       (str (name pk) " is required"))
                result))
            nil param-keys)))

(defn violated? [rule-val]
  (not rule-val))



