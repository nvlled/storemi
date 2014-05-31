(ns storemi.views.component
  (:require 
    [hiccup.page :refer [html5 include-css]]
    [storemi.settings :as settings]
    [storemi.urlfor :as urlfor]))

(defn hidden-field [name val]
  (let [props {:type "hidden" :name name :value (or val "")}]
    [:input props]))

(defn story-list
  [stories & [hide-author]]
  [:ul
   (for [{:keys [id title synopsis username]} stories]
     [:li 
      [:a {:href (urlfor/story username id)} title]
      (when-not hide-author 
        [:span " — " synopsis " "]    
        [:i [:a {:href (urlfor/user-index username)}
             " [ by " username " ]"]])])]) 

(defn story-control-list
  ([stories & args]
   [:ul
    (for [{:keys [id title username]} stories]
      [:li 
       [:a {:href (urlfor/story username id)} 
        title]
       " "
       [:a {:href (urlfor/story-edit username id)} "[edit]"]
       " "
       [:a {:href (urlfor/story-delete username id)} "[delete]"]])]))

(defn input-field 
  ([name & {:keys [label errors type value]}]
   (let [fk (keyword name)
         label (or label name)]
     [:p (str label ": ") 
      [:input {:name name :value value :type type}]
      [:span.error (fk errors)]])))

(defn text-field [request name & {:keys [label errors]}]
  (input-field name
               :value (get-in request [:params (keyword name)])
               :label label
               :errors errors))

(defn password-field [request name & {:keys [label errors]}]
  (input-field name 
               :label label
               :type "password"
               :errors errors))

(defn post [data]
  [:div.post
   [:div.header
    [:span.username (:username data)]
    [:span " | "]
    [:span.title (:title data)]
    [:span " | "]
    [:span.date (::date data)] ]
   [:div.body
    (:body data)]])

(defn notification [msg]
  (when msg
    [:div.notification [:h4 "(!!)" msg]]))

(defn main-nav [& [username]]
  [:span.nav
   (if-not (empty? username)
     (list 
       [:a {:href (urlfor/logout)} "logout"]
       [:a {:href (urlfor/user-index username)} "your stories"] )
     (list
       [:a {:href (urlfor/login)} "login"]
       [:a {:href (urlfor/register)} "register"]))
   [:a {:href (urlfor/about)} "about"]])

(defn story-creator [{errors :errors :as req}]
  [:form.story-creator
   {:method "POST" :action (urlfor/story-create)}
   [:h4 "Write New Story"]
   [:p "Title " 
    [:input {:name "title" :value (get-in req [:params :title])}]
    [:span.error (:title errors)]]
   [:p "Synopsis "]
   [:p.error (:synopsis errors)]
   [:textarea {:name "synopsis" :rows 3 :cols 70}
    (get-in req [:params :synopsis])]
   [:br]
   [:input {:type :submit :value "Create"}]])

;;(defn added-images [& [images]]
;;  (let [render 
;;        (fn [image]
;;          (list
;;            [:td [:img.thumbnail {:src (:path image)}]]
;;            [:td [:a.path {:href (:path image)}] (:path image)] 
;;            [:td [:a.remove {:href "x"}] "[remove]"]))]
;;    [:div.added-images
;;     [:h3 "Images"]
;;     [:table
;;      (map #(do [:tr (render %)]) images)
;;      [:tr.template (render {})]]]))
;;
;;(defn image-uploader []
;;  [:div.image-uploader
;;   [:p [:input {:type :file}]]
;;   [:p [:label "Image label: " [:input {:size 5}]]
;;    [:input {:type :button :value  "Upload and add"}]
;;    [:input {:type :button :value "Add locally"}]]])
;;
;;(defn image-browser [& [images]]
;;  (let [render
;;        (fn [image]
;;          (list
;;            [:td [:img {:src (:path image)}]]
;;            [:td [:a {:href (:path image)} (:path image)]]
;;            [:td [:input {:type :radio :name "image-browser"}]]))]
;;    [:div.image-browser
;;     [:table
;;      (map #(do [:tr (render %)]) images)
;;      [:tr.template (render {})]]
;;     [:p 
;;      [:label "Image label: " [:input {:size 5}]]
;;      [:input {:type :button :value "Add"}]]])) 
;;
;;(defn url-browser []
;;  [:div.url-browser
;;   [:p "Enter url: " [:input]]
;;   [:p [:label "Image label: " [:input {:size 5}]]]
;;   [:input {:type :button :value "Add"}]])

(defn editing-options []
  [:div.editing-options
   [:h4 "Editing options"]
   [:p [:input {:name "readingMode" :type :checkbox} 
        "Reading mode"]]
   [:div.settings
    [:p [:input {:name "hideSynopsis" :type :checkbox} 
         "Hide synopsis"]]
    [:p [:input {:name "hideChapterIndex" :type :checkbox} 
         "Hide chapter index "]]
    [:p [:input {:name "hideSceneIndex" :type :checkbox} 
         "Hide scene index "]]]])

(defn edit-button-panel [story]
  (if (:published story)
    (list
      [:input {:name "draft" :type :submit :value "Save as draft"}]
      [:input {:name "save" :type :submit :value "Save"}]
      [:input {:name "view" :type :submit :value "View"}])
    (list
      [:input {:name "draft" :type :submit :value "Save as draft"}]
      [:input {:name "published" :type :submit :value "Publish"}])))

;(defn story-images [story]
;  (let [radio 
;        (fn [label]
;          [:label 
;           [:input {:type :radio :name "image-option"}]
;           label])]
;    [:div#images
;     ;(added-images)
;     [:h3 "Add images"]
;     [:div.radios
;      (radio "Local file")
;      (radio "Your images")
;      (radio "URL")]
;     [:div.bodies
;      (image-uploader)
;      (image-browser [{:path "ajsdifj"} {:path "j1i23jo1ij"}])
;      (url-browser)]]))

(defn story-editor [story]
  [:div.editor
   [:div {:id "create"}
    [:input {:id "disable-upload" :value 
             :type :hidden
             (when settings/disable-upload "1")}]
    [:p "script"]
    [:form {:action (urlfor/story-edit (:username story) (:id story))
            :method "POST"}
     [:textarea {:name "script"} (:script story)]
     (edit-button-panel story)
     [:div#images]
     ;(story-images story)
     (editing-options)]]
   [:div {:id "view"}]])


