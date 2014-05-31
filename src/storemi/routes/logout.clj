(ns storemi.routes.logout
  (:require
    [ring.util.response :refer [redirect]] 
    [compojure.core :refer :all]
    [storemi.session :as session]))
 
(defn logout [request]
  (if (session/logged-in? request)
    (-> (redirect "/")
        session/destroy
        (session/add-notification 
          "You are now logged out"))
    (redirect "/login")))

(defroutes the-routes
  (GET "/logout" req  (logout req)))





