(ns storemi.handler
  (:require 
    [clojure.java.shell :refer [sh]]
    [compojure.core :refer [defroutes routes]]
    [ring.middleware.resource :refer [wrap-resource]]
    [ring.middleware.file-info :refer [wrap-file-info]]
    [hiccup.middleware :refer [wrap-base-url]]
    [compojure.handler :as handler]
    [compojure.route :as route]
    [storemi.session :refer [make-store]]
    [storemi.models.db :refer [tables-initialized?]]
    [storemi.models.user :refer [create-user-table]]
    [storemi.models.story :refer [create-story-table]]
    ))

(def ns-routes 
  ["storemi.routes.upload"  
   "storemi.routes.home"  
   "storemi.routes.register"
   "storemi.routes.login"
   "storemi.routes.logout"
   "storemi.routes.about"
   "storemi.routes.admin"
   "storemi.routes.authorship"
   ])

(defn require-namespaces [namespaces]
  (doseq [n namespaces]
    (-> n symbol require)))

(defn route-var [namespace-name]
  (-> namespace-name
      (str "/the-routes")
      symbol
      resolve))

(defn collect-routes [namespaces & others]
  (let [route-vars (filter identity 
                     (map route-var namespaces))]
    (apply routes 
           (concat route-vars others))))

(defn init []
  (println "storemi is starting") 
  (when-not (tables-initialized?)
    (create-user-table)
    (create-story-table)))

(defn destroy []
  (println "storemi is shutting down"))

(defroutes app-routes
  (route/resources "/")
  (route/not-found "Not Found"))

;; Sauce: https://gist.github.com/dannypurcell/8215411
(defn ignore-trailing-slash
  "Modifies the request uri before calling the handler.
  Removes a single trailing slash from the end of the uri if present.
  Useful for handling optional trailing slashes until Compojure's route matching syntax supports regex.
  Adapted from http://stackoverflow.com/questions/8380468/compojure-regex-for-matching-a-trailing-slash"
  [handler]
  (fn [request]
    (let [uri (:uri request)]
      (handler (assoc request :uri (if (and (not (= "/" uri))
                                            (.endsWith uri "/"))
                                     (subs uri 0 (dec (count uri)))
                                     uri))))))

(require-namespaces ns-routes)
(def app 
  (-> (collect-routes ns-routes app-routes)
      ;(#'policy-handler)
      (handler/site {:session {:store (make-store)}})
      ignore-trailing-slash
      (wrap-base-url)))




