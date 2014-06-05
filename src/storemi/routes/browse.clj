(ns storemi.routes.browse
  (:require
    [compojure.core :refer :all]
    [storemi.lib.tourl :refer [retour]]
    [storemi.views.layout :as layout]
    [storemi.views.page :as page]
    [storemi.models.user :as user]
    [storemi.models.story :as st]
    [storemi.common :refer [read-int]]
    [storemi.session :as session]
    [storemi.urlfor :as urlfor]
    [storemi.lib.rule :refer
     [one-by-one
      has-params
      enforce]]))

(def stories-per-page 5)

(defn make-page-data [page-number]
  (let [start (* page-number stories-per-page)]
    {:start start
     :end (+ start stories-per-page)
     :pagenum page-number
     :size stories-per-page}))

(defn match-query [{params :params :as request}]
  (let [{:keys [query by page]} params
        exact (= by "username")
        page-data (make-page-data (read-int page 0))
        stories
        (st/query-stories
          query
          :criteria by
          :exact exact
          :page-data page-data)
        ]
    (page/browse request stories page-data)))

(defroutes the-routes
  (GET urlfor/browse-path  -> match-query))



