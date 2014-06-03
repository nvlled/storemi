(ns storemi.routes.authorship
  (:require
    [compojure.core :refer :all]
    [ring.util.response :refer [redirect]]
    [storemi.lib.tourl :refer [retour]]
    [storemi.views.layout :as layout]
    [storemi.views.page :as page]
    [storemi.models.user :as user]
    [storemi.session :as sess]
    [storemi.models.story :as st]
    [storemi.urlfor :as url]
    [storemi.routes.policies :refer
     [enforce-story
      enforce-user
      enforce-user-story
      enforce-user-owned-story]]
    [storemi.lib.rule :refer
     [combine
      coerce
      one-by-one
      has-params
      enforce]]))

(defn user-owns-story [req]
  (when-not 
    (st/story-match-by (sess/username req) req)
    {:error "User does not own story"}))

(defn user-is-logged-in [request]
  (when-not (sess/logged-in? request)
    {:error "You must be logged in"}))

(def story-ownership-rules
  (one-by-one
    user-is-logged-in
    user-owns-story))

(def story-creation-rules
  (one-by-one
    (has-params [:title])
    user-is-logged-in))

(defn proceed-creation [request]
  (let [title (get-in request [:params :title])
        synopsis (get-in request [:params :synopsis])
        username (sess/username request)
        story (st/create-story 
                username title synopsis)]
    (-> (url/story-edit username (:id story))
        redirect
        (sess/add-notification "Story created"))))

(defn proceed-edition [{params :params :as req}]
  (let [data (select-keys params [:storyTitle :synopsis])
        id (:story-id params)
        script (clojure.string/replace 
                 (:script params) "\r" "")
        path 
        (if (:saview params)
          (url/story (sess/username req) id)
          (:uri req))]
    (st/update-story id data script)
    (-> (redirect path)
        (sess/add-notification "Story saved"))))

(def submit-story
  (enforce
    story-creation-rules
    :fail page/story-create
    :succ proceed-creation))

(def resubmit-story
  (enforce-story
    story-ownership-rules
    :fail page/story-edit
    :succ proceed-edition))

(def delete-story
  (enforce-story
    story-ownership-rules
    :fail page/error
    :succ
    (fn [{params :params :as req}]
      (let [username (sess/username req)]
        (st/delete-story username (:story-id params))
        (-> (url/user-index username)
            redirect
            (sess/add-notification "Story deleted"))))))

(def user-index
  (coerce enforce-user page/user-index))

(def story
  (coerce enforce-user-story page/story))

(defn story-data [request]
  (coerce enforce-user-story
          (fn [request]
            (:script (st/story-match-by request)))))

;; TODO: GET, POST and others actually can take a 
;; function directly instead of an expresssion.
;; Thus, rewrite to obliterate redundancies.

(def the-routes
  (routes
    (POST url/story-create-path request
         (submit-story request))
    (GET url/story-create-path request
         (page/story-create request))

    (POST url/story-edit-path request
         (resubmit-story request))
    (GET url/story-edit-path request
         (coerce enforce-user-owned-story page/story-edit))

    (POST url/story-delete-path request
         (delete-story request))
    (GET url/story-delete-path request
         (coerce enforce-user-owned-story page/story-delete))

    (GET url/user-index-path request
         (user-index request))

    (GET url/story-index-path request
         (page/story-index request))

    (GET url/story-data-path request
         (story-data request))  

    (GET url/story-path request
         (coerce enforce-user-story page/story))
    (GET url/chapter-path request
         (coerce enforce-user-story page/story))
    (GET url/scene-path request
         (coerce enforce-user-story page/story))
    ))



