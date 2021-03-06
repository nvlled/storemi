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
    [storemi.js :as js]
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

(defn script-is-valid [{params :params}]
  (let [script (:script params)
        data (:data params)
        {:keys [storyTitle synopsis]} data]
    (cond
      (> (count storyTitle) st/title-maxlen)
      {:error "Title is freakin' too long"}
      (> (count synopsis) st/synopsis-maxlen)
      {:error "I don't think you know what a synopsis is"})))

(def story-ownership-rules
  (one-by-one
    user-is-logged-in
    user-owns-story))

(def story-edition-rules
  (one-by-one
    story-ownership-rules
    script-is-valid))

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
  (let [{:keys [data script]} params
        id (:story-id params)
        path (if (:saview params)
               (url/story (sess/username req) id)
               (:uri req))]
    (println "-> " data)
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
    story-edition-rules
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

(defn wrap-parse-script [handler]
  (fn [request]
    (let [script (get-in request [:params :script])
          script (clojure.string/replace script "\r" "")
          data (js/parse-script script)
          request (-> request
                      (assoc-in [:params :script] script)
                      (assoc-in [:params :data] data))]
      (handler request))))

(def the-routes
  (routes
    (POST url/story-create-path -> submit-story)

    (GET url/story-create-path -> page/story-create)

    (POST url/story-edit-path
          -> (wrap-parse-script resubmit-story))

    (GET url/story-edit-path
         -> (coerce enforce-user-owned-story page/story-edit))

    (POST url/story-delete-path -> delete-story)

    (GET url/story-delete-path ->
         (coerce enforce-user-owned-story page/story-delete))

    (GET url/user-index-path -> user-index)

    (GET url/story-index-path -> page/story-index)

    (GET url/story-data-path -> story-data)

    (GET url/story-path
         -> (coerce enforce-user-story page/story))

    (GET url/chapter-path
         -> (coerce enforce-user-story page/story))

    (GET url/scene-path
         -> (coerce enforce-user-story page/story))))





