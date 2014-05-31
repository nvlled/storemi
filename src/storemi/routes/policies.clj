(ns storemi.routes.policies
  (:require
    [ring.util.response :refer [response redirect]]
    [storemi.lib.tourl :refer [retour detour]]
    [storemi.session :as session]
    [storemi.settings :refer [disable-upload]]
    [storemi.views.page :as page]
    [storemi.urlfor :as url]  
    [storemi.models.user :as user]  
    [storemi.models.story :as st]  
    [storemi.lib.rule :refer 
     [enforce 
      one-by-one
      combine-enforcer
      defenforcer
      create-enforcer
      wrap-policies
      compile-policies
      layer]]
    ))

(defn upload-allowed [request]
  (when disable-upload
    {:msg "Uploads have been disabled"}))

(defn user-is-admin [request]
  (when-not (session/sget request :admin)
    {:msg "user is not admin"}))

(defn user-exists [request]
  (let [username (get-in request [:params :username])]
    (when-not (user/get-data username)
      {:msg (str "User does not exist: " username)})))

(defn story-exists [request]
  (let [story-id (get-in request [:params :story-id])]
    (when-not (st/get-story story-id)
      {:msg (str "Story not found: " story-id)})))

(defn user-owns-story [request]
  (let [story (st/story-match-by request)
        owned (and story
                   (= (session/username request)
                      (:username story)))]
    (when-not owned
      {:msg (str "You do not own this story, "
              "or you do not have the permissions to do so.")})))

;; TODO: 
(defn user-story-exists [request]
  (let [story-id (get-in request [:params :story-id])]
    (when-not (st/story-match-by request)
      {:msg (str "Story not found: " story-id)})))

(defn user-is-logged [request]
  (when-not (session/logged-in? request)
    {:msg "Login required"}))

(def enforce-log-in 
  (create-enforcer
    user-is-logged
    (fn [request]
      (-> (detour request "/login")
          (session/flash-put :notification "login required")))))

(def enforce-upload
  (create-enforcer upload-allowed page/error))

(def enforce-user
  (create-enforcer user-exists page/error))

(def enforce-story
  (create-enforcer story-exists page/error))

(def enforce-user-story
  (create-enforcer user-story-exists page/error))

(def enforce-user-owned-story
  (layer enforce-log-in
         (create-enforcer 
           (one-by-one
             user-story-exists
             user-owns-story)
           page/error)))

(defn admin-handler [request]
  (if (session/logged-in? request)
    (response "access denied")
    (-> (detour request "/login")
        (session/flash-put :notification "login required"))))

;(def site-policies
;  (compile-policies
;    ["/admin"            user-is-admin    admin-handler]
;    [url/user-index-path user-exists      page/error]
;    [url/story-path      story-exists     page/error]))

;(def policies
;  [[(paths "/admin")            user-is-admin    admin-handler]
;   [(paths url/user-index-path) user-exists      page/error]
;   [(paths url/story-path)      story-exists     page/error]])

;(def policy-handler
;  (wrap-policies policies))

;(defn enforce-with-policies [rule & {:keys [fail succ]}]
;  (enforce rule
;           :fail fail
;           :succ succ))







