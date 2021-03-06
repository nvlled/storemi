(ns storemi.views.page
  (:require
    [ring.util.response :as ring]
    [ring.util.codec :refer [form-encode]]
    [storemi.session :as session]
    [storemi.models.story :as st]
    [storemi.models.db :as db]
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

(defn create-paths [req story]
  (let [id (:id story)
        author (:username story)]
    {"story"    (url/story author id)
     "chapter"  (url/chapter author id)
     "scene"    (url/scene author id)
     "edit-story"
     (when (= (session/username req) author)
       (url/story-edit author id))}))

(defn create-path-fields [paths]
  (cmpt/json-field paths :id "paths"))

(defn render-story-component [story paths]
  (js/render-story-component (:data story) paths))

(defn insert-data [story new-data]
  (update-in story
             [:data]
             (fn [old-data] (merge old-data new-data))))

(defn story-component [{params :params :as request}
                       story
                       & {:keys [id class]}]
  (let [ids (select-keys params [:chapter-id :scene-id])
        story (insert-data
                (st/story-match request) ids)
        paths (create-paths request story)]
    [:div
     (cmpt/json-field ids :id "story-ids")
     (create-path-fields paths)

     [:div {:id id :class class}
      (js/render-story-component (:data story) paths)]]))

(defn story [{params :params :as request}]
  (let [story-data (st/story-match request)]
    (layout/common
      request
      :body
      [:div
       [:textarea {:id "story-script"}
        (db/json-string (:data story-data))]
       (story-component
         request
         story-data
         :id "contents")]
      :scripts ["/js/react.js"
                "/js/react/story-ui.react.js"
                "/js/view-story.js"])))

(defn story-edit [{errors :errors :as request}]
  (let [script (get-in request [:params :script])
        story (st/story-match-by request)]
    (layout/common
      request
      :body
      [:div.editor
       (when errors
         [:p.error "Save failed: " (:error errors)])
       (cmpt/story-editor story script)
       (story-component request story :id "view")]
      :scripts ["/js/react.js"
                "/js/parser.js"
                "/js/react/story-ui.react.js"
                "/js/react/editor.react.js"
                "/js/editor.js"]
      :styles ["/css/editor.css"])))

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

(defn story-table [stories]
  [:table.stories
   [:thead
    [:tr
     [:td.author "author"]
     [:td.title "title"]
     [:td.synopsis "synopsis"] ]
    ]
   [:tbody
    (for [story stories]
      [:tr
       [:td (cmpt/user-link (:username story))]
       [:td (cmpt/story-link story)]
       [:td (:synopsis story)] ])]])

(defn browse [request & [search-result]]
  (let [{:keys [by query]} (:params request)
        {:keys [total stories page-data]} search-result
        stories (or stories (st/recent-stories))]
    (layout/common
      request
      :styles ["/css/browse.css"]
      :body
      [:div
       [:h1 "Browse crappy stories"]
       [:form {:class "search-form"}
        [:p "Search: "
         (cmpt/hidden-field "0" :name "page")
         [:input {:name "query" :value query}]
         [:input {:type :submit :value "search"}]
         [:label
          [:input {:type :radio :name "by" :value "any"
                   :checked :false}]
          "any"]
         [:label
          [:input {:type :radio :name "by" :value "title"
                   :checked (= by "title")}]
          "title"]
         [:label
          [:input {:type :radio :name "by" :value "synopsis"
                   :checked (= by "synopsis")}]
          "synopsis"]
         [:label
          [:input {:type :radio :name "by" :value "username"
                   :checked (= by "username")}]
          "username"]]]
       [:hr]
       (if-not (empty? stories)
         (story-table stories)
         [:em "(no match found)"])
       (when page-data
         (let [page-count (/ total (:size page-data))
               page-num (:pagenum page-data)
               qparams (:query-params request)]
           (when (> page-count 1)
             (for [p (range page-count)]
               [:span
                [:a.page {:class (when (= page-num p) "active")
                     :href
                     (str (:uri request)
                          "?"
                          (form-encode
                            (assoc qparams "page" p)))}
                 (str "[" p "]")]]

               )))) ])))

