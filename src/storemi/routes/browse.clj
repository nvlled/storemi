(ns storemi.routes.browse
  (:require 
    [compojure.core :refer :all]
    [storemi.lib.tourl :refer [retour]]
    [storemi.views.layout :as layout]
    [storemi.views.page :as page]
    [storemi.models.user :as user]
    [storemi.session :as session]
    [storemi.urlfor :as urlfor]
    [storemi.lib.rule :refer 
     [one-by-one
      has-params
      enforce]]))

(defn match-query [request]
  )

(defroutes the-routes
  (POST (urlfor/browse) _
        match-query)
  (GET (urlfor/browse) _
       page/browse))



