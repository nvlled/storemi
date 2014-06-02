(ns storemi.views.page
  (:require
    [ring.util.response :as ring]
    [storemi.session :as session]  
    [storemi.models.story :as st]
    [storemi.views.component :as cmpt]
    [storemi.views.layout :as layout]
    [storemi.urlfor :as url]
    [storemi.lib.tourl :refer [retour detour-param-key]]
    [storemi.js :as js]
    ))

(defn error [request & [status]]
  (let [body (layout/common
               request
               :title "Uh-oh"
               :body [:h2 "Error: "
                      (or (get-in request [:errors :msg])
                          "You borke the internets.")])] 
    {:body body
     :status (or status 404)}))

(defn admin [request]
  (layout/common
    request
    :title "Admin page"
    :body [:h2 "Acsess granded :DDDDDD"]))

(defn about [request]
  (layout/common 
    request
    :title "About"
    :body
    [:div
     [:h2 "What is it?"]
     [:p 
      "It is a platform for narrating stories in a sort of different way. "
      "The readers inspect objects in a scene, and each objects leads to yet other scenes. "
      "The sub-scene may just provide description of an object, or it may entirely "
      "diverge the flow of the story. This makes the stories non-linear."]
     [:p
      "There are other forms of interaction, such as asking for user-input. "
      "Due to complexity of inflections, the user-inputs will mostly be used "
      "for asking names of things or people The value entered will be used throughout the "
      "the story, distinct only for each particular reader."]]))

(defn home [req]
  (layout/common 
    req
    :body 
    [:div
     (when (session/logged-in? req)
       (cmpt/story-creator req))
     [:h2 "Recent stories" ]
     (-> (st/recent-stories) cmpt/story-list)]))

;(defn login [& [error]]
;  (layout/common
;    [:form {:method "POST"}
;
;     (when error [:em.error (str "Error: " error)])
;     [:p [:span "username: "][:input {:name "username"}]]
;     [:p [:span "password: "][:input {:type :password :name "password"}]]
;     [:input {:type :submit :value "login"}]]))

(defn login [{errors :errors :as req}]
  (layout/common 
    req
    :title "Login"
    :body
    [:form.login {:method :post}
     [:p.error (:error errors)]
     (cmpt/text-field req "username" :errors errors)
     (cmpt/password-field req "password" :errors errors)
     [:input {:type "submit" :value "login"}]
     " "
     [:a {:href (detour-param-key req "/register")} "[register]"]]))

(defn register [{errors :errors :as req}]
  (layout/common 
    req
    :title "Register"
    :body
    [:form.register {:method :post}
     [:p.error (:error errors)]
     (cmpt/text-field req "username" :errors errors)
     (cmpt/password-field req "password" :errors errors)
     (cmpt/password-field 
       req "password2" 
       :label "re-enter password" 
       :errors errors)
     [:input {:type "submit" :value "register"}]
     [:a {:href (detour-param-key req "/login")} "[login]"]]))

(defn story-index [req]
  (layout/common
    req
    :title "Browse stories"
    :body
    [:div
     [:h2 "Browse stories"]
     [:form {:method "GET"}
      [:input {:name "query"}]
      [:input {:type :submit :value "Search"}]]
     (cmpt/story-list
       (st/recent-stories))]))

(defn story-create [req]
  (layout/common
    req
    :title "Create new story"
    :body
    [:div
     (cmpt/story-creator req)]))

(defn user-index [req]
  (let [param-user (get-in req [:params :username])
        session-user (session/username req)
        owned (= param-user session-user)
        stories (st/user-stories param-user)]
    (layout/common
      req
      :title param-user
      :body
      [:div
       (if owned
         (list
           (cmpt/story-creator req)
           (if-not (empty? stories)
             (list
               [:h2 "Your stories"]
               (cmpt/story-control-list stories))
             [:h2 "You have no stories (yet)"]))
         (list
           [:h2 param-user]
           (cmpt/story-list (st/user-stories param-user) true)))])))

(defn create-paths [story]
  (let [id (:id story)
        username (:username story)]
    {"story" (url/story username id)
     "chapter" (url/chapter username id)
     "scene" (url/scene username id)}))

(defn create-path-fields [story]
  (let [paths (create-paths story)]
    (list
      (cmpt/hidden-field 
        (paths "story")
        :id "story-path")
      (cmpt/hidden-field 
        (paths "chapter")
        :id "chapter-path")
      (cmpt/hidden-field  
        (paths "scene")
        :id "scene-path"))))

(defn render-story-component [story]
  (js/render-story-component (:data story) 
                             (create-paths story)))

(defn story [{params :params :as request}]
  (let [story (st/story-match request)
        username (session/username request)
        owned (= username (:username story))]
    (layout/common
      request
      :body
      [:div
       (create-path-fields story)
       (cmpt/hidden-field
         (when owned (url/story-edit username (:id story)))
         :id "edit-url")
       (cmpt/hidden-field
         (url/story-data (:username story) (:id story))
         :id "data-path")
       [:textarea {:id "story-script"} (:script story)]
       [:div#contents (render-story-component story)]]
      :scripts ["/js/react.min.js"
                "/js/parser.js"
                "/js/react/story-ui.react.js"
                "/js/view-story.js"])))

(defn story-delete [request]
  (let [story (st/story-match-by request)]
    (layout/common
      request
      :body
      [:div
       [:h2 (:title story)]
       [:p (:synopsis story)]
       [:hr]
       [:form {:method "POST"}
        [:span "Delete story with id " (:id story) "? "]
        [:input {:type :submit :value "Yes"}]
        " "
        [:a {:href (url/user-index (session/username request)
                                   (:id story))}
         "[cancel]"]]])))

(defn story-edit [{errors :errors :as request}]
  (let [story (st/story-match-by request)
        id (:id story)
        username (:username story)]
    (layout/common
      request
      :body
      [:div
       (create-path-fields story)
       (cmpt/hidden-field 
         (session/username request)
         :id "my-username")
       (cmpt/hidden-field (session/username request)
         :id "my-username")
       [:div.editor
        (cmpt/story-editor story)
        [:div {:id "view"} (render-story-component story)]]]
      :scripts ["/js/react.min.js"
                "/js/parser.js"
                "/js/react/story-ui.react.js"
                "/js/react/editor.react.js"
                "/js/editor.js"]
      :styles ["/css/editor.css"])))







