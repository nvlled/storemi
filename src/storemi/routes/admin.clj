(ns storemi.routes.admin
  (:require 
    [compojure.core :refer :all]
    [ring.util.response :refer [redirect]]
    [storemi.views.layout :as layout]
    [storemi.models.user :as user]
    [storemi.views.page :as page]
    [storemi.session :as session]
    [storemi.routes.policies :as pol]
    [storemi.lib.tourl :refer [detour]]
    [storemi.lib.rule :refer 
     [enforce
      create-enforcer]]
    ))

(defn handle-intruder [request]
  (if (session/logged-in? request)
    (page/error request)
    (-> (detour request "/login")
        (session/flash-put :notification "login required"))))

(def enforce-admin
  (create-enforcer pol/user-is-admin handle-intruder))

(defn lax-rule [request])

(def admin-index
  (enforce-admin
    lax-rule
    :success page/admin))

(defroutes the-routes
  (context "/admin" []
           (GET "/" req (admin-index req))))

